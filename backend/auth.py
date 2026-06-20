from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from database import get_db  
import models  
import schemas  
from auth_utils import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(models.User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пользователь с таким email уже зарегистрирован"
        )
    
    hashed_pwd = hash_password(user_data.password)

    db_user = models.User(
        email=user_data.email,
        password=hashed_pwd,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        phone=user_data.phone
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return db_user

@router.post("/token")
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()

    if not user or not verify_password(form_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный email или пароль",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": user.email})

    return {
        "access_token": access_token, 
        "token_type": "bearer"
    }