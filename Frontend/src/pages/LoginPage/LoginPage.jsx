import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import InputField from '../../components/UI/InputField';
import Button from '../../components/UI/Button';
import styles from './LoginPage.module.css';

function LoginPage() {
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(''); 

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const loginResponse = await fetch('http://127.0.0.1:8000/api/users/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const loginData = await loginResponse.json();

            if (!loginResponse.ok) {
                throw new Error(loginData.detail || 'Login failed');
            }

            localStorage.setItem('accessToken', loginData.access_token);
            localStorage.setItem('userRole', loginData.role);
            localStorage.setItem('userId', loginData.user_id);

            const userId = loginData.user_id;

            const profileResponse = await fetch(`http://127.0.0.1:8000/api/users/${userId}/has_profile`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!profileResponse.ok) {
                 console.warn("Could not verify profile, redirecting to setup.");
                 localStorage.setItem('hasProfile', 'false');
                 navigate('/setup-profile');
                 return;
            }

            const profileData = await profileResponse.json();

            localStorage.setItem('hasProfile', profileData.has_profile);

            if (profileData.has_profile === false) {
                console.log("User has no profile. Redirecting to setup...");
                navigate('/setup-profile');
            } else {
                console.log("User has profile. Redirecting home...");
                navigate('/dashboard'); 
            }

        } catch (err) {
            console.error("Process error:", err);
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
                    <h1 className={styles.title}>Sign In</h1>
                    <p className={styles.subtitle}>Academic Platform Access</p>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    {error && <div className={styles.inlineStyle2}>{error}</div>}

                    <InputField 
                        label="Email Address"
                        type="email"
                        placeholder="student@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />

                    <InputField 
                        label="Password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    <div className={styles.spacedTop}>
                        <Button type="submit">Sign In</Button>
                    </div>
                </form>

                <div className={styles.footer}>
                    Don't have an account? 
                    <Link to="/register" className={styles.link}>Sign up</Link>
                </div>
            </div>
        </div>
    );
}

export default LoginPage;