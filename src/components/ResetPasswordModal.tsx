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

const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
  show,
  onHide,
  username,
  onSuccess
}) => {
  const [password, setPassword] = useState<string>("");
  const [passwordConfirmation, setPasswordConfirmation] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  // Reset form when modal is closed or username changes
  useEffect(() => {
    if (!show) {
      setPassword("");
      setPasswordConfirmation("");
    }
  }, [show]);

  // Handle password generation
  const handleGeneratePassword = useCallback(() => {
    const randomPassword = generateComplexId(15);
    setPassword(randomPassword);
    setPasswordConfirmation(randomPassword);
  }, []);

  // Handle password update submission
  const handleSubmit = useCallback(async () => {
    if (!username) {
      toast.error('Username is required');
      return;
    }

    // Validate passwords match
    if (password !== passwordConfirmation) {
      toast.error('Passwords do not match');
      return;
    }

    // Validate password is not empty
    if (!password || password.length === 0) {
      toast.error('Password cannot be empty');
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
  }, [username, password, passwordConfirmation, onHide, onSuccess]);

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
        <p>
          Reset password for user: <b>{username}</b>
        </p>
        <Form.Group className="mb-3">
          <Form.Label>Password</Form.Label>
          <div className="input-group">
            <Form.Control
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
            />
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={handleGeneratePassword}
            >
              Generate
            </Button>
          </div>
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Confirm Password</Form.Label>
          <Form.Control
            type="text"
            value={passwordConfirmation}
            onChange={(e) => setPasswordConfirmation(e.target.value)}
            placeholder="Confirm password"
          />
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

