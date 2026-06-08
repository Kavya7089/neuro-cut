import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, Optional
import traceback

# Load environment variables
load_dotenv()

# Import the LangGraph workflow
from graph import app as workflow_app

app = FastAPI(title="NeuroCut API Gateway")

# Configure CORS for local Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AuthCredentialRequest(BaseModel):
    email: str
    password: str

class WorkflowStartRequest(BaseModel):
    raw_script: str
    art_style: str = "cinematic"
    thread_id: str = "default_thread_1"

class WorkflowApproveRequest(BaseModel):
    thread_id: str
    state_updates: Optional[Dict[str, Any]] = None

class EnhanceScriptRequest(BaseModel):
    raw_script: str

# --- Authentication Endpoints ---


@app.post("/api/v1/auth/signup")
async def auth_signup(req: AuthCredentialRequest):
    from database import SupabaseDB
    try:
        res = SupabaseDB.signup(req.email, req.password)
        return {"status": "success", "data": res}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/v1/auth/signin")
async def auth_signin(req: AuthCredentialRequest):
    from database import SupabaseDB
    try:
        res = SupabaseDB.signin(req.email, req.password)
        return {"status": "success", "data": res}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/v1/jobs")
async def get_jobs_history(authorization: Optional[str] = Header(None)):
    from database import SupabaseDB
    user_id = SupabaseDB.get_user_id_from_token(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized session.")
    jobs = SupabaseDB.get_user_jobs(user_id)
    return {"status": "success", "jobs": jobs}

# --- Core Video Pipeline Endpoints ---

@app.post("/api/v1/enhance-script")
async def enhance_script(req: EnhanceScriptRequest):
    """
    Enhances a raw script into structured hook and body segments.
    """
    try:
        from services import LLMService
        llm = LLMService()
        script_data = llm.enhance_script(req.raw_script)
        return {"status": "success", "script_data": script_data}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/generate")
async def start_workflow(req: WorkflowStartRequest, authorization: Optional[str] = Header(None)):
    """
    Initializes the multi-agent graph with the raw script.
    It will run until the first HITL breakpoint (director node).
    """
    config = {"configurable": {"thread_id": req.thread_id}}
    
    initial_state = {
        "raw_script": req.raw_script,
        "art_style": req.art_style,
        "status": "initializing"
    }
    
    # Run the graph
    try:
        from database import SupabaseDB
        user_id = SupabaseDB.get_user_id_from_token(authorization)
        SupabaseDB.create_job(req.thread_id, req.raw_script, req.art_style, user_id=user_id)
        
        final_state = workflow_app.invoke(initial_state, config=config)
        
        # Sync initial invokation state to database
        updates = {}
        if final_state.get("status"):
            updates["status"] = final_state["status"]
        if final_state.get("storyboard"):
            updates["structured_storyboard"] = final_state["storyboard"]
        if final_state.get("asset_images"):
            updates["assets"] = final_state["asset_images"]
        if user_id:
            updates["user_id"] = user_id
            
        SupabaseDB.update_job(req.thread_id, updates, user_id=user_id)
        
        return {"status": "success", "state": final_state}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/approve")
async def approve_workflow(req: WorkflowApproveRequest, authorization: Optional[str] = Header(None)):
    """
    HITL approval endpoint. Injects edits (if any) and resumes the graph.
    """
    config = {"configurable": {"thread_id": req.thread_id}}
    
    # Check if a state exists for this thread
    current_state = workflow_app.get_state(config)
    if not current_state or not current_state.next:
        raise HTTPException(status_code=400, detail="No pending checkpoint found for this thread.")
        
    try:
        # If the user made edits in the UI, we inject them into the state before resuming
        if req.state_updates:
            workflow_app.update_state(config, req.state_updates)
            
        # Resume the graph execution (invoke with None state)
        final_state = workflow_app.invoke(None, config=config)
        
        # Sync the updated state back to Supabase
        from database import SupabaseDB
        user_id = SupabaseDB.get_user_id_from_token(authorization)
        updates = {}
        if final_state.get("raw_script"):
            updates["script"] = final_state["raw_script"]
        elif final_state.get("script_data"):
            script_data = final_state["script_data"]
            updates["script"] = script_data.get("hook", "") + " " + script_data.get("body", "")
        if final_state.get("art_style"):
            updates["art_style"] = final_state["art_style"]
        if final_state.get("status"):
            updates["status"] = final_state["status"]
        if final_state.get("storyboard"):
            updates["structured_storyboard"] = final_state["storyboard"]
        if final_state.get("asset_images"):
            updates["assets"] = final_state["asset_images"]
        if final_state.get("video_url"):
            updates["video_url"] = final_state["video_url"]
            
        SupabaseDB.update_job(req.thread_id, updates, user_id=user_id)
        
        return {"status": "success", "state": final_state}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/status/{thread_id}")
async def get_status(thread_id: str, authorization: Optional[str] = Header(None)):
    """
    Polls the current state of the workflow graph.
    First checks the memory Checkpointer, then falls back to Supabase DB.
    """
    config = {"configurable": {"thread_id": thread_id}}
    current_state = workflow_app.get_state(config)
    
    from database import SupabaseDB
    user_id = SupabaseDB.get_user_id_from_token(authorization)
    
    if current_state and current_state.values:
        # Sync updated state to Supabase
        final_state = current_state.values
        updates = {}
        if final_state.get("raw_script"):
            updates["script"] = final_state["raw_script"]
        elif final_state.get("script_data"):
            script_data = final_state["script_data"]
            updates["script"] = script_data.get("hook", "") + " " + script_data.get("body", "")
        if final_state.get("art_style"):
            updates["art_style"] = final_state["art_style"]
        if final_state.get("status"):
            updates["status"] = final_state["status"]
        if final_state.get("storyboard"):
            updates["structured_storyboard"] = final_state["storyboard"]
        if final_state.get("asset_images"):
            updates["assets"] = final_state["asset_images"]
        if final_state.get("video_url"):
            updates["video_url"] = final_state["video_url"]
            
        SupabaseDB.update_job(thread_id, updates, user_id=user_id)
        
        return {
            "state": current_state.values,
            "next_nodes": current_state.next
        }
        
    # Fallback to Supabase Database
    job = SupabaseDB.get_job(thread_id, user_id=user_id)
    if job:
        # Reconstruct PipelineState structure
        script_sentences = job.get("script", "").split(". ")
        hook = script_sentences[0] if len(script_sentences) > 0 else job.get("script", "")
        body = ". ".join(script_sentences[1:]) if len(script_sentences) > 1 else ""
        
        simulated_values = {
            "raw_script": job.get("script", ""),
            "art_style": job.get("art_style", "pixar"),
            "is_safe": True,
            "script_data": {"hook": hook, "body": body},
            "storyboard": job.get("structured_storyboard", []),
            "asset_images": job.get("assets", []),
            "celery_task_id": job.get("id"),
            "status": job.get("status", "idle"),
            "video_url": job.get("video_url", "")
        }
        return {
            "state": simulated_values,
            "next_nodes": []
        }
        
    return {"status": "not_found"}

@app.get("/api/v1/image")
async def generate_image_proxy(prompt: str):
    """
    Proxies a text-to-image request via g4f (free HF space flux model)
    and streams back the image binary so the frontend can display it cleanly.
    Implements a local disk cache to prevent rate-limiting and ensure visual consistency.
    """
    from fastapi import Response
    from fastapi.responses import FileResponse
    import g4f
    from g4f.client import Client
    import requests
    import urllib.parse
    import hashlib
    import os
    
    try:
        # Check cache first
        prompt_hash = hashlib.md5(prompt.encode('utf-8')).hexdigest()
        cache_dir = os.path.join(os.getcwd(), "cache")
        os.makedirs(cache_dir, exist_ok=True)
        cache_path = os.path.join(cache_dir, f"{prompt_hash}.webp")
        
        if os.path.exists(cache_path):
            print(f"[Image Proxy Cache Hit] Serving cached image for prompt: {prompt[:30]}...")
            return FileResponse(cache_path, media_type="image/webp")
            
        client = Client()
        # Flux model returns a HuggingFace space temporary webp URL
        # We must use async_generate because we are already in an event loop
        response = await client.images.async_generate(model='flux', prompt=prompt, response_format='url')
        
        if not response.data or not response.data[0].url:
            raise Exception("No URL returned from g4f")
            
        img_url = response.data[0].url
        
        # Download and proxy the image bytes
        r = requests.get(img_url, timeout=30)
        if r.status_code == 200:
            with open(cache_path, "wb") as f:
                f.write(r.content)
            print(f"[Image Proxy Cache Miss] Generated and cached image for prompt: {prompt[:30]}...")
            return FileResponse(cache_path, media_type="image/webp")
        else:
            raise Exception(f"Failed to fetch image from HF: {r.status_code}")
            
    except Exception as e:
        print(f"[image proxy] image generation failed: {e}")
        # Fallback to a solid black 1x1 PNG so the frontend receives a valid image response without crashing
        black_png = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\rIDATx\x9cc`\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82'
        return Response(content=black_png, media_type="image/png")
