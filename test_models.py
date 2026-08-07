from gradio_client import Client
import time

def test_hy3():
    try:
        print("Testing Tencent/Hy3...")
        client = Client("tencent/Hy3")
        result = client.predict(
            message="Hello",
            system_prompt="",
            history=None,
            think_level="high",
            temperature=0.7,
            max_tokens=100,
            top_p=0.8,
            functions_json_str="",
            api_name="/chat"
        )
        print("Hy3 Response:", str(result)[:200])
        return True
    except Exception as e:
        print("Hy3 Error:", e)
        return False

def test_qwen_omni():
    try:
        print("\nTesting Qwen3.5-Omni-Offline-Demo...")
        client = Client("Qwen/Qwen3.5-Omni-Offline-Demo")
        client.predict(api_name="/clear_history_offline")
        result = client.predict(
            text="Hello",
            audio=None,
            image=None,
            video=None,
            history=[],
            system_prompt="",
            temperature=0.7,
            top_p=0.8,
            top_k=20,
            api_name="/chat_predict"
        )
        print("Qwen Omni Response:", str(result)[:200])
        return True
    except Exception as e:
        print("Qwen Omni Error:", e)
        return False

if __name__ == "__main__":
    test_hy3()
    test_qwen_omni()
