import "@assets/scss/datatable-style.scss";
import React, { useState, useEffect, useMemo } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import {
  getCrmProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getIndustries,
  CrmProduct,
  CreateProductPayload,
  UpdateProductPayload,
  IndustryData,
} from "@utils/crm";
import {
  Button,
  Row,
  Col,
  Badge,
  Dropdown,
  Form,
  Card,
  Table,
  InputGroup,
  Modal,
} from "react-bootstrap";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import {
  PlusCircle,
  Eye,
  Edit,
  Trash2,
  Search,
  Filter,
  Layers,
  Package,
  X,
  Tag,
  FileText,
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CheckCircle,
} from "lucide-react";
import { toast } from "react-toastify";
import "@assets/scss/common.scss";
import DeleteConfirmationModal from "@pages/partial/DeleteConfirmationModal";
import { useSession } from "next-auth/react";

// Filter Bar Component
interface FilterBarProps {
  quickFilters: {
    id: string;
    label: string;
    variant?: string;
    color?: string;
    icon?: React.ReactNode;
  }[];
  activeFilter: string;
  onFilterChange: (filterId: string) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSearch: () => void;
  searchPlaceholder?: string;
  showAdvancedFilters: boolean;
  onToggleAdvancedFilters: () => void;
  advancedFilterCount?: number;
}

const FilterBar: React.FC<FilterBarProps> = ({
  quickFilters,
  activeFilter,
  onFilterChange,
  searchValue,
  onSearchChange,
  onSearch,
  searchPlaceholder = "Search...",
  showAdvancedFilters,
  onToggleAdvancedFilters,
  advancedFilterCount = 0,
}) => {
  return (
    <Card className="border-0 shadow-sm mb-3">
      <Card.Body className="p-3">
        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-stretch align-items-lg-center gap-3">
          {/* Left Side: Quick Filter Buttons */}
          <div className="d-flex gap-2 flex-wrap align-items-center flex-grow-1">
            {quickFilters.map((filter) => {
              const isActive = activeFilter === filter.id;
              const hasCustomColor = filter.color;

              const buttonStyle: React.CSSProperties = {};
              if (hasCustomColor) {
                if (isActive) {
                  const bgColor = filter.color;
                  buttonStyle.background = bgColor;
                  buttonStyle.borderColor = bgColor;
                  buttonStyle.color = "#fff";
                } else {
                  buttonStyle.background = "#fff";
                  buttonStyle.borderColor = filter.color;
                  buttonStyle.color = filter.color;
                }
              }

              return (
                <Button
                  key={filter.id}
                  variant={
                    hasCustomColor
                      ? undefined
                      : isActive
                      ? (filter.variant || "primary")
                      : "outline-secondary"
                  }
                  onClick={() => onFilterChange(filter.id)}
                  className="d-flex align-items-center gap-2"
                  style={hasCustomColor ? buttonStyle : undefined}
                >
                  {filter.icon && (
                    <span className="d-flex align-items-center">{filter.icon}</span>
                  )}
                  {filter.label}
                </Button>
              );
            })}
          </div>

          {/* Right Side: Search and Filters */}
          <div className="d-flex flex-column flex-sm-row gap-2 align-items-stretch align-items-sm-center flex-shrink-0">
            <InputGroup
              style={{ width: "300px", minWidth: "200px" }}
              className="flex-shrink-0"
            >
              <Form.Control
                style={{ height: "41px" }}
                type="text"
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    onSearch();
                  }
                }}
              />
              <Button variant="outline-secondary" onClick={onSearch}>
                <Search size={16} />
              </Button>
            </InputGroup>
            <Button
              variant={showAdvancedFilters ? "primary" : "outline-secondary"}
              onClick={onToggleAdvancedFilters}
              className="d-flex align-items-center flex-shrink-0"
            >
              <Filter size={16} className="me-2" />
              Filters
              {advancedFilterCount > 0 && (
                <Badge bg="light" text="dark" className="ms-2">
                  {advancedFilterCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

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

const ProductsPage = () => {
  const { data: session } = useSession();
  
  // State
  const [products, setProducts] = useState<CrmProduct[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [productsPagination, setProductsPagination] = useState({
    currentPage: 1,
    rowsPerPage: 10,
    sortColumn: "",
    sortDirection: "asc" as "asc" | "desc",
  });
  const [productsSearch, setProductsSearch] = useState("");
  const [productsFilters, setProductsFilters] = useState({
    industry_ids: [] as number[],
    category: null as string | null,
    brand: [] as string[],
    status: null as string | null,
    priceMin: "",
    priceMax: "",
  });
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductDisplayData | null>(null);
  const [selectedProductsColumns, setSelectedProductsColumns] = useState<string[]>([
    "productName",
    "sku",
    "price",
    "category",
    "brand",
    "status",
  ]);
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
  const [deletingProduct, setDeletingProduct] = useState<ProductDisplayData | null>(null);
  const [showProductDeleteModal, setShowProductDeleteModal] = useState(false);
  const [showProductViewModal, setShowProductViewModal] = useState(false);
  const [viewingProduct, setViewingProduct] = useState<ProductDisplayData | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
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

  // Helper functions
  const sortData = <T extends Record<string, any>>(
    data: T[],
    sortColumn: string,
    sortDirection: "asc" | "desc"
  ): T[] => {
    if (!sortColumn) return data;

    return [...data].sort((a, b) => {
      let aVal = a[sortColumn];
      let bVal = b[sortColumn];

      if (aVal === undefined) aVal = "";
      if (bVal === undefined) bVal = "";

      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();

      if (aStr < bStr) return sortDirection === "asc" ? -1 : 1;
      if (aStr > bStr) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  };

  const paginateData = <T,>(data: T[], currentPage: number, rowsPerPage: number): T[] => {
// pagination handled by backend
    return data;
  };

  const getTotalPages = (dataLength: number, rowsPerPage: number): number => {
    return Math.ceil(dataLength / rowsPerPage);
  };

  const renderPaginationControls = (
    dataLength: number,
    paginationState: any,
    setPaginationState: (state: any) => void,
    label: string
  ) => {
    const totalPages = getTotalPages(dataLength, paginationState.rowsPerPage);
    const { currentPage, rowsPerPage } = paginationState;
    const startRow = (currentPage - 1) * rowsPerPage + 1;
    const endRow = Math.min(currentPage * rowsPerPage, dataLength);

    return (
      <div className="d-flex justify-content-between align-items-center mt-3">
        <div className="d-flex align-items-center gap-2">
          <span className="text-muted small">Show</span>
          <Form.Select
            size="sm"
            value={rowsPerPage}
            onChange={(e) =>
              setPaginationState({
                ...paginationState,
                rowsPerPage: Number(e.target.value),
                currentPage: 1,
              })
            }
            style={{ width: "auto" }}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </Form.Select>
          <span className="text-muted small">entries</span>
        </div>

        <div className="text-muted small">
          Showing {startRow} to {endRow} of {dataLength} {label}
        </div>

        <div className="d-flex gap-1">
          <Button
            size="sm"
            variant="outline-secondary"
            disabled={currentPage === 1}
            onClick={() => setPaginationState({ ...paginationState, currentPage: 1 })}
          >
            <ChevronsLeft size={14} />
          </Button>
          <Button
            size="sm"
            variant="outline-secondary"
            disabled={currentPage === 1}
            onClick={() =>
              setPaginationState({ ...paginationState, currentPage: currentPage - 1 })
            }
          >
            <ChevronLeft size={14} />
          </Button>

          {[...new Array(totalPages)].map((_, index) => {
            const pageNum = index + 1;
            if (
              pageNum === 1 ||
              pageNum === totalPages ||
              (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
            ) {
              return (
                <Button
                  key={pageNum}
                  size="sm"
                  variant={currentPage === pageNum ? "primary" : "outline-secondary"}
                  onClick={() =>
                    setPaginationState({ ...paginationState, currentPage: pageNum })
                  }
                >
                  {pageNum}
                </Button>
              );
            } else if (
              pageNum === currentPage - 2 ||
              pageNum === currentPage + 2
            ) {
              return (
                <span key={pageNum} className="px-2">
                  ...
                </span>
              );
            }
            return null;
          })}

          <Button
            size="sm"
            variant="outline-secondary"
            disabled={currentPage === totalPages}
            onClick={() =>
              setPaginationState({ ...paginationState, currentPage: currentPage + 1 })
            }
          >
            <ChevronRight size={14} />
          </Button>
          <Button
            size="sm"
            variant="outline-secondary"
            disabled={currentPage === totalPages}
            onClick={() =>
              setPaginationState({ ...paginationState, currentPage: totalPages })
            }
          >
            <ChevronsRight size={14} />
          </Button>
        </div>
      </div>
    );
  };

  // Fetch industries
  const fetchIndustries = async () => {
    try {
      setLoadingIndustries(true);
      const response = await getIndustries({ per_page: 1000 });
      setIndustries(response.data);
    } catch (error: any) {
      // Error toast is handled in the API function
    } finally {
      setLoadingIndustries(false);
    }
  };

  useEffect(() => {
    fetchIndustries();
  }, []);

  // Convert CrmProduct to ProductDisplayData
  const convertToDisplayData = (product: CrmProduct): ProductDisplayData => {
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
      created: new Date(product.created_at).toLocaleDateString(),
      industry: (product as any).industry || null,
      industry_id: (product as any).industry_id || null,
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

      if (currentFilters.search) {
        params.search = currentFilters.search;
      }

      // Active filter (active/inactive)
      if (activeFilter === "active") {
        params.active = true;
      } else if (activeFilter === "inactive") {
        params.active = false;
      }

      // Industry filter
      if (productsFilters.industry_ids.length > 0) {
        params.industry_ids = productsFilters.industry_ids;
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
      toast.error(error?.response?.data?.message || error?.message || "Failed to fetch products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [productsPagination.currentPage, productsPagination.rowsPerPage, currentFilters, activeFilter, productsFilters]);

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

  const uniqueBrands = useMemo(() => {
    const brands = new Set<string>();
    products.forEach((p) => {
      if (p.brand) brands.add(p.brand);
    });
    return Array.from(brands).sort((a, b) => a.localeCompare(b));
  }, [products]);

  // Quick filters
  const productQuickFilters = useMemo(() => {
    return [
      {
        id: "all",
        label: "All Products",
        color: "#6c757d",
        icon: <Package size={16} />,
      },
      {
        id: "active",
        label: "Active",
        color: "#198754",
        icon: <CheckCircle size={16} />,
      },
      {
        id: "inactive",
        label: "Inactive",
        color: "#6c757d",
        icon: <X size={16} />,
      },
    ];
  }, []);

  // Available columns
  const availableColumns = [
    { key: "productName", label: "Product Name" },
    { key: "sku", label: "SKU" },
    { key: "price", label: "Price" },
    { key: "currency", label: "Currency" },
    { key: "category", label: "Category" },
    { key: "brand", label: "Brand" },
    { key: "status", label: "Status" },
    { key: "description", label: "Description" },
    { key: "created", label: "Created Date" },
  ];

  const handleOpenProductModal = (product?: ProductDisplayData) => {
    if (product) {
      setEditingProduct(product);
      setProductFormData({
        productName: product.productName,
        sku: product.sku,
        price: product.price.toString(),
        currency: product.currency,
        category: product.category,
        brand: product.brand,
        isActive: product.status === "Active",
        description: product.description,
        industry_id: product.industry_id || product.industry?.id || null,
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
      // Error toast is handled in the API function
    }
  };

  const handleDeleteProduct = async () => {
    if (!deletingProduct) return;
    try {
      await deleteProduct(deletingProduct.id);
      setShowProductDeleteModal(false);
      setDeletingProduct(null);
      // Refresh products after delete
      await fetchProducts();
    } catch (error: any) {
      // Error toast is handled in the API function
    }
  };

  if (!session?.user?.permissions?.includes('list-crm-products')) {
    return null;
  }

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="CRM" mainLink="/crm/dashboard" subTitle="Products" />
      <style dangerouslySetInnerHTML={{__html: `
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
      `}} />
      <div>
        {/* Product Form Modal */}
        <Modal
          show={showProductModal}
          onHide={() => setShowProductModal(false)}
          size="lg"
          centered
        >
          <Modal.Header closeButton className="border-0 pb-0">
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
                        setProductFormData({ ...productFormData, productName: e.target.value })
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
                        setProductFormData({ ...productFormData, sku: e.target.value })
                      }
                      placeholder="Enter SKU"
                      required
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
                        setProductFormData({ ...productFormData, price: e.target.value })
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
                        setProductFormData({ ...productFormData, currency: e.target.value })
                      }
                    >
                     
                      <option value="AED">AED</option>
                    </Form.Select>
                    <Form.Text className="text-muted">Select the currency for this product</Form.Text>
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">
                      Industry <span className="text-danger">*</span>
                    </Form.Label>
                    <Select
                      options={industries.map((ind) => ({ value: ind.id, label: ind.name }))}
                      value={productFormData.industry_id ? {
                        value: productFormData.industry_id,
                        label: industries.find((ind) => ind.id === productFormData.industry_id)?.name || ''
                      } : null}
                      onChange={(selected) =>
                        setProductFormData({
                          ...productFormData,
                          industry_id: selected ? selected.value : null,
                        })
                      }
                      placeholder="Select industry..."
                      styles={customSelectStyles}
                      isLoading={loadingIndustries}
                      isDisabled={loadingIndustries}
                      isClearable
                      required
                    />
                    <Form.Text className="text-muted">
                      Select the industry this product belongs to
                    </Form.Text>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">Category</Form.Label>
                    <CreatableSelect
                      options={uniqueCategories.map((cat) => ({ value: cat, label: cat }))}
                      value={productFormData.category ? { value: productFormData.category, label: productFormData.category } : null}
                      onChange={(selected) =>
                        setProductFormData({ ...productFormData, category: selected ? selected.value : "" })
                      }
                      placeholder="Select or create category..."
                      styles={customSelectStyles}
                      isClearable
                    />
                    <Form.Text className="text-muted">
                      Choose or create a product category for better organization
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
                        setProductFormData({ ...productFormData, brand: e.target.value })
                      }
                      placeholder="Enter brand name"
                    />
                    <Form.Text className="text-muted">Enter the brand or manufacturer name</Form.Text>
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
                    setProductFormData({ ...productFormData, description: e.target.value })
                  }
                  placeholder="Enter product description"
                />
                <Form.Text className="text-muted">
                  Provide detailed information about features, specifications, and benefits
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Check
                  type="switch"
                  id="product-active-switch"
                  label="Product Active"
                  checked={productFormData.isActive}
                  onChange={(e) =>
                    setProductFormData({ ...productFormData, isActive: e.target.checked })
                  }
                />
                <Form.Text className="text-muted">
                  Toggle to make this product visible or hidden in your catalog
                </Form.Text>
              </Form.Group>

              <div className="d-flex justify-content-end gap-2 mt-4">
                <Button variant="secondary" onClick={() => setShowProductModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit">
                  {editingProduct ? "Update Product" : "Add Product"}
                </Button>
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
                onMouseOver={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.3)";
                  e.currentTarget.style.transform = "rotate(90deg)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.2)";
                  e.currentTarget.style.transform = "rotate(0deg)";
                }}
              >
                <X size={20} />
              </button>
              <h3 style={{ margin: 0, fontWeight: 600, fontSize: "24px" }}>
                {viewingProduct.productName}
              </h3>
              <p style={{ margin: "8px 0 0 0", opacity: 0.9, fontSize: "14px" }}>
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
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = "#e5e7eb";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = "#f8f9fa";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
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
                  <div style={{ fontSize: "15px", color: "#1f2937", fontWeight: 500 }}>
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
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = "#e5e7eb";
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = "#f8f9fa";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
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
                      Industry
                    </div>
                    <div style={{ fontSize: "15px", color: "#1f2937", fontWeight: 500 }}>
                      <Badge
                        bg="primary"
                        className="bg-opacity-10 text-dark"
                        style={{ padding: "6px 14px", fontSize: "13px" }}
                      >
                        <Building2 size={14} style={{ marginRight: "6px" }} />
                        {viewingProduct.industry?.name ||
                          industries.find((ind) => ind.id === viewingProduct.industry_id)?.name ||
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
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = "#e5e7eb";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = "#f8f9fa";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
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
                  <div style={{ fontSize: "15px", color: "#1f2937", fontWeight: 500 }}>
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
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = "#e5e7eb";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = "#f8f9fa";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
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
                  <div style={{ fontSize: "20px", color: "#10b981", fontWeight: 700 }}>
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
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = "#e5e7eb";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = "#f8f9fa";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
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
                  <div style={{ fontSize: "15px", color: "#1f2937", fontWeight: 500 }}>
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
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = "#e5e7eb";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = "#f8f9fa";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
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
                  <div style={{ fontSize: "15px", color: "#1f2937", fontWeight: 500 }}>
                    <Badge
                      bg={viewingProduct.status === "Active" ? "success" : "secondary"}
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
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = "#e5e7eb";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = "#f8f9fa";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
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
                  <div style={{ fontSize: "15px", color: "#1f2937", fontWeight: 500 }}>
                    <Calendar size={14} style={{ color: "#4680ff", marginRight: "6px" }} />
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
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = "#e5e7eb";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = "#f8f9fa";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
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
                  <div style={{ fontSize: "15px", color: "#1f2937", fontWeight: 500 }}>
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
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = "#e5e7eb";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = "#f8f9fa";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
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
                  <div style={{ fontSize: "15px", color: "#1f2937", fontWeight: 500 }}>
                    <Building2 size={14} style={{ color: "#4680ff", marginRight: "6px" }} />
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
              <div
                style={{
                  background: "#f8f9fa",
                  padding: "20px",
                  borderRadius: "10px",
                  marginBottom: "30px",
                }}
              >
                <p style={{ margin: 0, fontSize: "15px", color: "#4b5563", lineHeight: "1.6" }}>
                  {viewingProduct.description || "No description available"}
                </p>
              </div>
            </Modal.Body>

            <Modal.Footer style={{ borderTop: "1px solid #e5e7eb", padding: "20px 30px" }}>
              {session?.user?.permissions?.includes('edit-crm-products') && (
                <Button
                  variant="outline-primary"
                  onClick={() => {
                    setShowProductViewModal(false);
                    handleOpenProductModal(viewingProduct);
                  }}
                  className="d-flex align-items-center gap-2"
                >
                  <Edit size={16} />
                  Edit Product
                </Button>
              )}
              <Button variant="secondary" onClick={() => setShowProductViewModal(false)}>
                Close
              </Button>
            </Modal.Footer>
          </Modal>
        )}

        {/* Page Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h3 className="fw-bold mb-1">Products</h3>
            <p className="text-muted mb-0">Manage your product catalog</p>
          </div>
          {session?.user?.permissions?.includes('add-crm-products') && (
            <Button
              variant="primary"
              onClick={() => handleOpenProductModal()}
              className="d-flex align-items-center gap-2"
            >
              <PlusCircle size={18} />
              Add Product
            </Button>
          )}
        </div>

        {/* Filter Bar */}
        <FilterBar
          quickFilters={productQuickFilters}
          activeFilter={activeFilter}
          onFilterChange={(filterId) => {
            setActiveFilter(filterId);
            // Sync status filter dropdown with activeFilter
            if (filterId === "active") {
              setProductsFilters((prev) => ({ ...prev, status: "Active" }));
            } else if (filterId === "inactive") {
              setProductsFilters((prev) => ({ ...prev, status: "Inactive" }));
            } else {
              setProductsFilters((prev) => ({ ...prev, status: null }));
            }
            setProductsPagination({ ...productsPagination, currentPage: 1 });
          }}
          searchValue={productsSearch}
          onSearchChange={(value) => setProductsSearch(value)}
          onSearch={() => {
            setCurrentFilters({ ...currentFilters, search: productsSearch });
            setProductsPagination({ ...productsPagination, currentPage: 1 });
          }}
          searchPlaceholder="Search by product name or SKU..."
          showAdvancedFilters={showAdvancedFilters}
          onToggleAdvancedFilters={() => setShowAdvancedFilters(!showAdvancedFilters)}
          advancedFilterCount={
            productsFilters.industry_ids.length +
            (productsFilters.category ? 1 : 0) +
            productsFilters.brand.length +
            (productsFilters.status ? 1 : 0)
          }
        />

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <Card className="border-0 shadow-sm mb-4">
            <Card.Body>
              <Row className="g-3 align-items-end">
                <Col md={2}>
                  <Form.Label className="small fw-bold mb-2">Industry</Form.Label>
                  <Select
                    isMulti
                    options={industries.map((ind) => ({ value: ind.id, label: ind.name }))}
                    value={productsFilters.industry_ids.map((id) => {
                      const industry = industries.find((ind) => ind.id === id);
                      return industry ? { value: industry.id, label: industry.name } : null;
                    }).filter(Boolean) as { value: number; label: string }[]}
                    onChange={(selected) => {
                      setProductsFilters((prev) => ({
                        ...prev,
                        industry_ids: selected ? selected.map((option) => option.value) : [],
                      }));
                      setProductsPagination({ ...productsPagination, currentPage: 1 });
                    }}
                    placeholder="Select industries..."
                    styles={customSelectStyles}
                    isLoading={loadingIndustries}
                    isDisabled={loadingIndustries}
                    isClearable
                  />
                </Col>
                <Col md={2}>
                  <Form.Label className="small fw-bold mb-2">Category</Form.Label>
                  <CreatableSelect
                    options={uniqueCategories.map((cat) => ({ value: cat, label: cat }))}
                    value={productsFilters.category ? { value: productsFilters.category, label: productsFilters.category } : null}
                    onChange={(selected) => {
                      setProductsFilters((prev) => ({
                        ...prev,
                        category: selected ? selected.value : null,
                      }));
                      setProductsPagination({ ...productsPagination, currentPage: 1 });
                    }}
                    placeholder="Select or create category..."
                    styles={customSelectStyles}
                    isClearable
                  />
                </Col>
                
                <Col md={2}>
                  <Form.Label className="small fw-bold mb-2">Status</Form.Label>
                  <Select
                    options={[
                      { value: "Active", label: "Active" },
                      { value: "Inactive", label: "Inactive" },
                    ]}
                    value={productsFilters.status ? { value: productsFilters.status, label: productsFilters.status } : null}
                    onChange={(selected) => {
                      const statusValue = selected ? selected.value : null;
                      setProductsFilters((prev) => ({
                        ...prev,
                        status: statusValue,
                      }));
                      // Sync activeFilter buttons with status dropdown
                      if (statusValue === "Active") {
                        setActiveFilter("active");
                      } else if (statusValue === "Inactive") {
                        setActiveFilter("inactive");
                      } else {
                        setActiveFilter("all");
                      }
                      setProductsPagination({ ...productsPagination, currentPage: 1 });
                    }}
                    placeholder="Select status..."
                    styles={customSelectStyles}
                    isClearable
                  />
                </Col>
                <Col md={2}>
                  <div className="d-flex gap-2">
                    {/* <Button
                      variant="primary"
                      className="flex-grow-1 d-flex align-items-center justify-content-center"
                      onClick={() => {
                        setProductsPagination({ ...productsPagination, currentPage: 1 });
                        // Filters are applied automatically via useEffect
                      }}
                    >
                      Apply
                    </Button> */}
                    <Button
                      variant="outline-secondary"
                      className="d-flex align-items-center justify-content-center"
                      onClick={() => {
                        setProductsFilters({
                          industry_ids: [],
                          category: null,
                          brand: [],
                          status: null,
                          priceMin: "",
                          priceMax: "",
                        });
                        setActiveFilter("all");
                        setProductsPagination({ ...productsPagination, currentPage: 1 });
                      }}
                    >
                      Reset
                    </Button>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        )}

        {/* Column Customization */}
        <div className="d-flex justify-content-end gap-2 mb-3">
          <Dropdown>
            <Dropdown.Toggle variant="outline-secondary" size="sm">
              <Layers size={16} className="me-2" />
              Customize Table
            </Dropdown.Toggle>
            <Dropdown.Menu align="end" style={{ maxHeight: "300px", overflowY: "auto" }}>
              {availableColumns.map((col) => (
                <Dropdown.Item key={col.key} as="div">
                  <Form.Check
                    type="checkbox"
                    label={col.label}
                    checked={selectedProductsColumns.includes(col.key)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedProductsColumns([...selectedProductsColumns, col.key]);
                      } else {
                        setSelectedProductsColumns(
                          selectedProductsColumns.filter((c) => c !== col.key)
                        );
                      }
                    }}
                  />
                </Dropdown.Item>
              ))}
              <Dropdown.Divider />
              <Dropdown.Item
                onClick={() =>
                  setSelectedProductsColumns([
                    "productName",
                    "sku",
                    "price",
                    "currency",
                    "category",
                    "brand",
                    "status",
                    "description",
                    "created",
                  ])
                }
              >
                Select All
              </Dropdown.Item>
              <Dropdown.Item
                onClick={() =>
                  setSelectedProductsColumns([
                    "productName",
                    "sku",
                    "price",
                    "category",
                    "brand",
                    "status",
                  ])
                }
              >
                Reset to Default
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>

        {/* Products Table */}
        <Card className="border-0 shadow-sm products-table-wrapper" style={{ width: '100%' }}>
          <Card.Body className="p-0" style={{ width: '100%' }}>
            <div className="table-responsive">
              <Table hover className="mb-0" style={{ width: '100%', margin: 0, tableLayout: 'auto' }}>
                <thead className="bg-light">
                  <tr>
                    {selectedProductsColumns.includes("productName") && (
                      <th>Product Name</th>
                    )}
                    {selectedProductsColumns.includes("sku") && <th>SKU</th>}
                    {selectedProductsColumns.includes("price") && <th>Price</th>}
                    {selectedProductsColumns.includes("currency") && <th>Currency</th>}
                    {selectedProductsColumns.includes("category") && <th>Category</th>}
                    {selectedProductsColumns.includes("brand") && <th>Brand</th>}
                    {selectedProductsColumns.includes("status") && <th>Status</th>}
                    {selectedProductsColumns.includes("description") && <th>Description</th>}
                    {selectedProductsColumns.includes("created") && <th>Created</th>}
                    <th style={{ width: '120px', minWidth: '120px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td
                        colSpan={selectedProductsColumns.length + 1}
                        className="text-center py-4"
                      >
                        Loading...
                      </td>
                    </tr>
                  ) : displayProducts.length === 0 ? (
                    <tr>
                      <td
                        colSpan={selectedProductsColumns.length + 1}
                        className="text-center py-4 text-muted"
                      >
                        No products found matching your criteria
                      </td>
                    </tr>
                  ) : (
                    (() => {
                      const sorted = sortData(
                        displayProducts,
                        productsPagination.sortColumn,
                        productsPagination.sortDirection
                      );
                      const paginated = paginateData(
                        sorted,
                        productsPagination.currentPage,
                        productsPagination.rowsPerPage
                      );

                      return paginated.map((product) => (
                        <tr key={product.id}>
                          {selectedProductsColumns.includes("productName") && (
                            <td className="fw-semibold">{product.productName}</td>
                          )}
                          {selectedProductsColumns.includes("sku") && (
                            <td>
                              <Badge bg="light" text="dark" className="font-monospace">
                                {product.sku}
                              </Badge>
                            </td>
                          )}
                          {selectedProductsColumns.includes("price") && (
                            <td className="fw-semibold text-success">
                              {product.currency} {product.price.toFixed(2)}
                            </td>
                          )}
                          {selectedProductsColumns.includes("currency") && (
                            <td>{product.currency}</td>
                          )}
                          {selectedProductsColumns.includes("category") && (
                            <td>
                              <Badge bg="info" className="bg-opacity-10 text-dark">
                                {product.category || "N/A"}
                              </Badge>
                            </td>
                          )}
                          {selectedProductsColumns.includes("brand") && (
                            <td>{product.brand || "N/A"}</td>
                          )}
                          {selectedProductsColumns.includes("status") && (
                            <td>
                              <Badge bg={product.status === "Active" ? "success" : "secondary"}>
                                {product.status}
                              </Badge>
                            </td>
                          )}
                          {selectedProductsColumns.includes("description") && (
                            <td className="text-muted small" style={{ maxWidth: "200px" }}>
                              {product.description || "N/A"}
                            </td>
                          )}
                          {selectedProductsColumns.includes("created") && (
                            <td className="text-muted">{product.created}</td>
                          )}
                          <td style={{ width: '120px', minWidth: '120px' }}>
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
                              {session?.user?.permissions?.includes('edit-crm-products') && (
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
                              {session?.user?.permissions?.includes('delete-crm-products') && (
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
                          </td>
                        </tr>
                      ));
                    })()
                  )}
                </tbody>
              </Table>
            </div>
            <div className="p-3">
              {renderPaginationControls(
                totalProducts,
                productsPagination,
                setProductsPagination,
                "products"
              )}
            </div>
          </Card.Body>
        </Card>
      </div>
    </React.Fragment>
  );
};

ProductsPage.getLayout = (page: React.ReactNode) => {
  return <Layout>{page}</Layout>;
};

export default ProductsPage;

