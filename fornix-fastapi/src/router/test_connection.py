from fastapi import APIRouter

router = APIRouter()


@router.get("/")
async def test_connection():
    print("Testing connection")
    return {"message": "FornixAI API Server"}
