import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@maxhub/max-ui";
import {
  BottomBar,
  Card,
  Donut,
  ErrorState,
  LoadingState,
  Notice,
  PageHeader,
  SectionHeader,
} from "../components/ui";
import { IconAlert, IconInfo, IconSparkle } from "../components/Icons";
import { getReceipt } from "../api/receipts";
import { useApi } from "../hooks/useApi";
import { num, rub, signedRub } from "../utils/format";
import {
  periodLabel,
  receiptTotal,
  sectionLabel,
  serviceTitle,
} from "../utils/receipt";
import { bridge } from "../bridge/max";

const KvRow = ({ label, value, tone }) => (
  <div className="kv__row is-visible">
    <span className="muted">{label}</span>
    <b className={tone ? `text-${tone}` : undefined}>{value}</b>
  </div>
);

export const ServiceDetails = () => {
  const { id, chargeId } = useParams();
  const navigate = useNavigate();
  const { data: receipt, error, loading, retry } = useApi(
    () => getReceipt(id),
    [id],
  );

  const header = (title, subtitle) => (
    <PageHeader back="Квитанция" title={title} subtitle={subtitle} />
  );

  if (loading) return <>{header("Услуга")}<LoadingState /></>;
  if (error) return <>{header("Услуга")}<ErrorState error={error} onRetry={retry} /></>;

  const charge = receipt.service_charges.find((c) => String(c.id) === chargeId);
  if (!charge)
    return <>{header("Услуга")}<ErrorState title="Услуга не найдена" /></>;

  const title = serviceTitle(charge.service_name);
  const total = receiptTotal(receipt);
  const share = total > 0 ? Math.round((charge.total / total) * 100) : 0;
  const recalcs = (receipt.recalculations ?? []).filter(
    (r) => r.service_name === charge.service_name,
  );
  const coefficient = (receipt.coefficients ?? []).find(
    (k) => k.service_name === charge.service_name,
  );

  return (
    <>
      {header(title, `${periodLabel(receipt)} · ${sectionLabel(charge.section).toLowerCase()}`)}

      <Card tone="accent" className="hero">
        <span className="hero__label">К оплате по услуге</span>
        <span className="hero__sum">{rub(charge.total)}</span>
        <div className="hero__meta">
          <span>
            {num(charge.volume, 4)} {charge.unit} × {num(charge.tariff, 4)} ₽
          </span>
        </div>
      </Card>

      <Card className="share-card">
        <Donut
          size={96}
          stroke={14}
          segments={[
            { id: "service", value: Math.max(charge.total, 0), color: "var(--dk-accent)" },
            { id: "rest", value: Math.max(total - charge.total, 0), color: "var(--dk-accent-soft)" },
          ]}
        >
          <b>{share}%</b>
        </Donut>
        <div>
          <b>Доля в квитанции</b>
          <span className="muted small">
            {rub(charge.total)} из {rub(total)}
          </span>
        </div>
      </Card>

      <Card>
        <SectionHeader title="Начисление" />
        <div className="kv">
          <KvRow label="Объём" value={`${num(charge.volume, 4)} ${charge.unit}`} />
          <KvRow label="Тариф" value={`${num(charge.tariff, 4)} ₽`} />
          <KvRow label="Начислено" value={rub(charge.amount)} />
          {charge.benefit != null && (
            <KvRow label="Льгота" value={rub(charge.benefit)} tone="success" />
          )}
          {!!charge.recalculation && (
            <KvRow
              label="Перерасчёт"
              value={signedRub(charge.recalculation)}
              tone={charge.recalculation < 0 ? "success" : "danger"}
            />
          )}
          <KvRow label="Долг на начало периода" value={rub(charge.debt_start)} />
          <KvRow label="Оплачено" value={rub(charge.paid)} />
          <KvRow label="Итого к оплате" value={rub(charge.total)} />
        </div>
      </Card>

      {coefficient && (
        <Notice tone="warning" icon={<IconAlert size={18} />} title={`Повышающий коэффициент ×${num(coefficient.coefficient)}`}>
          Начислено сверх тарифа: {rub(coefficient.excess_amount)}
        </Notice>
      )}

      {recalcs.map((r) => (
        <Notice key={r.id} tone="info" icon={<IconInfo size={18} />} title={`Перерасчёт ${signedRub(r.amount)}`}>
          {r.reason}
        </Notice>
      ))}

      <BottomBar>
        <Button
          size="large"
          stretched
          iconBefore={<IconSparkle size={20} />}
          onClick={() => {
            bridge.haptic.impact("light");
            navigate(`/assistant?q=${encodeURIComponent(`Расскажи про услугу «${title}»`)}`);
          }}
        >
          Спросить AI об услуге
        </Button>
      </BottomBar>
    </>
  );
};
