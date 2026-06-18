from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
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

@app.get("/orders", response_model=List[schemas.OrderResponse])
def get_all_orders(db: Session = Depends(get_db)):
    orders = db.query(models.Order).options(joinedload(models.Order.services)).all()
    return orders

@app.get("/order/{order_id}", response_model=schemas.OrderResponse)
def get_order_by_id(order_id: int, db: Session = Depends(get_db)):
    order = db.query(models.Order).options(joinedload(models.Order.services)).filter(models.Order.id == order_id).first()
    return order

@app.post("/orders", response_model=schemas.OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(order_in: schemas.OrderCreate, db: Session = Depends(get_db)):
    client = db.query(models.User).filter(models.User.id == order_in.client_id).first()

    if not client:
        raise HTTPException(status_code=404, detail="Указанный клиент не найден")
    
    new_order = models.Order(
        device_name=order_in.device_name,
        serial_number=order_in.serial_number,
        issue_description=order_in.issue_description,
        client_id=order_in.client_id,
        status="new"
    )

    db.add(new_order)
    db.flush()

    for service_item in order_in.services:
        db_service = db.query(models.Service).filter(models.Service.id == service_item.service_id).first()
        if not db_service:
            db.rollback()
            raise HTTPException(
                status_code=404, 
                detail=f"Услуга с ID {service_item.service_id} не найдена в прайс-листе"
            )
        new_order_service = models.OrderService(
            order_id=new_order.id,
            service_id=service_item.service_id,
            quantity=service_item.quantity,
            fixed_price=db_service.base_price
        )

        db.add(new_order_service)

    db.commit()

    db.refresh(new_order)

    return db.query(models.Order)\
             .options(joinedload(models.Order.services))\
             .filter(models.Order.id == new_order.id)\
             .first()

@app.patch("/order/{order_id}", response_model=schemas.OrderResponse)
def update_order(order_id: int, order_in: schemas.OrderUpdate, db: Session = Depends(get_db)):
    db_order = db.query(models.Order).filter(models.Order.id == order_id).first()
    
    if not db_order:
        raise HTTPException(status_code=404, detail="Заказ не найден")
    
    update_data = order_in.model_dump(exclude_unset=True, exclude={"services"})

    for key, value in update_data.items():
        setattr(db_order, key, value)

    if order_in.services is not None:
        for service_item in order_in.services:
            db_service = db.query(models.Service).filter(models.Service.id == service_item.service_id).first()

            if not db_service:
                db.rollback()
                raise HTTPException(
                    status_code=404, 
                    detail=f"Услуга с ID {service_item.service_id} не найдена в прайс-листе"
                )
            
            existing_order_service = db.query(models.OrderService).filter(
                models.OrderService.order_id == order_id,
                models.OrderService.service_id == service_item.service_id
            ).first()

            if existing_order_service:
                existing_order_service.quantity += service_item.quantity
            else:
                new_order_service = models.OrderService(
                    order_id=db_order.id,
                    service_id=service_item.service_id,
                    quantity=service_item.quantity,
                    fixed_price=db_service.base_price
                )
                db.add(new_order_service)
            
    db.commit()
    db.refresh(db_order)

    return db.query(models.Order)\
             .options(joinedload(models.Order.services))\
             .filter(models.Order.id == order_id)\
             .first()