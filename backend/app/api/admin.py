from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.models.user import User, UserInDB
from app.schemas.user import UserResponse
from app.api.auth import get_current_user
from app.core.database import get_database
from typing import List
from datetime import datetime

router = APIRouter()
security = HTTPBearer()

async def get_current_admin(current_user: User = Depends(get_current_user)):
    """Dependency to check if user is admin"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Admin privileges required."
        )
    return current_user

@router.get("/users", response_model=List[UserResponse])
async def get_all_users(
    skip: int = 0,
    limit: int = 100,
    admin: User = Depends(get_current_admin)
):
    """Get all users (admin only)"""
    db = await get_database()
    
    users = await db.users.find({}, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    
    # Convert ISO strings to datetime
    for user in users:
        if isinstance(user.get('created_at'), str):
            user['created_at'] = datetime.fromisoformat(user['created_at'])
        if isinstance(user.get('last_login'), str):
            user['last_login'] = datetime.fromisoformat(user['last_login'])
        if isinstance(user.get('subscription_end'), str):
            user['subscription_end'] = datetime.fromisoformat(user['subscription_end'])
    
    return [UserResponse(**user) for user in users]

@router.get("/stats")
async def get_stats(admin: User = Depends(get_current_admin)):
    """Get system statistics (admin only)"""
    db = await get_database()
    
    total_users = await db.users.count_documents({})
    active_users = await db.users.count_documents({"is_active": True})
    admin_users = await db.users.count_documents({"role": "admin"})
    
    # Subscription stats
    trial_users = await db.users.count_documents({"subscription_status": "trial"})
    active_subs = await db.users.count_documents({"subscription_status": "active"})
    inactive_subs = await db.users.count_documents({"subscription_status": "inactive"})
    
    # Calculation stats
    total_calculations = await db.calculations.count_documents({})
    
    # Get recent users (last 7 days)
    from datetime import timedelta
    week_ago = datetime.utcnow() - timedelta(days=7)
    recent_users = await db.users.count_documents({
        "created_at": {"$gte": week_ago.isoformat()}
    })
    
    # Calculations by type
    tarifa_count = await db.calculations.count_documents({"calculation_type": "tarifa"})
    conversor_count = await db.calculations.count_documents({"calculation_type": "conversor"})
    reemissao_count = await db.calculations.count_documents({"calculation_type": "reemissao"})
    
    return {
        "users": {
            "total": total_users,
            "active": active_users,
            "admins": admin_users,
            "recent_7_days": recent_users
        },
        "subscriptions": {
            "trial": trial_users,
            "active": active_subs,
            "inactive": inactive_subs
        },
        "calculations": {
            "total": total_calculations,
            "tarifa": tarifa_count,
            "conversor": conversor_count,
            "reemissao": reemissao_count
        }
    }

@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    admin: User = Depends(get_current_admin)
):
    """Get specific user details (admin only)"""
    db = await get_database()
    
    user_doc = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Convert ISO strings
    if isinstance(user_doc.get('created_at'), str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    if isinstance(user_doc.get('last_login'), str):
        user_doc['last_login'] = datetime.fromisoformat(user_doc['last_login'])
    
    return UserResponse(**user_doc)

@router.patch("/users/{user_id}")
async def update_user(
    user_id: str,
    is_active: bool = None,
    subscription_status: str = None,
    role: str = None,
    admin: User = Depends(get_current_admin)
):
    """Update user (admin only)"""
    db = await get_database()
    
    update_data = {"updated_at": datetime.utcnow().isoformat()}
    
    if is_active is not None:
        update_data["is_active"] = is_active
    if subscription_status is not None:
        update_data["subscription_status"] = subscription_status
    if role is not None:
        update_data["role"] = role
    
    result = await db.users.update_one(
        {"id": user_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return {"message": "User updated successfully"}

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    admin: User = Depends(get_current_admin)
):
    """Delete user (admin only)"""
    db = await get_database()
    
    # Don't allow deleting yourself
    if user_id == admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
    
    result = await db.users.delete_one({"id": user_id})
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Also delete user's calculations
    await db.calculations.delete_many({"user_id": user_id})
    
    return {"message": "User deleted successfully"}

@router.get("/users/{user_id}/calculations")
async def get_user_calculations(
    user_id: str,
    limit: int = 50,
    admin: User = Depends(get_current_admin)
):
    """Get user's calculations (admin only)"""
    db = await get_database()
    
    calculations = await db.calculations.find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    return {
        "user_id": user_id,
        "total": len(calculations),
        "calculations": calculations
    }
