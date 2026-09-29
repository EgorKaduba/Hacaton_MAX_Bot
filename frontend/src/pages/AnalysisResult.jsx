import { Navigate, useNavigate } from "react-router-dom";
import { Button } from "@maxhub/max-ui";
import { Badge, BottomBar, PageHeader } from "../components/ui";
import { CheckSummary, ReceiptHero } from "../components/receipt";
import { useDraft } from "../state/draft";
import { periodLabel, statusInfo } from "../utils/receipt";
import { bridge } from "../bridge/max";

export const AnalysisResult = () => {
  const navigate = useNavigate();
  const { draft, reset } = useDraft();
  const { receipt, check } = draft;
  if (!receipt || !check) return <Navigate to="/receipts" replace />;

  const finish = (to) => {
    bridge.haptic.impact("light");
    reset();
    navigate(to, { replace: true });
  };

  return (
    <>
      <PageHeader
        back={{ label: "Главная", to: "/home" }}
        title="Результат проверки"
        subtitle={`Шаг 3 из 3 · ${periodLabel(receipt)}`}
      />

      <ReceiptHero
        receipt={receipt}
        label="Итого к оплате"
        badge={<Badge tone="on-accent">{statusInfo(receipt.status).label}</Badge>}
      />

      <CheckSummary receiptId={receipt.id} check={check} />

      <BottomBar>
        <Button size="large" stretched onClick={() => finish(`/receipts/${receipt.id}`)}>
          Открыть квитанцию
        </Button>
      </BottomBar>
      <Button variant="secondary" size="large" stretched onClick={() => finish("/home")}>
        Готово
      </Button>
    </>
  );
};
