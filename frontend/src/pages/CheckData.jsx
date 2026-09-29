import { Navigate, useNavigate } from "react-router-dom";
import { Button } from "@maxhub/max-ui";
import {
  BottomBar,
  Card,
  Notice,
  PageHeader,
  SectionHeader,
} from "../components/ui";
import { IconCheck, IconCheckCircle, IconSparkle } from "../components/Icons";
import { useDraft } from "../state/draft";
import { bridge } from "../bridge/max";
import { rub } from "../utils/format";
import { periodLabel } from "../utils/receipt";

export const CheckData = () => {
  const navigate = useNavigate();
  const { draft } = useDraft();
  const receipt = draft.receipt;
  if (!receipt) return <Navigate to="/receipts/add" replace />;

  const fields = [
    { label: "Период", value: periodLabel(receipt) },
    {
      label: "Итого с учётом страхования",
      value: rub(receipt.total_with_insurance),
    },
    {
      label: "Итого без учёта страхования",
      value: rub(receipt.total_without_insurance),
    },
    { label: "Услуг в квитанции", value: receipt.service_charges?.length ?? 0 },
    { label: "Счётчиков", value: receipt.meter_infos?.length ?? 0 },
    { label: "Перерасчётов", value: receipt.recalculations?.length ?? 0 },
  ];

  return (
    <>
      <PageHeader back="Отменить" title="Проверка данных" subtitle="Шаг 2 из 3" />

      <Notice tone="success" icon={<IconCheckCircle size={18} />}>
        Квитанция распознана. Проверьте основные данные перед проверкой на
        ошибки.
      </Notice>

      <Card>
        <SectionHeader title={`Квитанция за ${periodLabel(receipt).toLowerCase()}`} />
        <div className="fields">
          {fields.map((f) => (
            <div key={f.label} className="field">
              <span className="field__mark">
                <IconCheck size={14} strokeWidth={2.6} />
              </span>
              <div className="field__body">
                <span className="field__label">{f.label}</span>
                <span className="field__value">{f.value}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <BottomBar>
        <Button
          size="large"
          stretched
          iconBefore={<IconSparkle size={20} />}
          onClick={() => {
            bridge.haptic.impact("medium");
            navigate("/receipts/add/analysis", { replace: true });
          }}
        >
          Проверить на ошибки
        </Button>
      </BottomBar>
    </>
  );
};
