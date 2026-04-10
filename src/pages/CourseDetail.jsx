import { useParams, Link } from 'react-router-dom';
import { useFirestoreQuery } from '../hooks/useFirestoreQuery';
import { useUser } from '../context/UserContext';
import StateDisplay from '../components/StateDisplay';
import LectureNotes from '../components/LectureNotes';
import VideoPlayer from '../components/VideoPlayer';

export default function CourseDetail() {
    const { courseId } = useParams();
    const { dualTrack } = useUser();

    // Fetch the single course
    const { data: course, loading, error } = useFirestoreQuery({
        collectionPath: 'courses',
        docId: courseId,
    });

    if (loading) {
        return <StateDisplay type="loading" message="Loading course details..." />;
    }

    if (error || !course) {
        return (
            <StateDisplay 
                type="error" 
                message={error || "Course not found"} 
            />
        );
    }

    return (
        <div>
            <div className="page-header anim">
                <Link to="/courses" style={{ color: 'var(--text-3)', textDecoration: 'none', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    ← Back to Courses
                </Link>
                <div className="page-header-left">
                    <div className="page-eyebrow">
                        <span className="dot" style={{ background: 'var(--accent)' }}></span>
                        <span>{course.code} · {course.year}L · Semester {course.session}</span>
                    </div>
                    <h1 className="page-title">{course.title}</h1>
                    <p className="page-desc">
                        Explore the topics, exercises, and world-class supplements for this course.
                    </p>
                </div>
            </div>

            <div className="bento">
                {/* TRACK 1 (Local Curriculum) */}
                <div className={`bento-cell ${dualTrack.showTrack2 ? 'col-6' : 'col-12'} anim d1`}>
                    <div className="stat-eyebrow" style={{ marginBottom: '24px' }}>
                        <span className="indicator" style={{ background: 'var(--green)' }}></span>
                        Track 1 — University Curriculum
                    </div>

                    {!course.topics || course.topics.length === 0 ? (
                        <div style={{ color: 'var(--text-3)', fontSize: '12px' }}>No topics available.</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
                            <div style={{ position: 'absolute', left: '16px', top: '16px', bottom: '16px', width: '1px', background: 'var(--border-1)', zIndex: 0 }}></div>
                            
                            {course.topics.map((topic, idx) => (
                                <div key={idx} style={{ display: 'flex', gap: '16px', zIndex: 1 }}>
                                    <div style={{ 
                                        width: '32px', height: '32px', 
                                        borderRadius: '50%', background: 'var(--bg-0)', 
                                        border: '1px solid var(--border-1)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-2)',
                                        flexShrink: 0
                                    }}>
                                        W{topic.week || idx + 1}
                                    </div>
                                    <div style={{ background: 'var(--bg-card-solid)', border: '1px solid var(--border-0)', borderRadius: 'var(--r-md)', padding: '16px', flex: 1 }}>
                                        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-0)', marginBottom: '8px' }}>
                                            {topic.title}
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <LectureNotes filePath={`materials/${course.id}/${topic.title}.pdf`} title="Read Notes" />
                                            <Link className="btn" to={`/courses/${courseId}/exercises`} style={{ fontSize: '11px', padding: '6px 12px', textDecoration: 'none' }}>
                                                Solve Exercises 
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* TRACK 2 (Global Standard) */}
                {dualTrack.showTrack2 && (
                    <div className="bento-cell col-6 anim d2" style={{ '--trace-color': 'var(--purple)' }}>
                        <div className="stat-eyebrow" style={{ marginBottom: '24px' }}>
                            <span className="indicator" style={{ background: 'var(--purple)' }}></span>
                            Track 2 — Global Standard (MIT/Stanford)
                        </div>

                        {!course.track2Topics || course.track2Topics.length === 0 ? (
                            <div style={{ background: 'var(--purple-glow)', border: '1px solid var(--purple-line)', borderRadius: 'var(--r-md)', padding: '24px', textAlign: 'center' }}>
                                <div style={{ fontSize: '24px', marginBottom: '12px' }}>✨</div>
                                <div style={{ fontSize: '13px', color: 'var(--text-0)', fontWeight: 600, marginBottom: '8px' }}>Global supplements coming soon</div>
                                <div style={{ fontSize: '12px', color: 'var(--text-2)', lineHeight: 1.5 }}>
                                    The AI engine is currently mapping world-class topics (e.g. from MIT OpenCourseWare) onto this local curriculum.
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
                                <div style={{ position: 'absolute', left: '16px', top: '16px', bottom: '16px', width: '1px', background: 'var(--border-1)', zIndex: 0 }}></div>
                                
                                {course.track2Topics.map((topic, idx) => (
                                    <div key={idx} style={{ display: 'flex', gap: '16px', zIndex: 1 }}>
                                        <div style={{ 
                                            width: '32px', height: '32px', 
                                            borderRadius: '50%', background: 'var(--purple-glow)', 
                                            border: '1px solid var(--purple-line)', color: 'var(--purple)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '11px', fontFamily: 'var(--font-mono)',
                                            flexShrink: 0
                                        }}>
                                            T2
                                        </div>
                                        <div style={{ background: 'var(--bg-0)', border: '1px solid var(--purple-line)', borderRadius: 'var(--r-md)', padding: '16px', flex: 1 }}>
                                            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-0)', marginBottom: '8px' }}>
                                                {topic.title}
                                            </div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-2)', marginBottom: '12px' }}>
                                                {topic.description}
                                            </div>
                                            
                                            {topic.youtubeId && (
                                                <div style={{ marginBottom: '12px' }}>
                                                    <VideoPlayer videoId={topic.youtubeId} title={topic.title} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
