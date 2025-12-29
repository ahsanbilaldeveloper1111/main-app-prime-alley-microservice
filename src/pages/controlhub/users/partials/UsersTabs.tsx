import React from 'react';
import { Row, Col } from 'react-bootstrap';

interface UsersTabsProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

const UsersTabs: React.FC<UsersTabsProps> = ({ activeTab, setActiveTab }) => {
    return (
        <Row className="mb-3">
            <Col md={12}>
                <ul id="system-tabs" className="mb-3 nav nav-tabs" role="tablist">
                    <li className="nav-item" role="presentation">
                        <button
                            className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
                            onClick={() => setActiveTab('overview')}
                            type="button"
                            role="tab"
                        >
                            Overview
                        </button>
                    </li>
                    {/* <li className="nav-item" role="presentation">
                        <button
                            className={`nav-link ${activeTab === 'insight' ? 'active' : ''}`}
                            onClick={() => setActiveTab('insight')}
                            type="button"
                            role="tab"
                        >
                            Insight
                        </button>
                    </li> */}
                </ul>
            </Col>
        </Row>
    );
};

export default UsersTabs;

