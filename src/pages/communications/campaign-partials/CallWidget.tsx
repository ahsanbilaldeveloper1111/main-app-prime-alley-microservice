import React, { useState, useEffect } from 'react';
import {
  PhoneCall,
  PhoneOff,
  CheckCircle,
  MoreVertical,
  Pause,
  ChevronDown
} from 'lucide-react';

export type PreviewContactRow = { label: string; value: string };

interface CallWidgetProps {
  showCallWidget: boolean;
  setShowCallWidget: (show: boolean) => void;
  callStatus: string;
  /** Elapsed seconds from preview participant start / state-change time */
  elapsedSeconds?: number;
  /** @deprecated Use elapsedSeconds. When elapsedSeconds is omitted, this drives the timer display. */
  callTimer?: number;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  isHold: boolean;
  setIsHold: (hold: boolean) => void;
  handleAcceptCall: () => void;
  handleRejectCall: () => void;
  handleEndCall: () => void;
  formatTime: (seconds: number) => string;
  selectedTeam: string;
  /** When set, Agent row is shown (e.g. campaign console). */
  activeAgentName?: string;
  /** When false, Team row is hidden (e.g. campaign manager preview). Default true. */
  includeTeamRow?: boolean;
  /** Dynamic from preview event */
  campaignName?: string;
  customerNumber?: string;
  dialedNumber?: string;
  /** Dialog or participant state label from preview */
  previewStateLabel?: string;
  /** Contact grid from callVariables + contactHeader mapping */
  previewContactRows?: PreviewContactRow[];
  /** e.g. ['ACCEPT','REJECT','CLOSE','RECLASSIFY'] – when both REJECT and CLOSE present, show dropdown */
  previewActions?: string[];
  /** When set, Reject area uses this with action 'REJECT' or 'CLOSE' instead of handleRejectCall */
  onRejectWithAction?: (action: 'REJECT' | 'CLOSE') => void;
  /** Sends RECLASSIFY dialog action (optional param via prompt in parent) */
  onReclassify?: () => void | Promise<void>;
  /** When call is connected, clicking Wrap up fetches reasons and opens modal */
  onWrapUpClick?: () => void;
  wrapUpLoading?: boolean;
  /** When provided, Hold/Resume calls this (e.g. dialog action API) instead of only setting local state */
  onHoldToggle?: (hold: boolean) => void | Promise<void>;
  holdLoading?: boolean;
}

const CallWidget: React.FC<CallWidgetProps> = ({
  showCallWidget,
  setShowCallWidget,
  callStatus,
  elapsedSeconds,
  callTimer,
  isMuted,
  setIsMuted,
  isHold,
  setIsHold,
  handleAcceptCall,
  handleRejectCall,
  handleEndCall,
  formatTime,
  selectedTeam,
  activeAgentName,
  includeTeamRow = true,
  campaignName,
  customerNumber,
  dialedNumber,
  previewStateLabel = '',
  previewContactRows = [],
  previewActions = [],
  onRejectWithAction,
  onReclassify,
  onWrapUpClick,
  wrapUpLoading = false,
  onHoldToggle,
  holdLoading = false,
}) => {
  const effectiveElapsed = elapsedSeconds ?? callTimer ?? 0;
  const [showRejectMenu, setShowRejectMenu] = useState(false);

  useEffect(() => {
    if (!showCallWidget) setShowRejectMenu(false);
  }, [showCallWidget]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (showRejectMenu && !document.querySelector('.call-widget-reject-menu')?.contains(target)) {
        setShowRejectMenu(false);
      }
    };
    if (showRejectMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showRejectMenu]);

  if (!showCallWidget) return null;

  const hasReject = previewActions.includes('REJECT');
  const hasClose = previewActions.includes('CLOSE');
  const showRejectDropdown = (hasReject && hasClose) && !!onRejectWithAction;
  const handleRejectClick = () => {
    if (onRejectWithAction) {
      if (showRejectDropdown) setShowRejectMenu((v) => !v);
      else onRejectWithAction(hasReject ? 'REJECT' : 'CLOSE');
    } else {
      handleRejectCall();
    }
  };

  return (
    <>
      <style>{`
        .call-widget {
          position: fixed;
          bottom: 24px;
          right: 24px;
          width: 280px;
          background: white;
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          overflow: hidden;
          animation: slideUp 0.3s ease;
          z-index: 1000;
        }

        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .call-widget-header {
          background: linear-gradient(135deg, #667eea 0%, #667eea 100%);
          color: white;
          padding: 14px 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .call-widget-body {
          padding: 16px;
        }

        .call-status {
          text-align: center;
          margin-bottom: 14px;
        }

        .call-timer {
          font-size: 28px;
          font-weight: 700;
          color: #1e293b;
          margin: 8px 0;
        }

        .call-status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 16px;
          font-size: 11px;
          font-weight: 600;
          background: #fef3c7;
          color: #92400e;
        }

        .call-status-badge.connected {
          background: #dcfce7;
          color: #166534;
        }

        .call-info-grid {
          display: grid;
          gap: 8px;
          margin-bottom: 14px;
        }

        .call-info-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px 10px;
          background: #f8fafc;
          border-radius: 8px;
          font-size: 12px;
        }

        .call-info-label {
          color: #64748b;
          font-weight: 500;
        }

        .call-info-value {
          color: #1e293b;
          font-weight: 600;
        }

        .call-contact-section {
          margin-bottom: 14px;
        }

        .call-contact-title {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: #64748b;
          margin-bottom: 8px;
        }

        .call-contact-grid {
          display: grid;
          gap: 6px;
          max-height: 160px;
          overflow-y: auto;
        }

        .call-contact-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 10px;
          padding: 6px 10px;
          background: #f1f5f9;
          border-radius: 8px;
          font-size: 11px;
        }

        .call-contact-label {
          color: #64748b;
          font-weight: 600;
          flex-shrink: 0;
          max-width: 48%;
        }

        .call-contact-value {
          color: #0f172a;
          font-weight: 600;
          text-align: right;
          word-break: break-word;
        }

        .btn-reclassify {
          width: 100%;
          margin-top: 8px;
          padding: 8px 12px;
          border-radius: 10px;
          border: 2px solid #e2e8f0;
          background: white;
          color: #475569;
          font-weight: 600;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-reclassify:hover {
          border-color: #667eea;
          color: #667eea;
        }

        .call-controls {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          margin-bottom: 12px;
        }

        .call-control-btn {
          width: 100%;
          aspect-ratio: 1;
          border: none;
          border-radius: 10px;
          background: #f8fafc;
          color: #64748b;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2px;
          font-size: 9px;
          font-weight: 500;
          padding: 4px;
        }

        .call-control-btn svg {
          width: 14px;
          height: 14px;
        }

        .call-control-btn:hover {
          background: #e2e8f0;
          transform: translateY(-1px);
        }

        .call-control-btn.active {
          background: #667eea;
          color: white;
        }

        .call-action-buttons {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .btn-accept {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          border: none;
          padding: 7px;
          border-radius: 7px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: all 0.2s;
          font-size: 13px;
        }

        .btn-accept svg {
          width: 16px;
          height: 16px;
        }

        .btn-accept:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
        }

        .btn-reject {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
          border: none;
          padding: 7px;
          border-radius: 7px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: all 0.2s;
          font-size: 13px;
        }

        .btn-reject svg {
          width: 16px;
          height: 16px;
        }

        .btn-reject:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(239, 68, 68, 0.4);
        }

        .btn-end-call {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
          border: none;
          padding: 10px;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: all 0.2s;
          width: 100%;
          font-size: 13px;
        }

        .btn-end-call svg {
          width: 16px;
          height: 16px;
        }

        .btn-end-call:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(239, 68, 68, 0.4);
        }

        @media (max-width: 768px) {
          .call-widget {
            width: calc(100% - 32px);
            left: 16px;
            right: 16px;
          }
        }
      `}</style>

      <div className="call-widget">
        <div className="call-widget-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <PhoneCall size={20} />
            <span style={{ fontSize: '14px', fontWeight: '600' }}>Incoming Call</span>
          </div>
          <button
            onClick={() => setShowCallWidget(false)}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <MoreVertical size={18} />
          </button>
        </div>

        <div className="call-widget-body">
          <div className="call-status">
            <span className={`call-status-badge ${callStatus === 'Connected' ? 'connected' : ''}`}>
              {callStatus === 'Ringing' && (
                <>
                  <PhoneCall size={12} />
                  Ringing...
                </>
              )}
              {callStatus === 'Connected' && (
                <>
                  <CheckCircle size={12} />
                  Connected
                </>
              )}
              {callStatus === 'Wrap up' && (
                <>
                  <CheckCircle size={12} />
                  Wrap up
                </>
              )}
            </span>
          </div>

          <div className="call-info-grid">
            {(campaignName != null && String(campaignName).trim() !== '') && (
              <div className="call-info-item">
                <span className="call-info-label">Campaign</span>
                <span className="call-info-value">{campaignName}</span>
              </div>
            )}
            {(dialedNumber != null && String(dialedNumber).trim() !== '') && (
              <div className="call-info-item">
                <span className="call-info-label">Dialed number</span>
                <span className="call-info-value">{dialedNumber}</span>
              </div>
            )}
            {customerNumber != null &&
              dialedNumber != null &&
              String(customerNumber).trim() !== '' &&
              String(customerNumber).trim() !== String(dialedNumber).trim() && (
                <div className="call-info-item">
                  <span className="call-info-label">Customer number</span>
                  <span className="call-info-value">{customerNumber}</span>
                </div>
              )}
            <div className="call-info-item">
              <span className="call-info-label">State</span>
              <span
                className="call-info-value"
                style={{
                  color: callStatus === 'Connected' ? '#10b981' : '#f59e0b',
                }}
              >
                {previewStateLabel || callStatus || '—'}
              </span>
            </div>
            <div className="call-info-item">
              <span className="call-info-label">Elapsed</span>
              <span className="call-info-value">{formatTime(effectiveElapsed)}</span>
            </div>
            {activeAgentName != null && String(activeAgentName).trim() !== '' && (
              <div className="call-info-item">
                <span className="call-info-label">Agent</span>
                <span className="call-info-value">{activeAgentName}</span>
              </div>
            )}
            {includeTeamRow && (
              <div className="call-info-item">
                <span className="call-info-label">Team</span>
                <span className="call-info-value">
                  {selectedTeam.replace(/-/g, ' ')}
                </span>
              </div>
            )}
          </div>

          {previewContactRows.length > 0 && (
            <div className="call-contact-section">
              <div className="call-contact-title">Contact</div>
              <div className="call-contact-grid">
                {previewContactRows.map((row, idx) => (
                  <div key={`contact-${idx}-${row.label}`} className="call-contact-row">
                    <span className="call-contact-label">{row.label}</span>
                    <span className="call-contact-value">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {callStatus === 'Connected' && (
            <>
              <div className="call-controls">
                {/* {previewActions.includes('MUTE') && (
                  <button
                    className={`call-control-btn ${isMuted ? 'active' : ''}`}
                    onClick={() => setIsMuted(!isMuted)}
                  >
                    {isMuted ? <MicOff /> : <Mic />}
                    <span>{isMuted ? 'Unmute' : 'Mute'}</span>
                  </button>
                )} */}
                {(previewActions.includes('HOLD') || previewActions.includes('RETRIEVE')) && (
                  <button
                    className={`call-control-btn ${isHold ? 'active' : ''}`}
                    disabled={holdLoading}
                    onClick={async () => {
                      const nextHold = !isHold;
                      if (onHoldToggle) {
                        try {
                          await onHoldToggle(nextHold);
                        } catch {
                          // Error toasted by parent; parent updates isHold on success
                        }
                      } else {
                        setIsHold(nextHold);
                      }
                    }}
                  >
                    <Pause />
                    <span>{holdLoading ? '...' : isHold ? 'Resume' : 'Hold'}</span>
                  </button>
                )}
                {/* {previewActions.includes('TRANSFER_SST') && (
                  <button className="call-control-btn">
                    <Phone />
                    <span>Transfer</span>
                  </button>
                )}
                {previewActions.includes('CONSULT_CALL') && (
                  <button className="call-control-btn">
                    <Users />
                    <span>Conference</span>
                  </button>
                )} */}
              </div>

              {previewActions.includes('RECLASSIFY') && onReclassify && (
                <button
                  type="button"
                  className="btn-reclassify"
                  onClick={() => {
                    void onReclassify();
                  }}
                >
                  Reclassify
                </button>
              )}

              {onWrapUpClick && previewActions.includes('UPDATE_CALL_DATA') && (
                <button
                  className="btn-wrap-up"
                  onClick={onWrapUpClick}
                  disabled={wrapUpLoading}
                  style={{
                    width: '100%',
                    marginBottom: 8,
                    padding: '12px 16px',
                    border: 'none',
                    borderRadius: 12,
                    fontWeight: 600,
                    cursor: wrapUpLoading ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    background: 'linear-gradient(135deg, #2c7ade 0%, #0891b2 100%)',
                    color: 'white',
                  }}
                >
                  {wrapUpLoading ? (
                    <>Loading...</>
                  ) : (
                    <>
                      <CheckCircle size={18} />
                      Wrap up
                    </>
                  )}
                </button>
              )}

              {previewActions.includes('DROP') && (
                <button className="btn-end-call" onClick={handleEndCall}>
                  <PhoneOff />
                  End Call
                </button>
              )}
            </>
          )}

          {callStatus === 'Wrap up' && onWrapUpClick && previewActions.includes('UPDATE_CALL_DATA') && (
            <div className="call-action-buttons">
              <button
                className="btn-wrap-up"
                onClick={onWrapUpClick}
                disabled={wrapUpLoading}
                style={{
                  width: '100%',
                  marginBottom: 8,
                  padding: '12px 16px',
                  border: 'none',
                  borderRadius: 12,
                  fontWeight: 600,
                  cursor: wrapUpLoading ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  background: 'linear-gradient(135deg, #2c7ade 0%, #0891b2 100%)',
                  color: 'white',
                }}
              >
                {wrapUpLoading ? <>Loading...</> : <><CheckCircle size={18} /> Wrap up</>}
              </button>
            </div>
          )}

          {callStatus === 'Ringing' && (

            <>
              {onWrapUpClick && previewActions.includes('UPDATE_CALL_DATA') && (
                <button
                  className="btn-wrap-up"
                  onClick={onWrapUpClick}
                  disabled={wrapUpLoading}
                  style={{
                    width: '100%',
                    marginBottom: 8,
                    padding: '12px 16px',
                    border: 'none',
                    borderRadius: 12,
                    fontWeight: 600,
                    cursor: wrapUpLoading ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    background: 'linear-gradient(135deg, #2c7ade 0%, #0891b2 100%)',
                    color: 'white',
                  }}
                >
                  {wrapUpLoading ? (
                    <>Loading...</>
                  ) : (
                    <>
                      <CheckCircle size={18} />
                      Wrap up
                    </>
                  )}
                </button>
              )}
              
            <div className="call-action-buttons">
              
              {previewActions.length ? (
                <>
                  {previewActions.includes('ACCEPT') && (
                    <button className="btn-accept" onClick={handleAcceptCall}>
                      <PhoneCall />
                      Accept
                    </button>
                  )}
                  {(hasReject || hasClose || !previewActions.length) && (
                    <div className="call-widget-reject-menu" style={{ position: 'relative' }}>
                      <button
                        className="btn-reject"
                        onClick={handleRejectClick}
                        style={showRejectDropdown ? { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 } : undefined}
                      >
                        <PhoneOff />
                        {showRejectDropdown ? (
                          <>
                            Reject
                            <ChevronDown size={14} style={{ marginLeft: 2 }} />
                          </>
                        ) : (
                          onRejectWithAction ? (hasReject ? 'Reject' : 'Close') : 'Reject'
                        )}
                      </button>
                      {showRejectDropdown && showRejectMenu && (
                        <div
                          style={{
                            position: 'absolute',
                            bottom: '100%',
                            left: 0,
                            right: 0,
                            marginBottom: 4,
                            background: 'white',
                            border: '1px solid rgba(0,0,0,.15)',
                            borderRadius: 8,
                            boxShadow: '0 4px 12px rgba(0,0,0,.15)',
                            zIndex: 10,
                            overflow: 'hidden',
                          }}
                        >
                          {hasReject && (
                            <button
                              type="button"
                              className="dropdown-item-call"
                              style={{
                                display: 'block',
                                width: '100%',
                                padding: '8px 12px',
                                border: 'none',
                                background: 'none',
                                textAlign: 'left',
                                cursor: 'pointer',
                                fontSize: 13,
                                color: '#dc2626',
                              }}
                              onClick={() => { setShowRejectMenu(false); onRejectWithAction('REJECT'); }}
                            >
                              Reject
                            </button>
                          )}
                          {hasClose && (
                            <button
                              type="button"
                              className="dropdown-item-call"
                              style={{
                                display: 'block',
                                width: '100%',
                                padding: '8px 12px',
                                border: 'none',
                                background: 'none',
                                textAlign: 'left',
                                cursor: 'pointer',
                                fontSize: 13,
                                color: '#64748b',
                              }}
                              onClick={() => { setShowRejectMenu(false); onRejectWithAction('CLOSE'); }}
                            >
                              Close
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <button className="btn-accept" onClick={handleAcceptCall}>
                    <PhoneCall />
                    Accept
                  </button>
                  <button className="btn-reject" onClick={handleRejectCall}>
                    <PhoneOff />
                    Reject
                  </button>
                </>
              )}
            </div>

            {previewActions.includes('RECLASSIFY') && onReclassify && (
              <button
                type="button"
                className="btn-reclassify"
                onClick={() => {
                  void onReclassify();
                }}
              >
                Reclassify
              </button>
            )}

            </>
          )}
        </div>
      </div>
    </>
  );
};

export default CallWidget;
