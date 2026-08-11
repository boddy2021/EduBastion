import React, { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar/Navbar';
import styles from './ProfilePage.module.css';
import Icon from '../../components/UI/Icon';
import editBoxIcon from '../../assets/icons/edit-box.svg?raw';

function ProfilePage() {
    const userId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole');

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    const [editingField, setEditingField] = useState(null); 
    const [tempValue, setTempValue] = useState("");
    const [error, setError] = useState("");

    const fetchProfile = async () => {
        try {
            const response = await fetch(`http://127.0.0.1:8000/api/users/${userId}/profile`);
            if (response.ok) {
                const data = await response.json();
                setProfile(data);
            }
        } catch (error) {
            console.error("Error loading profile:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (userId) fetchProfile();
    }, [userId]);

    const startEditing = (field, currentValue) => {
        setEditingField(field);
        setTempValue(currentValue || "");
        setError("");
    };

    const cancelEditing = () => {
        setEditingField(null);
        setTempValue("");
        setError("");
    };

    const saveField = async (field) => {
        if (field === 'phone') {
            const phoneRegex = /^[0-9+\- ]+$/;
            if (!phoneRegex.test(tempValue)) {
                setError("Please enter a valid phone number (digits only).");
                return;
            }
        }

        if ((field === 'first_name' || field === 'last_name') && !tempValue.trim()) {
            setError("This field cannot be empty.");
            return;
        }

        const updatedProfile = { ...profile, [field]: tempValue };

        try {
            const response = await fetch(`http://127.0.0.1:8000/api/users/${userId}/profile`, {
                method: 'PUT', 
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedProfile)
            });

            if (response.ok) {
                setProfile(updatedProfile); 
                setEditingField(null);
            } else {
                alert("Failed to update profile.");
            }
        } catch (err) {
            console.error(err);
            alert("Error saving data.");
        }
    };

    const renderRow = (label, field, type = "text") => {
        const isEditing = editingField === field;

        return (
            <div className={styles.infoRow}>
                <div className={styles.label}>{label}</div>

                <div className={styles.valueContainer}>
                    {isEditing ? (
                        <>
                            <input 
                                className={styles.input}
                                type={type === 'number' ? 'text' : type} 
                                value={tempValue}
                                onChange={(e) => {
                                    if (type === 'number') {
                                        const val = e.target.value;
                                        if (/^\d*$/.test(val)) setTempValue(val);
                                    } else {
                                        setTempValue(e.target.value);
                                    }
                                }}
                            />
                            {error && <div className={styles.errorText}>{error}</div>}
                        </>
                    ) : (
                        <span className={styles.value}>{profile?.[field] || "Not set"}</span>
                    )}
                </div>

                <div className={styles.actions}>
                    {isEditing ? (
                        <div className={styles.actionButtons}>
                            <button onClick={() => saveField(field)} className={styles.saveBtn} title="Save">
                                ✓
                            </button>
                            <button onClick={cancelEditing} className={styles.cancelBtn} title="Cancel">
                                ✕
                            </button>
                        </div>
                    ) : (
                        <button onClick={() => startEditing(field, profile?.[field])} className={styles.editBtn} title="Edit">
                            <Icon svg={editBoxIcon} size={18} />
                        </button>
                    )}
                </div>
            </div>
        );
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className={styles.container}>
            <Navbar />
            <main className={styles.mainContent}>
                <div className={styles.card}>
                    <div className={styles.header}>
                        <div className={styles.avatarLarge}>
                            {profile?.first_name?.[0]}{profile?.last_name?.[0]}
                        </div>
                        <div className={styles.titleSection}>
                            <h1>{profile?.first_name} {profile?.last_name}</h1>
                            <span className={styles.roleBadge}>{userRole}</span>
                        </div>
                    </div>

                    <div className={styles.infoGrid}>
                        {renderRow("First Name", "first_name")}
                        {renderRow("Last Name", "last_name")}
                        {renderRow("University", "university")}
                        {renderRow("Address", "address")}

                        {renderRow("Phone", "phone")}
                    </div>
                </div>
            </main>
        </div>
    );
}

export default ProfilePage;