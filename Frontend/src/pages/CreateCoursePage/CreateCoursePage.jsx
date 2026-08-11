import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import InputField from '../../components/UI/InputField';
import Button from '../../components/UI/Button';
import styles from './CreateCoursePage.module.css';

function CreateCoursePage() {
    const navigate = useNavigate();
    const { classId } = useParams(); 
    const userId = localStorage.getItem('userId');

    const [formData, setFormData] = useState({
        title: '',
        description: ''
    });
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.title.trim()) {
            setError("Title is required.");
            return;
        }

        if (!classId) {
            setError("Critical error: Class ID (classId) is missing. Make sure you accessed this page from within a class.");
            return;
        }

        try {
            console.log("Sending data:", {
                title: formData.title,
                description: formData.description,
                professor_id: userId,
                class_id: classId
            });

            const response = await fetch('http://127.0.0.1:8000/api/courses/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: formData.title,
                    description: formData.description,
                    professor_id: parseInt(userId),
                    class_id: parseInt(classId)
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                let errorMessage = 'Failed to create course';

                if (data.detail) {
                    if (typeof data.detail === 'string') {
                        errorMessage = data.detail;
                    } else if (Array.isArray(data.detail)) {
                        errorMessage = data.detail.map(err => `${err.loc.join('.')}: ${err.msg}`).join(', ');
                    } else {
                        errorMessage = JSON.stringify(data.detail);
                    }
                }
                throw new Error(errorMessage);
            }

            alert("Course created successfully!");
            navigate(`/class/${classId}`);

        } catch (err) {
            console.error("Create course error:", err);
            setError(err.message);
        }
    };

    return (
        <div className={styles.pageContainer}>
            <div className={styles.card}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Add Course to Class</h1>
                    <p className={styles.subtitle}>Add a new subject to this classroom.</p>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    {error && <div className={styles.errorMessage}>{error}</div>}

                    <InputField 
                        label="Course Title" 
                        placeholder="e.g. Introduction to Algorithms"
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                    />

                    <div className={styles.textAreaContainer}>
                        <label className={styles.label}>Description</label>
                        <textarea 
                            className={styles.textArea}
                            placeholder="Brief description..."
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                        />
                    </div>

                    <div className={styles.spacedTop}>
                        <Button type="submit">Create Course</Button>
                    </div>

                    <button 
                        type="button" 
                        className={styles.cancelButton}
                        onClick={() => navigate(`/class/${classId}`)}
                    >
                        Cancel
                    </button>
                </form>
            </div>
        </div>
    );
}

export default CreateCoursePage;