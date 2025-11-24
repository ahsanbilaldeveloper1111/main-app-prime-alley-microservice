import "@assets/scss/datatable-style.scss";
import React, {
  ReactElement,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericListPage from "@components/GenericListPage";
import {
  getProductPricingList,
  updateProductPricing,
  deleteProductPricing,
  getProducts,
  getDiscountApplicabilityList,
  createDiscountApplicability,
  updateDiscountApplicability,
  deleteDiscountApplicability,
  ProductPricingData,
  ProductPricingCreateUpdatePayload,
  ProductData,
  DiscountApplicabilityData,
  DiscountApplicabilityCreateUpdatePayload,
} from "@utils/accountingOld";
import { Column } from "@components/CustomDataTable";
import { Button, Modal, Row, Col, Form, Alert, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import { useRouter } from "next/router";
import moment from "moment";
import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import PageHeader from "@components/PageHeader";
import FormModal from "@pages/partial/FormModal";
import ConfirmModal from "@pages/partial/ConfirmModal";
import SuccessfulModal from "@pages/partial/SuccessfulModal";
import PageSummaryGrid, { SummaryCard } from '@components/PageSummaryGrid';
import DatatableActionButton from "@components/DatatableActionButton";
import { FiEdit, FiTrash2, FiEye,FiPlus } from "react-icons/fi";



import TableAction from "@components/TableAction";

const CompanyProductPricing = () => {
  const router = useRouter();
  const { companyId } = router.query;
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<string>("pricing");

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [selectedPricing, setSelectedPricing] = useState<ProductPricingData | null>(null);

  // Discount applicability modal states
  const [showCreateDiscountModal, setShowCreateDiscountModal] = useState<boolean>(false);
  const [showEditDiscountModal, setShowEditDiscountModal] = useState<boolean>(false);
  const [showDeleteDiscountModal, setShowDeleteDiscountModal] = useState<boolean>(false);
  const [selectedDiscount, setSelectedDiscount] = useState<DiscountApplicabilityData | null>(null);

  // Form states
  const [formData, setFormData] = useState<ProductPricingCreateUpdatePayload>({
    product_id: "",
    selling_price: "",
    company_id: Number(companyId),
  });

  const [discountFormData, setDiscountFormData] = useState<DiscountApplicabilityCreateUpdatePayload>({
    name: "",
    description: "",
    is_applicable: true,
    discount_type: "percentage",
    discount_percentage: 0,
    discount_amount: null,
    valid_from: "",
    valid_until: "",
    pricing_ids: [],
    company_id: Number(companyId),
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(false);

  interface TableFilters {
    product_pricing_search?: string;
    discount_applicability_search?: string;
  }

  const [currentFilters, setCurrentFilters] = useState<TableFilters>({
    product_pricing_search: "",
    discount_applicability_search: "",
  });

  // Load products on component mount
  useEffect(() => {
    const loadProducts = async () => {
      setIsLoadingProducts(true);
      try {
        const productsData = await getProducts({ per_page: 1000 }); // Get all products
        setProducts(productsData.data);
      } catch (error) {
        console.error("Error loading products:", error);
        setProducts([]);
      } finally {
        setIsLoadingProducts(false);
      }
    };
    
    loadProducts();
  }, []);

  // Table columns
  const columns: Column[] = useMemo(
    () => [
      // {
      //   key: "id",
      //   name: "ID",
      //   selector: (row: any) => row.id,
      //   sortable: true,
      //   cell: (props: any) => (
      //     <span>{props.id}</span>
      //   ),
      // },
      {
        key: "product_name",
        name: "Product",
        selector: (row: any) => row.product?.name,
        sortable: true,
        cell: (props: any) => (
          <div>
            <div className="">{props.product?.name || "N/A"}</div>
            <small className="text-muted">{props.product?.category?.name || "N/A"}</small>
          </div>
        ),
      },
      {
        key: "base_price",
        name: "Base Price",
        selector: (row: any) => row.product?.base_price,
        sortable: true,
        cell: (props: any) => (
          <span >
            {props.product?.currency_code} {props.product?.base_price || "0.00"}
          </span>
        ),
      },
      {
        key: "selling_price",
        name: "Selling Price",
        selector: (row: any) => row.selling_price,
        sortable: true,
        cell: (props: any) => (
          <span >
            {props.product?.currency_code} {props.selling_price || "0.00"}
          </span>
        ),
      },
      {
        key: "is_active",
        name: "Status",
        selector: (row: any) => row.is_active,
        sortable: true,
        cell: (props: any) => (
          <span className={`status-badge ${props.is_active ? "success" : "  secondary"}`}>
            {props.is_active ? "Active" : "Inactive"}
          </span>
        ),
      },
      {
        key: "created_at",
        name: "Created At",
        selector: (row: any) => row.created_at,
        sortable: true,
        cell: (props: any) => (
          <span className="text-muted">
            {moment(props.created_at).format("DD/MM/YYYY")}
          </span>
        ),
      },
      {
        key: "actions",
        name: "Actions",
        selector: (row: any) => row.id,
        sortable: false,
        cell: (props: any) => (
          <>
          <DatatableActionButton
                    actions={[
                        {
                            label: 'Edit',
                            icon: <FiEdit />,
                            onClick: () => handleEditPricing(props),
                           // permission: 'edit-companies',
                            className: 'gap-2'
                        },
                        {
                            label: 'Delete',
                            icon: <FiTrash2 />,
                            onClick: () => handleDeletePricing(props),
                            //permission: 'delete-companies',
                            className: 'text-danger gap-2'
                        },
                    ]}
                    
                />
          </>

        ),
      },
    ],
    []
  );

  const filters = useMemo(() => ({}), []);

  // Discount applicability columns
  const discountColumns: Column[] = useMemo(
    () => [
      // {
      //   key: "id",
      //   name: "ID",
      //   selector: (row: any) => row.id,
      //   sortable: true,
      //   cell: (props: any) => (
      //     <span className="fw-bold text-primary">#{props.id}</span>
      //   ),
      // },
      {
        key: "name",
        name: "Name",
        selector: (row: any) => row.name,
        sortable: true,
        cell: (props: any) => (
          <div>{props.name}</div>
        ),
      },
      {
        key: "description",
        name: "Description",
        selector: (row: any) => row.description,
        sortable: true,
        cell: (props: any) => (
          <span className="text-muted">{props.description || "N/A"}</span>
        ),
      },
      {
        key: "discount_type",
        name: "Type",
        selector: (row: any) => row.discount_type,
        sortable: true,
        cell: (props: any) => (
          <span className="status-badge primary">
            {props.discount_type === 'percentage' ? 'Percentage' : 'Fixed Amount'}
          </span>
        ),
      },
      {
        key: "discount_value",
        name: "Discount",
        selector: (row: any) => row.discount_percentage || row.discount_amount,
        sortable: true,
        cell: (props: any) => (
          <span >
            {props.discount_type === 'percentage' 
              ? `${props.discount_percentage}%` 
              : `$${props.discount_amount || '0.00'}`}
          </span>
        ),
      },
      {
        key: "valid_from",
        name: "Valid From",
        selector: (row: any) => row.valid_from,
        sortable: true,
        cell: (props: any) => (
          <span className="text-muted">
            {moment(props.valid_from).format("DD/MM/YYYY")}
          </span>
        ),
      },
      {
        key: "valid_until",
        name: "Valid Until",
        selector: (row: any) => row.valid_until,
        sortable: true,
        cell: (props: any) => (
          <span className="text-muted">
            {moment(props.valid_until).format("DD/MM/YYYY")}
          </span>
        ),
      },
      {
        key: "is_applicable",
        name: "Status",
        selector: (row: any) => row.is_applicable,
        sortable: true,
        cell: (props: any) => (
          <span className={`status-badge ${props.is_applicable ? "success" : "secondary"}`}>
            {props.is_applicable ? "Active" : "Inactive"}
          </span>
        ),
      },
      {
        key: "actions",
        name: "Actions",
        selector: (row: any) => row.id,
        sortable: false,
        cell: (props: any) => (
          <>  
          <DatatableActionButton
                    actions={[
                        {
                            label: 'Edit',
                            icon: <FiEdit />,
                            onClick: () => handleEditDiscount(props),
                            //permission: 'edit-companies',
                            className: 'gap-2'
                        },
                        {
                            label: 'Delete',
                            icon: <FiTrash2 />,
                            onClick: () => handleDeleteDiscount(props),
                            //permission: 'delete-companies',
                            className: 'text-danger gap-2'
                        },
                    ]}
                />
          </>

        ),
      },
    ],
    []
  );

  // Fetch product pricing function
  const fetchProductPricing = useCallback(
    async (page = 1, perPage = 15, search = "") => {
      if (!companyId) return { data: [], pagination: { current_page: 1, per_page: 15, total: 0, last_page: 1, from: 1, to: 0 } };
      
      return await getProductPricingList(Number(companyId), {
        page,
        per_page: perPage,
        search: currentFilters.product_pricing_search,
      });
    },
    [companyId, currentFilters.product_pricing_search]
  );

  // Fetch discount applicability function
  const fetchDiscountApplicability = useCallback(
    async (page = 1, perPage = 15, search = "") => {
      if (!companyId) return { data: [], pagination: { current_page: 1, per_page: 15, total: 0, last_page: 1, from: 1, to: 0 } };
      
      return await getDiscountApplicabilityList(Number(companyId), {
        page,
        per_page: perPage,
        search: currentFilters.discount_applicability_search,
      });
    },
    [companyId, currentFilters.discount_applicability_search]
  );

  // Reset form data
  const resetFormData = useCallback(() => {
    setFormData({
      product_id: "",
      selling_price: "",
      company_id: Number(companyId),
    });
  }, [companyId]);

  const resetDiscountFormData = useCallback(() => {
    setDiscountFormData({
      name: "",
      description: "",
      is_applicable: true,
      discount_type: "percentage",
      discount_percentage: 0,
      discount_amount: null,
      valid_from: "",
      valid_until: "",
      pricing_ids: [],
      company_id: Number(companyId),
    });
  }, [companyId]);

  // Handle create pricing
  const handleCreatePricing = useCallback(async () => {
    if (!formData.product_id) {
      toast.error("Please select a product");
      return;
    }
    if (!formData.selling_price) {
      toast.error("Please enter a selling price");
      return;
    }

    if (!companyId) {
      toast.error("Company ID not found");
      return;
    }

    setIsLoading(true);
    try {
      await updateProductPricing(Number(companyId), formData);
      toast.success("Product pricing created successfully");
      setShowCreateModal(false);
      resetFormData();
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error("Error creating product pricing:", error);
    } finally {
      setIsLoading(false);
    }
  }, [formData, companyId, resetFormData]);

  // Handle edit pricing
  const handleEditPricing = useCallback((pricing: ProductPricingData) => {
    setSelectedPricing(pricing);
    setFormData({
      product_id: pricing.product_id,
      selling_price: pricing.selling_price,
      company_id: Number(companyId),
    });
    setShowEditModal(true);
  }, [companyId]);

  // Handle update pricing
  const handleUpdatePricing = useCallback(async () => {
    if (!selectedPricing || !companyId) return;

    if (!formData.product_id) {
      toast.error("Please select a product");
      return;
    }
    if (!formData.selling_price) {
      toast.error("Please enter a selling price");
      return;
    }

    setIsLoading(true);
    try {
      await updateProductPricing(Number(companyId), formData);
      toast.success("Product pricing updated successfully");
      setShowEditModal(false);
      setSelectedPricing(null);
      resetFormData();
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error("Error updating product pricing:", error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedPricing, formData, companyId, resetFormData]);

  // Handle delete pricing
  const handleDeletePricing = useCallback((pricing: ProductPricingData) => {
    setSelectedPricing(pricing);
    setShowDeleteModal(true);
  }, []);

  // Handle confirm delete
  const handleConfirmDelete = useCallback(async () => {
    if (!selectedPricing || !companyId) return;

    setIsLoading(true);
    try {
      await deleteProductPricing(Number(companyId), selectedPricing.product_id);
      toast.success("Product pricing deleted successfully");
      setShowDeleteModal(false);
      setSelectedPricing(null);
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error("Error deleting product pricing:", error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedPricing, companyId]);

  // Discount applicability handlers
  const handleCreateDiscount = useCallback(async () => {
    if (!discountFormData.name.trim()) {
      toast.error("Please enter a name");
      return;
    }
    if (!discountFormData.valid_from) {
      toast.error("Please select a valid from date");
      return;
    }
    if (!discountFormData.valid_until) {
      toast.error("Please select a valid until date");
      return;
    }
    if (discountFormData.pricing_ids.length === 0) {
      toast.error("Please select at least one product pricing");
      return;
    }

    // Validate date range
    if (moment(discountFormData.valid_until).isSameOrBefore(moment(discountFormData.valid_from))) {
      toast.error("Valid until date must be greater than valid from date");
      return;
    }

    // Validate that valid from is not in the past
    if (moment(discountFormData.valid_from).isBefore(moment(), 'day')) {
      toast.error("Valid from date cannot be in the past");
      return;
    }

    if (!companyId) {
      toast.error("Company ID not found");
      return;
    }

    setIsLoading(true);
    try {
      await createDiscountApplicability(Number(companyId), discountFormData);
      toast.success("Discount applicability created successfully");
      setShowCreateDiscountModal(false);
      resetDiscountFormData();
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error("Error creating discount applicability:", error);
    } finally {
      setIsLoading(false);
    }
  }, [discountFormData, companyId, resetDiscountFormData]);

  const handleEditDiscount = useCallback((discount: DiscountApplicabilityData) => {
    setSelectedDiscount(discount);
    setDiscountFormData({
      name: discount.name,
      description: discount.description,
      is_applicable: discount.is_applicable,
      discount_type: discount.discount_type,
      discount_percentage: parseFloat(discount.discount_percentage),
      discount_amount: discount.discount_amount ? parseFloat(discount.discount_amount) : null,
      valid_from: moment(discount.valid_from).format("YYYY-MM-DD"),
      valid_until: moment(discount.valid_until).format("YYYY-MM-DD"),
      pricing_ids: discount.product_pricings.map(p => p.id),
      company_id: Number(companyId),
    });
    setShowEditDiscountModal(true);
  }, [companyId]);

  const handleUpdateDiscount = useCallback(async () => {
    if (!selectedDiscount || !companyId) return;

    if (!discountFormData.name.trim()) {
      toast.error("Please enter a name");
      return;
    }
    if (!discountFormData.valid_from) {
      toast.error("Please select a valid from date");
      return;
    }
    if (!discountFormData.valid_until) {
      toast.error("Please select a valid until date");
      return;
    }
    if (discountFormData.pricing_ids.length === 0) {
      toast.error("Please select at least one product pricing");
      return;
    }

    // Validate date range
    if (moment(discountFormData.valid_until).isSameOrBefore(moment(discountFormData.valid_from))) {
      toast.error("Valid until date must be greater than valid from date");
      return;
    }

    // Validate that valid from is not in the past
    if (moment(discountFormData.valid_from).isBefore(moment(), 'day')) {
      toast.error("Valid from date cannot be in the past");
      return;
    }

    setIsLoading(true);
    try {
      await updateDiscountApplicability(Number(companyId), selectedDiscount.id, discountFormData);
      toast.success("Discount applicability updated successfully");
      setShowEditDiscountModal(false);
      setSelectedDiscount(null);
      resetDiscountFormData();
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error("Error updating discount applicability:", error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDiscount, discountFormData, companyId, resetDiscountFormData]);

  const handleDeleteDiscount = useCallback((discount: DiscountApplicabilityData) => {
    setSelectedDiscount(discount);
    setShowDeleteDiscountModal(true);
  }, []);

  const handleConfirmDeleteDiscount = useCallback(async () => {
    if (!selectedDiscount || !companyId) return;

    setIsLoading(true);
    try {
      await deleteDiscountApplicability(Number(companyId), selectedDiscount.id);
      toast.success("Discount applicability deleted successfully");
      setShowDeleteDiscountModal(false);
      setSelectedDiscount(null);
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error("Error deleting discount applicability:", error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDiscount, companyId]);

  // Modal handlers
  const openCreateModal = useCallback(() => {
    resetFormData();
    setShowCreateModal(true);
  }, [resetFormData]);

  const closeCreateModal = useCallback(() => {
    setShowCreateModal(false);
    resetFormData();
  }, [resetFormData]);

  const closeEditModal = useCallback(() => {
    setShowEditModal(false);
    setSelectedPricing(null);
    resetFormData();
  }, [resetFormData]);

  const closeDeleteModal = useCallback(() => {
    setShowDeleteModal(false);
    setSelectedPricing(null);
  }, []);

  // Discount modal handlers
  const openCreateDiscountModal = useCallback(() => {
    resetDiscountFormData();
    setShowCreateDiscountModal(true);
  }, [resetDiscountFormData]);

  const closeCreateDiscountModal = useCallback(() => {
    setShowCreateDiscountModal(false);
    resetDiscountFormData();
  }, [resetDiscountFormData]);

  const closeEditDiscountModal = useCallback(() => {
    setShowEditDiscountModal(false);
    setSelectedDiscount(null);
    resetDiscountFormData();
  }, [resetDiscountFormData]);

  const closeDeleteDiscountModal = useCallback(() => {
    setShowDeleteDiscountModal(false);
    setSelectedDiscount(null);
  }, []);

  // Form input handlers
  const handleInputChange = useCallback((field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const handleDiscountInputChange = useCallback((field: string, value: any) => {
    setDiscountFormData((prev) => {
      const newData = {
        ...prev,
        [field]: value,
      };
      
      // If valid_from is changed and valid_until is before the new valid_from, clear valid_until
      if (field === 'valid_from' && prev.valid_until && moment(value).isAfter(moment(prev.valid_until))) {
        newData.valid_until = '';
      }
      
      return newData;
    });
  }, []);

  const handlePricingIdsChange = useCallback((pricingId: number, checked: boolean) => {
    setDiscountFormData((prev) => ({
      ...prev,
      pricing_ids: checked
        ? [...prev.pricing_ids, pricingId]
        : prev.pricing_ids.filter(id => id !== pricingId),
    }));
  }, []);

  const handleFiltersChange = useCallback((filters: TableFilters) => {
    setCurrentFilters(filters);
  }, []);

  if (!companyId) {
    return (
      <div className="text-center py-5">
        <Alert variant="warning">
          <h4>Company ID not found</h4>
          <p>Please navigate to this page from the companies list.</p>
          <Button variant="primary" onClick={() => router.push("/accounting/companies")}>
            Back to Companies
          </Button>
        </Alert>
      </div>
    );
  }

  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle="Accounting"
        mainLink="/accounting/companies"
        subTitle="Companies"
      />


      <Row className="mb-3">
        <Col md={12}>
          <ul id="system-tabs" className="nav nav-tabs"  role="tablist">
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link ${activeTab === "pricing" ? "active" : ""}`}
                id="pricing-tab"
                type="button"
                role="tab"
                onClick={() => setActiveTab("pricing")}
              >
                Product Pricing
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link ${activeTab === "discounts" ? "active" : ""}`}
                id="discounts-tab"
                type="button"
                role="tab"
                onClick={() => setActiveTab("discounts")}
              >
                Discount Applicability
              </button>
            </li>
          </ul>
        </Col>
      </Row>

      <div className="tab-content" id="pricingTabsContent">
        {/* Product Pricing Tab */}
        <div className={`tab-pane fade ${activeTab === "pricing" ? "show active" : ""}`} id="pricing" role="tabpanel" aria-labelledby="pricing-tab">
        <PageHeader
        title="Product Pricing"
        showSearch={true}
        searchPlaceholder="Search product pricing..."
        searchValue={currentFilters.product_pricing_search || ""}
        onSearchChange={(value) => handleFiltersChange({...currentFilters, product_pricing_search: value})}
        buttons={
          <Button variant="primary" size="sm" onClick={openCreateModal}>Add Product Pricing</Button>
        }
      />
          
          <GenericListPage
            columns={columns}
            fetchData={fetchProductPricing}
            title="Product Pricing"
            searchPlaceholder="Search product pricing..."
            defaultPageSize={15}
            refreshKey={refreshKey}
            search={true}
            filters={filters}
            tableStyle="table-style-2"

          />
        </div>

        {/* Discount Applicability Tab */}
        <div className={`tab-pane fade ${activeTab === "discounts" ? "show active" : ""}`} id="discounts" role="tabpanel" aria-labelledby="discounts-tab">
          <PageHeader
            title="Discount Applicability"
            showSearch={true}
            searchPlaceholder="Search discount applicability..."
            searchValue={currentFilters.discount_applicability_search || ""}
            onSearchChange={(value) => handleFiltersChange({...currentFilters, discount_applicability_search: value})}
            buttons={
              <Button variant="primary" size="sm" onClick={openCreateDiscountModal}>Add Discount Applicability</Button>
            }
          />
          
          <GenericListPage
            columns={discountColumns}
            fetchData={fetchDiscountApplicability}
            title="Discount Applicability"
            searchPlaceholder="Search discount applicability..."
            defaultPageSize={15}
            refreshKey={refreshKey}
            search={false}
            filters={filters}
            tableStyle="table-style-2"
          />
        </div>
      </div>

      {/* Create Modal */}
      <FormModal
        show={showCreateModal}
        onHide={closeCreateModal}
        title="Add Product Pricing"
        desc="Fill in the details below to add product pricing"
        formHtml={
          <>
            <div className="row">
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label htmlFor="createProductId">Product *</label>
                  <select
                    className="form-control"
                    id="createProductId"
                    value={formData.product_id}
                    onChange={(e) => handleInputChange("product_id", e.target.value)}
                    disabled={isLoadingProducts}
                  >
                    <option value="">Select Product</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id.toString()}>
                        {product.name} - {product.currency_code} {product.base_price}
                      </option>
                    ))}
                  </select>
                  {isLoadingProducts && (
                    <div className="mt-2">
                      <Spinner animation="border" size="sm" className="me-2" />
                      <small>Loading products...</small>
                    </div>
                  )}
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label htmlFor="createSellingPrice">Selling Price *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    id="createSellingPrice"
                    value={formData.selling_price}
                    onChange={(e) => handleInputChange("selling_price", e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

          </>
        }
        submitButtonText={isLoading || isLoadingProducts ? "Creating..." : "Create Pricing"}
        cancelButtonText="Cancel"
        onSubmit={handleCreatePricing}
        onCancel={closeCreateModal}
        submitButtonVariant="primary"
        cancelButtonVariant="secondary"
        ShowSubmitButton={!isLoadingProducts}
      />

      {/* Edit Modal */}
      <FormModal
        show={showEditModal}
        onHide={closeEditModal}
        title="Edit Product Pricing"
        desc="Update the product pricing details below"
        formHtml={
          <>
            <div className="row">
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label htmlFor="editProductId">Product *</label>
                  <select
                    className="form-control"
                    id="editProductId"
                    value={formData.product_id}
                    onChange={(e) => handleInputChange("product_id", e.target.value)}
                    disabled={isLoadingProducts}
                  >
                    <option value="">Select Product</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id.toString()}>
                        {product.name} - {product.currency_code} {product.base_price}
                      </option>
                    ))}
                  </select>
                  {isLoadingProducts && (
                    <div className="mt-2">
                      <Spinner animation="border" size="sm" className="me-2" />
                      <small>Loading products...</small>
                    </div>
                  )}
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label htmlFor="editSellingPrice">Selling Price *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    id="editSellingPrice"
                    value={formData.selling_price}
                    onChange={(e) => handleInputChange("selling_price", e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

          </>
        }
        submitButtonText={isLoading || isLoadingProducts ? "Updating..." : "Update Pricing"}
        cancelButtonText="Cancel"
        onSubmit={handleUpdatePricing}
        onCancel={closeEditModal}
        submitButtonVariant="primary"
        cancelButtonVariant="secondary"
        ShowSubmitButton={!isLoadingProducts}
      />

      {/* Delete Modal */}
      <ConfirmModal
        show={showDeleteModal}
        onHide={closeDeleteModal}
        title="Delete Product Pricing?"
        description="Are you sure you want to delete product pricing for {targetName}? This action cannot be undone."
        targetName={selectedPricing?.product?.name || ""}
        confirmButtonText={isLoading ? "Deleting..." : "Delete Pricing"}
        cancelButtonText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={closeDeleteModal}
        confirmButtonVariant="danger"
        cancelButtonVariant="secondary"
      />

      {/* Create Discount Modal */}
      <FormModal
        show={showCreateDiscountModal}
        onHide={closeCreateDiscountModal}
        title="Add Discount Applicability"
        desc="Fill in the details below to add discount applicability"
        formHtml={
          <>
            <div className="row">
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label htmlFor="createDiscountName">Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    id="createDiscountName"
                    value={discountFormData.name}
                    onChange={(e) => handleDiscountInputChange("name", e.target.value)}
                    placeholder="Enter discount name"
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label htmlFor="createDiscountType">Discount Type *</label>
                  <select
                    className="form-control"
                    id="createDiscountType"
                    value={discountFormData.discount_type}
                    onChange={(e) => handleDiscountInputChange("discount_type", e.target.value)}
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-12">
                <div className="form-group mb-3">
                  <label htmlFor="createDiscountDescription">Description</label>
                  <textarea
                    className="form-control"
                    id="createDiscountDescription"
                    rows={3}
                    value={discountFormData.description}
                    onChange={(e) => handleDiscountInputChange("description", e.target.value)}
                    placeholder="Enter discount description"
                  />
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label htmlFor="createDiscountValue">
                    {discountFormData.discount_type === 'percentage' ? 'Discount Percentage (%)' : 'Discount Amount ($)'} *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    id="createDiscountValue"
                    value={discountFormData.discount_type === 'percentage' ? discountFormData.discount_percentage : discountFormData.discount_amount || ''}
                    onChange={(e) => handleDiscountInputChange(
                      discountFormData.discount_type === 'percentage' ? 'discount_percentage' : 'discount_amount',
                      parseFloat(e.target.value) || 0
                    )}
                    placeholder={discountFormData.discount_type === 'percentage' ? '0.00' : '0.00'}
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <div className="form-check  mt-4">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="createDiscountIsApplicable"
                      checked={discountFormData.is_applicable}
                      onChange={(e) => handleDiscountInputChange("is_applicable", e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="createDiscountIsApplicable">
                      Is Applicable
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label htmlFor="createDiscountValidFrom">Valid From *</label>
                  <input
                    type="date"
                    className="form-control"
                    id="createDiscountValidFrom"
                    value={discountFormData.valid_from}
                    min={moment().format("YYYY-MM-DD")}
                    onChange={(e) => handleDiscountInputChange("valid_from", e.target.value)}
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label htmlFor="createDiscountValidUntil">Valid Until *</label>
                  <input
                    type="date"
                    className="form-control"
                    id="createDiscountValidUntil"
                    value={discountFormData.valid_until}
                    min={discountFormData.valid_from || moment().format("YYYY-MM-DD")}
                    onChange={(e) => handleDiscountInputChange("valid_until", e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-12">
                <div className="form-group mb-3">
                  <label>Select Product Pricings *</label>
                  <div className="border rounded p-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {products.map((product) => (
                      <div key={product.id} className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id={`createPricing${product.id}`}
                          checked={discountFormData.pricing_ids.includes(product.id)}
                          onChange={(e) => handlePricingIdsChange(product.id, e.target.checked)}
                        />
                        <label className="form-check-label" htmlFor={`createPricing${product.id}`}>
                          {product.name} - {product.currency_code} {product.base_price}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        }
        submitButtonText={isLoading ? "Creating..." : "Create Discount"}
        cancelButtonText="Cancel"
        onSubmit={handleCreateDiscount}
        onCancel={closeCreateDiscountModal}
        submitButtonVariant="primary"
        cancelButtonVariant="secondary"
      />

      {/* Edit Discount Modal */}
      <FormModal
        show={showEditDiscountModal}
        onHide={closeEditDiscountModal}
        title="Edit Discount Applicability"
        desc="Update the discount applicability details below"
        formHtml={
          <>
            <div className="row">
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label htmlFor="editDiscountName">Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    id="editDiscountName"
                    value={discountFormData.name}
                    onChange={(e) => handleDiscountInputChange("name", e.target.value)}
                    placeholder="Enter discount name"
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label htmlFor="editDiscountType">Discount Type *</label>
                  <select
                    className="form-control"
                    id="editDiscountType"
                    value={discountFormData.discount_type}
                    onChange={(e) => handleDiscountInputChange("discount_type", e.target.value)}
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-12">
                <div className="form-group mb-3">
                  <label htmlFor="editDiscountDescription">Description</label>
                  <textarea
                    className="form-control"
                    id="editDiscountDescription"
                    rows={3}
                    value={discountFormData.description}
                    onChange={(e) => handleDiscountInputChange("description", e.target.value)}
                    placeholder="Enter discount description"
                  />
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label htmlFor="editDiscountValue">
                    {discountFormData.discount_type === 'percentage' ? 'Discount Percentage (%)' : 'Discount Amount ($)'} *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    id="editDiscountValue"
                    value={discountFormData.discount_type === 'percentage' ? discountFormData.discount_percentage : discountFormData.discount_amount || ''}
                    onChange={(e) => handleDiscountInputChange(
                      discountFormData.discount_type === 'percentage' ? 'discount_percentage' : 'discount_amount',
                      parseFloat(e.target.value) || 0
                    )}
                    placeholder={discountFormData.discount_type === 'percentage' ? '0.00' : '0.00'}
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <div className="form-check form-switch mt-4">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      role="switch"
                      id="editDiscountIsApplicable"
                      checked={discountFormData.is_applicable}
                      onChange={(e) => handleDiscountInputChange("is_applicable", e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="editDiscountIsApplicable">
                      Is Applicable
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label htmlFor="editDiscountValidFrom">Valid From *</label>
                  <input
                    type="date"
                    className="form-control"
                    id="editDiscountValidFrom"
                    value={discountFormData.valid_from}
                    min={moment().format("YYYY-MM-DD")}
                    onChange={(e) => handleDiscountInputChange("valid_from", e.target.value)}
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label htmlFor="editDiscountValidUntil">Valid Until *</label>
                  <input
                    type="date"
                    className="form-control"
                    id="editDiscountValidUntil"
                    value={discountFormData.valid_until}
                    min={discountFormData.valid_from || moment().format("YYYY-MM-DD")}
                    onChange={(e) => handleDiscountInputChange("valid_until", e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-12">
                <div className="form-group mb-3">
                  <label>Select Product Pricings *</label>
                  <div className="border rounded p-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {products.map((product) => (
                      <div key={product.id} className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id={`editPricing${product.id}`}
                          checked={discountFormData.pricing_ids.includes(product.id)}
                          onChange={(e) => handlePricingIdsChange(product.id, e.target.checked)}
                        />
                        <label className="form-check-label" htmlFor={`editPricing${product.id}`}>
                          {product.name} - {product.currency_code} {product.base_price}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        }
        submitButtonText={isLoading ? "Updating..." : "Update Discount"}
        cancelButtonText="Cancel"
        onSubmit={handleUpdateDiscount}
        onCancel={closeEditDiscountModal}
        submitButtonVariant="primary"
        cancelButtonVariant="secondary"
      />

      {/* Delete Discount Modal */}
      <ConfirmModal
        show={showDeleteDiscountModal}
        onHide={closeDeleteDiscountModal}
        title="Delete Discount Applicability?"
        description="Are you sure you want to delete discount applicability {targetName}? This action cannot be undone."
        targetName={selectedDiscount?.name || ""}
        confirmButtonText={isLoading ? "Deleting..." : "Delete Discount"}
        cancelButtonText="Cancel"
        onConfirm={handleConfirmDeleteDiscount}
        onCancel={closeDeleteDiscountModal}
        confirmButtonVariant="danger"
        cancelButtonVariant="secondary"
      />
    </React.Fragment>
  );
};

CompanyProductPricing.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CompanyProductPricing;

