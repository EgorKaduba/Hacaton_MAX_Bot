import { ApiError, apiUrl, currentUserId, request, USE_MOCK } from "./client";
import * as mock from "./mock";


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
  cached("receipts", async () => {
    if (USE_MOCK) return mock.getReceipts();
    try {
      return await request(`/receipts/user/${currentUserId()}`);
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) return [];
      throw e;
    }
  });

export const getReceipt = (id) =>
  cached(`receipt:${id}`, () =>
    USE_MOCK ? mock.getReceipt(id) : request(`/receipts/${id}`),
  );

export const getReceiptCheck = (id) =>
  cached(`check:${id}`, () =>
    USE_MOCK
      ? mock.getReceiptCheck(id)
      : request(`/receipts/check/${id}`, { method: "POST" }),
  );

export const uploadReceipt = async (file) => {
  let receipt;
  if (USE_MOCK) {
    receipt = await mock.uploadReceipt(file);
  } else {
    const body = new FormData();
    body.append("file", file);
    receipt = await request(`/receipts/upload/${currentUserId()}`, {
      method: "POST",
      body,
    });
  }
  cache.clear();
  return receipt.service_charges ? receipt : getReceipt(receipt.id);
};

export const createComplaint = (id) =>
  cached(`complaint:${id}`, async () => {
    if (USE_MOCK) return mock.createComplaint(id);
    const path = `/receipts/${id}/complaint`;
    const blob = await request(path, { as: "blob" });
    return { pdf_url: apiUrl(path), blob_url: URL.createObjectURL(blob) };
  });
