import React from "react";
import { Modal, Table, Button } from "react-bootstrap";

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
  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>User Details</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Table striped bordered hover>
          <thead>
            <tr>
              <th>Name</th>
              <th>Extension</th>
              <th>Last Login</th>
            </tr>
          </thead>
          <tbody>
            {selectedUsers.map((user, index) => (
              <tr key={user.extension}>
                <td>{user.name}</td>
                <td>{user.extension}</td>
                <td>{user.lastLogin}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default UserDetailsModal;
