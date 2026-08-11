import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './DashboardPage.module.css';
import { IconClassroom, IconQuiz, IconGradebook, IconJoin, IconGrades, IconTests } from './dashboardIcons';

function ActionCards({ userRole, setIsQuizBuilderOpen, setIsGradebookOpen, setIsMyTestsOpen, setIsGradesModalOpen }) {
    const navigate = useNavigate();

    return (
        <div className={styles.actionRow}>
            {userRole === 'professor' ? (
                <>
                    <div className={styles.actionCard} onClick={() => navigate('/create-class')}>
                        <div>
                            <div className={`${styles.iconBox} ${styles.iconPurple}`}><IconClassroom /></div>
                            <div className={styles.actionTitle}>New Classroom</div>
                            <div className={styles.actionDesc}>Create a space for your students and courses.</div>
                        </div>
                        <div className={styles.alignRight}>+</div>
                    </div>

                    <div className={styles.actionCard} onClick={() => setIsQuizBuilderOpen(true)}>
                        <div>
                            <div className={`${styles.iconBox} ${styles.iconBlue}`}><IconQuiz /></div>
                            <div className={styles.actionTitle}>Quiz Builder</div>
                            <div className={styles.actionDesc}>Create tests and assessments directly.</div>
                        </div>
                        <div className={styles.alignRight}>→</div>
                    </div>

                    <div className={styles.actionCard} onClick={() => setIsGradebookOpen(true)}>
                        <div>
                            <div className={`${styles.iconBox} ${styles.iconGreen}`}><IconGradebook /></div>
                            <div className={styles.actionTitle}>Gradebook</div>
                            <div className={styles.actionDesc}>Review submissions and grade students.</div>
                        </div>
                        <div className={styles.alignRight}>→</div>
                    </div>
                </>
            ) : (
                <>
                    <div className={styles.actionCard} onClick={() => navigate('/join-class')}>
                        <div>
                            <div className={`${styles.iconBox} ${styles.iconAmber}`}><IconJoin /></div>
                            <div className={styles.actionTitle}>Join Class</div>
                            <div className={styles.actionDesc}>Enter a code to join a new classroom.</div>
                        </div>
                        <div className={styles.alignRight}>+</div>
                    </div>

                    <div className={styles.actionCard} onClick={() => setIsMyTestsOpen(true)}>
                        <div>
                            <div className={`${styles.iconBox} ${styles.iconTeal}`}><IconTests /></div>
                            <div className={styles.actionTitle}>My Tests</div>
                            <div className={styles.actionDesc}>See tests to take and what's coming up.</div>
                        </div>
                        <div className={styles.alignRight}>→</div>
                    </div>

                    <div className={styles.actionCard} onClick={() => setIsGradesModalOpen(true)}>
                        <div>
                            <div className={`${styles.iconBox} ${styles.iconGreen}`}><IconGrades /></div>
                            <div className={styles.actionTitle}>My Grades</div>
                            <div className={styles.actionDesc}>Check your performance across all classes.</div>
                        </div>
                        <div className={styles.alignRight}>→</div>
                    </div>
                </>
            )}
        </div>
    );
}

export default ActionCards;
