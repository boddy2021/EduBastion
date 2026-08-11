const API_BASE = 'http://127.0.0.1:8000/api';

export const fetchTakeQuiz = async (quizId) => {
    const res = await fetch(`${API_BASE}/quizzes/${quizId}/take`);
    if (!res.ok) throw new Error("Fetch failed");
    return res.json();
};

export const submitQuizAnswers = (quizId, userId, finalAnswers) => {
    return fetch(`${API_BASE}/quizzes/${quizId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: userId, answers: finalAnswers })
    });
};

export const sendProctoringLog = (procData) => {
    return fetch(`${API_BASE}/proctoring/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(procData)
    });
};

export const uploadProctoringImage = (formData) => {
    return fetch(`${API_BASE}/proctoring/upload-image`, {
        method: 'POST', body: formData
    });
};
