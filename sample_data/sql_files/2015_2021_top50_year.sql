SELECT * FROM github_log.events WHERE repo_id IN
(
  SELECT DISTINCT(repo_id) AS repo_id FROM
  (
    SELECT repo_id, toYear(created_at) AS year
    FROM github_log.events
    WHERE year <= 2021
    GROUP BY repo_id, year
    ORDER BY COUNT() DESC
    LIMIT 50 BY year
  )
)
