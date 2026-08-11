import React, { useState, useEffect } from 'react';
import styles from './FeedbackModal.module.css';

const API = 'http://127.0.0.1:8000';

function FeedbackModal({
    isOpen,
    onClose,
    resultId,
    currentUserId,
    counterpartId,
    viewerRole = 'student',
    counterpartName = '',
    quizTitle = '',
}) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [comments, setComments] = useState('');
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const isProfessor = viewerRole === 'professor';
    const receivedTitle = isProfessor ? "Feedback from the student" : "Feedback from your professor";
    const formTitle = isProfessor ? "Leave feedback for the student" : "Leave feedback on this test";

    const meId = parseInt(currentUserId, 10);
    const otherId = parseInt(counterpartId, 10);

    const fetchFeedback = async () => {
        if (!resultId) return;
        setLoading(true);
        try {
            const res = await fetch(`${API}/api/feedback/result/${resultId}`);
            if (res.ok) {
                setItems(await res.json());
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            setComments('');
            setRating(0);
            setHoverRating(0);
            setError('');
            fetchFeedback();
        }

    }, [isOpen, resultId]);

    const handleSubmit = async () => {
        if (!comments.trim()) {
            setError('Please write a short comment before sending.');
            return;
        }
        setSubmitting(true);
        setError('');
        try {
            const res = await fetch(`${API}/api/feedback`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sender_id: meId,
                    receiver_id: otherId,
                    result_id: resultId,
                    comments: comments.trim(),
                    rating: rating > 0 ? rating : null,
                }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.detail || 'Failed to send feedback.');
            }
            setComments('');
            setRating(0);
            await fetchFeedback();
        } catch (err) {
            setError(err.message || 'Something went wrong.');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    const received = items.filter(f => parseInt(f.receiver_id, 10) === meId);
    const sent = items.filter(f => parseInt(f.sender_id, 10) === meId);

    const formatDate = (iso) => {
        if (!iso) return '';
        try {
            return new Date(iso).toLocaleString();
        } catch {
            return '';
        }
    };

    const Stars = ({ value }) => (
        <span className={styles.starsStatic}>
            {[1, 2, 3, 4, 5].map(n => (
                <span key={n} className={n <= value ? styles.starOn : styles.starOff}>★</span>
            ))}
        </span>
    );

    const renderCard = (f, mine) => (
        <div key={f.id} className={`${styles.fbCard} ${mine ? styles.fbCardMine : ''}`}>
            <div className={styles.fbCardTop}>
                {f.rating ? <Stars value={f.rating} /> : <span className={styles.noRating}>No rating</span>}
                <span className={styles.fbDate}>{formatDate(f.created_at)}</span>
            </div>
            <p className={styles.fbText}>{f.comments}</p>
        </div>
    );

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <button className={styles.closeBtn} onClick={onClose}>✕</button>

                <div className={styles.header}>
                    <h2 className={styles.title}>Feedback</h2>
                    <p className={styles.subtitle}>
                        {quizTitle ? quizTitle : 'This test'}
                        {counterpartName ? ` • ${counterpartName}` : ''}
                    </p>
                </div>

                {loading ? (
                    <p className={styles.loading}>Loading feedback...</p>
                ) : (
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>{receivedTitle}</h3>
                        {received.length > 0 ? (
                            <div className={styles.list}>{received.map(f => renderCard(f, false))}</div>
                        ) : (
                            <p className={styles.emptyText}>No feedback received yet.</p>
                        )}
                    </div>
                )}

                <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>{formTitle}</h3>

                    <div className={styles.ratingRow}>
                        <span className={styles.ratingLabel}>Rating (optional):</span>
                        <span className={styles.starsInput}>
                            {[1, 2, 3, 4, 5].map(n => (
                                <span
                                    key={n}
                                    className={(hoverRating || rating) >= n ? styles.starOn : styles.starOff}
                                    onMouseEnter={() => setHoverRating(n)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    onClick={() => setRating(n === rating ? 0 : n)}
                                    role="button"
                                >★</span>
                            ))}
                        </span>
                        {rating > 0 && (
                            <button className={styles.clearRating} onClick={() => setRating(0)}>clear</button>
                        )}
                    </div>

                    <textarea
                        className={styles.textarea}
                        placeholder="Write your feedback here..."
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                        rows={4}
                    />

                    {error && <p className={styles.error}>{error}</p>}

                    <button
                        className={styles.submitBtn}
                        onClick={handleSubmit}
                        disabled={submitting}
                    >
                        {submitting ? 'Sending...' : 'Send Feedback'}
                    </button>

                    {sent.length > 0 && (
                        <div className={styles.sentBox}>
                            <div className={styles.sentLabel}>You already sent:</div>
                            <div className={styles.list}>{sent.map(f => renderCard(f, true))}</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default FeedbackModal;