import json
import re
from pathlib import Path
from typing import List, Dict, Any
from docx import Document
from .ocr_service import ocr_service
from .vision_service import vision_service
import logging

logger = logging.getLogger(__name__)

async def parse_file(file_path: str, file_type: str, job_id: str, ws_manager: Any, user_id: str) -> List[Dict[str, Any]]:
    """
    Dispatcher for all file types.
    Returns: [{"text": str, "metadata": {"source", "page", "section"}}]
    """
    match file_type.lower():
        case "pdf":
            return await _parse_pdf(file_path, job_id, ws_manager, user_id)
        case "jpg" | "jpeg" | "png":
            return await _parse_image(file_path, job_id, ws_manager, user_id)
        case "docx":
            return _parse_docx(file_path)
        case "txt":
            return _parse_txt(file_path)
        case "md":
            return _parse_markdown(file_path)
        case "json":
            return _parse_json(file_path)
        case _:
            logger.warning(f"Unsupported file type: {file_type}")
            return []

async def _parse_pdf(file_path: str, job_id: str, ws_manager: Any, user_id: str):
    try:
        await ws_manager.emit(job_id, user_id, {"step": "OCR_START", "color": "#8B5CF6", "detail": "Sending to Mistral OCR (Primary)..."})
        results = await ocr_service.perform_ocr(file_path)
        return [{"text": results['plain_text'], "metadata": {"source": Path(file_path).name, "page": 1}}]
    except Exception as e:
        logger.warning(f"Mistral OCR failed, falling back to PyMuPDF: {e}")
        await ws_manager.emit(job_id, user_id, {"step": "FALLBACK", "color": "#F59E0B", "detail": "Mistral failed. Falling back to PyMuPDF..."})
        import fitz  # PyMuPDF
        doc = fitz.open(file_path)
        text = ""
        for page in doc:
            text += page.get_text()
        return [{"text": text, "metadata": {"source": Path(file_path).name, "page": 1}}]

async def _parse_image(file_path: str, job_id: str, ws_manager: Any, user_id: str):
    try:
        await ws_manager.emit(job_id, user_id, {"step": "IMAGE_ANALYZE", "color": "#8B5CF6", "detail": "Qwen-VL analyzing image (Primary)..."})
        description = vision_service.understand_image(file_path)
        return [{"text": description, "metadata": {"source": Path(file_path).name, "page": 1}}]
    except Exception as e:
        logger.warning(f"Vision service failed, falling back to Tesseract: {e}")
        await ws_manager.emit(job_id, user_id, {"step": "FALLBACK", "color": "#F59E0B", "detail": "Vision failed. Falling back to Tesseract OCR..."})
        import pytesseract
        from PIL import Image
        text = pytesseract.image_to_string(Image.open(file_path))
        return [{"text": text, "metadata": {"source": Path(file_path).name, "page": 1}}]

def _parse_docx(file_path: str):
    doc = Document(file_path)
    sections, current_heading, current_text = [], "General", []
    for para in doc.paragraphs:
        if para.style.name.startswith('Heading'):
            if current_text:
                sections.append({"text": "\n".join(current_text), "metadata": {"source": Path(file_path).name, "section": current_heading}})
            current_heading, current_text = para.text, []
        elif para.text.strip():
            current_text.append(para.text)
    if current_text:
        sections.append({"text": "\n".join(current_text), "metadata": {"source": Path(file_path).name, "section": current_heading}})
    return sections

def _parse_markdown(file_path: str):
    text = Path(file_path).read_text(encoding="utf-8")
    parts = re.split(r'\n(?=#+\s)', text)
    docs = []
    for p in parts:
        if not p.strip(): continue
        match = re.match(r'^#+\s+(.*)', p)
        section = match.group(1) if match else "General"
        docs.append({"text": p.strip(), "metadata": {"source": Path(file_path).name, "section": section}})
    return docs

def _parse_txt(file_path: str):
    text = Path(file_path).read_text(encoding="utf-8")
    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
    return [{"text": p, "metadata": {"source": Path(file_path).name}} for p in paragraphs]

def _parse_json(file_path: str):
    data = json.loads(Path(file_path).read_text())
    docs = []
    
    # If it's a list, treat each item as a doc
    if isinstance(data, list):
        items = data
    # If it's a dict, treat each top-level key-value pair as a doc
    elif isinstance(data, dict):
        items = [{"key": k, "value": v} for k, v in data.items()]
    else:
        items = [data]

    for item in items:
        if isinstance(item, (dict, list)):
            text = json.dumps(item, indent=2)
        else:
            text = str(item)
            
        if text.strip():
            docs.append({"text": text, "metadata": {"source": Path(file_path).name}})
    
    return docs
