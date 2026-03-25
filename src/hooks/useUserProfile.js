import { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Hook to check if the current Auth0 user has a Firestore profile.
 * Returns { profile, loading, hasProfile, refetch }
 */
export function useUserProfile() {
    const { user, isAuthenticated } = useAuth0();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async () => {
        if (!isAuthenticated || !user) {
            setLoading(false);
            return;
        }

        try {
            const userId = user.sub;
            const snap = await getDoc(doc(db, 'users', userId));

            if (snap.exists()) {
                setProfile({ id: snap.id, ...snap.data() });
            } else {
                setProfile(null);
            }
        } catch (err) {
            console.error('Error fetching user profile:', err);
            setProfile(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, [isAuthenticated, user]);

    return {
        profile,
        loading,
        hasProfile: profile !== null,
        refetch: fetchProfile,
    };
}
