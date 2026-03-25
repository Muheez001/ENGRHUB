import { useAuth0 } from '@auth0/auth0-react';
import { Navigate } from 'react-router-dom';

export default function LoginPage() {
    const { loginWithRedirect, isAuthenticated, isLoading } = useAuth0();

    if (isLoading) {
        return (
            <div className="login-page">
                <div className="loading-spinner"></div>
            </div>
        );
    }

    if (isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-logo">E</div>
                <h1 className="login-title">
                    Eng<span className="accent">Hub</span> NG
                </h1>
                <p className="login-desc">
                    Bridge the gap between Nigerian engineering curricula and world-class standards.
                </p>
                <button className="btn btn-primary login-btn" onClick={() => loginWithRedirect()}>
                    Sign In to Continue
                </button>
                <p className="login-footer">
                    Powered by Auth0 · Secure authentication
                </p>
            </div>
        </div>
    );
}
