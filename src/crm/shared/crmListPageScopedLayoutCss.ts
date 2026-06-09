export type CrmListPageScopedLayoutStylesConfig = {
  tableWrapperClass: string;
  scrollableContentClass: string;
  pageContainerClass: string;
  contentAreaClass: string;
  includePhoneInputStyles?: boolean;
  /** When true, page grows with content (e.g. table + charts) instead of locking to viewport height. */
  autoHeight?: boolean;
};

const SHARED_TIMELINE_AND_ROW_CSS = `
        .timeline-line {
          position: relative;
          height: 2px;
          background: #e9ecef;
          margin-top: 10px;
        }
        .timeline-line::after {
          content: "";
          position: absolute;
          top: -8px;
          left: 0;
          width: 2px;
          height: 18px;
          background: #e9ecef;
        }
        .timeline-item:last-child .timeline-line {
          display: none;
        }
        .generic-table-row.clickable {
          cursor: pointer;
        }
`;

const PHONE_INPUT_CSS = `
        .contact-form-phone-input-wrapper .PhoneInput {
          border: 1px solid #8a8a8a !important;
          border-radius: 4px;
          padding: 10px 12px;
          font-size: 14px;
          box-shadow: none !important;
        }
        .contact-form-phone-input-wrapper .PhoneInput:focus-within {
          border-color: #0091ae !important;
          outline: none;
          box-shadow: none !important;
        }
`;

function buildTableWrapperOverflowCss(tableWrapperClass: string, autoHeight: boolean): string {
  return (
    "\n        ." +
    tableWrapperClass +
    ` {
          width: 100%;
          overflow: ${autoHeight ? "visible" : "hidden"};
        }`
  );
}

function buildPageShellLayoutCss(config: CrmListPageScopedLayoutStylesConfig): string {
  if (config.autoHeight) {
    return (
      `
        .` +
      config.pageContainerClass +
      ` {
          display: flex;
          flex-direction: column;
          min-height: calc(100vh - 74px);
          height: auto;
          overflow: visible;
        }
        
        .` +
      config.contentAreaClass +
      ` {
          flex: 1 1 auto;
          overflow: visible;
          display: flex;
          flex-direction: column;
        }
        
        .` +
      config.scrollableContentClass +
      ` {
          flex: 1 1 auto;
          height: auto;
          overflow-y: auto;
          overflow-x: hidden;
        }
        `
    );
  }

  return (
    `
        /* Page layout for full height */
        .` +
    config.pageContainerClass +
    ` {
          display: flex;
          flex-direction: column;
          height: calc(100vh - 74px);
          overflow: hidden;
        }
        
        .` +
    config.contentAreaClass +
    ` {
          flex: 1;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        
        .` +
    config.scrollableContentClass +
    ` {
          flex: 1;
          height: 100%;
          overflow-y: auto;
          overflow-x: hidden;
        }
        `
  );
}

export function buildCrmListPageScopedLayoutCss(
  config: CrmListPageScopedLayoutStylesConfig,
): string {
  const tw = config.tableWrapperClass;
  const phone = config.includePhoneInputStyles ? PHONE_INPUT_CSS : "";
  const autoHeight = Boolean(config.autoHeight);

  return (
    buildTableWrapperOverflowCss(tw, autoHeight) +
    `
        .` +
    tw +
    ` .table-responsive {
          width: 100%;
          overflow-x: auto;
          overflow-y: visible;
          -webkit-overflow-scrolling: touch;
        }
        .` +
    tw +
    ` .table-responsive table {
          width: 100%;
          table-layout: auto;
          margin-bottom: 0;
        }
        .` +
    tw +
    ` .table-responsive table th,
        .` +
    tw +
    ` .table-responsive table td {
          padding: 12px 16px;
          vertical-align: middle;
        }
        .` +
    tw +
    ` .table-responsive table td:last-child,
        .` +
    tw +
    ` .table-responsive table th:last-child {
          max-width: none;
        }
        .` +
    tw +
    ` .table-responsive table td[style*="width"],
        .` +
    tw +
    ` .table-responsive table th[style*="width"] {
          max-width: none;
        }
        ` +
    SHARED_TIMELINE_AND_ROW_CSS +
    buildPageShellLayoutCss(config) +
    phone
  );
}
