import { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';

/**
 * Component to securely fetch and display a link to lecture notes.
 * Calls the getSignedUrl Cloud Function to generate a temporary, expiring link.
 * 
 * @param {object} props
 * @param {string} props.filePath - Full path to the file in Firebase Storage
 * @param {string} props.title - Title of the document
 */
export default function LectureNotes({ filePath, title = "Download Notes" }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleDownload = async () => {
        setLoading(true);
        setError(null);

        try {
            const getSignedUrlFn = httpsCallable(functions, 'getSignedUrl');
            const result = await getSignedUrlFn({ filePath });
            
            if (result.data && result.data.url) {
                // Open the securely signed URL in a new tab
                window.open(result.data.url, '_blank', 'noopener,noreferrer');
            } else {
                throw new Error("Invalid response from server");
            }
        } catch (err) {
            console.error("Failed to fetch signed URL:", err);
            setError(err.message || "Failed to generate download link.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button 
                onClick={handleDownload} 
                disabled={loading}
                className="btn" 
                style={{ fontSize: '11px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
                <span style={{ fontSize: '14px' }}>📄</span>
                {loading ? 'Generating Link...' : title}
            </button>
            
            {error && (
                <span style={{ color: 'var(--red)', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                    ⚠ {error}
                </span>
            )}
        </div>
    );
}
