import React from "react";
import { Button, Modal, Table } from "react-bootstrap";
import { MainSettingsFormSidebar } from "@components/main-settings/MainSettingsFormSidebar";
import { useMainSettingsFormSidebar } from "@components/main-settings/mainSettingsFormContext";

interface UserDetailsModalProps {
  show: boolean;
  onHide: () => void;
  selectedUsers: Array<{
    name: string;
    extension: string;
    lastLogin: string;
  }>;
}

const UserDetailsModal: React.FC<UserDetailsModalProps> = ({
  show,
  onHide,
  selectedUsers,
}) => {
  const preferSidebar = useMainSettingsFormSidebar();

  const tableContent = (
    <Table striped bordered hover className="mb-0">
      <thead>
        <tr>
          <th>Name</th>
          <th>Extension</th>
          <th>Last Login</th>
        </tr>
      </thead>
      <tbody>
        {selectedUsers.map((user) => (
          <tr key={user.extension}>
            <td>{user.name}</td>
            <td>{user.extension}</td>
            <td>{user.lastLogin}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  );

  const footer = (
    <div className="main-settings-form-sidebar-footer w-100">
      <div className="main-settings-form-sidebar-footer__actions">
        <Button
          variant="outline-secondary"
          onClick={onHide}
          className="contact-form-btn-cancel"
        >
          Close
        </Button>
      </div>
    </div>
  );

  if (preferSidebar) {
    return (
      <MainSettingsFormSidebar
        show={show}
        onHide={onHide}
        title="User Details"
        footer={footer}
      >
        {show ? tableContent : null}
      </MainSettingsFormSidebar>
    );
  }

  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>User Details</Modal.Title>
      </Modal.Header>
      <Modal.Body>{tableContent}</Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default UserDetailsModal;
