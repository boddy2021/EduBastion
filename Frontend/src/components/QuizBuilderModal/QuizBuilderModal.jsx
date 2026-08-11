import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './QuizBuilderModal.module.css';

function QuizBuilderModal({ isOpen, onClose, userId }) {
    const navigate = useNavigate();
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && userId) {
            fetchClasses();
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

    const handleClassSelect = (classId) => {
        navigate(`/class/${classId}/create-quiz`);
    };

    if (!isOpen) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <button className={styles.closeBtn} onClick={onClose}>✕</button>
                <h2 className={styles.title}>Select Class for New Quiz</h2>
                <p className={styles.subtitle}>Which class is this test for?</p>

                {loading ? <p>Loading classes...</p> : (
                    <div className={styles.listContainer}>
                        {classes.length > 0 ? classes.map(cls => (
                            <div 
                                key={cls.id} 
                                className={styles.listItem}
                                onClick={() => handleClassSelect(cls.id)}
                            >
                                <span className={styles.clsName}>{cls.name}</span>
                                <span className={styles.arrow}>Create →</span>
                            </div>
                        )) : (
                            <p>No classes found. Create a class first.</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default QuizBuilderModal;