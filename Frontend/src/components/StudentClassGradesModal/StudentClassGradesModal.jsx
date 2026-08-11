import React, { useState, useEffect } from 'react';
import styles from './StudentClassGradesModal.module.css';

function StudentClassGradesModal({ isOpen, onClose, student, classId, className }) {
    const [grades, setGrades] = useState([]);
    const [average, setAverage] = useState(0);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && student && classId) {
            fetchGrades();
        } else {
            setGrades([]);
            setAverage(0);
        }
    }, [isOpen, student, classId]);

    const fetchGrades = async () => {
        setLoading(true);
        try {
            const qRes = await fetch(`http://127.0.0.1:8000/api/classes/${classId}/quizzes`);
            if (!qRes.ok) throw new Error("Failed to fetch quizzes");
            const quizzes = await qRes.json();

            const gradesPromises = quizzes.map(async (q) => {
                const sRes = await fetch(`http://127.0.0.1:8000/api/quizzes/${q.id}/status/${student.id}`);
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

            const submitted = results.filter(r => r.submitted && r.score !== null);
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

    if (!isOpen || !student) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <button className={styles.closeBtn} onClick={onClose}>✕</button>

                <div className={styles.header}>
                    <div className={styles.flexRow}>
                        <div className={styles.avatar}>{student.username[0].toUpperCase()}</div>
                        <div>
                            <h2 className={styles.title}>{student.username}</h2>
                            <p className={styles.subtitle}>{className}</p>
                        </div>
                    </div>

                    <div className={styles.scoreBadge}>
                        Avg: {average}
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
                                {grades.length > 0 ? grades.map(g => (
                                    <tr key={g.id}>
                                        <td className={styles.quizTitle}>{g.title}</td>
                                        <td className={styles.alignRight}>
                                            {g.submitted ? (
                                                <span className={styles.gradeSuccess}>{g.score} / 10</span>
                                            ) : (
                                                <span className={styles.gradePending}>Not Taken</span>
                                            )}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan="2" className={styles.inlineStyle}>No quizzes in this class.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

export default StudentClassGradesModal;