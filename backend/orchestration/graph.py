import os
import json
import time
from typing import TypedDict, List, Dict, Any, Optional
from dotenv import load_dotenv

# Import LangGraph
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.base import BaseCheckpointSaver, Checkpoint, CheckpointTuple

# Import Groq client
from groq import Groq

# Import Celery tasks
from workers.tasks import render_video_pipeline
import redis

load_dotenv()

class GraphState(TypedDict):
    job_id: str
    script: str
    art_style: str
    structured_storyboard: List[Dict[str, Any]]
    assets: List[Dict[str, Any]]
    audio_paths: List[str]
    video_url: str
    current_node: str
    pipeline_state: str
    safety_report: Dict[str, Any]
    bgm_volume: int

# Custom RedisSaver checkpointer to avoid external version conflicts
class RedisSaver(BaseCheckpointSaver):
    def __init__(self, host: str = "localhost", port: int = 6379, db: int = 0):
        super().__init__()
        try:
            self.client = redis.Redis(host=host, port=port, db=db, decode_responses=True, socket_timeout=1.0)
            self.client.ping()
            self.is_connected = True
            print("[Redis Checkpointer] Connected successfully to Redis.")
        except Exception as e:
            self.is_connected = False
            self.memory_store = {}
            print(f"[Redis Checkpointer Warning] Failed to connect: {e}. Falling back to memory saver.")

    def get_tuple(self, config: dict) -> Optional[CheckpointTuple]:
        thread_id = config["configurable"]["thread_id"]
        checkpoint_ns = config["configurable"].get("checkpoint_ns", "")
        checkpoint_id = config["configurable"].get("checkpoint_id")
        
        if not self.is_connected:
            memory_key = f"{thread_id}:{checkpoint_ns}"
            if memory_key not in self.memory_store:
                return None
            checkpoints = self.memory_store[memory_key]
            c_id = checkpoint_id or sorted(checkpoints.keys())[-1]
            data = checkpoints.get(c_id)
            if not data:
                return None
            return CheckpointTuple(
                config={"configurable": {"thread_id": thread_id, "checkpoint_ns": checkpoint_ns, "checkpoint_id": c_id}},
                checkpoint=data["checkpoint"],
                metadata=data["metadata"],
                parent_config=data.get("parent_config"),
                pending_writes=[]
            )

        key = f"checkpoint:{thread_id}:{checkpoint_ns}"
        if checkpoint_id:
            val = self.client.hget(key, checkpoint_id)
        else:
            all_keys = self.client.hkeys(key)
            if not all_keys:
                return None
            c_id = sorted(all_keys)[-1]
            val = self.client.hget(key, c_id)

        if not val:
            return None

        data = json.loads(val)
        return CheckpointTuple(
            config={"configurable": {"thread_id": thread_id, "checkpoint_ns": checkpoint_ns, "checkpoint_id": data["checkpoint"]["id"]}},
            checkpoint=data["checkpoint"],
            metadata=data["metadata"],
            parent_config=data.get("parent_config"),
            pending_writes=[]
        )

    def put(self, config: dict, checkpoint: Checkpoint, metadata: dict, new_releases: Any = None) -> dict:
        thread_id = config["configurable"]["thread_id"]
        checkpoint_ns = config["configurable"].get("checkpoint_ns", "")
        checkpoint_id = checkpoint["id"]

        data = {
            "checkpoint": checkpoint,
            "metadata": metadata,
            "parent_config": config
        }

        if not self.is_connected:
            memory_key = f"{thread_id}:{checkpoint_ns}"
            if memory_key not in self.memory_store:
                self.memory_store[memory_key] = {}
            self.memory_store[memory_key][checkpoint_id] = data
            return {"configurable": {"thread_id": thread_id, "checkpoint_ns": checkpoint_ns, "checkpoint_id": checkpoint_id}}

        key = f"checkpoint:{thread_id}:{checkpoint_ns}"
        self.client.hset(key, checkpoint_id, json.dumps(data))
        return {"configurable": {"thread_id": thread_id, "checkpoint_ns": checkpoint_ns, "checkpoint_id": checkpoint_id}}

def call_groq_with_backoff(system_prompt: str, user_prompt: str, json_mode: bool = False, max_retries: int = 4) -> str:
    """
    Invokes the Groq API (Llama 3 70B) with exponential backoff on failure or rate-limiting.
    """
    api_key = os.getenv("GROQ_API_KEY", "")
    if not api_key:
        print("[Groq Warning] No GROQ_API_KEY environment variable set. Simulating generation.")
        return get_mock_groq_response(user_prompt, json_mode)

    client = Groq(api_key=api_key)
    model = "llama-3.3-70b-versatile"
    
    for attempt in range(max_retries):
        try:
            response_format = {"type": "json_object"} if json_mode else None
            completion = client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                model=model,
                response_format=response_format,
                temperature=0.3
            )
            return completion.choices[0].message.content
        except Exception as e:
            wait_time = (2 ** attempt) + 1
            print(f"[Groq Retry Alert] Attempt {attempt+1} failed due to rate limiting or connection issues: {e}. Retrying in {wait_time}s...")
            time.sleep(wait_time)
            
    print("[Groq Exhaustion Error] Reached max retries. Using fallback generator.")
    return get_mock_groq_response(user_prompt, json_mode)

def get_mock_groq_response(prompt: str, json_mode: bool) -> str:
    """
    Heuristic mockup generation fallback in case Groq is rate limited or keys are not defined.
    """
    if json_mode:
        scenes = {
            "scenes": [
                {
                    "time": "0.0s-3.0s",
                    "text": "🚀 TRADITIONAL VIDEO EDITING IS DEAD.",
                    "prompt": "watercolor style hovering futuristic camera shapes in deep space",
                    "camera_motion": "ease_in_zoom"
                },
                {
                    "time": "3.0s-6.0s",
                    "text": "Enter NeuroCut Multi-Agent Studio. Zero gravity AI workflows await you.",
                    "prompt": "colorful 3D render of cyber tech workspace nodes floating in zero-gravity space",
                    "camera_motion": "exponential_pan"
                }
            ]
        }
        return json.dumps(scenes)
    else:
        return "🚀 STOP SCROLLING! Traditional video editing is dead. Enter NeuroCut Multi-Agent Studio. Zero gravity AI workflows await you."

# LangGraph Nodes
def hook_enhancer_node(state: GraphState) -> Dict[str, Any]:
    print("[Node: Hook Enhancer] Enhancing raw script...")
    system_prompt = (
        "You are an expert short-form copywriter. Optimize the input script to create a high-retention hook "
        "and engaging narrative structure. Output the enhanced text directly."
    )
    user_prompt = f"Optimize this script for TikTok: {state.get('script')}"
    
    enhanced = call_groq_with_backoff(system_prompt, user_prompt, json_mode=False)
    
    # Update state variables
    return {
        "script": enhanced,
        "current_node": "hook_enhancer",
        "pipeline_state": "gate1_script"
    }

def director_node(state: GraphState) -> Dict[str, Any]:
    print("[Node: Storyboard Director] Formulating scenes layout...")
    system_prompt = (
        "You are a cinematic director. Break down the script into discrete, sequentially structured storyboard scenes. "
        "Output ONLY a valid JSON object matching this schema: "
        '{"scenes": [{"time": "0-3s", "text": "scene spoken script text", "prompt": "SDXL visual prompt", "camera_motion": "ease_in_zoom" | "exponential_pan" | "dolly"}]}'
    )
    user_prompt = f"Storyboard this script: {state.get('script')}"
    
    scenes_json = call_groq_with_backoff(system_prompt, user_prompt, json_mode=True)
    
    try:
        data = json.loads(scenes_json)
        structured_storyboard = data.get("scenes", [])
    except Exception as e:
        print(f"[Director JSON Parse Failed] {e}. Falling back.")
        structured_storyboard = json.loads(get_mock_groq_response("", json_mode=True))["scenes"]

    # Normalize fields for compatibility
    for scene in structured_storyboard:
        # Populate legacy fields
        scene["script_segment"] = scene.get("text", "")
        scene["camera_movement"] = scene.get("camera_motion", "ease_in_zoom")
        scene["style_prompt_override"] = scene.get("prompt", "")
        if "time" in scene and "-" in scene["time"]:
            try:
                parts = scene["time"].replace("s", "").split("-")
                scene["timestamp_start"] = float(parts[0])
                scene["timestamp_end"] = float(parts[1])
            except Exception:
                scene["timestamp_start"] = 0.0
                scene["timestamp_end"] = 3.0
                
    return {
        "structured_storyboard": structured_storyboard,
        "current_node": "director",
        "pipeline_state": "gate2_storyboard"
    }

def asset_forger_node(state: GraphState) -> Dict[str, Any]:
    print("[Node: Asset Forger] Compiling SDXL asset list mapping...")
    storyboard = state.get("structured_storyboard", [])
    assets = []
    
    for idx, scene in enumerate(storyboard):
        assets.append({
            "id": idx + 1,
            "prompt": scene.get("prompt", scene.get("style_prompt_override", "cinematic tech void")),
            "regenerating": False
        })
        
    return {
        "assets": assets,
        "current_node": "asset_forger",
        "pipeline_state": "gate3_assets"
    }

def synthesis_node(state: GraphState) -> Dict[str, Any]:
    print("[Node: Synthesis Engine] Triggering Celery rendering pipeline...")
    
    # Build complete execution payload
    render_payload = {
        "job_id": state.get("job_id", "default_job"),
        "structured_storyboard": state.get("structured_storyboard", []),
        "art_style": state.get("art_style", "pixar"),
        "bgm_volume": state.get("bgm_volume", 30)
    }
    
    # Push to Celery Task Queue
    task = render_video_pipeline.delay(render_payload)
    print(f"[Orchestrator] Pushed rendering task to Celery: Task ID {task.id}")
    
    return {
        "video_url": f"PENDING:{task.id}",
        "current_node": "synthesis",
        "pipeline_state": "completed"
    }

# Build State Machine
workflow = StateGraph(GraphState)

# Add Nodes
workflow.add_node("hook_enhancer", hook_enhancer_node)
workflow.add_node("director", director_node)
workflow.add_node("asset_forger", asset_forger_node)
workflow.add_node("synthesis", synthesis_node)

# Set Edges
workflow.set_entry_point("hook_enhancer")
workflow.add_edge("hook_enhancer", "director")
workflow.add_edge("director", "asset_forger")
workflow.add_edge("asset_forger", "synthesis")
workflow.add_edge("synthesis", END)

# Configure Redis State Checkpointer saver
checkpointer = RedisSaver()

# Compile with Human-In-The-Loop Approval interrupts
compiled_graph = workflow.compile(
    checkpointer=checkpointer,
    interrupt_before=["director", "synthesis"]
)
