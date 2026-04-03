import sys
import os
import json
import traceback
from pathlib import Path
import uvicorn
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Automatically load the .env if present
load_dotenv()

# We point to the local multi-agent-research-system-2 folder to import its actual crew logic
BASE_DIR = Path(__file__).resolve().parent.parent.parent
RESEARCH_DIR = BASE_DIR / "multi-agent-research-system-2"
if str(RESEARCH_DIR) not in sys.path:
    sys.path.append(str(RESEARCH_DIR))

# Directory where generated agent scripts + registry live
AGENTS_DIR = Path(__file__).resolve().parent / "generated_agents"
AGENTS_DIR.mkdir(exist_ok=True)
REGISTRY_FILE = AGENTS_DIR / "registry.json"


def _load_registry() -> list:
    if REGISTRY_FILE.exists():
        return json.loads(REGISTRY_FILE.read_text(encoding="utf-8"))
    return []


def _save_registry(data: list):
    REGISTRY_FILE.write_text(json.dumps(data, indent=2), encoding="utf-8")


app = FastAPI(title="AI Factory — AutoGen & CrewAI Agent Platform")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


class ResearchRequest(BaseModel):
    business_context: str


class AgentCreateRequest(BaseModel):
    name: str
    prompt: str


# ---------------------------------------------------------------------------
# Helpers: detect LLM provider from keys
# ---------------------------------------------------------------------------
def _detect_llm():
    """Returns (api_key, gemini_key, base_url, model_name, api_type, provider_label)"""
    api_key = os.getenv("OPENAI_API_KEY", "")
    gemini_key = os.getenv("GEMINI_API_KEY", "")

    if api_key.startswith("AIza"):
        gemini_key = api_key
        api_key = ""

    if gemini_key:
        return "", gemini_key, None, "gemini-2.5-flash", "google", "Google Gemini"
    elif api_key.startswith("nvapi-"):
        return api_key, "", "https://integrate.api.nvidia.com/v1", "meta/llama-3.1-70b-instruct", None, "NVIDIA NIM"
    elif api_key:
        return api_key, "", None, "gpt-4o", None, "OpenAI"
    else:
        return "", "", None, "", None, "None"


# ---------------------------------------------------------------------------
# 1) Research endpoint (CrewAI)
# ---------------------------------------------------------------------------
@app.post("/api/research")
def run_market_research(req: ResearchRequest):
    try:
        from research_crew.main import run_research_pipeline
    except ImportError as e:
        raise HTTPException(status_code=500, detail=f"Failed to import CrewAI module. Is path correct? {e}")

    api_key, gemini_key, base_url, model_name, api_type, provider = _detect_llm()

    if (not api_key and not gemini_key) or not os.getenv("EXA_API_KEY"):
        return {
            "status": "simulated",
            "report": f"# Market Research \n\n*Note: Add a valid LLM API KEY and EXA_API_KEY to .env to enable real AI generation.*\n\nYou requested research on: **{req.business_context}**\n\nThe CrewAI Planner, Search, and Synthesizer agents would normally execute here via the multi-agent-research-system-2 module."
        }

    # Dynamically inject environment for CrewAI LiteLLM backend
    if base_url:
        os.environ["OPENAI_BASE_URL"] = base_url
    if gemini_key:
        os.environ["GEMINI_API_KEY"] = gemini_key
        if not os.getenv("LLM_MODEL"):
            os.environ["LLM_MODEL"] = "gemini/gemini-2.5-flash"
    if base_url and not os.getenv("LLM_MODEL"):
        os.environ["LLM_MODEL"] = f"openai/{model_name}"

    try:
        print(f"Triggering CrewAI research for: {req.business_context}")
        report = run_research_pipeline(req.business_context)

        with open("generated_market_research.md", "w", encoding="utf-8") as f:
            f.write(report)

        return {"status": "success", "report": report}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# 2) Agent generation endpoint (AutoGen)
# ---------------------------------------------------------------------------
@app.post("/api/agents/generate")
def generate_agent(req: AgentCreateRequest):
    try:
        import autogen
    except ImportError:
        raise HTTPException(status_code=500, detail="pyautogen library is not installed.")

    api_key, gemini_key, base_url, model_name, api_type, provider = _detect_llm()

    if not api_key and not gemini_key:
        return {
            "status": "simulated",
            "agent_id": "auto-gen-simulated-123",
            "message": f"Successfully simulated creation of agent '{req.name}'. (No valid API Key found to run true AutoGen inference)."
        }

    # Build the config dictionary for this agent
    config_dict = {"model": model_name}
    if gemini_key:
        config_dict["api_key"] = gemini_key
        config_dict["api_type"] = api_type
    else:
        config_dict["api_key"] = api_key
    if base_url:
        config_dict["base_url"] = base_url

    llm_config = {"config_list": [config_dict]}
    safe_name = req.name.replace(" ", "_").replace("-", "_")

    try:
        # Validate: instantiate the agent to make sure config is correct
        custom_agent = autogen.AssistantAgent(
            name=safe_name,
            system_message=f"You are a helpful customer support agent for this business. {req.prompt}",
            llm_config=llm_config,
        )

        # Generate the standalone deployable Python script
        script_content = f'''#!/usr/bin/env python3
"""
AutoGen Agent: {req.name}
Generated by AI Factory
Provider: {provider} | Model: {model_name}

Usage:
  1. pip install pyautogen google-generativeai google-cloud-aiplatform
  2. Set your API key as an environment variable
  3. Run: python {safe_name.lower()}_agent.py
"""
import os
import autogen

# ── LLM Configuration ─────────────────────────────────────────────────
# Replace with your own API key or set via environment variable
API_KEY = os.getenv("AGENT_API_KEY", "{gemini_key or api_key}")

llm_config = {{
    "config_list": [{{
        "model": "{model_name}",
        "api_key": API_KEY,
{f'        "api_type": "{api_type}",' if api_type else ""}
{f'        "base_url": "{base_url}",' if base_url else ""}
    }}],
    "cache_seed": None,  # Disable caching for fresh responses
}}

# ── Agent Definition ───────────────────────────────────────────────────
assistant = autogen.AssistantAgent(
    name="{safe_name}",
    system_message="""{req.prompt.replace('"', "'").replace(chr(10), " ")}""",
    llm_config=llm_config,
)

user_proxy = autogen.UserProxyAgent(
    name="customer",
    human_input_mode="ALWAYS",
    max_consecutive_auto_reply=10,
    code_execution_config=False,
)

# ── Run ────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print(f"\\n{'='*60}")
    print(f"  AI Factory Agent: {req.name}")
    print(f"  Model: {model_name} via {provider}")
    print(f"{'='*60}\\n")
    print("Type your messages below. Type 'exit' to quit.\\n")
    user_proxy.initiate_chat(assistant, message="Hello! How can I help you today?")
'''

        # Persist the script
        agent_filename = f"{safe_name.lower()}_agent.py"
        agent_filepath = AGENTS_DIR / agent_filename
        agent_filepath.write_text(script_content, encoding="utf-8")

        # Persist to registry
        agent_id = f"autogen-{safe_name.lower()}"
        registry = _load_registry()

        # Remove existing entry if re-generating same agent
        registry = [a for a in registry if a["agent_id"] != agent_id]
        registry.append({
            "agent_id": agent_id,
            "name": req.name,
            "prompt": req.prompt,
            "model": model_name,
            "provider": provider,
            "filename": agent_filename,
        })
        _save_registry(registry)

        return {
            "status": "success",
            "agent_id": agent_id,
            "message": f"AutoGen agent '{req.name}' compiled and saved!",
            "provider": provider,
            "model": model_name,
            "script_preview": script_content,
            "workflow": {
                "nodes": [
                    {"id": "1", "data": {"label": "Customer Chat", "icon": "user", "sublabel": "UserProxyAgent"}, "type": "customNode", "position": {"x": 100, "y": 200}},
                    {"id": "2", "data": {"label": req.name, "icon": "bot", "sublabel": "AssistantAgent"}, "type": "customNode", "position": {"x": 450, "y": 200}},
                    {"id": "3", "data": {"label": f"{model_name}", "icon": "cpu", "sublabel": f"{provider}"}, "type": "customNode", "position": {"x": 450, "y": 50}}
                ],
                "edges": [
                    {"id": "e1-2", "source": "1", "target": "2", "animated": True},
                    {"id": "e3-2", "source": "3", "target": "2", "animated": True, "style": {"strokeDasharray": "5,5"}}
                ]
            }
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# 3) List all generated agents
# ---------------------------------------------------------------------------
@app.get("/api/agents")
def list_agents():
    return {"agents": _load_registry()}


# ---------------------------------------------------------------------------
# 4) Download a generated agent script
# ---------------------------------------------------------------------------
@app.get("/api/agents/{agent_id}/download")
def download_agent(agent_id: str):
    registry = _load_registry()
    entry = next((a for a in registry if a["agent_id"] == agent_id), None)
    if not entry:
        raise HTTPException(status_code=404, detail="Agent not found")
    filepath = AGENTS_DIR / entry["filename"]
    if not filepath.exists():
        raise HTTPException(status_code=404, detail="Agent script file not found")
    return FileResponse(
        path=str(filepath),
        filename=entry["filename"],
        media_type="text/x-python",
    )


# ---------------------------------------------------------------------------
# 5) Get agent script content (for preview)
# ---------------------------------------------------------------------------
@app.get("/api/agents/{agent_id}/script")
def get_agent_script(agent_id: str):
    registry = _load_registry()
    entry = next((a for a in registry if a["agent_id"] == agent_id), None)
    if not entry:
        raise HTTPException(status_code=404, detail="Agent not found")
    filepath = AGENTS_DIR / entry["filename"]
    if not filepath.exists():
        raise HTTPException(status_code=404, detail="Agent script file not found")
    return {
        "agent_id": agent_id,
        "name": entry["name"],
        "filename": entry["filename"],
        "script": filepath.read_text(encoding="utf-8"),
    }


# ---------------------------------------------------------------------------
# 6) Chat with a generated agent (live test sandbox)
# ---------------------------------------------------------------------------
@app.post("/api/agents/{agent_id}/chat")
async def chat_with_agent(agent_id: str, request: Request):
    try:
        import autogen
    except ImportError:
        raise HTTPException(status_code=500, detail="pyautogen library is not installed.")

    data = await request.json()
    user_message = data.get("message", "Hello")

    try:
        api_key, gemini_key, base_url, model_name, api_type, provider = _detect_llm()

        config_dict = {"model": model_name}
        if gemini_key:
            config_dict["api_key"] = gemini_key
            config_dict["api_type"] = api_type
        else:
            config_dict["api_key"] = api_key
        if base_url:
            config_dict["base_url"] = base_url

        # Look up original system prompt from registry
        registry = _load_registry()
        entry = next((a for a in registry if a["agent_id"] == agent_id), None)
        system_msg = entry["prompt"] if entry else "You are a helpful customer support agent. Respond concisely."

        custom_agent = autogen.AssistantAgent(
            name=agent_id.replace("-", "_"),
            system_message=system_msg,
            llm_config={"config_list": [config_dict], "cache_seed": None},
        )

        reply = custom_agent.generate_reply(
            messages=[{"content": user_message, "role": "user"}],
            sender=autogen.UserProxyAgent(name="user", code_execution_config=False, human_input_mode="NEVER"),
        )

        if reply is None:
            return {"status": "success", "reply": "Agent returned no reply. This may be due to API rate limits — wait 60s and try again."}

        reply_str = reply if isinstance(reply, str) else reply.get("content", str(reply))
        return {"status": "success", "reply": reply_str, "provider": provider, "model": model_name}

    except Exception as e:
        traceback.print_exc()
        error_msg = str(e)
        if "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg:
            return {"status": "rate_limited", "reply": "⏳ Gemini free-tier rate limit hit (5 req/min). Wait 60 seconds and try again."}
        raise HTTPException(status_code=500, detail=error_msg)


# ---------------------------------------------------------------------------
# 7) Health / info endpoint
# ---------------------------------------------------------------------------
@app.get("/api/health")
def health():
    _, _, _, model_name, _, provider = _detect_llm()
    return {
        "status": "ok",
        "provider": provider,
        "model": model_name,
        "agents_count": len(_load_registry()),
    }


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
