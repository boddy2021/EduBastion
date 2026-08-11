import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './GradebookModal.module.css';

function GradebookModal({ isOpen, onClose, userId }) {
    const navigate = useNavigate();

    const [classes, setClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState(null);
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && userId) {
            fetchClasses();
            setSelectedClass(null);
            setQuizzes([]);
        }
    }, [isOpen, userId]);

    const fetchClasses = async () => {
        setLoading(true);
        try {
            const res = await fetch(`http://127.0.0.1:8000/api/classes/professor/${userId}`);
            if (res.ok) setClasses(await res.json());
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleClassSelect = async (cls) => {
        setSelectedClass(cls);
        setLoading(true);
        try {
            const res = await fetch(`http://127.0.0.1:8000/api/classes/${cls.id}/quizzes`);
            if (res.ok) setQuizzes(await res.json());
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleViewSubmissions = (quizId) => {
        navigate(`/quiz/${quizId}/submissions`);
    };

    if (!isOpen) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <button className={styles.closeBtn} onClick={onClose}>✕</button>

                {!selectedClass ? (
                    <>
                        <h2 className={styles.title}>Gradebook: Select Class</h2>
                        {loading ? <p className={styles.loading}>Loading classes...</p> : (
                            <div className={styles.listContainer}>
                                {classes.length > 0 ? classes.map(cls => (
                                    <div key={cls.id} className={styles.listItem} onClick={() => handleClassSelect(cls)}>
                                        <span className={styles.clsName}>{cls.name}</span>
                                        <span className={styles.arrow}>Select →</span>
                                    </div>
                                )) : <p>No classes found.</p>}
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        <div className={styles.headerRow}>
                            <button className={styles.backLink} onClick={() => setSelectedClass(null)}>← Back to classes</button>
                            <h3 className={styles.classTitle}>{selectedClass.name}</h3>
                        </div>
                        <h2 className={styles.title}>Select Assessment</h2>

                        {loading ? <p className={styles.loading}>Loading quizzes...</p> : (
                            <div className={styles.listContainer}>
                                {quizzes.length > 0 ? quizzes.map(quiz => (
                                    <div key={quiz.id} className={styles.quizItem}>
                                        <div>
                                            <div className={styles.quizTitle}>{quiz.title}</div>
                                            <div className={styles.quizMeta}>{quiz.time_allocated_minutes} min</div>
                                        </div>
                                        <button 
                                            className={styles.viewBtn}
                                            onClick={() => handleViewSubmissions(quiz.id)}
                                        >
                                            View Submissions
                                        </button>
                                    </div>
                                )) : (
                                    <p className={styles.inlineStyle}>No quizzes created for this class yet.</p>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default GradebookModal;