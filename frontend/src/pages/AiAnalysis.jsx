import { Navigate, useNavigate } from "react-router-dom";
import { Typography } from "@maxhub/max-ui";
import {
  Card,
  ErrorState,
  IconBubble,
  PageHeader,
  ProgressBar,
} from "../components/ui";
import { IconSparkle } from "../components/Icons";
import { getReceiptCheck } from "../api/receipts";
import { useProcess } from "../hooks/useProcess";
import { useDraft } from "../state/draft";
import { rub, signedRub } from "../utils/format";
import { periodLabel, receiptTotal } from "../utils/receipt";
import { bridge } from "../bridge/max";

const CheckProcess = ({ receipt }) => {
  const navigate = useNavigate();
  const { setCheck } = useDraft();
  const { progress, error, retry } = useProcess(
    () => getReceiptCheck(receipt.id),
    {
      minDuration: 3500,
      onDone: (check) => {
        bridge.haptic.notify(check.has_errors ? "warning" : "success");
        setCheck(check);
        navigate("/receipts/add/result", { replace: true });
      },
    },
  );

  if (error)
    return (
      <ErrorState
        title="Не удалось проверить квитанцию"
        error={error}
        onRetry={retry}
      />
    );

  const recalcTotal = (receipt.recalculations ?? []).reduce(
    (s, r) => s + r.amount,
    0,
  );
  const rows = [
    { label: "Сумма", value: rub(receiptTotal(receipt)), at: 20 },
    {
      label: "Услуг проверено",
      value: String(receipt.service_charges?.length ?? 0),
      at: 50,
    },
    {
      label: "Перерасчёты",
      value: recalcTotal ? signedRub(recalcTotal) : "нет",
      at: 80,
    },
  ];

  return (
    <Card className="processing">
      <IconBubble size={72}>
        <IconSparkle size={34} className="pulse" />
      </IconBubble>
      <Typography.Title variant="medium-strong">Проверяем квитанцию</Typography.Title>
      <p className="muted center">
        Пересчитываем начисления по тарифам и объёмам и ищем ошибки
      </p>

      <div className="kv">
        {rows.map((r) => (
          <div key={r.label} className={`kv__row${progress >= r.at ? " is-visible" : ""}`}>
            <span className="muted">{r.label}</span>
            <b>{progress >= r.at ? r.value : "…"}</b>
          </div>
        ))}
      </div>

      <ProgressBar value={progress} />
      <span className="hint-text">{Math.round(progress)}%</span>
    </Card>
  );
};

export const AiAnalysis = () => {
  const { draft } = useDraft();
  if (!draft.receipt) return <Navigate to="/receipts/add" replace />;

  return (
    <>
      <PageHeader back="Отменить" title="Проверка на ошибки" subtitle={periodLabel(draft.receipt)} />
      <CheckProcess receipt={draft.receipt} />
    </>
  );
};
