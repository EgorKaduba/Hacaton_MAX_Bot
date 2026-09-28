import { NavLink, useLocation } from "react-router-dom";
import { IconChart, IconHome, IconReceipt, IconSparkle } from "./Icons";
import { bridge } from "../bridge/max";

const TABS = [
  {
    to: "/home",
    label: "Главная",
    icon: IconHome,
    match: ["/home", "/profile"],
  },
  {
    to: "/receipts",
    label: "Квитанции",
    icon: IconReceipt,
    match: ["/receipts"],
  },
  {
    to: "/analytics",
    label: "Аналитика",
    icon: IconChart,
    match: ["/analytics"],
  },
  { to: "/assistant", label: "AI", icon: IconSparkle, match: ["/assistant"] },
];

export const TabBar = () => {
  const { pathname } = useLocation();
  return (
    <nav className="tab-bar">
      {TABS.map(({ to, label, icon: Icon, match }) => {
        const active = match.some((m) => pathname.startsWith(m));
        return (
          <NavLink
            key={to}
            to={to}
            className={`tab-bar__item${active ? " is-active" : ""}`}
            onClick={() => bridge.haptic.selection()}
          >
            <Icon size={24} />
            <span>{label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};
