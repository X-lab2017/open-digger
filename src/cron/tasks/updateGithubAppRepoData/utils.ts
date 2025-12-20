export interface InsertRecord {
  platform: string;

  type: string;
  action: string;

  actor_id: number;
  actor_login: string;
  repo_id: number;
  repo_name: string;
  org_id: number;
  org_login: string;
  created_at?: string;

  issue_id: number;
  issue_number: number;
  issue_title?: string;
  body?: string;

  'issue_labels.name'?: string[];
  'issue_labels.color'?: string[];
  'issue_labels.default'?: number[];
  'issue_labels.description'?: string[];

  issue_author_id?: number;
  issue_author_login?: string;
  issue_created_at?: string;
  issue_closed_at?: string;
  issue_closed_by_pull_request_numbers?: number[];

  issue_comment_id?: number;

  pull_review_comment_id?: number;

  pull_merged?: number;
  pull_additions?: number;
  pull_deletions?: number;
  pull_base_ref?: string;
  pull_head_repo_id?: number;
  pull_head_ref?: string;

  from_api?: number;
}

export const processActor = (actor: any) => {
  return {
    actor_id: actor.databaseId,
    actor_login: actor.__typename === 'User' ? actor.login : actor.login + '[bot]',
  };
};
