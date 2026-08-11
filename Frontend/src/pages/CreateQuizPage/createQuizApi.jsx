const API_BASE = 'http://127.0.0.1:8000/api';

export const fetchCoursesByClass = async (classId) => {
    const res = await fetch(`${API_BASE}/courses/by-class/${classId}`);
    if (!res.ok) return null;
    return res.json();
};

export const fetchQuizForEditor = async (quizId) => {
    const res = await fetch(`${API_BASE}/quizzes/${quizId}/editor`);
    if (!res.ok) return null;
    return res.json();
};

export const uploadAttachment = async (file) => {
    const fd = new FormData(); fd.append("file", file);
    const res = await fetch(`${API_BASE}/quizzes/upload-attachment`, { method: 'POST', body: fd });
    if (!res.ok) return null;
    return res.json();
};

export const saveQuiz = (payload, isEditMode, quizId) => {
    const url = isEditMode ? `${API_BASE}/quizzes/${quizId}` : `${API_BASE}/quizzes/`;
    const method = isEditMode ? 'PUT' : 'POST';

    return fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
};
