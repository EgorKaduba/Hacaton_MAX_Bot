from sqlalchemy.ext.asyncio import AsyncSession
from ..models.receipt import Receipt
from ..models.service_charge import ServiceCharge
from ..models.meter_info import MeterInfo
from ..models.coefficient import Coefficient
from ..models.recalculation import Recalculation


async def save_parsed_receipt(
    session: AsyncSession,
    user_id: int,
    file_path: str,
    parsed_data: dict,
) -> Receipt:

    period = parsed_data.get("Период", {})
    totals = parsed_data.get("Итого", {})

    receipt = Receipt(
        user_id=user_id,
        period_month=period.get("месяц"),
        period_year=period.get("год"),
        file_path=file_path,
        raw_data=parsed_data,
        total_with_insurance=totals.get("итого_с_страхованием"),
        total_without_insurance=totals.get("итого_без_страхования"),
        status="parsed",
    )
    session.add(receipt)
    await session.flush()

    calc_table = parsed_data.get("Таблица расчета") or {}
    sections = {
        "Начисления за жилищные услуги": "жилищные",
        "Начисления за коммунальные услуги": "коммунальные",
        "Начисления за иные услуги": "иные",
    }
    for section_key, section_name in sections.items():
        for item in calc_table.get(section_key, []):
            session.add(ServiceCharge(
                receipt_id=receipt.id,
                section=section_name,
                service_name=item.get("вид_услуги"),
                volume=item.get("объем_услуг"),
                unit=item.get("ед_изм"),
                tariff=item.get("тариф_руб"),
                amount=item.get("начислено_по_тарифу_руб"),
                benefit=item.get("льгота_руб"),
                recalculation=item.get("перерасчеты_руб"),
                debt_start=item.get("задолженность_на_начало_руб"),
                paid=item.get("оплачено_руб"),
                total=item.get("итого_руб"),
            ))

    for item in parsed_data.get("Справочная информация по лицевому счету", []):
        session.add(MeterInfo(
            receipt_id=receipt.id,
            provider_code=item.get("код_поставщика_услуги"),
            service_name=item.get("вид_услуги"),
            meter_type=item.get("ипу_одпу"),
            meter_number=item.get("номер_ипу_одпу"),
            verification_date=item.get("дата_поверки"),
            previous_reading=item.get("показания_предыдущее"),
            current_reading=item.get("показания_текущее"),
            consumption=item.get("объем_потребления"),
            norm_residential=item.get("норматив_в_жилых"),
            norm_odn=item.get("норматив_на_одн"),
            total_residential=item.get("суммарный_объем_в_жилых"),
            total_odn=item.get("суммарный_объем_на_одн"),
        ))

    for item in parsed_data.get("Повышающие коэффициенты", []):
        session.add(Coefficient(
            receipt_id=receipt.id,
            service_name=item.get("вид_услуги"),
            coefficient=item.get("размер_коэффициента"),
            excess_amount=item.get("размер_превышения_руб"),
        ))

    for item in parsed_data.get("Перерасчеты", []):
        session.add(Recalculation(
            receipt_id=receipt.id,
            service_name=item.get("вид_услуги"),
            reason=item.get("основание"),
            amount=item.get("сумма_руб"),
        ))

    await session.flush()
    return receipt