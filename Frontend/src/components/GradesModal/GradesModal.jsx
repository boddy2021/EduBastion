import React, { useState, useEffect } from 'react';
import styles from './GradesModal.module.css';

function GradesModal({ isOpen, onClose, userId }) {
    const [classes, setClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState(null);
    const [grades, setGrades] = useState([]);
    const [average, setAverage] = useState(0);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && userId) {
            fetchClasses();
        }
        if (!isOpen) {
            setSelectedClass(null);
            setGrades([]);
        }
    }, [isOpen, userId]);

    const fetchClasses = async () => {
        try {
            const res = await fetch(`http://127.0.0.1:8000/api/classes/student/${userId}`);
            if (res.ok) setClasses(await res.json());
        } catch (err) {
            console.error(err);
        }
    };

    const handleClassSelect = async (cls) => {
        setSelectedClass(cls);
        setLoading(true);
        try {
            const qRes = await fetch(`http://127.0.0.1:8000/api/classes/${cls.id}/quizzes`);
            const quizzes = await qRes.json();

            const gradesPromises = quizzes.map(async (q) => {
                const sRes = await fetch(`http://127.0.0.1:8000/api/quizzes/${q.id}/status/${userId}`);
                const status = await sRes.json();
                return {
                    id: q.id,
                    title: q.title,
                    score: status.submitted ? status.score : null,
                    submitted: status.submitted
                };
            });

            const results = await Promise.all(gradesPromises);
            setGrades(results);

            const submitted = results.filter(r => r.submitted);
            if (submitted.length > 0) {
                const total = submitted.reduce((acc, curr) => acc + parseFloat(curr.score), 0);
                setAverage((total / submitted.length).toFixed(2));
            } else {
                setAverage("N/A");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <button className={styles.closeBtn} onClick={onClose}>✕</button>

                {!selectedClass ? (
                    <>
                        <h2 className={styles.mainTitle}>Select a Class</h2>
                        <div className={styles.listContainer}>
                            {classes.length > 0 ? classes.map(cls => (
                                <div 
                                    key={cls.id} 
                                    className={styles.classItem}
                                    onClick={() => handleClassSelect(cls)}
                                >
                                    <span className={styles.className}>{cls.name}</span>
                                    <span className={styles.arrow}>➔</span>
                                </div>
                            )) : (
                                <p className={styles.noteText}>You are not enrolled in any class.</p>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        <div className={styles.topNav}>
                            <button className={styles.backLink} onClick={() => setSelectedClass(null)}>
                                ← Back to classes
                            </button>
                        </div>

                        <div className={styles.header}>
                            <div>
                                <h2 className={styles.title}>{selectedClass.name}</h2>
                                <p className={styles.subtitle}>Your Grades</p>
                            </div>

                            <div className={styles.scoreBadge}>
                                Average: {average}
                            </div>
                        </div>

                        {loading ? <p className={styles.loading}>Loading grades...</p> : (
                            <div className={styles.tableContainer}>
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th>Quiz Title</th>
                                            <th className={styles.alignRight}>Grade</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {grades.map(g => (
                                            <tr key={g.id}>
                                                <td className={styles.quizTitle}>{g.title}</td>
                                                <td className={styles.alignRight}>
                                                    {g.submitted ? (
                                                        <span className={styles.gradeSuccess}>
                                                            {g.score} / 10
                                                        </span>
                                                    ) : (
                                                        <span className={styles.gradePending}>
                                                            Not Taken
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                        {grades.length === 0 && <tr><td colSpan="2" className={styles.inlineStyle}>No quizzes yet.</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default GradesModal;