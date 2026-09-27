from pathlib import Path
import uuid

from fastapi import APIRouter, UploadFile, File, HTTPException, status

from ..deps import SessionDep
from ..models import Receipt, CheckResult
from ..schemas.receipt import ReceiptUploadResponse, ReceiptsListItem, ReceiptDetailResponse
from ..schemas.check_result import ErrorsResponse
from ..tools.receipt_service import save_parsed_receipt
from ..tools.parse_epd import parse
from ..tools.errors_check import check_receipt

from sqlalchemy import select
from sqlalchemy.orm import selectinload
from ..models.user import User

router = APIRouter(prefix="/receipts", tags=["receipts"])

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


@router.post(
    "/upload/{max_user_id}",
    response_model=ReceiptUploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Загрузка файла квитанции"
)
async def upload_receipt(
        max_user_id: int,
        session: SessionDep,
        file: UploadFile = File(...)
):
    file_name = f"{uuid.uuid4()}.pdf"
    file_path = UPLOAD_DIR / file_name
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
        user_id=user.id,  # type: ignore[arg-type]
        file_path=str(file_path),
        parsed_data=parsed["result"],
    )

    return receipt


@router.get(
    "/user/{max_user_id}",
    response_model=list[ReceiptsListItem],
    summary="Получить список квитанций пользователя"
)
async def get_receipt(
        session: SessionDep,
        max_user_id: int):
    user = await session.scalar(
        select(User).where(User.max_user_id == max_user_id)
    )
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    receipts = await session.scalars(
        select(Receipt).where(Receipt.user_id == user.id).order_by(Receipt.created_at.desc())
    )
    return receipts.all()


@router.get(
    "/{receipt_id}",
    response_model=ReceiptDetailResponse,
    summary="Получить квитанцию по id"
)
async def get_receipt(
        session: SessionDep,
        receipt_id: int
):
    receipt = await session.scalar(
        select(Receipt).where(Receipt.id == receipt_id)
        .options(
            selectinload(Receipt.service_charges),
            selectinload(Receipt.meter_infos),
            selectinload(Receipt.coefficients),
            selectinload(Receipt.recalculations)
        )
    )

    if not receipt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Receipt not found")
    return receipt


@router.post(
    "/check/{receipt_id}",
    response_model=ErrorsResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Проверка квитанции на ошибки"
)
async def check_receipt_endpoint(
        receipt_id: int,
        session: SessionDep
):
    receipt = await session.scalar(
        select(Receipt).where(Receipt.id == receipt_id).
        options(selectinload(Receipt.service_charges))
    )

    if not receipt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Receipt not found")

    check_result = await session.scalar(select(CheckResult).where(CheckResult.receipt_id == receipt_id))

    if check_result:
        return check_result

    result = check_receipt(receipt)

    session.add(result)

    receipt.status = "checked"
    await session.flush()

    return result
