import { useState, useEffect, useRef } from 'react';
import { uploadProctoringImage } from './quizApi';

export function useProctoring({ quiz, quizId, userId, isExamActive, isExamActiveRef, isFinishingRef, setIsExamActive }) {
    const [isCheating, setIsCheating] = useState(false);
    const [cheatCount, setCheatCount] = useState(0);

    const totalCheatTimeRef = useRef(0);
    const cheatStartTimeRef = useRef(null);
    const keysPressedRef = useRef([]);
    const faceNotFoundRef = useRef(0);
    const multipleFacesRef = useRef(false);

    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const webcamIntervalRef = useRef(null);
    const recognitionRef = useRef(null);
    const audioTranscriptRef = useRef("");

    useEffect(() => {
        return () => {
            if (webcamIntervalRef.current) clearInterval(webcamIntervalRef.current);
            if (videoRef.current && videoRef.current.srcObject) {
                videoRef.current.srcObject.getTracks().forEach(track => track.stop());
            }
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, []);

    useEffect(() => {
        if (!isExamActive) return;

        const isProctoringEnabled = quiz?.enable_proctoring;
        const settings = quiz?.proctoring_settings || { tab_switch: false };

        const handleFullscreenChange = () => {
            if (isFinishingRef.current) return;
            if (!document.fullscreenElement && isExamActiveRef.current && isProctoringEnabled && settings.tab_switch) {
                triggerCheatOverlay();
            }
        };

        const handleBlur = () => {
            if (isFinishingRef.current) return;
            if (isExamActiveRef.current && isProctoringEnabled && settings.tab_switch) {
                triggerCheatOverlay();
            }
        };

        const handleKeyDown = (e) => {
            if (!isExamActiveRef.current || isCheating) return;

            const forbiddenKeys = ['F5', 'F11', 'F12', 'Escape', 'PrintScreen'];
            const isCtrlCombo = (e.ctrlKey || e.metaKey) && e.key.length === 1;
            const isAltCombo = e.altKey && e.key !== 'Alt';
            const isFunctionKey = forbiddenKeys.includes(e.key);

            if (isCtrlCombo || isAltCombo || isFunctionKey) {
                const prefix = (e.ctrlKey ? 'Ctrl+' : '') + (e.altKey ? 'Alt+' : '') + (e.shiftKey ? 'Shift+' : '');
                const combo = prefix + e.key.toUpperCase();
                if (!keysPressedRef.current.includes(combo)) keysPressedRef.current.push(combo);
            }

            if (isProctoringEnabled) {
                const blockCtrl = (e.ctrlKey || e.metaKey) && ['r', 'p', 'a', 'f', 't', 'n', 'w', 'c', 'v'].includes(e.key.toLowerCase());
                if (isFunctionKey || blockCtrl) e.preventDefault();
            }
        };

        const handleContextMenu = (e) => {
            if (isExamActiveRef.current && isProctoringEnabled) {
                if (!keysPressedRef.current.includes('RightClick')) keysPressedRef.current.push('RightClick');
                e.preventDefault();
            }
        };

        const handleCopyPaste = (e) => {
            if (isExamActiveRef.current && isProctoringEnabled) {
                e.preventDefault();
            }
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        window.addEventListener('blur', handleBlur);
        window.addEventListener('keydown', handleKeyDown);
        document.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('copy', handleCopyPaste);
        document.addEventListener('paste', handleCopyPaste);
        document.addEventListener('cut', handleCopyPaste);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            window.removeEventListener('blur', handleBlur);
            window.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('copy', handleCopyPaste);
            document.removeEventListener('paste', handleCopyPaste);
            document.removeEventListener('cut', handleCopyPaste);
        };
    }, [isExamActive, isCheating, quiz]);

    const startAudioProctoring = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            console.warn("Speech Recognition API is not supported in this browser.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = quiz?.language || 'en-US';

        recognition.onresult = (event) => {
            let finalTranscript = "";
            for (let i = event.resultIndex; i < event.results.length; i++) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript + " ";
                }
            }

            if (finalTranscript.trim().length > 0) {
                audioTranscriptRef.current += finalTranscript;
                console.log("Audio captured:", finalTranscript);
            }
        };

        recognition.onerror = (event) => {
            console.error("Microphone error:", event.error);
        };

        recognition.onend = () => {
            if (isExamActiveRef.current) {
                setTimeout(() => {
                    try {
                        recognition.start();
                    } catch(e) {
                        console.error("Failed to restart microphone:", e);
                    }
                }, 1000);
            }
        };

        try {
            recognition.start();
            recognitionRef.current = recognition;
        } catch(e) {
            console.error("Failed to start microphone:", e);
        }
    };

    const startSecureExam = async () => {
        const isProctoringEnabled = quiz?.enable_proctoring;
        const settings = quiz?.proctoring_settings || { camera: false, audio: false, tab_switch: false };

        try {
            if (isProctoringEnabled) {
                const needVideo = settings.camera === true;
                const needAudio = settings.audio === true;
                const needFullscreen = settings.tab_switch === true;

                if (needVideo || needAudio) {
                    try {
                        const stream = await navigator.mediaDevices.getUserMedia({
                            video: needVideo,
                            audio: needAudio
                        });

                        if (needVideo && videoRef.current) {
                            videoRef.current.srcObject = stream;
                            webcamIntervalRef.current = setInterval(captureAndSendImage, 15000);
                        }
                    } catch (hardwareErr) {
                        console.error("Eroare acces hardware:", hardwareErr);
                        alert("Error!");
                        return;
                    }
                }

                if (needAudio) {
                    try {
                        startAudioProctoring();
                    } catch (audioErr) {
                        console.warn("Error starting speech recognition:", audioErr);
                    }
                }

                if (needFullscreen) {
                    try {
                        if (!document.fullscreenElement) {
                            await document.documentElement.requestFullscreen();
                        }
                    } catch (fsErr) {
                        console.warn("Fullscreen Error:", fsErr);
                    }
                }
            }

            setIsExamActive(true);
            isExamActiveRef.current = true;

        } catch (err) {
            console.error("Forcing full screen:", err);
            setIsExamActive(true);
            isExamActiveRef.current = true;
        }
    };

    const captureAndSendImage = async () => {
        if (!videoRef.current || !canvasRef.current || !userId) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (video.videoWidth === 0 || video.videoHeight === 0) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(async (blob) => {
            if (!blob) return;

            const formData = new FormData();
            formData.append("quiz_id", quizId);
            formData.append("student_id", userId);
            formData.append("image", blob, `snapshot_${Date.now()}.jpg`);

            try {
                const response = await uploadProctoringImage(formData);
                if (response.ok) {
                    const data = await response.json();
                    if (data.faces_detected === 0) faceNotFoundRef.current += 1;
                    else if (data.faces_detected > 1) multipleFacesRef.current = true;
                }
            } catch (err) { console.error("Eroare webcam upload", err); }
        }, 'image/jpeg', 0.8);
    };

    const triggerCheatOverlay = () => {
        setIsCheating(prev => {
            if (prev) return prev;
            setCheatCount(c => c + 1);
            cheatStartTimeRef.current = Date.now();
            return true;
        });
    };

    const returnToExam = async () => {
        try {
            if (quiz?.proctoring_settings?.tab_switch) {
                await document.documentElement.requestFullscreen();
            }
            setIsCheating(false);
            if (cheatStartTimeRef.current) {
                const timeAway = (Date.now() - cheatStartTimeRef.current) / 1000;
                totalCheatTimeRef.current += timeAway;
                cheatStartTimeRef.current = null;
            }
        } catch (err) {
            alert("Press the button to resume in Full Screen.");
        }
    };

    const stopProctoring = () => {
        if (webcamIntervalRef.current) clearInterval(webcamIntervalRef.current);
        if (videoRef.current && videoRef.current.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(track => track.stop());
        }
        if (recognitionRef.current) recognitionRef.current.stop();
    };

    const getProctoringData = () => {
        let finalTime = totalCheatTimeRef.current;
        if (cheatStartTimeRef.current) {
            finalTime += (Date.now() - cheatStartTimeRef.current) / 1000;
        }

        return {
            quiz_id: parseInt(quizId),
            student_id: userId,
            leave_count: cheatCount,
            time_away_seconds: parseFloat(finalTime.toFixed(1)),
            key_logs: keysPressedRef.current,
            face_not_found_warnings: faceNotFoundRef.current,
            multiple_faces_detected: multipleFacesRef.current,
            audio_transcript: audioTranscriptRef.current.trim(),
            audio_language: quiz?.language || 'ro-RO'
        };
    };

    return {
        isCheating,
        videoRef,
        canvasRef,
        startSecureExam,
        returnToExam,
        stopProctoring,
        getProctoringData
    };
}
