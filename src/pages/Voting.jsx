import { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';
import { useUser } from '../context/UserContext';
import { useFirestoreQuery } from '../hooks/useFirestoreQuery';
import StateDisplay from '../components/StateDisplay';

export default function Voting() {
    const { user, profile, hasProfile, userId, department, university } = useUser();
    const [selectedId, setSelectedId] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    // Fetch pending syllabi via the global hook
    const { data: syllabi, loading, error, refetch } = useFirestoreQuery({
        collectionPath: 'pendingSyllabi',
        conditions: [
            ['universityId', '==', university],
            ['deptId', '==', department]
        ],
        realtime: true,
        enabled: hasProfile
    });

    // Auto-select first item
    if (syllabi && syllabi.length > 0 && !selectedId) {
        setSelectedId(syllabi[0].id);
    }

    const castVoteFn = httpsCallable(functions, 'castVote');

    const handleVote = async (id, voteType) => {
        if (!userId || actionLoading) return;
        setActionLoading(true);
        try {
            const result = await castVoteFn({ uploadId: id, voteType });
            console.log(`✅ Vote successful: ${result.data.message}`);
            refetch(); // Ensure latest data even outside snapshot if not real-time
        } catch (err) {
            console.error(`Failed to ${voteType}:`, err);
            alert(`Error casting vote: ${err.message}`);
        } finally {
            setActionLoading(false);
        }
    };

    if (!hasProfile) {
        return (
            <div className="page-header anim">
                <div className="page-header-left">
                    <h1 className="page-title">Veri<span className="accent">fy</span></h1>
                    <p className="page-desc">Please complete your profile to access the voting queue.</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return <StateDisplay type="loading" message="Loading queue..." />;
    }

    if (error) {
        return <StateDisplay type="error" message={error} onRetry={refetch} />;
    }

    // Sort to show pending/voting first, then newest
    const sortedSyllabi = [...(syllabi || [])].sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
    const selectedSyllabus = sortedSyllabi.find(s => s.id === selectedId);

    return (
        <div>
            <div className="page-header anim">
                <div className="page-header-left">
                    <div className="page-eyebrow">
                        <span className="dot"></span>
                        <span>Community Trust System</span>
                    </div>
                    <h1 className="page-title">Veri<span className="accent">fy</span></h1>
                    <p className="page-desc">Review AI-extracted syllabi for <b>{department}</b> at <b>{university}</b>.</p>
                </div>
            </div>

            <div className="bento">
                {/* QUEUE LIST */}
                <div className="bento-cell col-5 anim d1" style={{ '--trace-color': 'var(--accent)' }}>
                    <div className="stat-eyebrow">
                        <span className="indicator" style={{ background: 'var(--accent)' }}></span>
                        Pending Queue
                    </div>

                    {sortedSyllabi.length === 0 ? (
                        <StateDisplay type="empty" message="Queue is empty" />
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {sortedSyllabi.map((item) => (
                                <div 
                                    key={item.id}
                                    onClick={() => setSelectedId(item.id)}
                                    style={{
                                        padding: '16px',
                                        borderRadius: 'var(--r-md)',
                                        border: `1px solid ${selectedId === item.id ? 'var(--accent)' : 'var(--border-1)'}`,
                                        background: selectedId === item.id ? 'var(--accent-glow)' : 'var(--bg-0)',
                                        cursor: 'pointer',
                                        transition: 'all var(--t-fast)'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-0)' }}>
                                            {item.fileUrl?.split('/').pop() || 'Untitled Upload'}
                                        </div>
                                        {item.status === 'voting' && <span style={{ color: 'var(--gold)', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>[VOTING ACTIVE]</span>}
                                        {item.status === 'rejected' && <span style={{ color: 'var(--red)', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>[REJECTED]</span>}
                                        {item.status === 'parse_failed' && <span style={{ color: 'var(--red)', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>[FAILED]</span>}
                                        {item.status === 'approved' && <span style={{ color: 'var(--green)', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>[APPROVED]</span>}
                                    </div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-2)' }}>
                                        Uploaded by: {item.uploadedBy === userId ? 'You' : item.uploadedBy.substring(0, 10) + '...'}
                                    </div>
                                    {item.parsedJson?.courses && (
                                        <div style={{ fontSize: '11px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)', marginTop: '8px' }}>
                                            {item.parsedJson.courses.length} courses extracted
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* PREVIEW PANEL */}
                <div className="bento-cell col-7 anim d2" style={{ '--trace-color': 'var(--green)' }}>
                    <div className="stat-eyebrow">
                        <span className="indicator" style={{ background: 'var(--green)' }}></span>
                        Parse Preview
                    </div>

                    {!selectedSyllabus ? (
                        <StateDisplay type="empty" message="Select a syllabus to preview its contents" />
                    ) : (
                        <div>
                            <div style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--border-1)' }}>
                                <h3 style={{ fontSize: '1.2rem', color: 'var(--text-0)', marginBottom: '8px' }}>
                                    {selectedSyllabus.fileUrl?.split('/').pop()}
                                </h3>
                                <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--text-2)' }}>
                                    <span>Status: <strong style={{ color: 'var(--text-1)' }}>{selectedSyllabus.status}</strong></span>
                                    <span>Confirms: <strong style={{ color: 'var(--green)' }}>{selectedSyllabus.confirmVotes?.length || 0}/3</strong></span>
                                    <span>Flags: <strong style={{ color: 'var(--red)' }}>{selectedSyllabus.flagVotes?.length || 0}/3</strong></span>
                                </div>
                            </div>

                            {selectedSyllabus.status === 'processing' && (
                                <StateDisplay type="loading" message="Gemini 2.0 Flash is currently extracting courses and topics from this document..." />
                            )}

                            {selectedSyllabus.status === 'parse_failed' && (
                                <div className="upload-error">
                                    <strong>AI Extraction Failed:</strong> {selectedSyllabus.errorMessage || "The document could not be parsed."}
                                </div>
                            )}

                            {selectedSyllabus.parsedJson?.courses && selectedSyllabus.parsedJson.courses.length > 0 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <h4 style={{ fontSize: '14px', color: 'var(--text-1)', borderBottom: '1px solid var(--border-0)', paddingBottom: '8px' }}>
                                        Extracted Curriculum Data:
                                    </h4>
                                    {selectedSyllabus.parsedJson.courses.map((course, idx) => (
                                        <div key={idx} style={{ background: 'var(--bg-0)', border: '1px solid var(--border-0)', borderRadius: 'var(--r-md)', padding: '16px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                                <div style={{ color: 'var(--accent)', fontWeight: '700', fontSize: '14px' }}>
                                                    {course.code}
                                                </div>
                                                <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>
                                                    {course.year}L • {course.session} Sem
                                                </div>
                                            </div>
                                            <div style={{ fontWeight: '600', color: 'var(--text-0)', marginBottom: '12px' }}>
                                                {course.title}
                                            </div>
                                            
                                            <div style={{ fontSize: '11px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)', marginBottom: '8px' }}>
                                                TOPICS:
                                            </div>
                                            <ul style={{ paddingLeft: '20px', fontSize: '13px', color: 'var(--text-2)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                {course.topics?.slice(0, 5).map((topic, tIdx) => (
                                                    <li key={tIdx}>{topic.title} (Week {topic.week})</li>
                                                ))}
                                                {course.topics?.length > 5 && (
                                                    <li style={{ listStyle: 'none', color: 'var(--text-3)', fontSize: '12px', marginTop: '4px' }}>
                                                        + {course.topics.length - 5} more topics...
                                                    </li>
                                                )}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {selectedSyllabus.status === 'voting' && (
                                <div style={{ display: 'flex', gap: '12px', marginTop: '32px', padding: '16px', background: 'var(--bg-card-solid)', borderRadius: 'var(--r-md)' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-0)', marginBottom: '4px' }}>Verify this extraction</div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>Does this match your official departmental syllabus?</div>
                                    </div>
                                    <button 
                                        onClick={() => handleVote(selectedSyllabus.id, 'flag')} 
                                        className="btn" 
                                        style={{ borderColor: 'var(--red)', color: 'var(--red)' }}
                                        disabled={actionLoading || selectedSyllabus.uploadedBy === userId || selectedSyllabus.flagVotes?.includes(userId) || selectedSyllabus.confirmVotes?.includes(userId)}
                                    >
                                        {actionLoading ? 'Saving...' : '✗ Flag Errors'}
                                    </button>
                                    <button 
                                        onClick={() => handleVote(selectedSyllabus.id, 'confirm')} 
                                        className="btn btn-primary" 
                                        style={{ background: 'var(--green)' }}
                                        disabled={actionLoading || selectedSyllabus.uploadedBy === userId || selectedSyllabus.flagVotes?.includes(userId) || selectedSyllabus.confirmVotes?.includes(userId)}
                                    >
                                        {actionLoading ? 'Saving...' : '✓ Looks Correct'}
                                    </button>
                                </div>
                            )}
                            
                            {selectedSyllabus.uploadedBy === userId && selectedSyllabus.status === 'voting' && (
                                <div style={{ marginTop: '16px', fontSize: '12px', color: 'var(--text-3)', fontStyle: 'italic' }}>
                                    You cannot vote on your own upload.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
