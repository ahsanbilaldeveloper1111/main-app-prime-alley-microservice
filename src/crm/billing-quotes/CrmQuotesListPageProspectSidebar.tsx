import React from "react";
import moment from "moment";
import {
  History,
  FileText,
  Target,
} from "lucide-react";
import GenericSidebar from "@components/GenericSidebarNew";
import { RECORD_TYPES } from "@utils/Helper";
import { getInitials, getRandomColor } from "@utils/crmNameAvatar";
import type { NextRouter } from "next/router";

type SessionUser =
  | { name?: string | null; email?: string | null }
  | undefined;

export type CrmQuotesListPageProspectSidebarProps = {
  show: boolean;
  onClose: () => void;
  selectedProspect: any;
  sessionUser: SessionUser;
  getNameByExtension: (extension: string) => string;
  onNoteCreate: (
    note: string,
    createTask: boolean,
    taskDueDate?: string,
  ) => void;
  router: NextRouter;
  onDuplicateQuote: (quote: any) => void;
  onSendToContact: (quote: any) => void;
  onDeleteData: (item: any) => void;
  onCallClick: (item: any) => void;
};

export function CrmQuotesListPageProspectSidebar({
  show,
  onClose,
  selectedProspect,
  sessionUser,
  getNameByExtension,
  onNoteCreate,
  router,
  onDuplicateQuote,
  onSendToContact,
  onDeleteData,
  onCallClick,
}: CrmQuotesListPageProspectSidebarProps) {
  if (!show) {
    return null;
  }

  const sp = selectedProspect;

  return (
    <GenericSidebar
      isOpen={show}
      onClose={onClose}
      title={sp?.title || `Quote #${sp?.id}` || "Quote Details"}
      subtitle={sp?.contact_name || sp?.contact_email || ""}
      email={sp?.contact_email || sp?.data?.email}
      phone={sp?.contact_phone || sp?.phone}
      senderName={sessionUser?.name || ""}
      senderEmail={sessionUser?.email || ""}
      record={
        {
          id: sp?.id,
          type: RECORD_TYPES.PROSPECT,
        } as any
      }
      avatar={{
        initials: getInitials(sp?.title || sp?.contact_name || "Q"),
        name: sp?.title || sp?.contact_name || "Quote",
        gradient: getRandomColor(sp?.title || ""),
      }}
      recordType="prospect"
      recordId={sp?.id ?? sp?.data?.id ?? undefined}
      resolveUserLabel={getNameByExtension}
      onNoteCreate={onNoteCreate}
      crmSummary={
        sp?.crm_summary ??
        sp?.data?.crm_summary ??
        (sp as any)?.data?.data?.crm_summary ??
        undefined
      }
      recordLink={{
        label: "View quote details",
        onClick: () => {
          const quoteId = Number(
            sp?.id ??
              sp?.data?.id ??
              (sp as any)?.data?.data?.id ??
              NaN,
          );
          if (!Number.isFinite(quoteId) || quoteId <= 0) return;
          onClose();
          router.push(`/crm/quotes/${quoteId}`);
        },
      }}
      actionsDropdown={{
        label: "Actions",
        items: [
          {
            label: "Edit Quote",
            onClick: () => {
              const id = sp?.id;
              if (!id) return;
              onClose();
              router.push(`/crm/quotes/${id}/edit`);
            },
          },
          {
            label: "Duplicate Quote",
            onClick: () => {
              onClose();
              onDuplicateQuote(sp);
            },
          },
          {
            label: "Send to Contact",
            onClick: () => {
              onClose();
              onSendToContact(sp);
            },
          },
          {
            label: "Delete",
            onClick: () => onDeleteData(sp),
          },
        ],
      }}
      sections={[
        {
          id: "about-quote",
          title: "About this quote",
          icon: Target,
          collapsible: true,
          defaultExpanded: true,
          actions: [
            {
              label: "Edit all properties",
              onClick: () => {
                const id = sp?.id;
                if (!id) return;
                onClose();
                router.push(`/crm/quotes/${id}/edit`);
              },
            },
          ],
          fields: [
            {
              label: "Quote Title",
              value: sp?.title || `Quote #${sp?.id}` || "N/A",
              copyable: true,
            },
            {
              label: "Amount",
              value:
                sp?.amount != null
                  ? `US$${Number(sp.amount).toLocaleString()}`
                  : "N/A",
              copyable: true,
            },
            {
              label: "Status",
              value: sp?.status || "N/A",
            },
            {
              label: "Signing Status",
              value: sp?.signing_status || "N/A",
            },
            {
              label: "View Count",
              value:
                sp?.view_count != null ? String(sp.view_count) : "0",
            },
            {
              label: "Contact Name",
              value: sp?.contact_name || "N/A",
              copyable: true,
              show: !!sp?.contact_name,
            },
            {
              label: "Contact Email",
              value: sp?.contact_email || sp?.data?.email || "N/A",
              type: "email",
              copyable: true,
              externalLink: (sp?.contact_email || sp?.data?.email)
                ? `mailto:${sp?.contact_email || sp?.data?.email}`
                : undefined,
              show: !!(sp?.contact_email || sp?.data?.email),
            },
            {
              label: "Contact Phone",
              value: sp?.contact_phone || sp?.phone || "N/A",
              type: "phone",
              copyable: true,
              externalLink: (sp?.contact_phone || sp?.phone)
                ? `tel:${sp?.contact_phone || sp?.phone}`
                : undefined,
              show: !!(sp?.contact_phone || sp?.phone),
            },
            {
              label: "Quote Owner",
              value: sp?.user_extension
                ? getNameByExtension(String(sp.user_extension))
                : "—",
              hasDetails: true,
              onDetailsClick: () => console.log("Show user details"),
            },
            {
              label: "Description",
              value: sp?.description || "N/A",
              show: !!sp?.description,
            },
            {
              label: "Created Date",
              value: sp?.created_at
                ? moment(sp.created_at).format("MMM DD, YYYY")
                : "N/A",
              type: "date",
            },
            {
              label: "Last Updated",
              value: sp?.updated_at
                ? moment(sp.updated_at).format("MMM DD, YYYY")
                : "N/A",
              type: "date",
            },
            {
              label: "Expiry Date",
              value: sp?.expiry_date
                ? moment(sp.expiry_date).format("MMM DD, YYYY")
                : "N/A",
              type: "date",
              show: !!sp?.expiry_date,
            },
          ],
        },
        {
          id: "recent-activities",
          title: "Recent activities",
          icon: History,
          collapsible: true,
          defaultExpanded: true,
          count: 0,
          emptyState: {
            icon: History,
            message: "No recent activities for this quote.",
            action: {
              label: "Log activity",
              onClick: () => {
                const id = sp?.id ?? sp?.data?.id ?? "";
                if (id) {
                  router.push(`/crm/quotes/${id}`);
                  onClose();
                }
              },
            },
          },
        },
        {
          id: "quote-history",
          title: "Quote History",
          icon: FileText,
          collapsible: true,
          defaultExpanded: true,
          emptyState: {
            icon: FileText,
            message: "No history available for this quote.",
            action: {
              label: "View details",
              onClick: () => sp?.id && onCallClick(sp),
            },
          },
        },
        {
          id: "notes",
          title: "Notes",
          icon: FileText,
          collapsible: true,
          defaultExpanded: true,
          count: 0,
          emptyState: {
            icon: FileText,
            message: "No notes added yet.",
            action: {
              label: "Add note",
              onClick: () => console.log("Add note"),
            },
          },
        },
      ]}
    />
  );
}
