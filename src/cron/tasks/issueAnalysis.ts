import { request as httpsRequest } from 'https';
import { URL } from 'url';
import { Task } from '..';
import getConfig from '../../config';
import { insertRecords, query } from '../../db/clickhouse';
import { getLogger, waitFor } from '../../utils';

const RESULT_TABLE = 'issue_info';
const LEGACY_RESULT_TABLE = 'issue_info_legacy';
const FAILURE_TABLE = 'issue_analysis_failures';
const TASK_CONFIG_KEY = 'issueAnalysis';
const NEXT_RUN_SAFETY_MS = 5 * 60 * 1000;

type SourceScope = 'label' | 'export_repo';

interface IssueAnalysisConfig {
  apiKey: string;
  endpoint: string;
  model: string;
  concurrency: number;
  requestsPerSecond: number;
  candidateBatchSize: number;
  maxRunSeconds: number;
  requestTimeoutMs: number;
  requestAttempts: number;
  retryBaseDelayMs: number;
  insertBatchSize: number;
  maxIssueFailures: number;
  maxBodyChars: number;
  maxReadmeChars: number;
  maxDescriptionChars: number;
  maxTopics: number;
  hostileThreshold: number;
}

interface InputIssue {
  id: number;
  platform: string;
  repoId: number;
  repoName: string;
  number: number;
  title: string;
  body: string;
  labels: string[];
  repoDescription: string;
  repoReadme: string;
  repoTopics: string[];
  sourceScope: SourceScope;
}

interface DecisionAnswer {
  type?: string;
  choice?: string;
  noul?: number;
  score?: number;
  probabilities?: Record<string, number>;
  confidence?: number;
  legend?: Record<string, string>;
}

interface DecisionResponse {
  model?: string;
  request_id?: string;
  answers?: Record<string, DecisionAnswer>;
  usage?: { input_tokens?: number };
  latency_ms?: number;
}

interface OutputIssue {
  id: number;
  platform: string;
  repoId: number;
  issueNumber: number;
  informationQuality: string;
  informationQualityScore: number;
  informationQualityConfidence: number;
  informationQualityProbabilities: string;
  isAutomaticallyGenerated: string;
  automaticallyGeneratedConfidence: number;
  automaticallyGeneratedProbabilities: string;
  hostileOrAbusive: string;
  hostileOrAbusiveProbability: number;
  issueIntent: string;
  issueIntentConfidence: number;
  issueIntentProbabilities: string;
  severity: string;
  severityConfidence: number;
  severityProbabilities: string;
  triageReadiness: string;
  triageReadinessConfidence: number;
  triageReadinessProbabilities: string;
  reproducibility: string;
  reproducibilityConfidence: number;
  reproducibilityProbabilities: string;
  repositoryRelevance: string;
  repositoryRelevanceConfidence: number;
  repositoryRelevanceProbabilities: string;
  repositoryContextAvailable: number;
  primaryArea: string;
  primaryAreaConfidence: number;
  primaryAreaProbabilities: string;
  isSecurityOrPrivacyRelated: number;
  securityOrPrivacyProbability: number;
  isPerformanceOrScalabilityRelated: number;
  performanceOrScalabilityProbability: number;
  isReliabilityOrDataIntegrityRelated: number;
  reliabilityOrDataIntegrityProbability: number;
  isCompatibilityOrPortabilityRelated: number;
  compatibilityOrPortabilityProbability: number;
  isUsabilityOrAccessibilityRelated: number;
  usabilityOrAccessibilityProbability: number;
  model: string;
  requestId: string;
  inputTokens: number;
  latencyMs: number;
  sourceScope: SourceScope;
}

interface AnalysisFailure {
  id: number;
  platform: string;
  sourceScope: SourceScope;
  error: string;
}

class DeadlineReachedError extends Error { }

class HttpError extends Error {
  constructor(readonly statusCode: number, message: string) {
    super(message);
  }
}

class FatalTaskError extends Error { }

const positiveNumber = (value: any, fallback: number, maximum?: number): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return maximum === undefined ? parsed : Math.min(parsed, maximum);
};

const positiveInteger = (value: any, fallback: number, maximum?: number): number =>
  Math.floor(positiveNumber(value, fallback, maximum));

const probability = (value: any): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.min(1, parsed));
};

const clickhouseDateTime = (): string =>
  new Date().toISOString().slice(0, 19).replace('T', ' ');

const resolveTaskConfig = (appConfig: any): IssueAnalysisConfig => {
  const raw = appConfig.task?.configs?.[TASK_CONFIG_KEY] ?? {};
  const workspaceId = raw.workspaceId ?? '';
  const endpoint = raw.endpoint ??
    (workspaceId ? `https://${workspaceId}.cn-beijing.maas.aliyuncs.com/compatible-mode/v1/systemone` : '');

  return {
    apiKey: raw.apiKey ?? '',
    endpoint,
    model: raw.model ?? 'decision-model-preview',
    concurrency: positiveInteger(raw.concurrency, 20, 100),
    requestsPerSecond: positiveNumber(raw.requestsPerSecond, 15, 20),
    candidateBatchSize: positiveInteger(raw.candidateBatchSize, 50_000, 100_000),
    maxRunSeconds: positiveNumber(raw.maxRunSeconds, 55 * 60, 55 * 60),
    requestTimeoutMs: positiveInteger(raw.requestTimeoutMs, 60_000, 120_000),
    requestAttempts: positiveInteger(raw.requestAttempts, 3, 10),
    retryBaseDelayMs: positiveInteger(raw.retryBaseDelayMs, 1_000, 30_000),
    insertBatchSize: positiveInteger(raw.insertBatchSize, 200, 2_000),
    maxIssueFailures: positiveInteger(raw.maxIssueFailures, 5, 100),
    maxBodyChars: positiveInteger(raw.maxBodyChars, 10_000, 30_000),
    maxReadmeChars: positiveInteger(raw.maxReadmeChars, 4_000, 30_000),
    maxDescriptionChars: positiveInteger(raw.maxDescriptionChars, 1_000, 5_000),
    maxTopics: positiveInteger(raw.maxTopics, 30, 100),
    hostileThreshold: probability(raw.hostileThreshold ?? 0.5),
  };
};

const validateTaskConfig = (config: IssueAnalysisConfig): void => {
  if (!config.apiKey) throw new Error('No API key configured. Set task.configs.issueAnalysis.apiKey in localConfig.');
  if (!config.endpoint) {
    throw new Error('No decision endpoint configured. Set task.configs.issueAnalysis.workspaceId or endpoint in localConfig.');
  }
  const endpoint = new URL(config.endpoint);
  if (endpoint.protocol !== 'https:') throw new Error('The decision model endpoint must use HTTPS.');
  if (!endpoint.pathname.endsWith('/systemone')) {
    throw new Error('The decision model endpoint must end with /systemone.');
  }
};

const tableExists = async (table: string): Promise<boolean> => {
  const rows = await query(`
    SELECT count()
    FROM system.tables
    WHERE database = currentDatabase() AND name = '${table}'`);
  return Number(rows[0]?.[0] ?? 0) > 0;
};

const columnExists = async (table: string, column: string): Promise<boolean> => {
  const rows = await query(`
    SELECT count()
    FROM system.columns
    WHERE database = currentDatabase() AND table = '${table}' AND name = '${column}'`);
  return Number(rows[0]?.[0] ?? 0) > 0;
};

const migrateAndCreateTables = async (): Promise<void> => {
  const resultTableExists = await tableExists(RESULT_TABLE);
  const hasIssueIntent = resultTableExists && await columnExists(RESULT_TABLE, 'issue_intent');
  const hasCurrentSchema = resultTableExists && await columnExists(RESULT_TABLE, 'repository_context_available');
  if (hasIssueIntent && !hasCurrentSchema) {
    throw new Error(`The current ${RESULT_TABLE} uses the previous decision schema. Drop it before restarting the analysis.`);
  }
  const resultTableIsNew = hasIssueIntent && hasCurrentSchema;
  const legacyTableExists = await tableExists(LEGACY_RESULT_TABLE);

  if (resultTableExists && !resultTableIsNew) {
    if (legacyTableExists) {
      throw new Error(`Both the old ${RESULT_TABLE} and ${LEGACY_RESULT_TABLE} exist; refusing to overwrite either table.`);
    }
    await query(`RENAME TABLE ${RESULT_TABLE} TO ${LEGACY_RESULT_TABLE}`);
  }

  await query(`
    CREATE TABLE IF NOT EXISTS ${RESULT_TABLE}
    (
      \`id\` UInt64,
      \`platform\` LowCardinality(String),
      \`repo_id\` UInt64,
      \`issue_number\` UInt64,
      \`information_quality\` Enum('Very Low' = 1, 'Low' = 2, 'Medium' = 3, 'High' = 4, 'Very High' = 5),
      \`information_quality_score\` Float32,
      \`information_quality_confidence\` Float32,
      \`information_quality_probabilities\` String,
      \`is_automatically_generated\` Enum('Yes' = 1, 'Uncertain' = 2, 'No' = 3),
      \`automatically_generated_confidence\` Float32,
      \`automatically_generated_probabilities\` String,
      \`hostile_or_abusive\` Enum('No' = 1, 'Yes' = 2),
      \`hostile_or_abusive_probability\` Float32,
      \`issue_intent\` Enum(
        'Defect Report' = 1,
        'Change Request' = 2,
        'Question / Support' = 3,
        'Work Item / Task' = 4,
        'Discussion / Feedback' = 5,
        'Other' = 6
      ),
      \`issue_intent_confidence\` Float32,
      \`issue_intent_probabilities\` String,
      \`severity\` Enum(
        'Critical' = 1,
        'High' = 2,
        'Medium' = 3,
        'Low' = 4,
        'Unknown / Not Applicable' = 5
      ),
      \`severity_confidence\` Float32,
      \`severity_probabilities\` String,
      \`triage_readiness\` Enum(
        'Ready for Action' = 1,
        'Needs More Information' = 2,
        'Needs Reproduction' = 3,
        'Needs Clarification' = 4,
        'Non-actionable' = 5
      ),
      \`triage_readiness_confidence\` Float32,
      \`triage_readiness_probabilities\` String,
      \`reproducibility\` Enum(
        'Complete' = 1,
        'Partial' = 2,
        'Absent' = 3,
        'Not Applicable' = 4
      ),
      \`reproducibility_confidence\` Float32,
      \`reproducibility_probabilities\` String,
      \`repository_relevance\` Enum(
        'Relevant' = 1,
        'Uncertain' = 2,
        'Not Relevant' = 3,
        'Insufficient Repository Context' = 4
      ),
      \`repository_relevance_confidence\` Float32,
      \`repository_relevance_probabilities\` String,
      \`repository_context_available\` UInt8,
      \`primary_area\` Enum(
        'Frontend / UI' = 1,
        'Backend / Core' = 2,
        'API / SDK' = 3,
        'CLI / Desktop / IDE' = 4,
        'Data / Storage' = 5,
        'Test / CI / Build / Release' = 6,
        'Infrastructure / Deployment' = 7,
        'Documentation / Content' = 8,
        'Dependencies' = 9,
        'Cross-cutting / Unknown' = 10
      ),
      \`primary_area_confidence\` Float32,
      \`primary_area_probabilities\` String,
      \`is_security_or_privacy_related\` UInt8,
      \`security_or_privacy_probability\` Float32,
      \`is_performance_or_scalability_related\` UInt8,
      \`performance_or_scalability_probability\` Float32,
      \`is_reliability_or_data_integrity_related\` UInt8,
      \`reliability_or_data_integrity_probability\` Float32,
      \`is_compatibility_or_portability_related\` UInt8,
      \`compatibility_or_portability_probability\` Float32,
      \`is_usability_or_accessibility_related\` UInt8,
      \`usability_or_accessibility_probability\` Float32,
      \`model\` LowCardinality(String),
      \`request_id\` String,
      \`input_tokens\` UInt32,
      \`latency_ms\` Float32,
      \`source_scope\` Enum('label' = 1, 'export_repo' = 2),
      \`analyzed_at\` DateTime
    )
    ENGINE = ReplacingMergeTree(analyzed_at)
    ORDER BY (platform, id)
    SETTINGS index_granularity = 8192`);

  await query(`
    CREATE TABLE IF NOT EXISTS ${FAILURE_TABLE}
    (
      \`id\` UInt64,
      \`platform\` LowCardinality(String),
      \`source_scope\` Enum('label' = 1, 'export_repo' = 2),
      \`error\` String,
      \`failed_at\` DateTime
    )
    ENGINE = MergeTree
    ORDER BY (platform, id, failed_at)
    SETTINGS index_granularity = 8192`);
};

const buildCandidateQuery = (
  scope: SourceScope,
  config: IssueAnalysisConfig,
  hasRepoInfo: boolean,
): string => {
  const scopeCondition = scope === 'label'
    ? `(platform, issue_id) IN (SELECT platform, id FROM issues_with_label)`
    : `(platform, repo_id) IN (SELECT platform, id FROM export_repo)`;

  const repoCte = hasRepoInfo ? `
    WITH repo_latest AS
    (
      SELECT
        platform,
        id,
        argMax(description, updated_at) AS description,
        argMax(readme_text, updated_at) AS readme_text,
        argMax(topics, updated_at) AS topics
      FROM repo_info
      GROUP BY platform, id
      HAVING argMax(status, updated_at) = 'normal'
    )` : '';

  const repoColumns = hasRepoInfo ? `
      substring(ifNull(repo.description, ''), 1, ${config.maxDescriptionChars}) AS repo_description,
      substring(ifNull(repo.readme_text, ''), 1, ${config.maxReadmeChars}) AS repo_readme,
      arraySlice(ifNull(repo.topics, []), 1, ${config.maxTopics}) AS repo_topics` : `
      '' AS repo_description,
      '' AS repo_readme,
      [] AS repo_topics`;

  const repoJoin = hasRepoInfo
    ? 'LEFT JOIN repo_latest AS repo ON issue.platform = repo.platform AND issue.selected_repo_id = repo.id'
    : '';

  return `${repoCte}
    SELECT
      issue.platform,
      issue.id,
      issue.selected_repo_id AS repo_id,
      issue.repo_name,
      issue.issue_number,
      issue.title,
      issue.body,
      issue.labels,
      ${repoColumns}
    FROM
    (
      SELECT
        platform,
        issue_id AS id,
        argMax(repo_id, created_at) AS selected_repo_id,
        argMax(repo_name, created_at) AS repo_name,
        argMax(issue_number, created_at) AS issue_number,
        argMax(issue_title, created_at) AS title,
        substring(argMax(body, created_at), 1, ${config.maxBodyChars}) AS body,
        argMax(\`issue_labels.name\`, created_at) AS labels
      FROM events
      WHERE type = 'IssuesEvent'
        AND action = 'opened'
        AND created_at >= '2020-01-01 00:00:00'
        AND ${scopeCondition}
        AND (platform, issue_id) NOT IN (SELECT platform, id FROM ${RESULT_TABLE})
        AND (platform, issue_id) NOT IN
        (
          SELECT platform, id
          FROM ${FAILURE_TABLE}
          GROUP BY platform, id
          HAVING count() >= ${config.maxIssueFailures}
        )
      GROUP BY platform, issue_id
      LIMIT ${config.candidateBatchSize}
    ) AS issue
    ${repoJoin}`;
};

const getCandidates = async (
  config: IssueAnalysisConfig,
  deadline: number,
  logger: any,
): Promise<{ issues: InputIssue[]; scope: SourceScope | null }> => {
  const hasRepoInfo = await tableExists('repo_info');
  const hasLabelView = await tableExists('issues_with_label');
  if (!hasRepoInfo) logger.warn('repo_info does not exist; repository context will be empty.');

  const queryScope = async (scope: SourceScope): Promise<InputIssue[]> => {
    const remainingSeconds = Math.floor((deadline - Date.now()) / 1000);
    if (remainingSeconds <= 0) throw new DeadlineReachedError('Deadline reached before loading candidates.');
    const rows = await query(buildCandidateQuery(scope, config, hasRepoInfo), {
      clickhouse_settings: { max_execution_time: remainingSeconds },
    });
    return rows.map(row => ({
      platform: String(row[0]),
      id: Number(row[1]),
      repoId: Number(row[2]),
      repoName: String(row[3] ?? ''),
      number: Number(row[4]),
      title: String(row[5] ?? ''),
      body: String(row[6] ?? ''),
      labels: Array.isArray(row[7]) ? row[7].map(String) : [],
      repoDescription: String(row[8] ?? ''),
      repoReadme: String(row[9] ?? ''),
      repoTopics: Array.isArray(row[10]) ? row[10].map(String) : [],
      sourceScope: scope,
    }));
  };

  if (hasLabelView) {
    const labelIssues = await queryScope('label');
    if (labelIssues.length > 0) return { issues: labelIssues, scope: 'label' };
  } else {
    logger.warn('issues_with_label does not exist; skip label-priority candidates.');
  }

  const exportRepoIssues = await queryScope('export_repo');
  return {
    issues: exportRepoIssues,
    scope: exportRepoIssues.length > 0 ? 'export_repo' : null,
  };
};

const createRateLimiter = (requestsPerSecond: number) => {
  const intervalMs = 1000 / requestsPerSecond;
  let nextRequestAt = 0;
  return async (deadline: number): Promise<void> => {
    const scheduledAt = Math.max(Date.now(), nextRequestAt);
    nextRequestAt = scheduledAt + intervalMs;
    if (scheduledAt >= deadline) throw new DeadlineReachedError('Task deadline reached.');
    if (scheduledAt > Date.now()) await waitFor(scheduledAt - Date.now());
    if (Date.now() >= deadline) throw new DeadlineReachedError('Task deadline reached.');
  };
};

const postDecisionRequest = async (
  config: IssueAnalysisConfig,
  payload: object,
  deadline: number,
): Promise<DecisionResponse> => {
  const remainingMs = deadline - Date.now();
  if (remainingMs <= 0) throw new DeadlineReachedError('Task deadline reached.');
  const body = JSON.stringify(payload);
  const endpoint = new URL(config.endpoint);

  return new Promise<DecisionResponse>((resolve, reject) => {
    let settled = false;
    let deadlineTimer: NodeJS.Timeout;
    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(deadlineTimer);
      fn();
    };

    const req = httpsRequest({
      protocol: endpoint.protocol,
      hostname: endpoint.hostname,
      port: endpoint.port || undefined,
      path: `${endpoint.pathname}${endpoint.search}`,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
      timeout: config.requestTimeoutMs < remainingMs ? config.requestTimeoutMs : undefined,
    }, response => {
      const chunks: Buffer[] = [];
      response.on('data', chunk => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
      response.on('end', () => {
        const responseBody = Buffer.concat(chunks).toString('utf8');
        if (!response.statusCode || response.statusCode < 200 || response.statusCode >= 300) {
          const compactBody = responseBody.replace(/\s+/g, ' ').slice(0, 1_000);
          finish(() => reject(new HttpError(response.statusCode ?? 0, `Decision API returned HTTP ${response.statusCode ?? 0}: ${compactBody}`)));
          return;
        }
        try {
          finish(() => resolve(JSON.parse(responseBody)));
        } catch (error: any) {
          finish(() => reject(new Error(`Invalid JSON returned by decision API: ${error.message}`)));
        }
      });
    });

    deadlineTimer = setTimeout(() => {
      req.destroy(new DeadlineReachedError('Task deadline reached during decision request.'));
    }, remainingMs);

    req.on('timeout', () => req.destroy(new Error(`Decision request timed out after ${config.requestTimeoutMs}ms.`)));
    req.on('error', error => finish(() => reject(error)));
    req.end(body);
  });
};

const selectQuality = (answer: DecisionAnswer): string => {
  const qualities = ['Very Low', 'Low', 'Medium', 'High', 'Very High'];
  const entries = Object.entries(answer.probabilities ?? {})
    .map(([key, value]) => [Number(key), Number(value)] as const)
    .filter(([key, value]) => Number.isInteger(key) && key >= 0 && key < qualities.length && Number.isFinite(value));
  const index = entries.length > 0
    ? entries.sort((a, b) => b[1] - a[1])[0][0]
    : Math.max(0, Math.min(qualities.length - 1, Math.round(Number(answer.score))));
  return qualities[index];
};

const requireAnswer = (response: DecisionResponse, key: string, type: string): DecisionAnswer => {
  const answer = response.answers?.[key];
  if (!answer || answer.type !== type) throw new Error(`Decision response is missing a valid ${key} answer.`);
  if (type === 'choice' && typeof answer.choice !== 'string') {
    throw new Error(`Decision response contains an invalid ${key} choice.`);
  }
  if (type === 'noul' && !Number.isFinite(Number(answer.noul))) {
    throw new Error(`Decision response contains an invalid ${key} probability.`);
  }
  if (type === 'score') {
    const hasScore = Number.isFinite(Number(answer.score));
    const hasProbabilities = Object.values(answer.probabilities ?? {}).some(value => Number.isFinite(Number(value)));
    if (!hasScore && !hasProbabilities) throw new Error(`Decision response contains an invalid ${key} score.`);
  }
  return answer;
};

const analyzeIssue = async (
  issue: InputIssue,
  config: IssueAnalysisConfig,
  deadline: number,
  waitForRateSlot: (deadline: number) => Promise<void>,
): Promise<OutputIssue> => {
  const hasRepositoryContext = issue.repoDescription.trim() !== '' ||
    issue.repoReadme.trim() !== '' ||
    issue.repoTopics.some(topic => topic.trim() !== '');
  const payload = {
    model: config.model,
    state: {
      repository: {
        platform: issue.platform,
        name: issue.repoName,
        description: issue.repoDescription,
        topics: issue.repoTopics,
        readme: issue.repoReadme,
        context_available: hasRepositoryContext,
      },
      issue: {
        number: issue.number,
        labels: issue.labels,
        title: issue.title,
        body: issue.body,
      },
    },
    questions: {
      information_quality: {
        type: 'score',
        instructions: 'Rate how much useful, relevant, specific, and actionable information the issue provides. Judge the issue content, not the importance of the repository.',
        criteria: [
          'Very Low: empty, meaningless, spam-like, or provides almost no actionable context.',
          'Low: states a vague request or problem but lacks essential context, evidence, or expected behavior.',
          'Medium: understandable and somewhat actionable, but important details are missing.',
          'High: clear, relevant, and actionable with useful context, examples, or reproduction information.',
          'Very High: exceptionally complete and precise, with strong evidence, reproduction steps, environment details, or a concrete proposal.',
        ],
      },
      automatically_generated: {
        type: 'choice',
        instructions: 'Was this issue automatically generated by a bot, scanner, dependency updater, template automation, monitoring system, or bulk import rather than written as an ordinary human-authored issue?',
        criteria: {
          yes: 'Clear evidence that the issue was generated automatically.',
          uncertain: 'Automation is plausible, but the evidence is not conclusive.',
          no: 'The issue appears to be authored normally by a person.',
        },
      },
      hostile_or_abusive: {
        type: 'noul',
        instructions: 'Is the issue abusive or malicious? Count spam or advertising, phishing or malware, targeted harassment or hate, unrelated political or religious agitation, explicit sexual or gambling content, and deliberately harmful content. Ordinary criticism, frustration, security reports, and technical disagreement are not abusive.',
        criteria: {
          true: 'The issue contains abusive, malicious, exploitative, or clearly unrelated harmful content.',
          false: 'The issue is a legitimate project-related report, request, question, or discussion, even if strongly worded.',
        },
      },
      issue_intent: {
        type: 'choice',
        instructions: 'Choose the single primary intent of the issue. Classify what the author wants, independently of technical area and cross-cutting concerns. Repository labels are hints, but workflow labels such as triage, priority, status, good first issue, or help wanted do not determine intent.',
        criteria: {
          defect_report: 'Reports existing behavior that is incorrect, broken, regressed, crashing, or otherwise not working as intended.',
          change_request: 'Requests new or changed behavior, capability, documentation, performance, security, compatibility, or another project improvement.',
          question_support: 'A usage question, configuration problem, troubleshooting request, or request for help.',
          work_item_task: 'Tracks a concrete engineering or project task such as maintenance, refactoring, dependency updates, test work, release work, or implementation already accepted as work.',
          discussion_feedback: 'Invites discussion, shares feedback or an idea, or explores a direction without a concrete defect, requested change, support question, or committed task.',
          other: 'The author intent cannot be determined or none of the other intent categories is a good match.',
        },
      },
      severity: {
        type: 'choice',
        instructions: 'Assess the demonstrated technical or user impact, not the reporter tone, repository popularity, or maintainer business priority. Use unknown_not_applicable when impact cannot be inferred or severity does not meaningfully apply.',
        criteria: {
          critical: 'Active exploitation, severe security or privacy exposure, unrecoverable data loss or corruption, or a widespread outage of core functionality with no workaround.',
          high: 'Core functionality is unusable for a significant set of users, a serious regression exists, or major data or reliability risk is present without a reasonable workaround.',
          medium: 'Meaningful functionality is impaired, but the scope is limited or a practical workaround exists.',
          low: 'Minor, cosmetic, localized, or edge-case impact with little operational risk.',
          unknown_not_applicable: 'The evidence is insufficient, or this is a question, proposal, documentation task, or other item for which impact severity is not meaningful.',
        },
      },
      triage_readiness: {
        type: 'choice',
        instructions: 'Choose the single most important next triage state. Prefer needs_reproduction for a malfunction that lacks a repeatable case, needs_more_information for missing technical facts, and needs_clarification when the requested outcome itself is ambiguous.',
        criteria: {
          ready_for_action: 'There is enough information to investigate, implement, document, or answer the issue now.',
          needs_more_information: 'Important technical facts such as environment, version, logs, error output, examples, or affected configuration are missing.',
          needs_reproduction: 'A reported malfunction cannot yet be reproduced because steps, input, or a minimal example are missing or incomplete.',
          needs_clarification: 'The goal, question, expected behavior, or requested change is ambiguous and must be clarified by the reporter.',
          non_actionable: 'There is no coherent or actionable project request even after considering the repository context.',
        },
      },
      reproducibility: {
        type: 'choice',
        instructions: 'Evaluate whether a reported behavior can be reproduced from the supplied information. Use not_applicable when reproduction is not relevant to the issue intent.',
        criteria: {
          complete: 'Provides a sufficiently complete sequence, example, input, environment, expected behavior, and actual result to reproduce the behavior.',
          partial: 'Provides useful reproduction clues or some steps, but one or more important details are missing.',
          absent: 'Reports a behavior or failure without a usable reproduction path or concrete example.',
          not_applicable: 'Reproduction is not meaningful for this question, change request, documentation request, maintenance task, or other non-behavioral issue.',
        },
      },
      repository_relevance: {
        type: 'choice',
        instructions: 'Using the repository name, description, README, and topics, decide whether the issue belongs to this repository. A legitimate criticism or support question can still be relevant.',
        criteria: {
          relevant: 'The issue clearly concerns this repository, its documented functionality, supported integrations, documentation, or development workflow.',
          uncertain: 'The relationship to the repository is plausible but cannot be established confidently from the available context.',
          not_relevant: 'The issue is clearly for another project, unrelated to the repository scope, or contains no project-related request.',
        },
      },
      primary_area: {
        type: 'choice',
        instructions: 'Choose the single primary technical or content area affected by the issue. Select the most central area when several are mentioned, and use cross_cutting_unknown when no one area dominates or the area cannot be determined. Do not use this dimension to represent intent or a cross-cutting quality concern.',
        criteria: {
          frontend_ui: 'Web or graphical user interface, visual behavior, or client-side interaction.',
          backend_core: 'Core application logic, server-side behavior, runtime internals, or general repository implementation.',
          api_sdk: 'Public or internal APIs, protocols, integrations, libraries, or SDK behavior.',
          cli_desktop_ide: 'Command-line tools, desktop applications, IDEs, editors, or their extensions.',
          data_storage: 'Databases, persistence, indexing, data formats, migration, caching, or data processing.',
          test_ci_build_release: 'Tests, continuous integration, build systems, packaging, release pipelines, or distribution artifacts.',
          infrastructure_deployment: 'Deployment, containers, orchestration, cloud infrastructure, networking, or operations.',
          documentation_content: 'Documentation, examples, tutorials, guides, reference material, or other repository content.',
          dependencies: 'Third-party packages, dependency versions, lockfiles, or dependency compatibility.',
          cross_cutting_unknown: 'The issue spans several areas without one dominant area, no listed area is a good match, or the available information is insufficient.',
        },
      },
      security_or_privacy_related: {
        type: 'noul',
        instructions: 'Is security or privacy a substantive concern in this issue, independent of its intent and primary area?',
        criteria: {
          true: 'The issue materially concerns a vulnerability, authentication, authorization, secrets, privacy, cryptography, abuse prevention, or security hardening.',
          false: 'Security and privacy are absent or only incidental.',
        },
      },
      performance_or_scalability_related: {
        type: 'noul',
        instructions: 'Is performance or scalability a substantive concern in this issue, independent of its intent and primary area?',
        criteria: {
          true: 'The issue materially concerns latency, throughput, CPU, memory, resource consumption, load, capacity, or scaling behavior.',
          false: 'Performance and scalability are absent or only incidental.',
        },
      },
      reliability_or_data_integrity_related: {
        type: 'noul',
        instructions: 'Is reliability or data integrity a substantive concern in this issue, independent of its intent and primary area?',
        criteria: {
          true: 'The issue materially concerns crashes, outages, availability, resilience, recovery, flaky behavior, data loss, corruption, consistency, or correctness of persisted data.',
          false: 'Reliability and data integrity are absent or only incidental.',
        },
      },
      compatibility_or_portability_related: {
        type: 'noul',
        instructions: 'Is compatibility or portability a substantive concern in this issue, independent of its intent and primary area?',
        criteria: {
          true: 'The issue materially concerns backward compatibility, interoperability, dependency compatibility, or behavior across operating systems, runtimes, versions, browsers, architectures, or environments.',
          false: 'Compatibility and portability are absent or only incidental.',
        },
      },
      usability_or_accessibility_related: {
        type: 'noul',
        instructions: 'Is usability or accessibility a substantive concern in this issue, independent of its intent and primary area?',
        criteria: {
          true: 'The issue materially concerns user experience, confusing workflows, discoverability, accessibility, inclusive interaction, or ease of use.',
          false: 'Usability and accessibility are absent or only incidental.',
        },
      },
    },
  };
  if (!hasRepositoryContext) {
    delete (payload.questions as Record<string, any>).repository_relevance;
  }

  let lastError: Error | undefined;
  for (let attempt = 1; attempt <= config.requestAttempts; attempt++) {
    try {
      await waitForRateSlot(deadline);
      const response = await postDecisionRequest(config, payload, deadline);
      const quality = requireAnswer(response, 'information_quality', 'score');
      const automatic = requireAnswer(response, 'automatically_generated', 'choice');
      const abusive = requireAnswer(response, 'hostile_or_abusive', 'noul');
      const issueIntent = requireAnswer(response, 'issue_intent', 'choice');
      const severity = requireAnswer(response, 'severity', 'choice');
      const triageReadiness = requireAnswer(response, 'triage_readiness', 'choice');
      const reproducibility = requireAnswer(response, 'reproducibility', 'choice');
      const repositoryRelevance = hasRepositoryContext
        ? requireAnswer(response, 'repository_relevance', 'choice')
        : undefined;
      const primaryArea = requireAnswer(response, 'primary_area', 'choice');
      const securityOrPrivacy = requireAnswer(response, 'security_or_privacy_related', 'noul');
      const performanceOrScalability = requireAnswer(response, 'performance_or_scalability_related', 'noul');
      const reliabilityOrDataIntegrity = requireAnswer(response, 'reliability_or_data_integrity_related', 'noul');
      const compatibilityOrPortability = requireAnswer(response, 'compatibility_or_portability_related', 'noul');
      const usabilityOrAccessibility = requireAnswer(response, 'usability_or_accessibility_related', 'noul');

      const automaticValues: Record<string, string> = { yes: 'Yes', uncertain: 'Uncertain', no: 'No' };
      const issueIntentValues: Record<string, string> = {
        defect_report: 'Defect Report',
        change_request: 'Change Request',
        question_support: 'Question / Support',
        work_item_task: 'Work Item / Task',
        discussion_feedback: 'Discussion / Feedback',
        other: 'Other',
      };
      const severityValues: Record<string, string> = {
        critical: 'Critical',
        high: 'High',
        medium: 'Medium',
        low: 'Low',
        unknown_not_applicable: 'Unknown / Not Applicable',
      };
      const triageReadinessValues: Record<string, string> = {
        ready_for_action: 'Ready for Action',
        needs_more_information: 'Needs More Information',
        needs_reproduction: 'Needs Reproduction',
        needs_clarification: 'Needs Clarification',
        non_actionable: 'Non-actionable',
      };
      const reproducibilityValues: Record<string, string> = {
        complete: 'Complete',
        partial: 'Partial',
        absent: 'Absent',
        not_applicable: 'Not Applicable',
      };
      const repositoryRelevanceValues: Record<string, string> = {
        relevant: 'Relevant',
        uncertain: 'Uncertain',
        not_relevant: 'Not Relevant',
      };
      const primaryAreaValues: Record<string, string> = {
        frontend_ui: 'Frontend / UI',
        backend_core: 'Backend / Core',
        api_sdk: 'API / SDK',
        cli_desktop_ide: 'CLI / Desktop / IDE',
        data_storage: 'Data / Storage',
        test_ci_build_release: 'Test / CI / Build / Release',
        infrastructure_deployment: 'Infrastructure / Deployment',
        documentation_content: 'Documentation / Content',
        dependencies: 'Dependencies',
        cross_cutting_unknown: 'Cross-cutting / Unknown',
      };
      const automaticValue = automaticValues[String(automatic.choice)];
      const issueIntentValue = issueIntentValues[String(issueIntent.choice)];
      const severityValue = severityValues[String(severity.choice)];
      const triageReadinessValue = triageReadinessValues[String(triageReadiness.choice)];
      const reproducibilityValue = reproducibilityValues[String(reproducibility.choice)];
      const repositoryRelevanceValue = hasRepositoryContext
        ? repositoryRelevanceValues[String(repositoryRelevance?.choice)]
        : 'Insufficient Repository Context';
      const primaryAreaValue = primaryAreaValues[String(primaryArea.choice)];
      if (!automaticValue) throw new Error(`Unknown automatically_generated choice: ${automatic.choice}`);
      if (!issueIntentValue) throw new Error(`Unknown issue_intent choice: ${issueIntent.choice}`);
      if (!severityValue) throw new Error(`Unknown severity choice: ${severity.choice}`);
      if (!triageReadinessValue) throw new Error(`Unknown triage_readiness choice: ${triageReadiness.choice}`);
      if (!reproducibilityValue) throw new Error(`Unknown reproducibility choice: ${reproducibility.choice}`);
      if (!repositoryRelevanceValue) throw new Error(`Unknown repository_relevance choice: ${repositoryRelevance?.choice}`);
      if (!primaryAreaValue) throw new Error(`Unknown primary_area choice: ${primaryArea.choice}`);

      return {
        id: issue.id,
        platform: issue.platform,
        repoId: issue.repoId,
        issueNumber: issue.number,
        informationQuality: selectQuality(quality),
        informationQualityScore: Number(quality.score) || 0,
        informationQualityConfidence: probability(quality.confidence),
        informationQualityProbabilities: JSON.stringify(quality.probabilities ?? {}),
        isAutomaticallyGenerated: automaticValue,
        automaticallyGeneratedConfidence: probability(automatic.confidence),
        automaticallyGeneratedProbabilities: JSON.stringify(automatic.probabilities ?? {}),
        hostileOrAbusive: probability(abusive.noul) >= config.hostileThreshold ? 'Yes' : 'No',
        hostileOrAbusiveProbability: probability(abusive.noul),
        issueIntent: issueIntentValue,
        issueIntentConfidence: probability(issueIntent.confidence),
        issueIntentProbabilities: JSON.stringify(issueIntent.probabilities ?? {}),
        severity: severityValue,
        severityConfidence: probability(severity.confidence),
        severityProbabilities: JSON.stringify(severity.probabilities ?? {}),
        triageReadiness: triageReadinessValue,
        triageReadinessConfidence: probability(triageReadiness.confidence),
        triageReadinessProbabilities: JSON.stringify(triageReadiness.probabilities ?? {}),
        reproducibility: reproducibilityValue,
        reproducibilityConfidence: probability(reproducibility.confidence),
        reproducibilityProbabilities: JSON.stringify(reproducibility.probabilities ?? {}),
        repositoryRelevance: repositoryRelevanceValue,
        repositoryRelevanceConfidence: hasRepositoryContext ? probability(repositoryRelevance?.confidence) : 1,
        repositoryRelevanceProbabilities: hasRepositoryContext
          ? JSON.stringify(repositoryRelevance?.probabilities ?? {})
          : JSON.stringify({ insufficient_context: 1 }),
        repositoryContextAvailable: hasRepositoryContext ? 1 : 0,
        primaryArea: primaryAreaValue,
        primaryAreaConfidence: probability(primaryArea.confidence),
        primaryAreaProbabilities: JSON.stringify(primaryArea.probabilities ?? {}),
        isSecurityOrPrivacyRelated: probability(securityOrPrivacy.noul) >= 0.5 ? 1 : 0,
        securityOrPrivacyProbability: probability(securityOrPrivacy.noul),
        isPerformanceOrScalabilityRelated: probability(performanceOrScalability.noul) >= 0.5 ? 1 : 0,
        performanceOrScalabilityProbability: probability(performanceOrScalability.noul),
        isReliabilityOrDataIntegrityRelated: probability(reliabilityOrDataIntegrity.noul) >= 0.5 ? 1 : 0,
        reliabilityOrDataIntegrityProbability: probability(reliabilityOrDataIntegrity.noul),
        isCompatibilityOrPortabilityRelated: probability(compatibilityOrPortability.noul) >= 0.5 ? 1 : 0,
        compatibilityOrPortabilityProbability: probability(compatibilityOrPortability.noul),
        isUsabilityOrAccessibilityRelated: probability(usabilityOrAccessibility.noul) >= 0.5 ? 1 : 0,
        usabilityOrAccessibilityProbability: probability(usabilityOrAccessibility.noul),
        model: response.model ?? config.model,
        requestId: response.request_id ?? '',
        inputTokens: Math.max(0, Math.floor(Number(response.usage?.input_tokens) || 0)),
        latencyMs: Math.max(0, Number(response.latency_ms) || 0),
        sourceScope: issue.sourceScope,
      };
    } catch (error: any) {
      if (error instanceof DeadlineReachedError) throw error;
      if (error instanceof HttpError && (error.statusCode === 401 || error.statusCode === 403)) {
        throw new FatalTaskError(`Decision API authentication failed with HTTP ${error.statusCode}.`);
      }
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < config.requestAttempts) {
        const delayMs = config.retryBaseDelayMs * Math.pow(2, attempt - 1);
        if (Date.now() + delayMs >= deadline) throw new DeadlineReachedError('Task deadline reached during retry backoff.');
        await waitFor(delayMs);
      }
    }
  }
  throw lastError ?? new Error('Decision request failed.');
};

const saveResults = async (results: OutputIssue[]): Promise<void> => {
  if (results.length === 0) return;
  const analyzedAt = clickhouseDateTime();
  await insertRecords(results.map(result => ({
    id: result.id,
    platform: result.platform,
    repo_id: result.repoId,
    issue_number: result.issueNumber,
    information_quality: result.informationQuality,
    information_quality_score: result.informationQualityScore,
    information_quality_confidence: result.informationQualityConfidence,
    information_quality_probabilities: result.informationQualityProbabilities,
    is_automatically_generated: result.isAutomaticallyGenerated,
    automatically_generated_confidence: result.automaticallyGeneratedConfidence,
    automatically_generated_probabilities: result.automaticallyGeneratedProbabilities,
    hostile_or_abusive: result.hostileOrAbusive,
    hostile_or_abusive_probability: result.hostileOrAbusiveProbability,
    issue_intent: result.issueIntent,
    issue_intent_confidence: result.issueIntentConfidence,
    issue_intent_probabilities: result.issueIntentProbabilities,
    severity: result.severity,
    severity_confidence: result.severityConfidence,
    severity_probabilities: result.severityProbabilities,
    triage_readiness: result.triageReadiness,
    triage_readiness_confidence: result.triageReadinessConfidence,
    triage_readiness_probabilities: result.triageReadinessProbabilities,
    reproducibility: result.reproducibility,
    reproducibility_confidence: result.reproducibilityConfidence,
    reproducibility_probabilities: result.reproducibilityProbabilities,
    repository_relevance: result.repositoryRelevance,
    repository_relevance_confidence: result.repositoryRelevanceConfidence,
    repository_relevance_probabilities: result.repositoryRelevanceProbabilities,
    repository_context_available: result.repositoryContextAvailable,
    primary_area: result.primaryArea,
    primary_area_confidence: result.primaryAreaConfidence,
    primary_area_probabilities: result.primaryAreaProbabilities,
    is_security_or_privacy_related: result.isSecurityOrPrivacyRelated,
    security_or_privacy_probability: result.securityOrPrivacyProbability,
    is_performance_or_scalability_related: result.isPerformanceOrScalabilityRelated,
    performance_or_scalability_probability: result.performanceOrScalabilityProbability,
    is_reliability_or_data_integrity_related: result.isReliabilityOrDataIntegrityRelated,
    reliability_or_data_integrity_probability: result.reliabilityOrDataIntegrityProbability,
    is_compatibility_or_portability_related: result.isCompatibilityOrPortabilityRelated,
    compatibility_or_portability_probability: result.compatibilityOrPortabilityProbability,
    is_usability_or_accessibility_related: result.isUsabilityOrAccessibilityRelated,
    usability_or_accessibility_probability: result.usabilityOrAccessibilityProbability,
    model: result.model,
    request_id: result.requestId,
    input_tokens: result.inputTokens,
    latency_ms: result.latencyMs,
    source_scope: result.sourceScope,
    analyzed_at: analyzedAt,
  })), RESULT_TABLE);
};

const saveFailures = async (failures: AnalysisFailure[]): Promise<void> => {
  if (failures.length === 0) return;
  const failedAt = clickhouseDateTime();
  await insertRecords(failures.map(failure => ({
    id: failure.id,
    platform: failure.platform,
    source_scope: failure.sourceScope,
    error: failure.error.slice(0, 4_000),
    failed_at: failedAt,
  })), FAILURE_TABLE);
};

const runWorkers = async (
  issues: InputIssue[],
  config: IssueAnalysisConfig,
  deadline: number,
  logger: any,
): Promise<{ completed: number; failed: number; deadlineReached: boolean }> => {
  const waitForRateSlot = createRateLimiter(config.requestsPerSecond);
  let cursor = 0;
  let completed = 0;
  let failed = 0;
  let deadlineReached = false;
  let fatalError: Error | undefined;

  const worker = async (): Promise<void> => {
    const resultBuffer: OutputIssue[] = [];
    const failureBuffer: AnalysisFailure[] = [];

    const flush = async (): Promise<void> => {
      if (resultBuffer.length > 0) await saveResults(resultBuffer.splice(0));
      if (failureBuffer.length > 0) await saveFailures(failureBuffer.splice(0));
    };

    try {
      while (!fatalError && Date.now() < deadline) {
        const issueIndex = cursor++;
        if (issueIndex >= issues.length) break;
        const issue = issues[issueIndex];
        try {
          resultBuffer.push(await analyzeIssue(issue, config, deadline, waitForRateSlot));
          completed++;
        } catch (error: any) {
          if (error instanceof DeadlineReachedError) {
            deadlineReached = true;
            break;
          }
          if (error instanceof FatalTaskError) {
            fatalError = error;
            break;
          }
          failed++;
          failureBuffer.push({
            id: issue.id,
            platform: issue.platform,
            sourceScope: issue.sourceScope,
            error: error instanceof Error ? error.message : String(error),
          });
          logger.warn(`Issue analysis failed for ${issue.platform}/${issue.id}: ${error}`);
        }
        if (resultBuffer.length + failureBuffer.length >= config.insertBatchSize) await flush();
      }
    } finally {
      await flush();
    }
  };

  await Promise.all(Array.from(
    { length: Math.min(config.concurrency, issues.length) },
    () => worker(),
  ));

  if (fatalError) throw fatalError;
  if (Date.now() >= deadline && cursor < issues.length) deadlineReached = true;
  return { completed, failed, deadlineReached };
};

const task: Task = {
  cron: '0 * * * *',
  singleInstance: true,
  callback: async trigger => {
    const logger = getLogger('IssueAnalysisTask');
    const startedAt = Date.now();
    const appConfig: any = await getConfig();
    const config = resolveTaskConfig(appConfig);

    try {
      validateTaskConfig(config);
    } catch (error: any) {
      logger.error(`Invalid Issue analysis configuration: ${error.message}`);
      return;
    }

    const maxRunDeadline = startedAt + config.maxRunSeconds * 1000;
    const nextHour = (Math.floor(startedAt / (60 * 60 * 1000)) + 1) * 60 * 60 * 1000;
    const deadline = trigger === 'manual'
      ? maxRunDeadline
      : Math.min(maxRunDeadline, nextHour - NEXT_RUN_SAFETY_MS);
    if (Date.now() >= deadline) {
      logger.warn('Too close to the next hourly trigger; skip this Issue analysis round.');
      return;
    }
    await migrateAndCreateTables();
    if (Date.now() >= deadline) {
      logger.warn('Issue analysis deadline reached while preparing tables; stop this round.');
      return;
    }

    let candidates: { issues: InputIssue[]; scope: SourceScope | null };
    try {
      candidates = await getCandidates(config, deadline, logger);
    } catch (error: any) {
      if (error instanceof DeadlineReachedError) {
        logger.warn('Issue analysis deadline reached while loading candidates; stop this round.');
        return;
      }
      throw error;
    }

    if (candidates.issues.length === 0) {
      logger.info('No pending Issue analysis candidates found.');
      return;
    }

    logger.info(`Loaded ${candidates.issues.length} ${candidates.scope} Issue candidates; concurrency=${config.concurrency}, requestsPerSecond=${config.requestsPerSecond}.`);
    const summary = await runWorkers(candidates.issues, config, deadline, logger);
    const elapsedSeconds = Math.round((Date.now() - startedAt) / 1000);
    logger.info(`Issue analysis round finished: scope=${candidates.scope}, completed=${summary.completed}, failed=${summary.failed}, queued=${candidates.issues.length}, deadlineReached=${summary.deadlineReached}, elapsedSeconds=${elapsedSeconds}.`);
  },
};

module.exports = task;
