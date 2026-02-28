import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { Dropdown } from 'react-bootstrap';
import Select from 'react-select';
import { Country, State, City } from 'country-state-city';

// ─── Type Definitions ─────────────────────────────────────────────────────────
interface FieldLabelProps {
  text: string;
  required?: boolean;
}

interface SimpleDropdownProps {
  value: string;
  options: string[];
  onChange: (val: string) => void;
  placeholder?: string;
  testId?: string;
}

/** API payload for create/update company (no enrichment_data, no tenant_id) */
export interface CompanyFormPayload {
  name: string;
  phone?: string;
  city?: string;
  country?: string;
  industry?: string;
  domain?: string;
  email?: string;
}

interface CreateCompanySidebarProps {
  onClose: () => void;
  /** When set, form is in edit mode and pre-filled with this data */
  initialData?: CompanyFormPayload | null;
  /** When set, onSave is called with this id for update */
  editingId?: number | null;
  /** Called on submit: (payload, editingId) => promise. If editingId, update; else create */
  onSave?: (data: CompanyFormPayload, editingId?: number) => Promise<void>;
}

// ─── Company Data Mapping ─────────────────────────────────────────────────────
const companyDataMapping: Record<string, Partial<typeof initialCompanyForm>> = {
  'American Broadcasting': {
    industry: 'Broadcast Media',
    country: 'United States',
    city: 'Burbank',
    stateRegion: 'California',
    postalCode: '91501',
    numberOfEmployees: '30',
    annualRevenue: '$55,632,000,000.00',
    description: 'American Broadcasting Company (ABC) is an American commercial broadcast television network that is a flagship property of Disney Entertainment, a subsidiary of The Walt Disney Company. The network is headquartered in Burbank, California, on Riverside Drive, directly across the street from Walt Disney Studios and adjacent to the Team Disney – Roy E. Disney Animation Building.',
    linkedInCompanyPage: 'https://linkedin.com/company/american-broadcasting-company',
  },
};

// ─── Initial State ────────────────────────────────────────────────────────────
const initialCompanyForm = {
  companyDomainName: '',
  companyName: '',
  industry: '',
  type: '',
  country: '',
  city: '',
  stateRegion: '',
  postalCode: '',
  numberOfEmployees: '',
  annualRevenue: '',
  timeZone: '',
  description: '',
  linkedInCompanyPage: '',
  email: '',
  phone: '',
};

// ─── Dropdown options ─────────────────────────────────────────────────────────

const INDUSTRY_OPTIONS = [
  'Broadcast Media',
  'Technology',
  'Healthcare',
  'Finance',
  'Education',
  'Manufacturing',
  'Retail',
  'Real Estate',
  'Telecommunications',
  'Transportation',
  'Energy',
  'Entertainment',
  'Consulting',
  'Legal Services',
  'Non-profit',
  'Government',
  'Other',
];

const TYPE_OPTIONS = [
  'Prospect',
  'Partner',
  'Reseller',
  'Vendor',
  'Other',
];

const TIME_ZONE_OPTIONS = [
  'America/New_York (UTC-5)',
  'America/Chicago (UTC-6)',
  'America/Denver (UTC-7)',
  'America/Los_Angeles (UTC-8)',
  'America/Anchorage (UTC-9)',
  'Pacific/Honolulu (UTC-10)',
  'Europe/London (UTC+0)',
  'Europe/Paris (UTC+1)',
  'Europe/Berlin (UTC+1)',
  'Asia/Dubai (UTC+4)',
  'Asia/Karachi (UTC+5)',
  'Asia/Kolkata (UTC+5:30)',
  'Asia/Tokyo (UTC+9)',
  'Australia/Sydney (UTC+11)',
];

// ─── Shared styles ────────────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid #8a8a8a',
  borderRadius: '4px',
  fontSize: '16px',
  fontWeight: 300,
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box' as const,
  color: '#141414',
  backgroundColor: '#ffffff',
};

const fieldWrap = { marginBottom: '20px' };

const FieldLabel: React.FC<FieldLabelProps> = ({ text, required }) => (
  <label
    style={{
      display: 'block',
      fontSize: '14px',
      fontWeight: '600',
      color: '#141414',
      marginBottom: '8px',
    }}
  >
    {text}
    {required && <span style={{ color: '#f2545b', marginLeft: '2px' }}>*</span>}
  </label>
);

const SimpleDropdown: React.FC<SimpleDropdownProps> = ({ value, options, onChange, placeholder, testId }) => (
  <Dropdown>
    <Dropdown.Toggle
      data-test-id={testId}
      variant="outline-secondary"
      style={{
        width: '100%',
        textAlign: 'left',
        padding: '10px 12px',
        border: '1px solid #8a8a8a',
        borderRadius: '4px',
        fontSize: '16px',
        fontWeight: 300,
        backgroundColor: '#ffffff',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        color: value ? '#141414' : '#a0aec0',
      }}
    >
      {value || placeholder || 'Select...'}
    </Dropdown.Toggle>
    <Dropdown.Menu style={{ width: '100%', maxHeight: '240px', overflowY: 'auto' }}>
      {options.map((opt: string) => (
        <Dropdown.Item key={opt} onClick={() => onChange(opt)}>
          {opt}
        </Dropdown.Item>
      ))}
    </Dropdown.Menu>
  </Dropdown>
);

// ─── Country/State/City Helper Functions ─────────────────────────────────────
// Get country flag image URL
const getCountryFlagUrl = (isoCode: string): string => {
  return `https://flagcdn.com/w20/${isoCode.toLowerCase()}.png`;
};

// Get all countries for dropdown
const getCountries = () => {
  return Country.getAllCountries().map((country: { isoCode: string; name: string }) => ({
    value: country.isoCode,
    label: country.name,
    isoCode: country.isoCode,
  }));
};

// Get states/provinces for selected country
const getStates = (countryCode: string) => {
  if (!countryCode) return [];
  return State.getStatesOfCountry(countryCode).map((state: { isoCode: string; name: string }) => ({
    value: state.isoCode,
    label: state.name,
  }));
};

// Get cities for selected country and state
const getCities = (countryCode: string, stateCode: string) => {
  if (!countryCode || !stateCode) return [];
  return City.getCitiesOfState(countryCode, stateCode).map((city: { name: string }) => ({
    value: city.name,
    label: city.name,
  }));
};

// ─── Main Sidebar Component ───────────────────────────────────────────────────
export const CreateCompanySidebar: React.FC<CreateCompanySidebarProps> = ({
  onClose,
  initialData,
  editingId,
  onSave,
}) => {
  const [companyForm, setCompanyForm] = useState(initialCompanyForm);
  
  // Location state for country/state/city dropdowns
  const [selectedCountry, setSelectedCountry] = useState<{
    value: string;
    label: string;
    isoCode: string;
  } | null>(null);
  const [selectedState, setSelectedState] = useState<{
    value: string;
    label: string;
  } | null>(null);
  const [selectedCity, setSelectedCity] = useState<{
    value: string;
    label: string;
  } | null>(null);
  const locationInitialized = useRef(false);

  const set = (key: keyof typeof initialCompanyForm) => (val: string) =>
    setCompanyForm((prev) => ({ ...prev, [key]: val }));

  const setE = (key: keyof typeof initialCompanyForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setCompanyForm((prev) => ({ ...prev, [key]: e.target.value }));

  // Handle country change
  const handleCountryChange = (selectedOption: any) => {
    setSelectedCountry(selectedOption);
    setSelectedState(null);
    setSelectedCity(null);
    setCompanyForm((prev) => ({
      ...prev,
      country: selectedOption?.label || '',
      stateRegion: '',
      city: '',
    }));
  };

  // Handle state/province change
  const handleStateChange = (selectedOption: any) => {
    setSelectedState(selectedOption);
    setSelectedCity(null);
    setCompanyForm((prev) => ({
      ...prev,
      stateRegion: selectedOption?.label || '',
      city: '',
    }));
  };

  // Handle city change
  const handleCityChange = (selectedOption: any) => {
    setSelectedCity(selectedOption);
    setCompanyForm((prev) => ({
      ...prev,
      city: selectedOption?.label || '',
    }));
  };

  // Initialize location from form data when country is set
  useEffect(() => {
    if (
      companyForm.country &&
      !selectedCountry &&
      !locationInitialized.current
    ) {
      const country = Country.getAllCountries().find(
        (c: { name: string }) => c.name === companyForm.country
      );
      if (country) {
        setSelectedCountry({
          value: country.isoCode,
          label: country.name,
          isoCode: country.isoCode,
        });
        locationInitialized.current = true;

        if (companyForm.stateRegion && !selectedState) {
          const states = getStates(country.isoCode);
          const state = states.find((s) => s.label === companyForm.stateRegion);
          if (state) {
            setSelectedState(state);

            if (companyForm.city && !selectedCity) {
              const cities = getCities(country.isoCode, state.value);
              const city = cities.find((c) => c.label === companyForm.city);
              if (city) {
                setSelectedCity(city);
              }
            }
          }
        }
      }
    }
  }, [
    companyForm.country,
    companyForm.stateRegion,
    companyForm.city,
    selectedCountry,
    selectedState,
    selectedCity,
  ]);

  // Autofill form when initialData is provided (edit mode)
  useEffect(() => {
    if (!initialData) return;
    setCompanyForm((prev) => ({
      ...prev,
      companyName: initialData.name ?? '',
      companyDomainName: initialData.domain ?? '',
      industry: initialData.industry ?? '',
      country: initialData.country ?? '',
      city: initialData.city ?? '',
      email: initialData.email ?? '',
      phone: initialData.phone ?? '',
    }));
    if (initialData.country) {
      const country = Country.getAllCountries().find(
        (c: { name: string }) => c.name === initialData!.country
      );
      if (country)
        setSelectedCountry({
          value: country.isoCode,
          label: country.name,
          isoCode: country.isoCode,
        });
    }
  }, [initialData]);

  // Auto-fill form when company name matches known data (create mode only)
  useEffect(() => {
    if (editingId != null || initialData) return;
    const companyName = companyForm.companyName.trim();
    if (companyName && companyDataMapping[companyName]) {
      const autoFillData = companyDataMapping[companyName];
      setCompanyForm((prev) => ({
        ...prev,
        ...autoFillData,
        companyName: prev.companyName,
      }));
    }
  }, [companyForm.companyName, editingId, initialData]);

  const isFormValid = companyForm.companyName.trim() !== '';

  const focusStyle = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => (e.currentTarget.style.borderColor = '#0091ae');
  const blurStyle = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => (e.currentTarget.style.borderColor = '#8a8a8a');

  const buildPayload = (): CompanyFormPayload => ({
    name: companyForm.companyName.trim(),
    domain: companyForm.companyDomainName.trim() || undefined,
    industry: companyForm.industry.trim() || undefined,
    country: companyForm.country.trim() || undefined,
    city: companyForm.city.trim() || undefined,
    email: companyForm.email.trim() || undefined,
    phone: companyForm.phone.trim() || undefined,
  });

  const handleSubmit = async () => {
    if (!isFormValid || !onSave) return;
    try {
      await onSave(buildPayload(), editingId ?? undefined);
      onClose();
    } catch {
      // toasts handled in API
    }
  };

  const handleCreateAnother = async () => {
    if (!isFormValid || !onSave) return;
    try {
      await onSave(buildPayload(), undefined);
      setCompanyForm(initialCompanyForm);
    } catch {
      // toasts handled in API
    }
  };

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          zIndex: 1000,
          background: 'transparent',
        }}
      />

      {/* Sidebar */}
      <div
        style={{
          position: 'fixed',
          top: 0, right: 0,
          width: '600px',
          height: '100vh',
          backgroundColor: '#ffffff',
          boxShadow: '-2px 0 8px rgba(0,0,0,0.1)',
          zIndex: 999999,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* ── Header ── */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #eaf0f6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#141414', margin: 0 }}>
            {editingId != null ? 'Edit Company' : 'Create Company'}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent', border: 'none', padding: '4px',
              cursor: 'pointer', color: '#718096', display: 'flex', alignItems: 'center',
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* ── Scrollable Content ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 40px 40px' }}>

          {/* Edit this form link */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              style={{
                fontSize: '13px', color: '#0091ae', textDecoration: 'underline',
                display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '500',
              }}
            >
              Edit this form ↗
            </a>
          </div>

          {/* Company domain name */}
          <div style={fieldWrap}>
            <FieldLabel text="Company domain name" />
            <input
              type="text"
              data-test-id="companydomainname-input"
              value={companyForm.companyDomainName}
              onChange={setE('companyDomainName')}
              placeholder="e.g. abc.com"
              style={{ ...inputStyle, textTransform: 'lowercase' }}
              onFocus={focusStyle}
              onBlur={blurStyle}
            />
          </div>

          {/* Company name */}
          <div style={fieldWrap}>
            <FieldLabel text="Company name" required />
            <input
              type="text"
              data-test-id="companyname-input"
              value={companyForm.companyName}
              onChange={setE('companyName')}
              style={inputStyle}
              onFocus={focusStyle}
              onBlur={blurStyle}
            />
          </div>

          {/* Email */}
          <div style={fieldWrap}>
            <FieldLabel text="Email" />
            <input
              type="email"
              data-test-id="company-email-input"
              value={companyForm.email}
              onChange={setE('email')}
              placeholder="company@example.com"
              style={inputStyle}
              onFocus={focusStyle}
              onBlur={blurStyle}
            />
          </div>

          {/* Phone */}
          <div style={fieldWrap}>
            <FieldLabel text="Phone" />
            <input
              type="tel"
              data-test-id="company-phone-input"
              value={companyForm.phone}
              onChange={setE('phone')}
              placeholder="+1 234 567 8900"
              style={inputStyle}
              onFocus={focusStyle}
              onBlur={blurStyle}
            />
          </div>

          {/* Industry */}
          <div style={fieldWrap}>
            <FieldLabel text="Industry" />
            <SimpleDropdown
              value={companyForm.industry}
              options={INDUSTRY_OPTIONS}
              onChange={set('industry')}
              placeholder="Select..."
              testId="industry-input"
            />
          </div>

          {/* Type */}
          <div style={fieldWrap}>
            <FieldLabel text="Type" />
            <SimpleDropdown
              value={companyForm.type}
              options={TYPE_OPTIONS}
              onChange={set('type')}
              placeholder="Select..."
              testId="type-input"
            />
          </div>

          {/* Country */}
          <div style={fieldWrap}>
            <FieldLabel text="Country" />
            <Select
              value={selectedCountry}
              onChange={handleCountryChange}
              options={getCountries()}
              placeholder="Select country..."
              isClearable
              styles={{
                control: (base) => ({
                  ...base,
                  borderColor: '#8a8a8a',
                  fontSize: '16px',
                  fontWeight: 300,
                  minHeight: '44px',
                }),
                option: (base) => ({
                  ...base,
                  display: 'flex',
                  alignItems: 'center',
                }),
              }}
              formatOptionLabel={(option: any) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <img
                    src={getCountryFlagUrl(option.isoCode)}
                    alt={option.label}
                    style={{ width: '20px', height: '15px' }}
                  />
                  <span>{option.label}</span>
                </div>
              )}
            />
          </div>

          {/* State/Region */}
          <div style={fieldWrap}>
            <FieldLabel text="State/Region" />
            <Select
              value={selectedState}
              onChange={handleStateChange}
              options={getStates(selectedCountry?.value || '')}
              placeholder="Select state/region..."
              isClearable
              isDisabled={!selectedCountry}
              styles={{
                control: (base) => ({
                  ...base,
                  borderColor: '#8a8a8a',
                  fontSize: '16px',
                  fontWeight: 300,
                  minHeight: '44px',
                }),
              }}
            />
          </div>

          {/* City */}
          <div style={fieldWrap}>
            <FieldLabel text="City" />
            <Select
              value={selectedCity}
              onChange={handleCityChange}
              options={getCities(selectedCountry?.value || '', selectedState?.value || '')}
              placeholder="Select city..."
              isClearable
              isDisabled={!selectedState}
              styles={{
                control: (base) => ({
                  ...base,
                  borderColor: '#8a8a8a',
                  fontSize: '16px',
                  fontWeight: 300,
                  minHeight: '44px',
                }),
              }}
            />
          </div>

          {/* Postal code */}
          <div style={fieldWrap}>
            <FieldLabel text="Postal code" />
            <input
              type="text"
              data-test-id="postalcode-input"
              value={companyForm.postalCode}
              onChange={setE('postalCode')}
              style={inputStyle}
              onFocus={focusStyle}
              onBlur={blurStyle}
            />
          </div>

          {/* Number of employees */}
          <div style={fieldWrap}>
            <FieldLabel text="Number of employees" />
            <input
              type="number"
              data-test-id="numberofemployees-input"
              value={companyForm.numberOfEmployees}
              onChange={setE('numberOfEmployees')}
              style={inputStyle}
              onFocus={focusStyle}
              onBlur={blurStyle}
            />
          </div>

          {/* Annual revenue */}
          <div style={fieldWrap}>
            <FieldLabel text="Annual revenue" />
            <input
              type="text"
              data-test-id="annualrevenue-input"
              value={companyForm.annualRevenue}
              onChange={setE('annualRevenue')}
              placeholder="$0.00"
              style={inputStyle}
              onFocus={focusStyle}
              onBlur={blurStyle}
            />
          </div>

          {/* Time zone */}
          <div style={fieldWrap}>
            <FieldLabel text="Time zone" />
            <SimpleDropdown
              value={companyForm.timeZone}
              options={TIME_ZONE_OPTIONS}
              onChange={set('timeZone')}
              placeholder=""
              testId="timezone-input"
            />
          </div>

          {/* Description */}
          <div style={fieldWrap}>
            <FieldLabel text="Description" />
            <textarea
              data-test-id="description-input"
              value={companyForm.description}
              onChange={setE('description')}
              rows={5}
              style={{
                ...inputStyle,
                resize: 'vertical',
                lineHeight: '1.5',
              }}
              onFocus={focusStyle}
              onBlur={blurStyle}
            />
          </div>

          {/* LinkedIn company page */}
          <div style={fieldWrap}>
            <FieldLabel text="LinkedIn company page" />
            <input
              type="url"
              data-test-id="linkedincompanypage-input"
              value={companyForm.linkedInCompanyPage}
              onChange={setE('linkedInCompanyPage')}
              placeholder="https://linkedin.com/company/..."
              style={inputStyle}
              onFocus={focusStyle}
              onBlur={blurStyle}
            />
          </div>

        </div>

        {/* ── Footer ── */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #eaf0f6',
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-start',
          }}
        >
          <button
            type="submit"
            onClick={handleSubmit}
            style={{
              padding: '10px 20px',
              backgroundColor: '#141414',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#2d2d2d'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#141414'; }}
          >
            {editingId != null ? 'Save' : 'Create'}
          </button>

          {editingId == null && (
            <button
              type="button"
              onClick={handleCreateAnother}
              style={{
                padding: '10px 20px',
                backgroundColor: 'transparent',
                color: '#141414',
                border: '1px solid #8a8a8a',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f7fafc'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              Create and add another
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '10px 20px',
              backgroundColor: 'transparent',
              color: '#141414',
              border: '1px solid #8a8a8a',
              borderRadius: '4px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f7fafc'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}

// ─── renderCreateCompany helper (same pattern as renderCreateContact) ──────────
export interface RenderCreateCompanyOptions {
  initialData?: CompanyFormPayload | null;
  editingId?: number | null;
  onSave?: (data: CompanyFormPayload, editingId?: number) => Promise<void>;
}

const renderCreateCompany = (
  showCreateCompanySidebar: boolean,
  setShowCreateCompanySidebar: React.Dispatch<React.SetStateAction<boolean>>,
  options?: RenderCreateCompanyOptions
) => {
  if (!showCreateCompanySidebar) return null;
  return (
    <CreateCompanySidebar
      onClose={() => setShowCreateCompanySidebar(false)}
      initialData={options?.initialData}
      editingId={options?.editingId}
      onSave={options?.onSave}
    />
  );
};

export default renderCreateCompany;

/**
 * Usage:
 *
 * import renderCreateCompany, { CreateCompanySidebar } from './renderCreateCompany';
 *
 * // Option 1 — helper function (matches renderCreateContact pattern):
 * const [showCreateCompanySidebar, setShowCreateCompanySidebar] = useState(false);
 * {renderCreateCompany(showCreateCompanySidebar, setShowCreateCompanySidebar)}
 *
 * // Option 2 — component directly:
 * {showCreateCompanySidebar && (
 *   <CreateCompanySidebar onClose={() => setShowCreateCompanySidebar(false)} />
 * )}
 */
