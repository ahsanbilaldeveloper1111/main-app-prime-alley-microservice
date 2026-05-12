export const INDUSTRIES_TABLE_COLUMN_STORAGE_KEY = "industriesSelectedColumns";

export const INDUSTRIES_TABLE_SELECTABLE_KEYS = [
  "name",
  "description",
  "created_at",
  "actions",
] as const;

export const DEFAULT_INDUSTRIES_TABLE_COLUMNS = [
  "name",
  "description",
  "created_at",
  "actions",
];

export type IndustryFormData = {
  name: string;
  description: string;
};

export type ProductFormData = {
  productName: string;
  sku: string;
  price: string;
  currency: string;
  category: string;
  brand: string;
  isActive: boolean;
  description: string;
};

export const EMPTY_INDUSTRY_FORM: IndustryFormData = {
  name: "",
  description: "",
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
};
