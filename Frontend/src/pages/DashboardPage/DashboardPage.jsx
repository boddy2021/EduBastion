import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import styles from './DashboardPage.module.css';

import EventModal, { EventDetailsModal, AllEventsModal } from '../../components/EventModal/EventModal';
import GradesModal from '../../components/GradesModal/GradesModal';
import QuizBuilderModal from '../../components/QuizBuilderModal/QuizBuilderModal';
import GradebookModal from '../../components/GradebookModal/GradebookModal';
import MyTestsModal from '../../components/MyTestsModal/MyTestsModal';

import { IconFolder } from './dashboardIcons';
import ActionCards from './ActionCards';
import DashboardSidebar from './DashboardSidebar';
import { fetchUserProfile, fetchUserClasses, fetchUserEvents, deleteEvent } from './dashboardApi';

function DashboardPage() {
    const navigate = useNavigate();
    const userRoleRaw = localStorage.getItem('userRole');
    const userRole = userRoleRaw ? userRoleRaw.toLowerCase() : '';
    const userId = localStorage.getItem('userId');

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [classes, setClasses] = useState([]);

    const [isGradesModalOpen, setIsGradesModalOpen] = useState(false);
    const [isQuizBuilderOpen, setIsQuizBuilderOpen] = useState(false);
    const [isGradebookOpen, setIsGradebookOpen] = useState(false);
    const [isMyTestsOpen, setIsMyTestsOpen] = useState(false);

    const [events, setEvents] = useState([]);
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [eventToEdit, setEventToEdit] = useState(null);

    const [isEventDetailsOpen, setIsEventDetailsOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);

    const [isAllEventsOpen, setIsAllEventsOpen] = useState(false);

    const today = new Date().toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    const fetchEvents = async () => {
        try {
            const data = await fetchUserEvents(userId, userRole);
            if (data) setEvents(data);
        } catch (err) {
            console.error("Failed to load events", err);
        }
    };

    useEffect(() => {
        const loadData = async () => {
            try {
                const profileData = await fetchUserProfile(userId);
                if (profileData) setProfile(profileData);

                const classData = await fetchUserClasses(userId, userRole);
                if (classData) setClasses(classData);

                await fetchEvents();

            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        if (userId) loadData();
    }, [userId, userRole]);

    const handleEventClick = (ev) => {
        setSelectedEvent(ev);
        setIsEventDetailsOpen(true);
    };

    const handleCreateEvent = () => {
        setEventToEdit(null);
        setIsEventModalOpen(true);
    };

    const handleEditEvent = (ev, e) => {
        e.stopPropagation();
        if(ev.is_quiz) {
            alert("This is a Quiz. To change its date, please edit the quiz in the Quiz Builder.");
            return;
        }
        setEventToEdit(ev);
        setIsEventModalOpen(true);
    };

    const handleDeleteEvent = async (ev, e) => {
        e.stopPropagation();
        if(ev.is_quiz) {
            alert("This is a Quiz. To delete it, go to Quiz Builder.");
            return;
        }
        if(window.confirm("Are you sure you want to delete this event?")) {
            await deleteEvent(ev.id);
            fetchEvents();
        }
    };

    const formatEventDate = (isoString) => {
        const d = new Date(isoString);
        const day = d.getDate();
        const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
        const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return { day, month, time };
    };

    if (loading) return (
        <div className={styles.loadingScreen}>
            Loading Workspace...
        </div>
    );

    const firstName = profile ? profile.first_name : "User";

    const displayedEvents = events.slice(0, 3);

    return (
        <div className={styles.container}>
            <Navbar />

            <div className={styles.mainLayout}>
                <div className={styles.header}>
                    <h1 className={styles.greeting}>Hello, {firstName}.</h1>
                    <div className={styles.date}>{today}</div>
                </div>

                <div className={styles.contentArea}>

                    <ActionCards
                        userRole={userRole}
                        setIsQuizBuilderOpen={setIsQuizBuilderOpen}
                        setIsGradebookOpen={setIsGradebookOpen}
                        setIsMyTestsOpen={setIsMyTestsOpen}
                        setIsGradesModalOpen={setIsGradesModalOpen}
                    />

                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>Your Classrooms</h2>
                        <span className={styles.noteText}>{classes.length} Active</span>
                    </div>

                    {classes.length > 0 ? (
                        <div className={styles.gridContainer}>
                            {classes.map(cls => (
                                <Link key={cls.id} to={`/class/${cls.id}`} className={styles.classCard}>
                                    <div>
                                        <div className={styles.inlineStyle}><IconFolder /></div>
                                        <div className={styles.classTitle}>{cls.name}</div>
                                        <div className={styles.codeBadge}>{cls.join_code}</div>
                                    </div>
                                    <div className={styles.cardFooter}>Access &rarr;</div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className={styles.inlineStyle2}>
                            <p className={styles.noteText2}>No classrooms found.</p>
                        </div>
                    )}
                </div>

                <DashboardSidebar
                    userRole={userRole}
                    profile={profile}
                    events={events}
                    displayedEvents={displayedEvents}
                    formatEventDate={formatEventDate}
                    handleEventClick={handleEventClick}
                    handleCreateEvent={handleCreateEvent}
                    handleEditEvent={handleEditEvent}
                    handleDeleteEvent={handleDeleteEvent}
                    setIsAllEventsOpen={setIsAllEventsOpen}
                />

            </div>

            <GradesModal isOpen={isGradesModalOpen} onClose={() => setIsGradesModalOpen(false)} userId={userId} />
            <QuizBuilderModal isOpen={isQuizBuilderOpen} onClose={() => setIsQuizBuilderOpen(false)} userId={userId} />
            <GradebookModal isOpen={isGradebookOpen} onClose={() => setIsGradebookOpen(false)} userId={userId} />
            <MyTestsModal isOpen={isMyTestsOpen} onClose={() => setIsMyTestsOpen(false)} userId={userId} />

            <EventModal
                isOpen={isEventModalOpen}
                onClose={() => setIsEventModalOpen(false)}
                userId={userId}
                onEventAdded={fetchEvents}
                initialData={eventToEdit}
            />

            <EventDetailsModal
                isOpen={isEventDetailsOpen}
                onClose={() => setIsEventDetailsOpen(false)}
                event={selectedEvent}
            />

            <AllEventsModal
                isOpen={isAllEventsOpen}
                onClose={() => setIsAllEventsOpen(false)}
                events={events}
                formatEventDate={formatEventDate}
                handleEventClick={(ev) => {
                    setIsAllEventsOpen(false);
                    handleEventClick(ev);
                }}
            />
        </div>
    );
}

export default DashboardPage;
