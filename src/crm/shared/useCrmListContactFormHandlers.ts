import { useCallback, type Dispatch, type SetStateAction } from "react";
import { toast } from "react-toastify";
import { createCrmData, updateCrmData } from "@utils/crm";
import {
  createEmptyCrmListContactFormState,
  type CrmListContactFormState,
} from "@utils/crmContactFormFromCrmItem";

export type CrmListContactFormHandlersDeps = {
  session: any;
  contactForm: CrmListContactFormState;
  setContactForm: Dispatch<SetStateAction<any>>;
  setCreateContactLoading: Dispatch<SetStateAction<boolean>>;
  setShowCreateContactSidebar: Dispatch<SetStateAction<boolean>>;
  editingContactId: number | null;
  setEditingContactId: Dispatch<SetStateAction<number | null>>;
  fetchCrmData: () => void;
  sourceField: "source" | "source_file";
};

function getSourceValue(form: CrmListContactFormState): string | undefined {
  if ("source_file" in form) return form.source_file?.trim() || undefined;
  if ("source" in form) return form.source?.trim() || undefined;
  return undefined;
}

function buildContactPayloadFields(contactForm: CrmListContactFormState) {
  const name = [contactForm.firstName, contactForm.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  const phoneForPayload =
    contactForm.phone_country_code && contactForm.phoneNumber?.trim()
      ? `${contactForm.phone_country_code} ${contactForm.phoneNumber.trim()}`
      : contactForm.phoneNumber?.trim() ?? "";

  const customFieldsForPayload = (contactForm.custom_fields ?? [])
    .map((f) => ({
      field_name: String(f.field_name ?? "").trim(),
      field_value: String(f.field_value ?? "").trim(),
    }))
    .filter((f) => f.field_name || f.field_value);

  return { name, phoneForPayload, customFieldsForPayload };
}

function buildDataPayload(
  contactForm: CrmListContactFormState,
  customFieldsForPayload: { field_name: string; field_value: string }[],
  extras?: Record<string, any>,
) {
  const dataPayload: Record<string, any> = {
    email: contactForm.email?.trim(),
    disposition: contactForm.disposition || undefined,
    note: contactForm.note || undefined,
    contact_owner: contactForm.contact_owner ?? undefined,
    legal_basis: contactForm.legal_basis?.length
      ? contactForm.legal_basis
      : undefined,
    ...extras,
  };
  customFieldsForPayload.forEach((f) => {
    dataPayload[f.field_name] = f.field_value;
  });
  return dataPayload;
}

export function useCrmListContactFormHandlers(deps: CrmListContactFormHandlersDeps) {
  const {
    session, contactForm, setContactForm, setCreateContactLoading,
    setShowCreateContactSidebar, editingContactId, setEditingContactId,
    fetchCrmData, sourceField,
  } = deps;

  const handleCreateContactSubmit = useCallback(
    async (addAnother: boolean) => {
      const { name, phoneForPayload, customFieldsForPayload } =
        buildContactPayloadFields(contactForm);
      if (!name || !contactForm.email || !contactForm.phoneNumber?.trim()) {
        toast.error("Name, email and phone are required");
        return;
      }
      if (contactForm.campaign_id == null) {
        toast.error("Campaign is required");
        return;
      }
      const sessionUser = session?.user as any;
      const userExtension = String(sessionUser?.phone ?? "");

      const dataPayload = buildDataPayload(contactForm, customFieldsForPayload, {
        assigned_to: userExtension,
        uploaded_by: userExtension,
      });

      setCreateContactLoading(true);
      try {
        await createCrmData({
          name,
          phone: phoneForPayload,
          user_extension: userExtension,
          campaign_id: contactForm.campaign_id ?? null,
          scheduled_call_at: contactForm.scheduled_call_at || undefined,
          company_domain: contactForm.company_domain?.trim() || undefined,
          source: getSourceValue(contactForm),
          tag_ids: contactForm.tags?.length
            ? contactForm.tags.map((t) => t.id)
            : [],
          data: dataPayload,
        });
        fetchCrmData();
        setContactForm(createEmptyCrmListContactFormState(sourceField as any));
        if (!addAnother) {
          setShowCreateContactSidebar(false);
        }
      } catch {
        // Error already shown by createCrmData
      } finally {
        setCreateContactLoading(false);
      }
    },
    [contactForm, fetchCrmData, session?.user, setContactForm, setCreateContactLoading, setShowCreateContactSidebar, sourceField],
  );

  const handleUpdateContactSubmit = useCallback(async () => {
    if (editingContactId == null) return;
    const { name, phoneForPayload, customFieldsForPayload } =
      buildContactPayloadFields(contactForm);
    if (!name || !contactForm.email?.trim() || !contactForm.phoneNumber?.trim()) {
      toast.error("Name, email and phone are required");
      return;
    }
    if (contactForm.campaign_id == null) {
      toast.error("Campaign is required");
      return;
    }

    const dataPayload = buildDataPayload(contactForm, customFieldsForPayload);

    setCreateContactLoading(true);
    try {
      await updateCrmData(editingContactId, {
        name,
        phone: phoneForPayload,
        campaign_id: contactForm.campaign_id ?? null,
        company_domain: contactForm.company_domain?.trim() || undefined,
        source: getSourceValue(contactForm),
        scheduled_call_at: contactForm.scheduled_call_at || undefined,
        data: dataPayload,
        tag_ids: contactForm.tags?.length
          ? contactForm.tags.map((t) => t.id)
          : [],
      });
      fetchCrmData();
      setShowCreateContactSidebar(false);
      setEditingContactId(null);
    } catch {
      // Error already shown by updateCrmData
    } finally {
      setCreateContactLoading(false);
    }
  }, [editingContactId, contactForm, fetchCrmData, setCreateContactLoading, setShowCreateContactSidebar, setEditingContactId]);

  return { handleCreateContactSubmit, handleUpdateContactSubmit };
}
