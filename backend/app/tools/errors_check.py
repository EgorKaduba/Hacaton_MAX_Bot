from datetime import datetime

from ..models.receipt import Receipt
from ..models.check_result import CheckResult


EPS_ABS = 0.5
EPS_REL = 0.005

INSURANCE_MARKERS = ("СТРАХОВАН",)

def convert_to_num(value) -> float | None:
    """
    Безопасно приводит число к float
    """
    if value is None:
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def is_insurance(service_name: str | None) -> bool:
    if not service_name:
        return False
    name = service_name.upper()
    return any(marker in name for marker in INSURANCE_MARKERS)


def norm(value: str | None) -> str:
    return (value or "").strip().upper()


def exceeds(expected: float, actual: float) -> bool:
    """
    Сравнение с погрешностью.
    Для дорогих услуг допускает большую погрешность округления
    """
    delta = abs(expected - actual)
    if delta < EPS_ABS:
        return False
    return delta / max(abs(expected), abs(actual), 1.0) > EPS_REL

def excess_for(receipt: Receipt, service_name: str | None) -> float:
    """
    Возвращает excess_amount по услуге из таблицы коэффициентов
    """
    target = norm(service_name)
    if not target:
        return 0.0
    for c in receipt.coefficients or []:
        if norm(c.service_name) == target:
            return convert_to_num(c.excess_amount) or 0.0
    return 0.0

def find_total_arithmetic_error(receipt: Receipt) -> list[dict]:
    """
    total по строкам (кроме страхования) должна совпадать
    с total_without_insurance квитанции
    """
    if not receipt.service_charges:
        return []

    total_without_insurance = convert_to_num(receipt.total_without_insurance)
    if total_without_insurance is None:
        return []

    rows_sum = sum(
        convert_to_num(row.total) or 0.0
        for row in receipt.service_charges
        if row.total is not None and not is_insurance(row.service_name)
    )

    if exceeds(rows_sum, total_without_insurance):
        return [{
            "type": "arithmetic",
            "section": None,
            "service_name": None,
            "severity": "high",
            "confidence": "confirmed",
            "description": (
                "Сумма по услугам не совпадает с итоговой суммой "
                "без учёта страхования"
            ),
            "expected": round(rows_sum, 2),
            "actual": round(total_without_insurance, 2),
            "delta": round(total_without_insurance - rows_sum, 2),
            "legal_ref": "ПП РФ № 354, п. 69",
            "recommended_action": "Произвести перерасчёт по итоговой сумме",
        }]

    return []

def find_duplicates(receipt: Receipt) -> list[dict]:
    """
    Ловит дубли в пределах секции и между секциями
    """
    errors: list[dict] = []
    seen_exact: set[tuple[str, str]] = set()
    seen_by_name: dict[str, list[str]] = {}

    for sc in receipt.service_charges:
        name = norm(sc.service_name)
        if not name:
            continue

        section = norm(sc.section)
        exact_key = (section, name)

        if exact_key in seen_exact:
            errors.append({
                "type": "duplicate_service",
                "section": sc.section,
                "service_name": sc.service_name,
                "severity": "medium",
                "confidence": "confirmed",
                "description": (
                    f"Услуга «{sc.service_name}» указана дважды "
                    f"в секции «{sc.section}»"
                ),
                "expected": None,
                "actual": None,
                "delta": None,
                "legal_ref": "ПП РФ № 354, п. 69",
                "recommended_action": "Исключить дублирующую строку",
            })
        seen_exact.add(exact_key)

        sections = seen_by_name.setdefault(name, [])
        if sections and section not in sections:
            errors.append({
                "type": "duplicate_across_sections",
                "section": sc.section,
                "service_name": sc.service_name,
                "severity": "medium",
                "confidence": "confirmed",
                "description": (
                    f"Услуга «{sc.service_name}» встречается в разных "
                    f"секциях: {', '.join(sections + [section])}"
                ),
                "expected": None,
                "actual": None,
                "delta": None,
                "legal_ref": "ПП РФ № 354, п. 69",
                "recommended_action": "Проверить корректность разнесения по секциям",
            })
        if section not in sections:
            sections.append(section)

    return errors

def find_tariff_mismatch(receipt: Receipt) -> list[dict]:
    errors: list[dict] = []
    for sc in receipt.service_charges:
        volume = convert_to_num(sc.volume)
        tariff = convert_to_num(sc.tariff)
        amount = convert_to_num(sc.amount)

        if volume is None or tariff is None or amount is None:
            continue

        expected = volume * tariff

        if exceeds(expected, amount):
            errors.append({
                "type": "tariff_mismatch",
                "section": sc.section,
                "service_name": sc.service_name,
                "severity": "high",
                "confidence": "confirmed",
                "description": (
                    f"Услуга «{sc.service_name}»: "
                    f"{volume} × {tariff} = {expected:.2f}, "
                    f"а начислено {amount:.2f}"
                ),
                "expected": round(expected, 2),
                "actual": round(amount, 2),
                "delta": round(amount - expected, 2),
                "legal_ref": "ПП РФ № 354, п. 69",
                "recommended_action": "Произвести перерасчёт по услуге",
            })

    return errors

def find_debt_mismatch(receipt: Receipt) -> list[dict]:
    """
    Считает переплату по строке.
    """
    errors: list[dict] = []

    for sc in receipt.service_charges:
        amount = convert_to_num(sc.amount)
        if amount is None:
            continue

        debt_start = convert_to_num(sc.debt_start) or 0.0
        recalculation = convert_to_num(sc.recalculation) or 0.0
        benefit = convert_to_num(sc.benefit) or 0.0
        paid = convert_to_num(sc.paid) or 0.0

        due = debt_start + amount + recalculation - benefit
        overpay = paid - due

        if overpay > EPS_ABS:
            errors.append({
                "type": "overpayment",
                "section": sc.section,
                "service_name": sc.service_name,
                "severity": "low",
                "confidence": "confirmed",
                "description": (
                    f"Услуга «{sc.service_name}»: переплата "
                    f"{overpay:.2f} ₽"
                ),
                "expected": round(due, 2),
                "actual": round(paid, 2),
                "delta": round(overpay, 2),
                "legal_ref": "ЖК РФ, ст. 155",
                "recommended_action": "Зачесть переплату в счёт будущих платежей",
            })

    return errors

def find_row_total_mismatch(receipt: Receipt) -> list[dict]:
    """
    total = amount + recalculation - benefit + excess
    excess берётся из coefficients.excess_amount по услуге
    """
    errors: list[dict] = []

    for sc in receipt.service_charges:
        total = convert_to_num(sc.total)
        amount = convert_to_num(sc.amount)
        if total is None or amount is None:
            continue

        recalculation = convert_to_num(sc.recalculation) or 0.0
        benefit = convert_to_num(sc.benefit) or 0.0
        excess = excess_for(receipt, sc.service_name)

        expected = amount + recalculation - benefit + excess

        if exceeds(expected, total):
            errors.append({
                "type": "row_total_mismatch",
                "section": sc.section,
                "service_name": sc.service_name,
                "severity": "high",
                "confidence": "confirmed",
                "description": (
                    f"Услуга «{sc.service_name}»: "
                    f"начислено {amount:.2f}, "
                    f"перерасчёт {recalculation:.2f}, "
                    f"льгота {benefit:.2f}, "
                    f"превышение {excess:.2f}, "
                    f"а итого указано {total:.2f}"
                ),
                "expected": round(expected, 2),
                "actual": round(total, 2),
                "delta": round(total - expected, 2),
                "legal_ref": "ПП РФ № 354, п. 69",
                "recommended_action": "Произвести перерасчёт по строке",
            })

    return errors

def find_unjustified_recalculation(receipt: Receipt) -> list[dict]:
    """
    Если в строке услуги есть перерасчёт, должна быть запись
    в таблице перерасчётов с тем же service_name
    """
    errors: list[dict] = []

    recalc_map: dict[str, object] = {}
    for r in receipt.recalculations or []:
        key = norm(r.service_name)
        if key:
            recalc_map[key] = r

    for sc in receipt.service_charges:
        recalc_amount = convert_to_num(sc.recalculation)
        if recalc_amount is None or abs(recalc_amount) < EPS_ABS:
            continue

        name = norm(sc.service_name)
        rec = recalc_map.get(name)

        if rec is None:
            errors.append({
                "type": "recalculation_without_record",
                "section": sc.section,
                "service_name": sc.service_name,
                "severity": "medium",
                "confidence": "needs_proof",
                "description": (
                    f"Перерасчёт по «{sc.service_name}» на "
                    f"{recalc_amount:.2f} ₽ указан в строке услуги, "
                    f"но отсутствует в таблице перерасчётов"
                ),
                "expected": None,
                "actual": round(recalc_amount, 2),
                "delta": None,
                "legal_ref": "ПП РФ № 354, п. 69, 71",
                "recommended_action": "Предоставить основание перерасчёта",
            })
            continue

        if not rec.reason:
            errors.append({
                "type": "recalculation_without_reason",
                "section": sc.section,
                "service_name": sc.service_name,
                "severity": "medium",
                "confidence": "needs_proof",
                "description": (
                    f"Перерасчёт по «{sc.service_name}» на "
                    f"{recalc_amount:.2f} ₽ указан без основания"
                ),
                "expected": None,
                "actual": round(recalc_amount, 2),
                "delta": None,
                "legal_ref": "ПП РФ № 354, п. 69, 71",
                "recommended_action": "Предоставить основание перерасчёта",
            })

        rec_amount = convert_to_num(rec.amount)
        if rec_amount is not None and exceeds(recalc_amount, rec_amount):
            errors.append({
                "type": "recalculation_amount_mismatch",
                "section": sc.section,
                "service_name": sc.service_name,
                "severity": "high",
                "confidence": "confirmed",
                "description": (
                    f"Перерасчёт по «{sc.service_name}»: "
                    f"в строке услуги {recalc_amount:.2f} ₽, "
                    f"в таблице перерасчётов {rec_amount:.2f} ₽"
                ),
                "expected": round(rec_amount, 2),
                "actual": round(recalc_amount, 2),
                "delta": round(recalc_amount - rec_amount, 2),
                "legal_ref": "ПП РФ № 354, п. 69, 71",
                "recommended_action": "Устранить расхождение в сумме перерасчёта",
            })

    return errors

def find_totals_mismatch(receipt: Receipt) -> list[dict]:
    """
    total_with_insurance = total_without_insurance + страховка
    Строка страхования определяется по подстроке в service_name
    """
    total_without = convert_to_num(receipt.total_without_insurance)
    total_with = convert_to_num(receipt.total_with_insurance)
    if total_without is None or total_with is None:
        return []

    insurance_row = next(
        (sc for sc in receipt.service_charges or []
         if is_insurance(sc.service_name)),
        None,
    )
    if insurance_row is None:
        return []

    insurance_total = convert_to_num(insurance_row.total) or 0.0
    expected = total_without + insurance_total

    if exceeds(expected, total_with):
        return [{
            "type": "totals_mismatch",
            "section": None,
            "service_name": None,
            "severity": "high",
            "confidence": "confirmed",
            "description": (
                f"Итого без страхования {total_without:.2f} + "
                f"страхование {insurance_total:.2f} ≠ "
                f"итого со страхованием {total_with:.2f}"
            ),
            "expected": round(expected, 2),
            "actual": round(total_with, 2),
            "delta": round(total_with - expected, 2),
            "legal_ref": "ПП РФ № 354, п. 69",
            "recommended_action": "Произвести перерасчёт по итоговой сумме",
        }]

    return []

def find_coefficient_mismatch(receipt: Receipt) -> list[dict]:
    """
    Проверяет коэффициент в таблице "Сведения о применении повышающих коэффициентов"
    """
    errors: list[dict] = []

    charge_map: dict[str, object] = {}
    for sc in receipt.service_charges or []:
        key = norm(sc.service_name)
        if key:
            charge_map[key] = sc

    for c in receipt.coefficients or []:
        coef = convert_to_num(c.coefficient)
        if coef is None or coef <= 1:
            continue

        name = norm(c.service_name)
        sc = charge_map.get(name)
        if sc is None:
            continue

        volume = convert_to_num(sc.volume)
        tariff = convert_to_num(sc.tariff)
        if volume is None or tariff is None:
            continue

        base_amount = volume * tariff
        expected_excess = base_amount * (coef - 1)
        actual_excess = convert_to_num(c.excess_amount)

        if actual_excess is None:
            errors.append({
                "type": "coefficient_without_excess",
                "section": sc.section,
                "service_name": c.service_name,
                "severity": "medium",
                "confidence": "needs_proof",
                "description": (
                    f"По услуге «{c.service_name}» применён коэффициент "
                    f"{coef}, но сумма превышения не указана"
                ),
                "expected": round(expected_excess, 2),
                "actual": None,
                "delta": None,
                "legal_ref": "ПП РФ № 354, п. 42, 60(1)",
                "recommended_action": "Предоставить расчёт превышения",
            })
            continue

        if exceeds(expected_excess, actual_excess):
            errors.append({
                "type": "coefficient_mismatch",
                "section": sc.section,
                "service_name": c.service_name,
                "severity": "high",
                "confidence": "confirmed",
                "description": (
                    f"По услуге «{c.service_name}» применён коэффициент "
                    f"{coef}: базовое начисление {base_amount:.2f} ₽, "
                    f"превышение должно быть {expected_excess:.2f} ₽, "
                    f"а указано {actual_excess:.2f} ₽"
                ),
                "expected": round(expected_excess, 2),
                "actual": round(actual_excess, 2),
                "delta": round(actual_excess - expected_excess, 2),
                "legal_ref": "ПП РФ № 354, п. 42, 60(1)",
                "recommended_action": "Произвести перерасчёт по услуге",
            })

    return errors

def check_receipt(receipt: Receipt) -> CheckResult:
    errors: list[dict] = []
    errors.extend(find_total_arithmetic_error(receipt))
    errors.extend(find_duplicates(receipt))
    errors.extend(find_tariff_mismatch(receipt))
    errors.extend(find_debt_mismatch(receipt))
    errors.extend(find_row_total_mismatch(receipt))
    errors.extend(find_unjustified_recalculation(receipt))
    errors.extend(find_totals_mismatch(receipt))
    errors.extend(find_coefficient_mismatch(receipt))

    return CheckResult(
        receipt_id=receipt.id,
        has_errors=len(errors) > 0,
        errors=errors,
        checked_at=datetime.now(),
    )