import { useNavigate } from "react-router-dom";
import { CellList, CellSimple, Counter } from "@maxhub/max-ui";
import { Card, IconBubble, PageHeader } from "../components/ui";
import { IconBell, IconHelp, IconUser } from "../components/Icons";
import { NOTIFICATIONS } from "../data/content";
import { bridge } from "../bridge/max";

export const Profile = () => {
  const navigate = useNavigate();
  const unread = NOTIFICATIONS.filter((n) => n.unread).length;

  const go = (to) => () => {
    bridge.haptic.impact("light");
    navigate(to);
  };

  return (
    <>
      <PageHeader
        back="Главная"
        title="Профиль"
        subtitle="Настройки и уведомления"
      />

      <Card className="profile-card">
        <span className="avatar-fallback avatar-fallback--lg">
          <IconUser size={28} />
        </span>
        <div>
          <b className="profile-card__name">Аккаунт</b>
          <span className="muted small">Уведомления и помощь</span>
        </div>
      </Card>

      <CellList mode="island" filled>
        <CellSimple
          as="button"
          onClick={go("/notifications")}
          before={
            <IconBubble size={32}>
              <IconBell size={18} />
            </IconBubble>
          }
          title="Уведомления"
          after={
            unread ? (
              <Counter value={unread} variant="attention" rounded />
            ) : undefined
          }
          showChevron
        />

        <CellSimple
          as="button"
          onClick={go("/help")}
          before={
            <IconBubble size={32}>
              <IconHelp size={18} />
            </IconBubble>
          }
          title="Помощь и FAQ"
          showChevron
        />
      </CellList>
    </>
  );
};
