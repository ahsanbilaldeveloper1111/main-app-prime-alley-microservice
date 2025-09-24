import React, { useState } from 'react';
import { Modal, Button, ListGroup, Badge } from 'react-bootstrap';

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
  context?: 'monitoring' | 'dialing';
  monitorType?: string;
  toneType?: string;
}

const DeviceSelectionModal: React.FC<DeviceSelectionModalProps> = ({
  show,
  onHide,
  devices,
  onSelectDevice,
  extensionNumber,
  context = 'dialing',
  monitorType,
  toneType
}) => {
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

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
      case 'BUSY':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  const getModalTitle = () => {
    if (context === 'monitoring') {
      return `Select Monitoring Device for Extension ${extensionNumber}`;
    }
    return `Select Device for Extension ${extensionNumber}`;
  };

  const getModalDescription = () => {
    if (context === 'monitoring') {
      return `Extension ${extensionNumber} has multiple devices registered. Please select which device you want to use for ${monitorType?.toLowerCase().replace('_', ' ')} monitoring:`;
    }
    return `Extension ${extensionNumber} has multiple devices registered. Please select which device you want to use for this call:`;
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
        <p className="text-muted mb-3">
          {getModalDescription()}
        </p>
        
        {context === 'monitoring' && monitorType && toneType && (
          <div className="alert alert-info mb-3">
            <strong>Monitoring Details:</strong><br />
            Type: <span className="badge bg-primary">{monitorType}</span><br />
            Tone: <span className="badge bg-secondary">{toneType}</span>
          </div>
        )}
        
        <ListGroup>
          {devices.map((device, index) => (
            <ListGroup.Item
              key={index}
              action
              active={selectedDevice?.deviceName === device.deviceName}
              onClick={() => handleDeviceSelect(device)}
              className="d-flex justify-content-between align-items-center"
              style={{ cursor: 'pointer' }}
            >
              <div className="d-flex align-items-center">
                <span className="me-3 fs-4">{getDeviceTypeIcon(device.deviceType)}</span>
                <div>
                  <div className="fw-bold">{device.deviceName}</div>
                  <small className="text-muted">
                    Type: {device.deviceType} | 
                    Last seen: {new Date(device.when).toLocaleString()}
                  </small>
                </div>
              </div>
              <div className="d-flex flex-column align-items-end">
                <Badge bg={getStatusBadgeVariant(device.terminalState)}>
                  {device.terminalState}
                </Badge>
                {device.details && (
                  <small className="text-muted mt-1">{device.details}</small>
                )}
              </div>
            </ListGroup.Item>
          ))}
        </ListGroup>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
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
