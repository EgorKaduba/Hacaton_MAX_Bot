import { useNavigate } from "react-router-dom";
import { Button, Typography } from "@maxhub/max-ui";
import { bridge } from "../bridge/max";
import { IconCheck, IconReceipt } from "../components/Icons";
import { ONBOARDING_KEY } from "../constants";

export const Onboarding = () => {
  const navigate = useNavigate();

  const finish = async () => {
    bridge.haptic.impact("medium");
    await bridge.storage.set(ONBOARDING_KEY, "1");
    navigate("/home", { replace: true });
  };

  return (
    <div className="onboarding">
      <div className="onboarding__hero">
        <div className="onboarding__brand">
          <span className="onboarding__logo">ДК</span>
          ДомКвит
        </div>
        <div className="onboarding__card">
          <div className="onboarding__card-top">
            <span className="onboarding__card-icon">
              <IconReceipt size={20} />
            </span>
            <span className="onboarding__card-month">Август</span>
          </div>
          <span className="onboarding__card-sum">8 420 ₽</span>
          <span className="onboarding__card-badge">
            <IconCheck size={12} strokeWidth={2.6} /> Проверено AI
          </span>
          <span className="onboarding__card-line" />
          <span className="onboarding__card-line onboarding__card-line--short" />
        </div>
      </div>

      <div className="onboarding__body">
        <Typography.Headline variant="large-strong" asChild>
          <h1 className="onboarding__title">Платите за ЖКУ без сюрпризов</h1>
        </Typography.Headline>
        <p className="onboarding__text">
          Загрузите квитанцию — AI найдёт необычные начисления и объяснит,
          почему изменилась сумма.
        </p>
        <ul className="onboarding__features">
          <li>
            <IconCheck size={14} strokeWidth={2.6} /> Анализ за 10 секунд
          </li>
          <li>
            <IconCheck size={14} strokeWidth={2.6} /> Динамика расходов
          </li>
        </ul>

        <div className="onboarding__actions">
          <Button size="large" stretched onClick={finish}>
            Начать
          </Button>
          <button type="button" className="link-button" onClick={finish}>
            Уже есть аккаунт? <b>Войти</b>
          </button>
        </div>
      </div>
    </div>
  );
};
