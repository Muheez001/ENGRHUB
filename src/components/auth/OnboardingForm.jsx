import { useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';

// Nigerian universities with engineering faculties
const UNIVERSITIES = [
    // Federal Universities
    { id: 'unilag', name: 'University of Lagos (UNILAG)' },
    { id: 'ui', name: 'University of Ibadan (UI)' },
    { id: 'unn', name: 'University of Nigeria, Nsukka (UNN)' },
    { id: 'abu', name: 'Ahmadu Bello University (ABU)' },
    { id: 'uniben', name: 'University of Benin (UNIBEN)' },
    { id: 'uniport', name: 'University of Port Harcourt (UNIPORT)' },
    { id: 'unijos', name: 'University of Jos (UNIJOS)' },
    { id: 'unimaid', name: 'University of Maiduguri (UNIMAID)' },
    { id: 'unilorin', name: 'University of Ilorin (UNILORIN)' },
    { id: 'unical', name: 'University of Calabar (UNICAL)' },
    { id: 'uniuyo', name: 'University of Uyo (UNIUYO)' },
    { id: 'unizik', name: 'Nnamdi Azikiwe University (UNIZIK)' },
    { id: 'funaab', name: 'Federal University of Agriculture, Abeokuta (FUNAAB)' },
    { id: 'futminna', name: 'Federal University of Technology, Minna (FUTMINNA)' },
    { id: 'futa', name: 'Federal University of Technology, Akure (FUTA)' },
    { id: 'futo', name: 'Federal University of Technology, Owerri (FUTO)' },
    { id: 'atbu', name: 'Abubakar Tafawa Balewa University (ATBU)' },
    { id: 'mouau', name: 'Michael Okpara University of Agriculture (MOUAU)' },
    // State Universities
    { id: 'lasu', name: 'Lagos State University (LASU)' },
    { id: 'lautech', name: 'Ladoke Akintola University of Technology (LAUTECH)' },
    { id: 'eksu', name: 'Ekiti State University (EKSU)' },
    { id: 'rsust', name: 'Rivers State University (RSU)' },
    { id: 'abuad', name: 'Afe Babalola University (ABUAD)' },
    { id: 'enugu-state', name: 'Enugu State University (ESUT)' },
    { id: 'ambrose', name: 'Ambrose Alli University (AAU)' },
    { id: 'oou', name: 'Olabisi Onabanjo University (OOU)' },
    // Private Universities
    { id: 'covenant', name: 'Covenant University' },
    { id: 'bells', name: 'Bells University of Technology' },
    { id: 'afe-babalola', name: 'Afe Babalola University, Ado-Ekiti' },
    { id: 'pamo', name: 'Pan-Atlantic University (PAU)' },
    // Obafemi Awolowo
    { id: 'oau', name: 'Obafemi Awolowo University (OAU)' },
];

// Engineering departments across Nigerian universities
const DEPARTMENTS = [
    { id: 'ece', name: 'Electronics & Computer Engineering' },
    { id: 'eee', name: 'Electrical & Electronics Engineering' },
    { id: 'mech', name: 'Mechanical Engineering' },
    { id: 'civil', name: 'Civil Engineering' },
    { id: 'chem', name: 'Chemical Engineering' },
    { id: 'comp', name: 'Computer Engineering' },
    { id: 'petrol', name: 'Petroleum Engineering' },
    { id: 'agric', name: 'Agricultural Engineering' },
    { id: 'struct', name: 'Structural Engineering' },
    { id: 'mse', name: 'Materials & Metallurgical Engineering' },
    { id: 'prod', name: 'Production & Industrial Engineering' },
    { id: 'bio', name: 'Biomedical Engineering' },
    { id: 'food', name: 'Food Engineering' },
    { id: 'mech-tron', name: 'Mechatronics Engineering' },
    { id: 'telecom', name: 'Telecommunications Engineering' },
    { id: 'systems', name: 'Systems Engineering' },
    { id: 'water', name: 'Water Resources Engineering' },
    { id: 'info', name: 'Information & Communication Engineering' },
];

const YEARS = [
    { value: 1, label: '100 Level (Year 1)' },
    { value: 2, label: '200 Level (Year 2)' },
    { value: 3, label: '300 Level (Year 3)' },
    { value: 4, label: '400 Level (Year 4)' },
    { value: 5, label: '500 Level (Year 5)' },
];

const SESSIONS = [
    { value: 'first', label: 'First Semester' },
    { value: 'second', label: 'Second Semester' },
];

export default function OnboardingForm({ onComplete }) {
    const { user } = useAuth0();
    const [step, setStep] = useState(1);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState({
        nickname: '',
        university: '',
        department: '',
        yearNumber: '',
        session: '',
    });

    const updateField = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const canProceed = () => {
        if (step === 1) return formData.nickname.trim().length >= 2;
        if (step === 2) return formData.university && formData.department;
        if (step === 3) return formData.yearNumber && formData.session;
        return false;
    };

    const handleSubmit = async () => {
        if (!user) return;
        setSaving(true);
        setError(null);

        try {
            // Use Auth0 sub as userId (matches architecture rule #8)
            const userId = user.sub;

            await setDoc(doc(db, 'users', userId), {
                nickname: formData.nickname.trim(),
                university: formData.university,
                department: formData.department,
                school: UNIVERSITIES.find(u => u.id === formData.university)?.name || '',
                country: 'Nigeria',
                yearNumber: Number(formData.yearNumber),
                session: formData.session,
                examWindowStart: null,
                examWindowEnd: null,
                track2Override: false,
                createdAt: serverTimestamp(),
            });

            onComplete();
        } catch (err) {
            console.error('Onboarding error:', err);
            setError('Failed to save your profile. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="onboarding-page">
            <div className="onboarding-card">
                {/* Progress dots */}
                <div className="onboarding-progress">
                    {[1, 2, 3].map(s => (
                        <div
                            key={s}
                            className={`progress-dot ${s === step ? 'active' : ''} ${s < step ? 'done' : ''}`}
                        />
                    ))}
                </div>

                {/* Step 1: Name */}
                {step === 1 && (
                    <div className="onboarding-step anim">
                        <div className="onboarding-emoji">👋</div>
                        <h2 className="onboarding-title">Welcome to EngHub</h2>
                        <p className="onboarding-desc">What should we call you?</p>
                        <input
                            type="text"
                            className="onboarding-input"
                            placeholder="Your nickname"
                            value={formData.nickname}
                            onChange={(e) => updateField('nickname', e.target.value)}
                            autoFocus
                            maxLength={30}
                        />
                    </div>
                )}

                {/* Step 2: University + Department */}
                {step === 2 && (
                    <div className="onboarding-step anim">
                        <div className="onboarding-emoji">🏛️</div>
                        <h2 className="onboarding-title">Your University</h2>
                        <p className="onboarding-desc">Select your university and department.</p>

                        <select
                            className="onboarding-select"
                            value={formData.university}
                            onChange={(e) => updateField('university', e.target.value)}
                        >
                            <option value="">Select university...</option>
                            {UNIVERSITIES.map(u => (
                                <option key={u.id} value={u.id}>{u.name}</option>
                            ))}
                        </select>

                        <select
                            className="onboarding-select"
                            value={formData.department}
                            onChange={(e) => updateField('department', e.target.value)}
                        >
                            <option value="">Select department...</option>
                            {DEPARTMENTS.map(d => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Step 3: Year + Session */}
                {step === 3 && (
                    <div className="onboarding-step anim">
                        <div className="onboarding-emoji">📚</div>
                        <h2 className="onboarding-title">Your Level</h2>
                        <p className="onboarding-desc">Which year and semester are you in?</p>

                        <select
                            className="onboarding-select"
                            value={formData.yearNumber}
                            onChange={(e) => updateField('yearNumber', e.target.value)}
                        >
                            <option value="">Select year level...</option>
                            {YEARS.map(y => (
                                <option key={y.value} value={y.value}>{y.label}</option>
                            ))}
                        </select>

                        <select
                            className="onboarding-select"
                            value={formData.session}
                            onChange={(e) => updateField('session', e.target.value)}
                        >
                            <option value="">Select semester...</option>
                            {SESSIONS.map(s => (
                                <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Error message */}
                {error && <p className="onboarding-error">{error}</p>}

                {/* Navigation buttons */}
                <div className="onboarding-actions">
                    {step > 1 && (
                        <button className="btn" onClick={() => setStep(s => s - 1)}>
                            Back
                        </button>
                    )}
                    <div style={{ flex: 1 }} />
                    {step < 3 ? (
                        <button
                            className="btn btn-primary"
                            disabled={!canProceed()}
                            onClick={() => setStep(s => s + 1)}
                        >
                            Continue
                        </button>
                    ) : (
                        <button
                            className="btn btn-primary"
                            disabled={!canProceed() || saving}
                            onClick={handleSubmit}
                        >
                            {saving ? 'Saving...' : 'Launch Dashboard →'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
