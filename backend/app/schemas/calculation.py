from pydantic import BaseModel
from typing import Dict, Any, Optional
from datetime import datetime

class CalculationCreate(BaseModel):
    calculation_type: str  # 'tarifa', 'conversor', 'reemissao'
    gds: str
    input_data: Dict[str, Any]
    result: str

class CalculationResponse(BaseModel):
    id: str
    user_id: str
    calculation_type: str
    gds: str
    input_data: Dict[str, Any]
    result: str
    created_at: datetime
