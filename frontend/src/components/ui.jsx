import { Link, useNavigate } from "react-router-dom";
import { Button, Flex, Spinner, Typography } from "@maxhub/max-ui";
import {
  IconAlert,
  IconChevronLeft,
  IconChevronRight,
  IconClose,
  IconUser,
} from "./Icons";
import { bridge } from "../bridge/max";

const cx = (...c) => c.filter(Boolean).join(" ");

/* ---------- Header ---------- */

export const PageHeader = ({ title, subtitle, back, right, large }) => {
  const navigate = useNavigate();
  const backLabel = typeof back === "string" ? back : back?.label;
  const onBack = () => {
    bridge.haptic.impact("light");
    if (typeof back === "object") navigate(back.to);
    else navigate(-1);
  };

  return (
    <header className="page-header">
      {back && (
        <button type="button" className="page-header__back" onClick={onBack}>
          <IconChevronLeft size={16} strokeWidth={2.2} />
          {backLabel}
        </button>
      )}
      <Flex justify="space-between" align="center" gap={12}>
        <div className="page-header__titles">
          <Typography.Title
            variant={large ? "large-strong" : "medium-strong"}
            asChild
          >
            <h1 className="page-header__title">{title}</h1>
          </Typography.Title>
          {subtitle && <p className="page-header__subtitle">{subtitle}</p>}
        </div>
        {right}
      </Flex>
    </header>
  );
};

export const UserAvatar = ({ size = 36 }) => (
  <Link
    to="/profile"
    className="avatar-link"
    aria-label="Профиль"
    onClick={() => bridge.haptic.impact("light")}
  >
    <span className="avatar-fallback" style={{ width: size, height: size }}>
      <IconUser size={Math.round(size * 0.5)} />
    </span>
  </Link>
);

/* ---------- Surfaces ---------- */

export const Card = ({ children, className, onClick, style, tone }) => {
  const cls = cx(
    "card",
    tone && tone !== "default" && `card--${tone}`,
    onClick && "card--tappable",
    className,
  );
  if (onClick) {
    return (
      <button
        type="button"
        className={cls}
        style={style}
        onClick={() => {
          bridge.haptic.impact("light");
          onClick();
        }}
      >
        {children}
      </button>
    );
  }
  return (
    <div className={cls} style={style}>
      {children}
    </div>
  );
};

export const Badge = ({ children, tone = "neutral" }) => (
  <span className={`badge badge--${tone}`}>{children}</span>
);

export const SectionHeader = ({ title, action }) => (
  <div className="section-header">
    <Typography.Title variant="small-strong">{title}</Typography.Title>
    {action && (
      <Link
        to={action.to}
        className="section-header__action"
        onClick={() => bridge.haptic.impact("light")}
      >
        {action.label}
      </Link>
    )}
  </div>
);

export const Notice = ({ tone, icon, title, children }) => (
  <div className={`notice notice--${tone}`}>
    {icon && <span className="notice__icon">{icon}</span>}
    <div>
      {title && <div className="notice__title">{title}</div>}
      {children && <div className="notice__text">{children}</div>}
    </div>
  </div>
);

export const IconBubble = ({
  children,
  color = "var(--dk-accent)",
  bg,
  size = 40,
}) => (
  <span
    className="icon-bubble"
    style={{
      color,
      background: bg ?? `color-mix(in srgb, ${color} 12%, transparent)`,
      width: size,
      height: size,
    }}
  >
    {children}
  </span>
);

export const StatTile = ({ label, value, hint, hintTone, onClick }) => (
  <Card className="stat-tile" onClick={onClick}>
    <span className="stat-tile__label">{label}</span>
    <span className="stat-tile__value">{value}</span>
    {hint && (
      <span
        className={`stat-tile__hint stat-tile__hint--${hintTone ?? "muted"}`}
      >
        {hint}
      </span>
    )}
  </Card>
);

/* ---------- Lists ---------- */

export const Row = ({
  before,
  title,
  subtitle,
  after,
  afterSub,
  afterTone,
  to,
  onClick,
  chevron,
}) => {
  const content = (
    <>
      {before && <span className="row__before">{before}</span>}
      <span className="row__body">
        <span className="row__title">{title}</span>
        {subtitle && <span className="row__subtitle">{subtitle}</span>}
      </span>
      {(after || afterSub) && (
        <span className="row__after">
          {after && (
            <span
              className={cx(
                "row__after-main",
                afterTone && `text-${afterTone}`,
              )}
            >
              {after}
            </span>
          )}
          {afterSub && <span className="row__after-sub">{afterSub}</span>}
        </span>
      )}
      {chevron && <IconChevronRight size={18} className="row__chevron" />}
    </>
  );
  const handle = () => bridge.haptic.impact("light");
  if (to)
    return (
      <Link to={to} className="row row--tappable" onClick={handle}>
        {content}
      </Link>
    );
  if (onClick)
    return (
      <button
        type="button"
        className="row row--tappable"
        onClick={() => {
          handle();
          onClick();
        }}
      >
        {content}
      </button>
    );
  return <div className="row">{content}</div>;
};

export const Dot = ({ color }) => (
  <span className="dot" style={{ background: color }} />
);

/* ---------- Charts ---------- */

/** Кольцевая диаграмма: segments = [{ id, value, color }], value > 0 */
export const Donut = ({ segments, size = 180, stroke = 24, children }) => {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const gap = segments.length > 1 ? 2 : 0;
  let offset = 0;

  return (
    <div className="donut" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="var(--dk-divider)"
            strokeWidth={stroke}
          />
          {segments.map((s) => {
            const len = (s.value / total) * c;
            const dash = Math.max(len - gap, 0.5);
            const el = (
              <circle
                key={s.id}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth={stroke}
                strokeDasharray={`${dash} ${c - dash}`}
                strokeDashoffset={-offset}
              />
            );
            offset += len;
            return el;
          })}
        </g>
      </svg>
      {children && <div className="donut__center">{children}</div>}
    </div>
  );
};

export const ProgressRing = ({ value, size = 132, stroke = 10 }) => {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="progress-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="var(--dk-accent-soft)"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="var(--dk-accent)"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - value / 100)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset .4s ease" }}
        />
      </svg>
      <span className="progress-ring__value">{Math.round(value)}%</span>
    </div>
  );
};

export const ProgressBar = ({ value }) => (
  <div className="progress-bar">
    <span style={{ width: `${Math.min(100, value)}%` }} />
  </div>
);

export const BottomBar = ({ children }) => (
  <div className="bottom-bar">{children}</div>
);

/* ---------- States ---------- */

export const LoadingState = ({ text = "Загружаем…" }) => (
  <div className="state">
    <Spinner size={28} />
    <span className="muted small">{text}</span>
  </div>
);

export const ErrorState = ({ error, onRetry, title }) => (
  <Card className="state">
    <IconBubble size={44} color="var(--dk-danger)">
      <IconAlert size={22} />
    </IconBubble>
    <b>{title ?? "Не удалось загрузить данные"}</b>
    {error?.message && <span className="muted small">{error.message}</span>}
    {onRetry && (
      <Button variant="secondary" size="medium" onClick={onRetry}>
        Повторить
      </Button>
    )}
  </Card>
);

/* ---------- Sheet ---------- */

/** Рендерится внутри корня MaxUI (не порталом), чтобы у компонентов MaxUI были его CSS-переменные */
export const Sheet = ({ open, onClose, title, children }) => {
  if (!open) return null;
  return (
    <div className="sheet" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="sheet__panel" onClick={(e) => e.stopPropagation()}>
        <div className="sheet__head">
          <Typography.Title variant="small-strong">{title}</Typography.Title>
          <button
            type="button"
            className="sheet__close"
            aria-label="Закрыть"
            onClick={onClose}
          >
            <IconClose size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export { cx };
