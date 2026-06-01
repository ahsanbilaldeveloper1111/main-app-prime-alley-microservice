import React from "react";
import { APP_FONT } from "../../styles/fonts";
import {
  isPrimarySubmitEnabled,
  isSecondaryCreateActionEnabled,
  resolveSubmitButtonLabel,
} from "@components/renderCreateTicketForm/createTicketSidebarDomain";

const FF = APP_FONT;

type CreateTicketSidebarFooterProps = {
  isEditMode: boolean;
  isFormValid: boolean;
  loading: boolean;
  picklistsLoading: boolean;
  onSubmit: () => void | Promise<void>;
  onClose: () => void;
};

export const CreateTicketSidebarFooter: React.FC<CreateTicketSidebarFooterProps> = ({
  isEditMode,
  isFormValid,
  loading,
  picklistsLoading,
  onSubmit,
  onClose,
}) => {
  const primarySubmitEnabled = isPrimarySubmitEnabled(
    isFormValid,
    loading,
    picklistsLoading,
  );
  const submitButtonLabel = resolveSubmitButtonLabel(loading, isEditMode);
  const secondaryActionEnabled = isSecondaryCreateActionEnabled(
    isFormValid,
    loading,
    picklistsLoading,
  );

  return (
    <div
      style={{
        padding: "16px clamp(16px, 4vw, 24px)",
        borderTop: "1px solid #eaf0f6",
        display: "flex",
        gap: "12px",
        justifyContent: "flex-start",
        flexWrap: "wrap",
      }}
    >
      <button
        type="button"
        disabled={!primarySubmitEnabled}
        onClick={onSubmit}
        style={{
          padding: "10px 20px",
          backgroundColor: primarySubmitEnabled ? "#0091ae" : "#cbd5e0",
          color: "#ffffff",
          border: "none",
          borderRadius: "4px",
          fontSize: "14px",
          fontWeight: "500",
          cursor: primarySubmitEnabled ? "pointer" : "not-allowed",
          fontFamily: FF,
          transition: "150ms ease-out",
        }}
        onMouseEnter={(e) => {
          if (primarySubmitEnabled) {
            e.currentTarget.style.backgroundColor = "#007a94";
          }
        }}
        onMouseLeave={(e) => {
          if (primarySubmitEnabled) {
            e.currentTarget.style.backgroundColor = "#0091ae";
          }
        }}
      >
        {submitButtonLabel}
      </button>

      {!isEditMode && (
        <button
          type="button"
          disabled={!secondaryActionEnabled}
          style={{
            padding: "10px 20px",
            backgroundColor: "transparent",
            color: secondaryActionEnabled ? "#141414" : "#a0aec0",
            border: "1px solid #8a8a8a",
            borderRadius: "4px",
            fontSize: "14px",
            fontWeight: "500",
            cursor: secondaryActionEnabled ? "pointer" : "not-allowed",
            fontFamily: FF,
            transition: "150ms ease-out",
          }}
          onMouseEnter={(e) => {
            if (secondaryActionEnabled) {
              e.currentTarget.style.backgroundColor = "#f7fafc";
            }
          }}
          onMouseLeave={(e) => {
            if (secondaryActionEnabled) {
              e.currentTarget.style.backgroundColor = "transparent";
            }
          }}
        >
          Create and add another
        </button>
      )}

      <button
        type="button"
        onClick={onClose}
        disabled={loading}
        style={{
          padding: "10px 20px",
          backgroundColor: "transparent",
          color: "#141414",
          border: "1px solid #8a8a8a",
          borderRadius: "4px",
          fontSize: "14px",
          fontWeight: "500",
          cursor: loading ? "not-allowed" : "pointer",
          fontFamily: FF,
          transition: "150ms ease-out",
        }}
        onMouseEnter={(e) => {
          if (!loading) {
            e.currentTarget.style.backgroundColor = "#f7fafc";
          }
        }}
        onMouseLeave={(e) => {
          if (!loading) {
            e.currentTarget.style.backgroundColor = "transparent";
          }
        }}
      >
        Cancel
      </button>
    </div>
  );
};
