import { query } from "../../../db/clickhouse";

export interface InsertRecord {
  repo_id: number;
  repo_name: string;
  org_id: number;
  org_login: string;
  actor_id: number;
  actor_login: string;
  type: string;
  action: string;
  issue_number: number;
  issue_id: number;
  issue_author_id?: number;
  issue_author_login?: string;
  issue_closed_by_pull_request_numbers?: number[];
  issue_comment_id?: number;
  pull_review_comment_id?: number;
  pull_merged?: number;
  title?: string;
  body?: string;
  created_at?: string;
}

export const createGithubAppRepoDataTable = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS github_app_repo_data (
      repo_id UInt64,
      repo_name LowCardinality(String),
      org_id UInt64,
      org_login LowCardinality(String),
      actor_id UInt64,
      actor_login LowCardinality(String),
      type Enum8('IssueCommentEvent' = 6, 'IssuesEvent' = 7, 'PullRequestEvent' = 10, 'PullRequestReviewCommentEvent' = 11, 'IssuesReactionEvent' = 16, 'IssueCommentsReactionEvent' = 17),
      action LowCardinality(String),
      issue_number UInt32,
      issue_id UInt64,
      issue_author_id UInt64,
      issue_author_login LowCardinality(String),
      issue_closed_by_pull_request_numbers Array(UInt32),
      issue_comment_id UInt64,
      pull_review_comment_id UInt64,
      pull_merged UInt8,
      title String,
      body String,
      created_at DateTime
    )
    ENGINE = ReplacingMergeTree
    ORDER BY (repo_id, issue_id, issue_comment_id, pull_review_comment_id, type, action)
    SETTINGS index_granularity = 8192
  `;
  await query(createTableQuery);
};
