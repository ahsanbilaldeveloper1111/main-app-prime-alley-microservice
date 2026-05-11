import type { TableAction, TableColumn } from "@components/GenericTable";
import {
  formatDescriptionPreview,
  formatTrackingLabel,
  requestCategoryFieldTypeLabel,
} from "@page-modules/workforce/request-categories/requestCategoriesDomain";
import type { UserRequestCategory, UserRequestCategoryField } from "@utils/staffManagement";
import { ChevronDown, ChevronUp, FolderTree, List, Pencil, Trash2 } from "lucide-react";

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
    icon: <Pencil size={14} />,
    onClick,
    variant: "outline-secondary",
  };
}

function trashOutlineDangerAction<T>(onClick: (row: T) => void): TableAction<T> {
  return {
    label: "Delete",
    icon: <Trash2 size={14} />,
    onClick,
    variant: "outline-danger",
  };
}

export function buildMainRequestCategoryActions(
  canManage: boolean,
  handlers: Readonly<{
    openEditCategory: (c: UserRequestCategory) => void;
    openChildrenModal: (c: UserRequestCategory) => void;
    openDeleteCategory: (c: UserRequestCategory) => void;
  }>,
): TableAction<UserRequestCategory>[] {
  const show = () => canManage;
  return [
    { ...pencilOutlineAction(handlers.openEditCategory), show },
    {
      label: "Sub-categories",
      icon: <FolderTree size={14} />,
      onClick: handlers.openChildrenModal,
      variant: "outline-secondary",
      show,
    },
    { ...trashOutlineDangerAction(handlers.openDeleteCategory), show },
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
      icon: <List size={14} />,
      onClick: (child) => {
        handlers.closeChildrenModal();
        handlers.openFieldsModal(child);
      },
      variant: "outline-secondary",
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
