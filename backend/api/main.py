import re
import uuid
from fastapi import FastAPI, HTTPException, Body, Path, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any, Optional

# Import schemas and graph
from schemas.models import GenerateRequest, ApproveRequest, GenerateResponse, JobState
from orchestration.graph import compiled_graph

# Import Celery result
from celery.result import AsyncResult
from workers.celery_app import celery_app

# Import alt-profanity-check
try:
    from profanity_check import predict
except ImportError:
    predict = None

app = FastAPI(
    title="NeuroCut AI API Gateway",
    description="Enterprise-grade Multi-Agent Video Production API Gateway with LangGraph & Redis checkpointers."
)

# Enable CORS for Next.js app communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def check_script_profanity(text: str) -> bool:
    """
    Checks script content against alt-profanity-check model, with custom keyword safety fallback.
    """
    if predict is not None:
        try:
            return bool(predict([text])[0])
        except Exception as e:
            print(f"[Profanity Check Exception] {e}. Using fallback.")
            
    # Simple regex fallback
    bad_words = {"fuck", "shit", "bitch", "asshole", "crap", "bastard", "kill", "suicide"}
    words = re.findall(r'\b\w+\b', text.lower())
    return any(w in bad_words for w in words)

def scan_azure_safety_simulation(text: str) -> dict:
    """
    Simulated Azure content safety check matching the frontend metadata expected payload.
    """
    lowercase_text = text.lower()
    violence = 8 if "kill" in lowercase_text or "murder" in lowercase_text else 0
    hate = 6 if "hate" in lowercase_text else 0
    sexual = 8 if "naked" in lowercase_text else 0
    self_harm = 9 if "suicide" in lowercase_text else 0
    
    max_severity = max(violence, hate, sexual, self_harm)
    is_safe = max_severity < 7
    
    return {
        "is_safe": is_safe,
        "categories": {
            "violence": violence,
            "hate": hate,
            "sexual": sexual,
            "self_harm": self_harm
        },
        "azure_safety_index": round(max_severity / 10.0, 2)
    }

def get_job_state_dict(job_id: str) -> dict:
    """
    Loads compiled graph state for job_id and checks async Celery tasks status.
    """
    config = {"configurable": {"thread_id": job_id}}
    state_info = compiled_graph.get_state(config)
    
    if not state_info or not state_info.values:
        raise HTTPException(status_code=404, detail=f"Job sequence {job_id} not found in checkpointer database.")
        
    values = dict(state_info.values)
    
    # Check Celery task results if rendering is in progress
    video_url = values.get("video_url", "")
    pipeline_state = values.get("pipeline_state", "idle")
    
    if video_url.startswith("PENDING:"):
        celery_task_id = video_url.split(":")[1]
        task_res = AsyncResult(celery_task_id, app=celery_app)
        
        if task_res.state == "SUCCESS":
            res_val = task_res.result
            values["video_url"] = res_val.get("video_url", "")
            values["pipeline_state"] = "completed"
            
            # Sync back updated state to checkpointer
            compiled_graph.update_state(config, {
                "video_url": values["video_url"],
                "pipeline_state": "completed"
            })
        elif task_res.state == "FAILURE":
            values["video_url"] = "RENDER_FAILED"
            values["pipeline_state"] = "failed"
            compiled_graph.update_state(config, {
                "video_url": "RENDER_FAILED",
                "pipeline_state": "failed"
            })
        else:
            # Task still active in Celery queue
            values["pipeline_state"] = "synthesizing"
            
    return values

# ----------------- v1 REST ENDPOINTS -----------------

@app.post("/api/v1/generate", response_model=GenerateResponse)
def generate_pipeline(request: GenerateRequest):
    """
    Ingests raw script, filters profanity, and spins up a LangGraph execution sequence.
    """
    if check_script_profanity(request.script):
        raise HTTPException(
            status_code=400, 
            detail="Ingested content flagged by safety compliance firewall (Profanity detected)."
        )
        
    job_id = str(uuid.uuid4())
    config = {"configurable": {"thread_id": job_id}}
    
    # Run Azure content safety mock report
    safety_report = scan_azure_safety_simulation(request.script)
    
    initial_state = {
        "job_id": job_id,
        "script": request.script,
        "art_style": request.art_style,
        "structured_storyboard": [],
        "assets": [],
        "audio_paths": [],
        "video_url": "",
        "current_node": "ingestion",
        "pipeline_state": "idle",
        "safety_report": safety_report,
        "bgm_volume": 30
    }
    
    # Begin stream: triggers hook enhancer and halts before director due to interrupt_before
    compiled_graph.stream(initial_state, config, stream_mode="values")
    
    # Retrieve active state values
    current_values = get_job_state_dict(job_id)
    
    return GenerateResponse(
        job_id=job_id,
        status="success",
        current_node=current_values.get("current_node", "hook_enhancer"),
        state=JobState(**current_values)
    )

@app.get("/api/v1/status/{job_id}", response_model=JobState)
def status_pipeline(job_id: str = Path(..., description="UUID job identifier string")):
    """
    Returns checked state fields for dynamic client-side wizard polling.
    """
    state_vals = get_job_state_dict(job_id)
    return JobState(**state_vals)

@app.post("/api/v1/approve/{job_id}", response_model=JobState)
def approve_pipeline(
    job_id: str = Path(..., description="UUID job identifier string"),
    request: ApproveRequest = Body(...)
):
    """
    HITL approval gate: updates state values and resumes LangGraph from interrupts.
    """
    config = {"configurable": {"thread_id": job_id}}
    state_vals = get_job_state_dict(job_id)
    
    # Update state with incoming payload overrides
    update_payload = {}
    
    if request.gate == "gate1_script":
        # Formulate enhanced script values
        script_data = request.payload.get("script_data", {})
        if script_data:
            full_script = script_data.get("hook", "") + " " + script_data.get("body", "")
            update_payload["script"] = full_script
            
    elif request.gate == "gate2_storyboard":
        storyboard_data = request.payload.get("storyboard_data", [])
        if storyboard_data:
            update_payload["structured_storyboard"] = storyboard_data
            
    elif request.gate == "gate3_assets":
        # Final cut triggers rendering
        volume = request.payload.get("audioVolume", 30)
        update_payload["bgm_volume"] = volume
        
    # Update State Checkpoint
    compiled_graph.update_state(config, update_payload)
    
    # Resume pipeline execution
    compiled_graph.stream(None, config, stream_mode="values")
    
    # Return updated values
    updated_vals = get_job_state_dict(job_id)
    return JobState(**updated_vals)


# ----------------- BACKWARDS COMPATIBLE LEGACY ROUTES -----------------

@app.post("/api/workflow/start")
def legacy_start(
    script: str = Body(..., embed=True),
    art_style: str = Body("pixar", embed=True)
):
    """
    Legacy backwards compatibility mapping start workflow to v1 generate logic.
    """
    # Emulates default session_id
    job_id = "default_neurocut_session"
    config = {"configurable": {"thread_id": job_id}}
    
    safety_report = scan_azure_safety_simulation(script)
    if not safety_report["is_safe"]:
        return {
            "status": "safety_failed",
            "message": "Script failed Azure Content Safety compliance radar.",
            "safety_report": safety_report
        }
        
    initial_state = {
        "job_id": job_id,
        "script": script,
        "art_style": art_style,
        "structured_storyboard": [],
        "assets": [],
        "audio_paths": [],
        "video_url": "",
        "current_node": "ingestion",
        "pipeline_state": "idle",
        "safety_report": safety_report,
        "bgm_volume": 30
    }
    
    compiled_graph.stream(initial_state, config, stream_mode="values")
    state_vals = get_job_state_dict(job_id)
    
    # Format script data output expected by legacy UI hook / body mapping
    sentences = state_vals.get("script", "").split(". ")
    hook = sentences[0] if len(sentences) > 0 else state_vals.get("script")
    body = ". ".join(sentences[1:]) if len(sentences) > 1 else ""
    
    return {
        "status": "success",
        "current_node": "Node 1: Script Enhancer",
        "pipeline_state": "gate1_script",
        "script_data": {"hook": hook, "body": body},
        "safety_report": safety_report
    }

@app.get("/api/workflow/status")
def legacy_status(session_id: str = Query("default_neurocut_session")):
    """
    Legacy status route mapped directly to status_pipeline checkpointer values.
    """
    try:
        vals = get_job_state_dict(session_id)
    except HTTPException:
        # Return fallback empty structure
        return {
            "current_node": "idle",
            "pipeline_state": "idle",
            "safety_report": {},
            "script_data": {"hook": "", "body": ""},
            "storyboard_data": [],
            "assets_data": []
        }
        
    sentences = vals.get("script", "").split(". ")
    hook = sentences[0] if len(sentences) > 0 else vals.get("script")
    body = ". ".join(sentences[1:]) if len(sentences) > 1 else ""
    
    # Map back structure names from v1 state variables to legacy names
    # storyboard_data -> structured_storyboard
    # assets_data -> assets
    return {
        "current_node": vals.get("current_node"),
        "pipeline_state": vals.get("pipeline_state"),
        "safety_report": vals.get("safety_report"),
        "script_data": {"hook": hook, "body": body},
        "storyboard_data": vals.get("structured_storyboard", []),
        "assets_data": vals.get("assets", [])
    }

@app.post("/api/workflow/approve")
def legacy_approve(
    gate: str = Query(...),
    session_id: str = Query("default_neurocut_session"),
    payload: Dict[str, Any] = Body(...)
):
    """
    Legacy approve route mapping parameters and redirects to approve_pipeline.
    """
    config = {"configurable": {"thread_id": session_id}}
    update_payload = {}
    
    if gate == "gate1_script":
        script_data = payload.get("script_data", {})
        if script_data:
            full = script_data.get("hook", "") + " " + script_data.get("body", "")
            update_payload["script"] = full
    elif gate == "gate2_storyboard":
        storyboard_data = payload.get("storyboard_data", [])
        if storyboard_data:
            update_payload["structured_storyboard"] = storyboard_data
    elif gate == "gate3_assets":
        update_payload["bgm_volume"] = payload.get("audioVolume", 30)
    elif gate == "gate2_regenerate_frame":
        frame_id = payload.get("frame_id")
        # Regenerate frame logic
        state_vals = get_job_state_dict(session_id)
        assets = state_vals.get("assets", [])
        for asset in assets:
            if asset.get("id") == frame_id:
                asset["prompt"] = f"Regenerated Frame {frame_id} with cinematic flare override [Style: {state_vals.get('art_style')}]"
        update_payload["assets"] = assets
        
    compiled_graph.update_state(config, update_payload)
    
    # Resume execution unless it's a frame regeneration request
    if gate != "gate2_regenerate_frame":
        compiled_graph.stream(None, config, stream_mode="values")
        
    return legacy_status(session_id)
