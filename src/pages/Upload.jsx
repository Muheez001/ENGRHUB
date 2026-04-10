import { useState, useRef } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';
import { useUserProfile } from '../hooks/useUserProfile';
import { Link } from 'react-router-dom';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
];

export default function Upload() {
    const { user } = useAuth0();
    const { profile, loading } = useUserProfile();
    const fileInputRef = useRef(null);

    const [dragActive, setDragActive] = useState(false);
    const [file, setFile] = useState(null);
    const [error, setError] = useState('');
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [uploadSuccess, setUploadSuccess] = useState(false);

    // Handlers for drag and drop
    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleFile = (selectedFile) => {
        setError('');
        setUploadSuccess(false);

        // Validate type
        if (!ALLOWED_TYPES.includes(selectedFile.type)) {
            setError('Invalid file type. Please upload a PDF, DOC, DOCX, or PPTX file.');
            setFile(null);
            return;
        }

        // Validate size
        if (selectedFile.size > MAX_FILE_SIZE) {
            setError('File is too large. Maximum size is 10MB.');
            setFile(null);
            return;
        }

        setFile(selectedFile);
    };

    const handleUpload = () => {
        if (!file || !profile || !user) return;

        setUploading(true);
        setError('');
        setUploadSuccess(false);

        // Path pattern: pending-uploads/{uniId}/{deptId}/{timestamp}_{filename}
        const timestamp = Date.now();
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filePath = `pending-uploads/${profile.university}/${profile.department}/${timestamp}_${safeName}`;
        
        const storageRef = ref(storage, filePath);
        
        // Custom metadata to identify the uploader
        const metadata = {
            customMetadata: {
                uploadedBy: user.sub,
                originalName: file.name
            }
        };

        const uploadTask = uploadBytesResumable(storageRef, file, metadata);

        uploadTask.on(
            'state_changed',
            (snapshot) => {
                const prog = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                setProgress(prog);
            },
            (err) => {
                console.error("Upload failed", err);
                setError('Upload failed. Please try again.');
                setUploading(false);
            },
            () => {
                // Upload completed successfully
                setUploading(false);
                setUploadSuccess(true);
                setFile(null);
                setProgress(0);
                // We do NOT get the download URL here because the file goes to the backend for processing
                // Note: The parseSyllabus Cloud Function will be triggered automatically.
            }
        );
    };

    if (loading) {
        return (
            <div className="loading-screen" style={{ height: '50vh', background: 'transparent' }}>
                <div className="loading-spinner"></div>
            </div>
        );
    }

    if (!profile || !profile.university || !profile.department) {
        return (
            <div>
                <div className="page-header anim">
                    <div className="page-header-left">
                        <h1 className="page-title">Up<span className="accent">load</span></h1>
                        <p className="page-desc">Please complete your profile first to upload syllabi.</p>
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
                        <span className="dot"></span>
                        <span>Syllabus Ingestion Pipeline</span>
                    </div>
                    <h1 className="page-title">Up<span className="accent">load</span></h1>
                    <p className="page-desc">Share your department syllabus — help unlock courses for {profile.university}.</p>
                </div>
            </div>

            <div className="bento">
                <div className="bento-cell col-8 anim d1" style={{ '--trace-color': 'var(--purple)' }}>
                    <div className="stat-eyebrow">
                        <span className="indicator" style={{ background: 'var(--purple)' }}></span>
                        Upload Zone
                    </div>

                    {!uploadSuccess ? (
                        <>
                            <div 
                                className={`upload-zone ${dragActive ? 'drag-active' : ''}`}
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    style={{ display: 'none' }}
                                    accept=".pdf,.doc,.docx,.ppt,.pptx"
                                    onChange={handleChange}
                                    disabled={uploading}
                                />
                                <div className="upload-icon">⇧</div>
                                <div className="upload-text">
                                    {dragActive ? (
                                        "Drop file here..."
                                    ) : file ? (
                                        <span style={{ color: 'var(--accent)' }}>{file.name}</span>
                                    ) : (
                                        "Drag & drop your syllabus PDF here, or click to browse"
                                    )}
                                </div>
                                <div className="upload-hint">10MB Max · PDF, DOC, PPTX</div>
                            </div>

                            {error && <div className="upload-error">{error}</div>}

                            <div className="upload-actions">
                                <button 
                                    className="btn btn-primary" 
                                    disabled={!file || uploading} 
                                    onClick={handleUpload}
                                    style={{ width: '100%', justifyContent: 'center', marginTop: '16px' }}
                                >
                                    {uploading ? `Uploading... ${progress}%` : 'Upload & Process Syllabus'}
                                </button>
                                {uploading && (
                                    <div className="progress-track">
                                        <div className="progress-track-fill" style={{ width: `${progress}%`, background: 'var(--purple)' }}></div>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="upload-success-state">
                            <div className="success-icon">✓</div>
                            <h3>Upload Successful</h3>
                            <p>
                                Your syllabus has been uploaded and sent to the Gemini AI parser. 
                                It may take a minute to extract the courses.
                            </p>
                            <Link to="/voting" className="btn btn-primary" style={{ marginTop: '20px' }}>
                                Go to Voting Area →
                            </Link>
                            <button className="btn" onClick={() => setUploadSuccess(false)} style={{ marginTop: '12px', width: '100%', justifyContent: 'center' }}>
                                Upload Another
                            </button>
                        </div>
                    )}
                </div>

                <div className="bento-cell col-4 anim d2" style={{ '--trace-color': 'var(--text-3)' }}>
                    <div className="stat-eyebrow">
                        <span className="indicator" style={{ background: 'var(--text-3)' }}></span>
                        How it works
                    </div>
                    <ul className="info-list">
                        <li>
                            <span className="info-icon">1</span>
                            <div>
                                <strong>Upload Document</strong>
                                <p>Upload your official departmental syllabus (PDF or DOCX).</p>
                            </div>
                        </li>
                        <li>
                            <span className="info-icon">2</span>
                            <div>
                                <strong>AI Extraction</strong>
                                <p>Gemini 2.0 Flash reads the document and extracts course titles, codes, and topics.</p>
                            </div>
                        </li>
                        <li>
                            <span className="info-icon">3</span>
                            <div>
                                <strong>Community Verification</strong>
                                <p>Other students in your department will vote to verify the extracted data.</p>
                            </div>
                        </li>
                        <li>
                            <span className="info-icon">4</span>
                            <div>
                                <strong>Live Phase</strong>
                                <p>Once it gets 3 confirms, the courses go live for everyone.</p>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
