export const MAX_SCORE = 10;

export const calculateScoring = (questions) => {
    let assignedPoints = 0;
    let unassignedCount = 0;

    questions.forEach(q => {
        if (q.points && !isNaN(q.points) && Number(q.points) > 0) {
            assignedPoints += Number(q.points);
        } else {
            unassignedCount += 1;
        }
    });

    const isOverLimit = assignedPoints > MAX_SCORE;

    let autoPointsPerQuestion = 0;
    if (!isOverLimit && unassignedCount > 0) {
        autoPointsPerQuestion = (MAX_SCORE - assignedPoints) / unassignedCount;
    }

    const isMissingPoints = assignedPoints === MAX_SCORE && unassignedCount > 0;
    const isUnderLimit = assignedPoints < MAX_SCORE && unassignedCount === 0;

    return {
        assignedPoints,
        unassignedCount,
        autoPointsPerQuestion,
        isOverLimit,
        isMissingPoints,
        isUnderLimit
    };
};
