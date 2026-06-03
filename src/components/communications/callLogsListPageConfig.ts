import type { CrmListPageScopedLayoutStylesConfig } from "@crm/shared/CrmListPageScopedLayoutStyles";
import type { ToolbarTabsDropdownItem } from "@components/GenericTable";

/** Toolbar tab row — `tabsDropdownLabel` is fallback when route does not match an item. */
export const CALL_LOGS_TOOLBAR = {
  tabsDropdownLabel: "Call Logs",
  allTabLabel: "All call logs",
  searchPlaceholder: "Search call logs...",
} as const;

export const CALL_RECORDINGS_TOOLBAR = {
  tabsDropdownLabel: "Call Recordings",
  allTabLabel: "All call recordings",
  searchPlaceholder: "Search by username, extension, phone...",
} as const;

export const CALL_ANALYSIS_TOOLBAR = {
  tabsDropdownLabel: "Call Analysis",
  allTabLabel: "All call analysis",
  searchPlaceholder: "Search call recordings...",
} as const;

export const TEXT_MESSAGES_TOOLBAR = {
  allTabLabel: "All text messages",
} as const;

/** Call logs toolbar entity dropdown — call logs, recordings, and analysis only. */
export const COMMUNICATIONS_TABS_DROPDOWN_ITEMS: ToolbarTabsDropdownItem[] = [
  { label: "Call Logs", href: "/communications/call-logs" },
  { label: "Call Recordings", href: "/communications/recordings" },
  { label: "Call Analysis", href: "/communications/call-analysis" },
];

/** Reuse prospects list layout class names so `custom.scss` page chrome applies. */
export const COMMUNICATIONS_LIST_SCOPED_LAYOUT: CrmListPageScopedLayoutStylesConfig =
  {
    tableWrapperClass: "prospects-table-wrapper",
    scrollableContentClass: "prospects-scrollable-content",
    pageContainerClass: "prospects-page-container",
    contentAreaClass: "prospects-content-area",
    includePhoneInputStyles: false,
  };

export const CALL_LOGS_LIST_SCOPED_LAYOUT = COMMUNICATIONS_LIST_SCOPED_LAYOUT;

function communicationsTableWrapperCss(wrapperClass: string): string {
  return `
  .prospects-table-wrapper.${wrapperClass} .generic-table-container {
    overflow-x: hidden;
    overflow-y: visible;
  }

  .prospects-table-wrapper.${wrapperClass} .gt-toolbar-main {
    border-bottom: 1px solid #ccc;
  }

  .prospects-table-wrapper.${wrapperClass} .gt-filter-pills {
    border-left: 1px solid #ccc;
    border-right: 1px solid #ccc;
    border-bottom: 1px solid #ccc;
    overflow-x: auto;
    overflow-y: visible;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: thin;
    flex-wrap: nowrap !important;
    flex-direction: row !important;
    align-items: center !important;
    padding-bottom: 10px;
    gap: 8px;
  }

  .prospects-table-wrapper.${wrapperClass} .gt-filter-pills > .d-flex.align-items-center.gap-2.flex-wrap {
    flex-wrap: nowrap !important;
    align-items: center !important;
    gap: 8px !important;
    min-width: max-content;
  }

  .prospects-table-wrapper.${wrapperClass} .gt-filter-pills-right-actions {
    flex-shrink: 0;
    margin-left: auto;
    position: sticky;
    right: 0;
    z-index: 4;
    padding-left: 12px;
    background-color: #ffffff;
    box-shadow: -12px 0 14px -10px rgba(0, 0, 0, 0.18);
  }

  @media (max-width: 992px) {
    .prospects-table-wrapper.${wrapperClass} .gt-toolbar-tabs-section > .d-flex {
      flex-wrap: wrap;
      row-gap: 8px;
    }
  }
`;
}

export const CALL_LOGS_EXTRA_LAYOUT_CSS = `
${communicationsTableWrapperCss("call-logs-table-wrapper")}

  .prospects-content-area .communications-date-range-banner {
    margin-bottom: 12px;
  }
`;

export const CALL_RECORDINGS_EXTRA_LAYOUT_CSS = `
${communicationsTableWrapperCss("call-recordings-table-wrapper")}

  .prospects-content-area .communications-date-range-banner {
    margin-bottom: 12px;
  }

  .call-recordings-table-wrapper .gt-toolbar-tabs-section .gt-tab-button {
    margin-left: 12px;
  }
`;

export const CALL_ANALYSIS_EXTRA_LAYOUT_CSS = `
${communicationsTableWrapperCss("call-analysis-table-wrapper")}

  .prospects-content-area .communications-date-range-banner {
    margin-bottom: 12px;
  }
`;

export const TEXT_MESSAGES_EXTRA_LAYOUT_CSS = `
${communicationsTableWrapperCss("text-messages-table-wrapper")}

  .text-messages-table-wrapper.text-messages-page .gt-toolbar-tabs-section .gt-tab-button {
    margin-left: 12px;
  }

  .text-messages-table-wrapper.text-messages-page .generic-table-responsive {
    border: none !important;
  }
`;

export const CALL_LOGS_BREADCRUMB = {
  mainTitle: "Communications",
  mainLink: "/communications/dashboard",
  subTitle: "Call Logs",
} as const;

export const CALL_RECORDINGS_BREADCRUMB = {
  mainTitle: "Communications",
  mainLink: "/communications/dashboard",
  subTitle: "Call Recordings",
} as const;

export const CALL_ANALYSIS_BREADCRUMB = {
  mainTitle: "Communications",
  mainLink: "/communications/dashboard",
  subTitle: "Call Analysis",
} as const;

export const WALLBOARD_BREADCRUMB = {
  mainTitle: "Communications",
  mainLink: "/communications/dashboard",
  subTitle: "Live Calls",
} as const;

export const TEXT_MESSAGES_BREADCRUMB = {
  mainTitle: "Communications",
  mainLink: "/communications/dashboard",
  subTitle: "Text Messages",
} as const;


