import { useEffect, useState } from "react";
import {
  HashRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { Spinner } from "@maxhub/max-ui";
import { PlainLayout, TabLayout } from "./components/Layout";
import { useMaxBackButton } from "./bridge/hooks";
import { bridge } from "./bridge/max";
import { ONBOARDING_KEY } from "./constants";
import { DraftProvider } from "./state/draft";
import { Onboarding } from "./pages/Onboarding";
import { Home } from "./pages/Home";
import { Receipts } from "./pages/Receipts";
import { ReceiptDetails } from "./pages/ReceiptDetails";
import { AddReceipt } from "./pages/AddReceipt";
import { Recognition } from "./pages/Recognition";
import { CheckData } from "./pages/CheckData";
import { AiAnalysis } from "./pages/AiAnalysis";
import { AnalysisResult } from "./pages/AnalysisResult";
import { ServiceDetails } from "./pages/ServiceDetails";
import { ReceiptErrors } from "./pages/ReceiptErrors";
import { Complaint } from "./pages/Complaint";
import { Analytics } from "./pages/Analytics";
import { Assistant } from "./pages/Assistant";
import { Profile } from "./pages/Profile";
import { Notifications } from "./pages/Notifications";
import { Help } from "./pages/Help";

const Start = () => {
  const [state, setState] = useState("loading");

  useEffect(() => {
    bridge.storage
      .get(ONBOARDING_KEY)
      .then((v) => setState(v ? "onboarded" : "new"));
  }, []);

  if (state === "loading")
    return (
      <div className="splash">
        <Spinner size={32} />
      </div>
    );
  if (state === "onboarded") return <Navigate to="/home" replace />;
  return <Onboarding />;
};

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const AppRoutes = () => {
  useMaxBackButton();

  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Start />} />

        <Route element={<TabLayout />}>
          <Route path="/home" element={<Home />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/receipts" element={<Receipts />} />
          <Route path="/receipts/:id" element={<ReceiptDetails />} />
          <Route
            path="/receipts/:id/services/:chargeId"
            element={<ServiceDetails />}
          />
          <Route path="/receipts/:id/errors" element={<ReceiptErrors />} />
          <Route path="/receipts/:id/complaint" element={<Complaint />} />
          <Route path="/receipts/add/check" element={<CheckData />} />
          <Route path="/receipts/add/result" element={<AnalysisResult />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/assistant" element={<Assistant />} />
        </Route>

        <Route element={<PlainLayout />}>
          <Route path="/receipts/add" element={<AddReceipt />} />
          <Route path="/receipts/add/recognition" element={<Recognition />} />
          <Route path="/receipts/add/analysis" element={<AiAnalysis />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/help" element={<Help />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

export const App = () => (
  <HashRouter>
    <DraftProvider>
      <AppRoutes />
    </DraftProvider>
  </HashRouter>
);
