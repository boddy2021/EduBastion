import React from 'react';
import styles from './TakeQuizPage.module.css';

function SubmitConfirmModal({ onCancel, onConfirm }) {
    return (
        <div className={styles.flexRow}>
            <div className={styles.inlineStyle6}>
                <h2 className={styles.spacedTop}>Submit test?</h2>
                <p className={styles.spacedBottom}>Are you sure you want to submit the test?</p>
                <div className={styles.flexRow2}>
                    <button onClick={onCancel} className={styles.inlineStyle7}>
                        Cancel
                    </button>
                    <button onClick={onConfirm} className={styles.inlineStyle8}>
                        Submit
                    </button>
                </div>
            </div>
        </div>
    );
}

export default SubmitConfirmModal;
