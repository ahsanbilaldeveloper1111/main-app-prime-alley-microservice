import React, { useState, useEffect } from 'react';

interface PortLinkUnlinkModalProps {
  show: boolean;
  onHide: () => void;
  gsmName: string;
  initialSelectedPorts?: number[];
  maxPorts?: number;
  onSave: (selectedPorts: number[]) => void;
  onSuccess?: (selectedPorts: number[]) => void;
  title?: string;
  showSuccessModal?: boolean;
  successMessage?: string;
}

const PortLinkUnlinkModal: React.FC<PortLinkUnlinkModalProps> = ({
  show,
  onHide,
  gsmName,
  initialSelectedPorts = [],
  maxPorts = 10,
  onSave,
  onSuccess,
  title,
  showSuccessModal = true,
  successMessage
}) => {
  const [selectedPorts, setSelectedPorts] = useState<number[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);

  // Initialize selected ports when modal opens
  useEffect(() => {
    if (show) {
      setSelectedPorts(initialSelectedPorts);
      setShowSuccess(false);
    }
  }, [show, initialSelectedPorts]);

  const handlePortToggle = (portNumber: number) => {
    setSelectedPorts(prev => {
      if (prev.includes(portNumber)) {
        return prev.filter(port => port !== portNumber);
      } else {
        return [...prev, portNumber];
      }
    });
  };

  const handleSave = () => {
    console.log('Selected ports:', selectedPorts);
    
    // Call the save callback
    onSave(selectedPorts);
    
    // Close the main modal
    onHide();
    
    // Show success modal if enabled
    if (showSuccessModal) {
      setShowSuccess(true);
    }
    
    // Call success callback if provided
    if (onSuccess) {
      onSuccess(selectedPorts);
    }
  };

  const handleClose = () => {
    // Reset selected ports when closing
    setSelectedPorts([]);
    setShowSuccess(false);
    onHide();
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
  };

  // Generate port numbers array
  const portNumbers = Array.from({ length: maxPorts }, (_, i) => i + 1);

  const modalTitle = title || `Assign Ports to ${gsmName}`;
  const successMsg = successMessage || `The ports for **${gsmName}** have been successfully updated to: **${selectedPorts.join(', ')}**.`;

  return (
    <>
      {/* Main Ports Modal */}
      {show && (
        <div id="ports-modal" className="modal customModal" data-gsm-name={gsmName} style={{display: 'flex'}}>
          <div className="modal-content" style={{maxWidth: '600px'}}>
            <span className="close-btn" id="ports-close-btn" onClick={handleClose}>
              <i className="fas fa-times"></i>
            </span>
            <div className="ports-header">
              <h2 id="ports-modal-title">{modalTitle}</h2>
              <h3 style={{color: 'var(--primary-accent-dark)'}}>
                Selected Ports: <span className="count" id="assigned-count">{selectedPorts.length}</span>
              </h3>
            </div>
            <div className="ports-modal-body">
              <div className="ports-list-container">
                {portNumbers.map(portNumber => (
                  <button 
                    key={portNumber}
                    className={`port-tag ${selectedPorts.includes(portNumber) ? 'selected' : ''}`}
                    data-port={portNumber}
                    onClick={() => handlePortToggle(portNumber)}
                  >
                    {portNumber}
                    <span className="checkmark">
                      <i className="fas fa-check-circle"></i>
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-export" id="ports-cancel-btn" onClick={handleClose}>
                Cancel
              </button>
              <button className="btn btn-primary" id="ports-save-btn" onClick={handleSave}>
                Save Ports
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccess && (
        <div id="action-modal" className="modal customModal" style={{display: 'flex'}}>
          <div className="modal-content">
            <span className="close-btn" id="action-close-btn" onClick={handleSuccessClose}>
              <i className="fas fa-times"></i>
            </span>
            <h2 id="action-modal-title">Ports Updated!</h2>
            <p id="action-modal-text">{successMsg}</p>
            <div className="modal-footer">
              <button className="btn btn-export" id="action-cancel-btn" style={{display: 'none'}}>Cancel</button>
              <button className="btn btn-primary" id="action-confirm-btn" onClick={handleSuccessClose}>Done</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PortLinkUnlinkModal;
