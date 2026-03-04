import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import '@assets/scss/audio-player.scss';

interface AudioPlayerProps {
    audioSrc: string;
    title?: string;
    showWaveform?: boolean;
    autoPlay?: boolean;
}

export interface AudioPlayerRef {
    seekTo: (time: number) => void;
    play: () => void;
    pause: () => void;
}

const AudioPlayer = forwardRef<AudioPlayerRef, AudioPlayerProps>(({ 
    audioSrc, 
    title = "Call Recording",
    showWaveform = false ,
    autoPlay = false
}, ref) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const audioRef = useRef<HTMLAudioElement>(null);

    // Expose methods to parent component
    useImperativeHandle(ref, () => ({
        seekTo: (time: number) => {
            if (audioRef.current) {
                audioRef.current.currentTime = time;
                setCurrentTime(time);
            }
        },
        play: () => {
            if (audioRef.current) {
                audioRef.current.play();
            }
        },
        pause: () => {
            if (audioRef.current) {
                audioRef.current.pause();
            }
        }
    }));

    // Reset audio when audioSrc changes
    useEffect(() => {
        if (audioRef.current && audioSrc) {
            audioRef.current.src = audioSrc;
            audioRef.current.load();
            setCurrentTime(0);
            setDuration(0);
            setIsPlaying(false);
        }
    }, [audioSrc]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const updateTime = () => {
            // Only update time if not dragging to prevent seekbar jumping
            if (!isDragging) {
                setCurrentTime(audio.currentTime);
            }
        };
        const updateDuration = () => setDuration(audio.duration);
        const handleEnded = () => setIsPlaying(false);
        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);
        const handleError = (e: Event) => {
            console.error('Audio error:', e);
            setIsPlaying(false);
        };

        audio.addEventListener('timeupdate', updateTime);
        audio.addEventListener('loadedmetadata', updateDuration);
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('play', handlePlay);
        audio.addEventListener('pause', handlePause);
        audio.addEventListener('error', handleError);

        return () => {
            audio.removeEventListener('timeupdate', updateTime);
            audio.removeEventListener('loadedmetadata', updateDuration);
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('play', handlePlay);
            audio.removeEventListener('pause', handlePause);
            audio.removeEventListener('error', handleError);
        };
    }, [isDragging]);

    useEffect(() => {
        if (autoPlay) {
            togglePlay();
        }
    }, [autoPlay]);

    const togglePlay = async () => {
        if (audioRef.current) {
            try {
                setIsLoading(true);
                if (isPlaying) {
                    audioRef.current.pause();
                } else {
                    // Ensure audio is loaded before playing
                    if (audioRef.current.readyState < 2) {
                        
                        await new Promise((resolve, reject) => {
                            const audio = audioRef.current!;
                            const handleCanPlay = () => {
                                audio.removeEventListener('canplay', handleCanPlay);
                                audio.removeEventListener('error', handleError);
                                resolve(true);
                            };
                            const handleError = (e: Event) => {
                                audio.removeEventListener('canplay', handleCanPlay);
                                audio.removeEventListener('error', handleError);
                                reject(e);
                            };
                            audio.addEventListener('canplay', handleCanPlay);
                            audio.addEventListener('error', handleError);
                            audio.load();
                        });
                    }
                    await audioRef.current.play();
                }
            } catch (error) {
                console.error('Error playing audio:', error);
                setIsPlaying(false);
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = parseFloat(e.target.value);
        setCurrentTime(time);
        // Update audio time continuously while dragging for smooth scrubbing
        if (audioRef.current) {
            audioRef.current.currentTime = time;
        }
    };

    const handleSeekMouseDown = () => {
        setIsDragging(true);
    };

    const handleSeekMouseUp = (e: React.MouseEvent<HTMLInputElement> | React.TouchEvent<HTMLInputElement>) => {
        setIsDragging(false);
        const time = parseFloat(e.currentTarget.value);
        if (audioRef.current) {
            audioRef.current.currentTime = time;
            setCurrentTime(time);
        }
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
        if (audioRef.current) {
            audioRef.current.volume = newVolume;
        }
    };

    const toggleMute = () => {
        if (audioRef.current) {
            audioRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <div className="custom-audio-player">
            <button 
                className="play-pause-btn"
                onClick={togglePlay}
                disabled={isLoading}
            >
                <i className={`material-icons-two-tone ${isLoading ? 'hourglass_empty' : isPlaying ? 'pause' : 'play_arrow'}`}>
                    {isLoading ? 'hourglass_empty' : isPlaying ? 'pause' : 'play_arrow'}
                </i>
            </button>
            <div className="waveform-progress-container">
                <input
                    type="range"
                    min="0"
                    max={duration || 0}
                    value={currentTime}
                    step="0.1"
                    className="audio-seekbar"
                    onChange={handleSeek}
                    onMouseDown={handleSeekMouseDown}
                    onMouseUp={handleSeekMouseUp}
                    onTouchStart={handleSeekMouseDown}
                    onTouchEnd={handleSeekMouseUp}
                />
            </div>
            <span className="audio-time">
                {formatTime(currentTime)} / {formatTime(duration)}
            </span>
            <audio
                ref={audioRef}
                src={audioSrc}
                preload="metadata"
            />
        </div>
    );
});

export default AudioPlayer; 