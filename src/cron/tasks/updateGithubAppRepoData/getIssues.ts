import { formatDate } from "../../../utils";
import { InsertRecord } from "./createTable";
import { getGraphqlClient } from "./getClient";
import { processActor } from "./utils";

// since query will recursively get comments and events for every issue
// need to limit the number of issues to query at once to a small number to avoid rate limit error in a single query
const batchCount = 30;

const getMoreEvents = async (repoId: number, installationId: number, owner: string, repo: string, number: number, since: string, after?: string): Promise<any[]> => {
  if (!after) return [];
  const query = await getGraphqlClient(installationId, repoId);
  const q = `
    query getMoreEvents($owner: String!, $repo: String!, $number: Int!, $count: Int!, $since: DateTime!, $after: String!) {
      repository(owner: $owner, name: $repo) {
        issue(number: $number) {
          timelineItems(itemTypes: [CLOSED_EVENT, ISSUE_COMMENT], first: $count, since: $since, after: $after) {
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

  const result = await query(q, { owner, repo, since: new Date(since).toISOString(), after, number, count: batchCount });
  const events = result.repository.issue.timelineItems.nodes;
  if (result.repository.issue.timelineItems.pageInfo.hasNextPage) {
    events.push(...await getMoreEvents(repoId, installationId, owner, repo, number, since, result.repository.issue.timelineItems.pageInfo.endCursor));
  }
  return events;
};


const getMoreReactions = async (repoId: number, installationId: number, owner: string, repo: string, number: number, after?: string): Promise<any[]> => {
  if (!after) return [];
  const query = await getGraphqlClient(installationId, repoId);
  const q = `
    query getMoreReactions($owner: String!, $repo: String!, $number: Int!, $count: Int!, $after: String!) {
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
  const events = result.repository.issue.reactions.nodes;
  if (result.repository.issue.reactions.pageInfo.hasNextPage) {
    events.push(...await getMoreReactions(repoId, installationId, owner, repo, number, result.repository.issue.reactions.pageInfo.endCursor));
  }
  return events;
};

export const getIssues = async (repoId: number, installationId: number, owner: string, repo: string, since: string, after?: string): Promise<InsertRecord[]> => {
  const query = await getGraphqlClient(installationId, repoId);
  const sinceDate = new Date(since);
  const q = `
    query getIssues($owner: String!, $repo: String!, $since: DateTime!, $after: String, $count: Int!) {
      repository(owner: $owner, name: $repo) {
        owner {
          ... on Organization {
            __typename
            databaseId
            login
          }
        }
        issues(filterBy: { since: $since }, first: $count, after: $after, orderBy: { field: UPDATED_AT, direction: DESC }) {
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
            timelineItems(itemTypes: [CLOSED_EVENT, ISSUE_COMMENT], first: $count, since: $since) {
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
  const result = await query(q, { owner, repo, since: sinceDate.toISOString(), after, count: batchCount });
  const events: InsertRecord[] = [];

  const orgId = result.repository.owner.__typename === 'Organization' ? result.repository.owner.databaseId : 0;
  const orgLogin = result.repository.owner.__typename === 'Organization' ? result.repository.owner.login : '';
  for (const issue of result.repository.issues.nodes) {
    if (!issue.author) {
      continue;
    }
    if (new Date(issue.createdAt) >= sinceDate) {
      events.push({
        platform: 'GitHub',
        repo_id: repoId,
        repo_name: `${owner}/${repo}`,
        org_id: orgId,
        org_login: orgLogin,
        ...processActor(issue.author),
        type: 'IssuesEvent',
        action: 'opened',
        issue_id: issue.databaseId,
        issue_number: issue.number,
        issue_title: issue.title,
        body: issue.body,
        created_at: formatDate(issue.createdAt),
      });
      const reactions = issue.reactions.nodes;
      if (issue.reactions.pageInfo.hasNextPage) {
        reactions.push(...await getMoreReactions(repoId, installationId, owner, repo, issue.number, issue.reactions.pageInfo.endCursor));
      }
      for (const reaction of reactions) {
        if (!reaction.user) {
          continue;
        }
        events.push({
          platform: 'GitHub',
          repo_id: repoId,
          repo_name: `${owner}/${repo}`,
          org_id: orgId,
          org_login: orgLogin,
          actor_login: reaction.user.login,
          actor_id: reaction.user.databaseId,
          type: 'IssuesReactionEvent',
          action: 'created',
          issue_id: issue.databaseId,
          issue_number: issue.number,
          body: reaction.content,
          created_at: formatDate(reaction.createdAt),
        });
      }
      const issueEvents = issue.timelineItems.nodes;
      if (issue.timelineItems.pageInfo.hasNextPage) {
        issueEvents.push(...await getMoreEvents(repoId, installationId, owner, repo, issue.number, since, issue.timelineItems.pageInfo.endCursor));
      }
      for (const event of issueEvents) {
        if (event.__typename === 'ClosedEvent') {
          if (!event.actor) {
            continue;
          }
          const issueAuthor = processActor(issue.author);
          events.push({
            platform: 'GitHub',
            repo_id: repoId,
            repo_name: `${owner}/${repo}`,
            org_id: orgId,
            org_login: orgLogin,
            ...processActor(event.actor),
            issue_author_id: issueAuthor.actor_id,
            issue_author_login: issueAuthor.actor_login,
            type: 'IssuesEvent',
            action: 'closed',
            issue_id: issue.databaseId,
            issue_number: issue.number,
            issue_closed_by_pull_request_numbers: issue.closedByPullRequestsReferences.nodes.map(pr => pr.number),
            created_at: formatDate(event.createdAt),
          });
        } else {
          if (!event.author) {
            continue;
          }
          events.push({
            platform: 'GitHub',
            repo_id: repoId,
            repo_name: `${owner}/${repo}`,
            org_id: orgId,
            org_login: orgLogin,
            ...processActor(event.author),
            type: 'IssueCommentEvent',
            action: 'created',
            issue_id: issue.databaseId,
            issue_number: issue.number,
            issue_comment_id: event.databaseId,
            body: event.body,
            created_at: formatDate(event.createdAt),
          });
        }
      }
    }
  }

  if (result.repository.issues.pageInfo.hasNextPage) {
    events.push(...await getIssues(repoId, installationId, owner, repo, since, result.repository.issues.pageInfo.endCursor));
  }

  return events;
};
