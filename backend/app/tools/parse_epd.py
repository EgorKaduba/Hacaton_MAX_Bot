import pdfplumber
import re

def clean_text(cell) -> str | None:
    """
    Приводит текстовую ячейку к чистому виду:
    None, пустая строка, "-" -> None
    убирает переносы строк и лишние пробелы
    """
    if cell is None:
        return None
    text = str(cell).replace("\n", " ")
    text = re.sub(r"\s+", " ", text).strip()
    if text in ("", "-"):
        return None
    return text


def parse_number(cell) -> float | None:
    """
    Приводит числовую ячейку к float:
    None, пустая строка, "-" -> None
    убирает пробелы
    заменяет запятую на точку
    """
    if cell is None:
        return None
    text = str(cell)
    text = re.sub(r"\s", "", text)
    if text in ("", "-"):
        return None
    text = text.replace(",", ".")
    try:
        return float(text)
    except ValueError:
        return None


def parse_service_row(row: list) -> dict:
    """
    Парсит обычную строку услуги из таблицы расчёта.
    """
    return {
        "вид_услуги": clean_text(row[0]),
        "объем_услуг": parse_number(row[2]),
        "ед_изм": clean_text(row[3]),
        "тариф_руб": parse_number(row[4]),
        "начислено_по_тарифу_руб": parse_number(row[5]),
        "льгота_руб": parse_number(row[6]),
        "перерасчеты_руб": parse_number(row[7]),
        "задолженность_на_начало_руб": parse_number(row[8]),
        "оплачено_руб": parse_number(row[9]),
        "итого_руб": parse_number(row[10]),
    }


def parse_insurance_row(row: list) -> dict:
    """
    Парсит строку "ДОБРОВОЛЬНОЕ СТРАХОВАНИЕ", у неё сдвинутая разметка:
    объем лежит в row[1], а не в row[2]
    """
    return {
        "вид_услуги": clean_text(row[0]),
        "объем_услуг": parse_number(row[1]),
        "ед_изм": clean_text(row[3]),
        "тариф_руб": parse_number(row[4]),
        "начислено_по_тарифу_руб": parse_number(row[5]),
        "льгота_руб": parse_number(row[6]),
        "перерасчеты_руб": parse_number(row[7]),
        "задолженность_на_начало_руб": parse_number(row[8]),
        "оплачено_руб": parse_number(row[9]),
        "итого_руб": parse_number(row[10]),
    }

def parse_total_row(row: list) -> dict:
    """
    Парсит итоговую строку "Всего за ...", возвращает словарь с полями,
    которые есть в строке. У "Итого к оплате" заполнена только последняя колонка
    """
    return {
        "начислено_по_тарифу_руб": parse_number(row[5]),
        "льгота_руб": parse_number(row[6]),
        "перерасчеты_руб": parse_number(row[7]),
        "задолженность_на_начало_руб": parse_number(row[8]),
        "оплачено_руб": parse_number(row[9]),
        "итого_руб": parse_number(row[10]),
    }

def parse_calc_table(table: list) -> dict:
    """
    Парсит таблицу "РАСЧЕТ РАЗМЕРА ПЛАТЫ ЗА ЖКУ".
    Возвращает словарь, сгруппированный по секциям
    """
    result = {
        "Начисления за жилищные услуги": [],
        "Начисления за коммунальные услуги": [],
        "Начисления за иные услуги": [],
        "итоги": {
            "без_страхования": {
                "всего_за_период": None,
                "итого_к_оплате_руб": None,
            },
            "с_страхованием": {
                "всего_за_период": None,
                "итого_к_оплате_руб": None,
            },
        },
    }

    current_section = None

    for row in table:
        if not row or all(cell is None or str(cell).strip() == "" for cell in row):
            continue

        first = clean_text(row[0])
        if first is None:
            continue

        if first.startswith("РАСЧЕТ РАЗМЕРА ПЛАТЫ"):
            continue

        if first == "Виды услуг":
            continue

        if first.startswith("Начисления за"):
            current_section = first
            continue

        if first.startswith("Всего за"):
            if "без учета" in first.lower():
                result["итоги"]["без_страхования"]["всего_за_период"] = parse_total_row(row)
            elif "с учетом" in first.lower():
                result["итоги"]["с_страхованием"]["всего_за_период"] = parse_total_row(row)
            continue

        if first.startswith("Итого к оплате за"):
            if "без учета" in first.lower():
                result["итоги"]["без_страхования"]["итого_к_оплате_руб"] = parse_number(row[10])
            elif "с учетом" in first.lower():
                result["итоги"]["с_страхованием"]["итого_к_оплате_руб"] = parse_number(row[10])
            continue

        if first.upper().startswith("ДОБРОВОЛЬНОЕ"):
            if current_section:
                result[current_section].append(parse_insurance_row(row))
            continue

        if current_section:
            result[current_section].append(parse_service_row(row))

    return result

def parse_period(text: str) -> dict:
    """
    Извлекает месяц и год из заголовка документа.
    :return: {"месяц": "июль", "год": 2026}
    """
    result = {"месяц": None, "год": None}

    match = re.search(r"ЗА\s+([А-ЯЁ]+)\s+(\d{4})", text)

    if match:
        result["месяц"] = match.group(1).lower()
        result["год"] = int(match.group(2))

    return result


def parse_totals(text: str) -> dict:
    """
    Парсит итоговые суммы к оплате — с учётом и без учёта страхования.
    :return: {'итого_с_страхованием': 8863.63, 'итого_без_страхования': 8688.98}
    """
    result = {
        "итого_с_страхованием": None,
        "итого_без_страхования": None,
    }

    pattern = (
        r"С\s+УЧ[ЕЁ]ТОМ\s+ДОБРОВОЛЬНОГО\s+СТРАХОВАНИЯ\s+"
        r"БЕЗ\s+УЧ[ЕЁ]ТА\s+ДОБРОВОЛЬНОГО\s+СТРАХОВАНИЯ\s+"
        r"([\d\s]+?)\s*руб\.\s*(\d+)\s*коп\.\s*"
        r"([\d\s]+?)\s*руб\.\s*(\d+)\s*коп\."
    )
    m = re.search(pattern, text, re.DOTALL)

    if m:
        rub_with = re.sub(r"\s", "", m.group(1))
        kop_with = m.group(2)
        rub_without = re.sub(r"\s", "", m.group(3))
        kop_without = m.group(4)

        result["итого_с_страхованием"] = float(f"{rub_with}.{kop_with}")
        result["итого_без_страхования"] = float(f"{rub_without}.{kop_without}")

    return result

def parse(epd_path) -> dict:
    """
    Основная функция парсинга ЕПД в формате pdf.
    Возвращает словарь со всеми необходимыми данными из документа.
    """
    data = dict()


    try:
        with pdfplumber.open(epd_path) as pdf:
            first_page = pdf.pages[0]
            text = first_page.extract_text() or ""

            data["Период"] = parse_period(text)
            data["Итого"] = parse_totals(text)

            tables = first_page.extract_tables()

            calc_table = None
            for t in tables:
                for row in t:
                    if row and row[0] and "РАСЧЕТ РАЗМЕРА ПЛАТЫ" in str(row[0]):
                        calc_table = t
                        break
                if calc_table:
                    break

            if calc_table:
                data["Таблица расчета"] = parse_calc_table(calc_table)
            else:
                data["Таблица расчета"] = None
    except FileNotFoundError:
        return {"status": 404, "result": None}
    return {"status": 200, "result": data}
