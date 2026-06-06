import React from "react";
import { Edit, Eye, Trash2 } from "lucide-react";
import type { TableColumn } from "@components/GenericTable";
import { CrmTruncatedDescriptionCell } from "@components/crm/crmTruncatedDescriptionCell";
import {
  formatDateTimeToLocal,
  GlobalDateFormat,
} from "@utils/Helper";
import type { IndustryData } from "@utils/crm";
import { CrmTableRowActions } from "@page-modules/crm/shared/CrmTableRowActions";

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
  const actions = [
    {
      label: `View product group ${industry.name}`,
      icon: <Eye size={22} aria-hidden />,
      tone: "success" as const,
      onClick: () => onView(industry),
    },
    ...(canEdit
      ? [
          {
            label: `Edit product group ${industry.name}`,
            icon: <Edit size={22} aria-hidden />,
            tone: "primary" as const,
            onClick: () => onEdit(industry),
          },
        ]
      : []),
    ...(canDelete
      ? [
          {
            label: `Delete product group ${industry.name}`,
            icon: <Trash2 size={22} aria-hidden />,
            tone: "danger" as const,
            onClick: () => onDelete(industry),
          },
        ]
      : []),
  ];

  return <CrmTableRowActions actions={actions} />;
}

/** Builds the column list for the industries / product groups table. */
export function buildIndustriesTableColumns(
  params: BuildIndustriesTableColumnsParams,
): TableColumn<IndustryData>[] {
  return [
    {
      key: "name",
      label: "Name",
      sortable: false,
      type: "custom",
      width: "240px",
      render: (industry) => (
        <div
          className="fw-semibold"
          title={industry.name}
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {industry.name}
        </div>
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
      sortable: false,
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
      align: "center",
      type: "custom",
      width: "160px",
      render: (industry) => renderIndustryActions(industry, params),
    },
  ];
}
