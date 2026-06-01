import React from 'react';
import { Button } from 'react-bootstrap';
import { X, RefreshCw, Check } from 'lucide-react';
import { renderGenericFilterField } from "./genericFilterFieldRender";

export type {
  FilterField,
  FilterFieldType,
  FilterOption,
} from "./filterFieldTypes";
import type { FilterField } from "./filterFieldTypes";

export interface GenericFilterSidebarProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly title?: string;
  readonly subtitle?: string;
  readonly filters: readonly FilterField[];
  readonly onApply?: () => void;
  readonly onReset?: () => void;
  readonly width?: string;
  readonly showApplyButton?: boolean;
  readonly showResetButton?: boolean;
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
                  {renderGenericFilterField(filter)}
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

export { default as GenericFilterFieldsPanel } from "./GenericFilterFieldsPanel";
export default GenericFilterSidebar;
