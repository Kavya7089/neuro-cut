import os
import json
import asyncio
from typing import List, Dict, Any
from profanity_check import predict_prob
from groq import Groq
import edge_tts
from faster_whisper import WhisperModel
from schema import StoryboardModel

class ModerationService:
    @staticmethod
    def check_profanity(text: str) -> Dict[str, Any]:
        """
        Uses alt-profanity-check for a fast, local ML-based moderation pass.
        Returns a mock Azure-style report structure for compatibility with frontend.
        """
        prob = predict_prob([text])[0]
        is_safe = prob < 0.7  # threshold

        # Mocking specific categories based on the probability for frontend UI
        return {
            "is_safe": bool(is_safe),
            "azure_safety_index": round(prob, 2),
            "categories": {
                "violence": int(prob * 10),
                "hate": int(prob * 5),
                "sexual": int(prob * 2),
                "self_harm": int(prob * 8) if prob > 0.8 else 0
            }
        }

class LLMService:
    def __init__(self):
        # We rely on GROQ_API_KEY being set in the environment
        try:
            self.client = Groq()
        except Exception as e:
            print(f"[LLMService] Error initializing Groq client: {e}")
            self.client = None

    def enhance_script(self, raw_script: str) -> Dict[str, str]:
        """
        Generates a hook and body segment.
        """
        if not self.client:
            return self._enhance_script_fallback(raw_script, "Groq client not initialized")

        prompt = f"Enhance this script for a short-form video. Provide a catchy hook and a concise body. Script: {raw_script}"
        
        try:
            chat_completion = self.client.chat.completions.create(
                messages=[
                    {"role": "system", "content": "You are an expert video script enhancer. Return a JSON object with 'hook' and 'body' keys ONLY. No markdown wrapping."},
                    {"role": "user", "content": prompt}
                ],
                model="llama-3.3-70b-versatile",
                response_format={"type": "json_object"},
                temperature=0.7,
            )
            response_text = chat_completion.choices[0].message.content
            return json.loads(response_text)
        except Exception as e:
            return self._enhance_script_fallback(raw_script, e)

    def _enhance_script_fallback(self, raw_script: str, error: Any) -> Dict[str, str]:
        print(f"[LLMService] enhance_script failed ({error}), using local fallback.")
        import re
        import random
        sentences = [s.strip() for s in re.split(r'[.!?\n]', raw_script) if s.strip()]
        
        # Add some variety in local fallback mode
        prefixes = [
            "🔥 ATTENTION: ",
            "🚀 BREAKING: ",
            "💡 Did you know? ",
            "✨ STOP SCROLLING! ",
            "⭐ ALERT: "
        ]
        chosen_prefix = random.choice(prefixes)
        
        hook = sentences[0] if sentences else "Traditional video editing is dead."
        if hook and not any(p in hook for p in prefixes):
            hook = f"{chosen_prefix}{hook}"
            
        body = ". ".join(sentences[1:]) if len(sentences) > 1 else "NeuroCut Multi-Agent Studio simplifies all your video creation needs in real-time."
        
        body_tails = [
            " Composed, storyboarded, and rendered in real-time.",
            " Experience the next generation of creative AI automation.",
            " Powered by NeuroCut multi-agent state machines."
        ]
        body = body + random.choice(body_tails)
        
        return {"hook": hook, "body": body}

    def generate_storyboard(self, script_data: Dict[str, str], art_style: str) -> StoryboardModel:
        """
        Acts as the Director agent, returning a structured StoryboardModel (JSON).
        """
        full_script = f"{script_data.get('hook', '')} {script_data.get('body', '')}"
        
        if not self.client:
            return self._generate_storyboard_fallback(script_data, art_style, "Groq client not initialized")

        system_prompt = f"""You are an elite AI Video Director. 
Create a storyboard for a {art_style} style video based on the script. 
Split the script logically into scenes. 
Assign timestamps based on a normal speaking rate (~150 words per minute).
Assign camera movements: 'ease_in_zoom', 'exponential_pan', 'tilt_shake', or 'dolly'.
Create highly detailed image generation prompts for each scene based on the {art_style} style.
Respond in pure JSON matching the following schema:
{{
    "scenes": [
        {{
            "timestamp_start": float,
            "timestamp_end": float,
            "script_segment": string,
            "camera_movement": string,
            "style_prompt_override": string
        }}
    ]
}}"""
        try:
            chat_completion = self.client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Script: {full_script}"}
                ],
                model="llama-3.3-70b-versatile",
                response_format={"type": "json_object"},
                temperature=0.4,
            )
            response_text = chat_completion.choices[0].message.content
            data = json.loads(response_text)
            
            # Normalize and validate scenes
            normalized_scenes = []
            scenes = data.get("scenes", [])
            if not isinstance(scenes, list):
                scenes = []
                
            for idx, scene in enumerate(scenes):
                if not isinstance(scene, dict):
                    continue
                t_start = scene.get("timestamp_start") or scene.get("start") or (idx * 3.0)
                t_end = scene.get("timestamp_end") or scene.get("end") or ((idx + 1) * 3.0)
                seg = scene.get("script_segment") or scene.get("segment") or scene.get("text") or ""
                cam = scene.get("camera_movement") or "ease_in_zoom"
                prompt = scene.get("style_prompt_override") or scene.get("prompt") or f"Visual for: {seg}"
                
                normalized_scenes.append({
                    "timestamp_start": float(t_start),
                    "timestamp_end": float(t_end),
                    "script_segment": str(seg),
                    "camera_movement": str(cam),
                    "style_prompt_override": str(prompt)
                })
                
            if not normalized_scenes:
                return self._generate_storyboard_fallback(script_data, art_style, "No valid scenes parsed")
                
            return StoryboardModel(scenes=normalized_scenes)
        except Exception as e:
            return self._generate_storyboard_fallback(script_data, art_style, e)

    def _generate_storyboard_fallback(self, script_data: Dict[str, str], art_style: str, error: Any) -> StoryboardModel:
        print(f"[LLMService] generate_storyboard failed ({error}), using local fallback.")
        full_script = f"{script_data.get('hook', '')} {script_data.get('body', '')}".strip()
        if not full_script:
            full_script = "Create stunning short-form videos with NeuroCut."
            
        import re
        parts = [p.strip() for p in re.split(r'[.!?\n]', full_script) if p.strip()]
        if not parts:
            parts = [full_script]
            
        parts = parts[:4] # max 4 scenes
        scenes = []
        duration = max(3.0, 15.0 / len(parts))
        camera_moves = ['ease_in_zoom', 'exponential_pan', 'tilt_shake', 'dolly']
        
        for idx, part in enumerate(parts):
            start = idx * duration
            end = (idx + 1) * duration
            cam = camera_moves[idx % len(camera_moves)]
            prompt = f"A professional high-quality {art_style} style cinematic shot depicting: {part}. Detailed, 8k, dynamic lighting."
            
            scenes.append({
                "timestamp_start": round(start, 2),
                "timestamp_end": round(end, 2),
                "script_segment": part,
                "camera_movement": cam,
                "style_prompt_override": prompt
            })
            
        return StoryboardModel(scenes=scenes)

class TTSService:
    @staticmethod
    async def generate_audio(text: str, output_path: str, voice: str = "en-US-AriaNeural") -> None:
        """
        Uses edge-tts to generate voice. 
        Note: edge-tts has limited SSML support. We strip explicit SSML tags and use natural punctuation for pacing,
        or apply rate/pitch adjustments globally.
        """
        # Basic cleanup of mock SSML tags for edge-tts compatibility
        clean_text = text.replace("<break time='500ms'/>", "...").replace("<speak>", "").replace("</speak>", "")
        communicate = edge_tts.Communicate(clean_text, voice)
        await communicate.save(output_path)

class TranscriptionService:
    def __init__(self, model_size="tiny.en"):
        # We load a small model by default for speed, running on CPU (or GPU if available)
        self.model = WhisperModel(model_size, device="cpu", compute_type="int8")
        
    def get_word_timestamps(self, audio_path: str) -> List[Dict[str, Any]]:
        """
        Uses faster-whisper to transcribe audio and return word-level timestamps.
        """
        segments, info = self.model.transcribe(audio_path, word_timestamps=True)
        
        word_alignments = []
        for segment in segments:
            for word in segment.words:
                word_alignments.append({
                    "word": word.word.strip(),
                    "start": word.start,
                    "end": word.end
                })
        return word_alignments

class ImageService:
    @staticmethod
    def format_pollinations_url(prompt: str) -> str:
        """
        Zero-cost image generation using pollinations.ai (Currently returning 402 for our IP).
        Using picsum.photos as a reliable fallback for testing.
        """
        import urllib.parse
        import hashlib
        # Use placehold.co to show the prompt text visually since pollinations returns 402
        short_prompt = prompt[:40] + "..." if len(prompt) > 40 else prompt
        return f"https://placehold.co/1280x720/09090b/2dd4bf/png?text={urllib.parse.quote(short_prompt)}"
