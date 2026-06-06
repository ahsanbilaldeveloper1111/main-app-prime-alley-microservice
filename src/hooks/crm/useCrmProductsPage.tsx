import { useCrmSettingsTableState } from "@hooks/useCrmSettingsTableState";
import type { CrmSettingsTablePaginationState } from "@hooks/useCrmSettingsTableState";
import { useDebouncedSearchInput } from "@hooks/useDebouncedSearchInput";
import {
  createProduct,
  deleteProduct,
  getCrmProducts,
  getIndustries,
  updateProduct,
  type CrmProduct,
  type CreateProductPayload,
  type IndustryData,
  type UpdateProductPayload,
} from "@utils/crm";
import {
  DEFAULT_PRODUCT_TABLE_COLUMNS,
  EMPTY_PRODUCT_FORM,
  normalizeIndustryId,
  PRODUCTS_TABLE_COLUMN_STORAGE_KEY,
  PRODUCTS_TABLE_SELECTABLE_KEYS,
  type ProductDisplayData,
  type ProductFormData,
  type ProductsPageFilters,
} from "@page-modules/crm/products/productsPageModel";
import { formatDateForTable, normalizeSearchQuery } from "@utils/Helper";
import { useSession } from "next-auth/react";
import { Form } from "react-bootstrap";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type FormEvent,
  type SetStateAction,
} from "react";
import { useQuery, useQueryClient, useQueries } from "@tanstack/react-query";
import { toast } from "react-toastify";
import type { Session } from "next-auth";
import type { FilterPill } from "@components/GenericTable";
import {
  CRM_REACT_SELECT_MENU_PORTAL_Z_INDEX,
  getCrmReactSelectBodyMenuPortalProps,
} from "@utils/crmReactSelectMenuPortalProps";
import { crmAppKeys } from "@query/keys";

type SelectStyles = Record<string, any>;

export interface UseCrmProductsPageResult {
  session: Session | null | undefined;
  products: CrmProduct[];
  totalProducts: number;
  loading: boolean;
  productsSearch: string;
  productsSearchQuery: string;
  handleProductsSearchChange: (value: string) => void;
  handleProductsSearchSubmit: () => void;
  productsFilters: ProductsPageFilters;
  setProductsFilters: Dispatch<SetStateAction<ProductsPageFilters>>;
  showProductModal: boolean;
  setShowProductModal: Dispatch<SetStateAction<boolean>>;
  editingProduct: ProductDisplayData | null;
  setEditingProduct: Dispatch<SetStateAction<ProductDisplayData | null>>;
  submittingProduct: boolean;
  productsPagination: CrmSettingsTablePaginationState;
  setProductsPagination: Dispatch<
    SetStateAction<CrmSettingsTablePaginationState>
  >;
  selectedProductsColumns: string[];
  setSelectedProductsColumns: (columns: string[]) => void;
  handleProductsPaginationChange: (page: number, rowsPerPage: number) => void;
  productFormData: ProductFormData;
  setProductFormData: Dispatch<SetStateAction<ProductFormData>>;
  industries: IndustryData[];
  loadingIndustries: boolean;
  deletingProduct: ProductDisplayData | null;
  showProductDeleteModal: boolean;
  setShowProductDeleteModal: Dispatch<SetStateAction<boolean>>;
  setDeletingProduct: Dispatch<SetStateAction<ProductDisplayData | null>>;
  deletingProductPending: boolean;
  showProductViewModal: boolean;
  setShowProductViewModal: Dispatch<SetStateAction<boolean>>;
  viewingProduct: ProductDisplayData | null;
  setViewingProduct: Dispatch<SetStateAction<ProductDisplayData | null>>;
  activeFilter: string;
  setActiveFilter: Dispatch<SetStateAction<string>>;
  displayProducts: ProductDisplayData[];
  uniqueCategories: string[];
  productFilterPills: FilterPill[];
  customSelectStyles: SelectStyles;
  fetchProducts: () => Promise<void>;
  handleOpenProductModal: (product?: ProductDisplayData) => void;
  handleProductSubmit: (e: FormEvent) => Promise<void>;
  handleDeleteProduct: () => Promise<void>;
  requestDeleteProduct: (product: ProductDisplayData) => void;
  openProductView: (product: ProductDisplayData) => void;
  productFilterCounts: { all: number; active: number; inactive: number };
}

function getErrorMessageFromUnknown(error: unknown, fallback: string): string {
  if (error && typeof error === "object") {
    const ax = error as {
      response?: { data?: { message?: string } };
      message?: string;
    };
    const msg = ax.response?.data?.message;
    if (typeof msg === "string" && msg.length > 0) return msg;
    if (typeof ax.message === "string" && ax.message.length > 0) return ax.message;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

function buildProductsTabCountParams(
  search: string,
  filters: ProductsPageFilters,
  active?: boolean,
): {
  page: number;
  per_page: number;
  search?: string;
  active?: boolean;
  industry_id?: number;
  category?: string;
  brand?: string[];
} {
  const params: {
    page: number;
    per_page: number;
    search?: string;
    active?: boolean;
    industry_id?: number;
    category?: string;
    brand?: string[];
  } = { page: 1, per_page: 1 };

  if (search) {
    params.search = search;
  }

  if (active === true) {
    params.active = true;
  } else if (active === false) {
    params.active = false;
  }

  if (filters.industry_id) {
    params.industry_id = filters.industry_id;
  }

  if (filters.category) {
    params.category = filters.category;
  }

  if (filters.brand.length > 0) {
    params.brand = filters.brand;
  }

  return params;
}

export function useCrmProductsPage(): UseCrmProductsPageResult {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const {
    inputValue: productsSearch,
    queryValue: productsSearchQuery,
    handleInputChange: handleProductsSearchChange,
    submitQuery: handleProductsSearchSubmit,
  } = useDebouncedSearchInput({
    normalize: normalizeSearchQuery,
  });
  const [productsFilters, setProductsFilters] = useState<ProductsPageFilters>({
    industry_id: null as number | null,
    category: null as string | null,
    brand: [] as string[],
    status: null as string | null,
    priceMin: "",
    priceMax: "",
  });
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] =
    useState<ProductDisplayData | null>(null);
  const [submittingProduct, setSubmittingProduct] = useState(false);
  const {
    pagination: productsPagination,
    setPagination: setProductsPagination,
    selectedColumns: selectedProductsColumns,
    setSelectedColumns: setSelectedProductsColumns,
    handlePaginationChange: handleProductsPaginationChange,
  } = useCrmSettingsTableState({
    defaultSelectedColumns: DEFAULT_PRODUCT_TABLE_COLUMNS,
    selectableColumnKeys: PRODUCTS_TABLE_SELECTABLE_KEYS,
    columnStorageKey: PRODUCTS_TABLE_COLUMN_STORAGE_KEY,
    initialPagination: { rowsPerPage: 15 },
  });
  const [productFormData, setProductFormData] = useState<ProductFormData>({
    ...EMPTY_PRODUCT_FORM,
  });
  const [deletingProduct, setDeletingProduct] =
    useState<ProductDisplayData | null>(null);
  const [showProductDeleteModal, setShowProductDeleteModal] = useState(false);
  const [deletingProductPending, setDeletingProductPending] = useState(false);
  const [showProductViewModal, setShowProductViewModal] = useState(false);
  const [viewingProduct, setViewingProduct] =
    useState<ProductDisplayData | null>(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [currentFilters, setCurrentFilters] = useState<Record<string, string>>(
    {},
  );

  const customSelectStyles = useMemo<SelectStyles>(
    () => ({
      control: (provided: any, state: any) => ({
        ...provided,
        minHeight: "38px",
        fontSize: "0.875rem",
        borderColor: state.isFocused ? "#86b7fe" : "#dee2e6",
        boxShadow: state.isFocused
          ? "0 0 0 0.2rem rgba(13, 110, 253, 0.25)"
          : "none",
        "&:hover": {
          borderColor: "#86b7fe",
        },
      }),
      multiValue: (provided: any) => ({
        ...provided,
        backgroundColor: "#0d6efd",
        color: "white",
        fontSize: "0.813rem",
      }),
      multiValueLabel: (provided: any) => ({
        ...provided,
        color: "white",
        padding: "2px 6px",
      }),
      multiValueRemove: (provided: any) => ({
        ...provided,
        color: "white",
        "&:hover": {
          backgroundColor: "#0b5ed7",
          color: "white",
        },
      }),
      menu: (provided: any) => ({
        ...provided,
        fontSize: "0.875rem",
      }),
      menuPortal: (provided: any) => ({
        ...provided,
        zIndex: CRM_REACT_SELECT_MENU_PORTAL_Z_INDEX,
      }),
    }),
    [],
  );

  const industriesQuery = useQuery({
    queryKey: crmAppKeys.campaigns.industries(),
    queryFn: async () => {
      const response = await getIndustries({ per_page: 1000, page: 1 });
      return response.data ?? [];
    },
  });

  const industries = industriesQuery.data ?? [];
  const loadingIndustries = industriesQuery.isPending;

  useEffect(() => {
    if (industriesQuery.isError) {
      toast.error(
        getErrorMessageFromUnknown(industriesQuery.error, "Failed to load industries"),
      );
    }
  }, [industriesQuery.isError, industriesQuery.error]);

  const convertToDisplayData = useCallback(
    (product: CrmProduct): ProductDisplayData => {
      const productAny = product as CrmProduct & {
        industry_id?: unknown;
        industry?: IndustryData | null;
      };
      const rawIndustryId =
        productAny.industry_id ?? productAny.industry?.id ?? null;
      const normalizedIndustryId = normalizeIndustryId(rawIndustryId);

      return {
        id: product.id,
        productName: product.name,
        sku: product.sku,
        price: Number.parseFloat(String(product.price)) || 0,
        currency: product.currency,
        category: product.category || "",
        brand: product.brand || "",
        status: product.active ? "Active" : "Inactive",
        description: product.description || "",
        created: formatDateForTable(product.created_at),
        industry: productAny.industry ?? null,
        industry_id: normalizedIndustryId,
      };
    },
    [],
  );

  const listSearch = normalizeSearchQuery(currentFilters.search);
  const brandKey = useMemo(
    () => [...productsFilters.brand].map(String).sort((a, b) => a.localeCompare(b)).join(","),
    [productsFilters.brand],
  );

  const productsListQuery = useQuery({
    queryKey: crmAppKeys.crmProductsPage.list({
      page: productsPagination.currentPage,
      perPage: productsPagination.rowsPerPage,
      search: listSearch,
      activeFilter,
      industryId: productsFilters.industry_id,
      category: productsFilters.category,
      brandKey,
    }),
    queryFn: async () => {
      const params: {
        page: number;
        per_page: number;
        search?: string;
        active?: boolean;
        industry_id?: number;
        category?: string;
        brand?: string[];
      } = {
        page: productsPagination.currentPage,
        per_page: productsPagination.rowsPerPage,
      };

      if (listSearch) {
        params.search = listSearch;
      }

      if (activeFilter === "active") {
        params.active = true;
      } else if (activeFilter === "inactive") {
        params.active = false;
      }

      if (productsFilters.industry_id) {
        params.industry_id = productsFilters.industry_id;
      }

      if (productsFilters.category) {
        params.category = productsFilters.category;
      }

      if (productsFilters.brand.length > 0) {
        params.brand = productsFilters.brand;
      }

      const response = await getCrmProducts(params);
      return {
        data: response.data ?? [],
        total: response.total ?? 0,
      };
    },
  });

  const products = productsListQuery.data?.data ?? [];
  const totalProducts = productsListQuery.data?.total ?? 0;
  const loading = productsListQuery.isPending;

  const productTabCountQueries = useQueries({
    queries: [
      {
        queryKey: [
          ...crmAppKeys.crmProductsPage.all(),
          "tabCount",
          "all",
          listSearch,
          productsFilters.industry_id,
          productsFilters.category,
          brandKey,
        ] as const,
        queryFn: async () => {
          const response = await getCrmProducts(
            buildProductsTabCountParams(listSearch, productsFilters),
          );
          return response.total ?? 0;
        },
      },
      {
        queryKey: [
          ...crmAppKeys.crmProductsPage.all(),
          "tabCount",
          "active",
          listSearch,
          productsFilters.industry_id,
          productsFilters.category,
          brandKey,
        ] as const,
        queryFn: async () => {
          const response = await getCrmProducts(
            buildProductsTabCountParams(listSearch, productsFilters, true),
          );
          return response.total ?? 0;
        },
      },
      {
        queryKey: [
          ...crmAppKeys.crmProductsPage.all(),
          "tabCount",
          "inactive",
          listSearch,
          productsFilters.industry_id,
          productsFilters.category,
          brandKey,
        ] as const,
        queryFn: async () => {
          const response = await getCrmProducts(
            buildProductsTabCountParams(listSearch, productsFilters, false),
          );
          return response.total ?? 0;
        },
      },
    ],
  });

  const productFilterCounts = useMemo(
    () => ({
      all: productTabCountQueries[0]?.data ?? 0,
      active: productTabCountQueries[1]?.data ?? 0,
      inactive: productTabCountQueries[2]?.data ?? 0,
    }),
    [
      productTabCountQueries[0]?.data,
      productTabCountQueries[1]?.data,
      productTabCountQueries[2]?.data,
    ],
  );

  useEffect(() => {
    if (productsListQuery.isError) {
      toast.error(
        getErrorMessageFromUnknown(productsListQuery.error, "Failed to fetch products"),
      );
    }
  }, [productsListQuery.isError, productsListQuery.error]);

  const fetchProducts = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: crmAppKeys.crmProductsPage.all() });
  }, [queryClient]);

  useEffect(() => {
    setCurrentFilters((prev) =>
      prev.search === productsSearchQuery
        ? prev
        : { ...prev, search: productsSearchQuery },
    );
    setProductsPagination((prev) =>
      prev.currentPage === 1 ? prev : { ...prev, currentPage: 1 },
    );
  }, [productsSearchQuery, setProductsPagination]);

  const displayProducts = useMemo(() => {
    return products.map(convertToDisplayData);
  }, [products, convertToDisplayData]);

  const uniqueCategories = useMemo(() => {
    const categories = new Set<string>();
    products.forEach((p) => {
      if (p.category) categories.add(p.category);
    });
    return Array.from(categories).sort((a, b) => a.localeCompare(b));
  }, [products]);

  const industryFilterDropdownContent = useMemo(
    () => (
      <Form
        className="products-filter-form"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <Select
          options={industries.map((ind) => ({
            value: ind.id,
            label: ind.name,
          }))}
          value={
            productsFilters.industry_id
              ? {
                  value: productsFilters.industry_id,
                  label:
                    industries.find(
                      (ind) => ind.id === productsFilters.industry_id,
                    )?.name || "",
                }
              : null
          }
          onChange={(selected) => {
            setProductsFilters((prev) => ({
              ...prev,
              industry_id: selected ? Number(selected.value) : null,
            }));
            setProductsPagination((prev) => ({ ...prev, currentPage: 1 }));
          }}
          placeholder="Select product group..."
          styles={customSelectStyles}
          isLoading={loadingIndustries}
          isDisabled={loadingIndustries}
          isClearable
          {...getCrmReactSelectBodyMenuPortalProps()}
        />
      </Form>
    ),
    [
      customSelectStyles,
      industries,
      loadingIndustries,
      productsFilters.industry_id,
      setProductsPagination,
    ],
  );

  const categoryFilterDropdownContent = useMemo(
    () => (
      <Form
        className="products-filter-form"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <CreatableSelect
          options={uniqueCategories.map((cat) => ({
            value: cat,
            label: cat,
          }))}
          value={
            productsFilters.category
              ? {
                  value: productsFilters.category,
                  label: productsFilters.category,
                }
              : null
          }
          onChange={(selected) => {
            setProductsFilters((prev) => ({
              ...prev,
              category: selected ? String(selected.value) : null,
            }));
            setProductsPagination((prev) => ({ ...prev, currentPage: 1 }));
          }}
          placeholder="Select or create category..."
          styles={customSelectStyles}
          isClearable
          {...getCrmReactSelectBodyMenuPortalProps()}
        />
      </Form>
    ),
    [
      customSelectStyles,
      productsFilters.category,
      setProductsPagination,
      uniqueCategories,
    ],
  );

  const statusFilterDropdownContent = useMemo(
    () => (
      <Form
        className="products-filter-form products-filter-form--status"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <Select
          options={[
            { value: "Active", label: "Active" },
            { value: "Inactive", label: "Inactive" },
          ]}
          value={
            productsFilters.status
              ? {
                  value: productsFilters.status,
                  label: productsFilters.status,
                }
              : null
          }
          onChange={(selected) => {
            const statusValue = selected ? String(selected.value) : null;
            setProductsFilters((prev) => ({
              ...prev,
              status: statusValue,
            }));
            if (statusValue === "Active") {
              setActiveFilter("active");
            } else if (statusValue === "Inactive") {
              setActiveFilter("inactive");
            } else {
              setActiveFilter("all");
            }
            setProductsPagination((prev) => ({ ...prev, currentPage: 1 }));
          }}
          placeholder="Select status..."
          styles={customSelectStyles}
          isClearable
          {...getCrmReactSelectBodyMenuPortalProps()}
        />
      </Form>
    ),
    [customSelectStyles, productsFilters.status, setProductsPagination],
  );

  const productFilterPills = useMemo(
    () => [
      {
        id: "products-industry",
        label: "Product Group",
        showDropdown: true,
        active: Boolean(productsFilters.industry_id),
        activeLabel:
          productsFilters.industry_id === null
            ? undefined
            : industries.find((ind) => ind.id === productsFilters.industry_id)
                ?.name || String(productsFilters.industry_id),
        onClear:
          productsFilters.industry_id === null
            ? undefined
            : () => {
                setProductsFilters((prev) => ({ ...prev, industry_id: null }));
                setProductsPagination((prev) => ({
                  ...prev,
                  currentPage: 1,
                }));
              },
        dropdownContent: industryFilterDropdownContent,
      },
      {
        id: "products-category",
        label: "Category",
        showDropdown: true,
        active: Boolean(productsFilters.category),
        activeLabel: productsFilters.category || undefined,
        onClear: productsFilters.category
          ? () => {
              setProductsFilters((prev) => ({ ...prev, category: null }));
              setProductsPagination((prev) => ({ ...prev, currentPage: 1 }));
            }
          : undefined,
        dropdownContent: categoryFilterDropdownContent,
      },
      {
        id: "products-status",
        label: "Status",
        showDropdown: true,
        active: Boolean(productsFilters.status),
        activeLabel: productsFilters.status || undefined,
        onClear: productsFilters.status
          ? () => {
              setProductsFilters((prev) => ({ ...prev, status: null }));
              setActiveFilter("all");
              setProductsPagination((prev) => ({ ...prev, currentPage: 1 }));
            }
          : undefined,
        dropdownContent: statusFilterDropdownContent,
      },
    ],
    [
      categoryFilterDropdownContent,
      industries,
      industryFilterDropdownContent,
      productsFilters.category,
      productsFilters.industry_id,
      productsFilters.status,
      setProductsPagination,
      statusFilterDropdownContent,
    ],
  );

  const handleOpenProductModal = useCallback((product?: ProductDisplayData) => {
    if (product) {
      setEditingProduct(product);
      const industryId = product.industry_id ?? product.industry?.id ?? null;
      const normalizedIndustryId = normalizeIndustryId(industryId);

      setProductFormData({
        productName: product.productName,
        sku: product.sku,
        price: product.price.toString(),
        currency: product.currency,
        category: product.category,
        brand: product.brand,
        isActive: product.status === "Active",
        description: product.description,
        industry_id: normalizedIndustryId,
      });
    } else {
      setEditingProduct(null);
      setProductFormData({ ...EMPTY_PRODUCT_FORM });
    }
    setShowProductModal(true);
  }, []);

  const handleProductSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!productFormData.industry_id) {
      toast.error("Please select a product group");
      return;
    }

    try {
      setSubmittingProduct(true);
      const description = productFormData.description.trim();
      const category = productFormData.category.trim();
      const brand = productFormData.brand.trim();
      if (editingProduct) {
        const base: UpdateProductPayload = {
          id: editingProduct.id,
          name: productFormData.productName.trim(),
          description,
          sku: productFormData.sku.trim(),
          price: Number.parseFloat(productFormData.price) || 0,
          category,
          brand,
          active: productFormData.isActive,
          currency: productFormData.currency,
        };
        await updateProduct({
          ...base,
          industry_id: productFormData.industry_id,
        } as UpdateProductPayload & { industry_id: number });
      } else {
        const base: CreateProductPayload = {
          name: productFormData.productName.trim(),
          description,
          sku: productFormData.sku.trim(),
          price: Number.parseFloat(productFormData.price) || 0,
          category,
          brand,
          active: productFormData.isActive,
          currency: productFormData.currency,
        };
        await createProduct({
          ...base,
          industry_id: productFormData.industry_id,
        } as CreateProductPayload & { industry_id: number });
      }
      setShowProductModal(false);
      await fetchProducts();
    } catch (error: unknown) {
      toast.error(getErrorMessageFromUnknown(error, "Failed to save product"));
    } finally {
      setSubmittingProduct(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!deletingProduct) return;
    try {
      setDeletingProductPending(true);
      await deleteProduct(deletingProduct.id);
      setShowProductDeleteModal(false);
      setDeletingProduct(null);
      await fetchProducts();
    } catch (error: unknown) {
      toast.error(
        getErrorMessageFromUnknown(error, "Failed to delete product"),
      );
    } finally {
      setDeletingProductPending(false);
    }
  };

  const requestDeleteProduct = useCallback((product: ProductDisplayData) => {
    setDeletingProduct(product);
    setShowProductDeleteModal(true);
  }, []);

  const openProductView = useCallback((product: ProductDisplayData) => {
    setViewingProduct(product);
    setShowProductViewModal(true);
  }, []);

  return {
    session,
    products,
    totalProducts,
    loading,
    productsSearch,
    productsSearchQuery,
    handleProductsSearchChange,
    handleProductsSearchSubmit,
    productsFilters,
    setProductsFilters,
    showProductModal,
    setShowProductModal,
    editingProduct,
    setEditingProduct,
    submittingProduct,
    productsPagination,
    setProductsPagination,
    selectedProductsColumns,
    setSelectedProductsColumns,
    handleProductsPaginationChange,
    productFormData,
    setProductFormData,
    industries,
    loadingIndustries,
    deletingProduct,
    showProductDeleteModal,
    setShowProductDeleteModal,
    setDeletingProduct,
    deletingProductPending,
    showProductViewModal,
    setShowProductViewModal,
    viewingProduct,
    setViewingProduct,
    activeFilter,
    setActiveFilter,
    displayProducts,
    uniqueCategories,
    productFilterPills,
    customSelectStyles,
    fetchProducts,
    handleOpenProductModal,
    handleProductSubmit,
    handleDeleteProduct,
    requestDeleteProduct,
    openProductView,
    productFilterCounts,
  } satisfies UseCrmProductsPageResult;
}
