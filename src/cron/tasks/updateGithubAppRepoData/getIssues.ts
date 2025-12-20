import { formatDate } from "../../../utils";
import { InsertRecord } from "./utils";
import { getGraphqlClient } from "./getClient";
import { processActor } from "./utils";

// since query will recursively get comments and events for every issue
// need to limit the number of issues to query at once to a small number to avoid rate limit error in a single query
const batchCount = 30;
// API rate limit cost for a single query
let MAX_COST = 1000;

const getMoreEvents = async (cost: { value: number }, repoId: number, installationId: number, owner: string, repo: string, number: number, after?: string): Promise<any[]> => {
  if (!after) return [];
  const query = await getGraphqlClient(installationId, repoId);
  const q = `
    query getMoreEvents($owner: String!, $repo: String!, $number: Int!, $count: Int!, $after: String!) {
      rateLimit {
        cost
      }
      repository(owner: $owner, name: $repo) {
        issue(number: $number) {
          timelineItems(itemTypes: [CLOSED_EVENT, ISSUE_COMMENT], first: $count, after: $after) {
            pageInfo {
              hasNextPage
              endCursor
            }
            nodes {
              ... on ClosedEvent {
                __typename
                createdAt
                actor {
                  ... on User {
                    __typename
                    databaseId
                    login
                  }
                  ... on Bot {
                    __typename
                    databaseId
                    login
                  }
                }
              }
              ... on IssueComment {
                __typename
                databaseId
                createdAt
                body
                author {
                  ... on User {
                    __typename
                    databaseId
                    login
                  }
                  ... on Bot {
                    __typename
                    databaseId
                    login
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  const result = await query(q, { owner, repo, after, number, count: batchCount });
  cost.value += result.rateLimit.cost;
  const events = result.repository.issue.timelineItems.nodes;
  if (result.repository.issue.timelineItems.pageInfo.hasNextPage) {
    events.push(...await getMoreEvents(cost, repoId, installationId, owner, repo, number, result.repository.issue.timelineItems.pageInfo.endCursor));
  }
  return events;
};


const getMoreReactions = async (cost: { value: number }, repoId: number, installationId: number, owner: string, repo: string, number: number, after?: string): Promise<any[]> => {
  if (!after) return [];
  const query = await getGraphqlClient(installationId, repoId);
  const q = `
    query getMoreReactions($owner: String!, $repo: String!, $number: Int!, $count: Int!, $after: String!) {
      rateLimit {
        cost
      }
      repository(owner: $owner, name: $repo) {
        issue(number: $number) {
          reactions(first: $count, after: $after) {
            pageInfo {
              hasNextPage
              endCursor
            }
            nodes {
              content
              createdAt
              databaseId
              user {
                databaseId
                login
              }
            }
          }
        }
      }
    }
  `;

  const result = await query(q, { owner, repo, number, after, count: batchCount });
  cost.value += result.rateLimit.cost;
  const events = result.repository.issue.reactions.nodes;
  if (result.repository.issue.reactions.pageInfo.hasNextPage) {
    events.push(...await getMoreReactions(cost, repoId, installationId, owner, repo, number, result.repository.issue.reactions.pageInfo.endCursor));
  }
  return events;
};

const getIssuesBatch = async (cost: { value: number }, repoId: number, installationId: number, owner: string, repo: string, after?: string): Promise<{ events: InsertRecord[], hasNextPage: boolean, endCursor?: string }> => {
  const query = await getGraphqlClient(installationId, repoId);
  const q = `
    query getIssues($owner: String!, $repo: String!, $after: String, $count: Int!) {
      rateLimit {
        cost
      }
      repository(owner: $owner, name: $repo) {
        owner {
          ... on Organization {
            __typename
            databaseId
            login
          }
        }
        issues(first: $count, after: $after, orderBy: { field: UPDATED_AT, direction: ASC }) {
          pageInfo {
            hasNextPage
            endCursor
          }
          nodes {
            databaseId
            number
            title
            body
            createdAt
            closedAt
            labels(first: 10) {
              nodes {
                name
                color
                isDefault
                description
              }
            }
            author {
              ... on User {
                __typename
                databaseId
                login
              }
              ... on Bot {
                __typename
                databaseId
                login
              }
            }
            closedByPullRequestsReferences(first: $count, includeClosedPrs: true, userLinkedOnly: true) {
              nodes {
                number
              }
            }
            reactions(first: $count) {
              pageInfo {
                hasNextPage
                endCursor
              }
              nodes {
                content
                createdAt
                databaseId
                user {
                  databaseId
                  login
                }
              }
            }
            timelineItems(itemTypes: [CLOSED_EVENT, ISSUE_COMMENT], first: $count) {
              pageInfo {
                hasNextPage
                endCursor
              }
              nodes {
                ... on ClosedEvent {
                  __typename
                  createdAt
                  actor {
                    ... on User {
                      __typename
                      databaseId
                      login
                    }
                    ... on Bot {
                      __typename
                      databaseId
                      login
                    }
                  }
                }
                ... on IssueComment {
                  __typename
                  databaseId
                  createdAt
                  body
                  author {
                    ... on User {
                      __typename
                      databaseId
                      login
                    }
                    ... on Bot {
                      __typename
                      databaseId
                      login
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `;
  const result = await query(q, { owner, repo, after, count: batchCount });
  const events: InsertRecord[] = [];
  cost.value += result.rateLimit.cost;

  const orgId = result.repository.owner.__typename === 'Organization' ? result.repository.owner.databaseId : 0;
  const orgLogin = result.repository.owner.__typename === 'Organization' ? result.repository.owner.login : '';
  for (const issue of result.repository.issues.nodes) {
    if (!issue.author) {
      continue;
    }
    const issueAuthor = processActor(issue.author);
    const baseIssueItem: InsertRecord = {
      platform: 'GitHub',
      repo_id: repoId,
      repo_name: `${owner}/${repo}`,
      org_id: orgId,
      org_login: orgLogin,
      actor_id: 0,
      actor_login: '',
      type: '',
      action: '',
      issue_id: issue.databaseId,
      issue_number: issue.number,
      issue_title: issue.title,
      issue_author_id: issueAuthor.actor_id,
      issue_author_login: issueAuthor.actor_login,
      body: issue.body,
      issue_created_at: formatDate(issue.createdAt),
      issue_closed_at: issue.closedAt ? formatDate(issue.closedAt) : undefined,
      "issue_labels.name": issue.labels.nodes.map(l => l.name),
      "issue_labels.color": issue.labels.nodes.map(l => l.color),
      "issue_labels.default": issue.labels.nodes.map(l => l.isDefault ? 1 : 0),
      "issue_labels.description": issue.labels.nodes.map(l => l.description),
      issue_closed_by_pull_request_numbers: issue.closedByPullRequestsReferences.nodes.map(pr => pr.number),
    };
    events.push({
      ...baseIssueItem,
      ...processActor(issue.author),
      type: 'IssuesEvent',
      action: 'opened',
      created_at: formatDate(issue.createdAt),
    });
    const reactions = issue.reactions.nodes;
    if (issue.reactions.pageInfo.hasNextPage) {
      reactions.push(...await getMoreReactions(cost, repoId, installationId, owner, repo, issue.number, issue.reactions.pageInfo.endCursor));
    }
    for (const reaction of reactions) {
      if (!reaction.user) {
        continue;
      }
      events.push({
        ...baseIssueItem,
        actor_login: reaction.user.login,
        actor_id: reaction.user.databaseId,
        type: 'IssuesReactionEvent',
        action: reaction.content,
        body: reaction.content,
        created_at: formatDate(reaction.createdAt),
      });
    }
    const issueEvents = issue.timelineItems.nodes;
    if (issue.timelineItems.pageInfo.hasNextPage) {
      issueEvents.push(...await getMoreEvents(cost, repoId, installationId, owner, repo, issue.number, issue.timelineItems.pageInfo.endCursor));
    }
    for (const event of issueEvents) {
      if (event.__typename === 'ClosedEvent') {
        if (!event.actor) {
          continue;
        }
        events.push({
          ...baseIssueItem,
          ...processActor(event.actor),
          type: 'IssuesEvent',
          action: 'closed',
          created_at: formatDate(event.createdAt),
        });
      } else {
        if (!event.author) {
          continue;
        }
        events.push({
          ...baseIssueItem,
          ...processActor(event.author),
          type: 'IssueCommentEvent',
          action: 'created',
          issue_comment_id: event.databaseId,
          body: event.body,
          created_at: formatDate(event.createdAt),
        });
      }
    }
  }

  return {
    events,
    hasNextPage: result.repository.issues.pageInfo.hasNextPage,
    endCursor: result.repository.issues.pageInfo.endCursor,
  };
};

export const getIssues = async (repoId: number, installationId: number, owner: string, repo: string, after?: string): Promise<{ events: InsertRecord[], endCursor?: string, finished: boolean, cost: number }> => {
  const allEvents: InsertRecord[] = [];
  let currentAfter = after;
  let hasNextPage = true;
  let finished = true;
  const cost = { value: 0 };

  while (hasNextPage) {
    if (cost.value >= MAX_COST) {
      finished = false;
      break;
    }
    try {
      const batch = await getIssuesBatch(cost, repoId, installationId, owner, repo, currentAfter);
      allEvents.push(...batch.events);
      hasNextPage = batch.hasNextPage;
      currentAfter = batch.endCursor;
    }
    catch (error) {
      console.error(`Error getting issues: repoId=${repoId}, installationId=${installationId}, owner=${owner}, repo=${repo}, currentAfter=${currentAfter}, error=${error}`);
      finished = false;
      break;
    }
  }

  return { events: allEvents, endCursor: currentAfter, finished, cost: cost.value };
};
