import re
import json
import json_repair
import threading
import html
from typing import Any, Dict, Tuple, Optional
import logging

logger = logging.getLogger(__name__)

def repair_json_with_module(json_content: str) -> Optional[Any]:
    result_container = [None]
    exception_container = [None]
    
    def repair_thread():
        try:
            result_container[0] = json_repair.loads(json_content)
        except Exception as e:
            exception_container[0] = e
            
    thread = threading.Thread(target=repair_thread)
    thread.daemon = True
    thread.start()
    thread.join(timeout=10)
    
    if thread.is_alive():
        logger.warning("TIMEOUT: JSON repair took longer than 10 seconds")
        return None
    if exception_container[0]:
        logger.warning(f"JSON repair failed: {exception_container[0]}")
        return None
    return result_container[0]

def extract_json_block(response_text: str) -> str:
    """Extracts JSON block from response text intelligently."""
    # 1. Look for ```json ... ```
    match = re.search(r"```json\s*([\s\S]*?)\s*```", response_text, re.IGNORECASE)
    if match:
        return match.group(1).strip()
    
    # 2. Look for ``` ... ``` (optional json tag)
    match = re.search(r"```\s*(?:json)?\s*([\s\S]*?)\s*```", response_text, re.IGNORECASE)
    if match:
        candidate = match.group(1).strip()
        if candidate.lower().startswith('json'):
            candidate = candidate[4:].strip()
        return candidate
    
    # 3. Look for **Answer**: ...
    answer_match = re.search(r'\*\*Answer\*\*:\s*([\s\S]*)', response_text, re.IGNORECASE)
    if answer_match:
        return answer_match.group(1).strip()
    
    # 4. Fallback to finding first { and last }
    first_brace = response_text.find('{')
    last_brace = response_text.rfind('}')
    if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
        return response_text[first_brace:last_brace + 1]
        
    return response_text.strip()

def repair_json(json_str: str) -> Optional[Dict[str, Any]]:
    """Combines extraction, cleaning and repair."""
    try:
        # Clean HTML entities and tags
        json_str = html.unescape(json_str)
        json_str = re.sub(r"<br\s*/?>", "\n", json_str)
        json_str = json_str.strip()
        
        # Try standard parse
        try:
            return json.loads(json_str)
        except:
            pass
            
        # Try repair
        return repair_json_with_module(json_str)
    except Exception as e:
        logger.error(f"Ultimate JSON repair failed: {e}")
        return None
