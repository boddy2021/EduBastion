import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import InputField from '../../components/UI/InputField';
import Button from '../../components/UI/Button';
import styles from './JoinClassPage.module.css';

function JoinClassPage() {
    const navigate = useNavigate();
    const userId = localStorage.getItem('userId');

    const [code, setCode] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const response = await fetch('http://127.0.0.1:8000/api/classes/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ student_id: parseInt(userId), join_code: code }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.detail || 'Failed to join');

            alert(data.message);
            navigate('/dashboard');
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className={styles.pageContainer}>
            <div className={styles.card}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Join a Classroom</h1>
                    <p className={styles.subtitle}>Enter the code provided by your professor.</p>
                </div>
                <form onSubmit={handleSubmit} className={styles.form}>
                    {error && <div className={styles.errorMessage}>{error}</div>}
                    <InputField 
                        label="Join Code" 
                        placeholder="e.g. AB123C"
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                    />
                    <div className={styles.spacedTop}>
                        <Button type="submit">Join Class</Button>
                    </div>
                    <button type="button" className={styles.cancelButton} onClick={() => navigate('/dashboard')}>
                        Cancel
                    </button>
                </form>
            </div>
        </div>
    );
}

export default JoinClassPage;