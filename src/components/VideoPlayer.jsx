import { useState, useRef, useEffect } from 'react';

/**
 * Lazy-loaded YouTube video player.
 * Optimizes performance by only loading the YouTube iframe when the user clicks 'Play'.
 * 
 * @param {object} props
 * @param {string} props.videoId - YouTube video ID
 * @param {string} props.title - Video title
 */
export default function VideoPlayer({ videoId, title = "Course Video" }) {
    const [isLoaded, setIsLoaded] = useState(false);
    const containerRef = useRef(null);

    // Fallback thumbnail using YouTube's image service (hqdefault is low bandwidth)
    const thumbUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

    const handlePlayClick = () => {
        setIsLoaded(true);
    };

    return (
        <div 
            ref={containerRef}
            style={{ 
                position: 'relative',
                width: '100%',
                paddingTop: '56.25%', // 16:9 Aspect Ratio
                background: 'var(--bg-card-solid)',
                borderRadius: 'var(--r-md)',
                overflow: 'hidden',
                border: '1px solid var(--border-1)',
                cursor: !isLoaded ? 'pointer' : 'default',
            }}
            onClick={!isLoaded ? handlePlayClick : undefined}
            role="button"
            aria-label={!isLoaded ? `Play video: ${title}` : undefined}
        >
            {!isLoaded ? (
                <>
                    <img 
                        src={thumbUrl} 
                        alt={`Thumbnail for ${title}`}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            opacity: 0.8,
                            transition: 'opacity var(--t-fast)',
                        }}
                    />
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '64px',
                        height: '48px',
                        backgroundColor: 'var(--red)',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    }}>
                        <div style={{
                            width: 0,
                            height: 0,
                            borderStyle: 'solid',
                            borderWidth: '10px 0 10px 16px',
                            borderColor: 'transparent transparent transparent white',
                        }} />
                    </div>
                </>
            ) : (
                <iframe
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        border: 0,
                    }}
                    src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`}
                    title={title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                ></iframe>
            )}
        </div>
    );
}
