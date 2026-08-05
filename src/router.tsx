import { lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router-dom";
import App from "@/App";
import { AppLayout } from "@/components/layout/AppLayout";
import { AdminRoute } from "@/components/layout/AdminRoute";

const LandingPage = lazy(() => import("@/pages/LandingPage"));
const LoginPage = lazy(() => import("@/pages/LoginPage"));
const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const IncomesPage = lazy(() => import("@/pages/IncomesPage"));
const ExpensesPage = lazy(() => import("@/pages/ExpensesPage"));
const TrackerPage = lazy(() => import("@/pages/TrackerPage"));
const FinancesPage = lazy(() => import("@/pages/FinancesPage"));
const GoalsPage = lazy(() => import("@/pages/GoalsPage"));
const ReportsPage = lazy(() => import("@/pages/ReportsPage"));
const AiAdvisorPage = lazy(() => import("@/pages/AiAdvisorPage"));
const UpgradePage = lazy(() => import("@/pages/UpgradePage"));
const SettingsPage = lazy(() => import("@/pages/SettingsPage"));
const AdminPage = lazy(() => import("@/pages/AdminPage"));
const ResetPasswordPage = lazy(() => import("@/pages/ResetPasswordPage"));
const MentionsLegalesPage = lazy(() => import("@/pages/legal/MentionsLegalesPage"));
const CGUPage = lazy(() => import("@/pages/legal/CGUPage"));
const PolitiqueConfidentialitePage = lazy(() => import("@/pages/legal/PolitiqueConfidentialitePage"));

/** Chaque page est chargée à la demande (`lazy`) : sans ça, un visiteur
 * anonyme sur la landing page téléchargeait tout le code de l'app connectée
 * (Dashboard, Administration, IA...) avant même de se créer un compte. */
function PageFallback() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div
        className="w-6 h-6 rounded-full border-2 animate-spin"
        style={{ borderColor: "rgba(16,185,129,0.2)", borderTopColor: "var(--color-primary)" }}
      />
    </div>
  );
}

function LazyPage({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageFallback />}>{children}</Suspense>;
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <LazyPage><LandingPage /></LazyPage> },
      { path: "login", element: <LazyPage><LoginPage /></LazyPage> },
      { path: "signup", element: <LazyPage><LoginPage /></LazyPage> },
      { path: "reinitialiser-mot-de-passe", element: <LazyPage><ResetPasswordPage /></LazyPage> },
      { path: "mentions-legales", element: <LazyPage><MentionsLegalesPage /></LazyPage> },
      { path: "cgu", element: <LazyPage><CGUPage /></LazyPage> },
      { path: "confidentialite", element: <LazyPage><PolitiqueConfidentialitePage /></LazyPage> },
      {
        path: "app",
        element: <AppLayout />,
        children: [
          { index: true, element: <LazyPage><DashboardPage /></LazyPage> },
          { path: "revenus", element: <LazyPage><IncomesPage /></LazyPage> },
          { path: "depenses", element: <LazyPage><ExpensesPage /></LazyPage> },
          { path: "tracker", element: <LazyPage><TrackerPage /></LazyPage> },
          { path: "finances", element: <LazyPage><FinancesPage /></LazyPage> },
          { path: "objectifs", element: <LazyPage><GoalsPage /></LazyPage> },
          { path: "rapports", element: <LazyPage><ReportsPage /></LazyPage> },
          { path: "conseiller-ia", element: <LazyPage><AiAdvisorPage /></LazyPage> },
          { path: "mise-a-niveau", element: <LazyPage><UpgradePage /></LazyPage> },
          { path: "parametres", element: <LazyPage><SettingsPage /></LazyPage> },
          { path: "admin", element: <AdminRoute><LazyPage><AdminPage /></LazyPage></AdminRoute> },
        ],
      },
    ],
  },
]);
