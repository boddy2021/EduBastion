import React from 'react';
import styles from './CreateQuizPage.module.css';
import Icon from '../../components/UI/Icon';
import trashIcon from '../../assets/icons/trash.svg?raw';
import xIcon from '../../assets/icons/x.svg?raw';

function QuestionEditor({
    q,
    scoring,
    updateQuestion,
    removeQuestion,
    handleImageUpload,
    updateChoice,
    addChoiceOption,
    removeChoiceOption,
    setCorrectOptionMC,
    toggleCorrectOptionCB
}) {
    return (
        <div className={styles.questionCard}>

            <div className={styles.questionHeaderGroup}>
                <span className={styles.typeBadge}>{q.type}</span>

                <div className={styles.headerRightControls}>
                    <div className={styles.pointsGroup}>
                        <label className={styles.pointsLabel}>Points:</label>
                        <input
                            type="number"
                            min="0"
                            step="0.5"
                            className={styles.pointsInput}
                            placeholder={`Auto (${scoring.autoPointsPerQuestion.toFixed(2)})`}
                            value={q.points}
                            onChange={(e) => updateQuestion(q.id, 'points', e.target.value)}
                        />
                    </div>
                    <button
                        className={styles.removeQuestionBtn}
                        onClick={() => removeQuestion(q.id)}
                        title="Delete Question"
                    >
                        <Icon svg={trashIcon} />
                    </button>
                </div>
            </div>

            <input className={`${styles.textInput} ${styles.spacedBottom}`} placeholder="Question Text" value={q.text} onChange={(e) => updateQuestion(q.id, 'text', e.target.value)}/>
            <input className={`${styles.textInput} ${styles.inlineStyle}`} placeholder="Links (comma separated)" value={q.linksString || ''} onChange={(e) => updateQuestion(q.id, 'linksString', e.target.value)}/>

            <div className={styles.spacedBottom2}>
                <input type="file" onChange={(e) => handleImageUpload(q.id, e.target.files[0])} />
                {q.image_url && <span className={styles.noteText}> Image Set</span>}
            </div>

            {q.type === 'MultipleChoiceQuestion' && q.choices.map((c, i) => (
                <div key={i} className={styles.optionRow}>
                    <input type="radio" checked={q.answer === i} onChange={() => setCorrectOptionMC(q.id, i)} />
                    <input className={styles.textInput} value={c} onChange={(e) => updateChoice(q.id, i, e.target.value)} />

                    <button className={styles.removeOptionBtn} onClick={() => removeChoiceOption(q.id, i)} title="Remove Option">
                        <Icon svg={xIcon} />
                    </button>
                </div>
            ))}
            {q.type === 'MultipleChoiceQuestion' && <button className={styles.addOptionBtn} onClick={() => addChoiceOption(q.id)}>+ Add Option</button>}

            {q.type === 'CheckBoxQuestion' && q.choices.map((c, i) => (
                <div key={i} className={styles.optionRow}>
                    <input type="checkbox" checked={q.answer && q.answer.includes(i)} onChange={() => toggleCorrectOptionCB(q.id, i)} />
                    <input className={styles.textInput} value={c} onChange={(e) => updateChoice(q.id, i, e.target.value)} />

                    <button className={styles.removeOptionBtn} onClick={() => removeChoiceOption(q.id, i)} title="Remove Option">
                        <Icon svg={xIcon} />
                    </button>
                </div>
            ))}
            {q.type === 'CheckBoxQuestion' && <button className={styles.addOptionBtn} onClick={() => addChoiceOption(q.id)}>+ Add Option</button>}

            {q.type === 'TrueFalseQuestion' && (
                <div className={styles.optionRow}>
                    <select className={styles.selectInput} value={q.answer.toString()} onChange={(e) => updateQuestion(q.id, 'answer', e.target.value === 'true')}>
                        <option value="true">True</option>
                        <option value="false">False</option>
                    </select>
                </div>
            )}
            {q.type === 'ShortAnswerQuestion' && <input className={styles.textInput} value={q.answer} onChange={(e) => updateQuestion(q.id, 'answer', e.target.value)} />}
        </div>
    );
}

export default QuestionEditor;
