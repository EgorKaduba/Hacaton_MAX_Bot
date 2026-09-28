import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { bridge } from "./max";

const ROOT_ROUTES = new Set([
  "/",
  "/home",
  "/receipts",
  "/analytics",
  "/assistant",
]);

/** Синхронизирует нативную кнопку «Назад» MAX с роутером */
export const useMaxBackButton = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (ROOT_ROUTES.has(location.pathname)) {
      bridge.backButton.hide();
      return;
    }

    const onBack = () => {
      bridge.haptic.impact("light");
      navigate(-1);
    };

    bridge.backButton.show();
    bridge.backButton.onClick(onBack);
    return () => {
      bridge.backButton.offClick(onBack);
    };
  }, [location.pathname, navigate]);
};

/** Предупреждение о потере данных при закрытии мини-приложения */
export const useClosingConfirmation = (enabled = true) => {
  useEffect(() => {
    if (!enabled) return;
    bridge.closingConfirmation(true);
    return () => bridge.closingConfirmation(false);
  }, [enabled]);
};
