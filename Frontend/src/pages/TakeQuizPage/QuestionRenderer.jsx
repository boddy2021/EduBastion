import React from 'react';
import styles from './TakeQuizPage.module.css';

function QuestionRenderer({ q, idx, answers, onAnswerChange, onCheckboxChange }) {
    return (
        <div className={styles.questionCard}>
            <h3 className={styles.qText}>{idx + 1}. {q.text}</h3>

            {q.image_url && (/\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(q.image_url)
                ? <img src={q.image_url} alt="Ref" className={styles.inlineStyle17} />
                : <div><a href={q.image_url} target="_blank" rel="noopener noreferrer">📎 Open attachment</a></div>
            )}

            {q.link && (
                <div><a href={q.link} target="_blank" rel="noopener noreferrer">🔗 {q.link}</a></div>
            )}

            {q.links && q.links.length > 0 && q.links.map((l, li) => (
                <div key={li}><a href={l} target="_blank" rel="noopener noreferrer">🔗 {l}</a></div>
            ))}

            {q.type === 'MultipleChoiceQuestion' && q.choices.map((c, i) => (
                <label key={i} className={styles.optionLabel}>
                    <input type="radio" name={`q-${idx}`} value={c} checked={answers[idx] === c} onChange={(e) => onAnswerChange(idx, e.target.value)} /> {c}
                </label>
            ))}

            {q.type === 'CheckBoxQuestion' && q.choices.map((c, i) => (
                <label key={i} className={styles.optionLabel}>
                    <input type="checkbox" checked={(Array.isArray(answers[idx]) && answers[idx].includes(c)) || false} onChange={() => onCheckboxChange(idx, c)} /> {c}
                </label>
            ))}

            {q.type === 'TrueFalseQuestion' && (
                <div className={styles.flexRow5}>
                    <label className={styles.optionLabel}><input type="radio" name={`q-${idx}`} value="True" checked={answers[idx] === true} onChange={() => onAnswerChange(idx, true)} /> True</label>
                    <label className={styles.optionLabel}><input type="radio" name={`q-${idx}`} value="False" checked={answers[idx] === false} onChange={() => onAnswerChange(idx, false)} /> False</label>
                </div>
            )}

            {q.type === 'ShortAnswerQuestion' && (
                <input className={styles.textInput} value={answers[idx]||''} onChange={(e) => onAnswerChange(idx, e.target.value)} />
            )}

            {q.type === 'LongAnswerQuestion' && (
                <textarea className={styles.textArea} rows={5} value={answers[idx]||''} onChange={(e) => onAnswerChange(idx, e.target.value)} />
            )}
        </div>
    );
}

export default QuestionRenderer;
