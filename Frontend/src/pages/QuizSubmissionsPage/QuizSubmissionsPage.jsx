import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import Button from '../../components/UI/Button';
import FeedbackModal from '../../components/FeedbackModal/FeedbackModal';
import styles from './QuizSubmissionsPage.module.css';

function QuizSubmissionsPage() {
    const { quizId } = useParams();
    const navigate = useNavigate();
    const professorId = localStorage.getItem('userId');
    const [submissions, setSubmissions] = useState([]);
    const [feedbackTarget, setFeedbackTarget] = useState(null);
    const [quizTitle, setQuizTitle] = useState('');   

    useEffect(() => {
        const fetchSubs = async () => {
            try {
                const res = await fetch(`http://127.0.0.1:8000/api/quizzes/${quizId}/all-submissions`);
                if (res.ok) {
                    setSubmissions(await res.json());
                }
            } catch (err) {
                console.error(err);
            }
        };

        const fetchTitle = async () => {              
            try {
                const res = await fetch(`http://127.0.0.1:8000/api/quizzes/${quizId}/editor`);
                if (res.ok) {
                    const data = await res.json();
                    setQuizTitle(data.title || '');
                }
            } catch (err) {
                console.error(err);
            }
        };

        fetchSubs();
        fetchTitle();                                 
    }, [quizId]);

    return (
        <div className={styles.container}>
            <Navbar />
            <main className={styles.mainContent}>
                <div className={styles.card}>
                    <div className={styles.header}>
                        <h1 className={styles.title}>{quizTitle ? `${quizTitle} Submissions` : 'Quiz Submissions'}</h1>
                        <div style={{width:'100px'}}>
                            <Button onClick={() => navigate(-1)}>Back</Button>
                        </div>
                    </div>

                    <div className={styles.tableContainer}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Email</th>
                                    <th>Score / Status</th>
                                    <th style={{ textAlign: 'center' }}>Details</th>
                                </tr>
                            </thead>
                            <tbody>
                                {submissions.length > 0 ? submissions.map(sub => {
                                    const isPending = sub.status === 'pending_review';
                                    const scoreNum = Number(sub.final_score) || 0;
                                    const isPassing = scoreNum >= 5; 

                                    return (
                                        <tr key={sub.id}>
                                            <td className={styles.studentName}>{sub.student_name || "Unknown"}</td>
                                            <td className={styles.studentEmail}>{sub.student_email || "-"}</td>
                                            <td>
                                                {isPending ? (
                                                    <span className={styles.pendingBadge}>⏳ Pending Review</span>
                                                ) : (
                                                    <span className={`${styles.scoreBadge} ${isPassing ? styles.scorePass : styles.scoreFail}`}>
                                                        {sub.final_score} / 10
                                                    </span>
                                                )}
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <div style={{ display: 'inline-flex', gap: '8px' }}>
                                                    <button 
                                                        className={styles.viewBtn}
                                                        onClick={() => navigate(`/quiz/result/${sub.id}`)}
                                                    >
                                                        View Answers
                                                    </button>
                                                    <button 
                                                        className={styles.viewBtn}
                                                        onClick={() => setFeedbackTarget(sub)}
                                                    >
                                                        Feedback
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                }) : (
                                    <tr>
                                        <td colSpan="4" className={styles.emptyState}>
                                            No students have taken this quiz yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            <FeedbackModal
                isOpen={!!feedbackTarget}
                onClose={() => setFeedbackTarget(null)}
                resultId={feedbackTarget?.id}
                currentUserId={professorId}
                counterpartId={feedbackTarget?.student_id}
                viewerRole="professor"
                counterpartName={feedbackTarget?.student_name}
                quizTitle={quizTitle || 'Quiz Submission'}
            />
        </div>
    );
}

export default QuizSubmissionsPage;