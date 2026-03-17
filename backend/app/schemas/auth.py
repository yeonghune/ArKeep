from pydantic import BaseModel


class GoogleLoginRequest(BaseModel):
    idToken: str


class AuthResponse(BaseModel):
    token: str
    email: str  # 실제로는 Google providerUserId (sub), 이름 quirk 유지


class ApiMessage(BaseModel):
    message: str


class MyProfileResponse(BaseModel):
    userId: str
    displayName: str | None
    avatarUrl: str | None
