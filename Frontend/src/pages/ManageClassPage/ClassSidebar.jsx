import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/UI/Button';
import styles from './ManageClassPage.module.css';

function ClassSidebar({ classData, professorName, courses, tests, members, userRole, classId }) {
    const navigate = useNavigate();

    return (
        <div className={styles.sidebar}>
            <div className={styles.sidebarCard}>
                <h3 className={styles.sidebarTitle}>Class Info</h3>
                <div className={styles.infoItem}><span className={styles.infoLabel}>Join Code</span><span className={styles.infoValue}>{classData.join_code}</span></div>
                {professorName && (
                    <div className={styles.infoItem}><span className={styles.infoLabel}>Professor</span><span className={styles.infoText}>{professorName}</span></div>
                )}
                <div className={styles.infoItem}><span className={styles.infoLabel}>Courses</span><span className={styles.infoText}>{courses.length}</span></div>
                <div className={styles.infoItem}><span className={styles.infoLabel}>Tests</span><span className={styles.infoText}>{tests.length}</span></div>
                <div className={styles.infoItem}><span className={styles.infoLabel}>Total Members</span><span className={styles.infoText}>{members.length}</span></div>
            </div>
            {userRole === 'professor' && (
                <div className={styles.sidebarCard}>
                    <h3 className={styles.sidebarTitle}>Manage</h3>
                    <div className={styles.sidebarActionGroup}>
                        <Button onClick={() => navigate(`/class/${classId}/create-course`)}>+ Add Course</Button>
                        <Button onClick={() => navigate(`/class/${classId}/create-quiz`)}>+ Add Test</Button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ClassSidebar;
