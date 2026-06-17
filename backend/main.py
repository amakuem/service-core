from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db, engine
from typing import List
import models
import schemas

app = FastAPI(title="Сервисный Центр API")

@app.get("/")
async def root():
    return {"message": "Hello, World!"}

@app.get("/test-db")
def test_database_connectiono(db: Session = Depends(get_db)):
    try:
        result = db.execute(text("select 1")).fetchone()
        
        if result:
            return {"status": "success", "message": "Подключение к базе данных успешно установлено!"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка подключения к БД: {str(e)}")

@app.get("/users", response_model=List[schemas.UserResponse])
def get_all_users(db: Session = Depends(get_db)):
    users = db.query(models.User).all()

    return users

@app.get("/user/{user_id}", response_model=schemas.UserResponse)
def get_user_by_id(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail=f"Пользователь с id {user_id} не найден")

    return user

@app.post("/users", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(models.User.email == user_in.email).first()

    if existing_user:
        raise HTTPException(status_code=400, detail="Этот email уже зарегистрирован")
    
    new_user = models.User(
        first_name=user_in.first_name,
        last_name=user_in.last_name,
        phone=user_in.phone,
        email=user_in.email,
        password=user_in.password,
        role='user'
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user

@app.patch("/user/{user_id}", response_model=schemas.UserResponse)
def update_user(user_id: int, user_in: schemas.UserUpdate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    update_data = user_in.model_dump(exclude_unset=True)
    
    if "email" in update_data:
        exsisting_email = db.query(models.User).filter(models.User.email == update_data["email"], models.User.id != user_id).first()
        if exsisting_email:
            raise HTTPException(status_code=400, detail="Этот email уже занят другим пользователем")
        
    for key, value in update_data.items():
        setattr(db_user, key, value)

    db.commit()
    db.refresh(db_user)

    return db_user

@app.get("/services", response_model=List[schemas.ServiceResponse])
def get_all_services(db: Session = Depends(get_db)):
    services = db.query(models.Service).all()
    return services

@app.get("/service/{service_id}", response_model=schemas.ServiceResponse)
def get_service_by_id(service_id: int, db: Session = Depends(get_db)):
    service = db.query(models.Service).filter(models.Service.id == service_id).first()
    return service

@app.post("/services", response_model=schemas.ServiceResponse, status_code=status.HTTP_201_CREATED)
def create_service(service_in: schemas.ServiceCreate, db: Session = Depends(get_db)):
    existing_service = db.query(models.Service).filter(models.Service.name == service_in.name).first()

    if existing_service:
        raise HTTPException(status_code=400, detail="Этот сервис уже зарегистрирован")
    
    new_service = models.Service(
        name=service_in.name,
        description=service_in.description,
        base_price=service_in.base_price,
    )

    db.add(new_service)
    db.commit()
    db.refresh(new_service)

    return new_service

@app.patch("/service/{service_id}", response_model=schemas.ServiceResponse)
def update_service(service_id: int, service_in: schemas.ServiceUpdate, db: Session = Depends(get_db)):
    db_service = db.query(models.Service).filter(models.Service.id == service_id).first()

    if not db_service:
        raise HTTPException(status_code=404, detail="Сервис не найден")
    
    update_data = service_in.model_dump(exclude_unset=True)

    if "name" in update_data:
        exsisting_name = db.query(models.Service).filter(models.Service.name == update_data["name"], models.Service.id != service_id).first()
        if exsisting_name:
            raise HTTPException(status_code=400, detail="Этот сервис уже есть")
    
    for key, value in update_data.items():
        setattr(db_service, key, value)

    db.commit()
    db.refresh(db_service)

    return db_service

