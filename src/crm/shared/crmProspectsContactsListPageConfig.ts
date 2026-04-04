import type { CrmDataItem, CrmDataMetrics } from "@utils/crm";
import type { CrmListPageScopedLayoutStylesConfig } from "@crm/shared/CrmListPageScopedLayoutStyles";
import type { TableColumn } from "@components/GenericTable";
import {
  selectCrmQuotesSidebarRecordEmail,
  selectCrmQuotesSidebarRecordId,
  selectCrmQuotesSidebarRecordName,
  selectCrmQuotesSidebarRecordPhone,
} from "@crm/billing-quotes/crmQuotesListPageShared";
import {
  selectCrmContactsSidebarRecordEmail,
  selectCrmContactsSidebarRecordId,
  selectCrmContactsSidebarRecordName,
  selectCrmContactsSidebarRecordPhone,
} from "@crm/contacts/crmContactsSidebarRecordSelectors";
import {
  buildContactsExportCrmDataParams,
  buildContactsListCrmDataParams,
  computeContactsAdvancedFiltersApplied,
} from "@crm/contacts/crmContactsCrmQueryParams";
import {
  buildContactsCsvContent,
  buildContactsExportHeaders,
  buildContactsSourceFileSelectOptions,
} from "@crm/contacts/crmContactsPageExportCsv";
import { validateContactsUploadCsvFile } from "@crm/contacts/crmContactsCsvValidation";
import {
  buildProspectsExportCrmDataParams,
  buildProspectsListCrmDataParams,
  computeProspectsAdvancedFiltersApplied,
} from "@crm/prospects/crmProspectsCrmQueryParams";
import {
  buildProspectsCsvContent,
  buildProspectsExportHeaders,
  buildProspectsSourceFileSelectOptions,
} from "@crm/prospects/crmProspectsPageExportCsv";
import { validateProspectsUploadCsvFile } from "@crm/prospects/crmProspectsCsvValidation";

function identityColumns(columns: TableColumn<any>[]) {
  return columns;
}

function augmentProspectsSourceFileColumn(
  columns: TableColumn<any>[],
): TableColumn<any>[] {
  return columns.map((col) =>
    col.key === "source_file"
      ? {
          ...col,
          accessor: (row: any) =>
            row.source_file || row.data?.source_file || "N/A",
        }
      : col,
  );
}

export type CrmProspectsContactsListPageConfig = {
  scopedLayout: CrmListPageScopedLayoutStylesConfig;
  breadcrumbSubTitle: string;
  operationsEntityName: "prospects" | "contacts";
  toolbar: {
    entity: string;
    searchPlaceholder: string;
    tabsDropdownLabel: string;
    allTabLabel: string;
  };
  addMenuButtonLabel: string;
  tableCopy: {
    emptyMessage: string;
    loadingMessage: string;
  };
  uploadModalTitle: string;
  filterSidebar: {
    subtitle: string;
    searchPlaceholder: string;
  };
  assignmentModal: {
    title: string;
    desc: string;
    entityLabel: string;
  };
  deleteModalCopy: {
    singleNamePrefix: string;
    bulkSelectedLabel: string;
    itemTypeBulk: string;
    itemTypeSingle: string;
  };
  exportModal: {
    title: string;
    subtitle: string;
    fileNamePlaceholder: string;
  };
  convertLeadToast: string;
  createLeadModal: {
    showSuccessToast: boolean;
  };
  createContactSidebarEntityLabel: string;
  /** Prospects: `globalThis` guard; contacts: `window` check only. */
  columnEditorLocalStorage: "globalThis" | "window";
  sidebar: {
    fallbackTitle: string;
    aboutSectionId: string;
    aboutSectionTitle: string;
    editActionLabel: string;
    activitiesEmptyMessage: string;
    activitiesCount: (record: unknown) => number;
    buildLogActivityUrl: (rawId: string | number) => string;
    buildDetailUrlFromNumericId: (id: number) => string;
    ownerField: {
      hasDetails: boolean;
      onDetailsClick: () => void;
    };
  };
  stats: {
    allCardTitle: string;
    subtitleAssignedUnassigned: (m: CrmDataMetrics) => string;
    convertedCardTitle: string;
  };
  callRecordingExtras: {
    passDownloadProgressToSharedCallbacks: boolean;
    passPropsToViewModal: boolean;
  };
  buildListCrmDataParams: (
    filters: Record<string, any>,
    pagination: {
      currentPage: number;
      rowsPerPage: number;
      sortColumn: string;
      sortDirection: string;
    },
    overrides?: { page?: number; per_page?: number },
  ) => Record<string, any>;
  buildExportCrmDataParams: (
    filters: Record<string, any>,
    overrides?: { page?: number; per_page?: number },
  ) => Record<string, any>;
  computeAdvancedFiltersApplied: (filters: Record<string, any>) => boolean;
  buildExportHeaders: (data: CrmDataItem[]) => {
    headers: string[];
    nestedDataKeysSet: Set<string>;
  };
  buildCsvContent: (
    headers: string[],
    data: CrmDataItem[],
    nestedDataKeysSet: Set<string>,
  ) => string;
  validateUploadCsvFile: (file: File) => {
    isValid: boolean;
    errors: string[];
  };
  buildSourceFileSelectOptions: (
    dataList: CrmDataItem[],
  ) => { value: string; label: string }[];
  selectSidebarRecordId: (record: unknown) => number;
  selectSidebarRecordName: (record: unknown) => string;
  selectSidebarRecordPhone: (record: unknown) => string;
  selectSidebarRecordEmail: (record: unknown) => string;
  augmentTableColumns: (columns: TableColumn<any>[]) => TableColumn<any>[];
  navigationDetailPath: (row: unknown) => string;
  listLoadFailedMessage: string;
};

export const CRM_PROSPECTS_LIST_PAGE_CONFIG: CrmProspectsContactsListPageConfig =
  {
    scopedLayout: {
      tableWrapperClass: "prospects-table-wrapper",
      scrollableContentClass: "prospects-scrollable-content",
      pageContainerClass: "prospects-page-container",
      contentAreaClass: "prospects-content-area",
      includePhoneInputStyles: true,
    },
    breadcrumbSubTitle: "Prospects",
    operationsEntityName: "prospects",
    toolbar: {
      entity: "prospects",
      searchPlaceholder: "Search prospects...",
      tabsDropdownLabel: "Prospects",
      allTabLabel: "All prospects",
    },
    addMenuButtonLabel: "Add prospects",
    tableCopy: {
      emptyMessage: "No prospects found matching your criteria",
      loadingMessage: "Loading prospects...",
    },
    uploadModalTitle: "Import Contacts - Prospects",
    filterSidebar: {
      subtitle: "Filter prospects by various criteria",
      searchPlaceholder: "Search by name or phone...",
    },
    assignmentModal: {
      title: "Smart Prospect Distribution",
      desc: "Please fill the details below to smart prospect distribution.",
      entityLabel: "Prospects",
    },
    deleteModalCopy: {
      singleNamePrefix: "prospect entry",
      bulkSelectedLabel: "selected prospects",
      itemTypeBulk: "prospect entries",
      itemTypeSingle: "prospect entry",
    },
    exportModal: {
      title: "Export Prospects",
      subtitle:
        "Choose filters to define which prospects are exported. Defaults match your current table view.",
      fileNamePlaceholder: "prospects_2025-02-24",
    },
    convertLeadToast: "Prospect converted to lead successfully!",
    createLeadModal: {
      showSuccessToast: false,
    },
    createContactSidebarEntityLabel: "Prospect",
    columnEditorLocalStorage: "globalThis",
    sidebar: {
      fallbackTitle: "Prospect Details",
      aboutSectionId: "about-prospect",
      aboutSectionTitle: "About this prospect",
      editActionLabel: "Edit Prospect",
      activitiesEmptyMessage: "No recent activities for this prospect.",
      activitiesCount: (record) =>
        Array.isArray((record as { audit_trail?: unknown })?.audit_trail)
          ? (record as { audit_trail: unknown[] }).audit_trail.length
          : 0,
      buildLogActivityUrl: (id) =>
        `/crm/detailspage?type=prospect&id=${encodeURIComponent(String(id))}`,
      buildDetailUrlFromNumericId: (id) =>
        `/crm/detailspage?type=prospect&id=${id}`,
      ownerField: {
        hasDetails: false,
        onDetailsClick: () => {},
      },
    },
    stats: {
      allCardTitle: "All Prospects",
      subtitleAssignedUnassigned: (m) =>
        `${m.assigned_records || 0} Assigned / ${m.unassigned_records || 0} Unassigned`,
      convertedCardTitle: "Converted Prospects",
    },
    callRecordingExtras: {
      passDownloadProgressToSharedCallbacks: false,
      passPropsToViewModal: false,
    },
    buildListCrmDataParams: buildProspectsListCrmDataParams,
    buildExportCrmDataParams: buildProspectsExportCrmDataParams,
    computeAdvancedFiltersApplied: computeProspectsAdvancedFiltersApplied,
    buildExportHeaders: buildProspectsExportHeaders,
    buildCsvContent: buildProspectsCsvContent,
    validateUploadCsvFile: validateProspectsUploadCsvFile,
    buildSourceFileSelectOptions: buildProspectsSourceFileSelectOptions,
    selectSidebarRecordId: selectCrmQuotesSidebarRecordId,
    selectSidebarRecordName: selectCrmQuotesSidebarRecordName,
    selectSidebarRecordPhone: selectCrmQuotesSidebarRecordPhone,
    selectSidebarRecordEmail: selectCrmQuotesSidebarRecordEmail,
    augmentTableColumns: augmentProspectsSourceFileColumn,
    navigationDetailPath: (row) =>
      `/crm/detailspage?type=prospect&id=${(row as { id?: number })?.id ?? ""}`,
    listLoadFailedMessage: "Failed to load prospect",
  };

export const CRM_CONTACTS_LIST_PAGE_CONFIG: CrmProspectsContactsListPageConfig =
  {
    scopedLayout: {
      tableWrapperClass: "prospects-table-wrapper",
      scrollableContentClass: "prospects-scrollable-content",
      pageContainerClass: "prospects-page-container",
      contentAreaClass: "prospects-content-area",
      includePhoneInputStyles: true,
    },
    breadcrumbSubTitle: "Contacts",
    operationsEntityName: "contacts",
    toolbar: {
      entity: "contacts",
      searchPlaceholder: "Search contacts...",
      tabsDropdownLabel: "Contacts",
      allTabLabel: "All contacts",
    },
    addMenuButtonLabel: "Add contacts",
    tableCopy: {
      emptyMessage: "No contacts found matching your criteria",
      loadingMessage: "Loading contacts...",
    },
    uploadModalTitle: "Import Contacts - Contacts",
    filterSidebar: {
      subtitle: "Filter contacts by various criteria",
      searchPlaceholder: "Search by name or phone...",
    },
    assignmentModal: {
      title: "Smart Contact Distribution",
      desc: "Please fill the details below to smart contact distribution.",
      entityLabel: "Contacts",
    },
    deleteModalCopy: {
      singleNamePrefix: "contact entry",
      bulkSelectedLabel: "selected contacts",
      itemTypeBulk: "contact entries",
      itemTypeSingle: "contact entry",
    },
    exportModal: {
      title: "Export Contacts",
      subtitle:
        "Choose filters to define which contacts are exported. Defaults match your current table view.",
      fileNamePlaceholder: "contacts_2025-02-24",
    },
    convertLeadToast: "Contact converted to lead successfully!",
    createLeadModal: {
      showSuccessToast: true,
    },
    createContactSidebarEntityLabel: "Contact",
    columnEditorLocalStorage: "window",
    sidebar: {
      fallbackTitle: "Contact Details",
      aboutSectionId: "about-contact",
      aboutSectionTitle: "About this contact",
      editActionLabel: "Edit Contact",
      activitiesEmptyMessage: "No recent activities for this contact.",
      activitiesCount: () => 0,
      buildLogActivityUrl: (id) =>
        `/crm/contacts/contacts-detailpage?id=${encodeURIComponent(String(id))}`,
      buildDetailUrlFromNumericId: (id) =>
        `/crm/contacts/contacts-detailpage?id=${id}`,
      ownerField: {
        hasDetails: true,
        onDetailsClick: () => console.log("Show user details"),
      },
    },
    stats: {
      allCardTitle: "All Contacts",
      subtitleAssignedUnassigned: (m) =>
        `${m.assigned_records} Assigned / ${m.unassigned_records} Unassigned`,
      convertedCardTitle: "Converted Contacts",
    },
    callRecordingExtras: {
      passDownloadProgressToSharedCallbacks: true,
      passPropsToViewModal: true,
    },
    buildListCrmDataParams: buildContactsListCrmDataParams,
    buildExportCrmDataParams: buildContactsExportCrmDataParams,
    computeAdvancedFiltersApplied: computeContactsAdvancedFiltersApplied,
    buildExportHeaders: buildContactsExportHeaders,
    buildCsvContent: buildContactsCsvContent,
    validateUploadCsvFile: validateContactsUploadCsvFile,
    buildSourceFileSelectOptions: buildContactsSourceFileSelectOptions,
    selectSidebarRecordId: selectCrmContactsSidebarRecordId,
    selectSidebarRecordName: selectCrmContactsSidebarRecordName,
    selectSidebarRecordPhone: selectCrmContactsSidebarRecordPhone,
    selectSidebarRecordEmail: selectCrmContactsSidebarRecordEmail,
    augmentTableColumns: identityColumns,
    navigationDetailPath: (row) =>
      `/crm/contacts/contacts-detailpage?id=${(row as { id?: number })?.id ?? ""}`,
    listLoadFailedMessage: "Failed to load contact",
  };
