import { AlertCircle, Check,Info,X } from 'lucide-react';
import React, { useState } from 'react';
import { Button, Form, Modal } from 'react-bootstrap';

interface FormModalProps {
  show: boolean;
  onHide: () => void;
  title: string;
  desc: string;
  formHtml: React.ReactNode;
  submitButtonText: string;
  cancelButtonText: string;
  onSubmit: () => void;
  onCancel?: () => void;
  submitButtonVariant?: 'primary' | 'danger' | 'warning' | 'success';
  cancelButtonVariant?: 'secondary' | 'export' | 'outline-secondary' | 'primary';
  ShowSubmitButton?: boolean;
  isSubmitting?: boolean;
  titleIcon?: React.ReactNode;
  isSubmitDisabled?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  guidelines?: React.ReactNode;
  showGuidelines?: boolean;
}

const FormModal: React.FC<FormModalProps> = ({
  show,
  onHide,
  title,
  desc,
  formHtml,
  submitButtonText = "Submit",
  cancelButtonText = "Cancel",
  onSubmit,
  onCancel,
  submitButtonVariant = 'primary',
  cancelButtonVariant = 'export',
  ShowSubmitButton = true,
  isSubmitting = false,
  titleIcon,
  isSubmitDisabled = false,
  size = 'md',
  guidelines,
  showGuidelines = false
}) => {
  const [isGuidelinesExpanded, setIsGuidelinesExpanded] = useState(false);

  const handleSubmit = () => {
    onSubmit();
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      onHide();
    }
  };

  const handleClose = () => {
    onHide();
  };

  if (!show) return null;


  return (
    // <div id="form-modal" className="modal customModal" style={{display: 'flex'}}>
    //   <div className="modal-content">
    //     <span className="close-btn" id="form-close-btn" onClick={handleClose}>
    //       <i className="fas fa-times"></i>
    //     </span>
        
    //     <h2 id="form-modal-title">{title}</h2>
        
    //     <p id="form-modal-text">
    //       {desc}
    //     </p>

    //     <div className="form-content">
    //       {formHtml}
    //     </div>
        
    //     <div className="modal-footer">
    //       <button 
    //         className={`btn btn-${cancelButtonVariant}`} 
    //         id="form-cancel-btn" 
    //         style={{display: 'inline-block'}}
    //         onClick={handleCancel}
    //       >
    //         {cancelButtonText}
    //       </button>
    //       {ShowSubmitButton && (
    //         <button 
    //         className={`btn btn-${submitButtonVariant}`} 
    //         id="form-submit-btn" 
    //         onClick={handleSubmit}
    //         disabled={isSubmitting}
    //       >
    //         {isSubmitting ? 'Submitting...' : submitButtonText}
    //       </button>
    //       )}
    //     </div>
    //   </div>
    // </div>
    <Modal show={show} onHide={onHide} centered size={size as 'sm' | 'lg' | 'xl'}>
      <Modal.Header closeButton className="bg-light">
        <div className="d-flex align-items-center justify-content-between w-100">
        <Modal.Title>
            <div className="d-flex align-items-center gap-2">
              {titleIcon}
              <span>{title}</span>
            </div>
          </Modal.Title>
          {showGuidelines && (
            <Button variant="link" size="sm" onClick={() => setIsGuidelinesExpanded(!isGuidelinesExpanded)} className="text-decoration-none">
              <Info size={16} className="me-1" />
              {isGuidelinesExpanded ? 'Hide' : 'Show'} Guidelines
            </Button>
          )}
        </div>
      
      </Modal.Header>
      <Modal.Body>
        {showGuidelines && isGuidelinesExpanded && guidelines && (
          <>
            {guidelines}
          </>
        )}

        {formHtml}
      </Modal.Body>
      <Modal.Footer className="border-0 pt-0 bg-light">
        <div className="d-flex justify-content-between align-items-center w-100">
          <Form.Text className="text-muted d-flex align-items-center gap-1 form-text">
            <AlertCircle size={14} />
            <span style={{ fontSize: '0.813rem' }}>
              Fields marked with <span className="text-danger fw-bold">*</span> are required
            </span>
          </Form.Text>
       
        <div className="d-flex gap-2">
        <Button variant="light" onClick={onCancel}><X size={16} className="me-1" /> {cancelButtonText}</Button>
        <Button variant={submitButtonVariant} onClick={onSubmit} disabled={isSubmitDisabled}><Check size={16} className="me-1" />{submitButtonText}</Button>
        </div>
        </div>
        
      </Modal.Footer>
    </Modal>
  );
};

export default FormModal;
