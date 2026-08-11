import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FeedbackModal from '../../components/FeedbackModal/FeedbackModal';
import styles from './ManageClassPage.module.css';
import Icon from '../../components/UI/Icon';
import editIcon from '../../assets/icons/edit.svg?raw';
import trashIcon from '../../assets/icons/trash.svg?raw';

const TestListItem = ({ test, userRole, userId, onDelete, onEdit, submission, isExpired }) => {
    const navigate = useNavigate();
    const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

    const startDate = test.start_time ? new Date(test.start_time).toLocaleString() : "Available anytime";
    const isMissed = userRole === 'student' && isExpired && (!submission || !submission.submitted);

    const handleStartTest = () => {
        const targetUrl = window.location.origin + `/quiz/${test.id}/take`;
        const windowFeatures = "width=1024,height=768,left=100,top=100,toolbar=no,menubar=no,scrollbars=yes,resizable=yes";
        const popup = window.open(targetUrl, 'SecureExamWindow', windowFeatures);

        if (!popup || popup.closed || typeof popup.closed === 'undefined') {
            alert("THE BROWSER BLOCKED THE WINDOW!\n\nPlease look at the address bar above, click the red 'X' icon and allow pop-ups for this site.");
        }
    };

    return (
        <div className={styles.listItem}>
            <div className={styles.itemContent}>
                <div className={styles.itemTitle}>
                    {test.title}
                    {isMissed && <span className={styles.missedBadge}>Missed</span>}
                </div>
                <div className={styles.itemMeta}>
                    <span>Starts: {startDate}</span>
                    <span>Duration: {test.time_allocated_minutes} min</span>
                </div>
            </div>

            <div className={styles.itemActions}>
                {userRole === 'student' ? (
                    submission && submission.submitted ? (
                        <>
                            <span className={styles.scoreText}>Score: {submission.score}/10</span>
                            <button className={styles.viewBtn} onClick={() => navigate(`/quiz/result/${submission.submission_id}`)}>
                                Results
                            </button>
                            <button className={`${styles.viewBtn} ${styles.submissionsBtn}`} onClick={() => setIsFeedbackOpen(true)}>
                                Feedback
                            </button>
                            <FeedbackModal
                                isOpen={isFeedbackOpen}
                                onClose={() => setIsFeedbackOpen(false)}
                                resultId={submission.submission_id}
                                currentUserId={userId}
                                counterpartId={test.professor_id}
                                viewerRole="student"
                                counterpartName="Your professor"
                                quizTitle={test.title}
                            />
                        </>
                    ) : isMissed ? (
                        <span className={styles.expiredText}>Time Expired</span>
                    ) : (
                        <button className={styles.viewBtn} onClick={handleStartTest}>
                            Start Test
                        </button>
                    )
                ) : (
                    <>
                        <button className={`${styles.viewBtn} ${styles.submissionsBtn}`} onClick={() => navigate(`/quiz/${test.id}/submissions`)}>
                            Submissions
                        </button>
                        <button className={styles.editIcon} onClick={onEdit} title="Edit Quiz" aria-label="Edit Quiz">
                            <Icon svg={editIcon} size={18} />
                        </button>
                        <button className={styles.deleteIcon} onClick={onDelete} title="Delete" aria-label="Delete">
                            <Icon svg={trashIcon} size={18} />
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default TestListItem;
