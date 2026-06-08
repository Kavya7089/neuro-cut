import requests

res = requests.post("http://localhost:8000/api/v1/generate", json={
    "raw_script": "This is a test script",
    "art_style": "cinematic",
    "thread_id": "test_thread"
})
print("STATUS CODE:", res.status_code)
print("RESPONSE:", res.text)
