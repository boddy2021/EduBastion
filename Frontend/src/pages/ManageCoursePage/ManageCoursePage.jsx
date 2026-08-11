import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import Button from '../../components/UI/Button';
import ChatSection from '../../components/Chat/Chat';
import styles from './ManageCoursePage.module.css';

function ManageCoursePage() {
    const { courseId } = useParams();
    const userRoleRaw = localStorage.getItem('userRole');
    const userRole = userRoleRaw ? userRoleRaw.toLowerCase() : '';

    const [course, setCourse] = useState(null);
    const [newModuleTitle, setNewModuleTitle] = useState("");
    const [selectedFiles, setSelectedFiles] = useState({});
    const [expandedModules, setExpandedModules] = useState({});

    const [activeTab, setActiveTab] = useState('modules');

    const fetchCourse = async () => {
        try {
            const response = await fetch(`http://127.0.0.1:8000/api/courses/${courseId}`);
            if(response.ok) {
                const data = await response.json();
                setCourse(data);
            }
        } catch (error) {
            console.error("Error fetching course:", error);
        }
    };

    useEffect(() => { fetchCourse(); }, [courseId]);

    const getFileUrl = (filePath) => {
        if (!filePath) return "#";
        const fileName = filePath.split(/[/\\]/).pop();
        return `http://127.0.0.1:8000/files/${fileName}`;
    };

    const toggleModule = (id) => {
        setExpandedModules(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleAddModule = async () => {
        if (!newModuleTitle.trim()) return;
        try {
            await fetch(`http://127.0.0.1:8000/api/courses/${courseId}/modules`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: newModuleTitle })
            });
            setNewModuleTitle("");
            fetchCourse();
        } catch (error) { console.error(error); }
    };

    const handleEditModule = async (e, moduleId, currentTitle) => {
        e.stopPropagation();
        const newTitle = prompt("Rename Module:", currentTitle);
        if (!newTitle) return;
        await fetch(`http://127.0.0.1:8000/api/courses/modules/${moduleId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: newTitle })
        });
        fetchCourse();
    };

    const handleDeleteModule = async (e, moduleId) => {
        e.stopPropagation();
        if(!window.confirm("Delete this module?")) return;
        await fetch(`http://127.0.0.1:8000/api/courses/modules/${moduleId}`, { method: 'DELETE' });
        fetchCourse();
    };

    const handleFileSelect = (moduleId, event) => {
        const file = event.target.files[0];
        if (file) setSelectedFiles({ ...selectedFiles, [moduleId]: file });
    };

    const handleUpload = async (moduleId) => {
        const file = selectedFiles[moduleId];
        if (!file) { alert("Please select a file!"); return; }
        const formData = new FormData();
        formData.append("file", file);
        try {
            const response = await fetch(`http://127.0.0.1:8000/api/courses/modules/${moduleId}/upload`, {
                method: 'POST',
                body: formData
            });
            if (response.ok) {
                alert("Upload successful!");
                const newFiles = { ...selectedFiles };
                delete newFiles[moduleId];
                setSelectedFiles(newFiles);
                fetchCourse();
            } else { alert("Upload error."); }
        } catch (error) { console.error(error); }
    };

    const handleDeleteResource = async (resId) => {
        if(!window.confirm("Delete this file?")) return;
        await fetch(`http://127.0.0.1:8000/api/courses/resources/${resId}`, { method: 'DELETE' });
        fetchCourse();
    };

    if (!course) return <div>Loading course...</div>;

    return (
        <div className={styles.container}>
            <Navbar />
            <main className={styles.mainContent}>
                <div className={styles.header}>
                    <h1 className={styles.courseTitle}>{course.title}</h1>
                    <p className={styles.courseDesc}>{course.description}</p>
                </div>

                <div className={styles.tabsContainer}>
                    <button 
                        className={`${styles.tabBtn} ${activeTab === 'modules' ? styles.activeTab : styles.inactiveTab}`}
                        onClick={() => setActiveTab('modules')}
                    >
                        Modules
                    </button>
                    <button 
                        className={`${styles.tabBtn} ${activeTab === 'chat' ? styles.activeTab : styles.inactiveTab}`}
                        onClick={() => setActiveTab('chat')}
                    >
                        Discussion
                    </button>
                </div>

                {activeTab === 'modules' && (
                    <>
                        {userRole === 'professor' && (
                            <div className={styles.addLessonSection}>
                                <input 
                                    className={styles.input}
                                    placeholder="New Module Name (e.g. 'Week 1')"
                                    value={newModuleTitle}
                                    onChange={(e) => setNewModuleTitle(e.target.value)}
                                />
                                <div className={styles.addBtnWrapper}>
                                    <Button onClick={handleAddModule}>Add Module</Button>
                                </div>
                            </div>
                        )}

                        <div className={styles.lessonsList}>
                            {course.modules && course.modules.map(module => (
                                <div key={module.id} className={styles.lessonCard}>
                                    <div className={styles.lessonHeader} onClick={() => toggleModule(module.id)}>
                                        <span className={styles.lessonTitleWrapper}>
                                            <span className={styles.folderIcon}>📁</span> 
                                            <strong>{module.title}</strong>

                                            {userRole === 'professor' && (
                                                <div className={styles.moduleActions}>
                                                    <button className={styles.textBtnEdit} onClick={(e) => handleEditModule(e, module.id, module.title)}>Edit</button>
                                                    <button className={styles.textBtnDelete} onClick={(e) => handleDeleteModule(e, module.id)}>Delete</button>
                                                </div>
                                            )}
                                        </span>
                                        <span>{expandedModules[module.id] ? '▼' : '▶'}</span>
                                    </div>

                                    {expandedModules[module.id] && (
                                        <div className={styles.lessonContent}>
                                            {module.resources && module.resources.length > 0 ? (
                                                module.resources.map(res => (
                                                    <div key={res.id} className={styles.resourceItem}>
                                                        <div className={styles.resourceInfo}>
                                                            <span className={styles.resourceType}>{res.file_type ? res.file_type.toUpperCase() : 'FILE'}</span>
                                                            <a href={getFileUrl(res.file_path)} target="_blank" rel="noopener noreferrer" className={styles.resourceLink}>
                                                                {res.title}
                                                            </a>
                                                        </div>
                                                        {userRole === 'professor' && (
                                                            <button className={styles.removeResourceBtn} onClick={() => handleDeleteResource(res.id)}>
                                                                Remove
                                                            </button>
                                                        )}
                                                    </div>
                                                ))
                                            ) : (
                                                <p className={styles.emptyFilesMsg}>No files.</p>
                                            )}

                                            {userRole === 'professor' && (
                                                <div className={styles.uploadSection}>
                                                    <label className={styles.uploadLabel}>Add resource:</label>
                                                    <div className={styles.uploadFormContainer}>
                                                        <input type="file" onChange={(e) => handleFileSelect(module.id, e)} className={styles.fileInput} />
                                                        <div className={styles.uploadBtnWrapper}>
                                                            <Button onClick={() => handleUpload(module.id)} disabled={!selectedFiles[module.id]}>Upload</Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {activeTab === 'chat' && (
                    <ChatSection contextId={courseId} type="course" />
                )}
            </main>
        </div>
    );
}

export default ManageCoursePage;