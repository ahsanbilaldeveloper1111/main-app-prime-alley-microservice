import React from 'react';
import { X } from 'lucide-react';
import { faqSidebarStyles } from './faqSidebarStyles';

// ===== FaqFormSidebar =====
export interface FaqFormSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  headerIcon: React.ReactNode;
  canSubmit: boolean;
  isSubmitting?: boolean;
  submitLabel: string;
  submittingLabel: string;
  onSubmit: () => void;
  children: React.ReactNode; // Form fields (body only)
}

export const FaqFormSidebar: React.FC<FaqFormSidebarProps> = ({
  isOpen,
  onClose,
  title,
  headerIcon,
  canSubmit,
  isSubmitting = false,
  submitLabel,
  submittingLabel,
  onSubmit,
  children,
}) => {
  if (!isOpen) return null;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit();
  };

  return (
    <>
      {/* Backdrop */}
      <div aria-hidden="true" style={faqSidebarStyles.backdrop} />

      {/* Panel */}
      <div className="contact-sidebar-container" style={faqSidebarStyles.panel}>
        <div className="contact-sidebar-header" style={faqSidebarStyles.header}>
          <div style={faqSidebarStyles.headerContent}>
            {headerIcon}
            <h2 className="contact-sidebar-title" style={faqSidebarStyles.headerTitle}>{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={faqSidebarStyles.closeButton}
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleFormSubmit} style={faqSidebarStyles.form}>
          {/* Body */}
          <div className="contact-sidebar-content" style={faqSidebarStyles.body}>{children}</div>

          <div className="contact-sidebar-footer" style={faqSidebarStyles.footer}>
            <button
              type="submit"
              disabled={!canSubmit}
              style={faqSidebarStyles.submitButton(canSubmit)}
              onMouseEnter={(e) => {
                if (canSubmit) {
                  e.currentTarget.style.backgroundColor =
                    faqSidebarStyles.submitButtonHoverActive;
                }
              }}
              onMouseLeave={(e) => {
                if (canSubmit) {
                  e.currentTarget.style.backgroundColor =
                    faqSidebarStyles.submitButtonHoverInactive;
                }
              }}
            >
              {isSubmitting ? submittingLabel : submitLabel}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={faqSidebarStyles.cancelButton}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  faqSidebarStyles.cancelButtonHover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </>
  );
};
export default FaqFormSidebar