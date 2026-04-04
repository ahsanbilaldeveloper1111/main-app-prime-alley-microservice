import React from "react";
import { parsePhoneNumber as parsePhoneNumberInput } from "react-phone-number-input";
import ProspectEditSidebar from "@components/ProspectEditSidebar";

export type CrmListCreateContactSidebarProps = Readonly<{
  show: boolean;
  editingContactId: number | null;
  contactForm: any;
  setContactForm: React.Dispatch<React.SetStateAction<any>>;
  createContactLoading: boolean;
  contactFormLoading: boolean;
  contactFormLoadError: string | null;
  availableCampaigns: Array<{ value: string; label: string; id: number }>;
  extensions: any[];
  availableTags: Array<{ value: string; label: string; id: number }>;
  entityLabel: string;
  onClose: () => void;
  onCreateSubmit: (addAnother: boolean) => void;
  onUpdateSubmit: () => void;
}>;

export function CrmListCreateContactSidebar({
  show,
  editingContactId,
  contactForm,
  setContactForm,
  createContactLoading,
  contactFormLoading,
  contactFormLoadError,
  availableCampaigns,
  extensions,
  availableTags,
  entityLabel,
  onClose,
  onCreateSubmit,
  onUpdateSubmit,
}: Readonly<CrmListCreateContactSidebarProps>) {
  if (!show) return null;

  const isFormValid =
    contactForm.email?.trim() &&
    contactForm.phoneNumber?.trim() &&
    (contactForm.firstName?.trim() || contactForm.lastName?.trim()) &&
    contactForm.campaign_id != null;

  return (
    <ProspectEditSidebar
      isOpen={show}
      title={editingContactId ? `Edit ${entityLabel}` : `Create ${entityLabel}`}
      isEditing={!!editingContactId}
      isFormValid={!!isFormValid}
      createContactLoading={createContactLoading}
      contactForm={contactForm}
      setContactForm={setContactForm}
      contactFormLoading={contactFormLoading}
      contactFormLoadError={contactFormLoadError}
      availableCampaigns={availableCampaigns}
      extensions={extensions}
      availableTags={availableTags}
      parsePhoneNumberInput={parsePhoneNumberInput}
      onClose={onClose}
      onSubmitPrimary={() => {
        if (editingContactId) {
          onUpdateSubmit();
        } else {
          onCreateSubmit(false);
        }
      }}
      onCreateAndAddAnother={
        editingContactId ? undefined : () => onCreateSubmit(true)
      }
    />
  );
}
