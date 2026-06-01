import React, { useState, useCallback, useEffect } from "react";
import { Modal, Button, Form, Card } from "react-bootstrap";
import { toast } from "react-toastify";
import { generateComplexId } from "@utils/Helper";
import { UpdatePassword } from "@utils/tms/tmsUserManagement";
import { Check, X, Lock, Copy } from "lucide-react";
import { MainSettingsFormSidebar } from "@components/main-settings/MainSettingsFormSidebar";
import { useMainSettingsFormSidebar } from "@components/main-settings/mainSettingsFormContext";

interface ResetPasswordModalProps {
  show: boolean;
  onHide: () => void;
  username: string;
  onSuccess?: () => void;
}

interface PasswordValidation {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}

const EMPTY_PASSWORD_VALIDATION: PasswordValidation = {
  minLength: false,
  hasUppercase: false,
  hasLowercase: false,
  hasNumber: false,
  hasSpecialChar: false,
};

const PASSWORD_FIELD_STYLE: React.CSSProperties = {
  userSelect: "text",
  WebkitUserSelect: "text",
};

function validatePasswordComplexity(pwd: string): PasswordValidation {
  return {
    minLength: pwd.length >= 8,
    hasUppercase: /[A-Z]/.test(pwd),
    hasLowercase: /[a-z]/.test(pwd),
    hasNumber: /\d/.test(pwd),
    hasSpecialChar: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pwd),
  };
}

function isPasswordValid(pwd: string): boolean {
  return Object.values(validatePasswordComplexity(pwd)).every(Boolean);
}

function getSubmitValidationError(
  username: string,
  password: string,
  passwordConfirmation: string,
): string | null {
  if (!username) {
    return "Username is required";
  }
  if (password.length === 0) {
    return "Password cannot be empty";
  }
  if (!isPasswordValid(password)) {
    return "Password does not meet complexity requirements. Please check the requirements below.";
  }
  if (password !== passwordConfirmation) {
    return "Passwords do not match";
  }
  return null;
}

function getUpdatePasswordErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null) {
    const responseMessage = (error as { response?: { data?: { message?: string } } }).response
      ?.data?.message;
    if (responseMessage) {
      return responseMessage;
    }
    const message = (error as { message?: string }).message;
    if (message) {
      return message;
    }
  }
  return "Failed to update password";
}

function PasswordRequirementRow({
  met,
  label,
}: Readonly<{ met: boolean; label: string }>) {
  const Icon = met ? Check : X;
  const iconColor = met ? "#28a745" : "#6c757d";

  return (
    <div className={`d-flex align-items-center ${met ? "text-success" : "text-muted"}`}>
      <Icon size={18} className="me-2 flex-shrink-0" style={{ color: iconColor }} />
      <span>{label}</span>
    </div>
  );
}

const PASSWORD_REQUIREMENT_ROWS: ReadonlyArray<{
  key: keyof PasswordValidation;
  label: string;
}> = [
  { key: "minLength", label: "At least 8 characters" },
  { key: "hasUppercase", label: "At least one uppercase letter (A-Z)" },
  { key: "hasLowercase", label: "At least one lowercase letter (a-z)" },
  { key: "hasNumber", label: "At least one number (0-9)" },
  { key: "hasSpecialChar", label: "At least one special character (!@#$%^&*...)" },
];

function PasswordRequirementsCard({
  passwordErrors,
}: Readonly<{ passwordErrors: PasswordValidation }>) {
  return (
    <Card
      className="mb-4"
      style={{
        border: "1px solid #e9ecef",
        borderRadius: "8px",
        backgroundColor: "#f8f9fa",
      }}
    >
      <Card.Body style={{ padding: "1rem" }}>
        <div className="d-flex align-items-center mb-3">
          <Lock size={18} className="me-2 text-muted" />
          <h6 className="mb-0 fw-semibold" style={{ fontSize: "0.875rem", color: "#495057" }}>
            Password Requirements
          </h6>
        </div>
        <div className="d-flex flex-column gap-2" style={{ fontSize: "0.875rem" }}>
          {PASSWORD_REQUIREMENT_ROWS.map(({ key, label }) => (
            <PasswordRequirementRow key={key} met={passwordErrors[key]} label={label} />
          ))}
        </div>
      </Card.Body>
    </Card>
  );
}

type ResetPasswordFormFieldsProps = Readonly<{
  password: string;
  passwordConfirmation: string;
  passwordErrors: PasswordValidation;
  confirmPasswordError: string;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onGeneratePassword: () => void;
  onCopyPassword: () => void;
}>;

function ResetPasswordFormFields({
  password,
  passwordConfirmation,
  passwordErrors,
  confirmPasswordError,
  onPasswordChange,
  onConfirmPasswordChange,
  onGeneratePassword,
  onCopyPassword,
}: ResetPasswordFormFieldsProps) {
  const passwordIsValid = password.length > 0 && isPasswordValid(password);
  const passwordsMatch =
    passwordConfirmation.length > 0 &&
    !confirmPasswordError &&
    password === passwordConfirmation;

  return (
    <>
      <Form.Group className="mb-4">
        <Form.Label className="fw-semibold mb-2">Password</Form.Label>
        <div className="input-group">
          <Form.Control
            type="text"
            name="new-password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            placeholder="Enter password"
            isInvalid={password.length > 0 && !passwordIsValid}
            style={PASSWORD_FIELD_STYLE}
            className={passwordIsValid ? "border-success" : ""}
          />
          <Button
            type="button"
            variant="outline-secondary"
            onClick={onCopyPassword}
            disabled={!password}
            title="Copy password"
            aria-label="Copy password"
            style={{ padding: "0.375rem 0.75rem", fontWeight: "500" }}
          >
            <Copy size={18} />
          </Button>
          <Button
            type="button"
            variant="outline-secondary"
            onClick={onGeneratePassword}
            style={{ padding: "0.375rem 1rem", fontWeight: "500", whiteSpace: "nowrap" }}
          >
            Generate
          </Button>
        </div>
        {passwordIsValid ? (
          <Form.Text
            className="text-success d-flex align-items-center mt-2"
            style={{ fontSize: "0.875rem" }}
          >
            <Check size={16} className="me-1" />
            Password meets all requirements
          </Form.Text>
        ) : null}
      </Form.Group>

      {password.length > 0 ? <PasswordRequirementsCard passwordErrors={passwordErrors} /> : null}

      <Form.Group className="mb-3">
        <Form.Label className="fw-semibold mb-2">Confirm Password</Form.Label>
        <Form.Control
          type="text"
          name="confirm-new-password"
          autoComplete="new-password"
          value={passwordConfirmation}
          onChange={(e) => onConfirmPasswordChange(e.target.value)}
          placeholder="Confirm password"
          isInvalid={!!confirmPasswordError}
          style={PASSWORD_FIELD_STYLE}
          className={passwordsMatch ? "border-success" : ""}
        />
        {confirmPasswordError ? (
          <Form.Control.Feedback type="invalid">{confirmPasswordError}</Form.Control.Feedback>
        ) : null}
        {passwordsMatch ? (
          <Form.Text
            className="text-success d-flex align-items-center mt-2"
            style={{ fontSize: "0.875rem" }}
          >
            <Check size={16} className="me-1" />
            Passwords match
          </Form.Text>
        ) : null}
      </Form.Group>
    </>
  );
}

function ResetPasswordFooterActions({
  preferSidebar,
  loading,
  onClose,
  onSubmit,
}: Readonly<{
  preferSidebar: boolean;
  loading: boolean;
  onClose: () => void;
  onSubmit: () => void;
}>) {
  return (
    <>
      <Button
        variant={preferSidebar ? "outline-secondary" : "secondary"}
        onClick={onClose}
        disabled={loading}
        className={preferSidebar ? "contact-form-btn-cancel" : undefined}
      >
        Close
      </Button>
      <Button
        variant="primary"
        onClick={onSubmit}
        disabled={loading}
        className={preferSidebar ? "contact-form-btn-create" : undefined}
      >
        {loading ? "Updating..." : "Reset Password"}
      </Button>
    </>
  );
}

function useResetPasswordForm({
  username,
  show,
  onHide,
  onSuccess,
}) => {
  const preferSidebar = useMainSettingsFormSidebar();
  const [password, setPassword] = useState<string>("");
  const [passwordConfirmation, setPasswordConfirmation] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [passwordErrors, setPasswordErrors] = useState<PasswordValidation>({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });
  const [confirmPasswordError, setConfirmPasswordError] = useState<string>("");

  // Password complexity validation
  const validatePasswordComplexity = useCallback(
    (pwd: string): PasswordValidation => {
      return {
        minLength: pwd.length >= 8,
        hasUppercase: /[A-Z]/.test(pwd),
        hasLowercase: /[a-z]/.test(pwd),
        hasNumber: /\d/.test(pwd),
        hasSpecialChar: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pwd),
      };
    },
    [],
  );

  const resetForm = useCallback(() => {
    setPassword("");
    setPasswordConfirmation("");
    setPasswordErrors(EMPTY_PASSWORD_VALIDATION);
    setConfirmPasswordError("");
  }, []);

  useEffect(() => {
    if (!show) {
      resetForm();
    }
  }, [show, resetForm]);

  const handlePasswordChange = useCallback(
    (value: string) => {
      setPassword(value);
      setPasswordErrors(validatePasswordComplexity(value));
      if (value === passwordConfirmation && value.length > 0) {
        setConfirmPasswordError("");
      }
    },
    [passwordConfirmation],
  );

  const handleConfirmPasswordChange = useCallback(
    (value: string) => {
      setPasswordConfirmation(value);
      setConfirmPasswordError(value === password ? "" : "Passwords do not match");
    },
    [password],
  );

  const handleGeneratePassword = useCallback(() => {
    const randomPassword = generateComplexId();
    setPassword(randomPassword);
    setPasswordErrors(validatePasswordComplexity(randomPassword));
    setPasswordConfirmation(randomPassword);
    setConfirmPasswordError("");
  }, []);

  const handleCopyPassword = useCallback(async () => {
    if (!password) {
      return;
    }
    try {
      await navigator.clipboard.writeText(password);
      toast.success("Password copied to clipboard");
    } catch (err) {
      console.error("Clipboard copy failed:", err);
      toast.error("Could not copy password. Select the text and copy manually.");
    }
  }, [password]);

  const handleClose = useCallback(() => {
    onHide();
    resetForm();
  }, [onHide, resetForm]);

  const handleSubmit = useCallback(async () => {
    const validationError = getSubmitValidationError(username, password, passwordConfirmation);
    if (validationError) {
      toast.error(validationError);
      if (validationError === "Passwords do not match") {
        setConfirmPasswordError("Passwords do not match");
      }
      return;
    }

    try {
      setLoading(true);
      const response = await UpdatePassword({
        username,
        password,
        password_confirmation: passwordConfirmation,
      });

      if (response?.success === false) {
        toast.error(response.message || "Failed to update password");
        return;
      }

      if (response?.success === true) {
        toast.success("Password updated successfully!");
        handleClose();
        onSuccess?.();
        return;
      }

      toast.error("Failed to update password");
    } catch (error: unknown) {
      console.error("Error updating password:", error);
      toast.error(getUpdatePasswordErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [username, password, passwordConfirmation, handleClose, onSuccess]);

  return {
    password,
    passwordConfirmation,
    loading,
    passwordErrors,
    confirmPasswordError,
    handlePasswordChange,
    handleConfirmPasswordChange,
    handleGeneratePassword,
    handleCopyPassword,
    handleClose,
    handleSubmit,
  };
}

const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
  show,
  onHide,
  username,
  onSuccess,
}) => {
  const preferSidebar = useMainSettingsFormSidebar();
  const form = useResetPasswordForm({ username, show, onHide, onSuccess });

  const formBody = (
    <ResetPasswordFormFields
      password={form.password}
      passwordConfirmation={form.passwordConfirmation}
      passwordErrors={form.passwordErrors}
      confirmPasswordError={form.confirmPasswordError}
      onPasswordChange={form.handlePasswordChange}
      onConfirmPasswordChange={form.handleConfirmPasswordChange}
      onGeneratePassword={form.handleGeneratePassword}
      onCopyPassword={form.handleCopyPassword}
    />
  );

  const footerActions = (
    <ResetPasswordFooterActions
      preferSidebar={preferSidebar}
      loading={form.loading}
      onClose={form.handleClose}
      onSubmit={form.handleSubmit}
    />
  );

  if (preferSidebar) {
    return (
      <MainSettingsFormSidebar
        show={show}
        onHide={form.handleClose}
        title="Reset Password"
        disableClose={form.loading}
        footer={
          <div className="main-settings-form-sidebar-footer w-100">
            <div className="main-settings-form-sidebar-footer__actions">{footerActions}</div>
          </div>
        }
      >
        {show ? formBody : null}
      </MainSettingsFormSidebar>
    );
  }

  const formBody = (
    <>
        <Form.Group className="mb-4">
          <Form.Label className="fw-semibold mb-2">Password</Form.Label>
          <div className="input-group">
            <Form.Control
              type="text"
              name="new-password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              placeholder="Enter password"
              isInvalid={password.length > 0 && !isPasswordValid(password)}
              style={passwordFieldStyle}
              className={
                password.length > 0 && isPasswordValid(password)
                  ? "border-success"
                  : ""
              }
            />
            <Button
              type="button"
              variant="outline-secondary"
              onClick={handleCopyPassword}
              disabled={!password}
              title="Copy password"
              aria-label="Copy password"
              style={{
                padding: "0.375rem 0.75rem",
                fontWeight: "500",
              }}
            >
              <Copy size={18} />
            </Button>
            <Button
              type="button"
              variant="outline-secondary"
              onClick={handleGeneratePassword}
              style={{
                padding: "0.375rem 1rem",
                fontWeight: "500",
                whiteSpace: "nowrap",
              }}
            >
              Generate
            </Button>
          </div>
          {password.length > 0 && isPasswordValid(password) && (
            <Form.Text
              className="text-success d-flex align-items-center mt-2"
              style={{ fontSize: "0.875rem" }}
            >
              <Check size={16} className="me-1" />
              Password meets all requirements
            </Form.Text>
          )}
        </Form.Group>

        {/* Password Requirements Card */}
        {password.length > 0 && (
          <Card
            className="mb-4"
            style={{
              border: "1px solid #e9ecef",
              borderRadius: "8px",
              backgroundColor: "#f8f9fa",
            }}
          >
            <Card.Body style={{ padding: "1rem" }}>
              <div className="d-flex align-items-center mb-3">
                <Lock size={18} className="me-2 text-muted" />
                <h6
                  className="mb-0 fw-semibold"
                  style={{ fontSize: "0.875rem", color: "#495057" }}
                >
                  Password Requirements
                </h6>
              </div>
              <div
                className="d-flex flex-column gap-2"
                style={{ fontSize: "0.875rem" }}
              >
                <div
                  className={`d-flex align-items-center ${passwordErrors.minLength ? "text-success" : "text-muted"}`}
                >
                  {passwordErrors.minLength ? (
                    <Check
                      size={18}
                      className="me-2 flex-shrink-0"
                      style={{ color: "#28a745" }}
                    />
                  ) : (
                    <X
                      size={18}
                      className="me-2 flex-shrink-0"
                      style={{ color: "#6c757d" }}
                    />
                  )}
                  <span>At least 8 characters</span>
                </div>
                <div
                  className={`d-flex align-items-center ${passwordErrors.hasUppercase ? "text-success" : "text-muted"}`}
                >
                  {passwordErrors.hasUppercase ? (
                    <Check
                      size={18}
                      className="me-2 flex-shrink-0"
                      style={{ color: "#28a745" }}
                    />
                  ) : (
                    <X
                      size={18}
                      className="me-2 flex-shrink-0"
                      style={{ color: "#6c757d" }}
                    />
                  )}
                  <span>At least one uppercase letter (A-Z)</span>
                </div>
                <div
                  className={`d-flex align-items-center ${passwordErrors.hasLowercase ? "text-success" : "text-muted"}`}
                >
                  {passwordErrors.hasLowercase ? (
                    <Check
                      size={18}
                      className="me-2 flex-shrink-0"
                      style={{ color: "#28a745" }}
                    />
                  ) : (
                    <X
                      size={18}
                      className="me-2 flex-shrink-0"
                      style={{ color: "#6c757d" }}
                    />
                  )}
                  <span>At least one lowercase letter (a-z)</span>
                </div>
                <div
                  className={`d-flex align-items-center ${passwordErrors.hasNumber ? "text-success" : "text-muted"}`}
                >
                  {passwordErrors.hasNumber ? (
                    <Check
                      size={18}
                      className="me-2 flex-shrink-0"
                      style={{ color: "#28a745" }}
                    />
                  ) : (
                    <X
                      size={18}
                      className="me-2 flex-shrink-0"
                      style={{ color: "#6c757d" }}
                    />
                  )}
                  <span>At least one number (0-9)</span>
                </div>
                <div
                  className={`d-flex align-items-center ${passwordErrors.hasSpecialChar ? "text-success" : "text-muted"}`}
                >
                  {passwordErrors.hasSpecialChar ? (
                    <Check
                      size={18}
                      className="me-2 flex-shrink-0"
                      style={{ color: "#28a745" }}
                    />
                  ) : (
                    <X
                      size={18}
                      className="me-2 flex-shrink-0"
                      style={{ color: "#6c757d" }}
                    />
                  )}
                  <span>At least one special character (!@#$%^&*...)</span>
                </div>
              </div>
            </Card.Body>
          </Card>
        )}

        <Form.Group className="mb-3">
          <Form.Label className="fw-semibold mb-2">Confirm Password</Form.Label>
          <Form.Control
            type="text"
            name="confirm-new-password"
            autoComplete="new-password"
            value={passwordConfirmation}
            onChange={(e) => handleConfirmPasswordChange(e.target.value)}
            placeholder="Confirm password"
            isInvalid={!!confirmPasswordError}
            style={passwordFieldStyle}
            className={
              passwordConfirmation.length > 0 &&
              !confirmPasswordError &&
              password === passwordConfirmation
                ? "border-success"
                : ""
            }
          />
          {confirmPasswordError && (
            <Form.Control.Feedback type="invalid">
              {confirmPasswordError}
            </Form.Control.Feedback>
          )}
          {passwordConfirmation.length > 0 &&
            !confirmPasswordError &&
            password === passwordConfirmation && (
              <Form.Text
                className="text-success d-flex align-items-center mt-2"
                style={{ fontSize: "0.875rem" }}
              >
                <Check size={16} className="me-1" />
                Passwords match
              </Form.Text>
            )}
        </Form.Group>
    </>
  );

  const footerActions = (
    <>
      <Button
        variant={preferSidebar ? "outline-secondary" : "secondary"}
        onClick={handleClose}
        disabled={loading}
        className={preferSidebar ? "contact-form-btn-cancel" : undefined}
      >
        Close
      </Button>
      <Button
        variant="primary"
        onClick={handleSubmit}
        disabled={loading}
        className={preferSidebar ? "contact-form-btn-create" : undefined}
      >
        {loading ? "Updating..." : "Reset Password"}
      </Button>
    </>
  );

  if (preferSidebar) {
    return (
      <MainSettingsFormSidebar
        show={show}
        onHide={handleClose}
        title="Reset Password"
        disableClose={loading}
        footer={
          <div className="main-settings-form-sidebar-footer w-100">
            <div className="main-settings-form-sidebar-footer__actions">
              {footerActions}
            </div>
          </div>
        }
      >
        {show ? formBody : null}
      </MainSettingsFormSidebar>
    );
  }

  return (
    <Modal
      show={show}
      onHide={handleClose}
      centered
      enforceFocus={false}
      autoFocus={false}
      className="reset-password-modal-root"
      backdropClassName="reset-password-modal-backdrop"
    >
      <Modal.Header closeButton>
        <Modal.Title>Reset Password</Modal.Title>
      </Modal.Header>
      <Modal.Body>{formBody}</Modal.Body>
      <Modal.Footer>{footerActions}</Modal.Footer>
    </Modal>
  );
};

export default ResetPasswordModal;
