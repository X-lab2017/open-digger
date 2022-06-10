SELECT * FROM github_log.events WHERE toSecond(created_at) = 0 AND toYear(created_at) <= 2021
