import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CellHeader, CellList, CellSimple } from "@maxhub/max-ui";
import {
  Card,
  Donut,
  Dot,
  ErrorState,
  LoadingState,
  PageHeader,
  Row,
  SectionHeader,
  Sheet,
  StatTile,
  UserAvatar,
} from "../components/ui";
import { IconCheck, IconChevronDown } from "../components/Icons";
import { getReceipt, getReceipts } from "../api/receipts";
import { useApi } from "../hooks/useApi";
import { rub, rubRound, signedRubRound } from "../utils/format";
import {
  findPrevious,
  groupBySection,
  monthDative,
  receiptTotal,
  serviceTitle,
} from "../utils/receipt";
import { buildPeriods, rangeCaption, uniquePeriods } from "../utils/periods";
import { bridge } from "../bridge/max";

const PALETTE = ["#1a73ff", "#ff8a3d", "#7b61ff", "#12b76a", "#ff4d8d", "#00b8d9"];
const REST_COLOR = "#c3cad4";
const SECTION_COLORS = ["#1a73ff", "#ff8a3d", "#7b61ff", "#12b76a"];
const TOP_SERVICES = 6;

/** Суммирует начисления по услуге за все квитанции периода */
const aggregateCharges = (receipts) => {
  const byService = new Map();
  for (const r of receipts) {
    for (const c of r.service_charges) {
      const item = byService.get(c.service_name) ?? {
        service_name: c.service_name,
        section: c.section,
        total: 0,
        link: `/receipts/${r.id}/services/${c.id}`,
      };
      item.total += c.total ?? 0;
      byService.set(c.service_name, item);
    }
  }
  return [...byService.values()];
};

const serviceSegments = (items, withLinks) => {
  const sorted = items.filter((c) => c.total > 0).sort((a, b) => b.total - a.total);
  const segments = sorted.slice(0, TOP_SERVICES).map((c, i) => ({
    id: c.service_name,
    label: serviceTitle(c.service_name),
    value: c.total,
    color: PALETTE[i],
    link: withLinks ? c.link : undefined,
  }));
  const rest = sorted.slice(TOP_SERVICES);
  if (rest.length) {
    segments.push({
      id: "rest",
      label: "Остальное",
      hint: `ещё ${rest.length} усл.`,
      value: rest.reduce((s, c) => s + c.total, 0),
      color: REST_COLOR,
    });
  }
  return segments;
};

const PeriodStructure = ({ period }) => {
  const isMonth = period.receipts.length === 1;
  const { data: receipts, error, loading, retry } = useApi(
    () => Promise.all(period.receipts.map((r) => getReceipt(r.id))),
    [period.id],
  );

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={retry} />;

  const items = aggregateCharges(receipts);
  const total = receipts.reduce((s, r) => s + receiptTotal(r), 0);
  const services = serviceSegments(items, isMonth);
  const sections = groupBySection(items)
    .filter((g) => g.total > 0)
    .map((g, i) => ({
      id: g.section,
      label: g.label,
      value: g.total,
      color: SECTION_COLORS[i % SECTION_COLORS.length],
    }));
  const share = (v) => (total > 0 ? Math.round((v / total) * 100) : 0);

  return (
    <>
      <Card>
        <SectionHeader title="Структура расходов" />
        <div className="donut-wrap">
          <Donut segments={services} size={200} stroke={28}>
            <b className="donut__value">{rubRound(total)}</b>
            <span className="muted small">
              {isMonth ? period.label : period.label.toLowerCase()}
            </span>
          </Donut>
        </div>
        <div className="list">
          {services.map((s) => (
            <Row
              key={s.id}
              to={s.link}
              before={<Dot color={s.color} />}
              title={s.label}
              subtitle={s.hint}
              after={rub(s.value)}
              afterSub={`${share(s.value)}%`}
            />
          ))}
        </div>
      </Card>

      <Card>
        <SectionHeader title="По разделам" />
        <div className="donut-inline">
          <Donut segments={sections} size={112} stroke={18} />
          <div className="list donut-inline__legend">
            {sections.map((s) => (
              <Row
                key={s.id}
                before={<Dot color={s.color} />}
                title={s.label}
                after={`${share(s.value)}%`}
                afterSub={rubRound(s.value)}
              />
            ))}
          </div>
        </div>
      </Card>
    </>
  );
};

const PeriodTiles = ({ period, allMonths }) => {
  if (period.receipts.length === 1) {
    const receipt = period.receipts[0];
    const previous = findPrevious(allMonths, receipt);
    const average =
      allMonths.reduce((s, r) => s + receiptTotal(r), 0) / allMonths.length;
    const diff = previous ? receiptTotal(receipt) - receiptTotal(previous) : 0;
    return (
      <div className="grid-3">
        <StatTile label="Среднее" value={rubRound(average)} hint="в месяц" />
        <StatTile
          label={period.label}
          value={rubRound(receiptTotal(receipt))}
          hint="к оплате"
        />
        <StatTile
          label="Изменение"
          value={previous ? signedRubRound(diff) : "—"}
          hint={previous ? `к ${monthDative(previous)}` : "нет данных"}
          hintTone={!previous ? undefined : diff > 0 ? "danger" : "success"}
        />
      </div>
    );
  }

  const total = period.receipts.reduce((s, r) => s + receiptTotal(r), 0);
  return (
    <div className="grid-3">
      <StatTile label="Всего" value={rubRound(total)} hint="за период" />
      <StatTile
        label="В среднем"
        value={rubRound(total / period.receipts.length)}
        hint="в месяц"
      />
      <StatTile
        label="Месяцев"
        value={period.receipts.length}
        hint="с квитанциями"
      />
    </div>
  );
};

const PeriodOption = ({ period, selected, onSelect }) => (
  <CellSimple
    as="button"
    title={period.label}
    subtitle={period.receipts.length > 1 ? rangeCaption(period.receipts) : undefined}
    after={selected ? <IconCheck size={20} className="text-accent" /> : undefined}
    onClick={() => onSelect(period.id)}
  />
);

export const Analytics = () => {
  const { data, error, loading, retry } = useApi(getReceipts);
  const [params, setParams] = useSearchParams();
  const [pickerOpen, setPickerOpen] = useState(false);

  const allMonths = useMemo(() => uniquePeriods(data ?? []), [data]);
  const { ranges, months } = useMemo(() => buildPeriods(data ?? []), [data]);
  const period =
    [...months, ...ranges].find((p) => p.id === params.get("period")) ??
    months[0];

  const select = (id) => {
    bridge.haptic.selection();
    setParams({ period: id }, { replace: true });
    setPickerOpen(false);
  };

  return (
    <>
      <PageHeader
        title="Аналитика"
        subtitle="Структура и динамика расходов"
        right={<UserAvatar />}
      />

      {loading && <LoadingState />}
      {error && <ErrorState error={error} onRetry={retry} />}
      {data && !period && (
        <p className="muted center">
          Загрузите квитанцию, чтобы увидеть аналитику
        </p>
      )}

      {period && (
        <>
          <button
            type="button"
            className="card period-picker"
            onClick={() => {
              bridge.haptic.impact("light");
              setPickerOpen(true);
            }}
          >
            <span className="period-picker__text">
              <span className="muted small">Период</span>
              <b>{period.label}</b>
              {period.receipts.length > 1 && (
                <span className="muted small">{rangeCaption(period.receipts)}</span>
              )}
            </span>
            <IconChevronDown size={20} />
          </button>

          <PeriodTiles period={period} allMonths={allMonths} />
          <PeriodStructure period={period} />

          <Sheet
            open={pickerOpen}
            onClose={() => setPickerOpen(false)}
            title="Выберите период"
          >
            {ranges.length > 0 && (
              <CellList
                mode="island"
                filled
                header={<CellHeader>Периоды</CellHeader>}
              >
                {ranges.map((p) => (
                  <PeriodOption
                    key={p.id}
                    period={p}
                    selected={p.id === period.id}
                    onSelect={select}
                  />
                ))}
              </CellList>
            )}
            <CellList
              mode="island"
              filled
              header={<CellHeader>Месяцы</CellHeader>}
            >
              {months.map((p) => (
                <PeriodOption
                  key={p.id}
                  period={p}
                  selected={p.id === period.id}
                  onSelect={select}
                />
              ))}
            </CellList>
          </Sheet>
        </>
      )}
    </>
  );
};
