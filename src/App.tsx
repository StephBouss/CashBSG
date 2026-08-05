import { Outlet } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Outlet />
        <Analytics />
      </ThemeProvider>
    </AuthProvider>
  );
}
