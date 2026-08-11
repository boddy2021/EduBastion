const API_BASE = 'http://127.0.0.1:8000/api';

export const fetchClass = async (classId) => {
    const res = await fetch(`${API_BASE}/classes/${classId}`);
    if (!res.ok) return null;
    return res.json();
};

export const fetchProfessorProfile = async (professorId) => {
    const res = await fetch(`${API_BASE}/users/${professorId}/profile`);
    if (!res.ok) return null;
    return res.json();
};

export const fetchCoursesByClass = async (classId) => {
    const res = await fetch(`${API_BASE}/courses/by-class/${classId}`);
    if (!res.ok) return null;
    return res.json();
};

export const fetchClassMembers = async (classId) => {
    const res = await fetch(`${API_BASE}/classes/${classId}/members`);
    if (!res.ok) return null;
    return res.json();
};

export const fetchClassQuizzes = async (classId) => {
    const res = await fetch(`${API_BASE}/classes/${classId}/quizzes`);
    if (!res.ok) return null;
    return res.json();
};

export const fetchQuizStatus = async (quizId, userId) => {
    const res = await fetch(`${API_BASE}/quizzes/${quizId}/status/${userId}`);
    if (!res.ok) return null;
    return res.json();
};

export const removeStudentFromClass = (classId, studentId) => {
    return fetch(`${API_BASE}/classes/${classId}/students/${studentId}`, { method: 'DELETE' });
};

export const deleteQuiz = (testId) => {
    return fetch(`${API_BASE}/quizzes/${testId}`, { method: 'DELETE' });
};

export const deleteCourse = (courseId) => {
    return fetch(`${API_BASE}/courses/${courseId}`, { method: 'DELETE' });
};
