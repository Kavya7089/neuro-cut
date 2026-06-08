import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
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

class WorkflowStartRequest(BaseModel):
    raw_script: str
    art_style: str = "cinematic"
    thread_id: str = "default_thread_1"

class WorkflowApproveRequest(BaseModel):
    thread_id: str
    state_updates: Optional[Dict[str, Any]] = None

@app.post("/api/v1/generate")
async def start_workflow(req: WorkflowStartRequest):
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
        final_state = workflow_app.invoke(initial_state, config=config)
        return {"status": "success", "state": final_state}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/approve")
async def approve_workflow(req: WorkflowApproveRequest):
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
        return {"status": "success", "state": final_state}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/status/{thread_id}")
async def get_status(thread_id: str):
    """
    Polls the current state of the workflow graph.
    """
    config = {"configurable": {"thread_id": thread_id}}
    current_state = workflow_app.get_state(config)
    
    if not current_state:
        return {"status": "not_found"}
        
    return {
        "state": current_state.values,
        "next_nodes": current_state.next
    }

@app.get("/api/v1/image")
async def generate_image_proxy(prompt: str):
    """
    Proxies a text-to-image request via g4f (free HF space flux model)
    and streams back the image binary so the frontend can display it cleanly.
    """
    from fastapi import Response
    import g4f
    from g4f.client import Client
    import requests
    import urllib.parse
    
    try:
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
            return Response(content=r.content, media_type="image/webp")
        else:
            raise Exception(f"Failed to fetch image from HF: {r.status_code}")
            
    except Exception as e:
        print(f"[image proxy] image generation failed: {e}")
        # Fallback to a solid black 1x1 PNG so the frontend receives a valid image response without crashing
        black_png = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\rIDATx\x9cc`\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82'
        return Response(content=black_png, media_type="image/png")
