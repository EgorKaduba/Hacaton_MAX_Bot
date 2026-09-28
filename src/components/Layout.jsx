import { Outlet } from "react-router-dom";
import { TabBar } from "./TabBar";

export const TabLayout = () => (
  <div className="screen screen--with-tabs">
    <main className="screen__content">
      <Outlet />
    </main>
    <TabBar />
  </div>
);

export const PlainLayout = () => (
  <div className="screen">
    <main className="screen__content">
      <Outlet />
    </main>
  </div>
);
