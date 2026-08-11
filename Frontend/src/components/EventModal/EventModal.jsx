import React, { useState, useEffect } from 'react';
import Button from '../UI/Button';
import InputField from '../UI/InputField';
import styles from './EventModal.module.css';

export default function EventModal({ isOpen, onClose, userId, onEventAdded, initialData }) {
    const [classes, setClasses] = useState([]);
    const [formData, setFormData] = useState({ title: '', description: '', event_date: '', class_id: '' });

    useEffect(() => {
        if (isOpen) {
            fetch(`http://127.0.0.1:8000/api/classes/professor/${userId}`)
                .then(res => res.json())
                .then(data => {
                    setClasses(data);
                    if (initialData) {
                        const d = new Date(initialData.event_date);
                        const tzOffset = d.getTimezoneOffset() * 60000; 
                        const localISOTime = (new Date(d - tzOffset)).toISOString().slice(0, 16);
                        setFormData({ title: initialData.title, description: initialData.description || '', event_date: localISOTime, class_id: initialData.class_id });
                    } else {
                        setFormData({ title: '', description: '', event_date: '', class_id: data.length > 0 ? data[0].id : '' });
                    }
                });
        }
    }, [isOpen, userId, initialData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData, professor_id: parseInt(userId), class_id: parseInt(formData.class_id), event_date: new Date(formData.event_date).toISOString()
            };
            const url = initialData ? `http://127.0.0.1:8000/api/events/${initialData.id}` : 'http://127.0.0.1:8000/api/events/';
            const method = initialData ? 'PUT' : 'POST';

            const res = await fetch(url, { method: method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });

            if (res.ok) { onEventAdded(); onClose(); } 
            else { alert(`Failed to ${initialData ? 'update' : 'create'} event`); }
        } catch (err) { console.error(err); }
    };

    if (!isOpen) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <button className={styles.closeBtn} onClick={onClose}>✕</button>
                <h2 className={styles.title}>{initialData ? "Edit Event" : "Add Calendar Event"}</h2>
                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>Select Class</label>
                        <select className={styles.selectInput} value={formData.class_id} onChange={e => setFormData({...formData, class_id: e.target.value})}>
                            {classes.map(cls => <option key={cls.id} value={cls.id}>{cls.name}</option>)}
                        </select>
                    </div>
                    <InputField label="Event Title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Guest Lecture" />
                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>Date & Time</label>
                        <input type="datetime-local" className={styles.selectInput} value={formData.event_date} onChange={e => setFormData({...formData, event_date: e.target.value})} required />
                    </div>
                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>Description (Optional)</label>
                        <textarea className={styles.textArea} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                    </div>
                    <div className={styles.spacedTop}><Button type="submit">{initialData ? "Save Changes" : "Create Event"}</Button></div>
                </form>
            </div>
        </div>
    );
}

export function EventDetailsModal({ isOpen, onClose, event }) {
    if (!isOpen || !event) return null;
    const d = new Date(event.event_date);
    const dateStr = d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <button className={styles.closeBtn} onClick={onClose}>✕</button>
                <div className={styles.header}>
                    <span className={styles.badge}>{event.is_quiz ? "📝 Quiz" : "📅 Event"}</span>
                    <h2 className={`${styles.title} ${styles.spacedBottom}`}>{event.title.replace('📝 Quiz: ', '')}</h2>
                </div>
                <div className={styles.detailsGroup}><strong>Date & Time:</strong><p>{dateStr} at {timeStr}</p></div>
                <div className={styles.detailsGroup}><strong>Classroom:</strong><p>{event.class_name}</p></div>
                {event.description && <div className={styles.detailsGroup}><strong>Details:</strong><p className={styles.preWrap}>{event.description}</p></div>}
            </div>
        </div>
    );
}

export function AllEventsModal({ isOpen, onClose, events, formatEventDate, handleEventClick }) {
    if (!isOpen) return null;
    return (
        <div className={styles.overlay}>
            <div className={`${styles.modal} ${styles.inlineStyle}`}>
                <button className={styles.closeBtn} onClick={onClose}>✕</button>
                <h2 className={`${styles.title} ${styles.inlineStyle2}`}>All Upcoming Events</h2>
                <div className={styles.list}>
                    {events.map(ev => {
                        const dateObj = formatEventDate(ev.event_date);
                        return (
                            <div key={`${ev.is_quiz ? 'q' : 'e'}-${ev.id}`} className={styles.eventItem} onClick={() => handleEventClick(ev)}>
                                <div className={styles.eventDate}>
                                    <span className={styles.day}>{dateObj.day}</span>
                                    <span className={styles.month}>{dateObj.month}</span>
                                </div>
                                <div className={styles.eventContent}>
                                    <div className={styles.eventTitle}>{ev.title}</div>
                                    <div className={styles.eventSub}>{dateObj.time} • {ev.class_name}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}