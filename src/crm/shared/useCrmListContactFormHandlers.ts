import {
  useCallback,
  useEffect,
  useMemo,
  type Dispatch,
  type SetStateAction,
} from "react";
import { toast } from "react-toastify";
import { createCrmData, updateCrmData } from "@utils/crm";
import {
  createEmptyCrmListContactFormState,
  resolveDefaultContactOwnerExtension,
  type CrmExtensionLikeForOwnerDefault,
  type CrmListContactFormState,
} from "@utils/crmContactFormFromCrmItem";
import { datetimeLocalToIsoUtc } from "@utils/datetimeLocalInput";
import { isValidEmail } from "@utils/Helper";
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
  /** User extension list for Owner select; used to default Owner to the logged-in user on create. */
  extensions: readonly CrmExtensionLikeForOwnerDefault[];
  showCreateContactSidebar: boolean;
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
    session,
    contactForm,
    setContactForm,
    setCreateContactLoading,
    setShowCreateContactSidebar,
    editingContactId,
    setEditingContactId,
    fetchCrmData,
    sourceField,
    extensions,
    showCreateContactSidebar,
  } = deps;

  const extensionOwnerSeedKey = useMemo(
    () =>
      extensions
        .map((e) => String(e.extension ?? e.id ?? ""))
        .join("|"),
    [extensions],
  );

  useEffect(() => {
    if (!showCreateContactSidebar || editingContactId != null) return;
    if (!extensionOwnerSeedKey) return;
    const def = resolveDefaultContactOwnerExtension(session?.user, extensions);
    if (def == null) return;
    setContactForm((prev: CrmListContactFormState) => {
      if (prev.contact_owner != null) return prev;
      return { ...prev, contact_owner: def };
    });
  }, [
    showCreateContactSidebar,
    editingContactId,
    extensionOwnerSeedKey,
    extensions,
    session?.user,
    setContactForm,
  ]);

  const handleCreateContactSubmit = useCallback(
    async (addAnother: boolean) => {
      const { name, phoneForPayload, customFieldsForPayload } =
        buildContactPayloadFields(contactForm);
      if (!name || !contactForm.email || !contactForm.phoneNumber?.trim()) {
        toast.error("Name, email and phone are required");
        return;
      }
      if (!isValidEmail(contactForm.email)) {
        toast.error("Please enter a valid email address");
        return;
      }
      const userExtension = String(session?.user?.phone ?? "");

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
          scheduled_call_at: datetimeLocalToIsoUtc(contactForm.scheduled_call_at),
          company_domain: contactForm.company_domain?.trim() || undefined,
          source_file: getSourceValue(contactForm),
          data: dataPayload,
        });
        fetchCrmData();
        const ownerDefault = resolveDefaultContactOwnerExtension(
          session?.user,
          extensions,
        );
        setContactForm(
          sourceField === "source_file"
            ? createEmptyCrmListContactFormState("source_file", {
                defaultContactOwner: ownerDefault,
              })
            : createEmptyCrmListContactFormState("source", {
                defaultContactOwner: ownerDefault,
              }),
        );
        if (!addAnother) {
          setShowCreateContactSidebar(false);
        }
      } catch {
        // Error already shown by createCrmData
      } finally {
        setCreateContactLoading(false);
      }
    },
    [
      contactForm,
      extensions,
      fetchCrmData,
      session?.user,
      setContactForm,
      setCreateContactLoading,
      setShowCreateContactSidebar,
      sourceField,
    ],
  );

  const handleUpdateContactSubmit = useCallback(async () => {
    if (editingContactId == null) return;
    const { name, phoneForPayload, customFieldsForPayload } =
      buildContactPayloadFields(contactForm);
    if (!name || !contactForm.email?.trim() || !contactForm.phoneNumber?.trim()) {
      toast.error("Name, email and phone are required");
      return;
    }
    if (!isValidEmail(contactForm.email)) {
      toast.error("Please enter a valid email address");
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
        source_file: getSourceValue(contactForm),
        scheduled_call_at: datetimeLocalToIsoUtc(contactForm.scheduled_call_at),
        data: dataPayload,
      });
      fetchCrmData();
      setShowCreateContactSidebar(false);
      setEditingContactId(null);
    } catch {
      // Error already shown by updateCrmData
    } finally {
      setCreateContactLoading(false);
    }
  }, [
    editingContactId,
    contactForm,
    fetchCrmData,
    setCreateContactLoading,
    setShowCreateContactSidebar,
    setEditingContactId,
  ]);

  return { handleCreateContactSubmit, handleUpdateContactSubmit };
}
