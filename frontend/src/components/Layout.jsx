import { Outlet } from "react-router-dom";
import { TabBar } from "./TabBar";

export const TabLayout = () => (
  <div className="screen screen--with-tabs">
    <TabBar />
    <main className="screen__content">
      <Outlet />
    </main>
  </div>
);

export const PlainLayout = () => (
  <div className="screen screen--plain">
    <TabBar />
    <main className="screen__content">
      <Outlet />
    </main>
  </div>
);
