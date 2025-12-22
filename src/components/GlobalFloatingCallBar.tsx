'use client';

import React, { useState, useEffect } from 'react';
import { Button, Modal, Form } from 'react-bootstrap';
import { useCti } from '../contexts/CtiContext';
import { usePermissions } from '../utils/permissionUtils';
import { toast } from 'react-toastify';
import DeviceSelectionModal from './DeviceSelectionModal';
import { useRouter } from 'next/router';
import { useDialerModal } from '../contexts/DialerModalContext';

// Add styles for the floating call bar
const floatingBarStyles = `
  .global-floating-call-bar {
    animation: slideUp 0.3s ease-out;
  }
  
  .global-floating-call-bar:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.2) !important;
  }
  
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.7;
    }
  }
  
  .global-floating-call-bar .call-status-ringing {
    animation: pulse 1.5s ease-in-out infinite;
  }
`;

const GlobalFloatingCallBar: React.FC = () => {
  const {
    isInitialized,
    userAddress,
    activeCalls,
    dnsMap,
    formatDuration,
    makeCall,
    dialNumber, // Use dialNumber for simplified calls
    endCall,
    holdCall,
    resumeCall,
    transferCall,
    getCallingDeviceInfo,
    getAllUserDevices,
    canDialNumber,
    getAvailableExtensions
  } = useCti();
  
  const { hasPermission } = usePermissions();
  const router = useRouter();
  const { isOpen: showDialerModal, closeDialer } = useDialerModal();
  const [dialedNumber, setDialedNumber] = useState('');
  const [isDialing, setIsDialing] = useState(false);
  const [showDeviceSelectionModal, setShowDeviceSelectionModal] = useState(false);
  const [availableDevices, setAvailableDevices] = useState<any[]>([]);
  const [pendingDialedNumber, setPendingDialedNumber] = useState('');
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferTarget, setTransferTarget] = useState('');
  const [extensionSearch, setExtensionSearch] = useState('');
  
  // Get the first active call (for display) - prefer connected calls, include onHold
  const activeCall = Array.from(activeCalls.values())
    .filter(call => ['connected', 'ringing', 'dialing', 'onHold'].includes(call.status))
    .sort((a, b) => {
      // Prioritize connected calls, then onHold, then ringing
      if (a.status === 'connected' && b.status !== 'connected') return -1;
      if (b.status === 'connected' && a.status !== 'connected') return 1;
      if (a.status === 'onHold' && !['connected'].includes(b.status)) return -1;
      if (b.status === 'onHold' && !['connected'].includes(a.status)) return 1;
      return 0;
    })[0];
  
  // Don't show if CTI is not initialized or user doesn't have permission
  // Also check if we're on the dialer or live-calls page itself (to avoid duplicate UI)
  // Only show if there's an active call (dialer button is now in topbar)
  const hideOnPages = ['/cti/dialer', '/cti/live-calls'];
  if (!isInitialized || !hasPermission('dial-call-cti') || hideOnPages.includes(router.pathname) || !activeCall) {
    return null;
  }
  
  const handleDialerClick = () => {
    // Open dialer modal - handled by context
    // This is now triggered from topbar via context
  };
  
  const handleDial = async (numberToDial: string = dialedNumber) => {
    if (!numberToDial.trim()) {
      toast.error('Please enter a number to dial');
      return;
    }
    
    setIsDialing(true);
    try {
      // Use dialNumber - it handles device selection, number cleaning, and validation automatically
      const result = await dialNumber(numberToDial);
      
      if (result.success) {
        toast.success(`Calling ${numberToDial}...`);
        setDialedNumber('');
        closeDialer();
      } else {
        toast.error(result.error || 'Failed to make call');
      }
    } catch (error) {
      toast.error('Failed to make call');
    } finally {
      setIsDialing(false);
    }
  };
  
  const handleDeviceSelect = (device: any) => {
    const callingDevice = {
      callingAddress: userAddress,
      callingDeviceType: device.deviceType,
      callingDeviceName: device.deviceName
    };
    
    // Store the selected device info in localStorage for consistent use
    const callerInfo = {
      callingAddress: userAddress,
      callingDeviceName: device.deviceName,
      callingDeviceType: device.deviceType,
      selectedAt: new Date().toISOString()
    };
    
    localStorage.setItem('cti_caller_info', JSON.stringify(callerInfo));
    
    setShowDeviceSelectionModal(false);
    setAvailableDevices([]);
    setPendingDialedNumber('');
    
    // Proceed with dialing using selected device
    setIsDialing(true);
    makeCall({
      callingAddress: callingDevice.callingAddress,
      calledAddress: pendingDialedNumber,
      callingDeviceType: callingDevice.callingDeviceType,
      callingDeviceName: callingDevice.callingDeviceName
    }).then(result => {
      if (result.success) {
        toast.success(`Calling ${pendingDialedNumber}...`);
        setDialedNumber('');
        closeDialer();
      } else {
        toast.error(result.error || 'Failed to make call');
      }
    }).catch(error => {
      toast.error('Failed to make call');
    }).finally(() => {
      setIsDialing(false);
    });
  };
  
  const handleEndCall = async () => {
    if (!activeCall || !activeCall.callId) {
      toast.error('Call ID not available');
      return;
    }
    
    const callingDevice = getCallingDeviceInfo();
    if (!callingDevice) {
      toast.error('No calling device information available');
      return;
    }
    
    try {
      const result = await endCall({
        callId: activeCall.callId,
        callingAddress: callingDevice.callingAddress,
        calledAddress: activeCall.calledAddress || activeCall.number,
        callingDeviceType: callingDevice.callingDeviceType,
        callingDeviceName: callingDevice.callingDeviceName
      });
      
      if (result.success) {
        toast.success('Call ended');
      } else {
        toast.error(result.error || 'Failed to end call');
      }
    } catch (error) {
      toast.error('Failed to end call');
    }
  };
  
  const handleHoldCall = async () => {
    if (!activeCall || !activeCall.callId) {
      toast.error('Call ID not available');
      return;
    }
    
    const callingDevice = getCallingDeviceInfo();
    if (!callingDevice) {
      toast.error('No calling device information available');
      return;
    }
    
    try {
      const result = await holdCall({
        callId: activeCall.callId,
        callingAddress: callingDevice.callingAddress,
        calledAddress: activeCall.calledAddress || activeCall.number,
        callingDeviceType: callingDevice.callingDeviceType,
        callingDeviceName: callingDevice.callingDeviceName
      });
      
      if (result.success) {
        toast.success('Call put on hold');
      } else {
        toast.error(result.error || 'Failed to hold call');
      }
    } catch (error) {
      toast.error('Failed to hold call');
    }
  };
  
  const handleResumeCall = async () => {
    if (!activeCall || !activeCall.callId) {
      toast.error('Call ID not available');
      return;
    }
    
    const callingDevice = getCallingDeviceInfo();
    if (!callingDevice) {
      toast.error('No calling device information available');
      return;
    }
    
    try {
      const result = await resumeCall({
        callId: activeCall.callId,
        callingAddress: callingDevice.callingAddress,
        calledAddress: activeCall.calledAddress || activeCall.number,
        callingDeviceType: callingDevice.callingDeviceType,
        callingDeviceName: callingDevice.callingDeviceName
      });
      
      if (result.success) {
        toast.success('Call resumed');
      } else {
        toast.error(result.error || 'Failed to resume call');
      }
    } catch (error) {
      toast.error('Failed to resume call');
    }
  };
  
  const handleTransferCall = async () => {
    if (!activeCall || !activeCall.callId) {
      toast.error('Call ID not available');
      return;
    }
    
    if (!transferTarget.trim()) {
      toast.error('Please select a target extension');
      return;
    }
    
    const callingDevice = getCallingDeviceInfo();
    if (!callingDevice) {
      toast.error('No calling device information available');
      return;
    }
    
    // Check if target extension is available
    const targetCall = Array.from(activeCalls.values()).find(c => 
      c.number === transferTarget && ['connected', 'ringing', 'dialing'].includes(c.status)
    );
    
    if (targetCall) {
      toast.error(`Extension ${transferTarget} is currently busy`);
      return;
    }
    
    try {
      const result = await transferCall({
        callId: activeCall.callId,
        transferAddress: activeCall.calledAddress || activeCall.number,
        targetAddress: transferTarget,
        mode: 'BLIND'
        // transferInitiatorAddress, transferInitiatorDeviceType, transferInitiatorDeviceName 
        // are optional and will be auto-filled by transferCall function
      });
      
      if (result.success) {
        toast.success(`Call transferred to ${transferTarget}`);
        setShowTransferModal(false);
        setTransferTarget('');
        setExtensionSearch('');
      } else {
        toast.error(result.error || 'Failed to transfer call');
      }
    } catch (error) {
      toast.error('Failed to transfer call');
    }
  };
  
  const getAvailableExtensionsForTransfer = () => {
    return getAvailableExtensions().filter(ext => {
      // Filter out extensions that are currently in calls
      const isInCall = Array.from(activeCalls.values()).some(call => 
        call.number === ext && ['connected', 'ringing', 'dialing'].includes(call.status)
      );
      return !isInCall;
    });
  };
  
  const handleOpenFullDialer = () => {
    router.push('/cti/dialer');
  };
  
  return (
    <>
      <style>{floatingBarStyles}</style>
      {/* Floating Call Bar */}
      <div
        className="global-floating-call-bar"
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 1050,
          backgroundColor: '#fff',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          minWidth: activeCall ? '280px' : 'auto',
          border: '1px solid #e0e0e0',
          transition: 'all 0.3s ease',
          cursor: 'pointer'
        }}
      >
        {activeCall && (
          <>
            {/* Active Call Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ 
                fontSize: '14px', 
                fontWeight: 600, 
                color: '#333',
                marginBottom: '4px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {activeCall.number}
              </div>
              {activeCall.status === 'connected' && activeCall.duration !== undefined && (
                <div style={{ 
                  fontSize: '12px', 
                  color: '#666',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <i className="material-icons-two-tone" style={{ fontSize: '14px' }}>call</i>
                  {formatDuration(activeCall.duration)}
                </div>
              )}
              {activeCall.status === 'onHold' && (
                <div style={{ fontSize: '12px', color: '#ff9800', fontWeight: 500 }}>
                  <i className="material-icons-two-tone me-1" style={{ fontSize: '14px', verticalAlign: 'middle' }}>pause_circle</i>
                  On Hold
                </div>
              )}
              {activeCall.status === 'ringing' && (
                <div className="call-status-ringing" style={{ fontSize: '12px', color: '#ff9800', fontWeight: 500 }}>
                  <i className="material-icons-two-tone me-1" style={{ fontSize: '14px', verticalAlign: 'middle' }}>phone_in_talk</i>
                  Ringing...
                </div>
              )}
              {activeCall.status === 'dialing' && (
                <div style={{ fontSize: '12px', color: '#ff9800', fontWeight: 500 }}>
                  <i className="material-icons-two-tone me-1" style={{ fontSize: '14px', verticalAlign: 'middle' }}>call_made</i>
                  Dialing...
                </div>
              )}
            </div>
            
            {/* Call Control Buttons */}
            <div style={{ display: 'flex', gap: '4px' }}>
              {activeCall.status === 'connected' && (
                <>
                  <Button
                    variant="warning"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleHoldCall();
                    }}
                    style={{
                      borderRadius: '8px',
                      padding: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Hold Call"
                  >
                    <i className="material-icons-two-tone" style={{ fontSize: '18px', backgroundColor: '#fff' }}>
                      pause
                    </i>
                  </Button>
                  <Button
                    variant="info"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowTransferModal(true);
                    }}
                    style={{
                      borderRadius: '8px',
                      padding: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Transfer Call"
                  >
                    <i className="material-icons-two-tone" style={{ fontSize: '18px', backgroundColor: '#fff' }}>
                      call_made
                    </i>
                  </Button>
                </>
              )}
              {activeCall.status === 'onHold' && (
                <Button
                  variant="success"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleResumeCall();
                  }}
                  style={{
                    borderRadius: '8px',
                    padding: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Resume Call"
                >
                  <i className="material-icons-two-tone" style={{ fontSize: '18px', backgroundColor: '#fff' }}>
                    play_arrow
                  </i>
                </Button>
              )}
              <Button
                variant="danger"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEndCall();
                }}
                style={{
                  borderRadius: '8px',
                  padding: '8px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title="End Call"
              >
                <i className="material-icons-two-tone" style={{ fontSize: '18px', backgroundColor: '#fff' }}>
                  call_end
                </i>
              </Button>
            </div>
          </>
        )}
      </div>
      
      {/* Quick Dialer Modal */}
      <Modal
        show={showDialerModal}
        onHide={() => {
          closeDialer();
          setDialedNumber('');
        }}
        centered
        size="sm"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="material-icons-two-tone me-2">dialpad</i>
            Quick Dial
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold">Enter Number</Form.Label>
            <Form.Control
              type="text"
              placeholder="Extension or number"
              value={dialedNumber}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, '');
                if (value.length <= 15) {
                  setDialedNumber(value);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && dialedNumber.trim()) {
                  handleDial();
                }
              }}
              autoFocus
              className="form-control-lg"
              style={{ fontSize: '18px', textAlign: 'center' }}
            />
            <Form.Text className="text-muted">
              Enter extension number or phone number to dial
            </Form.Text>
          </Form.Group>
          
          {/* Quick Extension Buttons */}
          {getAvailableExtensions && getAvailableExtensions().length > 0 && (
            <div className="mb-3">
              <Form.Label className="fw-semibold small">Quick Dial Extensions</Form.Label>
              <div className="d-flex flex-wrap gap-2" style={{ maxHeight: '120px', overflowY: 'auto' }}>
                {getAvailableExtensions().slice(0, 10).map((ext) => (
                  <Button
                    key={ext}
                    variant="outline-primary"
                    size="sm"
                    onClick={() => {
                      setDialedNumber(ext);
                    }}
                    style={{ minWidth: '60px' }}
                  >
                    {ext}
                  </Button>
                ))}
              </div>
            </div>
          )}
          
          {activeCall && (
            <div className="mb-3 p-3 bg-light rounded">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <strong>Active Call</strong>
                <span className={`badge bg-${
                  activeCall.status === 'connected' ? 'success' :
                  activeCall.status === 'ringing' ? 'warning' : 'info'
                }`}>
                  {activeCall.status}
                </span>
              </div>
              <div className="small">
                <div>Number: {activeCall.number}</div>
                {activeCall.status === 'connected' && activeCall.duration !== undefined && (
                  <div>Duration: {formatDuration(activeCall.duration)}</div>
                )}
              </div>
            </div>
          )}
          
          <div className="d-flex gap-2">
            <Button
              variant="primary"
              onClick={() => handleDial()}
              disabled={!dialedNumber.trim() || isDialing}
              className="flex-fill"
            >
              {isDialing ? 'Dialing...' : 'Call'}
            </Button>
            <Button
              variant="outline-secondary"
              onClick={handleOpenFullDialer}
            >
              <i className="material-icons-two-tone me-1" style={{ fontSize: '18px' }}>open_in_new</i>
              Full Dialer
            </Button>
          </div>
        </Modal.Body>
      </Modal>
      
      {/* Device Selection Modal */}
      <DeviceSelectionModal
        show={showDeviceSelectionModal}
        onHide={() => {
          setShowDeviceSelectionModal(false);
          setAvailableDevices([]);
          setPendingDialedNumber('');
        }}
        devices={availableDevices}
        onSelectDevice={handleDeviceSelect}
        extensionNumber={userAddress || ''}
      />
      
      {/* Transfer Call Modal */}
      <Modal
        show={showTransferModal}
        onHide={() => {
          setShowTransferModal(false);
          setTransferTarget('');
          setExtensionSearch('');
        }}
        centered
        size="sm"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="material-icons-two-tone me-2">call_made</i>
            Transfer Call
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold">Select Target Extension</Form.Label>
            <Form.Control
              type="text"
              placeholder="Search extensions..."
              value={extensionSearch}
              onChange={(e) => setExtensionSearch(e.target.value)}
              className="mb-2"
            />
            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {getAvailableExtensionsForTransfer()
                .filter(ext => 
                  extensionSearch === '' || 
                  ext.toLowerCase().includes(extensionSearch.toLowerCase())
                )
                .map((ext) => {
                  const extensionData = dnsMap?.[ext];
                  const deviceList = extensionData ? Object.values(extensionData.devices || {}) : [];
                  const isOnline = deviceList.some((d: any) => d.terminalState === 'REGISTERED');
                  
                  return (
                    <Button
                      key={ext}
                      variant={transferTarget === ext ? 'primary' : 'outline-primary'}
                      size="sm"
                      className="w-100 mb-2"
                      onClick={() => setTransferTarget(ext)}
                    >
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="fw-bold">{ext}</span>
                        <small className={isOnline ? 'text-success' : 'text-muted'}>
                          {isOnline ? 'ONLINE' : 'OFFLINE'}
                        </small>
                      </div>
                    </Button>
                  );
                })}
            </div>
            {getAvailableExtensionsForTransfer().length === 0 && (
              <div className="alert alert-warning py-2">
                <i className="material-icons-two-tone me-2">warning</i>
                <small>No available extensions for transfer</small>
              </div>
            )}
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setShowTransferModal(false);
              setTransferTarget('');
              setExtensionSearch('');
            }}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleTransferCall}
            disabled={!transferTarget}
          >
            Transfer
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default GlobalFloatingCallBar;

