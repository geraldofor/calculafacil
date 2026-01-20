from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Dict, Any
from datetime import datetime
import uuid

class Calculation(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    calculation_type: str  # 'tarifa', 'conversor', 'reemissao'
    gds: str  # 'amadeus', 'galileo', 'sabre', etc
    input_data: Dict[str, Any]
    result: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
