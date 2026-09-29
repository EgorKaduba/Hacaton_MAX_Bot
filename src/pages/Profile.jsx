import { useNavigate } from "react-router-dom";
import { Avatar, CellList, CellSimple, Counter } from "@maxhub/max-ui";
import { Card, IconBubble, PageHeader } from "../components/ui";
import { IconBell, IconHelp, IconShield } from "../components/Icons";
import { useUser } from "../hooks/useUser";
import { initials } from "../utils/format";
import { NOTIFICATIONS } from "../data/content";
import { bridge } from "../bridge/max";

export const Profile = () => {
  const navigate = useNavigate();
  const user = useUser();
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
        subtitle="Управление аккаунтом"
      />

      <Card className="profile-card">
        <Avatar.Container size={56} form="circle">
          {user.photoUrl ? (
            <Avatar.Image src={user.photoUrl} alt="" />
          ) : (
            <Avatar.Text gradient="blue">
              {initials(user.firstName, user.lastName)}
            </Avatar.Text>
          )}
        </Avatar.Container>
        <div>
          <b className="profile-card__name">
            {user.firstName} {user.lastName}
          </b>
          <span className="muted small">
            {user.username ? `@${user.username}` : user.email}
          </span>
          <span className="muted small">{user.address}</span>
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

        <CellSimple
          as="button"
          onClick={go("/help#security")}
          before={
            <IconBubble size={32} color="var(--dk-success)">
              <IconShield size={18} />
            </IconBubble>
          }
          title="Безопасность данных"
          showChevron
        />
      </CellList>
    </>
  );
};
