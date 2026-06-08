from pydantic import BaseModel, Field, model_validator
from typing import List, Optional, Dict, Any

class StoryboardScene(BaseModel):
    time: str = Field(default="", description="Time range string (e.g., '0-3s')")
    text: str = Field(default="", description="Vocal script segment spoken during scene")
    prompt: str = Field(default="", description="Visual scene prompt description")
    camera_motion: str = Field(default="", description="Camera easing motion style")
    
    # Backwards-compatible legacy fields
    timestamp_start: Optional[float] = Field(default=None, description="Legacy starting offset in seconds")
    timestamp_end: Optional[float] = Field(default=None, description="Legacy ending offset in seconds")
    script_segment: Optional[str] = Field(default=None, description="Legacy vocal script segment")
    camera_movement: Optional[str] = Field(default=None, description="Legacy camera movement style")
    style_prompt_override: Optional[str] = Field(default=None, description="Legacy style prompt override")

    @model_validator(mode="before")
    @classmethod
    def sync_legacy_fields(cls, data: Any) -> Any:
        if isinstance(data, dict):
            # 1. Map legacy inputs to standard new keys if standard keys are missing
            if "script_segment" in data and not data.get("text"):
                data["text"] = data["script_segment"]
            if "camera_movement" in data and not data.get("camera_motion"):
                data["camera_motion"] = data["camera_movement"]
            if "style_prompt_override" in data and not data.get("prompt"):
                data["prompt"] = data["style_prompt_override"]
            
            if "timestamp_start" in data and "timestamp_end" in data and not data.get("time"):
                data["time"] = f"{data['timestamp_start']}s-{data['timestamp_end']}s"

            # 2. Map standard new keys to legacy keys if legacy keys are missing
            if "text" in data and not data.get("script_segment"):
                data["script_segment"] = data["text"]
            if "camera_motion" in data and not data.get("camera_movement"):
                data["camera_movement"] = data["camera_motion"]
            if "prompt" in data and not data.get("style_prompt_override"):
                data["style_prompt_override"] = data["prompt"]

            if "time" in data and "-" in data["time"] and data.get("timestamp_start") is None:
                try:
                    time_str = data["time"].replace("s", "")
                    parts = time_str.split("-")
                    data["timestamp_start"] = float(parts[0])
                    data["timestamp_end"] = float(parts[1])
                except Exception:
                    data["timestamp_start"] = 0.0
                    data["timestamp_end"] = 3.0
                    
        return data

class Storyboard(BaseModel):
    scenes: List[StoryboardScene] = Field(..., description="List of sequentially arranged storyboard scenes")

class GenerateRequest(BaseModel):
    script: str = Field(..., description="Raw video script text to transcribe and produce")
    art_style: str = Field(default="pixar", description="Visual synthesization art theme style")

class ApproveRequest(BaseModel):
    gate: str = Field(..., description="HITL Gate approval stage identifier (e.g. gate1_script, gate2_storyboard)")
    payload: Dict[str, Any] = Field(default_factory=dict, description="Updated node states or overrides from user interface")

class JobState(BaseModel):
    script: str = Field(default="", description="The script text")
    structured_storyboard: List[Dict[str, Any]] = Field(default_factory=list, description="List of storyboard scenes")
    assets: List[Dict[str, Any]] = Field(default_factory=list, description="List of synthesized image assets")
    audio_paths: List[str] = Field(default_factory=list, description="Generated TTS file locations")
    video_url: str = Field(default="", description="Rendered video result URL")
    current_node: str = Field(default="idle", description="Current node active in LangGraph state machine")
    pipeline_state: str = Field(default="idle", description="Wizard workflow status step tracker")
    safety_report: Dict[str, Any] = Field(default_factory=dict, description="Azure compliance firewall audit report")

class GenerateResponse(BaseModel):
    job_id: str = Field(..., description="Session identifier uuid for state polling")
    status: str = Field(..., description="API execution state")
    current_node: str = Field(..., description="Active LangGraph execution node")
    state: JobState = Field(..., description="Decoded current pipeline state")
