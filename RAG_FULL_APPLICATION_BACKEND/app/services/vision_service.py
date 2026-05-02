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
        try:
            # Check if file exists and is not empty to avoid crash
            import os
            if not os.path.exists(image_path) or os.path.getsize(image_path) == 0:
                return ""

            self.client.predict(api_name="/clear_conversation_history")
            file_arg = [handle_file(image_path)]
            prompt = "Please describe the contents of this image in detail."

            result = self.client.predict(
                input_value={"files": file_arg, "text": prompt},
                api_name="/add_message"
            )
            response_text = result[1]['value'][1]['content'][0]['content']
            return str(response_text)
        except Exception as e:
            logger.error(f"Image understanding failed: {e}")
            return "Failed to understand image."

vision_service = VisionService()
