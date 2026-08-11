import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import Button from '../../components/UI/Button';
import styles from './QuizResultPage.module.css';

/**
 * AI authorship verdict for a single essay answer.
 *
 * Shows four distinct states rather than only flagging AI. "We have not
 * checked this" and "we checked it and it reads as human-written" are
 * different claims, and a professor deciding on academic misconduct has to be
 * able to tell them apart. Confidence is always shown, in both directions.
 */
function AiVerdictBox({ item, fallbackIsAi, fallbackConf }) {
    const verdict = item.ai_verdict || (fallbackIsAi ? 'ai' : 'not_analyzed');
    const confidence = item.ai_confidence ?? fallbackConf ?? 0;

    if (item.ai_analysis_pending || verdict === 'pending') {
        return (
            <div className={styles.aiAlertBox} data-verdict="pending">
                <div>
                    <strong>AI analysis in progress…</strong>
                    <div>This answer has not been checked yet. Refresh in a moment.</div>
                </div>
            </div>
        );
    }

    if (verdict === 'ai') {
        return (
            <div className={styles.aiAlertBox} data-verdict="ai">
                <div>
                    <strong>Likely AI-generated</strong>
                    <div>Confidence: {confidence}%</div>
                    {item.ai_score != null && (
                        <div className={styles.aiScoreLine}>
                            P(AI) = {item.ai_score} · decision support only
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (verdict === 'uncertain') {
        return (
            <div className={styles.aiAlertBox} data-verdict="uncertain">
                <div>
                    <strong>Uncertain</strong>
                    <div>The model leans machine-generated ({confidence}%) but not
                    enough to flag. Read the answer yourself.</div>
                    {item.ai_score != null && (
                        <div className={styles.aiScoreLine}>
                            P(AI) = {item.ai_score} · decision support only
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (verdict === 'human') {
        return (
            <div className={styles.aiAlertBox} data-verdict="human">
                <div>
                    <strong>Likely human-written</strong>
                    <div>Confidence: {confidence}%</div>
                    {item.ai_score != null && (
                        <div className={styles.aiScoreLine}>
                            P(AI) = {item.ai_score} · decision support only
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className={styles.aiAlertBox} data-verdict="none">
            <div>
                <strong>Not analysed</strong>
                <div>AI detection was disabled for this quiz.</div>
            </div>
        </div>
    );
}

function QuizResultPage() {
    const { submissionId } = useParams();
    const navigate = useNavigate();
    const userRole = localStorage.getItem('userRole');

    const [result, setResult] = useState(null);
    const [newScore, setNewScore] = useState(0);
    const [showDetailedLogs, setShowDetailedLogs] = useState(false); 

    useEffect(() => {
        fetch(`http://127.0.0.1:8000/api/quizzes/submissions/${submissionId}/details`)
            .then(res => res.json())
            .then(data => {
                setResult(data);
                setNewScore(data.score);
            });
    }, [submissionId]);

    const handleUpdateScore = async () => {
        await fetch(`http://127.0.0.1:8000/api/quizzes/submissions/${submissionId}/grade`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ final_score: parseFloat(newScore) })
        });
        alert("Score updated!");
        window.location.reload();
    };

    const normalizeBool = (v) =>
        v === true ? "True" : v === false ? "False" : v;

    const parseStudentAnswer = (answer) => {
        let str = "";
        let isAi = false;
        let aiConf = 0;
        if (typeof answer === 'object' && answer !== null && 'text' in answer) {
            str = String(normalizeBool(answer.text) ?? "");
            isAi = answer.is_ai_generated || false;
            aiConf = answer.ai_confidence || 0;
        } else {
            str = String(normalizeBool(answer) ?? "");
        }

        const attachmentMatch = str.match(/\[ATTACHMENT: (.*?)\]/);

        if (attachmentMatch) {
            const imageUrl = attachmentMatch[1]; 
            const textOnly = str.replace(attachmentMatch[0], "").trim(); 
            return { text: textOnly, image: imageUrl, isAi, aiConf };
        }

        return { text: str, image: null, isAi, aiConf };
    };

    if (!result) return <div className={styles.inlineStyle}>Loading...</div>;

    const report = result?.proctoring_report;

    return (
        <div className={styles.container}>
            <Navbar />
            <main className={styles.mainContent}>
                <div className={styles.card}>
                    <div className={styles.header}>
                        <h1 className={styles.title}>{result.quiz_title} Results</h1>
                        <div className={styles.scoreBadge}>
                            {result.status === 'pending_review' ? 'Pending Review' : `Score: ${result.score} / 10`}
                        </div>
                    </div>

                    {userRole === 'professor' && (
                        <>
                            {report && (
                                <section className={styles.integritySection}>
                                    <div className={styles.integrityHeader}>
                                        <h2 className={styles.integrityTitle}>🛡️ Integrity Report</h2>
                                        <div className={styles.probabilityBadge} data-risk={report.cheating_probability > 50 ? 'high' : 'low'}>
                                            {report.cheating_probability}% Fraud Probability
                                        </div>
                                    </div>

                                    <div className={styles.integrityGrid}>
                                        <div className={styles.statBox}>
                                            <label>Trust Score</label>
                                            <div className={`${styles.statValue} ${report.trust_score < 60 ? styles.trustLow : styles.trustHigh}`}>
                                                {report.trust_score}/100
                                            </div>
                                        </div>

                                        <div className={styles.statBox}>
                                            <label>Tab Switches</label>
                                            <div className={styles.statValue}>
                                                {report.leave_count} <span className={styles.subVal}>({report.time_away_seconds}s away)</span>
                                            </div>
                                        </div>

                                        <div className={styles.statBox}>
                                            <label>Face Warnings</label>
                                            <div className={styles.statValue}>{report.face_warnings}</div>
                                        </div>

                                        <div className={styles.statBox}>
                                            <label>Audio Activity</label>
                                            <div className={styles.statValue}>{report.speech_detected ? " Yes" : " No"}</div>
                                        </div>

                                        <div className={styles.statBox}>
                                            <label>Multiple Faces</label>
                                            <div className={styles.statValue}>{report.multiple_faces ? " Yes" : " No"}</div>
                                        </div>

                                        <div className={styles.statBox}>
                                            <label>AI Text Prob</label>
                                            <div className={styles.statValue}>{(report.ai_text_probability || 0).toFixed(2)}%</div>
                                        </div>
                                    </div>

                                    <div className={styles.detailsToggle} onClick={() => setShowDetailedLogs(!showDetailedLogs)}>
                                        {showDetailedLogs ? "▼ Hide Detailed Logs" : "▶ Show Detailed Logs"}
                                    </div>

                                    {showDetailedLogs && (
                                        <div className={styles.expandedLogs}>
                                            <div className={styles.logSection}>
                                                <h4> Voice & Audio Analysis</h4>
                                                <div className={styles.transcriptBox}>
                                                    <strong>Transcript:</strong> 
                                                    <p>"{report.detailed_logs?.voice_analysis?.transcript || "No audio captured."}"</p>
                                                </div>
                                                {report.detailed_logs?.voice_analysis?.fraud_reasons?.map((reason, i) => (
                                                    <div key={i} className={styles.flagItem}>🚩 {reason}</div>
                                                ))}
                                                {report.detailed_logs?.voice_analysis?.has_cheated === false && (
                                                    <p className={styles.inlineStyle2}>✓ No suspicious audio detected.</p>
                                                )}
                                            </div>

                                            <div className={styles.logSection}>
                                                <h4> Keyboard Activity</h4>
                                                {report.detailed_logs?.keyboard_analysis?.suspicious_keys_pressed?.length > 0 ? (
                                                    <p className={styles.inlineStyle3}>Suspicious keys pressed: <strong className={styles.noteText}>{report.detailed_logs.keyboard_analysis.suspicious_keys_pressed.join(", ")}</strong></p>
                                                ) : (
                                                    <p className={styles.noteText2}>✓ No suspicious keyboard activity.</p>
                                                )}
                                            </div>

                                            <div className={styles.logSection}>
                                                <h4> AI Content Detection</h4>
                                                <p className={styles.inlineStyle3}>Highest AI Probability found: <strong>{(report.detailed_logs?.ai_analysis?.highest_ai_prob || 0).toFixed(2)}%</strong></p>
                                                <p className={styles.inlineStyle3}>AI Frauds detected: <strong>{report.detailed_logs?.ai_analysis?.ai_frauds_detected || 0}</strong></p>
                                            </div>
                                        </div>
                                    )}
                                </section>
                            )}

                            <div className={styles.gradingArea}>
                                <h3 className={styles.inlineStyle4}>Teacher Grading Area</h3>
                                <div className={styles.flexRow}>
                                    <label className={styles.inlineStyle5}>Override Final Score (0-10): </label>
                                    <input 
                                        type="number" 
                                        value={newScore} 
                                        onChange={(e) => setNewScore(e.target.value)} 
                                        className={styles.gradingInput}
                                    />
                                    <button onClick={handleUpdateScore} className={styles.gradingBtn}>Save Grade</button>
                                </div>
                            </div>
                        </>
                    )}

                    <div className={styles.questionsList}>
                        {result.details.map((item, idx) => {
                            const { text, image, isAi, aiConf } = parseStudentAnswer(item.user_answer);

                            const finalIsAi = isAi || item.is_ai_generated;
                            const finalAiConf = aiConf || item.ai_confidence;

                            let pointsDisplay = "";
                            let pointsClass = styles.pointsNeutral;

                            const maxPoints = Number(item.points) || 0; 

                            if (item.manual_review) {
                                pointsDisplay = `[ Max: ${maxPoints} Points ]`;
                                pointsClass = styles.pointsReview;
                            } else if (item.is_correct) {
                                pointsDisplay = `[ +${maxPoints} Points ]`;
                                pointsClass = styles.pointsCorrect;
                            } else {
                                pointsDisplay = `[ 0 / ${maxPoints} Points ]`;
                                pointsClass = styles.pointsWrong;
                            }

                            return (
                                <div key={idx} className={`${styles.resultCard} ${item.is_correct ? styles.correctBorder : (item.manual_review ? styles.manualBorder : styles.wrongBorder)}`}>
                                    <div className={styles.qHeader}>
                                        <h3 className={styles.qText}>Q{idx + 1}: {item.question_text}</h3>
                                        {maxPoints > 0 && (
                                            <span className={`${styles.pointsBadge} ${pointsClass}`}>
                                                {pointsDisplay}
                                            </span>
                                        )}
                                    </div>

                                    {item.image_url && <img src={item.image_url} alt="Q Attachment" className={styles.inlineStyle6} />}

                                    <div className={styles.answerSection}>
                                        <div className={styles.userAnswer}>
                                            <strong>Student Answer:</strong> <br/>
                                            {text && <span className={styles.inlineStyle7}>{text}</span>}

                                            {image && (
                                                <div className={styles.spacedTop}>
                                                    <div className={styles.inlineStyle8}>Student attachment:</div>
                                                    <a href={image} target="_blank" rel="noreferrer">
                                                        <img src={image} alt="Student Upload" className={styles.inlineStyle9} />
                                                    </a>
                                                </div>
                                            )}
                                        </div>

                                        {userRole === 'professor' && item.manual_review && (
                                            <AiVerdictBox item={item} fallbackIsAi={finalIsAi} fallbackConf={finalAiConf} />
                                        )}

                                        {!item.is_correct && !item.manual_review && (
                                            <div className={styles.correctAnswer}>
                                                <strong>Correct Answer:</strong> {String(normalizeBool(item.correct_answer))}
                                            </div>
                                        )}

                                        {item.manual_review && <div className={styles.inlineStyle10}>Requires Manual Review</div>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className={styles.inlineStyle11}>
                        <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default QuizResultPage;