import { useNavigate } from "react-router-dom";
import { Button } from "@maxhub/max-ui";
import { Badge, Card, IconBubble, Notice } from "./ui";
import { IconAlert, IconCheckCircle, IconFile } from "./Icons";
import {
  formatDate,
  num,
  percent,
  rub,
  signedPercent,
  signedRub,
} from "../utils/format";
import {
  errorTypeLabel,
  monthDative,
  overpayment,
  periodLabel,
  receiptTotal,
  severityTone,
} from "../utils/receipt";

export const chargeSubtitle = (c) =>
  `${num(c.volume, 4)} ${c.unit} × ${num(c.tariff, 4)} ₽`;

export const ReceiptHero = ({
  receipt,
  previous,
  label,
  badge,
  onClick,
  children,
}) => {
  const total = receiptTotal(receipt);
  const prevTotal = previous ? receiptTotal(previous) : 0;
  const diff = total - prevTotal;

  return (
    <Card tone="accent" className="hero" onClick={onClick}>
      <div className="hero__top">
        <span className="hero__label">{label ?? periodLabel(receipt)}</span>
        {badge}
      </div>
      <span className="hero__sum">{rub(total)}</span>
      {previous && (
        <div className="hero__meta">
          <Badge tone={diff > 0 ? "on-accent-danger" : "on-accent-success"}>
            {signedRub(diff)}
          </Badge>
          <span>
            {signedPercent(percent(total, prevTotal))} к {monthDative(previous)}
          </span>
        </div>
      )}
      {children}
    </Card>
  );
};

export const CheckSummary = ({ receiptId, check }) => {
  const navigate = useNavigate();
  const errors = check.errors ?? [];

  if (!check.has_errors) {
    return (
      <Notice
        tone="success"
        icon={<IconCheckCircle size={18} />}
        title="Ошибок не найдено"
      >
        {check.checked_at && `Проверено ${formatDate(check.checked_at)}`}
      </Notice>
    );
  }

  const extra = overpayment(errors);
  return (
    <Card tone="danger" className="check-card">
      <div className="check-card__head">
        <IconBubble size={40} color="var(--dk-danger)" bg="#fff">
          <IconAlert size={20} />
        </IconBubble>
        <div>
          <b>Найдено ошибок: {errors.length}</b>
          {extra > 0 && (
            <span className="small">Возможная переплата {rub(extra)}</span>
          )}
        </div>
      </div>
      {errors.slice(0, 2).map((e, i) => (
        <p key={i} className="check-card__text">
          {e.description}
        </p>
      ))}
      <div className="grid-2">
        <Button
          size="medium"
          stretched
          iconBefore={<IconFile size={18} />}
          onClick={() => navigate(`/receipts/${receiptId}/complaint`)}
        >
          Подать жалобу
        </Button>
        <Button
          size="medium"
          variant="secondary"
          stretched
          onClick={() => navigate(`/receipts/${receiptId}/errors`)}
        >
          Подробнее
        </Button>
      </div>
    </Card>
  );
};

export const ErrorItem = ({ error }) => {
  const hasValues = error.actual != null && error.expected != null;
  const diff = error.delta ?? (hasValues ? error.actual - error.expected : 0);
  return (
    <Card className="error-item">
      <div className="error-item__badges">
        <Badge tone={severityTone(error.severity)}>
          {errorTypeLabel(error.type)}
        </Badge>
        {error.confidence === "needs_proof" && (
          <Badge tone="neutral">Нужно обоснование</Badge>
        )}
      </div>
      <p className="error-item__text">{error.description}</p>
      {error.recommended_action && (
        <p className="error-item__action">{error.recommended_action}</p>
      )}
      {error.legal_ref && (
        <span className="muted small">{error.legal_ref}</span>
      )}
      {hasValues && (
        <div className="error-item__values">
          <div>
            <span>В квитанции</span>
            <b>{rub(error.actual)}</b>
          </div>
          <div>
            <span>Должно быть</span>
            <b>{rub(error.expected)}</b>
          </div>
          <div>
            <span>Разница</span>
            <b className={diff > 0 ? "text-danger" : "text-success"}>
              {signedRub(diff)}
            </b>
          </div>
        </div>
      )}
    </Card>
  );
};

