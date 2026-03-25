import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';

function LiveClock() {
    const [time, setTime] = useState(new Date());
    useEffect(() => {
        const id = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(id);
    }, []);
    return (
        <span className="header-meta-value" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
        </span>
    );
}

export default function Dashboard() {
    return (
        <div>
            {/* ─── HERO HEADER ─── */}
            <div className="page-header anim">
                <div className="page-header-left">
                    <div className="page-eyebrow">
                        <span className="dot"></span>
                        <span>System Online · Electronics & Computer Engineering · 100L</span>
                    </div>
                    <h1 className="page-title">
                        Dash<span className="accent">board</span>
                    </h1>
                    <p className="page-desc">
                        Track your progress across Nigerian curriculum and world-class standards.
                    </p>
                </div>
                <div className="page-header-right">
                    <div className="header-meta">
                        <div className="header-meta-label">Local Time</div>
                        <LiveClock />
                    </div>
                </div>
            </div>

            {/* ─── BENTO GRID ─── */}
            <div className="bento">

                {/* Row 1: Stats */}
                <div className="bento-cell col-3 anim d1" style={{ '--trace-color': 'var(--green)' }}>
                    <div className="stat-eyebrow">
                        <span className="indicator" style={{ background: 'var(--green)' }}></span>
                        Exam Readiness
                    </div>
                    <div className="stat-number text-green">—<span className="stat-unit">%</span></div>
                    <div className="stat-footer">Track 1 · Nigerian Curriculum</div>
                    <div className="progress-track">
                        <div className="progress-track-fill" style={{ width: '0%', background: 'var(--green)' }}></div>
                    </div>
                </div>

                <div className="bento-cell col-3 anim d2" style={{ '--trace-color': 'var(--purple)' }}>
                    <div className="stat-eyebrow">
                        <span className="indicator" style={{ background: 'var(--purple)' }}></span>
                        Global Standard
                    </div>
                    <div className="stat-number text-purple">—<span className="stat-unit">%</span></div>
                    <div className="stat-footer">Track 2 · World Standard</div>
                    <div className="progress-track">
                        <div className="progress-track-fill" style={{ width: '0%', background: 'var(--purple)' }}></div>
                    </div>
                </div>

                <div className="bento-cell col-3 anim d3" style={{ '--trace-color': 'var(--accent)' }}>
                    <div className="stat-eyebrow">
                        <span className="indicator" style={{ background: 'var(--accent)' }}></span>
                        Exercises
                    </div>
                    <div className="stat-number" style={{ color: 'var(--accent)' }}>—</div>
                    <div className="stat-footer">Problems solved this semester</div>
                </div>

                <div className="bento-cell col-3 anim d4" style={{ '--trace-color': 'var(--gold)' }}>
                    <div className="stat-eyebrow">
                        <span className="indicator" style={{ background: 'var(--gold)' }}></span>
                        Courses
                    </div>
                    <div className="stat-number text-gold">—</div>
                    <div className="stat-footer">Active this semester</div>
                </div>

                {/* Row 2: Featured + Actions */}
                <div className="bento-cell col-5 row-2 featured-cell anim d5">
                    <div className="featured-tag">
                        <span className="dot"></span>
                        Dual-Track Engine
                    </div>
                    <div className="featured-title">Bridge the gap between Nigerian &amp; world-class engineering</div>
                    <div className="featured-desc">
                        Track 1 maps to your LASU exams. Track 2 layers MIT/Stanford-level depth
                        on top. EngHub scores both so you know exactly where you stand.
                    </div>
                </div>

                <Link to="/courses" className="bento-cell col-7 action-cell anim d5">
                    <div className="action-header">
                        <div className="action-icon-circle" style={{ background: 'var(--accent-glow)', color: 'var(--accent)' }}>◈</div>
                        <span className="action-arrow">→</span>
                    </div>
                    <div>
                        <div className="action-title">Browse Courses</div>
                        <div className="action-desc">
                            View all Track 1 &amp; Track 2 courses for ECE 100L. Each course shows topics,
                            exercises, and gap analysis scores.
                        </div>
                    </div>
                </Link>

                <Link to="/gap-view" className="bento-cell col-4 action-cell anim d6">
                    <div className="action-header">
                        <div className="action-icon-circle" style={{ background: 'var(--gold-glow)', color: 'var(--gold)' }}>⊞</div>
                        <span className="action-arrow">→</span>
                    </div>
                    <div>
                        <div className="action-title">Gap Analysis</div>
                        <div className="action-desc">LASU vs MIT — topic by topic.</div>
                    </div>
                </Link>

                <Link to="/upload" className="bento-cell col-3 action-cell anim d7">
                    <div className="action-header">
                        <div className="action-icon-circle" style={{ background: 'var(--purple-glow)', color: 'var(--purple)' }}>⇧</div>
                        <span className="action-arrow">→</span>
                    </div>
                    <div>
                        <div className="action-title">Upload Syllabus</div>
                        <div className="action-desc">Help unlock courses for your classmates.</div>
                    </div>
                </Link>

                {/* Row 3: Remaining actions */}
                <Link to="/voting" className="bento-cell col-4 action-cell anim d7">
                    <div className="action-header">
                        <div className="action-icon-circle" style={{ background: 'var(--green-glow)', color: 'var(--green)' }}>◎</div>
                        <span className="action-arrow">→</span>
                    </div>
                    <div>
                        <div className="action-title">Verify Syllabi</div>
                        <div className="action-desc">Vote on pending uploads from your department.</div>
                    </div>
                </Link>

                <div className="bento-cell col-8 anim d8" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 24px' }}>
                    <span style={{ fontSize: '16px' }}>⚡</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-3)' }}>
                        <strong style={{ color: 'var(--text-1)', fontWeight: 600 }}>Phase 1 — Foundation</strong> ·
                        Project scaffolded. Auth, onboarding, and live course data coming in the next build cycle.
                    </span>
                </div>
            </div>
        </div>
    );
}
