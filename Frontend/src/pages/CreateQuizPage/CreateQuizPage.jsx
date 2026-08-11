import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import Button from '../../components/UI/Button';
import styles from './CreateQuizPage.module.css';
import { fetchCoursesByClass, fetchQuizForEditor, uploadAttachment, saveQuiz } from './createQuizApi';
import { calculateScoring } from './scoring';
import ProctoringSettings from './ProctoringSettings';
import ScoringPanel from './ScoringPanel';
import QuestionEditor from './QuestionEditor';

function CreateQuizPage() {
    const { classId, quizId } = useParams();
    const navigate = useNavigate();
    const userId = localStorage.getItem('userId');
    const isEditMode = !!quizId;

    const [courses, setCourses] = useState([]);
    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [quizTitle, setQuizTitle] = useState('');
    const [duration, setDuration] = useState(30);
    const [startTime, setStartTime] = useState('');

    const [quizLanguage, setQuizLanguage] = useState('ro-RO');

    const [enableProctoring, setEnableProctoring] = useState(false);
    const [proctoringSettings, setProctoringSettings] = useState({
        camera: true,
        audio: true,
        tab_switch: true
    });

    const [questions, setQuestions] = useState([]);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [newQuestionType, setNewQuestionType] = useState('MultipleChoiceQuestion');

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const data = await fetchCoursesByClass(classId);
                if (data) {
                    setCourses(data);
                    if (!isEditMode && data.length > 0) setSelectedCourseId(data[0].id);
                }
            } catch (err) { console.error(err); }
        };
        fetchCourses();
    }, [classId, isEditMode]);

    useEffect(() => {
        if (isEditMode) {
            const fetchQuizData = async () => {
                try {
                    const data = await fetchQuizForEditor(quizId);
                    if (data) {
                        setQuizTitle(data.title);
                        setDuration(data.duration);
                        setSelectedCourseId(data.course_id);

                        if (data.language) setQuizLanguage(data.language);
                        if (data.enable_proctoring !== undefined) setEnableProctoring(data.enable_proctoring);
                        if (data.proctoring_settings) setProctoringSettings(data.proctoring_settings);

                        if (data.start_time) {
                            const dateObj = new Date(data.start_time);
                            dateObj.setMinutes(dateObj.getMinutes() - dateObj.getTimezoneOffset());
                            setStartTime(dateObj.toISOString().slice(0, 16));
                        }

                        const loadedQuestions = data.questions.map((q, idx) => {
                            const uiQ = { ...q, id: Date.now() + idx, linksString: q.links ? q.links.join(', ') : '', points: q.points || '' };

                            if (q.type === 'MultipleChoiceQuestion') {
                                uiQ.answer = q.choices.indexOf(q.answer);
                            } else if (q.type === 'CheckBoxQuestion') {
                                uiQ.answer = q.answer.map(ans => q.choices.indexOf(ans)).filter(i => i !== -1);
                            }
                            return uiQ;
                        });
                        setQuestions(loadedQuestions);
                    }
                } catch (err) {
                    console.error(err);
                    setError("Failed to load quiz for editing.");
                }
            };
            fetchQuizData();
        }
    }, [isEditMode, quizId]);

    const scoring = calculateScoring(questions);
    const hasScoringErrors = scoring.isOverLimit || scoring.isMissingPoints || scoring.isUnderLimit;

    const addQuestion = () => {
        const baseQuestion = {
            id: Date.now(), text: '', type: newQuestionType, link: '', image_url: null, choices: [], answer: null, linksString: '', points: ''
        };
        if (newQuestionType === 'MultipleChoiceQuestion') { baseQuestion.choices = ['', '']; baseQuestion.answer = null; }
        else if (newQuestionType === 'CheckBoxQuestion') { baseQuestion.choices = ['', '']; baseQuestion.answer = []; }
        else if (newQuestionType === 'TrueFalseQuestion') { baseQuestion.choices = ['True', 'False']; baseQuestion.answer = true; }
        else { baseQuestion.answer = ''; }
        setQuestions([...questions, baseQuestion]);
    };

    const updateQuestion = (id, field, value) => setQuestions(questions.map(q => q.id === id ? { ...q, [field]: value } : q));

    const handleImageUpload = async (qId, file) => {
        const d = await uploadAttachment(file);
        if (d) { updateQuestion(qId, 'image_url', d.url); }
    };

    const updateChoice = (qId, idx, val) => setQuestions(q => q.map(xq => xq.id===qId ? {...xq, choices: xq.choices.map((c,i)=>i===idx?val:c)} : xq));
    const addChoiceOption = (qId) => setQuestions(q => q.map(xq => xq.id===qId ? {...xq, choices: [...xq.choices, '']} : xq));
    const removeChoiceOption = (qId, idx) => setQuestions(q => q.map(xq => {
        if(xq.id!==qId) return xq;
        const nc = xq.choices.filter((_,i)=>i!==idx);
        let na = xq.answer;
        if(xq.type==='MultipleChoiceQuestion') { if(na===idx) na=null; else if(na>idx) na--; }
        else if(xq.type==='CheckBoxQuestion') { na = na.filter(x=>x!==idx).map(x=>x>idx?x-1:x); }
        return {...xq, choices:nc, answer:na};
    }));
    const setCorrectOptionMC = (qId, idx) => setQuestions(q => q.map(xq => xq.id===qId ? {...xq, answer: idx} : xq));
    const toggleCorrectOptionCB = (qId, idx) => setQuestions(q => q.map(xq => xq.id===qId ? {...xq, answer: xq.answer.includes(idx)?xq.answer.filter(x=>x!==idx):[...xq.answer, idx]} : xq));
    const removeQuestion = (id) => setQuestions(q => q.filter(xq => xq.id !== id));

    const handleSubmit = async () => {
        setError('');
        setIsSubmitting(true);

        if (!quizTitle || !selectedCourseId) {
            setError("Title and Course are required.");
            setIsSubmitting(false);
            return;
        }

        if (hasScoringErrors) {
            setError("Please fix the scoring errors before saving.");
            setIsSubmitting(false);
            return;
        }

        if (questions.length === 0) {
            setError("Please add at least one question.");
            setIsSubmitting(false);
            return;
        }

        try {
            const processedQuestions = questions.map(({ id, linksString, ...q }) => {
                const linksArray = linksString ? linksString.split(',').map(l => l.trim()).filter(l => l) : [];
                const finalLink = (q.link && q.link.trim() !== "") ? q.link : null;
                const finalPoints = (q.points && Number(q.points) > 0) ? Number(q.points) : scoring.autoPointsPerQuestion;

                const finalQ = {
                    title: "", text: q.text, type: q.type, link: finalLink, links: linksArray, image_url: q.image_url || null, choices: q.choices || [],
                    points: finalPoints
                };

                if (q.type === 'MultipleChoiceQuestion') {
                    if (q.answer === null || q.answer === undefined) throw new Error("Multiple Choice needs an answer.");
                    finalQ.answer = q.choices[q.answer];
                } else if (q.type === 'CheckBoxQuestion') {
                    if (!q.answer || q.answer.length === 0) throw new Error("Checkbox needs at least one answer.");
                    finalQ.answer = q.answer.map(idx => q.choices[idx]);
                } else {
                    finalQ.answer = q.answer;
                }
                return finalQ;
            });

            const payload = {
                title: quizTitle,
                duration: parseInt(duration),
                start_time: startTime ? new Date(startTime).toISOString() : null,
                course_id: parseInt(selectedCourseId),
                professor_id: parseInt(userId),
                language: quizLanguage,
                enable_proctoring: enableProctoring,
                proctoring_settings: proctoringSettings,
                questions: processedQuestions
            };

            const res = await saveQuiz(payload, isEditMode, quizId);
            const data = await res.json();

            if (res.ok) {
                alert(isEditMode ? "Quiz updated successfully!" : "Quiz created successfully!");
                navigate(`/class/${classId}`);
            } else {
                setError(JSON.stringify(data.detail));
            }
        } catch (error) {
            setError(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={styles.container}>
            <Navbar />
            <main className={styles.mainContent}>
                <div className={styles.card}>
                    <div className={styles.header}>
                        <h1 className={styles.title}>{isEditMode ? "Edit Quiz" : "Create New Quiz"}</h1>
                    </div>

                    {error && <div className={`${styles.errorMessage} ${styles.preWrap}`}>{error}</div>}

                    <div className={styles.inputGroup}>
                        <label className={styles.sectionLabel}>Select Course</label>
                        <select
                            className={styles.selectInput}
                            value={selectedCourseId}
                            onChange={(e) => setSelectedCourseId(e.target.value)}
                            disabled={isEditMode}
                        >
                            <option value="">-- Choose a Course --</option>
                            {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                        </select>
                    </div>

                    <div className={styles.inputGroup}>
                        <label className={styles.sectionLabel}>Quiz Title</label>
                        <input className={styles.textInput} value={quizTitle} onChange={(e) => setQuizTitle(e.target.value)} />
                    </div>

                    <div className={styles.inputGroup}>
                        <label className={styles.sectionLabel}>Examination Language (Audio Anti-Cheat)</label>
                        <select
                            className={styles.selectInput}
                            value={quizLanguage}
                            onChange={(e) => setQuizLanguage(e.target.value)}
                        >
                            <option value="ro-RO">🇷🇴 Romanian</option>
                            <option value="en-US">🇺🇸 English (US)</option>
                            <option value="en-GB">🇬🇧 English (UK)</option>
                            <option value="fr-FR">🇫🇷 French</option>
                            <option value="es-ES">🇪🇸 Spanish</option>
                            <option value="de-DE">🇩🇪 German</option>
                            <option value="it-IT">🇮🇹 Italian</option>
                            <option value="pt-PT">🇵🇹 Portuguese</option>
                        </select>
                    </div>

                    <div className={styles.flexRow}>
                        <div className={styles.inputGroup}>
                            <label className={styles.sectionLabel}>Duration (min)</label>
                            <input type="number" className={styles.textInput} value={duration} onChange={(e) => setDuration(e.target.value)} />
                        </div>
                        <div className={styles.inputGroup}>
                            <label className={styles.sectionLabel}>Start Time (Optional)</label>
                            <input type="datetime-local" className={styles.textInput} value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                        </div>
                    </div>

                    <ProctoringSettings
                        enableProctoring={enableProctoring}
                        setEnableProctoring={setEnableProctoring}
                        proctoringSettings={proctoringSettings}
                        setProctoringSettings={setProctoringSettings}
                    />

                    {questions.length > 0 && (
                        <ScoringPanel scoring={scoring} hasScoringErrors={hasScoringErrors} />
                    )}

                    <div className={styles.questionsArea}>
                        {questions.map((q) => (
                            <QuestionEditor
                                key={q.id}
                                q={q}
                                scoring={scoring}
                                updateQuestion={updateQuestion}
                                removeQuestion={removeQuestion}
                                handleImageUpload={handleImageUpload}
                                updateChoice={updateChoice}
                                addChoiceOption={addChoiceOption}
                                removeChoiceOption={removeChoiceOption}
                                setCorrectOptionMC={setCorrectOptionMC}
                                toggleCorrectOptionCB={toggleCorrectOptionCB}
                            />
                        ))}

                        <div className={styles.addQuestionBar}>
                             <select className={`${styles.selectInput} ${styles.inlineStyle2}`} value={newQuestionType} onChange={(e) => setNewQuestionType(e.target.value)}>
                                <option value="MultipleChoiceQuestion">Multiple Choice</option>
                                <option value="CheckBoxQuestion">Check Box</option>
                                <option value="TrueFalseQuestion">True / False</option>
                                <option value="ShortAnswerQuestion">Short Answer</option>
                                <option value="LongAnswerQuestion">Long Answer</option>
                            </select>
                            <Button onClick={addQuestion}>+ Add Question</Button>
                        </div>
                    </div>

                    <div className={styles.actionBar}>
                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting || hasScoringErrors}
                            style={hasScoringErrors ? { backgroundColor: '#a8a29e', cursor: 'not-allowed' } : {}}
                        >
                            {isSubmitting ? "Saving..." : (isEditMode ? "Update Quiz" : "Create Quiz")}
                        </Button>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default CreateQuizPage;
