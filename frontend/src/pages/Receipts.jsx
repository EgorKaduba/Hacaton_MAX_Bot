import { useNavigate } from "react-router-dom";
import { Button } from "@maxhub/max-ui";
import {
  Badge,
  Card,
  ErrorState,
  IconBubble,
  LoadingState,
  PageHeader,
  Row,
  SectionHeader,
  UserAvatar,
} from "../components/ui";
import { ReceiptHero } from "../components/receipt";
import { IconPlus, IconReceipt } from "../components/Icons";
import { getReceipts } from "../api/receipts";
import { useApi } from "../hooks/useApi";
import { percent, rub, signedPercent } from "../utils/format";
import {
  findPrevious,
  periodLabel,
  receiptTotal,
  sortReceipts,
  statusInfo,
} from "../utils/receipt";

export const Receipts = () => {
  const navigate = useNavigate();
  const { data, error, loading, retry } = useApi(getReceipts);

  const receipts = sortReceipts(data ?? []);
  const latest = receipts[0];

  return (
    <>
      <PageHeader
        title="Квитанции"
        subtitle={data ? `Загружено: ${receipts.length}` : undefined}
        right={<UserAvatar />}
      />

      {latest && (
        <ReceiptHero
          receipt={latest}
          previous={findPrevious(receipts, latest)}
          badge={
            <Badge tone="on-accent">{statusInfo(latest.status).label}</Badge>
          }
          onClick={() => navigate(`/receipts/${latest.id}`)}
        />
      )}

      <Button
        size="large"
        stretched
        iconBefore={<IconPlus size={20} />}
        onClick={() => navigate("/receipts/add?from=receipts")}
      >
        Добавить квитанцию
      </Button>

      {loading && <LoadingState />}
      {error && <ErrorState error={error} onRetry={retry} />}

      {receipts.length > 0 && (
        <>
          <SectionHeader
            title="История"
            action={{ label: "Аналитика", to: "/analytics" }}
          />
          <Card className="list-card">
            {receipts.map((rc) => {
              const prev = findPrevious(receipts, rc);
              const pct = prev
                ? percent(receiptTotal(rc), receiptTotal(prev))
                : 0;
              const status = statusInfo(rc.status);
              return (
                <Row
                  key={rc.id}
                  to={`/receipts/${rc.id}`}
                  before={
                    <IconBubble size={36}>
                      <IconReceipt size={18} />
                    </IconBubble>
                  }
                  title={periodLabel(rc)}
                  subtitle={status.label}
                  after={rub(receiptTotal(rc))}
                  afterSub={
                    prev ? (
                      <span className={pct > 0 ? "text-danger" : "text-success"}>
                        {signedPercent(pct)}
                      </span>
                    ) : undefined
                  }
                  chevron
                />
              );
            })}
          </Card>
        </>
      )}

      {data && receipts.length === 0 && (
        <p className="muted center">Квитанций пока нет</p>
      )}
    </>
  );
};
