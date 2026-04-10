/**
 * StateDisplay — Reusable loading/empty/error state component.
 * Matches the bento design system with proper typography and animations.
 *
 * @param {object} props
 * @param {'loading'|'empty'|'error'} props.type - State type
 * @param {string} [props.message] - Message to display
 * @param {Function} [props.onRetry] - Retry callback for error state
 * @param {string} [props.icon] - Override icon
 */
export default function StateDisplay({
    type = 'loading',
    message = '',
    onRetry = null,
    icon = null,
}) {
    if (type === 'loading') {
        return (
            <div className="state-display state-loading">
                <div className="state-spinner">
                    <div className="spinner-ring" />
                </div>
                <p className="state-message">{message || 'Loading...'}</p>
            </div>
        );
    }

    if (type === 'empty') {
        return (
            <div className="state-display state-empty">
                <div className="state-icon">{icon || '◇'}</div>
                <p className="state-message">
                    {message || 'Nothing here yet'}
                </p>
            </div>
        );
    }

    if (type === 'error') {
        return (
            <div className="state-display state-error">
                <div className="state-icon">{icon || '⚠'}</div>
                <p className="state-message">
                    {message || 'Something went wrong'}
                </p>
                {onRetry && (
                    <button className="btn" onClick={onRetry}>
                        Try again
                    </button>
                )}
            </div>
        );
    }

    return null;
}
