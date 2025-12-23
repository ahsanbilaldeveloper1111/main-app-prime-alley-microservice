import React, { useState, useEffect, useMemo } from 'react';
import { Card, Col, Row, Button, Form } from 'react-bootstrap';
import FormModal from '@pages/partial/FormModal';
import { Country, State, City } from 'country-state-city';
import { languages as languagesData } from '@config/languages';
import { updateUserProfile } from '@utils/users';
import parsePhoneNumber from 'libphonenumber-js';
import { toast } from 'react-toastify';
import Select from 'react-select';
import PhoneContainer from '@components/PhoneContainer';
import { getStorageImageUrl } from '@utils/imageUtils';

// Custom styles to match Bootstrap form control height and styling
const selectStyles = {
    control: (provided: any, state: any) => ({
        ...provided,
        minHeight: '48px',
        height: '48px',
        fontSize: '0.875rem',
        borderColor: state.isFocused ? '#86b7fe' : '#dee2e6',
        boxShadow: state.isFocused ? '0 0 0 0.2rem rgba(13, 110, 253, 0.25)' : 'none',
        borderRadius: '0.375rem',
        '&:hover': {
            borderColor: state.isFocused ? '#86b7fe' : '#DBE0E5'
        }
    }),
    valueContainer: (provided: any) => ({
        ...provided,
        height: '48px',
        padding: '0 8px'
    }),
    input: (provided: any) => ({
        ...provided,
        margin: '0px',
        padding: '0px'
    }),
    indicatorSeparator: () => ({
        display: 'none'
    }),
    indicatorsContainer: (provided: any) => ({
        ...provided,
        height: '48px'
    }),
    placeholder: (provided: any) => ({
        ...provided,
        color: '#6c757d',
        fontSize: '0.875rem'
    }),
    singleValue: (provided: any) => ({
        ...provided,
        fontSize: '0.875rem',
        lineHeight: '1.5'
    }),
    multiValue: (provided: any) => ({
        ...provided,
        backgroundColor: '#e7f1ff',
        borderRadius: '0.25rem'
    }),
    multiValueLabel: (provided: any) => ({
        ...provided,
        color: '#0d6efd',
        fontSize: '0.875rem',
        padding: '2px 6px'
    }),
    multiValueRemove: (provided: any) => ({
        ...provided,
        color: '#0d6efd',
        '&:hover': {
            backgroundColor: '#b6d4fe',
            color: '#0d6efd'
        }
    })
};

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
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    
    // Helper function to parse language from backend (can be string or array)
    const parseLanguageFromBackend = (language: any): string[] => {
        if (!language) return [];
        if (Array.isArray(language)) {
            return language.filter(lang => lang && lang.trim());
        }
        if (typeof language === 'string') {
            // Handle comma-separated string like "french,portuguese"
            return language.split(',')
                .map(lang => lang.trim())
                .filter(lang => lang.length > 0);
        }
        return [];
    };
    
    // Helper function to format language for backend (convert array to comma-separated string)
    const formatLanguageForBackend = (language: any): string => {
        if (!language) return '';
        if (Array.isArray(language)) {
            return language.filter(lang => lang && lang.trim()).join(',');
        }
        if (typeof language === 'string') {
            return language;
        }
        return '';
    };
    
    // Helper function to format language for display (convert comma-separated string to readable format)
    const formatLanguageForDisplay = (language: any): string => {
        if (!language) return 'N/A';
        const parsedLanguages = parseLanguageFromBackend(language);
        if (parsedLanguages.length === 0) return 'N/A';
        
        // Map language values to their labels from the languages config
        const formattedLanguages = parsedLanguages.map(langValue => {
            const langOption = languages.find(lang => lang.value.toLowerCase() === langValue.toLowerCase());
            return langOption ? langOption.label : langValue.charAt(0).toUpperCase() + langValue.slice(1).toLowerCase();
        });
        
        return formattedLanguages.join(', ');
    };
    
    // Memoized options for react-select
    const titleOptions = useMemo(() => [
        { value: 'Mr', label: 'Mr' },
        { value: 'Mrs', label: 'Mrs' },
        { value: 'Ms', label: 'Ms' },
        { value: 'Dr', label: 'Dr' }
    ], []);
    
    const genderOptions = useMemo(() => [
        { value: 'Male', label: 'Male' },
        { value: 'Female', label: 'Female' },
        { value: 'Other', label: 'Other' }
    ], []);
    
    const countryOptions = useMemo(() => 
        countries.map((country: any) => ({
            value: country.isoCode,
            label: country.name
        })), [countries]);
    
    const stateOptions = useMemo(() => 
        states.map((state: any) => ({
            value: state.isoCode,
            label: state.name
        })), [states]);
    
    const cityOptions = useMemo(() => 
        cities.map((city: any) => ({
            value: city.name,
            label: city.name
        })), [cities]);
    
    const languageOptions = useMemo(() => 
        languages.map((lang) => ({
            value: lang.value,
            label: lang.label
        })), [languages]);
    
    // Common timezones list
    const timezones = [
        { value: 'America/New_York', label: 'America/New_York (EST/EDT)' },
        { value: 'America/Chicago', label: 'America/Chicago (CST/CDT)' },
        { value: 'America/Denver', label: 'America/Denver (MST/MDT)' },
        { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PST/PDT)' },
        { value: 'America/Phoenix', label: 'America/Phoenix (MST)' },
        { value: 'America/Anchorage', label: 'America/Anchorage (AKST/AKDT)' },
        { value: 'America/Honolulu', label: 'America/Honolulu (HST)' },
        { value: 'America/Toronto', label: 'America/Toronto (EST/EDT)' },
        { value: 'America/Vancouver', label: 'America/Vancouver (PST/PDT)' },
        { value: 'Europe/London', label: 'Europe/London (GMT/BST)' },
        { value: 'Europe/Paris', label: 'Europe/Paris (CET/CEST)' },
        { value: 'Europe/Berlin', label: 'Europe/Berlin (CET/CEST)' },
        { value: 'Europe/Rome', label: 'Europe/Rome (CET/CEST)' },
        { value: 'Europe/Madrid', label: 'Europe/Madrid (CET/CEST)' },
        { value: 'Europe/Amsterdam', label: 'Europe/Amsterdam (CET/CEST)' },
        { value: 'Europe/Athens', label: 'Europe/Athens (EET/EEST)' },
        { value: 'Europe/Moscow', label: 'Europe/Moscow (MSK)' },
        { value: 'Asia/Dubai', label: 'Asia/Dubai (GST)' },
        { value: 'Asia/Karachi', label: 'Asia/Karachi (PKT)' },
        { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST)' },
        { value: 'Asia/Dhaka', label: 'Asia/Dhaka (BST)' },
        { value: 'Asia/Bangkok', label: 'Asia/Bangkok (ICT)' },
        { value: 'Asia/Singapore', label: 'Asia/Singapore (SGT)' },
        { value: 'Asia/Hong_Kong', label: 'Asia/Hong_Kong (HKT)' },
        { value: 'Asia/Tokyo', label: 'Asia/Tokyo (JST)' },
        { value: 'Asia/Seoul', label: 'Asia/Seoul (KST)' },
        { value: 'Asia/Shanghai', label: 'Asia/Shanghai (CST)' },
        { value: 'Australia/Sydney', label: 'Australia/Sydney (AEDT/AEST)' },
        { value: 'Australia/Melbourne', label: 'Australia/Melbourne (AEDT/AEST)' },
        { value: 'Pacific/Auckland', label: 'Pacific/Auckland (NZDT/NZST)' },
        { value: 'Africa/Cairo', label: 'Africa/Cairo (EET)' },
        { value: 'Africa/Johannesburg', label: 'Africa/Johannesburg (SAST)' },
        { value: 'America/Mexico_City', label: 'America/Mexico_City (CST/CDT)' },
        { value: 'America/Sao_Paulo', label: 'America/Sao_Paulo (BRT/BRST)' },
        { value: 'America/Buenos_Aires', label: 'America/Buenos_Aires (ART)' },
        { value: 'UTC', label: 'UTC (Coordinated Universal Time)' }
    ];
    
    const timezoneOptions = useMemo(() => 
        timezones.map((tz) => ({
            value: tz.value,
            label: tz.label
        })), []);

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

    // Load profile data from currentUser.profile when component mounts or currentUser changes
    React.useEffect(() => {
        const loadProfileData = () => {
            if (!currentUser?.profile || countries.length === 0) return;
            
            try {
                setIsLoadingProfile(true);
                const data = currentUser.profile;
                
                if (data) {
                    setProfileData(data);
                    
                    // Parse language from backend (could be comma-separated string or array)
                    const parsedLanguages = parseLanguageFromBackend(data.language);
                    
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
                        language: parsedLanguages
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
                console.error('Error loading profile data:', error);
            } finally {
                setIsLoadingProfile(false);
            }
        };
        
        if (countries.length > 0) {
            loadProfileData();
        }
    }, [currentUser?.profile, countries]);

    const handleCloseEditProfileModal = () => {
        setShowEditProfileModal(false);
        setProfilePicture(null);
        setProfilePicturePreview(profileData?.profile_picture_url || null);
        setValidationErrors({});
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

    const handleCountryChange = (selectedOption: any) => {
        const countryCode = selectedOption ? selectedOption.value : '';
        const countryName = selectedOption ? selectedOption.label : '';
        
        setSelectedCountryCode(countryCode);
        setProfileFormData({ ...profileFormData, country: countryName, state: '', city: '' });
        setSelectedStateCode('');
        setCities([]);
        
        if (validationErrors.country) {
            setValidationErrors({ ...validationErrors, country: '' });
        }
        
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

    const handleStateChange = (selectedOption: any) => {
        const stateCode = selectedOption ? selectedOption.value : '';
        const stateName = selectedOption ? selectedOption.label : '';
        
        setSelectedStateCode(stateCode);
        setProfileFormData({ ...profileFormData, state: stateName, city: '' });
        setCities([]);
        
        if (validationErrors.state) {
            setValidationErrors({ ...validationErrors, state: '' });
        }
        
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

    const handleCityChange = (selectedOption: any) => {
        const cityName = selectedOption ? selectedOption.label : '';
        setProfileFormData({ ...profileFormData, city: cityName });
        // Clear validation error when user selects
        if (validationErrors.city) {
            setValidationErrors({ ...validationErrors, city: '' });
        }
    };

    // Phone number formatting to E.164
    const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        // Allow user to type freely, we'll format on blur
        setProfileFormData({ ...profileFormData, phone_number: value });
        // Clear validation error when user types
        if (validationErrors.phone_number) {
            setValidationErrors({ ...validationErrors, phone_number: '' });
        }
    };

    const handlePhoneNumberBlur = () => {
        const phoneNumber = profileFormData.phone_number?.trim();
        if (phoneNumber) {
            try {
                const parsed = parsePhoneNumber(phoneNumber);
                if (parsed && parsed.isValid()) {
                    // Format to E.164
                    const e164Format = parsed.format('E.164');
                    setProfileFormData({ ...profileFormData, phone_number: e164Format });
                }
            } catch {
                // If parsing fails, keep the original value
                // Validation will catch it on submit
            }
        }
    };

    // Language multiple selection handler
    const handleLanguageChange = (selectedOptions: any) => {
        const selectedValues = selectedOptions ? selectedOptions.map((opt: any) => opt.value) : [];
        setProfileFormData({ ...profileFormData, language: selectedValues });
        // Clear validation error when user selects
        if (validationErrors.language) {
            setValidationErrors({ ...validationErrors, language: '' });
        }
    };

    // Validation functions
    const validateField = (name: string, value: any): string => {
        switch (name) {
            case 'title':
                // Title is optional, but if provided should be valid
                if (value && !['Mr', 'Mrs', 'Ms', 'Dr'].includes(value)) {
                    return 'Please select a valid title';
                }
                return '';
            
            case 'first_name':
                if (!value || value.trim().length === 0) {
                    return 'First name is required';
                }
                if (value.trim().length < 2) {
                    return 'First name must be at least 2 characters';
                }
                if (!/^[a-zA-Z\s'-]+$/.test(value.trim())) {
                    return 'First name can only contain letters, spaces, hyphens, and apostrophes';
                }
                return '';
            
            case 'last_name':
                if (!value || value.trim().length === 0) {
                    return 'Last name is required';
                }
                if (value.trim().length < 2) {
                    return 'Last name must be at least 2 characters';
                }
                if (!/^[a-zA-Z\s'-]+$/.test(value.trim())) {
                    return 'Last name can only contain letters, spaces, hyphens, and apostrophes';
                }
                return '';
            
            case 'email': {
                if (!value || value.trim().length === 0) {
                    return 'Email is required';
                }
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value.trim())) {
                    return 'Please enter a valid email address';
                }
                return '';
            }
            
            case 'phone_number': {
                if (value && value.trim().length > 0) {
                    try {
                        const parsed = parsePhoneNumber(value.trim());
                        if (!parsed || !parsed.isValid()) {
                            return 'Please enter a valid phone number in E.164 format (e.g., +1234567890)';
                        }
                    } catch {
                        return 'Please enter a valid phone number in E.164 format (e.g., +1234567890)';
                    }
                }
                return '';
            }
            
            case 'gender':
                if (value && !['Male', 'Female', 'Other'].includes(value)) {
                    return 'Please select a valid gender';
                }
                return '';
            
            case 'country':
                if (!value || value.trim().length === 0) {
                    return 'Country is required';
                }
                return '';
            
            case 'state':
                if (!value || value.trim().length === 0) {
                    return 'State is required';
                }
                return '';
            
            case 'city':
                if (!value || value.trim().length === 0) {
                    return 'City is required';
                }
                return '';
            
            default:
                return '';
        }
    };

    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};
        
        // Validate all required fields
        const fieldsToValidate = ['title', 'first_name', 'last_name', 'email', 'phone_number', 'gender', 'country', 'state', 'city'];
        
        fieldsToValidate.forEach(field => {
            const error = validateField(field, profileFormData[field]);
            if (error) {
                errors[field] = error;
            }
        });
        
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmitEditProfile = async () => {
        if (!currentUser?.id) return;
        
        // Validate form before submission
        if (!validateForm()) {
            toast.error('Please fix the validation errors before submitting');
            return;
        }
        
        try {
            // Format phone number to E.164 if provided
            let formattedData = { ...profileFormData };
            if (formattedData.phone_number && formattedData.phone_number.trim()) {
                try {
                    const parsed = parsePhoneNumber(formattedData.phone_number);
                    if (parsed && parsed.isValid()) {
                        formattedData.phone_number = parsed.format('E.164');
                    }
                } catch {
                    // If parsing fails, keep original value
                }
            }
            
            // Format language for backend (convert array to comma-separated string)
            formattedData.language = formatLanguageForBackend(formattedData.language);
            
            const response = await updateUserProfile(
                currentUser.id.toString(),
                formattedData,
                profilePicture || undefined
            );
            if (response) {
                setShowEditProfileModal(false);
                onSuccess('Profile Updated', 'The profile has been updated successfully');
                setProfilePicture(null);
                // onUserUpdate will refresh currentUser which will trigger the useEffect to update profileData
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
                                onClick={() => {
                                    setShowEditProfileModal(true);
                                    setValidationErrors({});
                                }}
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
                                    {profileData?.profile_picture ? (() => {
                                        const imageUrl = getStorageImageUrl(profileData.profile_picture);
                                        
                                        return (
                                            <img 
                                                src={imageUrl || undefined} 
                                                alt="Profile" 
                                                className="img-fluid rounded-circle"
                                                style={{ width: '150px', height: '150px', objectFit: 'cover' }}
                                                onError={(e) => {
                                                    console.error('Image failed to load:', {
                                                        originalUrl: profileData.profile_picture_url,
                                                        transformedUrl: imageUrl,
                                                        imgSrc: e.currentTarget.src,
                                                        error: e
                                                    });
                                                }}
                                                onLoad={() => {
                                                    console.log('Image loaded successfully:', imageUrl);
                                                }}
                                            />
                                        );
                                    })() : (
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
                                            <p className="mb-3">
                                                {profileData.phone_number ? (
                                                    <PhoneContainer phone={profileData.phone_number} showBadge={false} />
                                                ) : (
                                                    'N/A'
                                                )}
                                            </p>
                                            
                                            <p className="mb-1 small text-primary"><b>Gender</b></p>
                                            <p className="mb-3">{profileData.gender || 'N/A'}</p>
                                            
                                            <p className="mb-1 small text-primary"><b>Job Title</b></p>
                                            <p className="mb-3">{profileData.job_title || 'N/A'}</p>

                                            <p className="mb-1 small text-primary"><b>Languages</b></p>
                                            <p className="mb-3">{formatLanguageForDisplay(profileData.language)}</p>
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
                                <Select
                                    className="basic-single"
                                    classNamePrefix="select"
                                    isClearable={true}
                                    isSearchable={false}
                                    value={profileFormData.title ? titleOptions.find(opt => opt.value === profileFormData.title) : null}
                                    onChange={(selectedOption: any) => {
                                        setProfileFormData({ ...profileFormData, title: selectedOption ? selectedOption.value : '' });
                                        if (validationErrors.title) {
                                            setValidationErrors({ ...validationErrors, title: '' });
                                        }
                                    }}
                                    options={titleOptions}
                                    placeholder="Select Title"
                                    styles={selectStyles}
                                />
                                {validationErrors.title && (
                                    <div className="text-danger small mt-1">
                                        {validationErrors.title}
                                    </div>
                                )}
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>First Name <span className="text-danger">*</span></Form.Label>
                                <Form.Control
                                    type="text"
                                    value={profileFormData.first_name}
                                    onChange={(e) => {
                                        setProfileFormData({ ...profileFormData, first_name: e.target.value });
                                        if (validationErrors.first_name) {
                                            setValidationErrors({ ...validationErrors, first_name: '' });
                                        }
                                    }}
                                    onBlur={() => {
                                        const error = validateField('first_name', profileFormData.first_name);
                                        if (error) {
                                            setValidationErrors({ ...validationErrors, first_name: error });
                                        }
                                    }}
                                    required
                                    isInvalid={!!validationErrors.first_name}
                                />
                                {validationErrors.first_name && (
                                    <Form.Control.Feedback type="invalid">
                                        {validationErrors.first_name}
                                    </Form.Control.Feedback>
                                )}
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
                                    onChange={(e) => {
                                        setProfileFormData({ ...profileFormData, last_name: e.target.value });
                                        if (validationErrors.last_name) {
                                            setValidationErrors({ ...validationErrors, last_name: '' });
                                        }
                                    }}
                                    onBlur={() => {
                                        const error = validateField('last_name', profileFormData.last_name);
                                        if (error) {
                                            setValidationErrors({ ...validationErrors, last_name: error });
                                        }
                                    }}
                                    required
                                    isInvalid={!!validationErrors.last_name}
                                />
                                {validationErrors.last_name && (
                                    <Form.Control.Feedback type="invalid">
                                        {validationErrors.last_name}
                                    </Form.Control.Feedback>
                                )}
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Email <span className="text-danger">*</span></Form.Label>
                                <Form.Control
                                    type="email"
                                    value={profileFormData.email}
                                    onChange={(e) => {
                                        setProfileFormData({ ...profileFormData, email: e.target.value });
                                        if (validationErrors.email) {
                                            setValidationErrors({ ...validationErrors, email: '' });
                                        }
                                    }}
                                    onBlur={() => {
                                        const error = validateField('email', profileFormData.email);
                                        if (error) {
                                            setValidationErrors({ ...validationErrors, email: error });
                                        }
                                    }}
                                    required
                                    isInvalid={!!validationErrors.email}
                                />
                                {validationErrors.email && (
                                    <Form.Control.Feedback type="invalid">
                                        {validationErrors.email}
                                    </Form.Control.Feedback>
                                )}
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
                                    onChange={handlePhoneNumberChange}
                                    onBlur={handlePhoneNumberBlur}
                                    placeholder="+1234567890"
                                    isInvalid={!!validationErrors.phone_number}
                                />
                                <Form.Text className="text-muted">
                                    Enter phone number in international format (e.g., +1234567890)
                                </Form.Text>
                                {validationErrors.phone_number && (
                                    <Form.Control.Feedback type="invalid">
                                        {validationErrors.phone_number}
                                    </Form.Control.Feedback>
                                )}
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Gender</Form.Label>
                                <Select
                                    className="basic-single"
                                    classNamePrefix="select"
                                    isClearable={true}
                                    isSearchable={false}
                                    value={profileFormData.gender ? genderOptions.find(opt => opt.value === profileFormData.gender) : null}
                                    onChange={(selectedOption: any) => {
                                        setProfileFormData({ ...profileFormData, gender: selectedOption ? selectedOption.value : '' });
                                        if (validationErrors.gender) {
                                            setValidationErrors({ ...validationErrors, gender: '' });
                                        }
                                    }}
                                    options={genderOptions}
                                    placeholder="Select Gender"
                                    styles={selectStyles}
                                />
                                {validationErrors.gender && (
                                    <div className="text-danger small mt-1">
                                        {validationErrors.gender}
                                    </div>
                                )}
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
                                <Form.Label>Country <span className="text-danger">*</span></Form.Label>
                                <Select
                                    className="basic-single"
                                    classNamePrefix="select"
                                    isClearable={true}
                                    isSearchable={true}
                                    value={selectedCountryCode ? countryOptions.find(opt => opt.value === selectedCountryCode) : null}
                                    onChange={(selectedOption: any) => {
                                        handleCountryChange(selectedOption);
                                    }}
                                    onBlur={() => {
                                        const error = validateField('country', profileFormData.country);
                                        if (error) {
                                            setValidationErrors({ ...validationErrors, country: error });
                                        }
                                    }}
                                    options={countryOptions}
                                    placeholder="Select Country"
                                    styles={selectStyles}
                                />
                                {validationErrors.country && (
                                    <div className="text-danger small mt-1">
                                        {validationErrors.country}
                                    </div>
                                )}
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group className="mb-3">
                                <Form.Label>State <span className="text-danger">*</span></Form.Label>
                                <Select
                                    className="basic-single"
                                    classNamePrefix="select"
                                    isClearable={true}
                                    isSearchable={true}
                                    value={selectedStateCode ? stateOptions.find(opt => opt.value === selectedStateCode) : null}
                                    onChange={(selectedOption: any) => {
                                        handleStateChange(selectedOption);
                                    }}
                                    onBlur={() => {
                                        const error = validateField('state', profileFormData.state);
                                        if (error) {
                                            setValidationErrors({ ...validationErrors, state: error });
                                        }
                                    }}
                                    isDisabled={!selectedCountryCode || states.length === 0}
                                    options={stateOptions}
                                    placeholder="Select State"
                                    styles={selectStyles}
                                />
                                {validationErrors.state && (
                                    <div className="text-danger small mt-1">
                                        {validationErrors.state}
                                    </div>
                                )}
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group className="mb-3">
                                <Form.Label>City <span className="text-danger">*</span></Form.Label>
                                <Select
                                    className="basic-single"
                                    classNamePrefix="select"
                                    isClearable={true}
                                    isSearchable={true}
                                    value={profileFormData.city ? cityOptions.find(opt => opt.value === profileFormData.city) : null}
                                    onChange={(selectedOption: any) => {
                                        handleCityChange(selectedOption);
                                    }}
                                    onBlur={() => {
                                        const error = validateField('city', profileFormData.city);
                                        if (error) {
                                            setValidationErrors({ ...validationErrors, city: error });
                                        }
                                    }}
                                    isDisabled={!selectedStateCode || cities.length === 0}
                                    options={cityOptions}
                                    placeholder="Select City"
                                    styles={selectStyles}
                                />
                                {validationErrors.city && (
                                    <div className="text-danger small mt-1">
                                        {validationErrors.city}
                                    </div>
                                )}
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
                                <Select
                                    className="basic-single"
                                    classNamePrefix="select"
                                    isClearable={true}
                                    isSearchable={true}
                                    value={profileFormData.timezone ? timezoneOptions.find(opt => opt.value === profileFormData.timezone) : null}
                                    onChange={(selectedOption: any) => {
                                        setProfileFormData({ ...profileFormData, timezone: selectedOption ? selectedOption.value : '' });
                                    }}
                                    options={timezoneOptions}
                                    placeholder="Select Timezone"
                                    styles={selectStyles}
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
                                <Form.Label>Languages</Form.Label>
                                <Select
                                    className="basic-multi-select"
                                    classNamePrefix="select"
                                    isMulti={true}
                                    isClearable={true}
                                    isSearchable={true}
                                    value={Array.isArray(profileFormData.language) 
                                        ? languageOptions.filter(opt => profileFormData.language.includes(opt.value))
                                        : []}
                                    onChange={handleLanguageChange}
                                    options={languageOptions}
                                    placeholder="Select Languages"
                                    styles={selectStyles}
                                />
                                <Form.Text className="text-muted">
                                    Select multiple languages
                                </Form.Text>
                                {validationErrors.language && (
                                    <div className="text-danger small mt-1">
                                        {validationErrors.language}
                                    </div>
                                )}
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
                                <Form.Text className="text-muted d-block mt-2">
                                    By enabling this option, you consent to call recording and monitoring as part of our call center solution. 
                                    All calls may be recorded for quality assurance, training purposes, and compliance with regulatory requirements.
                                </Form.Text>
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

