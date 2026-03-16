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
  hideCancelButton?: boolean;
  hideFooterInstructions?: boolean;
  isSubmitting?: boolean;
  titleIcon?: React.ReactNode;
  isSubmitDisabled?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  guidelines?: React.ReactNode;
  showGuidelines?: boolean;
  onEntered?: () => void;
  onExited?: () => void;
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
  hideCancelButton = false,
  hideFooterInstructions = false,
  isSubmitting = false,
  titleIcon,
  isSubmitDisabled = false,
  size = 'md',
  guidelines,
  showGuidelines = false,
  onEntered,
  onExited
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

  const showCancelButton = !hideCancelButton
  const showSubmitButton = ShowSubmitButton
  const showFooterInstructions = !hideFooterInstructions
  const showFooter = showFooterInstructions || showCancelButton || showSubmitButton


  return (
    
    <Modal 
      show={show} 
      onHide={onHide} 
      centered 
      size={size as 'sm' | 'lg' | 'xl'}
      onEntered={onEntered}
      onExited={onExited}
    >
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
      {showFooter ? (
        <Modal.Footer className="border-0 pt-0 bg-light">
          <div className="d-flex justify-content-between align-items-center w-100">
            {showFooterInstructions ? (
              <Form.Text className="text-muted d-flex align-items-center gap-1 form-text">
                <AlertCircle size={14} />
                <span style={{ fontSize: '0.813rem' }}>
                  Fields marked with <span className="text-danger fw-bold">*</span> are required
                </span>
              </Form.Text>
            ) : (
              <span />
            )}

            <div className="d-flex gap-2">
              {showCancelButton ? (
                <Button variant="light" onClick={handleCancel}>
                  <X size={16} className="me-1" /> {cancelButtonText}
                </Button>
              ) : null}

              {showSubmitButton ? (
                <Button variant={submitButtonVariant} onClick={handleSubmit} disabled={isSubmitDisabled}>
                  <Check size={16} className="me-1" />
                  {submitButtonText}
                </Button>
              ) : null}
            </div>
          </div>
        </Modal.Footer>
      ) : null}
    </Modal>
  );
};

export default FormModal;
