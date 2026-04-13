import "@assets/scss/datatable-style.scss";
import React, { useState, useEffect, useMemo } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericTable, {
  FilterPill,
  TableColumn,
  ToolbarConfig,
} from "@components/GenericTable";
import {
  getCrmProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getIndustries,
  CrmProduct,
  IndustryData,
} from "@utils/crm";
import {
  Button,
  Row,
  Col,
  Badge,
  Form,
  Modal,
} from "react-bootstrap";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import {
  AlertCircle,
  PlusCircle,
  Eye,
  Edit,
  Trash2,
  Package,
  X,
  Tag,
  FileText,
  Building2,
  Calendar,
  CheckCircle,
  Check,
} from "lucide-react";
import { toast } from "react-toastify";
import "@assets/scss/common.scss";
import DeleteConfirmationModal from "@pages/partial/DeleteConfirmationModal";
import { CrmDescriptionDetailsBlock, CrmTruncatedDescriptionCell } from "@components/crm/crmTruncatedDescriptionCell";
import {
  CRM_DIALOG_FOOTER_ACTIONS_ROW_STYLE,
  CRM_DIALOG_PRIMARY_BUTTON_STYLE,
  CRM_DIALOG_SECONDARY_BUTTON_STYLE,
} from "@components/crm/crmDialogActionButtonStyles";
import { useSession } from "next-auth/react";
import { formatDateForTable, normalizeSearchQuery } from "@utils/Helper";
import { useCrmSettingsTableState } from "@hooks/useCrmSettingsTableState";
import { useDebouncedSearchInput } from "@hooks/useDebouncedSearchInput";

// Product interface matching UI expectations
interface ProductDisplayData {
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

const PRODUCTS_TABLE_COLUMN_STORAGE_KEY = "productsSelectedColumns";
const DEFAULT_PRODUCT_TABLE_COLUMNS = [
  "productName",
  "sku",
  "price",
  "category",
  "brand",
  "status",
  "actions",
];

const ProductsPage = () => {
  const { data: session } = useSession();

  const getErrorMessageFromUnknown = (error: unknown, fallback: string): string => {
    if (error && typeof error === "object") {
      const ax = error as { response?: { data?: { message?: string } }; message?: string };
      const msg = ax.response?.data?.message;
      if (typeof msg === "string" && msg.length > 0) return msg;
      if (typeof ax.message === "string" && ax.message.length > 0) return ax.message;
    }
    if (error instanceof Error && error.message) return error.message;
    return fallback;
  };

  const handleHoverEnter = (
    e: React.MouseEvent<HTMLElement> | React.FocusEvent<HTMLElement>,
  ) => {
    e.currentTarget.style.background = "#e5e7eb";
    e.currentTarget.style.transform = "translateY(-2px)";
  };

  const handleHoverLeave = (
    e: React.MouseEvent<HTMLElement> | React.FocusEvent<HTMLElement>,
  ) => {
    e.currentTarget.style.background = "#f8f9fa";
    e.currentTarget.style.transform = "translateY(0)";
  };

  const handleCloseButtonEnter = (
    e: React.MouseEvent<HTMLButtonElement> | React.FocusEvent<HTMLButtonElement>,
  ) => {
    e.currentTarget.style.background = "rgba(255,255,255,0.3)";
    e.currentTarget.style.transform = "rotate(90deg)";
  };

  const handleCloseButtonLeave = (
    e: React.MouseEvent<HTMLButtonElement> | React.FocusEvent<HTMLButtonElement>,
  ) => {
    e.currentTarget.style.background = "rgba(255,255,255,0.2)";
    e.currentTarget.style.transform = "rotate(0deg)";
  };

  // State
  const [products, setProducts] = useState<CrmProduct[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loading, setLoading] = useState(true);
  const {
    inputValue: productsSearch,
    queryValue: productsSearchQuery,
    handleInputChange: handleProductsSearchChange,
    submitQuery: handleProductsSearchSubmit,
  } = useDebouncedSearchInput({
    normalize: normalizeSearchQuery,
  });
  const [productsFilters, setProductsFilters] = useState({
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

  const productTableSelectableKeys = [
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

  const {
    pagination: productsPagination,
    setPagination: setProductsPagination,
    selectedColumns: selectedProductsColumns,
    setSelectedColumns: setSelectedProductsColumns,
    handlePaginationChange: handleProductsPaginationChange,
  } = useCrmSettingsTableState({
    defaultSelectedColumns: DEFAULT_PRODUCT_TABLE_COLUMNS,
    selectableColumnKeys: productTableSelectableKeys,
    columnStorageKey: PRODUCTS_TABLE_COLUMN_STORAGE_KEY,
    initialPagination: { rowsPerPage: 10 },
  });
  const [productFormData, setProductFormData] = useState({
    productName: "",
    sku: "",
    price: "",
    currency: "AED",
    category: "",
    brand: "",
    isActive: true,
    description: "",
    industry_id: null as number | null,
  });
  const [industries, setIndustries] = useState<IndustryData[]>([]);
  const [loadingIndustries, setLoadingIndustries] = useState(false);
  const [deletingProduct, setDeletingProduct] =
    useState<ProductDisplayData | null>(null);
  const [showProductDeleteModal, setShowProductDeleteModal] = useState(false);
  const [deletingProductPending, setDeletingProductPending] = useState(false);
  const [showProductViewModal, setShowProductViewModal] = useState(false);
  const [viewingProduct, setViewingProduct] =
    useState<ProductDisplayData | null>(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [currentFilters, setCurrentFilters] = useState<Record<string, any>>({});

  // Custom select styles
  const customSelectStyles = {
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
  };


  // Fetch industries
  const fetchIndustries = async () => {
    try {
      setLoadingIndustries(true);
      const response = await getIndustries({ per_page: 1000 });
      setIndustries(response.data);
    } catch (error: any) {
      toast.error(getErrorMessageFromUnknown(error, "Failed to load industries"));
    } finally {
      setLoadingIndustries(false);
    }
  };

  useEffect(() => {
    fetchIndustries();
  }, []);

  // Convert CrmProduct to ProductDisplayData
  const convertToDisplayData = (product: CrmProduct): ProductDisplayData => {
    // Normalize industry_id: convert string to number if needed
    const rawIndustryId =
      (product as any).industry_id || (product as any).industry?.id || null;
    let normalizedIndustryId: number | null = null;
    if (rawIndustryId !== null) {
      if (typeof rawIndustryId === "string") {
        const parsed = Number.parseInt(rawIndustryId, 10);
        normalizedIndustryId = Number.isNaN(parsed) ? null : parsed;
      } else {
        normalizedIndustryId = rawIndustryId;
      }
    }

    return {
      id: product.id,
      productName: product.name,
      sku: product.sku,
      price: Number.parseFloat(product.price) || 0,
      currency: product.currency,
      category: product.category || "",
      brand: product.brand || "",
      status: product.active ? "Active" : "Inactive",
      description: product.description || "",
      created: formatDateForTable(product.created_at),
      industry: (product as any).industry || null,
      industry_id: normalizedIndustryId,
    };
  };

  // Fetch products
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: productsPagination.currentPage,
        per_page: productsPagination.rowsPerPage,
      };

      const searchQuery = normalizeSearchQuery(currentFilters.search);
      if (searchQuery) {
        params.search = searchQuery;
      }

      // Active filter (active/inactive)
      if (activeFilter === "active") {
        params.active = true;
      } else if (activeFilter === "inactive") {
        params.active = false;
      }

      // Industry filter
      if (productsFilters.industry_id) {
        params.industry_id = productsFilters.industry_id;
      }

      // Category filter
      if (productsFilters.category) {
        params.category = productsFilters.category;
      }

      // Brand filter
      if (productsFilters.brand.length > 0) {
        params.brand = productsFilters.brand;
      }

      // Status filter is handled by activeFilter (active=true/false)

      const response = await getCrmProducts(params);
      setTotalProducts(response.total);
      setProducts(response.data);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to fetch products",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [
    productsPagination.currentPage,
    productsPagination.rowsPerPage,
    currentFilters,
    activeFilter,
    productsFilters,
  ]);

  useEffect(() => {
    setCurrentFilters((prev) =>
      prev.search === productsSearchQuery
        ? prev
        : { ...prev, search: productsSearchQuery }
    );
    setProductsPagination((prev) =>
      prev.currentPage === 1 ? prev : { ...prev, currentPage: 1 }
    );
  }, [productsSearchQuery, setProductsPagination]);

  // Convert products to display data (no filtering - done by API)
  const displayProducts = useMemo(() => {
    return products.map(convertToDisplayData);
  }, [products]);

  // Get unique categories and brands from products
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
        style={{ minWidth: "240px" }}
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
          placeholder="Select industry..."
          styles={customSelectStyles}
          isLoading={loadingIndustries}
          isDisabled={loadingIndustries}
          isClearable
        />
      </Form>
    ),
    [customSelectStyles, industries, loadingIndustries, productsFilters.industry_id],
  );

  const categoryFilterDropdownContent = useMemo(
    () => (
      <Form
        style={{ minWidth: "240px" }}
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
              category: selected ? selected.value : null,
            }));
            setProductsPagination((prev) => ({ ...prev, currentPage: 1 }));
          }}
          placeholder="Select or create category..."
          styles={customSelectStyles}
          isClearable
        />
      </Form>
    ),
    [customSelectStyles, productsFilters.category, uniqueCategories],
  );

  const statusFilterDropdownContent = useMemo(
    () => (
      <Form
        style={{ minWidth: "220px" }}
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
            const statusValue = selected ? selected.value : null;
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
        />
      </Form>
    ),
    [customSelectStyles, productsFilters.status],
  );

  const productFilterPills = useMemo<FilterPill[]>(
    () => [
      {
        id: "products-industry",
        label: "Industry",
        showDropdown: true,
        active: Boolean(productsFilters.industry_id),
        activeLabel:
          productsFilters.industry_id === null
            ? undefined
            : industries.find((ind) => ind.id === productsFilters.industry_id)?.name ||
              String(productsFilters.industry_id),
        onClear:
          productsFilters.industry_id === null
            ? undefined
            : () => {
                setProductsFilters((prev) => ({ ...prev, industry_id: null }));
                setProductsPagination((prev) => ({ ...prev, currentPage: 1 }));
              },
        dropdownContent: industryFilterDropdownContent,
      },
      {
        id: "products-category",
        label: "Category",
        showDropdown: true,
        active: Boolean(productsFilters.category),
        activeLabel: productsFilters.category || undefined,
        onClear:
          productsFilters.category
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
        onClear:
          productsFilters.status
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
      statusFilterDropdownContent,
    ],
  );

  const productsTableColumns = useMemo<TableColumn<ProductDisplayData>[]>(() => {
    const cols: TableColumn<ProductDisplayData>[] = [];

    if (selectedProductsColumns.includes("productName")) {
      cols.push({
        key: "productName",
        label: "Product Name",
        sortable: true,
        type: "custom",
        render: (product) => <span className="fw-semibold">{product.productName}</span>,
      });
    }

    if (selectedProductsColumns.includes("sku")) {
      cols.push({
        key: "sku",
        label: "SKU",
        sortable: true,
        type: "custom",
        render: (product) => (
          <Badge bg="light" text="dark" className="font-monospace">
            {product.sku}
          </Badge>
        ),
      });
    }

    if (selectedProductsColumns.includes("price")) {
      cols.push({
        key: "price",
        label: "Price",
        sortable: true,
        type: "custom",
        render: (product) => (
          <span className="fw-semibold text-success">
            {product.currency} {product.price.toFixed(2)}
          </span>
        ),
      });
    }

    if (selectedProductsColumns.includes("currency")) {
      cols.push({
        key: "currency",
        label: "Currency",
        sortable: true,
      });
    }

    if (selectedProductsColumns.includes("category")) {
      cols.push({
        key: "category",
        label: "Category",
        sortable: true,
        type: "custom",
        render: (product) => (
          <Badge bg="info" className="bg-opacity-10 text-dark">
            {product.category || "N/A"}
          </Badge>
        ),
      });
    }

    if (selectedProductsColumns.includes("brand")) {
      cols.push({
        key: "brand",
        label: "Brand",
        sortable: true,
        type: "custom",
        render: (product) => <span>{product.brand || "N/A"}</span>,
      });
    }

    if (selectedProductsColumns.includes("status")) {
      cols.push({
        key: "status",
        label: "Status",
        sortable: true,
        type: "custom",
        render: (product) => (
          <Badge bg={product.status === "Active" ? "success" : "secondary"}>
            {product.status}
          </Badge>
        ),
      });
    }

    if (selectedProductsColumns.includes("description")) {
      cols.push({
        key: "description",
        label: "Description",
        sortable: false,
        type: "custom",
        width: "260px",
        render: (product) => (
          <CrmTruncatedDescriptionCell text={product.description} emptyDisplay="N/A" />
        ),
      });
    }

    if (selectedProductsColumns.includes("created")) {
      cols.push({
        key: "created",
        label: "Created",
        sortable: true,
        type: "custom",
        render: (product) => <span className="text-muted">{product.created}</span>,
      });
    }

    if (selectedProductsColumns.includes("actions")) {
      cols.push({
        key: "actions",
        label: "Actions",
        sortable: false,
        type: "custom",
        render: (product) => (
          <div className="d-flex gap-1">
            <Button
              variant="link"
              size="sm"
              className="p-1"
              title="View"
              onClick={() => {
                setViewingProduct(product);
                setShowProductViewModal(true);
              }}
            >
              <Eye size={16} />
            </Button>
            {session?.user?.permissions?.includes("edit-crm-products") && (
              <Button
                variant="link"
                size="sm"
                className="p-1"
                title="Edit"
                onClick={() => handleOpenProductModal(product)}
              >
                <Edit size={16} />
              </Button>
            )}
            {session?.user?.permissions?.includes("delete-crm-products") && (
              <Button
                variant="link"
                size="sm"
                className="p-1 text-danger"
                title="Delete"
                onClick={() => {
                  setDeletingProduct(product);
                  setShowProductDeleteModal(true);
                }}
              >
                <Trash2 size={16} />
              </Button>
            )}
          </div>
        ),
      });
    }

    return cols;
  }, [selectedProductsColumns, session?.user?.permissions]);

  const productsToolbarConfig = useMemo<ToolbarConfig>(
    () => ({
      showSearch: true,
      searchValue: productsSearch,
      searchPlaceholder: "Search by product name or SKU...",
      onSearchChange: handleProductsSearchChange,
      onSearch: handleProductsSearchSubmit,
      showTabs: true,
      showFilterPills: true,
      filterPills: productFilterPills,
      showMoreFiltersButton: false,
      tabs: [
        { id: "all", label: "All Products", icon: <Package size={14} />, removable: false },
        { id: "active", label: "Active", icon: <CheckCircle size={14} />, removable: false },
        { id: "inactive", label: "Inactive", icon: <X size={14} />, removable: false },
      ],
      activeTab: activeFilter,
      onTabChange: (filterId) => {
        setActiveFilter(filterId);
        if (filterId === "active") {
          setProductsFilters((prev) => ({ ...prev, status: "Active" }));
        } else if (filterId === "inactive") {
          setProductsFilters((prev) => ({ ...prev, status: "Inactive" }));
        } else {
          setProductsFilters((prev) => ({ ...prev, status: null }));
        }
        setProductsPagination((prev) => ({ ...prev, currentPage: 1 }));
      },
      rightActions: (
        <div className="d-flex gap-2">
          {session?.user?.permissions?.includes("add-crm-products") && (
            <Button
              onClick={() => handleOpenProductModal()}
              style={{
                backgroundColor: "#4f46e5",
                border: "none",
                borderRadius: "8px",
                color: "#ffffff",
                height: "33px",
                fontSize: "0.875rem",
                padding: "0 12px",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <PlusCircle size={15} />
              Add Product
            </Button>
          )}
        </div>
      ),
    }),
    [
      productFilterPills,
      productsSearch,
      activeFilter,
      handleProductsSearchChange,
      handleProductsSearchSubmit,
      session?.user?.permissions,
    ],
  );

  const handleOpenProductModal = (product?: ProductDisplayData) => {
    if (product) {
      setEditingProduct(product);
      // Convert industry_id to number if it's a string (API sometimes returns string)
      const industryId = product.industry_id || product.industry?.id || null;
      let normalizedIndustryId: number | null = null;
      if (industryId !== null) {
        if (typeof industryId === "string") {
          const parsed = Number.parseInt(industryId, 10);
          normalizedIndustryId = Number.isNaN(parsed) ? null : parsed;
        } else {
          normalizedIndustryId = industryId;
        }
      }

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
      setProductFormData({
        productName: "",
        sku: "",
        price: "",
        currency: "AED",
        category: "",
        brand: "",
        isActive: true,
        description: "",
        industry_id: null,
      });
    }
    setShowProductModal(true);
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate industry is selected
    if (!productFormData.industry_id) {
      toast.error("Please select an industry");
      return;
    }

    try {
      setSubmittingProduct(true);
      if (editingProduct) {
        // Update existing product
        const updatePayload: any = {
          id: editingProduct.id,
          name: productFormData.productName,
          description: productFormData.description,
          sku: productFormData.sku,
          price: Number.parseFloat(productFormData.price) || 0,
          category: productFormData.category,
          brand: productFormData.brand,
          active: productFormData.isActive,
          currency: productFormData.currency,
          industry_id: productFormData.industry_id,
        };
        await updateProduct(updatePayload);
      } else {
        // Create new product
        const createPayload: any = {
          name: productFormData.productName,
          description: productFormData.description,
          sku: productFormData.sku,
          price: Number.parseFloat(productFormData.price) || 0,
          category: productFormData.category,
          brand: productFormData.brand,
          active: productFormData.isActive,
          currency: productFormData.currency,
          industry_id: productFormData.industry_id,
        };
        await createProduct(createPayload);
      }
      setShowProductModal(false);
      // Refresh products after create/update
      await fetchProducts();
    } catch (error: any) {
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
      // Refresh products after delete
      await fetchProducts();
    } catch (error: any) {
      toast.error(getErrorMessageFromUnknown(error, "Failed to delete product"));
    } finally {
      setDeletingProductPending(false);
    }
  };

  let productSubmitButtonLabel = "Add Product";
  if (submittingProduct) {
    productSubmitButtonLabel = editingProduct
      ? "Updating Product..."
      : "Adding Product...";
  } else if (editingProduct) {
    productSubmitButtonLabel = "Update Product";
  }

  if (!session?.user?.permissions?.includes("list-crm-products")) {
    return null;
  }

  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle="CRM"
        mainLink="/crm/dashboard"
        subTitle="Products"
      />
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .products-table-wrapper {
          width: 100%;
          overflow: hidden;
        }
        .products-table-wrapper .table-responsive {
          width: 100%;
          overflow-x: auto;
          overflow-y: visible;
          -webkit-overflow-scrolling: touch;
        }
        .products-table-wrapper .table-responsive table {
          width: 100%;
          table-layout: auto;
          margin-bottom: 0;
        }
        .products-table-wrapper .table-responsive table th,
        .products-table-wrapper .table-responsive table td {
          padding: 12px 16px;
          vertical-align: middle;
        }
        .products-table-wrapper .table-responsive table td:last-child,
        .products-table-wrapper .table-responsive table th:last-child {
          max-width: none;
        }
        .products-table-wrapper .table-responsive table td[style*="width"],
        .products-table-wrapper .table-responsive table th[style*="width"] {
          max-width: none;
        }
      `,
        }}
      />
      <div>
        {/* Product Form Modal */}
        <Modal
          show={showProductModal}
          onHide={() => {
            if (submittingProduct) return;
            setShowProductModal(false);
          }}
          size="lg"
          centered
        >
          <Modal.Header closeButton={!submittingProduct} className="border-0 pb-0">
            <Modal.Title className="fw-bold">
              {editingProduct ? "Edit Product" : "Add New Product"}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form onSubmit={handleProductSubmit}>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">
                      Product Name <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="text"
                      value={productFormData.productName}
                      onChange={(e) =>
                        setProductFormData({
                          ...productFormData,
                          productName: e.target.value,
                        })
                      }
                      placeholder="Enter product name"
                      required
                    />
                    <Form.Text className="text-muted">
                      Enter a clear, descriptive name for your product
                    </Form.Text>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">
                      SKU <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="text"
                      value={productFormData.sku}
                      onChange={(e) =>
                        setProductFormData({
                          ...productFormData,
                          sku: e.target.value,
                        })
                      }
                      placeholder="Enter SKU"
                      required
                      disabled={!!editingProduct || submittingProduct}
                    />
                    <Form.Text className="text-muted">
                      Unique product identifier (e.g., PROD-001)
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">
                      Price <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="number"
                      step="0.01"
                      value={productFormData.price}
                      onChange={(e) =>
                        setProductFormData({
                          ...productFormData,
                          price: e.target.value,
                        })
                      }
                      placeholder="0.00"
                      required
                    />
                    <Form.Text className="text-muted">
                      Enter the base price (supports up to 2 decimal places)
                    </Form.Text>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">Currency</Form.Label>
                    <Form.Select
                      value={productFormData.currency}
                      onChange={(e) =>
                        setProductFormData({
                          ...productFormData,
                          currency: e.target.value,
                        })
                      }
                    >
                      <option value="AED">AED</option>
                    </Form.Select>
                    <Form.Text className="text-muted">
                      Select the currency for this product
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">
                      Product Group <span className="text-danger">*</span>
                    </Form.Label>
                    <Select
                      options={industries.map((ind) => ({
                        value: ind.id,
                        label: ind.name,
                      }))}
                      value={
                        productFormData.industry_id
                          ? {
                              value: productFormData.industry_id,
                              label:
                                industries.find(
                                  (ind) =>
                                    ind.id ===
                                    Number(productFormData.industry_id),
                                )?.name || "",
                            }
                          : null
                      }
                      onChange={(selected) =>
                        setProductFormData({
                          ...productFormData,
                          industry_id: selected
                            ? (() => {
                                if (typeof selected.value === "string") {
                                  const parsed = Number.parseInt(
                                    selected.value,
                                    10,
                                  );
                                  return Number.isNaN(parsed)
                                    ? null
                                    : parsed;
                                }
                                return selected.value;
                              })()
                            : null,
                        })
                      }
                      placeholder="Select product group..."
                      styles={customSelectStyles}
                      isLoading={loadingIndustries}
                      isDisabled={loadingIndustries || submittingProduct}
                      isClearable
                      required
                    />
                    <Form.Text className="text-muted">
                      Select the product group this product belongs to
                    </Form.Text>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">Category</Form.Label>
                    <CreatableSelect
                      options={uniqueCategories.map((cat) => ({
                        value: cat,
                        label: cat,
                      }))}
                      value={
                        productFormData.category
                          ? {
                              value: productFormData.category,
                              label: productFormData.category,
                            }
                          : null
                      }
                      onChange={(selected) =>
                        setProductFormData({
                          ...productFormData,
                          category: selected ? selected.value : "",
                        })
                      }
                      placeholder="Select or create category..."
                      styles={customSelectStyles}
                      isDisabled={submittingProduct}
                      isClearable
                    />
                    <Form.Text className="text-muted">
                      Choose or create a product category for better
                      organization
                    </Form.Text>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">Brand</Form.Label>
                    <Form.Control
                      type="text"
                      value={productFormData.brand}
                      onChange={(e) =>
                        setProductFormData({
                          ...productFormData,
                          brand: e.target.value,
                        })
                      }
                      placeholder="Enter brand name"
                    />
                    <Form.Text className="text-muted">
                      Enter the brand or manufacturer name
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={productFormData.description}
                  onChange={(e) =>
                    setProductFormData({
                      ...productFormData,
                      description: e.target.value,
                    })
                  }
                  placeholder="Enter product description"
                />
                <Form.Text className="text-muted">
                  Provide detailed information about features, specifications,
                  and benefits
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Check
                  type="switch"
                  id="product-active-switch"
                  label="Product Active"
                  checked={productFormData.isActive}
                  onChange={(e) =>
                    setProductFormData({
                      ...productFormData,
                      isActive: e.target.checked,
                    })
                  }
                />
                <Form.Text className="text-muted">
                  Toggle to make this product visible or hidden in your catalog
                </Form.Text>
              </Form.Group>

              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mt-4 w-100">
                <Form.Text className="text-muted d-flex align-items-center gap-1 mb-0 align-self-center">
                  <AlertCircle size={14} />
                  <span style={{ fontSize: "0.813rem" }}>
                    Fields marked with <span className="text-danger fw-bold">*</span> are required
                  </span>
                </Form.Text>
                <div style={CRM_DIALOG_FOOTER_ACTIONS_ROW_STYLE}>
                  <Button
                    variant="primary"
                    type="submit"
                    disabled={submittingProduct}
                    style={CRM_DIALOG_PRIMARY_BUTTON_STYLE}
                  >
                    <Check size={16} aria-hidden />
                    {productSubmitButtonLabel}
                  </Button>
                  <Button
                    variant="outline-secondary"
                    onClick={() => {
                      if (submittingProduct) return;
                      setShowProductModal(false);
                    }}
                    disabled={submittingProduct}
                    style={CRM_DIALOG_SECONDARY_BUTTON_STYLE}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </Form>
          </Modal.Body>
        </Modal>

        {/* Delete Confirmation Modal */}
        <DeleteConfirmationModal
          show={showProductDeleteModal}
          onHide={() => {
            setShowProductDeleteModal(false);
            setDeletingProduct(null);
          }}
          onConfirm={handleDeleteProduct}
          itemName={deletingProduct?.productName}
          itemType="product"
          loading={deletingProductPending}
        />

        {/* Product View Modal */}
        {viewingProduct && (
          <Modal
            show={showProductViewModal}
            onHide={() => setShowProductViewModal(false)}
            size="xl"
            centered
          >
            <div
              style={{
                color: "black",
                padding: "30px",
                position: "relative",
                borderTopLeftRadius: "8px",
                borderTopRightRadius: "8px",
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              <button
                onClick={() => setShowProductViewModal(false)}
                style={{
                  position: "absolute",
                  top: "20px",
                  right: "20px",
                  background: "rgba(255,255,255,0.2)",
                  border: "none",
                  color: "black",
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  cursor: "pointer",
                  transition: "all 0.3s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onMouseOver={handleCloseButtonEnter}
                onMouseOut={handleCloseButtonLeave}
                onFocus={handleCloseButtonEnter}
                onBlur={handleCloseButtonLeave}
              >
                <X size={20} />
              </button>
              <h3 style={{ margin: 0, fontWeight: 600, fontSize: "24px" }}>
                {viewingProduct.productName}
              </h3>
              <p
                style={{ margin: "8px 0 0 0", opacity: 0.9, fontSize: "14px" }}
              >
                Product Details
              </p>
            </div>

            <Modal.Body style={{ padding: "30px" }}>
              {/* Basic Information Section */}
              <div
                style={{
                  fontSize: "16px",
                  fontWeight: 600,
                  color: "#1f2937",
                  marginBottom: "20px",
                  paddingBottom: "10px",
                  borderBottom: "2px solid #f8f9fa",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <Package size={18} style={{ color: "#4680ff" }} />
                Basic Information
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                  gap: "20px",
                  marginBottom: "30px",
                }}
              >
                <div
                  style={{
                    background: "#f8f9fa",
                    padding: "16px",
                    borderRadius: "10px",
                    transition: "all 0.3s",
                  }}
                  onMouseOver={handleHoverEnter}
                  onMouseOut={handleHoverLeave}
                  onFocus={handleHoverEnter}
                  onBlur={handleHoverLeave}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#6b7280",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      marginBottom: "6px",
                    }}
                  >
                    Product Name
                  </div>
                  <div
                    style={{
                      fontSize: "15px",
                      color: "#1f2937",
                      fontWeight: 500,
                    }}
                  >
                    {viewingProduct.productName}
                  </div>
                </div>
                {(viewingProduct.industry || viewingProduct.industry_id) && (
                  <div
                    style={{
                      background: "#f8f9fa",
                      padding: "16px",
                      borderRadius: "10px",
                      transition: "all 0.3s",
                    }}
                    onMouseOver={handleHoverEnter}
                    onMouseOut={handleHoverLeave}
                    onFocus={handleHoverEnter}
                  onBlur={handleHoverLeave}
                  >
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "#6b7280",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        marginBottom: "6px",
                      }}
                    >
                      Product Group
                    </div>
                    <div
                      style={{
                        fontSize: "15px",
                        color: "#1f2937",
                        fontWeight: 500,
                      }}
                    >
                      <Badge
                        bg="primary"
                        className="bg-opacity-10 text-dark"
                        style={{ padding: "6px 14px", fontSize: "13px" }}
                      >
                        <Building2 size={14} style={{ marginRight: "6px" }} />
                        {viewingProduct.industry?.name ||
                          industries.find(
                            (ind) => ind.id === viewingProduct.industry_id,
                          )?.name ||
                          "N/A"}
                      </Badge>
                    </div>
                  </div>
                )}
                <div
                  style={{
                    background: "#f8f9fa",
                    padding: "16px",
                    borderRadius: "10px",
                    transition: "all 0.3s",
                  }}
                  onMouseOver={handleHoverEnter}
                  onMouseOut={handleHoverLeave}
                  onFocus={handleHoverEnter}
                  onBlur={handleHoverLeave}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#6b7280",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      marginBottom: "6px",
                    }}
                  >
                    SKU
                  </div>
                  <div
                    style={{
                      fontSize: "15px",
                      color: "#1f2937",
                      fontWeight: 500,
                    }}
                  >
                    <Badge
                      bg="light"
                      text="dark"
                      className="font-monospace"
                      style={{ padding: "6px 14px", fontSize: "13px" }}
                    >
                      {viewingProduct.sku}
                    </Badge>
                  </div>
                </div>
                <div
                  style={{
                    background: "#f8f9fa",
                    padding: "16px",
                    borderRadius: "10px",
                    transition: "all 0.3s",
                  }}
                  onMouseOver={handleHoverEnter}
                  onMouseOut={handleHoverLeave}
                  onFocus={handleHoverEnter}
                  onBlur={handleHoverLeave}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#6b7280",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      marginBottom: "6px",
                    }}
                  >
                    Price
                  </div>
                  <div
                    style={{
                      fontSize: "20px",
                      color: "#10b981",
                      fontWeight: 700,
                    }}
                  >
                    {viewingProduct.currency} {viewingProduct.price.toFixed(2)}
                  </div>
                </div>
                <div
                  style={{
                    background: "#f8f9fa",
                    padding: "16px",
                    borderRadius: "10px",
                    transition: "all 0.3s",
                  }}
                  onMouseOver={handleHoverEnter}
                  onMouseOut={handleHoverLeave}
                  onFocus={handleHoverEnter}
                  onBlur={handleHoverLeave}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#6b7280",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      marginBottom: "6px",
                    }}
                  >
                    Currency
                  </div>
                  <div
                    style={{
                      fontSize: "15px",
                      color: "#1f2937",
                      fontWeight: 500,
                    }}
                  >
                    {viewingProduct.currency}
                  </div>
                </div>
                <div
                  style={{
                    background: "#f8f9fa",
                    padding: "16px",
                    borderRadius: "10px",
                    transition: "all 0.3s",
                  }}
                  onMouseOver={handleHoverEnter}
                  onMouseOut={handleHoverLeave}
                  onFocus={handleHoverEnter}
                  onBlur={handleHoverLeave}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#6b7280",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      marginBottom: "6px",
                    }}
                  >
                    Status
                  </div>
                  <div
                    style={{
                      fontSize: "15px",
                      color: "#1f2937",
                      fontWeight: 500,
                    }}
                  >
                    <Badge
                      bg={
                        viewingProduct.status === "Active"
                          ? "success"
                          : "secondary"
                      }
                      style={{
                        padding: "6px 14px",
                        borderRadius: "20px",
                        fontSize: "12px",
                        fontWeight: 600,
                      }}
                    >
                      {viewingProduct.status}
                    </Badge>
                  </div>
                </div>
                <div
                  style={{
                    background: "#f8f9fa",
                    padding: "16px",
                    borderRadius: "10px",
                    transition: "all 0.3s",
                  }}
                  onMouseOver={handleHoverEnter}
                  onMouseOut={handleHoverLeave}
                  onFocus={handleHoverEnter}
                  onBlur={handleHoverLeave}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#6b7280",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      marginBottom: "6px",
                    }}
                  >
                    Created Date
                  </div>
                  <div
                    style={{
                      fontSize: "15px",
                      color: "#1f2937",
                      fontWeight: 500,
                    }}
                  >
                    <Calendar
                      size={14}
                      style={{ color: "#4680ff", marginRight: "6px" }}
                    />
                    {viewingProduct.created}
                  </div>
                </div>
              </div>

              {/* Product Details Section */}
              <div
                style={{
                  fontSize: "16px",
                  fontWeight: 600,
                  color: "#1f2937",
                  marginBottom: "20px",
                  paddingBottom: "10px",
                  borderBottom: "2px solid #f8f9fa",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <Tag size={18} style={{ color: "#4680ff" }} />
                Product Details
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                  gap: "20px",
                  marginBottom: "30px",
                }}
              >
                <div
                  style={{
                    background: "#f8f9fa",
                    padding: "16px",
                    borderRadius: "10px",
                    transition: "all 0.3s",
                  }}
                  onMouseOver={handleHoverEnter}
                  onMouseOut={handleHoverLeave}
                  onFocus={handleHoverEnter}
                  onBlur={handleHoverLeave}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#6b7280",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      marginBottom: "6px",
                    }}
                  >
                    Category
                  </div>
                  <div
                    style={{
                      fontSize: "15px",
                      color: "#1f2937",
                      fontWeight: 500,
                    }}
                  >
                    <Badge
                      bg="info"
                      className="bg-opacity-10 text-dark"
                      style={{ padding: "6px 14px", fontSize: "13px" }}
                    >
                      {viewingProduct.category || "N/A"}
                    </Badge>
                  </div>
                </div>
                <div
                  style={{
                    background: "#f8f9fa",
                    padding: "16px",
                    borderRadius: "10px",
                    transition: "all 0.3s",
                  }}
                  onMouseOver={handleHoverEnter}
                  onMouseOut={handleHoverLeave}
                  onFocus={handleHoverEnter}
                  onBlur={handleHoverLeave}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#6b7280",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      marginBottom: "6px",
                    }}
                  >
                    Brand
                  </div>
                  <div
                    style={{
                      fontSize: "15px",
                      color: "#1f2937",
                      fontWeight: 500,
                    }}
                  >
                    <Building2
                      size={14}
                      style={{ color: "#4680ff", marginRight: "6px" }}
                    />
                    {viewingProduct.brand || "N/A"}
                  </div>
                </div>
              </div>

              {/* Description Section */}
              <div
                style={{
                  fontSize: "16px",
                  fontWeight: 600,
                  color: "#1f2937",
                  marginBottom: "20px",
                  paddingBottom: "10px",
                  borderBottom: "2px solid #f8f9fa",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <FileText size={18} style={{ color: "#4680ff" }} />
                Description
              </div>
              <CrmDescriptionDetailsBlock
                text={viewingProduct.description}
                emptyDisplay="No description available"
              />
            </Modal.Body>

            <Modal.Footer
              className="border-0"
              style={{ borderTop: "1px solid #e5e7eb", padding: "20px 30px" }}
            >
              <div
                className="w-100 d-flex justify-content-end"
                style={CRM_DIALOG_FOOTER_ACTIONS_ROW_STYLE}
              >
                {session?.user?.permissions?.includes("edit-crm-products") && (
                  <Button
                    variant="primary"
                    onClick={() => {
                      setShowProductViewModal(false);
                      handleOpenProductModal(viewingProduct);
                    }}
                    style={CRM_DIALOG_PRIMARY_BUTTON_STYLE}
                  >
                    <Edit size={16} aria-hidden />
                    Edit Product
                  </Button>
                )}
                <Button
                  variant="outline-secondary"
                  onClick={() => setShowProductViewModal(false)}
                  style={CRM_DIALOG_SECONDARY_BUTTON_STYLE}
                >
                  Close
                </Button>
              </div>
            </Modal.Footer>
          </Modal>
        )}

        <div className="products-table-wrapper mb-4">
          <GenericTable<ProductDisplayData>
            data={displayProducts}
            columns={productsTableColumns}
            actions={[]}
            showActions={false}
            loading={loading}
            loadingMessage="Loading products..."
            emptyMessage="No products found matching your criteria"
            pagination={{
              currentPage: productsPagination.currentPage,
              rowsPerPage: productsPagination.rowsPerPage,
              totalRows: totalProducts,
              pageSizeOptions: [10, 25, 50, 100],
            }}
            onPaginationChange={handleProductsPaginationChange}
            sortable
            customizableColumns
            selectedColumns={selectedProductsColumns}
            defaultSelectedColumns={DEFAULT_PRODUCT_TABLE_COLUMNS}
            onColumnChange={setSelectedProductsColumns}
            columnStorageKey={PRODUCTS_TABLE_COLUMN_STORAGE_KEY}
            showToolbar
            toolbar={productsToolbarConfig}
            showToolbarActions={false}
            uniqueKey="id"
          />
        </div>
      </div>
    </React.Fragment>
  );
};

ProductsPage.getLayout = (page: React.ReactNode) => {
  return <Layout>{page}</Layout>;
};

export default ProductsPage;
