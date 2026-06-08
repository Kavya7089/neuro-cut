import asyncio
import g4f
from g4f.client import Client

async def test_models():
    client = Client()
    models_to_test = ['dall-e-3', 'midjourney', 'default']
    for model in models_to_test:
        print(f"Testing model: {model}")
        try:
            kwargs = {"prompt": "A futuristic city"}
            if model != 'default':
                kwargs["model"] = model
            response = await client.images.async_generate(response_format='url', **kwargs)
            print(f"Success with {model}: {response.data[0].url}")
            return
        except Exception as e:
            print(f"Failed {model}: {e}")

asyncio.run(test_models())
