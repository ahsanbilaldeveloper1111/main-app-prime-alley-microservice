import type { CrmDataItem, CrmDataMetrics } from "@utils/crm";
import type { CrmListPageScopedLayoutStylesConfig } from "@crm/shared/CrmListPageScopedLayoutStyles";
import type { TableColumn } from "@components/GenericTable";
import type { CrmQuotesSidebarProspectLike } from "@crm/billing-quotes/crmQuotesListPageShared";
import {
  selectCrmQuotesSidebarRecordEmail,
  selectCrmQuotesSidebarRecordId,
  selectCrmQuotesSidebarRecordName,
  selectCrmQuotesSidebarRecordPhone,
} from "@crm/billing-quotes/crmQuotesListPageShared";

function asQuotesSidebarRecord(
  record: unknown,
): CrmQuotesSidebarProspectLike | null | undefined {
  return record as CrmQuotesSidebarProspectLike | null | undefined;
}
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

const CRM_PERSON_LIST_SHARED_SCOPED_LAYOUT: CrmListPageScopedLayoutStylesConfig =
  {
    tableWrapperClass: "prospects-table-wrapper",
    scrollableContentClass: "prospects-scrollable-content",
    pageContainerClass: "prospects-page-container",
    contentAreaClass: "prospects-content-area",
    includePhoneInputStyles: true,
  };

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
  /** Primary localStorage key for Column Editor selections (per entity). */
  selectedColumnsStorageKey: string;
  /** Older keys to read once for migration (e.g. shared `crmDataSelectedColumns`). */
  selectedColumnsLegacyStorageKeys: readonly string[];
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
      sortBy: string;
      sortOrder: "asc" | "desc";
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
  /** When false, the Kanban board toggle and board layout are hidden (table only). */
  enableBoardView: boolean;
  /**
   * When set, the list preview sidebar id is stored in localStorage so returning from the
   * detail page (browser back) can reopen the same preview.
   */
  previewPersistenceLocalStorageKey: string;
};

type PersonListIntegrationsSlice = Pick<
  CrmProspectsContactsListPageConfig,
  | "buildListCrmDataParams"
  | "buildExportCrmDataParams"
  | "computeAdvancedFiltersApplied"
  | "buildExportHeaders"
  | "buildCsvContent"
  | "validateUploadCsvFile"
  | "buildSourceFileSelectOptions"
  | "selectSidebarRecordId"
  | "selectSidebarRecordName"
  | "selectSidebarRecordPhone"
  | "selectSidebarRecordEmail"
  | "augmentTableColumns"
  | "navigationDetailPath"
  | "listLoadFailedMessage"
>;

const CRM_PROSPECTS_LIST_INTEGRATIONS: PersonListIntegrationsSlice = {
  buildListCrmDataParams: buildProspectsListCrmDataParams,
  buildExportCrmDataParams: buildProspectsExportCrmDataParams,
  computeAdvancedFiltersApplied: computeProspectsAdvancedFiltersApplied,
  buildExportHeaders: buildProspectsExportHeaders,
  buildCsvContent: buildProspectsCsvContent,
  validateUploadCsvFile: validateProspectsUploadCsvFile,
  buildSourceFileSelectOptions: buildProspectsSourceFileSelectOptions,
  selectSidebarRecordId: (record) =>
    selectCrmQuotesSidebarRecordId(asQuotesSidebarRecord(record)),
  selectSidebarRecordName: (record) =>
    selectCrmQuotesSidebarRecordName(asQuotesSidebarRecord(record)),
  selectSidebarRecordPhone: (record) =>
    selectCrmQuotesSidebarRecordPhone(asQuotesSidebarRecord(record)),
  selectSidebarRecordEmail: (record) =>
    selectCrmQuotesSidebarRecordEmail(asQuotesSidebarRecord(record)),
  augmentTableColumns: augmentProspectsSourceFileColumn,
  navigationDetailPath: (row) =>
    `/crm/detailspage?type=prospect&id=${(row as { id?: number })?.id ?? ""}`,
  listLoadFailedMessage: "Failed to load prospect",
};

const CRM_CONTACTS_LIST_INTEGRATIONS: PersonListIntegrationsSlice = {
  buildListCrmDataParams: buildContactsListCrmDataParams,
  buildExportCrmDataParams: buildContactsExportCrmDataParams,
  computeAdvancedFiltersApplied: computeContactsAdvancedFiltersApplied,
  buildExportHeaders: buildContactsExportHeaders,
  buildCsvContent: buildContactsCsvContent,
  validateUploadCsvFile: validateContactsUploadCsvFile,
  buildSourceFileSelectOptions: buildContactsSourceFileSelectOptions,
  selectSidebarRecordId: (record) =>
    selectCrmContactsSidebarRecordId(asQuotesSidebarRecord(record)),
  selectSidebarRecordName: (record) =>
    selectCrmContactsSidebarRecordName(asQuotesSidebarRecord(record)),
  selectSidebarRecordPhone: (record) =>
    selectCrmContactsSidebarRecordPhone(asQuotesSidebarRecord(record)),
  selectSidebarRecordEmail: (record) =>
    selectCrmContactsSidebarRecordEmail(asQuotesSidebarRecord(record)),
  augmentTableColumns: identityColumns,
  navigationDetailPath: (row) =>
    `/crm/contacts/contacts-detailpage?id=${(row as { id?: number })?.id ?? ""}`,
  listLoadFailedMessage: "Failed to load contact",
};

type CrmPersonListVariantUi = {
  operationsEntityName: "prospects" | "contacts";
  entityTitle: "Prospects" | "Contacts";
  entitySingular: "Prospect" | "Contact";
  assignmentModal: { title: string; desc: string };
  deleteModalCopy: {
    singleNamePrefix: string;
    itemTypeBulk: string;
    itemTypeSingle: string;
  };
  convertLeadToast: string;
  createLeadModalShowSuccessToast: boolean;
  selectedColumnsStorageKey: string;
  selectedColumnsLegacyStorageKeys: readonly string[];
  sidebar: CrmProspectsContactsListPageConfig["sidebar"];
  stats: CrmProspectsContactsListPageConfig["stats"];
  callRecordingExtras: CrmProspectsContactsListPageConfig["callRecordingExtras"];
};

function countProspectAuditTrail(record: unknown): number {
  if (!Array.isArray((record as { audit_trail?: unknown })?.audit_trail)) {
    return 0;
  }
  return (record as { audit_trail: unknown[] }).audit_trail.length;
}

const CRM_PROSPECTS_LIST_UI_VARIANT: CrmPersonListVariantUi = {
  operationsEntityName: "prospects",
  entityTitle: "Prospects",
  entitySingular: "Prospect",
  assignmentModal: {
    title: "Smart Prospect Distribution",
    desc: "Please fill the details below to smart prospect distribution.",
  },
  deleteModalCopy: {
    singleNamePrefix: "prospect entry",
    itemTypeBulk: "prospect entries",
    itemTypeSingle: "prospect entry",
  },
  convertLeadToast: "Prospect converted to lead successfully!",
  createLeadModalShowSuccessToast: false,
  selectedColumnsStorageKey: "crm-prospects-visible-columns-v1",
  selectedColumnsLegacyStorageKeys: [
    "crmDataSelectedColumns",
    "prospectsSelectedColumns",
  ],
  sidebar: {
    fallbackTitle: "Prospect Details",
    aboutSectionId: "about-prospect",
    aboutSectionTitle: "About this prospect",
    editActionLabel: "Edit Prospect",
    activitiesEmptyMessage: "No recent activities for this prospect.",
    activitiesCount: countProspectAuditTrail,
    buildLogActivityUrl: (id) =>
      `/crm/detailspage?type=prospect&id=${encodeURIComponent(String(id))}`,
    buildDetailUrlFromNumericId: (id) =>
      `/crm/detailspage?type=prospect&id=${id}`,
    ownerField: { hasDetails: false, onDetailsClick: () => {} },
  },
  stats: {
    allCardTitle: "All Prospects",
    subtitleAssignedUnassigned: () => "",
    convertedCardTitle: "Converted Prospects",
  },
  callRecordingExtras: {
    passDownloadProgressToSharedCallbacks: false,
    passPropsToViewModal: false,
  },
};

const CRM_CONTACTS_LIST_UI_VARIANT: CrmPersonListVariantUi = {
  operationsEntityName: "contacts",
  entityTitle: "Contacts",
  entitySingular: "Contact",
  assignmentModal: {
    title: "Smart Contact Distribution",
    desc: "Please fill the details below to smart contact distribution.",
  },
  deleteModalCopy: {
    singleNamePrefix: "contact entry",
    itemTypeBulk: "contact entries",
    itemTypeSingle: "contact entry",
  },
  convertLeadToast: "Contact converted to lead successfully!",
  createLeadModalShowSuccessToast: true,
  selectedColumnsStorageKey: "crm-contacts-visible-columns-v1",
  selectedColumnsLegacyStorageKeys: ["crmDataSelectedColumns"],
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
};

function buildCrmPersonListPageConfig(
  ui: CrmPersonListVariantUi,
  integrations: PersonListIntegrationsSlice,
  options?: { enableBoardView?: boolean },
): CrmProspectsContactsListPageConfig {
  const e = ui.operationsEntityName;
  const title = ui.entityTitle;
  const singular = ui.entitySingular;

  return {
    scopedLayout: CRM_PERSON_LIST_SHARED_SCOPED_LAYOUT,
    breadcrumbSubTitle: title,
    operationsEntityName: e,
    toolbar: {
      entity: e,
      searchPlaceholder: `Search ${e}...`,
      tabsDropdownLabel: title,
      allTabLabel: `All ${e}`,
    },
    addMenuButtonLabel: `Add ${e}`,
    tableCopy: {
      emptyMessage: `No ${e} found matching your criteria`,
      loadingMessage: `Loading ${e}...`,
    },
    uploadModalTitle: `Import Contacts - ${title}`,
    filterSidebar: {
      subtitle: `Filter ${e} by various criteria`,
      searchPlaceholder: "Search by name or phone...",
    },
    assignmentModal: {
      title: ui.assignmentModal.title,
      desc: ui.assignmentModal.desc,
      entityLabel: title,
    },
    deleteModalCopy: {
      singleNamePrefix: ui.deleteModalCopy.singleNamePrefix,
      bulkSelectedLabel: `selected ${e}`,
      itemTypeBulk: ui.deleteModalCopy.itemTypeBulk,
      itemTypeSingle: ui.deleteModalCopy.itemTypeSingle,
    },
    exportModal: {
      title: `Export ${title}`,
      subtitle: `Choose filters to define which ${e} are exported. Defaults match your current table view.`,
      fileNamePlaceholder: `${e}_2025-02-24`,
    },
    convertLeadToast: ui.convertLeadToast,
    createLeadModal: {
      showSuccessToast: ui.createLeadModalShowSuccessToast,
    },
    createContactSidebarEntityLabel: singular,
    selectedColumnsStorageKey: ui.selectedColumnsStorageKey,
    selectedColumnsLegacyStorageKeys: ui.selectedColumnsLegacyStorageKeys,
    sidebar: ui.sidebar,
    stats: ui.stats,
    callRecordingExtras: ui.callRecordingExtras,
    enableBoardView: options?.enableBoardView ?? true,
    previewPersistenceLocalStorageKey: `crm-${e}-list-preview-record-id`,
    ...integrations,
  };
}

export const CRM_PROSPECTS_LIST_PAGE_CONFIG = buildCrmPersonListPageConfig(
  CRM_PROSPECTS_LIST_UI_VARIANT,
  CRM_PROSPECTS_LIST_INTEGRATIONS,
  { enableBoardView: false },
);

export const CRM_CONTACTS_LIST_PAGE_CONFIG = buildCrmPersonListPageConfig(
  CRM_CONTACTS_LIST_UI_VARIANT,
  CRM_CONTACTS_LIST_INTEGRATIONS,
);
