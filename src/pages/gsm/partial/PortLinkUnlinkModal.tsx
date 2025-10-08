import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

interface Port {
  id: number;
  port_number: string;
}

interface PortLinkUnlinkModalProps {
  show: boolean;
  onHide: () => void;
  gsmName: string;
  companyName: string;
  assignedPorts: string; // comma-separated string
  unassignedPorts: Port[]; // array of port objects
  gsmId: string;
  companyId: string;
  onSuccess: () => void;
  title?: string;
  showSuccessModal?: boolean;
  successMessage?: string;
}

const PortLinkUnlinkModal: React.FC<PortLinkUnlinkModalProps> = ({
  show,
  onHide,
  gsmName,
  companyName,
  assignedPorts,
  unassignedPorts,
  gsmId,
  companyId,
  onSuccess,
  title,
  showSuccessModal = true,
  successMessage
}) => {
  const [selectedPorts, setSelectedPorts] = useState<number[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Parse assigned ports from comma-separated string
  const assignedPortsArray = assignedPorts 
    ? assignedPorts.split(',').map(port => parseInt(port.trim())).filter(port => !isNaN(port))
    : [];

  // Create all ports array (assigned + unassigned)
  const allPorts = [
    ...assignedPortsArray.map(portNumber => ({ portNumber, isAssigned: true })),
    ...unassignedPorts.map(port => ({ portNumber: parseInt(port.port_number), isAssigned: false, id: port.id }))
  ].sort((a, b) => a.portNumber - b.portNumber);

  // Initialize selected ports when modal opens
  useEffect(() => {
    if (show) {
      setSelectedPorts(assignedPortsArray);
      setShowSuccess(false);
    }
  }, [show, assignedPorts]);

  const handlePortToggle = (portNumber: number) => {
    setSelectedPorts(prev => {
      if (prev.includes(portNumber)) {
        return prev.filter(port => port !== portNumber);
      } else {
        return [...prev, portNumber];
      }
    });
  };

  const handleSave = async () => {
    setIsLoading(true);
    
    try {
      // Determine which ports to assign and which to unassign
      const portsToAssign = selectedPorts.filter(port => !assignedPortsArray.includes(port));
      const portsToUnassign = assignedPortsArray.filter(port => !selectedPorts.includes(port));
      
      // Import the API functions
      const { AssignPorts, UnassignPorts } = await import('@utils/GsmAssign');
      
      let allOperationsSuccessful = true;
      
      // Assign new ports
      if (portsToAssign.length > 0) {
        // Get the port IDs for unassigned ports
        const portIdsToAssign = portsToAssign.map(portNumber => {
          const port = unassignedPorts.find(p => parseInt(p.port_number) === portNumber);
          return port ? port.id : null;
        }).filter(id => id !== null);
        
        if (portIdsToAssign.length > 0) {
          const assignSuccess = await AssignPorts(gsmId, companyId, portIdsToAssign);
          if (!assignSuccess) {
            allOperationsSuccessful = false;
          }
        }
      }
      
      // Unassign removed ports
      if (portsToUnassign.length > 0) {
        const unassignSuccess = await UnassignPorts(gsmId, companyId, portsToUnassign);
        if (!unassignSuccess) {
          allOperationsSuccessful = false;
        }
      }
      
      if (allOperationsSuccessful) {
        toast.success('Ports updated successfully');
        onSuccess();
        onHide();
        
        // Show success modal if enabled
        if (showSuccessModal) {
          setShowSuccess(true);
        }
      } else {
        toast.error('Some operations failed. Please try again.');
      }
    } catch (error) {
      console.error('Error updating ports:', error);
      toast.error('Failed to update ports');
    } finally {
      setIsLoading(false);
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

  const modalTitle = title || `Manage Ports - ${gsmName}`;
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
                Company: {companyName}
              </h3>
              <h4 style={{color: 'var(--primary-accent-dark)'}}>
                Selected Ports: <span className="count" id="assigned-count">{selectedPorts.length}</span>
              </h4>
            </div>
            <div className="ports-modal-body">
              <div className="ports-list-container">
                {allPorts.map(port => (
                  <button 
                    key={port.portNumber}
                    className={`port-tag ${selectedPorts.includes(port.portNumber) ? 'selected' : ''}`}
                    data-port={port.portNumber}
                    onClick={() => handlePortToggle(port.portNumber)}
                    disabled={isLoading}
                    style={{
                      opacity: isLoading ? 0.6 : 1,
                      cursor: isLoading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {port.portNumber}
                    <span className="checkmark">
                      <i className="fas fa-check-circle"></i>
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-export" id="ports-cancel-btn" onClick={handleClose} disabled={isLoading}>
                Cancel
              </button>
              <button className="btn btn-primary" id="ports-save-btn" onClick={handleSave} disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save Ports'}
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
