import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@maxhub/max-ui";
import { QRCodeSVG } from "qrcode.react";
import { Badge, Card, IconBubble, Notice, Sheet } from "./ui";
import { IconAlert, IconCheckCircle, IconCopy, IconFile } from "./Icons";
import { bridge } from "../bridge/max";
import { copyText } from "../utils/clipboard";
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
  isHttpUrl,
  monthDative,
  overpayment,
  paymentLink,
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
  const diff = hasValues ? error.actual - error.expected : 0;
  return (
    <Card className="error-item">
      <Badge tone={severityTone(error.severity)}>
        {errorTypeLabel(error.type)}
      </Badge>
      <p className="error-item__text">{error.description}</p>
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

export const PaymentSheet = ({ open, onClose, receipt }) => {
  const link = paymentLink(receipt);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (await copyText(link)) {
      bridge.haptic.notify("success");
      setCopied(true);
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title="QR-код для оплаты">
      {link ? (
        <>
          <div className="qr-box">
            <QRCodeSVG value={link} size={216} marginSize={2} />
          </div>
          <p className="muted small center">
            Отсканируйте код в приложении банка
            {isHttpUrl(link) && " или откройте ссылку для оплаты"}
          </p>
          {isHttpUrl(link) && (
            <Button
              size="large"
              stretched
              onClick={() => {
                bridge.haptic.impact("medium");
                bridge.openLink(link);
              }}
            >
              Перейти к оплате
            </Button>
          )}
          <Button
            size="large"
            variant="secondary"
            stretched
            iconBefore={<IconCopy size={18} />}
            onClick={copy}
          >
            {copied ? "Скопировано" : "Скопировать ссылку"}
          </Button>
        </>
      ) : (
        <p className="muted center">
          В квитанции не найден QR-код для оплаты
        </p>
      )}
    </Sheet>
  );
};
