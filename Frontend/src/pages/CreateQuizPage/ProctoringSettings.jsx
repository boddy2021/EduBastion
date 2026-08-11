import React from 'react';
import styles from './CreateQuizPage.module.css';

function ProctoringSettings({ enableProctoring, setEnableProctoring, proctoringSettings, setProctoringSettings }) {
    return (
        <div className={styles.proctoringCard}>
            <div className={styles.proctoringHeader}>
                <div>
                    <h3 className={styles.proctoringTitle}>🛡️ Anti-Cheat & Proctoring</h3>
                    <p className={styles.proctoringDesc}>Enable automated monitoring for this exam.</p>
                </div>
                <label className={styles.toggleSwitch}>
                    <input
                        type="checkbox"
                        checked={enableProctoring}
                        onChange={(e) => setEnableProctoring(e.target.checked)}
                    />
                    <span className={styles.slider}></span>
                </label>
            </div>

            {enableProctoring && (
                <div className={styles.proctoringOptionsGrid}>
                    <label className={styles.checkboxLabel}>
                        <input
                            type="checkbox"
                            className={styles.customCheckbox}
                            checked={proctoringSettings.camera}
                            onChange={(e) => setProctoringSettings({...proctoringSettings, camera: e.target.checked})}
                        />
                        <span className={styles.checkboxText}>
                            <strong>Webcam Face Tracking</strong>
                            <br/><small>Detects missing or multiple faces</small>
                        </span>
                    </label>

                    <label className={styles.checkboxLabel}>
                        <input
                            type="checkbox"
                            className={styles.customCheckbox}
                            checked={proctoringSettings.audio}
                            onChange={(e) => setProctoringSettings({...proctoringSettings, audio: e.target.checked})}
                        />
                        <span className={styles.checkboxText}>
                            <strong>Microphone Analysis</strong>
                            <br/><small>Detects whispering or reading aloud</small>
                        </span>
                    </label>

                    <label className={styles.checkboxLabel}>
                        <input
                            type="checkbox"
                            className={styles.customCheckbox}
                            checked={proctoringSettings.tab_switch}
                            onChange={(e) => setProctoringSettings({...proctoringSettings, tab_switch: e.target.checked})}
                        />
                        <span className={styles.checkboxText}>
                            <strong>Tab Switching (Focus)</strong>
                            <br/><small>Detects if the student leaves the exam tab</small>
                        </span>
                    </label>
                </div>
            )}
        </div>
    );
}

export default ProctoringSettings;
