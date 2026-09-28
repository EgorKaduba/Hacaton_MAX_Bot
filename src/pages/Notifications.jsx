import { useNavigate } from "react-router-dom";
import { Card, IconBubble, PageHeader } from "../components/ui";
import { IconAlert, IconClock, IconReceipt } from "../components/Icons";
import { NOTIFICATIONS } from "../data/content";

const KIND = {
  alert: { icon: IconAlert, color: "var(--dk-danger)", tone: "danger" },
  info: { icon: IconReceipt, color: "var(--dk-accent)" },
  reminder: { icon: IconClock, color: "var(--dk-warning)" },
};

export const Notifications = () => {
  const navigate = useNavigate();
  const unread = NOTIFICATIONS.filter((n) => n.unread).length;

  return (
    <>
      <PageHeader
        back="Профиль"
        title="Уведомления"
        subtitle={unread ? `${unread} новых события` : "Нет новых"}
      />

      {NOTIFICATIONS.map((n) => {
        const k = KIND[n.kind];
        const Icon = k.icon;
        return (
          <Card
            key={n.id}
            tone={k.tone}
            className="notification"
            onClick={() => navigate(n.to)}
          >
            <div className="notification__head">
              <IconBubble
                size={36}
                color={k.color}
                bg={k.tone ? "#fff" : undefined}
              >
                <Icon size={18} />
              </IconBubble>
              <div className="notification__titles">
                <b>{n.title}</b>
                <span className="muted small">{n.subtitle}</span>
              </div>
              {n.unread && <span className="notification__dot" />}
            </div>
            <p className="notification__text">{n.text}</p>
            <span className="muted small">{n.time}</span>
          </Card>
        );
      })}
    </>
  );
};
