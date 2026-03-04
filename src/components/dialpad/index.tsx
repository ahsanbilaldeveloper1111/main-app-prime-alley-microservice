
import React, { useState, useEffect, useRef } from 'react';
import { Phone, Search, PhoneOff, Mic, MicOff, Pause, Play, Grid3x3, MessageSquare, Clock, BellOff } from 'lucide-react';

const ProDialpad = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isRinging, setIsRinging] = useState(false);
  const [isIncoming, setIsIncoming] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // DTMF Frequencies
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
      gainNode.gain.value = 0.2;
      
      oscillator1.connect(gainNode);
      oscillator2.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator1.start();
      oscillator2.start();
      
      setTimeout(() => {
        oscillator1.stop();
        oscillator2.stop();
        audioContext.close();
      }, 150);
    } catch (error) {
      console.log('Audio not available');
    }
  };

  const handleNumberClick = (num: string) => {
    playDTMF(num);
    setPhoneNumber(prev => prev + num);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPhoneNumber(value);
  };

  const handleCall = () => {
    if (phoneNumber.length > 0) {
      setIsCallActive(true);
      startCallTimer();
    }
  };

  const handleAnswer = () => {
    setIsIncoming(false);
    setIsCallActive(true);
    startCallTimer();
  };

  const handleDecline = () => {
    setIsIncoming(false);
    setPhoneNumber('');
  };

  const simulateIncomingCall = () => {
    setPhoneNumber('+971557067850');
    setIsIncoming(true);
  };

  const handleEndCall = () => {
    setIsCallActive(false);
    setIsRinging(false);
    setIsMuted(false);
    setIsPaused(false);
    setCallDuration(0);
    setPhoneNumber('');
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const startCallTimer = () => {
    timerRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const dialpadButtons = [
    { num: '1' },
    { num: '2' },
    { num: '3' },
    { num: '4' },
    { num: '5' },
    { num: '6' },
    { num: '7' },
    { num: '8' },
    { num: '9' },
    { num: '*' },
    { num: '0' },
    { num: '#' }
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #f1f5f9, #e2e8f0)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', gap: '1.5rem' }}>
      
      {/* Demo Button */}
      <button
        onClick={simulateIncomingCall}
        className="btn btn-primary"
        style={{ padding: '0.5rem 1.25rem', fontSize: '0.875rem', fontWeight: '500' }}
      >
        Test Incoming Call
      </button>

      {/* Incoming Call Bar */}
      {isIncoming && (
        <div className="bg-white rounded-4 shadow" style={{ width: '100%', maxWidth: '625px', padding: '1.25rem' }}>
          <div className="d-flex align-items-center justify-content-between">
            {/* Left - Avatar and Info */}
            <div className="d-flex align-items-center gap-3">
              <div className="rounded-circle d-flex align-items-center justify-content-center text-white" 
                style={{ 
                  width: '5rem', 
                  height: '5rem',
                  background: 'linear-gradient(to bottom right, #60a5fa, #a78bfa)',
                  fontSize: '1.5rem',
                  fontWeight: '600'
                }}>
                RH
              </div>
              <div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#334155', marginBottom: '0.25rem' }}>Rizwan Haider</h3>
                <div style={{ fontSize: '1rem', color: '#94a3b8', marginBottom: '0.25rem' }}>{phoneNumber}</div>
                <div className="d-flex align-items-center gap-2" style={{ fontSize: '0.875rem' }}>
                  <span className="text-success" style={{ fontWeight: '500' }}>Incoming call</span>
                  <span className="bg-success rounded-circle" style={{ width: '0.375rem', height: '0.375rem' }}></span>
                  <span style={{ color: '#94a3b8' }}>Ringing...</span>
                </div>
              </div>
            </div>

            {/* Right - Controls */}
            <div className="d-flex flex-column gap-3">
              {/* Top Row - Small Icon Buttons */}
              <div className="d-flex align-items-center justify-content-end gap-2">
                <button className="btn rounded-circle d-flex align-items-center justify-content-center" 
                  style={{ width: '50px', height: '47px', backgroundColor: '#f1f5f9', border: 'none' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}>
                  <BellOff size={18} style={{ color: '#475569' }} strokeWidth={1.5} />
                </button>
                <button className="btn rounded-circle d-flex align-items-center justify-content-center" 
                  style={{ width: '50px', height: '47px', backgroundColor: '#f1f5f9', border: 'none' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}>
                  <MessageSquare size={18} style={{ color: '#475569' }} strokeWidth={1.5} />
                </button>
                <button className="btn rounded-circle d-flex align-items-center justify-content-center" 
                  style={{ width: '50px', height: '47px', backgroundColor: '#f1f5f9', border: 'none' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}>
                  <Clock size={18} style={{ color: '#475569' }} strokeWidth={1.5} />
                </button>
              </div>

              {/* Bottom Row - Decline and Answer Buttons */}
              <div className="d-flex align-items-center gap-2">
                <button
                  onClick={handleDecline}
                  className="btn rounded-pill d-flex align-items-center gap-2"
                  style={{ 
                    padding: '0.625rem 1.75rem',
                    backgroundColor: 'white',
                    border: '2px solid #f87171',
                    color: '#ef4444',
                    fontWeight: '500',
                    fontSize: '1rem'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}>
                  <PhoneOff size={16} strokeWidth={2} />
                  Decline
                </button>
                <button
                  onClick={handleAnswer}
                  className="btn rounded-pill d-flex align-items-center gap-2"
                  style={{ 
                    padding: '0.625rem 1.75rem',
                    fontWeight: '500',
                    fontSize: '1rem',
                    color: 'white',
                    backgroundColor: '#22c55e'
                  }}>
                  <Phone size={16} strokeWidth={2} />
                  Answer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Call Bar (Connected) */}
      {isCallActive && (
        <div className="bg-white rounded-4 shadow" style={{ width: '100%', maxWidth: '615px', padding: '1.25rem' }}>
          <div className="d-flex align-items-center justify-content-between">
            {/* Left - Avatar and Info */}
            <div className="d-flex align-items-center gap-3">
              <div className="rounded-circle d-flex align-items-center justify-content-center text-white" 
                style={{ 
                  width: '5rem', 
                  height: '5rem',
                  background: 'linear-gradient(to bottom right, #60a5fa, #a78bfa)',
                  fontSize: '1.5rem',
                  fontWeight: '600'
                }}>
                RH
              </div>
              <div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#334155', marginBottom: '0.25rem' }}>Rizwan Haider</h3>
                <div style={{ fontSize: '1rem', color: '#94a3b8', marginBottom: '0.25rem' }}>{phoneNumber}</div>
                <div className="d-flex align-items-center gap-2" style={{ fontSize: '0.875rem' }}>
                  <span className="text-success" style={{ fontWeight: '500' }}>Connected</span>
                  <span style={{ color: '#94a3b8' }}>{formatDuration(callDuration)}</span>
                </div>
              </div>
            </div>

            {/* Right - Controls */}
            <div className="d-flex align-items-center gap-2">
              {/* Small Icon Buttons */}
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="btn rounded-circle d-flex align-items-center justify-content-center"
                style={{ 
                  width: '3rem', 
                  height: '3rem',
                  backgroundColor: isMuted ? '#cbd5e1' : '#f1f5f9',
                  border: 'none'
                }}
                onMouseEnter={(e) => {
                  if (!isMuted) e.currentTarget.style.backgroundColor = '#e2e8f0';
                }}
                onMouseLeave={(e) => {
                  if (!isMuted) e.currentTarget.style.backgroundColor = '#f1f5f9';
                }}>
                {isMuted ? <MicOff size={20} style={{ color: '#475569' }} strokeWidth={1.5} /> : <Mic size={20} style={{ color: '#475569' }} strokeWidth={1.5} />}
              </button>
              <button
                onClick={() => setIsPaused(!isPaused)}
                className="btn rounded-circle d-flex align-items-center justify-content-center"
                style={{ 
                  width: '3rem', 
                  height: '3rem',
                  backgroundColor: isPaused ? '#cbd5e1' : '#f1f5f9',
                  border: 'none'
                }}
                onMouseEnter={(e) => {
                  if (!isPaused) e.currentTarget.style.backgroundColor = '#e2e8f0';
                }}
                onMouseLeave={(e) => {
                  if (!isPaused) e.currentTarget.style.backgroundColor = '#f1f5f9';
                }}>
                {isPaused ? <Play size={20} style={{ color: '#475569' }} strokeWidth={1.5} /> : <Pause size={20} style={{ color: '#475569' }} strokeWidth={1.5} />}
              </button>
              <button className="btn rounded-circle d-flex align-items-center justify-content-center" 
                style={{ width: '3rem', height: '3rem', backgroundColor: '#f1f5f9', border: 'none' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}>
                <Grid3x3 size={20} style={{ color: '#475569' }} strokeWidth={1.5} />
              </button>

              {/* End Call Button */}
              <button
                onClick={handleEndCall}
                className="btn btn-danger rounded-1 d-flex align-items-center gap-1"
                style={{ 
                  padding: '0.625rem 1rem',
                  fontWeight: '500',
                  fontSize: '1rem',
                  boxShadow: '0 4px 6px -1px rgba(239,68,68,0.3)',
                  marginLeft: '0.5rem'
                }}>
                <Phone size={16} strokeWidth={2} />
                End Call
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ringing State */}
      {isRinging && (
        <div className="bg-white rounded-3 shadow" style={{ maxWidth: '420px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
          <div style={{ background: 'linear-gradient(to right, #475569, #334155)', padding: '1.25rem 1.5rem', color: 'white' }}>
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>Rizwan Haider</h2>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>511</div>
            </div>
          </div>
            
          <div className="text-center" style={{ padding: '2rem' }}>
            <div className="d-flex align-items-center justify-content-center mx-auto mb-4 bg-success rounded-circle" style={{ width: '5rem', height: '5rem', animation: 'pulse 1.5s infinite' }}>
              <Phone size={40} className="text-white" />
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#334155', marginBottom: '0.5rem' }}>{phoneNumber}</div>
            <div style={{ color: '#64748b', marginBottom: '1.5rem' }}>Calling...</div>
            <button
              onClick={handleEndCall}
              className="btn btn-danger rounded-pill"
              style={{ padding: '0.75rem 2rem', fontWeight: '500' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Dialpad View */}
      {!isCallActive && !isRinging && !isIncoming && (
        <div className="bg-white rounded-3 shadow" style={{ maxWidth: '420px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
          {/* Header */}
          <div style={{ background: 'linear-gradient(to right, #475569, #334155)', padding: '1.25rem 1.5rem', color: 'white' }}>
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0, color: 'white' }}>Rizwan Haider</h2>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>511</div>
            </div>
          </div>

          {/* Status Badge */}
          <div style={{ padding: '1.25rem 1.5rem 1rem' }}>
            <span className="badge" style={{ padding: '0.375rem 1rem', fontSize: '0.875rem', fontWeight: '500', borderRadius: '50rem', backgroundColor: '#22c55e' }}>
            Online
            </span>
          </div>

          {/* Search Input */}
          <div style={{ padding: '0 1.5rem 1.25rem' }}>
            <div className="position-relative">
              <Search className="position-absolute" style={{ left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={20} />
              <input
                type="text"
                value={phoneNumber}
                onChange={handleInputChange}
                placeholder="Search name or type number"
                className="form-control"
                style={{ 
                  paddingLeft: '3rem', 
                  paddingRight: '1rem', 
                  paddingTop: '0.875rem', 
                  paddingBottom: '0.875rem',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.75rem',
                  fontSize: '1rem'
                }}
              />
            </div>
          </div>

          {/* Dialpad Grid */}
          <div style={{ padding: '0 1.5rem 1.5rem' }}>
            <div className="row g-3">
              {dialpadButtons.map((btn) => (
                <div key={btn.num} className="col-4">
                  <button
                    onClick={() => handleNumberClick(btn.num)}
                    className="btn w-100"
                    style={{ 
                      height: '4rem',
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '0.75rem',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f1f5f9';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#f8fafc';
                    }}
                  >
                    <span style={{ fontSize: '1.5rem', fontWeight: '600', color: '#475569' }}>{btn.num}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Call Button */}
          <div style={{ padding: '0 1.5rem 1.5rem' }}>
            <button
              onClick={handleCall}
            //   disabled={phoneNumber.length === 0}
              className="btn btn-success w-100 d-flex align-items-center justify-content-center gap-3 rounded-4"
              style={{ 
                padding: '1rem',
                fontSize: '1.125rem',
                fontWeight: '600',
                
                backgroundColor: '#22c55e'
              }}
            >
              <Phone size={24} />
              Call
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProDialpad;
