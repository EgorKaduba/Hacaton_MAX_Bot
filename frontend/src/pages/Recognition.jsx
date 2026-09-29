import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { Button, Spinner, Typography } from "@maxhub/max-ui";
import { Badge, Card, ErrorState, PageHeader, ProgressRing } from "../components/ui";
import { IconCheck } from "../components/Icons";
import { uploadReceipt } from "../api/receipts";
import { useClosingConfirmation } from "../bridge/hooks";
import { useProcess } from "../hooks/useProcess";
import { useDraft } from "../state/draft";
import { bridge } from "../bridge/max";

const STEPS = [
  { label: "Файл загружен", at: 0 },
  { label: "Распознаём период", at: 30 },
  { label: "Распознаём услуги", at: 60 },
  { label: "Проверяем суммы", at: 90 },
];

const RecognitionProcess = ({ file }) => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const addPath =
    params.get("from") === "receipts"
      ? "/receipts/add?from=receipts"
      : "/receipts/add";
  const { setReceipt } = useDraft();
  const { progress, error, retry } = useProcess(() => uploadReceipt(file), {
    minDuration: 4000,
    onDone: (receipt) => {
      bridge.haptic.notify("success");
      setReceipt(receipt);
      navigate("/receipts/add/check", { replace: true });
    },
  });
  useClosingConfirmation(!error);

  if (error)
    return (
      <>
        <ErrorState
          title="Не удалось распознать квитанцию"
          error={error}
          onRetry={retry}
        />
        <Button
          variant="secondary"
          size="large"
          stretched
          onClick={() => navigate(addPath, { replace: true })}
        >
          Выбрать другой файл
        </Button>
      </>
    );

  return (
    <>
      <Card className="processing">
        <ProgressRing value={progress} />
        <Typography.Title variant="medium-strong">Распознаём данные</Typography.Title>
        <p className="muted center">
          Это займёт несколько секунд. Мы извлекаем период, начисления, объёмы
          и итоговую сумму.
        </p>

        <div className="steps">
          {STEPS.map((s, i) => {
            const next = STEPS[i + 1]?.at ?? 100;
            const done = progress >= next;
            const active = !done && progress >= s.at;
            return (
              <div
                key={s.label}
                className={`steps__item${done ? " is-done" : active ? " is-active" : ""}`}
              >
                <span className="steps__mark">
                  {done ? (
                    <IconCheck size={14} strokeWidth={2.6} />
                  ) : active ? (
                    <Spinner size={16} />
                  ) : null}
                </span>
                <span className="steps__label">{s.label}</span>
                {done && <Badge tone="success">Готово</Badge>}
              </div>
            );
          })}
        </div>
      </Card>

      <p className="hint-text center">
        Не закрывайте приложение — после распознавания вы сможете проверить
        данные
      </p>
    </>
  );
};

export const Recognition = () => {
  const { draft } = useDraft();
  if (!draft.file) return <Navigate to="/receipts/add" replace />;

  return (
    <>
      <PageHeader back="Отменить" title="Распознавание" subtitle={draft.file.name} />
      <RecognitionProcess file={draft.file} />
    </>
  );
};
