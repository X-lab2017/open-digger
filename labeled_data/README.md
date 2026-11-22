# About Labeled data
In this folder, we collect different categories of labeled data. We can using these data by adding `labelIntersect` parameter in metrics like:
``` 
openDigger.index.activity.getRepoActivity({labelIntersect: ['Company', ':divisions/CN'], startYear, startMonth, endYear, endMonth, groupBy: 'Company', groupTimeRange: 'year', limit: -1, order: 'DESC' })
```
Labeled data is organized by category.

## Data Description
- application_domain
It contains repos in different application domain.

- bot
It contains bots data.

- communities
It contains orgs/repos/users data of a community.

- companies
It contains the correspondence between the company and the repos/orgs.

- foundations
It contains the repos/orgs information under the foundation.

- industries
It classifies projects by the economic activities they serve. The taxonomy is
[NAICS 2022](https://www.census.gov/programs-surveys/economic-census/year/2022/guidance/understanding-naics.html),
with all 20 sectors represented as `Industry-0` labels directly under
`industries/sector_<code>/`. The aggregate label is `:industries`; for example,
manufacturing is `:industries/sector_31_33`.

Only the two-digit sector level is included. Manufacturing (31-33), retail trade
(44-45), and transportation and warehousing (48-49) each use a range of two-digit
codes. Project assignments use their direct purpose: general-purpose software
and computing infrastructure belong to Information (51), while projects with a
verified sector-specific purpose belong to that sector. Projects without enough
evidence are left unassigned. See [industry mapping notes](industries/README.md)
for the assignment policy, sources, and entries requiring manual review.

Each sector uses `index.yml`. Official codes are stored as strings in `meta.code`,
alongside the classification, version, level, and source. English names follow the
official classification; Chinese names and descriptions are descriptive translations.
When assigning a project, reference its canonical label through `data.labels`
and verify the industry it serves. Do not infer that industry solely from the
project owner's company classification.

- projects
It contains repos/orgs used around a certain project.

- divisions
It contains repos/orgs/users that (created) from different divisions. 

- technology
It contains repos in different technical field.

## How to add a labeled data?
You can create an issue and choose different issue-templates to submit your data.
