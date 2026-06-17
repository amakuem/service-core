from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db

app = FastAPI()

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
