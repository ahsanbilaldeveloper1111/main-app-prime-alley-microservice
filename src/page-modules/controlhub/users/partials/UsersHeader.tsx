import React from "react";
import { Row, Col } from "react-bootstrap";

import { UsersDirectoryToolbarActions } from "./UsersDirectoryToolbarActions";

interface UsersHeaderProps {
  syncLdapUsers: () => void;
}

const UsersHeader: React.FC<UsersHeaderProps> = ({ syncLdapUsers }) => {
  return (
    <Row className="mb-3">
      <Col md={12}>
        <UsersDirectoryToolbarActions syncLdapUsers={syncLdapUsers} />
      </Col>
    </Row>
  );
};

export default UsersHeader;
