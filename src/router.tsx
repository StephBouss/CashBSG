import { createBrowserRouter } from "react-router-dom";
import App from "@/App";
import { AppLayout } from "@/components/layout/AppLayout";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import IncomesPage from "@/pages/IncomesPage";
import ExpensesPage from "@/pages/ExpensesPage";
import FinancesPage from "@/pages/FinancesPage";
import GoalsPage from "@/pages/GoalsPage";
import ReportsPage from "@/pages/ReportsPage";
import AiAdvisorPage from "@/pages/AiAdvisorPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { path: "login", element: <LoginPage /> },
      { path: "signup", element: <LoginPage /> },
      { path: "reinitialiser-mot-de-passe", element: <ResetPasswordPage /> },
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: "revenus", element: <IncomesPage /> },
          { path: "depenses", element: <ExpensesPage /> },
          { path: "finances", element: <FinancesPage /> },
          { path: "objectifs", element: <GoalsPage /> },
          { path: "rapports", element: <ReportsPage /> },
          { path: "conseiller-ia", element: <AiAdvisorPage /> },
        ],
      },
    ],
  },
]);
