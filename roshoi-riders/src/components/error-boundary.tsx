import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode; fallback?: ReactNode };
type State = { hasError: boolean; error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };
  static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[OrderKing Rider] Uncaught error:", error, info.componentStack);
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center">
          <div className="text-4xl">😕</div>
          <h2 className="text-xl font-semibold">Something went wrong</h2>
          <p className="max-w-sm text-sm text-muted">{this.state.error?.message ?? "An unexpected error occurred"}</p>
          <button className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white" onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}>Try Again</button>
        </div>
      );
    }
    return this.props.children;
  }
}
