import { request, USE_MOCK } from "./client";
import * as mock from "./mock";

/*
 * Пути эндпоинтов — предварительные, согласовать с бэкендом.
 * GET  /receipts                → список квитанций
 * GET  /receipts/:id            → квитанция с service_charges, meter_infos, coefficients, recalculations
 * GET  /receipts/:id/check      → { receipt_id, has_errors, errors[], checked_at }
 * POST /receipts (file)         → распознанная квитанция (или { id })
 * POST /receipts/:id/complaint  → { text } или { pdf_url }
 */

const cache = new Map();

const cached = (key, load) => {
  if (!cache.has(key)) {
    cache.set(
      key,
      load().catch((e) => {
        cache.delete(key);
        throw e;
      }),
    );
  }
  return cache.get(key);
};

export const getReceipts = () =>
  cached("receipts", () =>
    USE_MOCK ? mock.getReceipts() : request("/receipts"),
  );

export const getReceipt = (id) =>
  cached(`receipt:${id}`, () =>
    USE_MOCK ? mock.getReceipt(id) : request(`/receipts/${id}`),
  );

export const getReceiptCheck = (id) =>
  cached(`check:${id}`, () =>
    USE_MOCK ? mock.getReceiptCheck(id) : request(`/receipts/${id}/check`),
  );

export const uploadReceipt = async (file) => {
  let receipt;
  if (USE_MOCK) {
    receipt = await mock.uploadReceipt(file);
  } else {
    const body = new FormData();
    body.append("file", file);
    receipt = await request("/receipts", { method: "POST", body });
  }
  cache.clear();
  return receipt.service_charges ? receipt : getReceipt(receipt.id);
};

export const createComplaint = (id) =>
  cached(`complaint:${id}`, () =>
    USE_MOCK
      ? mock.createComplaint(id)
      : request(`/receipts/${id}/complaint`, { method: "POST" }),
  );
