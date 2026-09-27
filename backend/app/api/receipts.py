from pathlib import Path

from fastapi import APIRouter, UploadFile, File, HTTPException

from ..deps import SessionDep
from ..schemas.receipt import ReceiptUploadResponse
from ..tools.receipt_service import save_parsed_receipt
from ..tools.parse_epd import parse

from sqlalchemy import select
from ..models.user import User

router = APIRouter(prefix="/receipts", tags=["receipts"])

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


@router.post("/upload", response_model=ReceiptUploadResponse)
async def upload_receipt(
    session: SessionDep,
    file: UploadFile = File(...),
):
    max_user_id = 1

    file_path = UPLOAD_DIR / file.filename
    with open(file_path, "wb") as f:
        f.write(await file.read())

    parsed = parse(str(file_path))
    if parsed.get("status") != 200:
        raise HTTPException(status_code=400, detail=parsed.get("error", "Parse error"))

    user = await session.scalar(
        select(User).where(User.max_user_id == max_user_id)
    )
    if not user:
        user = User(max_user_id=max_user_id)
        session.add(user)
        await session.flush()

    receipt = await save_parsed_receipt(
        session=session,
        user_id=max_user_id,
        file_path=str(file_path),
        parsed_data=parsed["result"],
    )

    return receipt