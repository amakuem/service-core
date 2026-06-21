from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional
from decimal import Decimal
from datetime import datetime
import re

class UserBase(BaseModel):
    first_name: Optional[str] = Field(None, max_length=50)
    last_name: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None)
    email: EmailStr = Field(...)

    @field_validator('phone')
    @classmethod 
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        
        clean_phone = re.sub(r'[^\d+]', '', v)
        if clean_phone.startswith('80') and len(clean_phone) == 11:
            clean_phone = '+375' + clean_phone[2:]
            
        if clean_phone.startswith('375') and len(clean_phone) == 12:
            clean_phone = '+' + clean_phone

        if not re.match(r'^\+375(25|29|33|44|17)\d{7}$', clean_phone):
            raise ValueError(
                'Неверный формат номера. Используйте +375 (XX) XXX-XX-XX или 80 (XX) XXX-XX-XX'
            )
            
        return clean_phone

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

class UserUpdate(BaseModel):
    first_name: Optional[str] = Field(None, max_length=50)
    last_name: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None)  
    email: Optional[EmailStr] = Field(None)

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

class ServiceUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=150)
    description: Optional[str] = Field(None)
    base_price : Optional[Decimal] = Field(None, ge=0)
    is_active: Optional[bool] = Field(None)

class ServiceResponse(ServiceBase):
    id: int

    class Config:
        from_attributes = True

class OrderServiceCreate(BaseModel):
    service_id: int = Field(...)
    quantity: int = Field(1, ge=1)

class OrderServiceResponse(BaseModel):
    id: int
    service_id: int
    fixed_price: Decimal
    quantity: int

    class Config:
        from_attributes = True

class OrderBase(BaseModel):
    device_name: str = Field(..., max_length=255)
    serial_number: Optional[str] = Field(None, max_length=50)

    issue_description: str = Field(...)

class OrderCreate(OrderBase):
    client_id: int = Field(...)
    services: list[OrderServiceCreate] = []

class OrderUpdate(BaseModel):
    status: Optional[str] = Field(None, max_length=30)
    master_comment: Optional[str] = Field(None)
    services: Optional[list[OrderServiceCreate]] = Field(None)
    

class OrderResponse(OrderBase):
    id: int
    status: str
    master_comment: Optional[str] = None
    client_id: int
    master_id: Optional[int] = None
    master_name: Optional[str] = None
    master_last_name: Optional[str] = None
    services: list[OrderServiceResponse] = []
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

