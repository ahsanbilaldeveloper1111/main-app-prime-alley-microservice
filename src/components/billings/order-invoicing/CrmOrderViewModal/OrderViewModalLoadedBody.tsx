import React, { type CSSProperties } from "react";
import { OrderViewModalTabStrip } from "./OrderViewModalTabStrip";
import { OrderViewModalTabGeneral } from "./OrderViewModalTabGeneral";
import { OrderViewModalTabLeadDeal } from "./OrderViewModalTabLeadDeal";
import { OrderViewModalTabAdditional } from "./OrderViewModalTabAdditional";
import { OrderViewModalTabHistory } from "./OrderViewModalTabHistory";
import { OrderViewModalRightPanel } from "./OrderViewModalRightPanel";

const ORDER_VIEW_MODAL_STYLES = `
            .order-detail-filter-buttons {
              display: flex;
              flex-direction: row;
              align-items: center;
              gap: 12px;
              flex-wrap: wrap;
              margin-bottom: 0;
              padding: 0;
              width: 100%;
            }

            .order-detail-filter-button {
              display: flex;
              align-items: center;
              gap: 8px;
              padding: 10px 20px;
              border-radius: 8px;
              border: 1px solid;
              font-weight: 500;
              font-size: 14px;
              cursor: pointer;
              transition: all 0.2s ease;
              background: white;
              white-space: nowrap;
            }

            .order-detail-filter-button:hover {
              transform: translateY(-1px);
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }

            .order-detail-filter-button.active {
              color: white;
            }

            .order-detail-filter-button.active .filter-icon {
              color: white;
            }

            .order-detail-filter-button:not(.active) .filter-icon {
              color: inherit;
            }

            .filter-icon {
              width: 18px;
              height: 18px;
              flex-shrink: 0;
            }

            .order-view-quick-info-card:hover {
              transform: translateY(-4px);
              box-shadow: 0 8px 16px rgba(245, 158, 11, 0.15);
            }

            .order-view-modal-close-btn:hover {
              background: rgba(255,255,255,0.25);
              transform: scale(1.05);
            }

            .order-view-edit-order-btn:hover {
              border-color: #f59e0b;
              background: #fffbeb;
              transform: translateX(4px);
            }

            .order-view-footer-close-btn:hover {
              border-color: #f59e0b !important;
              color: #f59e0b !important;
              background: #fffbeb !important;
            }
`;

const mainGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 360px",
  minHeight: "500px",
};

const leftPanelStyle: CSSProperties = {
  padding: "32px",
  borderRight: "1px solid #e5e7eb",
};

export function OrderViewModalLoadedBody(props: {
  readonly activeTab: string;
  readonly onActiveTabChange: (tab: string) => void;
  readonly viewingOrder: any;
  readonly relatedDeal: any;
  readonly relatedLead: any;
  readonly extensions: any[];
  readonly session: { user?: { permissions?: string[] } } | null;
  readonly ignoredHistoryKeys: Set<string>;
  readonly onHide: () => void;
}): React.ReactElement {
  const {
    activeTab,
    onActiveTabChange,
    viewingOrder,
    relatedDeal,
    relatedLead,
    extensions,
    session,
    ignoredHistoryKeys,
    onHide,
  } = props;

  return (
    <>
      <style
        dangerouslySetInnerHTML={{ __html: ORDER_VIEW_MODAL_STYLES }}
      />
      <div style={mainGridStyle}>
        <div style={leftPanelStyle}>
          <OrderViewModalTabStrip
            activeTab={activeTab}
            onActiveTabChange={onActiveTabChange}
          />
          {activeTab === "tab1" && (
            <OrderViewModalTabGeneral viewingOrder={viewingOrder} />
          )}
          {activeTab === "tab2" && (
            <OrderViewModalTabLeadDeal
              relatedDeal={relatedDeal}
              relatedLead={relatedLead}
              extensions={extensions}
            />
          )}
          {activeTab === "additional-info" && (
            <OrderViewModalTabAdditional
              viewingOrder={viewingOrder}
              extensions={extensions}
            />
          )}
          {activeTab === "history" && (
            <OrderViewModalTabHistory
              viewingOrder={viewingOrder}
              ignoredHistoryKeys={ignoredHistoryKeys}
            />
          )}
        </div>
        <OrderViewModalRightPanel
          viewingOrder={viewingOrder}
          session={session}
          onHide={onHide}
        />
      </div>
    </>
  );
}
