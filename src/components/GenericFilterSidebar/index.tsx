import React from 'react';
import { Button, Form } from 'react-bootstrap';
import { X, RefreshCw, Check } from 'lucide-react';
import Select from 'react-select';

export interface FilterOption {
  value: any;
  label: string;
}

export type FilterFieldType = 'text' | 'select' | 'multi-select' | 'date' | 'datetime' | 'dropdown';

export interface FilterField {
  id: string;
  label: string;
  type: FilterFieldType;
  value: any;
  onChange: (value: any) => void;
  placeholder?: string;
  options?: FilterOption[];
  isClearable?: boolean;
  styles?: any;
  /** For `type: "date"` / `"datetime"` — passed to the native input */
  min?: string;
  max?: string;
}

export interface GenericFilterSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  filters: FilterField[];
  onApply?: () => void;
  onReset?: () => void;
  width?: string;
  showApplyButton?: boolean;
  showResetButton?: boolean;
}

const GenericFilterSidebar: React.FC<GenericFilterSidebarProps> = ({
  isOpen,
  onClose,
  title = 'Filters',
  subtitle = 'Filter and refine your results',
  filters,
  onApply,
  onReset,
  width = '400px',
  showApplyButton = true,
  showResetButton = true
}) => {
  if (!isOpen) return null;

  // Fixed header height - matching the application's header
  const headerHeight = '85px';

  const handleApply = () => {
    if (onApply) {
      onApply();
    }
    onClose();
  };

  const handleReset = () => {
    if (onReset) {
      onReset();
    }
  };

  const renderFilterField = (filter: FilterField) => {
    const baseStyles = {
      fontSize: '14px',
      padding: '10px 12px',
      borderRadius: '8px',
      border: '1px solid #d1d5db'
    };

    const selectStyles = {
      control: (base: any) => ({
        ...base,
        fontSize: '14px',
        padding: '2px',
        borderRadius: '8px',
        border: '1px solid #d1d5db',
        boxShadow: 'none',
        '&:hover': {
          borderColor: '#9ca3af'
        }
      }),
      menu: (base: any) => ({
        ...base,
        zIndex: 9999
      }),
      option: (base: any, state: any) => ({
        ...base,
        fontSize: '14px',
        backgroundColor: state.isSelected ? '#4f46e5' : state.isFocused ? '#f3f4f6' : 'white',
        color: state.isSelected ? 'white' : '#111827',
        cursor: 'pointer'
      }),
      multiValue: (base: any) => ({
        ...base,
        backgroundColor: '#e0e7ff',
        borderRadius: '6px'
      }),
      multiValueLabel: (base: any) => ({
        ...base,
        color: '#4f46e5',
        fontSize: '13px'
      }),
      multiValueRemove: (base: any) => ({
        ...base,
        color: '#4f46e5',
        ':hover': {
          backgroundColor: '#c7d2fe',
          color: '#4338ca'
        }
      }),
      ...filter.styles
    };

    switch (filter.type) {
      case 'text':
        return (
          <Form.Control
            type="text"
            value={filter.value || ''}
            onChange={(e) => filter.onChange(e.target.value)}
            placeholder={filter.placeholder}
            style={baseStyles}
          />
        );

      case 'select':
        return (
          <Select
            options={filter.options || []}
            value={filter.value}
            onChange={filter.onChange}
            placeholder={filter.placeholder || 'Select...'}
            styles={selectStyles}
            isClearable={filter.isClearable !== false}
          />
        );

      case 'multi-select':
        return (
          <Select
            isMulti
            options={filter.options || []}
            value={filter.value}
            onChange={filter.onChange}
            placeholder={filter.placeholder || 'Select...'}
            styles={selectStyles}
            isClearable={filter.isClearable !== false}
          />
        );

      case 'dropdown':
        return (
          <Form.Select
            value={filter.value || ''}
            onChange={(e) => filter.onChange(e.target.value || null)}
            style={baseStyles}
          >
            {filter.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Form.Select>
        );

      case 'date':
        return (
          <Form.Control
            type="date"
            value={filter.value || ''}
            min={filter.min}
            max={filter.max}
            onChange={(e) => filter.onChange(e.target.value || null)}
            style={baseStyles}
          />
        );

      case 'datetime':
        return (
          <Form.Control
            type="datetime-local"
            value={filter.value || ''}
            min={filter.min}
            max={filter.max}
            onChange={(e) => filter.onChange(e.target.value || null)}
            style={baseStyles}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: headerHeight,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 1050,
        display: 'flex',
        justifyContent: 'flex-end',
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideIn {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
          .filter-sidebar-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .filter-sidebar-scrollbar::-webkit-scrollbar-track {
            background: #f1f5f9;
            border-radius: 10px;
          }
          .filter-sidebar-scrollbar::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 10px;
          }
          .filter-sidebar-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
          }
        `}
      </style>
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          width,
          height: `calc(100vh - ${headerHeight})`,
          backgroundColor: '#ffffff',
          boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.12)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'slideIn 0.3s ease-out'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '28px 24px',
          borderBottom: '1px solid #e5e7eb',
          position: 'relative',
          backgroundColor: '#ffffff'
        }}>
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '24px',
              right: '24px',
              background: 'transparent',
              border: 'none',
              borderRadius: '6px',
              width: '32px',
              height: '32px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#6b7280',
              transition: 'all 0.2s',
              zIndex: 10
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f3f4f6';
              e.currentTarget.style.color = '#111827';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#6b7280';
            }}
          >
            <X size={20} />
          </button>

          <div style={{ paddingRight: '40px' }}>
            <h2 style={{ 
              fontSize: '20px', 
              fontWeight: '600', 
              color: '#111827',
              margin: '0 0 6px 0',
              lineHeight: '1.3'
            }}>
              {title}
            </h2>
            {subtitle && (
              <p style={{ 
                fontSize: '14px', 
                color: '#6b7280',
                margin: '0',
                lineHeight: '1.5'
              }}>
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Filters Content */}
        <div 
          className="filter-sidebar-scrollbar"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px',
            backgroundColor: '#ffffff'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {filters.map((filter) => (
              <div key={filter.id} style={{ width: '100%' }}>
                <label 
                  htmlFor={filter.id}
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '8px',
                    letterSpacing: '0.01em'
                  }}
                >
                  {filter.label}
                </label>
                <div style={{ width: '100%' }}>
                  {renderFilterField(filter)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer with Action Buttons */}
        {(showApplyButton || showResetButton) && (
          <div style={{
            padding: '20px 24px',
            borderTop: '1px solid #e5e7eb',
            backgroundColor: '#fafafa',
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end'
          }}>
            {showResetButton && (
              <Button
                variant="outline-secondary"
                onClick={handleReset}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: '500',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  backgroundColor: '#ffffff',
                  color: '#6b7280',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                  e.currentTarget.style.borderColor = '#9ca3af';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#ffffff';
                  e.currentTarget.style.borderColor = '#d1d5db';
                }}
              >
                <RefreshCw size={16} />
                Reset
              </Button>
            )}
            {showApplyButton && (
              <Button
                variant="primary"
                onClick={handleApply}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 20px',
                  fontSize: '14px',
                  fontWeight: '500',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#4f46e5',
                  color: '#ffffff',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#4338ca';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#4f46e5';
                }}
              >
                <Check size={16} />
                Apply Filters
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GenericFilterSidebar;
