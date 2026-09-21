#!/usr/bin/env python3
"""Import the curated Agentic AI landscape into labeled_data.

Usage: python3 src/scripts/importAgenticAiLandscape.py path/to/agentic-ai-projects.csv
Requires PyYAML (already used by python_v2). The CSV is the upstream canonical
dataset; only rows marked keep/add belong to the published landscape.
"""

import csv
import re
import sys
from collections import defaultdict
from pathlib import Path

import yaml


ROOT = Path(__file__).resolve().parents[2]
LABELS = ROOT / "labeled_data"
SOURCE_URL = "https://github.com/antgroup/agentic-ai-landscape/blob/main/data/agentic-ai-projects.csv"


class LabelDumper(yaml.SafeDumper):
    def increase_indent(self, flow=False, indentless=False):
        return super().increase_indent(flow, False)


def dump_label(data):
    return yaml.dump(data, Dumper=LabelDumper, allow_unicode=True, sort_keys=False)

# Existing unowned project labels are moved only when the initiating company or
# organization can be confirmed. Ambiguous and individual-led projects stay in
# labeled_data/projects and are referenced there by the technical taxonomy.
ROOT_MOVES = {
    ":projects/browser_use": ":companies/browser_use/browser_use",
    ":projects/cline": ":companies/cline/cline",
    ":projects/mem0ai": ":companies/mem0/mem0",
    ":projects/kilocode": ":companies/kilo/kilocode",
    ":projects/activepieces": ":companies/activepieces/activepieces",
    ":projects/agno": ":companies/agno/agno",
    ":projects/pipecat_ai": ":companies/daily/pipecat",
    ":projects/om1": ":companies/openmind/om1",
    ":projects/crew_ai": ":companies/crewai/crewai",
    ":projects/mastra_ai": ":companies/mastra/mastra",
    ":projects/docling": ":companies/ibm/docling",
    ":projects/ray": ":universities/uc_berkeley/ray",
    ":projects/ollama": ":companies/ollama/ollama",
    ":projects/vllm": ":universities/uc_berkeley/vllm",
    ":projects/hermes_agent": ":companies/nousresearch/hermes_agent",
}

# Every root-project migration needs a reviewable source. Repository ownership
# is sufficient when it directly identifies the initiating organization; the
# three research/incubation cases use the corresponding primary source.
INITIATOR_EVIDENCE = {
    ":projects/browser_use": "https://github.com/browser-use/browser-use",
    ":projects/cline": "https://github.com/cline/cline",
    ":projects/mem0ai": "https://github.com/mem0ai/mem0",
    ":projects/kilocode": "https://github.com/Kilo-Org/kilocode",
    ":projects/activepieces": "https://github.com/activepieces/activepieces",
    ":projects/agno": "https://github.com/agno-agi/agno",
    ":projects/pipecat_ai": "https://www.daily.co/blog/introducing-pipecat/",
    ":projects/om1": "https://github.com/OpenMind/OM1",
    ":projects/crew_ai": "https://github.com/crewAIInc/crewAI",
    ":projects/mastra_ai": "https://github.com/mastra-ai/mastra",
    ":projects/docling": "https://research.ibm.com/blog/docling-generative-AI",
    ":projects/ray": "https://rise.cs.berkeley.edu/projects/ray/",
    ":projects/ollama": "https://github.com/ollama/ollama",
    ":projects/vllm": "https://blog.vllm.ai/2023/06/20/vllm.html",
    ":projects/hermes_agent": "https://github.com/NousResearch/hermes-agent",
}

if ROOT_MOVES.keys() != INITIATOR_EVIDENCE.keys():
    raise ValueError("Every project migration must have initiator evidence")

# Cases where the repository name cannot uniquely identify an existing project
# label, or the selected project does not yet have one.
MANUAL_REFS = {
    "modelcontextprotocol/servers": ":companies/anthropic/mcp_servers",
    "pydantic/pydantic-ai": ":companies/pydantic/pydantic_ai",
    "livekit/agents": ":companies/livekit/agents",
    "a2aproject/A2A": ":companies/google/a2aproject",
    "FlowiseAI/Flowise": ":companies/workday/flowiseai",
    "triton-lang/triton": ":companies/openai/triton",
    "delta-io/delta": ":companies/databricks/delta_lake",
    "openxla/xla": ":companies/google/openxla",
    "agentscope-ai/QwenPaw": ":companies/alibaba/qwenpaw",
    "llm-d/llm-d": ":communities/llm_d/llm_d",
    "volcengine/OpenViking": ":companies/bytedance/openviking",
    "microsoft/agent-framework": ":companies/microsoft/agent_framework",
    "JetBrains/koog": ":companies/jetbrains/koog",
    "trycua/cua": ":companies/trycua/cua",
    "agentgateway/agentgateway": ":communities/agentgateway/agentgateway",
    "ag-ui-protocol/ag-ui": ":companies/copilotkit/ag_ui",
    "a2ui-project/a2ui": ":companies/google/a2ui",
    "kubernetes-sigs/agent-sandbox": ":foundations/linux_foundation/cncf/agent_sandbox",
    "vllm-project/vllm-omni": ":universities/uc_berkeley/vllm_omni",
    "LMCache/LMCache": ":communities/lmcache/lmcache",
    "huggingface/trl": ":companies/huggingface/trl",
    "topoteretes/cognee": ":companies/cognee/cognee",
    "NVIDIA/Model-Optimizer": ":companies/nvidia/model_optimizer",
    "NVIDIA-NeMo/RL": ":companies/nvidia/nemo_rl",
    "stacklok/toolhive": ":companies/stacklok/toolhive",
    "stablyai/orca": ":companies/stablyai/orca",
    "headroomlabs-ai/headroom": ":companies/headroomlabs/headroom",
    "esengine/DeepSeek-Reasonix": ":communities/esengine/deepseek_reasonix",
    "diegosouzapw/OmniRoute": ":communities/omniroute/omniroute",
    "MoonshotAI/kimi-code": ":companies/moonshot/kimi_code",
    "herdrdev/herdr": ":communities/herdr/herdr",
    "pingdotgg/t3code": ":companies/pingdotgg/t3code",
    "supermemoryai/supermemory": ":companies/supermemory/supermemory",
    "huggingface/OpenEnv": ":companies/huggingface/openenv",
    "microsoft/markitdown": ":companies/microsoft/markitdown",
    "deepseek-ai/deepseek-harness": ":companies/deepseek/deepseek_harness",
    "github/spec-kit": ":companies/github/spec_kit",
    "larksuite/cli": ":companies/bytedance/lark_cli",
    "firecrawl/firecrawl": ":companies/firecrawl/firecrawl",
}

# These owners are project-specific GitHub organizations rather than general
# company or foundation organizations. Their project labels intentionally track
# the whole organization. IDs are omitted here and completed by completeLabel.
ORG_SCOPED_PROJECTS = {
    "agentgateway/agentgateway": (":communities/agentgateway/agentgateway", "agentgateway"),
    "herdrdev/herdr": (":communities/herdr/herdr", "herdrdev"),
    "llm-d/llm-d": (":communities/llm_d/llm_d", "llm-d"),
    "LMCache/LMCache": (":communities/lmcache/lmcache", "LMCache"),
    "activepieces/activepieces": (":companies/activepieces/activepieces", "activepieces"),
    "agno-agi/agno": (":companies/agno/agno", "agno-agi"),
    "browser-use/browser-use": (":companies/browser_use/browser_use", "browser-use"),
    "cline/cline": (":companies/cline/cline", "cline"),
    "topoteretes/cognee": (":companies/cognee/cognee", "topoteretes"),
    "ag-ui-protocol/ag-ui": (":companies/copilotkit/ag_ui", "ag-ui-protocol"),
    "crewAIInc/crewAI": (":companies/crewai/crewai", "crewAIInc"),
    "pipecat-ai/pipecat": (":companies/daily/pipecat", "pipecat-ai"),
    "firecrawl/firecrawl": (":companies/firecrawl/firecrawl", "firecrawl"),
    "a2ui-project/a2ui": (":companies/google/a2ui", "a2ui-project"),
    "docling-project/docling": (":companies/ibm/docling", "docling-project"),
    "Kilo-Org/kilocode": (":companies/kilo/kilocode", "Kilo-Org"),
    "mastra-ai/mastra": (":companies/mastra/mastra", "mastra-ai"),
    "mem0ai/mem0": (":companies/mem0/mem0", "mem0ai"),
    "ollama/ollama": (":companies/ollama/ollama", "ollama"),
    "supermemoryai/supermemory": (":companies/supermemory/supermemory", "supermemoryai"),
    "trycua/cua": (":companies/trycua/cua", "trycua"),
    "ray-project/ray": (":universities/uc_berkeley/ray", "ray-project"),
}

PARENT_NAMES = {
    "browser_use": "Browser Use", "cline": "Cline", "mem0": "Mem0",
    "kilo": "Kilo Code", "activepieces": "Activepieces", "agno": "Agno",
    "daily": "Daily", "openmind": "OpenMind", "crewai": "CrewAI",
    "mastra": "Mastra", "ollama": "Ollama", "nousresearch": "Nous Research",
    "pydantic": "Pydantic",
    "llm_d": "llm-d", "jetbrains": "JetBrains", "trycua": "Cua",
    "agentgateway": "Agentgateway", "lmcache": "LMCache",
    "cognee": "Cognee", "stacklok": "Stacklok", "stablyai": "Stably AI",
    "headroomlabs": "Headroom Labs", "esengine": "ESEngine",
    "omniroute": "OmniRoute", "herdr": "Herdr", "pingdotgg": "Ping.gg",
    "supermemory": "Supermemory", "firecrawl": "Firecrawl",
}

PROJECT_NAMES = {
    "modelcontextprotocol/servers": "MCP Servers",
    "pydantic/pydantic-ai": "Pydantic AI",
    "livekit/agents": "LiveKit Agents",
    "code-yeongyu/oh-my-openagent": "Oh My OpenAgent",
    "agentscope-ai/QwenPaw": "QwenPaw",
    "llm-d/llm-d": "llm-d",
    "volcengine/OpenViking": "OpenViking",
    "microsoft/agent-framework": "Microsoft Agent Framework",
    "JetBrains/koog": "Koog",
    "trycua/cua": "Cua",
    "agentgateway/agentgateway": "Agentgateway",
    "ag-ui-protocol/ag-ui": "AG-UI",
    "a2ui-project/a2ui": "A2UI",
    "kubernetes-sigs/agent-sandbox": "Agent Sandbox",
    "vllm-project/vllm-omni": "vLLM-Omni",
    "LMCache/LMCache": "LMCache",
    "huggingface/trl": "TRL",
    "topoteretes/cognee": "Cognee",
    "NVIDIA/Model-Optimizer": "Model Optimizer",
    "NVIDIA-NeMo/RL": "NeMo RL",
    "stacklok/toolhive": "ToolHive",
    "stablyai/orca": "Orca",
    "headroomlabs-ai/headroom": "Headroom",
    "esengine/DeepSeek-Reasonix": "DeepSeek Reasonix",
    "diegosouzapw/OmniRoute": "OmniRoute",
    "MoonshotAI/kimi-code": "Kimi Code",
    "herdrdev/herdr": "Herdr",
    "pingdotgg/t3code": "T3 Code",
    "supermemoryai/supermemory": "Supermemory",
    "huggingface/OpenEnv": "OpenEnv",
    "microsoft/markitdown": "MarkItDown",
    "github/spec-kit": "Spec Kit",
    "larksuite/cli": "Lark CLI",
    "firecrawl/firecrawl": "Firecrawl",
}

# Only independently verified province/state-level locations are added here.
# The evidence URLs are kept beside the mapping to make future review possible.
LOCATIONS = {
    ":companies/dify_ai": ("US-CA", "https://dify.ai/about-us"),
    ":companies/n8n": ("DE-BE", "https://n8n.io/imprint/"),
    ":companies/infiniflow": ("CN-SH", "https://www.linkedin.com/company/infiniflow"),
    ":companies/langfuse": ("DE-BE", "https://langfuse.com/press"),
    ":companies/coder": ("US-TX", "https://coder.com/blog/90m-series-c-led-by-kkr-to-advance-secure-enterprise-ai-development"),
    ":companies/activepieces": ("US-CA", "https://github.com/activepieces"),
    ":companies/daytona": ("US-NY", "https://github.com/daytonaio"),
    ":companies/all_hands_ai": ("US-MA", "https://www.linkedin.com/company/openhands-ai/"),
    ":companies/agno": ("US-NY", "https://www.linkedin.com/company/agnohq"),
    ":companies/berriai": ("US-CA", "https://www.linkedin.com/company/litellm"),
    ":companies/browser_use": ("US-CA", "https://www.ycombinator.com/companies/browser-use"),
    ":companies/cline": ("US-CA", "https://www.linkedin.com/company/clinebot"),
    ":companies/collate": ("US-CA", "https://www.getcollate.io/careers/software-engineer"),
    ":companies/copilotkit": ("US-WA", "https://www.linkedin.com/company/copilotkit"),
    ":companies/crewai": ("US-CA", "https://www.crunchbase.com/organization/crewai"),
    ":companies/cvat_ai": ("US-DE", "https://www.cvat.ai/privacy"),
    ":companies/daily": ("US-CA", "https://www.daily.co/company/"),
    ":companies/firecrawl": ("US-CA", "https://www.firecrawl.dev/careers"),
    ":companies/jetbrains": ("NL-NH", "https://www.jetbrains.com/company/contacts/"),
    ":companies/kilo": ("US-CA", "https://www.linkedin.com/company/kilo"),
    ":companies/mastra": ("US-CA", "https://mastra.ai/about"),
    ":companies/mem0": ("US-CA", "https://mem0.ai/about-us"),
    ":companies/ollama": ("US-CA", "https://www.cbinsights.com/company/ollama"),
    ":companies/openmind": ("US-CA", "https://www.linkedin.com/company/openmindagi"),
    ":companies/nousresearch": ("US-TX", "https://www.linkedin.com/company/nousresearch"),
    ":companies/pydantic": ("US-CA", "https://www.linkedin.com/company/pydantic"),
    ":companies/stacklok": ("US-WA", "https://stacklok.com/llm-info/"),
    ":companies/supermemory": ("US-CA", "https://supermemory.ai/"),
    ":companies/vectorize_io": ("US-DE", "https://vectorize.io/contact"),
    ":companies/warp": ("US-NY", "https://www.linkedin.com/company/warpdotdev"),
    ":companies/workday": ("US-CA", "https://www.workday.com/en-us/company/about-workday/contact-us.html"),
    ":universities/hku": ("CN-HK", "https://www.hku.hk/en/contact-us"),
}


def label_path(ref):
    stem = LABELS / ref[1:]
    return stem / "index.yml" if (stem / "index.yml").exists() else Path(str(stem) + ".yml")


def normalized(value):
    return re.sub(r"[^a-z0-9]", "", value.lower())


def load_label(path):
    return yaml.safe_load(path.read_text(encoding="utf-8")) or {}


def save_new_label(path, data):
    if path.exists():
        raise ValueError(f"Refusing to overwrite {path}")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(dump_label(data), encoding="utf-8")


def add_child(path, child):
    data = load_label(path)
    if child in (data.get("data") or {}).get("labels", []):
        return
    lines = path.read_text(encoding="utf-8").splitlines(keepends=True)
    labels_line = next((i for i, line in enumerate(lines) if line.rstrip() == "  labels:"), None)
    if labels_line is not None:
        end = labels_line + 1
        while end < len(lines) and (lines[end].startswith("    - ") or not lines[end].strip()):
            end += 1
        lines.insert(end, f"    - '{child}'\n" if child.startswith(":") else f"    - {child}\n")
    else:
        data_line = next((i for i, line in enumerate(lines) if line.rstrip() == "data:"), None)
        block = ["  labels:\n", f"    - '{child}'\n" if child.startswith(":") else f"    - {child}\n"]
        if data_line is None:
            if lines and not lines[-1].endswith("\n"):
                lines[-1] += "\n"
            lines.extend(["data:\n", *block])
        else:
            lines[data_line + 1:data_line + 1] = block
    path.write_text("".join(lines), encoding="utf-8")
    if child not in load_label(path)["data"]["labels"]:
        raise AssertionError(f"Failed to add {child} to {path}")


def add_repo(path, repo_id, repo_name):
    data = load_label(path)
    platforms = (data.get("data") or {}).get("platforms", []) or []
    github = next((p for p in platforms if p.get("name") == "GitHub"), None)
    if github and any(str(r.get("id")) == str(repo_id) for r in github.get("repos", []) or []):
        return
    if github is None:
        if platforms:
            raise ValueError(f"GitHub platform absent from multi-platform project {path}")
        # New labels are created with GitHub repos; this branch handles a legacy
        # project with no platform metadata at all.
        text = path.read_text(encoding="utf-8").rstrip("\n")
        path.write_text(text + "\ndata:\n  platforms:\n    - name: GitHub\n      type: Code Hosting\n      repos:\n        - id: " + str(repo_id) + "\n          name: " + repo_name + "\n", encoding="utf-8")
        return
    lines = path.read_text(encoding="utf-8").splitlines(keepends=True)
    start = next(i for i, line in enumerate(lines) if line.rstrip() == "    - name: GitHub")
    stop = next((i for i in range(start + 1, len(lines)) if lines[i].startswith("    - name: ")), len(lines))
    repos_line = next((i for i in range(start + 1, stop) if lines[i].rstrip() == "      repos:"), None)
    if repos_line is None:
        insertion = ["      repos:\n", f"        - id: {repo_id}\n", f"          name: {repo_name}\n"]
        lines[stop:stop] = insertion
    else:
        end = next((i for i in range(repos_line + 1, stop) if lines[i].startswith("      ") and not lines[i].startswith("        ")), stop)
        lines[end:end] = [f"        - id: {repo_id}\n", f"          name: {repo_name}\n"]
    path.write_text("".join(lines), encoding="utf-8")
    assert any(str(r.get("id")) == str(repo_id) for p in load_label(path)["data"]["platforms"] if p.get("name") == "GitHub" for r in p.get("repos", []) or [])


def set_org_scope(path, org_name):
    data = load_label(path)
    platforms = (data.get("data") or {}).get("platforms", []) or []
    github = next((p for p in platforms if p.get("name") == "GitHub"), None)
    if github is None:
        if platforms:
            raise ValueError(f"GitHub platform absent from multi-platform project {path}")
        github = {"name": "GitHub", "type": "Code Hosting"}
        data.setdefault("data", {})["platforms"] = [github]
    orgs = github.setdefault("orgs", [])
    if not any(o.get("name", "").lower() == org_name.lower() for o in orgs):
        orgs.append({"name": org_name})
    github.pop("repos", None)
    path.write_text(dump_label(data), encoding="utf-8")


def ensure_parent(ref):
    parent_ref = ref.rsplit("/", 1)[0]
    # The legacy projects namespace intentionally has no index label. Projects
    # stay here when an initiating organization cannot be confirmed.
    if parent_ref == ":projects":
        return
    path = label_path(parent_ref)
    if not path.exists():
        path = LABELS / parent_ref[1:] / "index.yml"
        slug = parent_ref.split("/")[-1]
        kind = "Company" if parent_ref.startswith(":companies/") else "Community"
        if not parent_ref.startswith((":companies/", ":communities/")):
            raise ValueError(f"Missing existing institutional parent {parent_ref}")
        save_new_label(path, {"name": PARENT_NAMES.get(slug, slug.replace("_", " ").title()), "type": kind, "data": {"labels": [ref.split("/")[-1]]}})
    else:
        add_child(path, ref.split("/")[-1])


def make_project(ref, row):
    path = label_path(ref)
    org_scope = ORG_SCOPED_PROJECTS.get(row["repo_name"])
    if not path.exists():
        name = PROJECT_NAMES.get(row["repo_name"], row["repo_name"].split("/", 1)[1])
        entities = {"orgs": [{"name": org_scope[1]}]} if org_scope else {"repos": [{"id": int(row["repo_id"]), "name": row["repo_name"]}]}
        save_new_label(path, {"name": name, "type": "Project", "data": {"platforms": [{"name": "GitHub", "type": "Code Hosting", **entities}]}})
    else:
        if load_label(path).get("type") != "Project":
            raise ValueError(f"Expected Project label at {path}")
        if org_scope:
            set_org_scope(path, org_scope[1])
        else:
            add_repo(path, int(row["repo_id"]), row["repo_name"])
        if row["repo_name"] in PROJECT_NAMES:
            lines = path.read_text(encoding="utf-8").splitlines(keepends=True)
            lines[0] = "name: " + PROJECT_NAMES[row["repo_name"]] + "\n"
            path.write_text("".join(lines), encoding="utf-8")
    ensure_parent(ref)


def slug(section):
    text = section.lower().replace("&", "and")
    return re.sub(r"_+", "_", re.sub(r"[^a-z0-9]+", "_", text)).strip("_")


def main(csv_path):
    with open(csv_path, newline="", encoding="utf-8-sig") as handle:
        rows = [r for r in csv.DictReader(handle) if r["landscape_action"] in {"keep", "add"}]
    if not rows or any(not r["landscape_layer"] or not r["landscape_section"] for r in rows):
        raise ValueError("Selected landscape rows need both layer and section")
    ids = [r["repo_id"] for r in rows]
    if len(ids) != len(set(ids)):
        raise ValueError("Duplicate selected repo_id")

    old_refs = [
        ref if ref.startswith(":") else ":technology/agentic_ai/" + ref
        for ref in load_label(LABELS / "technology/agentic_ai/index.yml")["data"]["labels"]
    ]
    candidates = defaultdict(set)
    by_id = defaultdict(set)
    for ref in old_refs:
        path = label_path(ref)
        if not path.exists():
            raise ValueError(f"Missing prior label {ref}")
        data = load_label(path)
        if data.get("type") != "Project":
            continue
        candidates[normalized(data.get("name", ""))].add(ref)
        candidates[normalized(ref.split("/")[-1])].add(ref)
    # Repo IDs are authoritative, including on repeat imports after the flat
    # Agentic AI label has been replaced by the two-layer taxonomy.
    for path in LABELS.rglob("*.yml"):
        data = load_label(path)
        if data.get("type") != "Project":
            continue
        relative = path.relative_to(LABELS).as_posix()
        ref = ":" + (relative[:-10] if relative.endswith("/index.yml") else relative[:-4])
        for platform in (data.get("data") or {}).get("platforms", []) or []:
            if platform.get("name") == "GitHub":
                for repo in platform.get("repos", []) or []:
                    by_id[str(repo["id"])].add(ref)

    selected = {}
    for row in rows:
        repo = row["repo_name"]
        matches = by_id[row["repo_id"]] or candidates[normalized(repo.split("/", 1)[1])]
        if repo in ORG_SCOPED_PROJECTS:
            ref = ORG_SCOPED_PROJECTS[repo][0]
        elif repo in MANUAL_REFS:
            ref = MANUAL_REFS[repo]
        elif len(matches) == 1:
            ref = next(iter(matches))
        else:
            raise ValueError(f"Ambiguous/unmatched project {repo}: {sorted(matches)}")
        selected[repo] = ROOT_MOVES.get(ref, ref)
    if len(selected.values()) != len(set(selected.values())):
        raise ValueError("Multiple selected repositories map to one project label")

    # Move only selected legacy projects. Update references in all other label
    # trees so their existing membership is preserved.
    moves = {old: new for old, new in ROOT_MOVES.items() if any(old == ref for row in rows for ref in (by_id[row["repo_id"]] or candidates[normalized(row["repo_name"].split("/", 1)[1])]))}
    for old, new in moves.items():
        source, destination = label_path(old), label_path(new)
        if destination.exists():
            raise ValueError(f"Move target exists: {destination}")
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_text(source.read_text(encoding="utf-8"), encoding="utf-8")
        source.unlink()
    for path in LABELS.rglob("*.yml"):
        text = path.read_text(encoding="utf-8")
        updated = text
        for old, new in moves.items():
            updated = updated.replace(f"'{old}'", f"'{new}'")
            updated = updated.replace(f'"{old}"', f'"{new}"')
        if updated != text:
            path.write_text(updated, encoding="utf-8")

    for row in rows:
        make_project(selected[row["repo_name"]], row)

    groups = defaultdict(list)
    for row in rows:
        groups[(row["landscape_layer"], row["landscape_section"])].append(selected[row["repo_name"]])
    expected_layers = {"Agent Infra", "Model Infra"}
    if {layer for layer, _ in groups} != expected_layers:
        raise ValueError("Unexpected landscape layers")
    taxonomy_dir = LABELS / "technology/agentic_ai"
    top = {
        "name": "Agentic AI", "name_zh": "Agentic AI", "type": "Tech-0",
        "meta": {"source": SOURCE_URL, "selection": "keep/add"},
        "data": {"labels": ["agent_infra", "model_infra"]},
    }
    (taxonomy_dir / "index.yml").write_text(dump_label(top), encoding="utf-8")
    for layer in sorted(expected_layers):
        layer_dir = taxonomy_dir / slug(layer)
        layer_dir.mkdir(parents=True, exist_ok=True)
        sections = sorted(section for l, section in groups if l == layer)
        layer_data = {"name": layer, "type": "Tech-1", "data": {"labels": [slug(section) for section in sections]}}
        (layer_dir / "index.yml").write_text(dump_label(layer_data), encoding="utf-8")
        for section in sections:
            section_data = {"name": section, "type": "Tech-2", "data": {"labels": groups[(layer, section)]}}
            (layer_dir / f"{slug(section)}.yml").write_text(dump_label(section_data), encoding="utf-8")

    for parent, (region, _) in LOCATIONS.items():
        if not label_path(parent).exists():
            raise ValueError(f"Location parent missing: {parent}")
        division = LABELS / f"divisions/{region[:2]}/{region}.yml"
        if not division.exists() or load_label(division).get("type") != "Division-1":
            raise ValueError(f"Missing Division-1 label {region}")
        add_child(division, parent)

    # Check only the source-selected projects appear at leaves, and never as
    # direct memberships of Agentic AI or its layer labels.
    actual = [ref for refs in groups.values() for ref in refs]
    assert len(actual) == len(rows) == len(set(actual))
    for ref in actual:
        assert label_path(ref).exists(), ref
    print(f"Imported {len(rows)} projects into {len(groups)} sections across 2 layers; moved {len(moves)} prior root project labels.")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("Usage: importAgenticAiLandscape.py agentic-ai-projects.csv")
    main(sys.argv[1])
