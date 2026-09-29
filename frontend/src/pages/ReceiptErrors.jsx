import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@maxhub/max-ui";
import {
  Badge,
  BottomBar,
  Card,
  ErrorState,
  IconBubble,
  LoadingState,
  Notice,
  PageHeader,
} from "../components/ui";
import { ErrorItem } from "../components/receipt";
import {
  IconAlert,
  IconCheckCircle,
  IconFile,
  IconSparkle,
} from "../components/Icons";
import { getReceipt, getReceiptCheck } from "../api/receipts";
import { useApi } from "../hooks/useApi";
import { formatDate, rub } from "../utils/format";
import { overpayment, periodLabel } from "../utils/receipt";

export const ReceiptErrors = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const receiptReq = useApi(() => getReceipt(id), [id]);
  const checkReq = useApi(() => getReceiptCheck(id), [id]);

  const check = checkReq.data;
  const errors = check?.errors ?? [];
  const subtitle = [
    periodLabel(receiptReq.data),
    check?.checked_at && `проверено ${formatDate(check.checked_at)}`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <PageHeader back="Квитанция" title="Ошибки в квитанции" subtitle={subtitle} />

      {checkReq.loading && <LoadingState text="Проверяем квитанцию…" />}
      {checkReq.error && (
        <ErrorState error={checkReq.error} onRetry={checkReq.retry} />
      )}

      {check && !check.has_errors && (
        <Notice tone="success" icon={<IconCheckCircle size={18} />} title="Ошибок не найдено">
          Начисления в квитанции совпадают с расчётом
        </Notice>
      )}

      {check?.has_errors && (
        <>
          <Card tone="danger" className="errors-hero">
            <div className="hero__top">
              <IconBubble size={40} color="var(--dk-danger)" bg="#fff">
                <IconAlert size={20} />
              </IconBubble>
              <Badge tone="danger">Требует внимания</Badge>
            </div>
            <span className="errors-hero__title">
              Найдено ошибок: {errors.length}
            </span>
            {overpayment(errors) > 0 && (
              <span className="errors-hero__sum">
                {rub(overpayment(errors))}
              </span>
            )}
            <span className="muted small">
              Возможная переплата по найденным ошибкам
            </span>
          </Card>

          {errors.map((e, i) => (
            <ErrorItem key={i} error={e} />
          ))}

          <BottomBar>
            <Button
              size="large"
              stretched
              iconBefore={<IconFile size={20} />}
              onClick={() => navigate(`/receipts/${id}/complaint`)}
            >
              Подать жалобу
            </Button>
          </BottomBar>
          <Button
            variant="secondary"
            size="large"
            stretched
            iconBefore={<IconSparkle size={20} />}
            onClick={() =>
              navigate(`/assistant?q=${encodeURIComponent("Какие ошибки в квитанции?")}`)
            }
          >
            Обсудить с AI
          </Button>
        </>
      )}
    </>
  );
};
