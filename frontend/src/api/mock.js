import { ApiError } from "./client";
import { formatDate, rub } from "../utils/format";
import { monthIndex, overpayment, periodLabel } from "../utils/receipt";

const JULY = {
  id: 3,
  period_month: "июль",
  period_year: 2026,
  total_without_insurance: 8688.98,
  total_with_insurance: 8863.63,
  status: "parsed",
  service_charges: [
    { id: 13, section: "жилищные", service_name: "ВЗНОС НА КОПИТАЛЬНЫЙ РЕМОН", volume: 49.9, unit: "кв.м", tariff: 22, amount: 1097.8, benefit: null, recalculation: 0, debt_start: 1097.8, paid: 1097.8, total: 1097.8 },
    { id: 14, section: "коммунальные", service_name: "ВОДООТВЕДЕНИЕ", volume: 7.57, unit: "куб. м.", tariff: 49.67, amount: 376, benefit: null, recalculation: 0, debt_start: 376, paid: 376, total: 376 },
    { id: 15, section: "коммунальные", service_name: "ГАЗОСНАБЖЕНИЕ", volume: 1, unit: "чел.", tariff: 97.1, amount: 97.1, benefit: null, recalculation: 0, debt_start: 97.1, paid: 97.1, total: 97.1 },
    { id: 16, section: "коммунальные", service_name: "ГОРЯЧЕЕ В/С (НОСИТЕЛЬ)", volume: 3.17, unit: "куб. м.", tariff: 38.21, amount: 121.13, benefit: null, recalculation: -52.49, debt_start: 121.13, paid: 121.13, total: 68.64 },
    { id: 17, section: "коммунальные", service_name: "ГОРЯЧЕЕ В/С (ЭНЕРГИЯ)", volume: 0.1912, unit: "Гкал", tariff: 4952.24, amount: 946.63, benefit: null, recalculation: -410.18, debt_start: 946.63, paid: 946.63, total: 536.45 },
    { id: 18, section: "коммунальные", service_name: "ОБРАЩЕНИЕ С ТКО", volume: 49.9, unit: "кв. м.", tariff: 11.5816, amount: 577.92, benefit: null, recalculation: 0, debt_start: 577.92, paid: 577.92, total: 577.92 },
    { id: 19, section: "коммунальные", service_name: "ОТОПЛЕНИЕ", volume: 0.7884, unit: "Гкал", tariff: 4952.24, amount: 3904.45, benefit: null, recalculation: 0, debt_start: 3904.45, paid: 3904.45, total: 3904.45 },
    { id: 20, section: "коммунальные", service_name: "ХОЛОДНОЕ В/С", volume: 4.4, unit: "куб. м.", tariff: 38.21, amount: 168.12, benefit: null, recalculation: 0, debt_start: 504.37, paid: 504.37, total: 504.37 },
    { id: 21, section: "коммунальные", service_name: "ЭЛЕКСТРИЧЕСТВ О ОДНОТАРИФНЫЙ ПУ (Д1)", volume: 159, unit: "кВт*ч", tariff: 8.38, amount: 1332.42, benefit: null, recalculation: 0, debt_start: 2136.9, paid: 2136.9, total: 1332.42 },
    { id: 22, section: "иные", service_name: "ЗАПИРАЮЩЕЕ УСТРОЙСТВО", volume: 1, unit: "абонент", tariff: 75, amount: 75, benefit: null, recalculation: 0, debt_start: 70, paid: 70, total: 75 },
    { id: 23, section: "иные", service_name: "ТО ВКГО", volume: 1, unit: "абонент", tariff: 118.83, amount: 118.83, benefit: null, recalculation: 0, debt_start: 118.83, paid: 118.83, total: 118.83 },
    { id: 24, section: "иные", service_name: "ДОБРОВОЛЬНОЕ СТРАХОВАНИЕ", volume: 49.9, unit: "кв. м.", tariff: 3.5, amount: 174.65, benefit: null, recalculation: 0, debt_start: 0, paid: 0, total: 174.65 },
  ],
  meter_infos: [
    { id: 2, service_name: "ЭЛЕКТРОСНАБЖЕНИЕ", meter_type: "ИПУ", meter_number: "52111500", previous_reading: 5520, current_reading: 5680, consumption: 159 },
  ],
  coefficients: [
    { id: 2, service_name: "ХОЛОДНОЕ В/С", coefficient: 3, excess_amount: 336.25 },
  ],
  recalculations: [
    { id: 3, service_name: "ГОРЯЧЕЕ В/С (НОСИТЕЛЬ)", reason: "Плановое отключение", amount: -52.49 },
    { id: 4, service_name: "ГОРЯЧЕЕ В/С (ЭНЕРГИЯ)", reason: "Плановое отключение", amount: -410.18 },
  ],
};

const round = (v, digits) => Math.round(v * 10 ** digits) / 10 ** digits;
const round2 = (v) => round(v, 2);

const deriveReceipt = (base, { id, month, year, volumes, reading }) => {
  const service_charges = base.service_charges.map((c, i) => {
    const volume = volumes[c.service_name] ?? c.volume;
    const amount =
      volumes[c.service_name] != null ? round2(volume * c.tariff) : c.amount;
    return {
      ...c,
      id: id * 100 + i,
      volume,
      amount,
      recalculation: 0,
      debt_start: amount,
      paid: amount,
      total: amount,
    };
  });
  const total = round2(service_charges.reduce((s, c) => s + c.total, 0));
  const insurance =
    service_charges.find((c) => c.service_name === "ДОБРОВОЛЬНОЕ СТРАХОВАНИЕ")
      ?.total ?? 0;
  return {
    id,
    period_month: month,
    period_year: year,
    total_without_insurance: round2(total - insurance),
    total_with_insurance: total,
    status: "parsed",
    service_charges,
    meter_infos: [
      {
        id: id * 10,
        service_name: "ЭЛЕКТРОСНАБЖЕНИЕ",
        meter_type: "ИПУ",
        meter_number: "52111500",
        previous_reading: reading[0],
        current_reading: reading[1],
        consumption: reading[1] - reading[0],
      },
    ],
    coefficients: [],
    recalculations: [],
  };
};

const HISTORY = [
  { id: 2, month: "июнь", year: 2026, water: 1.07, hot: 1.13, kwh: 171 },
  { id: 1, month: "май", year: 2026, water: 1.04, hot: 1.07, kwh: 180 },
  { id: 4, month: "апрель", year: 2026, water: 1.02, hot: 1.05, kwh: 196 },
  { id: 5, month: "март", year: 2026, water: 1.05, hot: 1.1, kwh: 214 },
  { id: 6, month: "февраль", year: 2026, water: 0.98, hot: 1.08, kwh: 228 },
  { id: 7, month: "январь", year: 2026, water: 1.08, hot: 1.18, kwh: 243 },
  { id: 8, month: "декабрь", year: 2025, water: 1.1, hot: 1.2, kwh: 251 },
  { id: 9, month: "ноябрь", year: 2025, water: 1.03, hot: 1.12, kwh: 232 },
  { id: 10, month: "октябрь", year: 2025, water: 0.99, hot: 1.04, kwh: 205 },
  { id: 11, month: "сентябрь", year: 2025, water: 0.96, hot: 0.98, kwh: 184 },
  { id: 12, month: "август", year: 2025, water: 0.94, hot: 0.92, kwh: 166 },
];

const baseVolume = (name) =>
  JULY.service_charges.find((c) => c.service_name === name).volume;

const HISTORY_RECEIPTS = HISTORY.reduce(
  ({ list, reading }, h) => {
    const volumes = {
      "ВОДООТВЕДЕНИЕ": round2(baseVolume("ВОДООТВЕДЕНИЕ") * h.water),
      "ХОЛОДНОЕ В/С": round2(baseVolume("ХОЛОДНОЕ В/С") * h.water),
      "ГОРЯЧЕЕ В/С (НОСИТЕЛЬ)": round2(baseVolume("ГОРЯЧЕЕ В/С (НОСИТЕЛЬ)") * h.hot),
      "ГОРЯЧЕЕ В/С (ЭНЕРГИЯ)": round(baseVolume("ГОРЯЧЕЕ В/С (ЭНЕРГИЯ)") * h.hot, 4),
      "ЭЛЕКСТРИЧЕСТВ О ОДНОТАРИФНЫЙ ПУ (Д1)": h.kwh,
    };
    const receipt = deriveReceipt(JULY, {
      ...h,
      volumes,
      reading: [reading - h.kwh, reading],
    });
    return { list: [...list, receipt], reading: reading - h.kwh };
  },
  { list: [], reading: JULY.meter_infos[0].previous_reading },
).list;

const ALL_RECEIPTS = [JULY, ...HISTORY_RECEIPTS];

const RECEIPTS = Object.fromEntries(ALL_RECEIPTS.map((r) => [r.id, r]));

const checkedAt = (r) =>
  new Date(Date.UTC(r.period_year, monthIndex(r.period_month) + 1, 10, 9)).toISOString();

const CHECKS = {
  ...Object.fromEntries(
    HISTORY_RECEIPTS.map((r) => [
      r.id,
      { receipt_id: r.id, has_errors: false, errors: [], checked_at: checkedAt(r) },
    ]),
  ),
  3: {
    receipt_id: 3,
    has_errors: true,
    errors: [
      {
        type: "coefficient_mismatch",
        section: "коммунальные",
        severity: "high",
        confidence: "confirmed",
        description:
          "По услуге «ХОЛОДНОЕ В/С» применён повышающий коэффициент 3 и начислено превышение 336.25 ₽, хотя показания счётчика переданы",
        actual: 336.25,
        expected: 0,
        delta: 336.25,
        legal_ref: "ПП РФ № 354, п. 42, 60(1)",
        recommended_action: "Произвести перерасчёт по услуге",
      },
      {
        type: "tariff_mismatch",
        section: "коммунальные",
        severity: "medium",
        confidence: "confirmed",
        description:
          "Услуга «ОТОПЛЕНИЕ»: 0.7884 × 4952.24 = 3904.35, а начислено 3904.45",
        actual: 3904.45,
        expected: 3904.35,
        delta: 0.1,
        legal_ref: "ПП РФ № 354, п. 69",
        recommended_action: "Произвести перерасчёт по услуге",
      },
    ],
    checked_at: "2026-09-27T18:52:12.663Z",
  },
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const findReceipt = (id) => {
  const receipt = RECEIPTS[id];
  if (!receipt) throw new ApiError(404, "Квитанция не найдена");
  return receipt;
};

export const getReceipts = async () => {
  await delay(300);
  return ALL_RECEIPTS.map(
    ({ id, period_month, period_year, total_without_insurance, total_with_insurance, status }) => ({
      id,
      period_month,
      period_year,
      total_without_insurance,
      total_with_insurance,
      status,
    }),
  );
};

export const getReceipt = async (id) => {
  await delay(300);
  return structuredClone(findReceipt(id));
};

export const getReceiptCheck = async (id) => {
  await delay(1200);
  findReceipt(id);
  return structuredClone(CHECKS[id]);
};

export const uploadReceipt = async () => {
  await delay(1800);
  return structuredClone(JULY);
};

const complaintText = (receipt, check) => {
  const lines = check.errors.map(
    (e, i) =>
      `${i + 1}. ${e.description}\n   Начислено: ${rub(e.actual)}, должно быть: ${rub(e.expected)}.`,
  );
  return [
    "В управляющую компанию",
    "",
    "От: ________________________________",
    "Адрес: _____________________________",
    "Лицевой счёт: ______________________",
    "",
    "ЗАЯВЛЕНИЕ",
    "о проверке начислений и перерасчёте платы за ЖКУ",
    "",
    `В платёжном документе за ${periodLabel(receipt).toLowerCase()} на сумму ${rub(receipt.total_with_insurance)} обнаружены ошибки в начислениях:`,
    "",
    ...lines,
    "",
    `Прошу провести проверку начислений, произвести перерасчёт на сумму ${rub(overpayment(check.errors))} и предоставить письменный ответ.`,
    "",
    `Дата: ${formatDate(new Date().toISOString())}`,
    "Подпись: ____________",
  ].join("\n");
};

export const createComplaint = async (id) => {
  await delay(1200);
  const receipt = findReceipt(id);
  return { text: complaintText(receipt, CHECKS[id]) };
};