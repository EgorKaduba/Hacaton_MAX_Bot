import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MaxUI } from "@maxhub/max-ui";
import "@maxhub/max-ui/dist/styles.css";
import "./styles/app.css";
import { App } from "./App";
import { bridge } from "./bridge/max";

bridge.ready();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <MaxUI
      platform={bridge.uiPlatform}
      colorScheme="light"
      resetBody
      className="app-root"
    >
      <App />
    </MaxUI>
  </StrictMode>,
);
