import React from "react";
import {
  ShoppingBag,
  FileText,
  Info,
  History,
} from "lucide-react";

export function OrderViewModalTabStrip(props: {
  readonly activeTab: string;
  readonly onActiveTabChange: (tab: string) => void;
}): React.ReactElement {
  const { activeTab, onActiveTabChange } = props;
  return (
    <div className="order-detail-filter-buttons mb-4">
      <button
        type="button"
        className={`order-detail-filter-button ${activeTab === "tab1" ? "active" : ""}`}
        onClick={() => onActiveTabChange("tab1")}
        style={{
          backgroundColor: activeTab === "tab1" ? "#f59e0b" : "white",
          borderColor: "#f59e0b",
          color: activeTab === "tab1" ? "white" : "#f59e0b",
        }}
      >
        <ShoppingBag className="filter-icon" size={18} />
        <span>General Information</span>
      </button>
      <button
        type="button"
        className={`order-detail-filter-button ${activeTab === "tab2" ? "active" : ""}`}
        onClick={() => onActiveTabChange("tab2")}
        style={{
          backgroundColor: activeTab === "tab2" ? "#f59e0b" : "white",
          borderColor: "#f59e0b",
          color: activeTab === "tab2" ? "white" : "#f59e0b",
        }}
      >
        <FileText className="filter-icon" size={18} />
        <span>Lead/Deal Information</span>
      </button>
      <button
        type="button"
        className={`order-detail-filter-button ${activeTab === "additional-info" ? "active" : ""}`}
        onClick={() => onActiveTabChange("additional-info")}
        style={{
          backgroundColor:
            activeTab === "additional-info" ? "#f59e0b" : "white",
          borderColor: "#f59e0b",
          color: activeTab === "additional-info" ? "white" : "#f59e0b",
        }}
      >
        <Info className="filter-icon" size={18} />
        <span>Additional Information</span>
      </button>
      <button
        type="button"
        className={`order-detail-filter-button ${activeTab === "history" ? "active" : ""}`}
        onClick={() => onActiveTabChange("history")}
        style={{
          backgroundColor: activeTab === "history" ? "#f59e0b" : "white",
          borderColor: "#f59e0b",
          color: activeTab === "history" ? "white" : "#f59e0b",
        }}
      >
        <History className="filter-icon" size={18} />
        <span>History</span>
      </button>
    </div>
  );
}
