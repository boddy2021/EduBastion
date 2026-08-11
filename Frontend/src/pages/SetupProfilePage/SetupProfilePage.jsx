import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import InputField from '../../components/UI/InputField';
import Button from '../../components/UI/Button';
import styles from './SetupProfilePage.module.css';

function SetupProfilePage() {
    const navigate = useNavigate();
    const userId = localStorage.getItem('userId');

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        phone: '',
        sex: 'male',
        address: '',
        university: ''
    });
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!userId) {
            setError("Error: User ID is missing. Please log in again.");
            return;
        }

        try {
            console.log("Se trimite profilul pentru userID:", userId);

            const response = await fetch(`http://127.0.0.1:8000/api/users/${userId}/profile`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                if (data.detail && data.detail.includes("already exists")) {
                    console.warn("Profile already exists. Redirecting...");
                } else {
                    throw new Error(data.detail || 'Failed to save profile');
                }
            }

            console.log("Profil salvat/confirmat. Actualizare localStorage...");

            localStorage.setItem('hasProfile', 'true');

            if (localStorage.getItem('hasProfile') !== 'true') {
                console.error("Critical error: localStorage did not save the value!");
                localStorage.hasProfile = 'true';
            }

            alert("Profile saved successfully!");

            console.log("Navigating to /dashboard...");
            navigate('/dashboard', { replace: true });

        } catch (err) {
            console.error("Profile setup error:", err);
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
                    <h1 className={styles.title}>Complete Your Profile</h1>
                    <p className={styles.subtitle}>Please provide your details to continue.</p>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    {error && <div className={styles.errorMessage}>{error}</div>}

                    <div className={styles.row}>
                        <InputField 
                            label="First Name" 
                            value={formData.first_name}
                            onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                            placeholder="Ion"
                        />
                        <InputField 
                            label="Last Name" 
                            value={formData.last_name}
                            onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                            placeholder="Popescu"
                        />
                    </div>

                    <InputField 
                        label="University" 
                        value={formData.university}
                        onChange={(e) => setFormData({...formData, university: e.target.value})}
                        placeholder="Polytechnic University"
                    />

                    <InputField 
                        label="Phone" 
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        placeholder="07xx xxx xxx"
                    />

                    <InputField 
                        label="Address" 
                        value={formData.address}
                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                        placeholder="City, Street"
                    />

                    <div className={styles.roleContainer}>
                        <label className={styles.label}>Gender</label>
                        <select 
                            name="sex" 
                            className={styles.selectInput}
                            value={formData.sex}
                            onChange={handleChange}
                        >
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    <div className={styles.spacedTop}>
                        <Button type="submit">Save & Continue</Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default SetupProfilePage;