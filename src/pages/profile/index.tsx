import React,{ReactElement, useEffect, useState, useCallback} from 'react'
import Layout from '@layout/index'
import BreadcrumbItem from '@common/BreadcrumbItem'
import { Card, Col, Row, Tab, Tabs } from 'react-bootstrap'
import { useSession } from 'next-auth/react'
import SuccessfulModal from '@components/page-partials/SuccessfulModal'

import { GetUserProfile } from '@utils/users'

import '@assets/scss/tabs.scss'
import '@assets/scss/common.scss'
import { getStorageImageUrl } from '@utils/imageUtils'

// Import partial components
import UserProfileTab from '@pages/controlhub/users/[id]/partials/UserProfileTab'
import OrganizationalHierarchyTab from '@pages/controlhub/users/[id]/partials/OrganizationalHierarchyTab'
import RecentActivitiesTab from '@pages/controlhub/users/[id]/partials/RecentActivitiesTab'

const ProfileView = () => {
    const { data: session } = useSession();

    const [currentUser, setCurrentUser] = useState<any>(null);
    const [showSuccessfulModal, setShowSuccessfulModal] = useState(false);
    const [successModalTitle, setSuccessModalTitle] = useState('');
    const [successModalDescription, setSuccessModalDescription] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    // Fetch user data when session is ready
    useEffect(() => {
        if (session) {
           fetchUser();
        }
    }, [session]);

    const [profilePicture, setProfilePicture] = useState<string>('');
    const fetchUser = async () => {
        setIsLoading(true);
        try {
        const getUser = await GetUserProfile(session?.user?.id as string, false);
        if(getUser){
            setCurrentUser(getUser);
            setProfilePicture(getUser?.profile?.profile_picture);
        }
        } catch (error) {
            console.error('Error fetching user:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSuccess = useCallback((title: string, description: string) => {
        setSuccessModalTitle(title);
        setSuccessModalDescription(description);
        setTimeout(() => {
            setShowSuccessfulModal(true);
        }, 100);
    }, []);

    if (isLoading) {
        return (
            <React.Fragment>
                <BreadcrumbItem mainTitle="Controlhub" mainLink="/profile" subTitle="Profile" />
                <Row>
                    <Col md={12} className="text-center py-5">
                        <div className="spinner-border" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                        <p className="mt-3">Loading profile data...</p>
                    </Col>
                </Row>
            </React.Fragment>
        );
    }

    return (
        <React.Fragment>
            <BreadcrumbItem mainTitle="Controlhub" mainLink="/profile" subTitle="Profile" />

            <Row>
                <Col md={12}>
                    <Tabs
                        defaultActiveKey="overview"
                        id="profile-tabs"
                        className="mb-3"
                    >
                        <Tab eventKey="overview" title="Overview">
            <Row>
                                <Col md={5}>
                                    <Card>
                                        <Card.Body className="overview-card">
                                            <Row className="align-items-center">
                                                <Col xs={3}>
                                                    <div className="user-avatar">
                                                        {profilePicture ? 
                                                        <img src={getStorageImageUrl(profilePicture) || ''} alt="Profile" className="img-fluid rounded-circle" /> : <div className="text">
                                                        <i className="material-icons-two-tone">person</i>
                                                        </div>}
                                                    </div>
                                                </Col>
                                                <Col xs={9}>
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
                                                    <p className="mb-0 small text-primary"><b>Status</b></p>
                                                    <p className="mb-2 text-capitalize d-flex justify-content-between">
                                                    {currentUser?.status}
                                                        <span></span>
                                                    </p>
                                                    <p className="mb-0 small text-primary"><b>Department</b></p>
                                                    <p className="mb-2 text-capitalize">
                                                        {currentUser?.department && currentUser?.department !== 'N/A' ? currentUser?.department : 'N/A'}
                                                    </p>
                                                    <p className="mb-0 small text-primary"><b>Extension</b></p>
                                                    <p className="mb-0 text-capitalize">
                                                        {currentUser?.phone && currentUser?.phone !== 'N/A' ? currentUser?.phone : 'N/A'}
                                                    </p>
                                                </Col>
                                                <Col md={6}>
                                                    <p className="mb-0 small text-primary"><b>Rank</b></p>
                                                    <p className="mb-2 text-capitalize d-flex justify-content-between">
                                                        {currentUser?.role?.name || 'Rank not assigned'}
                                                        <span></span>
                                                    </p>
                                                    <p className="mb-0 small text-primary"><b>Group</b></p>
                                                    <p className="mb-0 text-capitalize d-flex justify-content-between">
                                                        {currentUser?.group?.name || 'Group not assigned'}
                                                        <span></span>
                                                    </p>
                                                </Col>
                                            </Row>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>

                            <UserProfileTab
                                profileData={null}
                                profilePicturePreview={null}
                                isLoadingProfile={false}
                                session={{ ...session, user: { ...session?.user, permissions: [] } }}
                                currentUser={currentUser}
                                onUserUpdate={fetchUser}
                                onSuccess={handleSuccess}
                            />

                            {/* Organizational Chart Section */}
                            <OrganizationalHierarchyTab currentUser={currentUser} />

                            <RecentActivitiesTab />
                        </Tab>
                    </Tabs>
                </Col>
            </Row>

            <SuccessfulModal
                show={showSuccessfulModal}
                onHide={() => setShowSuccessfulModal(false)}
                title={successModalTitle}
                description={successModalDescription}
            />
        </React.Fragment>
    )
}
ProfileView.getLayout = (page: ReactElement) => {
    return <Layout>{page}</Layout>;
  };
export default ProfileView
