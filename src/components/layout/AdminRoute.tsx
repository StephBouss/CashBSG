import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";

export function AdminRoute({ children }: { children: ReactNode }) {
  const { data: profile, isLoading } = useProfile();

  if (isLoading) return null;
  if (!profile?.isAdmin) return <Navigate to="/app" replace />;

  return <>{children}</>;
}
