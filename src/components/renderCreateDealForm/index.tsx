import React, { useState } from 'react';
import { X, Plus, Trash2, Calendar, ChevronDown, ChevronRight } from 'lucide-react';
import { Dropdown, Form } from 'react-bootstrap';

// ─── Type Definitions ─────────────────────────────────────────────────────────
interface LineItem {
  id: number;
  name: string;
  quantity: number;
}

interface DealFormData {
  dealName: string;
  pipeline: string;
  dealStage: string;
  amount: string;
  currency: string;
  closeDate: string;
  dealOwner: string;
  dealType: string;
  priority: string;
  closedLostReason: string;
  closedWonReason: string;
  createDate: string;
  dealCollaborator: string;
  dealDescription: string;
  dealProbability: string;
  forecastCategory: string;
  forecastProbability: string;
  nextStep: string;
  sharedTeams: string;
  sharedUsers: string;
  contactAssociateRecord: string;
  contactAssociationLabel: string;
  addTimelineContact: boolean;
  companyAssociateRecord: string;
  companyAssociationLabel: string;
  addTimelineCompany: boolean;
  lineItems: LineItem[];
}

interface SimpleDropdownProps {
  value: string;
  options: string[];
  onChange: (value: string) => void;
  placeholder?: string;
  testId?: string;
}

interface CreateDealSidebarProps {
  onClose: () => void;
}

// ─── Initial State ────────────────────────────────────────────────────────────
const initialDealForm: DealFormData = {
  dealName: '',
  pipeline: 'Deals pipeline',
  dealStage: 'Appointment Scheduled',
  amount: '',
  currency: 'US Dollar (USD) $',
  closeDate: '2026-02-28',
  dealOwner: 'Rizwan Haider',
  dealType: '',
  priority: '',
  closedLostReason: '',
  closedWonReason: '',
  createDate: '',
  dealCollaborator: 'No owner',
  dealDescription: '',
  dealProbability: '',
  forecastCategory: '',
  forecastProbability: '',
  nextStep: '',
  sharedTeams: '',
  sharedUsers: 'No user',
  // Associations
  contactAssociateRecord: '',
  contactAssociationLabel: 'No label',
  addTimelineContact: false,
  companyAssociateRecord: '',
  companyAssociationLabel: 'Primary',
  addTimelineCompany: false,
  // Line items
  lineItems: [],
};

// ─── Dropdown options ─────────────────────────────────────────────────────────
const PIPELINE_OPTIONS = ['Deals pipeline', 'Sales Pipeline', 'Partner Pipeline'];
const DEAL_STAGE_OPTIONS = [
  'Appointment Scheduled',
  'Qualified To Buy',
  'Presentation Scheduled',
  'Decision Maker Bought-In',
  'Contract Sent',
  'Closed Won',
  'Closed Lost',
];
const CURRENCY_OPTIONS = [
  'US Dollar (USD) $',
  'Euro (EUR) €',
  'British Pound (GBP) £',
  'Pakistani Rupee (PKR) ₨',
  'Japanese Yen (JPY) ¥',
];
const DEAL_OWNER_OPTIONS = ['Rizwan Haider', 'John Doe', 'Jane Smith'];
const DEAL_TYPE_OPTIONS = ['New Business', 'Existing Business'];
const PRIORITY_OPTIONS = ['Low', 'Medium', 'High'];
const COLLABORATOR_OPTIONS = ['No owner', 'Rizwan Haider', 'John Doe', 'Jane Smith'];
const FORECAST_CATEGORY_OPTIONS = ['Pipeline', 'Best Case', 'Commit', 'Closed'];
const SHARED_TEAMS_OPTIONS = ['Team A', 'Team B', 'Team C'];
const SHARED_USERS_OPTIONS = ['No user', 'Rizwan Haider', 'John Doe', 'Jane Smith'];
const ASSOCIATION_LABEL_OPTIONS = ['No label', 'Decision Maker', 'Primary', 'Billing'];
const LINE_ITEM_OPTIONS = ['Product A', 'Product B', 'Product C', 'Custom Item'];

// ─── Sub-components ───────────────────────────────────────────────────────────

const fieldLabel = (text: string, required: boolean = false) => (
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

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid #8a8a8a',
  borderRadius: '4px',
  fontSize: '16px',
  fontWeight: '300',
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
};

const fieldWrap: React.CSSProperties = { marginBottom: '20px' };

const dropdownToggleStyle = (hasValue: boolean): React.CSSProperties => ({
  width: '100%',
  textAlign: 'left',
  padding: '10px 12px',
  border: '1px solid #8a8a8a',
  borderRadius: '4px',
  fontSize: '16px',
  fontWeight: '300',
  backgroundColor: '#ffffff',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  color: hasValue ? '#141414' : '#a0aec0',
});

// Simple reusable single-select dropdown
const SimpleDropdown: React.FC<SimpleDropdownProps> = ({ value, options, onChange, placeholder, testId }) => (
  <Dropdown>
    <Dropdown.Toggle
      data-test-id={testId}
      variant="outline-secondary"
      style={dropdownToggleStyle(!!value)}
    >
      {value || placeholder || 'Select...'}
    </Dropdown.Toggle>
    <Dropdown.Menu style={{ width: '100%' }}>
      {options.map((opt) => (
        <Dropdown.Item key={opt} onClick={() => onChange(opt)}>
          {opt}
        </Dropdown.Item>
      ))}
    </Dropdown.Menu>
  </Dropdown>
);

// ─── Main renderCreateDeal ────────────────────────────────────────────────────

const renderCreateDeal = (showCreateDealSidebar: boolean, setShowCreateDealSidebar: (show: boolean) => void) => {
  if (!showCreateDealSidebar) return null;
  return <CreateDealSidebar onClose={() => setShowCreateDealSidebar(false)} />;
};

export default renderCreateDeal;

// ─── Sidebar component (self-contained for easy integration) ──────────────────

export const CreateDealSidebar: React.FC<CreateDealSidebarProps> = ({ onClose }) => {
  const [dealForm, setDealForm] = useState(initialDealForm);
  const [lineItemInput, setLineItemInput] = useState<string>('');
  const [lineItemQty, setLineItemQty] = useState<number>(0);
  const [isContactsExpanded, setIsContactsExpanded] = useState(true);
  const [isCompaniesExpanded, setIsCompaniesExpanded] = useState(true);

  const set = (key: keyof DealFormData) => (val: any) => setDealForm((prev) => ({ ...prev, [key]: val }));
  const setE = (key: keyof DealFormData) => (e: React.ChangeEvent<HTMLInputElement>) => setDealForm((prev) => ({ ...prev, [key]: e.target.value }));

  const isFormValid =
    dealForm.dealName.trim() !== '' &&
    dealForm.pipeline !== '' &&
    dealForm.dealStage !== '';

  // Line items
  const addLineItem = () => {
    if (!lineItemInput) return;
    setDealForm((prev) => ({
      ...prev,
      lineItems: [
        ...prev.lineItems,
        { id: Date.now(), name: lineItemInput, quantity: lineItemQty || 1 },
      ],
    }));
    setLineItemInput('');
    setLineItemQty(0);
  };

  const removeLineItem = (id: number) =>
    setDealForm((prev) => ({
      ...prev,
      lineItems: prev.lineItems.filter((li) => li.id !== id),
    }));

  const focusStyle = (e: React.FocusEvent<HTMLInputElement>) => (e.currentTarget.style.borderColor = '#0091ae');
  const blurStyle = (e: React.FocusEvent<HTMLInputElement>) => (e.currentTarget.style.borderColor = '#8a8a8a');

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1000,
          background: 'transparent',
        }}
      />

      {/* Sidebar */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
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
            Create Deal
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              padding: '4px',
              cursor: 'pointer',
              color: '#718096',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* ── Content ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 40px 40px' }}>

          {/* Edit this form link */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
            <a
              href="#"
              style={{ fontSize: '13px', color: '#0091ae', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
              onClick={(e) => e.preventDefault()}
            >
              Edit this form ↗
            </a>
          </div>

          {/* Deal name */}
          <div style={fieldWrap}>
            {fieldLabel('Deal name', true)}
            <input
              type="text"
              data-test-id="dealname-input"
              value={dealForm.dealName}
              onChange={setE('dealName')}
              style={inputStyle}
              onFocus={focusStyle}
              onBlur={blurStyle}
            />
          </div>

          {/* Pipeline */}
          <div style={fieldWrap}>
            {fieldLabel('Pipeline', true)}
            <SimpleDropdown
              value={dealForm.pipeline}
              options={PIPELINE_OPTIONS}
              onChange={set('pipeline')}
              testId="pipeline-input"
            />
          </div>

          {/* Deal stage */}
          <div style={fieldWrap}>
            {fieldLabel('Deal stage', true)}
            <SimpleDropdown
              value={dealForm.dealStage}
              options={DEAL_STAGE_OPTIONS}
              onChange={set('dealStage')}
              testId="dealstage-input"
            />
          </div>

          {/* Amount */}
          <div style={fieldWrap}>
            {fieldLabel('Amount')}
            <input
              type="number"
              data-test-id="amount-input"
              value={dealForm.amount}
              onChange={setE('amount')}
              style={inputStyle}
              onFocus={focusStyle}
              onBlur={blurStyle}
            />
          </div>

          {/* Currency */}
          <div style={fieldWrap}>
            {fieldLabel('Currency')}
            <SimpleDropdown
              value={dealForm.currency}
              options={CURRENCY_OPTIONS}
              onChange={set('currency')}
              testId="currency-input"
            />
          </div>

          {/* Close date */}
          <div style={fieldWrap}>
            {fieldLabel('Close date')}
            <input
              type="date"
              data-test-id="closedate-input"
              value={dealForm.closeDate}
              onChange={setE('closeDate')}
              style={inputStyle}
              onFocus={focusStyle}
              onBlur={blurStyle}
            />
          </div>

          {/* Deal owner */}
          <div style={fieldWrap}>
            {fieldLabel('Deal owner')}
            <SimpleDropdown
              value={dealForm.dealOwner}
              options={DEAL_OWNER_OPTIONS}
              onChange={set('dealOwner')}
              testId="dealowner-input"
            />
          </div>

          {/* Deal type */}
          <div style={fieldWrap}>
            {fieldLabel('Deal type')}
            <SimpleDropdown
              value={dealForm.dealType}
              options={DEAL_TYPE_OPTIONS}
              onChange={set('dealType')}
              placeholder="Select..."
              testId="dealtype-input"
            />
          </div>

          {/* Priority */}
          <div style={fieldWrap}>
            {fieldLabel('Priority')}
            <SimpleDropdown
              value={dealForm.priority}
              options={PRIORITY_OPTIONS}
              onChange={set('priority')}
              placeholder="Select..."
              testId="priority-input"
            />
          </div>

          {/* Closed lost reason */}
          <div style={fieldWrap}>
            {fieldLabel('Closed lost reason')}
            <input
              type="text"
              data-test-id="closedlostreason-input"
              value={dealForm.closedLostReason}
              onChange={setE('closedLostReason')}
              style={inputStyle}
              onFocus={focusStyle}
              onBlur={blurStyle}
            />
          </div>

          {/* Closed won reason */}
          <div style={fieldWrap}>
            {fieldLabel('Closed won reason')}
            <input
              type="text"
              data-test-id="closedwonreason-input"
              value={dealForm.closedWonReason}
              onChange={setE('closedWonReason')}
              style={inputStyle}
              onFocus={focusStyle}
              onBlur={blurStyle}
            />
          </div>

          {/* Create date */}
          <div style={fieldWrap}>
            {fieldLabel('Create date')}
            <input
              type="date"
              data-test-id="createdate-input"
              value={dealForm.createDate}
              onChange={setE('createDate')}
              style={inputStyle}
              onFocus={focusStyle}
              onBlur={blurStyle}
            />
          </div>

          {/* Deal Collaborator */}
          <div style={fieldWrap}>
            {fieldLabel('Deal Collaborator')}
            <SimpleDropdown
              value={dealForm.dealCollaborator}
              options={COLLABORATOR_OPTIONS}
              onChange={set('dealCollaborator')}
              testId="dealcollaborator-input"
            />
          </div>

          {/* Deal Description */}
          <div style={fieldWrap}>
            {fieldLabel('Deal Description')}
            <input
              type="text"
              data-test-id="dealdescription-input"
              value={dealForm.dealDescription}
              onChange={setE('dealDescription')}
              style={inputStyle}
              onFocus={focusStyle}
              onBlur={blurStyle}
            />
          </div>

          {/* Deal probability */}
          <div style={fieldWrap}>
            {fieldLabel('Deal probability')}
            <input
              type="number"
              data-test-id="dealprobability-input"
              value={dealForm.dealProbability}
              onChange={setE('dealProbability')}
              style={inputStyle}
              onFocus={focusStyle}
              onBlur={blurStyle}
            />
          </div>

          {/* Forecast category */}
          <div style={fieldWrap}>
            {fieldLabel('Forecast category')}
            <SimpleDropdown
              value={dealForm.forecastCategory}
              options={FORECAST_CATEGORY_OPTIONS}
              onChange={set('forecastCategory')}
              placeholder="Select..."
              testId="forecastcategory-input"
            />
          </div>

          {/* Forecast probability */}
          <div style={fieldWrap}>
            {fieldLabel('Forecast probability')}
            <input
              type="number"
              data-test-id="forecastprobability-input"
              value={dealForm.forecastProbability}
              onChange={setE('forecastProbability')}
              style={inputStyle}
              onFocus={focusStyle}
              onBlur={blurStyle}
            />
          </div>

          {/* Next step */}
          <div style={fieldWrap}>
            {fieldLabel('Next step')}
            <input
              type="text"
              data-test-id="nextstep-input"
              value={dealForm.nextStep}
              onChange={setE('nextStep')}
              style={inputStyle}
              onFocus={focusStyle}
              onBlur={blurStyle}
            />
          </div>

          {/* Shared teams */}
          <div style={fieldWrap}>
            {fieldLabel('Shared teams')}
            <SimpleDropdown
              value={dealForm.sharedTeams}
              options={SHARED_TEAMS_OPTIONS}
              onChange={set('sharedTeams')}
              placeholder="Select..."
              testId="sharedteams-input"
            />
          </div>

          {/* Shared users */}
          <div style={fieldWrap}>
            {fieldLabel('Shared users')}
            <SimpleDropdown
              value={dealForm.sharedUsers}
              options={SHARED_USERS_OPTIONS}
              onChange={set('sharedUsers')}
              testId="sharedusers-input"
            />
          </div>

          {/* ── Associate Deal with ── */}
          <div style={{ marginTop: '28px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#141414', marginBottom: '16px', marginTop: 0 }}>
              Associate Deal with
            </h3>

            {/* Contacts section */}
            <div
              style={{
                border: '1px solid #cccccc',
                borderRadius: '6px',
                marginBottom: '16px',
                overflow: 'hidden',
                borderLeft: '4px solid #ccc',
              }}
            >
              {/* Contacts Header */}
              <div
                onClick={() => setIsContactsExpanded(!isContactsExpanded)}
                style={{
                  padding: '12px 16px',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  
                }}
              >
                {isContactsExpanded ? (
                  <ChevronDown size={16} style={{ color: '#6c757d' }} />
                ) : (
                  <ChevronRight size={16} style={{ color: '#6c757d' }} />
                )}
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#141414' }}>
                  Contacts
                </span>
              </div>

              {/* Contacts Content */}
              {isContactsExpanded && (
                <div style={{ padding: '16px' }}>
                  <div style={fieldWrap}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#141414', marginBottom: '6px' }}>
                      Associate records
                    </label>
                    <SimpleDropdown
                      value={dealForm.contactAssociateRecord}
                      options={['Contact A', 'Contact B', 'Contact C']}
                      onChange={set('contactAssociateRecord')}
                      placeholder="Search"
                      testId="contact-associate-input"
                    />
                  </div>

                  <div style={fieldWrap}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#141414', marginBottom: '6px' }}>
                      Association label
                    </label>
                    <SimpleDropdown
                      value={dealForm.contactAssociationLabel}
                      options={ASSOCIATION_LABEL_OPTIONS}
                      onChange={set('contactAssociationLabel')}
                      testId="contact-label-input"
                    />
                  </div>

                  <div style={{ marginBottom: '8px' }}>
                    <Form.Check
                      type="checkbox"
                      label={
                        <span style={{ fontSize: '13px', color: '#6c757d' }}>
                          Add timeline activity from this Contact{' '}
                          <span
                            title="Adds contact activity to the deal timeline"
                            style={{
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              width: '14px', height: '14px', borderRadius: '50%',
                              backgroundColor: '#e0e7ef', color: '#6c757d', fontSize: '11px', cursor: 'help',
                            }}
                          >
                            i
                          </span>
                        </span>
                      }
                      checked={dealForm.addTimelineContact}
                      onChange={(e) => setDealForm((p) => ({ ...p, addTimelineContact: e.target.checked }))}
                    />
                  </div>

                  <button
                    style={{
                      background: 'transparent', border: 'none', color: '#0091ae',
                      fontSize: '13px', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '4px',
                    }}
                  >
                    <Plus size={14} /> Add more
                  </button>
                </div>
              )}
            </div>

            {/* Companies section */}
            <div
              style={{
                border: '1px solid #ccc',
                borderRadius: '6px',
                marginBottom: '16px',
                overflow: 'hidden',
                borderLeft: '4px solid #ccc',
              }}
            >
              {/* Companies Header */}
              <div
                onClick={() => setIsCompaniesExpanded(!isCompaniesExpanded)}
                style={{
                  padding: '12px 16px',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  
                }}
              >
                {isCompaniesExpanded ? (
                  <ChevronDown size={16} style={{ color: '#6c757d' }} />
                ) : (
                  <ChevronRight size={16} style={{ color: '#6c757d' }} />
                )}
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#141414' }}>
                  Companies
                </span>
              </div>

              {/* Companies Content */}
              {isCompaniesExpanded && (
                <div style={{ padding: '16px' }}>
                  <div style={fieldWrap}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#141414', marginBottom: '6px' }}>
                      Associate records
                    </label>
                    <SimpleDropdown
                      value={dealForm.companyAssociateRecord}
                      options={['Company A', 'Company B', 'Company C']}
                      onChange={set('companyAssociateRecord')}
                      placeholder="Search"
                      testId="company-associate-input"
                    />
                  </div>

                  <div style={fieldWrap}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#141414', marginBottom: '6px' }}>
                      Association label <span style={{ color: '#f2545b' }}>*</span>{' '}
                      <span
                        title="Required association label"
                        style={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          width: '14px', height: '14px', borderRadius: '50%',
                          backgroundColor: '#e0e7ef', color: '#6c757d', fontSize: '11px', cursor: 'help',
                        }}
                      >
                        i
                      </span>
                    </label>
                    <input
                      type="text"
                      value={dealForm.companyAssociationLabel}
                      readOnly
                      style={{ ...inputStyle, backgroundColor: '#f7fafc', color: '#a0aec0' }}
                    />
                  </div>

                  <div style={{ marginBottom: '8px' }}>
                    <Form.Check
                      type="checkbox"
                      label={
                        <span style={{ fontSize: '13px', color: '#6c757d' }}>
                          Add timeline activity from this Company{' '}
                          <span
                            title="Adds company activity to the deal timeline"
                            style={{
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              width: '14px', height: '14px', borderRadius: '50%',
                              backgroundColor: '#e0e7ef', color: '#6c757d', fontSize: '11px', cursor: 'help',
                            }}
                          >
                            i
                          </span>
                        </span>
                      }
                      checked={dealForm.addTimelineCompany}
                      onChange={(e) => setDealForm((p) => ({ ...p, addTimelineCompany: e.target.checked }))}
                    />
                  </div>

                  <button
                    style={{
                      background: 'transparent', border: 'none', color: '#0091ae',
                      fontSize: '13px', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '4px',
                    }}
                  >
                    <Plus size={14} /> Add more
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ── Add line item ── */}
          <div style={{ marginTop: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#141414' }}>Add line item</span>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#141414' }}>Quantity</span>
            </div>

            {/* Existing line items */}
            {dealForm.lineItems.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  marginBottom: '8px',
                }}
              >
                <div style={{ flex: 1, padding: '10px 12px', border: '1px solid #eaf0f6', borderRadius: '4px', fontSize: '14px', color: '#141414', backgroundColor: '#f7fafc' }}>
                  {item.name}
                </div>
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) =>
                    setDealForm((prev) => ({
                      ...prev,
                      lineItems: prev.lineItems.map((li) =>
                        li.id === item.id ? { ...li, quantity: Number(e.target.value) } : li
                      ),
                    }))
                  }
                  style={{ ...inputStyle, width: '70px' }}
                />
                <button
                  onClick={() => removeLineItem(item.id)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#f2545b', display: 'flex', alignItems: 'center' }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}

            {/* Add new line item row */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <Dropdown>
                  <Dropdown.Toggle
                    variant="outline-secondary"
                    data-test-id="lineitem-input"
                    style={{
                      ...dropdownToggleStyle(!!lineItemInput),
                      color: lineItemInput ? '#141414' : '#a0aec0',
                    }}
                  >
                    {lineItemInput || 'Add a line item'}
                  </Dropdown.Toggle>
                  <Dropdown.Menu style={{ width: '100%' }}>
                    {LINE_ITEM_OPTIONS.map((opt) => (
                      <Dropdown.Item key={opt} onClick={() => setLineItemInput(opt)}>
                        {opt}
                      </Dropdown.Item>
                    ))}
                  </Dropdown.Menu>
                </Dropdown>
              </div>
              <input
                type="number"
                value={lineItemQty || ''}
                placeholder="0"
                onChange={(e) => setLineItemQty(Number(e.target.value))}
                style={{ ...inputStyle, width: '70px' }}
                onFocus={focusStyle}
                onBlur={blurStyle}
              />
              <button
                onClick={addLineItem}
                disabled={!lineItemInput}
                style={{
                  background: lineItemInput ? '#0091ae' : '#cbd5e0',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '10px',
                  cursor: lineItemInput ? 'pointer' : 'not-allowed',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Plus size={16} />
              </button>
            </div>
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
            disabled={!isFormValid}
            style={{
              padding: '10px 20px',
              backgroundColor: isFormValid ? '#0091ae' : '#cbd5e0',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: isFormValid ? 'pointer' : 'not-allowed',
            }}
            onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => { if (isFormValid) e.currentTarget.style.backgroundColor = '#007a94'; }}
            onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => { if (isFormValid) e.currentTarget.style.backgroundColor = '#0091ae'; }}
          >
            Create
          </button>

          <button
            type="button"
            disabled={!isFormValid}
            style={{
              padding: '10px 20px',
              backgroundColor: 'transparent',
              color: isFormValid ? '#141414' : '#a0aec0',
              border: '1px solid #8a8a8a',
              borderRadius: '4px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: isFormValid ? 'pointer' : 'not-allowed',
            }}
            onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => { if (isFormValid) e.currentTarget.style.backgroundColor = '#f7fafc'; }}
            onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => { if (isFormValid) e.currentTarget.style.backgroundColor = 'transparent'; }}
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
            onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => e.currentTarget.style.backgroundColor = '#f7fafc'}
            onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}

/**
 * Usage in your parent component:
 *
 * import { CreateDealSidebar } from './renderCreateDeal';
 *
 * const [showCreateDealSidebar, setShowCreateDealSidebar] = useState(false);
 *
 * // In your JSX:
 * {showCreateDealSidebar && (
 *   <CreateDealSidebar onClose={() => setShowCreateDealSidebar(false)} />
 * )}
 *
 * // Or use the renderCreateDeal helper (like renderCreateContact):
 * import renderCreateDeal from './renderCreateDeal';
 * {renderCreateDeal(showCreateDealSidebar, setShowCreateDealSidebar)}
 */
