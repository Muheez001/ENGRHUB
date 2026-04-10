import { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useUser } from '../context/UserContext';
import { useAuth0 } from '@auth0/auth0-react';
import StateDisplay from '../components/StateDisplay';

export default function Settings() {
    const { profile, hasProfile, userId, refetchProfile, dualTrack } = useUser();
    const { logout } = useAuth0();

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        nickname: '',
        examWindowStart: '',
        examWindowEnd: '',
        track2Override: false,
    });

    useEffect(() => {
        if (profile) {
            setFormData({
                nickname: profile.nickname || '',
                examWindowStart: profile.examWindowStart || '',
                examWindowEnd: profile.examWindowEnd || '',
                track2Override: profile.track2Override || false,
            });
        }
    }, [profile]);

    const handleSave = async (e) => {
        e.preventDefault();
        if (!userId) return;

        setLoading(true);
        try {
            await updateDoc(doc(db, 'users', userId), {
                nickname: formData.nickname,
                examWindowStart: formData.examWindowStart,
                examWindowEnd: formData.examWindowEnd,
                track2Override: formData.track2Override,
            });
            console.log('✅ Settings saved');
            await refetchProfile();
            alert('Settings saved successfully.');
        } catch (err) {
            console.error('Failed to save settings:', err);
            alert('An error occurred while saving.');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    if (!hasProfile) {
        return <StateDisplay type="loading" message="Loading profile data..." />;
    }

    return (
        <div>
            <div className="page-header anim">
                <div className="page-header-left">
                    <div className="page-eyebrow">
                        <span className="dot"></span>
                        <span>Preferences & Exam Management</span>
                    </div>
                    <h1 className="page-title">Sett<span className="accent">ings</span></h1>
                    <p className="page-desc">Configure your exam dates to automatically suppress global standard topics (Track 2).</p>
                </div>
            </div>

            <div className="bento">
                <div className="bento-cell col-12 anim d1">
                    <form onSubmit={handleSave} style={{ maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        
                        <div>
                            <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-0)', marginBottom: '8px' }}>Display Name</div>
                            <input 
                                type="text"
                                name="nickname"
                                value={formData.nickname}
                                onChange={handleChange}
                                className="form-input"
                                placeholder="Your preferred name"
                            />
                        </div>

                        <div style={{ borderTop: '1px solid var(--border-1)', paddingTop: '24px' }}>
                            <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-0)', marginBottom: '4px' }}>Exam Window Configurator</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-2)', marginBottom: '16px', lineHeight: 1.5 }}>
                                Setting an exam window will automatically hide Track 2 (Global Standard) content 
                                during your exams, so you can focus entirely on Track 1 (the local syllabus). 
                                We will also begin fading it out 2 weeks prior.
                            </div>
                            
                            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-3)', marginBottom: '4px' }}>START DATE</label>
                                    <input 
                                        type="date"
                                        name="examWindowStart"
                                        value={formData.examWindowStart}
                                        onChange={handleChange}
                                        className="form-input"
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-3)', marginBottom: '4px' }}>END DATE</label>
                                    <input 
                                        type="date"
                                        name="examWindowEnd"
                                        value={formData.examWindowEnd}
                                        onChange={handleChange}
                                        className="form-input"
                                    />
                                </div>
                            </div>

                            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer', background: 'var(--bg-0)', padding: '16px', borderRadius: 'var(--r-md)', border: '1px solid var(--border-1)' }}>
                                <input 
                                    type="checkbox"
                                    name="track2Override"
                                    checked={formData.track2Override}
                                    onChange={handleChange}
                                    style={{ marginTop: '4px' }}
                                />
                                <div>
                                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-0)', marginBottom: '2px' }}>Track 2 Override</div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>Force display Track 2 content even during active exam windows.</div>
                                </div>
                            </label>
                        </div>

                        {/* Current Status read-only block */}
                        {dualTrack.examWindowSet && (
                            <div style={{ background: 'var(--bg-card)', padding: '16px', borderRadius: 'var(--r-md)', border: '1px dashed var(--border-2)' }}>
                                <div style={{ fontSize: '11px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)', marginBottom: '8px' }}>SYSTEM STATE</div>
                                <div style={{ fontSize: '13px', color: 'var(--text-1)' }}>
                                    Current Phase: <strong style={{ color: 'var(--accent)' }}>{dualTrack.phase.toUpperCase()}</strong>
                                </div>
                                {dualTrack.daysUntilExam !== null && dualTrack.daysUntilExam > 0 && (
                                    <div style={{ fontSize: '13px', color: 'var(--text-1)' }}>
                                        Days until exam: <strong style={{ color: 'var(--red)' }}>{dualTrack.daysUntilExam}</strong>
                                    </div>
                                )}
                            </div>
                        )}

                        <div style={{ borderTop: '1px solid var(--border-1)', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <button 
                                type="button" 
                                onClick={() => logout({ returnTo: window.location.origin })} 
                                className="btn" 
                                style={{ color: 'var(--red)', borderColor: 'var(--red)' }}
                            >
                                Sign Out
                            </button>
                            <button 
                                type="submit" 
                                className="btn btn-primary"
                                disabled={loading}
                            >
                                {loading ? 'Saving...' : 'Save Settings'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
