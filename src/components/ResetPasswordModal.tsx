import React, { useState, useCallback, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { generateComplexId } from '@utils/Helper';
import { UpdatePassword } from '@utils/tms/tmsUserManagement';

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

const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
  show,
  onHide,
  username,
  onSuccess
}) => {
  const [password, setPassword] = useState<string>("");
  const [passwordConfirmation, setPasswordConfirmation] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [passwordErrors, setPasswordErrors] = useState<PasswordValidation>({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecialChar: false
  });
  const [confirmPasswordError, setConfirmPasswordError] = useState<string>("");

  // Password complexity validation
  const validatePasswordComplexity = useCallback((pwd: string): PasswordValidation => {
    return {
      minLength: pwd.length >= 8,
      hasUppercase: /[A-Z]/.test(pwd),
      hasLowercase: /[a-z]/.test(pwd),
      hasNumber: /\d/.test(pwd),
      hasSpecialChar: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pwd)
    };
  }, []);

  // Check if password meets all complexity requirements
  const isPasswordValid = useCallback((pwd: string): boolean => {
    const validation = validatePasswordComplexity(pwd);
    return Object.values(validation).every(v => v === true);
  }, [validatePasswordComplexity]);

  // Validate password on change
  const handlePasswordChange = useCallback((value: string) => {
    setPassword(value);
    setPasswordErrors(validatePasswordComplexity(value));
    
    // Clear confirm password error if passwords match
    if (value === passwordConfirmation && value.length > 0) {
      setConfirmPasswordError("");
    }
  }, [passwordConfirmation, validatePasswordComplexity]);

  // Validate confirm password on change
  const handleConfirmPasswordChange = useCallback((value: string) => {
    setPasswordConfirmation(value);
    if (value === password) {
      setConfirmPasswordError("");
    } else {
      setConfirmPasswordError("Passwords do not match");
    }
  }, [password]);

  // Handle password generation
  const handleGeneratePassword = useCallback(() => {
    const randomPassword = generateComplexId(15);
    // Set password and validation state
    setPassword(randomPassword);
    setPasswordErrors(validatePasswordComplexity(randomPassword));
    // Set confirmation password
    setPasswordConfirmation(randomPassword);
    // Clear confirm password error since passwords will match
    setConfirmPasswordError("");
  }, [validatePasswordComplexity]);

  // Reset form when modal is closed or username changes
  useEffect(() => {
    if (!show) {
      setPassword("");
      setPasswordConfirmation("");
      setPasswordErrors({
        minLength: false,
        hasUppercase: false,
        hasLowercase: false,
        hasNumber: false,
        hasSpecialChar: false
      });
      setConfirmPasswordError("");
    }
  }, [show]);

  // Handle password update submission
  const handleSubmit = useCallback(async () => {
    if (!username) {
      toast.error('Username is required');
      return;
    }

    // Validate password is not empty
    if (password.length === 0 || !password) {
      toast.error('Password cannot be empty');
      return;
    }

    // Validate password complexity
    if (!isPasswordValid(password)) {
      toast.error('Password does not meet complexity requirements. Please check the requirements below.');
      return;
    }

    // Validate passwords match
    if (password !== passwordConfirmation) {
      toast.error('Passwords do not match');
      setConfirmPasswordError("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      const response = await UpdatePassword({
        username,
        password,
        password_confirmation: passwordConfirmation
      });

      if (response && response.success === false) {
        // Show error message if success is false
        const errorMessage = response.message || 'Failed to update password';
        toast.error(errorMessage);
      } else if (response && response.success === true) {
        toast.success('Password updated successfully!');
        onHide();
        setPassword("");
        setPasswordConfirmation("");
        if (onSuccess) {
          onSuccess();
        }
      } else {
        toast.error('Failed to update password');
      }
    } catch (error: any) {
      console.error('Error updating password:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to update password';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [username, password, passwordConfirmation, isPasswordValid, onHide, onSuccess]);

  const handleClose = useCallback(() => {
    onHide();
    setPassword("");
    setPasswordConfirmation("");
  }, [onHide]);

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Reset Password</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="mb-3 text-muted">
          Reset password for user: <strong className="text-dark">{username}</strong>
        </p>
        <Form.Group className="mb-3">
          <Form.Label className="fw-semibold">Password</Form.Label>
          <div className="input-group">
            <Form.Control
              type="text"
              value={password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              placeholder="Enter password"
              isInvalid={password.length > 0 && !isPasswordValid(password)}
              className={password.length > 0 && isPasswordValid(password) ? 'border-success' : ''}
            />
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={handleGeneratePassword}
              className="border"
            >
              Generate
            </Button>
          </div>
          {password.length > 0 && isPasswordValid(password) && (
            <Form.Text className="text-success">
              ✓ Password meets all requirements
            </Form.Text>
          )}
          {password.length > 0 && (
            <div className="mt-3 p-3 bg-light rounded" style={{ fontSize: '0.875rem' }}>
              <small className="text-muted fw-semibold d-block mb-2">Password Requirements:</small>
              <div className="d-flex flex-column gap-2">
                <div className={`d-flex align-items-center ${passwordErrors.minLength ? 'text-success' : 'text-danger'}`}>
                  <span className="me-2" style={{ fontSize: '1rem', fontWeight: 'bold' }}>
                    {passwordErrors.minLength ? '✓' : '✗'}
                  </span>
                  <span>At least 8 characters</span>
                </div>
                <div className={`d-flex align-items-center ${passwordErrors.hasUppercase ? 'text-success' : 'text-danger'}`}>
                  <span className="me-2" style={{ fontSize: '1rem', fontWeight: 'bold' }}>
                    {passwordErrors.hasUppercase ? '✓' : '✗'}
                  </span>
                  <span>At least one uppercase letter (A-Z)</span>
                </div>
                <div className={`d-flex align-items-center ${passwordErrors.hasLowercase ? 'text-success' : 'text-danger'}`}>
                  <span className="me-2" style={{ fontSize: '1rem', fontWeight: 'bold' }}>
                    {passwordErrors.hasLowercase ? '✓' : '✗'}
                  </span>
                  <span>At least one lowercase letter (a-z)</span>
                </div>
                <div className={`d-flex align-items-center ${passwordErrors.hasNumber ? 'text-success' : 'text-danger'}`}>
                  <span className="me-2" style={{ fontSize: '1rem', fontWeight: 'bold' }}>
                    {passwordErrors.hasNumber ? '✓' : '✗'}
                  </span>
                  <span>At least one number (0-9)</span>
                </div>
                <div className={`d-flex align-items-center ${passwordErrors.hasSpecialChar ? 'text-success' : 'text-danger'}`}>
                  <span className="me-2" style={{ fontSize: '1rem', fontWeight: 'bold' }}>
                    {passwordErrors.hasSpecialChar ? '✓' : '✗'}
                  </span>
                  <span>At least one special character (!@#$%^&*...)</span>
                </div>
              </div>
            </div>
          )}
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label className="fw-semibold">Confirm Password</Form.Label>
          <Form.Control
            type="text"
            value={passwordConfirmation}
            onChange={(e) => handleConfirmPasswordChange(e.target.value)}
            placeholder="Confirm password"
            isInvalid={!!confirmPasswordError}
            className={passwordConfirmation.length > 0 && !confirmPasswordError && password === passwordConfirmation ? 'border-success' : ''}
          />
          {confirmPasswordError && (
            <Form.Control.Feedback type="invalid">
              {confirmPasswordError}
            </Form.Control.Feedback>
          )}
          {passwordConfirmation.length > 0 && !confirmPasswordError && password === passwordConfirmation && (
            <Form.Text className="text-success">
              ✓ Passwords match
            </Form.Text>
          )}
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose} disabled={loading}>
          Close
        </Button>
        <Button variant="primary" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Updating...' : 'Reset Password'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ResetPasswordModal;

