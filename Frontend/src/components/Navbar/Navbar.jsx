import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import styles from './Navbar.module.css';

import GradesModal from '../GradesModal/GradesModal';
import MyTestsModal from '../MyTestsModal/MyTestsModal';
import QuizBuilderModal from '../QuizBuilderModal/QuizBuilderModal';
import GradebookModal from '../GradeBookModal/GradeBookModal';
import Icon from '../UI/Icon';
import barChartIcon from '../../assets/icons/bar-chart.svg?raw';
import checkCircleIcon from '../../assets/icons/check-circle.svg?raw';
import checkSquareIcon from '../../assets/icons/check-square.svg?raw';
import filePlusIcon from '../../assets/icons/file-plus.svg?raw';
import folderIcon from '../../assets/icons/folder.svg?raw';
import graduationCapIcon from '../../assets/icons/graduation-cap.svg?raw';
import homeIcon from '../../assets/icons/home.svg?raw';
import logOutIcon from '../../assets/icons/log-out.svg?raw';
import userIcon from '../../assets/icons/user.svg?raw';

function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const menuRef = useRef(null);

    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isClassroomsOpen, setIsClassroomsOpen] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userRole, setUserRole] = useState('');
    const [userId, setUserId] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [classes, setClasses] = useState([]);

    const [gradesOpen, setGradesOpen] = useState(false);
    const [myTestsOpen, setMyTestsOpen] = useState(false);
    const [quizBuilderOpen, setQuizBuilderOpen] = useState(false);
    const [gradebookOpen, setGradebookOpen] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        const role = (localStorage.getItem('userRole') || '').toLowerCase();
        const id = localStorage.getItem('userId');
        setIsAuthenticated(!!token);
        setUserRole(role);
        setUserId(id || '');
        setIsProfileOpen(false);
        setIsClassroomsOpen(false);

        if (token && id) {
            (async () => {
                try {
                    const profRes = await fetch(`http://127.0.0.1:8000/api/users/${id}/profile`);
                    if (profRes.ok) {
                        const prof = await profRes.json();
                        const fullName = `${prof.first_name || ''} ${prof.last_name || ''}`.trim();
                        if (fullName) setDisplayName(fullName);
                        else {
                            const userRes = await fetch(`http://127.0.0.1:8000/api/users/${id}`);
                            if (userRes.ok) setDisplayName((await userRes.json()).username || '');
                        }
                    }
                } catch (err) { console.error('Error loading account name', err); }

                try {
                    const url = role === 'professor'
                        ? `http://127.0.0.1:8000/api/classes/professor/${id}`
                        : `http://127.0.0.1:8000/api/classes/student/${id}`;
                    const clsRes = await fetch(url);
                    if (clsRes.ok) setClasses(await clsRes.json());
                } catch (err) { console.error('Error loading classes', err); }
            })();
        }
    }, [location]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setIsProfileOpen(false);
                setIsClassroomsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        localStorage.clear();
        setIsAuthenticated(false);
        setIsProfileOpen(false);
        navigate('/');
    };

    const toggleProfile = () => {
        setIsClassroomsOpen(false);
        setIsProfileOpen(v => !v);
    };

    const toggleClassrooms = () => {
        setIsProfileOpen(false);
        setIsClassroomsOpen(v => !v);
    };

    const openModal = (setter) => {
        setIsProfileOpen(false);
        setter(true);
    };

    return (
        <nav className={styles.navigationBar}>
            <Link to={isAuthenticated ? "/dashboard" : "/"} className={styles.logo}>
                EduBastion
            </Link>

            <div className={styles.navLinks}>
                {isAuthenticated ? (
                    <div className={styles.userMenuContainer} ref={menuRef}>
                        {userRole === 'student' && (
                            <Link to="/join-class" className={styles.actionLink}>
                                Join Class
                            </Link>
                        )}
                        {userRole === 'professor' && (
                            <Link to="/create-class" className={styles.actionLink}>
                                + New Class
                            </Link>
                        )}

                        <div className={styles.iconWrapper}>
                            <button className={styles.iconButton} onClick={toggleClassrooms} title="Classrooms">
                                <div className={styles.classroomsCircle}>
                                    <Icon svg={graduationCapIcon} size={19} />
                                </div>
                            </button>

                            {isClassroomsOpen && (
                                <div className={styles.dropdown}>
                                    <div className={styles.dropdownHeader}>
                                        <div className={styles.roleLabel}>Classrooms</div>
                                    </div>
                                    {classes.length > 0 ? classes.map(cls => (
                                        <button
                                            key={cls.id}
                                            className={styles.dropdownItem}
                                            onClick={() => navigate(`/class/${cls.id}`)}
                                        >
                                            <Icon svg={folderIcon} size={18} />
                                            {cls.name}
                                        </button>
                                    )) : (
                                        <div className={styles.emptyItem}>No classrooms yet.</div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className={styles.iconWrapper}>
                            <button className={styles.iconButton} onClick={toggleProfile} title="Account">
                                <div className={styles.avatarCircle}>
                                    <Icon svg={userIcon} size={18} />
                                </div>
                            </button>

                            {isProfileOpen && (
                                <div className={styles.dropdown}>
                                    <div className={styles.dropdownHeader}>
                                        <div className={styles.roleLabel}>{userRole || 'User'}</div>
                                        {displayName && <div className={styles.userName}>{displayName}</div>}
                                    </div>

                                    <Link to="/dashboard" className={styles.dropdownItem}>
                                        <Icon svg={homeIcon} size={18} />
                                        Dashboard
                                    </Link>
                                    <Link to="/profile" className={styles.dropdownItem}>
                                        <Icon svg={userIcon} size={18} />
                                        Profile
                                    </Link>

                                    {userRole === 'student' && (
                                        <>
                                            <button className={styles.dropdownItem} onClick={() => openModal(setMyTestsOpen)}>
                                                <Icon svg={checkSquareIcon} size={18} />
                                                My Tests
                                            </button>
                                            <button className={styles.dropdownItem} onClick={() => openModal(setGradesOpen)}>
                                                <Icon svg={checkCircleIcon} size={18} />
                                                My Grades
                                            </button>
                                        </>
                                    )}

                                    {userRole === 'professor' && (
                                        <>
                                            <button className={styles.dropdownItem} onClick={() => openModal(setQuizBuilderOpen)}>
                                                <Icon svg={filePlusIcon} size={18} />
                                                Create Test
                                            </button>
                                            <button className={styles.dropdownItem} onClick={() => openModal(setGradebookOpen)}>
                                                <Icon svg={barChartIcon} size={18} />
                                                Grade Students
                                            </button>
                                        </>
                                    )}

                                    <div className={styles.separator}></div>

                                    <button onClick={handleLogout} className={`${styles.dropdownItem} ${styles.logoutItem}`}>
                                        <Icon svg={logOutIcon} size={18} />
                                        Log Out
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className={styles.flexRow}>
                        <Link to="/login" className={styles.navItem}>Sign In</Link>
                        <Link to="/register" className={styles.registerBtn}>Get Started</Link>
                    </div>
                )}
            </div>

            {userRole === 'student' && (
                <>
                    <GradesModal isOpen={gradesOpen} onClose={() => setGradesOpen(false)} userId={userId} />
                    <MyTestsModal isOpen={myTestsOpen} onClose={() => setMyTestsOpen(false)} userId={userId} />
                </>
            )}
            {userRole === 'professor' && (
                <>
                    <QuizBuilderModal isOpen={quizBuilderOpen} onClose={() => setQuizBuilderOpen(false)} userId={userId} />
                    <GradebookModal isOpen={gradebookOpen} onClose={() => setGradebookOpen(false)} userId={userId} />
                </>
            )}
        </nav>
    );
}

export default Navbar;