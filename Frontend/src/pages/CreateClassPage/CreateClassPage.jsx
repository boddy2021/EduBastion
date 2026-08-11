import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import InputField from '../../components/UI/InputField';
import Button from '../../components/UI/Button';
import styles from './CreateClassPage.module.css';

function CreateClassPage() {
    const navigate = useNavigate();
    const userId = localStorage.getItem('userId');

    const [name, setName] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!name.trim()) {
            setError("Class Name is required.");
            return;
        }

        try {
            const response = await fetch('http://127.0.0.1:8000/api/classes/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name, professor_id: parseInt(userId) }),
            });

            if (!response.ok) throw new Error('Failed to create class');

            alert("Class created successfully!");
            navigate('/dashboard');
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className={styles.pageContainer}>
            <div className={styles.card}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Create New Classroom</h1>
                    <p className={styles.subtitle}>Create a space for your students and courses.</p>
                </div>
                <form onSubmit={handleSubmit} className={styles.form}>
                    {error && <div className={styles.errorMessage}>{error}</div>}
                    <InputField 
                        label="Classroom Name" 
                        placeholder="e.g. CS 101 - Fall 2024"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                    <div className={styles.spacedTop}>
                        <Button type="submit">Create Classroom</Button>
                    </div>
                    <button type="button" className={styles.cancelButton} onClick={() => navigate('/dashboard')}>
                        Cancel
                    </button>
                </form>
            </div>
        </div>
    );
}

export default CreateClassPage;