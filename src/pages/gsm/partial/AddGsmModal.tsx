import React, { useState } from 'react';
import { Modal, Button } from 'react-bootstrap';
import { addGsm } from '@utils/GsmManagement';
import { toast } from 'react-toastify';

interface AddGsmModalProps {
  show: boolean;
  onHide: () => void;
  onSuccess?: () => void;
}

const AddGsmModal: React.FC<AddGsmModalProps> = ({ show, onHide, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    ip_address: '',
    username: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.ip_address || !formData.username || !formData.password) {
      toast.error('Please fill all the fields');
      return;
    }

    setIsLoading(true);
    try {
      const response = await addGsm(
        formData.name,
        formData.ip_address,
        formData.username,
        formData.password
      );
      
      if (response) {
        toast.success('GSM device created successfully');
        handleClose();
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (error) {
      console.error('Error creating GSM:', error);
      toast.error('Failed to create GSM device');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      ip_address: '',
      username: '',
      password: ''
    });
    onHide();
  };

  return (
    <Modal
      show={show}
      onHide={handleClose}
      size="md"
      centered
      className="customModal"
    >
      <Modal.Header closeButton>
        <Modal.Title>Add New GSM Device</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <form onSubmit={handleSubmit}>
          <div className="form-group mb-3">
            <label htmlFor="name" className="form-label">GSM Name</label>
            <input
              type="text"
              className="form-control"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter GSM device name"
              required
            />
          </div>

          <div className="form-group mb-3">
            <label htmlFor="ip_address" className="form-label">IP Address</label>
            <input
              type="text"
              className="form-control"
              id="ip_address"
              name="ip_address"
              value={formData.ip_address}
              onChange={handleInputChange}
              placeholder="Enter IP address (e.g., 192.168.1.100)"
              required
            />
          </div>

          <div className="form-group mb-3">
            <label htmlFor="username" className="form-label">Username</label>
            <input
              type="text"
              className="form-control"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              placeholder="Enter username"
              required
            />
          </div>

          <div className="form-group mb-3">
            <label htmlFor="password" className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Enter password"
              required
            />
          </div>
        </form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button 
          variant="primary" 
          onClick={handleSubmit}
          disabled={isLoading || !formData.name || !formData.ip_address || !formData.username || !formData.password}
        >
          {isLoading ? 'Creating...' : 'Create GSM Device'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AddGsmModal;
