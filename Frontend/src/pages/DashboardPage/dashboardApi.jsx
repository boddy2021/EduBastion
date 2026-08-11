const API_BASE = 'http://127.0.0.1:8000/api';

export const fetchUserProfile = async (userId) => {
    const res = await fetch(`${API_BASE}/users/${userId}/profile`);
    if (!res.ok) return null;
    return res.json();
};

export const fetchUserClasses = async (userId, userRole) => {
    const url = userRole === 'professor'
        ? `${API_BASE}/classes/professor/${userId}`
        : `${API_BASE}/classes/student/${userId}`;

    const res = await fetch(url);
    if (!res.ok) return null;
    return res.json();
};

export const fetchUserEvents = async (userId, userRole) => {
    const res = await fetch(`${API_BASE}/events/user/${userId}/${userRole}`);
    if (!res.ok) return null;
    return res.json();
};

export const deleteEvent = (eventId) => {
    return fetch(`${API_BASE}/events/${eventId}`, { method: 'DELETE' });
};
