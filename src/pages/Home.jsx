import { useNavigate } from "react-router-dom";
import { Button } from "@maxhub/max-ui";
import {
  Badge,
  Card,
  ErrorState,
  LoadingState,
  PageHeader,
  UserAvatar,
} from "../components/ui";
import { ReceiptHero } from "../components/receipt";
import { IconPlus, IconSparkle, IconUpload } from "../components/Icons";
import { getReceipts } from "../api/receipts";
import { useApi } from "../hooks/useApi";
import { useUser } from "../hooks/useUser";
import { greeting } from "../utils/format";
import {
  findPrevious,
  sortReceipts,
  statusInfo,
} from "../utils/receipt";
import { bridge } from "../bridge/max";

export const Home = () => {
  const navigate = useNavigate();
  const user = useUser();
  const { data, error, loading, retry } = useApi(getReceipts);

  const receipts = sortReceipts(data ?? []);
  const latest = receipts[0];
  const previous = latest && findPrevious(receipts, latest);

  return (
    <>
      <PageHeader
        large
        title={`${greeting()}, ${user.firstName}`}
        subtitle={user.address}
        right={<UserAvatar />}
      />

      {loading && <LoadingState />}
      {error && <ErrorState error={error} onRetry={retry} />}

      {!loading && !error && latest && (
        <ReceiptHero
          receipt={latest}
          previous={previous}
          label={`К оплате за ${String(latest.period_month).toLowerCase()} ${latest.period_year}`}
          badge={
            <Badge tone="on-accent">{statusInfo(latest.status).label}</Badge>
          }
        >
          <Button
            variant="primary-contrast"
            size="medium"
            stretched
            onClick={() => {
              bridge.haptic.impact("light");
              navigate(`/receipts/${latest.id}`);
            }}
          >
            Открыть детали
          </Button>
        </ReceiptHero>
      )}

      {!loading && !error && !latest && (
        <Card className="empty-card" onClick={() => navigate("/receipts/add")}>
          <IconUpload size={28} />
          <b>Загрузите первую квитанцию</b>
          <span className="muted small">
            Мы распознаем начисления и проверим их на ошибки
          </span>
        </Card>
      )}

      <div className="grid-2">
        <Card className="action-tile" onClick={() => navigate("/receipts/add")}>
          <span className="action-tile__icon">
            <IconPlus size={20} />
          </span>
          Добавить квитанцию
        </Card>
        <Card className="action-tile" onClick={() => navigate("/assistant")}>
          <span className="action-tile__icon">
            <IconSparkle size={20} />
          </span>
          Спросить AI
        </Card>
      </div>
    </>
  );
};
