import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { router } from "@/router";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { installGlobalErrorLogging } from "@/lib/errorLogging";
import "@/index.css";

installGlobalErrorLogging();

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ErrorBoundary>
    <Analytics />
    <SpeedInsights />
  </StrictMode>
);
