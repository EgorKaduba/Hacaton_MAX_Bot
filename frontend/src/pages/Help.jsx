import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Input } from "@maxhub/max-ui";
import {
  Card,
  IconBubble,
  Notice,
  PageHeader,
  SectionHeader,
  cx,
} from "../components/ui";
import {
  IconChat,
  IconChevronRight,
  IconSearch,
  IconShield,
} from "../components/Icons";
import { FAQ } from "../data/content";
import { bridge } from "../bridge/max";

export const Help = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(null);

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    return FAQ.map((f, i) => ({ ...f, i })).filter(
      (f) =>
        !q || f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <>
      <PageHeader
        back="Профиль"
        title="Помощь и FAQ"
        subtitle="Ответы на частые вопросы"
      />

      <Input
        placeholder="Найти ответ"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        withClearButton
        iconBefore={<IconSearch size={18} />}
      />

      <Card className="list-card">
        <SectionHeader title="Популярные вопросы" />
        {items.length === 0 && (
          <p className="muted small">
            Ничего не нашлось — спросите AI-помощника
          </p>
        )}
        {items.map((f) => (
          <div key={f.i} className={cx("faq", open === f.i && "is-open")}>
            <button
              type="button"
              className="faq__q"
              onClick={() => {
                bridge.haptic.selection();
                setOpen(open === f.i ? null : f.i);
              }}
            >
              {f.q}
              <IconChevronRight size={18} className="faq__chevron" />
            </button>
            {open === f.i && <p className="faq__a">{f.a}</p>}
          </div>
        ))}
      </Card>

      <div id="security">
        <Notice
          tone="success"
          icon={<IconShield size={18} />}
          title="Безопасность данных"
        >
          Квитанции хранятся в зашифрованном виде и используются только для
          анализа ваших начислений. Мы не передаём данные третьим лицам.
        </Notice>
      </div>

      <Card className="help-cta">
        <IconBubble size={40}>
          <IconChat size={20} />
        </IconBubble>
        <b>Не нашли ответ?</b>
        <span className="muted small">
          Напишите AI-помощнику — он ответит по вашим квитанциям
        </span>
        <Button size="medium" stretched onClick={() => navigate("/assistant")}>
          Открыть чат
        </Button>
      </Card>
    </>
  );
};
