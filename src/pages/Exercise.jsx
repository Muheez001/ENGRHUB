import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';
import { useFirestoreQuery } from '../hooks/useFirestoreQuery';
import { useUser } from '../context/UserContext';
import StateDisplay from '../components/StateDisplay';

export default function Exercise() {
    const { courseId } = useParams();
    const { hasProfile } = useUser();
    const [selectedAnswer, setSelectedAnswer] = useState('');
    const [submitResult, setSubmitResult] = useState(null);
    const [checking, setChecking] = useState(false);

    // Fetch exercises for this course
    const { data: exercises, loading, error } = useFirestoreQuery({
        collectionPath: 'exercises',
        conditions: [['courseId', '==', courseId]],
        enabled: hasProfile
    });

    const checkAnswerFn = httpsCallable(functions, 'checkAnswer');

    const handleSubmit = async (exerciseId) => {
        if (!selectedAnswer) return;
        
        setChecking(true);
        setSubmitResult(null);

        try {
            const result = await checkAnswerFn({ 
                exerciseId, 
                studentAnswer: selectedAnswer 
            });
            
            setSubmitResult({
                status: result.data.status, // "correct" or "incorrect"
                feedback: result.data.feedback
            });
            
        } catch (err) {
            console.error("Answer check failed:", err);
            setSubmitResult({
                status: 'error',
                feedback: err.message || "Failed to verify answer."
            });
        } finally {
            setChecking(false);
        }
    };

    if (loading) return <StateDisplay type="loading" message="Loading exercises..." />;
    if (error) return <StateDisplay type="error" message={error} />;

    return (
        <div>
            <div className="page-header anim">
                <Link to={`/courses/${courseId}`} style={{ color: 'var(--text-3)', textDecoration: 'none', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    ← Back to Course
                </Link>
                <div className="page-header-left">
                    <div className="page-eyebrow">
                        <span className="dot" style={{ background: 'var(--accent)' }}></span>
                        <span>Practice Engine</span>
                    </div>
                    <h1 className="page-title">Exer<span className="accent">cises</span></h1>
                    <p className="page-desc">Test your knowledge with immediate AI feedback.</p>
                </div>
            </div>

            <div className="bento">
                {!exercises || exercises.length === 0 ? (
                    <div className="bento-cell col-12 anim d1">
                        <StateDisplay type="empty" message="No exercises available for this course yet." />
                    </div>
                ) : (
                    exercises.map((ex, idx) => (
                        <div key={ex.id} className={`bento-cell col-12 anim d${idx % 10}`}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-1)' }}>
                                    Question {idx + 1}
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                                    {ex.difficulty?.toUpperCase() || 'STANDARD'}
                                </div>
                            </div>

                            <div style={{ fontSize: '16px', color: 'var(--text-0)', lineHeight: 1.5, marginBottom: '24px' }}>
                                {ex.question}
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                                {ex.options?.map((opt, optIdx) => (
                                    <label 
                                        key={optIdx} 
                                        style={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: '12px',
                                            padding: '16px',
                                            background: selectedAnswer === opt ? 'var(--accent-glow)' : 'var(--bg-0)',
                                            border: `1px solid ${selectedAnswer === opt ? 'var(--accent)' : 'var(--border-1)'}`,
                                            borderRadius: 'var(--r-md)',
                                            cursor: 'pointer',
                                            transition: 'all var(--t-fast)'
                                        }}
                                    >
                                        <input 
                                            type="radio" 
                                            name={`q_${ex.id}`} 
                                            value={opt}
                                            checked={selectedAnswer === opt}
                                            onChange={(e) => setSelectedAnswer(e.target.value)}
                                            style={{ margin: 0 }}
                                        />
                                        <span style={{ fontSize: '14px', color: 'var(--text-1)' }}>{opt}</span>
                                    </label>
                                ))}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '16px' }}>
                                {submitResult && (
                                    <div style={{ 
                                        fontSize: '13px', 
                                        color: submitResult.status === 'correct' ? 'var(--green)' : 
                                               submitResult.status === 'error' ? 'var(--red)' : 'var(--gold)',
                                        fontWeight: 600,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}>
                                        {submitResult.status === 'correct' ? '✓' : submitResult.status === 'error' ? '⚠' : '✗'} 
                                        {submitResult.feedback}
                                    </div>
                                )}
                                
                                <button 
                                    className="btn btn-primary" 
                                    onClick={() => handleSubmit(ex.id)}
                                    disabled={!selectedAnswer || checking}
                                >
                                    {checking ? 'Analyzing...' : 'Check Answer'}
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
