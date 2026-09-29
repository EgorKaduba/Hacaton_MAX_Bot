import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

const Ctx = createContext(null);

const empty = { file: null, receipt: null, check: null };

export const DraftProvider = ({ children }) => {
  const [draft, setDraft] = useState(empty);

  const start = useCallback((file) => setDraft({ ...empty, file }), []);
  const setReceipt = useCallback(
    (receipt) => setDraft((d) => ({ ...d, receipt })),
    [],
  );
  const setCheck = useCallback((check) => setDraft((d) => ({ ...d, check })), []);
  const reset = useCallback(() => setDraft(empty), []);

  const value = useMemo(
    () => ({ draft, start, setReceipt, setCheck, reset }),
    [draft, start, setReceipt, setCheck, reset],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useDraft = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useDraft must be used within DraftProvider");
  return ctx;
};
