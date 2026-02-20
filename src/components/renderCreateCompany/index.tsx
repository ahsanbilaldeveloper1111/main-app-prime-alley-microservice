import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Dropdown } from 'react-bootstrap';

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

interface CreateCompanySidebarProps {
  onClose: () => void;
}

// ─── Company Data Mapping ─────────────────────────────────────────────────────
const companyDataMapping: Record<string, Partial<typeof initialCompanyForm>> = {
  'American Broadcasting': {
    companyOwner: 'Rizwan Haider',
    industry: 'Broadcast Media',
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
  companyOwner: 'Rizwan Haider',
  industry: '',
  type: '',
  city: '',
  stateRegion: '',
  postalCode: '',
  numberOfEmployees: '',
  annualRevenue: '',
  timeZone: '',
  description: '',
  linkedInCompanyPage: '',
};

// ─── Dropdown options ─────────────────────────────────────────────────────────
const COMPANY_OWNER_OPTIONS = ['Rizwan Haider', 'John Doe', 'Jane Smith'];

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

// ─── Main Sidebar Component ───────────────────────────────────────────────────
export const CreateCompanySidebar: React.FC<CreateCompanySidebarProps> = ({ onClose }) => {
  const [companyForm, setCompanyForm] = useState(initialCompanyForm);

  const set = (key: keyof typeof initialCompanyForm) => (val: string) =>
    setCompanyForm((prev) => ({ ...prev, [key]: val }));

  const setE = (key: keyof typeof initialCompanyForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setCompanyForm((prev) => ({ ...prev, [key]: e.target.value }));

  // Auto-fill form when company name matches known data
  useEffect(() => {
    const companyName = companyForm.companyName.trim();
    if (companyName && companyDataMapping[companyName]) {
      const autoFillData = companyDataMapping[companyName];
      setCompanyForm((prev) => ({
        ...prev,
        ...autoFillData,
        companyName: prev.companyName, // Preserve the company name
      }));
    }
  }, [companyForm.companyName]);

  const isFormValid = companyForm.companyDomainName.trim() !== '' || companyForm.companyName.trim() !== '';

  const focusStyle = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => (e.currentTarget.style.borderColor = '#0091ae');
  const blurStyle = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => (e.currentTarget.style.borderColor = '#8a8a8a');

  const handleCreate = () => {
    if (!isFormValid) return;
    console.log('Creating company:', companyForm);
    onClose();
  };

  const handleCreateAnother = () => {
    if (!isFormValid) return;
    console.log('Creating company and adding another:', companyForm);
    setCompanyForm(initialCompanyForm);
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
          zIndex: 1001,
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
            Create Company
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
              style={inputStyle}
              onFocus={focusStyle}
              onBlur={blurStyle}
            />
          </div>

          {/* Company name */}
          <div style={fieldWrap}>
            <FieldLabel text="Company name" />
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

          {/* Company owner */}
          <div style={fieldWrap}>
            <FieldLabel text="Company owner" />
            <SimpleDropdown
              value={companyForm.companyOwner}
              options={COMPANY_OWNER_OPTIONS}
              onChange={set('companyOwner')}
              testId="companyowner-input"
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

          {/* City */}
          <div style={fieldWrap}>
            <FieldLabel text="City" />
            <input
              type="text"
              data-test-id="city-input"
              value={companyForm.city}
              onChange={setE('city')}
              style={inputStyle}
              onFocus={focusStyle}
              onBlur={blurStyle}
            />
          </div>

          {/* State/Region */}
          <div style={fieldWrap}>
            <FieldLabel text="State/Region" />
            <input
              type="text"
              data-test-id="state-input"
              value={companyForm.stateRegion}
              onChange={setE('stateRegion')}
              style={inputStyle}
              onFocus={focusStyle}
              onBlur={blurStyle}
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
            onClick={handleCreate}
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
            Create
          </button>

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
const renderCreateCompany = (showCreateCompanySidebar: boolean, setShowCreateCompanySidebar: React.Dispatch<React.SetStateAction<boolean>>) => {
  if (!showCreateCompanySidebar) return null;
  return <CreateCompanySidebar onClose={() => setShowCreateCompanySidebar(false)} />;
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
