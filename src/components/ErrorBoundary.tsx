import React, { Component, ErrorInfo, ReactNode } from 'react';
import { DoorClosed, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<Props, State> {
  props: Props;
  state: State;

  constructor(props: Props) {
    super(props);
    this.props = props;
    this.state = {
      hasError: false,
      errorMessage: '',
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error?.message || 'An unexpected rendering error occurred.',
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  public componentDidMount() {
    window.addEventListener('error', this.handleWindowError);
    window.addEventListener('unhandledrejection', this.handlePromiseRejection);
  }

  public componentWillUnmount() {
    window.removeEventListener('error', this.handleWindowError);
    window.removeEventListener('unhandledrejection', this.handlePromiseRejection);
  }

  private handleWindowError = (event: ErrorEvent) => {
    // Only capture real errors, ignore cross-origin or harmless resize observer notices
    if (event.message && !event.message.includes('ResizeObserver') && !event.message.includes('Script error.')) {
      console.warn('Captured window error in ErrorBoundary:', event.error || event.message);
    }
  };

  private handlePromiseRejection = (event: PromiseRejectionEvent) => {
    console.warn('Unhandled promise rejection in application:', event.reason);
  };

  private handleReset = () => {
    try {
      window.history.pushState({}, '', '/');
      window.location.href = '/';
    } catch {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <main className="min-h-[100dvh] w-full bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-6 text-center">
          <div
            className="w-16 h-16 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-emerald-400 mb-4 shadow-xl"
            aria-hidden="true"
          >
            <DoorClosed className="w-8 h-8" />
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-zinc-100 mb-2">
            PrivaChat Session Reset
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-sm mb-6 leading-relaxed">
            The application encountered an unexpected error. Any previous ephemeral conversation remains cryptographically cleared.
          </p>
          <button
            onClick={this.handleReset}
            className="min-h-[44px] px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs sm:text-sm transition cursor-pointer flex items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95"
            aria-label="Reload and return to PrivaChat home"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            <span>Return to PrivaChat</span>
          </button>
        </main>
      );
    }

    return this.props.children;
  }
}
