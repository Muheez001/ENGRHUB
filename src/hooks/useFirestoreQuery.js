import { useState, useEffect, useCallback, useRef } from 'react';
import {
    collection,
    doc,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    getDoc,
    onSnapshot,
} from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Generic Firestore query hook with loading/error/data states.
 * Supports both one-time fetches and real-time listeners.
 *
 * @param {object} options
 * @param {string} options.collectionPath - Firestore collection path (e.g. 'courses')
 * @param {string} [options.docId] - If provided, fetches a single document instead of a query
 * @param {Array} [options.conditions] - Array of [field, operator, value] for where() clauses
 * @param {Array} [options.orderByField] - [field, direction] for ordering
 * @param {number} [options.limitCount] - Max documents to return
 * @param {boolean} [options.realtime=false] - If true, uses onSnapshot for real-time updates
 * @param {boolean} [options.enabled=true] - If false, skips the query
 * @returns {{ data, loading, error, refetch }}
 */
export function useFirestoreQuery({
    collectionPath,
    docId = null,
    conditions = [],
    orderByField = null,
    limitCount = null,
    realtime = false,
    enabled = true,
}) {
    const [data, setData] = useState(docId ? null : []);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const unsubRef = useRef(null);

    const fetchData = useCallback(async () => {
        if (!enabled || !collectionPath) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // ── Single document fetch ──
            if (docId) {
                const snap = await getDoc(doc(db, collectionPath, docId));
                if (snap.exists()) {
                    setData({ id: snap.id, ...snap.data() });
                } else {
                    setData(null);
                }
                setLoading(false);
                return;
            }

            // ── Collection query ──
            let q = collection(db, collectionPath);
            const constraints = [];

            for (const [field, op, value] of conditions) {
                constraints.push(where(field, op, value));
            }

            if (orderByField) {
                const [field, direction = 'asc'] = orderByField;
                constraints.push(orderBy(field, direction));
            }

            if (limitCount) {
                constraints.push(limit(limitCount));
            }

            q = query(q, ...constraints);

            if (realtime) {
                // ── Real-time listener ──
                unsubRef.current = onSnapshot(
                    q,
                    (snapshot) => {
                        const docs = snapshot.docs.map((d) => ({
                            id: d.id,
                            ...d.data(),
                        }));
                        setData(docs);
                        setLoading(false);
                    },
                    (err) => {
                        console.error('Firestore listener error:', err);
                        setError(err.message);
                        setLoading(false);
                    }
                );
            } else {
                // ── One-time fetch ──
                const snapshot = await getDocs(q);
                const docs = snapshot.docs.map((d) => ({
                    id: d.id,
                    ...d.data(),
                }));
                setData(docs);
                setLoading(false);
            }
        } catch (err) {
            console.error('Firestore query error:', err);
            setError(err.message);
            setLoading(false);
        }
    }, [collectionPath, docId, JSON.stringify(conditions), orderByField, limitCount, realtime, enabled]);

    useEffect(() => {
        fetchData();

        return () => {
            if (unsubRef.current) {
                unsubRef.current();
                unsubRef.current = null;
            }
        };
    }, [fetchData]);

    return { data, loading, error, refetch: fetchData };
}
