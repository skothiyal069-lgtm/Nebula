import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    this.setState(prev => ({ errorCount: prev.errorCount + 1 }));
    
    // Log to external service in production
    if (process.env.NODE_ENV === 'production') {
      console.log('Error logged:', error.message);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-screen flex items-center justify-center bg-cyber-black text-white p-4">
          <div className="max-w-md text-center space-y-4">
            <div className="flex justify-center">
              <AlertCircle className="w-16 h-16 text-red-500 animate-pulse" />
            </div>
            <h1 className="text-2xl font-bold text-glow-orange">System Error</h1>
            <p className="text-slate-300">
              The application encountered an unexpected error. This has been logged.
            </p>
            {process.env.NODE_ENV === 'development' && (
              <div className="bg-red-950/50 border border-red-500/30 rounded p-3 text-left overflow-auto max-h-32 text-xs text-red-200 font-mono">
                {this.state.error?.message}
              </div>
            )}
            <button
              onClick={this.handleReset}
              className="flex items-center justify-center gap-2 mx-auto px-4 py-2 bg-cyber-orange text-black rounded-lg hover:bg-cyber-orange/80 transition-colors font-semibold"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
            {this.state.errorCount > 3 && (
              <p className="text-xs text-amber-400">
                Multiple errors detected. Please refresh the page.
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
