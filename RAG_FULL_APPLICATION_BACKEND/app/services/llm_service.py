import os
import threading
import time, json
import logging
import requests
import html
import random
from abc import ABC, abstractmethod
from gradio_client import Client, handle_file
from ..config import settings
from ..utils.json_utils import extract_json_block, repair_json

logger = logging.getLogger(__name__)

class ILLMService(ABC):
    @abstractmethod
    def generate(self, prompt: str, sys_prompt: str = None, retry_count: int = 0) -> str:
        """Generate text response."""
        pass
        
    @abstractmethod
    def evaluate_json(self, prompt: str, sys_prompt: str = None, retry_count: int = 0) -> dict:
        """Generate structured JSON response."""
        pass

class TencentHy3Service(ILLMService):
    def __init__(self):
        self.model_name = "tencent/Hy3"
        self.timeout = getattr(settings, "LLM_RESPONSE_TIMEOUT", 1080)
        self.max_retries = getattr(settings, "MAX_LLM_RETRIES", 3)

    def _call(self, prompt: str, sys_prompt: str, result_box: list, error_box: list):
        client = None
        try:
            client = Client(self.model_name)
            result2 = client.predict(
                message=prompt,
                system_prompt=sys_prompt or "",
                history=None,
                think_level="high",
                temperature=None,
                max_tokens=0,
                top_p=0,
                functions_json_str="",
                api_name="/chat"
            )
            result_box[0] = result2
        except Exception as e:
            error_box[0] = e
        finally:
            if client:
                try:
                    client.close()
                except:
                    pass

    def generate(self, prompt: str, sys_prompt: str = None, retry_count: int = 0) -> str:
        if retry_count >= self.max_retries:
            raise RuntimeError(f"Max Hy3 retries ({self.max_retries}) exceeded")

        rb, eb = [None], [None]
        t = threading.Thread(target=self._call, args=(prompt, sys_prompt, rb, eb), daemon=True)
        t.start()
        t.join(timeout=self.timeout)

        if t.is_alive():
            logger.warning(f"Hy3 timeout. Attempt {retry_count + 1}/{self.max_retries}")
            return self.generate(prompt, sys_prompt, retry_count + 1)

        if eb[0]:
            logger.error(f"Hy3 error: {eb[0]}. Attempt {retry_count + 1}/{self.max_retries}")
            time.sleep(2)
            return self.generate(prompt, sys_prompt, retry_count + 1)

        if rb[0] is None:
            return self.generate(prompt, sys_prompt, retry_count + 1)

        try:
            res = rb[0]
            if isinstance(res, (list, tuple)) and len(res) > 0:
                response_text = res[0]
            else:
                response_text = str(res)
            return response_text.strip()
        except Exception as e:
            logger.error(f"Parse error for Hy3: {e}")
            return str(rb[0])
            
    def evaluate_json(self, prompt: str, sys_prompt: str = None, retry_count: int = 0) -> dict:
        raw_text = self.generate(prompt, sys_prompt, retry_count)
        json_str = extract_json_block(raw_text)
        data = repair_json(json_str)
        if data and isinstance(data, dict):
            return data
        try:
            return json.loads(json_str)
        except Exception:
            if retry_count < self.max_retries:
                return self.evaluate_json(prompt, sys_prompt, retry_count + 1)
            raise ValueError("Hy3 failed to return valid JSON.")

class GeminiService(ILLMService):
    def __init__(self):
        self.api_key = getattr(settings, "GEMINI_API_KEY", "") or os.getenv("GEMINI_API_KEY", "")
        self.model_name = getattr(settings, "GEMINI_MODEL_NAME", "gemini-3.1-flash-lite")
        self.base_url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model_name}:generateContent"
        self.timeout = getattr(settings, "LLM_RESPONSE_TIMEOUT", 1080)
        self.max_retries = getattr(settings, "MAX_LLM_RETRIES", 3)

    def _call(self, prompt: str, sys_prompt: str, result_box: list, error_box: list):
        try:
            headers = {'Content-Type': 'application/json'}
            url = f"{self.base_url}?key={self.api_key}"
            
            system_instruction = {"parts": [{"text": sys_prompt}]} if sys_prompt else None
            
            payload = {
                "contents": [
                    {
                        "parts": [
                            {"text": prompt}
                        ]
                    }
                ],
                "generationConfig": {
                    "temperature": 0.7,
                }
            }
            if system_instruction:
                payload["systemInstruction"] = system_instruction
                
            res = requests.post(url, headers=headers, json=payload, timeout=self.timeout)
            if res.status_code != 200:
                error_box[0] = f"HTTP {res.status_code}: {res.text}"
            else:
                result_box[0] = res.json()
        except Exception as e:
            error_box[0] = e

    def generate(self, prompt: str, sys_prompt: str = None, retry_count: int = 0) -> str:
        if retry_count >= self.max_retries:
            raise RuntimeError(f"Max Gemini retries ({self.max_retries}) exceeded")

        rb, eb = [None], [None]
        self._call(prompt, sys_prompt, rb, eb)

        if eb[0]:
            logger.error(f"Gemini error: {eb[0]}. Attempt {retry_count + 1}/{self.max_retries}")
            time.sleep(2)
            return self.generate(prompt, sys_prompt, retry_count + 1)

        if rb[0] is None:
            return self.generate(prompt, sys_prompt, retry_count + 1)

        try:
            data = rb[0]
            text = data['candidates'][0]['content']['parts'][0]['text']
            return text.strip()
        except Exception as e:
            logger.error(f"Parse error for Gemini: {e}")
            return str(rb[0])

    def evaluate_json(self, prompt: str, sys_prompt: str = None, retry_count: int = 0) -> dict:
        raw_text = self.generate(prompt, sys_prompt, retry_count)
        json_str = extract_json_block(raw_text)
        data = repair_json(json_str)
        if data and isinstance(data, dict):
            return data
        try:
            return json.loads(json_str)
        except Exception:
            if retry_count < self.max_retries:
                return self.evaluate_json(prompt, sys_prompt, retry_count + 1)
            raise ValueError("Gemini failed to return valid JSON.")

class QwenOmniService(ILLMService):
    def __init__(self):
        self.model_name = "Qwen/Qwen3.5-Omni-Offline-Demo"
        self.timeout = getattr(settings, "LLM_RESPONSE_TIMEOUT", 1080)
        self.max_retries = getattr(settings, "MAX_LLM_RETRIES", 3)

    def _call(self, prompt: str, sys_prompt: str, result_box: list, error_box: list):
        client = None
        try:
            client = Client(self.model_name)
            client.predict(api_name="/clear_history_offline")
            result = client.predict(
                text=prompt,
                audio=None,
                image=None,
                video=None,
                history=[],
                system_prompt=sys_prompt or "You are a helpful expert. Return accurate responses.",
                temperature=0.7,
                top_p=0.8,
                top_k=20,
                api_name="/chat_predict"
            )
            result_box[0] = result
        except Exception as e:
            error_box[0] = e
        finally:
            if client:
                try:
                    client.close()
                except:
                    pass

    def generate(self, prompt: str, sys_prompt: str = None, retry_count: int = 0) -> str:
        if retry_count >= self.max_retries:
            raise RuntimeError(f"Max Qwen Omni retries ({self.max_retries}) exceeded")

        rb, eb = [None], [None]
        t = threading.Thread(target=self._call, args=(prompt, sys_prompt, rb, eb), daemon=True)
        t.start()
        t.join(timeout=self.timeout)

        if t.is_alive():
            logger.warning(f"Qwen Omni timeout. Attempt {retry_count + 1}/{self.max_retries}")
            return self.generate(prompt, sys_prompt, retry_count + 1)

        if eb[0]:
            logger.error(f"Qwen Omni error: {eb[0]}. Attempt {retry_count + 1}/{self.max_retries}")
            time.sleep(2)
            return self.generate(prompt, sys_prompt, retry_count + 1)

        if rb[0] is None:
            return self.generate(prompt, sys_prompt, retry_count + 1)

        try:
            res = rb[0]
            if isinstance(res, (list, tuple)) and len(res) > 0:
                response_text = res[0]
            else:
                response_text = str(res)
            return response_text.strip()
        except Exception as e:
            logger.error(f"Parse error for Qwen Omni: {e}")
            return str(rb[0])

    def evaluate_json(self, prompt: str, sys_prompt: str = None, retry_count: int = 0) -> dict:
        raw_text = self.generate(prompt, sys_prompt, retry_count)
        json_str = extract_json_block(raw_text)
        data = repair_json(json_str)
        if data and isinstance(data, dict):
            return data
        try:
            return json.loads(json_str)
        except Exception:
            if retry_count < self.max_retries:
                return self.evaluate_json(prompt, sys_prompt, retry_count + 1)
            raise ValueError("Qwen Omni failed to return valid JSON.")

class LLMServiceDispatcher:
    def __init__(self):
        self.primary = TencentHy3Service()
        self.secondary = GeminiService()
        self.tertiary = QwenOmniService()

    @property
    def judge(self) -> ILLMService:
        """Gemini 3.1 Flash Lite as RAGAS Judge (to conserve rate limits on Primary if needed, or because Gemini is better at JSON)"""
        return self.secondary

    def generate(self, prompt: str, sys_prompt: str = None) -> str:
        """
        Generates text using Primary (Tencent Hy3).
        Falls back to Secondary (Gemini) if primary fails.
        Falls back to Tertiary (Qwen Omni) if secondary fails.
        """
        try:
            logger.info("Attempting generation with Primary LLM (Tencent Hy3)...")
            return self.primary.generate(prompt, sys_prompt)
        except Exception as e:
            logger.warning(f"Primary Tencent Hy3 failed: {e}. Falling back to Gemini...")
            try:
                return self.secondary.generate(prompt, sys_prompt)
            except Exception as fe:
                logger.warning(f"Secondary Gemini also failed: {fe}. Falling back to Qwen Omni...")
                try:
                    return self.tertiary.generate(prompt, sys_prompt)
                except Exception as te:
                    logger.error(f"Tertiary Qwen Omni also failed: {te}")
                    raise RuntimeError("All LLM services failed after retries")

llm_service = LLMServiceDispatcher()

