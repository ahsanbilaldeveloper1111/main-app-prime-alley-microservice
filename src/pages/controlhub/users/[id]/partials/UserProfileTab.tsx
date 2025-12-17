import React, { useState, useEffect } from 'react';
import { Card, Col, Row, Button, Form } from 'react-bootstrap';
import FormModal from '@pages/partial/FormModal';
import { Country, State, City } from 'country-state-city';
import { languages as languagesData } from '@config/languages';
import { getUserProfileData, updateUserProfile } from '@utils/users';

interface UserProfileTabProps {
    profileData: any;
    profilePicturePreview: string | null;
    isLoadingProfile: boolean;
    session: any;
    currentUser: any;
    onUserUpdate: () => void;
    onSuccess: (title: string, description: string) => void;
}

const UserProfileTab: React.FC<UserProfileTabProps> = ({
    profileData: initialProfileData,
    profilePicturePreview: initialProfilePicturePreview,
    isLoadingProfile: initialIsLoadingProfile,
    session,
    currentUser,
    onUserUpdate,
    onSuccess
}) => {
    const [showEditProfileModal, setShowEditProfileModal] = useState(false);
    const [profileData, setProfileData] = useState<any>(initialProfileData);
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
    const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(initialProfilePicturePreview);
    const [isLoadingProfile, setIsLoadingProfile] = useState(initialIsLoadingProfile);
    const [countries, setCountries] = useState<any[]>([]);
    const [states, setStates] = useState<any[]>([]);
    const [cities, setCities] = useState<any[]>([]);
    const [selectedCountryCode, setSelectedCountryCode] = useState<string>('');
    const [selectedStateCode, setSelectedStateCode] = useState<string>('');
    const [languages] = useState(languagesData);

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

    // Fetch profile data when component mounts or currentUser changes
    React.useEffect(() => {
        const fetchProfileData = async () => {
            if (!currentUser?.id || countries.length === 0) return;
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
                    if (data.country) {
                        const country = countries.find((c: any) => c.name === data.country);
                        if (country) {
                            setSelectedCountryCode(country.isoCode);
                            // Find and set state code if state name exists
                            if (data.state) {
                                const stateData = State.getStatesOfCountry(country.isoCode);
                                const state = stateData.find((s: any) => s.name === data.state);
                                if (state) {
                                    setSelectedStateCode(state.isoCode);
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
                        user_consent: data.user_consent || false,
                        language: data.language || ''
                    });
                    if (data.profile_picture_url) {
                        setProfilePicturePreview(data.profile_picture_url);
                    }
                }
                setProfilePicture(null);
                onUserUpdate();
            }
        } catch (error) {
            console.error('Error updating profile:', error);
        }
    };
    return (
        <>
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
                                    <option value="Dr">Dr</option>
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

export default UserProfileTab;

