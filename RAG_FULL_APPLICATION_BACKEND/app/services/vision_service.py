import logging
from gradio_client import Client, handle_file
from ..config import settings

logger = logging.getLogger(__name__)

class VisionService:
    def __init__(self):
        # Changed to Qwen3-VL-30B-A3B-Demo per user request
        self.space_url = settings.VISION_SPACE_URL
        self._client = None

    @property
    def client(self):
        if not self._client:
            self._client = Client(self.space_url)
        return self._client

    def understand_image(self, image_path: str) -> str:
        """
        Send image to Qwen-VL HF Space for description.
        """
        import os
        if not os.path.exists(image_path) or os.path.getsize(image_path) == 0:
            return ""

        try:
            self.client.predict(api_name="/clear_conversation_history")
            file_arg = [handle_file(image_path)]
            prompt = "Please describe the contents of this image in detail, including all visible text, objects, and layout."

            result = self.client.predict(
                input_value={"files": file_arg, "text": prompt},
                api_name="/add_message"
            )
            response_text = result[1]['value'][1]['content'][0]['content']
            if response_text and str(response_text).strip():
                return str(response_text).strip()
            raise ValueError("Empty response from vision space")
        except Exception as e:
            logger.warning(f"Image understanding via space failed: {e}")
            raise

vision_service = VisionService()
