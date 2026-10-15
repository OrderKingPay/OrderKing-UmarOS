
import { Component, type ReactNode } from "react";
import { AlertCircle, RotateCcw, Home } from "lucide-react";

type Props = { children: ReactNode; fallback?: ReactNode };
type State = { hasError: boolean; error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };
  static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[OrderKing] Uncaught error:", error, info.componentStack);
  }
  resetError = () => {
    this.setState({ hasError: false, error: null });
  };
  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="min-h-screen w-full bg-[#FAF7F2] text-gray-900 flex flex-col items-center justify-center p-6 select-none">
          <div className="w-full max-w-md rounded-3xl bg-white border border-amber-200/80 p-8 text-center shadow-[0_20px_50px_rgba(245,158,11,0.12)] space-y-5">
            <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 via-orange-500/15 to-amber-600/20 border border-amber-300 text-amber-700 shadow-sm">
              <AlertCircle className="size-8 stroke-[2.2]" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-black text-gray-950 tracking-tight">Something went unexpected</h2>
              <p className="text-xs text-gray-600 leading-relaxed">
                {this.state.error?.message ?? "An unexpected condition occurred. We've captured the diagnostics."}
              </p>
            </div>
            <div className="flex flex-col gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  this.resetError();
                  window.location.reload();
                }}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 px-5 py-3 text-sm font-bold text-white shadow-md shadow-amber-500/25 transition-all hover:brightness-105 active:scale-98 cursor-pointer"
              >
                <RotateCcw className="size-4 stroke-[2.2]" />
                Reload Page
              </button>
              <a
                href="/"
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-stone-100 hover:bg-stone-200/80 px-5 py-3 text-sm font-semibold text-stone-800 transition-all active:scale-98 cursor-pointer"
              >
                <Home className="size-4 stroke-[2]" />
                Back to Food Delivery
              </a>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
