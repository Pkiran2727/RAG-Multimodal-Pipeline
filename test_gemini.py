import requests
key = "YOUR_GEMINI_API_KEY"
url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key={key}"
payload = {
    "contents": [{"parts": [{"text": "Hello"}]}],
    "systemInstruction": {"parts": [{"text": ""}]}
}
res = requests.post(url, headers={'Content-Type': 'application/json'}, json=payload)
print(res.status_code)
print(res.text)
