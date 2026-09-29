import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { IconButton, Spinner } from "@maxhub/max-ui";
import { IconBubble, PageHeader, UserAvatar } from "../components/ui";
import {
  IconAlert,
  IconInfo,
  IconSend,
  IconSparkle,
} from "../components/Icons";
import { SUGGESTIONS, askAssistant } from "../services/assistant";
import { bridge } from "../bridge/max";

let seq = 0;
const nextId = () => `m${++seq}`;

const GREETING = {
  id: "greeting",
  role: "ai",
  text: "Привет! Я помогу разобраться в квитанциях: спросите, что изменилось, есть ли ошибки, или выберите вопрос ниже.",
};

export const Assistant = () => {
  const [params, setParams] = useSearchParams();
  const [messages, setMessages] = useState([GREETING]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const endRef = useRef(null);

  const send = async (text) => {
    const q = text.trim();
    if (!q || pending) return;
    bridge.haptic.impact("light");
    setInput("");
    setMessages((m) => [...m, { id: nextId(), role: "user", text: q }]);
    setPending(true);
    try {
      const answer = await askAssistant(q);
      setMessages((m) => [...m, { id: nextId(), role: "ai", ...answer }]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          id: nextId(),
          role: "ai",
          text: "Не удалось получить данные квитанций. Попробуйте ещё раз.",
        },
      ]);
    } finally {
      setPending(false);
    }
  };

  const lastAsked = useRef(null);
  const queryParam = params.get("q");
  useEffect(() => {
    if (!queryParam) {
      lastAsked.current = null;
      return;
    }
    if (lastAsked.current === queryParam) return;
    lastAsked.current = queryParam;
    setParams({}, { replace: true });
    void send(queryParam);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryParam]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, pending]);

  const onSubmit = (e) => {
    e.preventDefault();
    void send(input);
  };

  return (
    <div className="chat">
      <PageHeader
        title="AI-помощник"
        subtitle="Отвечает по вашим квитанциям"
        right={<UserAvatar />}
      />

      <div className="chat__bot">
        <IconBubble size={36}>
          <IconSparkle size={18} />
        </IconBubble>
        <div>
          <b>ДомКвит AI</b>
          <span className="muted small">
            {pending ? "печатает…" : "онлайн"}
          </span>
        </div>
      </div>

      <div className="chat__messages">
        {messages.map((m) => (
          <div key={m.id} className={`msg msg--${m.role}`}>
            <p>{m.text}</p>
            {m.cards?.map((c, i) => (
              <div key={i} className={`msg-card msg-card--${c.tone}`}>
                {c.tone === "info" ? (
                  <IconInfo size={16} />
                ) : (
                  <IconAlert size={16} />
                )}
                <div>
                  <b>{c.title}</b>
                  <span>{c.text}</span>
                </div>
              </div>
            ))}
          </div>
        ))}
        {pending && (
          <div className="msg msg--ai msg--typing">
            <Spinner size={16} />
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="chat__footer">
        <span className="muted small">Быстрые вопросы</span>
        <div className="chips">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              className="chip"
              disabled={pending}
              onClick={() => send(s)}
            >
              {s}
            </button>
          ))}
        </div>
        <form className="chat__input" onSubmit={onSubmit}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Спросите про вашу квитанцию…"
            enterKeyHint="send"
          />

          <IconButton
            type="submit"
            size="medium"
            aria-label="Отправить"
            disabled={!input.trim() || pending}
          >
            <IconSend size={20} />
          </IconButton>
        </form>
      </div>
    </div>
  );
};
