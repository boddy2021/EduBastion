import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Button from '../../components/UI/Button';
import styles from './TakeQuizPage.module.css';
import { fetchTakeQuiz, submitQuizAnswers, sendProctoringLog } from './quizApi';
import { useQuizTimer, formatTime } from './useQuizTimer';
import { useProctoring } from './useProctoring';
import SubmitConfirmModal from './SubmitConfirmModal';
import QuestionRenderer from './QuestionRenderer';

function TakeQuizPage() {
    const { quizId } = useParams();
    const navigate = useNavigate();

    const rawUserId = localStorage.getItem('userId');
    const userId = rawUserId ? parseInt(rawUserId) : null;

    const [quiz, setQuiz] = useState(null);
    const [answers, setAnswers] = useState({});
    const [uploadedFiles, setUploadedFiles] = useState({});

    const [serverStatus, setServerStatus] = useState('loading');
    const [secondsLeft, setSecondsLeft] = useState(0);
    const [secondsToStart, setSecondsToStart] = useState(0);
    const [formattedStartTime, setFormattedStartTime] = useState('');

    const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

    const isSubmittingRef = useRef(false);
    const isFinishingRef = useRef(false);

    const answersRef = useRef({});
    const uploadedFilesRef = useRef({});

    const KEY_ANSWERS = `quiz_${quizId}_u${userId}_answers`;

    const [isExamActive, setIsExamActive] = useState(false);
    const isExamActiveRef = useRef(false);

    const {
        isCheating,
        videoRef,
        canvasRef,
        startSecureExam,
        returnToExam,
        stopProctoring,
        getProctoringData
    } = useProctoring({ quiz, quizId, userId, isExamActive, isExamActiveRef, isFinishingRef, setIsExamActive });

    useEffect(() => { answersRef.current = answers; }, [answers]);
    useEffect(() => { uploadedFilesRef.current = uploadedFiles; }, [uploadedFiles]);

    useEffect(() => {
        const fetchQuiz = async () => {
            try {
                const data = await fetchTakeQuiz(quizId);
                setQuiz(data);
                setServerStatus(data.quiz_status);

                const savedAnswers = localStorage.getItem(KEY_ANSWERS);
                if (savedAnswers) {
                    try { setAnswers(JSON.parse(savedAnswers)); } catch (e) { setAnswers({}); }
                } else if (data.questions) {
                    const initial = {};
                    data.questions.forEach((q, i) => {
                        initial[i] = q.type === 'CheckBoxQuestion' ? [] : null;
                    });
                    setAnswers(initial);
                }

                const serverTimeMs = new Date(data.server_time).getTime();
                const durationMs = (data.duration || 30) * 60 * 1000;
                let startTimeMs = null;

                if (data.start_time) {
                    startTimeMs = new Date(data.start_time).getTime();
                    setFormattedStartTime(new Date(data.start_time).toLocaleString('en-US'));
                }

                if (data.quiz_status === 'waiting' && startTimeMs) {
                    setSecondsToStart(Math.floor((startTimeMs - serverTimeMs) / 1000));
                } else if (data.quiz_status === 'active') {
                    let endTimeMs;
                    if (startTimeMs) {
                        endTimeMs = startTimeMs + durationMs;
                    } else {
                        const KEY_LOCAL_START = `quiz_${quizId}_start`;
                        let localStart = localStorage.getItem(KEY_LOCAL_START);
                        if(!localStart) {
                            localStart = Date.now();
                            localStorage.setItem(KEY_LOCAL_START, localStart);
                        }
                        endTimeMs = parseInt(localStart) + durationMs;
                    }
                    const remaining = Math.floor((endTimeMs - Date.now()) / 1000);
                    setSecondsLeft(remaining > 0 ? remaining : 0);
                } else if (data.quiz_status === 'finished') {
                    alert("This test has expired.");
                    if (window.opener) window.close();
                    else navigate('/dashboard');
                }
            } catch (err) { console.error(err); }
        };
        fetchQuiz();
    }, [quizId, navigate, KEY_ANSWERS]);

    const handleAutoSubmit = () => {
        if (!isSubmittingRef.current) {
            isFinishingRef.current = true;
            submitData();
        }
    };

    useQuizTimer({ serverStatus, setSecondsLeft, setSecondsToStart, onTimeUp: handleAutoSubmit });

    const handleAnswerChange = (idx, val) => {
        const newAns = { ...answers, [idx]: val };
        setAnswers(newAns);
        answersRef.current = newAns;
        localStorage.setItem(KEY_ANSWERS, JSON.stringify(newAns));
    };

    const handleCheckboxChange = (idx, val) => {
        const current = Array.isArray(answers[idx]) ? answers[idx] : [];
        let updated = current.includes(val) ? current.filter(x => x !== val) : [...current, val];
        const newAns = { ...answers, [idx]: updated };
        setAnswers(newAns);
        answersRef.current = newAns;
        localStorage.setItem(KEY_ANSWERS, JSON.stringify(newAns));
    };

    const handleManualSubmit = () => {
        setShowSubmitConfirm(true);
    };

    const confirmSubmit = async () => {
        setShowSubmitConfirm(false);
        isExamActiveRef.current = false;
        isFinishingRef.current = true;

        if (document.fullscreenElement) {
            try { await document.exitFullscreen(); } catch (e) { console.log(e); }
        }

        submitData();
    };

    const cancelSubmit = async () => {
        setShowSubmitConfirm(false);
        if (quiz?.proctoring_settings?.tab_switch && !document.fullscreenElement) {
            try {
                await document.documentElement.requestFullscreen();
            } catch (err) {
                console.warn("Nu s-a putut relua modul Full Screen automat:", err);
            }
        }
    };

    const submitData = async () => {
        if (isSubmittingRef.current) return;
        isSubmittingRef.current = true;
        isExamActiveRef.current = false;
        isFinishingRef.current = true;

        stopProctoring();

        const currentAnswers = answersRef.current || {};
        const currentFiles = uploadedFilesRef.current || {};

        const finalAnswers = (quiz.questions || []).map((q, idx) => {
            const txt = currentAnswers[idx];
            const file = currentFiles[idx];
            if (q.type === 'LongAnswerQuestion' && file) return `[ATTACHMENT: ${file}] \n ${txt || ''}`;
            return txt !== undefined && txt !== null ? txt : "";
        });

        try {
            const res = await submitQuizAnswers(quizId, userId, finalAnswers);

            if(res.ok) {
                localStorage.removeItem(KEY_ANSWERS);
                const r = await res.json();

                const procData = getProctoringData();

                try {
                    await sendProctoringLog(procData);
                } catch (err) { console.error("Eroare proctoring", err); }

                if (document.fullscreenElement) {
                    await document.exitFullscreen().catch(e => console.log(e));
                }

                if (window.opener && !window.opener.closed) {
                    window.opener.location.href = `/quiz/result/${r.submission_id}`;
                    window.close();
                } else {
                    navigate(`/quiz/result/${r.submission_id}`);
                }

            } else {
                alert("Error submitting the test.");
                isSubmittingRef.current = false;
                isFinishingRef.current = false;
            }
        } catch (e) {
            console.error(e);
            isSubmittingRef.current = false;
            isFinishingRef.current = false;
        }
    };

    if (serverStatus === 'loading') return <div className={styles.inlineStyle}>Loading test...</div>;

    if (serverStatus === 'waiting') {
        return (
            <div className={styles.container}>
                <div className={styles.inlineStyle2}>
                    <h1>⏳ Waiting Room</h1>
                    <p className={styles.inlineStyle3}>Test: <strong>{quiz?.title}</strong></p>
                    {formattedStartTime && <p>Starts at: <strong>{formattedStartTime}</strong></p>}
                    <div className={styles.inlineStyle4}>
                        {formatTime(secondsToStart)}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.inlineStyle5}>
                <video ref={videoRef} autoPlay playsInline muted width="640" height="480"></video>
                <canvas ref={canvasRef}></canvas>
            </div>

            {showSubmitConfirm && (
                <SubmitConfirmModal onCancel={cancelSubmit} onConfirm={confirmSubmit} />
            )}

            {isCheating && (
                <div className={styles.flexRow3}>
                    <h1 className={styles.inlineStyle9}>⚠️ THE TEST IS BLOKED</h1>
                    <p className={styles.inlineStyle10}>You have left the window or Full Screen mode.</p>
                    <button onClick={returnToExam} className={styles.inlineStyle11}>
                        Return to the exam
                    </button>
                </div>
            )}

            {!isExamActive && !isCheating ? (
                <div className={styles.flexRow4}>
                    <h2>The test "{quiz?.title}" is ready.</h2>

                    {quiz?.enable_proctoring ? (
                        <div className={styles.proctoringWarningBox}>
                            <p className={styles.inlineStyle12}>This test is monitored automatically (Anti-Cheat):</p>
                            <ul className={styles.inlineStyle13}>
                                {quiz?.proctoring_settings?.camera && <li>📸 The camera will analyze your face.</li>}
                                {quiz?.proctoring_settings?.audio && <li>🎤 The microphone will detect if you are talking.</li>}
                                {quiz?.proctoring_settings?.tab_switch && <li>💻 The test requires Full Screen mode and you cannot switch tabs.</li>}
                            </ul>
                            <p className={styles.inlineStyle14}>You will be asked to allow hardware access to continue.</p>
                        </div>
                    ) : (
                        <p className={styles.spacedBottom2}>Press the button below to start the timer.</p>
                    )}

                    <button onClick={startSecureExam} className={styles.inlineStyle11}>
                        {quiz?.enable_proctoring ? 'Allow & Start Test' : 'Start Test'}
                    </button>
                </div>
            ) : (
                <>
                    <div className={styles.inlineStyle15}>
                        <div>TIME</div>
                        <div className={styles.inlineStyle16}>{formatTime(secondsLeft)}</div>
                    </div>

                    <main className={styles.mainContent}>
                        <div className={styles.header}>
                            <h1 className={styles.title}>{quiz.title}</h1>
                            <p>Duration: {quiz.duration} min</p>
                        </div>

                        <div className={styles.questionsList}>
                            {quiz.questions && quiz.questions.map((q, idx) => (
                                <QuestionRenderer
                                    key={idx}
                                    q={q}
                                    idx={idx}
                                    answers={answers}
                                    onAnswerChange={handleAnswerChange}
                                    onCheckboxChange={handleCheckboxChange}
                                />
                            ))}
                        </div>

                        <div className={styles.alignRight}>
                            <Button onClick={(e) => { e.preventDefault(); handleManualSubmit(); }}>Submit Test</Button>
                        </div>
                    </main>
                </>
            )}
        </div>
    );
}
export default TakeQuizPage;
