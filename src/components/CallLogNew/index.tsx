// ============================================================================
// CALL LOG COMPONENT
// Replace the activityFilter === 'calls' block with this component
// ============================================================================

import React, { useState, useRef, useEffect } from 'react';
import {
  Phone,
  ChevronDown,
  ChevronRight,
  FileText,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Play,
  Pause,
  Trash2,
  ExternalLink,
  MessageSquare,
  Info,
  Sparkles,
  X,
} from 'lucide-react';
import LogCallModal from '@components/LogCallModal';

// ── Types ─────────────────────────────────────────────────────────────────────

interface CallEntry {
  id: string;
  callerName: string;
  withName?: string;
  timestamp: string;
  hasRecording: boolean;
  duration?: number; // seconds
  aiSummary?: string;
  aiGeneratedDate?: string;
  outcome?: string;
  direction?: 'Inbound' | 'Outbound';
  associations?: number;
  comments?: string[];
}

interface AudioPlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
}

// ── Audio Player ──────────────────────────────────────────────────────────────

const AudioPlayer: React.FC<{ duration: number }> = ({ duration }) => {
  const [state, setState] = useState<AudioPlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration,
  });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const togglePlay = () => {
    setState((prev) => {
      const playing = !prev.isPlaying;
      if (playing) {
        intervalRef.current = setInterval(() => {
          setState((s) => {
            if (s.currentTime >= s.duration) {
              clearInterval(intervalRef.current!);
              return { ...s, isPlaying: false, currentTime: 0 };
            }
            return { ...s, currentTime: s.currentTime + 1 };
          });
        }, 1000);
      } else {
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
      return { ...prev, isPlaying: playing };
    });
  };

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  const progress = state.duration > 0 ? (state.currentTime / state.duration) * 100 : 0;

  const handleScrub = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setState((prev) => ({ ...prev, currentTime: Math.floor(ratio * prev.duration) }));
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 0' }}>
      {/* Play/Pause */}
      <button
        onClick={togglePlay}
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          border: '1px solid #cccccc',
          background: '#fff',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          color: '#141414',
        }}
      >
        {state.isPlaying ? <Pause size={14} /> : <Play size={14} />}
      </button>

      {/* Current time */}
      <span style={{ fontSize: '13px', color: '#141414', minWidth: '32px' }}>
        {formatTime(state.currentTime)}
      </span>

      {/* Progress bar */}
      <div
        onClick={handleScrub}
        style={{
          flex: 1,
          height: '4px',
          backgroundColor: '#e2e8f0',
          borderRadius: '2px',
          cursor: 'pointer',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            height: '100%',
            width: `${progress}%`,
            backgroundColor: '#141414',
            borderRadius: '2px',
          }}
        />
      </div>

      {/* Duration */}
      <span style={{ fontSize: '13px', color: '#141414', minWidth: '32px', textAlign: 'right' }}>
        {formatTime(state.duration)}
      </span>

      {/* Delete */}
      <button
        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#718096', padding: '4px', display: 'flex' }}
        title="Delete recording"
        onMouseEnter={(e) => (e.currentTarget.style.color = '#e53e3e')}
        onMouseLeave={(e) => (e.currentTarget.style.color = '#718096')}
      >
        <Trash2 size={16} />
      </button>

      {/* External link */}
      <button
        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#718096', padding: '4px', display: 'flex' }}
        title="Open in new tab"
        onMouseEnter={(e) => (e.currentTarget.style.color = '#141414')}
        onMouseLeave={(e) => (e.currentTarget.style.color = '#718096')}
      >
        <ExternalLink size={16} />
      </button>
    </div>
  );
};

// ── AI Call Notes Card ────────────────────────────────────────────────────────

const AICallNotesCard: React.FC<{ summary: string; generatedDate: string }> = ({
  summary,
  generatedDate,
}) => {
  const [askQuestion, setAskQuestion] = useState(false);
  const [question, setQuestion] = useState('');

  return (
    <div
      style={{
        border: '1px solid #ff9fcc',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '16px',
        position: 'relative',
        backgroundColor: '#fff',
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div>
          <div style={{ fontSize: '14px', fontWeight: '700', color: '#141414', marginBottom: '4px' }}>
            Call notes
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#718096' }}>
            <span>Generated {generatedDate}</span>
            <button
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#718096', padding: '2px', display: 'flex' }}
              title="Regenerate"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>
        {/* AI badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 10px',
            backgroundColor: '#d20688',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: '600',
            color: '#ffffff',
          }}
        >
          <Sparkles size={12} />
          AI
        </div>
      </div>

      {/* Summary */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ fontSize: '13px', fontWeight: '700', color: '#141414', marginBottom: '6px' }}>
          Summary
        </div>
        <p style={{ fontSize: '13px', color: '#141414', lineHeight: '1.6', margin: 0 }}>
          {summary}
        </p>
      </div>

      {/* Feedback icons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
        <button
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#718096', padding: '4px', display: 'flex', borderRadius: '3px' }}
          title="Helpful"
          onMouseEnter={(e) => (e.currentTarget.style.color = '#141414')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#718096')}
        >
          <ThumbsUp size={16} />
        </button>
        <button
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#718096', padding: '4px', display: 'flex', borderRadius: '3px' }}
          title="Not helpful"
          onMouseEnter={(e) => (e.currentTarget.style.color = '#141414')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#718096')}
        >
          <ThumbsDown size={16} />
        </button>
        <button
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#718096', padding: '4px', display: 'flex', borderRadius: '3px' }}
          title="Copy summary"
          onMouseEnter={(e) => (e.currentTarget.style.color = '#141414')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#718096')}
        >
          <Copy size={16} />
        </button>
      </div>

      {/* Ask a question */}
      {askQuestion ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            autoFocus
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask about this call..."
            style={{
              flex: 1,
              padding: '6px 12px',
              border: '1px solid #ff9fcc',
              borderRadius: '16px',
              fontSize: '13px',
              outline: 'none',
              fontFamily: 'inherit',
              color: '#141414',
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') { setAskQuestion(false); setQuestion(''); }
            }}
          />
          <button
            onClick={() => { setAskQuestion(false); setQuestion(''); }}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#718096', display: 'flex', padding: '4px' }}
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setAskQuestion(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            border: '1px solid #ff9fcc',
            borderRadius: '16px',
            background: '#ffffff',
            cursor: 'pointer',
            fontSize: '13px',
            color: '#d20688',
            fontWeight: '500',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fff0f8')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
        >
          <Sparkles size={13} />
          Ask a question
        </button>
      )}
    </div>
  );
};

// ── Single Call Card ──────────────────────────────────────────────────────────

const CallCard: React.FC<{ call: CallEntry; defaultExpanded?: boolean }> = ({
  call,
  defaultExpanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [outcome, setOutcome] = useState(call.outcome || '');
  const [direction, setDirection] = useState<string>(call.direction || 'Outbound');
  const [comment, setComment] = useState('');
  const [showCommentInput, setShowCommentInput] = useState(false);

  const toolbarBtnStyle: React.CSSProperties = {
    background: 'transparent',
    border: 'none',
    padding: '5px',
    cursor: 'pointer',
    color: '#141414',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '3px',
  };

  return (
    <div
      style={{
        border: '1px solid #cccccc',
        borderRadius: '8px',
        backgroundColor: '#ffffff',
        marginBottom: '12px',
        overflow: 'hidden',
      }}
    >
      {/* ── Card Header (always visible) ── */}
      <div style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          {/* Left: toggle + title */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', flex: 1 }}>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '2px',
                color: '#141414',
                display: 'flex',
                alignItems: 'center',
                flexShrink: 0,
                marginTop: '1px',
              }}
            >
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
            <div>
              <div style={{ fontSize: '14px', color: '#141414', fontWeight: '400' }}>
                <strong>Call</strong> from {call.callerName}
              </div>
              {isExpanded && call.withName && (
                <div style={{ fontSize: '13px', color: '#141414', marginTop: '2px' }}>
                  with {call.withName}
                </div>
              )}
              {isExpanded && call.hasRecording && (
                <div style={{ marginTop: '8px' }}>
                  <a
                    href="#"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '13px',
                      color: '#006162',
                      textDecoration: 'none',
                      fontWeight: '500',
                    }}
                    onClick={(e) => e.preventDefault()}
                  >
                    <FileText size={14} />
                    Review recording
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Right: Actions + timestamp */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
            {isExpanded && (
              <div style={{ position: 'relative' }}>
                <button
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#141414',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 8px',
                    borderRadius: '4px',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f8fa')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  Actions
                  <ChevronDown size={14} />
                </button>
              </div>
            )}
            <span style={{ fontSize: '13px', color: '#718096', whiteSpace: 'nowrap' }}>
              {call.timestamp}
            </span>
          </div>
        </div>
      </div>

      {/* ── Expanded Content ── */}
      {isExpanded && (
        <div style={{ padding: '0 20px 16px 20px' }}>
          {/* Divider */}
          <div style={{ borderTop: '1px solid #eaf0f6', marginBottom: '16px' }} />

          {/* AI Call Notes */}
          {call.aiSummary && call.aiGeneratedDate && (
            <AICallNotesCard summary={call.aiSummary} generatedDate={call.aiGeneratedDate} />
          )}

          {/* Outcome + Direction */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0',
              paddingBottom: '16px',
              marginBottom: '16px',
              borderBottom: '1px solid #eaf0f6',
            }}
          >
            {/* Outcome */}
            <div>
              <div style={{ fontSize: '12px', color: '#718096', marginBottom: '6px', fontWeight: '500' }}>
                Outcome
              </div>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <select
                  value={outcome}
                  onChange={(e) => setOutcome(e.target.value)}
                  style={{
                    appearance: 'none',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#141414',
                    paddingRight: '20px',
                    fontFamily: 'inherit',
                    outline: 'none',
                  }}
                >
                  <option value="">Select an outcome</option>
                  <option value="connected">Connected</option>
                  <option value="left_voicemail">Left voicemail</option>
                  <option value="no_answer">No answer</option>
                  <option value="busy">Busy</option>
                  <option value="wrong_number">Wrong number</option>
                </select>
                <ChevronDown
                  size={14}
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                    color: '#141414',
                  }}
                />
              </div>
            </div>

            {/* Direction */}
            <div>
              <div
                style={{
                  fontSize: '12px',
                  color: '#718096',
                  marginBottom: '6px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                Direction
                <button
                  style={{ background: 'transparent', border: 'none', padding: '1px', cursor: 'pointer', color: '#718096', display: 'flex' }}
                  title="Inbound = calls received; Outbound = calls made"
                >
                  <Info size={13} />
                </button>
              </div>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <select
                  value={direction}
                  onChange={(e) => setDirection(e.target.value)}
                  style={{
                    appearance: 'none',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#141414',
                    paddingRight: '20px',
                    fontFamily: 'inherit',
                    outline: 'none',
                  }}
                >
                  <option value="Outbound">Outbound</option>
                  <option value="Inbound">Inbound</option>
                </select>
                <ChevronDown
                  size={14}
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                    color: '#141414',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Audio Player */}
          {call.hasRecording && call.duration !== undefined && (
            <>
              <AudioPlayer duration={call.duration} />
              <div style={{ borderTop: '1px solid #eaf0f6', marginTop: '4px', marginBottom: '16px' }} />
            </>
          )}

          {/* ── Comment Section Footer ── */}
          <div style={{ borderTop: '1px solid #eaf0f6', paddingTop: '14px' }}>

            {/* Row 1: Hide/Add comment toggle + associations */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <button
                onClick={() => setShowCommentInput(!showCommentInput)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13px',
                  color: '#006162',
                  fontWeight: '500',
                  padding: 0,
                  textDecoration: 'underline',
                  fontFamily: 'inherit',
                }}
              >
                <MessageSquare size={14} />
                {showCommentInput ? 'Hide comments' : 'Add comment'}
              </button>

              <button
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '13px',
                  color: '#141414',
                  fontWeight: '600',
                  fontFamily: 'inherit',
                }}
              >
                {call.associations ?? 2} associations
                <ChevronDown size={14} />
              </button>
            </div>

            {/* Expanded comment panel */}
            {showCommentInput && (
              <div>
                {/* "Add comments to specific times" prompt */}
                <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                  <a
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    style={{
                      fontSize: '13px',
                      color: '#006162',
                      fontWeight: '600',
                      textDecoration: 'underline',
                    }}
                  >
                    Add comments to specific times in this recording.
                  </a>
                </div>

                {/* User avatar + name + editor */}
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  {/* Avatar */}
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #2ecc71 0%, #27ae60 50%, #006162 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '13px',
                      fontWeight: '700',
                      color: '#ffffff',
                      flexShrink: 0,
                      border: '2px solid #eaf0f6',
                      overflow: 'hidden',
                      position: 'relative',
                    }}
                  >
                    {/* Decorative stripes to mimic the logo avatar in design */}
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: 'linear-gradient(135deg, #e74c3c 0%, #e74c3c 33%, #3498db 33%, #3498db 66%, #2ecc71 66%, #2ecc71 100%)',
                      opacity: 0.9,
                    }} />
                    <span style={{ position: 'relative', zIndex: 1, fontSize: '12px', fontWeight: '800' }}>R</span>
                  </div>

                  {/* Comment editor box */}
                  <div style={{ flex: 1 }}>
                    {/* Username */}
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#141414', marginBottom: '6px' }}>
                      Rizwan Haider
                    </div>

                    {/* Editor border box */}
                    <div
                      style={{
                        border: '1px solid #cccccc',
                        borderRadius: '6px',
                        overflow: 'hidden',
                      }}
                    >
                      {/* Textarea */}
                      <textarea
                        autoFocus
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Send your colleague a notification by typing @ followed by their name. Only users in your organization can see comments."
                        style={{
                          width: '100%',
                          minHeight: '90px',
                          padding: '12px 14px',
                          border: 'none',
                          outline: 'none',
                          fontSize: '13px',
                          fontFamily: 'inherit',
                          color: '#141414',
                          resize: 'none',
                          lineHeight: '1.5',
                          boxSizing: 'border-box',
                          display: 'block',
                        }}
                      />

                      {/* Formatting toolbar */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '2px',
                          padding: '8px 10px',
                          borderTop: '1px solid #eaf0f6',
                          backgroundColor: '#fafafa',
                        }}
                      >
                        {/* Bold */}
                        <button
                          style={toolbarBtnStyle}
                          title="Bold"
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f0f0f0')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/>
                          </svg>
                        </button>
                        {/* Italic */}
                        <button
                          style={toolbarBtnStyle}
                          title="Italic"
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f0f0f0')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/>
                          </svg>
                        </button>
                        {/* Underline */}
                        <button
                          style={toolbarBtnStyle}
                          title="Underline"
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f0f0f0')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M6 4v6a6 6 0 0 0 12 0V4"/><line x1="4" y1="20" x2="20" y2="20"/>
                          </svg>
                        </button>
                        {/* Strikethrough */}
                        <button
                          style={toolbarBtnStyle}
                          title="Strikethrough"
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f0f0f0')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="4" y1="12" x2="20" y2="12"/><path d="M17.5 5.5C17 4 15.5 3 13.5 3c-2.8 0-4.5 1.5-4.5 4 0 1.2.5 2.2 1.5 2.9"/><path d="M6.5 18.5C7 20 8.5 21 10.5 21c3 0 4.8-1.6 4.8-4.2 0-1.1-.4-2-.9-2.7"/>
                          </svg>
                        </button>

                        {/* More dropdown */}
                        <button
                          style={{
                            ...toolbarBtnStyle,
                            padding: '5px 8px',
                            fontSize: '12px',
                            fontWeight: '500',
                            gap: '3px',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f0f0f0')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          More
                          <ChevronDown size={12} />
                        </button>

                        <div style={{ width: '1px', height: '16px', backgroundColor: '#cccccc', margin: '0 4px' }} />

                        {/* Link */}
                        <button
                          style={toolbarBtnStyle}
                          title="Insert Link"
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f0f0f0')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                          </svg>
                        </button>
                        {/* Image */}
                        <button
                          style={toolbarBtnStyle}
                          title="Insert Image"
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f0f0f0')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                          </svg>
                        </button>
                        {/* Blockquote */}
                        <button
                          style={toolbarBtnStyle}
                          title="Blockquote"
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f0f0f0')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/>
                          </svg>
                        </button>
                        {/* List */}
                        <button
                          style={toolbarBtnStyle}
                          title="Bullet List"
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f0f0f0')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/>
                            <circle cx="4" cy="6" r="1" fill="currentColor" stroke="none"/><circle cx="4" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="4" cy="18" r="1" fill="currentColor" stroke="none"/>
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Save button */}
                    <div style={{ marginTop: '10px' }}>
                      <button
                        disabled={!comment.trim()}
                        onClick={() => {
                          if (comment.trim()) {
                            setShowCommentInput(false);
                            setComment('');
                          }
                        }}
                        style={{
                          padding: '7px 18px',
                          backgroundColor: '#ffffff',
                          color: '#141414',
                          border: '1px solid #cccccc',
                          borderRadius: '4px',
                          fontSize: '13px',
                          fontWeight: '500',
                          cursor: comment.trim() ? 'pointer' : 'not-allowed',
                          opacity: comment.trim() ? 1 : 0.6,
                          fontFamily: 'inherit',
                          transition: 'background-color 0.15s',
                        }}
                        onMouseEnter={(e) => {
                          if (comment.trim()) e.currentTarget.style.backgroundColor = '#f5f8fa';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#ffffff';
                        }}
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Main CallLog Component ────────────────────────────────────────────────────

const SAMPLE_CALLS: CallEntry[] = [
  {
    id: '1',
    callerName: 'Rizwan Haider',
    withName: 'Rizwan haider',
    timestamp: '12 Feb 2026 at 19:18 GMT+5',
    hasRecording: true,
    duration: 85,
    aiSummary:
      'Rizwan Haider discusses the five key questions to prepare for during a job interview, emphasizing the importance of demonstrating passion, understanding your value, and maintaining a positive outlook about current employers.',
    aiGeneratedDate: '21 Feb 2026',
    outcome: '',
    direction: 'Outbound',
    associations: 2,
  },
  {
    id: '2',
    callerName: 'Rizwan Haider',
    timestamp: '12 Feb 2026 at 19:16 GMT+5',
    hasRecording: true,
    duration: 47,
    direction: 'Outbound',
    associations: 1,
  },
  {
    id: '3',
    callerName: 'Rizwan Haider',
    timestamp: '12 Feb 2026 at 19:12 GMT+5',
    hasRecording: true,
    duration: 120,
    direction: 'Inbound',
    associations: 2,
  },
];

const CallLog: React.FC = () => {
  const [isLogCallOpen, setIsLogCallOpen] = useState(false);

  return (
    <>
      {/* Action buttons */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        <button
          style={{
            padding: '8px 16px',
            backgroundColor: '#ffffff',
            border: '1px solid #414141',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: '300',
            color: '#141414',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s',
          }}
          onClick={() => setIsLogCallOpen(true)}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f7fafc')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
        >
          <Phone size={16} />
          Log call
        </button>
        <button
          style={{
            padding: '8px 16px',
            backgroundColor: '#ffffff',
            border: '1px solid #414141',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: '300',
            color: '#141414',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f7fafc')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
        >
          <Phone size={16} />
          Make a phone call
        </button>
      </div>

      {/* Call list */}
      {SAMPLE_CALLS.map((call, index) => (
        <CallCard key={call.id} call={call} defaultExpanded={index === 0} />
      ))}

      {/* Log Call Modal */}
      <LogCallModal
        isOpen={isLogCallOpen}
        onClose={() => setIsLogCallOpen(false)}
        associatedRecords={[]}
        onSave={(data) => {
          console.log('Call logged:', data);
          setIsLogCallOpen(false);
        }}
      />
    </>
  );
};

export default CallLog;
