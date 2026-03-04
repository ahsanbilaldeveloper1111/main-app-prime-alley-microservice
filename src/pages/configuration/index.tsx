import '@assets/scss/datatable-style.scss';
import React, { ReactElement, useState } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import { Row, Col, Card } from 'react-bootstrap';
import { useSession } from 'next-auth/react';
import Ranks from '@pages/controlhub/ranks';
import Groups from '@pages/controlhub/groups';
import GSMManagement from '@pages/pulse/gateways';
import GSMAssignments from '@pages/gsm/assign';
const Configuration = () => {
    const { data:session, status } = useSession();
    const [activeTab, setActiveTab] = useState(0);
   
    const handleTabChange = (tabIndex: number) => {
        setActiveTab(tabIndex);
    };

    const configurationTabs = [
        {
            id: 'ranks',
            title: 'Ranks',
            icon: 'ph-duotone ph-crown',
            content: (
                  <Ranks />
            )
        },
        {
            id: 'groups',
            title: 'Groups',
            icon: 'ph-duotone ph-users',
            content: (
                  <Groups />
            )
        }
        ,
        {
            id: 'gsm_management',
            title: 'GSM Management',
            icon: 'ph-duotone ph-users',
            content: (
                  <GSMManagement />
            )
        },
        {
            id: 'gsm_assignments',
            title: 'GSM Assign',
            icon: 'ph-duotone ph-users',
            content: (
                  <GSMAssignments />
            )
        }
    ];

    return (
        <React.Fragment>
            <BreadcrumbItem mainTitle="Configuration" mainLink="/configuration" subTitle="Configuration" />
            <Row className="mb-3">
            <Col md={12}>
                <div className="page-header-title">
                <h2 className="mb-0 d-flex align-items-center">
                    Configuration
                </h2>
                </div>
            </Col>
            </Row>

            <Row>
                <Col md={12}>
                    <Row>
                        <Col md={3} className="bg-gray-200 p-3">
                            <Card>
                                
                                <Card.Body>
                                <ul className="nav flex-column nav-pills" role="tablist" aria-orientation="vertical">
                                    {configurationTabs.map((tab, index) => (
                                        <li key={tab.id}>
                                            <button 
                                                className={`nav-tab-link ${index === activeTab ? 'active' : ''}`}
                                                onClick={() => handleTabChange(index)}
                                                role="tab"
                                                aria-selected={index === activeTab}
                                            >
                                                <span className={tab.icon}></span>
                                                <span className="ms-2">{tab.title}</span>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={9}>
                            <div className="tab-content" id="v-pills-tabContent">
                                {configurationTabs.map((tab, index) => (
                                    <div 
                                        key={tab.id}
                                        className={`tab-pane fade ${index === activeTab ? 'show active' : ''}`}
                                        role="tabpanel"
                                        aria-labelledby={`v-pills-tab-${index + 1}`}
                                    >
                                        <Card>
                                            <Card.Body>
                                                {tab.content}
                                            </Card.Body>
                                        </Card>
                                    </div>
                                ))}
                            </div>
                        </Col>
                    </Row>
                </Col>
            </Row>
        
        </React.Fragment>
    );
};

Configuration.getLayout = (page: ReactElement) => {
    return <Layout>{page}</Layout>;
};


export default Configuration;