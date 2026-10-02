import { Component, type ReactNode } from "react";

type Props = { children: ReactNode; fallback?: ReactNode };
type State = { hasError: boolean; errorMessage: string | null; incidentId: string | null };

function createIncidentId() {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch {
    // Fall through to a deterministic local fallback.
  }
  return `orderking-${Date.now().toString(36)}`;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, errorMessage: null, incidentId: null };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error instanceof Error ? error.message : null,
      incidentId: createIncidentId(),
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    const incidentId = this.state.incidentId ?? createIncidentId();
    console.error("[OrderKing] Uncaught render error", {
      incidentId,
      error,
      componentStack: info.componentStack,
    });
  }

  private reset = () => {
    this.setState({ hasError: false, errorMessage: null, incidentId: null });
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      const supportReference = this.state.incidentId ?? "unknown";

      return this.props.fallback ?? (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center">
          <div className="text-4xl" aria-hidden="true">
            😕
          </div>
          <h2 className="text-xl font-semibold">Something went wrong</h2>
          <p className="max-w-sm text-sm text-muted">
            The page could not finish loading safely. Your existing account and order data were not deleted.
          </p>
          <p className="text-xs text-muted">
            Support reference: <span className="font-mono">{supportReference}</span>
          </p>
          <button
            type="button"
            className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            onClick={this.reset}
          >
            Reload OrderKing
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
