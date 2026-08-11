import { useEffect, useRef } from 'react';

export const formatTime = (secs) => {
    if (isNaN(secs) || secs < 0) return "00:00";
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return h > 0 ? `${h}:${m<10?'0'+m:m}:${s<10?'0'+s:s}` : `${m}:${s<10?'0'+s:s}`;
};

export function useQuizTimer({ serverStatus, setSecondsLeft, setSecondsToStart, onTimeUp }) {
    const timerRef = useRef(null);
    const onTimeUpRef = useRef(onTimeUp);

    useEffect(() => { onTimeUpRef.current = onTimeUp; }, [onTimeUp]);

    useEffect(() => {
        if (serverStatus === 'loading') return;
        if (timerRef.current) clearInterval(timerRef.current);

        timerRef.current = setInterval(() => {
            if (serverStatus === 'waiting') {
                setSecondsToStart(prev => {
                    if (prev <= 1) { window.location.reload(); return 0; }
                    return prev - 1;
                });
            } else if (serverStatus === 'active') {
                setSecondsLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current);
                        onTimeUpRef.current();
                        return 0;
                    }
                    return prev - 1;
                });
            }
        }, 1000);

        return () => clearInterval(timerRef.current);
    }, [serverStatus]);
}
