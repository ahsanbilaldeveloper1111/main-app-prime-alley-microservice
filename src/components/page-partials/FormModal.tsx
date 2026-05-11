import { AlertCircle, Check, Info, X } from 'lucide-react';
import React, { useState } from 'react';
import { Button, Form, Modal } from 'react-bootstrap';
import {
  CRM_DIALOG_FOOTER_ACTIONS_ROW_STYLE,
  CRM_DIALOG_PRIMARY_BUTTON_STYLE,
  CRM_DIALOG_SECONDARY_BUTTON_STYLE,
} from '@components/crm/crmDialogActionButtonStyles';

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
  /** When true, use CRM stage dialog footer styling (primary blue + outlined cancel), submit before cancel. */
  useCrmDialogFooterStyle?: boolean;
}

interface FormModalHeaderProps {
  title: string;
  titleIcon?: React.ReactNode;
  showGuidelines: boolean;
  isGuidelinesExpanded: boolean;
  onGuidelinesToggle: () => void;
}

interface FormModalFooterProps {
  showFooterInstructions: boolean;
  showCancelButton: boolean;
  showSubmitButton: boolean;
  useCrmDialogFooterStyle: boolean;
  submitDisabled: boolean;
  isSubmitting: boolean;
  submitButtonVariant: NonNullable<FormModalProps['submitButtonVariant']>;
  submitButtonText: string;
  cancelButtonText: string;
  onSubmit: () => void;
  onCancel: () => void;
}

const FormModalHeader = ({
  title,
  titleIcon,
  showGuidelines,
  isGuidelinesExpanded,
  onGuidelinesToggle,
}: FormModalHeaderProps) => (
  <div className="d-flex align-items-center justify-content-between w-100">
    <Modal.Title>
      <div className="d-flex align-items-center gap-2">
        {titleIcon}
        <span>{title}</span>
      </div>
    </Modal.Title>
    {showGuidelines ? (
      <Button
        variant="link"
        size="sm"
        onClick={onGuidelinesToggle}
        className="text-decoration-none"
      >
        <Info size={16} className="me-1" />
        {isGuidelinesExpanded ? 'Hide' : 'Show'} Guidelines
      </Button>
    ) : null}
  </div>
);

const FormModalFooter = ({
  showFooterInstructions,
  showCancelButton,
  showSubmitButton,
  useCrmDialogFooterStyle,
  submitDisabled,
  isSubmitting,
  submitButtonVariant,
  submitButtonText,
  cancelButtonText,
  onSubmit,
  onCancel,
}: FormModalFooterProps) => {
  const footerActionsClassName = useCrmDialogFooterStyle ? undefined : 'd-flex gap-2';
  const footerActionsStyle = useCrmDialogFooterStyle
    ? CRM_DIALOG_FOOTER_ACTIONS_ROW_STYLE
    : undefined;

  if (useCrmDialogFooterStyle) {
    return (
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

          <div className={footerActionsClassName} style={footerActionsStyle}>
            {showSubmitButton ? (
              <Button
                variant="primary"
                onClick={onSubmit}
                disabled={submitDisabled}
                style={CRM_DIALOG_PRIMARY_BUTTON_STYLE}
              >
                <Check size={16} aria-hidden />
                {submitButtonText}
              </Button>
            ) : null}
            {showCancelButton ? (
              <Button
                variant="outline-secondary"
                onClick={onCancel}
                disabled={isSubmitting}
                style={CRM_DIALOG_SECONDARY_BUTTON_STYLE}
              >
                {cancelButtonText}
              </Button>
            ) : null}
          </div>
        </div>
      </Modal.Footer>
    );
  }

  return (
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

        <div className={footerActionsClassName} style={footerActionsStyle}>
          {showCancelButton ? (
            <Button variant="light" onClick={onCancel} disabled={isSubmitting}>
              <X size={16} className="me-1" /> {cancelButtonText}
            </Button>
          ) : null}
          {showSubmitButton ? (
            <Button variant={submitButtonVariant} onClick={onSubmit} disabled={submitDisabled}>
              <Check size={16} className="me-1" />
              {submitButtonText}
            </Button>
          ) : null}
        </div>
      </div>
    </Modal.Footer>
  );
};

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
  onExited,
  useCrmDialogFooterStyle = false,
}) => {
  const [isGuidelinesExpanded, setIsGuidelinesExpanded] = useState(false);
  const submitDisabled = isSubmitting || isSubmitDisabled;

  const handleSubmit = () => {
    if (submitDisabled) return;
    onSubmit();
  };

  const handleCancel = () => {
    if (isSubmitting) return;
    if (onCancel) {
      onCancel();
    } else {
      onHide();
    }
  };

  const showCancelButton = !hideCancelButton;
  const showSubmitButton = ShowSubmitButton;
  const showFooterInstructions = !hideFooterInstructions;
  const showFooter = showFooterInstructions || showCancelButton || showSubmitButton;

  return (
    <Modal
      show={show}
      onHide={handleCancel}
      centered
      size={size as 'sm' | 'lg' | 'xl'}
      onEntered={onEntered}
      onExited={onExited}
    >
      {show && (
        <>
          <Modal.Header closeButton={!isSubmitting} className="bg-light">
            <FormModalHeader
              title={title}
              titleIcon={titleIcon}
              showGuidelines={showGuidelines}
              isGuidelinesExpanded={isGuidelinesExpanded}
              onGuidelinesToggle={() => setIsGuidelinesExpanded((value) => !value)}
            />
          </Modal.Header>
          <Modal.Body>
            {showGuidelines && isGuidelinesExpanded && guidelines ? <>{guidelines}</> : null}

            {formHtml}
          </Modal.Body>
          {showFooter ? (
            <FormModalFooter
              showFooterInstructions={showFooterInstructions}
              showCancelButton={showCancelButton}
              showSubmitButton={showSubmitButton}
              useCrmDialogFooterStyle={useCrmDialogFooterStyle}
              submitDisabled={submitDisabled}
              isSubmitting={isSubmitting}
              submitButtonVariant={submitButtonVariant}
              submitButtonText={submitButtonText}
              cancelButtonText={cancelButtonText}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
            />
          ) : null}
        </>
      )}
    </Modal>
  );
};

export default FormModal;
