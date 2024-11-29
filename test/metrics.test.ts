const openDigger = require('../src/metrics/index');
import { existsSync, readFileSync } from 'fs';
import assert from "assert";
import _ from 'lodash';

function deepEqual(a: any, b: any): boolean {
  return _.isEqual(a, b);
}

async function validateData(
  apiFn: Function,
  subFileName: string,
  dataKey: string
) {
  const fileName = `test/testdata/${subFileName}/${dataKey}.json`;

  if (existsSync(fileName)) {
    const jsonData = JSON.parse(readFileSync(fileName).toString());

    const expectedData = jsonData[dataKey];
    const queryResultData = await apiFn(jsonData["modifiedOption"]);

    const expectedDataWithoutDetail = removeFields(expectedData);
    const queryResultDataWithoutDetail = removeFields(queryResultData);

    const equal = deepEqual(expectedDataWithoutDetail, queryResultDataWithoutDetail);

    if (!equal) {
      console.log(jsonData["modifiedOption"]);
      console.log(apiFn);
      console.log("expected data: ", JSON.stringify(expectedDataWithoutDetail));
      console.log("query result data: ", JSON.stringify(queryResultDataWithoutDetail));
    }
    assert(equal);
  }
  else {
    console.log(`File ${fileName} not found, because the option is not supported.`);
  }
}

function removeFields(data: any) {
  if (Array.isArray(data)) {
    return data.map((item) => removeFields(item));
  }

  if (typeof data === "object" && data !== null) {
    const newData: { [key: string]: any } = {};

    for (const key in data) {
      if (
        !['quantile_', 'detail', 'repos', 'orgs', 'developers', 'avg', 'levels', 'openrank', 'platform'].some(k => key.startsWith(k))) {
        newData[key] = removeFields(data[key]);
      }
    }

    return newData;
  }

  return data;
}

const orderOptions = ["DESC"];
const limitOptions = ["all"];
const limitOptions1 = [3];
const groupTimeRangeOptions = ["year", "quarter", "month"];
const groupByOptions = [null, "org"];


describe("Metrics tests", () => {
  before(function () {
    this.timeout(100000);
  });

  try {
    for (const order of orderOptions) {
      for (const limit of limitOptions1) {
        for (const limitOption of limitOptions) {
          for (const groupBy of groupByOptions) {
            for (const groupTimeRange of groupTimeRangeOptions) {
              // 调用 validateData
              it("should test issuesNew interface", async () => {
                const issues_new_file_name =
                  `issues_new_${order}_${limit}_${limitOption}_${groupBy}_${groupTimeRange}`.toLowerCase();
                await validateData(
                  openDigger.chaossIssuesNew,
                  "issues_new",
                  issues_new_file_name
                );
              });

              it("should test issuesClosed interface", async () => {
                const issues_closed_file_name =
                  `issues_closed_${order}_${limit}_${limitOption}_${groupBy}_${groupTimeRange}`.toLowerCase();
                await validateData(
                  openDigger.chaossIssuesClosed,
                  "issues_closed",
                  issues_closed_file_name
                );
              });

              it("should test busFactor interface", async () => {
                const bus_factor_file_name =
                  `bus_factor_${order}_${limit}_${limitOption}_${groupBy}_${groupTimeRange}`.toLowerCase();
                await validateData(
                  openDigger.chaossBusFactor,
                  "bus_factor",
                  bus_factor_file_name
                );
              });
              it("should test codeChangeCommits interface", async () => {
                const code_change_commits_file_name =
                  `code_change_commits_${order}_${limit}_${limitOption}_${groupBy}_${groupTimeRange}`.toLowerCase();
                await validateData(
                  openDigger.chaossCodeChangeCommits,
                  "code_change_commits",
                  code_change_commits_file_name
                );
              });

              it("should test issuesAndChangeRequestActive interface", async () => {
                const issues_and_change_request_active_file_name =
                  `issues_and_change_request_active_${order}_${limit}_${limitOption}_${groupBy}_${groupTimeRange}`.toLowerCase();
                await validateData(
                  openDigger.chaossIssuesAndChangeRequestActive,
                  "issues_and_change_request_active",
                  issues_and_change_request_active_file_name
                );
              });

              it("should test changeRequestsAccepted interface", async () => {
                const change_requests_accepted_file_name =
                  `change_requests_accepted_${order}_${limit}_${limitOption}_${groupBy}_${groupTimeRange}`.toLowerCase();
                await validateData(
                  openDigger.chaossChangeRequestsAccepted,
                  "change_requests_accepted",
                  change_requests_accepted_file_name
                );
              });

              it("should test changeRequestsDeclined interface", async () => {
                const change_requests_declined_file_name =
                  `change_requests_declined_${order}_${limit}_${limitOption}_${groupBy}_${groupTimeRange}`.toLowerCase();
                await validateData(
                  openDigger.chaossChangeRequestsDeclined,
                  "change_requests_declined",
                  change_requests_declined_file_name
                );
              });
              it("should test codeChangeLines interface", async () => {
                const code_change_lines_file_name =
                  `code_change_lines_${order}_${limit}_${limitOption}_${groupBy}_${groupTimeRange}`.toLowerCase();
                await validateData(
                  openDigger.chaossCodeChangeLines,
                  "code_change_lines",
                  code_change_lines_file_name
                );
              });
              it("should test technicalFork interface", async () => {
                const technical_fork_file_name =
                  `technical_fork_${order}_${limit}_${limitOption}_${groupBy}_${groupTimeRange}`.toLowerCase();
                await validateData(
                  openDigger.chaossTechnicalFork,
                  "technical_fork",
                  technical_fork_file_name
                );
              });
              it("should test issueAge interface", async () => {
                const issue_age_file_name =
                  `issue_age_${order}_${limit}_${limitOption}_${groupBy}_${groupTimeRange}`.toLowerCase();
                await validateData(
                  openDigger.chaossIssueAge,
                  "issue_age",
                  issue_age_file_name
                );
              });
              it("should test changeRequestAge interface", async () => {
                const change_request_age_file_name =
                  `change_request_age_${order}_${limit}_${limitOption}_${groupBy}_${groupTimeRange}`.toLowerCase();
                await validateData(
                  openDigger.chaossChangeRequestAge,
                  "change_request_age",
                  change_request_age_file_name
                );
              });
              it("should test repoActiveDatesAndTimes interface", async () => {
                const repo_active_dates_and_times_file_name =
                  `repo_active_dates_and_times_${order}_${limit}_${limitOption}_${groupBy}_${groupTimeRange}`.toLowerCase();
                await validateData(
                  openDigger.chaossRepoActiveDatesAndTimes,
                  "repo_active_dates_and_times",
                  repo_active_dates_and_times_file_name
                );
              });
              it("should test userActiveDatesAndTimes interface", async () => {
                const user_active_dates_and_times_file_name =
                  `user_active_dates_and_times_${order}_${limit}_${limitOption}_${groupBy}_${groupTimeRange}`.toLowerCase();
                await validateData(
                  openDigger.chaossUserActiveDatesAndTimes,
                  "user_active_dates_and_times",
                  user_active_dates_and_times_file_name
                );
              });
              it("should test issueResolutionDuration interface", async () => {
                const issue_resolution_duration_file_name =
                  `issue_resolution_duration_${order}_${limit}_${limitOption}_${groupBy}_${groupTimeRange}`.toLowerCase();
                await validateData(
                  openDigger.chaossIssueResolutionDuration,
                  "issue_resolution_duration",
                  issue_resolution_duration_file_name
                );
              });
              it("should test changeRequestResolutionDuration interface", async () => {
                const change_request_resolution_duration_file_name =
                  `change_request_resolution_duration_${order}_${limit}_${limitOption}_${groupBy}_${groupTimeRange}`.toLowerCase();
                await validateData(
                  openDigger.chaossChangeRequestResolutionDuration,
                  "change_request_resolution_duration",
                  change_request_resolution_duration_file_name
                );
              });
              it("should test changeRequestsDuration interface", async () => {
                const change_requests_duration_file_name =
                  `change_requests_duration_${order}_${limit}_${limitOption}_${groupBy}_${groupTimeRange}`.toLowerCase();
                await validateData(
                  openDigger.chaossChangeRequestsDuration,
                  "change_requests_duration",
                  change_requests_duration_file_name
                );
              });
              it("should test newContributors interface", async () => {
                const new_contributors_file_name =
                  `new_contributors_${order}_${limit}_${limitOption}_${groupBy}_${groupTimeRange}`.toLowerCase();
                await validateData(
                  openDigger.chaossNewContributors,
                  "new_contributors",
                  new_contributors_file_name
                );
              });
              it("should test inactiveContributors interface", async () => {
                const inactive_contributors_file_name =
                  `inactive_contributors_${order}_${limit}_${limitOption}_${groupBy}_${groupTimeRange}`.toLowerCase();
                await validateData(
                  openDigger.chaossInactiveContributors,
                  "inactive_contributors",
                  inactive_contributors_file_name
                );
              });
              it("should test contributors interface", async () => {
                const contributors_file_name =
                  `contributors_${order}_${limit}_${limitOption}_${groupBy}_${groupTimeRange}`.toLowerCase();
                await validateData(
                  openDigger.chaossContributors,
                  "contributors",
                  contributors_file_name
                );
              });
              it("should test changeRequestsAcceptanceRatio interface", async () => {
                const change_requests_acceptance_ratio_file_name =
                  `change_requests_acceptance_ratio_${order}_${limit}_${limitOption}_${groupBy}_${groupTimeRange}`.toLowerCase();
                await validateData(
                  openDigger.chaossChangeRequestsAcceptanceRatio,
                  "change_requests_acceptance_ratio",
                  change_requests_acceptance_ratio_file_name
                );
              });
              it("should test getRepoActivity interface", async () => {
                const repo_activity_file_name =
                  `repo_activity_${order}_${limit}_${limitOption}_${groupBy}_${groupTimeRange}`.toLowerCase();
                await validateData(
                  openDigger.getRepoActivity,
                  "repo_activity",
                  repo_activity_file_name
                );
              });
              it("should test getUserActivity interface", async () => {
                const user_activity_file_name =
                  `user_activity_${order}_${limit}_${limitOption}_${groupBy}_${groupTimeRange}`.toLowerCase();
                await validateData(
                  openDigger.getUserActivity,
                  "user_activity",
                  user_activity_file_name
                );
              });
              it("should test repoParticipants interface", async () => {
                const repo_participants_file_name =
                  `repo_participants_${order}_${limit}_${limitOption}_${groupBy}_${groupTimeRange}`.toLowerCase();
                await validateData(
                  openDigger.repoParticipants,
                  "repo_participants",
                  repo_participants_file_name
                );
              });
              it("should test repoStars interface", async () => {
                const repo_stars_file_name =
                  `repo_stars_${order}_${limit}_${limitOption}_${groupBy}_${groupTimeRange}`.toLowerCase();
                await validateData(
                  openDigger.repoStars,
                  "repo_stars",
                  repo_stars_file_name
                );
              });
              it("should test attention interface", async () => {
                const attention_file_name =
                  `attention_${order}_${limit}_${limitOption}_${groupBy}_${groupTimeRange}`.toLowerCase();
                await validateData(
                  openDigger.getAttention,
                  "attention",
                  attention_file_name
                );
              });
            }
          }
        }
      }
    }

    console.log("All passed.");
  } catch (err) {
    console.error(err);
  }
});
