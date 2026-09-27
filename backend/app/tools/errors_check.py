from ..models.receipt import Receipt
from ..models.check_result import CheckResult
from datetime import datetime


def find_total_arithmetic_error(receipt: Receipt) -> list[dict]:
    if not receipt.service_charges:
        return []

    total_rows_sum = sum(float(row.total) for row in receipt.service_charges if
                         row.total is not None and row.service_name != "ДОБРОВОЛЬНОЕ СТРАХОВАНИЕ")

    total_without_insurance = float(receipt.total_without_insurance)

    if abs(total_rows_sum - total_without_insurance) >= 1:
        return [{
            "type": "arithmetic",
            "severity": "high",
            "description": "Сумма по услугам не совпадает с итоговой суммой квитанции",
            "actual": total_without_insurance,
            "expected": total_rows_sum
        }]

    return []


def find_duplicates(receipt: Receipt) -> list[dict]:
    errors = []
    seen = set()
    for sc in receipt.service_charges:
        key = (sc.section, sc.service_name)
        if key in seen and sc.service_name:
            errors.append({
                "type": "duplicate_service",
                "severity": "medium",
                "description": f"Услуга «{sc.service_name}» указана дважды в секции «{sc.section}»",
                "expected": None,
                "actual": None
            })
        seen.add(key)
    return errors


def find_tariff_mismatch(receipt: Receipt) -> list[dict]:
    errors = []
    for sc in receipt.service_charges:
        if sc.volume is None or sc.tariff is None or sc.amount is None:
            continue
        expected = float(sc.volume) * float(sc.tariff)
        actual = float(sc.amount)
        if abs(expected - actual) >= 1:
            errors.append({
                "type": "tariff_mismatch",
                "severity": "high",
                "description": (
                    f"Услуга «{sc.service_name}»: "
                    f"{sc.volume} × {sc.tariff} = {expected:.2f}, "
                    f"а начислено {actual:.2f}"
                ),
                "expected": round(expected, 2),
                "actual": actual
            })
    return errors


def find_debt_mismatch(receipt: Receipt) -> list[dict]:
    errors = []
    for sc in receipt.service_charges:
        if sc.paid and sc.debt_start and sc.amount:
            overpay = float(sc.paid) - float(sc.debt_start) - float(sc.amount)
            if overpay > 1:
                errors.append({
                    "type": "overpayment",
                    "severity": "low",
                    "description": f"Услуга «{sc.service_name}»: переплата {overpay:.2f} ₽",
                    "expected": 0.0,
                    "actual": round(overpay, 2),
                })
    return errors


def check_receipt(receipt: Receipt) -> CheckResult:
    errors = []
    errors.extend(find_total_arithmetic_error(receipt))
    errors.extend(find_duplicates(receipt))
    errors.extend(find_tariff_mismatch(receipt))
    errors.extend(find_debt_mismatch(receipt))

    result = CheckResult(
        receipt_id=receipt.id,
        has_errors=len(errors) > 0,
        errors=errors,
        checked_at=datetime.now()
    )

    return result
