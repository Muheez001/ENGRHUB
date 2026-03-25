import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { useTheme } from '../context/ThemeContext';

const NAV_ITEMS = [
    { path: '/', icon: '⬡', label: 'Dashboard' },
    { path: '/courses', icon: '◈', label: 'Courses' },
    { path: '/gap-view', icon: '⊞', label: 'Gap Analysis' },
    { path: '/upload', icon: '⇧', label: 'Upload' },
    { path: '/voting', icon: '◎', label: 'Voting' },
    { path: '/settings', icon: '⚙', label: 'Settings' },
];

export default function Sidebar() {
    const location = useLocation();
    const { theme, toggleTheme } = useTheme();
    const { logout, user } = useAuth0();
    const [mobileOpen, setMobileOpen] = useState(false);

    const closeMobile = () => setMobileOpen(false);

    return (
        <>
            {/* ── Mobile hamburger button (visible only on small screens) ── */}
            <button
                className="hamburger-btn"
                onClick={() => setMobileOpen(prev => !prev)}
                aria-label="Toggle navigation"
            >
                <span className={`hamburger-icon ${mobileOpen ? 'open' : ''}`}>
                    <span></span>
                    <span></span>
                    <span></span>
                </span>
            </button>

            {/* ── Sidebar overlay (mobile only) ── */}
            {mobileOpen && (
                <div className="sidebar-overlay" onClick={closeMobile} />
            )}

            {/* ── Sidebar ── */}
            <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
                {/* Logo */}
                <div className="sidebar-logo">E</div>

                {/* Navigation */}
                <nav className="sidebar-nav">
                    {NAV_ITEMS.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                            onClick={closeMobile}
                        >
                            <span>{item.icon}</span>
                            <span className="nav-tooltip">{item.label}</span>
                            <span className="nav-label-mobile">{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* Bottom section */}
                <div className="sidebar-bottom">
                    <button
                        className="theme-toggle"
                        onClick={toggleTheme}
                        title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                    >
                        <span>{theme === 'dark' ? '☀' : '☾'}</span>
                        <span className="nav-tooltip">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                    </button>

                    <button
                        className="sidebar-logout"
                        onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
                        title="Log out"
                    >
                        <span>⏻</span>
                        <span className="nav-tooltip">Log Out</span>
                    </button>

                    <NavLink to="/profile" className="sidebar-avatar" onClick={closeMobile}>
                        {user?.picture ? (
                            <img
                                src={user.picture}
                                alt="Profile"
                                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                            />
                        ) : (
                            <span>👤</span>
                        )}
                    </NavLink>
                </div>
            </aside>
        </>
    );
}
