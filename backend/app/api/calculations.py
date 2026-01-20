from fastapi import APIRouter, HTTPException, Depends, status
from app.schemas.calculation import CalculationCreate, CalculationResponse
from app.models.calculation import Calculation
from app.models.user import User
from app.api.auth import get_current_user
from app.core.database import get_database
from typing import List
from datetime import datetime

router = APIRouter()

@router.post("/", response_model=CalculationResponse, status_code=status.HTTP_201_CREATED)
async def save_calculation(
    calculation_data: CalculationCreate,
    current_user: User = Depends(get_current_user)
):
    """Save a calculation to user's history"""
    db = await get_database()
    
    calculation = Calculation(
        user_id=current_user.id,
        calculation_type=calculation_data.calculation_type,
        gds=calculation_data.gds,
        input_data=calculation_data.input_data,
        result=calculation_data.result
    )
    
    calc_dict = calculation.model_dump()
    calc_dict['created_at'] = calc_dict['created_at'].isoformat()
    
    await db.calculations.insert_one(calc_dict)
    
    return CalculationResponse(**calculation.model_dump())

@router.get("/", response_model=List[CalculationResponse])
async def get_calculations(
    calculation_type: str = None,
    limit: int = 50,
    current_user: User = Depends(get_current_user)
):
    """Get user's calculation history"""
    db = await get_database()
    
    query = {"user_id": current_user.id}
    if calculation_type:
        query["calculation_type"] = calculation_type
    
    calculations = await db.calculations.find(query).sort("created_at", -1).limit(limit).to_list(limit)
    
    # Convert ISO strings to datetime
    for calc in calculations:
        if isinstance(calc['created_at'], str):
            calc['created_at'] = datetime.fromisoformat(calc['created_at'])
    
    return [CalculationResponse(**calc) for calc in calculations]

@router.delete("/{calculation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_calculation(
    calculation_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a calculation from history"""
    db = await get_database()
    
    result = await db.calculations.delete_one({
        "id": calculation_id,
        "user_id": current_user.id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Calculation not found"
        )
    
    return None
