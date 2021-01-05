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
| 1 | kubernetes/kubernetes | Go | 19712.61 | 6052 | 238003 | 3642 | 6764 | 31155 | 4797 | 6726 | 1326284 | 728298 |
| 2 | envoyproxy/envoy | C++ | 5818.58 | 1102 | 23549 | 1645 | 3159 | 22965 | 2608 | 19393 | 576504 | 257935 |
| 3 | helm/helm | Go | 4049.78 | 2026 | 10284 | 925 | 614 | 1039 | 420 | 714 | 23121 | 8614 |
| 4 | grpc/grpc | C++ | 3227.37 | 1175 | 9885 | 904 | 2198 | 3750 | 1769 | 4111 | 656279 | 584690 |
| 5 | goharbor/harbor | Go | 2870.4 | 1137 | 8527 | 1738 | 1518 | 2566 | 1281 | 1571 | 668964 | 378538 |
| 6 | prometheus/prometheus | Go | 2549.01 | 777 | 9825 | 537 | 1018 | 5705 | 727 | 2101 | 431386 | 276355 |
| 7 | rook/rook | Go | 2512.6 | 713 | 6879 | 746 | 1430 | 7073 | 1287 | 1837 | 125250 | 72551 |
| 8 | argoproj/argo | Go | 2476.52 | 733 | 10170 | 1394 | 1348 | 3735 | 1124 | 10872 | 307048 | 141266 |
| 9 | tikv/tikv | Rust | 2158.56 | 255 | 17647 | 972 | 1978 | 5500 | 1501 | 11127 | 474721 | 204367 |
| 10 | thanos-io/thanos | Go | 2095.97 | 568 | 6982 | 630 | 973 | 4907 | 776 | 2166 | 192225 | 57412 |
| 11 | operator-framework/operator-sdk | Go | 2005.57 | 480 | 6770 | 678 | 1211 | 7886 | 1019 | 2704 | 159641 | 122451 |
| 12 | etcd-io/etcd | Go | 1548.6 | 608 | 4221 | 307 | 533 | 782 | 387 | 581 | 159903 | 128643 |
| 13 | cri-o/cri-o | Go | 1436.39 | 252 | 36278 | 193 | 1208 | 2069 | 950 | 1417 | 675322 | 520827 |
| 14 | linkerd/linkerd2 | Go | 1408.59 | 383 | 4915 | 557 | 831 | 2498 | 720 | 2852 | 215696 | 167990 |
| 15 | cortexproject/cortex | Go | 1365.24 | 216 | 3806 | 444 | 1199 | 6170 | 1109 | 4763 | 758214 | 369712 |
| 16 | containerd/containerd | Go | 1313.71 | 405 | 4966 | 188 | 676 | 987 | 564 | 2971 | 323886 | 153614 |
| 17 | kubeedge/kubeedge | Go | 1171.94 | 252 | 6076 | 354 | 659 | 1644 | 498 | 920 | 423531 | 201831 |
| 18 | jaegertracing/jaeger | Go | 1075.88 | 321 | 3063 | 305 | 337 | 1924 | 279 | 988 | 42944 | 22677 |
| 19 | vitessio/vitess | Go | 993.26 | 157 | 2117 | 430 | 1055 | 2124 | 902 | 3594 | 353776 | 331681 |
| 20 | open-policy-agent/opa | Go | 910.26 | 256 | 2190 | 445 | 525 | 1146 | 473 | 780 | 305081 | 83749 |
| 21 | coredns/coredns | Go | 904.54 | 312 | 3014 | 232 | 479 | 541 | 358 | 571 | 11535 | 7389 |
| 22 | projectcontour/contour | Go | 830.8 | 181 | 3580 | 435 | 684 | 2110 | 621 | 995 | 156040 | 73681 |
| 23 | falcosecurity/falco | C++ | 741.79 | 251 | 4105 | 229 | 276 | 424 | 231 | 728 | 10918 | 9621 |
| 24 | spiffe/spire | Go | 567.08 | 73 | 1137 | 221 | 449 | 1697 | 407 | 1225 | 126370 | 58702 |
| 25 | fluent/fluentd | Ruby | 528.1 | 229 | 1023 | 180 | 169 | 236 | 163 | 412 | 9379 | 2680 |
| 26 | buildpacks/pack | Go | 502.35 | 96 | 1315 | 228 | 308 | 1211 | 266 | 1068 | 195197 | 221922 |
| 27 | nats-io/nats-server | Go | 460.04 | 104 | 1103 | 128 | 390 | 1918 | 359 | 832 | 119708 | 17499 |
| 28 | dragonflyoss/Dragonfly | Go | 398.84 | 89 | 1625 | 124 | 191 | 358 | 148 | 209 | 20599 | 1859 |
| 29 | cloudevents/spec | Shell | 385.32 | 76 | 750 | 72 | 110 | 778 | 91 | 205 | 5987 | 1714 |
| 30 | theupdateframework/tuf | Python | 237.15 | 29 | 1075 | 112 | 169 | 664 | 132 | 335 | 7176 | 4885 |
| 31 | containernetworking/cni | Go | 126.81 | 43 | 242 | 21 | 25 | 55 | 15 | 22 | 1752 | 781 |
| 32 | theupdateframework/notary | Go | 112.35 | 51 | 185 | 25 | 22 | 32 | 9 | 34 | 103985 | 67767 |
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
| 1 | kubernetes/kubernetes | Go | 19712.61 | 6052 | 238003 | 3642 | 6764 | 31155 | 4797 | 6726 | 1326284 | 728298 |
| 2 | envoyproxy/envoy | C++ | 5818.58 | 1102 | 23549 | 1645 | 3159 | 22965 | 2608 | 19393 | 576504 | 257935 |
| 3 | helm/helm | Go | 4049.78 | 2026 | 10284 | 925 | 614 | 1039 | 420 | 714 | 23121 | 8614 |
| 4 | grpc/grpc | C++ | 3227.37 | 1175 | 9885 | 904 | 2198 | 3750 | 1769 | 4111 | 656279 | 584690 |
| 5 | goharbor/harbor | Go | 2870.4 | 1137 | 8527 | 1738 | 1518 | 2566 | 1281 | 1571 | 668964 | 378538 |
| 6 | prometheus/prometheus | Go | 2549.01 | 777 | 9825 | 537 | 1018 | 5705 | 727 | 2101 | 431386 | 276355 |
| 7 | rook/rook | Go | 2512.6 | 713 | 6879 | 746 | 1430 | 7073 | 1287 | 1837 | 125250 | 72551 |
| 8 | argoproj/argo | Go | 2476.52 | 733 | 10170 | 1394 | 1348 | 3735 | 1124 | 10872 | 307048 | 141266 |
| 9 | tikv/tikv | Rust | 2158.56 | 255 | 17647 | 972 | 1978 | 5500 | 1501 | 11127 | 474721 | 204367 |
| 10 | thanos-io/thanos | Go | 2095.97 | 568 | 6982 | 630 | 973 | 4907 | 776 | 2166 | 192225 | 57412 |
| 11 | operator-framework/operator-sdk | Go | 2005.57 | 480 | 6770 | 678 | 1211 | 7886 | 1019 | 2704 | 159641 | 122451 |
| 12 | etcd-io/etcd | Go | 1548.6 | 608 | 4221 | 307 | 533 | 782 | 387 | 581 | 159903 | 128643 |
| 13 | cri-o/cri-o | Go | 1436.39 | 252 | 36278 | 193 | 1208 | 2069 | 950 | 1417 | 675322 | 520827 |
| 14 | linkerd/linkerd2 | Go | 1408.59 | 383 | 4915 | 557 | 831 | 2498 | 720 | 2852 | 215696 | 167990 |
| 15 | cortexproject/cortex | Go | 1365.24 | 216 | 3806 | 444 | 1199 | 6170 | 1109 | 4763 | 758214 | 369712 |
| 16 | containerd/containerd | Go | 1313.71 | 405 | 4966 | 188 | 676 | 987 | 564 | 2971 | 323886 | 153614 |
| 17 | kubeedge/kubeedge | Go | 1171.94 | 252 | 6076 | 354 | 659 | 1644 | 498 | 920 | 423531 | 201831 |
| 18 | jaegertracing/jaeger | Go | 1075.88 | 321 | 3063 | 305 | 337 | 1924 | 279 | 988 | 42944 | 22677 |
| 19 | vitessio/vitess | Go | 993.26 | 157 | 2117 | 430 | 1055 | 2124 | 902 | 3594 | 353776 | 331681 |
| 20 | open-policy-agent/opa | Go | 910.26 | 256 | 2190 | 445 | 525 | 1146 | 473 | 780 | 305081 | 83749 |
| 21 | coredns/coredns | Go | 904.54 | 312 | 3014 | 232 | 479 | 541 | 358 | 571 | 11535 | 7389 |
| 22 | projectcontour/contour | Go | 830.8 | 181 | 3580 | 435 | 684 | 2110 | 621 | 995 | 156040 | 73681 |
| 23 | falcosecurity/falco | C++ | 741.79 | 251 | 4105 | 229 | 276 | 424 | 231 | 728 | 10918 | 9621 |
| 24 | spiffe/spire | Go | 567.08 | 73 | 1137 | 221 | 449 | 1697 | 407 | 1225 | 126370 | 58702 |
| 25 | fluent/fluentd | Ruby | 528.1 | 229 | 1023 | 180 | 169 | 236 | 163 | 412 | 9379 | 2680 |
| 26 | buildpacks/pack | Go | 502.35 | 96 | 1315 | 228 | 308 | 1211 | 266 | 1068 | 195197 | 221922 |
| 27 | nats-io/nats-server | Go | 460.04 | 104 | 1103 | 128 | 390 | 1918 | 359 | 832 | 119708 | 17499 |
| 28 | dragonflyoss/Dragonfly | Go | 398.84 | 89 | 1625 | 124 | 191 | 358 | 148 | 209 | 20599 | 1859 |
| 29 | cloudevents/spec | Shell | 385.32 | 76 | 750 | 72 | 110 | 778 | 91 | 205 | 5987 | 1714 |
| 30 | theupdateframework/tuf | Python | 237.15 | 29 | 1075 | 112 | 169 | 664 | 132 | 335 | 7176 | 4885 |
| 31 | containernetworking/cni | Go | 126.81 | 43 | 242 | 21 | 25 | 55 | 15 | 22 | 1752 | 781 |
| 32 | theupdateframework/notary | Go | 112.35 | 51 | 185 | 25 | 22 | 32 | 9 | 34 | 103985 | 67767 |
| 33 | opentracing/opentracing-go | Go | 19.95 | 10 | 21 | 1 | 3 | 6 | 3 | 5 | 108 | 8 |

