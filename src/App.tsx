import { Outlet } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Outlet />
      </ThemeProvider>
    </AuthProvider>
  );
}
