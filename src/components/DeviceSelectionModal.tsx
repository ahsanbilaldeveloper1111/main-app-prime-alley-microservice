import React, { useState, useMemo } from 'react';
import { Modal, Button, ListGroup, Badge } from 'react-bootstrap';
import { getDeviceTypeLabel } from '@components/live-calls/utils/helpers';
import { getStorageImageUrl } from '@utils/imageUtils';
import UserDummyImage from '@assets/images/user-dummy.jpg';

interface Device {
  deviceName: string;
  deviceType: string;
  terminalState: string;
  when: string;
  details: string;
}

interface DeviceSelectionModalProps {
  show: boolean;
  onHide: () => void;
  devices: Device[];
  onSelectDevice: (device: Device) => void;
  extensionNumber: string;
  userAddress?: string | null;
  context?: 'monitoring' | 'dialing';
  monitorType?: string;
  toneType?: string;
  getUserDataExtensions?: () => any;
}

const DeviceSelectionModal: React.FC<DeviceSelectionModalProps> = ({
  show,
  onHide,
  devices,
  onSelectDevice,
  extensionNumber,
  userAddress,
  context = 'dialing',
  monitorType,
  toneType,
  getUserDataExtensions
}) => {
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

  // Get supervisor's (userAddress) extension data (image and name) - not the monitored agent's
  const extensionData = useMemo(() => {
    try {
      if (!getUserDataExtensions || !userAddress) {
        return null
      }
      
      const userDataExtensions = getUserDataExtensions() || {}
      const dnString = String(userAddress)
      const dnNumber = Number(userAddress)
      
      // Try different DN formats to match the key
      const data = userDataExtensions[userAddress] || userDataExtensions[dnString] || userDataExtensions[dnNumber] || null
      
      return data
    } catch (error) {
      console.error(`[DeviceSelectionModal ${userAddress}] Error getting extension data:`, error)
      return null
    }
  }, [userAddress, getUserDataExtensions])

  // Get supervisor's image URL
  const userImageUrl = useMemo(() => {
    if (!extensionData) {
      return UserDummyImage.src
    }
    
    const imagePath = extensionData?.image_path
    if (imagePath) {
      const url = getStorageImageUrl(imagePath)
      return url || UserDummyImage.src
    }
    return UserDummyImage.src
  }, [extensionData])

  // Get supervisor's name
  const userName = useMemo(() => {
    if (!extensionData) {
      return userAddress || 'Supervisor'
    }
    return extensionData?.name || extensionData?.user_name || userAddress || 'Supervisor'
  }, [extensionData, userAddress])

  const handleDeviceSelect = (device: Device) => {
    setSelectedDevice(device);
  };

  const handleConfirm = () => {
    if (selectedDevice) {
      onSelectDevice(selectedDevice);
      setSelectedDevice(null);
    }
  };

  const handleClose = () => {
    setSelectedDevice(null);
    onHide();
  };

  const getDeviceTypeIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'ANDROID':
        return '📱';
      case 'SOFT':
        return '💻';
      case 'IP_PHONE':
        return '☎️';
      case 'HARD':
        return '📞';
      default:
        return '📱';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'REGISTERED':
        return 'success';
      case 'UNREGISTERED':
        return 'danger';
      case 'STALE':
        return 'warning';
      case 'BUSY':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  const isDeviceEnabled = (device: Device) => {
    return device.terminalState === 'REGISTERED';
  };

  const getModalTitle = () => {
    // if (context === 'monitoring') {
    //   return `Select Monitoring Device for Extension ${extensionNumber}`;
    // }
    //return `Select Device for Extension ${extensionNumber}`;
    return `Device Selection`;
  };

  const getModalDescription = () => {
    // if (context === 'monitoring') {
    //   return `Extension ${extensionNumber} has multiple devices registered. Please select which device you want to use for ${monitorType?.toLowerCase().replace('_', ' ')} monitoring:`;
    // }
    //return `Extension ${extensionNumber} has multiple devices registered. Please select which device you want to use for this call:`;
    return `Please select which device you want to use for this call (monitoring or dialing):`;
  };

  return (
    <Modal show={show} onHide={handleClose} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="fas fa-mobile-alt me-2"></i>
          {getModalTitle()}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="row g-4">
          {/* First Column - User Info */}
          <div className="col-md-4 border-end">
            <div className="d-flex flex-column align-items-center text-center p-3">
              {userImageUrl && (
                <img 
                  src={userImageUrl} 
                  alt={userName}
                  className="rounded-circle mb-3"
                  style={{
                    width: '80px',
                    height: '80px',
                    objectFit: 'cover',
                    border: '2px solid #e5e7eb'
                  }}
                  onError={(e) => {
                    e.currentTarget.src = UserDummyImage.src
                  }}
                />
              )}
              <div className="fw-bold mb-2" style={{ fontSize: '1.2rem' }}>{userName}</div>
              <div className="text-muted" style={{ fontSize: '0.9rem' }}>
                Extension: {userAddress || extensionNumber}
              </div>
            </div>
          </div>
          
          {/* Second Column - Device List */}
          <div className="col-md-8">
            <p className="text-muted mb-3">
              {getModalDescription()}
            </p>
            
            <ListGroup>
          {devices.map((device, index) => {
            const isEnabled = isDeviceEnabled(device);
            const isSelected = selectedDevice?.deviceName === device.deviceName;
            
            return (
              <ListGroup.Item
                key={index}
                action={isEnabled}
                active={isSelected && isEnabled}
               
                onClick={() => {
                  if (isEnabled) {
                    handleDeviceSelect(device);
                  }
                }}
                className="d-flex justify-content-between align-items-center p-2"
                style={{ 
                  cursor: isEnabled ? 'pointer' : 'not-allowed',
                  opacity: isEnabled ? 1 : 1,
                  backgroundColor: !isEnabled ? '#f8f9fa' : undefined,
                  borderLeft: !isEnabled ? '3px solid #dee2e6' : undefined
                }}
                disabled={!isEnabled}
              >
                <div className="d-flex align-items-center">
                  <span className="me-3 fs-4" style={{ opacity: isEnabled ? 1 : 0.5 }}>{getDeviceTypeIcon(device.deviceType)}</span>
                  <div>
                    <div className="fw-bold" style={{ color: isEnabled ? '#212529' : '#6c757d' }}>{getDeviceTypeLabel(device.deviceType)}</div>
                    {/* <small className="text-muted">
                      Device: {device.deviceName} | 
                      Last seen: {new Date(device.when).toLocaleString()}
                    </small> */}
                  </div>
                </div>
                <div className="d-flex flex-column align-items-end">
                  <Badge bg={isEnabled ? 'success' : 'danger'}>
                    {isEnabled ? 'Online' : 'Offline'}
                  </Badge>
                  {/* {!isEnabled && (
                    <small className="text-danger mt-1" style={{ fontSize: '0.7rem' }}>
                      Not available
                    </small>
                  )} */}
                </div>
              </ListGroup.Item>
            );
          })}
            </ListGroup>
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="default  " onClick={handleClose}>
          Cancel
        </Button>
        <Button 
          variant="primary" 
          onClick={handleConfirm}
          disabled={!selectedDevice}
        >
          <i className={context === 'monitoring' ? 'fas fa-ear-listen me-2' : 'fas fa-phone me-2'}></i>
          {context === 'monitoring' ? 'Start Monitoring' : 'Use Selected Device'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DeviceSelectionModal;
