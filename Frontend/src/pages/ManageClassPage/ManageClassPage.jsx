import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import Chat from '../../components/Chat/Chat.jsx';
import StudentClassGradesModal from '../../components/StudentClassGradesModal/StudentClassGradesModal';
import styles from './ManageClassPage.module.css';
import Icon from '../../components/UI/Icon';
import trashIcon from '../../assets/icons/trash.svg?raw';
import TestListItem from './TestListItem';
import MembersList from './MembersList';
import ClassSidebar from './ClassSidebar';
import { filterTests, checkIsExpired } from './quizFilters';
import {
    fetchClass,
    fetchProfessorProfile,
    fetchCoursesByClass,
    fetchClassMembers,
    fetchClassQuizzes,
    fetchQuizStatus,
    removeStudentFromClass,
    deleteQuiz,
    deleteCourse
} from './manageClassApi';

function ManageClassPage() {
    const { classId } = useParams();
    const navigate = useNavigate();
    const userRole = (localStorage.getItem('userRole') || '').toLowerCase();
    const userId = localStorage.getItem('userId');

    const [classData, setClassData] = useState(null);
    const [courses, setCourses] = useState([]);
    const [members, setMembers] = useState([]);
    const [tests, setTests] = useState([]);
    const [submissions, setSubmissions] = useState({});

    const [activeTab, setActiveTab] = useState('courses');
    const [quizFilter, setQuizFilter] = useState('active');

    const [selectedStudent, setSelectedStudent] = useState(null);
    const [isGradesModalOpen, setIsGradesModalOpen] = useState(false);
    const [professorName, setProfessorName] = useState('');

    const fetchAll = async () => {
        try {
            const clsData = await fetchClass(classId);
            if (clsData) setClassData(clsData);

            if (clsData?.professor_id) {
                try {
                    const prof = await fetchProfessorProfile(clsData.professor_id);
                    if (prof) {
                        const fullName = `${prof.first_name || ''} ${prof.last_name || ''}`.trim();
                        setProfessorName(fullName);
                    }
                } catch (err) {
                    console.error('Error fetching professor profile', err);
                }
            }

            const crsData = await fetchCoursesByClass(classId);
            if (crsData) setCourses(crsData);

            const memData = await fetchClassMembers(classId);
            if (memData) setMembers(memData);

            let quizzesData = await fetchClassQuizzes(classId);
            if (quizzesData) {
                quizzesData.sort((a, b) => b.id - a.id);
                setTests(quizzesData);
            } else {
                quizzesData = [];
            }

            if (userRole === 'student' && quizzesData.length > 0) {
                const subsMap = {};
                await Promise.all(quizzesData.map(async (test) => {
                    try {
                        const data = await fetchQuizStatus(test.id, userId);
                        if (data && data.submitted) {
                            subsMap[test.id] = data;
                        }
                    } catch (err) {
                        console.error(`Error fetching status for quiz ${test.id}`, err);
                    }
                }));
                setSubmissions(subsMap);
            }
        } catch (err) { console.error(err); }
    };

    useEffect(() => { fetchAll(); }, [classId]);

    const handleRemoveStudent = async (studentId) => {
        if (!window.confirm("Remove student?")) return;
        await removeStudentFromClass(classId, studentId);
        fetchAll();
    };

    const handleDeleteTest = async (testId) => {
        if (!window.confirm("Delete test?")) return;
        await deleteQuiz(testId);
        fetchAll();
    };

    const handleDeleteCourse = async (e, id) => {
        e.preventDefault();
        if (!window.confirm("Delete course?")) return;
        await deleteCourse(id);
        fetchAll();
    };

    const sortedMembers = [...members].sort((a, b) => {
        if (a.role === 'professor' && b.role !== 'professor') return -1;
        if (b.role === 'professor' && a.role !== 'professor') return 1;
        return a.username.localeCompare(b.username);
    });

    const handleMemberClick = (member) => {
        if (userRole === 'professor' && member.role === 'student') {
            setSelectedStudent(member);
            setIsGradesModalOpen(true);
        }
    };

    const getFilteredTests = () => filterTests(tests, submissions, userRole, quizFilter);

    if (!classData) return <div>Loading...</div>;

    return (
        <div className={styles.container}>
            <Navbar />
            <div className={styles.mainLayout}>
                <div className={styles.header}>
                    <div>
                        <h1 className={styles.classTitle}>{classData.name}</h1>
                    </div>
                </div>

                <div className={styles.contentArea}>
                    <div className={styles.tabs}>
                        <button className={`${styles.tab} ${activeTab === 'courses' ? styles.active : ''}`} onClick={() => setActiveTab('courses')}>Courses</button>
                        <button className={`${styles.tab} ${activeTab === 'tests' ? styles.active : ''}`} onClick={() => setActiveTab('tests')}>Tests</button>
                        <button className={`${styles.tab} ${activeTab === 'chat' ? styles.active : ''}`} onClick={() => setActiveTab('chat')}>Discussion</button>
                        <button className={`${styles.tab} ${activeTab === 'people' ? styles.active : ''}`} onClick={() => setActiveTab('people')}>Members</button>
                    </div>

                    <div className={styles.listContainer}>
                        {activeTab === 'courses' && (
                            courses.length > 0 ? courses.map(course => (
                                <Link key={course.id} to={`/course/${course.id}`} className={styles.listItem}>
                                    <div className={styles.itemContent}>
                                        <div className={styles.itemTitle}>{course.title}</div>
                                        <div className={styles.itemMeta}>{course.description}</div>
                                    </div>
                                    <div className={styles.itemActions}>
                                        <span className={styles.viewLinkText}>View &rarr;</span>
                                        {userRole === 'professor' && (
                                            <button
                                                className={styles.deleteCourseIcon}
                                                onClick={(e) => handleDeleteCourse(e, course.id)}
                                                title="Delete Course"
                                                aria-label="Delete Course"
                                            >
                                                <Icon svg={trashIcon} size={18} />
                                            </button>
                                        )}
                                    </div>
                                </Link>
                            )) : <p className={styles.emptyMessage}>No courses.</p>
                        )}

                        {activeTab === 'tests' && (
                            <>
                                <div className={styles.filterContainer}>
                                    {userRole === 'student' ? (
                                        <>
                                            <button className={`${styles.filterBtn} ${quizFilter === 'active' ? styles.filterBtnActive : styles.filterBtnInactive}`} onClick={() => setQuizFilter('active')}>
                                                To Do (Active)
                                            </button>
                                            <button className={`${styles.filterBtn} ${quizFilter === 'missed' ? styles.filterBtnActive : styles.filterBtnInactive}`} onClick={() => setQuizFilter('missed')}>
                                                Missed
                                            </button>
                                            <button className={`${styles.filterBtn} ${quizFilter === 'completed' ? styles.filterBtnActive : styles.filterBtnInactive}`} onClick={() => setQuizFilter('completed')}>
                                                History (Submitted)
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button className={`${styles.filterBtn} ${quizFilter === 'active' ? styles.filterBtnActive : styles.filterBtnInactive}`} onClick={() => setQuizFilter('active')}>
                                                Scheduled & Active
                                            </button>
                                            <button className={`${styles.filterBtn} ${quizFilter === 'past' ? styles.filterBtnActive : styles.filterBtnInactive}`} onClick={() => setQuizFilter('past')}>
                                                Past / Expired
                                            </button>
                                        </>
                                    )}
                                </div>

                                {getFilteredTests().length > 0 ? getFilteredTests().map(test => (
                                    <TestListItem
                                        key={test.id}
                                        test={test}
                                        userRole={userRole}
                                        userId={userId}
                                        onDelete={() => handleDeleteTest(test.id)}
                                        onEdit={() => navigate(`/class/${classId}/edit-quiz/${test.id}`)}
                                        submission={submissions[test.id]}
                                        isExpired={checkIsExpired(test)}
                                    />
                                )) : <p className={styles.emptyMessage}>No tests in this category.</p>}
                            </>
                        )}

                        {activeTab === 'chat' && <Chat contextId={classId} type="class" />}

                        {activeTab === 'people' && (
                            <MembersList
                                members={sortedMembers}
                                userRole={userRole}
                                onMemberClick={handleMemberClick}
                                onRemoveStudent={handleRemoveStudent}
                            />
                        )}
                    </div>
                </div>

                <ClassSidebar
                    classData={classData}
                    professorName={professorName}
                    courses={courses}
                    tests={tests}
                    members={members}
                    userRole={userRole}
                    classId={classId}
                />
            </div>

            <StudentClassGradesModal
                isOpen={isGradesModalOpen}
                onClose={() => setIsGradesModalOpen(false)}
                student={selectedStudent}
                classId={classId}
                className={classData?.name}
            />
        </div>
    );
}
export default ManageClassPage;
