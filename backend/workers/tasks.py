import os
import re
import math
import asyncio
import requests
import urllib.parse
from typing import List, Dict, Any
from .celery_app import celery_app

# Import edge-tts
import edge_tts

# Try importing faster-whisper
try:
    from faster_whisper import WhisperModel
except ImportError:
    WhisperModel = None

# Try importing ffmpeg
import ffmpeg

def get_mock_timestamps(text: str, duration: float) -> list:
    """
    Fallback word alignment generator if Whisper is missing.
    """
    words = text.split()
    if not words:
        return []
    
    word_duration = duration / len(words)
    alignments = []
    for idx, w in enumerate(words):
        start = idx * word_duration
        end = start + word_duration
        alignments.append({
            "word": w,
            "start": round(start, 2),
            "end": round(end, 2)
        })
    return alignments

async def synthesize_ssml_edge_tts(ssml_text: str, output_path: str, voice: str = "en-US-AndrewNeural"):
    """
    Parses <break time="..." /> breaks inside SSML, synthesizes speech segments via edge-tts,
    and stitches them together with precise silent gaps using FFmpeg.
    """
    content = ssml_text.replace("<speak>", "").replace("</speak>", "")
    pattern = r'<break\s+time="(\d+)ms"\s*/>'
    
    segments = re.split(pattern, content)
    temp_files = []
    
    try:
        i = 0
        while i < len(segments):
            text_segment = segments[i].strip()
            if text_segment:
                temp_file = f"{output_path}_seg_{len(temp_files)}.mp3"
                communicate = edge_tts.Communicate(text_segment, voice)
                await communicate.save(temp_file)
                temp_files.append({"type": "audio", "path": temp_file})
                
            # Inject silent delay segments if break tag exists
            if i + 1 < len(segments):
                pause_ms = int(segments[i + 1])
                temp_silence = f"{output_path}_silence_{len(temp_files)}.mp3"
                duration = pause_ms / 1000.0
                
                # Generate silence using ffmpeg anullsrc
                os.system(f'ffmpeg -y -f lavfi -i anullsrc=r=24000:cl=mono -t {duration} "{temp_silence}" > NUL 2>&1')
                temp_files.append({"type": "silence", "path": temp_silence})
                i += 2
            else:
                i += 1
                
        if len(temp_files) == 1:
            if os.path.exists(temp_files[0]["path"]):
                if os.path.exists(output_path):
                    os.remove(output_path)
                os.rename(temp_files[0]["path"], output_path)
        elif len(temp_files) > 1:
            list_path = f"{output_path}_concat.txt"
            with open(list_path, "w", encoding="utf-8") as f:
                for item in temp_files:
                    safe_path = item["path"].replace("\\", "/")
                    f.write(f"file '{safe_path}'\n")
            
            if os.path.exists(output_path):
                os.remove(output_path)
                
            os.system(f'ffmpeg -y -f concat -safe 0 -i "{list_path}" -c copy "{output_path}" > NUL 2>&1')
            
            # Clean up temp files
            try:
                os.remove(list_path)
                for item in temp_files:
                    os.remove(item["path"])
            except Exception:
                pass
    except Exception as e:
        print(f"[SSML Synthesis Error] Falling back to default edge-tts: {e}")
        # Strip all tags and synthesize raw text
        raw_text = re.sub(r"<[^>]*>", "", ssml_text)
        communicate = edge_tts.Communicate(raw_text, voice)
        await communicate.save(output_path)

def extract_word_timestamps(audio_path: str, total_text: str, total_duration: float) -> list:
    """
    Extracts word timestamps using faster-whisper, with dynamic fallback.
    """
    if WhisperModel is None:
        print("[Whisper] Module faster-whisper not found, using heuristic word alignment.")
        return get_mock_timestamps(total_text, total_duration)
    
    try:
        model = WhisperModel("tiny", device="cpu", compute_type="float32")
        segments, info = model.transcribe(audio_path, word_timestamps=True)
        word_alignments = []
        for segment in segments:
            if segment.words:
                for word in segment.words:
                    word_alignments.append({
                        "word": word.word.strip(),
                        "start": round(word.start, 2),
                        "end": round(word.end, 2)
                    })
        if not word_alignments:
            return get_mock_timestamps(total_text, total_duration)
        return word_alignments
    except Exception as e:
        print(f"[Whisper Exception] {e}. Falling back to mock generator.")
        return get_mock_timestamps(total_text, total_duration)

def download_asset_image(url: str, output_path: str):
    """
    Downloads image asset from pollinations.ai or fallback source.
    """
    try:
        res = requests.get(url, timeout=15)
        if res.status_code == 200:
            with open(output_path, "wb") as f:
                f.write(res.content)
            print(f"[Assets] Downloaded frame image to {output_path}")
        else:
            raise Exception(f"HTTP Status {res.status_code}")
    except Exception as e:
        print(f"[Assets Download Error] {e}. Generating placeholder solid background.")
        # Create solid color image using FFmpeg
        os.system(f'ffmpeg -y -f lavfi -i color=c=0x131315:s=1280x720:d=1 -vframes 1 "{output_path}" > NUL 2>&1')

@celery_app.task(bind=True, max_retries=3)
def render_video_pipeline(self, state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Sequentially renders video production using edge-tts, faster-whisper, and ffmpeg-python:
    1. edge-tts: speech audio synthesis.
    2. faster-whisper: timing analysis.
    3. ffmpeg-python: composites video scenes, zooms with sigmoid easing, and ducks music.
    """
    job_id = state.get("job_id", "default_job")
    storyboard = state.get("structured_storyboard", [])
    art_style = state.get("art_style", "pixar")
    bgm_volume = state.get("bgm_volume", 30) / 100.0  # ducking calculation
    
    print(f"[Celery Worker] Starting video synthesis for Job ID: {job_id}")
    
    work_dir = os.path.join(os.getcwd(), "workspace", job_id)
    os.makedirs(work_dir, exist_ok=True)
    
    # 1. Synthesize Audio for each scene and download images
    audio_paths = []
    image_paths = []
    
    for idx, scene in enumerate(storyboard):
        scene_text = scene.get("text", "")
        # Build SSML layout
        punctuations = r"([.,!?])"
        ssml_layout = re.sub(punctuations, r'\1<break time="500ms"/>', scene_text)
        ssml_string = f"<speak>{ssml_layout}</speak>"
        
        # Audio output path
        audio_path = os.path.join(work_dir, f"audio_scene_{idx}.mp3")
        asyncio.run(synthesize_ssml_edge_tts(ssml_string, audio_path))
        audio_paths.append(audio_path)
        
        # Check cache or download/generate image path
        image_path = os.path.join(work_dir, f"image_scene_{idx}.jpg")
        image_prompt = scene.get("prompt") or scene.get("style_prompt_override") or "watercolor futuristic deep space"
        
        # Check local cache first
        import hashlib
        import shutil
        prompt_hash = hashlib.md5(image_prompt.encode('utf-8')).hexdigest()
        cache_dir = os.path.join(os.getcwd(), "cache")
        os.makedirs(cache_dir, exist_ok=True)
        cache_path = os.path.join(cache_dir, f"{prompt_hash}.webp")
        
        if os.path.exists(cache_path):
            shutil.copy(cache_path, image_path)
            print(f"[Celery Assets] Reused cached image for scene {idx}: {image_prompt[:30]}...")
        else:
            # Try to generate using flux model via g4f (same as proxy)
            try:
                from g4f.client import Client
                client = Client()
                response = asyncio.run(client.images.async_generate(model='flux', prompt=image_prompt, response_format='url'))
                if response.data and response.data[0].url:
                    img_url = response.data[0].url
                    r = requests.get(img_url, timeout=30)
                    if r.status_code == 200:
                        with open(cache_path, "wb") as f:
                            f.write(r.content)
                        shutil.copy(cache_path, image_path)
                        print(f"[Celery Assets] Generated and cached image for scene {idx} using g4f flux model.")
                    else:
                        raise Exception("Proxy request failed")
                else:
                    raise Exception("No URL returned")
            except Exception as e:
                print(f"[Celery Assets g4f failed] {e}. Falling back to pollinations.ai")
                encoded_url = f"https://image.pollinations.ai/prompt/{urllib.parse.quote(image_prompt)}?width=1280&height=720&nologo=true"
                download_asset_image(encoded_url, image_path)
        
        image_paths.append(image_path)
    
    # 2. Concat vocals to find duration & alignment
    stitched_vocals = os.path.join(work_dir, "vocals_all.mp3")
    list_path = os.path.join(work_dir, "vocals_list.txt")
    with open(list_path, "w", encoding="utf-8") as f:
        for path in audio_paths:
            f.write(f"file '{path.replace('\\', '/')}'\n")
    os.system(f'ffmpeg -y -f concat -safe 0 -i "{list_path}" -c copy "{stitched_vocals}" > NUL 2>&1')
    
    # Obtain total duration
    total_duration = 5.0
    try:
        probe = ffmpeg.probe(stitched_vocals)
        total_duration = float(probe['format']['duration'])
    except Exception:
        total_duration = len(storyboard) * 3.0
        
    print(f"[Celery] Synthesized vocal tracks. Total duration: {total_duration}s")
    
    # Generate background music file (sinusoidal hum or silent base if none)
    bgm_path = os.path.join(work_dir, "bgm.mp3")
    os.system(f'ffmpeg -y -f lavfi -i "sine=frequency=120:beep_factor=4:duration={total_duration}" -vol 0.15 "{bgm_path}" > NUL 2>&1')
    
    # 3. Compile FFmpeg Composing with mathematical easing zoompan
    scene_videos = []
    
    for idx, scene in enumerate(storyboard):
        image_file = image_paths[idx]
        audio_file = audio_paths[idx]
        
        # Calculate scene duration
        scene_duration = 3.0
        try:
            probe = ffmpeg.probe(audio_file)
            scene_duration = float(probe['format']['duration'])
        except Exception:
            pass
            
        scene_video_out = os.path.join(work_dir, f"scene_video_{idx}.mp4")
        camera_motion = scene.get("camera_motion", "ease_in_zoom")
        
        # Apply easing functions
        # Sigmoid zoom: zoom = 1.0 + 0.3 / (1.0 + exp(-10.0 * (on/d - 0.5)))
        # Exponential pan: x = (iw - iw/zoom) * pow(2.0, 10.0 * (on/d - 1.0))
        zoom_expr = "1.0+0.3/(1.0+exp(-10.0*(on/25.0-0.5)))"
        x_expr = "0"
        y_expr = "0"
        
        if camera_motion == "ease_in_zoom":
            zoom_expr = "1.0+0.35/(1.0+exp(-8.0*(on/(30.0*d)-0.5)))"
            x_expr = "(iw-iw/zoom)*0.5"
            y_expr = "(ih-ih/zoom)*0.5"
        elif camera_motion == "exponential_pan":
            zoom_expr = "1.15"
            x_expr = "(iw-iw/zoom)*pow(2.0,8.0*(on/(30.0*d)-1.0))"
            y_expr = "(ih-ih/zoom)*0.5"
        elif camera_motion == "dolly":
            zoom_expr = "1.05+0.1*(on/(30.0*d))"
            x_expr = "(iw-iw/zoom)*0.5"
            y_expr = "(ih-ih/zoom)*0.5"
            
        fps = 30
        total_frames = int(scene_duration * fps)
        
        try:
            # Build scene video with easing filters using ffmpeg-python
            video_input = ffmpeg.input(image_file, loop=1, t=scene_duration)
            audio_input = ffmpeg.input(audio_file)
            
            # Apply mathematical zoompan filter
            scaled_video = video_input.filter(
                'zoompan',
                zoom=zoom_expr,
                x=x_expr,
                y=y_expr,
                d=total_frames,
                s='1280x720',
                fps=fps
            )
            
            # Render individual scene video
            stream = ffmpeg.output(scaled_video, audio_input, scene_video_out, pix_fmt='yuv420p', vcodec='libx264', acodec='aac')
            ffmpeg.run(stream, overwrite_output=True, quiet=True)
            scene_videos.append(scene_video_out)
            print(f"[FFmpeg] Compiled Scene {idx} easing video successfully.")
        except Exception as e:
            print(f"[FFmpeg Easing Filter failed] {e}. Falling back to simple slide.")
            # Simple fallback command
            os.system(f'ffmpeg -y -loop 1 -i "{image_file}" -i "{audio_file}" -c:v libx264 -t {scene_duration} -pix_fmt yuv420p -c:a aac "{scene_video_out}" > NUL 2>&1')
            scene_videos.append(scene_video_out)

    # Concat all scene videos
    stitched_video_no_bg = os.path.join(work_dir, "stitched_no_bg.mp4")
    video_list_path = os.path.join(work_dir, "videos_list.txt")
    with open(video_list_path, "w", encoding="utf-8") as f:
        for path in scene_videos:
            f.write(f"file '{path.replace('\\', '/')}'\n")
    os.system(f'ffmpeg -y -f concat -safe 0 -i "{video_list_path}" -c copy "{stitched_video_no_bg}" > NUL 2>&1')
    
    # 4. Duck BGM by 30% when voice is active
    final_video_path = os.path.join(work_dir, "final_cut.mp4")
    
    try:
        video_in = ffmpeg.input(stitched_video_no_bg)
        vocals_in = ffmpeg.input(stitched_vocals)
        bgm_in = ffmpeg.input(bgm_path)
        
        # Apply sidechain compressor: compress bgm stream based on vocals stream
        ducked_bgm = bgm_in.filter('sidechaincompress', threshold=0.15, ratio=3.5, attack=50, release=150)
        # Mix vocals and ducked background audio
        mixed_audio = ffmpeg.filter([ducked_bgm, vocals_in], 'amix', inputs=2, duration='first')
        
        # Compile final video result
        final_stream = ffmpeg.output(
            video_in.video,
            mixed_audio,
            final_video_path,
            pix_fmt='yuv420p',
            vcodec='copy',
            acodec='aac'
        )
        ffmpeg.run(final_stream, overwrite_output=True, quiet=True)
        print("[FFmpeg] Successfully completed sidechain ducking and stitched final video.")
    except Exception as e:
        print(f"[FFmpeg Sidechain Ducking failed] {e}. Falling back to standard mix.")
        os.system(f'ffmpeg -y -i "{stitched_video_no_bg}" -i "{bgm_path}" -filter_complex "[0:a][1:a]amix=inputs=2:duration=first" -c:v copy -c:a aac "{final_video_path}" > NUL 2>&1')

    # Copy output to static asset location
    public_dir = os.path.join(os.getcwd(), "..", "frontend", "public", "renders")
    os.makedirs(public_dir, exist_ok=True)
    destination_file = os.path.join(public_dir, f"{job_id}.mp4")
    
    try:
        import shutil
        if os.path.exists(destination_file):
            os.remove(destination_file)
        shutil.copy(final_video_path, destination_file)
        print(f"[Asset Storage] Copied final video results to frontend assets: {destination_file}")
    except Exception as e:
        print(f"[Asset Storage Error] {e}")

    # Generate public video url
    video_url = f"/renders/{job_id}.mp4"
    
    return {
        "job_id": job_id,
        "video_url": video_url,
        "status": "completed",
        "total_duration": total_duration
    }
