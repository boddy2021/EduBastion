export const filterTests = (tests, submissions, userRole, quizFilter) => {
    const now = new Date();
    return tests.filter(test => {
        const startTime = test.start_time ? new Date(test.start_time) : null;
        const duration = parseInt(test.time_allocated_minutes, 10);
        const validDuration = isNaN(duration) ? 0 : duration;

        let endTime = null;
        if (startTime) {
            endTime = new Date(startTime.getTime() + validDuration * 60000);
        }

        const isExpired = endTime ? now > endTime : false;
        const isSubmitted = !!submissions[test.id];

        if (userRole === 'student') {
            if (quizFilter === 'active') return !isExpired && !isSubmitted;
            if (quizFilter === 'missed') return isExpired && !isSubmitted;
            if (quizFilter === 'completed') return isSubmitted;
        } else {
            if (quizFilter === 'active') return !isExpired;
            return isExpired;
        }
        return false;
    });
};

export const checkIsExpired = (test) => {
    if (!test.start_time) return false;
    const now = new Date();
    const start = new Date(test.start_time);
    const duration = parseInt(test.time_allocated_minutes, 10) || 0;
    const end = new Date(start.getTime() + duration * 60000);
    return now > end;
};
