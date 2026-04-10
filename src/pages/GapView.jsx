import { useUser } from '../context/UserContext';
import { useFirestoreQuery } from '../hooks/useFirestoreQuery';
import StateDisplay from '../components/StateDisplay';

export default function GapView() {
    const { hasProfile, university, department, yearNumber, dualTrack } = useUser();

    // Fetch active courses for gap analysis
    const { data: courses, loading, error } = useFirestoreQuery({
        collectionPath: 'courses',
        conditions: [
            ['universityId', '==', university],
            ['deptId', '==', department],
            ['yearNumber', '==', yearNumber]
        ],
        orderByField: ['code', 'asc'],
        enabled: hasProfile
    });

    if (!hasProfile) {
        return <StateDisplay type="loading" message="Loading profile data..." />;
    }

    if (loading) {
        return <StateDisplay type="loading" message="Loading gap analysis data..." />;
    }

    if (error) {
        return <StateDisplay type="error" message={error} />;
    }

    if (!dualTrack.showTrack2) {
        return (
            <div>
                <div className="page-header anim">
                    <div className="page-header-left">
                        <div className="page-eyebrow">
                            <span className="dot" style={{ background: 'var(--red)' }}></span>
                            <span>Track 2 Suppressed</span>
                        </div>
                        <h1 className="page-title">Gap <span className="accent">Analysis</span></h1>
                        <p className="page-desc">Exam mode is active. Gap analysis tools are paused until after your exams.</p>
                    </div>
                </div>
                <div className="bento">
                    <div className="bento-cell col-12 anim d1">
                        <StateDisplay type="empty" icon="🔒" message="Focus on your Track 1 exams. The gap view will return automatically." />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="page-header anim">
                <div className="page-header-left">
                    <div className="page-eyebrow">
                        <span className="dot" style={{ background: 'var(--gold)' }}></span>
                        <span>{university?.toUpperCase()} vs Global Standards</span>
                    </div>
                    <h1 className="page-title">Gap <span className="accent">Analysis</span></h1>
                    <p className="page-desc">See what your curriculum covers versus what MIT or Stanford teaches, topic by topic.</p>
                </div>
                <div className="page-header-right">
                    <div className="header-meta">
                        <div className="header-meta-label">Overall Alignment</div>
                        <span className="header-meta-value" style={{ color: 'var(--gold)' }}>— %</span>
                    </div>
                </div>
            </div>

            <div className="bento">
                {!courses || courses.length === 0 ? (
                    <div className="bento-cell col-12 anim d1">
                        <StateDisplay type="empty" message="No curriculum data found to analyze." />
                    </div>
                ) : (
                    courses.map((course, idx) => (
                        <div key={course.id} className={`bento-cell col-12 anim d${idx % 10}`} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-1)', paddingBottom: '12px' }}>
                                <div>
                                    <h3 style={{ fontSize: '18px', color: 'var(--accent)', marginBottom: '4px' }}>{course.code}</h3>
                                    <div style={{ fontSize: '14px', color: 'var(--text-1)' }}>{course.title}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '12px', color: 'var(--text-2)' }}>Gap Score</div>
                                    <div style={{ fontSize: '16px', color: 'var(--gold)', fontWeight: 'bold' }}>TBD</div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '24px' }}>
                                {/* Track 1 Column */}
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--green)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span className="dot" style={{ background: 'var(--green)' }}></span>
                                        Local Foundation ({university})
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {course.topics?.slice(0, 3).map((topic, tIdx) => (
                                            <div key={tIdx} style={{ background: 'var(--bg-0)', border: '1px solid var(--border-1)', padding: '12px', borderRadius: 'var(--r-md)', fontSize: '13px', color: 'var(--text-0)' }}>
                                                {topic.title}
                                            </div>
                                        )) || <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>No topics extracted.</div>}
                                        {course.topics?.length > 3 && (
                                            <div style={{ fontSize: '11px', color: 'var(--text-2)', paddingLeft: '8px' }}>+ {course.topics.length - 3} more topics</div>
                                        )}
                                    </div>
                                </div>

                                {/* Track 2 Column */}
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--purple)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span className="dot" style={{ background: 'var(--purple)' }}></span>
                                        Global Extension (MIT/Stanford)
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {course.track2Topics?.slice(0, 3).map((topic, tIdx) => (
                                            <div key={tIdx} style={{ background: 'var(--purple-glow)', border: '1px solid var(--purple-line)', padding: '12px', borderRadius: 'var(--r-md)', fontSize: '13px', color: 'var(--text-0)' }}>
                                                {topic.title}
                                            </div>
                                        )) || (
                                            <div style={{ background: 'var(--bg-card)', border: '1px dashed var(--border-2)', padding: '16px', borderRadius: 'var(--r-md)', textAlign: 'center', color: 'var(--text-3)', fontSize: '12px' }}>
                                                AI mapping global topics...<br/>(Coming automatically via Gemini)
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
