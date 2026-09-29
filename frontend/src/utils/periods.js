import { periodKey, periodLabel, sortReceipts } from "./receipt";

export const uniquePeriods = (receipts = []) => {
  const seen = new Set();
  return sortReceipts(receipts).filter((r) => {
    const key = periodKey(r);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const rangeCaption = (receipts) =>
  receipts.length > 1
    ? `${periodLabel(receipts[receipts.length - 1])} — ${periodLabel(receipts[0])}`
    : periodLabel(receipts[0]);

export const buildPeriods = (receipts) => {
  const list = uniquePeriods(receipts);
  const months = list.map((r) => ({
    id: `month-${r.id}`,
    label: periodLabel(r),
    receipts: [r],
  }));
  if (!list.length) return { ranges: [], months };

  const latest = periodKey(list[0]);
  const ranges = [];
  const add = (id, label, items) => {
    if (items.length < 2) return;
    const key = items.map((r) => r.id).join(",");
    if (ranges.some((p) => p.key === key)) return;
    ranges.push({ id, label, receipts: items, key });
  };

  add("all", "За всё время", list);
  add("last-3", "За 3 месяца", list.filter((r) => latest - periodKey(r) < 3));
  add("last-6", "За полгода", list.filter((r) => latest - periodKey(r) < 6));
  for (const year of new Set(list.map((r) => r.period_year))) {
    add(
      `year-${year}`,
      `За ${year} год`,
      list.filter((r) => r.period_year === year),
    );
  }

  return { ranges, months };
};
