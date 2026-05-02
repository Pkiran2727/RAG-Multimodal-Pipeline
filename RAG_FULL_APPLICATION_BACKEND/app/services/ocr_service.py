import logging
from gradio_client import Client, handle_file
from ..config import settings

logger = logging.getLogger(__name__)

class OCRService:
    def __init__(self):
        # The Mistral OCR space tatendachirume/Mistral-OCR
        self.space_name = settings.MISTRAL_OCR_SPACE
        self._client = None
        
    @property
    def client(self):
        if not self._client:
            self._client = Client(self.space_name)
        return self._client

    async def perform_ocr(self, file_path: str) -> dict:
        """
        Send file to Mistral OCR HF Space.
        Returns: {"plain_text": str, "markdown": str}
        """
        try:
            # Mistral OCR usually takes a file and returns OCR results
            # Assuming standard api_name="/process" or similar
            result = self.client.predict(
                "Upload file",  # input_type
                "",             # url (required but empty for upload)
                handle_file(file_path), # file
                "5gBKNRNZY2YllB6goe6OX0ycXdzbHS76", # api_key (default from view_api)
                api_name="/do_ocr"
            )
            
            # Format: [text, gallery_list]
            return {
                "plain_text": result[0] if isinstance(result, (list, tuple)) else str(result),
                "markdown_text": result[0] if isinstance(result, (list, tuple)) else str(result)
            }
        except Exception as e:
            logger.error(f"Mistral OCR failed: {e}")
            return {"plain_text": "", "markdown_text": ""}

ocr_service = OCRService()
