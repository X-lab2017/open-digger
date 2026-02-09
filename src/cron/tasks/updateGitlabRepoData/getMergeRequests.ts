import { formatDate, getLogger } from "../../../utils";
import { InsertRecord, processActor, extractIdFromGid } from "./utils";
import { GraphqlClient } from "./getClient";

// since query will recursively get comments and events for every merge request
// need to limit the number of merge requests to query at once to a small number to avoid rate limit error in a single query
const batchCount = 30;
const logger = getLogger('UpdateGitlabRepoDataTask[GetMergeRequests]');

const getMoreNotes = async (client: GraphqlClient, projectPath: string, mrIid: string, after?: string): Promise<any[]> => {
  if (!after) return [];
  const q = `
    query getMoreNotes($projectPath: ID!, $mrIid: String!, $count: Int!, $after: String!) {
      project(fullPath: $projectPath) {
        mergeRequest(iid: $mrIid) {
          notes(first: $count, after: $after) {
            pageInfo {
              hasNextPage
              endCursor
            }
            nodes {
              id
              createdAt
              body
              author {
                id
                username
                name
              }
            }
          }
        }
      }
    }
  `;

  const result = await client(q, { projectPath, mrIid, after, count: batchCount });
  const notes = result.project?.mergeRequest?.notes?.nodes || [];
  if (result.project?.mergeRequest?.notes?.pageInfo?.hasNextPage) {
    notes.push(...await getMoreNotes(client, projectPath, mrIid, result.project.mergeRequest.notes.pageInfo.endCursor));
  }
  return notes;
};

const getMergeRequestsBatch = async (client: GraphqlClient, projectPath: string, projectId: number, namespaceId: number, namespaceName: string, after?: string): Promise<{ events: InsertRecord[], hasNextPage: boolean, endCursor?: string }> => {
  const q = `
    query getMergeRequests($projectPath: ID!, $after: String, $count: Int!) {
      project(fullPath: $projectPath) {
        id
        mergeRequests(first: $count, after: $after, sort: UPDATED_ASC) {
          pageInfo {
            hasNextPage
            endCursor
          }
          nodes {
            id
            iid
            title
            description
            createdAt
            updatedAt
            closedAt
            mergedAt
            state
            sourceBranch
            targetBranch
            diffStats {
              additions
              deletions
            }
            sourceProject {
              id
            }
            labels(first: 10) {
              nodes {
                id
                title
                color
                description
              }
            }
            author {
              id
              username
              name
            }
            mergeUser {
              id
              username
              name
            }
            notes(first: $count) {
              pageInfo {
                hasNextPage
                endCursor
              }
              nodes {
                id
                createdAt
                body
                author {
                  id
                  username
                  name
                }
              }
            }
          }
        }
      }
    }
  `;

  const result = await client(q, { projectPath, after, count: batchCount });
  const events: InsertRecord[] = [];

  if (!result.project || !result.project.mergeRequests) {
    return { events, hasNextPage: false };
  }

  const mergeRequests = result.project.mergeRequests.nodes || [];

  for (const mr of mergeRequests) {
    if (!mr.author) {
      continue;
    }

    const author = processActor(mr.author);
    const mrId = extractIdFromGid(mr.id);
    const mrNumber = parseInt(mr.iid);
    const sourceProjectId = mr.sourceProject ? extractIdFromGid(mr.sourceProject.id) : 0;

    const baseMrItem: InsertRecord = {
      platform: 'GitLab',
      repo_id: projectId,
      repo_name: projectPath,
      org_id: namespaceId,
      org_login: namespaceName,
      actor_id: 0,
      actor_login: '',
      type: '',
      action: '',
      issue_author_id: author.actor_id,
      issue_author_login: author.actor_login,
      issue_id: mrId,
      issue_number: mrNumber,
      issue_title: mr.title,
      issue_created_at: formatDate(mr.createdAt),
      issue_closed_at: mr.closedAt ? formatDate(mr.closedAt) : undefined,
      body: mr.description,
      pull_additions: mr.diffStats?.additions || 0,
      pull_deletions: mr.diffStats?.deletions || 0,
      pull_base_ref: mr.targetBranch,
      pull_head_ref: mr.sourceBranch,
      pull_head_repo_id: sourceProjectId,
      "issue_labels.name": mr.labels?.nodes?.map((l: any) => l.title) || [],
      "issue_labels.color": mr.labels?.nodes?.map((l: any) => l.color) || [],
      "issue_labels.default": mr.labels?.nodes?.map(() => 0) || [],
      "issue_labels.description": mr.labels?.nodes?.map((l: any) => l.description || '') || [],
    };

    // MR opened event
    events.push({
      ...baseMrItem,
      ...author,
      type: 'PullRequestEvent',
      action: 'opened',
      created_at: formatDate(mr.createdAt),
    });

    // MR merged event
    if (mr.state === 'merged' && mr.mergedAt && mr.mergeUser) {
      const mergeUser = processActor(mr.mergeUser);
      if (mergeUser && mergeUser.actor_id !== 0) {
        events.push({
          ...baseMrItem,
          ...mergeUser,
          type: 'PullRequestEvent',
          action: 'closed',
          pull_merged: 1,
          created_at: formatDate(mr.mergedAt),
        });
      }
    }
    // MR closed event (not merged)
    else if (mr.state === 'closed' && mr.closedAt) {
      events.push({
        ...baseMrItem,
        ...author,
        type: 'PullRequestEvent',
        action: 'closed',
        created_at: formatDate(mr.closedAt),
      });
    }

    // MR notes (treated as review comment events)
    let notes = mr.notes?.nodes || [];
    if (mr.notes?.pageInfo?.hasNextPage) {
      notes.push(...await getMoreNotes(client, projectPath, mr.iid, mr.notes.pageInfo.endCursor));
    }

    for (const note of notes) {
      if (!note.author) {
        continue;
      }
      const noteAuthor = processActor(note.author);
      if (noteAuthor && noteAuthor.actor_id !== 0) {
        events.push({
          ...baseMrItem,
          ...noteAuthor,
          type: 'PullRequestReviewCommentEvent',
          action: 'created',
          issue_comment_id: extractIdFromGid(note.id),
          pull_review_comment_id: extractIdFromGid(note.id),
          body: note.body,
          created_at: formatDate(note.createdAt),
        });
      }
    }
  }

  return {
    events,
    hasNextPage: result.project.mergeRequests.pageInfo.hasNextPage,
    endCursor: result.project.mergeRequests.pageInfo.endCursor,
  };
};

export const getMergeRequests = async (client: GraphqlClient, projectPath: string, projectId: number, namespaceId: number, namespaceName: string, after?: string): Promise<{ events: InsertRecord[], endCursor?: string, finished: boolean }> => {
  const allEvents: InsertRecord[] = [];
  let currentAfter = after;
  let hasNextPage = true;
  let finished = true;

  while (hasNextPage && allEvents.length < batchCount * 100) {
    try {
      const batch = await getMergeRequestsBatch(client, projectPath, projectId, namespaceId, namespaceName, currentAfter);
      allEvents.push(...batch.events);
      hasNextPage = batch.hasNextPage;
      currentAfter = batch.endCursor;
    }
    catch (error: any) {
      logger.error(`Error getting merge requests: projectPath=${projectPath}, projectId=${projectId}, currentAfter=${currentAfter}, error=${error.message || error}`);
      finished = false;
      break;
    }
  }

  return { events: allEvents, endCursor: currentAfter, finished };
};
