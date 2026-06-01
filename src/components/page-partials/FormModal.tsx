import { AlertCircle, Check, Info, X } from 'lucide-react';
import React, { useState } from 'react';
import { Button, Form, Modal } from 'react-bootstrap';
import {
  CRM_DIALOG_FOOTER_ACTIONS_ROW_STYLE,
  CRM_DIALOG_PRIMARY_BUTTON_STYLE,
  CRM_DIALOG_SECONDARY_BUTTON_STYLE,
} from '@components/crm/crmDialogActionButtonStyles';
import { MainSettingsFormSidebar } from '@components/main-settings/MainSettingsFormSidebar';
import { useMainSettingsFormSidebar } from '@components/main-settings/mainSettingsFormContext';

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
  /** Force modal even in Main Settings; default follows Main Settings context (sidebar). */
  presentation?: 'modal' | 'sidebar';
}

interface FormModalHeaderProps {
  title: string;
  titleIcon?: React.ReactNode;
  showGuidelines: boolean;
  isGuidelinesExpanded: boolean;
  onGuidelinesToggle: () => void;
  asModalTitle?: boolean;
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
  variant: 'modal' | 'sidebar';
}

const FormModalHeader = ({
  title,
  titleIcon,
  showGuidelines,
  isGuidelinesExpanded,
  onGuidelinesToggle,
  asModalTitle = true,
}: FormModalHeaderProps) => {
  const titleContent = (
    <div className="d-flex align-items-center gap-2">
      {titleIcon}
      <span>{title}</span>
    </div>
  );

  return (
    <div className="d-flex align-items-center justify-content-between w-100">
      {asModalTitle ? <Modal.Title>{titleContent}</Modal.Title> : titleContent}
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
};

type FormModalFooterButtonProps = Readonly<{
  showCancelButton: boolean;
  showSubmitButton: boolean;
  submitDisabled: boolean;
  isSubmitting: boolean;
  submitButtonVariant: NonNullable<FormModalProps['submitButtonVariant']>;
  submitButtonText: string;
  cancelButtonText: string;
  onSubmit: () => void;
  onCancel: () => void;
  variant: 'modal' | 'sidebar';
}>;

function FormModalRequiredHint({ show }: Readonly<{ show: boolean }>) {
  if (!show) {
    return null;
  }

  return (
    <Form.Text className="text-muted d-flex align-items-center gap-1 form-text mb-0">
      <AlertCircle size={14} className="flex-shrink-0" />
      <span style={{ fontSize: '0.813rem' }}>
        Fields marked with <span className="text-danger fw-bold">*</span> are required
      </span>
    </Form.Text>
  );
}

function CrmDialogFooterButtons({
  showCancelButton,
  showSubmitButton,
  submitDisabled,
  isSubmitting,
  submitButtonText,
  cancelButtonText,
  onSubmit,
  onCancel,
}: FormModalFooterButtonProps) {
  return (
    <>
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
    </>
  );
}

function StandardFooterButtons({
  showCancelButton,
  showSubmitButton,
  submitDisabled,
  isSubmitting,
  submitButtonVariant,
  submitButtonText,
  cancelButtonText,
  onSubmit,
  onCancel,
  variant,
}: FormModalFooterButtonProps) {
  const isSidebar = variant === 'sidebar';

  return (
    <>
      {showCancelButton ? (
        <Button
          variant={isSidebar ? 'outline-secondary' : 'light'}
          onClick={onCancel}
          disabled={isSubmitting}
          className={isSidebar ? 'contact-form-btn-cancel' : undefined}
        >
          {isSidebar ? (
            cancelButtonText
          ) : (
            <>
              <X size={16} className="me-1" /> {cancelButtonText}
            </>
          )}
        </Button>
      ) : null}
      {showSubmitButton ? (
        <Button
          variant={submitButtonVariant}
          onClick={onSubmit}
          disabled={submitDisabled}
          className={isSidebar ? 'contact-form-btn-create' : undefined}
        >
          {isSidebar ? (
            submitButtonText
          ) : (
            <>
              <Check size={16} className="me-1" />
              {submitButtonText}
            </>
          )}
        </Button>
      ) : null}
    </>
  );
}

function FormModalActionButtons({
  useCrmDialogFooterStyle,
  variant,
  ...buttonProps
}: FormModalFooterButtonProps & Readonly<{ useCrmDialogFooterStyle: boolean }>) {
  const isSidebar = variant === 'sidebar';
  const footerActionsClassName = useCrmDialogFooterStyle ? undefined : 'd-flex gap-2';
  const footerActionsStyle = useCrmDialogFooterStyle
    ? CRM_DIALOG_FOOTER_ACTIONS_ROW_STYLE
    : undefined;

  return (
    <div
      className={isSidebar ? 'main-settings-form-sidebar-footer__actions' : footerActionsClassName}
      style={isSidebar ? undefined : footerActionsStyle}
    >
      {useCrmDialogFooterStyle ? (
        <CrmDialogFooterButtons variant={variant} {...buttonProps} />
      ) : (
        <StandardFooterButtons variant={variant} {...buttonProps} />
      )}
    </div>
  );
}

function FormModalFooterLayout({
  variant,
  requiredHint,
  actionButtons,
}: Readonly<{
  variant: 'modal' | 'sidebar';
  requiredHint: React.ReactNode;
  actionButtons: React.ReactNode;
}>) {
  if (variant === 'sidebar') {
    return (
      <div className="main-settings-form-sidebar-footer w-100">
        {requiredHint}
        {actionButtons}
      </div>
    );
  }

  return (
    <Modal.Footer className="border-0 pt-0 bg-light">
      <div className="d-flex justify-content-between align-items-center w-100 flex-wrap gap-2">
        {requiredHint ?? <span />}
        {actionButtons}
      </div>
    </Modal.Footer>
  );
}

const FormModalFooterContent = (props: FormModalFooterProps) => (
  <FormModalFooterLayout
    variant={props.variant}
    requiredHint={<FormModalRequiredHint show={props.showFooterInstructions} />}
    actionButtons={
      <FormModalActionButtons
        useCrmDialogFooterStyle={props.useCrmDialogFooterStyle}
        showCancelButton={props.showCancelButton}
        showSubmitButton={props.showSubmitButton}
        submitDisabled={props.submitDisabled}
        isSubmitting={props.isSubmitting}
        submitButtonVariant={props.submitButtonVariant}
        submitButtonText={props.submitButtonText}
        cancelButtonText={props.cancelButtonText}
        onSubmit={props.onSubmit}
        onCancel={props.onCancel}
        variant={props.variant}
      />
    }
  />
);

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
  presentation,
}) => {
  const preferMainSettingsSidebar = useMainSettingsFormSidebar();
  const [isGuidelinesExpanded, setIsGuidelinesExpanded] = useState(false);
  const submitDisabled = isSubmitting || isSubmitDisabled;
  const resolvedPresentation =
    presentation ?? (preferMainSettingsSidebar ? 'sidebar' : 'modal');

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

  const guidelinesToggle = showGuidelines ? (
    <Button
      variant="link"
      size="sm"
      onClick={() => setIsGuidelinesExpanded((value) => !value)}
      className="text-decoration-none"
    >
      <Info size={16} className="me-1" />
      {isGuidelinesExpanded ? 'Hide' : 'Show'} Guidelines
    </Button>
  ) : null;

  const bodyContent = (
    <>
      {desc ? <p className="text-muted mb-3">{desc}</p> : null}
      {showGuidelines && isGuidelinesExpanded && guidelines ? <>{guidelines}</> : null}
      {formHtml}
    </>
  );

  const footerNode = showFooter ? (
    <FormModalFooterContent
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
      variant={resolvedPresentation}
    />
  ) : null;

  if (resolvedPresentation === 'sidebar') {
    return (
      <MainSettingsFormSidebar
        show={show}
        onHide={handleCancel}
        title={title}
        titleIcon={titleIcon}
        headerExtra={guidelinesToggle}
        disableClose={isSubmitting}
        footer={footerNode ?? undefined}
      >
        {show ? bodyContent : null}
      </MainSettingsFormSidebar>
    );
  }

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
            {bodyContent}
          </Modal.Body>
          {footerNode}
        </>
      )}
    </Modal>
  );
};

export default FormModal;
