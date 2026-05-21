from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class UserCreate(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: str
    username: str

class Token(BaseModel):
    access_token: str
    token_type: str

class QueryRequest(BaseModel):
    query: str
    document_id: str
    technique: str = "hybrid"
    top_k: int = 5
    filters: Optional[Dict[str, Any]] = None

class QueryResponse(BaseModel):
    answer: str
    sources: List[Dict[str, Any]]
    job_id: str
