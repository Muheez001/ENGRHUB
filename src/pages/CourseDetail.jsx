import { useParams } from 'react-router-dom';

export default function CourseDetail() {
    const { courseId } = useParams();
    return (
        <div>
            <div className="page-header anim">
                <div className="page-header-left">
                    <div className="page-eyebrow"><span className="dot"></span><span>Course · {courseId}</span></div>
                    <h1 className="page-title">Course <span className="accent">Detail</span></h1>
                    <p className="page-desc">Topics, lecture videos, notes, and exercises.</p>
                </div>
            </div>
            <div className="bento">
                <div className="bento-cell col-12 anim d2">
                    <div className="placeholder-page">
                        <div className="placeholder-icon">◉</div>
                        <div className="placeholder-label">Topics & content · Phase 6</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
