import threading
import time
import logging
from gradio_client import Client
from ..config import settings
from ..utils.json_utils import extract_json_block, repair_json

logger = logging.getLogger(__name__)

class Qwen3Service:
    def __init__(self):
        # LLM — GLM-4.5 (zai-org/GLM-4.5-Space)
        self.model_name = "zai-org/GLM-4.5-Space"
        self._client = None

    @property
    def client(self):
        if not self._client:
            self._client = Client(self.model_name)
        return self._client

    def _call(self, prompt: str, result_box: list, error_box: list):
        try:
            # zai-org/GLM-4.5-Space
            # 1. Reset
            try:
                self.client.predict(api_name="/reset")
            except:
                pass

            # 2. Predict with JSON instruction
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
                temperature=0.1, # Low for RAG
                api_name="/chat_wrapper_1"
            )
            result_box[0] = result
        except Exception as e:
            error_box[0] = e

    def generate(self, prompt: str, retry_count: int = 0) -> str:
        """
        Generate response from GLM-4.5 with retry logic and timeout.
        Returns the 'answer' part of the JSON response.
        """
        if retry_count >= settings.MAX_LLM_RETRIES:
            raise RuntimeError("Max LLM retries exceeded")

        rb, eb = [None], [None]
        t = threading.Thread(target=self._call, args=(prompt, rb, eb), daemon=True)
        t.start()
        t.join(timeout=settings.LLM_RESPONSE_TIMEOUT)

        if t.is_alive():
            logger.warning(f"GLM-4.5 timeout. Attempt {retry_count + 1}")
            return self.generate(prompt, retry_count + 1)

        if eb[0]:
            logger.error(f"GLM-4.5 error: {eb[0]}. Attempt {retry_count + 1}")
            time.sleep(2)
            return self.generate(prompt, retry_count + 1)

        if rb[0] is None:
            return self.generate(prompt, retry_count + 1)

        # Parse GLM output and extract JSON
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

            # Extract JSON block
            json_str = extract_json_block(raw_text)
            data = repair_json(json_str)

            if data and isinstance(data, dict) and 'answer' in data:
                return data['answer'].strip()
            
            # Fallback to raw text if JSON parsing fails but contains text
            if raw_text:
                return raw_text.strip()
                
            return self.generate(prompt, retry_count + 1)
        except Exception as e:
            logger.error(f"Parse error for GLM-4.5: {e}")
            return str(rb[0])

class MiniMaxService:
    def __init__(self):
        self.model_name = "MiniMaxAI/MiniMax-VL-01"
        self._client = None

    @property
    def client(self):
        if not self._client:
            self._client = Client(self.model_name)
        return self._client

    def _call(self, prompt: str, result_box: list, error_box: list):
        try:
            # MiniMax-VL-01 implementation
            result = self.client.predict(
                message={"text": prompt, "files": []},
                max_tokens=1000000,
                temperature=0.1,
                top_p=0.9,
                api_name="/chat"
            )
            result_box[0] = result
        except Exception as e:
            error_box[0] = e

    def generate(self, prompt: str, retry_count: int = 0) -> str:
        if retry_count >= 3: # Fewer retries for fallback
            raise RuntimeError("MiniMax fallback failed")

        rb, eb = [None], [None]
        t = threading.Thread(target=self._call, args=(prompt, rb, eb), daemon=True)
        t.start()
        t.join(timeout=settings.LLM_RESPONSE_TIMEOUT)

        if t.is_alive() or eb[0] or rb[0] is None:
            time.sleep(2)
            return self.generate(prompt, retry_count + 1)

        try:
            raw_text = rb[0]
            json_str = extract_json_block(raw_text)
            data = repair_json(json_str)
            if data and isinstance(data, dict) and 'answer' in data:
                return data['answer'].strip()
            return raw_text.strip()
        except Exception as e:
            logger.error(f"Parse error for MiniMax: {e}")
            return str(rb[0])

class LLMServiceDispatcher:
    def __init__(self):
        self.primary = Qwen3Service()
        self.fallback = MiniMaxService()

    def generate(self, prompt: str) -> str:
        try:
            logger.info("Attempting generation with Primary (GLM-4.5)...")
            return self.primary.generate(prompt)
        except Exception as e:
            logger.warning(f"Primary LLM failed: {e}. Falling back to MiniMax...")
            try:
                return self.fallback.generate(prompt)
            except Exception as fe:
                logger.error(f"Fallback LLM also failed: {fe}")
                raise RuntimeError("All LLM services failed")

llm_service = LLMServiceDispatcher()
