import type { TableAction, TableColumn } from "@components/GenericTable";
import {
  formatDescriptionPreview,
  formatTrackingLabel,
  requestCategoryFieldTypeLabel,
} from "@page-modules/workforce/request-categories/requestCategoriesDomain";
import { CrmTableRowActions } from "@page-modules/crm/shared/CrmTableRowActions";
import type { UserRequestCategory, UserRequestCategoryField } from "@utils/staffManagement";
import { ChevronDown, ChevronUp, FolderTree, List, Pencil, Trash2 } from "lucide-react";
import React from "react";

export const REQUEST_CATEGORIES_NESTED_TABLE_LAYOUT = {
  showActions: true,
  uniqueKey: "id",
  showToolbarActions: false,
  noBorder: true,
} as const;

export function CategoryActiveStatusBadge({ row }: Readonly<{ row: UserRequestCategory }>) {
  return (
    <span className={`gt-badge gt-badge-${row.is_active === false ? "secondary" : "success"}`}>
      {row.is_active === false ? "Inactive" : "Active"}
    </span>
  );
}

export function FieldReorderButtons({
  index,
  reordering,
  onMove,
}: Readonly<{
  index: number;
  reordering: boolean;
  onMove: (i: number, direction: "up" | "down") => void;
}>) {
  return (
    <div className="d-flex align-items-center gap-1">
      <button
        type="button"
        className="request-categories-page__field-reorder-btn"
        onClick={() => onMove(index, "up")}
        disabled={reordering}
        aria-label="Move up"
      >
        <ChevronUp size={16} />
      </button>
      <button
        type="button"
        className="request-categories-page__field-reorder-btn"
        onClick={() => onMove(index, "down")}
        disabled={reordering}
        aria-label="Move down"
      >
        <ChevronDown size={16} />
      </button>
    </div>
  );
}

export const MAIN_REQUEST_CATEGORY_COLUMNS: TableColumn<UserRequestCategory>[] = [
  {
    key: "name",
    label: "Name",
    type: "text",
    emptyValue: "—",
  },
  {
    key: "description",
    label: "Description",
    render: (row: UserRequestCategory) => (
      <span>{formatDescriptionPreview(row.description)}</span>
    ),
  },
  {
    key: "tracking_enabled",
    label: "Tracking",
    render: (row: UserRequestCategory) => <span>{formatTrackingLabel(row)}</span>,
  },
  {
    key: "code_prefix",
    label: "Code Prefix",
    render: (row: UserRequestCategory) => <span>{row.tracking_code_prefix ?? "—"}</span>,
  },
  {
    key: "is_active",
    label: "Active",
    render: (row: UserRequestCategory) => <CategoryActiveStatusBadge row={row} />,
  },
];

export const CHILD_REQUEST_CATEGORY_COLUMNS: TableColumn<UserRequestCategory>[] = [
  {
    key: "name",
    label: "Name",
    type: "text",
    emptyValue: "—",
  },
  {
    key: "tracking_enabled",
    label: "Tracking",
    render: (row: UserRequestCategory) => <span>{formatTrackingLabel(row)}</span>,
  },
  {
    key: "is_active",
    label: "Active",
    render: (row: UserRequestCategory) => <CategoryActiveStatusBadge row={row} />,
  },
];

function pencilOutlineAction<T>(onClick: (row: T) => void): TableAction<T> {
  return {
    label: "Edit",
    icon: <Pencil size={16} />,
    onClick,
    variant: "light",
    className: "btn-action-style-2 p-1 text-primary",
  };
}

function trashOutlineDangerAction<T>(onClick: (row: T) => void): TableAction<T> {
  return {
    label: "Delete",
    icon: <Trash2 size={16} />,
    onClick,
    variant: "light",
    className: "btn-action-style-2 p-1 text-danger",
  };
}

export type MainRequestCategoryActionHandlers = Readonly<{
  openEditCategory: (c: UserRequestCategory) => void;
  openChildrenModal: (c: UserRequestCategory) => void;
  openDeleteCategory: (c: UserRequestCategory) => void;
}>;

function renderMainRequestCategoryRowActions(
  row: UserRequestCategory,
  handlers: MainRequestCategoryActionHandlers,
): React.ReactNode {
  return (
    <CrmTableRowActions
      actions={[
        {
          label: `Edit ${row.name}`,
          icon: <Pencil size={16} aria-hidden />,
          tone: "primary",
          onClick: () => handlers.openEditCategory(row),
        },
        {
          label: `Sub-categories for ${row.name}`,
          icon: <FolderTree size={16} aria-hidden />,
          tone: "info",
          onClick: () => handlers.openChildrenModal(row),
        },
        {
          label: `Delete ${row.name}`,
          icon: <Trash2 size={16} aria-hidden />,
          tone: "danger",
          onClick: () => handlers.openDeleteCategory(row),
        },
      ]}
    />
  );
}

/** Main categories table columns including Ranks-style row actions when `canManage`. */
export function buildMainRequestCategoryTableColumns(
  canManage: boolean,
  handlers: MainRequestCategoryActionHandlers,
): TableColumn<UserRequestCategory>[] {
  if (!canManage) {
    return MAIN_REQUEST_CATEGORY_COLUMNS;
  }
  return [
    ...MAIN_REQUEST_CATEGORY_COLUMNS,
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      align: "center",
      type: "custom",
      width: "180px",
      render: (row: UserRequestCategory) => renderMainRequestCategoryRowActions(row, handlers),
    },
  ];
}

export function buildChildrenRequestCategoryActions(handlers: Readonly<{
  closeChildrenModal: () => void;
  openEditCategory: (c: UserRequestCategory) => void;
  openFieldsModal: (c: UserRequestCategory) => void;
  openDeleteCategory: (c: UserRequestCategory) => void;
}>): TableAction<UserRequestCategory>[] {
  return [
    pencilOutlineAction((child) => {
      handlers.closeChildrenModal();
      handlers.openEditCategory(child);
    }),
    {
      label: "Manage fields",
      icon: <List size={16} />,
      onClick: (child) => {
        handlers.closeChildrenModal();
        handlers.openFieldsModal(child);
      },
      variant: "light",
      className: "btn-action-style-2 p-1 text-info",
    },
    trashOutlineDangerAction(handlers.openDeleteCategory),
  ];
}

export function buildRequestCategoryFieldsColumns(
  moveField: (index: number, direction: "up" | "down") => void,
  reordering: boolean,
): TableColumn<UserRequestCategoryField>[] {
  return [
    {
      key: "_order",
      label: "",
      sortable: false,
      render: (_row, index) => (
        <FieldReorderButtons index={index} reordering={reordering} onMove={moveField} />
      ),
    },
    { key: "label", label: "Label", type: "text" },
    {
      key: "type",
      label: "Type",
      render: (row: UserRequestCategoryField) => (
        <span>{requestCategoryFieldTypeLabel(row.type)}</span>
      ),
    },
    {
      key: "required",
      label: "Required",
      render: (row: UserRequestCategoryField) => <span>{row.required ? "Yes" : "No"}</span>,
    },
    {
      key: "is_active",
      label: "Active",
      render: (row: UserRequestCategoryField) => (
        <span>{row.is_active === false ? "No" : "Yes"}</span>
      ),
    },
  ];
}

export function buildRequestCategoryFieldsActions(
  openEditField: (f: UserRequestCategoryField) => void,
  openDeleteFieldModal: (f: UserRequestCategoryField) => void,
): TableAction<UserRequestCategoryField>[] {
  return [
    pencilOutlineAction(openEditField),
    trashOutlineDangerAction(openDeleteFieldModal),
  ];
}
