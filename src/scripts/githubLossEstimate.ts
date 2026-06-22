import { query } from "../db/clickhouse";

/**
 * 全局时间范围参数：整个计算过程的起止月份
 * 仅需修改此处，时间轴生成、基准段/缺失段划分、误差约束等均会自适应
 */
const START_YEAR = 2015;   // 时间轴起始年
const START_MONTH = 1;     // 时间轴起始月
const END_YEAR = 2026;     // 时间轴结束年
const END_MONTH = 5;       // 时间轴结束月

/** 系统性数据缺失阶段起始月份（含），此月份及之后视为缺失段 */
const LOSS_START_YEAR = 2025;
const LOSS_START_MONTH = 5;

/** 故障月列表 */
const faultList: string[] = ['2021-10', '2025-05', '2025-10', '2026-02'];

/**
 * 年月转字符串key YYYY-MM
 * @param y 年
 * @param m 月
 */
function getMonthKey(y: number, m: number): string {
  return `${y}-${String(m).padStart(2, '0')}`;
}

/** 月份序号，用于跨年月份的大小比较 */
function monthIndex(y: number, m: number): number {
  return y * 12 + m;
}

/** 取上一个月 */
function prevMonth(y: number, m: number): { year: number; month: number } {
  return m === 1 ? { year: y - 1, month: 12 } : { year: y, month: m - 1 };
}

/** 缺失段起始月份序号 */
const LOSS_START_INDEX = monthIndex(LOSS_START_YEAR, LOSS_START_MONTH);

/**
 * 完整时间轴单项结构
 */
interface TimeAxisItem {
  year: number;
  month: number;
  key: string;
}

/**
 * 生成 START_YEAR-START_MONTH ~ END_YEAR-END_MONTH 完整时间轴
 */
function generateFullTimeAxis(): TimeAxisItem[] {
  const axis: TimeAxisItem[] = [];
  for (let y = START_YEAR; y <= END_YEAR; y++) {
    const startM = y === START_YEAR ? START_MONTH : 1;
    const endM = y === END_YEAR ? END_MONTH : 12;
    for (let m = startM; m <= endM; m++) {
      axis.push({ year: y, month: m, key: getMonthKey(y, m) });
    }
  }
  return axis;
}

/**
 * 原始月度数据条目
 */
export interface MonthRawData {
  year: number;
  month: number;
  value: number;
}

/**
 * 全时序输出单条记录（原始+校正+标记）
 */
export interface FullTimeSeriesRow {
  year: number;
  month: number;
  monthKey: string;
  isFaultMonth: boolean;
  isSystemLossStage: boolean;
  rawValue: number | null;
  correctedValue: number | null;
  dataSourceDesc: string;
}

/**
 * 函数最终返回结果结构
 */
export interface LossRateEstimateResult {
  bestLossRate: number;
  minError: number;
  secondMinError: number;
  errorRatio: number;

  historyMonthYoYAvg: Record<number, number | null>;
  baseDataValidCount: number;
  lossStageRawCount: number;
  faultMonthInterpolateDict: Record<string, number>;

  fullTimeSeries: FullTimeSeriesRow[];
}

/**
 * 异常故障月插值修复
 * @param monthValMap 正常月份原始数值映射 key->value
 * @param monthYoYAvg 各月历史平均同比增速
 * @param fullAxis 完整时间轴
 * @param faultSet 故障月份集合
 * @returns key:插值预估数值
 */
function interpolateFaultMonth(
  monthValMap: Record<string, number>,
  monthYoYAvg: Record<number, number | null>,
  fullAxis: TimeAxisItem[],
  faultSet: Set<string>
): Record<string, number> {
  const interpolateMap: Record<string, number> = {};
  const validSeries = fullAxis.filter(item => !faultSet.has(item.key) && monthValMap[item.key] > 0);

  const validValueDict: Record<string, number> = {};
  validSeries.forEach(s => {
    validValueDict[s.key] = monthValMap[s.key];
  });

  for (const point of fullAxis) {
    const { key, year, month } = point;
    if (!faultSet.has(key)) continue;

    // 1. 同比季节基准值（核心权重0.6）
    let yoyBase: number | null = null;
    const lastYearKey = getMonthKey(year - 1, month);
    const lastYearVal = validValueDict[lastYearKey];
    const avgYoY = monthYoYAvg[month];
    if (lastYearVal && avgYoY != null) {
      yoyBase = lastYearVal * avgYoY;
    }

    // 2. 前后临近有效月份环比插值（权重0.4）
    // 注意：故障月不在 validSeries 中，须用月份序号定位前后临近有效月，
    // 不能依赖其在有效列表中的下标（否则 indexOf 返回 -1 会错取最早月）
    let frontVal: number | null = null, backVal: number | null = null;
    const faultIdx = monthIndex(year, month);
    // 向前找时间上最接近且早于故障月的有效月（validSeries 有序，取最后一个）
    for (const s of validSeries) {
      if (monthIndex(s.year, s.month) < faultIdx) {
        frontVal = validValueDict[s.key];
      } else {
        break;
      }
    }
    // 向后找时间上最接近且晚于故障月的有效月（第一个）
    for (const s of validSeries) {
      if (monthIndex(s.year, s.month) > faultIdx) {
        backVal = validValueDict[s.key];
        break;
      }
    }

    let linkBase: number | null = null;
    if (frontVal !== null && backVal !== null) {
      linkBase = (frontVal + backVal) / 2;
    } else if (frontVal !== null) {
      linkBase = frontVal;
    } else if (backVal !== null) {
      linkBase = backVal;
    }

    // 加权融合两个基准生成插值值
    let interpVal: number;
    if (yoyBase !== null && linkBase !== null) {
      interpVal = yoyBase * 0.6 + linkBase * 0.4;
    } else if (yoyBase !== null) {
      interpVal = yoyBase;
    } else if (linkBase !== null) {
      interpVal = linkBase;
    } else {
      // 极端无历史兜底：全局均值
      const allVals = Object.values(validValueDict);
      const sum = allVals.reduce((s, v) => s + v, 0);
      interpVal = sum / allVals.length;
    }

    interpolateMap[key] = Number(interpVal.toFixed(2));
  }

  return interpolateMap;
}

/**
 * 估算 LOSS_START 月起系统性数据缺失比例 + 全时序校正+故障插值
 * @param monthData 原始月度数据 [{year, month, value}]
 * @param faultMonths 故障月份字符串数组 ['2018-03']
 * @returns 完整结果集 LossRateEstimateResult
 */
export function estimateSystemLossRate(
  monthData: MonthRawData[],
  faultMonths: string[]
): LossRateEstimateResult {
  // 1. 基础容器初始化
  const faultSet = new Set<string>(faultMonths);
  const fullTimeAxis = generateFullTimeAxis();
  const rawValueMap: Record<string, number> = {};
  monthData.forEach(d => {
    const k = getMonthKey(d.year, d.month);
    rawValueMap[k] = d.value;
  });

  // 拆分基准段 & 缺失原始段（过滤故障月用于同比建模）
  const baseRaw: MonthRawData[] = [];
  const lossRaw: MonthRawData[] = [];
  const cleanValMap: Record<string, number> = {};

  for (const d of monthData) {
    const key = getMonthKey(d.year, d.month);
    if (faultSet.has(key)) continue;
    cleanValMap[key] = d.value;
    if (monthIndex(d.year, d.month) < LOSS_START_INDEX) {
      baseRaw.push(d);
    } else {
      lossRaw.push(d);
    }
  }

  // 2. 计算基准段每月历史平均同比增速
  const monthYoY: Record<number, number[]> = {
    1: [], 2: [], 3: [], 4: [], 5: [], 6: [],
    7: [], 8: [], 9: [], 10: [], 11: [], 12: [],
  };

  for (const d of baseRaw) {
    const lastYearKey = getMonthKey(d.year - 1, d.month);
    const lastVal = cleanValMap[lastYearKey];
    if (lastVal && lastVal > 0) {
      monthYoY[d.month].push(d.value / lastVal);
    }
  }

  const monthYoYAvg: Record<number, number | null> = {};
  for (let m = 1; m <= 12; m++) {
    const arr = monthYoY[m];
    monthYoYAvg[m] = arr.length
      ? arr.reduce((s, v) => s + v, 0) / arr.length
      : null;
  }

  // 4. 误差函数：给定缺失率r，返回总拟合误差
  const calcTotalError = (r: number): number => {
    if (r < 0 || r >= 1) return Infinity;
    const scale = 1 / (1 - r);
    let totalErr = 0;

    // 约束1：缺失段校正后同比偏离历史均值平方和
    for (const item of lossRaw) {
      const { year, month, value } = item;
      const calibrateVal = value * scale;
      const lastYearKey = getMonthKey(year - 1, month);
      const lastBaseVal = cleanValMap[lastYearKey];
      const avgYoY = monthYoYAvg[month];
      if (!lastBaseVal || avgYoY == null) continue;
      const realYoY = calibrateVal / lastBaseVal;
      totalErr += Math.pow(realYoY - avgYoY, 2);
    }

    // 约束2：缺失段起始月与其上一月的跨分段环比平滑加权约束
    const prevOfLoss = prevMonth(LOSS_START_YEAR, LOSS_START_MONTH);
    const baseEndKey = getMonthKey(prevOfLoss.year, prevOfLoss.month);
    const baseEndVal = cleanValMap[baseEndKey];
    const lossStartRec = lossRaw.find(
      d => d.year === LOSS_START_YEAR && d.month === LOSS_START_MONTH
    );

    if (baseEndVal && lossStartRec) {
      const lossStartCalVal = lossStartRec.value * scale;
      const realLinkRate = lossStartCalVal / baseEndVal;
      const linkRates: number[] = [];

      // 遍历历史各年，计算「上一月 → 缺失段起始月」的环比，作为季节基准
      for (let y = START_YEAR; y < LOSS_START_YEAR; y++) {
        const p = prevMonth(y, LOSS_START_MONTH);
        const prevK = getMonthKey(p.year, p.month);
        const curK = getMonthKey(y, LOSS_START_MONTH);
        const prevV = cleanValMap[prevK];
        const curV = cleanValMap[curK];
        if (prevV && curV && prevV > 0) {
          linkRates.push(curV / prevV);
        }
      }

      if (linkRates.length > 0) {
        const avgLink = linkRates.reduce((s, v) => s + v, 0) / linkRates.length;
        totalErr += Math.pow(realLinkRate - avgLink, 2) * 2;
      }
    }

    return totalErr;
  };

  // 5. 网格寻优求最优缺失率
  let bestR = 0;
  let minErr = Infinity;
  // 粗搜 0 ~ 0.9 步长0.01
  for (let r = 0; r <= 0.9; r += 0.01) {
    const err = calcTotalError(r);
    if (err < minErr) {
      minErr = err;
      bestR = r;
    }
  }
  // 精细局部寻优 ±0.01 步长0.001
  const fineStart = Math.max(0, bestR - 0.01);
  const fineEnd = Math.min(0.9, bestR + 0.01);
  for (let r = fineStart; r <= fineEnd; r += 0.001) {
    const err = calcTotalError(r);
    if (err < minErr) {
      minErr = err;
      bestR = r;
    }
  }

  // 6. 计算次小误差用于置信度判断
  let secondMinErr = Infinity;
  for (let r = 0; r <= 0.9; r += 0.01) {
    const err = calcTotalError(r);
    if (err > minErr && err < secondMinErr) {
      secondMinErr = err;
    }
  }
  const errorRatio = secondMinErr === Infinity ? 9999 : secondMinErr / minErr;

  // 7. 统一插值输入口径：先用已求得的最优缺失率，将缺失段正常月原始值换算为真实值，
  //    再做故障月插值。避免缺失段故障月的环比基准混入被系统缺失打折的上报值导致结果偏低，
  //    使其插值口径与缺失段其他真实值对齐。
  const lossScale = 1 / (1 - bestR);
  const calibratedValMap: Record<string, number> = { ...rawValueMap };
  for (const point of fullTimeAxis) {
    const { year, month, key } = point;
    if (faultSet.has(key)) continue;
    if (monthIndex(year, month) >= LOSS_START_INDEX && rawValueMap[key] > 0) {
      calibratedValMap[key] = rawValueMap[key] * lossScale;
    }
  }
  const faultInterpMap = interpolateFaultMonth(calibratedValMap, monthYoYAvg, fullTimeAxis, faultSet);

  // 8. 生成完整时序数据集（核心输出）
  const fullTimeSeries: FullTimeSeriesRow[] = fullTimeAxis.map(point => {
    const { year, month, key } = point;
    const isFault = faultSet.has(key);
    const isLossStage = monthIndex(year, month) >= LOSS_START_INDEX;
    let rawValue: number | null = rawValueMap[key] ?? null;
    let correctedValue: number | null = null;
    let sourceDesc = "";

    // 分支1：故障月，保留原始上报值，correctedValue 用插值填充真实值
    if (isFault) {
      const interpVal = faultInterpMap[key];
      correctedValue = interpVal;
      sourceDesc = isLossStage
        ? "故障月+缺失段：同比+环比插值预估真实值"
        : "故障月+基准段：同比+环比插值修复";
    } else {
      // 分支2：正常月份
      if (rawValue === null) {
        sourceDesc = "无原始上报数据";
      } else if (isLossStage) {
        // 正常、缺失段：原始值反向换算真实值
        correctedValue = rawValue / (1 - bestR);
        sourceDesc = "正常月+缺失段：消除系统缺失校正";
      } else {
        // 正常、基准段：原始值=真实值
        correctedValue = rawValue;
        sourceDesc = "正常月+基准段：原始数据可信";
      }
    }

    return {
      year,
      month,
      monthKey: key,
      isFaultMonth: isFault,
      isSystemLossStage: isLossStage,
      rawValue,
      correctedValue: correctedValue !== null ? Number(correctedValue.toFixed(2)) : null,
      dataSourceDesc: sourceDesc,
    };
  });

  // 9. 封装所有结果返回
  return {
    bestLossRate: Number(bestR.toFixed(4)),
    minError: Number(minErr.toFixed(6)),
    secondMinError: Number(secondMinErr.toFixed(6)),
    errorRatio: Number(errorRatio.toFixed(2)),

    historyMonthYoYAvg: monthYoYAvg,
    baseDataValidCount: baseRaw.length,
    lossStageRawCount: lossRaw.length,
    faultMonthInterpolateDict: faultInterpMap,

    fullTimeSeries,
  };
}

async function getData(sql: string): Promise<string> {
  const res = await query<string[]>(sql);
  return res[0][0];
}

console.log(JSON.stringify(generateFullTimeAxis().map(t => t.key)));

async function eventData(desc: string, aggClause: string, whereClause: string) {
  const data = await getData(`
SELECT toJSONString(groupArray(map('year', y, 'month', m, 'value', c))) AS monthData
FROM (
    SELECT
        toYear(created_at) AS y,
        toMonth(created_at) AS m,
        ${aggClause} AS c
    FROM events
    WHERE platform = 'GitHub'
      AND ${whereClause}
      AND toYYYYMM(created_at) >= 201501
      AND toYYYYMM(created_at) <= 202605
      AND from_api=0
    GROUP BY y, m
    ORDER BY y, m
)`);
  const d = JSON.parse(data);
  const res: LossRateEstimateResult = estimateSystemLossRate(d.map((item: any) => ({
    year: +item.year,
    month: +item.month,
    value: +item.value,
  })), faultList);

  console.log(desc);
  console.log("最优缺失比例：", res.bestLossRate);
  console.log("最小误差值：", res.minError);
  console.log("修复后数据：", JSON.stringify(res.fullTimeSeries.map(t => t.correctedValue)));
  console.log("原始数据", JSON.stringify(res.fullTimeSeries.map(t => t.rawValue)));
};

(async () => {
  // await eventData('Push 事件总量', 'COUNT()', "type='PushEvent'");
  // await eventData('Issue 事件总量', 'COUNT()', "type='IssuesEvent'");
  // await eventData('Issue 总量', 'COUNT(DISTINCT issue_id)', "type='IssuesEvent'");
  // await eventData('PR 事件总量', 'COUNT()', "type='PullRequestEvent'");
  // await eventData('PR 总量', 'COUNT(DISTINCT issue_id)', "type='PullRequestEvent'");
  await eventData('Issue 评论总量', 'COUNT()', "type='IssueCommentEvent'");
  // await eventData('开发者数量', 'COUNT(DISTINCT actor_id)', "1=1");
  // await eventData('仓库数量', 'COUNT(DISTINCT repo_id)', "1=1");
  // await eventData('日志总量', 'COUNT()', "1=1");
})();
