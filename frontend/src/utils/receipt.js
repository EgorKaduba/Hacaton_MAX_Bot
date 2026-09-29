const MONTHS = [
  "январь",
  "февраль",
  "март",
  "апрель",
  "май",
  "июнь",
  "июль",
  "август",
  "сентябрь",
  "октябрь",
  "ноябрь",
  "декабрь",
];

const MONTHS_DAT = [
  "январю",
  "февралю",
  "марту",
  "апрелю",
  "маю",
  "июню",
  "июлю",
  "августу",
  "сентябрю",
  "октябрю",
  "ноябрю",
  "декабрю",
];

const capitalize = (s = "") => s.charAt(0).toUpperCase() + s.slice(1);

export const monthIndex = (name) =>
  MONTHS.indexOf(String(name ?? "").trim().toLowerCase());

export const periodLabel = (r) => {
  if (!r) return "";
  if (!r.period_month && !r.period_year) return `Квитанция №${r.id}`;
  return `${capitalize(String(r.period_month ?? ""))} ${r.period_year ?? ""}`.trim();
};

export const monthDative = (r) =>
  MONTHS_DAT[monthIndex(r?.period_month)] ?? r?.period_month ?? "";

export const periodKey = (r) =>
  (r.period_year ?? 0) * 12 + Math.max(0, monthIndex(r.period_month));

export const sortReceipts = (list = []) =>
  [...list].sort((a, b) => periodKey(b) - periodKey(a) || b.id - a.id);

export const findPrevious = (sorted, r) =>
  sorted.find((x) => periodKey(x) < periodKey(r));

export const receiptTotal = (r) =>
  r?.total_with_insurance ?? r?.total_without_insurance ?? 0;

const STATUSES = {
  parsed: { label: "Распознана", tone: "success" },
  checked: { label: "Проверена", tone: "success" },
  uploaded: { label: "Обрабатывается", tone: "info" },
  processing: { label: "Обрабатывается", tone: "info" },
  pending: { label: "Обрабатывается", tone: "info" },
  error: { label: "Ошибка распознавания", tone: "danger" },
  failed: { label: "Ошибка распознавания", tone: "danger" },
};

export const statusInfo = (status) =>
  STATUSES[status] ?? { label: status ?? "—", tone: "neutral" };

const SECTIONS = {
  жилищные: "Жилищные услуги",
  коммунальные: "Коммунальные услуги",
  иные: "Иные услуги",
};

export const sectionLabel = (section) =>
  SECTIONS[String(section ?? "").toLowerCase()] ??
  capitalize(section || "Прочее");

export const groupBySection = (charges = []) => {
  const groups = new Map();
  for (const c of charges) {
    const key = c.section ?? "";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(c);
  }
  return [...groups].map(([section, items]) => ({
    section,
    label: sectionLabel(section),
    items,
    total: items.reduce((s, c) => s + (c.total ?? 0), 0),
  }));
};

const ABBREVIATIONS = new Set([
  "ТКО",
  "ВКГО",
  "ТО",
  "ПУ",
  "ИПУ",
  "ОДПУ",
  "ОДН",
  "ОДИ",
  "СОИ",
  "МКД",
  "ГВС",
  "ХВС",
  "В/С",
  "Д1",
  "Д2",
  "Т1",
  "Т2",
  "Т3",
]);

export const serviceTitle = (name = "") => {
  const text = name
    .trim()
    .split(/\s+/)
    .map((word) =>
      ABBREVIATIONS.has(word.replace(/[()«»",.]/g, "").toUpperCase())
        ? word.toUpperCase()
        : word.toLowerCase(),
    )
    .join(" ");
  return capitalize(text);
};

const SEVERITY_TONES = {
  critical: "danger",
  high: "danger",
  error: "danger",
  medium: "warning",
  warning: "warning",
  low: "info",
  info: "info",
};

export const severityTone = (severity) =>
  SEVERITY_TONES[String(severity ?? "").toLowerCase()] ?? "warning";

const ERROR_TYPES = {
  arithmetic: "Ошибка в итоговой сумме",
  totals_mismatch: "Ошибка в итоге со страхованием",
  duplicate_service: "Двойное начисление",
  duplicate_across_sections: "Услуга в разных разделах",
  tariff_mismatch: "Не совпадает с тарифом",
  row_total_mismatch: "Ошибка в итоге по услуге",
  overpayment: "Переплата",
  recalculation_without_record: "Перерасчёт без записи",
  recalculation_without_reason: "Перерасчёт без основания",
  recalculation_amount_mismatch: "Расхождение в перерасчёте",
  coefficient_mismatch: "Ошибка в повышающем коэффициенте",
  coefficient_without_excess: "Коэффициент без расчёта",
};

export const errorTypeLabel = (type) => ERROR_TYPES[type] ?? "Ошибка";

export const overpayment = (errors = []) =>
  errors.reduce(
    (s, e) =>
      e.actual != null && e.expected != null
        ? s + Math.max(0, e.actual - e.expected)
        : s,
    0,
  );
