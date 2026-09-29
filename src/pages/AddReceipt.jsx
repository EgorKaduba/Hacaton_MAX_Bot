import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, IconBubble, Notice, PageHeader } from "../components/ui";
import { IconChevronRight, IconLock, IconUpload } from "../components/Icons";
import { useDraft } from "../state/draft";
import { bridge } from "../bridge/max";

const MAX_SIZE = 10 * 1024 * 1024;

export const AddReceipt = () => {
  const navigate = useNavigate();
  const { start } = useDraft();
  const fileRef = useRef(null);
  const [error, setError] = useState(null);

  const onPick = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.type !== "application/pdf" && !/\.pdf$/i.test(file.name)) {
      bridge.haptic.notify("error");
      setError("Нужен PDF-файл квитанции");
      return;
    }
    if (file.size > MAX_SIZE) {
      bridge.haptic.notify("error");
      setError("Файл больше 10 МБ — выберите файл поменьше");
      return;
    }
    setError(null);
    bridge.haptic.notify("success");
    start(file);
    navigate("/receipts/add/recognition");
  };

  return (
    <>
      <PageHeader
        back="Главная"
        title="Добавить квитанцию"
        subtitle="Загрузите файл квитанции"
      />

      <p className="step-label">Шаг 1 из 3</p>

      <Card
        tone="info"
        className="upload-option upload-option--primary"
        onClick={() => fileRef.current?.click()}
      >
        <IconBubble bg="var(--dk-accent)" color="#fff" size={44}>
          <IconUpload size={22} />
        </IconBubble>
        <span className="upload-option__title">Загрузить файл</span>
        <span className="upload-option__text">
          PDF-файл квитанции (ЕПД) до 10 МБ. Мы распознаем начисления и
          проверим их на ошибки
        </span>
        <span className="upload-option__link">
          Выбрать <IconChevronRight size={14} />
        </span>
      </Card>

      {error && <p className="hint-text text-danger">{error}</p>}

      <input
        ref={fileRef}
        type="file"
        accept="application/pdf,.pdf"
        hidden
        onChange={onPick}
      />

      <Notice tone="success" icon={<IconLock size={18} />}>
        Данные защищены и используются только для анализа ваших начислений
      </Notice>
    </>
  );
};
