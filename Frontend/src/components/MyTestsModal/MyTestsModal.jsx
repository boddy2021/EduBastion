import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FeedbackModal from '../FeedbackModal/FeedbackModal';
import styles from './MyTestsModal.module.css';

const API = 'http://127.0.0.1:8000';

const categorize = (test, submission, now) => {
    const submitted = submission && submission.submitted;
    if (submitted) return 'completed';

    const startTime = test.start_time ? new Date(test.start_time) : null;
    if (startTime && now < startTime) return 'upcoming';

    const duration = parseInt(test.time_allocated_minutes, 10) || 0;
    const endTime = startTime ? new Date(startTime.getTime() + duration * 60000) : null;
    const isExpired = endTime ? now > endTime : false;
    if (isExpired) return 'missed';

    return 'active';
};

const OPTIONS = [
    { key: 'active', label: 'Active' },
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'completed', label: 'Completed' },
    { key: 'missed', label: 'Missed' },
];

function MyTestsModal({ isOpen, onClose, userId }) {
    const navigate = useNavigate();
    const [tests, setTests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState(null);
    const [feedbackTarget, setFeedbackTarget] = useState(null);

    useEffect(() => {
        if (isOpen && userId) {
            setSelected(null);
            fetchEverything();
        }

    }, [isOpen, userId]);

    const fetchEverything = async () => {
        setLoading(true);
        try {
            const clsRes = await fetch(`${API}/api/classes/student/${userId}`);
            const classes = clsRes.ok ? await clsRes.json() : [];
            const collected = [];

            await Promise.all(classes.map(async (cls) => {
                const [quizRes, crsRes] = await Promise.all([
                    fetch(`${API}/api/classes/${cls.id}/quizzes`),
                    fetch(`${API}/api/courses/by-class/${cls.id}`),
                ]);
                const quizzes = quizRes.ok ? await quizRes.json() : [];
                const courses = crsRes.ok ? await crsRes.json() : [];
                const courseMap = {};
                courses.forEach(c => { courseMap[c.id] = c.title; });

                await Promise.all(quizzes.map(async (q) => {
                    let submission = null;
                    try {
                        const stRes = await fetch(`${API}/api/quizzes/${q.id}/status/${userId}`);
                        if (stRes.ok) submission = await stRes.json();
                    } catch (e) {  }
                    collected.push({
                        ...q,
                        className: cls.name,
                        courseTitle: courseMap[q.course_id] || 'General',
                        submission,
                    });
                }));
            }));

            setTests(collected);
        } catch (err) {
            console.error('Error loading tests', err);
        } finally {
            setLoading(false);
        }
    };

    const handleStartTest = (testId) => {
        const targetUrl = window.location.origin + `/quiz/${testId}/take`;
        const features = "width=1024,height=768,left=100,top=100,toolbar=no,menubar=no,scrollbars=yes,resizable=yes";
        const popup = window.open(targetUrl, 'SecureExamWindow', features);
        if (!popup || popup.closed || typeof popup.closed === 'undefined') {
            alert("THE BROWSER BLOCKED THE WINDOW!\n\nPlease allow pop-ups for this site.");
        }
    };

    const fmt = (iso) => {
        if (!iso) return null;
        try { return new Date(iso).toLocaleString(); } catch { return null; }
    };

    if (!isOpen) return null;

    const now = new Date();
    const withCategory = tests.map(t => ({ ...t, category: categorize(t, t.submission, now) }));
    const counts = {
        active: withCategory.filter(t => t.category === 'active').length,
        upcoming: withCategory.filter(t => t.category === 'upcoming').length,
        completed: withCategory.filter(t => t.category === 'completed').length,
        missed: withCategory.filter(t => t.category === 'missed').length,
    };
    const visible = selected ? withCategory.filter(t => t.category === selected) : [];

    const renderAction = (t) => {
        if (t.category === 'active') {
            return <button className={styles.primaryBtn} onClick={() => handleStartTest(t.id)}>Take Test</button>;
        }
        if (t.category === 'completed') {
            return (
                <div className={styles.actionGroup}>
                    <button className={styles.viewBtn} onClick={() => navigate(`/quiz/result/${t.submission?.submission_id}`)}>Results</button>
                    <button className={styles.viewBtn} onClick={() => setFeedbackTarget(t)}>Feedback</button>
                </div>
            );
        }
        if (t.category === 'upcoming') {
            return <span className={styles.metaMuted}>Opens {fmt(t.start_time)}</span>;
        }
        return <span className={styles.metaMuted}>Closed</span>;
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <button className={styles.closeBtn} onClick={onClose}>✕</button>

                {!selected ? (
                    <>
                        <h2 className={styles.mainTitle}>My Tests</h2>
                        {loading ? (
                            <p className={styles.loading}>Loading your tests...</p>
                        ) : (
                            <div className={styles.listContainer}>
                                {OPTIONS.map(opt => (
                                    <div
                                        key={opt.key}
                                        className={styles.classItem}
                                        onClick={() => setSelected(opt.key)}
                                    >
                                        <span className={styles.className}>{opt.label}</span>
                                        <span className={styles.count}>{counts[opt.key]}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        <div className={styles.topNav}>
                            <button className={styles.backLink} onClick={() => setSelected(null)}>
                                ← Back to categories
                            </button>
                        </div>

                        <div className={styles.header}>
                            <div>
                                <h2 className={styles.title}>{OPTIONS.find(o => o.key === selected)?.label} Tests</h2>
                                <p className={styles.subtitle}>Across all your classes</p>
                            </div>
                        </div>

                        {visible.length === 0 ? (
                            <p className={styles.loading}>No tests in this category.</p>
                        ) : (
                            <div className={styles.testList}>
                                {visible.map(t => (
                                    <div key={`${t.className}-${t.id}`} className={styles.testRow}>
                                        <div className={styles.testInfo}>
                                            <div className={styles.testTitle}>{t.title}</div>
                                            <div className={styles.testMeta}>{t.className} • {t.courseTitle}</div>
                                        </div>
                                        <div className={styles.testAction}>{renderAction(t)}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            <FeedbackModal
                isOpen={!!feedbackTarget}
                onClose={() => setFeedbackTarget(null)}
                resultId={feedbackTarget?.submission?.submission_id}
                currentUserId={userId}
                counterpartId={feedbackTarget?.professor_id}
                viewerRole="student"
                counterpartName="Your professor"
                quizTitle={feedbackTarget?.title}
            />
        </div>
    );
}

export default MyTestsModal;