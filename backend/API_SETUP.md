# NeuroCut API Setup Guide (Zero-Cost Stack)

This guide explains how to obtain and configure the keys required to run the backend for NeuroCut Multi-Agent Studio. We are strictly adhering to a zero-cost stack using open-source models and generous free-tier APIs.

## 1. Groq API Key (Director LLM)
We use the **Groq API** to run `llama-3.3-70b-versatile` at lightning speeds for our LangGraph orchestration and Pydantic JSON generation.

1. Go to the [Groq Developer Console](https://console.groq.com/keys).
2. Create an account or log in.
3. Click **Create API Key**.
4. Copy the key and paste it into your local `.env` file as `GROQ_API_KEY`.

## 2. Redis Configuration
Redis is used as our **Message Broker** for Celery and our **State Checkpointer** for LangGraph Human-in-the-Loop workflows.

1. Install Redis locally (e.g., using Docker: `docker run -p 6379:6379 -d redis`).
2. The default `REDIS_URL` in `.env.example` is `redis://localhost:6379/0`. Ensure this matches your local Redis instance.

## 3. No-Key Services
The following services are integrated directly and **do not require any API keys**:

- **Acoustic Realism (TTS)**: We use the `edge-tts` python package which connects to Microsoft Edge's Read Aloud API. It is completely free and requires no authentication.
- **Asset Forging (Images)**: We use `pollinations.ai`. The image generation is performed via HTTP GET requests (e.g., `https://image.pollinations.ai/prompt/{encoded_prompt}`). No API key is needed.
- **Audio Timestamps**: We use `faster-whisper` which runs locally using CPU/GPU inference.
- **Content Moderation**: We use `alt-profanity-check` for local machine-learning based profanity checks before sending requests to the LLM.

## Setup Instructions

1. Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Paste your `GROQ_API_KEY` into the `.env` file.
3. Boot up Redis.
4. Start the Celery Worker and FastAPI server.
