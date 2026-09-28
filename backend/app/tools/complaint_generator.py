from datetime import datetime
from fpdf import FPDF

from ..models.receipt import Receipt
from ..models.check_result import CheckResult


FONT_REGULAR = "fonts/LiberationSerif-Regular.ttf"
FONT_BOLD = "fonts/LiberationSerif-Bold.ttf"


def float_format(value) -> str:
    if value is None:
        return "—"
    return f"{float(value):.2f}"


def collect_legal_refs(errors: list[dict]) -> list[str]:
    refs: list[str] = []
    for e in errors:
        ref = e.get("legal_ref")
        if ref and ref not in refs:
            refs.append(ref)
    return refs


def render_header(pdf: FPDF) -> None:
    pdf.set_font("Liberation Serif", size=11)
    pdf.set_x(pdf.l_margin)
    pdf.cell(0, 6, "В ________________________________________________", ln=1)
    pdf.cell(0, 6, "     (наименование управляющей организации)", ln=1)
    pdf.ln(3)
    pdf.cell(0, 6, "От _______________________________________________", ln=1)
    pdf.cell(0, 6, "     (ФИО собственника / нанимателя)", ln=1)
    pdf.ln(3)
    pdf.cell(0, 6, "Адрес: ___________________________________________", ln=1)
    pdf.cell(0, 6, "Лицевой счёт: ____________________________________", ln=1)
    pdf.cell(0, 6, "Телефон: _________________________________________", ln=1)
    pdf.ln(8)


def render_title(pdf: FPDF, receipt: Receipt) -> None:
    pdf.set_font("Liberation Serif", "B", size=14)
    pdf.set_x(pdf.l_margin)
    pdf.cell(0, 8, "ПРЕТЕНЗИЯ", align="C", ln=1)
    pdf.set_font("Liberation Serif", size=12)
    pdf.cell(0, 6, "на неправильный расчёт платы за коммунальные услуги", align="C", ln=1)
    pdf.cell(0, 6, f"за {receipt.period_month} {receipt.period_year}", align="C", ln=1)
    pdf.ln(6)


def service_label(e: dict) -> str:
    name = e.get("service_name")
    if name:
        return name[:40]
    if e.get("type") in ("arithmetic", "totals_mismatch"):
        return "Итого по квитанции"
    return "—"


def render_confirmed_block(pdf: FPDF, errors: list[dict], section: int) -> None:
    if not errors:
        return

    pdf.set_font("Liberation Serif", "B", size=12)
    pdf.set_x(pdf.l_margin)
    pdf.cell(0, 7, f"{section}. Установленные нарушения", ln=1)
    pdf.set_font("Liberation Serif", size=11)
    pdf.multi_cell(
        pdf.epw, 6,
        "В результате проверки квитанции выявлены следующие несоответствия:",
    )
    pdf.ln(2)

    pdf.set_font("Liberation Serif", "B", size=10)
    col_w = [70, 30, 30, 35]
    headers = ["Услуга", "По квитанции", "По расчёту", "Расхождение, руб."]
    for w, h in zip(col_w, headers):
        pdf.cell(w, 7, h, border=1, align="C")
    pdf.ln()

    pdf.set_font("Liberation Serif", size=10)
    for e in errors:
        pdf.cell(col_w[0], 6, service_label(e), border=1)
        pdf.cell(col_w[1], 6, float_format(e.get("actual")), border=1, align="R")
        pdf.cell(col_w[2], 6, float_format(e.get("expected")), border=1, align="R")
        pdf.cell(col_w[3], 6, float_format(e.get("delta")), border=1, align="R")
        pdf.ln()

    total_delta = sum(
        float(e.get("delta")) for e in errors if e.get("delta") is not None
    )
    pdf.ln(2)
    pdf.set_font("Liberation Serif", "B", size=11)
    pdf.cell(0, 6, f"Итого к перерасчёту: {total_delta:.2f} ₽", ln=1)
    pdf.ln(4)


def render_needs_proof_block(pdf: FPDF, errors: list[dict], section: int) -> None:
    if not errors:
        return

    pdf.set_font("Liberation Serif", "B", size=12)
    pdf.set_x(pdf.l_margin)
    pdf.cell(0, 7, f"{section}. Начисления, требующие обоснования", ln=1)
    pdf.set_font("Liberation Serif", size=11)
    pdf.multi_cell(
        pdf.epw, 6,
        "Прошу предоставить документальное обоснование следующих начислений:",
    )
    pdf.ln(2)

    for i, e in enumerate(errors, start=1):
        text = e.get("description") or "—"
        pdf.multi_cell(pdf.epw, 6, f"{i}. {text}")
        pdf.ln(1)

    pdf.ln(2)


def render_info_block(pdf: FPDF, errors: list[dict], section: int) -> None:
    if not errors:
        return

    pdf.set_font("Liberation Serif", "B", size=12)
    pdf.set_x(pdf.l_margin)
    pdf.cell(0, 7, f"{section}. Информационные замечания", ln=1)
    pdf.set_font("Liberation Serif", size=11)

    for i, e in enumerate(errors, start=1):
        text = e.get("description") or "—"
        pdf.multi_cell(pdf.epw, 6, f"{i}. {text}")
        pdf.ln(1)

    pdf.ln(2)


def render_legal_refs(pdf: FPDF, refs: list[str], section: int) -> None:
    if not refs:
        return

    pdf.set_font("Liberation Serif", "B", size=12)
    pdf.set_x(pdf.l_margin)
    pdf.cell(0, 7, f"{section}. Правовое обоснование", ln=1)
    pdf.set_font("Liberation Serif", size=11)
    for ref in refs:
        pdf.set_x(pdf.l_margin)
        pdf.multi_cell(pdf.epw, 6, f"— {ref}")
    pdf.ln(3)


def render_requirements(
    pdf: FPDF,
    confirmed: list[dict],
    needs_proof: list[dict],
    section: int,
) -> None:
    if not confirmed and not needs_proof:
        return

    pdf.set_font("Liberation Serif", "B", size=12)
    pdf.set_x(pdf.l_margin)
    pdf.cell(0, 7, f"{section}. Требования", ln=1)
    pdf.set_font("Liberation Serif", size=11)

    n = 1

    for e in confirmed:
        service = e.get("service_name")
        action = e.get("recommended_action") or "Произвести перерасчёт"
        delta = e.get("delta")

        if service and delta is not None:
            text = f"{n}. {action} по услуге «{service}» на сумму {float(delta):.2f} ₽."
        elif service:
            text = f"{n}. {action} по услуге «{service}»."
        elif delta is not None:
            text = f"{n}. {action} на сумму {float(delta):.2f} ₽."
        else:
            text = f"{n}. {action}."

        pdf.set_x(pdf.l_margin)
        pdf.multi_cell(pdf.epw, 6, text)
        n += 1

    for e in needs_proof:
        service = e.get("service_name")
        action = e.get("recommended_action") or "Предоставить обоснование"
        if service:
            text = f"{n}. {action} по услуге «{service}»."
        else:
            text = f"{n}. {action}."
        pdf.set_x(pdf.l_margin)
        pdf.multi_cell(pdf.epw, 6, text)
        n += 1

    pdf.set_x(pdf.l_margin)
    pdf.multi_cell(
        pdf.epw, 6,
        f"{n}. Направить письменный ответ в течение 10 рабочих дней "
        f"с момента получения настоящей претензии."
    )
    pdf.ln(6)


def render_signature(pdf: FPDF) -> None:
    today = datetime.now().strftime("%d.%m.%Y")
    pdf.ln(4)
    pdf.set_font("Liberation Serif", size=11)
    pdf.set_x(pdf.l_margin)
    pdf.cell(60, 6, f"Дата: {today}", ln=0)
    pdf.cell(0, 6, "Подпись: ___________________ / ___________________", ln=1)


def generate_complaint_pdf(receipt: Receipt, check_result: CheckResult) -> bytes:
    pdf = FPDF(orientation="P", unit="mm", format="A4")
    pdf.add_font("Liberation Serif", "", FONT_REGULAR)
    pdf.add_font("Liberation Serif", "B", FONT_BOLD)
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()

    errors = check_result.errors or []
    confirmed = [e for e in errors if e.get("confidence") == "confirmed"]
    needs_proof = [e for e in errors if e.get("confidence") == "needs_proof"]
    info = [e for e in errors if e.get("confidence") == "info"]

    section = 1

    render_header(pdf)
    render_title(pdf, receipt)

    if confirmed:
        render_confirmed_block(pdf, confirmed, section)
        section += 1

    if needs_proof:
        render_needs_proof_block(pdf, needs_proof, section)
        section += 1

    if info:
        render_info_block(pdf, info, section)
        section += 1

    refs = collect_legal_refs(errors)
    if refs:
        render_legal_refs(pdf, refs, section)
        section += 1

    if confirmed or needs_proof:
        render_requirements(pdf, confirmed, needs_proof, section)
        section += 1

    render_signature(pdf)

    return bytes(pdf.output())