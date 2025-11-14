import { formatDate } from "../../../utils";
import { InsertRecord } from "./createTable";
import { getGraphqlClient } from "./getClient";
import { processActor } from "./utils";

const batchCount = 50;

const timelineItems = `
... on MergedEvent {
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
... on PullRequestReview {
  __typename
  comments(first: $count) {
    nodes {
      ... on PullRequestReviewComment {
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
... on PullRequestReviewThread {
  __typename
  comments(first: $count) {
    nodes {
      ... on PullRequestReviewComment {
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
`;

const getMoreEvents = async (repoId: number, installationId: number, owner: string, repo: string, number: number, since: string, after?: string): Promise<any[]> => {
  if (!after) return [];
  const query = await getGraphqlClient(installationId, repoId);
  const q = `
    query getMoreEvents($owner: String!, $repo: String!, $number: Int!, $count: Int!, $since: DateTime!, $after: String!) {
      repository(owner: $owner, name: $repo) {
        pullRequest(number: $number) {
          timelineItems(itemTypes: [MERGED_EVENT, CLOSED_EVENT, ISSUE_COMMENT, PULL_REQUEST_REVIEW, PULL_REQUEST_REVIEW_THREAD], first: $count, since: $since, after: $after) {
            pageInfo {
              hasNextPage
              endCursor
            }
            nodes {
              ${timelineItems}
            }
          }
        }
      }
    }
  `;

  const result = await query(q, { owner, repo, since: new Date(since).toISOString(), after, number, count: batchCount });
  const events = result.repository.pullRequest.timelineItems.nodes;
  if (result.repository.pullRequest.timelineItems.pageInfo.hasNextPage) {
    events.push(...await getMoreEvents(repoId, installationId, owner, repo, number, since, result.repository.pullRequest.timelineItems.pageInfo.endCursor));
  }
  return events;
};


const getMoreReactions = async (repoId: number, installationId: number, owner: string, repo: string, number: number, after?: string): Promise<any[]> => {
  if (!after) return [];
  const query = await getGraphqlClient(installationId, repoId);
  const q = `
    query getMoreReactions($owner: String!, $repo: String!, $number: Int!, $count: Int!, $after: String!) {
      repository(owner: $owner, name: $repo) {
        pullRequest(number: $number) {
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
  const reactions = result.repository.pullRequest.reactions.nodes;
  if (result.repository.pullRequest.reactions.pageInfo.hasNextPage) {
    reactions.push(...await getMoreReactions(repoId, installationId, owner, repo, number, result.repository.pullRequest.reactions.pageInfo.endCursor));
  }
  return reactions;
};

export const getPulls = async (repoId: number, installationId: number, owner: string, repo: string, since: string, after?: string): Promise<InsertRecord[]> => {
  const query = await getGraphqlClient(installationId, repoId);
  const sinceDate = new Date(since);
  const q = `
    query getPulls($owner: String!, $repo: String!, $since: DateTime!, $after: String, $count: Int!) {
      repository(owner: $owner, name: $repo) {
        owner {
          ... on Organization {
            __typename
            databaseId
            login
          }
        }
        pullRequests(first: $count, orderBy: { field: UPDATED_AT, direction: DESC }, after: $after) {
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
            updatedAt
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
            timelineItems(itemTypes: [MERGED_EVENT, CLOSED_EVENT, ISSUE_COMMENT, PULL_REQUEST_REVIEW, PULL_REQUEST_REVIEW_THREAD], first: $count, since: $since) {
              pageInfo {
                hasNextPage
                endCursor
              }
              nodes {
                ${timelineItems}
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
  for (const pullRequest of result.repository.pullRequests.nodes) {
    if (new Date(pullRequest.updatedAt) < sinceDate) {
      break;
    }
    if (!pullRequest.author) {
      continue;
    }
    if (new Date(pullRequest.createdAt) >= sinceDate) {
      events.push({
        platform: 'GitHub',
        repo_id: repoId,
        repo_name: `${owner}/${repo}`,
        org_id: orgId,
        org_login: orgLogin,
        ...processActor(pullRequest.author),
        type: 'PullRequestEvent',
        action: 'opened',
        issue_id: pullRequest.databaseId,
        issue_number: pullRequest.number,
        issue_title: pullRequest.title,
        body: pullRequest.body,
        created_at: formatDate(pullRequest.createdAt),
      });
      const reactions = pullRequest.reactions.nodes;
      if (pullRequest.reactions.pageInfo.hasNextPage) {
        reactions.push(...await getMoreReactions(repoId, installationId, owner, repo, pullRequest.number, pullRequest.reactions.pageInfo.endCursor));
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
          issue_id: pullRequest.databaseId,
          issue_number: pullRequest.number,
          body: reaction.content,
          created_at: formatDate(reaction.createdAt),
        });
      }
      const pullRequestEvents = pullRequest.timelineItems.nodes;
      if (pullRequest.timelineItems.pageInfo.hasNextPage) {
        pullRequestEvents.push(...await getMoreEvents(repoId, installationId, owner, repo, pullRequest.number, since, pullRequest.timelineItems.pageInfo.endCursor));
      }
      for (const event of pullRequestEvents) {
        if (event.__typename === 'ClosedEvent') {
          if (!event.actor) {
            continue;
          }
          const pullRequestAuthor = processActor(pullRequest.author);
          events.push({
            platform: 'GitHub',
            repo_id: repoId,
            repo_name: `${owner}/${repo}`,
            org_id: orgId,
            org_login: orgLogin,
            ...processActor(event.actor),
            issue_author_id: pullRequestAuthor.actor_id,
            issue_author_login: pullRequestAuthor.actor_login,
            type: 'PullRequestEvent',
            action: 'closed',
            issue_id: pullRequest.databaseId,
            issue_number: pullRequest.number,
            created_at: formatDate(event.createdAt),
          });
        } else if (event.__typename === 'MergedEvent') {
          if (!event.actor) {
            continue;
          }
          const pullRequestAuthor = processActor(pullRequest.author);
          events.push({
            platform: 'GitHub',
            repo_id: repoId,
            repo_name: `${owner}/${repo}`,
            org_id: orgId,
            org_login: orgLogin,
            ...processActor(event.actor),
            issue_author_id: pullRequestAuthor.actor_id,
            issue_author_login: pullRequestAuthor.actor_login,
            type: 'PullRequestEvent',
            action: 'closed',
            pull_merged: 1,
            issue_id: pullRequest.databaseId,
            issue_number: pullRequest.number,
            created_at: formatDate(event.createdAt),
          });
        } else if (event.__typename === 'PullRequestReview' || event.__typename === 'PullRequestReviewThread') {
          for (const comment of event.comments.nodes) {
            if (!comment.author) {
              continue;
            }
            events.push({
              platform: 'GitHub',
              repo_id: repoId,
              repo_name: `${owner}/${repo}`,
              org_id: orgId,
              org_login: orgLogin,
              ...processActor(comment.author),
              type: 'PullRequestReviewCommentEvent',
              action: 'created',
              issue_id: pullRequest.databaseId,
              issue_number: pullRequest.number,
              pull_review_comment_id: comment.databaseId,
              body: comment.body,
              created_at: formatDate(comment.createdAt),
            });
          }
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
            issue_id: pullRequest.databaseId,
            issue_number: pullRequest.number,
            issue_comment_id: event.databaseId,
            body: event.body,
            created_at: formatDate(event.createdAt),
          });
        }
      }
    }
  }

  if (result.repository.pullRequests.pageInfo.hasNextPage && new Date(result.repository.pullRequests.nodes[result.repository.pullRequests.nodes.length - 1].updatedAt) >= sinceDate) {
    events.push(...await getPulls(repoId, installationId, owner, repo, since, result.repository.pullRequests.pageInfo.endCursor));
  }

  return events;
};
