import React from "react";
import { Row, Col } from "react-bootstrap";

interface UsersTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const UsersTabs: React.FC<UsersTabsProps> = ({ activeTab, setActiveTab }) => (
  <Row className="mb-3">
    <Col md={12}>
      <nav
        id="system-tabs"
        className="mb-3 nav nav-tabs"
        aria-label="User profile sections"
      >
        <button
          type="button"
          className={`nav-link ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          Overview
        </button>
      </nav>
    </Col>
  </Row>
);

export default UsersTabs;
