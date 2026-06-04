import React from "react";
import { Badge } from "react-bootstrap";
import { Edit, Eye, RotateCcw, Trash2 } from "lucide-react";
import type { TableColumn } from "@components/GenericTable";
import CrmColorCell from "@components/crm/crmColorCell";
import { CrmTruncatedDescriptionCell } from "@components/crm/crmTruncatedDescriptionCell";
import {
  getTypeBadgeColor,
  getTypeDisplayName,
  getStageTypeDotClassName,
  type StageRow,
} from "@page-modules/crm/stages/stagesPageModel";
import { CrmTableRowActions } from "@page-modules/crm/shared/CrmTableRowActions";

export interface BuildStagesTableColumnsParams {
  selectedColumns: string[];
  activeFilter: string;
  canEdit: boolean;
  canDelete: boolean;
  onView: (stage: StageRow) => void;
  onEdit: (stage: StageRow) => void;
  onDelete: (stage: StageRow) => void;
  onRestore: (stage: StageRow) => void;
}

function buildNameColumn(): TableColumn<StageRow> {
  return {
    key: "name",
    label: "Stage Name",
    sortable: false,
    type: "custom",
    render: (stage) => (
      <div
        className="d-flex align-items-center gap-2"
        style={{ minWidth: 0, maxWidth: "100%", overflow: "hidden" }}
      >
        <div
          className={getStageTypeDotClassName(stage.type)}
          aria-hidden
          style={{ flexShrink: 0 }}
        />
        <span
          className="fw-semibold"
          title={stage.name}
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            minWidth: 0,
          }}
        >
          {stage.name}
        </span>
      </div>
    ),
  };
}

function buildSequenceColumn(): TableColumn<StageRow> {
  return {
    key: "sequence",
    label: "Sequence",
    sortable: false,
    align: "center",
    type: "custom",
    width: "120px",
    render: (stage) => <span className="fw-bold">{stage.sequence}</span>,
  };
}

function buildTypeColumn(): TableColumn<StageRow> {
  return {
    key: "type",
    label: "Type",
    sortable: false,
    type: "custom",
    render: (stage) => (
      <Badge
        bg={getTypeBadgeColor(stage.type)}
        className="bg-opacity-10 text-dark"
      >
        {getTypeDisplayName(stage.type)}
      </Badge>
    ),
  };
}

function buildDescriptionColumn(): TableColumn<StageRow> {
  return {
    key: "description",
    label: "Description",
    sortable: false,
    type: "custom",
    width: "360px",
    render: (stage) => (
      <CrmTruncatedDescriptionCell
        text={stage.description}
        emptyDisplay="No description"
      />
    ),
  };
}

function buildColorColumn(): TableColumn<StageRow> {
  return {
    key: "color",
    label: "Color",
    sortable: false,
    type: "custom",
    render: (stage) => <CrmColorCell color={stage.color} />,
  };
}

function renderDeletedActions(
  stage: StageRow,
  onView: (s: StageRow) => void,
  onRestore: (s: StageRow) => void,
): React.ReactNode {
  return (
    <CrmTableRowActions
      actions={[
        {
          label: `View stage ${stage.name}`,
          icon: <Eye size={22} aria-hidden />,
          tone: "success",
          onClick: () => onView(stage),
        },
        {
          label: `Restore stage ${stage.name}`,
          icon: <RotateCcw size={22} aria-hidden />,
          tone: "success",
          onClick: () => onRestore(stage),
        },
      ]}
    />
  );
}

function renderActiveActions(
  stage: StageRow,
  canEdit: boolean,
  canDelete: boolean,
  onView: (s: StageRow) => void,
  onEdit: (s: StageRow) => void,
  onDelete: (s: StageRow) => void,
): React.ReactNode {
  return (
    <CrmTableRowActions
      actions={[
        {
          label: `View stage ${stage.name}`,
          icon: <Eye size={22} aria-hidden />,
          tone: "success",
          onClick: () => onView(stage),
        },
        ...(canEdit
          ? [
              {
                label: `Edit stage ${stage.name}`,
                icon: <Edit size={22} aria-hidden />,
                tone: "primary" as const,
                onClick: () => onEdit(stage),
              },
            ]
          : []),
        ...(canDelete
          ? [
              {
                label: `Delete stage ${stage.name}`,
                icon: <Trash2 size={22} aria-hidden />,
                tone: "danger" as const,
                onClick: () => onDelete(stage),
              },
            ]
          : []),
      ]}
    />
  );
}

function buildActionsColumn(
  params: Omit<BuildStagesTableColumnsParams, "selectedColumns">,
): TableColumn<StageRow> {
  const { activeFilter, canEdit, canDelete, onView, onEdit, onDelete, onRestore } =
    params;
  return {
    key: "actions",
    label: "Actions",
    sortable: false,
    type: "custom",
    align: "center",
    render: (stage) =>
      activeFilter === "deleted"
        ? renderDeletedActions(stage, onView, onRestore)
        : renderActiveActions(stage, canEdit, canDelete, onView, onEdit, onDelete),
  };
}

/** Builds the dynamic column list for the stages table based on selected columns and permissions. */
export function buildStagesTableColumns(
  params: BuildStagesTableColumnsParams,
): TableColumn<StageRow>[] {
  const { selectedColumns, ...rest } = params;
  const cols: TableColumn<StageRow>[] = [];

  if (selectedColumns.includes("name")) cols.push(buildNameColumn());
  if (selectedColumns.includes("sequence")) cols.push(buildSequenceColumn());
  if (selectedColumns.includes("type")) cols.push(buildTypeColumn());
  if (selectedColumns.includes("description"))
    cols.push(buildDescriptionColumn());
  if (selectedColumns.includes("color")) cols.push(buildColorColumn());

  cols.push(buildActionsColumn(rest));
  return cols;
}
