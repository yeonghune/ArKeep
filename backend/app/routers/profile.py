from fastapi import APIRouter, Depends

from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.auth import MyProfileResponse

router = APIRouter(tags=["profile"])


@router.get("/me", response_model=MyProfileResponse)
async def get_profile(current_user: User = Depends(get_current_user)) -> MyProfileResponse:
    display_name = current_user.display_name
    if not display_name or not display_name.strip():
        display_name = current_user.email or current_user.provider_user_id
    return MyProfileResponse(
        userId=current_user.provider_user_id,
        displayName=display_name,
        avatarUrl=current_user.avatar_url,
    )
