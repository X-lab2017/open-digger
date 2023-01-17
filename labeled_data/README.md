# About Labeled data
In this folder, we collect different categories of labeled data. We can using these data by adding `labelIntersect` parameter in metrics like:
``` 
openDigger.index.activity.getRepoActivity({labelIntersect: ['Company', ':regions/China'], startYear, startMonth, endYear, endMonth, groupBy: 'Company', groupTimeRange: 'year', limit: -1, order: 'DESC' })
```
We have 8 categories of labeled data.

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

- projects
It contains repos/orgs used around a certain project.

- regions
It contains repos/orgs/users that (created) from different regions. 

- technology
It contains repos in different technical field.

## How to add a labeled data?
You can create an issue and choose different issue-templates to submit your data.