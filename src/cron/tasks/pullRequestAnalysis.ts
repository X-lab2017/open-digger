import { OpenAI } from "openai";
import { getLogger, runTasks } from "../../utils";
import getConfig from "../../config";
import { insertRecords, query } from "../../db/clickhouse";
import { Task } from "..";

const task: Task = {
  cron: '30 * * * *',
  singleInstance: true,
  callback: async () => {
    const logger = getLogger('PullRequestAnalysisTask');
    const config: any = await getConfig();

    const concurrentRequestNumber = 15;
    const batchSize = 20 * concurrentRequestNumber;
    const qualityOptions = ['Very Poor', 'Poor', 'Fair', 'Good', 'Excellent'];
    const qualityValueMap: Map<typeof qualityOptions[number], number> = new Map([
      ['Very Poor', 1],
      ['Poor', 2],
      ['Fair', 3],
      ['Good', 4],
      ['Excellent', 5],
    ]);

    interface InputPullRequest {
      id: number;
      platform: string;
      repoName: string;
      number: number;
      title: string;
      body: string;
      diff: string;
    }

    interface OutputPullRequest {
      id: number;
      platform: string;
      primaryLanguage: string;
      codeQuality: number;
      titleDescQuality: number;
      prType: string;
      valueLevel: number;
      isAutomaticallyGenerated: string;
      hostileOrAbuse: string;
      reasoning: string;
    }

    const openai = new OpenAI({
      apiKey: config.qwen.token,
      baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    });

    const createPullInfoTable = async () => {
      const sql = `
    CREATE TABLE IF NOT EXISTS pull_info
    (
      \`id\` UInt64,
      \`platform\` LowCardinality(String),
      \`code_quality\` UInt8,
      \`pr_title_and_description_quality\` UInt8,
      \`pr_type\` LowCardinality(String),
      \`value_level\` UInt8,
      \`primary_language\` LowCardinality(String),
      \`is_automatically_generated\` Enum('Yes' = 3, 'Uncertain' = 2, 'No' = 1),
      \`hostile_or_abuse\` Enum('Yes' = 2, 'No' = 1),
      \`reasoning\` String
    )
    ENGINE = ReplacingMergeTree
    ORDER BY (id, platform)
    SETTINGS index_granularity = 8192`;
      await query(sql);
    };

    const analyzePullRequest = async (pullRequest: InputPullRequest): Promise<OutputPullRequest | null> => {
      const prompt = `
You are an advanced code review assistant responsible for conducting a detailed analysis of a GitHub Pull Request (PR).
Please analyze the provided PR data and return the results based on the following framework.
Only return the results, do not return any other text.

# Analysis Framework:

## Submission Quality Analysis

- **Code Quality**: [Excellent/Good/Fair/Poor/Very Poor]
  **Evaluation Criteria**:
  - **Excellent**: Consistent code style, clear naming conventions, concise logic, appropriate comments and documentation; follows best practices; reasonable complexity; elegant refactoring or feature implementation.
  - **Good**: Mostly consistent code style, reasonable naming; clear logic with minor redundancy; basic comments; moderate complexity.
  - **Fair**: Inconsistent code style, vague naming; somewhat confusing or redundant logic; lacking comments; higher complexity but still understandable.
  - **Poor**: Poor code style, arbitrary naming; confusing logic, significant code duplication; no comments; high complexity and difficult to maintain.
  - **Very Poor**: Minimal or no substantive code content; or code quality is extremely poor and unreadable; or contains only whitespace, formatting changes, or other meaningless modifications.
  (If there is no code in the PR, return Very Poor.)

- **PR Title and Description Quality**: [Excellent/Good/Fair/Poor/Very Poor]
  **Evaluation Criteria**:
  - **Excellent**:
    - **Title**: Concise and clear, uses standard prefixes (e.g., 'feat: ', 'fix: ', 'docs: '), accurately summarizes the PR's core content.
    - **Description**: Detailed explanation of context, purpose, specific changes, testing approach, and impact scope; clear checklist; includes relevant issue links; well-formatted and readable.
    - Fully follows project contribution guidelines.
  - **Good**:
    - **Title**: Clear and accurate, generally reflects PR content, but may lack standard prefixes or be slightly verbose.
    - **Description**: Explains why and what was changed, but may lack testing details or impact analysis; has basic lists or paragraph separation.
    - Generally follows project conventions.
  - **Fair**:
    - **Title**: Vague or overly generic (e.g., "Update code", "Fix bug"), difficult to understand specific content immediately.
    - **Description**: Simple content, minimal explanation (e.g., "Fixed an issue"), lacks context, specific changes, or acceptance criteria.
  - **Poor**:
    - **Title**: Misleading, completely irrelevant, or placeholder text (e.g., "New PR", "Test").
    - **Description**: Almost empty, contains meaningless characters like ".", or completely incomprehensible content.
  - **Very Poor**: No title or no description.
  (If there is no title or description in the PR, return Very Poor.)

## PR Type Classification

- **PR Type**: [Feature, Refactor, Docs, Fix, Chore, Test, Other]
  (Classify the PR based on its content and purpose.)

## PR Value Assessment

- **Value Level**: [1/2/3/4/5]
  **Evaluation Criteria (5 = Highest value, 1 = Lowest value)**:
  - **Level 5 (Very High Value)**:
    - **Impact**: Fixes critical security vulnerabilities, core functionality defects, or adds significant, core feature capabilities.
    - **Code Quality**: Excellent.
    - **Code Size**: Moderate or large, but changes are focused and necessary.
    - **Description Quality**: Excellent, provides complete context and validation methods.
    - Significant positive impact on project health, stability, or capabilities.
  - **Level 4 (High Value)**:
    - **Impact**: Fixes important but non-critical bugs, or adds useful new features/optimizations.
    - **Code Quality**: Good to Excellent.
    - **Code Size**: Small to medium-sized substantive changes.
    - **Description Quality**: Good to Excellent.
    - Brings clear improvements to the project.
  - **Level 3 (Medium Value)**:
    - **Impact**: Fixes minor bugs, performs code refactoring that doesn't affect external behavior, updates dependencies, or adds non-core enhancements.
    - **Code Quality**: Fair to Good.
    - **Code Size**: Small to medium.
    - **Description Quality**: Fair to Good.
    - Beneficial to the project but not critical.
  - **Level 2 (Low Value)**:
    - **Impact**: Only minor adjustments such as fixing typos, adjusting formatting, updating comments, etc. Changes are correct but limited in value.
    - **Code Quality**: May be good, but changes themselves are simple.
    - **Code Size**: Typically small.
    - **Description Quality**: May be fair or poor.
    - Minimal impact on the project.
  - **Level 1 (Very Low/No Value or Negative Value)**:
    - **Impact**: Introduces new bugs, breaks existing functionality, submits meaningless changes (e.g., whitespace additions/removals), or adds content unrelated to the project.
    - **Code Quality**: Typically poor or very poor.
    - **Code Size**: May be small or unusually large but chaotic.
    - **Description Quality**: Typically poor.
    - No contribution or negative impact on the project.
  (Comprehensively assess the PR's overall value based on description, code quality, code quantity, and impact. Do not judge based on a single dimension.)

## Primary Programming Language

- **Primary Language**: [Markdown/Python/Java/JavaScript/...]
  (Identify the main programming language used in the PR. If the PR is about documentation, Markdown can be returned.)

## PR Automatically Generated Assessment

- **Is Automatically Generated**: [Yes/No/Uncertain]
  (Determine if the PR is likely generated by an automated tool based on patterns in the title, description, commit log, or code changes. For example, automated dependency version updates, code formatting PRs generated by CI/CD tools, etc.)

## Hostile or Abuse Assessment

- **Hostile or Abuse**: [Yes/No]
  (Determine if the PR is hostile or abusive based on the title, description, code changes, and commit log. If the PR is hostile or abusive, return Yes. Otherwise, return No. PLEASE NOTE that simply expressing moods or emotions should not be treated as hostile or abusive. ONLY strong hostile language, malicious code, spam, or advertisements unrelated to the codebase should be considered hostile or abusive.)

## Return the detailed analysis results in the following format:

Code Quality: [Excellent/Good/Fair/Poor/Very Poor]
PR Title and Description Quality: [Excellent/Good/Fair/Poor/Very Poor]
PR Type: [Feature/Refactor/Docs/Fix/Chore/Test/Other]
Value Level: [1/2/3/4/5]
Primary Language: [Python/Java/JavaScript/Unknown...]
Is Automatically Generated: [Yes/No/Uncertain]
Hostile or Abuse: [Yes/No]

# PR Data:

<Title>
${pullRequest.title}
</Title>

<Description>
${pullRequest.body}
</Description>

<Git Diff>
${pullRequest.diff}
</Git Diff>
`;

      try {

        const stream: any = await openai.chat.completions.create({
          model: 'qwen3-32b',
          enable_thinking: true,
          stream: true,
          stream_options: { include_usage: false },
          messages: [{ role: 'user', content: prompt }],
        } as any);

        const contentParts: any[] = [];
        const reasoningParts: any[] = [];
        for await (const chunk of stream) {
          if (chunk.choices && chunk.choices.length > 0) {
            contentParts.push(chunk.choices[0]?.delta?.content || '');
            reasoningParts.push(chunk.choices[0]?.delta?.reasoning_content || '');
          }
        }
        const resultStr: string = contentParts.join('');
        const reasoning: string = reasoningParts.join('');

        // extract data from the returned string content
        // Use regex to extract data from the returned string content
        const outputPullRequest: Partial<OutputPullRequest> = {
          id: pullRequest.id,
          platform: pullRequest.platform,
        };

        // Helper to extract each line by key
        function extractValue(regex: RegExp, str: string, values?: Set<string>, defaultValue?: string) {
          const match = str.match(regex);
          const ret = match ? match[1].trim() : undefined;
          if (values && ret && !values.has(ret)) {
            if (defaultValue) {
              return defaultValue;
            }
            throw new Error(`Invalid value: ${ret}`);
          }
          return ret;
        }

        outputPullRequest.codeQuality = qualityValueMap.get(extractValue(/Code Quality:\s*([^\n]+)/i, resultStr, new Set(qualityOptions), 'Very Poor') || 'Very Poor') || 1;
        outputPullRequest.titleDescQuality = qualityValueMap.get(extractValue(/PR Title and Description Quality:\s*([^\n]+)/i, resultStr, new Set(qualityOptions), 'Very Poor') || 'Very Poor') || 1;
        outputPullRequest.prType = extractValue(/PR Type:\s*([^\n]+)/i, resultStr, new Set(['Feature', 'Refactor', 'Docs', 'Fix', 'Chore', 'Test', 'Other']), 'Other');
        outputPullRequest.valueLevel = parseInt(extractValue(/Value Level:\s*([^\n]+)/i, resultStr, new Set(['1', '2', '3', '4', '5'])) || '1');
        outputPullRequest.primaryLanguage = extractValue(/Primary Language:\s*([^\n]+)/i, resultStr);
        outputPullRequest.isAutomaticallyGenerated = extractValue(/Is Automatically Generated:\s*([^\n]+)/i, resultStr, new Set(['Yes', 'Uncertain', 'No']), 'No');
        outputPullRequest.hostileOrAbuse = extractValue(/Hostile or Abuse:\s*([^\n]+)/i, resultStr, new Set(['Yes', 'No']), 'No');
        outputPullRequest.reasoning = reasoning;

        return (outputPullRequest as OutputPullRequest);
      } catch (e) {
        if (e instanceof Error && e.message.includes('data may contain inappropriate content.')) {
          // inappropriate content, return default values
          return {
            id: pullRequest.id,
            platform: pullRequest.platform,
            primaryLanguage: 'Unknown',
            codeQuality: 1,
            titleDescQuality: 1,
            prType: 'Other',
            valueLevel: 1,
            isAutomaticallyGenerated: 'Uncertain',
            hostileOrAbuse: 'Yes',
            reasoning: '',
          } as OutputPullRequest;
        }
        logger.error(`Error analyzing pull request ${pullRequest.id}: ${e}`);
        return null;
      }
    };

    const getPullRequests = async (num: number): Promise<InputPullRequest[]> => {
      // try to get pull requests from label data first
      const q = `SELECT id, platform, substring(diff, 1, 10000)
    FROM pull_diff WHERE status = 'normal' AND (platform, id) NOT IN (SELECT platform, id FROM pull_info)
    AND (platform, id) IN (SELECT platform, id FROM pulls_with_label)
    LIMIT ${num}`;
      let diffs = await query(q);
      if (diffs.length === 0) {
        return [];
      }
      const diffsObj = diffs.map(item => ({ id: +item[0], platform: item[1], diff: item[2] }));
      const pullInfo = await query(`SELECT issue_id, platform, any(repo_name), any(issue_number), argMax(issue_title, created_at), argMax(body, created_at)
    FROM events WHERE type = 'PullRequestEvent' AND (platform, issue_id) IN (${diffsObj.map(item => `('${item.platform}', ${item.id})`).join(',')})
    GROUP BY issue_id, platform
    `);
      const pullInfoObj = pullInfo.map(item => ({ id: +item[0], platform: item[1], repoName: item[2], number: item[3], title: item[4], body: item[5] }));
      const ret: InputPullRequest[] = [];
      for (const item of diffsObj) {
        const pullInfoItem = pullInfoObj.find(p => p.id === item.id && p.platform === item.platform);
        if (!pullInfoItem) {
          continue;
        }
        ret.push({
          id: +item.id,
          platform: item.platform,
          repoName: pullInfoItem.repoName,
          number: pullInfoItem.number,
          diff: item.diff,
          title: pullInfoItem.title,
          body: pullInfoItem.body,
        });
      }
      return ret;
    };

    const savePullRequests = async (pullRequests: Array<OutputPullRequest | null>) => {
      const pulls = pullRequests.filter(p => p !== null) as OutputPullRequest[];
      if (pulls.length === 0) {
        return;
      }
      await insertRecords(pulls.map(p => ({
        id: p.id,
        platform: p.platform,
        code_quality: p.codeQuality,
        pr_title_and_description_quality: p.titleDescQuality,
        pr_type: p.prType,
        value_level: p.valueLevel,
        primary_language: p.primaryLanguage,
        is_automatically_generated: p.isAutomaticallyGenerated,
        hostile_or_abuse: p.hostileOrAbuse,
        reasoning: p.reasoning,
      })), 'pull_info');
    };

    await createPullInfoTable();
    let pullRequests = await getPullRequests(batchSize);
    while (pullRequests.length > 0) {
      logger.info(`Found ${pullRequests.length} pull requests to analyze.`);
      const analyzedPullRequests = await runTasks(pullRequests.map(p => async () => {
        const outputPullRequest = await analyzePullRequest(p);
        return outputPullRequest;
      }), concurrentRequestNumber);
      await savePullRequests(analyzedPullRequests);
      pullRequests = await getPullRequests(batchSize);
    }

    logger.info('PullRequestAnalysisTask done.');
  }
};

module.exports = task;
