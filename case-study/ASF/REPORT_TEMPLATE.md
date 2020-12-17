# ASF

ASF is short for `Apache Software Foundation`. ASF is one of the most active foundation in the world. This report consists of basic introduction of ASF and data analysis for projects from China.

## Introduction

The `Apache Software Foundation (ASF)` is a 501(c)3 non-profit public charity organization incorporated in the United States of America and was formed in 1999 primarily to:

- provide a foundation for open, collaborative software development projects by supplying hardware, communication, and business infrastructure

- create an independent legal entity to which companies and individuals can donate resources and be assured that those resources will be used for the public benefit

- provide a means for individual volunteers to be sheltered from legal suits directed at the Foundation's projects

- protect the 'Apache' brand, as applied to its software products, from being abused by other organizations

### The Apache Way 

The Apache Way is a living, breathing interpretation of one’s experience with our community-led development process. Apache projects and their communities are unique, diverse, and focused on the activities needed at a particular stage of the project’s lifetime, including nurturing communities, developing great code, and building awareness. What is important is that they embrace:

- **Community Over Code**: the maxim "Community Over Code" is frequently reinforced throughout the Apache community, as the ASF asserts that a healthy community is a higher priority than good code. Strong communities can always rectify problems with their code, whereas an unhealthy community will likely struggle to maintain a codebase in a sustainable manner. 

- **Earned Authority**: all individuals are given the opportunity to participate, but their influence is based on publicly earned merit – what they contribute to the community. Merit lies with the individual, does not expire, is not influenced by employment status or employer, and is non-transferable ( *merit earned in one project cannot be applied to another*).

- **Community of Peers**: individuals participate at the ASF, not organizations. The ASF’s flat structure dictates that roles are equal irrespective of title, votes hold equal weight, and contributions are made on a volunteer basis (even if paid to work on Apache code). The Apache community is expected to treat each other with respect in adherence to our Code of Conduct. Domain expertise is appreciated; Benevolent Dictators For Life are disallowed. 

- **Open Communications**: as a virtual organization, the ASF requires all communications related to code and decision-making to be publicly accessible to ensure asynchronous collaboration, as necessitated by a globally-distributed community. Project mailing lists are archived, publicly accessible, and include:
  - dev@ (primary project development);
  - user@ (user community discussion and peer support);
  - commits@ (automated source change notifications); and
  - occasionally supporting roles such as marketing@ (project visibility),

  ...as well as restricted, day-to-day operational lists for Project Management Committees. Private decisions on code, policies, or project direction are disallowed; off-list discourse and transactions must be brought on-list. 

- **Consensus Decision Making**: Apache Projects are overseen by a self-selected team of active volunteers who are contributing to their respective projects. Projects are auto-governing with a heavy slant towards driving consensus to maintain momentum and productivity. Whilst total consensus is not possible to establish at all times, holding a vote or other coordination may be required to help remove any blocks with binding decisions, such as when declaring a release.
  
  When coordination is required, decisions are taken with a lazy consensus approach: a few positive votes with no negative vote is enough to get going.

  Voting is done with numbers:
  - +1 -- a positive vote
  - 0 -- abstain, have no opinion
  - -1 -- a negative vote

  The rules require that a negative vote includes an alternative proposal or a detailed explanation of the reasons for the negative vote.

  The community then tries to gather consensus on an alternative proposal that resolves the issue. In the great majority of cases, the concerns leading to the negative vote can be addressed.

  This process is called "consensus gathering" and we consider it a very important indication of a healthy community. Specific cases have some more [detailed voting rules](https://www.apache.org/foundation/voting.html).

- **Responsible Oversight**: The ASF governance model is based on trust and delegated oversight. Rather than detailed rules and hierarchical structures, ASF governance is principles-based, with self-governing projects providing reports directly to the Board. Apache Committers help each other by making peer-reviewed commits, employing mandatory security measures, ensuring license compliance, and protecting the Apache brand and community at-large from abuse.

## Data analysis

We calculated the activity of all Apache repositories from China and the data is as follows.

{{sqls.activity-repo.text}}

