import { getReceipt, getReceiptCheck, getReceipts } from "../api/receipts";
import { num, rub, signedRub } from "../utils/format";
import {
  findPrevious,
  overpayment,
  periodLabel,
  receiptTotal,
  serviceTitle,
  sortReceipts,
} from "../utils/receipt";

const loadContext = async () => {
  const receipts = sortReceipts(await getReceipts());
  const latestItem = receipts[0];
  if (!latestItem) return null;
  const previousItem = findPrevious(receipts, latestItem);
  const [latest, check, previous] = await Promise.all([
    getReceipt(latestItem.id),
    getReceiptCheck(latestItem.id),
    previousItem ? getReceipt(previousItem.id) : null,
  ]);
  return { latest, check, previous };
};

const chargeLine = (c) =>
  `${num(c.volume, 4)} ${c.unit} × ${num(c.tariff, 4)} ₽ = ${rub(c.total)}`;

const answerErrors = ({ latest, check }) => {
  if (!check.has_errors)
    return { text: `В квитанции за ${periodLabel(latest).toLowerCase()} ошибок не найдено.` };
  return {
    text: `В квитанции за ${periodLabel(latest).toLowerCase()} найдено ошибок: ${check.errors.length}. Возможная переплата — ${rub(overpayment(check.errors))}. Жалобу можно сформировать кнопкой «Подать жалобу» в квитанции.`,
    cards: check.errors.map((e) => ({
      tone: "danger",
      title: `${rub(e.actual)} вместо ${rub(e.expected)}`,
      text: e.description,
    })),
  };
};

const answerRecalculations = ({ latest }) => {
  const list = latest.recalculations ?? [];
  if (!list.length) return { text: "Перерасчётов в последней квитанции нет." };
  const sum = list.reduce((s, r) => s + r.amount, 0);
  return {
    text: `В квитанции за ${periodLabel(latest).toLowerCase()} сделан перерасчёт на ${signedRub(sum)}:`,
    cards: list.map((r) => ({
      tone: "info",
      title: `${serviceTitle(r.service_name)} · ${signedRub(r.amount)}`,
      text: r.reason,
    })),
  };
};

const answerChanges = ({ latest, previous }) => {
  if (!previous) {
    const top = [...latest.service_charges].sort((a, b) => b.total - a.total).slice(0, 3);
    return {
      text: `Квитанция за ${periodLabel(latest).toLowerCase()} — ${rub(receiptTotal(latest))}. Больше всего начислено за:`,
      cards: top.map((c) => ({ tone: "info", title: serviceTitle(c.service_name), text: chargeLine(c) })),
    };
  }
  const diff = receiptTotal(latest) - receiptTotal(previous);
  const changes = latest.service_charges
    .map((c) => {
      const prev = previous.service_charges.find((p) => p.service_name === c.service_name);
      return { charge: c, diff: c.total - (prev?.total ?? 0) };
    })
    .filter((x) => Math.abs(x.diff) >= 1)
    .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))
    .slice(0, 3);
  return {
    text: `По сравнению с квитанцией за ${periodLabel(previous).toLowerCase()} сумма изменилась на ${signedRub(diff)}. Сильнее всего изменились:`,
    cards: changes.map(({ charge, diff: d }) => ({
      tone: d > 0 ? "danger" : "info",
      title: `${serviceTitle(charge.service_name)} · ${signedRub(d)}`,
      text: chargeLine(charge),
    })),
  };
};

const answerService = ({ latest }, question) => {
  const q = question.toLowerCase();
  const charge = latest.service_charges.find((c) =>
    q.includes(serviceTitle(c.service_name).toLowerCase()),
  );
  if (!charge) return null;
  const recalc = (latest.recalculations ?? []).filter((r) => r.service_name === charge.service_name);
  const coefficient = (latest.coefficients ?? []).find((k) => k.service_name === charge.service_name);
  const cards = [
    ...recalc.map((r) => ({ tone: "info", title: `Перерасчёт ${signedRub(r.amount)}`, text: r.reason })),
    ...(coefficient
      ? [{ tone: "warning", title: `Коэффициент ×${num(coefficient.coefficient)}`, text: `Сверх тарифа начислено ${rub(coefficient.excess_amount)}` }]
      : []),
  ];
  return {
    text: `${serviceTitle(charge.service_name)}: ${chargeLine(charge)}. Оплачено за прошлый период: ${rub(charge.paid)}.`,
    cards,
  };
};

/** Заглушка ответа AI: собирает ответ из данных квитанций. Заменить на запрос к бэкенду. */
export const askAssistant = async (question) => {
  const [ctx] = await Promise.all([
    loadContext(),
    new Promise((r) => setTimeout(r, 700)),
  ]);
  if (!ctx) return { text: "Пока нет ни одной квитанции. Загрузите квитанцию, и я её разберу." };

  const q = question.toLowerCase();
  if (q.includes("ошиб") || q.includes("жалоб")) return answerErrors(ctx);
  if (q.includes("перерасч")) return answerRecalculations(ctx);
  if (q.includes("оплат"))
    return {
      text: "Откройте квитанцию и нажмите «Оплатить» — откроется ссылка из QR-кода вашей квитанции. Рядом есть кнопка с QR-кодом, его можно отсканировать приложением банка.",
    };
  return answerService(ctx, question) ?? answerChanges(ctx);
};

export const SUGGESTIONS = [
  "Почему изменилась сумма?",
  "Есть ли ошибки в квитанции?",
  "Что за перерасчёт?",
  "Как оплатить?",
];
