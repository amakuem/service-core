from sqlalchemy import Column, Integer, String, TIMESTAMP, Numeric, Boolean, TEXT, ForeignKey, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(50), nullable=True)
    last_name = Column(String(100), nullable=True)
    phone = Column(String(15), nullable=True)

    email = Column(String(255), nullable=False, unique=True, index=True)
    password = Column(String(255), nullable=False)

    role = Column(String(10), default="user")

    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

class Service(Base):
    __tablename__ = "services"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), unique=True, nullable=False, index=True)
    description = Column(TEXT, nullable=True)
    base_price = Column(Numeric(10, 2), nullable=True)
    is_active = Column(Boolean, default=True)

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    device_name = Column(String(255), nullable=False)
    serial_number = Column(String(50))

    issue_description = Column(TEXT)
    master_comment = Column(TEXT)

    status = Column(String(30), default="new")

    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())

    client_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    master_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    services = relationship(
        "OrderService", 
        back_populates="order", 
        cascade="all, delete-orphan", 
        passive_deletes=True
    )
    master = relationship("User", foreign_keys=[master_id])

class OrderService(Base):
    __tablename__ = "order_services"

    id = Column(Integer, primary_key=True, index=True)

    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    service_id = Column(Integer, ForeignKey("services.id", ondelete="CASCADE"), nullable=False)

    quantity = Column(Integer, default=1)

    fixed_price = Column(Numeric(10, 2), nullable=False, default=0.00)

    order = relationship("Order", back_populates="services")

class UserActivityLog(Base):
    __tablename__ = "user_activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    action_type = Column(String(50), nullable=False)
    entity_name = Column(String(50), nullable=False)
    entity_id = Column(Integer)

    old_data = Column(JSON, nullable=True)
    new_data = Column(JSON, nullable=True)

    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
