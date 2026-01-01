import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ error, errorInfo });
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="bg-black text-red-500 p-10 w-full h-screen overflow-auto font-mono z-50 relative">
                    <h1 className="text-2xl font-bold mb-4">SYSTEM CRITICAL FAILURE</h1>
                    <p className="mb-2">J.A.R.V.I.S. Kernel Panic detected:</p>
                    <pre className="bg-gray-900 p-4 border border-red-900 rounded mb-4 whitespace-pre-wrap">
                        {this.state.error && this.state.error.toString()}
                    </pre>
                    <details className="text-xs text-red-400">
                        <summary>Stack Trace</summary>
                        <pre className="whitespace-pre-wrap mt-2">{this.state.errorInfo && this.state.errorInfo.componentStack}</pre>
                    </details>
                    <button
                        className="mt-6 px-4 py-2 border border-red-500 hover:bg-red-900/50"
                        onClick={() => window.location.reload()}
                    >
                        REBOOT SYSTEM
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
