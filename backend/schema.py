from pydantic import BaseModel, Field
from typing import List

class SceneModel(BaseModel):
    timestamp_start: float = Field(
        ..., 
        description="The starting offset in seconds for this particular scene cut."
    )
    timestamp_end: float = Field(
        ..., 
        description="The ending offset in seconds for this particular scene cut."
    )
    script_segment: str = Field(
        ..., 
        description="The vocal script segment spoken by the AI voice during this scene."
    )
    camera_movement: str = Field(
        ..., 
        description="The kinetic camera easing function (e.g., ease_in_zoom, linear_pan, tilt_shake, dolly)."
    )
    style_prompt_override: str = Field(
        ..., 
        description="Specific descriptive prompt override to feed into the image generator for this scene's assets."
    )

class StoryboardModel(BaseModel):
    """
    Rigid structural mapping validating the multi-agent Director output container.
    """
    scenes: List[SceneModel] = Field(
        ..., 
        description="A list of sequentially arranged storyboard scenes matching the audio timestamps."
    )
