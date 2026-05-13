import React from "react";
import { Button } from "react-bootstrap";
import { Edit, Eye, Trash2 } from "lucide-react";
import type { TableColumn } from "@components/GenericTable";
import { CrmTruncatedDescriptionCell } from "@components/crm/crmTruncatedDescriptionCell";
import {
  formatDateTimeToLocal,
  GlobalDateFormat,
} from "@utils/Helper";
import type { IndustryData } from "@utils/crm";

export interface BuildIndustriesTableColumnsParams {
  canEdit: boolean;
  canDelete: boolean;
  onView: (industry: IndustryData) => void;
  onEdit: (industry: IndustryData) => void;
  onDelete: (industry: IndustryData) => void;
}

function renderIndustryActions(
  industry: IndustryData,
  params: BuildIndustriesTableColumnsParams,
): React.ReactNode {
  const { canEdit, canDelete, onView, onEdit, onDelete } = params;
  return (
    <div className="d-flex justify-content-end gap-2">
      <Button
        variant="outline-info"
        size="sm"
        onClick={() => onView(industry)}
      >
        <Eye size={14} />
      </Button>
      {canEdit && (
        <Button
          variant="outline-primary"
          size="sm"
          onClick={() => onEdit(industry)}
        >
          <Edit size={14} />
        </Button>
      )}
      {canDelete && (
        <Button
          variant="outline-danger"
          size="sm"
          onClick={() => onDelete(industry)}
        >
          <Trash2 size={14} />
        </Button>
      )}
    </div>
  );
}

/** Builds the column list for the industries / product groups table. */
export function buildIndustriesTableColumns(
  params: BuildIndustriesTableColumnsParams,
): TableColumn<IndustryData>[] {
  return [
    {
      key: "name",
      label: "Name",
      sortable: true,
      type: "custom",
      width: "240px",
      render: (industry) => (
        <div className="fw-semibold">{industry.name}</div>
      ),
    },
    {
      key: "description",
      label: "Description",
      sortable: false,
      type: "custom",
      width: "420px",
      render: (industry) => (
        <CrmTruncatedDescriptionCell text={industry.description} />
      ),
    },
    {
      key: "created_at",
      label: "Created At",
      sortable: true,
      type: "custom",
      width: "200px",
      render: (industry) => (
        <div className="text-muted small">
          {formatDateTimeToLocal(industry.created_at, GlobalDateFormat)}
        </div>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      align: "right",
      type: "custom",
      width: "160px",
      render: (industry) => renderIndustryActions(industry, params),
    },
  ];
}
