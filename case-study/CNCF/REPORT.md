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

| # | name | language | activity | developer_count | issue_comment | open_issue | open_pull | pull_review_comment | merge_pull | pull_commits | pull_additions | pull_deletions |
|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| 1 | kubernetes/kubernetes | Go | 19600.57 | 6009 | 236820 | 3618 | 6728 | 31011 | 4768 | 6683 | 1321251 | 726985 |
| 2 | envoyproxy/envoy | C++ | 5782.9 | 1097 | 23287 | 1633 | 3132 | 22728 | 2583 | 19287 | 574665 | 256934 |
| 3 | helm/helm | Go | 4017.13 | 2009 | 10224 | 914 | 611 | 1034 | 417 | 705 | 22261 | 8594 |
| 4 | grpc/grpc | C++ | 3213.04 | 1170 | 9815 | 896 | 2187 | 3723 | 1762 | 4100 | 654739 | 584065 |
| 5 | goharbor/harbor | Go | 2838.56 | 1126 | 8414 | 1719 | 1496 | 2542 | 1269 | 1554 | 666105 | 376437 |
| 6 | prometheus/prometheus | Go | 2542.05 | 774 | 9793 | 533 | 1016 | 5664 | 727 | 2101 | 431386 | 276355 |
| 7 | rook/rook | Go | 2497.11 | 707 | 6840 | 737 | 1419 | 7037 | 1280 | 1821 | 124661 | 72140 |
| 8 | argoproj/argo | Go | 2463.75 | 730 | 10091 | 1379 | 1340 | 3729 | 1115 | 10837 | 306740 | 141107 |
| 9 | tikv/tikv | Rust | 2141.14 | 253 | 17433 | 965 | 1962 | 5417 | 1483 | 10928 | 469772 | 202572 |
| 10 | thanos-io/thanos | Go | 2078.7 | 565 | 6932 | 623 | 966 | 4826 | 774 | 2164 | 192186 | 57410 |
| 11 | operator-framework/operator-sdk | Go | 1998.3 | 479 | 6719 | 672 | 1197 | 7830 | 1011 | 2691 | 158067 | 120220 |
| 12 | etcd-io/etcd | Go | 1537.54 | 602 | 4195 | 305 | 531 | 781 | 387 | 581 | 159903 | 128643 |
| 13 | cri-o/cri-o | Go | 1425.98 | 249 | 36196 | 192 | 1200 | 2065 | 950 | 1417 | 675322 | 520827 |
| 14 | linkerd/linkerd2 | Go | 1395.62 | 379 | 4846 | 550 | 821 | 2487 | 714 | 2821 | 215016 | 167806 |
| 15 | cortexproject/cortex | Go | 1360.46 | 215 | 3772 | 443 | 1188 | 6124 | 1103 | 4744 | 757713 | 369612 |
| 16 | containerd/containerd | Go | 1287.4 | 395 | 4895 | 185 | 668 | 974 | 557 | 2961 | 323587 | 153583 |
| 17 | kubeedge/kubeedge | Go | 1164.07 | 251 | 6018 | 349 | 651 | 1631 | 491 | 913 | 423385 | 201457 |
| 18 | jaegertracing/jaeger | Go | 1070.52 | 319 | 3050 | 303 | 336 | 1911 | 278 | 985 | 42894 | 22660 |
| 19 | vitessio/vitess | Go | 981.45 | 153 | 2087 | 428 | 1040 | 2117 | 896 | 3577 | 343193 | 321576 |
| 20 | open-policy-agent/opa | Go | 905.25 | 255 | 2172 | 441 | 517 | 1135 | 468 | 772 | 304927 | 83478 |
| 21 | coredns/coredns | Go | 898.34 | 311 | 2989 | 229 | 474 | 538 | 354 | 565 | 11429 | 7361 |
| 22 | projectcontour/contour | Go | 825.41 | 181 | 3526 | 430 | 670 | 2100 | 611 | 972 | 144140 | 73535 |
| 23 | falcosecurity/falco | C++ | 737.06 | 250 | 4088 | 228 | 274 | 409 | 231 | 728 | 10918 | 9621 |
| 24 | spiffe/spire | Go | 563.68 | 73 | 1127 | 218 | 448 | 1695 | 400 | 1184 | 121841 | 57572 |
| 25 | fluent/fluentd | Ruby | 519.94 | 224 | 1010 | 177 | 169 | 236 | 161 | 402 | 9250 | 2554 |
| 26 | buildpacks/pack | Go | 498.6 | 95 | 1308 | 227 | 305 | 1209 | 265 | 1067 | 195026 | 221915 |
| 27 | nats-io/nats-server | Go | 459.43 | 104 | 1099 | 128 | 386 | 1918 | 355 | 826 | 87278 | 17370 |
| 28 | dragonflyoss/Dragonfly | Go | 398.84 | 89 | 1625 | 124 | 191 | 358 | 148 | 209 | 20599 | 1859 |
| 29 | cloudevents/spec | Shell | 385.05 | 76 | 748 | 72 | 109 | 778 | 91 | 205 | 5987 | 1714 |
| 30 | theupdateframework/tuf | Python | 236.29 | 29 | 1063 | 106 | 166 | 664 | 130 | 328 | 7111 | 4793 |
| 31 | containernetworking/cni | Go | 125.67 | 43 | 240 | 21 | 23 | 54 | 15 | 22 | 1752 | 781 |
| 32 | theupdateframework/notary | Go | 110.93 | 50 | 183 | 25 | 22 | 32 | 9 | 34 | 103985 | 67767 |
| 33 | opentracing/opentracing-go | Go | 19.95 | 10 | 21 | 1 | 3 | 6 | 3 | 5 | 108 | 8 |


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

| # | name | language | activity | developer_count | issue_comment | open_issue | open_pull | pull_review_comment | merge_pull | pull_commits | pull_additions | pull_deletions |
|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| 1 | kubernetes/kubernetes | Go | 19600.57 | 6009 | 236820 | 3618 | 6728 | 31011 | 4768 | 6683 | 1321251 | 726985 |
| 2 | envoyproxy/envoy | C++ | 5782.9 | 1097 | 23287 | 1633 | 3132 | 22728 | 2583 | 19287 | 574665 | 256934 |
| 3 | helm/helm | Go | 4017.13 | 2009 | 10224 | 914 | 611 | 1034 | 417 | 705 | 22261 | 8594 |
| 4 | grpc/grpc | C++ | 3213.04 | 1170 | 9815 | 896 | 2187 | 3723 | 1762 | 4100 | 654739 | 584065 |
| 5 | goharbor/harbor | Go | 2838.56 | 1126 | 8414 | 1719 | 1496 | 2542 | 1269 | 1554 | 666105 | 376437 |
| 6 | prometheus/prometheus | Go | 2542.05 | 774 | 9793 | 533 | 1016 | 5664 | 727 | 2101 | 431386 | 276355 |
| 7 | rook/rook | Go | 2497.11 | 707 | 6840 | 737 | 1419 | 7037 | 1280 | 1821 | 124661 | 72140 |
| 8 | argoproj/argo | Go | 2463.75 | 730 | 10091 | 1379 | 1340 | 3729 | 1115 | 10837 | 306740 | 141107 |
| 9 | tikv/tikv | Rust | 2141.14 | 253 | 17433 | 965 | 1962 | 5417 | 1483 | 10928 | 469772 | 202572 |
| 10 | thanos-io/thanos | Go | 2078.7 | 565 | 6932 | 623 | 966 | 4826 | 774 | 2164 | 192186 | 57410 |
| 11 | operator-framework/operator-sdk | Go | 1998.3 | 479 | 6719 | 672 | 1197 | 7830 | 1011 | 2691 | 158067 | 120220 |
| 12 | etcd-io/etcd | Go | 1537.54 | 602 | 4195 | 305 | 531 | 781 | 387 | 581 | 159903 | 128643 |
| 13 | cri-o/cri-o | Go | 1425.98 | 249 | 36196 | 192 | 1200 | 2065 | 950 | 1417 | 675322 | 520827 |
| 14 | linkerd/linkerd2 | Go | 1395.62 | 379 | 4846 | 550 | 821 | 2487 | 714 | 2821 | 215016 | 167806 |
| 15 | cortexproject/cortex | Go | 1360.46 | 215 | 3772 | 443 | 1188 | 6124 | 1103 | 4744 | 757713 | 369612 |
| 16 | containerd/containerd | Go | 1287.4 | 395 | 4895 | 185 | 668 | 974 | 557 | 2961 | 323587 | 153583 |
| 17 | kubeedge/kubeedge | Go | 1164.07 | 251 | 6018 | 349 | 651 | 1631 | 491 | 913 | 423385 | 201457 |
| 18 | jaegertracing/jaeger | Go | 1070.52 | 319 | 3050 | 303 | 336 | 1911 | 278 | 985 | 42894 | 22660 |
| 19 | vitessio/vitess | Go | 981.45 | 153 | 2087 | 428 | 1040 | 2117 | 896 | 3577 | 343193 | 321576 |
| 20 | open-policy-agent/opa | Go | 905.25 | 255 | 2172 | 441 | 517 | 1135 | 468 | 772 | 304927 | 83478 |
| 21 | coredns/coredns | Go | 898.34 | 311 | 2989 | 229 | 474 | 538 | 354 | 565 | 11429 | 7361 |
| 22 | projectcontour/contour | Go | 825.41 | 181 | 3526 | 430 | 670 | 2100 | 611 | 972 | 144140 | 73535 |
| 23 | falcosecurity/falco | C++ | 737.06 | 250 | 4088 | 228 | 274 | 409 | 231 | 728 | 10918 | 9621 |
| 24 | spiffe/spire | Go | 563.68 | 73 | 1127 | 218 | 448 | 1695 | 400 | 1184 | 121841 | 57572 |
| 25 | fluent/fluentd | Ruby | 519.94 | 224 | 1010 | 177 | 169 | 236 | 161 | 402 | 9250 | 2554 |
| 26 | buildpacks/pack | Go | 498.6 | 95 | 1308 | 227 | 305 | 1209 | 265 | 1067 | 195026 | 221915 |
| 27 | nats-io/nats-server | Go | 459.43 | 104 | 1099 | 128 | 386 | 1918 | 355 | 826 | 87278 | 17370 |
| 28 | dragonflyoss/Dragonfly | Go | 398.84 | 89 | 1625 | 124 | 191 | 358 | 148 | 209 | 20599 | 1859 |
| 29 | cloudevents/spec | Shell | 385.05 | 76 | 748 | 72 | 109 | 778 | 91 | 205 | 5987 | 1714 |
| 30 | theupdateframework/tuf | Python | 236.29 | 29 | 1063 | 106 | 166 | 664 | 130 | 328 | 7111 | 4793 |
| 31 | containernetworking/cni | Go | 125.67 | 43 | 240 | 21 | 23 | 54 | 15 | 22 | 1752 | 781 |
| 32 | theupdateframework/notary | Go | 110.93 | 50 | 183 | 25 | 22 | 32 | 9 | 34 | 103985 | 67767 |
| 33 | opentracing/opentracing-go | Go | 19.95 | 10 | 21 | 1 | 3 | 6 | 3 | 5 | 108 | 8 |

