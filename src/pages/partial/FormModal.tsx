import React from 'react';

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
  ShowSubmitButton = true

}) => {
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
    <div id="form-modal" className="modal customModal" style={{display: 'flex'}}>
      <div className="modal-content">
        <span className="close-btn" id="form-close-btn" onClick={handleClose}>
          <i className="fas fa-times"></i>
        </span>
        
        <h2 id="form-modal-title">{title}</h2>
        
        <p id="form-modal-text">
          {desc}
        </p>

        <div className="form-content">
          {formHtml}
        </div>
        
        <div className="modal-footer">
          <button 
            className={`btn btn-${cancelButtonVariant}`} 
            id="form-cancel-btn" 
            style={{display: 'inline-block'}}
            onClick={handleCancel}
          >
            {cancelButtonText}
          </button>
          {ShowSubmitButton && (
            <button 
            className={`btn btn-${submitButtonVariant}`} 
            id="form-submit-btn" 
            onClick={handleSubmit}
          >
            {submitButtonText}
          </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FormModal;
