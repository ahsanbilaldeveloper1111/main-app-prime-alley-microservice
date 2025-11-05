import React, { useState, useEffect } from 'react';

interface ConfirmModalProps {
  show: boolean;
  onHide: () => void;
  title: string;
  description: string;
  targetName: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  onConfirm: (confirmationText: string) => void;
  onCancel?: () => void;
  showCancelButton?: boolean;
  confirmButtonVariant?: 'primary' | 'danger' | 'warning' | 'success';
  cancelButtonVariant?: 'secondary' | 'export' | 'outline-secondary';
  requireTextConfirmation?: boolean;
  confirmationPlaceholder?: string;
  confirmationLabel?: string;
  requiredConfirmationText?: string;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  show,
  onHide,
  title,
  description,
  targetName,
  confirmButtonText = "Confirm",
  cancelButtonText = "Cancel",
  onConfirm,
  onCancel,
  showCancelButton = true,
  confirmButtonVariant = 'primary',
  cancelButtonVariant = 'export',
  requireTextConfirmation = true,
  confirmationPlaceholder = "Type to confirm",
  confirmationLabel = "",
  requiredConfirmationText = "delete"
}) => {
  const [confirmationText, setConfirmationText] = useState('');
  const [isValidConfirmation, setIsValidConfirmation] = useState(false);

  // Reset confirmation text when modal opens/closes
  useEffect(() => {
    if (show) {
      setConfirmationText('');
      setIsValidConfirmation(!requireTextConfirmation);
    }
  }, [show, requireTextConfirmation]);

  // Validate confirmation text
  useEffect(() => {
    if (requireTextConfirmation) {
      setIsValidConfirmation(confirmationText.trim().toLowerCase() === requiredConfirmationText.toLowerCase());
    }
  }, [confirmationText, requireTextConfirmation, requiredConfirmationText]);

  // Handle Enter key to submit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (show && e.key === 'Enter' && isValidConfirmation) {
        e.preventDefault();
        onConfirm(confirmationText);
      }
    };

    if (show) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [show, isValidConfirmation, onConfirm, confirmationText]);
  const handleConfirm = () => {
    if (isValidConfirmation) {
      onConfirm(confirmationText);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      onHide();
    }
  };

  const handleClose = () => {
    setConfirmationText('');
    setIsValidConfirmation(!requireTextConfirmation);
    onHide();
  };

  if (!show) return null;

  return (
    <div id="action-modal" className="modal customModal" style={{display: 'flex'}}>
      <div className="modal-content">
        <span className="close-btn" id="action-close-btn" onClick={handleClose}>
          <i className="fas fa-times"></i>
        </span>
        <h2 id="action-modal-title">{title}</h2>

      
        <p id="action-modal-text">
          {description.replace('{targetName}', targetName)}
        </p>
        
        {requireTextConfirmation && (
          <div className="form-group mt-3">
            <label htmlFor="confirmationInput" className="form-label">
              {confirmationLabel}
            </label>
            <p className="text-muted small">
              Type the word <b className="text-danger">{requiredConfirmationText}</b> to confirm
            </p>
            <input 
              type="text" 
              className="form-control" 
              id="confirmationInput"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder={confirmationPlaceholder}
            />
          </div>
        )}
        
        <div className="modal-footer">
          {showCancelButton && (
            <button 
              className={`btn btn-${cancelButtonVariant}`} 
              id="action-cancel-btn" 
              style={{display: 'inline-block'}}
              onClick={handleCancel}
            >
              {cancelButtonText}
            </button>
          )}
          <button 
            className={`btn btn-${confirmButtonVariant}`} 
            id="action-confirm-btn" 
            onClick={handleConfirm}
            disabled={!isValidConfirmation}
          >
            {confirmButtonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
