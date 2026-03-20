from pydantic import BaseModel


class GoogleLoginRequest(BaseModel):
    idToken: str


class AuthResponse(BaseModel):
    token: str
    email: str  # 실제 Google 이메일


class ApiMessage(BaseModel):
    message: str


class MyProfileResponse(BaseModel):
    userId: str
    displayName: str | None
    avatarUrl: str | None
