module.exports = async function() {
  return [
    {
      type: 'githubEventLog',
      sql: `SELECT * FROM
(SELECT 2021 AS year, COUNT(*) AS log_count, COUNT(Distinct actor_id) as actor_count, COUNT(Distinct repo_id) AS repo_count FROM year2021
UNION ALL
SELECT 2020 AS year, COUNT(*) AS log_count, COUNT(Distinct actor_id) as actor_count, COUNT(Distinct repo_id) AS repo_count FROM year2020
UNION ALL
SELECT 2019 AS year, COUNT(*) AS log_count, COUNT(Distinct actor_id) as actor_count, COUNT(Distinct repo_id) AS repo_count FROM year2019
UNION ALL
SELECT 2018 AS year, COUNT(*) AS log_count, COUNT(Distinct actor_id) as actor_count, COUNT(Distinct repo_id) AS repo_count FROM year2018
UNION ALL
SELECT 2017 AS year, COUNT(*) AS log_count, COUNT(Distinct actor_id) as actor_count, COUNT(Distinct repo_id) AS repo_count FROM year2017
UNION ALL
SELECT 2016 AS year, COUNT(*) AS log_count, COUNT(Distinct actor_id) as actor_count, COUNT(Distinct repo_id) AS repo_count FROM year2016
UNION ALL
SELECT 2015 AS year, COUNT(*) AS log_count, COUNT(Distinct actor_id) as actor_count, COUNT(Distinct repo_id) AS repo_count FROM year2015)
ORDER BY year ASC`,
    },
  ];
}
