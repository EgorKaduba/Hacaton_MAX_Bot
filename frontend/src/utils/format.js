const money = new Intl.NumberFormat("ru-RU", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const moneyRound = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 });

export const rub = (v) => `${money.format(v ?? 0)} ₽`;

export const rubRound = (v) => `${moneyRound.format(v ?? 0)} ₽`;

export const signedRub = (v) =>
  `${v > 0 ? "+" : v < 0 ? "−" : ""}${money.format(Math.abs(v ?? 0))} ₽`;

export const signedRubRound = (v) =>
  `${v > 0 ? "+" : v < 0 ? "−" : ""}${moneyRound.format(Math.abs(v ?? 0))} ₽`;

export const num = (v, digits = 2) =>
  new Intl.NumberFormat("ru-RU", { maximumFractionDigits: digits }).format(
    v ?? 0,
  );

export const percent = (cur, prev) =>
  prev ? Math.round(((cur - prev) / prev) * 100) : 0;

export const signedPercent = (v) =>
  `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v)}%`;

export const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString("ru-RU") : "";

export const greeting = (d = new Date()) => {
  const h = d.getHours();
  if (h < 6) return "Доброй ночи";
  if (h < 12) return "Доброе утро";
  if (h < 18) return "Добрый день";
  return "Добрый вечер";
};

export const initials = (first, last) =>
  `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase() || "Я";
