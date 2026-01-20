from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional
from datetime import datetime
import uuid

class UserInDB(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    hashed_password: Optional[str] = None
    full_name: str
    google_id: Optional[str] = None
    role: str = "user"  # "admin" or "user"
    is_active: bool = True
    subscription_status: str = "trial"  # "trial", "active", "inactive", "expired"
    subscription_end: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = None
    
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str
    email: EmailStr
    full_name: str
    role: str
    is_active: bool
    subscription_status: str
    created_at: datetime
    last_login: Optional[datetime] = None
