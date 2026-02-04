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

/**
 * Process GitLab user/actor
 * GitLab uses id (gid) instead of databaseId
 */
export const processActor = (actor: any) => {
  if (!actor) {
    return {
      actor_id: 0,
      actor_login: '',
    };
  }

  // GitLab user has id (gid) and username
  const actorId = actor.id ? parseInt(actor.id.replace('gid://gitlab/User/', '')) : 0;
  const actorLogin = actor.username || actor.name || '';

  return {
    actor_id: actorId,
    actor_login: actorLogin,
  };
};

/**
 * Extract numeric ID from GitLab GID
 */
export const extractIdFromGid = (gid: string): number => {
  if (!gid) return 0;
  const match = gid.match(/\d+$/);
  return match ? parseInt(match[0]) : 0;
};
