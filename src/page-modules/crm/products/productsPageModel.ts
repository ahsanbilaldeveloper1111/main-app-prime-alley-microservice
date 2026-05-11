import type { IndustryData } from "@utils/crm";

export const PRODUCTS_TABLE_COLUMN_STORAGE_KEY = "productsSelectedColumns";

export const PRODUCTS_TABLE_SELECTABLE_KEYS = [
  "productName",
  "sku",
  "price",
  "currency",
  "category",
  "brand",
  "status",
  "description",
  "created",
  "actions",
] as const;

export const DEFAULT_PRODUCT_TABLE_COLUMNS = [
  "productName",
  "sku",
  "price",
  "category",
  "brand",
  "status",
  "actions",
];

/** Row shape for the products table and modals */
export interface ProductDisplayData {
  id: number;
  productName: string;
  sku: string;
  price: number;
  currency: string;
  category: string;
  brand: string;
  status: "Active" | "Inactive";
  description: string;
  created: string;
  industry?: IndustryData | null;
  industry_id?: number | null;
}

export type ProductFormData = {
  productName: string;
  sku: string;
  price: string;
  currency: string;
  category: string;
  brand: string;
  isActive: boolean;
  description: string;
  industry_id: number | null;
};

export type ProductsPageFilters = {
  industry_id: number | null;
  category: string | null;
  brand: string[];
  status: string | null;
  priceMin: string;
  priceMax: string;
};

export const EMPTY_PRODUCT_FORM: ProductFormData = {
  productName: "",
  sku: "",
  price: "",
  currency: "AED",
  category: "",
  brand: "",
  isActive: true,
  description: "",
  industry_id: null,
};

export function normalizeIndustryId(industryId: unknown): number | null {
  if (industryId === null || industryId === undefined) {
    return null;
  }
  if (typeof industryId === "string") {
    const parsed = Number.parseInt(industryId, 10);
    return Number.isNaN(parsed) ? null : parsed;
  }
  if (typeof industryId === "number") {
    return industryId;
  }
  return null;
}

export function getStatusByFilterId(
  filterId: string,
): "Active" | "Inactive" | null {
  if (filterId === "active") {
    return "Active";
  }
  if (filterId === "inactive") {
    return "Inactive";
  }
  return null;
}

export function getProductSubmitButtonLabel(
  isSubmitting: boolean,
  isEditing: boolean,
): string {
  if (isSubmitting) {
    return isEditing ? "Updating Product..." : "Adding Product...";
  }
  if (isEditing) {
    return "Update Product";
  }
  return "Add Product";
}

/** react-select styles for sidebar industry/category pickers */
export const PRODUCT_SIDEBAR_SELECT_STYLES = {
  control: (base: Record<string, unknown>) => ({
    ...base,
    minHeight: 40,
    border: "1px solid #8a8a8a",
    borderRadius: "4px",
    fontSize: "14px",
    boxShadow: "none",
    "&:hover": {
      borderColor: "#0091ae",
    },
  }),
};
