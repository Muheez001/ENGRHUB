import { Component } from 'react';

/**
 * React Error Boundary — catches render errors with a fallback UI.
 * Displays a friendly "something went wrong" screen instead of a white page.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <App />
 *   </ErrorBoundary>
 */
export default class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught:', error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '60vh',
                        textAlign: 'center',
                        padding: '40px 20px',
                    }}
                >
                    <div
                        style={{
                            fontSize: '48px',
                            marginBottom: '20px',
                            opacity: 0.3,
                        }}
                    >
                        ⚠
                    </div>
                    <h2
                        style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: '20px',
                            color: 'var(--text-0)',
                            marginBottom: '8px',
                        }}
                    >
                        Something went wrong
                    </h2>
                    <p
                        style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '12px',
                            color: 'var(--text-3)',
                            maxWidth: '400px',
                            lineHeight: '1.6',
                            marginBottom: '24px',
                        }}
                    >
                        {this.state.error?.message || 'An unexpected error occurred.'}
                    </p>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                            className="btn btn-primary"
                            onClick={this.handleReset}
                        >
                            Try Again
                        </button>
                        <button
                            className="btn"
                            onClick={() => window.location.reload()}
                        >
                            Reload Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
