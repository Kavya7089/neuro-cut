import json
from typing import TypedDict, List, Dict, Any, Optional
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver # Note: For production with Celery, replace with RedisSaver
from services import ModerationService, LLMService, ImageService

class PipelineState(TypedDict):
    raw_script: str
    art_style: str
    is_safe: bool
    script_data: Dict[str, str] # hook, body
    storyboard: List[Dict[str, Any]]
    asset_images: List[Dict[str, Any]]
    celery_task_id: str
    status: str

# Instantiate Services
mod_service = ModerationService()
llm_service = LLMService()

# --- Node Functions ---

def moderation_node(state: PipelineState):
    """
    Agent 0: Content Moderation
    """
    report = mod_service.check_profanity(state.get("raw_script", ""))
    
    if not report["is_safe"]:
        return {"is_safe": False, "status": "failed_moderation"}
    
    return {"is_safe": True, "status": "gate1_script"}

def script_enhancer_node(state: PipelineState):
    """
    Agent 1: Script Enhancer
    Uses LLM to structure the script into a hook and body.
    """
    # If the user already provided script_data via HITL override, skip regeneration
    if state.get("script_data") and state.get("status") == "gate1_script_approved":
        return state
        
    script_data = llm_service.enhance_script(state["raw_script"])
    return {"script_data": script_data, "status": "gate1_script"}

def director_node(state: PipelineState):
    """
    Agent 2: The Director
    Splits the script into scenes and assigns camera movements and prompts.
    """
    # Generate storyboard
    storyboard_model = llm_service.generate_storyboard(
        state["script_data"], 
        state.get("art_style", "cinematic")
    )
    
    scenes = []
    for scene in storyboard_model.scenes:
        scenes.append({
            "timestamp_start": scene.timestamp_start,
            "timestamp_end": scene.timestamp_end,
            "script_segment": scene.script_segment,
            "camera_movement": scene.camera_movement,
            "style_prompt_override": scene.style_prompt_override
        })
        
    return {"storyboard": scenes, "status": "gate2_storyboard"}

def asset_validation_node(state: PipelineState):
    """
    Agent 3: Asset Validation
    Pre-computes the pollinations.ai URLs for the scenes.
    """
    asset_images = []
    for idx, scene in enumerate(state.get("storyboard", [])):
        prompt = scene.get("style_prompt_override", "")
        # Get zero-cost image URL
        url = ImageService.format_pollinations_url(prompt)
        asset_images.append({
            "id": idx + 1,
            "prompt": prompt,
            "url": url,
            "regenerating": False
        })
        
    return {"asset_images": asset_images, "status": "gate3_assets"}

def synthesis_trigger_node(state: PipelineState):
    """
    Agent 4: Media Synthesis Engine
    Dispatches the heavy FFmpeg/TTS task to Celery. (Mocked for environment without Redis)
    """
    import uuid
    # Mocking Celery task dispatch to avoid ConnectionError when Redis is unavailable
    mock_task_id = str(uuid.uuid4())
    
    return {"celery_task_id": mock_task_id, "status": "synthesizing"}


# --- Graph Construction ---

workflow = StateGraph(PipelineState)

# Add nodes
workflow.add_node("moderation", moderation_node)
workflow.add_node("script_enhancer", script_enhancer_node)
workflow.add_node("director", director_node)
workflow.add_node("asset_validation", asset_validation_node)
workflow.add_node("synthesis_trigger", synthesis_trigger_node)

# Define edges
workflow.set_entry_point("moderation")

# Moderation -> Script Enhancer (if safe), else END
def check_moderation(state: PipelineState):
    if state.get("is_safe"):
        return "script_enhancer"
    return END

workflow.add_conditional_edges("moderation", check_moderation)

workflow.add_edge("script_enhancer", "director")
workflow.add_edge("director", "asset_validation")
workflow.add_edge("asset_validation", "synthesis_trigger")
workflow.add_edge("synthesis_trigger", END)

# In a production environment with Celery, LangGraph state needs to be persisted in Redis.
# For simplicity in this demo, we use MemorySaver. 
# You can replace MemorySaver with a custom Redis saver to persist threads across worker nodes.
memory = MemorySaver()

# Compile graph with HITL breakpoints
app = workflow.compile(
    checkpointer=memory,
    interrupt_before=["director", "asset_validation", "synthesis_trigger"]
)
