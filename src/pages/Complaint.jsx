import { useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@maxhub/max-ui";
import {
  BottomBar,
  Card,
  ErrorState,
  IconBubble,
  LoadingState,
  Notice,
  PageHeader,
} from "../components/ui";
import {
  IconCheckCircle,
  IconCopy,
  IconDownload,
  IconFile,
  IconShare,
} from "../components/Icons";
import { createComplaint, getReceipt } from "../api/receipts";
import { useApi } from "../hooks/useApi";
import { copyText } from "../utils/clipboard";
import { periodLabel } from "../utils/receipt";
import { bridge, isInsideMax } from "../bridge/max";

export const Complaint = () => {
  const { id } = useParams();
  const receiptReq = useApi(() => getReceipt(id), [id]);
  const complaintReq = useApi(() => createComplaint(id), [id]);
  const [copied, setCopied] = useState(false);
  const [downloadError, setDownloadError] = useState(null);

  const period = periodLabel(receiptReq.data);
  const text = complaintReq.data?.text;
  const pdfUrl = complaintReq.data?.pdf_url;
  const blobUrl = complaintReq.data?.blob_url;
  const fileName = `Жалоба ${period || `квитанция ${id}`}.pdf`;

  const copy = async () => {
    if (await copyText(text)) {
      bridge.haptic.notify("success");
      setCopied(true);
    }
  };

  const share = () => {
    bridge.haptic.impact("light");
    bridge
      .share(text ?? `Жалоба по квитанции ЖКУ за ${period.toLowerCase()}`, pdfUrl)
      .catch(() => {});
  };

  const download = async () => {
    setDownloadError(null);
    try {
      await bridge.downloadFile(isInsideMax() ? pdfUrl : (blobUrl ?? pdfUrl), fileName);
      bridge.haptic.notify("success");
    } catch (e) {
      bridge.haptic.notify("error");
      setDownloadError(e);
    }
  };

  return (
    <>
      <PageHeader
        back="Назад"
        title="Жалоба"
        subtitle={period && `Квитанция за ${period.toLowerCase()}`}
      />

      {complaintReq.loading && <LoadingState text="Формируем жалобу…" />}
      {complaintReq.error && (
        <ErrorState
          title="Не удалось сформировать жалобу"
          error={complaintReq.error}
          onRetry={complaintReq.retry}
        />
      )}

      {text && (
        <>
          <Notice tone="info" icon={<IconFile size={18} />}>
            Проверьте текст, впишите свои данные и отправьте его в управляющую
            компанию
          </Notice>
          <Card>
            <pre className="complaint-text">{text}</pre>
          </Card>
          <BottomBar>
            <Button
              size="large"
              stretched
              iconBefore={
                copied ? <IconCheckCircle size={20} /> : <IconCopy size={20} />
              }
              onClick={copy}
            >
              {copied ? "Скопировано" : "Скопировать текст"}
            </Button>
          </BottomBar>
          <Button
            variant="secondary"
            size="large"
            stretched
            iconBefore={<IconShare size={20} />}
            onClick={share}
          >
            Отправить в чат
          </Button>
        </>
      )}

      {!text && pdfUrl && (
        <>
          <Card className="complaint-pdf">
            <IconBubble size={56}>
              <IconFile size={28} />
            </IconBubble>
            <b>Претензия готова</b>
            <span className="muted small">
              PDF с таблицей нарушений и требованием перерасчёта. Впишите свои
              данные и отправьте в управляющую компанию.
            </span>
          </Card>
          <BottomBar>
            <Button
              size="large"
              stretched
              iconBefore={<IconDownload size={20} />}
              onClick={download}
            >
              Скачать PDF
            </Button>
          </BottomBar>
          <Button
            variant="secondary"
            size="large"
            stretched
            iconBefore={<IconShare size={20} />}
            onClick={share}
          >
            Отправить в чат
          </Button>
          {downloadError && (
            <p className="hint-text center">
              Не удалось скачать файл. Скачивание работает только внутри MAX
              и по https-ссылке.
            </p>
          )}
        </>
      )}
    </>
  );
};
