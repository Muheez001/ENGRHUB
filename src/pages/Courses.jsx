import { Link } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { useFirestoreQuery } from '../hooks/useFirestoreQuery';
import StateDisplay from '../components/StateDisplay';

export default function Courses() {
    const { hasProfile, university, department, yearNumber, dualTrack } = useUser();

    // Fetch active courses
    const { data: courses, loading, error, refetch } = useFirestoreQuery({
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
        return <StateDisplay type="loading" message="Loading courses..." />;
    }

    if (error) {
        return <StateDisplay type="error" message={error} onRetry={refetch} />;
    }

    // Group courses by session (semester)
    const groupedCourses = (courses || []).reduce((acc, course) => {
        const session = course.session || '1';
        if (!acc[session]) acc[session] = [];
        acc[session].push(course);
        return acc;
    }, {});

    return (
        <div>
            <div className="page-header anim">
                <div className="page-header-left">
                    <div className="page-eyebrow">
                        <span className="dot"></span>
                        <span>{department?.toUpperCase()} · {yearNumber}00L</span>
                    </div>
                    <h1 className="page-title">Cour<span className="accent">ses</span></h1>
                    <p className="page-desc">Track 1 courses mapped to your local curriculum, plus Track 2 world-standard content.</p>
                </div>
                
                <div className="page-header-right">
                    <div className="header-meta">
                        <div className="header-meta-label">Dual-Track Engine</div>
                        <span className="header-meta-value" style={{ color: dualTrack.showTrack2 ? 'var(--purple)' : 'var(--text-3)' }}>
                            {dualTrack.showTrack2 ? 'ACTIVE' : 'SUPPRESSED (EXAM MODE)'}
                        </span>
                    </div>
                </div>
            </div>

            <div className="bento">
                {Object.keys(groupedCourses).length === 0 ? (
                    <div className="bento-cell col-12 anim d1">
                        <StateDisplay 
                            type="empty" 
                            message="No courses found for your department and level yet." 
                            icon="◈"
                        />
                        <div style={{ textAlign: 'center', marginTop: -20, marginBottom: 20 }}>
                            <Link to="/upload" className="btn btn-primary">Contribute a Syllabus</Link>
                        </div>
                    </div>
                ) : (
                    Object.entries(groupedCourses).sort(([a], [b]) => a.localeCompare(b)).map(([session, sessionCourses], idx) => (
                        <div key={session} className="bento-cell col-12" style={{ padding: 0, background: 'none', border: 'none' }}>
                            <h2 style={{ fontSize: '14px', color: 'var(--text-2)', marginBottom: '16px', borderBottom: '1px solid var(--border-1)', paddingBottom: '8px' }}>
                                Semester {session}
                            </h2>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                                {sessionCourses.map((course, cIdx) => (
                                    <Link key={course.id} to={`/courses/${course.id}`} className={`bento-cell anim d${(idx + cIdx) % 10}`} style={{ display: 'flex', flexDirection: 'column', gap: '12px', textDecoration: 'none' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div style={{ color: 'var(--accent)', fontWeight: 'bold', fontSize: '18px' }}>{course.code}</div>
                                            <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-3)' }}>
                                                {course.topics?.length || 0} TOPICS
                                            </div>
                                        </div>
                                        <div style={{ color: 'var(--text-0)', fontWeight: 500, lineHeight: 1.4 }}>
                                            {course.title}
                                        </div>
                                        <div style={{ marginTop: 'auto', display: 'flex', gap: '8px', paddingTop: '12px', borderTop: '1px solid var(--border-0)' }}>
                                            <div style={{ fontSize: '11px', color: 'var(--green)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <span className="dot" style={{ background: 'var(--green)' }}></span> Track 1
                                            </div>
                                            {dualTrack.showTrack2 && course.track2Topics && course.track2Topics.length > 0 && (
                                                <div style={{ fontSize: '11px', color: 'var(--purple)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <span className="dot" style={{ background: 'var(--purple)' }}></span> Track 2
                                                </div>
                                            )}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
