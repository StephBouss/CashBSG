import { Component, type ErrorInfo, type ReactNode } from "react";
import { logClientError } from "@/lib/errorLogging";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    logClientError(error, `react:${info.componentStack?.split("\n")[1]?.trim() ?? "unknown"}`);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div
        className="flex min-h-screen items-center justify-center p-6"
        style={{ background: "var(--page-gradient, #F5F6FA)" }}
      >
        <div
          className="w-full max-w-sm p-8 rounded-2xl text-center"
          style={{
            background: "rgba(255,255,255,0.85)",
            backdropFilter: "blur(40px)",
            border: "1px solid rgba(255,255,255,0.9)",
            boxShadow: "0 24px 64px rgba(120,120,180,0.20)",
          }}
        >
          <div
            className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ background: "rgba(239,68,68,0.12)" }}
          >
            <span style={{ fontSize: "26px" }}>⚠️</span>
          </div>
          <h1 className="mb-2 text-lg font-headings font-semibold text-foreground">
            Une erreur inattendue est survenue
          </h1>
          <p className="mb-6 text-sm text-muted-foreground leading-relaxed">
            L&apos;incident a été enregistré. Vous pouvez réessayer ou revenir à l&apos;accueil.
          </p>
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={this.handleRetry}
              className="rounded-2xl bg-primary px-4 py-2.5 font-medium text-white hover:opacity-90"
            >
              Réessayer
            </button>
            <a
              href="/"
              className="rounded-2xl border border-black/10 px-4 py-2.5 font-medium text-foreground hover:bg-black/5"
            >
              Retour à l&apos;accueil
            </a>
          </div>
        </div>
      </div>
    );
  }
}
