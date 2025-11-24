import React,{ReactElement, useEffect, useState} from 'react'
import Layout from '@layout/index'
import BreadcrumbItem from '@common/BreadcrumbItem'
import { Button, Card, Col, Form, Modal, Row, Tab, Table, Tabs } from 'react-bootstrap'
import Swal from 'sweetalert2'
import { toast } from 'react-toastify'
import { useSession } from 'next-auth/react'

import { GetUserProfile } from '@utils/users'

import { useRouter } from 'next/router'
import '@assets/scss/tabs.scss'


interface User {
    id: number;
    name: string;
    email: string;
    phone: string;
    ou: string;
    department: string;
    company: string;
    last_synced_at: string;
    role_id: string;
    role: {
        name: string;
    };
    group_id: string;
    group: {
        name: string;
    };
    status: string;
    extended_permissions: string[];
    blocked_permissions: string[];
    role_excluded_permissions: string[];
}

// Define Permission Interface
interface Permission {
    id: number;
    name: string;
    slug: string;
    module: string;
}

interface Role {
    id: number;
    name: string;
}

interface Group {
    id: number;
    name: string;
}

// Add type for react-select option
interface SelectOption {
    value: number;
    label: string;
}

const ProfileView = () => {


    const { data: session, status } = useSession();
    const router = useRouter();
    const { id } = router.query;

    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        if (session) {
           fetchUser();
          
        }
    }, [session]);

    const fetchUser = async () => {
        const getUser = await GetUserProfile(session?.user?.id as string, false);
        if(getUser){
            setCurrentUser(getUser);
        }
        

    };

   


 

    

    return (
        <React.Fragment>
                 
                
            <BreadcrumbItem mainTitle="Controlhub" mainLink="/profile" subTitle="Profile" />
           

            <Row>
                                <Col md={5}>
                                    <Card>
                                        <Card.Body className="overview-card">
                                            <Row className="align-items-center">
                                                <Col md={3}>
                                                    <div className="user-avatar">
                                                        <div className="text">
                                                        <i className="material-icons-two-tone">person</i>
                                                        </div>
                                                    </div>
                                                </Col>
                                                <Col md={9}>
                                                    <h4 className="text-white mb-1 text-capitalize">{currentUser?.name}</h4>


                                                    <p className="text-white mb-0 text-opacity">Email</p>
                                                    <p className="text-white mb-2">{currentUser?.email}</p>

                                                   <hr className="theme-hr" />

                                                    <p className="text-white mb-0 text-opacity">Company</p>
                                                    <p className="text-white mb-2">
                                                    {currentUser?.company && currentUser?.company !== 'N/A' ? currentUser?.company : 'N/A'}    
                                                    </p>

                                                    

                                                </Col>
                                            </Row>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col md={7}>
                                    <Card className="no-shadow">
                                        <Card.Body>
                                           <Row>
                                            <Col md={6}>

                                            

                                            <p className="mb-0  small text-primary"><b>Phone</b></p>
                                            <p className="mb-2 text-capitalize">
                                                {currentUser?.phone && currentUser?.phone !== 'N/A' ? currentUser?.phone : 'N/A'}
                                            </p>
                                            
                                            <p className="mb-0  small text-primary"><b>OU</b></p>
                                            <p className="mb-2 text-capitalize">
                                                {currentUser?.ou && currentUser?.ou !== 'N/A' ? currentUser?.ou : 'N/A'}
                                            </p>

                                           

                                                <p className="mb-0  small text-primary"><b>Department</b></p>
                                                <p className="mb-0 text-capitalize">
                                                    {currentUser?.department && currentUser?.department !== 'N/A' ? currentUser?.department : 'N/A'}
                                                </p>
                                            </Col>
                                            <Col md={6}>
                                                <p className="mb-0  small text-primary"><b>Status</b></p>
                                                <p className="mb-2 text-capitalize  d-flex justify-content-between">
                                                    {currentUser?.status}
                                                    
                                                </p>

                                                <p className="mb-0  small text-primary"><b>Rank</b></p>
                                                <p className="mb-2 text-capitalize d-flex justify-content-between">
                                                    {currentUser?.role?.name || 'Rank not assigned'}
                                                </p>

                                                <p className="mb-0  small text-primary"><b>Group</b></p>
                                                <p className="mb-0 text-capitalize d-flex justify-content-between">
                                                    {currentUser?.group?.name || 'Group not assigned'}
                                                </p>

                                            </Col>
                                           </Row>
                                           </Card.Body>
                                    </Card>
                                </Col>
                            </Row>


                            <Row>
                                <Col md={12}>
                                    <Card>

                                        <Card.Header>
                                            <h5 >Recent Activities</h5>
                                        </Card.Header>
                                        <Card.Body >
                                            
                                            
                                            
                                            <Row className="recent-activity">
                                                <Col md={1} className="d-flex align-items-center justify-content-center">
                                                    <div className="ico">
                                                    <i className="ti ti-history"></i>
                                                    </div>
                                                </Col>
                                                <Col md={10} className="d-flex align-items-center">
                                                    <div className="info">
                                                    <h6>Login to platform</h6>
                                                    <p className="mb-2 small">
                                                        <span className=""><b>Date: </b> </span>
                                                        <span className="text-muted me-4">23 Aug 2024</span>

                                                        <span className=""><b>Time: </b> </span>
                                                        <span className="text-muted me-4">12:00:00</span>

                                                        <span className=""><b>Device: </b> </span>
                                                        <span className="text-muted me-4">MacBook Pro</span>

                                                        <span className=""><b>Browser: </b> </span>
                                                        <span className="text-muted me-4">Chrome</span>


                                                    </p>
                                                    </div>
                                                </Col>
                                                <Col md={1} className="d-flex align-items-center justify-content-end">
                                                <i className="ph-duotone ph-dots-three-outline-vertical"></i>
                                                </Col>
                                            </Row>



                                            <Row className="recent-activity">
                                                <Col md={1} className="d-flex align-items-center justify-content-center">
                                                    <div className="ico">
                                                    <i className="ti ti-history"></i>
                                                    </div>
                                                </Col>
                                                <Col md={10} className="d-flex align-items-center">
                                                    <div className="info">
                                                    <h6>Login to platform</h6>
                                                    <p className="mb-2 small">
                                                        <span className=""><b>Date: </b> </span>
                                                        <span className="text-muted me-4">23 Aug 2024</span>

                                                        <span className=""><b>Time: </b> </span>
                                                        <span className="text-muted me-4">12:00:00</span>

                                                        <span className=""><b>Device: </b> </span>
                                                        <span className="text-muted me-4">MacBook Pro</span>

                                                        <span className=""><b>Browser: </b> </span>
                                                        <span className="text-muted me-4">Chrome</span>


                                                    </p>
                                                    </div>
                                                </Col>
                                                <Col md={1} className="d-flex align-items-center justify-content-end">
                                                <i className="ph-duotone ph-dots-three-outline-vertical"></i>
                                                </Col>
                                            </Row>




                                            <Row className="recent-activity">
                                                <Col md={1} className="d-flex align-items-center justify-content-center">
                                                    <div className="ico">
                                                    <i className="ti ti-history"></i>
                                                    </div>
                                                </Col>
                                                <Col md={10} className="d-flex align-items-center">
                                                    <div className="info">
                                                    <h6>Login to platform</h6>
                                                    <p className="mb-2 small">
                                                        <span className=""><b>Date: </b> </span>
                                                        <span className="text-muted me-4">23 Aug 2024</span>

                                                        <span className=""><b>Time: </b> </span>
                                                        <span className="text-muted me-4">12:00:00</span>

                                                        <span className=""><b>Device: </b> </span>
                                                        <span className="text-muted me-4">MacBook Pro</span>

                                                        <span className=""><b>Browser: </b> </span>
                                                        <span className="text-muted me-4">Chrome</span>


                                                    </p>
                                                    </div>
                                                </Col>
                                                <Col md={1} className="d-flex align-items-center justify-content-end">
                                                <i className="ph-duotone ph-dots-three-outline-vertical"></i>
                                                </Col>
                                            </Row>



                                            <Row className="recent-activity">
                                                <Col md={1} className="d-flex align-items-center justify-content-center">
                                                    <div className="ico">
                                                    <i className="ti ti-history"></i>
                                                    </div>
                                                </Col>
                                                <Col md={10} className="d-flex align-items-center">
                                                    <div className="info">
                                                    <h6>Login to platform</h6>
                                                    <p className="mb-2 small">
                                                        <span className=""><b>Date: </b> </span>
                                                        <span className="text-muted me-4">23 Aug 2024</span>

                                                        <span className=""><b>Time: </b> </span>
                                                        <span className="text-muted me-4">12:00:00</span>

                                                        <span className=""><b>Device: </b> </span>
                                                        <span className="text-muted me-4">MacBook Pro</span>

                                                        <span className=""><b>Browser: </b> </span>
                                                        <span className="text-muted me-4">Chrome</span>


                                                    </p>
                                                    </div>
                                                </Col>
                                                <Col md={1} className="d-flex align-items-center justify-content-end">
                                                <i className="ph-duotone ph-dots-three-outline-vertical"></i>
                                                </Col>
                                            </Row>


                                            <Row className="recent-activity">
                                                <Col md={1} className="d-flex align-items-center justify-content-center">
                                                    <div className="ico">
                                                    <i className="ti ti-history"></i>
                                                    </div>
                                                </Col>
                                                <Col md={10} className="d-flex align-items-center">
                                                    <div className="info">
                                                    <h6>Login to platform</h6>
                                                    <p className="mb-2 small">
                                                        <span className=""><b>Date: </b> </span>
                                                        <span className="text-muted me-4">23 Aug 2024</span>

                                                        <span className=""><b>Time: </b> </span>
                                                        <span className="text-muted me-4">12:00:00</span>

                                                        <span className=""><b>Device: </b> </span>
                                                        <span className="text-muted me-4">MacBook Pro</span>

                                                        <span className=""><b>Browser: </b> </span>
                                                        <span className="text-muted me-4">Chrome</span>


                                                    </p>
                                                    </div>
                                                </Col>
                                                <Col md={1} className="d-flex align-items-center justify-content-end">
                                                <i className="ph-duotone ph-dots-three-outline-vertical"></i>
                                                </Col>
                                            </Row>

                                            <Row className="recent-activity">
                                                <Col md={1} className="d-flex align-items-center justify-content-center">
                                                    <div className="ico">
                                                    <i className="ti ti-history"></i>
                                                    </div>
                                                </Col>
                                                <Col md={10} className="d-flex align-items-center">
                                                    <div className="info">
                                                    <h6>Login to platform</h6>
                                                    <p className="mb-2 small">
                                                        <span className=""><b>Date: </b> </span>
                                                        <span className="text-muted me-4">23 Aug 2024</span>

                                                        <span className=""><b>Time: </b> </span>
                                                        <span className="text-muted me-4">12:00:00</span>

                                                        <span className=""><b>Device: </b> </span>
                                                        <span className="text-muted me-4">MacBook Pro</span>

                                                        <span className=""><b>Browser: </b> </span>
                                                        <span className="text-muted me-4">Chrome</span>


                                                    </p>
                                                    </div>
                                                </Col>
                                                <Col md={1} className="d-flex align-items-center justify-content-end">
                                                <i className="ph-duotone ph-dots-three-outline-vertical"></i>
                                                </Col>
                                            </Row>


                                            <Row className="recent-activity">
                                                <Col md={1} className="d-flex align-items-center justify-content-center">
                                                    <div className="ico">
                                                    <i className="ti ti-history"></i>
                                                    </div>
                                                </Col>
                                                <Col md={10} className="d-flex align-items-center">
                                                    <div className="info">
                                                    <h6>Login to platform</h6>
                                                    <p className="mb-2 small">
                                                        <span className=""><b>Date: </b> </span>
                                                        <span className="text-muted me-4">23 Aug 2024</span>

                                                        <span className=""><b>Time: </b> </span>
                                                        <span className="text-muted me-4">12:00:00</span>

                                                        <span className=""><b>Device: </b> </span>
                                                        <span className="text-muted me-4">MacBook Pro</span>

                                                        <span className=""><b>Browser: </b> </span>
                                                        <span className="text-muted me-4">Chrome</span>


                                                    </p>
                                                    </div>
                                                </Col>
                                                <Col md={1} className="d-flex align-items-center justify-content-end">
                                                <i className="ph-duotone ph-dots-three-outline-vertical"></i>
                                                </Col>
                                            </Row>





                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>

        </React.Fragment>
    )
}
ProfileView.getLayout = (page: ReactElement) => {
    return <Layout>{page}</Layout>;
  };
export default ProfileView
