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

### Repo activity

We calculated the activity of all CNCF graduated and incubating project repositories and the data is as follows.

| # | name | language | activity | developer_count | issue_comment | open_issue | open_pull | pull_review_comment | merge_pull | pull_commits | pull_additions | pull_deletions |
|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| 1 | kubernetes/kubernetes | Go | 19950.13 | 6136 | 240534 | 3683 | 6904 | 31394 | 4826 | 6764 | 1330815 | 730996 |
| 2 | envoyproxy/envoy | C++ | 5880.7 | 1120 | 23912 | 1665 | 3191 | 23165 | 2631 | 19487 | 577697 | 258318 |
| 3 | helm/helm | Go | 4102.83 | 2054 | 10416 | 938 | 626 | 1046 | 422 | 716 | 23133 | 8616 |
| 4 | grpc/grpc | C++ | 3265.66 | 1197 | 9996 | 914 | 2226 | 3764 | 1788 | 4143 | 677587 | 594442 |
| 5 | goharbor/harbor | Go | 2921.29 | 1158 | 8645 | 1761 | 1535 | 2640 | 1298 | 1605 | 672319 | 381076 |
| 6 | prometheus/prometheus | Go | 2574.32 | 785 | 9938 | 543 | 1038 | 5807 | 742 | 2137 | 431922 | 276505 |
| 7 | rook/rook | Go | 2530.96 | 719 | 6965 | 761 | 1439 | 7075 | 1294 | 1844 | 125368 | 72711 |
| 8 | argoproj/argo | Go | 2498.52 | 741 | 10276 | 1411 | 1359 | 3757 | 1128 | 10877 | 307206 | 141788 |
| 9 | tikv/tikv | Rust | 2193.03 | 259 | 18078 | 993 | 2041 | 5645 | 1538 | 11334 | 481754 | 206511 |
| 10 | thanos-io/thanos | Go | 2128.62 | 577 | 7108 | 642 | 991 | 4955 | 786 | 2195 | 192675 | 57575 |
| 11 | operator-framework/operator-sdk | Go | 2023.73 | 488 | 6833 | 687 | 1214 | 7910 | 1019 | 2704 | 159641 | 122451 |
| 12 | etcd-io/etcd | Go | 1578.75 | 622 | 4313 | 314 | 541 | 791 | 391 | 586 | 160055 | 128651 |
| 13 | cri-o/cri-o | Go | 1450.41 | 256 | 36375 | 194 | 1213 | 2072 | 953 | 1420 | 675325 | 520831 |
| 14 | linkerd/linkerd2 | Go | 1439.05 | 396 | 4995 | 575 | 847 | 2524 | 727 | 2865 | 215799 | 168044 |
| 15 | cortexproject/cortex | Go | 1372.81 | 217 | 3869 | 450 | 1213 | 6188 | 1114 | 4800 | 760919 | 369878 |
| 16 | containerd/containerd | Go | 1344.24 | 418 | 5046 | 198 | 687 | 1002 | 572 | 2983 | 324315 | 153782 |
| 17 | kubeedge/kubeedge | Go | 1194.78 | 255 | 6229 | 363 | 674 | 1702 | 512 | 935 | 424924 | 202139 |
| 18 | jaegertracing/jaeger | Go | 1083.4 | 324 | 3085 | 306 | 338 | 1942 | 281 | 993 | 43002 | 22686 |
| 19 | vitessio/vitess | Go | 1007.83 | 160 | 2164 | 436 | 1070 | 2136 | 916 | 3694 | 390365 | 332061 |
| 20 | open-policy-agent/opa | Go | 917.03 | 259 | 2214 | 452 | 531 | 1158 | 474 | 781 | 305088 | 83751 |
| 21 | coredns/coredns | Go | 915.32 | 316 | 3049 | 239 | 489 | 551 | 359 | 572 | 11537 | 7390 |
| 22 | projectcontour/contour | Go | 838.58 | 184 | 3616 | 438 | 685 | 2113 | 625 | 1001 | 156296 | 73927 |
| 23 | falcosecurity/falco | C++ | 745.39 | 253 | 4148 | 229 | 277 | 426 | 231 | 728 | 10918 | 9621 |
| 24 | spiffe/spire | Go | 568.69 | 73 | 1140 | 222 | 452 | 1697 | 409 | 1235 | 126543 | 58703 |
| 25 | fluent/fluentd | Ruby | 538.39 | 233 | 1052 | 187 | 171 | 237 | 164 | 413 | 9380 | 2680 |
| 26 | buildpacks/pack | Go | 506.82 | 97 | 1329 | 229 | 311 | 1218 | 270 | 1082 | 195352 | 222007 |
| 27 | nats-io/nats-server | Go | 463.67 | 106 | 1109 | 131 | 390 | 1920 | 360 | 833 | 119798 | 17500 |
| 28 | dragonflyoss/Dragonfly | Go | 403.02 | 92 | 1630 | 125 | 191 | 358 | 148 | 209 | 20599 | 1859 |
| 29 | cloudevents/spec | Shell | 385.9 | 76 | 752 | 72 | 112 | 780 | 92 | 206 | 6104 | 1831 |
| 30 | theupdateframework/tuf | Python | 237.43 | 29 | 1079 | 113 | 171 | 664 | 132 | 335 | 7176 | 4885 |
| 31 | containernetworking/cni | Go | 128.59 | 44 | 249 | 21 | 25 | 56 | 15 | 22 | 1752 | 781 |
| 32 | theupdateframework/notary | Go | 115.44 | 52 | 189 | 25 | 22 | 32 | 12 | 39 | 106639 | 67919 |
| 33 | opentracing/opentracing-go | Go | 19.95 | 10 | 21 | 1 | 3 | 6 | 3 | 5 | 108 | 8 |


### Developer activity

We also calculate the top 20 developers data and the data is as follows.


- kubernetes/kubernetes

| # | login | activity | issue_comment | open_issue | open_pull | pull_review_comment | merge_pull | pull_commits | pull_additions | pull_deletions |
|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| 1 | k8s-ci-robot | 129325 |  129325 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 2 | liggitt | 18009 |  5268 | 70 | 223 | 2718 | 212 | 312 | 106332 | 80397 |
| 3 | fejta-bot | 15496 |  15472 | 12 | 0 | 0 | 0 | 0 | 0 | 0 |
| 4 | alculquicondor | 7682 |  1890 | 54 | 97 | 1237 | 89 | 117 | 15500 | 7172 |
| 5 | neolit123 | 6438 |  2596 | 4 | 70 | 821 | 68 | 83 | 3563 | 3563 |
| 6 | aojea | 6213 |  2095 | 31 | 124 | 816 | 84 | 108 | 6007 | 1836 |
| 7 | andrewsykim | 5339 |  937 | 6 | 72 | 976 | 54 | 110 | 9251 | 3006 |
| 8 | Huang-Wei | 4774 |  1346 | 24 | 87 | 681 | 79 | 88 | 8280 | 6617 |
| 9 | wojtek-t | 4597 |  1147 | 16 | 100 | 667 | 90 | 110 | 8423 | 5680 |
| 10 | lavalamp | 4251 |  1085 | 13 | 11 | 768 | 7 | 12 | 225 | 168 |
| 11 | ahg-g | 4223 |  1304 | 48 | 46 | 615 | 45 | 49 | 7531 | 9507 |
| 12 | dims | 3954 |  2327 | 21 | 115 | 215 | 76 | 157 | 66074 | 77048 |
| 13 | msau42 | 3642 |  1019 | 21 | 37 | 575 | 34 | 48 | 2595 | 1749 |
| 14 | tedyu | 3617 |  1732 | 37 | 83 | 338 | 42 | 43 | 1228 | 627 |
| 15 | MikeSpreitzer | 3443 |  773 | 35 | 46 | 578 | 30 | 64 | 7710 | 1627 |
| 16 | BenTheElder | 3124 |  1569 | 11 | 34 | 324 | 27 | 48 | 3721 | 3770 |
| 17 | thockin | 2884 |  735 | 13 | 22 | 493 | 17 | 38 | 26973 | 27379 |
| 18 | andyzhangx | 2869 |  912 | 17 | 154 | 184 | 145 | 183 | 17055 | 3803 |
| 19 | apelisse | 2584 |  785 | 12 | 50 | 360 | 37 | 61 | 6433 | 1664 |
| 20 | deads2k | 2498 |  382 | 3 | 65 | 410 | 55 | 77 | 7839 | 60289 |

- containerd/containerd

| # | login | activity | issue_comment | open_issue | open_pull | pull_review_comment | merge_pull | pull_commits | pull_additions | pull_deletions |
|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| 1 | thaJeztah | 1843 |  324 | 3 | 145 | 107 | 130 | 242 | 171808 | 86546 |
| 2 | theopenlab-ci[bot] | 1694 |  1694 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 3 | AkihiroSuda | 1427 |  310 | 19 | 60 | 156 | 55 | 61 | 19380 | 15984 |
| 4 | fuweid | 819 |  200 | 0 | 27 | 102 | 26 | 29 | 631 | 177 |
| 5 | dmcgowan | 804 |  136 | 1 | 46 | 77 | 44 | 2186 | 34145 | 2833 |
| 6 | estesp | 764 |  198 | 1 | 55 | 36 | 51 | 126 | 2099 | 490 |
| 7 | mxpv | 480 |  59 | 2 | 26 | 51 | 27 | 39 | 2167 | 879 |
| 8 | dims | 466 |  126 | 1 | 30 | 37 | 20 | 24 | 18063 | 25353 |
| 9 | crosbymichael | 454 |  170 | 3 | 28 | 21 | 22 | 22 | 3321 | 738 |
| 10 | cpuguy83 | 379 |  124 | 1 | 15 | 37 | 12 | 15 | 491 | 134 |
| 11 | mikebrow | 254 |  81 | 1 | 9 | 26 | 8 | 8 | 197 | 82 |
| 12 | kzys | 229 |  36 | 0 | 17 | 18 | 14 | 17 | 1021 | 311 |
| 13 | TBBle | 223 |  58 | 3 | 11 | 24 | 6 | 13 | 781 | 366 |
| 14 | zhsj | 202 |  20 | 3 | 15 | 14 | 15 | 30 | 37473 | 14476 |
| 15 | codecov-io | 181 |  181 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 16 | tedyu | 156 |  24 | 1 | 6 | 23 | 4 | 4 | 55 | 65 |
| 17 | k8s-ci-robot | 134 |  134 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 18 | thehajime | 127 |  5 | 0 | 2 | 29 | 0 | 0 | 0 | 0 |
| 19 | kevpar | 124 |  19 | 1 | 7 | 13 | 6 | 7 | 2365 | 576 |
| 20 | deitch | 124 |  18 | 3 | 3 | 19 | 3 | 3 | 429 | 2 |

- grpc/grpc

| # | login | activity | issue_comment | open_issue | open_pull | pull_review_comment | merge_pull | pull_commits | pull_additions | pull_deletions |
|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| 1 | lidizheng | 4131 |  470 | 51 | 171 | 569 | 154 | 545 | 46486 | 47620 |
| 2 | jtattermusch | 3777 |  1250 | 20 | 187 | 289 | 154 | 441 | 118370 | 117905 |
| 3 | markdroth | 3723 |  658 | 104 | 191 | 336 | 188 | 350 | 111530 | 94136 |
| 4 | gnossen | 2758 |  398 | 41 | 100 | 392 | 82 | 423 | 58566 | 40779 |
| 5 | veblush | 2510 |  417 | 18 | 222 | 119 | 183 | 266 | 37586 | 27124 |
| 6 | yashykt | 2112 |  526 | 24 | 155 | 112 | 125 | 314 | 28025 | 67755 |
| 7 | vjpai | 1498 |  187 | 4 | 124 | 99 | 107 | 139 | 5675 | 4715 |
| 8 | apolcyn | 1471 |  216 | 26 | 75 | 167 | 62 | 97 | 4142 | 1747 |
| 9 | stale[bot] | 1243 |  1243 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 10 | ericgribkoff | 1198 |  36 | 0 | 96 | 101 | 94 | 188 | 7988 | 2785 |
| 11 | pfreixes | 1123 |  78 | 5 | 7 | 246 | 6 | 47 | 4062 | 733 |
| 12 | stanley-cheung | 1119 |  301 | 18 | 54 | 95 | 48 | 73 | 30783 | 7390 |
| 13 | donnadionne | 1094 |  85 | 1 | 117 | 39 | 100 | 162 | 49558 | 49061 |
| 14 | matthewstevenson88 | 626 |  42 | 0 | 29 | 103 | 17 | 70 | 1392 | 671 |
| 15 | ZhenLian | 626 |  83 | 2 | 37 | 72 | 28 | 37 | 7913 | 2947 |
| 16 | muxi | 587 |  118 | 3 | 36 | 55 | 27 | 76 | 5326 | 10914 |
| 17 | karthikravis | 537 |  77 | 14 | 56 | 1 | 52 | 135 | 15134 | 18168 |
| 18 | jiangtaoli2016 | 531 |  129 | 7 | 17 | 68 | 13 | 21 | 1989 | 1593 |
| 19 | yihuazhang | 530 |  66 | 0 | 7 | 102 | 7 | 16 | 597 | 122 |
| 20 | yulin-liang | 490 |  85 | 2 | 48 | 18 | 37 | 84 | 25105 | 22773 |

- rook/rook

| # | login | activity | issue_comment | open_issue | open_pull | pull_review_comment | merge_pull | pull_commits | pull_additions | pull_deletions |
|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| 1 | travisn | 12694 |  1057 | 73 | 253 | 2383 | 240 | 354 | 20369 | 23196 |
| 2 | leseb | 10123 |  827 | 39 | 224 | 1869 | 214 | 345 | 34553 | 17087 |
| 3 | mergify[bot] | 3273 |  153 | 0 | 400 | 0 | 384 | 523 | 25005 | 12615 |
| 4 | BlaineEXE | 2098 |  168 | 18 | 39 | 408 | 29 | 37 | 4905 | 4545 |
| 5 | subhamkrai | 1667 |  66 | 2 | 50 | 308 | 43 | 49 | 6728 | 2428 |
| 6 | Madhu-1 | 1619 |  369 | 5 | 46 | 223 | 42 | 92 | 3781 | 1305 |
| 7 | satoru-takeuchi | 1074 |  235 | 14 | 57 | 100 | 48 | 67 | 954 | 377 |
| 8 | vbnrh | 1043 |  11 | 0 | 5 | 248 | 5 | 5 | 1578 | 421 |
| 9 | thotz | 934 |  108 | 10 | 28 | 153 | 22 | 34 | 819 | 181 |
| 10 | umangachapagain | 722 |  38 | 2 | 12 | 146 | 12 | 22 | 1141 | 435 |
| 11 | galexrt | 618 |  145 | 7 | 27 | 62 | 26 | 27 | 1037 | 322 |
| 12 | stale[bot] | 616 |  616 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 13 | sp98 | 568 |  31 | 1 | 17 | 106 | 12 | 13 | 2237 | 1400 |
| 14 | jmolmo | 497 |  29 | 1 | 7 | 100 | 9 | 9 | 583 | 187 |
| 15 | aruniiird | 348 |  25 | 3 | 14 | 55 | 11 | 24 | 5026 | 2679 |
| 16 | nizamial09 | 340 |  33 | 0 | 12 | 54 | 11 | 12 | 728 | 372 |
| 17 | rajatsingh25aug | 327 |  54 | 2 | 4 | 58 | 5 | 5 | 76 | 88 |
| 18 | yuvalif | 296 |  4 | 0 | 0 | 73 | 0 | 0 | 0 | 0 |
| 19 | prksu | 284 |  18 | 1 | 11 | 44 | 11 | 16 | 3907 | 1187 |
| 20 | jbw976 | 275 |  22 | 0 | 3 | 56 | 4 | 4 | 298 | 25 |

- envoyproxy/envoy

| # | login | activity | issue_comment | open_issue | open_pull | pull_review_comment | merge_pull | pull_commits | pull_additions | pull_deletions |
|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| 1 | mattklein123 | 18527 |  2568 | 68 | 95 | 3772 | 90 | 294 | 24139 | 21474 |
| 2 | htuch | 11719 |  1323 | 83 | 172 | 2231 | 158 | 609 | 118227 | 83728 |
| 3 | alyssawilk | 6079 |  714 | 48 | 214 | 893 | 211 | 833 | 25462 | 12893 |
| 4 | jmarantz | 4935 |  549 | 28 | 75 | 950 | 61 | 958 | 8915 | 4713 |
| 5 | lizan | 4921 |  652 | 12 | 146 | 783 | 135 | 460 | 15904 | 17895 |
| 6 | antoniovicente | 4692 |  432 | 24 | 84 | 905 | 68 | 280 | 7587 | 2658 |
| 7 | asraa | 4492 |  348 | 20 | 106 | 839 | 86 | 545 | 21748 | 9143 |
| 8 | phlax | 3377 |  732 | 42 | 87 | 485 | 72 | 745 | 10267 | 4084 |
| 9 | snowp | 3194 |  313 | 33 | 63 | 594 | 50 | 498 | 11577 | 5392 |
| 10 | dio | 3180 |  628 | 10 | 71 | 511 | 55 | 503 | 9138 | 4324 |
| 11 | ggreenway | 2963 |  414 | 17 | 37 | 561 | 32 | 289 | 11133 | 6849 |
| 12 | lambdai | 2470 |  291 | 16 | 50 | 458 | 33 | 349 | 6299 | 1318 |
| 13 | junr03 | 2086 |  267 | 20 | 54 | 343 | 49 | 460 | 8431 | 1719 |
| 14 | yanavlasov | 1978 |  255 | 12 | 60 | 306 | 59 | 241 | 9510 | 3050 |
| 15 | repokitteh[bot] | 1895 |  1895 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 16 | zasweq | 1865 |  57 | 0 | 36 | 385 | 32 | 339 | 10042 | 2189 |
| 17 | PiotrSikora | 1826 |  308 | 17 | 78 | 220 | 74 | 199 | 4504 | 3275 |
| 18 | kyessenov | 1801 |  307 | 35 | 55 | 251 | 51 | 325 | 7479 | 3568 |
| 19 | sunjayBhatia | 1662 |  423 | 15 | 66 | 179 | 59 | 388 | 3731 | 2688 |
| 20 | rgs1 | 1609 |  283 | 23 | 68 | 194 | 60 | 461 | 7370 | 1722 |

- cri-o/cri-o

| # | login | activity | issue_comment | open_issue | open_pull | pull_review_comment | merge_pull | pull_commits | pull_additions | pull_deletions |
|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| 1 | openshift-ci-robot | 21896 |  21896 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 2 | haircommander | 7194 |  3394 | 17 | 301 | 432 | 227 | 400 | 58057 | 76155 |
| 3 | saschagrunert | 5560 |  2175 | 7 | 292 | 300 | 259 | 261 | 294707 | 190560 |
| 4 | kolyshkin | 2750 |  441 | 7 | 94 | 407 | 77 | 216 | 15187 | 20913 |
| 5 | openshift-merge-robot | 2189 |  2189 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 6 | mrunalp | 1521 |  654 | 2 | 32 | 158 | 27 | 41 | 421 | 200 |
| 7 | openshift-cherrypick-robot | 1452 |  545 | 0 | 129 | 0 | 104 | 128 | 2504 | 3001 |
| 8 | umohnani8 | 1171 |  529 | 0 | 66 | 41 | 56 | 69 | 83899 | 44271 |
| 9 | TomSweeneyRedHat | 1155 |  411 | 0 | 0 | 186 | 0 | 0 | 0 | 0 |
| 10 | giuseppe | 873 |  377 | 0 | 39 | 61 | 27 | 53 | 8709 | 5083 |
| 11 | codecov[bot] | 858 |  858 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 12 | tedyu | 732 |  274 | 8 | 38 | 42 | 32 | 32 | 224 | 148 |
| 13 | rhatdan | 600 |  532 | 0 | 6 | 10 | 2 | 2 | 18 | 1 |
| 14 | fidencio | 561 |  251 | 4 | 22 | 34 | 20 | 45 | 48973 | 92878 |
| 15 | wgahnagl | 542 |  12 | 1 | 13 | 116 | 5 | 6 | 774 | 1262 |
| 16 | dougsland | 428 |  196 | 0 | 23 | 27 | 11 | 11 | 2448 | 22 |
| 17 | hswong3i | 241 |  66 | 4 | 13 | 22 | 8 | 8 | 137 | 104 |
| 18 | vrothberg | 232 |  93 | 0 | 12 | 12 | 11 | 15 | 14259 | 6893 |
| 19 | aojea | 223 |  65 | 1 | 5 | 29 | 5 | 16 | 33935 | 659 |
| 20 | lsm5 | 214 |  94 | 0 | 14 | 7 | 10 | 10 | 204 | 38 |

- operator-framework/operator-sdk

| # | login | activity | issue_comment | open_issue | open_pull | pull_review_comment | merge_pull | pull_commits | pull_additions | pull_deletions |
|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| 1 | camilamacedo86 | 14681 |  1441 | 103 | 247 | 2862 | 169 | 467 | 32265 | 14274 |
| 2 | estroz | 8752 |  741 | 11 | 267 | 1487 | 248 | 406 | 45084 | 42882 |
| 3 | joelanford | 6426 |  589 | 18 | 140 | 1174 | 137 | 307 | 11715 | 23501 |
| 4 | jmrodri | 1903 |  164 | 7 | 27 | 381 | 24 | 61 | 1953 | 2060 |
| 5 | jmccormick2001 | 1722 |  95 | 2 | 60 | 297 | 51 | 362 | 6123 | 3644 |
| 6 | asmacdo | 1577 |  135 | 32 | 72 | 213 | 62 | 149 | 19829 | 12379 |
| 7 | hasbro17 | 1397 |  103 | 2 | 24 | 277 | 22 | 55 | 6019 | 7795 |
| 8 | varshaprasad96 | 1128 |  85 | 2 | 63 | 145 | 54 | 86 | 6635 | 5925 |
| 9 | fabianvf | 868 |  77 | 0 | 27 | 150 | 22 | 97 | 3464 | 3161 |
| 10 | openshift-ci-robot | 865 |  865 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 11 | bharathi-tenneti | 807 |  59 | 1 | 20 | 149 | 18 | 92 | 7241 | 1809 |
| 12 | jberkhahn | 625 |  101 | 8 | 23 | 91 | 15 | 22 | 1298 | 130 |
| 13 | openshift-bot | 464 |  464 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 14 | tengqm | 432 |  50 | 0 | 6 | 86 | 4 | 9 | 341 | 157 |
| 15 | openshift-cherrypick-robot | 401 |  65 | 0 | 42 | 0 | 42 | 103 | 3529 | 451 |
| 16 | rashmigottipati | 348 |  15 | 1 | 9 | 66 | 8 | 14 | 1582 | 542 |
| 17 | nikhil-thomas | 231 |  15 | 0 | 1 | 52 | 1 | 9 | 582 | 174 |
| 18 | dmesser | 231 |  23 | 1 | 7 | 40 | 5 | 14 | 285 | 58 |
| 19 | jeyaramashok | 212 |  14 | 1 | 1 | 47 | 1 | 1 | 178 | 104 |
| 20 | geerlingguy | 194 |  20 | 3 | 1 | 40 | 1 | 1 | 1 | 1 |

- prometheus/prometheus

| # | login | activity | issue_comment | open_issue | open_pull | pull_review_comment | merge_pull | pull_commits | pull_additions | pull_deletions |
|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| 1 | brian-brazil | 7436 |  1857 | 5 | 21 | 1349 | 22 | 25 | 573 | 408 |
| 2 | roidelapluie | 6872 |  2236 | 60 | 248 | 703 | 192 | 473 | 190100 | 152840 |
| 3 | bwplotka | 4216 |  521 | 21 | 55 | 822 | 40 | 133 | 22932 | 48887 |
| 4 | codesome | 4023 |  547 | 21 | 65 | 741 | 55 | 143 | 51474 | 15880 |
| 5 | beorn7 | 1510 |  411 | 8 | 34 | 204 | 33 | 72 | 15899 | 6416 |
| 6 | Harkishen-Singh | 1070 |  185 | 2 | 16 | 197 | 9 | 58 | 11995 | 260 |
| 7 | juliusv | 1039 |  295 | 7 | 16 | 158 | 10 | 18 | 385 | 221 |
| 8 | cstyan | 992 |  195 | 3 | 22 | 160 | 17 | 53 | 460 | 274 |
| 9 | krasi-georgiev | 693 |  104 | 0 | 8 | 135 | 5 | 15 | 274 | 63 |
| 10 | csmarchbanks | 673 |  114 | 2 | 14 | 112 | 13 | 19 | 839 | 644 |
| 11 | slrtbtfs | 653 |  136 | 7 | 27 | 78 | 22 | 172 | 5340 | 3373 |
| 12 | gotjosh | 540 |  24 | 4 | 4 | 119 | 4 | 22 | 1465 | 234 |
| 13 | liguozhong | 473 |  99 | 3 | 41 | 45 | 13 | 36 | 167 | 42 |
| 14 | johncming | 459 |  54 | 2 | 49 | 26 | 30 | 36 | 150 | 136 |
| 15 | boyskila | 417 |  35 | 1 | 11 | 73 | 11 | 92 | 5743 | 1901 |
| 16 | aSquare14 | 326 |  9 | 0 | 7 | 69 | 4 | 109 | 765 | 102 |
| 17 | brancz | 301 |  104 | 2 | 11 | 25 | 12 | 21 | 20104 | 6736 |
| 18 | pracucci | 289 |  43 | 3 | 16 | 33 | 12 | 31 | 745 | 209 |
| 19 | simonpasquier | 271 |  65 | 1 | 13 | 25 | 13 | 22 | 34139 | 9256 |
| 20 | ArthurSens | 268 |  43 | 2 | 9 | 41 | 6 | 18 | 69 | 21 |

- open-policy-agent/opa

| # | login | activity | issue_comment | open_issue | open_pull | pull_review_comment | merge_pull | pull_commits | pull_additions | pull_deletions |
|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| 1 | tsandall | 3250 |  482 | 100 | 153 | 341 | 149 | 271 | 142634 | 30824 |
| 2 | patrick-east | 2691 |  392 | 67 | 121 | 308 | 114 | 227 | 42485 | 35089 |
| 3 | ashutosh-narkar | 1049 |  173 | 3 | 29 | 162 | 27 | 28 | 10538 | 1109 |
| 4 | srenatus | 765 |  143 | 11 | 23 | 109 | 19 | 30 | 39150 | 13186 |
| 5 | koponen-styra | 491 |  49 | 2 | 38 | 41 | 32 | 63 | 52153 | 1775 |
| 6 | anderseknert | 466 |  104 | 21 | 24 | 37 | 20 | 20 | 1110 | 87 |
| 7 | gshively11 | 163 |  55 | 17 | 6 | 9 | 4 | 4 | 555 | 102 |
| 8 | timothyhinrichs | 158 |  26 | 3 | 7 | 20 | 5 | 11 | 472 | 17 |
| 9 | jpeach | 119 |  10 | 3 | 6 | 15 | 5 | 6 | 405 | 113 |
| 10 | princespaghetti | 107 |  12 | 0 | 8 | 9 | 7 | 9 | 209 | 12 |
| 11 | GBrawl | 86 |  10 | 0 | 8 | 3 | 8 | 12 | 1164 | 83 |
| 12 | jaspervdj-luminal | 84 |  10 | 3 | 4 | 9 | 4 | 4 | 1708 | 2 |
| 13 | dkiser | 66 |  6 | 0 | 1 | 13 | 1 | 2 | 1293 | 506 |
| 14 | Syn3rman | 55 |  12 | 0 | 3 | 6 | 2 | 4 | 74 | 7 |
| 15 | developer-guy | 54 |  1 | 0 | 6 | 5 | 3 | 4 | 17 | 3 |
| 16 | mjgpy3 | 53 |  3 | 1 | 3 | 6 | 3 | 3 | 336 | 6 |
| 17 | johanneslarsson | 52 |  12 | 2 | 1 | 7 | 1 | 1 | 198 | 362 |
| 18 | jonmclachlanatpurestorage | 45 |  2 | 2 | 1 | 9 | 0 | 0 | 0 | 0 |
| 19 | ajoysinha | 45 |  27 | 9 | 0 | 0 | 0 | 0 | 0 | 0 |
| 20 | mikaelcabot | 43 |  1 | 1 | 3 | 4 | 3 | 3 | 226 | 20 |

- argoproj/argo

| # | login | activity | issue_comment | open_issue | open_pull | pull_review_comment | merge_pull | pull_commits | pull_additions | pull_deletions |
|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| 1 | alexec | 14203 |  3099 | 327 | 497 | 1746 | 395 | 5623 | 184561 | 105250 |
| 2 | simster7 | 7452 |  1220 | 104 | 260 | 1006 | 244 | 1179 | 53222 | 19064 |
| 3 | sarabala1979 | 2239 |  375 | 49 | 113 | 233 | 99 | 2378 | 33234 | 5640 |
| 4 | sonarcloud[bot] | 948 |  948 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 5 | whynowy | 807 |  53 | 11 | 28 | 127 | 28 | 118 | 4313 | 1090 |
| 6 | terrytangyuan | 500 |  66 | 6 | 45 | 28 | 35 | 85 | 468 | 389 |
| 7 | rbreeze | 494 |  51 | 10 | 25 | 57 | 24 | 379 | 2352 | 530 |
| 8 | jessesuen | 489 |  62 | 11 | 1 | 98 | 2 | 2 | 22 | 15 |
| 9 | mark9white | 401 |  99 | 12 | 15 | 42 | 13 | 53 | 1822 | 497 |
| 10 | codecov[bot] | 380 |  380 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 11 | NikeNano | 342 |  87 | 2 | 16 | 37 | 11 | 129 | 1576 | 385 |
| 12 | dcherman | 326 |  44 | 12 | 15 | 32 | 17 | 32 | 1477 | 1173 |
| 13 | stale[bot] | 263 |  263 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 14 | mac9416 | 262 |  57 | 13 | 19 | 8 | 18 | 41 | 173 | 38 |
| 15 | dtaniwaki | 231 |  58 | 5 | 14 | 14 | 13 | 65 | 1338 | 659 |
| 16 | CLAassistant | 191 |  191 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 17 | changhc | 177 |  22 | 2 | 14 | 11 | 13 | 27 | 380 | 26 |
| 18 | lippertmarkus | 164 |  49 | 0 | 10 | 10 | 9 | 27 | 846 | 93 |
| 19 | danxmoran | 146 |  45 | 20 | 4 | 11 | 1 | 1 | 90 | 0 |
| 20 | hadim | 141 |  88 | 25 | 1 | 0 | 0 | 0 | 0 | 0 |

- theupdateframework/tuf

| # | login | activity | issue_comment | open_issue | open_pull | pull_review_comment | merge_pull | pull_commits | pull_additions | pull_deletions |
|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| 1 | joshuagl | 1428 |  231 | 12 | 37 | 223 | 34 | 108 | 2378 | 1595 |
| 2 | lukpueh | 932 |  255 | 39 | 18 | 115 | 17 | 50 | 1475 | 757 |
| 3 | MVrachev | 732 |  128 | 12 | 28 | 104 | 16 | 44 | 1617 | 1185 |
| 4 | jku | 620 |  159 | 29 | 17 | 68 | 16 | 40 | 661 | 760 |
| 5 | trishankatdatadog | 377 |  130 | 2 | 1 | 60 | 0 | 0 | 0 | 0 |
| 6 | sechkova | 376 |  57 | 5 | 12 | 57 | 9 | 39 | 923 | 478 |
| 7 | dependabot-preview[bot] | 319 |  14 | 1 | 46 | 0 | 33 | 33 | 33 | 33 |
| 8 | mnm678 | 169 |  43 | 1 | 7 | 22 | 3 | 15 | 52 | 58 |
| 9 | woodruffw | 82 |  15 | 0 | 2 | 14 | 1 | 3 | 19 | 14 |
| 10 | JustinCappos | 20 |  14 | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| 11 | jcstr | 19 |  3 | 0 | 2 | 0 | 2 | 2 | 10 | 3 |
| 12 | Silvanoc | 13 |  1 | 6 | 0 | 0 | 0 | 0 | 0 | 0 |
| 13 | SantiagoTorres | 11 |  3 | 0 | 1 | 0 | 1 | 1 | 8 | 2 |

- goharbor/harbor

| # | login | activity | issue_comment | open_issue | open_pull | pull_review_comment | merge_pull | pull_commits | pull_additions | pull_deletions |
|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| 1 | wy65701436 | 3616 |  317 | 86 | 186 | 416 | 181 | 224 | 89070 | 85326 |
| 2 | reasonerjt | 3489 |  773 | 92 | 127 | 409 | 103 | 111 | 74053 | 48071 |
| 3 | ywk253100 | 3394 |  236 | 100 | 165 | 422 | 155 | 161 | 51844 | 39686 |
| 4 | heww | 2824 |  231 | 49 | 139 | 352 | 134 | 138 | 96395 | 41107 |
| 5 | steven-zou | 1747 |  287 | 88 | 48 | 230 | 44 | 47 | 9134 | 2882 |
| 6 | AllForNothing | 1655 |  136 | 23 | 147 | 83 | 140 | 143 | 40630 | 25300 |
| 7 | danfengliu | 1606 |  36 | 120 | 192 | 21 | 134 | 143 | 25079 | 16227 |
| 8 | bitsf | 1540 |  445 | 97 | 83 | 73 | 72 | 78 | 17349 | 11872 |
| 9 | codecov[bot] | 1318 |  1318 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 10 | xaleeks | 1164 |  447 | 89 | 13 | 115 | 8 | 11 | 213 | 31 |
| 11 | ninjadq | 978 |  153 | 20 | 78 | 49 | 71 | 116 | 176647 | 76834 |
| 12 | stonezdj | 872 |  101 | 39 | 36 | 105 | 33 | 35 | 4243 | 906 |
| 13 | stale[bot] | 759 |  759 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 14 | jwangyangls | 600 |  40 | 6 | 53 | 41 | 45 | 45 | 6991 | 4121 |
| 15 | chlins | 477 |  70 | 7 | 38 | 21 | 39 | 43 | 7094 | 3072 |
| 16 | danielpacak | 348 |  39 | 4 | 20 | 39 | 17 | 24 | 720 | 307 |
| 17 | kofj | 313 |  17 | 1 | 20 | 36 | 18 | 18 | 22180 | 2389 |
| 18 | mmpei | 263 |  31 | 8 | 19 | 21 | 15 | 15 | 2389 | 135 |
| 19 | tedgxt | 231 |  6 | 0 | 20 | 25 | 13 | 18 | 1590 | 235 |
| 20 | renmaosheng | 213 |  99 | 13 | 2 | 18 | 2 | 2 | 134 | 1 |

- containernetworking/cni

| # | login | activity | issue_comment | open_issue | open_pull | pull_review_comment | merge_pull | pull_commits | pull_additions | pull_deletions |
|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| 1 | bboreham | 137 |  54 | 2 | 3 | 15 | 2 | 2 | 7 | 10 |
| 2 | dcbw | 125 |  31 | 1 | 6 | 11 | 6 | 10 | 1636 | 599 |
| 3 | mars1024 | 66 |  14 | 0 | 1 | 11 | 1 | 1 | 5 | 4 |
| 4 | squeed | 49 |  19 | 1 | 1 | 5 | 1 | 3 | 100 | 124 |
| 5 | adrianchiris | 46 |  12 | 3 | 3 | 1 | 3 | 3 | 3 | 1 |
| 6 | asellappen | 26 |  8 | 0 | 2 | 3 | 0 | 0 | 0 | 0 |
| 7 | asears | 25 |  4 | 0 | 3 | 3 | 0 | 0 | 0 | 0 |
| 8 | jellonek | 25 |  12 | 0 | 0 | 2 | 1 | 2 | 0 | 42 |
| 9 | coveralls | 24 |  24 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 10 | Colstuwjx | 20 |  9 | 0 | 1 | 2 | 0 | 0 | 0 | 0 |
| 11 | mccv1r0 | 12 |  6 | 0 | 2 | 0 | 0 | 0 | 0 | 0 |
| 12 | moshe010 | 11 |  3 | 0 | 0 | 2 | 0 | 0 | 0 | 0 |

- projectcontour/contour

| # | login | activity | issue_comment | open_issue | open_pull | pull_review_comment | merge_pull | pull_commits | pull_additions | pull_deletions |
|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| 1 | jpeach | 5340 |  775 | 120 | 177 | 746 | 162 | 196 | 32869 | 12428 |
| 2 | stevesloka | 3585 |  420 | 83 | 166 | 439 | 149 | 229 | 53013 | 35506 |
| 3 | youngnick | 2421 |  492 | 25 | 65 | 341 | 64 | 122 | 14604 | 15779 |
| 4 | skriss | 1993 |  225 | 20 | 95 | 257 | 83 | 128 | 34455 | 6692 |
| 5 | davecheney | 838 |  142 | 23 | 44 | 77 | 42 | 49 | 6105 | 964 |
| 6 | codecov[bot] | 615 |  615 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 7 | tsaarni | 548 |  69 | 3 | 16 | 90 | 13 | 14 | 2637 | 405 |
| 8 | jonasrosland | 212 |  5 | 2 | 20 | 12 | 19 | 30 | 541 | 75 |
| 9 | mattmoor | 180 |  71 | 10 | 8 | 5 | 9 | 12 | 1346 | 144 |
| 10 | aberasarte | 153 |  8 | 0 | 2 | 31 | 3 | 3 | 2371 | 934 |
| 11 | ShaileshSurya | 151 |  7 | 0 | 1 | 34 | 1 | 4 | 13 | 15 |
| 12 | sunjayBhatia | 137 |  40 | 1 | 7 | 11 | 6 | 23 | 448 | 55 |
| 13 | michmike | 130 |  38 | 7 | 11 | 0 | 9 | 36 | 65 | 50 |
| 14 | danehans | 126 |  27 | 6 | 10 | 3 | 9 | 16 | 199 | 15 |
| 15 | bgagnon | 84 |  24 | 4 | 2 | 9 | 2 | 4 | 117 | 15 |
| 16 | pims | 82 |  23 | 4 | 6 | 2 | 5 | 5 | 5306 | 23 |
| 17 | pickledrick | 71 |  17 | 1 | 3 | 7 | 3 | 3 | 219 | 58 |
| 18 | mike1808 | 55 |  6 | 1 | 3 | 7 | 2 | 5 | 367 | 54 |
| 19 | ffahri | 50 |  9 | 1 | 2 | 7 | 1 | 1 | 82 | 20 |
| 20 | erwbgy | 50 |  16 | 3 | 1 | 5 | 1 | 2 | 257 | 78 |

- cloudevents/spec

| # | login | activity | issue_comment | open_issue | open_pull | pull_review_comment | merge_pull | pull_commits | pull_additions | pull_deletions |
|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| 1 | duglin | 1837 |  337 | 23 | 39 | 288 | 37 | 58 | 1965 | 1014 |
| 2 | slinkydeveloper | 348 |  33 | 6 | 12 | 58 | 7 | 25 | 453 | 48 |
| 3 | lance | 246 |  11 | 2 | 4 | 51 | 3 | 8 | 279 | 43 |
| 4 | clemensv | 238 |  17 | 2 | 6 | 46 | 3 | 15 | 1576 | 8 |
| 5 | deissnerk | 233 |  39 | 1 | 4 | 40 | 4 | 9 | 78 | 27 |
| 6 | JemDay | 180 |  34 | 1 | 4 | 28 | 4 | 26 | 305 | 2 |
| 7 | mikehelmick | 166 |  8 | 1 | 3 | 33 | 3 | 14 | 694 | 126 |
| 8 | nachocano | 158 |  17 | 0 | 4 | 31 | 1 | 1 | 1 | 0 |
| 9 | jskeet | 134 |  26 | 2 | 0 | 26 | 0 | 0 | 0 | 0 |
| 10 | n3wscott | 122 |  22 | 8 | 6 | 9 | 6 | 14 | 288 | 392 |
| 11 | grantr | 117 |  1 | 0 | 0 | 29 | 0 | 0 | 0 | 0 |
| 12 | evankanderson | 113 |  13 | 0 | 0 | 25 | 0 | 0 | 0 | 0 |
| 13 | tweing | 90 |  10 | 2 | 2 | 15 | 2 | 3 | 166 | 1 |
| 14 | ryanhorn | 85 |  1 | 0 | 0 | 21 | 0 | 0 | 0 | 0 |
| 15 | bsideup | 66 |  6 | 0 | 1 | 13 | 1 | 1 | 2 | 2 |
| 16 | cneijenhuis | 64 |  12 | 0 | 1 | 11 | 1 | 2 | 15 | 6 |
| 17 | tsurdilo | 64 |  14 | 0 | 7 | 1 | 5 | 9 | 110 | 61 |
| 18 | EricWittmann | 54 |  2 | 0 | 0 | 13 | 0 | 0 | 0 | 0 |
| 19 | grant | 44 |  13 | 4 | 2 | 3 | 1 | 1 | 2 | 2 |
| 20 | anishj0shi | 42 |  4 | 1 | 1 | 7 | 1 | 2 | 14 | 0 |

- helm/helm

| # | login | activity | issue_comment | open_issue | open_pull | pull_review_comment | merge_pull | pull_commits | pull_additions | pull_deletions |
|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| 1 | bacongobbler | 3185 |  2096 | 4 | 35 | 199 | 36 | 41 | 884 | 595 |
| 2 | mattfarina | 1471 |  624 | 35 | 47 | 99 | 48 | 60 | 1714 | 2004 |
| 3 | hickeyma | 1179 |  667 | 4 | 17 | 92 | 17 | 31 | 768 | 125 |
| 4 | technosophos | 1032 |  424 | 4 | 46 | 63 | 42 | 58 | 5318 | 897 |
| 5 | marckhouzam | 811 |  238 | 5 | 31 | 75 | 34 | 44 | 3504 | 1528 |
| 6 | github-actions[bot] | 493 |  493 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 7 | bridgetkromhout | 374 |  260 | 0 | 15 | 1 | 13 | 15 | 116 | 46 |
| 8 | jdolitsky | 372 |  118 | 8 | 2 | 53 | 4 | 21 | 306 | 280 |
| 9 | waveywaves | 317 |  70 | 2 | 8 | 51 | 3 | 4 | 118 | 20 |
| 10 | liuming-dev | 256 |  89 | 15 | 16 | 16 | 5 | 23 | 32 | 38 |
| 11 | adamreese | 193 |  18 | 0 | 13 | 19 | 12 | 13 | 1134 | 1534 |
| 12 | donggangcj | 191 |  61 | 2 | 15 | 14 | 5 | 14 | 154 | 18 |
| 13 | karuppiah7890 | 172 |  56 | 0 | 2 | 25 | 2 | 2 | 115 | 30 |
| 14 | dependabot[bot] | 159 |  20 | 0 | 33 | 0 | 8 | 9 | 52 | 172 |
| 15 | thomastaylor312 | 151 |  66 | 0 | 1 | 18 | 2 | 4 | 348 | 3 |
| 16 | wawa0210 | 148 |  46 | 1 | 9 | 12 | 5 | 5 | 157 | 51 |
| 17 | TBBle | 115 |  95 | 0 | 0 | 5 | 0 | 0 | 0 | 0 |
| 18 | phroggyy | 113 |  32 | 1 | 1 | 19 | 0 | 0 | 0 | 0 |
| 19 | yinzara | 102 |  51 | 0 | 3 | 8 | 2 | 2 | 179 | 29 |
| 20 | zhouhao3 | 92 |  7 | 0 | 10 | 5 | 7 | 13 | 314 | 5 |

- cortexproject/cortex

| # | login | activity | issue_comment | open_issue | open_pull | pull_review_comment | merge_pull | pull_commits | pull_additions | pull_deletions |
|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| 1 | pracucci | 12656 |  925 | 72 | 334 | 2235 | 329 | 978 | 236878 | 91448 |
| 2 | pstibrany | 7948 |  561 | 30 | 208 | 1427 | 199 | 1219 | 79654 | 28169 |
| 3 | jtlisi | 2442 |  106 | 27 | 67 | 444 | 61 | 256 | 68489 | 13666 |
| 4 | gouthamve | 1586 |  129 | 14 | 71 | 229 | 60 | 175 | 22361 | 59260 |
| 5 | bboreham | 1273 |  233 | 32 | 49 | 161 | 37 | 85 | 1381 | 842 |
| 6 | sandeepsukhani | 1262 |  54 | 0 | 60 | 187 | 56 | 212 | 12163 | 2154 |
| 7 | codesome | 1206 |  118 | 9 | 48 | 179 | 42 | 150 | 186352 | 139493 |
| 8 | gotjosh | 1197 |  95 | 9 | 34 | 203 | 34 | 165 | 5514 | 962 |
| 9 | thorfour | 689 |  22 | 0 | 9 | 145 | 12 | 52 | 2073 | 603 |
| 10 | simonswine | 583 |  24 | 4 | 14 | 116 | 9 | 37 | 2447 | 298 |
| 11 | tomwilkie | 456 |  51 | 14 | 23 | 47 | 24 | 194 | 6848 | 10364 |
| 12 | stale[bot] | 424 |  424 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 13 | cyriltovena | 419 |  50 | 2 | 24 | 47 | 21 | 65 | 10109 | 1552 |
| 14 | bwplotka | 394 |  70 | 2 | 6 | 68 | 6 | 28 | 1682 | 1029 |
| 15 | Wing924 | 351 |  30 | 11 | 20 | 36 | 19 | 147 | 2435 | 809 |
| 16 | joe-elliott | 337 |  30 | 5 | 18 | 42 | 15 | 207 | 2794 | 340 |
| 17 | owen-d | 316 |  13 | 2 | 16 | 44 | 15 | 75 | 5851 | 486 |
| 18 | annanay25 | 281 |  14 | 2 | 15 | 37 | 14 | 112 | 12997 | 6201 |
| 19 | MichelHollands | 279 |  2 | 0 | 6 | 61 | 3 | 67 | 1364 | 56 |
| 20 | csmarchbanks | 244 |  15 | 2 | 13 | 29 | 14 | 26 | 382 | 128 |

- coredns/coredns

| # | login | activity | issue_comment | open_issue | open_pull | pull_review_comment | merge_pull | pull_commits | pull_additions | pull_deletions |
|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| 1 | miekg | 2325 |  751 | 38 | 97 | 193 | 87 | 162 | 3938 | 3707 |
| 2 | dependabot-preview[bot] | 1441 |  63 | 1 | 212 | 0 | 148 | 148 | 638 | 175 |
| 3 | chrisohaver | 1378 |  572 | 6 | 48 | 120 | 34 | 114 | 1491 | 724 |
| 4 | zouyee | 347 |  123 | 7 | 27 | 6 | 21 | 23 | 783 | 426 |
| 5 | yongtang | 331 |  116 | 2 | 23 | 8 | 22 | 31 | 1993 | 1918 |
| 6 | stickler-ci | 266 |  2 | 0 | 0 | 66 | 0 | 0 | 0 | 0 |
| 7 | SuperQ | 252 |  66 | 0 | 10 | 29 | 8 | 18 | 1425 | 117 |
| 8 | johnbelamaric | 168 |  86 | 1 | 1 | 18 | 1 | 1 | 1 | 0 |
| 9 | codecov-io | 166 |  166 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 10 | codecov-commenter | 133 |  133 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 11 | stp-ip | 107 |  51 | 0 | 1 | 12 | 1 | 1 | 1 | 5 |
| 12 | rdrozhdzh | 106 |  13 | 1 | 4 | 16 | 3 | 4 | 25 | 3 |
| 13 | denis-tingajkin | 91 |  30 | 3 | 1 | 13 | 0 | 0 | 0 | 0 |
| 14 | nyodas | 73 |  5 | 0 | 2 | 13 | 2 | 2 | 78 | 36 |
| 15 | ctryti | 59 |  2 | 0 | 1 | 11 | 2 | 6 | 270 | 52 |
| 16 | huntharo | 47 |  21 | 5 | 4 | 1 | 0 | 0 | 0 | 0 |
| 17 | networkop | 39 |  14 | 1 | 2 | 3 | 1 | 4 | 72 | 17 |
| 18 | WJayesh | 34 |  31 | 0 | 1 | 0 | 0 | 0 | 0 | 0 |
| 19 | bharath-123 | 34 |  15 | 0 | 1 | 4 | 0 | 0 | 0 | 0 |
| 20 | darshanime | 34 |  8 | 0 | 0 | 4 | 2 | 14 | 376 | 120 |

- thanos-io/thanos

| # | login | activity | issue_comment | open_issue | open_pull | pull_review_comment | merge_pull | pull_commits | pull_additions | pull_deletions |
|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| 1 | bwplotka | 11155 |  1804 | 167 | 188 | 1922 | 153 | 250 | 55505 | 24946 |
| 2 | kakkoyun | 2044 |  271 | 7 | 91 | 274 | 78 | 211 | 6405 | 6021 |
| 3 | yeya24 | 1861 |  319 | 19 | 78 | 235 | 66 | 144 | 9261 | 2010 |
| 4 | GiedriusS | 1831 |  310 | 10 | 42 | 300 | 35 | 77 | 4344 | 3269 |
| 5 | squat | 1680 |  137 | 3 | 35 | 313 | 36 | 59 | 2562 | 1682 |
| 6 | stale[bot] | 1240 |  1240 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 7 | pracucci | 1177 |  129 | 6 | 40 | 184 | 36 | 131 | 6561 | 1866 |
| 8 | khyatisoneji | 967 |  30 | 0 | 10 | 218 | 7 | 7 | 1827 | 646 |
| 9 | brancz | 955 |  173 | 4 | 29 | 138 | 27 | 40 | 4434 | 3306 |
| 10 | pstibrany | 929 |  75 | 4 | 24 | 171 | 18 | 165 | 3623 | 359 |
| 11 | yashrsharma44 | 777 |  63 | 5 | 14 | 153 | 10 | 44 | 922 | 205 |
| 12 | prmsrswt | 762 |  83 | 10 | 24 | 118 | 23 | 93 | 30462 | 2083 |
| 13 | povilasv | 595 |  27 | 0 | 5 | 132 | 5 | 7 | 79 | 52 |
| 14 | s-urbaniak | 594 |  70 | 3 | 13 | 106 | 11 | 215 | 45728 | 4274 |
| 15 | daixiang0 | 588 |  176 | 1 | 25 | 55 | 23 | 55 | 2289 | 140 |
| 16 | thisisobate | 491 |  50 | 4 | 22 | 68 | 19 | 47 | 787 | 242 |
| 17 | metalmatze | 351 |  48 | 0 | 21 | 40 | 16 | 34 | 940 | 275 |
| 18 | krasi-georgiev | 334 |  33 | 1 | 7 | 62 | 6 | 47 | 3805 | 588 |
| 19 | simonpasquier | 297 |  29 | 0 | 18 | 31 | 18 | 26 | 2010 | 852 |
| 20 | soniasingla | 270 |  49 | 3 | 11 | 38 | 6 | 16 | 535 | 82 |

- linkerd/linkerd2

| # | login | activity | issue_comment | open_issue | open_pull | pull_review_comment | merge_pull | pull_commits | pull_additions | pull_deletions |
|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| 1 | alpeb | 3519 |  417 | 32 | 150 | 472 | 140 | 313 | 16129 | 12642 |
| 2 | adleong | 3427 |  399 | 50 | 90 | 557 | 86 | 293 | 30364 | 89443 |
| 3 | zaharidichev | 1993 |  285 | 32 | 81 | 254 | 77 | 299 | 22142 | 6823 |
| 4 | Pothulapati | 1979 |  312 | 40 | 97 | 224 | 80 | 681 | 94828 | 40730 |
| 5 | kleimkuhler | 1898 |  168 | 15 | 84 | 272 | 72 | 337 | 5129 | 3192 |
| 6 | olix0r | 1377 |  290 | 77 | 75 | 87 | 72 | 228 | 3383 | 3268 |
| 7 | grampelberg | 906 |  542 | 30 | 6 | 64 | 6 | 10 | 4184 | 3093 |
| 8 | ihcsim | 607 |  283 | 6 | 2 | 74 | 2 | 3 | 23 | 22 |
| 9 | cpretzer | 581 |  231 | 6 | 25 | 37 | 23 | 50 | 2865 | 526 |
| 10 | joakimr-axis | 472 |  38 | 1 | 26 | 56 | 26 | 32 | 359 | 312 |
| 11 | Matei207 | 428 |  45 | 7 | 13 | 70 | 10 | 16 | 5898 | 1197 |
| 12 | mayankshah1607 | 387 |  99 | 6 | 22 | 30 | 18 | 81 | 1143 | 860 |
| 13 | hawkw | 229 |  69 | 4 | 8 | 22 | 8 | 34 | 166 | 3 |
| 14 | stale[bot] | 210 |  210 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 15 | kohsheen1234 | 191 |  25 | 0 | 5 | 34 | 3 | 25 | 109 | 62 |
| 16 | cypherfox | 187 |  59 | 4 | 9 | 17 | 5 | 104 | 7920 | 585 |
| 17 | naseemkullah | 159 |  55 | 3 | 6 | 15 | 4 | 5 | 1191 | 269 |
| 18 | aliariff | 155 |  24 | 0 | 9 | 16 | 8 | 29 | 428 | 362 |
| 19 | siggy | 143 |  22 | 11 | 5 | 16 | 4 | 8 | 142 | 6 |
| 20 | javaducky | 138 |  13 | 0 | 3 | 24 | 4 | 17 | 4137 | 178 |

- vitessio/vitess

| # | login | activity | issue_comment | open_issue | open_pull | pull_review_comment | merge_pull | pull_commits | pull_additions | pull_deletions |
|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| 1 | deepthi | 3373 |  320 | 44 | 107 | 536 | 100 | 267 | 23810 | 13831 |
| 2 | sougou | 2018 |  215 | 47 | 97 | 242 | 90 | 473 | 41747 | 58923 |
| 3 | systay | 1710 |  95 | 5 | 145 | 140 | 122 | 455 | 71677 | 62581 |
| 4 | harshit-gangal | 1694 |  215 | 17 | 103 | 159 | 100 | 436 | 50807 | 30669 |
| 5 | shlomi-noach | 1381 |  237 | 19 | 50 | 194 | 36 | 389 | 20896 | 10108 |
| 6 | PrismaPhonic | 1169 |  27 | 2 | 16 | 255 | 14 | 133 | 3349 | 995 |
| 7 | rohit-nayak-ps | 990 |  59 | 12 | 103 | 42 | 86 | 358 | 31152 | 11629 |
| 8 | enisoc | 733 |  40 | 7 | 20 | 131 | 19 | 21 | 3255 | 2980 |
| 9 | aquarapid | 666 |  84 | 86 | 52 | 6 | 46 | 83 | 10156 | 9214 |
| 10 | morgo | 518 |  114 | 11 | 34 | 30 | 32 | 67 | 1160 | 1435 |
| 11 | GuptaManan100 | 386 |  26 | 0 | 32 | 36 | 24 | 156 | 41148 | 35904 |
| 12 | derekperkins | 353 |  63 | 7 | 8 | 53 | 8 | 19 | 477 | 295 |
| 13 | ajm188 | 281 |  17 | 11 | 20 | 23 | 18 | 129 | 13232 | 3962 |
| 14 | teejae | 251 |  23 | 1 | 12 | 35 | 10 | 24 | 904 | 287 |
| 15 | rafael | 242 |  32 | 2 | 17 | 25 | 11 | 24 | 518 | 167 |
| 16 | ajeetj | 235 |  8 | 0 | 9 | 35 | 12 | 84 | 3380 | 2035 |
| 17 | dkhenry | 208 |  15 | 1 | 13 | 23 | 12 | 41 | 1318 | 199 |
| 18 | saifalharthi | 194 |  31 | 0 | 19 | 4 | 18 | 121 | 13304 | 12390 |
| 19 | arindamnayak | 177 |  16 | 1 | 13 | 20 | 8 | 58 | 1432 | 54278 |
| 20 | dweitzman | 155 |  34 | 6 | 8 | 10 | 9 | 9 | 652 | 87 |

- tikv/tikv

| # | login | activity | issue_comment | open_issue | open_pull | pull_review_comment | merge_pull | pull_commits | pull_additions | pull_deletions |
|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| 1 | sre-bot | 6984 |  5072 | 244 | 238 | 0 | 142 | 477 | 13953 | 5662 |
| 2 | BusyJay | 4428 |  545 | 32 | 109 | 748 | 100 | 468 | 14853 | 12146 |
| 3 | ti-srebot | 3681 |  2580 | 0 | 187 | 0 | 108 | 405 | 18265 | 5724 |
| 4 | sticnarf | 2831 |  549 | 12 | 91 | 405 | 73 | 538 | 11848 | 5694 |
| 5 | yiwu-arbug | 2256 |  457 | 33 | 48 | 351 | 37 | 290 | 6543 | 1662 |
| 6 | breeswish | 2093 |  671 | 35 | 33 | 282 | 25 | 106 | 3368 | 2281 |
| 7 | youjiali1995 | 2059 |  632 | 28 | 72 | 215 | 59 | 196 | 10750 | 4026 |
| 8 | hicqu | 1902 |  372 | 12 | 94 | 206 | 80 | 1060 | 16073 | 8162 |
| 9 | overvenus | 1854 |  268 | 22 | 56 | 276 | 54 | 308 | 17349 | 7063 |
| 10 | 5kbpers | 1753 |  496 | 17 | 90 | 157 | 65 | 554 | 14025 | 5255 |
| 11 | Little-Wallace | 1643 |  187 | 13 | 66 | 253 | 44 | 582 | 70948 | 14936 |
| 12 | gengliqi | 1566 |  195 | 9 | 66 | 215 | 59 | 367 | 9129 | 4838 |
| 13 | hunterlxt | 1330 |  270 | 17 | 62 | 145 | 52 | 359 | 12199 | 8659 |
| 14 | MyonKeminta | 1295 |  301 | 9 | 47 | 155 | 43 | 578 | 102747 | 26959 |
| 15 | andylokandy | 1255 |  384 | 3 | 21 | 178 | 18 | 194 | 2847 | 23940 |
| 16 | NingLin-P | 1250 |  242 | 1 | 47 | 165 | 41 | 331 | 6853 | 3826 |
| 17 | Connor1996 | 1181 |  234 | 12 | 27 | 183 | 22 | 155 | 6590 | 3741 |
| 18 | nrc | 1074 |  138 | 5 | 22 | 190 | 20 | 89 | 8332 | 8306 |
| 19 | zhongzc | 912 |  263 | 1 | 26 | 121 | 17 | 91 | 2831 | 478 |
| 20 | brson | 824 |  199 | 6 | 52 | 58 | 45 | 736 | 10869 | 8023 |

- etcd-io/etcd

| # | login | activity | issue_comment | open_issue | open_pull | pull_review_comment | merge_pull | pull_commits | pull_additions | pull_deletions |
|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| 1 | jingyih | 1014 |  220 | 3 | 45 | 102 | 49 | 64 | 27671 | 6975 |
| 2 | spzala | 964 |  208 | 1 | 49 | 88 | 51 | 52 | 709 | 235 |
| 3 | stale[bot] | 903 |  903 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 4 | tangcong | 803 |  210 | 5 | 43 | 66 | 38 | 79 | 1804 | 622 |
| 5 | ptabor | 719 |  174 | 7 | 44 | 51 | 39 | 97 | 43626 | 66890 |
| 6 | gyuho | 681 |  124 | 4 | 21 | 99 | 18 | 42 | 68577 | 37371 |
| 7 | xiang90 | 420 |  199 | 0 | 3 | 48 | 4 | 4 | 44 | 8 |
| 8 | mitake | 413 |  79 | 2 | 12 | 56 | 14 | 23 | 1381 | 381 |
| 9 | tedyu | 396 |  63 | 3 | 32 | 29 | 23 | 23 | 174 | 100 |
| 10 | cfc4n | 363 |  76 | 7 | 30 | 17 | 23 | 27 | 762 | 213 |
| 11 | YoyinZyc | 312 |  39 | 2 | 18 | 35 | 15 | 19 | 5080 | 2087 |
| 12 | jpbetz | 257 |  83 | 3 | 8 | 26 | 8 | 15 | 856 | 303 |
| 13 | agargi | 175 |  67 | 1 | 10 | 14 | 4 | 7 | 112 | 140 |
| 14 | nate-double-u | 149 |  66 | 0 | 19 | 4 | 2 | 2 | 144 | 5 |
| 15 | ironcladlou | 139 |  39 | 1 | 5 | 17 | 3 | 3 | 261 | 208 |
| 16 | philips | 133 |  39 | 1 | 4 | 15 | 4 | 11 | 1553 | 1462 |
| 17 | codecov-io | 131 |  131 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 18 | hexfusion | 103 |  22 | 0 | 10 | 4 | 7 | 7 | 17 | 5 |
| 19 | wswcfan | 99 |  15 | 0 | 6 | 9 | 6 | 8 | 1602 | 515 |
| 20 | viviyww | 98 |  28 | 0 | 12 | 1 | 6 | 6 | 18 | 11 |

- dragonflyoss/Dragonfly

| # | login | activity | issue_comment | open_issue | open_pull | pull_review_comment | merge_pull | pull_commits | pull_additions | pull_deletions |
|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| 1 | pouchrobot | 1336 |  939 | 44 | 53 | 0 | 30 | 30 | 547 | 221 |
| 2 | lowzj | 581 |  98 | 11 | 24 | 71 | 21 | 21 | 2859 | 703 |
| 3 | wangforthinker | 542 |  11 | 3 | 28 | 84 | 21 | 62 | 13362 | 303 |
| 4 | Starnop | 271 |  54 | 1 | 3 | 44 | 6 | 6 | 939 | 193 |
| 5 | allencloud | 264 |  66 | 1 | 2 | 45 | 2 | 2 | 51 | 3 |
| 6 | jim3ma | 192 |  55 | 0 | 8 | 22 | 5 | 15 | 1012 | 97 |
| 7 | fenggw-fnst | 153 |  4 | 0 | 18 | 0 | 19 | 19 | 269 | 8 |
| 8 | inoc603 | 99 |  25 | 1 | 0 | 18 | 0 | 0 | 0 | 0 |
| 9 | q384566678 | 96 |  1 | 0 | 10 | 5 | 9 | 13 | 294 | 78 |
| 10 | SataQiu | 95 |  11 | 0 | 5 | 11 | 5 | 5 | 413 | 136 |
| 11 | codecov-io | 94 |  94 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 12 | zhouhaibing089 | 87 |  7 | 0 | 0 | 20 | 0 | 0 | 0 | 0 |
| 13 | readerx | 55 |  16 | 1 | 1 | 6 | 2 | 2 | 8 | 2 |
| 14 | xujihui1985 | 52 |  4 | 0 | 2 | 8 | 2 | 3 | 98 | 18 |
| 15 | zcc35357949 | 49 |  4 | 3 | 3 | 5 | 2 | 2 | 65 | 14 |
| 16 | Hellcatlk | 48 |  1 | 0 | 5 | 3 | 4 | 4 | 187 | 14 |
| 17 | hhhhsdxxxx | 48 |  10 | 0 | 4 | 4 | 2 | 2 | 266 | 13 |
| 18 | wuchaojing | 46 |  5 | 5 | 4 | 1 | 3 | 3 | 6 | 5 |
| 19 | truongnh1992 | 37 |  1 | 0 | 4 | 1 | 4 | 4 | 38 | 19 |
| 20 | YanzheL | 36 |  3 | 0 | 1 | 5 | 2 | 6 | 144 | 12 |

- falcosecurity/falco

| # | login | activity | issue_comment | open_issue | open_pull | pull_review_comment | merge_pull | pull_commits | pull_additions | pull_deletions |
|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| 1 | poiana | 1810 |  1807 | 0 | 1 | 0 | 0 | 0 | 0 | 0 |
| 2 | leodido | 1601 |  454 | 28 | 54 | 171 | 49 | 199 | 2625 | 1434 |
| 3 | leogr | 1141 |  355 | 26 | 51 | 84 | 49 | 162 | 3051 | 5824 |
| 4 | fntlnz | 853 |  374 | 18 | 44 | 29 | 39 | 181 | 2541 | 1680 |
| 5 | kris-nova | 412 |  121 | 18 | 14 | 37 | 13 | 41 | 545 | 79 |
| 6 | Kaizhe | 374 |  37 | 0 | 20 | 43 | 21 | 32 | 278 | 69 |
| 7 | stale[bot] | 232 |  232 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 8 | mstemm | 224 |  19 | 2 | 16 | 22 | 13 | 45 | 1170 | 102 |
| 9 | vicenteherrera | 67 |  8 | 2 | 4 | 7 | 3 | 6 | 212 | 14 |
| 10 | marier-nico | 64 |  5 | 0 | 7 | 2 | 6 | 8 | 38 | 4 |
| 11 | nibalizer | 62 |  13 | 1 | 3 | 7 | 2 | 2 | 12 | 19 |
| 12 | admiral0 | 61 |  3 | 0 | 4 | 9 | 2 | 2 | 46 | 31 |
| 13 | deepskyblue86 | 55 |  5 | 0 | 5 | 5 | 3 | 3 | 23 | 1 |
| 14 | antoinedeschenes | 53 |  18 | 1 | 5 | 2 | 2 | 2 | 3 | 4 |
| 15 | rajibmitra | 43 |  12 | 3 | 4 | 2 | 1 | 1 | 33 | 7 |
| 16 | rung | 37 |  11 | 0 | 1 | 2 | 3 | 5 | 22 | 23 |
| 17 | JPLachance | 35 |  13 | 3 | 2 | 0 | 2 | 2 | 8 | 0 |
| 18 | danmx | 32 |  14 | 5 | 1 | 0 | 1 | 1 | 12 | 13 |
| 19 | smijolovic | 31 |  19 | 6 | 0 | 0 | 0 | 0 | 0 | 0 |
| 20 | afbjorklund | 26 |  14 | 0 | 1 | 1 | 1 | 1 | 3 | 2 |

- kubeedge/kubeedge

| # | login | activity | issue_comment | open_issue | open_pull | pull_review_comment | merge_pull | pull_commits | pull_additions | pull_deletions |
|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| 1 | fisherxu | 3897 |  962 | 14 | 106 | 516 | 105 | 213 | 180181 | 37308 |
| 2 | daixiang0 | 2705 |  673 | 32 | 148 | 246 | 108 | 140 | 4696 | 6480 |
| 3 | kubeedge-bot | 1887 |  1881 | 0 | 2 | 0 | 0 | 0 | 0 | 0 |
| 4 | kevin-wangzefeng | 1247 |  384 | 4 | 22 | 171 | 21 | 45 | 19350 | 669 |
| 5 | kadisi | 829 |  107 | 1 | 28 | 129 | 24 | 78 | 8104 | 3871 |
| 6 | GsssC | 779 |  232 | 17 | 20 | 97 | 13 | 29 | 2828 | 4567 |
| 7 | chendave | 612 |  68 | 0 | 11 | 114 | 11 | 15 | 409 | 160 |
| 8 | stale[bot] | 543 |  543 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 9 | luogangyi | 351 |  118 | 9 | 12 | 31 | 11 | 21 | 4884 | 2364 |
| 10 | ls889 | 294 |  44 | 2 | 17 | 30 | 15 | 27 | 576 | 196 |
| 11 | subpathdev | 262 |  32 | 0 | 4 | 52 | 2 | 14 | 46976 | 36866 |
| 12 | sailorvii | 240 |  11 | 6 | 13 | 32 | 10 | 34 | 5199 | 490 |
| 13 | muxuelan | 189 |  22 | 0 | 18 | 12 | 13 | 15 | 426 | 64 |
| 14 | dingyin | 165 |  14 | 7 | 10 | 18 | 7 | 45 | 29819 | 104329 |
| 15 | lvchenggang | 162 |  8 | 1 | 13 | 12 | 13 | 14 | 233 | 163 |
| 16 | kuramal | 160 |  16 | 0 | 19 | 8 | 11 | 22 | 459 | 691 |
| 17 | XJangel | 159 |  23 | 0 | 7 | 20 | 7 | 13 | 1793 | 294 |
| 18 | bitvijays | 152 |  34 | 6 | 5 | 19 | 3 | 19 | 1176 | 23 |
| 19 | YaozhongZhang | 150 |  8 | 3 | 12 | 10 | 12 | 12 | 237 | 148 |
| 20 | threestoneliu | 134 |  23 | 2 | 15 | 3 | 10 | 10 | 87 | 46 |

- jaegertracing/jaeger

| # | login | activity | issue_comment | open_issue | open_pull | pull_review_comment | merge_pull | pull_commits | pull_additions | pull_deletions |
|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| 1 | yurishkuro | 3961 |  611 | 36 | 44 | 734 | 42 | 146 | 3104 | 1071 |
| 2 | pavolloffay | 2215 |  401 | 34 | 94 | 266 | 80 | 238 | 24382 | 16332 |
| 3 | jpkrohling | 1591 |  407 | 26 | 25 | 238 | 21 | 51 | 1713 | 821 |
| 4 | objectiser | 551 |  81 | 17 | 6 | 97 | 6 | 10 | 114 | 25 |
| 5 | albertteoh | 527 |  56 | 10 | 19 | 76 | 18 | 56 | 732 | 397 |
| 6 | Ashmita152 | 497 |  72 | 2 | 21 | 67 | 18 | 87 | 1292 | 206 |
| 7 | joe-elliott | 412 |  74 | 2 | 18 | 50 | 16 | 101 | 1906 | 1374 |
| 8 | codecov[bot] | 313 |  313 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 9 | bhiravabhatla | 241 |  26 | 0 | 1 | 53 | 0 | 0 | 0 | 0 |
| 10 | annanay25 | 221 |  42 | 2 | 5 | 35 | 4 | 35 | 599 | 114 |
| 11 | morlay | 213 |  27 | 0 | 4 | 41 | 2 | 2 | 38 | 38 |
| 12 | rjs211 | 151 |  22 | 1 | 4 | 25 | 3 | 16 | 626 | 474 |
| 13 | TheDavidKruse | 118 |  5 | 1 | 1 | 27 | 0 | 0 | 0 | 0 |
| 14 | rubenvp8510 | 106 |  20 | 0 | 3 | 18 | 1 | 4 | 33 | 28 |
| 15 | Vemmy124 | 105 |  19 | 1 | 4 | 13 | 4 | 13 | 439 | 518 |
| 16 | vprithvi | 105 |  9 | 2 | 5 | 18 | 1 | 1 | 1 | 2 |
| 17 | MrXinWang | 90 |  10 | 0 | 1 | 18 | 1 | 2 | 54 | 71 |
| 18 | m8rge | 73 |  7 | 1 | 2 | 12 | 2 | 29 | 2151 | 149 |
| 19 | apm-opentt | 71 |  11 | 2 | 1 | 12 | 1 | 2 | 44 | 1 |
| 20 | frittentheke | 67 |  27 | 1 | 2 | 8 | 0 | 0 | 0 | 0 |

- nats-io/nats-server

| # | login | activity | issue_comment | open_issue | open_pull | pull_review_comment | merge_pull | pull_commits | pull_additions | pull_deletions |
|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| 1 | derekcollison | 3651 |  336 | 2 | 99 | 631 | 98 | 404 | 48719 | 6631 |
| 2 | kozlovic | 3379 |  159 | 8 | 98 | 605 | 98 | 153 | 53088 | 6041 |
| 3 | matthiashanel | 2145 |  102 | 30 | 88 | 331 | 79 | 146 | 11816 | 2468 |
| 4 | ripienaar | 1488 |  139 | 1 | 59 | 230 | 50 | 70 | 2470 | 1774 |
| 5 | wallyqs | 432 |  51 | 10 | 19 | 61 | 12 | 17 | 2568 | 484 |
| 6 | aricart | 211 |  18 | 6 | 6 | 32 | 7 | 15 | 567 | 64 |
| 7 | philpennock | 113 |  14 | 1 | 9 | 10 | 6 | 9 | 177 | 14 |
| 8 | ColinSullivan1 | 52 |  10 | 3 | 0 | 9 | 0 | 0 | 0 | 0 |
| 9 | AdamKorcz | 24 |  2 | 1 | 2 | 1 | 2 | 5 | 71 | 0 |
| 10 | gcolliso | 23 |  3 | 0 | 2 | 1 | 2 | 4 | 4 | 5 |
| 11 | masudur-rahman | 22 |  1 | 1 | 1 | 4 | 0 | 0 | 0 | 0 |
| 12 | PlatanoBailando | 22 |  20 | 1 | 0 | 0 | 0 | 0 | 0 | 0 |
| 13 | pas2k | 21 |  5 | 0 | 1 | 2 | 1 | 1 | 261 | 4 |
| 14 | variadico | 21 |  1 | 0 | 2 | 1 | 2 | 2 | 9 | 1 |
| 15 | pananton | 20 |  10 | 5 | 0 | 0 | 0 | 0 | 0 | 0 |
| 16 | kingkorf | 20 |  4 | 0 | 2 | 0 | 2 | 2 | 8 | 3 |
| 17 | harrisa1 | 17 |  1 | 0 | 1 | 2 | 1 | 5 | 40 | 11 |
| 18 | byazrail | 16 |  14 | 1 | 0 | 0 | 0 | 0 | 0 | 0 |
| 19 | bruth | 16 |  13 | 0 | 1 | 0 | 0 | 0 | 0 | 0 |
| 20 | JnMik | 15 |  13 | 1 | 0 | 0 | 0 | 0 | 0 | 0 |

- buildpacks/pack

| # | login | activity | issue_comment | open_issue | open_pull | pull_review_comment | merge_pull | pull_commits | pull_additions | pull_deletions |
|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| 1 | jromero | 2098 |  328 | 76 | 63 | 281 | 61 | 224 | 59160 | 196624 |
| 2 | dfreilich | 1729 |  167 | 13 | 69 | 256 | 61 | 236 | 9777 | 10350 |
| 3 | natalieparellano | 1188 |  144 | 27 | 22 | 206 | 20 | 92 | 59573 | 2381 |
| 4 | simonjjones | 629 |  19 | 4 | 16 | 121 | 14 | 72 | 11357 | 3049 |
| 5 | ameyer-pivotal | 511 |  44 | 4 | 10 | 96 | 9 | 31 | 5425 | 1594 |
| 6 | zmackie | 365 |  71 | 28 | 10 | 42 | 8 | 42 | 1042 | 372 |
| 7 | yaelharel | 337 |  17 | 6 | 5 | 67 | 5 | 25 | 541 | 116 |
| 8 | dwillist | 308 |  14 | 2 | 21 | 33 | 19 | 125 | 11361 | 1765 |
| 9 | elbandito | 276 |  26 | 1 | 17 | 33 | 13 | 36 | 2834 | 195 |
| 10 | jkutner | 202 |  14 | 0 | 7 | 33 | 7 | 67 | 11519 | 120 |
| 11 | codecov[bot] | 164 |  164 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 12 | dependabot[bot] | 156 |  9 | 0 | 24 | 0 | 15 | 23 | 125 | 130 |
| 13 | dgageot | 123 |  18 | 5 | 12 | 1 | 11 | 16 | 9776 | 2990 |
| 14 | micahyoung | 111 |  19 | 3 | 3 | 18 | 1 | 1 | 3 | 0 |
| 15 | supra08 | 98 |  14 | 0 | 7 | 12 | 3 | 28 | 717 | 86 |
| 16 | ekcasey | 82 |  30 | 14 | 2 | 2 | 2 | 2 | 20 | 22 |
| 17 | matejvasek | 44 |  27 | 1 | 1 | 3 | 0 | 0 | 0 | 0 |
| 18 | nebhale | 30 |  14 | 8 | 0 | 0 | 0 | 0 | 0 | 0 |
| 19 | abitrolly | 29 |  19 | 1 | 1 | 0 | 1 | 2 | 7 | 1 |
| 20 | aemengo | 28 |  4 | 0 | 2 | 2 | 2 | 6 | 276 | 151 |

- spiffe/spire

| # | login | activity | issue_comment | open_issue | open_pull | pull_review_comment | merge_pull | pull_commits | pull_additions | pull_deletions |
|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| 1 | azdagron | 4049 |  361 | 45 | 140 | 622 | 138 | 279 | 59228 | 42171 |
| 2 | MarcosDY | 1300 |  12 | 0 | 48 | 231 | 44 | 135 | 20805 | 3753 |
| 3 | amartinezfayo | 1215 |  59 | 17 | 26 | 231 | 24 | 117 | 4799 | 1669 |
| 4 | evan2645 | 721 |  164 | 38 | 20 | 84 | 17 | 42 | 2640 | 453 |
| 5 | marcosy | 557 |  19 | 0 | 27 | 78 | 29 | 148 | 7417 | 3785 |
| 6 | mcpherrinm | 396 |  77 | 14 | 23 | 28 | 22 | 58 | 1428 | 468 |
| 7 | dfeldman | 307 |  16 | 1 | 10 | 56 | 7 | 16 | 3299 | 372 |
| 8 | hiyosi | 299 |  24 | 4 | 19 | 30 | 18 | 29 | 2913 | 412 |
| 9 | rturner3 | 278 |  37 | 15 | 9 | 36 | 8 | 27 | 2861 | 435 |
| 10 | martincapello | 277 |  20 | 1 | 9 | 47 | 8 | 46 | 2724 | 1022 |
| 11 | ryysud | 262 |  42 | 4 | 24 | 10 | 20 | 59 | 1071 | 418 |
| 12 | faisal-memon | 230 |  18 | 1 | 5 | 45 | 3 | 9 | 2865 | 158 |
| 13 | APTy | 227 |  23 | 6 | 10 | 28 | 10 | 33 | 540 | 189 |
| 14 | anvega | 218 |  16 | 1 | 16 | 23 | 12 | 43 | 297 | 57 |
| 15 | kunzimariano | 165 |  5 | 4 | 8 | 22 | 8 | 21 | 2622 | 815 |
| 16 | asuffield | 133 |  6 | 0 | 1 | 31 | 0 | 0 | 0 | 0 |
| 17 | JonathanO | 126 |  7 | 1 | 8 | 17 | 5 | 23 | 3364 | 503 |
| 18 | amoore877 | 116 |  20 | 7 | 8 | 7 | 6 | 22 | 191 | 106 |
| 19 | prasadborole1 | 114 |  6 | 1 | 5 | 19 | 3 | 15 | 804 | 194 |
| 20 | ajessup | 60 |  6 | 1 | 0 | 13 | 0 | 0 | 0 | 0 |

- spiffe/spiffe

| # | login | activity | issue_comment | open_issue | open_pull | pull_review_comment | merge_pull | pull_commits | pull_additions | pull_deletions |
|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| 1 | spikecurtis | 77 |  9 | 0 | 4 | 9 | 4 | 10 | 53 | 26 |
| 2 | evan2645 | 65 |  5 | 0 | 6 | 3 | 6 | 14 | 69 | 125 |
| 3 | justinburke | 63 |  3 | 0 | 3 | 9 | 3 | 14 | 22 | 12 |
| 4 | azdagron | 42 |  7 | 0 | 1 | 8 | 0 | 0 | 0 | 0 |
| 5 | anvega | 20 |  2 | 1 | 2 | 0 | 2 | 4 | 18 | 13 |

- fluent/fluentd

| # | login | activity | issue_comment | open_issue | open_pull | pull_review_comment | merge_pull | pull_commits | pull_additions | pull_deletions |
|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| 1 | ganmacs | 1079 |  149 | 7 | 75 | 79 | 75 | 197 | 5564 | 1428 |
| 2 | repeatedly | 731 |  203 | 0 | 33 | 66 | 33 | 69 | 1634 | 756 |
| 3 | cosmo0920 | 546 |  96 | 3 | 27 | 57 | 27 | 94 | 1666 | 387 |
| 4 | kenhys | 156 |  82 | 5 | 7 | 2 | 7 | 7 | 56 | 24 |
| 5 | ashie | 115 |  26 | 1 | 5 | 13 | 4 | 10 | 131 | 25 |
| 6 | github-actions[bot] | 66 |  66 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 7 | mlasevich | 38 |  9 | 9 | 2 | 0 | 1 | 2 | 8 | 1 |
| 8 | BananaWanted | 37 |  3 | 1 | 1 | 6 | 1 | 4 | 17 | 10 |
| 9 | pranavmarla | 26 |  10 | 8 | 0 | 0 | 0 | 0 | 0 | 0 |
| 10 | onet-git | 23 |  4 | 0 | 2 | 2 | 1 | 1 | 41 | 2 |
| 11 | TiagoGoddard | 21 |  2 | 0 | 1 | 4 | 0 | 0 | 0 | 0 |
| 12 | tyarimi | 21 |  4 | 1 | 2 | 1 | 1 | 3 | 19 | 1 |
| 13 | vimalk78 | 19 |  7 | 0 | 1 | 1 | 1 | 1 | 19 | 2 |
| 14 | roman-geraskin | 19 |  3 | 0 | 1 | 2 | 1 | 5 | 53 | 2 |
| 15 | omerlh | 18 |  2 | 2 | 1 | 1 | 1 | 1 | 48 | 2 |
| 16 | kenrota | 17 |  1 | 0 | 2 | 0 | 2 | 2 | 5 | 1 |
| 17 | jiping-s | 17 |  1 | 2 | 1 | 1 | 1 | 2 | 17 | 32 |
| 18 | qingling128 | 14 |  8 | 3 | 0 | 0 | 0 | 0 | 0 | 0 |
| 19 | 4ndr4s | 13 |  11 | 1 | 0 | 0 | 0 | 0 | 0 | 0 |
| 20 | Hello-Linux | 13 |  5 | 4 | 0 | 0 | 0 | 0 | 0 | 0 |

- theupdateframework/notary

| # | login | activity | issue_comment | open_issue | open_pull | pull_review_comment | merge_pull | pull_commits | pull_additions | pull_deletions |
|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| 1 | thaJeztah | 109 |  26 | 0 | 6 | 10 | 5 | 6 | 2770 | 232 |
| 2 | marcofranssen | 102 |  43 | 7 | 6 | 3 | 3 | 25 | 83708 | 49518 |
| 3 | justincormack | 67 |  27 | 0 | 1 | 8 | 1 | 3 | 51 | 4430 |
| 4 | cquon | 51 |  8 | 0 | 2 | 8 | 1 | 1 | 20089 | 13735 |
| 5 | zhijianli88 | 17 |  5 | 0 | 1 | 1 | 1 | 3 | 7 | 4 |
| 6 | HuKeping | 14 |  12 | 1 | 0 | 0 | 0 | 0 | 0 | 0 |
| 7 | sethbergman | 13 |  2 | 0 | 1 | 2 | 0 | 0 | 0 | 0 |

- opentracing/opentracing-go

| # | login | activity | issue_comment | open_issue | open_pull | pull_review_comment | merge_pull | pull_commits | pull_additions | pull_deletions |
|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| 1 | yurishkuro | 46 |  10 | 0 | 2 | 5 | 2 | 3 | 14 | 7 |
| 2 | cyriltovena | 13 |  1 | 0 | 1 | 1 | 1 | 2 | 94 | 1 |


### Working Hour Distribution

We analyze the working hour distribution for CNCF during year 2020, and here are the results of our working hour distribution research for every repo.


- thanos-io/thanos

<embed src="http://gar2020.opensource-service.cn/svgrenderer/github/X-lab2017/github-analysis-report?path=sqls/working-hour-distribution/image.svg&data=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,null,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]&lang=en" style="width:600" />

- nats-io/nats-server

<embed src="http://gar2020.opensource-service.cn/svgrenderer/github/X-lab2017/github-analysis-report?path=sqls/working-hour-distribution/image.svg&data=[1,2,2,2,1,1,1,1,2,2,2,1,2,3,3,7,10,7,5,7,6,6,10,7,6,5,7,2,2,2,2,1,1,2,3,2,2,3,4,5,8,6,5,5,6,5,7,7,4,3,3,3,2,1,3,2,1,2,2,2,2,3,5,6,5,5,6,7,8,4,4,4,4,3,4,4,2,2,2,2,2,2,2,2,4,3,5,8,9,6,6,7,5,5,5,8,4,3,4,3,2,2,3,1,2,2,2,1,3,3,5,7,6,9,5,5,5,4,5,4,5,2,1,1,1,1,1,1,1,2,1,1,1,1,2,2,1,2,2,3,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,1,2,1,2,2,2,2,1,1]&lang=en" style="width:600" />

- thanos-io/thanos

<embed src="http://gar2020.opensource-service.cn/svgrenderer/github/X-lab2017/github-analysis-report?path=sqls/working-hour-distribution/image.svg&data=[1,1,1,1,1,1,2,4,6,7,8,10,7,10,7,7,7,7,6,4,3,3,2,0,1,1,2,2,1,2,4,6,7,8,6,8,8,9,8,8,6,5,7,3,3,2,2,2,1,1,2,2,1,2,4,5,7,7,6,9,7,8,8,8,6,6,6,5,5,3,2,2,1,2,2,2,1,2,2,5,7,7,8,9,8,9,9,8,9,6,5,3,3,4,2,1,1,2,2,2,2,1,3,5,7,8,6,6,7,6,9,5,7,5,3,4,4,2,1,2,1,1,1,4,3,3,3,3,2,2,3,2,3,2,3,2,3,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,1,2,1,1,3,1,2,1,2,2,1,1]&lang=en" style="width:600" />

- etcd-io/etcd

<embed src="http://gar2020.opensource-service.cn/svgrenderer/github/X-lab2017/github-analysis-report?path=sqls/working-hour-distribution/image.svg&data=[1,3,6,5,2,3,5,7,5,6,4,3,4,5,7,8,6,5,7,10,8,5,4,8,5,5,9,9,4,6,10,8,8,7,6,3,5,6,6,7,6,5,4,2,3,2,3,3,2,4,9,6,3,3,5,6,7,7,4,4,5,4,5,6,6,5,4,4,5,3,4,4,4,5,6,8,3,3,5,7,7,6,4,4,4,4,5,6,4,3,5,3,4,3,4,3,3,3,6,6,2,3,5,7,6,5,3,3,3,3,4,3,3,3,4,2,3,1,2,1,1,2,2,3,3,1,2,2,2,1,1,2,2,2,2,3,3,3,1,1,1,2,1,1,1,1,1,2,2,2,2,3,3,3,2,2,3,2,4,5,3,3,2,2,1,1,2,2]&lang=en" style="width:600" />

- spiffe/spiffe

<embed src="http://gar2020.opensource-service.cn/svgrenderer/github/X-lab2017/github-analysis-report?path=sqls/working-hour-distribution/image.svg&data=[1,1,2,3,1,0,1,0,2,1,3,1,1,1,1,1,1,4,2,1,0,2,3,1,2,3,4,2,1,1,2,2,0,1,0,1,2,3,2,3,2,2,4,4,3,1,1,4,0,1,2,0,0,1,2,1,2,2,1,1,0,2,1,0,1,6,3,1,1,1,1,5,1,1,0,1,1,1,1,0,2,1,2,2,1,2,0,5,1,2,4,3,8,10,1,1,2,1,0,1,1,1,3,1,0,2,1,0,1,5,3,2,4,2,1,2,2,1,2,1,2,2,0,1,0,1,0,1,1,1,0,1,0,0,1,1,0,0,1,0,0,0,0,0,2,2,0,1,0,1,0,0,3,0,1,0,1,1,1,1,1,1,1,0,1,0,1,0]&lang=en" style="width:600" />

- goharbor/harbor

<embed src="http://gar2020.opensource-service.cn/svgrenderer/github/X-lab2017/github-analysis-report?path=sqls/working-hour-distribution/image.svg&data=[1,3,8,7,4,4,7,8,10,6,5,3,2,3,3,3,3,2,1,1,1,1,1,1,1,3,9,7,4,4,8,8,8,7,5,4,3,3,3,3,2,2,1,1,1,1,1,1,2,3,5,7,5,4,7,7,8,7,6,4,4,3,3,3,2,2,1,1,1,1,1,1,1,4,6,5,4,4,7,7,7,6,5,4,3,3,4,4,3,2,1,1,1,2,1,1,1,3,5,5,3,3,6,6,6,5,4,3,2,2,2,2,2,1,1,1,1,1,1,1,1,1,1,2,1,1,1,2,1,1,1,1,1,1,1,2,1,1,1,1,1,1,1,1,1,1,2,2,1,1,2,2,2,2,2,2,1,1,2,1,1,1,1,1,1,1,1,1]&lang=en" style="width:600" />

- argoproj/argo

<embed src="http://gar2020.opensource-service.cn/svgrenderer/github/X-lab2017/github-analysis-report?path=sqls/working-hour-distribution/image.svg&data=[1,1,1,1,2,1,1,1,1,2,1,1,1,2,3,9,10,9,8,7,6,7,5,5,3,3,2,2,2,1,2,2,2,2,2,1,2,2,4,8,10,9,9,7,7,7,5,5,5,2,2,2,1,1,1,2,2,2,2,1,2,3,4,9,10,8,7,6,5,5,6,4,4,3,4,3,2,2,2,2,2,2,1,1,2,2,4,9,10,7,8,6,7,6,5,4,4,3,3,2,2,2,2,2,2,2,1,1,1,2,3,8,8,9,9,6,5,6,5,3,3,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,3,1,1,1,1,1,1]&lang=en" style="width:600" />

- linkerd/linkerd2

<embed src="http://gar2020.opensource-service.cn/svgrenderer/github/X-lab2017/github-analysis-report?path=sqls/working-hour-distribution/image.svg&data=[1,1,1,1,1,2,2,3,1,3,2,2,2,3,5,7,7,9,7,6,7,10,8,5,4,2,2,2,1,3,3,3,3,3,3,2,3,2,9,6,8,10,8,7,6,6,6,6,4,2,3,2,1,3,4,3,3,2,2,3,3,3,6,5,7,7,8,9,5,6,6,5,3,2,1,1,3,3,3,3,2,3,2,2,3,3,5,7,7,9,9,8,8,10,7,6,4,2,2,2,2,2,3,3,3,2,2,2,2,3,5,5,7,8,7,5,5,6,5,3,3,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]&lang=en" style="width:600" />

- jaegertracing/jaeger

<embed src="http://gar2020.opensource-service.cn/svgrenderer/github/X-lab2017/github-analysis-report?path=sqls/working-hour-distribution/image.svg&data=[2,2,3,3,4,2,3,8,10,7,7,5,6,9,8,7,7,5,6,3,2,3,2,2,3,3,3,6,3,4,5,7,8,8,6,6,7,6,7,9,9,7,4,3,3,3,2,1,3,3,4,4,4,2,4,6,10,8,6,7,6,8,8,8,7,6,3,5,3,3,2,1,2,3,3,4,3,4,5,6,6,10,7,7,6,8,6,9,6,5,4,4,3,4,2,3,3,4,4,3,2,2,4,8,10,8,5,5,5,5,9,7,4,5,4,3,4,2,2,3,1,2,2,1,1,1,2,3,2,3,1,1,2,2,1,2,1,1,1,2,1,2,1,1,1,1,2,1,1,1,1,1,2,1,2,2,2,1,1,2,1,1,3,3,2,1,1,1]&lang=en" style="width:600" />

- kubernetes/kubernetes

<embed src="http://gar2020.opensource-service.cn/svgrenderer/github/X-lab2017/github-analysis-report?path=sqls/working-hour-distribution/image.svg&data=[1,2,3,2,1,1,3,3,4,3,3,3,4,6,7,7,8,9,8,7,7,7,6,6,5,5,5,4,3,3,4,4,5,4,4,5,5,6,7,8,9,8,9,9,10,10,7,6,5,6,6,5,4,3,4,5,4,5,4,4,5,7,7,8,8,8,9,9,8,8,7,6,6,6,5,5,3,3,4,5,5,6,6,5,5,7,8,9,9,10,9,9,9,9,7,6,6,5,6,5,3,3,4,4,4,5,4,4,4,5,6,7,7,6,7,7,6,6,6,5,4,3,3,2,2,2,1,2,1,2,1,1,1,2,2,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,1,1,1,1,2,1,1,1]&lang=en" style="width:600" />

- cloudevents/spec

<embed src="http://gar2020.opensource-service.cn/svgrenderer/github/X-lab2017/github-analysis-report?path=sqls/working-hour-distribution/image.svg&data=[1,1,2,1,1,1,1,3,1,2,1,1,3,2,3,3,3,2,3,3,2,2,1,1,2,1,2,1,1,2,1,1,2,2,1,3,2,2,2,3,3,3,3,3,1,3,3,2,1,4,1,1,1,1,2,2,2,1,2,2,3,4,5,8,6,5,3,1,3,2,3,9,5,5,3,3,1,1,2,2,2,2,2,3,5,6,5,8,9,10,10,2,5,2,3,2,2,1,2,1,1,1,1,2,1,1,1,1,2,1,2,2,3,2,2,2,2,1,1,1,1,1,1,1,1,0,1,1,1,1,1,0,2,1,1,2,1,1,1,2,2,2,2,1,2,1,1,1,1,1,1,1,1,1,1,1,2,3,1,1,1,1,1,2,2,1,1,1]&lang=en" style="width:600" />

- cortexproject/cortex

<embed src="http://gar2020.opensource-service.cn/svgrenderer/github/X-lab2017/github-analysis-report?path=sqls/working-hour-distribution/image.svg&data=[1,1,1,1,1,1,4,7,7,9,8,7,7,8,9,6,8,7,5,3,3,2,2,1,1,1,1,1,1,1,3,7,8,8,10,9,6,7,9,9,8,5,4,3,2,2,2,1,1,1,1,1,1,1,3,5,10,9,8,8,8,9,7,10,8,5,4,2,3,2,2,2,1,1,1,1,1,1,4,6,8,8,9,7,8,9,10,9,9,6,4,3,3,2,1,1,1,1,1,1,1,2,3,7,8,8,8,8,6,6,7,9,7,5,3,3,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]&lang=en" style="width:600" />

- cri-o/cri-o

<embed src="http://gar2020.opensource-service.cn/svgrenderer/github/X-lab2017/github-analysis-report?path=sqls/working-hour-distribution/image.svg&data=[1,1,1,1,1,1,1,2,3,4,3,3,2,7,10,8,8,8,6,8,7,4,3,2,2,2,2,2,1,1,2,4,4,3,3,4,3,6,8,9,5,5,7,5,6,4,3,2,2,2,2,2,2,1,2,4,5,4,4,4,3,8,9,7,6,7,7,6,8,5,4,3,2,2,2,1,1,1,2,3,4,5,4,3,3,7,10,9,6,6,6,6,6,5,3,3,2,2,1,1,1,1,2,4,4,3,3,2,2,5,7,7,5,4,6,6,5,5,3,2,1,2,1,1,1,1,1,1,1,1,1,1,1,4,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1,1,1,1,1,1,1]&lang=en" style="width:600" />

- dragonflyoss/Dragonfly

<embed src="http://gar2020.opensource-service.cn/svgrenderer/github/X-lab2017/github-analysis-report?path=sqls/working-hour-distribution/image.svg&data=[1,3,6,4,5,4,6,6,5,6,3,3,3,6,2,1,1,2,1,2,1,1,1,2,1,5,9,5,2,3,3,5,4,6,3,2,4,3,5,3,1,1,1,0,2,0,1,1,2,4,8,8,5,3,5,5,5,6,3,1,5,2,3,4,2,2,1,1,1,1,1,1,2,10,7,6,3,2,7,6,5,6,3,7,3,2,1,1,1,1,1,1,1,1,2,3,1,4,6,5,3,4,5,10,7,7,7,2,2,3,2,1,1,1,1,1,1,1,1,1,1,2,1,1,2,1,2,2,1,2,1,3,1,1,2,1,1,1,1,1,1,1,2,4,3,4,2,3,2,1,3,2,2,3,2,2,2,3,2,2,2,2,1,1,1,1,1,3]&lang=en" style="width:600" />

- theupdateframework/tuf

<embed src="http://gar2020.opensource-service.cn/svgrenderer/github/X-lab2017/github-analysis-report?path=sqls/working-hour-distribution/image.svg&data=[1,0,0,1,1,0,1,2,3,4,8,7,5,5,5,4,3,2,4,1,1,2,2,1,1,1,0,1,0,1,1,2,3,4,8,5,5,7,5,5,3,2,3,2,3,3,1,2,1,0,0,1,1,1,1,1,3,4,9,5,5,7,6,6,7,1,1,3,2,1,1,1,1,1,1,1,0,0,2,3,5,8,10,10,4,6,5,6,5,2,3,1,5,4,1,1,1,0,1,1,1,1,1,3,3,6,10,5,7,4,10,7,2,2,3,1,2,1,1,1,0,1,1,0,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,1,0,0,0,1,1,0,1,1,1,0,1,1,0,1,1,1,1,0,1,1,1,1]&lang=en" style="width:600" />

- grpc/grpc

<embed src="http://gar2020.opensource-service.cn/svgrenderer/github/X-lab2017/github-analysis-report?path=sqls/working-hour-distribution/image.svg&data=[1,1,1,2,1,2,3,3,3,3,3,2,3,3,4,5,6,8,7,7,6,8,6,5,4,3,3,3,2,3,3,4,3,4,3,2,3,2,3,5,6,10,10,7,7,7,7,6,5,5,5,5,3,3,4,4,4,6,4,3,3,2,4,5,6,7,6,8,7,7,6,5,5,4,3,2,3,3,3,3,3,3,2,3,2,2,3,4,5,7,6,5,6,5,6,6,4,3,3,3,2,2,3,3,3,2,2,1,2,3,3,3,4,5,7,6,5,5,5,4,4,3,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]&lang=en" style="width:600" />

- envoyproxy/envoy

<embed src="http://gar2020.opensource-service.cn/svgrenderer/github/X-lab2017/github-analysis-report?path=sqls/working-hour-distribution/image.svg&data=[2,2,2,2,2,1,1,2,1,2,1,1,3,4,5,7,8,8,9,7,8,7,8,7,6,5,3,3,2,2,2,2,2,2,2,1,2,4,6,8,9,10,10,8,8,7,7,7,6,4,3,3,3,2,2,2,2,2,2,2,3,4,5,9,8,10,9,8,9,8,7,8,6,4,3,2,2,2,2,2,2,2,2,2,3,4,5,7,8,10,9,7,8,8,7,7,6,4,3,3,3,2,2,2,2,2,2,2,2,3,3,6,7,7,7,6,6,7,6,5,4,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,1,1]&lang=en" style="width:600" />

- theupdateframework/notary

<embed src="http://gar2020.opensource-service.cn/svgrenderer/github/X-lab2017/github-analysis-report?path=sqls/working-hour-distribution/image.svg&data=[1,2,2,1,1,1,4,2,7,7,2,5,2,5,2,4,3,1,2,3,1,2,2,1,0,4,3,4,2,1,1,2,8,6,1,2,1,7,4,5,2,2,4,1,4,1,1,1,3,1,5,4,1,2,4,2,5,7,8,10,3,8,4,4,7,0,5,2,1,2,0,4,1,2,1,1,2,1,4,5,3,3,9,3,1,5,3,4,2,4,2,1,4,2,2,1,2,1,2,2,3,3,3,3,5,9,7,7,9,9,4,7,2,2,3,1,4,2,4,2,1,2,0,2,3,3,1,1,4,4,5,1,3,2,2,0,2,2,1,4,1,1,2,1,0,1,1,1,0,1,1,1,1,1,1,1,2,1,2,1,1,4,2,2,1,1,0,3]&lang=en" style="width:600" />

- prometheus/prometheus

<embed src="http://gar2020.opensource-service.cn/svgrenderer/github/X-lab2017/github-analysis-report?path=sqls/working-hour-distribution/image.svg&data=[1,1,1,1,1,1,2,3,4,4,4,4,3,4,10,6,4,3,2,2,2,2,2,1,1,1,1,1,1,1,2,3,4,5,3,4,4,4,4,4,3,2,2,3,3,2,1,1,1,1,2,2,1,1,2,3,4,4,4,4,4,4,5,4,3,3,2,2,2,2,2,1,1,1,2,1,1,1,3,3,4,4,5,4,4,5,4,4,3,2,2,2,2,2,2,2,1,1,1,1,1,1,2,2,3,4,4,4,3,3,3,3,3,2,2,2,2,1,2,1,1,1,1,1,1,1,1,1,1,1,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]&lang=en" style="width:600" />

- containernetworking/cni

<embed src="http://gar2020.opensource-service.cn/svgrenderer/github/X-lab2017/github-analysis-report?path=sqls/working-hour-distribution/image.svg&data=[1,1,1,1,1,1,1,1,2,1,1,1,2,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1,1,1,1,1,1,1,1,1,1,1,1,2,1,1,1,1,1,1,1,1,1,1,2,1,1,1,1,1,1,2,2,2,1,2,3,10,8,2,2,1,1,1,1,1,1,2,2,2,1,1,2,1,2,2,2,1,2,2,2,1,1,1,1,1,1,1,1,1,1,1,2,1,1,1,1,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]&lang=en" style="width:600" />

- open-policy-agent/opa

<embed src="http://gar2020.opensource-service.cn/svgrenderer/github/X-lab2017/github-analysis-report?path=sqls/working-hour-distribution/image.svg&data=[1,1,1,1,1,1,2,2,3,2,2,3,5,6,7,8,6,7,8,9,6,5,6,4,4,2,2,2,1,1,3,2,4,4,2,3,4,6,6,5,6,7,7,6,7,5,4,5,3,4,3,2,1,1,2,2,2,2,2,3,3,4,5,4,7,6,6,8,7,6,7,5,4,4,3,2,2,2,2,2,3,2,3,4,5,4,5,4,7,7,10,6,5,6,6,4,3,3,2,2,1,2,2,2,2,3,2,3,4,4,5,4,4,6,9,7,6,4,3,4,3,1,1,2,1,1,1,1,1,1,1,1,1,1,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1,1,2,2,1,1,1,1,1,1,1,1]&lang=en" style="width:600" />

- falcosecurity/falco

<embed src="http://gar2020.opensource-service.cn/svgrenderer/github/X-lab2017/github-analysis-report?path=sqls/working-hour-distribution/image.svg&data=[1,1,1,1,1,1,1,2,5,8,7,3,5,6,6,7,6,5,5,5,4,4,2,2,1,1,2,1,1,1,1,2,3,10,6,7,5,5,10,5,9,8,5,5,4,3,2,3,1,1,1,1,1,2,3,2,6,6,6,5,5,7,3,6,7,5,4,4,3,4,2,2,1,1,2,2,2,1,2,3,4,4,7,5,5,6,10,6,6,8,6,4,4,3,2,3,2,2,2,1,2,1,2,2,3,6,5,5,5,6,5,4,6,5,3,2,2,1,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1,1,1,1,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1,1,2,2,1,1,1]&lang=en" style="width:600" />

- tikv/tikv

<embed src="http://gar2020.opensource-service.cn/svgrenderer/github/X-lab2017/github-analysis-report?path=sqls/working-hour-distribution/image.svg&data=[1,2,4,5,4,5,6,7,7,6,5,5,3,6,2,2,1,1,1,1,1,1,1,1,1,2,4,5,4,5,7,7,6,6,4,5,4,6,3,2,2,1,1,1,1,1,1,1,1,2,4,10,5,5,8,7,7,6,5,4,4,7,3,2,2,1,1,1,1,1,1,1,1,2,4,6,5,5,7,8,7,8,5,5,5,7,3,2,2,1,1,1,1,1,1,1,1,3,4,5,4,6,9,7,8,8,5,5,4,6,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1,2,1,2,3,3,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1]&lang=en" style="width:600" />

- kubeedge/kubeedge

<embed src="http://gar2020.opensource-service.cn/svgrenderer/github/X-lab2017/github-analysis-report?path=sqls/working-hour-distribution/image.svg&data=[1,8,10,7,3,3,9,8,10,7,4,5,5,5,4,2,1,1,1,1,1,1,1,1,1,6,8,6,3,2,8,9,7,7,5,6,6,3,3,2,2,1,1,1,1,1,1,1,2,7,7,7,2,3,9,8,7,5,3,3,3,3,3,2,1,1,1,1,1,1,1,1,2,7,6,8,3,2,7,7,8,7,4,5,6,4,4,2,2,2,1,1,1,1,1,1,2,6,9,8,3,4,10,10,9,7,6,5,4,3,3,1,1,1,1,1,1,1,1,1,1,2,3,3,2,1,3,6,4,3,3,2,1,2,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1,2,2,2,1,2,2,1,1,1,1,2,1,1,1,1,1,1,1,1]&lang=en" style="width:600" />

- projectcontour/contour

<embed src="http://gar2020.opensource-service.cn/svgrenderer/github/X-lab2017/github-analysis-report?path=sqls/working-hour-distribution/image.svg&data=[6,7,4,5,6,6,3,4,1,2,1,1,2,3,4,5,4,5,5,6,8,9,8,10,7,5,5,5,6,5,5,4,3,1,2,1,1,1,4,6,7,5,5,7,8,8,6,7,9,6,5,5,6,6,3,3,2,1,1,2,2,1,5,6,5,3,5,6,7,7,5,6,7,8,5,6,6,4,5,3,2,1,2,1,1,2,5,5,5,4,6,6,5,6,7,6,7,7,6,5,4,4,3,2,2,2,1,1,1,2,4,6,4,4,3,4,5,4,3,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,3,4,7]&lang=en" style="width:600" />

- buildpacks/pack

<embed src="http://gar2020.opensource-service.cn/svgrenderer/github/X-lab2017/github-analysis-report?path=sqls/working-hour-distribution/image.svg&data=[1,1,1,1,1,1,1,1,1,1,1,2,1,4,4,6,7,8,6,8,9,8,5,2,2,2,2,1,1,1,1,1,2,2,2,1,2,6,6,9,8,8,7,9,9,7,5,3,3,3,2,1,1,1,2,1,1,2,2,1,1,4,10,9,7,4,6,6,6,8,5,2,1,1,1,1,1,2,1,1,1,2,1,1,2,3,7,6,6,7,7,5,9,6,3,3,1,2,1,1,2,1,1,2,2,1,3,3,3,5,6,6,7,4,7,6,7,4,3,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]&lang=en" style="width:600" />

- rook/rook

<embed src="http://gar2020.opensource-service.cn/svgrenderer/github/X-lab2017/github-analysis-report?path=sqls/working-hour-distribution/image.svg&data=[1,1,2,2,1,2,2,5,6,7,5,4,4,7,6,6,6,7,6,5,6,4,5,4,2,2,1,2,2,2,3,7,6,5,4,3,4,6,7,7,8,8,5,6,5,5,4,3,2,1,2,2,3,3,3,5,8,7,5,4,4,7,8,8,8,5,6,5,5,5,4,4,2,2,1,1,3,3,4,6,7,5,4,4,3,6,7,7,10,6,6,5,5,5,5,4,2,2,2,2,2,2,3,4,4,6,6,3,3,5,6,9,7,6,5,4,3,4,3,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1,1,1,1,1,1,1,1]&lang=en" style="width:600" />

- helm/helm

<embed src="http://gar2020.opensource-service.cn/svgrenderer/github/X-lab2017/github-analysis-report?path=sqls/working-hour-distribution/image.svg&data=[3,1,1,1,1,1,2,3,3,3,2,2,3,4,5,6,5,5,4,4,5,4,3,2,3,2,2,2,2,2,3,4,3,3,3,3,3,5,6,8,9,5,5,5,5,4,4,2,4,3,2,2,1,2,3,3,4,4,3,2,3,4,4,7,7,7,4,4,4,4,4,2,3,2,2,2,1,2,3,3,3,4,4,4,3,4,6,6,6,7,6,6,6,10,6,3,5,3,2,2,1,2,3,3,2,3,3,2,3,4,5,5,6,6,4,5,4,3,2,2,3,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,1,1,4,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]&lang=en" style="width:600" />

- coredns/coredns

<embed src="http://gar2020.opensource-service.cn/svgrenderer/github/X-lab2017/github-analysis-report?path=sqls/working-hour-distribution/image.svg&data=[1,1,1,1,1,1,2,9,10,10,5,2,3,6,9,6,5,4,3,3,2,2,1,1,1,1,1,1,1,1,2,3,3,2,2,2,2,4,4,4,3,2,2,2,2,2,1,1,1,1,1,2,1,2,2,2,3,2,2,2,3,3,2,3,3,3,3,2,2,1,1,1,1,1,1,1,1,1,2,2,4,3,2,2,3,3,4,3,4,3,3,2,2,3,1,1,1,2,1,1,1,2,2,2,4,3,3,3,3,3,2,3,4,2,2,2,1,1,1,1,1,1,1,1,1,1,2,1,1,1,1,1,1,1,1,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]&lang=en" style="width:600" />

- opentracing/opentracing-go

<embed src="http://gar2020.opensource-service.cn/svgrenderer/github/X-lab2017/github-analysis-report?path=sqls/working-hour-distribution/image.svg&data=[0,4,3,7,1,4,3,3,7,3,4,3,4,1,2,2,2,1,0,1,0,1,1,1,1,4,5,1,2,3,5,5,5,5,2,2,2,3,2,3,1,0,4,1,1,1,0,1,2,3,2,6,2,1,4,4,5,6,3,3,2,2,2,1,1,2,2,4,1,10,0,1,1,3,3,2,1,2,5,4,4,5,4,3,2,1,1,1,1,1,1,1,1,3,2,1,2,5,4,4,3,4,7,7,7,3,3,2,3,2,1,4,2,0,1,1,2,1,1,1,0,1,1,3,1,1,1,2,2,3,1,2,3,1,3,2,0,2,0,1,0,0,1,1,1,1,2,1,1,3,1,2,1,3,1,2,1,2,2,2,0,1,1,1,1,0,0,1]&lang=en" style="width:600" />

- spiffe/spire

<embed src="http://gar2020.opensource-service.cn/svgrenderer/github/X-lab2017/github-analysis-report?path=sqls/working-hour-distribution/image.svg&data=[1,1,1,1,1,2,1,1,1,1,1,1,1,3,2,4,5,8,8,4,6,6,6,4,1,2,2,2,1,1,1,1,1,1,1,1,2,3,4,5,5,9,10,6,9,9,9,7,3,2,2,1,1,1,1,1,1,1,1,1,4,5,5,6,6,10,8,9,9,8,5,3,3,2,1,1,1,1,1,1,1,1,1,1,2,3,4,6,7,10,7,9,8,10,10,8,4,3,1,1,1,2,1,1,1,1,1,2,2,4,4,7,10,9,6,5,7,6,6,3,2,1,1,1,0,1,1,1,1,1,1,0,1,1,2,1,1,1,1,1,1,1,1,2,1,1,1,1,1,1,1,0,1,1,1,0,1,1,0,1,1,1,1,1,0,1,0,1]&lang=en" style="width:600" />

- fluent/fluentd

<embed src="http://gar2020.opensource-service.cn/svgrenderer/github/X-lab2017/github-analysis-report?path=sqls/working-hour-distribution/image.svg&data=[2,6,8,4,4,6,6,4,8,6,5,4,2,3,4,2,4,2,2,2,1,2,2,1,3,6,9,10,4,10,10,8,6,5,4,4,3,4,3,3,3,3,2,3,2,2,1,1,2,4,8,4,4,4,3,6,7,9,3,3,2,4,3,3,2,2,2,1,2,2,1,2,3,3,6,4,3,4,6,9,8,5,4,3,4,4,4,4,2,2,2,2,2,2,2,3,4,3,8,8,3,7,6,6,5,5,3,3,2,3,4,3,2,2,2,2,2,2,1,1,2,2,1,2,1,2,1,1,2,2,1,1,1,2,1,1,2,1,1,1,1,2,2,1,1,1,1,1,1,1,1,2,3,1,1,1,1,1,1,1,1,2,2,1,1,1,1,2]&lang=en" style="width:600" />

- operator-framework/operator-sdk

<embed src="http://gar2020.opensource-service.cn/svgrenderer/github/X-lab2017/github-analysis-report?path=sqls/working-hour-distribution/image.svg&data=[1,1,1,1,1,1,1,1,2,2,2,2,3,5,5,6,7,7,10,8,7,6,5,4,3,3,3,3,1,1,1,1,1,3,3,4,3,4,6,7,8,10,6,6,5,6,4,3,3,3,2,2,2,2,1,2,2,2,3,3,3,4,5,6,6,7,8,8,7,6,5,4,5,3,3,3,2,1,1,1,2,2,3,3,3,4,7,7,7,6,8,7,6,4,5,3,5,2,3,2,2,1,1,1,1,3,3,3,3,4,5,6,7,7,8,6,6,4,3,4,2,2,2,1,1,1,1,1,1,1,1,2,2,1,1,1,1,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,1,1,1,1,1,1,1,1,1,1,1,2]&lang=en" style="width:600" />

- containerd/containerd

<embed src="http://gar2020.opensource-service.cn/svgrenderer/github/X-lab2017/github-analysis-report?path=sqls/working-hour-distribution/image.svg&data=[1,2,3,4,4,3,3,5,4,6,6,3,6,7,8,7,10,8,6,8,6,7,6,4,4,6,5,5,4,3,4,5,6,4,4,7,5,5,7,9,8,6,7,10,5,5,2,4,4,6,6,6,3,6,5,5,4,4,6,6,6,8,6,9,10,6,9,7,5,4,7,6,5,7,8,5,6,6,7,5,6,5,6,5,6,5,4,8,7,10,7,4,7,8,7,4,5,6,5,4,3,3,6,5,4,4,4,2,3,5,5,7,9,7,9,8,6,8,6,4,4,2,2,2,1,1,1,2,2,1,2,2,2,2,2,2,3,3,3,1,1,2,2,1,1,1,3,3,2,2,1,2,2,2,1,2,1,2,4,2,1,1,1,1,1,1,1,1]&lang=en" style="width:600" />

- vitessio/vitess

<embed src="http://gar2020.opensource-service.cn/svgrenderer/github/X-lab2017/github-analysis-report?path=sqls/working-hour-distribution/image.svg&data=[5,2,4,2,3,4,7,7,5,6,4,3,3,3,7,8,9,7,10,9,9,6,10,6,6,5,6,6,4,4,6,6,5,4,5,4,5,5,5,6,8,9,9,6,7,8,6,7,5,5,5,4,6,6,6,6,4,4,5,4,5,4,3,7,7,5,8,8,8,7,6,4,9,5,6,6,7,10,7,8,5,5,4,5,5,5,6,6,8,8,5,6,7,6,5,4,4,5,6,5,4,5,5,4,3,4,3,4,2,4,3,4,7,6,5,7,5,8,4,5,4,2,2,2,2,1,1,2,1,1,1,1,1,1,3,2,2,2,1,1,1,1,1,1,1,1,2,2,1,2,2,2,2,1,2,2,1,1,2,1,2,3,2,2,1,1,1,2]&lang=en" style="width:600" />


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

### 项目活跃度

我们计算了所有 CNCF 已毕业和正在孵化的项目仓库的活动情况，数据如下。

| # | name | language | activity | developer_count | issue_comment | open_issue | open_pull | pull_review_comment | merge_pull | pull_commits | pull_additions | pull_deletions |
|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| 1 | kubernetes/kubernetes | Go | 19950.13 | 6136 | 240534 | 3683 | 6904 | 31394 | 4826 | 6764 | 1330815 | 730996 |
| 2 | envoyproxy/envoy | C++ | 5880.7 | 1120 | 23912 | 1665 | 3191 | 23165 | 2631 | 19487 | 577697 | 258318 |
| 3 | helm/helm | Go | 4102.83 | 2054 | 10416 | 938 | 626 | 1046 | 422 | 716 | 23133 | 8616 |
| 4 | grpc/grpc | C++ | 3265.66 | 1197 | 9996 | 914 | 2226 | 3764 | 1788 | 4143 | 677587 | 594442 |
| 5 | goharbor/harbor | Go | 2921.29 | 1158 | 8645 | 1761 | 1535 | 2640 | 1298 | 1605 | 672319 | 381076 |
| 6 | prometheus/prometheus | Go | 2574.32 | 785 | 9938 | 543 | 1038 | 5807 | 742 | 2137 | 431922 | 276505 |
| 7 | rook/rook | Go | 2530.96 | 719 | 6965 | 761 | 1439 | 7075 | 1294 | 1844 | 125368 | 72711 |
| 8 | argoproj/argo | Go | 2498.52 | 741 | 10276 | 1411 | 1359 | 3757 | 1128 | 10877 | 307206 | 141788 |
| 9 | tikv/tikv | Rust | 2193.03 | 259 | 18078 | 993 | 2041 | 5645 | 1538 | 11334 | 481754 | 206511 |
| 10 | thanos-io/thanos | Go | 2128.62 | 577 | 7108 | 642 | 991 | 4955 | 786 | 2195 | 192675 | 57575 |
| 11 | operator-framework/operator-sdk | Go | 2023.73 | 488 | 6833 | 687 | 1214 | 7910 | 1019 | 2704 | 159641 | 122451 |
| 12 | etcd-io/etcd | Go | 1578.75 | 622 | 4313 | 314 | 541 | 791 | 391 | 586 | 160055 | 128651 |
| 13 | cri-o/cri-o | Go | 1450.41 | 256 | 36375 | 194 | 1213 | 2072 | 953 | 1420 | 675325 | 520831 |
| 14 | linkerd/linkerd2 | Go | 1439.05 | 396 | 4995 | 575 | 847 | 2524 | 727 | 2865 | 215799 | 168044 |
| 15 | cortexproject/cortex | Go | 1372.81 | 217 | 3869 | 450 | 1213 | 6188 | 1114 | 4800 | 760919 | 369878 |
| 16 | containerd/containerd | Go | 1344.24 | 418 | 5046 | 198 | 687 | 1002 | 572 | 2983 | 324315 | 153782 |
| 17 | kubeedge/kubeedge | Go | 1194.78 | 255 | 6229 | 363 | 674 | 1702 | 512 | 935 | 424924 | 202139 |
| 18 | jaegertracing/jaeger | Go | 1083.4 | 324 | 3085 | 306 | 338 | 1942 | 281 | 993 | 43002 | 22686 |
| 19 | vitessio/vitess | Go | 1007.83 | 160 | 2164 | 436 | 1070 | 2136 | 916 | 3694 | 390365 | 332061 |
| 20 | open-policy-agent/opa | Go | 917.03 | 259 | 2214 | 452 | 531 | 1158 | 474 | 781 | 305088 | 83751 |
| 21 | coredns/coredns | Go | 915.32 | 316 | 3049 | 239 | 489 | 551 | 359 | 572 | 11537 | 7390 |
| 22 | projectcontour/contour | Go | 838.58 | 184 | 3616 | 438 | 685 | 2113 | 625 | 1001 | 156296 | 73927 |
| 23 | falcosecurity/falco | C++ | 745.39 | 253 | 4148 | 229 | 277 | 426 | 231 | 728 | 10918 | 9621 |
| 24 | spiffe/spire | Go | 568.69 | 73 | 1140 | 222 | 452 | 1697 | 409 | 1235 | 126543 | 58703 |
| 25 | fluent/fluentd | Ruby | 538.39 | 233 | 1052 | 187 | 171 | 237 | 164 | 413 | 9380 | 2680 |
| 26 | buildpacks/pack | Go | 506.82 | 97 | 1329 | 229 | 311 | 1218 | 270 | 1082 | 195352 | 222007 |
| 27 | nats-io/nats-server | Go | 463.67 | 106 | 1109 | 131 | 390 | 1920 | 360 | 833 | 119798 | 17500 |
| 28 | dragonflyoss/Dragonfly | Go | 403.02 | 92 | 1630 | 125 | 191 | 358 | 148 | 209 | 20599 | 1859 |
| 29 | cloudevents/spec | Shell | 385.9 | 76 | 752 | 72 | 112 | 780 | 92 | 206 | 6104 | 1831 |
| 30 | theupdateframework/tuf | Python | 237.43 | 29 | 1079 | 113 | 171 | 664 | 132 | 335 | 7176 | 4885 |
| 31 | containernetworking/cni | Go | 128.59 | 44 | 249 | 21 | 25 | 56 | 15 | 22 | 1752 | 781 |
| 32 | theupdateframework/notary | Go | 115.44 | 52 | 189 | 25 | 22 | 32 | 12 | 39 | 106639 | 67919 |
| 33 | opentracing/opentracing-go | Go | 19.95 | 10 | 21 | 1 | 3 | 6 | 3 | 5 | 108 | 8 |


### 开发者活跃度

我们同时也统计了每个项目活跃度前 20 的开发者数据，数据如下。


- kubernetes/kubernetes

| # | login | activity | issue_comment | open_issue | open_pull | pull_review_comment | merge_pull | pull_commits | pull_additions | pull_deletions |
|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| 1 | k8s-ci-robot | 129325 |  129325 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 2 | liggitt | 18009 |  5268 | 70 | 223 | 2718 | 212 | 312 | 106332 | 80397 |
| 3 | fejta-bot | 15496 |  15472 | 12 | 0 | 0 | 0 | 0 | 0 | 0 |
| 4 | alculquicondor | 7682 |  1890 | 54 | 97 | 1237 | 89 | 117 | 15500 | 7172 |
| 5 | neolit123 | 6438 |  2596 | 4 | 70 | 821 | 68 | 83 | 3563 | 3563 |
| 6 | aojea | 6213 |  2095 | 31 | 124 | 816 | 84 | 108 | 6007 | 1836 |
| 7 | andrewsykim | 5339 |  937 | 6 | 72 | 976 | 54 | 110 | 9251 | 3006 |
| 8 | Huang-Wei | 4774 |  1346 | 24 | 87 | 681 | 79 | 88 | 8280 | 6617 |
| 9 | wojtek-t | 4597 |  1147 | 16 | 100 | 667 | 90 | 110 | 8423 | 5680 |
| 10 | lavalamp | 4251 |  1085 | 13 | 11 | 768 | 7 | 12 | 225 | 168 |
| 11 | ahg-g | 4223 |  1304 | 48 | 46 | 615 | 45 | 49 | 7531 | 9507 |
| 12 | dims | 3954 |  2327 | 21 | 115 | 215 | 76 | 157 | 66074 | 77048 |
| 13 | msau42 | 3642 |  1019 | 21 | 37 | 575 | 34 | 48 | 2595 | 1749 |
| 14 | tedyu | 3617 |  1732 | 37 | 83 | 338 | 42 | 43 | 1228 | 627 |
| 15 | MikeSpreitzer | 3443 |  773 | 35 | 46 | 578 | 30 | 64 | 7710 | 1627 |
| 16 | BenTheElder | 3124 |  1569 | 11 | 34 | 324 | 27 | 48 | 3721 | 3770 |
| 17 | thockin | 2884 |  735 | 13 | 22 | 493 | 17 | 38 | 26973 | 27379 |
| 18 | andyzhangx | 2869 |  912 | 17 | 154 | 184 | 145 | 183 | 17055 | 3803 |
| 19 | apelisse | 2584 |  785 | 12 | 50 | 360 | 37 | 61 | 6433 | 1664 |
| 20 | deads2k | 2498 |  382 | 3 | 65 | 410 | 55 | 77 | 7839 | 60289 |

- containerd/containerd

| # | login | activity | issue_comment | open_issue | open_pull | pull_review_comment | merge_pull | pull_commits | pull_additions | pull_deletions |
|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| 1 | thaJeztah | 1843 |  324 | 3 | 145 | 107 | 130 | 242 | 171808 | 86546 |
| 2 | theopenlab-ci[bot] | 1694 |  1694 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 3 | AkihiroSuda | 1427 |  310 | 19 | 60 | 156 | 55 | 61 | 19380 | 15984 |
| 4 | fuweid | 819 |  200 | 0 | 27 | 102 | 26 | 29 | 631 | 177 |
| 5 | dmcgowan | 804 |  136 | 1 | 46 | 77 | 44 | 2186 | 34145 | 2833 |
| 6 | estesp | 764 |  198 | 1 | 55 | 36 | 51 | 126 | 2099 | 490 |
| 7 | mxpv | 480 |  59 | 2 | 26 | 51 | 27 | 39 | 2167 | 879 |
| 8 | dims | 466 |  126 | 1 | 30 | 37 | 20 | 24 | 18063 | 25353 |
| 9 | crosbymichael | 454 |  170 | 3 | 28 | 21 | 22 | 22 | 3321 | 738 |
| 10 | cpuguy83 | 379 |  124 | 1 | 15 | 37 | 12 | 15 | 491 | 134 |
| 11 | mikebrow | 254 |  81 | 1 | 9 | 26 | 8 | 8 | 197 | 82 |
| 12 | kzys | 229 |  36 | 0 | 17 | 18 | 14 | 17 | 1021 | 311 |
| 13 | TBBle | 223 |  58 | 3 | 11 | 24 | 6 | 13 | 781 | 366 |
| 14 | zhsj | 202 |  20 | 3 | 15 | 14 | 15 | 30 | 37473 | 14476 |
| 15 | codecov-io | 181 |  181 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 16 | tedyu | 156 |  24 | 1 | 6 | 23 | 4 | 4 | 55 | 65 |
| 17 | k8s-ci-robot | 134 |  134 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 18 | thehajime | 127 |  5 | 0 | 2 | 29 | 0 | 0 | 0 | 0 |
| 19 | kevpar | 124 |  19 | 1 | 7 | 13 | 6 | 7 | 2365 | 576 |
| 20 | deitch | 124 |  18 | 3 | 3 | 19 | 3 | 3 | 429 | 2 |

- grpc/grpc

| # | login | activity | issue_comment | open_issue | open_pull | pull_review_comment | merge_pull | pull_commits | pull_additions | pull_deletions |
|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| 1 | lidizheng | 4131 |  470 | 51 | 171 | 569 | 154 | 545 | 46486 | 47620 |
| 2 | jtattermusch | 3777 |  1250 | 20 | 187 | 289 | 154 | 441 | 118370 | 117905 |
| 3 | markdroth | 3723 |  658 | 104 | 191 | 336 | 188 | 350 | 111530 | 94136 |
| 4 | gnossen | 2758 |  398 | 41 | 100 | 392 | 82 | 423 | 58566 | 40779 |
| 5 | veblush | 2510 |  417 | 18 | 222 | 119 | 183 | 266 | 37586 | 27124 |
| 6 | yashykt | 2112 |  526 | 24 | 155 | 112 | 125 | 314 | 28025 | 67755 |
| 7 | vjpai | 1498 |  187 | 4 | 124 | 99 | 107 | 139 | 5675 | 4715 |
| 8 | apolcyn | 1471 |  216 | 26 | 75 | 167 | 62 | 97 | 4142 | 1747 |
| 9 | stale[bot] | 1243 |  1243 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 10 | ericgribkoff | 1198 |  36 | 0 | 96 | 101 | 94 | 188 | 7988 | 2785 |
| 11 | pfreixes | 1123 |  78 | 5 | 7 | 246 | 6 | 47 | 4062 | 733 |
| 12 | stanley-cheung | 1119 |  301 | 18 | 54 | 95 | 48 | 73 | 30783 | 7390 |
| 13 | donnadionne | 1094 |  85 | 1 | 117 | 39 | 100 | 162 | 49558 | 49061 |
| 14 | matthewstevenson88 | 626 |  42 | 0 | 29 | 103 | 17 | 70 | 1392 | 671 |
| 15 | ZhenLian | 626 |  83 | 2 | 37 | 72 | 28 | 37 | 7913 | 2947 |
| 16 | muxi | 587 |  118 | 3 | 36 | 55 | 27 | 76 | 5326 | 10914 |
| 17 | karthikravis | 537 |  77 | 14 | 56 | 1 | 52 | 135 | 15134 | 18168 |
| 18 | jiangtaoli2016 | 531 |  129 | 7 | 17 | 68 | 13 | 21 | 1989 | 1593 |
| 19 | yihuazhang | 530 |  66 | 0 | 7 | 102 | 7 | 16 | 597 | 122 |
| 20 | yulin-liang | 490 |  85 | 2 | 48 | 18 | 37 | 84 | 25105 | 22773 |

- rook/rook

| # | login | activity | issue_comment | open_issue | open_pull | pull_review_comment | merge_pull | pull_commits | pull_additions | pull_deletions |
|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| 1 | travisn | 12694 |  1057 | 73 | 253 | 2383 | 240 | 354 | 20369 | 23196 |
| 2 | leseb | 10123 |  827 | 39 | 224 | 1869 | 214 | 345 | 34553 | 17087 |
| 3 | mergify[bot] | 3273 |  153 | 0 | 400 | 0 | 384 | 523 | 25005 | 12615 |
| 4 | BlaineEXE | 2098 |  168 | 18 | 39 | 408 | 29 | 37 | 4905 | 4545 |
| 5 | subhamkrai | 1667 |  66 | 2 | 50 | 308 | 43 | 49 | 6728 | 2428 |
| 6 | Madhu-1 | 1619 |  369 | 5 | 46 | 223 | 42 | 92 | 3781 | 1305 |
| 7 | satoru-takeuchi | 1074 |  235 | 14 | 57 | 100 | 48 | 67 | 954 | 377 |
| 8 | vbnrh | 1043 |  11 | 0 | 5 | 248 | 5 | 5 | 1578 | 421 |
| 9 | thotz | 934 |  108 | 10 | 28 | 153 | 22 | 34 | 819 | 181 |
| 10 | umangachapagain | 722 |  38 | 2 | 12 | 146 | 12 | 22 | 1141 | 435 |
| 11 | galexrt | 618 |  145 | 7 | 27 | 62 | 26 | 27 | 1037 | 322 |
| 12 | stale[bot] | 616 |  616 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 13 | sp98 | 568 |  31 | 1 | 17 | 106 | 12 | 13 | 2237 | 1400 |
| 14 | jmolmo | 497 |  29 | 1 | 7 | 100 | 9 | 9 | 583 | 187 |
| 15 | aruniiird | 348 |  25 | 3 | 14 | 55 | 11 | 24 | 5026 | 2679 |
| 16 | nizamial09 | 340 |  33 | 0 | 12 | 54 | 11 | 12 | 728 | 372 |
| 17 | rajatsingh25aug | 327 |  54 | 2 | 4 | 58 | 5 | 5 | 76 | 88 |
| 18 | yuvalif | 296 |  4 | 0 | 0 | 73 | 0 | 0 | 0 | 0 |
| 19 | prksu | 284 |  18 | 1 | 11 | 44 | 11 | 16 | 3907 | 1187 |
| 20 | jbw976 | 275 |  22 | 0 | 3 | 56 | 4 | 4 | 298 | 25 |

- envoyproxy/envoy

| # | login | activity | issue_comment | open_issue | open_pull | pull_review_comment | merge_pull | pull_commits | pull_additions | pull_deletions |
|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| 1 | mattklein123 | 18527 |  2568 | 68 | 95 | 3772 | 90 | 294 | 24139 | 21474 |
| 2 | htuch | 11719 |  1323 | 83 | 172 | 2231 | 158 | 609 | 118227 | 83728 |
| 3 | alyssawilk | 6079 |  714 | 48 | 214 | 893 | 211 | 833 | 25462 | 12893 |
| 4 | jmarantz | 4935 |  549 | 28 | 75 | 950 | 61 | 958 | 8915 | 4713 |
| 5 | lizan | 4921 |  652 | 12 | 146 | 783 | 135 | 460 | 15904 | 17895 |
| 6 | antoniovicente | 4692 |  432 | 24 | 84 | 905 | 68 | 280 | 7587 | 2658 |
| 7 | asraa | 4492 |  348 | 20 | 106 | 839 | 86 | 545 | 21748 | 9143 |
| 8 | phlax | 3377 |  732 | 42 | 87 | 485 | 72 | 745 | 10267 | 4084 |
| 9 | snowp | 3194 |  313 | 33 | 63 | 594 | 50 | 498 | 11577 | 5392 |
| 10 | dio | 3180 |  628 | 10 | 71 | 511 | 55 | 503 | 9138 | 4324 |
| 11 | ggreenway | 2963 |  414 | 17 | 37 | 561 | 32 | 289 | 11133 | 6849 |
| 12 | lambdai | 2470 |  291 | 16 | 50 | 458 | 33 | 349 | 6299 | 1318 |
| 13 | junr03 | 2086 |  267 | 20 | 54 | 343 | 49 | 460 | 8431 | 1719 |
| 14 | yanavlasov | 1978 |  255 | 12 | 60 | 306 | 59 | 241 | 9510 | 3050 |
| 15 | repokitteh[bot] | 1895 |  1895 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 16 | zasweq | 1865 |  57 | 0 | 36 | 385 | 32 | 339 | 10042 | 2189 |
| 17 | PiotrSikora | 1826 |  308 | 17 | 78 | 220 | 74 | 199 | 4504 | 3275 |
| 18 | kyessenov | 1801 |  307 | 35 | 55 | 251 | 51 | 325 | 7479 | 3568 |
| 19 | sunjayBhatia | 1662 |  423 | 15 | 66 | 179 | 59 | 388 | 3731 | 2688 |
| 20 | rgs1 | 1609 |  283 | 23 | 68 | 194 | 60 | 461 | 7370 | 1722 |

- cri-o/cri-o

| # | login | activity | issue_comment | open_issue | open_pull | pull_review_comment | merge_pull | pull_commits | pull_additions | pull_deletions |
|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| 1 | openshift-ci-robot | 21896 |  21896 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 2 | haircommander | 7194 |  3394 | 17 | 301 | 432 | 227 | 400 | 58057 | 76155 |
| 3 | saschagrunert | 5560 |  2175 | 7 | 292 | 300 | 259 | 261 | 294707 | 190560 |
| 4 | kolyshkin | 2750 |  441 | 7 | 94 | 407 | 77 | 216 | 15187 | 20913 |
| 5 | openshift-merge-robot | 2189 |  2189 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 6 | mrunalp | 1521 |  654 | 2 | 32 | 158 | 27 | 41 | 421 | 200 |
| 7 | openshift-cherrypick-robot | 1452 |  545 | 0 | 129 | 0 | 104 | 128 | 2504 | 3001 |
| 8 | umohnani8 | 1171 |  529 | 0 | 66 | 41 | 56 | 69 | 83899 | 44271 |
| 9 | TomSweeneyRedHat | 1155 |  411 | 0 | 0 | 186 | 0 | 0 | 0 | 0 |
| 10 | giuseppe | 873 |  377 | 0 | 39 | 61 | 27 | 53 | 8709 | 5083 |
| 11 | codecov[bot] | 858 |  858 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 12 | tedyu | 732 |  274 | 8 | 38 | 42 | 32 | 32 | 224 | 148 |
| 13 | rhatdan | 600 |  532 | 0 | 6 | 10 | 2 | 2 | 18 | 1 |
| 14 | fidencio | 561 |  251 | 4 | 22 | 34 | 20 | 45 | 48973 | 92878 |
| 15 | wgahnagl | 542 |  12 | 1 | 13 | 116 | 5 | 6 | 774 | 1262 |
| 16 | dougsland | 428 |  196 | 0 | 23 | 27 | 11 | 11 | 2448 | 22 |
| 17 | hswong3i | 241 |  66 | 4 | 13 | 22 | 8 | 8 | 137 | 104 |
| 18 | vrothberg | 232 |  93 | 0 | 12 | 12 | 11 | 15 | 14259 | 6893 |
| 19 | aojea | 223 |  65 | 1 | 5 | 29 | 5 | 16 | 33935 | 659 |
| 20 | lsm5 | 214 |  94 | 0 | 14 | 7 | 10 | 10 | 204 | 38 |

- operator-framework/operator-sdk

| # | login | activity | issue_comment | open_issue | open_pull | pull_review_comment | merge_pull | pull_commits | pull_additions | pull_deletions |
|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| 1 | camilamacedo86 | 14681 |  1441 | 103 | 247 | 2862 | 169 | 467 | 32265 | 14274 |
| 2 | estroz | 8752 |  741 | 11 | 267 | 1487 | 248 | 406 | 45084 | 42882 |
| 3 | joelanford | 6426 |  589 | 18 | 140 | 1174 | 137 | 307 | 11715 | 23501 |
| 4 | jmrodri | 1903 |  164 | 7 | 27 | 381 | 24 | 61 | 1953 | 2060 |
| 5 | jmccormick2001 | 1722 |  95 | 2 | 60 | 297 | 51 | 362 | 6123 | 3644 |
| 6 | asmacdo | 1577 |  135 | 32 | 72 | 213 | 62 | 149 | 19829 | 12379 |
| 7 | hasbro17 | 1397 |  103 | 2 | 24 | 277 | 22 | 55 | 6019 | 7795 |
| 8 | varshaprasad96 | 1128 |  85 | 2 | 63 | 145 | 54 | 86 | 6635 | 5925 |
| 9 | fabianvf | 868 |  77 | 0 | 27 | 150 | 22 | 97 | 3464 | 3161 |
| 10 | openshift-ci-robot | 865 |  865 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 11 | bharathi-tenneti | 807 |  59 | 1 | 20 | 149 | 18 | 92 | 7241 | 1809 |
| 12 | jberkhahn | 625 |  101 | 8 | 23 | 91 | 15 | 22 | 1298 | 130 |
| 13 | openshift-bot | 464 |  464 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 14 | tengqm | 432 |  50 | 0 | 6 | 86 | 4 | 9 | 341 | 157 |
| 15 | openshift-cherrypick-robot | 401 |  65 | 0 | 42 | 0 | 42 | 103 | 3529 | 451 |
| 16 | rashmigottipati | 348 |  15 | 1 | 9 | 66 | 8 | 14 | 1582 | 542 |
| 17 | nikhil-thomas | 231 |  15 | 0 | 1 | 52 | 1 | 9 | 582 | 174 |
| 18 | dmesser | 231 |  23 | 1 | 7 | 40 | 5 | 14 | 285 | 58 |
| 19 | jeyaramashok | 212 |  14 | 1 | 1 | 47 | 1 | 1 | 178 | 104 |
| 20 | geerlingguy | 194 |  20 | 3 | 1 | 40 | 1 | 1 | 1 | 1 |

- prometheus/prometheus

| # | login | activity | issue_comment | open_issue | open_pull | pull_review_comment | merge_pull | pull_commits | pull_additions | pull_deletions |
|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| 1 | brian-brazil | 7436 |  1857 | 5 | 21 | 1349 | 22 | 25 | 573 | 408 |
| 2 | roidelapluie | 6872 |  2236 | 60 | 248 | 703 | 192 | 473 | 190100 | 152840 |
| 3 | bwplotka | 4216 |  521 | 21 | 55 | 822 | 40 | 133 | 22932 | 48887 |
| 4 | codesome | 4023 |  547 | 21 | 65 | 741 | 55 | 143 | 51474 | 15880 |
| 5 | beorn7 | 1510 |  411 | 8 | 34 | 204 | 33 | 72 | 15899 | 6416 |
| 6 | Harkishen-Singh | 1070 |  185 | 2 | 16 | 197 | 9 | 58 | 11995 | 260 |
| 7 | juliusv | 1039 |  295 | 7 | 16 | 158 | 10 | 18 | 385 | 221 |
| 8 | cstyan | 992 |  195 | 3 | 22 | 160 | 17 | 53 | 460 | 274 |
| 9 | krasi-georgiev | 693 |  104 | 0 | 8 | 135 | 5 | 15 | 274 | 63 |
| 10 | csmarchbanks | 673 |  114 | 2 | 14 | 112 | 13 | 19 | 839 | 644 |
| 11 | slrtbtfs | 653 |  136 | 7 | 27 | 78 | 22 | 172 | 5340 | 3373 |
| 12 | gotjosh | 540 |  24 | 4 | 4 | 119 | 4 | 22 | 1465 | 234 |
| 13 | liguozhong | 473 |  99 | 3 | 41 | 45 | 13 | 36 | 167 | 42 |
| 14 | johncming | 459 |  54 | 2 | 49 | 26 | 30 | 36 | 150 | 136 |
| 15 | boyskila | 417 |  35 | 1 | 11 | 73 | 11 | 92 | 5743 | 1901 |
| 16 | aSquare14 | 326 |  9 | 0 | 7 | 69 | 4 | 109 | 765 | 102 |
| 17 | brancz | 301 |  104 | 2 | 11 | 25 | 12 | 21 | 20104 | 6736 |
| 18 | pracucci | 289 |  43 | 3 | 16 | 33 | 12 | 31 | 745 | 209 |
| 19 | simonpasquier | 271 |  65 | 1 | 13 | 25 | 13 | 22 | 34139 | 9256 |
| 20 | ArthurSens | 268 |  43 | 2 | 9 | 41 | 6 | 18 | 69 | 21 |

- open-policy-agent/opa

| # | login | activity | issue_comment | open_issue | open_pull | pull_review_comment | merge_pull | pull_commits | pull_additions | pull_deletions |
|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| 1 | tsandall | 3250 |  482 | 100 | 153 | 341 | 149 | 271 | 142634 | 30824 |
| 2 | patrick-east | 2691 |  392 | 67 | 121 | 308 | 114 | 227 | 42485 | 35089 |
| 3 | ashutosh-narkar | 1049 |  173 | 3 | 29 | 162 | 27 | 28 | 10538 | 1109 |
| 4 | srenatus | 765 |  143 | 11 | 23 | 109 | 19 | 30 | 39150 | 13186 |
| 5 | koponen-styra | 491 |  49 | 2 | 38 | 41 | 32 | 63 | 52153 | 1775 |
| 6 | anderseknert | 466 |  104 | 21 | 24 | 37 | 20 | 20 | 1110 | 87 |
| 7 | gshively11 | 163 |  55 | 17 | 6 | 9 | 4 | 4 | 555 | 102 |
| 8 | timothyhinrichs | 158 |  26 | 3 | 7 | 20 | 5 | 11 | 472 | 17 |
| 9 | jpeach | 119 |  10 | 3 | 6 | 15 | 5 | 6 | 405 | 113 |
| 10 | princespaghetti | 107 |  12 | 0 | 8 | 9 | 7 | 9 | 209 | 12 |
| 11 | GBrawl | 86 |  10 | 0 | 8 | 3 | 8 | 12 | 1164 | 83 |
| 12 | jaspervdj-luminal | 84 |  10 | 3 | 4 | 9 | 4 | 4 | 1708 | 2 |
| 13 | dkiser | 66 |  6 | 0 | 1 | 13 | 1 | 2 | 1293 | 506 |
| 14 | Syn3rman | 55 |  12 | 0 | 3 | 6 | 2 | 4 | 74 | 7 |
| 15 | developer-guy | 54 |  1 | 0 | 6 | 5 | 3 | 4 | 17 | 3 |
| 16 | mjgpy3 | 53 |  3 | 1 | 3 | 6 | 3 | 3 | 336 | 6 |
| 17 | johanneslarsson | 52 |  12 | 2 | 1 | 7 | 1 | 1 | 198 | 362 |
| 18 | jonmclachlanatpurestorage | 45 |  2 | 2 | 1 | 9 | 0 | 0 | 0 | 0 |
| 19 | ajoysinha | 45 |  27 | 9 | 0 | 0 | 0 | 0 | 0 | 0 |
| 20 | mikaelcabot | 43 |  1 | 1 | 3 | 4 | 3 | 3 | 226 | 20 |

- argoproj/argo

| # | login | activity | issue_comment | open_issue | open_pull | pull_review_comment | merge_pull | pull_commits | pull_additions | pull_deletions |
|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| 1 | alexec | 14203 |  3099 | 327 | 497 | 1746 | 395 | 5623 | 184561 | 105250 |
| 2 | simster7 | 7452 |  1220 | 104 | 260 | 1006 | 244 | 1179 | 53222 | 19064 |
| 3 | sarabala1979 | 2239 |  375 | 49 | 113 | 233 | 99 | 2378 | 33234 | 5640 |
| 4 | sonarcloud[bot] | 948 |  948 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 5 | whynowy | 807 |  53 | 11 | 28 | 127 | 28 | 118 | 4313 | 1090 |
| 6 | terrytangyuan | 500 |  66 | 6 | 45 | 28 | 35 | 85 | 468 | 389 |
| 7 | rbreeze | 494 |  51 | 10 | 25 | 57 | 24 | 379 | 2352 | 530 |
| 8 | jessesuen | 489 |  62 | 11 | 1 | 98 | 2 | 2 | 22 | 15 |
| 9 | mark9white | 401 |  99 | 12 | 15 | 42 | 13 | 53 | 1822 | 497 |
| 10 | codecov[bot] | 380 |  380 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 11 | NikeNano | 342 |  87 | 2 | 16 | 37 | 11 | 129 | 1576 | 385 |
| 12 | dcherman | 326 |  44 | 12 | 15 | 32 | 17 | 32 | 1477 | 1173 |
| 13 | stale[bot] | 263 |  263 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 14 | mac9416 | 262 |  57 | 13 | 19 | 8 | 18 | 41 | 173 | 38 |
| 15 | dtaniwaki | 231 |  58 | 5 | 14 | 14 | 13 | 65 | 1338 | 659 |
| 16 | CLAassistant | 191 |  191 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 17 | changhc | 177 |  22 | 2 | 14 | 11 | 13 | 27 | 380 | 26 |
| 18 | lippertmarkus | 164 |  49 | 0 | 10 | 10 | 9 | 27 | 846 | 93 |
| 19 | danxmoran | 146 |  45 | 20 | 4 | 11 | 1 | 1 | 90 | 0 |
| 20 | hadim | 141 |  88 | 25 | 1 | 0 | 0 | 0 | 0 | 0 |

- theupdateframework/tuf

| # | login | activity | issue_comment | open_issue | open_pull | pull_review_comment | merge_pull | pull_commits | pull_additions | pull_deletions |
|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| 1 | joshuagl | 1428 |  231 | 12 | 37 | 223 | 34 | 108 | 2378 | 1595 |
| 2 | lukpueh | 932 |  255 | 39 | 18 | 115 | 17 | 50 | 1475 | 757 |
| 3 | MVrachev | 732 |  128 | 12 | 28 | 104 | 16 | 44 | 1617 | 1185 |
| 4 | jku | 620 |  159 | 29 | 17 | 68 | 16 | 40 | 661 | 760 |
| 5 | trishankatdatadog | 377 |  130 | 2 | 1 | 60 | 0 | 0 | 0 | 0 |
| 6 | sechkova | 376 |  57 | 5 | 12 | 57 | 9 | 39 | 923 | 478 |
| 7 | dependabot-preview[bot] | 319 |  14 | 1 | 46 | 0 | 33 | 33 | 33 | 33 |
| 8 | mnm678 | 169 |  43 | 1 | 7 | 22 | 3 | 15 | 52 | 58 |
| 9 | woodruffw | 82 |  15 | 0 | 2 | 14 | 1 | 3 | 19 | 14 |
| 10 | JustinCappos | 20 |  14 | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| 11 | jcstr | 19 |  3 | 0 | 2 | 0 | 2 | 2 | 10 | 3 |
| 12 | Silvanoc | 13 |  1 | 6 | 0 | 0 | 0 | 0 | 0 | 0 |
| 13 | SantiagoTorres | 11 |  3 | 0 | 1 | 0 | 1 | 1 | 8 | 2 |

- goharbor/harbor

| # | login | activity | issue_comment | open_issue | open_pull | pull_review_comment | merge_pull | pull_commits | pull_additions | pull_deletions |
|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| 1 | wy65701436 | 3616 |  317 | 86 | 186 | 416 | 181 | 224 | 89070 | 85326 |
| 2 | reasonerjt | 3489 |  773 | 92 | 127 | 409 | 103 | 111 | 74053 | 48071 |
| 3 | ywk253100 | 3394 |  236 | 100 | 165 | 422 | 155 | 161 | 51844 | 39686 |
| 4 | heww | 2824 |  231 | 49 | 139 | 352 | 134 | 138 | 96395 | 41107 |
| 5 | steven-zou | 1747 |  287 | 88 | 48 | 230 | 44 | 47 | 9134 | 2882 |
| 6 | AllForNothing | 1655 |  136 | 23 | 147 | 83 | 140 | 143 | 40630 | 25300 |
| 7 | danfengliu | 1606 |  36 | 120 | 192 | 21 | 134 | 143 | 25079 | 16227 |
| 8 | bitsf | 1540 |  445 | 97 | 83 | 73 | 72 | 78 | 17349 | 11872 |
| 9 | codecov[bot] | 1318 |  1318 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 10 | xaleeks | 1164 |  447 | 89 | 13 | 115 | 8 | 11 | 213 | 31 |
| 11 | ninjadq | 978 |  153 | 20 | 78 | 49 | 71 | 116 | 176647 | 76834 |
| 12 | stonezdj | 872 |  101 | 39 | 36 | 105 | 33 | 35 | 4243 | 906 |
| 13 | stale[bot] | 759 |  759 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 14 | jwangyangls | 600 |  40 | 6 | 53 | 41 | 45 | 45 | 6991 | 4121 |
| 15 | chlins | 477 |  70 | 7 | 38 | 21 | 39 | 43 | 7094 | 3072 |
| 16 | danielpacak | 348 |  39 | 4 | 20 | 39 | 17 | 24 | 720 | 307 |
| 17 | kofj | 313 |  17 | 1 | 20 | 36 | 18 | 18 | 22180 | 2389 |
| 18 | mmpei | 263 |  31 | 8 | 19 | 21 | 15 | 15 | 2389 | 135 |
| 19 | tedgxt | 231 |  6 | 0 | 20 | 25 | 13 | 18 | 1590 | 235 |
| 20 | renmaosheng | 213 |  99 | 13 | 2 | 18 | 2 | 2 | 134 | 1 |

- containernetworking/cni

| # | login | activity | issue_comment | open_issue | open_pull | pull_review_comment | merge_pull | pull_commits | pull_additions | pull_deletions |
|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| 1 | bboreham | 137 |  54 | 2 | 3 | 15 | 2 | 2 | 7 | 10 |
| 2 | dcbw | 125 |  31 | 1 | 6 | 11 | 6 | 10 | 1636 | 599 |
| 3 | mars1024 | 66 |  14 | 0 | 1 | 11 | 1 | 1 | 5 | 4 |
| 4 | squeed | 49 |  19 | 1 | 1 | 5 | 1 | 3 | 100 | 124 |
| 5 | adrianchiris | 46 |  12 | 3 | 3 | 1 | 3 | 3 | 3 | 1 |
| 6 | asellappen | 26 |  8 | 0 | 2 | 3 | 0 | 0 | 0 | 0 |
| 7 | asears | 25 |  4 | 0 | 3 | 3 | 0 | 0 | 0 | 0 |
| 8 | jellonek | 25 |  12 | 0 | 0 | 2 | 1 | 2 | 0 | 42 |
| 9 | coveralls | 24 |  24 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 10 | Colstuwjx | 20 |  9 | 0 | 1 | 2 | 0 | 0 | 0 | 0 |
| 11 | mccv1r0 | 12 |  6 | 0 | 2 | 0 | 0 | 0 | 0 | 0 |
| 12 | moshe010 | 11 |  3 | 0 | 0 | 2 | 0 | 0 | 0 | 0 |

- projectcontour/contour

| # | login | activity | issue_comment | open_issue | open_pull | pull_review_comment | merge_pull | pull_commits | pull_additions | pull_deletions |
|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| 1 | jpeach | 5340 |  775 | 120 | 177 | 746 | 162 | 196 | 32869 | 12428 |
| 2 | stevesloka | 3585 |  420 | 83 | 166 | 439 | 149 | 229 | 53013 | 35506 |
| 3 | youngnick | 2421 |  492 | 25 | 65 | 341 | 64 | 122 | 14604 | 15779 |
| 4 | skriss | 1993 |  225 | 20 | 95 | 257 | 83 | 128 | 34455 | 6692 |
| 5 | davecheney | 838 |  142 | 23 | 44 | 77 | 42 | 49 | 6105 | 964 |
| 6 | codecov[bot] | 615 |  615 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 7 | tsaarni | 548 |  69 | 3 | 16 | 90 | 13 | 14 | 2637 | 405 |
| 8 | jonasrosland | 212 |  5 | 2 | 20 | 12 | 19 | 30 | 541 | 75 |
| 9 | mattmoor | 180 |  71 | 10 | 8 | 5 | 9 | 12 | 1346 | 144 |
| 10 | aberasarte | 153 |  8 | 0 | 2 | 31 | 3 | 3 | 2371 | 934 |
| 11 | ShaileshSurya | 151 |  7 | 0 | 1 | 34 | 1 | 4 | 13 | 15 |
| 12 | sunjayBhatia | 137 |  40 | 1 | 7 | 11 | 6 | 23 | 448 | 55 |
| 13 | michmike | 130 |  38 | 7 | 11 | 0 | 9 | 36 | 65 | 50 |
| 14 | danehans | 126 |  27 | 6 | 10 | 3 | 9 | 16 | 199 | 15 |
| 15 | bgagnon | 84 |  24 | 4 | 2 | 9 | 2 | 4 | 117 | 15 |
| 16 | pims | 82 |  23 | 4 | 6 | 2 | 5 | 5 | 5306 | 23 |
| 17 | pickledrick | 71 |  17 | 1 | 3 | 7 | 3 | 3 | 219 | 58 |
| 18 | mike1808 | 55 |  6 | 1 | 3 | 7 | 2 | 5 | 367 | 54 |
| 19 | ffahri | 50 |  9 | 1 | 2 | 7 | 1 | 1 | 82 | 20 |
| 20 | erwbgy | 50 |  16 | 3 | 1 | 5 | 1 | 2 | 257 | 78 |

- cloudevents/spec

| # | login | activity | issue_comment | open_issue | open_pull | pull_review_comment | merge_pull | pull_commits | pull_additions | pull_deletions |
|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| 1 | duglin | 1837 |  337 | 23 | 39 | 288 | 37 | 58 | 1965 | 1014 |
| 2 | slinkydeveloper | 348 |  33 | 6 | 12 | 58 | 7 | 25 | 453 | 48 |
| 3 | lance | 246 |  11 | 2 | 4 | 51 | 3 | 8 | 279 | 43 |
| 4 | clemensv | 238 |  17 | 2 | 6 | 46 | 3 | 15 | 1576 | 8 |
| 5 | deissnerk | 233 |  39 | 1 | 4 | 40 | 4 | 9 | 78 | 27 |
| 6 | JemDay | 180 |  34 | 1 | 4 | 28 | 4 | 26 | 305 | 2 |
| 7 | mikehelmick | 166 |  8 | 1 | 3 | 33 | 3 | 14 | 694 | 126 |
| 8 | nachocano | 158 |  17 | 0 | 4 | 31 | 1 | 1 | 1 | 0 |
| 9 | jskeet | 134 |  26 | 2 | 0 | 26 | 0 | 0 | 0 | 0 |
| 10 | n3wscott | 122 |  22 | 8 | 6 | 9 | 6 | 14 | 288 | 392 |
| 11 | grantr | 117 |  1 | 0 | 0 | 29 | 0 | 0 | 0 | 0 |
| 12 | evankanderson | 113 |  13 | 0 | 0 | 25 | 0 | 0 | 0 | 0 |
| 13 | tweing | 90 |  10 | 2 | 2 | 15 | 2 | 3 | 166 | 1 |
| 14 | ryanhorn | 85 |  1 | 0 | 0 | 21 | 0 | 0 | 0 | 0 |
| 15 | bsideup | 66 |  6 | 0 | 1 | 13 | 1 | 1 | 2 | 2 |
| 16 | cneijenhuis | 64 |  12 | 0 | 1 | 11 | 1 | 2 | 15 | 6 |
| 17 | tsurdilo | 64 |  14 | 0 | 7 | 1 | 5 | 9 | 110 | 61 |
| 18 | EricWittmann | 54 |  2 | 0 | 0 | 13 | 0 | 0 | 0 | 0 |
| 19 | grant | 44 |  13 | 4 | 2 | 3 | 1 | 1 | 2 | 2 |
| 20 | anishj0shi | 42 |  4 | 1 | 1 | 7 | 1 | 2 | 14 | 0 |

- helm/helm

| # | login | activity | issue_comment | open_issue | open_pull | pull_review_comment | merge_pull | pull_commits | pull_additions | pull_deletions |
|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| 1 | bacongobbler | 3185 |  2096 | 4 | 35 | 199 | 36 | 41 | 884 | 595 |
| 2 | mattfarina | 1471 |  624 | 35 | 47 | 99 | 48 | 60 | 1714 | 2004 |
| 3 | hickeyma | 1179 |  667 | 4 | 17 | 92 | 17 | 31 | 768 | 125 |
| 4 | technosophos | 1032 |  424 | 4 | 46 | 63 | 42 | 58 | 5318 | 897 |
| 5 | marckhouzam | 811 |  238 | 5 | 31 | 75 | 34 | 44 | 3504 | 1528 |
| 6 | github-actions[bot] | 493 |  493 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 7 | bridgetkromhout | 374 |  260 | 0 | 15 | 1 | 13 | 15 | 116 | 46 |
| 8 | jdolitsky | 372 |  118 | 8 | 2 | 53 | 4 | 21 | 306 | 280 |
| 9 | waveywaves | 317 |  70 | 2 | 8 | 51 | 3 | 4 | 118 | 20 |
| 10 | liuming-dev | 256 |  89 | 15 | 16 | 16 | 5 | 23 | 32 | 38 |
| 11 | adamreese | 193 |  18 | 0 | 13 | 19 | 12 | 13 | 1134 | 1534 |
| 12 | donggangcj | 191 |  61 | 2 | 15 | 14 | 5 | 14 | 154 | 18 |
| 13 | karuppiah7890 | 172 |  56 | 0 | 2 | 25 | 2 | 2 | 115 | 30 |
| 14 | dependabot[bot] | 159 |  20 | 0 | 33 | 0 | 8 | 9 | 52 | 172 |
| 15 | thomastaylor312 | 151 |  66 | 0 | 1 | 18 | 2 | 4 | 348 | 3 |
| 16 | wawa0210 | 148 |  46 | 1 | 9 | 12 | 5 | 5 | 157 | 51 |
| 17 | TBBle | 115 |  95 | 0 | 0 | 5 | 0 | 0 | 0 | 0 |
| 18 | phroggyy | 113 |  32 | 1 | 1 | 19 | 0 | 0 | 0 | 0 |
| 19 | yinzara | 102 |  51 | 0 | 3 | 8 | 2 | 2 | 179 | 29 |
| 20 | zhouhao3 | 92 |  7 | 0 | 10 | 5 | 7 | 13 | 314 | 5 |

- cortexproject/cortex

| # | login | activity | issue_comment | open_issue | open_pull | pull_review_comment | merge_pull | pull_commits | pull_additions | pull_deletions |
|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| 1 | pracucci | 12656 |  925 | 72 | 334 | 2235 | 329 | 978 | 236878 | 91448 |
| 2 | pstibrany | 7948 |  561 | 30 | 208 | 1427 | 199 | 1219 | 79654 | 28169 |
| 3 | jtlisi | 2442 |  106 | 27 | 67 | 444 | 61 | 256 | 68489 | 13666 |
| 4 | gouthamve | 1586 |  129 | 14 | 71 | 229 | 60 | 175 | 22361 | 59260 |
| 5 | bboreham | 1273 |  233 | 32 | 49 | 161 | 37 | 85 | 1381 | 842 |
| 6 | sandeepsukhani | 1262 |  54 | 0 | 60 | 187 | 56 | 212 | 12163 | 2154 |
| 7 | codesome | 1206 |  118 | 9 | 48 | 179 | 42 | 150 | 186352 | 139493 |
| 8 | gotjosh | 1197 |  95 | 9 | 34 | 203 | 34 | 165 | 5514 | 962 |
| 9 | thorfour | 689 |  22 | 0 | 9 | 145 | 12 | 52 | 2073 | 603 |
| 10 | simonswine | 583 |  24 | 4 | 14 | 116 | 9 | 37 | 2447 | 298 |
| 11 | tomwilkie | 456 |  51 | 14 | 23 | 47 | 24 | 194 | 6848 | 10364 |
| 12 | stale[bot] | 424 |  424 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 13 | cyriltovena | 419 |  50 | 2 | 24 | 47 | 21 | 65 | 10109 | 1552 |
| 14 | bwplotka | 394 |  70 | 2 | 6 | 68 | 6 | 28 | 1682 | 1029 |
| 15 | Wing924 | 351 |  30 | 11 | 20 | 36 | 19 | 147 | 2435 | 809 |
| 16 | joe-elliott | 337 |  30 | 5 | 18 | 42 | 15 | 207 | 2794 | 340 |
| 17 | owen-d | 316 |  13 | 2 | 16 | 44 | 15 | 75 | 5851 | 486 |
| 18 | annanay25 | 281 |  14 | 2 | 15 | 37 | 14 | 112 | 12997 | 6201 |
| 19 | MichelHollands | 279 |  2 | 0 | 6 | 61 | 3 | 67 | 1364 | 56 |
| 20 | csmarchbanks | 244 |  15 | 2 | 13 | 29 | 14 | 26 | 382 | 128 |

- coredns/coredns

| # | login | activity | issue_comment | open_issue | open_pull | pull_review_comment | merge_pull | pull_commits | pull_additions | pull_deletions |
|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| 1 | miekg | 2325 |  751 | 38 | 97 | 193 | 87 | 162 | 3938 | 3707 |
| 2 | dependabot-preview[bot] | 1441 |  63 | 1 | 212 | 0 | 148 | 148 | 638 | 175 |
| 3 | chrisohaver | 1378 |  572 | 6 | 48 | 120 | 34 | 114 | 1491 | 724 |
| 4 | zouyee | 347 |  123 | 7 | 27 | 6 | 21 | 23 | 783 | 426 |
| 5 | yongtang | 331 |  116 | 2 | 23 | 8 | 22 | 31 | 1993 | 1918 |
| 6 | stickler-ci | 266 |  2 | 0 | 0 | 66 | 0 | 0 | 0 | 0 |
| 7 | SuperQ | 252 |  66 | 0 | 10 | 29 | 8 | 18 | 1425 | 117 |
| 8 | johnbelamaric | 168 |  86 | 1 | 1 | 18 | 1 | 1 | 1 | 0 |
| 9 | codecov-io | 166 |  166 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 10 | codecov-commenter | 133 |  133 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 11 | stp-ip | 107 |  51 | 0 | 1 | 12 | 1 | 1 | 1 | 5 |
| 12 | rdrozhdzh | 106 |  13 | 1 | 4 | 16 | 3 | 4 | 25 | 3 |
| 13 | denis-tingajkin | 91 |  30 | 3 | 1 | 13 | 0 | 0 | 0 | 0 |
| 14 | nyodas | 73 |  5 | 0 | 2 | 13 | 2 | 2 | 78 | 36 |
| 15 | ctryti | 59 |  2 | 0 | 1 | 11 | 2 | 6 | 270 | 52 |
| 16 | huntharo | 47 |  21 | 5 | 4 | 1 | 0 | 0 | 0 | 0 |
| 17 | networkop | 39 |  14 | 1 | 2 | 3 | 1 | 4 | 72 | 17 |
| 18 | WJayesh | 34 |  31 | 0 | 1 | 0 | 0 | 0 | 0 | 0 |
| 19 | bharath-123 | 34 |  15 | 0 | 1 | 4 | 0 | 0 | 0 | 0 |
| 20 | darshanime | 34 |  8 | 0 | 0 | 4 | 2 | 14 | 376 | 120 |

- thanos-io/thanos

| # | login | activity | issue_comment | open_issue | open_pull | pull_review_comment | merge_pull | pull_commits | pull_additions | pull_deletions |
|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| 1 | bwplotka | 11155 |  1804 | 167 | 188 | 1922 | 153 | 250 | 55505 | 24946 |
| 2 | kakkoyun | 2044 |  271 | 7 | 91 | 274 | 78 | 211 | 6405 | 6021 |
| 3 | yeya24 | 1861 |  319 | 19 | 78 | 235 | 66 | 144 | 9261 | 2010 |
| 4 | GiedriusS | 1831 |  310 | 10 | 42 | 300 | 35 | 77 | 4344 | 3269 |
| 5 | squat | 1680 |  137 | 3 | 35 | 313 | 36 | 59 | 2562 | 1682 |
| 6 | stale[bot] | 1240 |  1240 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 7 | pracucci | 1177 |  129 | 6 | 40 | 184 | 36 | 131 | 6561 | 1866 |
| 8 | khyatisoneji | 967 |  30 | 0 | 10 | 218 | 7 | 7 | 1827 | 646 |
| 9 | brancz | 955 |  173 | 4 | 29 | 138 | 27 | 40 | 4434 | 3306 |
| 10 | pstibrany | 929 |  75 | 4 | 24 | 171 | 18 | 165 | 3623 | 359 |
| 11 | yashrsharma44 | 777 |  63 | 5 | 14 | 153 | 10 | 44 | 922 | 205 |
| 12 | prmsrswt | 762 |  83 | 10 | 24 | 118 | 23 | 93 | 30462 | 2083 |
| 13 | povilasv | 595 |  27 | 0 | 5 | 132 | 5 | 7 | 79 | 52 |
| 14 | s-urbaniak | 594 |  70 | 3 | 13 | 106 | 11 | 215 | 45728 | 4274 |
| 15 | daixiang0 | 588 |  176 | 1 | 25 | 55 | 23 | 55 | 2289 | 140 |
| 16 | thisisobate | 491 |  50 | 4 | 22 | 68 | 19 | 47 | 787 | 242 |
| 17 | metalmatze | 351 |  48 | 0 | 21 | 40 | 16 | 34 | 940 | 275 |
| 18 | krasi-georgiev | 334 |  33 | 1 | 7 | 62 | 6 | 47 | 3805 | 588 |
| 19 | simonpasquier | 297 |  29 | 0 | 18 | 31 | 18 | 26 | 2010 | 852 |
| 20 | soniasingla | 270 |  49 | 3 | 11 | 38 | 6 | 16 | 535 | 82 |

- linkerd/linkerd2

| # | login | activity | issue_comment | open_issue | open_pull | pull_review_comment | merge_pull | pull_commits | pull_additions | pull_deletions |
|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| 1 | alpeb | 3519 |  417 | 32 | 150 | 472 | 140 | 313 | 16129 | 12642 |
| 2 | adleong | 3427 |  399 | 50 | 90 | 557 | 86 | 293 | 30364 | 89443 |
| 3 | zaharidichev | 1993 |  285 | 32 | 81 | 254 | 77 | 299 | 22142 | 6823 |
| 4 | Pothulapati | 1979 |  312 | 40 | 97 | 224 | 80 | 681 | 94828 | 40730 |
| 5 | kleimkuhler | 1898 |  168 | 15 | 84 | 272 | 72 | 337 | 5129 | 3192 |
| 6 | olix0r | 1377 |  290 | 77 | 75 | 87 | 72 | 228 | 3383 | 3268 |
| 7 | grampelberg | 906 |  542 | 30 | 6 | 64 | 6 | 10 | 4184 | 3093 |
| 8 | ihcsim | 607 |  283 | 6 | 2 | 74 | 2 | 3 | 23 | 22 |
| 9 | cpretzer | 581 |  231 | 6 | 25 | 37 | 23 | 50 | 2865 | 526 |
| 10 | joakimr-axis | 472 |  38 | 1 | 26 | 56 | 26 | 32 | 359 | 312 |
| 11 | Matei207 | 428 |  45 | 7 | 13 | 70 | 10 | 16 | 5898 | 1197 |
| 12 | mayankshah1607 | 387 |  99 | 6 | 22 | 30 | 18 | 81 | 1143 | 860 |
| 13 | hawkw | 229 |  69 | 4 | 8 | 22 | 8 | 34 | 166 | 3 |
| 14 | stale[bot] | 210 |  210 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 15 | kohsheen1234 | 191 |  25 | 0 | 5 | 34 | 3 | 25 | 109 | 62 |
| 16 | cypherfox | 187 |  59 | 4 | 9 | 17 | 5 | 104 | 7920 | 585 |
| 17 | naseemkullah | 159 |  55 | 3 | 6 | 15 | 4 | 5 | 1191 | 269 |
| 18 | aliariff | 155 |  24 | 0 | 9 | 16 | 8 | 29 | 428 | 362 |
| 19 | siggy | 143 |  22 | 11 | 5 | 16 | 4 | 8 | 142 | 6 |
| 20 | javaducky | 138 |  13 | 0 | 3 | 24 | 4 | 17 | 4137 | 178 |

- vitessio/vitess

| # | login | activity | issue_comment | open_issue | open_pull | pull_review_comment | merge_pull | pull_commits | pull_additions | pull_deletions |
|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| 1 | deepthi | 3373 |  320 | 44 | 107 | 536 | 100 | 267 | 23810 | 13831 |
| 2 | sougou | 2018 |  215 | 47 | 97 | 242 | 90 | 473 | 41747 | 58923 |
| 3 | systay | 1710 |  95 | 5 | 145 | 140 | 122 | 455 | 71677 | 62581 |
| 4 | harshit-gangal | 1694 |  215 | 17 | 103 | 159 | 100 | 436 | 50807 | 30669 |
| 5 | shlomi-noach | 1381 |  237 | 19 | 50 | 194 | 36 | 389 | 20896 | 10108 |
| 6 | PrismaPhonic | 1169 |  27 | 2 | 16 | 255 | 14 | 133 | 3349 | 995 |
| 7 | rohit-nayak-ps | 990 |  59 | 12 | 103 | 42 | 86 | 358 | 31152 | 11629 |
| 8 | enisoc | 733 |  40 | 7 | 20 | 131 | 19 | 21 | 3255 | 2980 |
| 9 | aquarapid | 666 |  84 | 86 | 52 | 6 | 46 | 83 | 10156 | 9214 |
| 10 | morgo | 518 |  114 | 11 | 34 | 30 | 32 | 67 | 1160 | 1435 |
| 11 | GuptaManan100 | 386 |  26 | 0 | 32 | 36 | 24 | 156 | 41148 | 35904 |
| 12 | derekperkins | 353 |  63 | 7 | 8 | 53 | 8 | 19 | 477 | 295 |
| 13 | ajm188 | 281 |  17 | 11 | 20 | 23 | 18 | 129 | 13232 | 3962 |
| 14 | teejae | 251 |  23 | 1 | 12 | 35 | 10 | 24 | 904 | 287 |
| 15 | rafael | 242 |  32 | 2 | 17 | 25 | 11 | 24 | 518 | 167 |
| 16 | ajeetj | 235 |  8 | 0 | 9 | 35 | 12 | 84 | 3380 | 2035 |
| 17 | dkhenry | 208 |  15 | 1 | 13 | 23 | 12 | 41 | 1318 | 199 |
| 18 | saifalharthi | 194 |  31 | 0 | 19 | 4 | 18 | 121 | 13304 | 12390 |
| 19 | arindamnayak | 177 |  16 | 1 | 13 | 20 | 8 | 58 | 1432 | 54278 |
| 20 | dweitzman | 155 |  34 | 6 | 8 | 10 | 9 | 9 | 652 | 87 |

- tikv/tikv

| # | login | activity | issue_comment | open_issue | open_pull | pull_review_comment | merge_pull | pull_commits | pull_additions | pull_deletions |
|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| 1 | sre-bot | 6984 |  5072 | 244 | 238 | 0 | 142 | 477 | 13953 | 5662 |
| 2 | BusyJay | 4428 |  545 | 32 | 109 | 748 | 100 | 468 | 14853 | 12146 |
| 3 | ti-srebot | 3681 |  2580 | 0 | 187 | 0 | 108 | 405 | 18265 | 5724 |
| 4 | sticnarf | 2831 |  549 | 12 | 91 | 405 | 73 | 538 | 11848 | 5694 |
| 5 | yiwu-arbug | 2256 |  457 | 33 | 48 | 351 | 37 | 290 | 6543 | 1662 |
| 6 | breeswish | 2093 |  671 | 35 | 33 | 282 | 25 | 106 | 3368 | 2281 |
| 7 | youjiali1995 | 2059 |  632 | 28 | 72 | 215 | 59 | 196 | 10750 | 4026 |
| 8 | hicqu | 1902 |  372 | 12 | 94 | 206 | 80 | 1060 | 16073 | 8162 |
| 9 | overvenus | 1854 |  268 | 22 | 56 | 276 | 54 | 308 | 17349 | 7063 |
| 10 | 5kbpers | 1753 |  496 | 17 | 90 | 157 | 65 | 554 | 14025 | 5255 |
| 11 | Little-Wallace | 1643 |  187 | 13 | 66 | 253 | 44 | 582 | 70948 | 14936 |
| 12 | gengliqi | 1566 |  195 | 9 | 66 | 215 | 59 | 367 | 9129 | 4838 |
| 13 | hunterlxt | 1330 |  270 | 17 | 62 | 145 | 52 | 359 | 12199 | 8659 |
| 14 | MyonKeminta | 1295 |  301 | 9 | 47 | 155 | 43 | 578 | 102747 | 26959 |
| 15 | andylokandy | 1255 |  384 | 3 | 21 | 178 | 18 | 194 | 2847 | 23940 |
| 16 | NingLin-P | 1250 |  242 | 1 | 47 | 165 | 41 | 331 | 6853 | 3826 |
| 17 | Connor1996 | 1181 |  234 | 12 | 27 | 183 | 22 | 155 | 6590 | 3741 |
| 18 | nrc | 1074 |  138 | 5 | 22 | 190 | 20 | 89 | 8332 | 8306 |
| 19 | zhongzc | 912 |  263 | 1 | 26 | 121 | 17 | 91 | 2831 | 478 |
| 20 | brson | 824 |  199 | 6 | 52 | 58 | 45 | 736 | 10869 | 8023 |

- etcd-io/etcd

| # | login | activity | issue_comment | open_issue | open_pull | pull_review_comment | merge_pull | pull_commits | pull_additions | pull_deletions |
|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| 1 | jingyih | 1014 |  220 | 3 | 45 | 102 | 49 | 64 | 27671 | 6975 |
| 2 | spzala | 964 |  208 | 1 | 49 | 88 | 51 | 52 | 709 | 235 |
| 3 | stale[bot] | 903 |  903 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 4 | tangcong | 803 |  210 | 5 | 43 | 66 | 38 | 79 | 1804 | 622 |
| 5 | ptabor | 719 |  174 | 7 | 44 | 51 | 39 | 97 | 43626 | 66890 |
| 6 | gyuho | 681 |  124 | 4 | 21 | 99 | 18 | 42 | 68577 | 37371 |
| 7 | xiang90 | 420 |  199 | 0 | 3 | 48 | 4 | 4 | 44 | 8 |
| 8 | mitake | 413 |  79 | 2 | 12 | 56 | 14 | 23 | 1381 | 381 |
| 9 | tedyu | 396 |  63 | 3 | 32 | 29 | 23 | 23 | 174 | 100 |
| 10 | cfc4n | 363 |  76 | 7 | 30 | 17 | 23 | 27 | 762 | 213 |
| 11 | YoyinZyc | 312 |  39 | 2 | 18 | 35 | 15 | 19 | 5080 | 2087 |
| 12 | jpbetz | 257 |  83 | 3 | 8 | 26 | 8 | 15 | 856 | 303 |
| 13 | agargi | 175 |  67 | 1 | 10 | 14 | 4 | 7 | 112 | 140 |
| 14 | nate-double-u | 149 |  66 | 0 | 19 | 4 | 2 | 2 | 144 | 5 |
| 15 | ironcladlou | 139 |  39 | 1 | 5 | 17 | 3 | 3 | 261 | 208 |
| 16 | philips | 133 |  39 | 1 | 4 | 15 | 4 | 11 | 1553 | 1462 |
| 17 | codecov-io | 131 |  131 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 18 | hexfusion | 103 |  22 | 0 | 10 | 4 | 7 | 7 | 17 | 5 |
| 19 | wswcfan | 99 |  15 | 0 | 6 | 9 | 6 | 8 | 1602 | 515 |
| 20 | viviyww | 98 |  28 | 0 | 12 | 1 | 6 | 6 | 18 | 11 |

- dragonflyoss/Dragonfly

| # | login | activity | issue_comment | open_issue | open_pull | pull_review_comment | merge_pull | pull_commits | pull_additions | pull_deletions |
|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| 1 | pouchrobot | 1336 |  939 | 44 | 53 | 0 | 30 | 30 | 547 | 221 |
| 2 | lowzj | 581 |  98 | 11 | 24 | 71 | 21 | 21 | 2859 | 703 |
| 3 | wangforthinker | 542 |  11 | 3 | 28 | 84 | 21 | 62 | 13362 | 303 |
| 4 | Starnop | 271 |  54 | 1 | 3 | 44 | 6 | 6 | 939 | 193 |
| 5 | allencloud | 264 |  66 | 1 | 2 | 45 | 2 | 2 | 51 | 3 |
| 6 | jim3ma | 192 |  55 | 0 | 8 | 22 | 5 | 15 | 1012 | 97 |
| 7 | fenggw-fnst | 153 |  4 | 0 | 18 | 0 | 19 | 19 | 269 | 8 |
| 8 | inoc603 | 99 |  25 | 1 | 0 | 18 | 0 | 0 | 0 | 0 |
| 9 | q384566678 | 96 |  1 | 0 | 10 | 5 | 9 | 13 | 294 | 78 |
| 10 | SataQiu | 95 |  11 | 0 | 5 | 11 | 5 | 5 | 413 | 136 |
| 11 | codecov-io | 94 |  94 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 12 | zhouhaibing089 | 87 |  7 | 0 | 0 | 20 | 0 | 0 | 0 | 0 |
| 13 | readerx | 55 |  16 | 1 | 1 | 6 | 2 | 2 | 8 | 2 |
| 14 | xujihui1985 | 52 |  4 | 0 | 2 | 8 | 2 | 3 | 98 | 18 |
| 15 | zcc35357949 | 49 |  4 | 3 | 3 | 5 | 2 | 2 | 65 | 14 |
| 16 | Hellcatlk | 48 |  1 | 0 | 5 | 3 | 4 | 4 | 187 | 14 |
| 17 | hhhhsdxxxx | 48 |  10 | 0 | 4 | 4 | 2 | 2 | 266 | 13 |
| 18 | wuchaojing | 46 |  5 | 5 | 4 | 1 | 3 | 3 | 6 | 5 |
| 19 | truongnh1992 | 37 |  1 | 0 | 4 | 1 | 4 | 4 | 38 | 19 |
| 20 | YanzheL | 36 |  3 | 0 | 1 | 5 | 2 | 6 | 144 | 12 |

- falcosecurity/falco

| # | login | activity | issue_comment | open_issue | open_pull | pull_review_comment | merge_pull | pull_commits | pull_additions | pull_deletions |
|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| 1 | poiana | 1810 |  1807 | 0 | 1 | 0 | 0 | 0 | 0 | 0 |
| 2 | leodido | 1601 |  454 | 28 | 54 | 171 | 49 | 199 | 2625 | 1434 |
| 3 | leogr | 1141 |  355 | 26 | 51 | 84 | 49 | 162 | 3051 | 5824 |
| 4 | fntlnz | 853 |  374 | 18 | 44 | 29 | 39 | 181 | 2541 | 1680 |
| 5 | kris-nova | 412 |  121 | 18 | 14 | 37 | 13 | 41 | 545 | 79 |
| 6 | Kaizhe | 374 |  37 | 0 | 20 | 43 | 21 | 32 | 278 | 69 |
| 7 | stale[bot] | 232 |  232 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 8 | mstemm | 224 |  19 | 2 | 16 | 22 | 13 | 45 | 1170 | 102 |
| 9 | vicenteherrera | 67 |  8 | 2 | 4 | 7 | 3 | 6 | 212 | 14 |
| 10 | marier-nico | 64 |  5 | 0 | 7 | 2 | 6 | 8 | 38 | 4 |
| 11 | nibalizer | 62 |  13 | 1 | 3 | 7 | 2 | 2 | 12 | 19 |
| 12 | admiral0 | 61 |  3 | 0 | 4 | 9 | 2 | 2 | 46 | 31 |
| 13 | deepskyblue86 | 55 |  5 | 0 | 5 | 5 | 3 | 3 | 23 | 1 |
| 14 | antoinedeschenes | 53 |  18 | 1 | 5 | 2 | 2 | 2 | 3 | 4 |
| 15 | rajibmitra | 43 |  12 | 3 | 4 | 2 | 1 | 1 | 33 | 7 |
| 16 | rung | 37 |  11 | 0 | 1 | 2 | 3 | 5 | 22 | 23 |
| 17 | JPLachance | 35 |  13 | 3 | 2 | 0 | 2 | 2 | 8 | 0 |
| 18 | danmx | 32 |  14 | 5 | 1 | 0 | 1 | 1 | 12 | 13 |
| 19 | smijolovic | 31 |  19 | 6 | 0 | 0 | 0 | 0 | 0 | 0 |
| 20 | afbjorklund | 26 |  14 | 0 | 1 | 1 | 1 | 1 | 3 | 2 |

- kubeedge/kubeedge

| # | login | activity | issue_comment | open_issue | open_pull | pull_review_comment | merge_pull | pull_commits | pull_additions | pull_deletions |
|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| 1 | fisherxu | 3897 |  962 | 14 | 106 | 516 | 105 | 213 | 180181 | 37308 |
| 2 | daixiang0 | 2705 |  673 | 32 | 148 | 246 | 108 | 140 | 4696 | 6480 |
| 3 | kubeedge-bot | 1887 |  1881 | 0 | 2 | 0 | 0 | 0 | 0 | 0 |
| 4 | kevin-wangzefeng | 1247 |  384 | 4 | 22 | 171 | 21 | 45 | 19350 | 669 |
| 5 | kadisi | 829 |  107 | 1 | 28 | 129 | 24 | 78 | 8104 | 3871 |
| 6 | GsssC | 779 |  232 | 17 | 20 | 97 | 13 | 29 | 2828 | 4567 |
| 7 | chendave | 612 |  68 | 0 | 11 | 114 | 11 | 15 | 409 | 160 |
| 8 | stale[bot] | 543 |  543 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 9 | luogangyi | 351 |  118 | 9 | 12 | 31 | 11 | 21 | 4884 | 2364 |
| 10 | ls889 | 294 |  44 | 2 | 17 | 30 | 15 | 27 | 576 | 196 |
| 11 | subpathdev | 262 |  32 | 0 | 4 | 52 | 2 | 14 | 46976 | 36866 |
| 12 | sailorvii | 240 |  11 | 6 | 13 | 32 | 10 | 34 | 5199 | 490 |
| 13 | muxuelan | 189 |  22 | 0 | 18 | 12 | 13 | 15 | 426 | 64 |
| 14 | dingyin | 165 |  14 | 7 | 10 | 18 | 7 | 45 | 29819 | 104329 |
| 15 | lvchenggang | 162 |  8 | 1 | 13 | 12 | 13 | 14 | 233 | 163 |
| 16 | kuramal | 160 |  16 | 0 | 19 | 8 | 11 | 22 | 459 | 691 |
| 17 | XJangel | 159 |  23 | 0 | 7 | 20 | 7 | 13 | 1793 | 294 |
| 18 | bitvijays | 152 |  34 | 6 | 5 | 19 | 3 | 19 | 1176 | 23 |
| 19 | YaozhongZhang | 150 |  8 | 3 | 12 | 10 | 12 | 12 | 237 | 148 |
| 20 | threestoneliu | 134 |  23 | 2 | 15 | 3 | 10 | 10 | 87 | 46 |

- jaegertracing/jaeger

| # | login | activity | issue_comment | open_issue | open_pull | pull_review_comment | merge_pull | pull_commits | pull_additions | pull_deletions |
|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| 1 | yurishkuro | 3961 |  611 | 36 | 44 | 734 | 42 | 146 | 3104 | 1071 |
| 2 | pavolloffay | 2215 |  401 | 34 | 94 | 266 | 80 | 238 | 24382 | 16332 |
| 3 | jpkrohling | 1591 |  407 | 26 | 25 | 238 | 21 | 51 | 1713 | 821 |
| 4 | objectiser | 551 |  81 | 17 | 6 | 97 | 6 | 10 | 114 | 25 |
| 5 | albertteoh | 527 |  56 | 10 | 19 | 76 | 18 | 56 | 732 | 397 |
| 6 | Ashmita152 | 497 |  72 | 2 | 21 | 67 | 18 | 87 | 1292 | 206 |
| 7 | joe-elliott | 412 |  74 | 2 | 18 | 50 | 16 | 101 | 1906 | 1374 |
| 8 | codecov[bot] | 313 |  313 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 9 | bhiravabhatla | 241 |  26 | 0 | 1 | 53 | 0 | 0 | 0 | 0 |
| 10 | annanay25 | 221 |  42 | 2 | 5 | 35 | 4 | 35 | 599 | 114 |
| 11 | morlay | 213 |  27 | 0 | 4 | 41 | 2 | 2 | 38 | 38 |
| 12 | rjs211 | 151 |  22 | 1 | 4 | 25 | 3 | 16 | 626 | 474 |
| 13 | TheDavidKruse | 118 |  5 | 1 | 1 | 27 | 0 | 0 | 0 | 0 |
| 14 | rubenvp8510 | 106 |  20 | 0 | 3 | 18 | 1 | 4 | 33 | 28 |
| 15 | Vemmy124 | 105 |  19 | 1 | 4 | 13 | 4 | 13 | 439 | 518 |
| 16 | vprithvi | 105 |  9 | 2 | 5 | 18 | 1 | 1 | 1 | 2 |
| 17 | MrXinWang | 90 |  10 | 0 | 1 | 18 | 1 | 2 | 54 | 71 |
| 18 | m8rge | 73 |  7 | 1 | 2 | 12 | 2 | 29 | 2151 | 149 |
| 19 | apm-opentt | 71 |  11 | 2 | 1 | 12 | 1 | 2 | 44 | 1 |
| 20 | frittentheke | 67 |  27 | 1 | 2 | 8 | 0 | 0 | 0 | 0 |

- nats-io/nats-server

| # | login | activity | issue_comment | open_issue | open_pull | pull_review_comment | merge_pull | pull_commits | pull_additions | pull_deletions |
|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| 1 | derekcollison | 3651 |  336 | 2 | 99 | 631 | 98 | 404 | 48719 | 6631 |
| 2 | kozlovic | 3379 |  159 | 8 | 98 | 605 | 98 | 153 | 53088 | 6041 |
| 3 | matthiashanel | 2145 |  102 | 30 | 88 | 331 | 79 | 146 | 11816 | 2468 |
| 4 | ripienaar | 1488 |  139 | 1 | 59 | 230 | 50 | 70 | 2470 | 1774 |
| 5 | wallyqs | 432 |  51 | 10 | 19 | 61 | 12 | 17 | 2568 | 484 |
| 6 | aricart | 211 |  18 | 6 | 6 | 32 | 7 | 15 | 567 | 64 |
| 7 | philpennock | 113 |  14 | 1 | 9 | 10 | 6 | 9 | 177 | 14 |
| 8 | ColinSullivan1 | 52 |  10 | 3 | 0 | 9 | 0 | 0 | 0 | 0 |
| 9 | AdamKorcz | 24 |  2 | 1 | 2 | 1 | 2 | 5 | 71 | 0 |
| 10 | gcolliso | 23 |  3 | 0 | 2 | 1 | 2 | 4 | 4 | 5 |
| 11 | masudur-rahman | 22 |  1 | 1 | 1 | 4 | 0 | 0 | 0 | 0 |
| 12 | PlatanoBailando | 22 |  20 | 1 | 0 | 0 | 0 | 0 | 0 | 0 |
| 13 | pas2k | 21 |  5 | 0 | 1 | 2 | 1 | 1 | 261 | 4 |
| 14 | variadico | 21 |  1 | 0 | 2 | 1 | 2 | 2 | 9 | 1 |
| 15 | pananton | 20 |  10 | 5 | 0 | 0 | 0 | 0 | 0 | 0 |
| 16 | kingkorf | 20 |  4 | 0 | 2 | 0 | 2 | 2 | 8 | 3 |
| 17 | harrisa1 | 17 |  1 | 0 | 1 | 2 | 1 | 5 | 40 | 11 |
| 18 | byazrail | 16 |  14 | 1 | 0 | 0 | 0 | 0 | 0 | 0 |
| 19 | bruth | 16 |  13 | 0 | 1 | 0 | 0 | 0 | 0 | 0 |
| 20 | JnMik | 15 |  13 | 1 | 0 | 0 | 0 | 0 | 0 | 0 |

- buildpacks/pack

| # | login | activity | issue_comment | open_issue | open_pull | pull_review_comment | merge_pull | pull_commits | pull_additions | pull_deletions |
|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| 1 | jromero | 2098 |  328 | 76 | 63 | 281 | 61 | 224 | 59160 | 196624 |
| 2 | dfreilich | 1729 |  167 | 13 | 69 | 256 | 61 | 236 | 9777 | 10350 |
| 3 | natalieparellano | 1188 |  144 | 27 | 22 | 206 | 20 | 92 | 59573 | 2381 |
| 4 | simonjjones | 629 |  19 | 4 | 16 | 121 | 14 | 72 | 11357 | 3049 |
| 5 | ameyer-pivotal | 511 |  44 | 4 | 10 | 96 | 9 | 31 | 5425 | 1594 |
| 6 | zmackie | 365 |  71 | 28 | 10 | 42 | 8 | 42 | 1042 | 372 |
| 7 | yaelharel | 337 |  17 | 6 | 5 | 67 | 5 | 25 | 541 | 116 |
| 8 | dwillist | 308 |  14 | 2 | 21 | 33 | 19 | 125 | 11361 | 1765 |
| 9 | elbandito | 276 |  26 | 1 | 17 | 33 | 13 | 36 | 2834 | 195 |
| 10 | jkutner | 202 |  14 | 0 | 7 | 33 | 7 | 67 | 11519 | 120 |
| 11 | codecov[bot] | 164 |  164 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 12 | dependabot[bot] | 156 |  9 | 0 | 24 | 0 | 15 | 23 | 125 | 130 |
| 13 | dgageot | 123 |  18 | 5 | 12 | 1 | 11 | 16 | 9776 | 2990 |
| 14 | micahyoung | 111 |  19 | 3 | 3 | 18 | 1 | 1 | 3 | 0 |
| 15 | supra08 | 98 |  14 | 0 | 7 | 12 | 3 | 28 | 717 | 86 |
| 16 | ekcasey | 82 |  30 | 14 | 2 | 2 | 2 | 2 | 20 | 22 |
| 17 | matejvasek | 44 |  27 | 1 | 1 | 3 | 0 | 0 | 0 | 0 |
| 18 | nebhale | 30 |  14 | 8 | 0 | 0 | 0 | 0 | 0 | 0 |
| 19 | abitrolly | 29 |  19 | 1 | 1 | 0 | 1 | 2 | 7 | 1 |
| 20 | aemengo | 28 |  4 | 0 | 2 | 2 | 2 | 6 | 276 | 151 |

- spiffe/spire

| # | login | activity | issue_comment | open_issue | open_pull | pull_review_comment | merge_pull | pull_commits | pull_additions | pull_deletions |
|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| 1 | azdagron | 4049 |  361 | 45 | 140 | 622 | 138 | 279 | 59228 | 42171 |
| 2 | MarcosDY | 1300 |  12 | 0 | 48 | 231 | 44 | 135 | 20805 | 3753 |
| 3 | amartinezfayo | 1215 |  59 | 17 | 26 | 231 | 24 | 117 | 4799 | 1669 |
| 4 | evan2645 | 721 |  164 | 38 | 20 | 84 | 17 | 42 | 2640 | 453 |
| 5 | marcosy | 557 |  19 | 0 | 27 | 78 | 29 | 148 | 7417 | 3785 |
| 6 | mcpherrinm | 396 |  77 | 14 | 23 | 28 | 22 | 58 | 1428 | 468 |
| 7 | dfeldman | 307 |  16 | 1 | 10 | 56 | 7 | 16 | 3299 | 372 |
| 8 | hiyosi | 299 |  24 | 4 | 19 | 30 | 18 | 29 | 2913 | 412 |
| 9 | rturner3 | 278 |  37 | 15 | 9 | 36 | 8 | 27 | 2861 | 435 |
| 10 | martincapello | 277 |  20 | 1 | 9 | 47 | 8 | 46 | 2724 | 1022 |
| 11 | ryysud | 262 |  42 | 4 | 24 | 10 | 20 | 59 | 1071 | 418 |
| 12 | faisal-memon | 230 |  18 | 1 | 5 | 45 | 3 | 9 | 2865 | 158 |
| 13 | APTy | 227 |  23 | 6 | 10 | 28 | 10 | 33 | 540 | 189 |
| 14 | anvega | 218 |  16 | 1 | 16 | 23 | 12 | 43 | 297 | 57 |
| 15 | kunzimariano | 165 |  5 | 4 | 8 | 22 | 8 | 21 | 2622 | 815 |
| 16 | asuffield | 133 |  6 | 0 | 1 | 31 | 0 | 0 | 0 | 0 |
| 17 | JonathanO | 126 |  7 | 1 | 8 | 17 | 5 | 23 | 3364 | 503 |
| 18 | amoore877 | 116 |  20 | 7 | 8 | 7 | 6 | 22 | 191 | 106 |
| 19 | prasadborole1 | 114 |  6 | 1 | 5 | 19 | 3 | 15 | 804 | 194 |
| 20 | ajessup | 60 |  6 | 1 | 0 | 13 | 0 | 0 | 0 | 0 |

- spiffe/spiffe

| # | login | activity | issue_comment | open_issue | open_pull | pull_review_comment | merge_pull | pull_commits | pull_additions | pull_deletions |
|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| 1 | spikecurtis | 77 |  9 | 0 | 4 | 9 | 4 | 10 | 53 | 26 |
| 2 | evan2645 | 65 |  5 | 0 | 6 | 3 | 6 | 14 | 69 | 125 |
| 3 | justinburke | 63 |  3 | 0 | 3 | 9 | 3 | 14 | 22 | 12 |
| 4 | azdagron | 42 |  7 | 0 | 1 | 8 | 0 | 0 | 0 | 0 |
| 5 | anvega | 20 |  2 | 1 | 2 | 0 | 2 | 4 | 18 | 13 |

- fluent/fluentd

| # | login | activity | issue_comment | open_issue | open_pull | pull_review_comment | merge_pull | pull_commits | pull_additions | pull_deletions |
|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| 1 | ganmacs | 1079 |  149 | 7 | 75 | 79 | 75 | 197 | 5564 | 1428 |
| 2 | repeatedly | 731 |  203 | 0 | 33 | 66 | 33 | 69 | 1634 | 756 |
| 3 | cosmo0920 | 546 |  96 | 3 | 27 | 57 | 27 | 94 | 1666 | 387 |
| 4 | kenhys | 156 |  82 | 5 | 7 | 2 | 7 | 7 | 56 | 24 |
| 5 | ashie | 115 |  26 | 1 | 5 | 13 | 4 | 10 | 131 | 25 |
| 6 | github-actions[bot] | 66 |  66 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 7 | mlasevich | 38 |  9 | 9 | 2 | 0 | 1 | 2 | 8 | 1 |
| 8 | BananaWanted | 37 |  3 | 1 | 1 | 6 | 1 | 4 | 17 | 10 |
| 9 | pranavmarla | 26 |  10 | 8 | 0 | 0 | 0 | 0 | 0 | 0 |
| 10 | onet-git | 23 |  4 | 0 | 2 | 2 | 1 | 1 | 41 | 2 |
| 11 | TiagoGoddard | 21 |  2 | 0 | 1 | 4 | 0 | 0 | 0 | 0 |
| 12 | tyarimi | 21 |  4 | 1 | 2 | 1 | 1 | 3 | 19 | 1 |
| 13 | vimalk78 | 19 |  7 | 0 | 1 | 1 | 1 | 1 | 19 | 2 |
| 14 | roman-geraskin | 19 |  3 | 0 | 1 | 2 | 1 | 5 | 53 | 2 |
| 15 | omerlh | 18 |  2 | 2 | 1 | 1 | 1 | 1 | 48 | 2 |
| 16 | kenrota | 17 |  1 | 0 | 2 | 0 | 2 | 2 | 5 | 1 |
| 17 | jiping-s | 17 |  1 | 2 | 1 | 1 | 1 | 2 | 17 | 32 |
| 18 | qingling128 | 14 |  8 | 3 | 0 | 0 | 0 | 0 | 0 | 0 |
| 19 | 4ndr4s | 13 |  11 | 1 | 0 | 0 | 0 | 0 | 0 | 0 |
| 20 | Hello-Linux | 13 |  5 | 4 | 0 | 0 | 0 | 0 | 0 | 0 |

- theupdateframework/notary

| # | login | activity | issue_comment | open_issue | open_pull | pull_review_comment | merge_pull | pull_commits | pull_additions | pull_deletions |
|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| 1 | thaJeztah | 109 |  26 | 0 | 6 | 10 | 5 | 6 | 2770 | 232 |
| 2 | marcofranssen | 102 |  43 | 7 | 6 | 3 | 3 | 25 | 83708 | 49518 |
| 3 | justincormack | 67 |  27 | 0 | 1 | 8 | 1 | 3 | 51 | 4430 |
| 4 | cquon | 51 |  8 | 0 | 2 | 8 | 1 | 1 | 20089 | 13735 |
| 5 | zhijianli88 | 17 |  5 | 0 | 1 | 1 | 1 | 3 | 7 | 4 |
| 6 | HuKeping | 14 |  12 | 1 | 0 | 0 | 0 | 0 | 0 | 0 |
| 7 | sethbergman | 13 |  2 | 0 | 1 | 2 | 0 | 0 | 0 | 0 |

- opentracing/opentracing-go

| # | login | activity | issue_comment | open_issue | open_pull | pull_review_comment | merge_pull | pull_commits | pull_additions | pull_deletions |
|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| 1 | yurishkuro | 46 |  10 | 0 | 2 | 5 | 2 | 3 | 14 | 7 |
| 2 | cyriltovena | 13 |  1 | 0 | 1 | 1 | 1 | 2 | 94 | 1 |


### 工作时间分布

我们统计了 CNCF 项目仓库的工作时间情况，为每个仓库绘制而成的图表如下。


- thanos-io/thanos

<embed src="http://gar2020.opensource-service.cn/svgrenderer/github/X-lab2017/github-analysis-report?path=sqls/working-hour-distribution/image.svg&data=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,null,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]&lang=en" style="width:600" />

- nats-io/nats-server

<embed src="http://gar2020.opensource-service.cn/svgrenderer/github/X-lab2017/github-analysis-report?path=sqls/working-hour-distribution/image.svg&data=[1,2,2,2,1,1,1,1,2,2,2,1,2,3,3,7,10,7,5,7,6,6,10,7,6,5,7,2,2,2,2,1,1,2,3,2,2,3,4,5,8,6,5,5,6,5,7,7,4,3,3,3,2,1,3,2,1,2,2,2,2,3,5,6,5,5,6,7,8,4,4,4,4,3,4,4,2,2,2,2,2,2,2,2,4,3,5,8,9,6,6,7,5,5,5,8,4,3,4,3,2,2,3,1,2,2,2,1,3,3,5,7,6,9,5,5,5,4,5,4,5,2,1,1,1,1,1,1,1,2,1,1,1,1,2,2,1,2,2,3,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,1,2,1,2,2,2,2,1,1]&lang=en" style="width:600" />

- thanos-io/thanos

<embed src="http://gar2020.opensource-service.cn/svgrenderer/github/X-lab2017/github-analysis-report?path=sqls/working-hour-distribution/image.svg&data=[1,1,1,1,1,1,2,4,6,7,8,10,7,10,7,7,7,7,6,4,3,3,2,0,1,1,2,2,1,2,4,6,7,8,6,8,8,9,8,8,6,5,7,3,3,2,2,2,1,1,2,2,1,2,4,5,7,7,6,9,7,8,8,8,6,6,6,5,5,3,2,2,1,2,2,2,1,2,2,5,7,7,8,9,8,9,9,8,9,6,5,3,3,4,2,1,1,2,2,2,2,1,3,5,7,8,6,6,7,6,9,5,7,5,3,4,4,2,1,2,1,1,1,4,3,3,3,3,2,2,3,2,3,2,3,2,3,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,1,2,1,1,3,1,2,1,2,2,1,1]&lang=en" style="width:600" />

- etcd-io/etcd

<embed src="http://gar2020.opensource-service.cn/svgrenderer/github/X-lab2017/github-analysis-report?path=sqls/working-hour-distribution/image.svg&data=[1,3,6,5,2,3,5,7,5,6,4,3,4,5,7,8,6,5,7,10,8,5,4,8,5,5,9,9,4,6,10,8,8,7,6,3,5,6,6,7,6,5,4,2,3,2,3,3,2,4,9,6,3,3,5,6,7,7,4,4,5,4,5,6,6,5,4,4,5,3,4,4,4,5,6,8,3,3,5,7,7,6,4,4,4,4,5,6,4,3,5,3,4,3,4,3,3,3,6,6,2,3,5,7,6,5,3,3,3,3,4,3,3,3,4,2,3,1,2,1,1,2,2,3,3,1,2,2,2,1,1,2,2,2,2,3,3,3,1,1,1,2,1,1,1,1,1,2,2,2,2,3,3,3,2,2,3,2,4,5,3,3,2,2,1,1,2,2]&lang=en" style="width:600" />

- spiffe/spiffe

<embed src="http://gar2020.opensource-service.cn/svgrenderer/github/X-lab2017/github-analysis-report?path=sqls/working-hour-distribution/image.svg&data=[1,1,2,3,1,0,1,0,2,1,3,1,1,1,1,1,1,4,2,1,0,2,3,1,2,3,4,2,1,1,2,2,0,1,0,1,2,3,2,3,2,2,4,4,3,1,1,4,0,1,2,0,0,1,2,1,2,2,1,1,0,2,1,0,1,6,3,1,1,1,1,5,1,1,0,1,1,1,1,0,2,1,2,2,1,2,0,5,1,2,4,3,8,10,1,1,2,1,0,1,1,1,3,1,0,2,1,0,1,5,3,2,4,2,1,2,2,1,2,1,2,2,0,1,0,1,0,1,1,1,0,1,0,0,1,1,0,0,1,0,0,0,0,0,2,2,0,1,0,1,0,0,3,0,1,0,1,1,1,1,1,1,1,0,1,0,1,0]&lang=en" style="width:600" />

- goharbor/harbor

<embed src="http://gar2020.opensource-service.cn/svgrenderer/github/X-lab2017/github-analysis-report?path=sqls/working-hour-distribution/image.svg&data=[1,3,8,7,4,4,7,8,10,6,5,3,2,3,3,3,3,2,1,1,1,1,1,1,1,3,9,7,4,4,8,8,8,7,5,4,3,3,3,3,2,2,1,1,1,1,1,1,2,3,5,7,5,4,7,7,8,7,6,4,4,3,3,3,2,2,1,1,1,1,1,1,1,4,6,5,4,4,7,7,7,6,5,4,3,3,4,4,3,2,1,1,1,2,1,1,1,3,5,5,3,3,6,6,6,5,4,3,2,2,2,2,2,1,1,1,1,1,1,1,1,1,1,2,1,1,1,2,1,1,1,1,1,1,1,2,1,1,1,1,1,1,1,1,1,1,2,2,1,1,2,2,2,2,2,2,1,1,2,1,1,1,1,1,1,1,1,1]&lang=en" style="width:600" />

- argoproj/argo

<embed src="http://gar2020.opensource-service.cn/svgrenderer/github/X-lab2017/github-analysis-report?path=sqls/working-hour-distribution/image.svg&data=[1,1,1,1,2,1,1,1,1,2,1,1,1,2,3,9,10,9,8,7,6,7,5,5,3,3,2,2,2,1,2,2,2,2,2,1,2,2,4,8,10,9,9,7,7,7,5,5,5,2,2,2,1,1,1,2,2,2,2,1,2,3,4,9,10,8,7,6,5,5,6,4,4,3,4,3,2,2,2,2,2,2,1,1,2,2,4,9,10,7,8,6,7,6,5,4,4,3,3,2,2,2,2,2,2,2,1,1,1,2,3,8,8,9,9,6,5,6,5,3,3,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,3,1,1,1,1,1,1]&lang=en" style="width:600" />

- linkerd/linkerd2

<embed src="http://gar2020.opensource-service.cn/svgrenderer/github/X-lab2017/github-analysis-report?path=sqls/working-hour-distribution/image.svg&data=[1,1,1,1,1,2,2,3,1,3,2,2,2,3,5,7,7,9,7,6,7,10,8,5,4,2,2,2,1,3,3,3,3,3,3,2,3,2,9,6,8,10,8,7,6,6,6,6,4,2,3,2,1,3,4,3,3,2,2,3,3,3,6,5,7,7,8,9,5,6,6,5,3,2,1,1,3,3,3,3,2,3,2,2,3,3,5,7,7,9,9,8,8,10,7,6,4,2,2,2,2,2,3,3,3,2,2,2,2,3,5,5,7,8,7,5,5,6,5,3,3,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]&lang=en" style="width:600" />

- jaegertracing/jaeger

<embed src="http://gar2020.opensource-service.cn/svgrenderer/github/X-lab2017/github-analysis-report?path=sqls/working-hour-distribution/image.svg&data=[2,2,3,3,4,2,3,8,10,7,7,5,6,9,8,7,7,5,6,3,2,3,2,2,3,3,3,6,3,4,5,7,8,8,6,6,7,6,7,9,9,7,4,3,3,3,2,1,3,3,4,4,4,2,4,6,10,8,6,7,6,8,8,8,7,6,3,5,3,3,2,1,2,3,3,4,3,4,5,6,6,10,7,7,6,8,6,9,6,5,4,4,3,4,2,3,3,4,4,3,2,2,4,8,10,8,5,5,5,5,9,7,4,5,4,3,4,2,2,3,1,2,2,1,1,1,2,3,2,3,1,1,2,2,1,2,1,1,1,2,1,2,1,1,1,1,2,1,1,1,1,1,2,1,2,2,2,1,1,2,1,1,3,3,2,1,1,1]&lang=en" style="width:600" />

- kubernetes/kubernetes

<embed src="http://gar2020.opensource-service.cn/svgrenderer/github/X-lab2017/github-analysis-report?path=sqls/working-hour-distribution/image.svg&data=[1,2,3,2,1,1,3,3,4,3,3,3,4,6,7,7,8,9,8,7,7,7,6,6,5,5,5,4,3,3,4,4,5,4,4,5,5,6,7,8,9,8,9,9,10,10,7,6,5,6,6,5,4,3,4,5,4,5,4,4,5,7,7,8,8,8,9,9,8,8,7,6,6,6,5,5,3,3,4,5,5,6,6,5,5,7,8,9,9,10,9,9,9,9,7,6,6,5,6,5,3,3,4,4,4,5,4,4,4,5,6,7,7,6,7,7,6,6,6,5,4,3,3,2,2,2,1,2,1,2,1,1,1,2,2,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,1,1,1,1,2,1,1,1]&lang=en" style="width:600" />

- cloudevents/spec

<embed src="http://gar2020.opensource-service.cn/svgrenderer/github/X-lab2017/github-analysis-report?path=sqls/working-hour-distribution/image.svg&data=[1,1,2,1,1,1,1,3,1,2,1,1,3,2,3,3,3,2,3,3,2,2,1,1,2,1,2,1,1,2,1,1,2,2,1,3,2,2,2,3,3,3,3,3,1,3,3,2,1,4,1,1,1,1,2,2,2,1,2,2,3,4,5,8,6,5,3,1,3,2,3,9,5,5,3,3,1,1,2,2,2,2,2,3,5,6,5,8,9,10,10,2,5,2,3,2,2,1,2,1,1,1,1,2,1,1,1,1,2,1,2,2,3,2,2,2,2,1,1,1,1,1,1,1,1,0,1,1,1,1,1,0,2,1,1,2,1,1,1,2,2,2,2,1,2,1,1,1,1,1,1,1,1,1,1,1,2,3,1,1,1,1,1,2,2,1,1,1]&lang=en" style="width:600" />

- cortexproject/cortex

<embed src="http://gar2020.opensource-service.cn/svgrenderer/github/X-lab2017/github-analysis-report?path=sqls/working-hour-distribution/image.svg&data=[1,1,1,1,1,1,4,7,7,9,8,7,7,8,9,6,8,7,5,3,3,2,2,1,1,1,1,1,1,1,3,7,8,8,10,9,6,7,9,9,8,5,4,3,2,2,2,1,1,1,1,1,1,1,3,5,10,9,8,8,8,9,7,10,8,5,4,2,3,2,2,2,1,1,1,1,1,1,4,6,8,8,9,7,8,9,10,9,9,6,4,3,3,2,1,1,1,1,1,1,1,2,3,7,8,8,8,8,6,6,7,9,7,5,3,3,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]&lang=en" style="width:600" />

- cri-o/cri-o

<embed src="http://gar2020.opensource-service.cn/svgrenderer/github/X-lab2017/github-analysis-report?path=sqls/working-hour-distribution/image.svg&data=[1,1,1,1,1,1,1,2,3,4,3,3,2,7,10,8,8,8,6,8,7,4,3,2,2,2,2,2,1,1,2,4,4,3,3,4,3,6,8,9,5,5,7,5,6,4,3,2,2,2,2,2,2,1,2,4,5,4,4,4,3,8,9,7,6,7,7,6,8,5,4,3,2,2,2,1,1,1,2,3,4,5,4,3,3,7,10,9,6,6,6,6,6,5,3,3,2,2,1,1,1,1,2,4,4,3,3,2,2,5,7,7,5,4,6,6,5,5,3,2,1,2,1,1,1,1,1,1,1,1,1,1,1,4,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1,1,1,1,1,1,1]&lang=en" style="width:600" />

- dragonflyoss/Dragonfly

<embed src="http://gar2020.opensource-service.cn/svgrenderer/github/X-lab2017/github-analysis-report?path=sqls/working-hour-distribution/image.svg&data=[1,3,6,4,5,4,6,6,5,6,3,3,3,6,2,1,1,2,1,2,1,1,1,2,1,5,9,5,2,3,3,5,4,6,3,2,4,3,5,3,1,1,1,0,2,0,1,1,2,4,8,8,5,3,5,5,5,6,3,1,5,2,3,4,2,2,1,1,1,1,1,1,2,10,7,6,3,2,7,6,5,6,3,7,3,2,1,1,1,1,1,1,1,1,2,3,1,4,6,5,3,4,5,10,7,7,7,2,2,3,2,1,1,1,1,1,1,1,1,1,1,2,1,1,2,1,2,2,1,2,1,3,1,1,2,1,1,1,1,1,1,1,2,4,3,4,2,3,2,1,3,2,2,3,2,2,2,3,2,2,2,2,1,1,1,1,1,3]&lang=en" style="width:600" />

- theupdateframework/tuf

<embed src="http://gar2020.opensource-service.cn/svgrenderer/github/X-lab2017/github-analysis-report?path=sqls/working-hour-distribution/image.svg&data=[1,0,0,1,1,0,1,2,3,4,8,7,5,5,5,4,3,2,4,1,1,2,2,1,1,1,0,1,0,1,1,2,3,4,8,5,5,7,5,5,3,2,3,2,3,3,1,2,1,0,0,1,1,1,1,1,3,4,9,5,5,7,6,6,7,1,1,3,2,1,1,1,1,1,1,1,0,0,2,3,5,8,10,10,4,6,5,6,5,2,3,1,5,4,1,1,1,0,1,1,1,1,1,3,3,6,10,5,7,4,10,7,2,2,3,1,2,1,1,1,0,1,1,0,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,1,0,0,0,1,1,0,1,1,1,0,1,1,0,1,1,1,1,0,1,1,1,1]&lang=en" style="width:600" />

- grpc/grpc

<embed src="http://gar2020.opensource-service.cn/svgrenderer/github/X-lab2017/github-analysis-report?path=sqls/working-hour-distribution/image.svg&data=[1,1,1,2,1,2,3,3,3,3,3,2,3,3,4,5,6,8,7,7,6,8,6,5,4,3,3,3,2,3,3,4,3,4,3,2,3,2,3,5,6,10,10,7,7,7,7,6,5,5,5,5,3,3,4,4,4,6,4,3,3,2,4,5,6,7,6,8,7,7,6,5,5,4,3,2,3,3,3,3,3,3,2,3,2,2,3,4,5,7,6,5,6,5,6,6,4,3,3,3,2,2,3,3,3,2,2,1,2,3,3,3,4,5,7,6,5,5,5,4,4,3,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]&lang=en" style="width:600" />

- envoyproxy/envoy

<embed src="http://gar2020.opensource-service.cn/svgrenderer/github/X-lab2017/github-analysis-report?path=sqls/working-hour-distribution/image.svg&data=[2,2,2,2,2,1,1,2,1,2,1,1,3,4,5,7,8,8,9,7,8,7,8,7,6,5,3,3,2,2,2,2,2,2,2,1,2,4,6,8,9,10,10,8,8,7,7,7,6,4,3,3,3,2,2,2,2,2,2,2,3,4,5,9,8,10,9,8,9,8,7,8,6,4,3,2,2,2,2,2,2,2,2,2,3,4,5,7,8,10,9,7,8,8,7,7,6,4,3,3,3,2,2,2,2,2,2,2,2,3,3,6,7,7,7,6,6,7,6,5,4,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,1,1]&lang=en" style="width:600" />

- theupdateframework/notary

<embed src="http://gar2020.opensource-service.cn/svgrenderer/github/X-lab2017/github-analysis-report?path=sqls/working-hour-distribution/image.svg&data=[1,2,2,1,1,1,4,2,7,7,2,5,2,5,2,4,3,1,2,3,1,2,2,1,0,4,3,4,2,1,1,2,8,6,1,2,1,7,4,5,2,2,4,1,4,1,1,1,3,1,5,4,1,2,4,2,5,7,8,10,3,8,4,4,7,0,5,2,1,2,0,4,1,2,1,1,2,1,4,5,3,3,9,3,1,5,3,4,2,4,2,1,4,2,2,1,2,1,2,2,3,3,3,3,5,9,7,7,9,9,4,7,2,2,3,1,4,2,4,2,1,2,0,2,3,3,1,1,4,4,5,1,3,2,2,0,2,2,1,4,1,1,2,1,0,1,1,1,0,1,1,1,1,1,1,1,2,1,2,1,1,4,2,2,1,1,0,3]&lang=en" style="width:600" />

- prometheus/prometheus

<embed src="http://gar2020.opensource-service.cn/svgrenderer/github/X-lab2017/github-analysis-report?path=sqls/working-hour-distribution/image.svg&data=[1,1,1,1,1,1,2,3,4,4,4,4,3,4,10,6,4,3,2,2,2,2,2,1,1,1,1,1,1,1,2,3,4,5,3,4,4,4,4,4,3,2,2,3,3,2,1,1,1,1,2,2,1,1,2,3,4,4,4,4,4,4,5,4,3,3,2,2,2,2,2,1,1,1,2,1,1,1,3,3,4,4,5,4,4,5,4,4,3,2,2,2,2,2,2,2,1,1,1,1,1,1,2,2,3,4,4,4,3,3,3,3,3,2,2,2,2,1,2,1,1,1,1,1,1,1,1,1,1,1,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]&lang=en" style="width:600" />

- containernetworking/cni

<embed src="http://gar2020.opensource-service.cn/svgrenderer/github/X-lab2017/github-analysis-report?path=sqls/working-hour-distribution/image.svg&data=[1,1,1,1,1,1,1,1,2,1,1,1,2,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1,1,1,1,1,1,1,1,1,1,1,1,2,1,1,1,1,1,1,1,1,1,1,2,1,1,1,1,1,1,2,2,2,1,2,3,10,8,2,2,1,1,1,1,1,1,2,2,2,1,1,2,1,2,2,2,1,2,2,2,1,1,1,1,1,1,1,1,1,1,1,2,1,1,1,1,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]&lang=en" style="width:600" />

- open-policy-agent/opa

<embed src="http://gar2020.opensource-service.cn/svgrenderer/github/X-lab2017/github-analysis-report?path=sqls/working-hour-distribution/image.svg&data=[1,1,1,1,1,1,2,2,3,2,2,3,5,6,7,8,6,7,8,9,6,5,6,4,4,2,2,2,1,1,3,2,4,4,2,3,4,6,6,5,6,7,7,6,7,5,4,5,3,4,3,2,1,1,2,2,2,2,2,3,3,4,5,4,7,6,6,8,7,6,7,5,4,4,3,2,2,2,2,2,3,2,3,4,5,4,5,4,7,7,10,6,5,6,6,4,3,3,2,2,1,2,2,2,2,3,2,3,4,4,5,4,4,6,9,7,6,4,3,4,3,1,1,2,1,1,1,1,1,1,1,1,1,1,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1,1,2,2,1,1,1,1,1,1,1,1]&lang=en" style="width:600" />

- falcosecurity/falco

<embed src="http://gar2020.opensource-service.cn/svgrenderer/github/X-lab2017/github-analysis-report?path=sqls/working-hour-distribution/image.svg&data=[1,1,1,1,1,1,1,2,5,8,7,3,5,6,6,7,6,5,5,5,4,4,2,2,1,1,2,1,1,1,1,2,3,10,6,7,5,5,10,5,9,8,5,5,4,3,2,3,1,1,1,1,1,2,3,2,6,6,6,5,5,7,3,6,7,5,4,4,3,4,2,2,1,1,2,2,2,1,2,3,4,4,7,5,5,6,10,6,6,8,6,4,4,3,2,3,2,2,2,1,2,1,2,2,3,6,5,5,5,6,5,4,6,5,3,2,2,1,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1,1,1,1,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1,1,2,2,1,1,1]&lang=en" style="width:600" />

- tikv/tikv

<embed src="http://gar2020.opensource-service.cn/svgrenderer/github/X-lab2017/github-analysis-report?path=sqls/working-hour-distribution/image.svg&data=[1,2,4,5,4,5,6,7,7,6,5,5,3,6,2,2,1,1,1,1,1,1,1,1,1,2,4,5,4,5,7,7,6,6,4,5,4,6,3,2,2,1,1,1,1,1,1,1,1,2,4,10,5,5,8,7,7,6,5,4,4,7,3,2,2,1,1,1,1,1,1,1,1,2,4,6,5,5,7,8,7,8,5,5,5,7,3,2,2,1,1,1,1,1,1,1,1,3,4,5,4,6,9,7,8,8,5,5,4,6,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1,2,1,2,3,3,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1]&lang=en" style="width:600" />

- kubeedge/kubeedge

<embed src="http://gar2020.opensource-service.cn/svgrenderer/github/X-lab2017/github-analysis-report?path=sqls/working-hour-distribution/image.svg&data=[1,8,10,7,3,3,9,8,10,7,4,5,5,5,4,2,1,1,1,1,1,1,1,1,1,6,8,6,3,2,8,9,7,7,5,6,6,3,3,2,2,1,1,1,1,1,1,1,2,7,7,7,2,3,9,8,7,5,3,3,3,3,3,2,1,1,1,1,1,1,1,1,2,7,6,8,3,2,7,7,8,7,4,5,6,4,4,2,2,2,1,1,1,1,1,1,2,6,9,8,3,4,10,10,9,7,6,5,4,3,3,1,1,1,1,1,1,1,1,1,1,2,3,3,2,1,3,6,4,3,3,2,1,2,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1,2,2,2,1,2,2,1,1,1,1,2,1,1,1,1,1,1,1,1]&lang=en" style="width:600" />

- projectcontour/contour

<embed src="http://gar2020.opensource-service.cn/svgrenderer/github/X-lab2017/github-analysis-report?path=sqls/working-hour-distribution/image.svg&data=[6,7,4,5,6,6,3,4,1,2,1,1,2,3,4,5,4,5,5,6,8,9,8,10,7,5,5,5,6,5,5,4,3,1,2,1,1,1,4,6,7,5,5,7,8,8,6,7,9,6,5,5,6,6,3,3,2,1,1,2,2,1,5,6,5,3,5,6,7,7,5,6,7,8,5,6,6,4,5,3,2,1,2,1,1,2,5,5,5,4,6,6,5,6,7,6,7,7,6,5,4,4,3,2,2,2,1,1,1,2,4,6,4,4,3,4,5,4,3,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,3,4,7]&lang=en" style="width:600" />

- buildpacks/pack

<embed src="http://gar2020.opensource-service.cn/svgrenderer/github/X-lab2017/github-analysis-report?path=sqls/working-hour-distribution/image.svg&data=[1,1,1,1,1,1,1,1,1,1,1,2,1,4,4,6,7,8,6,8,9,8,5,2,2,2,2,1,1,1,1,1,2,2,2,1,2,6,6,9,8,8,7,9,9,7,5,3,3,3,2,1,1,1,2,1,1,2,2,1,1,4,10,9,7,4,6,6,6,8,5,2,1,1,1,1,1,2,1,1,1,2,1,1,2,3,7,6,6,7,7,5,9,6,3,3,1,2,1,1,2,1,1,2,2,1,3,3,3,5,6,6,7,4,7,6,7,4,3,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]&lang=en" style="width:600" />

- rook/rook

<embed src="http://gar2020.opensource-service.cn/svgrenderer/github/X-lab2017/github-analysis-report?path=sqls/working-hour-distribution/image.svg&data=[1,1,2,2,1,2,2,5,6,7,5,4,4,7,6,6,6,7,6,5,6,4,5,4,2,2,1,2,2,2,3,7,6,5,4,3,4,6,7,7,8,8,5,6,5,5,4,3,2,1,2,2,3,3,3,5,8,7,5,4,4,7,8,8,8,5,6,5,5,5,4,4,2,2,1,1,3,3,4,6,7,5,4,4,3,6,7,7,10,6,6,5,5,5,5,4,2,2,2,2,2,2,3,4,4,6,6,3,3,5,6,9,7,6,5,4,3,4,3,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1,1,1,1,1,1,1,1]&lang=en" style="width:600" />

- helm/helm

<embed src="http://gar2020.opensource-service.cn/svgrenderer/github/X-lab2017/github-analysis-report?path=sqls/working-hour-distribution/image.svg&data=[3,1,1,1,1,1,2,3,3,3,2,2,3,4,5,6,5,5,4,4,5,4,3,2,3,2,2,2,2,2,3,4,3,3,3,3,3,5,6,8,9,5,5,5,5,4,4,2,4,3,2,2,1,2,3,3,4,4,3,2,3,4,4,7,7,7,4,4,4,4,4,2,3,2,2,2,1,2,3,3,3,4,4,4,3,4,6,6,6,7,6,6,6,10,6,3,5,3,2,2,1,2,3,3,2,3,3,2,3,4,5,5,6,6,4,5,4,3,2,2,3,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,1,1,4,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]&lang=en" style="width:600" />

- coredns/coredns

<embed src="http://gar2020.opensource-service.cn/svgrenderer/github/X-lab2017/github-analysis-report?path=sqls/working-hour-distribution/image.svg&data=[1,1,1,1,1,1,2,9,10,10,5,2,3,6,9,6,5,4,3,3,2,2,1,1,1,1,1,1,1,1,2,3,3,2,2,2,2,4,4,4,3,2,2,2,2,2,1,1,1,1,1,2,1,2,2,2,3,2,2,2,3,3,2,3,3,3,3,2,2,1,1,1,1,1,1,1,1,1,2,2,4,3,2,2,3,3,4,3,4,3,3,2,2,3,1,1,1,2,1,1,1,2,2,2,4,3,3,3,3,3,2,3,4,2,2,2,1,1,1,1,1,1,1,1,1,1,2,1,1,1,1,1,1,1,1,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]&lang=en" style="width:600" />

- opentracing/opentracing-go

<embed src="http://gar2020.opensource-service.cn/svgrenderer/github/X-lab2017/github-analysis-report?path=sqls/working-hour-distribution/image.svg&data=[0,4,3,7,1,4,3,3,7,3,4,3,4,1,2,2,2,1,0,1,0,1,1,1,1,4,5,1,2,3,5,5,5,5,2,2,2,3,2,3,1,0,4,1,1,1,0,1,2,3,2,6,2,1,4,4,5,6,3,3,2,2,2,1,1,2,2,4,1,10,0,1,1,3,3,2,1,2,5,4,4,5,4,3,2,1,1,1,1,1,1,1,1,3,2,1,2,5,4,4,3,4,7,7,7,3,3,2,3,2,1,4,2,0,1,1,2,1,1,1,0,1,1,3,1,1,1,2,2,3,1,2,3,1,3,2,0,2,0,1,0,0,1,1,1,1,2,1,1,3,1,2,1,3,1,2,1,2,2,2,0,1,1,1,1,0,0,1]&lang=en" style="width:600" />

- spiffe/spire

<embed src="http://gar2020.opensource-service.cn/svgrenderer/github/X-lab2017/github-analysis-report?path=sqls/working-hour-distribution/image.svg&data=[1,1,1,1,1,2,1,1,1,1,1,1,1,3,2,4,5,8,8,4,6,6,6,4,1,2,2,2,1,1,1,1,1,1,1,1,2,3,4,5,5,9,10,6,9,9,9,7,3,2,2,1,1,1,1,1,1,1,1,1,4,5,5,6,6,10,8,9,9,8,5,3,3,2,1,1,1,1,1,1,1,1,1,1,2,3,4,6,7,10,7,9,8,10,10,8,4,3,1,1,1,2,1,1,1,1,1,2,2,4,4,7,10,9,6,5,7,6,6,3,2,1,1,1,0,1,1,1,1,1,1,0,1,1,2,1,1,1,1,1,1,1,1,2,1,1,1,1,1,1,1,0,1,1,1,0,1,1,0,1,1,1,1,1,0,1,0,1]&lang=en" style="width:600" />

- fluent/fluentd

<embed src="http://gar2020.opensource-service.cn/svgrenderer/github/X-lab2017/github-analysis-report?path=sqls/working-hour-distribution/image.svg&data=[2,6,8,4,4,6,6,4,8,6,5,4,2,3,4,2,4,2,2,2,1,2,2,1,3,6,9,10,4,10,10,8,6,5,4,4,3,4,3,3,3,3,2,3,2,2,1,1,2,4,8,4,4,4,3,6,7,9,3,3,2,4,3,3,2,2,2,1,2,2,1,2,3,3,6,4,3,4,6,9,8,5,4,3,4,4,4,4,2,2,2,2,2,2,2,3,4,3,8,8,3,7,6,6,5,5,3,3,2,3,4,3,2,2,2,2,2,2,1,1,2,2,1,2,1,2,1,1,2,2,1,1,1,2,1,1,2,1,1,1,1,2,2,1,1,1,1,1,1,1,1,2,3,1,1,1,1,1,1,1,1,2,2,1,1,1,1,2]&lang=en" style="width:600" />

- operator-framework/operator-sdk

<embed src="http://gar2020.opensource-service.cn/svgrenderer/github/X-lab2017/github-analysis-report?path=sqls/working-hour-distribution/image.svg&data=[1,1,1,1,1,1,1,1,2,2,2,2,3,5,5,6,7,7,10,8,7,6,5,4,3,3,3,3,1,1,1,1,1,3,3,4,3,4,6,7,8,10,6,6,5,6,4,3,3,3,2,2,2,2,1,2,2,2,3,3,3,4,5,6,6,7,8,8,7,6,5,4,5,3,3,3,2,1,1,1,2,2,3,3,3,4,7,7,7,6,8,7,6,4,5,3,5,2,3,2,2,1,1,1,1,3,3,3,3,4,5,6,7,7,8,6,6,4,3,4,2,2,2,1,1,1,1,1,1,1,1,2,2,1,1,1,1,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,1,1,1,1,1,1,1,1,1,1,1,2]&lang=en" style="width:600" />

- containerd/containerd

<embed src="http://gar2020.opensource-service.cn/svgrenderer/github/X-lab2017/github-analysis-report?path=sqls/working-hour-distribution/image.svg&data=[1,2,3,4,4,3,3,5,4,6,6,3,6,7,8,7,10,8,6,8,6,7,6,4,4,6,5,5,4,3,4,5,6,4,4,7,5,5,7,9,8,6,7,10,5,5,2,4,4,6,6,6,3,6,5,5,4,4,6,6,6,8,6,9,10,6,9,7,5,4,7,6,5,7,8,5,6,6,7,5,6,5,6,5,6,5,4,8,7,10,7,4,7,8,7,4,5,6,5,4,3,3,6,5,4,4,4,2,3,5,5,7,9,7,9,8,6,8,6,4,4,2,2,2,1,1,1,2,2,1,2,2,2,2,2,2,3,3,3,1,1,2,2,1,1,1,3,3,2,2,1,2,2,2,1,2,1,2,4,2,1,1,1,1,1,1,1,1]&lang=en" style="width:600" />

- vitessio/vitess

<embed src="http://gar2020.opensource-service.cn/svgrenderer/github/X-lab2017/github-analysis-report?path=sqls/working-hour-distribution/image.svg&data=[5,2,4,2,3,4,7,7,5,6,4,3,3,3,7,8,9,7,10,9,9,6,10,6,6,5,6,6,4,4,6,6,5,4,5,4,5,5,5,6,8,9,9,6,7,8,6,7,5,5,5,4,6,6,6,6,4,4,5,4,5,4,3,7,7,5,8,8,8,7,6,4,9,5,6,6,7,10,7,8,5,5,4,5,5,5,6,6,8,8,5,6,7,6,5,4,4,5,6,5,4,5,5,4,3,4,3,4,2,4,3,4,7,6,5,7,5,8,4,5,4,2,2,2,2,1,1,2,1,1,1,1,1,1,3,2,2,2,1,1,1,1,1,1,1,1,2,2,1,2,2,2,2,1,2,2,1,1,2,1,2,3,2,2,1,1,1,2]&lang=en" style="width:600" />

