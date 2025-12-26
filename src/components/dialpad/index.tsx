
import React, { useState, useEffect, useRef } from 'react';
import { Phone, Mic, MicOff, Pause, Play, Hash, PhoneOff, PhoneForwarded, Volume2, VolumeX, ChevronDown, ChevronUp } from 'lucide-react';

const DialPad = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);
  const [showDialpad, setShowDialpad] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isRinging, setIsRinging] = useState(false);
  const [showNumberSection, setShowNumberSection] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // DTMF Frequencies for each button
  const dtmfFrequencies: { [key: string]: [number, number] } = {
    '1': [697, 1209], '2': [697, 1336], '3': [697, 1477],
    '4': [770, 1209], '5': [770, 1336], '6': [770, 1477],
    '7': [852, 1209], '8': [852, 1336], '9': [852, 1477],
    '*': [941, 1209], '0': [941, 1336], '#': [941, 1477]
  };

  // Play DTMF tone
  const playDTMF = (key: string) => {
    if (!dtmfFrequencies[key]) return;

    try {
      const audioContext = new ((window as any).AudioContext || (window as any).webkitAudioContext)();
      const [freq1, freq2] = dtmfFrequencies[key];
      
      const oscillator1 = audioContext.createOscillator();
      const oscillator2 = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator1.frequency.value = freq1;
      oscillator2.frequency.value = freq2;
      gainNode.gain.value = 0.3;
      
      oscillator1.connect(gainNode);
      oscillator2.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator1.start();
      oscillator2.start();
      
      setTimeout(() => {
        oscillator1.stop();
        oscillator2.stop();
        audioContext.close();
      }, 200);
    } catch (error) {
      console.log('Audio not available');
    }
  };

  // Handle number button click
  const handleNumberClick = (num: string) => {
    playDTMF(num);
    setPhoneNumber(prev => prev + num);
  };

  // Handle backspace
  const handleBackspace = () => {
    setPhoneNumber(prev => prev.slice(0, -1));
  };

  // Start call
  const handleCall = () => {
    if (phoneNumber.length > 0) {
      setIsRinging(true);
      setTimeout(() => {
        setIsRinging(false);
        setIsCallActive(true);
        startCallTimer();
      }, 2000);
    }
  };

  // End call
  const handleEndCall = () => {
    setIsCallActive(false);
    setIsRinging(false);
    setIsMuted(false);
    setIsPaused(false);
    setShowDialpad(false);
    setCallDuration(0);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  // Start call timer
  const startCallTimer = () => {
    timerRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  };

  // Format call duration
  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Toggle mute
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  // Toggle pause/hold
  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  // Toggle speaker
  const toggleSpeaker = () => {
    setIsSpeaker(!isSpeaker);
  };

  // Toggle dialpad visibility during call
  const toggleDialpad = () => {
    setShowDialpad(!showDialpad);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const dialpadButtons = [
    { num: '1', letters: '' },
    { num: '2', letters: 'ABC' },
    { num: '3', letters: 'DEF' },
    { num: '4', letters: 'GHI' },
    { num: '5', letters: 'JKL' },
    { num: '6', letters: 'MNO' },
    { num: '7', letters: 'PQRS' },
    { num: '8', letters: 'TUV' },
    { num: '9', letters: 'WXYZ' },
    { num: '*', letters: '' },
    { num: '0', letters: '+' },
    { num: '#', letters: '' }
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #f8f9fa, #e9ecef)', padding: '2rem' }}>
      <div className="container" style={{ maxWidth: isCallActive ? '350px' : '300px' }}>
        {/* In-Call Bar - Shown when call is active */}
        {isCallActive && (
          <div className="card mb-3" style={{ backgroundColor: '#ffffff', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
            <div className="card-body p-3">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div className="d-flex align-items-center gap-2">
                  <Phone className="text-success" size={20} />
                  <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#212529' }}>On Call</span>
                  <span style={{ fontSize: '0.875rem', fontFamily: 'monospace', color: '#6c757d' }}>{formatDuration(callDuration)}</span>
                </div>
                <button
                  onClick={() => setShowNumberSection(!showNumberSection)}
                  className="btn btn-link p-0"
                  style={{ color: '#6c757d' }}
                  title={showNumberSection ? 'Hide number' : 'Show number'}
                >
                  {showNumberSection ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
              </div>
              
              {showNumberSection && (
                <div className="text-center mb-3">
                  <div style={{ fontSize: '1.25rem', fontWeight: '600', color: '#212529' }} className="mb-2">{phoneNumber}</div>
                  {isPaused && <div style={{ fontSize: '0.875rem', color: '#fbbf24' }}>Call on Hold</div>}
                </div>
              )}

              {/* Control Buttons */}
              <div className="d-flex align-items-center justify-content-around">
                <button
                  onClick={toggleMute}
                  className="btn btn-sm rounded-circle"
                  style={{ 
                    width: '44px', 
                    height: '44px',
                    backgroundColor: isMuted ? '#ef4444' : '#e9ecef',
                    border: 'none',
                    color: isMuted ? 'white' : '#495057'
                  }}
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
                </button>

                <button
                  onClick={togglePause}
                  className="btn btn-sm rounded-circle"
                  style={{ 
                    width: '44px', 
                    height: '44px',
                    backgroundColor: isPaused ? '#fbbf24' : '#e9ecef',
                    border: 'none',
                    color: isPaused ? 'white' : '#495057'
                  }}
                  title={isPaused ? 'Resume' : 'Hold'}
                >
                  {isPaused ? <Play size={18} /> : <Pause size={18} />}
                </button>

                <button
                  onClick={toggleDialpad}
                  className="btn btn-sm rounded-circle"
                  style={{ 
                    width: '44px', 
                    height: '44px',
                    backgroundColor: '#e9ecef',
                    border: 'none',
                    color: '#495057'
                  }}
                  title="Show Dialpad"
                >
                  <Hash size={18} />
                </button>

                <button
                  onClick={toggleSpeaker}
                  className="btn btn-sm rounded-circle"
                  style={{ 
                    width: '44px', 
                    height: '44px',
                    backgroundColor: isSpeaker ? '#3b82f6' : '#e9ecef',
                    border: 'none',
                    color: isSpeaker ? 'white' : '#495057'
                  }}
                  title={isSpeaker ? 'Speaker Off' : 'Speaker On'}
                >
                  {isSpeaker ? <Volume2 size={18} /> : <VolumeX size={18} />}
                </button>

                <button
                  onClick={handleEndCall}
                  className="btn btn-sm rounded-circle"
                  style={{ 
                    width: '44px', 
                    height: '44px',
                    backgroundColor: '#ef4444',
                    border: 'none',
                    color: 'white'
                  }}
                  title="End Call"
                >
                  <PhoneOff size={18} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Ringing State */}
        {isRinging && (
          <div className="card mb-3" style={{ boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
            <div className="card-body p-5 text-center">
              <div className="mb-4" style={{ animation: 'pulse 1.5s infinite' }}>
                <Phone size={64} className="text-success mx-auto" />
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: '600' }} className="mb-2">{phoneNumber}</div>
              <div className="text-muted">Calling...</div>
              <button
                onClick={handleEndCall}
                className="btn btn-danger mt-4 px-4 py-2 rounded-pill"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Dialpad - Always shown when no call, or when toggled during call */}
        {(!isCallActive || showDialpad) && !isRinging && (
          <div className="card" style={{ boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
            <div className="card-body p-4">
              {/* Display */}
              <div className="mb-4 text-center">
                <div className="d-flex align-items-center justify-content-center gap-2 mb-2">
                  <Phone size={20} className="text-muted" />
                  <span className="text-muted" style={{ fontSize: '0.875rem' }}>
                    {isCallActive ? `On Call with ${phoneNumber}` : 'Enter Phone Number'}
                  </span>
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: '600', height: '3rem' }} className="d-flex align-items-center justify-content-center">
                  {phoneNumber || ''}
                </div>
                {isCallActive && (
                  <div className="text-muted" style={{ fontSize: '0.875rem', fontFamily: 'monospace' }}>
                    {formatDuration(callDuration)}
                  </div>
                )}
              </div>

              {/* Number Pad Grid */}
              <div className="row g-3 mb-4">
                {dialpadButtons.map((btn) => (
                  <div key={btn.num} className="col-4">
                    <button
                      onClick={() => handleNumberClick(btn.num)}
                      className="btn w-100"
                      style={{ 
                        aspectRatio: '1',
                        backgroundColor: '#f8f9fa',
                        border: '1px solid #dee2e6',
                        borderRadius: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#e9ecef';
                        e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#f8f9fa';
                        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                      }}
                    >
                      <span style={{ fontSize: '1.5rem', fontWeight: '600' }}>{btn.num}</span>
                      {btn.letters && (
                        <span className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>{btn.letters}</span>
                      )}
                    </button>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="d-flex align-items-center justify-content-center gap-3">
                <button
                  onClick={handleBackspace}
                  disabled={phoneNumber.length === 0}
                  className="btn btn-light px-4 py-2 rounded-pill"
                  style={{ fontWeight: '500' }}
                >
                  ← Delete
                </button>

                {!isCallActive ? (
                  <button
                    onClick={handleCall}
                    disabled={phoneNumber.length === 0}
                    className="btn btn-success px-4 py-2 rounded-pill d-flex align-items-center gap-2"
                    style={{ fontWeight: '500', boxShadow: '0 4px 6px rgba(34, 197, 94, 0.3)' }}
                  >
                    <Phone size={20} />
                    Call
                  </button>
                ) : (
                  <button
                    onClick={() => setShowDialpad(false)}
                    className="btn btn-secondary px-4 py-2 rounded-pill"
                    style={{ fontWeight: '500' }}
                  >
                    Close
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Info Text */}
        {/* <div className="text-center mt-3">
          <small className="text-muted">
            {!isCallActive && 'Click numbers to hear DTMF tones'}
            {isCallActive && !showDialpad && 'Click dialpad button to send DTMF during call'}
          </small>
        </div> */}
      </div>
    </div>
  );
};

export default DialPad;