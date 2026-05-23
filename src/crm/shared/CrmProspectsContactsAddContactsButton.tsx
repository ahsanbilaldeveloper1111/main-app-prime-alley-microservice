import React, { type RefObject } from "react";
import { ChevronDown, Trash2 } from "lucide-react";
import {
  createEmptyCrmListContactFormState,
  resolveDefaultContactOwnerExtension,
  type CrmExtensionLikeForOwnerDefault,
  type CrmListContactFormState,
} from "@utils/crmContactFormFromCrmItem";
import type { CrmProspectsContactsListPageConfig } from "@crm/shared/crmProspectsContactsListPageConfig";
import { HEADER_CONSTANTS } from "@constants/headerConstants";

const { PERMISSIONS } = HEADER_CONSTANTS;

export type CrmProspectsContactsAddContactsButtonProps = Readonly<{
  addContactsRef: RefObject<HTMLDivElement | null>;
  session: {
    user?: {
      permissions?: string[];
      phone?: string | number | null;
      extension?: string | number | null;
    };
  } | null;
  extensions: readonly CrmExtensionLikeForOwnerDefault[];
  config: CrmProspectsContactsListPageConfig;
  selectedItems: unknown[];
  showAddContactsDropdown: boolean;
  setShowAddContactsDropdown: (open: boolean) => void;
  setEditingContactId: (id: number | null) => void;
  setContactForm: React.Dispatch<React.SetStateAction<CrmListContactFormState>>;
  setShowCreateContactSidebar: (open: boolean) => void;
  setShowUploadModal: (open: boolean) => void;
  setDeleteModalMode: (mode: "single" | "bulk" | null) => void;
  setShowDeleteModal: (open: boolean) => void;
}>;

export function CrmProspectsContactsAddContactsButton({
  addContactsRef,
  session,
  extensions,
  config,
  selectedItems,
  showAddContactsDropdown,
  setShowAddContactsDropdown,
  setEditingContactId,
  setContactForm,
  setShowCreateContactSidebar,
  setShowUploadModal,
  setDeleteModalMode,
  setShowDeleteModal,
}: CrmProspectsContactsAddContactsButtonProps) {
  const userPermissions = session?.user?.permissions ?? [];
  const canCreate = userPermissions.includes(
    PERMISSIONS.CREATE_CRM_DATA_MANAGEMENT,
  );
  const canBulkDelete =
    userPermissions.includes(PERMISSIONS.DELETE_CRM_DATA_MANAGEMENT) &&
    selectedItems.length > 0;

  if (!canCreate && !canBulkDelete) return null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
      }}
      ref={addContactsRef}
    >
      {canBulkDelete && (
        <button
          type="button"
          onClick={() => {
            setDeleteModalMode("bulk");
            setShowDeleteModal(true);
          }}
          style={{
            padding: "9px 13px",
            backgroundColor: "#dc3545",
            color: "#ffffff",
            border: "none",
            borderRadius: "4px",
            fontSize: "12px",
            fontWeight: "500",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#c82333";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#dc3545";
          }}
        >
          <Trash2 size={16} />
          Delete ({selectedItems.length})
        </button>
      )}
      {canCreate && (
      <div style={{ width: "146px" }}>
        <button
          onClick={() => setShowAddContactsDropdown(!showAddContactsDropdown)}
          style={{
            padding: "9px 13px",
            backgroundColor: "#000000",
            color: "#ffffff",
            border: "none",
            borderRadius: "4px",
            fontSize: "12px",
            fontWeight: "500",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#0052A3";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#0066CC";
          }}
        >
          {config.addMenuButtonLabel}
          <ChevronDown size={16} />
        </button>

        {showAddContactsDropdown && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              right: 0,
              marginTop: "4px",
              backgroundColor: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "5px",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
              minWidth: "160px",
              zIndex: 1000,
              overflow: "hidden",
            }}
          >
            <button
              onClick={() => {
                setShowAddContactsDropdown(false);
                setEditingContactId(null);
                setContactForm(
                  createEmptyCrmListContactFormState("source_file", {
                    defaultContactOwner: resolveDefaultContactOwnerExtension(
                      session?.user,
                      extensions,
                    ),
                  }),
                );
                setShowCreateContactSidebar(true);
              }}
              style={{
                width: "100%",
                padding: "12px 16px",
                backgroundColor: "transparent",
                border: "none",
                textAlign: "left",
                fontSize: "14px",
                color: "#141414",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#f7fafc";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              Create new
            </button>
            <button
              onClick={() => {
                setShowAddContactsDropdown(false);
                setShowUploadModal(true);
              }}
              style={{
                width: "100%",
                padding: "12px 16px",
                backgroundColor: "transparent",
                border: "none",
                textAlign: "left",
                fontSize: "14px",
                color: "#d97706",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#f7fafc";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              Import
            </button>
          </div>
        )}
      </div>
      )}
    </div>
  );
}
