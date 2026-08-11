import React from 'react';
import styles from './CreateQuizPage.module.css';
import { MAX_SCORE } from './scoring';

function ScoringPanel({ scoring, hasScoringErrors }) {
    return (
        <div className={`${styles.scoringPanel} ${hasScoringErrors ? styles.scoringPanelError : ''}`}>
            <h3 className={styles.scoringTitle}> Scoring Breakdown (Max: {MAX_SCORE} points)</h3>
            <p className={styles.scoringText}>Total manual points assigned: <strong>{scoring.assignedPoints}</strong></p>

            {scoring.unassignedCount > 0 && !scoring.isOverLimit && (
                <p className={styles.scoringInfo}>
                      The remaining {scoring.unassignedCount} questions will be automatically worth <strong>{scoring.autoPointsPerQuestion.toFixed(2)} points</strong> each.
                </p>
            )}

            {scoring.isOverLimit && (
                <div className={styles.scoringErrorText}>
                      Error: You assigned {scoring.assignedPoints} points, which exceeds the maximum of {MAX_SCORE}!
                </div>
            )}

            {scoring.isMissingPoints && (
                <div className={styles.scoringErrorText}>
                      Error: You reached the max {MAX_SCORE} points, but there are still {scoring.unassignedCount} questions with 0 points!
                </div>
            )}

            {scoring.isUnderLimit && (
                <div className={styles.scoringWarningText}>
                      Warning: Total points are only {scoring.assignedPoints}. Please assign the remaining {MAX_SCORE - scoring.assignedPoints} points or leave questions blank to auto-calculate.
                </div>
            )}
        </div>
    );
}

export default ScoringPanel;
