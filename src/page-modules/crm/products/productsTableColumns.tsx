import React from "react";
import { Badge } from "react-bootstrap";
import { Edit, Eye, Trash2 } from "lucide-react";
import type { TableColumn } from "@components/GenericTable";
import { CrmTruncatedDescriptionCell } from "@components/crm/crmTruncatedDescriptionCell";
import type { ProductDisplayData } from "@page-modules/crm/products/productsPageModel";
import { CrmTableRowActions } from "@page-modules/crm/shared/CrmTableRowActions";

export interface BuildProductsTableColumnsParams {
  selectedColumns: string[];
  canEdit: boolean;
  canDelete: boolean;
  onView: (product: ProductDisplayData) => void;
  onEdit: (product: ProductDisplayData) => void;
  onDelete: (product: ProductDisplayData) => void;
}

function buildProductNameColumn(): TableColumn<ProductDisplayData> {
  return {
    key: "productName",
    label: "Product Name",
    sortable: false,
    type: "custom",
    render: (product) => (
      <span className="fw-semibold">{product.productName}</span>
    ),
  };
}

function buildSkuColumn(): TableColumn<ProductDisplayData> {
  return {
    key: "sku",
    label: "SKU",
    sortable: false,
    type: "custom",
    render: (product) => (
      <Badge bg="light" text="dark" className="font-monospace">
        {product.sku}
      </Badge>
    ),
  };
}

function buildPriceColumn(): TableColumn<ProductDisplayData> {
  return {
    key: "price",
    label: "Price",
    sortable: false,
    type: "custom",
    render: (product) => (
      <span className="fw-semibold text-success">
        {product.currency} {product.price.toFixed(2)}
      </span>
    ),
  };
}

function buildCurrencyColumn(): TableColumn<ProductDisplayData> {
  return {
    key: "currency",
    label: "Currency",
    sortable: false,
  };
}

function buildCategoryColumn(): TableColumn<ProductDisplayData> {
  return {
    key: "category",
    label: "Category",
    sortable: false,
    type: "custom",
    render: (product) => (
      <Badge bg="info" className="bg-opacity-10 text-dark">
        {product.category || "N/A"}
      </Badge>
    ),
  };
}

function buildBrandColumn(): TableColumn<ProductDisplayData> {
  return {
    key: "brand",
    label: "Brand",
    sortable: false,
    type: "custom",
    render: (product) => <span>{product.brand || "N/A"}</span>,
  };
}

function buildStatusColumn(): TableColumn<ProductDisplayData> {
  return {
    key: "status",
    label: "Status",
    sortable: false,
    type: "custom",
    render: (product) => (
      <Badge bg={product.status === "Active" ? "success" : "secondary"}>
        {product.status}
      </Badge>
    ),
  };
}

function buildDescriptionColumn(): TableColumn<ProductDisplayData> {
  return {
    key: "description",
    label: "Description",
    sortable: false,
    type: "custom",
    width: "260px",
    render: (product) => (
      <CrmTruncatedDescriptionCell
        text={product.description}
        emptyDisplay="N/A"
      />
    ),
  };
}

function buildCreatedColumn(): TableColumn<ProductDisplayData> {
  return {
    key: "created",
    label: "Created",
    sortable: false,
    type: "custom",
    render: (product) => (
      <span className="text-muted">{product.created}</span>
    ),
  };
}

function buildActionsColumn(
  params: Omit<BuildProductsTableColumnsParams, "selectedColumns">,
): TableColumn<ProductDisplayData> {
  const { canEdit, canDelete, onView, onEdit, onDelete } = params;
  const label = product.productName || "product";
  return {
    key: "actions",
    label: "Actions",
    sortable: false,
    align: "center",
    type: "custom",
    render: () => (
      <CrmTableRowActions
        actions={[
          {
            label: `View ${label}`,
            icon: <Eye size={22} aria-hidden />,
            tone: "success",
            onClick: () => onView(product),
          },
          ...(canEdit
            ? [
                {
                  label: `Edit ${label}`,
                  icon: <Edit size={22} aria-hidden />,
                  tone: "primary" as const,
                  onClick: () => onEdit(product),
                },
              ]
            : []),
          ...(canDelete
            ? [
                {
                  label: `Delete ${label}`,
                  icon: <Trash2 size={22} aria-hidden />,
                  tone: "danger" as const,
                  onClick: () => onDelete(product),
                },
              ]
            : []),
        ]}
      />
    ),
  };
}

const COLUMN_BUILDERS: Record<string, () => TableColumn<ProductDisplayData>> = {
  productName: buildProductNameColumn,
  sku: buildSkuColumn,
  price: buildPriceColumn,
  currency: buildCurrencyColumn,
  category: buildCategoryColumn,
  brand: buildBrandColumn,
  status: buildStatusColumn,
  description: buildDescriptionColumn,
  created: buildCreatedColumn,
};

/** Builds the dynamic column list for the products table based on selected columns and permissions. */
export function buildProductsTableColumns(
  params: BuildProductsTableColumnsParams,
): TableColumn<ProductDisplayData>[] {
  const { selectedColumns, ...rest } = params;
  const cols: TableColumn<ProductDisplayData>[] = [];

  for (const key of selectedColumns) {
    if (key === "actions") continue;
    const builder = COLUMN_BUILDERS[key];
    if (builder) cols.push(builder());
  }

  if (selectedColumns.includes("actions")) {
    cols.push(buildActionsColumn(rest));
  }
  return cols;
}
