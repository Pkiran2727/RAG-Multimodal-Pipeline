import tiktoken
from typing import List, Dict, Any
import uuid
import hashlib

MAX_CHUNK_TOKENS = 1000

class ChunkEngine:
    def __init__(self, chunk_size: int = 512, overlap: int = 64, strategy: str = "fixed"):
        self.chunk_size = min(chunk_size, MAX_CHUNK_TOKENS)
        self.overlap = min(overlap, self.chunk_size // 4)
        self.strategy = strategy
        self.enc = tiktoken.get_encoding("cl100k_base")

    def chunk(self, docs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        match self.strategy:
            case "fixed" | "token": return self._fixed(docs)
            case "semantic" | "paragraph": return self._semantic(docs)
            case "per_page":     return self._per_page(docs)
            case "per_item":     return self._per_item(docs)
            case "recursive":    return self._recursive(docs)
            case "sentence":     return self._sentence(docs)
            case "parent_child": return self._parent_child(docs)
            case "sliding_window": return self._fixed(docs)
            case _:             return self._fixed(docs)

    def _create_chunk(self, text: str, metadata: Dict[str, Any], index: int, parent_id: str = None) -> Dict[str, Any]:
        return {
            "id": str(uuid.uuid4()),
            "text": text,
            "token_count": len(self.enc.encode(text)),
            "page": metadata.get("page"),
            "section": metadata.get("section"),
            "chunk_index": index,
            "parent_chunk_id": parent_id,
            "text_hash": hashlib.sha256(text.encode()).hexdigest(),
            "metadata": metadata
        }

    def _fixed(self, docs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        chunks = []
        for doc in docs:
            tokens = self.enc.encode(doc["text"])
            for i in range(0, len(tokens), self.chunk_size - self.overlap):
                chunk_tokens = tokens[i : i + self.chunk_size]
                chunk_text = self.enc.decode(chunk_tokens)
                chunks.append(self._create_chunk(chunk_text, doc["metadata"], len(chunks)))
        return chunks

    def _semantic(self, docs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Uses pre-split sections from parsers (MD/DOCX)."""
        chunks = []
        for doc in docs:
            chunks.append(self._create_chunk(doc["text"], doc["metadata"], len(chunks)))
        return chunks

    def _per_page(self, docs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """One chunk per page metadata."""
        return self._semantic(docs)

    def _per_item(self, docs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """One chunk per item (JSON)."""
        return self._semantic(docs)

    def _recursive(self, docs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Simple recursive splitter using separators."""
        separators = ["\n\n", "\n", ". ", " ", ""]
        chunks = []
        
        def split_text(text: str, metadata: Dict[str, Any]):
            if len(self.enc.encode(text)) <= self.chunk_size:
                chunks.append(self._create_chunk(text, metadata, len(chunks)))
                return

            for sep in separators:
                if sep in text:
                    parts = text.split(sep)
                    # Merging logic could be added here to maximize chunk size
                    for p in parts:
                        if p.strip():
                            split_text(p.strip(), metadata)
                    break

        for doc in docs:
            split_text(doc["text"], doc["metadata"])
        return chunks

    def _parent_child(self, docs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Retrieval on children (small), context from parent (large).
        We return both but tag them.
        """
        all_chunks = []
        parent_size = self.chunk_size
        child_size = parent_size // 4
        
        for doc in docs:
            tokens = self.enc.encode(doc["text"])
            # Create parents
            for i in range(0, len(tokens), parent_size):
                parent_tokens = tokens[i : i + parent_size]
                parent_text = self.enc.decode(parent_tokens)
                parent_chunk = self._create_chunk(parent_text, doc["metadata"], len(all_chunks))
                parent_chunk["metadata"]["is_parent"] = True
                all_chunks.append(parent_chunk)
                
                # Create children for this parent
                for j in range(0, len(parent_tokens), child_size):
                    child_tokens = parent_tokens[j : j + child_size]
                    child_text = self.enc.decode(child_tokens)
                    child_chunk = self._create_chunk(child_text, doc["metadata"], len(all_chunks), parent_chunk["id"])
                    child_chunk["metadata"]["is_parent"] = False
                    all_chunks.append(child_chunk)
                    
        return all_chunks

    def _sentence(self, docs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Simple sentence splitter."""
        import re
        chunks = []
        for doc in docs:
            sentences = re.split(r'(?<=[.!?]) +', doc["text"])
            current_chunk = ""
            for sentence in sentences:
                if len(self.enc.encode(current_chunk + " " + sentence)) <= self.chunk_size:
                    current_chunk += (" " if current_chunk else "") + sentence
                else:
                    if current_chunk:
                        chunks.append(self._create_chunk(current_chunk, doc["metadata"], len(chunks)))
                    current_chunk = sentence
            if current_chunk:
                chunks.append(self._create_chunk(current_chunk, doc["metadata"], len(chunks)))
        return chunks
