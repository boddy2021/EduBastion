import React, { useState } from 'react';
import InputField from '../../components/UI/InputField';
import Button from '../../components/UI/Button';
import styles from './RegisterPage.module.css';
import { Link, useNavigate } from 'react-router-dom';

function RegisterPage() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        role: 'student' 
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const validatePassword = (pw) => {
        if (pw.length < 8) return "Password must be at least 8 characters long.";
        if (!/[A-Z]/.test(pw)) return "Password must contain at least one uppercase letter.";
        if (!/[a-z]/.test(pw)) return "Password must contain at least one lowercase letter.";
        if (!/[0-9]/.test(pw)) return "Password must contain at least one digit.";
        if (!/[^A-Za-z0-9]/.test(pw)) return "Password must contain at least one special character.";
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        const passwordError = validatePassword(formData.password);
        if (passwordError) {
            setError(passwordError);
            return;
        }

        try {
            const registerResponse = await fetch('http://127.0.0.1:8000/api/users/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const registerData = await registerResponse.json();

            if (!registerResponse.ok) {
                throw new Error(registerData.detail || 'Registration failed');
            }

            const uId = registerData.id || registerData.user_id;

            if (uId) {
                localStorage.setItem('userId', uId);

                const role = registerData.role || formData.role;
                localStorage.setItem('userRole', role);

                localStorage.setItem('hasProfile', 'false');

                setSuccess('Cont creat! Mergem la configurarea profilului...');

                setTimeout(() => {
                    navigate('/setup-profile');
                }, 1000);
            } else {
                throw new Error("Registration succeeded, but no user ID was received.");
            }

        } catch (err) {
            console.error("Register error:", err);
            setError(err.message);
        }
    };

    return (
        <div className={styles.pageContainer}>
            <div className={styles.card}>
                <div className={styles.header}>
                    <div className={styles.logoContainer}>
                        <img 
                            src="/logo1.png" 
                            alt="Platform Logo" className={styles.inlineStyle}  
                        />
                    </div>
                    <h1 className={styles.title}>Sign Up</h1>
                    <p className={styles.subtitle}>Create your academic account</p>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    {error && <div className={styles.errorMessage}>{error}</div>}
                    {success && <div className={styles.successMessage}>{success}</div>}

                    <InputField 
                        label="Username"
                        placeholder="popescu.ion"
                        value={formData.username}
                        onChange={(e) => setFormData({...formData, username: e.target.value})}
                    />

                    <InputField 
                        label="Email Address"
                        type="email"
                        placeholder="student@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />

                    <InputField 
                        label="Password"
                        type="password"
                        placeholder="Create a strong password"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                    />

                    <div className={styles.roleContainer}>
                        <label className={styles.label}>Select Role</label>
                        <select 
                            name="role" 
                            className={styles.selectInput}
                            value={formData.role}
                            onChange={handleChange}
                        >
                            <option value="student">Student</option>
                            <option value="professor">Professor</option>
                        </select>
                    </div>

                    <div className={styles.spacedTop}>
                        <Button type="submit">Create Account</Button>
                    </div>
                </form>

                <div className={styles.footer}>
                    Already have an account? 
                    <Link to="/login" className={styles.link}>Sign In</Link>
                </div>
            </div>
        </div>
    );
}

export default RegisterPage;