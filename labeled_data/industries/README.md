# Project industry mapping

## Assignment policy

These labels describe the economic activity a project directly supports, using
[NAICS 2022 sectors](https://www.census.gov/programs-surveys/economic-census/year/2022/guidance/understanding-naics.html).
They are OpenDigger project-use mappings, not official NAICS classifications of
software projects or their owners.

- General-purpose software, developer tools, databases, cloud infrastructure,
  AI frameworks, and information publishing belong to Information (51).
  Existing project descriptions and technical labels establish their software
  or information-service purpose.
- A verified, specific industry purpose takes precedence over the general software
  category. For example, HospitalRun supports health care (62), Fineract supports
  financial services (52), and WooCommerce supports retail (44-45).
- Device control, vehicle platforms, semiconductor design, industrial telemetry,
  and printer toolpaths support manufacturing (31-33). Scientific simulation,
  domain-specific research, CAD, accounting, advertising, and market research
  support professional, scientific, and technical services (54).
- Programming courses and teaching resources support education (61). A university
  origin or a research paper alone does not put general-purpose software in 61 or 54.
- General blockchain infrastructure stays in 51 unless its direct purpose is
  payments, financial transactions, or financial analysis. Game engines and game
  software also stay in 51; they do not operate the live entertainment or recreation
  establishments described by 71. Generic ERP and agent-management tools do not
  establish a company-management industry (55) by themselves.
- Each mapped project has one primary sector in this initial inventory. Do not
  expand a project to every possible downstream use or infer an industry from
  its company, foundation, country, or users alone.
- Sector files reference canonical Project identifiers, sorted lexicographically.
  They do not copy organization/repository IDs or reference whole companies,
  foundations, or technical categories. Project identity corrections are documented
  separately below.
- Unknown purposes and identity conflicts remain unassigned. Exact duplicate
  project labels are represented by the canonical label already holding the same
  entities. Historical project labels with distinct entity sets remain separate.

## Coverage

Reviewed on 2026-11-22: 955 Project labels, 947 direct assignments across ten
sectors, six entries pending manual review, and two duplicate labels covered
through their canonical projects. Of the assignments, 888 are general-purpose
software/information projects and 59 have a sector-specific purpose. The other
10 sectors remain empty because this inventory has no verified primary matches.

| Sector | Name | Direct Project labels |
| --- | --- | ---: |
| 22 | Utilities | 1 |
| 31-33 | Manufacturing | 13 |
| 44-45 | Retail Trade | 1 |
| 48-49 | Transportation and Warehousing | 2 |
| 51 | Information | 888 |
| 52 | Finance and Insurance | 10 |
| 54 | Professional, Scientific, and Technical Services | 18 |
| 61 | Educational Services | 11 |
| 62 | Health Care and Social Assistance | 1 |
| 92 | Public Administration | 2 |

## Sector-specific evidence

The links below identify the project purpose supporting each mapping. Sector
selection is an interpretation of that purpose under the policy above. Existing
project descriptions are retained; these notes also record cases where a project
website gives more useful context than an old repository description.

| Project label | Sector | Direct purpose | Primary source |
| --- | --- | --- | --- |
| `:agencies/us_va/caseflow` | 92 | Government benefit appeals or digital public services. | [Caseflow](https://depo-platform-documentation.scrollhelp.site/developer-docs/caseflow) |
| `:companies/3drobotics/ardupilot` | 31-33 | Vehicle, robot, sensor, or processor engineering and device control. | [ArduPilot](https://ardupilot.org/) |
| `:companies/baidu/apollo` | 31-33 | Vehicle, robot, sensor, or processor engineering and device control. | [Apollo Auto](https://github.com/ApolloAuto/apollo) |
| `:companies/bytedance/oceanengine` | 54 | Advertising and marketing campaign services. | [Ocean Engine](https://github.com/oceanengine) |
| `:companies/consensys/metamask` | 52 | Financial services, payments, digital-asset transactions, or financial-market analysis. | [MetaMask](https://github.com/metamask) |
| `:companies/dfrobot/mindplus_desktop` | 61 | Programming education, training materials, or structured contributor learning. | [Mindplus Desktop](https://mindplus.dfrobot.com/mp2/) |
| `:companies/elephant_robotics/mycobot_ros` | 31-33 | Vehicle, robot, sensor, or processor engineering and device control. | [myCobot ROS](https://github.com/elephantrobotics/mycobot_ros) |
| `:companies/elephant_robotics/pymycobot` | 31-33 | Vehicle, robot, sensor, or processor engineering and device control. | [pymycobot](https://github.com/elephantrobotics/pymycobot) |
| `:companies/expensify/expensify` | 54 | Expense reporting, reconciliation, and accounting workflows. | [Expensify](https://www.expensify.com/) |
| `:companies/formbricks/formbricks` | 54 | Customer surveys and market research. | [Formbricks](https://formbricks.com/) |
| `:companies/horizon_robotics/embodiedgen` | 54 | Robotics simulation, perception, and control research. | [EmbodiedGen](https://github.com/HorizonRobotics/EmbodiedGen) |
| `:companies/horizon_robotics/holomotion` | 54 | Robotics simulation, perception, and control research. | [HoloMotion](https://github.com/HorizonRobotics/HoloMotion) |
| `:companies/horizon_robotics/sparse4d` | 54 | Robotics simulation, perception, and control research. | [Sparse4D](https://github.com/HorizonRobotics/Sparse4D) |
| `:companies/huggingface/lerobot` | 54 | Robotics simulation, perception, and control research. | [LeRobot](https://github.com/huggingface/lerobot) |
| `:companies/kitware/trame` | 54 | Scientific visualization, experimental physics, or bioinformatics research. | [trame](https://kitware.github.io/trame/) |
| `:companies/kitware/vtk_js` | 54 | Scientific visualization, experimental physics, or bioinformatics research. | [vtk.js](https://kitware.github.io/vtk-js/) |
| `:companies/llama_corp/defillama` | 52 | Financial services, payments, digital-asset transactions, or financial-market analysis. | [DefiLlama](https://defillama.com/) |
| `:companies/llama_corp/llamapay` | 52 | Financial services, payments, digital-asset transactions, or financial-market analysis. | [LlamaPay](https://llamapay.io/) |
| `:companies/manycore/plankassembly` | 54 | CAD reconstruction, spatial design, and engineering modelling. | [PlankAssembly](https://github.com/manycore-research/PlankAssembly) |
| `:companies/manycore/spatialgen` | 54 | CAD reconstruction, spatial design, and engineering modelling. | [SpatialGen](https://github.com/manycore-research/SpatialGen) |
| `:companies/matra_datavision/freecad` | 54 | CAD reconstruction, spatial design, and engineering modelling. | [FreeCAD](https://github.com/FreeCAD/FreeCAD) |
| `:companies/mifos/fineract` | 52 | Financial services, payments, digital-asset transactions, or financial-market analysis. | [Apache Fineract](https://fineract.apache.org/) |
| `:companies/moving_tech_innovations/nammayatri` | 48-49 | Passenger transport and ride-booking operations. | [Namma Yatri](https://github.com/nammayatri) |
| `:companies/mozilla/mdn` | 61 | Programming education, training materials, or structured contributor learning. | [MDN Web Docs](https://developer.mozilla.org/en-US/docs/Learn_web_development) |
| `:companies/openmind/om1` | 31-33 | Vehicle, robot, sensor, or processor engineering and device control. | [OM1](https://github.com/OpenMind/OM1) |
| `:companies/shinnytech/tqsdk` | 52 | Financial services, payments, digital-asset transactions, or financial-market analysis. | [TqSdk](https://github.com/shinnytech/tqsdk-python) |
| `:companies/slamtec/rplidar` | 31-33 | Vehicle, robot, sensor, or processor engineering and device control. | [RPLIDAR SDK and ROS Drivers](https://github.com/Slamtec/rplidar_sdk) |
| `:companies/stripe/stripe_cli` | 52 | Financial services, payments, digital-asset transactions, or financial-market analysis. | [Stripe CLI](https://docs.stripe.com/cli) |
| `:companies/stripe/stripe_sdks` | 52 | Financial services, payments, digital-asset transactions, or financial-market analysis. | [Stripe API SDKs](https://docs.stripe.com/sdks) |
| `:companies/taos/tdengine` | 31-33 | Industrial equipment telemetry and industrial IoT operations. | [TDengine](https://github.com/taosdata) |
| `:companies/unitree/unitree_mujoco` | 54 | Robotics simulation, perception, and control research. | [Unitree MuJoCo](https://github.com/unitreerobotics/unitree_mujoco) |
| `:companies/unitree/unitree_rl_gym` | 54 | Robotics simulation, perception, and control research. | [Unitree RL Gym](https://github.com/unitreerobotics/unitree_rl_gym) |
| `:companies/unitree/unitree_rl_lab` | 54 | Robotics simulation, perception, and control research. | [Unitree RL Lab](https://github.com/unitreerobotics/unitree_rl_lab) |
| `:companies/unitree/unitree_sdk2` | 31-33 | Vehicle, robot, sensor, or processor engineering and device control. | [Unitree SDK2](https://github.com/unitreerobotics/unitree_sdk2) |
| `:companies/woo/woocommerce` | 44-45 | Online retail storefronts and commerce. | [WooCommerce](https://github.com/woocommerce) |
| `:foundations/anoma/namada` | 52 | Financial services, payments, digital-asset transactions, or financial-market analysis. | [Namada](https://namada.net/) |
| `:foundations/free_ebook/free_programming_books` | 61 | Programming education, training materials, or structured contributor learning. | [Free Programming Books](https://github.com/EbookFoundation/free-programming-books) |
| `:foundations/girlscript/gssoc24` | 61 | Programming education, training materials, or structured contributor learning. | [GirlScript Summer of Code 24](https://github.com/GSSoC24) |
| `:foundations/linux_foundation/lfai/datapractices` | 61 | Programming education, training materials, or structured contributor learning. | [DataPractices](https://datapractices.org/) |
| `:foundations/linux_foundation/lfed/fledge` | 31-33 | Industrial equipment telemetry and industrial IoT operations. | [Fledge](https://fledge-iot.readthedocs.io/en/latest/) |
| `:foundations/linux_foundation/openjs/hospitalrun` | 62 | Hospital administration and clinical care workflows. | [HospitalRun](https://hospitalrun.io/) |
| `:foundations/linux_foundation/openjs/interledger` | 52 | Financial services, payments, digital-asset transactions, or financial-market analysis. | [Interledger](https://github.com/interledger) |
| `:foundations/openatom/carsmos` | 31-33 | Vehicle, robot, sensor, or processor engineering and device control. | [Carsmos](https://www.carsmos.ai/projects/) |
| `:foundations/openatom/open_brother` | 61 | Programming education, training materials, or structured contributor learning. | [源师兄](https://gitee.com/Open-Brother) |
| `:foundations/openatom/opendacs` | 31-33 | Electronic circuit and semiconductor design automation. | [openDACS](https://github.com/OpenAtomFoundation) |
| `:foundations/openatom/openv2x` | 48-49 | Roadside infrastructure for cooperative transport and traffic operations. | [OpenV2X](https://github.com/open-v2x) |
| `:institutions/cas/xiangshan` | 31-33 | Vehicle, robot, sensor, or processor engineering and device control. | [XiangShan](https://github.com/OpenXiangShan) |
| `:institutions/cern/alice_o2` | 54 | Scientific visualization, experimental physics, or bioinformatics research. | [AliceO2](https://github.com/AliceO2Group/AliceO2) |
| `:projects/bioconda` | 54 | Scientific visualization, experimental physics, or bioinformatics research. | [Bioconda](https://bioconda.github.io/) |
| `:projects/bitcoin` | 52 | Financial services, payments, digital-asset transactions, or financial-market analysis. | [Bitcoin](https://github.com/bitcoin) |
| `:projects/daily_codeforce_problems` | 61 | Programming education, training materials, or structured contributor learning. | [Daily CodeForce Problems](https://github.com/Yawn-Sean/Daily_CF_Problems) |
| `:projects/first_contributions` | 61 | Programming education, training materials, or structured contributor learning. | [First Contributions](https://github.com/firstcontributions/first-contributions) |
| `:projects/genesis` | 54 | Robotics simulation, perception, and control research. | [Genesis](https://github.com/Genesis-Embodied-AI/genesis-world) |
| `:projects/island.is` | 92 | Government benefit appeals or digital public services. | [island.is](https://github.com/island-is) |
| `:projects/open_water_analytics` | 22 | Water distribution network modelling and water-quality analysis. | [Open Water Analytics](https://github.com/OpenWaterAnalytics/EPANET) |
| `:projects/orca_slicer` | 31-33 | G-code generation for additive manufacturing. | [OrcaSlicer](https://github.com/OrcaSlicer/OrcaSlicer) |
| `:projects/spring_boot_tutorials` | 61 | Programming education, training materials, or structured contributor learning. | [Spring Boot 3 Tutorials](https://github.com/eugenp/tutorials) |
| `:projects/the_algorithms` | 61 | Programming education, training materials, or structured contributor learning. | [The Algorithms](https://github.com/TheAlgorithms) |
| `:projects/woowacourse_precourse` | 61 | Programming education, training materials, or structured contributor learning. | [Woowacourse Precourse](https://github.com/woowacourse-precourse) |

## Manual review and duplicate coverage

These eight labels are deliberately absent from the sector reference lists. The
identity and entity corrections listed here are separate from industry mapping.

| Project label | Reason |
| --- | --- |
| `:communities/agentgateway/agentgateway` | Duplicate of `:companies/solo_io/agentgateway`; the same GitHub organization is already covered by that canonical company project. |
| `:companies/antgroup/aq-medai` | The label describes generic retrieval software, but the medical scope suggested by its name could not be verified from the referenced organization. |
| `:companies/bytedance/bytees` | No project description or technical classification; the referenced organization could not be verified. |
| `:companies/dodoedu/video_chat` | No project description or usable README was available to establish its intended use; the education company name alone is insufficient. |
| `:companies/nammayatri/nammayatri` | Duplicate of `:companies/moving_tech_innovations/nammayatri`; both reference the same GitHub organization. |
| `:foundations/linux_foundation/lfai/open_voice_trustmark` | No project description; the scope of the referenced organization needs review before selecting an industry. |
| `:foundations/linux_foundation/lfai/opends4all` | The name refers to OpenDS4All, but the description and GitHub organization refer to Egeria/ODPi. Correct the project identity before assigning an industry. |
| `:projects/god_bless` | No description, technical classification, or usable README to establish the project purpose. |

OpenDS4All currently repeats the [ODPi organization](https://github.com/odpi)
used by the Egeria label; it must not be classified as an educational project until
its own entities are resolved.

## TRAE identity correction

The TRAE label now references the official [Trae-AI organization](https://github.com/Trae-AI)
with numeric ID 192691831, verified through the [GitHub API](https://api.github.com/orgs/Trae-AI).
The previous Trea-AI entry (ID 164546571) belonged to an unrelated organization.
The [official TRAE repository](https://github.com/Trae-AI/TRAE) confirms the organization,
and the [product description](https://www.trae.ai/enterprise) establishes its software
development purpose, so TRAE is assigned to Information (51).

This label covers the official organization's public activity; it does not imply
that the TRAE IDE source code is published. The separately labeled
`:companies/bytedance/trae_agent` continues to cover `bytedance/trae-agent`.
