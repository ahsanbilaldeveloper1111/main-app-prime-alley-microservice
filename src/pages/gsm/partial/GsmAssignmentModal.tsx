import React, { useState, useEffect } from 'react';
import { NewAssignement } from '@utils/GsmAssign';
import { getGsmData } from '@utils/GsmManagement';

interface GsmAssignmentModalProps {
  show: boolean;
  onHide: () => void;
  onSuccess?: (assignment: { selectedGsm: string; selectedCompany: string }) => void;
}

const GsmAssignmentModal: React.FC<GsmAssignmentModalProps> = ({ show, onHide, onSuccess }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedGsm, setSelectedGsm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [gsmList, setGsmList] = useState<any[]>([]);
  const [companyList, setCompanyList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch GSM and company data when modal opens
  useEffect(() => {
    if (show) {
      fetchData();
    }
  }, [show]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await getGsmData();
      if (response) {
        setGsmList(response?.gsm || []);
        setCompanyList(response?.company || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBackStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSaveAssignment = async () => {
    try {
      // Call the API to create the assignment
      const response = await NewAssignement(selectedGsm, selectedCompany);
      
      if (response) {
        // Close the main modal
        onHide();
        
        // Reset form state
        setCurrentStep(1);
        setSelectedGsm('');
        setSelectedCompany('');
        
        // Show success modal
        setShowSuccessModal(true);
        
        // Call success callback if provided
        if (onSuccess) {
          onSuccess({ selectedGsm, selectedCompany });
        }
      }
    } catch (error) {
      console.error('Assignment error:', error);
      // Error handling is already done in the NewAssignement function via toast
    }
  };

  const handleClose = () => {
    // Reset form state when closing
    setCurrentStep(1);
    setSelectedGsm('');
    setSelectedCompany('');
    onHide();
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
  };

  return (
    <>
      {/* Main Assignment Modal */}
      {show && (
        <div id="new-assign-modal" className="modal customModal" style={{display: 'flex'}}>
          <div className="modal-content">
            <span className="close-btn" id="new-assign-close-btn" onClick={handleClose}>
              <i className="fas fa-times"></i>
            </span>
            <h2 id="modal-title">New GSM Assignment</h2>
            
            <div className="step-indicators">
              <div className={`step ${currentStep === 1 ? 'active' : ''}`} id="step-1-indicator">1</div>
              <div className={`step ${currentStep === 2 ? 'active' : ''}`} id="step-2-indicator">2</div>
              <div className={`step ${currentStep === 3 ? 'active' : ''}`} id="step-3-indicator">3</div>
            </div>

            <div className="modal-body">
              <div className="modal-step" id="step-1" style={{display: currentStep === 1 ? 'block' : 'none'}}>
                <p>Select the GSM device you want to assign from the available options below.</p>
                <div className="form-group">
                  <label>Select GSM</label>
                  <select 
                    id="gsm-select" 
                    value={selectedGsm} 
                    onChange={(e) => setSelectedGsm(e.target.value)}
                    disabled={isLoading}
                  >
                    <option value="">-- Choose a GSM Device --</option>
                    {gsmList.map((gsm: any) => (
                      <option key={gsm.id} value={gsm.id}>
                        {gsm.name}
                      </option>
                    ))}
                  </select>
                  {isLoading && <small>Loading GSM devices...</small>}
                </div>
              </div>

              <div className="modal-step" id="step-2" style={{display: currentStep === 2 ? 'block' : 'none'}}>
                <p>Choose the company that will be associated with this selected GSM device.</p>
                <div className="form-group">
                  <label>Select Company</label>
                  <select 
                    id="company-select" 
                    value={selectedCompany} 
                    onChange={(e) => setSelectedCompany(e.target.value)}
                    disabled={isLoading}
                  >
                    <option value="">-- Choose a Company --</option>
                    {companyList.map((company: any) => (
                      <option key={company.identifier} value={company.identifier}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                  {isLoading && <small>Loading companies...</small>}
                </div>
              </div>
              
              <div className="modal-step" id="step-3" style={{display: currentStep === 3 ? 'block' : 'none'}}>
                <p>Review the details below to ensure all information is correct before finalizing the assignment.</p>
                <div className="confirmation-details">
                  <p><strong>Selected GSM:</strong> <span id="confirm-gsm">
                    {gsmList.find(gsm => gsm.id === selectedGsm)?.name || selectedGsm}
                  </span></p>
                  <p><strong>Assigned to Company:</strong> <span id="confirm-company">
                    {companyList.find(company => company.identifier === selectedCompany)?.name || selectedCompany}
                  </span></p>
                  <p>
                    <small style={{color: 'var(--light-text)'}}>
                      *Ports will be assigned in a subsequent step or automatically based on company policy.
                    </small>
                  </p>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn btn-export" 
                id="back-btn" 
                style={{display: currentStep > 1 ? 'flex' : 'none'}}
                onClick={handleBackStep}
              >
                <i className="fas fa-arrow-left"></i> Back
              </button>
              <button 
                className="btn btn-primary" 
                id="next-btn" 
                style={{display: currentStep < 3 ? 'flex' : 'none'}}
                onClick={handleNextStep}
                disabled={currentStep === 1 && !selectedGsm}
              >
                Next <i className="fas fa-arrow-right"></i>
              </button>
              <button 
                className="btn btn-primary" 
                id="save-btn" 
                style={{display: currentStep === 3 ? 'flex' : 'none'}}
                onClick={handleSaveAssignment}
                disabled={!selectedGsm || !selectedCompany}
              >
                <i className="fas fa-save"></i> Save Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div id="action-modal" className="modal customModal" style={{display: 'flex'}}>
          <div className="modal-content">
            <span className="close-btn" id="action-close-btn" onClick={handleSuccessModalClose}>
              <i className="fas fa-times"></i>
            </span>
            <h2 id="action-modal-title">Assignment Successful!</h2>
            <p id="action-modal-text">
              The GSM **"{gsmList.find(gsm => gsm.id === selectedGsm)?.name || selectedGsm}"** has been successfully assigned to **"{companyList.find(company => company.identifier === selectedCompany)?.name || selectedCompany}"**.
            </p>
            <div className="modal-footer">
              <button className="btn btn-export" id="action-cancel-btn" style={{display: 'none'}}>Cancel</button>
              <button className="btn btn-primary" id="action-confirm-btn" onClick={handleSuccessModalClose}>Done</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GsmAssignmentModal;
