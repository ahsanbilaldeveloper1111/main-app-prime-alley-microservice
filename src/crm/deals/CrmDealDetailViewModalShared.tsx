import React from "react";
import { Handshake } from "lucide-react";
import {
  CrmModalCloseButton,
  CrmModalAvatar,
} from "../shared/CrmListViewDataModalPrimitives";

/** Injected once inside deal view modal body (shared by deals + approvals lists). */
export const DEAL_DETAIL_MODAL_BODY_FILTER_CSS = `
            .deal-detail-filter-buttons {
              display: flex;
              flex-direction: row;
              align-items: center;
              gap: 12px;
              flex-wrap: wrap;
              margin-bottom: 0;
              padding: 0;
              width: 100%;
            }

            .deal-detail-filter-button {
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

            .deal-detail-filter-button:hover {
              transform: translateY(-1px);
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }

            .deal-detail-filter-button.active {
              color: white;
            }

            .deal-detail-filter-button.active .filter-icon {
              color: white;
            }

            .deal-detail-filter-button:not(.active) .filter-icon {
              color: inherit;
            }

            .filter-icon {
              width: 18px;
              height: 18px;
              flex-shrink: 0;
            }
          `;

export type CrmDealDetailViewModalHeaderProps = {
  onClose: () => void;
  dealName: string;
  stageName: string;
  valueDisplay: string;
  createdLabel: string;
};

export function CrmDealDetailViewModalHeader({
  onClose,
  dealName,
  stageName,
  valueDisplay,
  createdLabel,
}: Readonly<CrmDealDetailViewModalHeaderProps>) {
  const title = dealName || "";

  return (
    <div
      style={{
        background: "#fff",
        color: "black",
        padding: "24px 32px",
        position: "relative",
        borderTopLeftRadius: "12px",
        borderTopRightRadius: "12px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        borderBottom: "1px solid #ccc",
      }}
    >
      <CrmModalCloseButton onClick={onClose} />

      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <CrmModalAvatar name={title} fallback="D" background="#10b981" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2
            style={{
              margin: 0,
              fontWeight: 700,
              fontSize: "26px",
              textShadow: "0 2px 4px rgba(0,0,0,0.1)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {title}
          </h2>
          <div
            style={{
              marginTop: "6px",
              opacity: 0.95,
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap",
              color: "#000",
            }}
          >
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Handshake size={14} />
              {stageName}
            </span>
            <span>•</span>
            <span style={{ fontWeight: 600 }}>{valueDisplay}</span>
            <span>•</span>
            <span>Created {createdLabel}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
