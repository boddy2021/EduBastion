import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './DashboardPage.module.css';
import { IconEdit, IconX } from './dashboardIcons';

function DashboardSidebar({
    userRole,
    profile,
    events,
    displayedEvents,
    formatEventDate,
    handleEventClick,
    handleCreateEvent,
    handleEditEvent,
    handleDeleteEvent,
    setIsAllEventsOpen
}) {
    const navigate = useNavigate();

    return (
        <div className={styles.sidebar}>

            <div className={styles.sidebarCard}>
                <div className={styles.flexRow}>
                    <h3 className={`${styles.sidebarTitle} ${styles.inlineStyle3}`}>Upcoming Events</h3>
                    {userRole === 'professor' && (
                        <button
                            onClick={handleCreateEvent} className={styles.inlineStyle4}
                            title="Add new event"
                        >+</button>
                    )}
                </div>

                {displayedEvents.length > 0 ? displayedEvents.map(ev => {
                    const dateObj = formatEventDate(ev.event_date);
                    return (
                        <div
                            key={`${ev.is_quiz ? 'q' : 'e'}-${ev.id}`}
                            className={`${styles.agendaItem} ${styles.inlineStyle5}`}
                            onClick={() => handleEventClick(ev)}
                        >
                            <div className={styles.agendaDate}>
                                <span className={styles.day}>{dateObj.day}</span>
                                <span className={styles.month}>{dateObj.month}</span>
                            </div>
                            <div className={styles.agendaContent}>
                                <div className={styles.agendaTitle}>{ev.title}</div>
                                <div className={styles.agendaSub}>
                                    {dateObj.time} • {ev.class_name}
                                </div>
                            </div>

                            {userRole === 'professor' && (
                                <div className={styles.eventActions}>
                                    <button
                                        onClick={(e) => handleEditEvent(ev, e)} className={styles.flexRow2}
                                        title="Edit"
                                    ><IconEdit /></button>
                                    <button
                                        onClick={(e) => handleDeleteEvent(ev, e)} className={styles.flexRow3}
                                        title="Delete"
                                    ><IconX /></button>
                                </div>
                            )}
                        </div>
                    );
                }) : (
                    <p className={styles.inlineStyle6}>No upcoming events.</p>
                )}

                {events.length > 3 && (
                    <button
                        onClick={() => setIsAllEventsOpen(true)} className={styles.inlineStyle7}
                    >
                        View {events.length - 3} more...
                    </button>
                )}
            </div>

            <div className={`${styles.sidebarCard} ${styles.spacedTop}`}>
                <h3 className={styles.sidebarTitle}>My Info</h3>
                <p className={styles.inlineStyle8}><strong>Uni:</strong> {profile?.university || "Not Set"}</p>
                <p className={styles.inlineStyle9}><strong>Role:</strong> <span className={styles.inlineStyle10}>{userRole}</span></p>
                <button
                    onClick={() => navigate('/profile')} className={styles.inlineStyle11}
                >
                    Edit Profile
                </button>
            </div>
        </div>
    );
}

export default DashboardSidebar;
