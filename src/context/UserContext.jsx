import { createContext, useContext, useMemo } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useUserProfile } from '../hooks/useUserProfile';
import { useDualTrack } from '../hooks/useDualTrack';

/**
 * Global User Context — single source of truth for auth + profile + dual-track state.
 *
 * Consolidates:
 *   - Auth0 session (user, isAuthenticated, loginWithRedirect, logout)
 *   - Firestore profile (university, department, year, etc.)
 *   - Dual-track state (showTrack2, phase, daysUntilExam)
 *
 * Usage:
 *   const { user, profile, dualTrack, isReady } = useUser();
 */
const UserContext = createContext(null);

export function UserProvider({ children }) {
    const auth0 = useAuth0();
    const { profile, loading: profileLoading, hasProfile, refetch } = useUserProfile();
    const dualTrack = useDualTrack();

    const value = useMemo(
        () => ({
            // Auth0
            user: auth0.user,
            isAuthenticated: auth0.isAuthenticated,
            isAuthLoading: auth0.isLoading,
            loginWithRedirect: auth0.loginWithRedirect,
            logout: auth0.logout,
            getAccessTokenSilently: auth0.getAccessTokenSilently,

            // Firestore profile
            profile,
            profileLoading,
            hasProfile,
            refetchProfile: refetch,

            // Derived convenience fields
            userId: auth0.user?.sub || null,
            university: profile?.university || null,
            department: profile?.department || null,
            yearNumber: profile?.yearNumber || null,
            nickname: profile?.nickname || auth0.user?.name || null,
            avatarUrl: auth0.user?.picture || null,

            // Dual-track
            dualTrack,

            // Ready state — auth done AND profile loaded
            isReady: !auth0.isLoading && !profileLoading,
        }),
        [auth0, profile, profileLoading, hasProfile, refetch, dualTrack]
    );

    return (
        <UserContext.Provider value={value}>{children}</UserContext.Provider>
    );
}

/**
 * Hook to access the global user context.
 * Must be used within a UserProvider.
 */
export function useUser() {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
}
