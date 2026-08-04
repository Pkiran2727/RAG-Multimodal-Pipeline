import os
import threading
import time
import logging
import re
import html
from gradio_client import Client
from openai import OpenAI
from ..config import settings
from ..utils.json_utils import extract_json_block, repair_json

logger = logging.getLogger(__name__)

class GLM47Service:
    def __init__(self):
        self.api_key = getattr(settings, "GLM_4_7_API_KEY", None) or os.getenv("GLM_4_7_API_KEY", "04f83efc8d834ad599eedd505aa1a70f.o63P8xs622I2zg2Y")
        self.base_url = getattr(settings, "GLM_BASE_URL", "https://api.z.ai/api/paas/v4/")
        self.model_name = getattr(settings, "GLM_MODEL_NAME", "glm-4.7-Flash")
        self._client = None

    @property
    def client(self):
        if not self._client:
            self._client = OpenAI(
                api_key=self.api_key,
                base_url=self.base_url
            )
        return self._client

    def _call_api(self, prompt: str, sys_prompt: str, result_box: list, error_box: list):
        try:
            default_sys = (
                "You are a highly capable AI assistant. Provide accurate, concise, and fact-based responses. "
                "Always format your responses in valid JSON when requested."
            )
            extra_body = {
                "thinking": {
                    "type": "enabled",
                },
            }
            completion = self.client.chat.completions.create(
                model=self.model_name,
                messages=[
                    {"role": "system", "content": sys_prompt or default_sys},
                    {"role": "user", "content": prompt}
                ],
                stream=False,
                extra_body=extra_body
            )
            raw = completion.choices[0].message.content
            result_box[0] = raw
        except Exception as e:
            error_box[0] = e

    def generate(self, prompt: str, sys_prompt: str = None, retry_count: int = 0) -> str:
        """
        Generate text response from GLM-4.7-Flash with 3 retries.
        """
        max_retries = getattr(settings, "MAX_LLM_RETRIES", 3)
        if retry_count >= max_retries:
            raise RuntimeError(f"Max GLM-4.7-Flash retries ({max_retries}) exceeded")

        rb, eb = [None], [None]
        t = threading.Thread(target=self._call_api, args=(prompt, sys_prompt, rb, eb), daemon=True)
        t.start()
        t.join(timeout=settings.LLM_RESPONSE_TIMEOUT)

        if t.is_alive():
            logger.warning(f"GLM-4.7-Flash timeout. Attempt {retry_count + 1}/{max_retries}")
            return self.generate(prompt, sys_prompt, retry_count + 1)

        if eb[0]:
            logger.error(f"GLM-4.7-Flash error: {eb[0]}. Attempt {retry_count + 1}/{max_retries}")
            time.sleep(2)
            return self.generate(prompt, sys_prompt, retry_count + 1)

        if rb[0] is None:
            return self.generate(prompt, sys_prompt, retry_count + 1)

        raw_text = rb[0].strip()
        json_str = extract_json_block(raw_text)
        data = repair_json(json_str)
        if data and isinstance(data, dict) and 'answer' in data:
            return str(data['answer']).strip()
        return raw_text

    def evaluate_json(self, prompt: str, sys_prompt: str = None, retry_count: int = 0) -> dict:
        """
        Generate structured JSON response (used for RAGAS evaluation) with 3 retries.
        """
        max_retries = getattr(settings, "MAX_LLM_RETRIES", 3)
        if retry_count >= max_retries:
            raise RuntimeError(f"Max GLM-4.7-Flash evaluation retries ({max_retries}) exceeded")

        rb, eb = [None], [None]
        t = threading.Thread(target=self._call_api, args=(prompt, sys_prompt, rb, eb), daemon=True)
        t.start()
        t.join(timeout=settings.LLM_RESPONSE_TIMEOUT)

        if t.is_alive() or eb[0] or rb[0] is None:
            logger.warning(f"GLM-4.7-Flash JSON evaluation attempt {retry_count + 1} failed or timed out: {eb[0]}")
            time.sleep(2)
            return self.evaluate_json(prompt, sys_prompt, retry_count + 1)

        raw_text = rb[0]
        json_str = extract_json_block(raw_text)
        parsed = repair_json(json_str)
        if parsed and isinstance(parsed, dict):
            return parsed
        
        # Fallback to direct json.loads
        try:
            return json.loads(json_str)
        except Exception as pe:
            logger.error(f"Failed to parse GLM evaluation JSON: {pe}")
            return self.evaluate_json(prompt, sys_prompt, retry_count + 1)

class Qwen3Service:
    def __init__(self):
        self.model_name = getattr(settings, "QWEN3_MODEL_NAME", "zai-org/GLM-4.5-Space")
        self._client = None

    @property
    def client(self):
        if not self._client:
            self._client = Client(self.model_name)
        return self._client

    def _call(self, prompt: str, result_box: list, error_box: list):
        try:
            try:
                self.client.predict(api_name="/reset")
            except:
                pass

            sys_prompt = (
                "You are a highly capable RAG assistant. "
                "Provide accurate, concise, and fact-based responses. "
                "ALWAYS wrap your response in a JSON block with the following keys:\n"
                "{\n"
                "  \"thinking\": \"Your internal reasoning process\",\n"
                "  \"answer\": \"Your final formatted answer in markdown\"\n"
                "}\n"
                "Keep the 'thinking' brief and the 'answer' detailed."
            )
            
            result = self.client.predict(
                msg=prompt,
                sys_prompt=sys_prompt,
                thinking_enabled=True,
                temperature=0.1,
                api_name="/chat_wrapper_1"
            )
            result_box[0] = result
        except Exception as e:
            error_box[0] = e

    def generate(self, prompt: str, retry_count: int = 0) -> str:
        """
        Generate response from Qwen with 3 retries max.
        """
        max_retries = getattr(settings, "MAX_LLM_RETRIES", 3)
        if retry_count >= max_retries:
            raise RuntimeError(f"Max Qwen LLM retries ({max_retries}) exceeded")

        rb, eb = [None], [None]
        t = threading.Thread(target=self._call, args=(prompt, rb, eb), daemon=True)
        t.start()
        t.join(timeout=settings.LLM_RESPONSE_TIMEOUT)

        if t.is_alive():
            logger.warning(f"Qwen timeout. Attempt {retry_count + 1}/{max_retries}")
            return self.generate(prompt, retry_count + 1)

        if eb[0]:
            logger.error(f"Qwen error: {eb[0]}. Attempt {retry_count + 1}/{max_retries}")
            time.sleep(2)
            return self.generate(prompt, retry_count + 1)

        if rb[0] is None:
            return self.generate(prompt, retry_count + 1)

        try:
            res = rb[0]
            raw_text = ""
            if isinstance(res, (list, tuple)) and len(res) > 0:
                turn = res[0]
                if isinstance(turn, (list, tuple)) and len(turn) > 1:
                    content_dict = turn[1]
                    if isinstance(content_dict, dict) and 'content' in content_dict:
                        raw_text = content_dict['content']

            if not raw_text:
                raw_text = str(res)

            json_str = extract_json_block(raw_text)
            data = repair_json(json_str)

            if data and isinstance(data, dict) and 'answer' in data:
                return str(data['answer']).strip()
            
            if raw_text:
                return raw_text.strip()
                
            return self.generate(prompt, retry_count + 1)
        except Exception as e:
            logger.error(f"Parse error for Qwen: {e}")
            return str(rb[0])

class LLMServiceDispatcher:
    def __init__(self):
        self.primary = Qwen3Service()
        self.backup = GLM47Service()

    @property
    def judge(self) -> GLM47Service:
        """GLM-4.7-Flash as RAGAS Judge"""
        return self.backup

    def generate(self, prompt: str) -> str:
        """
        Generates text using Primary (Qwen with 3 retries).
        Falls back to Backup (GLM-4.7-Flash with 3 retries) if primary fails.
        """
        try:
            logger.info("Attempting generation with Primary LLM (Qwen)...")
            return self.primary.generate(prompt)
        except Exception as e:
            logger.warning(f"Primary LLM failed: {e}. Falling back to Backup LLM (GLM-4.7-Flash)...")
            try:
                return self.backup.generate(prompt)
            except Exception as fe:
                logger.error(f"Backup LLM (GLM-4.7-Flash) also failed: {fe}")
                raise RuntimeError("All LLM services (Primary Qwen & Backup GLM-4.7-Flash) failed after retries")

llm_service = LLMServiceDispatcher()

