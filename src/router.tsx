import { createBrowserRouter } from "react-router-dom";
import App from "@/App";
import { AppLayout } from "@/components/layout/AppLayout";
import { AdminRoute } from "@/components/layout/AdminRoute";
import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import IncomesPage from "@/pages/IncomesPage";
import ExpensesPage from "@/pages/ExpensesPage";
import TrackerPage from "@/pages/TrackerPage";
import FinancesPage from "@/pages/FinancesPage";
import GoalsPage from "@/pages/GoalsPage";
import ReportsPage from "@/pages/ReportsPage";
import AiAdvisorPage from "@/pages/AiAdvisorPage";
import UpgradePage from "@/pages/UpgradePage";
import SettingsPage from "@/pages/SettingsPage";
import AdminPage from "@/pages/AdminPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import MentionsLegalesPage from "@/pages/legal/MentionsLegalesPage";
import CGUPage from "@/pages/legal/CGUPage";
import PolitiqueConfidentialitePage from "@/pages/legal/PolitiqueConfidentialitePage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: "login", element: <LoginPage /> },
      { path: "signup", element: <LoginPage /> },
      { path: "reinitialiser-mot-de-passe", element: <ResetPasswordPage /> },
      { path: "mentions-legales", element: <MentionsLegalesPage /> },
      { path: "cgu", element: <CGUPage /> },
      { path: "confidentialite", element: <PolitiqueConfidentialitePage /> },
      {
        path: "app",
        element: <AppLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: "revenus", element: <IncomesPage /> },
          { path: "depenses", element: <ExpensesPage /> },
          { path: "tracker", element: <TrackerPage /> },
          { path: "finances", element: <FinancesPage /> },
          { path: "objectifs", element: <GoalsPage /> },
          { path: "rapports", element: <ReportsPage /> },
          { path: "conseiller-ia", element: <AiAdvisorPage /> },
          { path: "mise-a-niveau", element: <UpgradePage /> },
          { path: "parametres", element: <SettingsPage /> },
          { path: "admin", element: <AdminRoute><AdminPage /></AdminRoute> },
        ],
      },
    ],
  },
]);
