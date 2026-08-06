from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from ..utils.auth_utils import verify_password, get_password_hash, create_access_token
from ..services.supabase_client import supabase_service
from ..models.schemas import UserCreate, Token, UserResponse
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/register", response_model=UserResponse)
async def register(user: UserCreate):
    # Hash password
    hashed = get_password_hash(user.password)
    
    # Store in Supabase
    try:
        result = supabase_service.client.table("users").insert({
            "username": user.username,
            "password_hash": hashed
        }).execute()
        return result.data[0]
    except Exception as e:
        logger.error(f"Registration failed: {e}")
        raise HTTPException(status_code=400, detail="User already exists")

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    # Fetch user from Supabase
    result = supabase_service.client.table("users")\
        .select("*")\
        .eq("username", form_data.username).execute()
    
    if not result.data:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user = result.data[0]
    if not verify_password(form_data.password, user["password_hash"]):
        logger.warning(f"Login failed for user: {form_data.username} - password mismatch")
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    logger.info(f"User logged in: {form_data.username}")
    # Create token
    access_token = create_access_token(data={"sub": user["username"], "id": user["id"]})
    return {"access_token": access_token, "token_type": "bearer"}

