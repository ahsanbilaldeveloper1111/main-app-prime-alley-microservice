import React, { useState, useEffect, useMemo } from "react";
import { Card, Col, Row, Button, Form } from "react-bootstrap";
import FormModal from "@components/page-partials/FormModal";
import { Country, State, City } from "country-state-city";
import { languages as languagesData } from "@config/languages";
import { updateUserProfile } from "@utils/users";
import parsePhoneNumber from "libphonenumber-js";
import { toast } from "react-toastify";
import Select from "react-select";
import PhoneContainer from "@components/PhoneContainer";

// Custom styles to match Bootstrap form control height and styling
const selectStyles = {
  control: (provided: any, state: any) => ({
    ...provided,
    minHeight: "48px",
    height: "48px",
    fontSize: "0.875rem",
    borderColor: state.isFocused ? "#86b7fe" : "#dee2e6",
    boxShadow: state.isFocused
      ? "0 0 0 0.2rem rgba(13, 110, 253, 0.25)"
      : "none",
    borderRadius: "0.375rem",
    "&:hover": {
      borderColor: state.isFocused ? "#86b7fe" : "#DBE0E5",
    },
  }),
  valueContainer: (provided: any) => ({
    ...provided,
    height: "48px",
    padding: "0 8px",
  }),
  input: (provided: any) => ({
    ...provided,
    margin: "0px",
    padding: "0px",
  }),
  indicatorSeparator: () => ({
    display: "none",
  }),
  indicatorsContainer: (provided: any) => ({
    ...provided,
    height: "48px",
  }),
  placeholder: (provided: any) => ({
    ...provided,
    color: "#6c757d",
    fontSize: "0.875rem",
  }),
  singleValue: (provided: any) => ({
    ...provided,
    fontSize: "0.875rem",
    lineHeight: "1.5",
  }),
  multiValue: (provided: any) => ({
    ...provided,
    backgroundColor: "#e7f1ff",
    borderRadius: "0.25rem",
  }),
  multiValueLabel: (provided: any) => ({
    ...provided,
    color: "#0d6efd",
    fontSize: "0.875rem",
    padding: "2px 6px",
  }),
  multiValueRemove: (provided: any) => ({
    ...provided,
    color: "#0d6efd",
    "&:hover": {
      backgroundColor: "#b6d4fe",
      color: "#0d6efd",
    },
  }),
};

/** Max length aligned with common email upper bounds; avoids unbounded work. */
const PROFILE_EMAIL_MAX_LENGTH = 254;

const PROFILE_TITLE_VALUES = ["Mr", "Mrs", "Ms", "Dr"] as const;
const PROFILE_GENDER_VALUES = ["Male", "Female", "Other"] as const;

/**
 * Linear-time email shape check (no regex → no ReDoS from catastrophic backtracking).
 */
function isValidProfileEmailShape(raw: string): boolean {
  const t = raw.trim();
  if (t.length === 0 || t.length > PROFILE_EMAIL_MAX_LENGTH) {
    return false;
  }
  const at = t.indexOf("@");
  if (at <= 0) {
    return false;
  }
  if (t.includes("@", at + 1)) {
    return false;
  }
  const local = t.slice(0, at);
  const domain = t.slice(at + 1);
  if (local.length === 0 || domain.length === 0) {
    return false;
  }
  const lastDot = domain.lastIndexOf(".");
  if (lastDot <= 0 || lastDot >= domain.length - 1) {
    return false;
  }
  for (const ch of t) {
    const code = ch.codePointAt(0);
    if (code === undefined) return false;
    if (code === 32 || code === 9 || code === 10 || code === 13) {
      return false;
    }
  }
  return true;
}

/** Allowed letters, spaces, hyphen, apostrophe — linear scan using code points. */
function isProfilePersonNameChars(s: string): boolean {
  for (const ch of s) {
    const c = ch.codePointAt(0);
    if (c === undefined) return false;
    if (c >= 65 && c <= 90) continue;
    if (c >= 97 && c <= 122) continue;
    if (c === 32 || c === 39 || c === 45) continue;
    return false;
  }
  return true;
}

function parseLanguageFromBackend(language: unknown): string[] {
  if (!language) return [];
  if (Array.isArray(language)) {
    return language.filter((lang) => lang?.trim());
  }
  if (typeof language === "string") {
    return language
      .split(",")
      .map((lang) => lang.trim())
      .filter((lang) => lang.length > 0);
  }
  return [];
}

function formatLanguageForBackend(language: unknown): string {
  if (!language) return "";
  if (Array.isArray(language)) {
    return language.filter((lang) => lang?.trim()).join(",");
  }
  if (typeof language === "string") {
    return language;
  }
  return "";
}

function formatLanguageForDisplay(language: unknown): string {
  if (!language) return "N/A";
  const parsedLanguages = parseLanguageFromBackend(language);
  if (parsedLanguages.length === 0) return "N/A";

  const formattedLanguages = parsedLanguages.map((langValue) => {
    const langOption = languagesData.find(
      (lang) => lang.value.toLowerCase() === langValue.toLowerCase(),
    );
    return langOption
      ? langOption.label
      : langValue.charAt(0).toUpperCase() + langValue.slice(1).toLowerCase();
  });

  return formattedLanguages.join(", ");
}

function validateProfileTitle(value: any): string {
  if (value && !PROFILE_TITLE_VALUES.includes(value)) {
    return "Please select a valid title";
  }
  return "";
}

function validateProfileFirstName(value: any): string {
  if (!value || value.trim().length === 0) {
    return "First name is required";
  }
  if (value.trim().length < 2) {
    return "First name must be at least 2 characters";
  }
  if (!isProfilePersonNameChars(value.trim())) {
    return "First name can only contain letters, spaces, hyphens, and apostrophes";
  }
  return "";
}

function validateProfileLastName(value: any): string {
  if (!value || value.trim().length === 0) {
    return "Last name is required";
  }
  if (value.trim().length < 2) {
    return "Last name must be at least 2 characters";
  }
  if (!isProfilePersonNameChars(value.trim())) {
    return "Last name can only contain letters, spaces, hyphens, and apostrophes";
  }
  return "";
}

function validateProfileEmail(value: any): string {
  if (!value || value.trim().length === 0) {
    return "Email is required";
  }
  if (!isValidProfileEmailShape(value.trim())) {
    return "Please enter a valid email address";
  }
  return "";
}

function validateProfilePhoneNumber(value: any): string {
  if (value && value.trim().length > 0) {
    try {
      const parsed = parsePhoneNumber(value.trim());
      if (!parsed?.isValid()) {
        return "Please enter a valid phone number in E.164 format (e.g., +1234567890)";
      }
    } catch {
      return "Please enter a valid phone number in E.164 format (e.g., +1234567890)";
    }
  }
  return "";
}

function validateProfileGender(value: any): string {
  if (value && !PROFILE_GENDER_VALUES.includes(value)) {
    return "Please select a valid gender";
  }
  return "";
}

function validateProfileCountry(value: any): string {
  if (!value || value.trim().length === 0) {
    return "Country is required";
  }
  return "";
}

function validateProfileState(value: any): string {
  if (!value || value.trim().length === 0) {
    return "State is required";
  }
  return "";
}

function validateProfileCity(value: any): string {
  if (!value || value.trim().length === 0) {
    return "City is required";
  }
  return "";
}

const PROFILE_TAB_FIELD_VALIDATORS: Record<
  string,
  (value: unknown) => string
> = {
  title: validateProfileTitle,
  first_name: validateProfileFirstName,
  last_name: validateProfileLastName,
  email: validateProfileEmail,
  phone_number: validateProfilePhoneNumber,
  gender: validateProfileGender,
  country: validateProfileCountry,
  state: validateProfileState,
  city: validateProfileCity,
};

function validateProfileTabField(field: string, value: unknown): string {
  const validator = PROFILE_TAB_FIELD_VALIDATORS[field];
  if (validator) {
    return validator(value);
  }
  return "";
}

function buildInitialProfileFormPayload(
  profile: Record<string, any>,
  parsedLanguages: string[],
): Record<string, any> {
  return {
    title: profile.title || "",
    first_name: profile.first_name || "",
    last_name: profile.last_name || "",
    email: profile.email || "",
    phone_number: profile.phone_number || "",
    gender: profile.gender || "",
    job_title: profile.job_title || "",
    department: profile.department || "",
    country: profile.country || "",
    state: profile.state || "",
    city: profile.city || "",
    postal_code: profile.postal_code || "",
    address: profile.address || "",
    timezone: profile.timezone || "",
    service_type: profile.service_type || "",
    user_consent: profile.user_consent || false,
    language: parsedLanguages,
  };
}

function resolveProfileCountryStateCodes(
  profile: Record<string, any>,
  countries: any[],
): { countryIso: string; stateIso: string } {
  const fallback = { countryIso: "", stateIso: "" };
  const countryName = profile.country;
  if (!countryName || countries.length === 0) return fallback;

  const countryMatch = countries.find((c: any) => c.name === countryName);
  if (!countryMatch) return fallback;

  let stateIso = "";
  const stateName = profile.state;
  if (stateName) {
    try {
      const stateRows = State.getStatesOfCountry(countryMatch.isoCode);
      const stateMatch = stateRows.find((s: any) => s.name === stateName);
      if (stateMatch) {
        stateIso = stateMatch.isoCode;
      }
    } catch {
      /* keep empty */
    }
  }

  return { countryIso: countryMatch.isoCode, stateIso };
}

/** Keeps React effect callbacks shallow for Sonar cognitive complexity. */
function applyLoadedUserProfileSnapshot(
  profileSnapshot: any,
  countriesList: any[],
  setters: Readonly<{
    setProfileData: React.Dispatch<React.SetStateAction<any>>;
    setProfileFormData: React.Dispatch<React.SetStateAction<any>>;
    setProfilePicturePreview: React.Dispatch<
      React.SetStateAction<string | null>
    >;
    setSelectedCountryCode: React.Dispatch<React.SetStateAction<string>>;
    setSelectedStateCode: React.Dispatch<React.SetStateAction<string>>;
  }>,
): void {
  setters.setProfileData(profileSnapshot);

  const parsedLanguages = parseLanguageFromBackend(profileSnapshot.language);
  setters.setProfileFormData(
    buildInitialProfileFormPayload(profileSnapshot, parsedLanguages),
  );

  if (profileSnapshot.profile_picture_url) {
    setters.setProfilePicturePreview(profileSnapshot.profile_picture_url);
  }

  const { countryIso, stateIso } = resolveProfileCountryStateCodes(
    profileSnapshot,
    countriesList,
  );
  setters.setSelectedCountryCode(countryIso);
  setters.setSelectedStateCode(stateIso);
}

function hydrateUserProfileTabFromCurrentUserEffect(
  profileSnapshot: any,
  countriesList: any[],
  setters: Readonly<{
    setIsLoadingProfile: React.Dispatch<React.SetStateAction<boolean>>;
    setProfileData: React.Dispatch<React.SetStateAction<any>>;
    setProfileFormData: React.Dispatch<React.SetStateAction<any>>;
    setProfilePicturePreview: React.Dispatch<
      React.SetStateAction<string | null>
    >;
    setSelectedCountryCode: React.Dispatch<React.SetStateAction<string>>;
    setSelectedStateCode: React.Dispatch<React.SetStateAction<string>>;
  }>,
): void {
  if (!profileSnapshot || countriesList.length === 0) {
    return;
  }

  try {
    setters.setIsLoadingProfile(true);
    applyLoadedUserProfileSnapshot(profileSnapshot, countriesList, setters);
  } catch (error) {
    console.error("Error loading profile data:", error);
  } finally {
    setters.setIsLoadingProfile(false);
  }
}

function ProfileLoadingBanner() {
  return (
    <div className="text-center py-4">
      <p className="text-muted">Loading profile data...</p>
    </div>
  );
}

function ProfileUnavailableBanner() {
  return (
    <div className="text-center py-4">
      <p className="text-muted">No profile data available</p>
    </div>
  );
}

function UserProfileDisplayGrid({
  profileData,
}: Readonly<{ profileData: any }>) {
  return (
    <Row>
      <Col md={12}>
        <Row className="g-1">
          <Col md={6}>
            <div className="profile-field-item">
              <div className="profile-field-label">Title</div>
              <div className="profile-field-value">{profileData.title || "N/A"}</div>
            </div>

            <div className="profile-field-item">
              <div className="profile-field-label">First Name</div>
              <div className="profile-field-value">
                {profileData.first_name || "N/A"}
              </div>
            </div>

            <div className="profile-field-item">
              <div className="profile-field-label">Last Name</div>
              <div className="profile-field-value">{profileData.last_name || "N/A"}</div>
            </div>

            <div className="profile-field-item">
              <div className="profile-field-label">Email</div>
              <div className="profile-field-value">{profileData.email || "N/A"}</div>
            </div>

            <div className="profile-field-item">
              <div className="profile-field-label">Phone Number</div>
              <div className="profile-field-value">
                {profileData.phone_number ? (
                  <PhoneContainer phone={profileData.phone_number} showBadge={false} />
                ) : (
                  "N/A"
                )}
              </div>
            </div>

            <div className="profile-field-item">
              <div className="profile-field-label">Gender</div>
              <div className="profile-field-value">{profileData.gender || "N/A"}</div>
            </div>

            <div className="profile-field-item">
              <div className="profile-field-label">Job Title</div>
              <div className="profile-field-value">{profileData.job_title || "N/A"}</div>
            </div>

            <div className="profile-field-item">
              <div className="profile-field-label">Languages</div>
              <div className="profile-field-value">
                {formatLanguageForDisplay(profileData.language)}
              </div>
            </div>
          </Col>
          <Col md={6}>
            <div className="profile-field-item">
              <div className="profile-field-label">Department</div>
              <div className="profile-field-value">
                {profileData.department || "N/A"}
              </div>
            </div>

            <div className="profile-field-item">
              <div className="profile-field-label">Country</div>
              <div className="profile-field-value">{profileData.country || "N/A"}</div>
            </div>

            <div className="profile-field-item">
              <div className="profile-field-label">State</div>
              <div className="profile-field-value">{profileData.state || "N/A"}</div>
            </div>

            <div className="profile-field-item">
              <div className="profile-field-label">City</div>
              <div className="profile-field-value">{profileData.city || "N/A"}</div>
            </div>

            <div className="profile-field-item">
              <div className="profile-field-label">Postal Code</div>
              <div className="profile-field-value">{profileData.postal_code || "N/A"}</div>
            </div>

            <div className="profile-field-item">
              <div className="profile-field-label">Address</div>
              <div className="profile-field-value">{profileData.address || "N/A"}</div>
            </div>

            <div className="profile-field-item">
              <div className="profile-field-label">Timezone</div>
              <div className="profile-field-value">{profileData.timezone || "N/A"}</div>
            </div>

            <div className="profile-field-item">
              <div className="profile-field-label">Service Type</div>
              <div className="profile-field-value">
                {profileData.service_type || "N/A"}
              </div>
            </div>

            <div className="profile-field-item">
              <div className="profile-field-label">User Consent</div>
              <div className="profile-field-value">
                {profileData.user_consent ? "Yes" : "No"}
              </div>
            </div>
          </Col>
        </Row>
      </Col>
    </Row>
  );
}

function renderUserProfileCardBody(
  isLoadingProfile: boolean,
  profileData: any,
): React.ReactNode {
  if (isLoadingProfile) {
    return <ProfileLoadingBanner />;
  }
  if (profileData) {
    return <UserProfileDisplayGrid profileData={profileData} />;
  }
  return <ProfileUnavailableBanner />;
}

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
  onSuccess,
}) => {
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [profileData, setProfileData] = useState<any>(initialProfileData);
  const [profileFormData, setProfileFormData] = useState<any>({
    title: "",
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    gender: "",
    job_title: "",
    department: "",
    country: "",
    state: "",
    city: "",
    postal_code: "",
    address: "",
    timezone: "",
    service_type: "",
    user_consent: false,
    language: "",
  });
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<
    string | null
  >(initialProfilePicturePreview);
  const [isLoadingProfile, setIsLoadingProfile] = useState(
    initialIsLoadingProfile,
  );
  const [countries, setCountries] = useState<any[]>([]);
  const [states, setStates] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>("");
  const [selectedStateCode, setSelectedStateCode] = useState<string>("");
  const [languages] = useState(languagesData);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});



  const titleOptions = useMemo(
    () => [
      { value: "Mr", label: "Mr" },
      { value: "Mrs", label: "Mrs" },
      { value: "Ms", label: "Ms" },
      { value: "Dr", label: "Dr" },
    ],
    [],
  );

  const genderOptions = useMemo(
    () => [
      { value: "Male", label: "Male" },
      { value: "Female", label: "Female" },
      { value: "Other", label: "Other" },
    ],
    [],
  );

  const countryOptions = useMemo(
    () =>
      countries.map((country: any) => ({
        value: country.isoCode,
        label: country.name,
      })),
    [countries],
  );

  const stateOptions = useMemo(
    () =>
      states.map((state: any) => ({
        value: state.isoCode,
        label: state.name,
      })),
    [states],
  );

  const cityOptions = useMemo(
    () =>
      cities.map((city: any) => ({
        value: city.name,
        label: city.name,
      })),
    [cities],
  );

  const languageOptions = useMemo(
    () =>
      languages.map((lang) => ({
        value: lang.value,
        label: lang.label,
      })),
    [languages],
  );

  // Common timezones list
  const timezones = [
    { value: "America/New_York", label: "America/New_York (EST/EDT)" },
    { value: "America/Chicago", label: "America/Chicago (CST/CDT)" },
    { value: "America/Denver", label: "America/Denver (MST/MDT)" },
    { value: "America/Los_Angeles", label: "America/Los_Angeles (PST/PDT)" },
    { value: "America/Phoenix", label: "America/Phoenix (MST)" },
    { value: "America/Anchorage", label: "America/Anchorage (AKST/AKDT)" },
    { value: "America/Honolulu", label: "America/Honolulu (HST)" },
    { value: "America/Toronto", label: "America/Toronto (EST/EDT)" },
    { value: "America/Vancouver", label: "America/Vancouver (PST/PDT)" },
    { value: "Europe/London", label: "Europe/London (GMT/BST)" },
    { value: "Europe/Paris", label: "Europe/Paris (CET/CEST)" },
    { value: "Europe/Berlin", label: "Europe/Berlin (CET/CEST)" },
    { value: "Europe/Rome", label: "Europe/Rome (CET/CEST)" },
    { value: "Europe/Madrid", label: "Europe/Madrid (CET/CEST)" },
    { value: "Europe/Amsterdam", label: "Europe/Amsterdam (CET/CEST)" },
    { value: "Europe/Athens", label: "Europe/Athens (EET/EEST)" },
    { value: "Europe/Moscow", label: "Europe/Moscow (MSK)" },
    { value: "Asia/Dubai", label: "Asia/Dubai (GST)" },
    { value: "Asia/Karachi", label: "Asia/Karachi (PKT)" },
    { value: "Asia/Kolkata", label: "Asia/Kolkata (IST)" },
    { value: "Asia/Dhaka", label: "Asia/Dhaka (BST)" },
    { value: "Asia/Bangkok", label: "Asia/Bangkok (ICT)" },
    { value: "Asia/Singapore", label: "Asia/Singapore (SGT)" },
    { value: "Asia/Hong_Kong", label: "Asia/Hong_Kong (HKT)" },
    { value: "Asia/Tokyo", label: "Asia/Tokyo (JST)" },
    { value: "Asia/Seoul", label: "Asia/Seoul (KST)" },
    { value: "Asia/Shanghai", label: "Asia/Shanghai (CST)" },
    { value: "Australia/Sydney", label: "Australia/Sydney (AEDT/AEST)" },
    { value: "Australia/Melbourne", label: "Australia/Melbourne (AEDT/AEST)" },
    { value: "Pacific/Auckland", label: "Pacific/Auckland (NZDT/NZST)" },
    { value: "Africa/Cairo", label: "Africa/Cairo (EET)" },
    { value: "Africa/Johannesburg", label: "Africa/Johannesburg (SAST)" },
    { value: "America/Mexico_City", label: "America/Mexico_City (CST/CDT)" },
    { value: "America/Sao_Paulo", label: "America/Sao_Paulo (BRT/BRST)" },
    { value: "America/Buenos_Aires", label: "America/Buenos_Aires (ART)" },
    { value: "UTC", label: "UTC (Coordinated Universal Time)" },
  ];

  const timezoneOptions = useMemo(
    () =>
      timezones.map((tz) => ({
        value: tz.value,
        label: tz.label,
      })),
    [],
  );

  // Load countries on component mount
  useEffect(() => {
    const loadCountries = () => {
      try {
        const countriesData = Country.getAllCountries();
        setCountries(countriesData);
      } catch (error) {
        console.error("Error loading countries:", error);
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
            setSelectedStateCode("");
            setCities([]);
            setProfileFormData({ ...profileFormData, state: "", city: "" });
          }
        } catch (error) {
          console.error("Error loading states:", error);
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
          const citiesData = City.getCitiesOfState(
            selectedCountryCode,
            selectedStateCode,
          );
          setCities(citiesData);
          if (profileFormData.state) {
            setProfileFormData({ ...profileFormData, city: "" });
          }
        } catch (error) {
          console.error("Error loading cities:", error);
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
    hydrateUserProfileTabFromCurrentUserEffect(currentUser?.profile, countries, {
      setIsLoadingProfile,
      setProfileData,
      setProfileFormData,
      setProfilePicturePreview,
      setSelectedCountryCode,
      setSelectedStateCode,
    });
  }, [currentUser?.profile, countries]);

  const handleCloseEditProfileModal = () => {
    setShowEditProfileModal(false);
    setProfilePicture(null);
    setProfilePicturePreview(profileData?.profile_picture_url || null);
    setValidationErrors({});
  };

  const handleProfilePictureChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePicture(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result;
        if (typeof result === "string") {
          setProfilePicturePreview(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCountryChange = (selectedOption: any) => {
    const countryCode = selectedOption ? selectedOption.value : "";
    const countryName = selectedOption ? selectedOption.label : "";

    setSelectedCountryCode(countryCode);
    setProfileFormData({
      ...profileFormData,
      country: countryName,
      state: "",
      city: "",
    });
    setSelectedStateCode("");
    setCities([]);

    if (validationErrors.country) {
      setValidationErrors({ ...validationErrors, country: "" });
    }

    if (countryCode) {
      try {
        const statesData = State.getStatesOfCountry(countryCode);
        setStates(statesData);
      } catch (error) {
        console.error("Error loading states:", error);
        setStates([]);
      }
    } else {
      setStates([]);
    }
  };

  const handleStateChange = (selectedOption: any) => {
    const stateCode = selectedOption ? selectedOption.value : "";
    const stateName = selectedOption ? selectedOption.label : "";

    setSelectedStateCode(stateCode);
    setProfileFormData({ ...profileFormData, state: stateName, city: "" });
    setCities([]);

    if (validationErrors.state) {
      setValidationErrors({ ...validationErrors, state: "" });
    }

    if (selectedCountryCode && stateCode) {
      try {
        const citiesData = City.getCitiesOfState(
          selectedCountryCode,
          stateCode,
        );
        setCities(citiesData);
      } catch (error) {
        console.error("Error loading cities:", error);
        setCities([]);
      }
    } else {
      setCities([]);
    }
  };

  const handleCityChange = (selectedOption: any) => {
    const cityName = selectedOption ? selectedOption.label : "";
    setProfileFormData({ ...profileFormData, city: cityName });
    // Clear validation error when user selects
    if (validationErrors.city) {
      setValidationErrors({ ...validationErrors, city: "" });
    }
  };

  // Phone number formatting to E.164
  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow user to type freely, we'll format on blur
    setProfileFormData({ ...profileFormData, phone_number: value });
    // Clear validation error when user types
    if (validationErrors.phone_number) {
      setValidationErrors({ ...validationErrors, phone_number: "" });
    }
  };

  const handlePhoneNumberBlur = () => {
    const phoneNumber = profileFormData.phone_number?.trim();
    if (phoneNumber) {
      try {
        const parsed = parsePhoneNumber(phoneNumber);
        if (parsed?.isValid()) {
          // Format to E.164
          const e164Format = parsed.format("E.164");
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
    const selectedValues = selectedOptions
      ? selectedOptions.map((opt: any) => opt.value)
      : [];
    setProfileFormData({ ...profileFormData, language: selectedValues });
    // Clear validation error when user selects
    if (validationErrors.language) {
      setValidationErrors({ ...validationErrors, language: "" });
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Validate all required fields
    const fieldsToValidate = [
      "title",
      "first_name",
      "last_name",
      "email",
      "phone_number",
      "gender",
      "country",
      "state",
      "city",
    ];

    fieldsToValidate.forEach((field) => {
      const error = validateProfileTabField(field, profileFormData[field]);
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
      toast.error("Please fix the validation errors before submitting");
      return;
    }

    try {
      // Format phone number to E.164 if provided
      let formattedData = { ...profileFormData };
      if (formattedData?.phone_number?.trim()) {
        try {
          const parsed = parsePhoneNumber(formattedData.phone_number);
          if (parsed?.isValid()) {
            formattedData.phone_number = parsed.format("E.164");
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
        profilePicture || undefined,
      );
      if (response) {
        setShowEditProfileModal(false);
        onSuccess(
          "Profile Updated",
          "The profile has been updated successfully",
        );
        setProfilePicture(null);
        // onUserUpdate will refresh currentUser which will trigger the useEffect to update profileData
        onUserUpdate();
      }
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };
  return (
    <>
      <Row className="mt-3">
        <Col md={12}>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">User Profile</h5>

              {session?.user?.permissions?.includes("update-profile-users") && (
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
              {renderUserProfileCardBody(isLoadingProfile, profileData)}
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
                        style={{ maxWidth: "200px", maxHeight: "200px" }}
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
                    value={
                      profileFormData.title
                        ? titleOptions.find(
                            (opt) => opt.value === profileFormData.title,
                          )
                        : null
                    }
                    onChange={(selectedOption: any) => {
                      setProfileFormData({
                        ...profileFormData,
                        title: selectedOption ? selectedOption.value : "",
                      });
                      if (validationErrors.title) {
                        setValidationErrors({ ...validationErrors, title: "" });
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
                  <Form.Label>
                    First Name <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={profileFormData.first_name}
                    onChange={(e) => {
                      setProfileFormData({
                        ...profileFormData,
                        first_name: e.target.value,
                      });
                      if (validationErrors.first_name) {
                        setValidationErrors({
                          ...validationErrors,
                          first_name: "",
                        });
                      }
                    }}
                    onBlur={() => {
                      const error = validateProfileTabField(
                        "first_name",
                        profileFormData.first_name,
                      );
                      if (error) {
                        setValidationErrors({
                          ...validationErrors,
                          first_name: error,
                        });
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
                  <Form.Label>
                    Last Name <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={profileFormData.last_name}
                    onChange={(e) => {
                      setProfileFormData({
                        ...profileFormData,
                        last_name: e.target.value,
                      });
                      if (validationErrors.last_name) {
                        setValidationErrors({
                          ...validationErrors,
                          last_name: "",
                        });
                      }
                    }}
                    onBlur={() => {
                      const error = validateProfileTabField(
                        "last_name",
                        profileFormData.last_name,
                      );
                      if (error) {
                        setValidationErrors({
                          ...validationErrors,
                          last_name: error,
                        });
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
                  <Form.Label>
                    Email <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="email"
                    value={profileFormData.email}
                    onChange={(e) => {
                      setProfileFormData({
                        ...profileFormData,
                        email: e.target.value,
                      });
                      if (validationErrors.email) {
                        setValidationErrors({ ...validationErrors, email: "" });
                      }
                    }}
                    onBlur={() => {
                      const error = validateProfileTabField(
                        "email",
                        profileFormData.email,
                      );
                      if (error) {
                        setValidationErrors({
                          ...validationErrors,
                          email: error,
                        });
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
                    Enter phone number in international format (e.g.,
                    +1234567890)
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
                    value={
                      profileFormData.gender
                        ? genderOptions.find(
                            (opt) => opt.value === profileFormData.gender,
                          )
                        : null
                    }
                    onChange={(selectedOption: any) => {
                      setProfileFormData({
                        ...profileFormData,
                        gender: selectedOption ? selectedOption.value : "",
                      });
                      if (validationErrors.gender) {
                        setValidationErrors({
                          ...validationErrors,
                          gender: "",
                        });
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
                    onChange={(e) =>
                      setProfileFormData({
                        ...profileFormData,
                        job_title: e.target.value,
                      })
                    }
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Department</Form.Label>
                  <Form.Control
                    type="text"
                    value={profileFormData.department}
                    onChange={(e) =>
                      setProfileFormData({
                        ...profileFormData,
                        department: e.target.value,
                      })
                    }
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Country <span className="text-danger">*</span>
                  </Form.Label>
                  <Select
                    className="basic-single"
                    classNamePrefix="select"
                    isClearable={true}
                    isSearchable={true}
                    value={
                      selectedCountryCode
                        ? countryOptions.find(
                            (opt) => opt.value === selectedCountryCode,
                          )
                        : null
                    }
                    onChange={(selectedOption: any) => {
                      handleCountryChange(selectedOption);
                    }}
                    onBlur={() => {
                      const error = validateProfileTabField(
                        "country",
                        profileFormData.country,
                      );
                      if (error) {
                        setValidationErrors({
                          ...validationErrors,
                          country: error,
                        });
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
                  <Form.Label>
                    State <span className="text-danger">*</span>
                  </Form.Label>
                  <Select
                    className="basic-single"
                    classNamePrefix="select"
                    isClearable={true}
                    isSearchable={true}
                    value={
                      selectedStateCode
                        ? stateOptions.find(
                            (opt) => opt.value === selectedStateCode,
                          )
                        : null
                    }
                    onChange={(selectedOption: any) => {
                      handleStateChange(selectedOption);
                    }}
                    onBlur={() => {
                      const error = validateProfileTabField(
                        "state",
                        profileFormData.state,
                      );
                      if (error) {
                        setValidationErrors({
                          ...validationErrors,
                          state: error,
                        });
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
                  <Form.Label>
                    City <span className="text-danger">*</span>
                  </Form.Label>
                  <Select
                    className="basic-single"
                    classNamePrefix="select"
                    isClearable={true}
                    isSearchable={true}
                    value={
                      profileFormData.city
                        ? cityOptions.find(
                            (opt) => opt.value === profileFormData.city,
                          )
                        : null
                    }
                    onChange={(selectedOption: any) => {
                      handleCityChange(selectedOption);
                    }}
                    onBlur={() => {
                      const error = validateProfileTabField("city", profileFormData.city);
                      if (error) {
                        setValidationErrors({
                          ...validationErrors,
                          city: error,
                        });
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
                    onChange={(e) =>
                      setProfileFormData({
                        ...profileFormData,
                        postal_code: e.target.value,
                      })
                    }
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
                    value={
                      profileFormData.timezone
                        ? timezoneOptions.find(
                            (opt) => opt.value === profileFormData.timezone,
                          )
                        : null
                    }
                    onChange={(selectedOption: any) => {
                      setProfileFormData({
                        ...profileFormData,
                        timezone: selectedOption ? selectedOption.value : "",
                      });
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
                    onChange={(e) =>
                      setProfileFormData({
                        ...profileFormData,
                        address: e.target.value,
                      })
                    }
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
                    onChange={(e) =>
                      setProfileFormData({
                        ...profileFormData,
                        service_type: e.target.value,
                      })
                    }
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
                    value={
                      Array.isArray(profileFormData.language)
                        ? languageOptions.filter((opt) =>
                            profileFormData.language.includes(opt.value),
                          )
                        : []
                    }
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
                    onChange={(e) =>
                      setProfileFormData({
                        ...profileFormData,
                        user_consent: e.target.checked,
                      })
                    }
                  />
                  <Form.Text className="text-muted d-block mt-2">
                    By enabling this option, you consent to call recording and
                    monitoring as part of our call center solution. All calls
                    may be recorded for quality assurance, training purposes,
                    and compliance with regulatory requirements.
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
