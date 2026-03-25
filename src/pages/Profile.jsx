import { useAuth0 } from '@auth0/auth0-react';
import { useUserProfile } from '../hooks/useUserProfile';

const UNIVERSITY_NAMES = {
    unilag: 'University of Lagos (UNILAG)',
    ui: 'University of Ibadan (UI)',
    unn: 'University of Nigeria, Nsukka (UNN)',
    abu: 'Ahmadu Bello University (ABU)',
    uniben: 'University of Benin (UNIBEN)',
    uniport: 'University of Port Harcourt (UNIPORT)',
    unijos: 'University of Jos (UNIJOS)',
    unimaid: 'University of Maiduguri (UNIMAID)',
    unilorin: 'University of Ilorin (UNILORIN)',
    unical: 'University of Calabar (UNICAL)',
    uniuyo: 'University of Uyo (UNIUYO)',
    unizik: 'Nnamdi Azikiwe University (UNIZIK)',
    funaab: 'Federal University of Agriculture, Abeokuta (FUNAAB)',
    futminna: 'Federal University of Technology, Minna (FUTMINNA)',
    futa: 'Federal University of Technology, Akure (FUTA)',
    futo: 'Federal University of Technology, Owerri (FUTO)',
    atbu: 'Abubakar Tafawa Balewa University (ATBU)',
    mouau: 'Michael Okpara University of Agriculture (MOUAU)',
    lasu: 'Lagos State University (LASU)',
    lautech: 'Ladoke Akintola University of Technology (LAUTECH)',
    eksu: 'Ekiti State University (EKSU)',
    rsust: 'Rivers State University (RSU)',
    abuad: 'Afe Babalola University (ABUAD)',
    'enugu-state': 'Enugu State University (ESUT)',
    ambrose: 'Ambrose Alli University (AAU)',
    oou: 'Olabisi Onabanjo University (OOU)',
    covenant: 'Covenant University',
    bells: 'Bells University of Technology',
    'afe-babalola': 'Afe Babalola University, Ado-Ekiti',
    pamo: 'Pan-Atlantic University (PAU)',
    oau: 'Obafemi Awolowo University (OAU)',
};

const DEPARTMENT_NAMES = {
    ece: 'Electronics & Computer Engineering',
    eee: 'Electrical & Electronics Engineering',
    mech: 'Mechanical Engineering',
    civil: 'Civil Engineering',
    chem: 'Chemical Engineering',
    comp: 'Computer Engineering',
    petrol: 'Petroleum Engineering',
    agric: 'Agricultural Engineering',
    struct: 'Structural Engineering',
    mse: 'Materials & Metallurgical Engineering',
    prod: 'Production & Industrial Engineering',
    bio: 'Biomedical Engineering',
    food: 'Food Engineering',
    'mech-tron': 'Mechatronics Engineering',
    telecom: 'Telecommunications Engineering',
    systems: 'Systems Engineering',
    water: 'Water Resources Engineering',
    info: 'Information & Communication Engineering',
};

const YEAR_LABELS = {
    1: '100 Level',
    2: '200 Level',
    3: '300 Level',
    4: '400 Level',
    5: '500 Level',
};

export default function Profile() {
    const { user } = useAuth0();
    const { profile, loading } = useUserProfile();

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="loading-spinner"></div>
                <p className="loading-text">Loading profile...</p>
            </div>
        );
    }

    return (
        <div>
            <div className="page-header anim">
                <div className="page-header-left">
                    <div className="page-eyebrow">
                        <span className="dot"></span>
                        <span>Student Profile</span>
                    </div>
                    <h1 className="page-title">Pro<span className="accent">file</span></h1>
                    <p className="page-desc">Your university, department, and learning preferences.</p>
                </div>
            </div>

            <div className="bento">
                {/* Auth0 identity card */}
                <div className="bento-cell col-4 anim d1" style={{ '--trace-color': 'var(--accent)' }}>
                    <div className="stat-eyebrow">
                        <span className="indicator" style={{ background: 'var(--accent)' }}></span>
                        Identity
                    </div>
                    <div className="profile-identity">
                        {user?.picture && (
                            <img
                                src={user.picture}
                                alt="Avatar"
                                className="profile-avatar-lg"
                            />
                        )}
                        <div>
                            <div className="profile-name">{profile?.nickname || user?.name || '—'}</div>
                            <div className="profile-email">{user?.email || '—'}</div>
                        </div>
                    </div>
                </div>

                {/* University */}
                <div className="bento-cell col-4 anim d2" style={{ '--trace-color': 'var(--purple)' }}>
                    <div className="stat-eyebrow">
                        <span className="indicator" style={{ background: 'var(--purple)' }}></span>
                        University
                    </div>
                    <div className="profile-value">
                        {UNIVERSITY_NAMES[profile?.university] || profile?.university || '—'}
                    </div>
                    <div className="stat-footer">{profile?.country || 'Nigeria'}</div>
                </div>

                {/* Department */}
                <div className="bento-cell col-4 anim d3" style={{ '--trace-color': 'var(--green)' }}>
                    <div className="stat-eyebrow">
                        <span className="indicator" style={{ background: 'var(--green)' }}></span>
                        Department
                    </div>
                    <div className="profile-value">
                        {DEPARTMENT_NAMES[profile?.department] || profile?.department || '—'}
                    </div>
                    <div className="stat-footer">Engineering Faculty</div>
                </div>

                {/* Year Level */}
                <div className="bento-cell col-3 anim d4" style={{ '--trace-color': 'var(--gold)' }}>
                    <div className="stat-eyebrow">
                        <span className="indicator" style={{ background: 'var(--gold)' }}></span>
                        Year Level
                    </div>
                    <div className="stat-number text-gold" style={{ fontSize: '2rem' }}>
                        {profile?.yearNumber ? `${profile.yearNumber}` : '—'}
                    </div>
                    <div className="stat-footer">
                        {YEAR_LABELS[profile?.yearNumber] || '—'}
                    </div>
                </div>

                {/* Session */}
                <div className="bento-cell col-3 anim d5" style={{ '--trace-color': 'var(--accent)' }}>
                    <div className="stat-eyebrow">
                        <span className="indicator" style={{ background: 'var(--accent)' }}></span>
                        Semester
                    </div>
                    <div className="profile-value" style={{ textTransform: 'capitalize' }}>
                        {profile?.session || '—'}
                    </div>
                    <div className="stat-footer">Current semester</div>
                </div>

                {/* Exam Window */}
                <div className="bento-cell col-3 anim d6" style={{ '--trace-color': 'var(--red)' }}>
                    <div className="stat-eyebrow">
                        <span className="indicator" style={{ background: 'var(--text-3)' }}></span>
                        Exam Window
                    </div>
                    <div className="profile-value" style={{ color: 'var(--text-3)' }}>
                        Not set
                    </div>
                    <div className="stat-footer">Configure in Settings</div>
                </div>

                {/* Track 2 Override */}
                <div className="bento-cell col-3 anim d7" style={{ '--trace-color': 'var(--purple)' }}>
                    <div className="stat-eyebrow">
                        <span className="indicator" style={{ background: 'var(--text-3)' }}></span>
                        Track 2 Override
                    </div>
                    <div className="profile-value">
                        {profile?.track2Override ? 'Active' : 'Off'}
                    </div>
                    <div className="stat-footer">World-standard content</div>
                </div>
            </div>
        </div>
    );
}
