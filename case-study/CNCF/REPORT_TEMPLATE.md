# CNCF

CNCF is short for `Cloud Native Computing Foundation` which is a sub foundation of Linux Foundation. 

# English

## Introduction

CNCF is short for `Cloud Native Computing Foundation` which is a sub foundation of Linux Foundation. CNCF hosts critical components of the global technology infrastructure, brings together the world’s top developers, end users, and vendors.

The projects hosted by CNCF include three stages: graduated, incubating and sandbox, at present, the projects for each stage are as follows:

- graduated: [containerd](http://containerd.io/), [CoreDNS](https://coredns.io/), [Envoy
](https://www.envoyproxy.io/), [etcd](https://etcd.io/), [Fluentd](http://fluentd.org/), [Harbor](https://goharbor.io/), [Helm](https://www.helm.sh/), [Jaeger](https://jaegertracing.io/), [Kubernetes](http://kubernetes.io/), [Prometheus](https://prometheus.io/), [Rook](https://rook.io/), [TiKV](https://tikv.org/), [TUF](https://theupdateframework.io/), [Vitess](https://vitess.io/)
- incubating: [Argo](https://argoproj.github.io/), [Buildpacks](https://buildpacks.io/), [CloudEvents](https://cloudevents.io/), [CNI](https://www.cni.dev/), [Contour](https://projectcontour.io/), [Cortex](https://github.com/cortexproject), [CRI-O](https://cri-o.io/), [Dragonfly](https://d7y.io/), [Falco](https://falco.org/), [gRPC](https://grpc.io/), [KubeEdge](https://kubeedge.io/en/), [Linkerd](https://linkerd.io/), [NATS](https://nats.io/), [Notary](https://github.com/theupdateframework/notary), [Open Policy Agent](http://www.openpolicyagent.org/), [OpenTracing](http://opentracing.io/), [Operator Framework](https://operatorframework.io/), [SPIFFE](https://spiffe.io/), [SPIRE](https://github.com/spiffe/spire), [Thanos](https://thanos.io/)
- sandbox: Artifact Hub, Backstage, etc. 44 projects

## CNCF Project Proposal Process

CNCF has formulated a governance policy for the project proposal process. The process is the same for both existing projects which seek to move into the CNCF, and new projects to be formed within the CNCF.

![project-stages](https://raw.githubusercontent.com/cncf/toc/master/process/project-stages.png)

### Sandbox process

All exceptions (and "no" outcomes) are handled by the TOC(Technical Oversight Committee, provides technical leadership to the cloud native community). Possible "no" outcomes include "not at this time", and the project may be encouraged to re-apply after addressing issues. Timeframes are approximate, to set expectations.

![sandbox-process](https://github.com/cncf/toc/blob/master/process/sandbox-process.png?raw=true)

### Incubation process

All exceptions (and "no" outcomes) are handled by the TOC.

![incubation-process](https://github.com/cncf/toc/blob/master/process/incubation-process.png?raw=true)

1. Project Proposal
2. TOC Triage (2 weeks for a straightforward referral to a SIG; decline or defer could require more discussion)
3. SIG Assessment (1-2 months)
4. TOC Incubation Sponsor
5. Due Diligence (2-3 months)
6. Due Diligence review (2-6 weeks)
7. TOC vote (up to 6 weeks)

### Graduation process

1. Submit Graduation Proposal Template

   - Project fills out and submits the graduation proposal template in a pull request in the cncf/toc GitHub repo.
   - The file containing the proposal should be located in the graduation proposals directory.
   - The proposal addresses how the project has grown since incubation and any concerns from incubation DD(Due Diligence) in addition to the standard graduation requirements.

2. TOC member kicks off two week period of time for public comment on the TOC mailing list

   - The email should contain a link to the proposal pull request.
   - All SIGs, end users, TOC members, and community members are welcome to comment at this time on the mailing list.
   - Historically, projects have done a TOC presentation as part of the graduation process. The TOC has gotten rid of the presentation requirement. Instead, if the TOC wants to have a deeper discussion about the project with the maintainers, they may schedule an ad hoc meeting to do so before the vote.

3. TOC vote

   - TOC members assess whether project meets the Graduation criteria
   - Projects must have a 2/3 supermajority vote of the TOC to graduate

## Data analysis

We calculated the activity of all CNCF graduated and incubating project repositories and the data is as follows.

{{sqls.activity-repo.text}}

# 中文

## 简介

CNCF 全称为云原生计算基金会(Cloud Native Computing Foundation)，是 Linux 基金会(Linux Foundation)的一部分。CNCF 托管着全球技术基础架构的关键组件，汇集了全球顶级开发商、最终用户和供应商。

CNCF 托管的项目分为毕业(graduated)，孵化(incubating)和沙箱(sandbox)三个阶段，目前，每个阶段的项目包括：

- 毕业(graduated): [containerd](http://containerd.io/), [CoreDNS](https://coredns.io/), [Envoy
](https://www.envoyproxy.io/), [etcd](https://etcd.io/), [Fluentd](http://fluentd.org/), [Harbor](https://goharbor.io/), [Helm](https://www.helm.sh/), [Jaeger](https://jaegertracing.io/), [Kubernetes](http://kubernetes.io/), [Prometheus](https://prometheus.io/), [Rook](https://rook.io/), [TiKV](https://tikv.org/), [TUF](https://theupdateframework.io/), [Vitess](https://vitess.io/)
- 孵化(incubating): [Argo](https://argoproj.github.io/), [Buildpacks](https://buildpacks.io/), [CloudEvents](https://cloudevents.io/), [CNI](https://www.cni.dev/), [Contour](https://projectcontour.io/), [Cortex](https://github.com/cortexproject), [CRI-O](https://cri-o.io/), [Dragonfly](https://d7y.io/), [Falco](https://falco.org/), [gRPC](https://grpc.io/), [KubeEdge](https://kubeedge.io/en/), [Linkerd](https://linkerd.io/), [NATS](https://nats.io/), [Notary](https://github.com/theupdateframework/notary), [Open Policy Agent](http://www.openpolicyagent.org/), [OpenTracing](http://opentracing.io/), [Operator Framework](https://operatorframework.io/), [SPIFFE](https://spiffe.io/), [SPIRE](https://github.com/spiffe/spire), [Thanos](https://thanos.io/)
- 沙箱(sandbox): Artifact Hub, Backstage 等 44 个项目


## CNCF项目提案流程

CNCF 对项目提案流程制定了治理政策，提案流程适用于现有要加入 CNCF 的项目和在 CNCF 内形成的新项目。三个阶段及转化流程如下图所示。

![sandbox-process](https://github.com/cncf/toc/blob/master/process/sandbox-process.png?raw=true)

### 沙箱流程

所有的例外情况（包括拒绝）均由 TOC(全称为 Technical Oversight Committee，即技术监督委员会的缩写，主要向云原生社区提供技术领导) 来处理。项目被拒绝时，可能是“目前不合适”这种情况，并且可以鼓励该项目在解决问题后重新申请。整个过程所需的时间并不固定。具体流程如下图所示。

![sandbox-process](https://github.com/cncf/toc/blob/master/process/sandbox-process.png?raw=true)


### 孵化

同沙箱流程，所有的例外情况（包括拒绝）均由 TOC 来处理。

![incubation-process](https://github.com/cncf/toc/blob/master/process/incubation-process.png?raw=true)

其流程可以概述为：

1. 通过 GitHub issue 提议孵化
2. TOC 对提案进行分类，选择合适的 CNCF SIG(Special Interest Groups，特别兴趣小组) 进行评估（2周）
3. SIG 评估（1-2月）
4. TOC 孵化赞助商
5. 尽职调查（2-3个月）
6. 尽职调查审查（2-6周）
7. TOC 投票 (6周左右)

### 毕业流程

1. 提交毕业提案模板

 - 项目填写毕业提案模版，并在 GitHub cncf/toc 仓库中以 pull request 的方式提交。
 - 包含提案的文件应位于毕业提案目录中。
 - 该提案解决了自孵化以来项目的发展以及除标准毕业要求之外的来自孵化尽职调查的任何问题。

2. TOC 成员开始为期两周的在 TOC 邮件列表公开评论

 - 电子邮件应该包含到提案 pull request 的链接。
 - 所有 SIGs、最终用户、TOC 成员和社区成员此时都可以在邮件列表上发表评论。
 - 传统上，在毕业过程中，项目都会做一个 TOC 演示。TOC 已经取消了演示的要求。如果 TOC 想要与维护者对项目进行更深入的讨论，他们可以在投票之前安排一个特别的会议。

3. TOC 投票

 - TOC成员评估项目是否符合毕业标准
 - 项目必须获得 TOC 的 2/3 多数票才能毕业

## 数据分析

我们计算了所有 CNCF 已毕业和正在孵化的项目仓库的活动情况，数据如下。

{{sqls.activity-repo.text}}
