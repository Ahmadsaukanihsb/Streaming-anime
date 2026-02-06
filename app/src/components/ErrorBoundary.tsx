import { Component, ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({ errorInfo });

    // Call optional error handler
    this.props.onError?.(error, errorInfo);

    // Send to analytics in production
    if (import.meta.env.PROD) {
      // Example: Sentry.captureException(error, { extra: errorInfo });
      this.reportError(error, errorInfo);
    }
  }

  private reportError(error: Error, errorInfo: ErrorInfo) {
    // You can integrate with error tracking services here
    // Sentry, LogRocket, Bugsnag, etc.
    
    // For now, just log to console in a structured way
    const errorReport = {
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    console.error('Error Report:', errorReport);

    // Could also send to your backend
    // fetch('/api/errors', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(errorReport),
    // });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-[#0F0F1A] flex items-center justify-center p-4">
          {/* Background Decoration */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/5 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl" />
          </div>

          <div className="relative w-full max-w-lg">
            <div className="bg-[#1A1A2E]/80 backdrop-blur-xl border border-red-500/20 rounded-3xl p-8 shadow-2xl text-center">
              {/* Error Icon */}
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="w-10 h-10 text-red-400" />
              </div>

              {/* Error Title */}
              <h1 className="text-2xl font-bold text-white mb-2">
                Terjadi Kesalahan
              </h1>
              <p className="text-white/60 mb-6">
                Maaf, terjadi kesalahan tak terduga. Tim kami telah diberitahu.
              </p>

              {/* Error Details (only in development) */}
              {import.meta.env.DEV && this.state.error && (
                <div className="mb-6 text-left">
                  <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-4 overflow-auto max-h-48">
                    <div className="flex items-center gap-2 mb-2 text-red-400 text-sm font-medium">
                      <Bug className="w-4 h-4" />
                      Error Details (Development Only)
                    </div>
                    <pre className="text-xs text-red-300/80 font-mono whitespace-pre-wrap break-all">
                      {this.state.error.toString()}
                    </pre>
                    {this.state.errorInfo?.componentStack && (
                      <pre className="text-xs text-white/40 font-mono whitespace-pre-wrap mt-2 pt-2 border-t border-white/5">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={this.handleReset}
                  variant="outline"
                  className="border-white/10 hover:bg-white/5 text-white"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Coba Lagi
                </Button>
                
                <Button
                  onClick={this.handleReload}
                  className="bg-gradient-to-r from-[#6C5DD3] to-[#00C2FF] hover:opacity-90 text-white"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Muat Ulang
                </Button>

                <Button
                  onClick={this.handleGoHome}
                  variant="ghost"
                  className="text-white/60 hover:text-white hover:bg-white/5"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Beranda
                </Button>
              </div>

              {/* Help Text */}
              <p className="mt-6 text-xs text-white/40">
                Jika masalah berlanjut, silakan hubungi tim support kami.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook version for functional components that need error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}
