import React, { useState, useEffect } from 'react';
import { Card, Col, Row, Button, Form } from 'react-bootstrap';
import FormModal from '@pages/partial/FormModal';
import Select from 'react-select';
import { User, Role, Group } from '@typings/controlhub/users';
import { assignRoleToUser, assignGroupToUser, MarkAsCompanyAdmin, getUserProfileData, updateUserProfile } from '@utils/users';
import { Country, State, City } from 'country-state-city';
import { languages as languagesData } from '@config/languages';

interface OverviewTabProps {
    currentUser: User | null;
    roles: Role[];
    groups: Group[];
    session: any;
    onUserUpdate: () => void;
    onSuccess: (title: string, description: string) => void;
}

const OverviewTab: React.FC<OverviewTabProps> = ({
    currentUser,
    roles,
    groups,
    session,
    onUserUpdate,
    onSuccess
}) => {
    const [showChangeGroupModal, setShowChangeGroupModal] = useState(false);
    const [showChangeRoleModal, setShowChangeRoleModal] = useState(false);
    const [showChangeCompanyAdminModal, setShowChangeCompanyAdminModal] = useState(false);
    const [showEditProfileModal, setShowEditProfileModal] = useState(false);
    const [updatedGroup, setUpdatedGroup] = useState<string>('');
    const [updatedRole, setUpdatedRole] = useState<string>('');
    const [isCompanyAdmin, setIsCompanyAdmin] = useState<boolean>(false);
    const [profileData, setProfileData] = useState<any>(null);
    const [profileFormData, setProfileFormData] = useState<any>({
        title: '',
        first_name: '',
        last_name: '',
        email: '',
        phone_number: '',
        gender: '',
        job_title: '',
        department: '',
        country: '',
        state: '',
        city: '',
        postal_code: '',
        address: '',
        timezone: '',
        service_type: '',
        user_consent: false,
        language: ''
    });
    const [profilePicture, setProfilePicture] = useState<File | null>(null);
    const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);
    const [isLoadingProfile, setIsLoadingProfile] = useState(false);
    const [countries, setCountries] = useState<any[]>([]);
    const [states, setStates] = useState<any[]>([]);
    const [cities, setCities] = useState<any[]>([]);
    const [selectedCountryCode, setSelectedCountryCode] = useState<string>('');
    const [selectedStateCode, setSelectedStateCode] = useState<string>('');
    const [languages] = useState(languagesData);

    const handleCloseChangeGroupModal = () => {
        setShowChangeGroupModal(false);
    };

    const handleSubmitChangeGroup = async () => {
        const response = await assignGroupToUser(currentUser?.id?.toString() || '', updatedGroup);
        if (response) {
            setShowChangeGroupModal(false);
            onSuccess('Group Changed', 'The group has been changed successfully');
            onUserUpdate();
        }
    };

    const handleCloseChangeRoleModal = () => {
        setShowChangeRoleModal(false);
    };

    const handleSubmitChangeRole = async () => {
        const assignRole = await assignRoleToUser(currentUser?.id?.toString() || '', updatedRole);
        if (assignRole) {
            setShowChangeRoleModal(false);
            onSuccess('Rank Changed', 'The rank has been changed successfully');
            onUserUpdate();
        }
    };

    const handleCloseChangeCompanyAdminModal = () => {
        setShowChangeCompanyAdminModal(false);
    };

    const handleSubmitChangeCompanyAdmin = async () => {
        const response = await MarkAsCompanyAdmin(currentUser?.id?.toString() || '', isCompanyAdmin);
        if (response) {
            setShowChangeCompanyAdminModal(false);
            onSuccess('Company Admin Changed', 'The company admin has been changed successfully');
            onUserUpdate();
        }
    };

    React.useEffect(() => {
        if (currentUser) {
            setUpdatedGroup(currentUser.group_id || '');
            setUpdatedRole(currentUser.role_id || '');
            setIsCompanyAdmin(currentUser.is_company_admin === "1");
        }
    }, [currentUser]);

    // Load countries on component mount
    useEffect(() => {
        const loadCountries = () => {
            try {
                const countriesData = Country.getAllCountries();
                setCountries(countriesData);
            } catch (error) {
                console.error('Error loading countries:', error);
            }
        };
        loadCountries();
    }, []);

    // Load states when country changes
    useEffect(() => {
        const loadStates = () => {
            if (selectedCountryCode) {
                try {
                    const statesData = State.getStatesOfCountry(selectedCountryCode);
                    setStates(statesData);
                    // Reset state and city when country changes
                    if (profileFormData.country) {
                        setSelectedStateCode('');
                        setCities([]);
                        setProfileFormData({ ...profileFormData, state: '', city: '' });
                    }
                } catch (error) {
                    console.error('Error loading states:', error);
                    setStates([]);
                }
            } else {
                setStates([]);
            }
        };
        loadStates();
    }, [selectedCountryCode]);

    // Load cities when state changes
    useEffect(() => {
        const loadCities = () => {
            if (selectedCountryCode && selectedStateCode) {
                try {
                    const citiesData = City.getCitiesOfState(selectedCountryCode, selectedStateCode);
                    setCities(citiesData);
                    // Reset city when state changes
                    if (profileFormData.state) {
                        setProfileFormData({ ...profileFormData, city: '' });
                    }
                } catch (error) {
                    console.error('Error loading cities:', error);
                    setCities([]);
                }
            } else {
                setCities([]);
            }
        };
        loadCities();
    }, [selectedCountryCode, selectedStateCode]);

    React.useEffect(() => {
        const fetchProfileData = async () => {
            if (!currentUser?.id) return;
            try {
                setIsLoadingProfile(true);
                const data = await getUserProfileData(currentUser.id.toString());
                if (data) {
                    setProfileData(data);
                    setProfileFormData({
                        title: data.title || '',
                        first_name: data.first_name || '',
                        last_name: data.last_name || '',
                        email: data.email || '',
                        phone_number: data.phone_number || '',
                        gender: data.gender || '',
                        job_title: data.job_title || '',
                        department: data.department || '',
                        country: data.country || '',
                        state: data.state || '',
                        city: data.city || '',
                        postal_code: data.postal_code || '',
                        address: data.address || '',
                        timezone: data.timezone || '',
                        service_type: data.service_type || '',
                        user_consent: data.user_consent || false,
                        language: data.language || ''
                    });
                    if (data.profile_picture_url) {
                        setProfilePicturePreview(data.profile_picture_url);
                    }
                    
                    // Find and set country code if country name exists
                    if (data.country && countries.length > 0) {
                        const foundCountry = countries.find(
                            (c: any) => c.name === data.country
                        );
                        if (foundCountry) {
                            const countryCode = foundCountry.isoCode || '';
                            setSelectedCountryCode(countryCode);
                            
                            // Load states for the country
                            if (countryCode) {
                                const statesData = State.getStatesOfCountry(countryCode);
                                setStates(statesData);
                                
                                // Find and set state code if state name exists
                                if (data.state) {
                                    const foundState = statesData.find(
                                        (s: any) => s.name === data.state
                                    );
                                    if (foundState) {
                                        const stateCode = foundState.isoCode || '';
                                        setSelectedStateCode(stateCode);
                                        
                                        // Load cities for the state
                                        if (stateCode) {
                                            const citiesData = City.getCitiesOfState(countryCode, stateCode);
                                            setCities(citiesData);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('Error fetching profile data:', error);
            } finally {
                setIsLoadingProfile(false);
            }
        };
        if (countries.length > 0) {
            fetchProfileData();
        }
    }, [currentUser, countries]);

    const handleCloseEditProfileModal = () => {
        setShowEditProfileModal(false);
        setProfilePicture(null);
        setProfilePicturePreview(profileData?.profile_picture_url || null);
    };

    const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setProfilePicture(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfilePicturePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const countryCode = e.target.value;
        const country = countries.find((c: any) => c.isoCode === countryCode);
        const countryName = country ? country.name : '';
        
        setSelectedCountryCode(countryCode);
        setProfileFormData({ ...profileFormData, country: countryName, state: '', city: '' });
        setSelectedStateCode('');
        setCities([]);
        
        if (countryCode) {
            try {
                const statesData = State.getStatesOfCountry(countryCode);
                setStates(statesData);
            } catch (error) {
                console.error('Error loading states:', error);
                setStates([]);
            }
        } else {
            setStates([]);
        }
    };

    const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const stateCode = e.target.value;
        const state = states.find((s: any) => s.isoCode === stateCode);
        const stateName = state ? state.name : '';
        
        setSelectedStateCode(stateCode);
        setProfileFormData({ ...profileFormData, state: stateName, city: '' });
        setCities([]);
        
        if (selectedCountryCode && stateCode) {
            try {
                const citiesData = City.getCitiesOfState(selectedCountryCode, stateCode);
                setCities(citiesData);
            } catch (error) {
                console.error('Error loading cities:', error);
                setCities([]);
            }
        } else {
            setCities([]);
        }
    };

    const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setProfileFormData({ ...profileFormData, city: e.target.value });
    };

    const handleSubmitEditProfile = async () => {
        if (!currentUser?.id) return;
        try {
            const response = await updateUserProfile(
                currentUser.id.toString(),
                profileFormData,
                profilePicture || undefined
            );
            if (response) {
                setShowEditProfileModal(false);
                onSuccess('Profile Updated', 'The profile has been updated successfully');
                // Refresh profile data
                const data = await getUserProfileData(currentUser.id.toString());
                if (data) {
                    setProfileData(data);
                    setProfileFormData({
                        title: data.title || '',
                        first_name: data.first_name || '',
                        last_name: data.last_name || '',
                        email: data.email || '',
                        phone_number: data.phone_number || '',
                        gender: data.gender || '',
                        job_title: data.job_title || '',
                        department: data.department || '',
                        country: data.country || '',
                        state: data.state || '',
                        city: data.city || '',
                        postal_code: data.postal_code || '',
                        address: data.address || '',
                        timezone: data.timezone || '',
                        service_type: data.service_type || '',
                        user_consent: data.user_consent || false
                    });
                    if (data.profile_picture_url) {
                        setProfilePicturePreview(data.profile_picture_url);
                    }
                }
                setProfilePicture(null);
            }
        } catch (error) {
            console.error('Error updating profile:', error);
        }
    };

    return (
        <>
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
                                    <p className="text-white mb-0 text-opacity">User Name</p>
                                    <p className="text-white mb-2">{currentUser?.username}</p>
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
                                        <span>
                                            <i className="ti ti-edit" onClick={() => {
                                                setShowChangeRoleModal(true);
                                            }} style={{ cursor: 'pointer' }}></i>
                                        </span>
                                    </p>
                                    <p className="mb-0 small text-primary"><b>Group</b></p>
                                    <p className="mb-2 text-capitalize d-flex justify-content-between">
                                        {currentUser?.group?.name || 'Group not assigned'}
                                        <span>
                                            <i className="ti ti-edit" onClick={() => {
                                                setShowChangeGroupModal(true);
                                            }} style={{ cursor: 'pointer' }}></i>
                                        </span>
                                    </p>
                                    {session?.user?.permissions?.includes('mark-company-admin-users') && (
                                        <div>
                                            <p className="mb-0 small text-primary"><b>Company Admin</b></p>
                                            <p className="mb-0 text-capitalize d-flex justify-content-between">
                                                {currentUser?.is_company_admin === "1" ? "Yes" : "No"}
                                                <span>
                                                    <i className="ti ti-edit" onClick={() => {
                                                        setShowChangeCompanyAdminModal(true);
                                                    }} style={{ cursor: 'pointer' }}></i>
                                                </span>
                                            </p>
                                        </div>
                                    )}
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Row className="mt-3">
                <Col md={12}>
                    <Card>
                        <Card.Header className="d-flex justify-content-between align-items-center">
                            <h5 className="mb-0">User Profile</h5>
                            
                            {session?.user?.permissions?.includes('update-profile-users') && (
                            <Button 
                                variant="primary" 
                                size="sm"
                                onClick={() => setShowEditProfileModal(true)}
                            >
                                <i className="ti ti-edit me-1"></i>Edit Profile
                            </Button>
                            )}

                        </Card.Header>
                        <Card.Body>
                            {isLoadingProfile ? (
                                <div className="text-center py-4">
                                    <p className="text-muted">Loading profile data...</p>
                                </div>
                            ) : profileData ? (
                                <Row>
                                    <Col md={3} className="text-center mb-3">
                                        {profilePicturePreview ? (
                                            <img 
                                                src={profilePicturePreview} 
                                                alt="Profile" 
                                                className="img-fluid rounded-circle"
                                                style={{ width: '150px', height: '150px', objectFit: 'cover' }}
                                            />
                                        ) : (
                                            <div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center" 
                                                 style={{ width: '150px', height: '150px' }}>
                                                <i className="material-icons-two-tone" style={{ fontSize: '80px' }}>person</i>
                                            </div>
                                        )}
                                    </Col>
                                    <Col md={9}>
                                        <Row>
                                            <Col md={6}>
                                                <p className="mb-1 small text-primary"><b>Title</b></p>
                                                <p className="mb-3">{profileData.title || 'N/A'}</p>
                                                
                                                <p className="mb-1 small text-primary"><b>First Name</b></p>
                                                <p className="mb-3">{profileData.first_name || 'N/A'}</p>
                                                
                                                <p className="mb-1 small text-primary"><b>Last Name</b></p>
                                                <p className="mb-3">{profileData.last_name || 'N/A'}</p>
                                                
                                                <p className="mb-1 small text-primary"><b>Email</b></p>
                                                <p className="mb-3">{profileData.email || 'N/A'}</p>
                                                
                                                <p className="mb-1 small text-primary"><b>Phone Number</b></p>
                                                <p className="mb-3">{profileData.phone_number || 'N/A'}</p>
                                                
                                                <p className="mb-1 small text-primary"><b>Gender</b></p>
                                                <p className="mb-3">{profileData.gender || 'N/A'}</p>
                                                
                                                <p className="mb-1 small text-primary"><b>Job Title</b></p>
                                                <p className="mb-3">{profileData.job_title || 'N/A'}</p>
                                            </Col>
                                            <Col md={6}>
                                                <p className="mb-1 small text-primary"><b>Department</b></p>
                                                <p className="mb-3">{profileData.department || 'N/A'}</p>
                                                
                                                <p className="mb-1 small text-primary"><b>Country</b></p>
                                                <p className="mb-3">{profileData.country || 'N/A'}</p>
                                                
                                                <p className="mb-1 small text-primary"><b>State</b></p>
                                                <p className="mb-3">{profileData.state || 'N/A'}</p>
                                                
                                                <p className="mb-1 small text-primary"><b>City</b></p>
                                                <p className="mb-3">{profileData.city || 'N/A'}</p>
                                                
                                                <p className="mb-1 small text-primary"><b>Postal Code</b></p>
                                                <p className="mb-3">{profileData.postal_code || 'N/A'}</p>
                                                
                                                <p className="mb-1 small text-primary"><b>Address</b></p>
                                                <p className="mb-3">{profileData.address || 'N/A'}</p>
                                                
                                                <p className="mb-1 small text-primary"><b>Timezone</b></p>
                                                <p className="mb-3">{profileData.timezone || 'N/A'}</p>
                                                
                                                <p className="mb-1 small text-primary"><b>Service Type</b></p>
                                                <p className="mb-3">{profileData.service_type || 'N/A'}</p>
                                                
                                                <p className="mb-1 small text-primary"><b>User Consent</b></p>
                                                <p className="mb-3">{profileData.user_consent ? 'Yes' : 'No'}</p>
                                            </Col>
                                        </Row>
                                    </Col>
                                </Row>
                            ) : (
                                <div className="text-center py-4">
                                    <p className="text-muted">No profile data available</p>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Row>
                <Col md={12}>
                    <Card>
                        <Card.Header>
                            <h5>Recent Activities</h5>
                        </Card.Header>
                        <Card.Body>
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

            <FormModal
                show={showChangeGroupModal}
                onHide={handleCloseChangeGroupModal}
                title="Change Group"
                desc="Please select the group to change"
                formHtml={
                    <>
                        <div className="form-group">
                            <label htmlFor="group">Group</label>
                            <select className="form-control" id="group"
                                onChange={(e) => {
                                    setUpdatedGroup(e.target.value);
                                }}
                                value={updatedGroup}>
                                <option value="">Select Group</option>
                                {groups.map((group) => (
                                    <option
                                        key={group.id}
                                        value={group.id}>
                                        {group.name}
                                    </option>
                                ))}
                            </select>
                            <p className="text-muted mt-2 small">Update the assigned group for a user to reflect their new group or permissions within the system</p>
                        </div>
                    </>
                }
                submitButtonText="Change Group"
                cancelButtonText="Cancel"
                onSubmit={handleSubmitChangeGroup}
                onCancel={handleCloseChangeGroupModal}
            />

            <FormModal
                show={showChangeRoleModal}
                onHide={handleCloseChangeRoleModal}
                title="Change Rank"
                desc="Please select the rank to change"
                formHtml={
                    <>
                        <div className="form-group">
                            <label htmlFor="role">Role</label>
                            <Select
                                className="basic-single"
                                classNamePrefix="select"
                                isClearable={true}
                                isSearchable={true}
                                onChange={(selectedOption: any) => {
                                    setUpdatedRole(selectedOption ? selectedOption.value.toString() : '');
                                }}
                                value={roles.find(role => role.id.toString() === updatedRole) ? {
                                    value: updatedRole,
                                    label: session?.user?.is_admin === "1"
                                        ? `${roles.find(role => role.id.toString() === updatedRole)?.name}`
                                        : roles.find(role => role.id.toString() === updatedRole)?.name
                                } : null}
                                options={roles.map((role) => ({
                                    value: role.id,
                                    label: session?.user?.is_admin === "1"
                                        ? `${role.name} ${role.company && role.company !== 'null' ? '(' + role.company + ')' : ''}`
                                        : role.name
                                }))}
                                placeholder="Select Rank"
                            />
                            <p className="text-muted mt-2 small">Update the assigned rank for a user to reflect their new role or permissions within the system</p>
                        </div>
                    </>
                }
                submitButtonText="Change Rank"
                cancelButtonText="Cancel"
                onSubmit={handleSubmitChangeRole}
                onCancel={handleCloseChangeRoleModal}
            />

            <FormModal
                show={showChangeCompanyAdminModal}
                onHide={handleCloseChangeCompanyAdminModal}
                title="Mark as Company Admin"
                desc="Please select the company admin to change"
                formHtml={
                    <>
                        <div className="form-group">
                            <label htmlFor="companyAdmin">Mark as Company Admin</label>
                            <select className="form-control" id="companyAdmin"
                                onChange={(e) =>
                                    setIsCompanyAdmin(e.target.value === "1")}
                                value={isCompanyAdmin ? "1" : "0"}>
                                <option value="1" selected={isCompanyAdmin === true}>Yes</option>
                                <option value="0" selected={isCompanyAdmin === false}>No</option>
                            </select>
                        </div>
                    </>
                }
                submitButtonText="Mark as Company Admin"
                cancelButtonText="Cancel"
                onSubmit={handleSubmitChangeCompanyAdmin}
                onCancel={handleCloseChangeCompanyAdminModal}
            />

            <FormModal
                show={showEditProfileModal}
                onHide={handleCloseEditProfileModal}
                title="Edit User Profile"
                desc="Update user profile information"
                size="lg"
                formHtml={
                    <>
                        <Row>
                            <Col md={12} className="mb-3">
                                <Form.Group>
                                    <Form.Label>Profile Picture</Form.Label>
                                    <Form.Control
                                        type="file"
                                        accept="image/*"
                                        onChange={handleProfilePictureChange}
                                    />
                                    {profilePicturePreview && (
                                        <div className="mt-2">
                                            <img 
                                                src={profilePicturePreview} 
                                                alt="Preview" 
                                                className="img-thumbnail"
                                                style={{ maxWidth: '200px', maxHeight: '200px' }}
                                            />
                                        </div>
                                    )}
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Title</Form.Label>
                                    <Form.Select
                                        value={profileFormData.title}
                                        onChange={(e) => setProfileFormData({ ...profileFormData, title: e.target.value })}
                                    >
                                        <option value="">Select Title</option>
                                        <option value="Mr">Mr</option>
                                        <option value="Mrs">Mrs</option>
                                        <option value="Ms">Ms</option>
                                        {/* <option value="Miss">Miss</option> */}
                                        <option value="Dr">Dr</option>
                                        {/* <option value="Prof">Prof</option>
                                        <option value="Sir">Sir</option>
                                        <option value="Madam">Madam</option> */}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>First Name <span className="text-danger">*</span></Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={profileFormData.first_name}
                                        onChange={(e) => setProfileFormData({ ...profileFormData, first_name: e.target.value })}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Last Name <span className="text-danger">*</span></Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={profileFormData.last_name}
                                        onChange={(e) => setProfileFormData({ ...profileFormData, last_name: e.target.value })}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Email <span className="text-danger">*</span></Form.Label>
                                    <Form.Control
                                        type="email"
                                        value={profileFormData.email}
                                        onChange={(e) => setProfileFormData({ ...profileFormData, email: e.target.value })}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Phone Number</Form.Label>
                                    <Form.Control
                                        type="tel"
                                        value={profileFormData.phone_number}
                                        onChange={(e) => setProfileFormData({ ...profileFormData, phone_number: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Gender</Form.Label>
                                    <Form.Select
                                        value={profileFormData.gender}
                                        onChange={(e) => setProfileFormData({ ...profileFormData, gender: e.target.value })}
                                    >
                                        <option value="">Select Gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Job Title</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={profileFormData.job_title}
                                        onChange={(e) => setProfileFormData({ ...profileFormData, job_title: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Department</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={profileFormData.department}
                                        onChange={(e) => setProfileFormData({ ...profileFormData, department: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Country</Form.Label>
                                    <Form.Select
                                        value={selectedCountryCode}
                                        onChange={handleCountryChange}
                                    >
                                        <option value="">Select Country</option>
                                        {countries.map((country: any) => (
                                            <option key={country.isoCode} value={country.isoCode}>
                                                {country.name}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>State</Form.Label>
                                    <Form.Select
                                        value={selectedStateCode}
                                        onChange={handleStateChange}
                                        disabled={!selectedCountryCode || states.length === 0}
                                    >
                                        <option value="">Select State</option>
                                        {states.map((state: any) => (
                                            <option key={state.isoCode} value={state.isoCode}>
                                                {state.name}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>City</Form.Label>
                                    <Form.Select
                                        value={profileFormData.city}
                                        onChange={handleCityChange}
                                        disabled={!selectedStateCode || cities.length === 0}
                                    >
                                        <option value="">Select City</option>
                                        {cities.map((city: any) => (
                                            <option key={city.name} value={city.name}>
                                                {city.name}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Postal Code</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={profileFormData.postal_code}
                                        onChange={(e) => setProfileFormData({ ...profileFormData, postal_code: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Timezone</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={profileFormData.timezone}
                                        onChange={(e) => setProfileFormData({ ...profileFormData, timezone: e.target.value })}
                                        placeholder="America/Los_Angeles"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={12}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Address</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={2}
                                        value={profileFormData.address}
                                        onChange={(e) => setProfileFormData({ ...profileFormData, address: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Service Type</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={profileFormData.service_type}
                                        onChange={(e) => setProfileFormData({ ...profileFormData, service_type: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Language</Form.Label>
                                    <Form.Select
                                        value={profileFormData.language}
                                        onChange={(e) => setProfileFormData({ ...profileFormData, language: e.target.value })}
                                    >
                                        <option value="">Select Language</option>
                                        {languages.map((lang) => (
                                            <option key={lang.value} value={lang.value}>
                                                {lang.label}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={12}>
                                <Form.Group className="mb-3">
                                    <Form.Check
                                        type="checkbox"
                                        label="User Consent"
                                        checked={profileFormData.user_consent}
                                        onChange={(e) => setProfileFormData({ ...profileFormData, user_consent: e.target.checked })}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                    </>
                }
                submitButtonText="Update Profile"
                cancelButtonText="Cancel"
                onSubmit={handleSubmitEditProfile}
                onCancel={handleCloseEditProfileModal}
            />
        </>
    );
};

export default OverviewTab;

