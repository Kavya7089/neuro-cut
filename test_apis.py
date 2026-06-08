import urllib.request
import urllib.parse
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

def test_api(url_template, prompt):
    url = url_template.replace("{prompt}", urllib.parse.quote(prompt))
    print(f"Testing {url} ...")
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
        with urllib.request.urlopen(req, context=ctx, timeout=10) as response:
            print(f"Success! Status: {response.status}, Content-Type: {response.headers.get('Content-Type')}")
            return True
    except Exception as e:
        print(f"Failed: {e}")
        return False

apis = [
    "https://image.pollinations.ai/prompt/{prompt}?width=800&height=450",
    "https://api.airforce/v1/imagine2?prompt={prompt}",
    "https://api.kastg.xyz/api/ai/text2image?prompt={prompt}",
    "https://hercai.onrender.com/v3/text2image?prompt={prompt}",
    "https://ptp.lol/api/v1/image?prompt={prompt}",
]

for api in apis:
    test_api(api, "a cat in cyberpunk city")
