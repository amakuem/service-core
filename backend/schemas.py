from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from decimal import Decimal
from datetime import datetime

class UserBase(BaseModel):
    first_name: Optional[str] = Field(None, max_length=50)
    last_name: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, max_length=15)
    email: EmailStr = Field(...)

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

class UserResponse(UserBase):
    id: int 
    role: str
    created_at: datetime

    class Config:
        from_attributes = True

class ServiceBase(BaseModel):
    name: str = Field(..., max_length=150)
    description: Optional[str]  = Field(None)
    base_price: Decimal = Field(..., ge=0)
    is_active: bool = Field(True)

class ServiceCreate(ServiceBase):
    pass

class ServiceResponse(ServiceBase):
    id: int

    class Config:
        from_attributes = True

class OrderBase(BaseModel):
    device_name: str = Field(..., max_length=255)
    serial_number: Optional[str] = Field(None, max_length=50)

    issue_description: str = Field(...)

class OrderCreate(OrderBase):
    client_id: int = Field(...)

class OrderUpdate(BaseModel):
    status: Optional[str] = Field(None, max_length=30)
    master_comment: Optional[str] = Field(None)

class OrderResponse(OrderBase):
    id: int
    status: str
    master_comment: str
    client_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class UserActivityLogResponse(BaseModel):
    id: int 
    action_type: str
    entity_name: str
    entity_id: Optional[int] = Field(None)

    old_data: Optional[dict] = Field(None)
    new_data: Optional[dict] = Field(None)

    created_at: datetime
    user_id: Optional[int] = Field(None)

    class Config:
        from_attributes = True

