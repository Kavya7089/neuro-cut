# NeuroCut - Presentation & Project Guide

## 1. Project Overview: What, Why, and How?

### What is NeuroCut?
NeuroCut is an **Enterprise Multi-Agent Short-Form Video Production Studio**. It's an AI-powered platform that automatically generates short-form videos (like YouTube Shorts, TikToks, or Instagram Reels) from simple text prompts.

### Why was it built?
Video production is traditionally expensive and time-consuming, requiring scriptwriters, directors, voice actors, and video editors. NeuroCut automates this entire pipeline using AI agents, making video creation accessible and **zero-cost** by leveraging open-source and free-tier APIs.

### How does it work? (The Architecture)
We use a **Human-In-The-Loop (HITL) Multi-Agent System** powered by **LangGraph**. The workflow pauses at specific "gates" to allow human approval before proceeding.

**Tech Stack (Zero-Cost / Open Source Focus):**
- **Frontend:** Next.js, React, Tailwind CSS (User Interface).
- **Backend:** FastAPI (Python), Celery (Background Tasks), Redis (State Management & Message Broker).
- **AI Orchestration:** LangGraph (Stateful Multi-Agent Framework).
- **Agents:**
  - **Scripting Agent (LLaMA3 via Groq):** Writes the video script.
  - **Director Agent (LLaMA3 via Groq):** Plans visual prompts and camera movements (zooms, pans).
  - **Asset Generator:** Uses `g4f` and `Pollinations.ai` to generate images for free.
- **Audio & Video Processing:**
  - **TTS:** `edge-tts` (Free Microsoft Edge TTS) for voiceovers.
  - **Transcription:** `faster-whisper` for word-level timestamps (local, no API cost).
  - **Video Rendering:** `ffmpeg-python` to stitch images, apply Ken Burns effects, and add subtitles.

### What is DONE?
- ✅ **Frontend UI:** Step-by-step wizard (Prompt -> Script -> Storyboard -> Assets -> Rendering).
- ✅ **Backend Infrastructure:** FastAPI server, Redis integration, Celery workers.
- ✅ **Multi-Agent Pipeline (LangGraph):** Script generation, storyboarding, and asset planning are fully functional.
- ✅ **Image Generation Proxy:** Integrated `g4f` and `pollinations.ai` for free image generation with fallback mechanisms to handle rate limits.
- ✅ **Human-in-the-Loop (HITL):** The system pauses for user approval at Scripting, Storyboarding, and Asset Generation stages.

### What is NOT DONE (Future Scope / In Progress)?
- ⏳ **Advanced Video Effects:** Fine-tuning complex Ken Burns effects (dynamic pan/zoom) via FFmpeg.
- ⏳ **High-Quality Audio Synchronization:** Perfecting the word-level alignment between Faster-Whisper and Edge-TTS.
- ⏳ **Deployment:** Containerizing the entire stack (Docker) for one-click deployment on platforms like AWS or Render.
- ⏳ **Custom Voice Cloning:** Integrating models like XTTS for custom voice options.

---

## 2. Presentation Script (For 5 Team Members)

**Member 1: Introduction & Problem Statement (1-2 mins)**
"Hello everyone. Today, our team is excited to present **NeuroCut**, our Enterprise Multi-Agent Video Production Studio. The problem we aimed to solve is the high barrier to entry in video content creation. It's expensive and time-consuming. Our solution automates the roles of a scriptwriter, director, and video editor using AI, specifically focusing on a zero-cost architecture using tools like Groq and Pollinations.ai."

**Member 2: The Multi-Agent Architecture (2 mins)**
"To achieve this, we built a multi-agent system using LangGraph. We have distinct agents: the Scripting Agent, which writes engaging dialogue; the Director Agent, which visualizes the scenes; and the Asset Generator. The system is stateful and operates with a 'Human-In-The-Loop' approach, meaning the user maintains creative control and can approve or edit the AI's output at every critical stage."

**Member 3: Backend & AI Integration (2 mins)**
"On the backend, we use FastAPI for rapid API development and Redis for state management. For our AI models, we use LLaMA3 running on Groq for lightning-fast text generation. For images, we bypassed expensive APIs by utilizing g4f and Pollinations.ai. For audio, we use edge-tts, and we process word-level timestamps locally using faster-whisper. This ensures our entire pipeline remains highly efficient and cost-effective."

**Member 4: Frontend & User Experience (2 mins)**
"For the user experience, we built a Next.js frontend. We designed a step-by-step wizard that guides the user through the video creation process. *[Optional: Briefly demonstrate the UI, showing the prompt input, script approval, and asset generation steps].* We've focused on a clean, modern UI that hides the complex backend orchestration, making it intuitive for non-technical creators."

**Member 5: Challenges, Future Scope & Conclusion (1-2 mins)**
"Building this wasn't without challenges. Handling rate limits from free image providers required us to build robust proxy endpoints and fallback mechanisms. Orchestrating background video rendering with Celery and FFmpeg also took careful planning. In the future, we plan to containerize the app for easier deployment and add more advanced video transitions. Thank you, and we are now open to any questions."

---

## 3. Potential Questions to Ask the Mentors / Judges

To show deep engagement, here are some questions you can ask the mentors during your presentation:

1. **Scalability:** *"Given our zero-cost architecture currently relies on free-tier APIs and local processing (like faster-whisper), what architectural patterns would you recommend if we needed to scale this to 10,000 concurrent users?"*
2. **Agentic Frameworks:** *"We chose LangGraph for its robust state management and Human-In-The-Loop capabilities. Have you seen teams successfully migrate from LangGraph to other orchestration tools like AutoGen, and what trade-offs did they face?"*
3. **Video Rendering:** *"Currently, we use FFmpeg for compositing the final video. Are there more modern, programmatic video rendering engines you've encountered that might offer better performance or easier integration than standard FFmpeg?"*
4. **Monetization:** *"While built as a zero-cost tool, if we were to commercialize this, where do you see the biggest value-add that enterprise clients would pay for? (e.g., brand consistency, speed, custom models?)"*
