import { useState } from "react";
import { useParams } from "react-router-dom";
import { Button, IconButton } from "@maxhub/max-ui";
import {
  Badge,
  BottomBar,
  Card,
  ErrorState,
  LoadingState,
  PageHeader,
  Row,
  SectionHeader,
} from "../components/ui";
import {
  CheckSummary,
  PaymentSheet,
  chargeSubtitle,
} from "../components/receipt";
import { IconQr, IconShare } from "../components/Icons";
import { getReceipt, getReceiptCheck } from "../api/receipts";
import { useApi } from "../hooks/useApi";
import { num, rub, signedRub } from "../utils/format";
import {
  groupBySection,
  isHttpUrl,
  paymentLink,
  periodLabel,
  receiptTotal,
  serviceTitle,
  statusInfo,
} from "../utils/receipt";
import { bridge } from "../bridge/max";

export const ReceiptDetails = () => {
  const { id } = useParams();
  const receiptReq = useApi(() => getReceipt(id), [id]);
  const checkReq = useApi(() => getReceiptCheck(id), [id]);
  const [qrOpen, setQrOpen] = useState(false);

  const receipt = receiptReq.data;
  const period = periodLabel(receipt);

  if (receiptReq.loading)
    return (
      <>
        <PageHeader back="Квитанции" title="Квитанция" />
        <LoadingState />
      </>
    );
  if (receiptReq.error)
    return (
      <>
        <PageHeader back="Квитанции" title="Квитанция" />
        <ErrorState error={receiptReq.error} onRetry={receiptReq.retry} />
      </>
    );

  const link = paymentLink(receipt);
  const status = statusInfo(receipt.status);

  const pay = () => {
    bridge.haptic.impact("medium");
    if (isHttpUrl(link)) bridge.openLink(link);
    else setQrOpen(true);
  };

  const share = () => {
    bridge.haptic.impact("light");
    bridge
      .share(`Квитанция ЖКУ за ${period.toLowerCase()}: ${rub(receiptTotal(receipt))}`)
      .catch(() => {});
  };

  return (
    <>
      <PageHeader
        back="Квитанции"
        title="Детали квитанции"
        subtitle={period}
        right={
          <button
            type="button"
            className="icon-plain"
            aria-label="Поделиться"
            onClick={share}
          >
            <IconShare size={22} />
          </button>
        }
      />

      <Card>
        <div className="summary">
          <div>
            <span className="summary__label">Итого к оплате</span>
            <span className="summary__sum">{rub(receiptTotal(receipt))}</span>
          </div>
          <Badge tone={status.tone}>{status.label}</Badge>
        </div>
        {receipt.total_without_insurance != null && (
          <p className="muted small">
            Без учёта добровольного страхования:{" "}
            {rub(receipt.total_without_insurance)}
          </p>
        )}
      </Card>

      {checkReq.loading && <LoadingState text="Проверяем квитанцию на ошибки…" />}
      {checkReq.error && (
        <ErrorState
          title="Не удалось проверить квитанцию"
          error={checkReq.error}
          onRetry={checkReq.retry}
        />
      )}
      {checkReq.data && <CheckSummary receiptId={id} check={checkReq.data} />}

      {groupBySection(receipt.service_charges).map((group) => (
        <Card key={group.section}>
          <SectionHeader title={group.label} />
          <div className="list">
            {group.items.map((c) => (
              <Row
                key={c.id}
                to={`/receipts/${id}/services/${c.id}`}
                title={serviceTitle(c.service_name)}
                subtitle={chargeSubtitle(c)}
                after={rub(c.total)}
                afterSub={
                  c.recalculation ? (
                    <span
                      className={c.recalculation < 0 ? "text-success" : "text-danger"}
                    >
                      перерасчёт {signedRub(c.recalculation)}
                    </span>
                  ) : undefined
                }
              />
            ))}
          </div>
        </Card>
      ))}

      {receipt.recalculations?.length > 0 && (
        <Card>
          <SectionHeader title="Перерасчёты" />
          <div className="list">
            {receipt.recalculations.map((r) => (
              <Row
                key={r.id}
                title={serviceTitle(r.service_name)}
                subtitle={r.reason}
                after={signedRub(r.amount)}
                afterTone={r.amount < 0 ? "success" : "danger"}
              />
            ))}
          </div>
        </Card>
      )}

      {receipt.coefficients?.length > 0 && (
        <Card>
          <SectionHeader title="Повышающие коэффициенты" />
          <div className="list">
            {receipt.coefficients.map((k) => (
              <Row
                key={k.id}
                title={serviceTitle(k.service_name)}
                subtitle={`Коэффициент ×${num(k.coefficient)}`}
                after={signedRub(k.excess_amount)}
                afterSub="сверх тарифа"
                afterTone="danger"
              />
            ))}
          </div>
        </Card>
      )}

      {receipt.meter_infos?.length > 0 && (
        <Card>
          <SectionHeader title="Показания счётчиков" />
          <div className="list">
            {receipt.meter_infos.map((m) => (
              <Row
                key={m.id}
                title={serviceTitle(m.service_name)}
                subtitle={`${m.meter_type} № ${m.meter_number} · ${num(m.previous_reading)} → ${num(m.current_reading)}`}
                after={num(m.consumption)}
                afterSub="расход"
              />
            ))}
          </div>
        </Card>
      )}

      <BottomBar>
        <IconButton
          size="large"
          variant="secondary"
          aria-label="QR-код для оплаты"
          disabled={!link}
          onClick={() => {
            bridge.haptic.impact("light");
            setQrOpen(true);
          }}
        >
          <IconQr size={22} />
        </IconButton>
        <Button size="large" stretched disabled={!link} onClick={pay}>
          Оплатить {rub(receiptTotal(receipt))}
        </Button>
      </BottomBar>
      {!link && (
        <p className="hint-text center">
          В квитанции не найден QR-код для оплаты
        </p>
      )}

      <PaymentSheet
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        receipt={receipt}
      />
    </>
  );
};
