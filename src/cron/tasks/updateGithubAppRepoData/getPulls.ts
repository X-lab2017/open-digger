import { formatDate, getLogger } from "../../../utils";
import { InsertRecord } from "./utils";
import { getGraphqlClient } from "./getClient";
import { processActor } from "./utils";

// since query will recursively get comments and events for every pull request
// need to limit the number of pull requests to query at once to a small number to avoid rate limit error in a single query
const batchCount = 30;
// API rate limit cost for a single query
let MAX_COST = 1000;
const logger = getLogger('UpdateGithubAppRepoDataTask[GetPulls]');

const timelineItems = `
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

const getMoreEvents = async (cost: { value: number }, repoId: number, installationId: number, owner: string, repo: string, number: number, after?: string): Promise<any[]> => {
  if (!after) return [];
  const query = await getGraphqlClient(installationId, repoId);
  const q = `
    query getMoreEvents($owner: String!, $repo: String!, $number: Int!, $count: Int!, $after: String!) {
      rateLimit {
        cost
      }
      repository(owner: $owner, name: $repo) {
        pullRequest(number: $number) {
          timelineItems(itemTypes: [CLOSED_EVENT, ISSUE_COMMENT, PULL_REQUEST_REVIEW, PULL_REQUEST_REVIEW_THREAD], first: $count, after: $after) {
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

  const result = await query(q, { owner, repo, after, number, count: batchCount });
  cost.value += result.rateLimit.cost;
  const events = result.repository.pullRequest.timelineItems.nodes;
  if (result.repository.pullRequest.timelineItems.pageInfo.hasNextPage) {
    events.push(...await getMoreEvents(cost, repoId, installationId, owner, repo, number, result.repository.pullRequest.timelineItems.pageInfo.endCursor));
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
  cost.value += result.rateLimit.cost;
  const reactions = result.repository.pullRequest.reactions.nodes;
  if (result.repository.pullRequest.reactions.pageInfo.hasNextPage) {
    reactions.push(...await getMoreReactions(cost, repoId, installationId, owner, repo, number, result.repository.pullRequest.reactions.pageInfo.endCursor));
  }
  return reactions;
};

const getPullsBatch = async (cost: { value: number }, repoId: number, installationId: number, owner: string, repo: string, after?: string): Promise<{ events: InsertRecord[], hasNextPage: boolean, endCursor?: string }> => {
  const query = await getGraphqlClient(installationId, repoId);
  const q = `
    query getPulls($owner: String!, $repo: String!, $after: String, $count: Int!) {
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
        pullRequests(first: $count, orderBy: { field: UPDATED_AT, direction: ASC }, after: $after) {
          pageInfo {
            hasNextPage
            endCursor
          }
          nodes {
            databaseId
            number
            title
            body
            additions
            deletions
            baseRefName
            headRefName
            headRepository {
              databaseId
            }
            labels(first: 10) {
              nodes {
                name
                color
                isDefault
                description
              }
            }
            createdAt
            updatedAt
            closedAt
            mergedAt
            mergedBy {
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
            timelineItems(itemTypes: [CLOSED_EVENT, ISSUE_COMMENT, PULL_REQUEST_REVIEW, PULL_REQUEST_REVIEW_THREAD], first: $count) {
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
  const result = await query(q, { owner, repo, after, count: batchCount });
  const events: InsertRecord[] = [];
  cost.value += result.rateLimit.cost;
  const orgId = result.repository.owner.__typename === 'Organization' ? result.repository.owner.databaseId : 0;
  const orgLogin = result.repository.owner.__typename === 'Organization' ? result.repository.owner.login : '';
  for (const pullRequest of result.repository.pullRequests.nodes) {
    if (!pullRequest.author) {
      continue;
    }
    const author = processActor(pullRequest.author);

    const basePullItem: InsertRecord = {
      platform: 'GitHub',
      repo_id: repoId,
      repo_name: `${owner}/${repo}`,
      org_id: orgId,
      org_login: orgLogin,
      actor_id: 0,
      actor_login: '',
      type: '',
      action: '',
      issue_author_id: author.actor_id,
      issue_author_login: author.actor_login,
      issue_id: pullRequest.databaseId,
      issue_number: pullRequest.number,
      issue_title: pullRequest.title,
      issue_created_at: formatDate(pullRequest.createdAt),
      issue_closed_at: pullRequest.closedAt ? formatDate(pullRequest.closedAt) : undefined,
      body: pullRequest.body,
      pull_additions: pullRequest.additions,
      pull_deletions: pullRequest.deletions,
      pull_base_ref: pullRequest.baseRefName,
      pull_head_ref: pullRequest.headRefName,
      pull_head_repo_id: pullRequest.headRepository?.databaseId ?? 0,
      "issue_labels.color": pullRequest.labels.nodes.map(l => l.color),
      "issue_labels.name": pullRequest.labels.nodes.map(l => l.name),
      "issue_labels.default": pullRequest.labels.nodes.map(l => l.isDefault ? 1 : 0),
      "issue_labels.description": pullRequest.labels.nodes.map(l => l.description),
    };
    events.push({
      ...basePullItem,
      ...author,
      type: 'PullRequestEvent',
      action: 'opened',
      created_at: formatDate(pullRequest.createdAt),
    });
    if (pullRequest.mergedAt && pullRequest.mergedBy) {
      events.push({
        ...basePullItem,
        ...processActor(pullRequest.mergedBy),
        type: 'PullRequestEvent',
        action: 'closed',
        pull_merged: 1,
        created_at: formatDate(pullRequest.mergedAt),
      });
    }
    const reactions = pullRequest.reactions.nodes;
    if (pullRequest.reactions.pageInfo.hasNextPage) {
      reactions.push(...await getMoreReactions(cost, repoId, installationId, owner, repo, pullRequest.number, pullRequest.reactions.pageInfo.endCursor));
    }
    for (const reaction of reactions) {
      if (!reaction.user) {
        continue;
      }
      events.push({
        ...basePullItem,
        actor_login: reaction.user.login,
        actor_id: reaction.user.databaseId,
        type: 'IssuesReactionEvent',
        action: reaction.content,
        created_at: formatDate(reaction.createdAt),
      });
    }
    const pullRequestEvents = pullRequest.timelineItems.nodes;
    if (pullRequest.timelineItems.pageInfo.hasNextPage) {
      pullRequestEvents.push(...await getMoreEvents(cost, repoId, installationId, owner, repo, pullRequest.number, pullRequest.timelineItems.pageInfo.endCursor));
    }
    for (const event of pullRequestEvents) {
      if (event.__typename === 'ClosedEvent') {
        if (!event.actor) {
          continue;
        }
        if (pullRequest.mergedAt && pullRequest.mergedBy) {
          continue;
        }
        events.push({
          ...basePullItem,
          ...processActor(event.actor),
          type: 'PullRequestEvent',
          action: 'closed',
          created_at: formatDate(event.createdAt),
        });
      } else if (event.__typename === 'PullRequestReview' || event.__typename === 'PullRequestReviewThread') {
        for (const comment of event.comments.nodes) {
          if (!comment.author) {
            continue;
          }
          events.push({
            ...basePullItem,
            ...processActor(comment.author),
            type: 'PullRequestReviewCommentEvent',
            action: 'created',
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
          ...basePullItem,
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
    hasNextPage: result.repository.pullRequests.pageInfo.hasNextPage,
    endCursor: result.repository.pullRequests.pageInfo.endCursor,
  };
};

export const getPulls = async (repoId: number, installationId: number, owner: string, repo: string, after?: string): Promise<{ events: InsertRecord[], endCursor?: string, finished: boolean, cost: number }> => {
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
      const batch = await getPullsBatch(cost, repoId, installationId, owner, repo, currentAfter);
      allEvents.push(...batch.events);
      hasNextPage = batch.hasNextPage;
      currentAfter = batch.endCursor;
    }
    catch (error) {
      logger.error(`Error getting pulls: repoId=${repoId}, installationId=${installationId}, owner=${owner}, repo=${repo}, currentAfter=${currentAfter}, error=${error}`);
      finished = false;
      break;
    }
  }

  return { events: allEvents, endCursor: currentAfter, finished, cost: cost.value };
};
