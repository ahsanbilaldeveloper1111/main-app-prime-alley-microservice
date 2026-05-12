import React from "react";
import { Modal, Button, Badge } from "react-bootstrap";
import { X, Phone as PhoneIcon } from "lucide-react";

import { CompanyViewEnrichmentBlock } from "@components/crm/CompanyViewEnrichmentBlock";
import { type CrmDataItem, type EnrichmentData } from "@utils/crm";

type SelectedDataItem = CrmDataItem;

type MaybeDateInput = string | Date | null | undefined;
type FormatPreviewDate = (value: MaybeDateInput) => string;

interface CompanyViewModalProps {
  show: boolean;
  selectedDataItem: SelectedDataItem | null | undefined;
  onClose: () => void;
  formatCrmPreviewDate: FormatPreviewDate;
}

interface CompanyDetailField {
  label: string;
  value: React.ReactNode;
  key: string;
}

const labelStyle: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: 700,
  color: "#6b7280",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const valueStyle: React.CSSProperties = {
  fontSize: "15px",
  color: "#1f2937",
  fontWeight: 500,
};

const headerWrapperStyle: React.CSSProperties = {
  background: "#fff",
  color: "black",
  padding: "24px 32px",
  position: "relative",
  borderTopLeftRadius: "12px",
  borderTopRightRadius: "12px",
  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
  borderBottom: "1px solid #ccc",
};

const closeButtonStyle: React.CSSProperties = {
  position: "absolute",
  top: "16px",
  right: "16px",
  background: "rgba(255,255,255,0.15)",
  backdropFilter: "blur(10px)",
  border: "1px solid rgba(255,255,255,0.2)",
  color: "black",
  width: "32px",
  height: "32px",
  borderRadius: "8px",
  cursor: "pointer",
  transition: "all 0.2s ease",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const avatarStyle: React.CSSProperties = {
  width: "64px",
  height: "64px",
  borderRadius: "16px",
  background: "#2563eb",
  backdropFilter: "blur(10px)",
  border: "2px solid rgba(255,255,255,0.3)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "28px",
  fontWeight: 700,
  flexShrink: 0,
  color: "#fff",
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontWeight: 700,
  fontSize: "26px",
  textShadow: "0 2px 4px rgba(0,0,0,0.1)",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const metaRowStyle: React.CSSProperties = {
  marginTop: "6px",
  opacity: 0.95,
  fontSize: "14px",
  display: "flex",
  alignItems: "center",
  gap: "12px",
  flexWrap: "wrap",
  color: "#000",
};

const metaInlineStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
};

const bodyStyle: React.CSSProperties = {
  padding: 0,
  maxHeight: "calc(90vh - 200px)",
  overflowY: "auto",
};

const sectionWrapperStyle: React.CSSProperties = {
  background: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: "12px",
  padding: "20px",
  marginBottom: "24px",
};

const sectionGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "140px 1fr",
  gap: "12px 24px",
  alignItems: "baseline",
};

const footerStyle: React.CSSProperties = {
  padding: "20px 32px",
  borderTop: "1px solid #e5e7eb",
  background: "white",
  borderBottomLeftRadius: "12px",
  borderBottomRightRadius: "12px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const footerCloseButtonStyle: React.CSSProperties = {
  padding: "10px 24px",
  borderRadius: "8px",
  fontWeight: 600,
  fontSize: "14px",
  border: "2px solid #e5e7eb",
  transition: "all 0.2s ease",
};

function getCompanyInitial(name: string | null | undefined): string {
  if (!name) return "P";
  return name.charAt(0).toUpperCase();
}

function getCompanyTitle(
  name: string | null | undefined,
  id: number | string | null | undefined,
): string {
  return name || `Company #${id}`;
}

function resolveEnrichmentBadgeVariant(status: string): string {
  if (status === "success") return "success";
  if (status === "failed") return "danger";
  return "secondary";
}

function getCompanyDataValue(
  data: SelectedDataItem["data"] | undefined,
  key: string,
): string | undefined {
  const value = (data as Record<string, unknown> | undefined)?.[key];
  return typeof value === "string" && value ? value : undefined;
}

function buildCompanyDetailFields(
  selectedDataItem: SelectedDataItem,
  formatDate: FormatPreviewDate,
): CompanyDetailField[] {
  const fields: CompanyDetailField[] = [];
  if (selectedDataItem.name) {
    fields.push({ key: "name", label: "Name", value: selectedDataItem.name });
  }
  if (selectedDataItem.phone) {
    fields.push({
      key: "phone",
      label: "Phone",
      value: selectedDataItem.phone,
    });
  }
  const email = getCompanyDataValue(selectedDataItem.data, "email");
  if (email) {
    fields.push({ key: "email", label: "Email", value: email });
  }
  const city = getCompanyDataValue(selectedDataItem.data, "city");
  if (city) fields.push({ key: "city", label: "City", value: city });
  const country = getCompanyDataValue(selectedDataItem.data, "country");
  if (country) fields.push({ key: "country", label: "Country", value: country });
  const industry = getCompanyDataValue(selectedDataItem.data, "industry");
  if (industry) {
    fields.push({ key: "industry", label: "Industry", value: industry });
  }
  const domain = getCompanyDataValue(selectedDataItem.data, "domain");
  if (domain) fields.push({ key: "domain", label: "Domain", value: domain });
  if (selectedDataItem.created_at) {
    fields.push({
      key: "created",
      label: "Created",
      value: formatDate(selectedDataItem.created_at),
    });
  }
  return fields;
}

function getEnrichmentStatus(data: SelectedDataItem["data"]): string | undefined {
  const raw = (data as Record<string, unknown> | undefined)?.enrichment_status;
  return typeof raw === "string" && raw ? raw : undefined;
}

function getEnrichmentData(
  data: SelectedDataItem["data"],
): EnrichmentData | undefined {
  const raw = (data as Record<string, unknown> | undefined)?.enrichment_data;
  return (raw as EnrichmentData | undefined) || undefined;
}

function handleCloseHover(event: React.MouseEvent<HTMLButtonElement>) {
  event.currentTarget.style.borderColor = "#2563eb";
  event.currentTarget.style.color = "#2563eb";
  event.currentTarget.style.background = "#eff6ff";
}

function handleCloseLeave(event: React.MouseEvent<HTMLButtonElement>) {
  event.currentTarget.style.borderColor = "#e5e7eb";
  event.currentTarget.style.color = "#6c757d";
  event.currentTarget.style.background = "white";
}

interface CompanyViewModalHeaderProps {
  selectedDataItem: SelectedDataItem;
  formatDate: FormatPreviewDate;
  onClose: () => void;
}

const CompanyViewModalHeader: React.FC<CompanyViewModalHeaderProps> = ({
  selectedDataItem,
  formatDate,
  onClose,
}) => {
  const enrichmentStatus = getEnrichmentStatus(selectedDataItem.data);
  return (
    <div style={headerWrapperStyle}>
      <button
        type="button"
        onClick={onClose}
        style={closeButtonStyle}
        aria-label="Close company details"
      >
        <X size={18} />
      </button>
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <div style={avatarStyle}>
          {getCompanyInitial(selectedDataItem.name)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={titleStyle}>
            {getCompanyTitle(selectedDataItem.name, selectedDataItem.id)}
          </h2>
          <div style={metaRowStyle}>
            {selectedDataItem.phone && (
              <>
                <span style={metaInlineStyle}>
                  <PhoneIcon size={14} />
                  {selectedDataItem.phone}
                </span>
                <span>•</span>
              </>
            )}
            <span>
              Added{" "}
              {selectedDataItem.created_at
                ? formatDate(selectedDataItem.created_at) || "N/A"
                : "N/A"}
            </span>
            {enrichmentStatus && (
              <>
                <span>•</span>
                <Badge
                  bg={resolveEnrichmentBadgeVariant(enrichmentStatus)}
                  style={{ fontWeight: 500 }}
                >
                  {enrichmentStatus}
                </Badge>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface CompanyDetailGridProps {
  fields: CompanyDetailField[];
}

const CompanyDetailGrid: React.FC<CompanyDetailGridProps> = ({ fields }) => (
  <div style={sectionWrapperStyle}>
    <div style={sectionGridStyle}>
      {fields.map((field) => (
        <React.Fragment key={field.key}>
          <div style={labelStyle}>{field.label}</div>
          <div style={valueStyle}>{field.value}</div>
        </React.Fragment>
      ))}
    </div>
  </div>
);

export const CompanyViewModal: React.FC<CompanyViewModalProps> = ({
  show,
  selectedDataItem,
  onClose,
  formatCrmPreviewDate,
}) => {
  if (!selectedDataItem || !show) return null;

  const fields = buildCompanyDetailFields(selectedDataItem, formatCrmPreviewDate);
  const enrichmentData = getEnrichmentData(selectedDataItem.data);

  return (
    <Modal
      show={show}
      onHide={onClose}
      size="xl"
      centered
      className="prospect-view-modal"
    >
      <CompanyViewModalHeader
        selectedDataItem={selectedDataItem}
        formatDate={formatCrmPreviewDate}
        onClose={onClose}
      />
      <Modal.Body style={bodyStyle}>
        <div style={{ padding: "32px" }}>
          <CompanyDetailGrid fields={fields} />
          {enrichmentData && <CompanyViewEnrichmentBlock data={enrichmentData} />}
        </div>
      </Modal.Body>
      <div style={footerStyle}>
        <div style={{ fontSize: "13px", color: "#6b7280" }}>
          Company ID: <strong>#{selectedDataItem.id}</strong>
        </div>
        <Button
          variant="outline-secondary"
          onClick={onClose}
          style={footerCloseButtonStyle}
          onMouseOver={handleCloseHover}
          onMouseOut={handleCloseLeave}
          onFocus={handleCloseHover}
          onBlur={handleCloseLeave}
        >
          Close
        </Button>
      </div>
    </Modal>
  );
};

export default CompanyViewModal;
