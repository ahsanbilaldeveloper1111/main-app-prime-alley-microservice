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
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getProduct,
  getProductCategories,
  createProductCategory,
  updateProductCategory,
  deleteProductCategory,
  ProductData,
  ProductCreateUpdatePayload,
  ProductCategoryData,
  ProductCategoryCreateUpdatePayload,
} from "@utils/accounting";
import { getProductCategoriesList } from "@utils/accounting";
import { Column } from "@components/CustomDataTable";
import { Button, Modal, Row } from "react-bootstrap";
import { Col } from "react-bootstrap";
import { toast } from "react-toastify";
import { useSession } from "next-auth/react";
import moment from "moment";

import "@assets/scss/common.scss";
import { motion } from "framer-motion";
import TableAction from "@components/TableAction";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import PageHeader from "@components/PageHeader";
import FormModal from "../../partial/FormModal";
import ConfirmModal from "@pages/partial/ConfirmModal";
import SuccessfulModal from "@pages/partial/SuccessfulModal";
import PageSummaryGrid, { SummaryCard } from '@components/PageSummaryGrid';
import DatatableActionButton from "@components/DatatableActionButton";
import { FiEdit, FiTrash2, FiEye,FiPlus } from "react-icons/fi";

interface SelectOption {
  value: number;
  label: string;
}

const ProductList = () => {
  const { data: session, status } = useSession();

  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [currentFilters, setCurrentFilters] = useState<{search?: string}>({});

  const [categories, setCategories] = useState<ProductCategoryData[]>([]);

  // Category Management
  const [showCategoryModal, setShowCategoryModal] = useState<boolean>(false);
  const [categoryList, setCategoryList] = useState<ProductCategoryData[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ProductCategoryData | null>(null);
  const [showEditCategoryModal, setShowEditCategoryModal] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<boolean>(false);
  const [showDeleteCategoryModal, setShowDeleteCategoryModal] = useState<boolean>(false);
  const [confirmDeleteCategory, setConfirmDeleteCategory] = useState<string>("");
  
  // Create Category Modal
  const [showCreateCategoryModal, setShowCreateCategoryModal] = useState<boolean>(false);
  const [creatingCategory, setCreatingCategory] = useState<boolean>(false);
  const [newCategory, setNewCategory] = useState<ProductCategoryCreateUpdatePayload>({
    name: "",
    description: "",
    is_active: true,
  });

  // Product Delete Modal
  const [showDeleteProductModal, setShowDeleteProductModal] = useState<boolean>(false);
  const [confirmDeleteProduct, setConfirmDeleteProduct] = useState<string>("");

  const columns: Column[] = useMemo(
    () => [
      {
        key: "name",
        name: "Product Name",
        selector: (row: ProductData) => row.name,
        sortable: true,
        cell: (props: ProductData) => (
          <div>
            <div className="">{props.name}</div>
            {props.description && (
              <div className="text-muted small">{props.description}</div>
            )}
          </div>
        ),
      },
      {
        key: "category",
        name: "Category",
        selector: (row: ProductData) => row.category?.name,
        sortable: true,
        cell: (props: ProductData) => (
          <span className="status-badge info">
            {props.category?.name || "No Category"}
          </span>
        ),
      },
      {
        key: "base_price",
        name: "Price",
        selector: (row: ProductData) => row.base_price,
        sortable: true,
        cell: (props: ProductData) => (
          <span >
            {props.currency || "USD"}{" "}
            {parseFloat(props.base_price || "0").toFixed(2)}
          </span>
        ),
      },
      {
        key: "is_service",
        name: "Type",
        selector: (row: ProductData) => row.is_service,
        sortable: true,
        cell: (props: ProductData) => (
          <span className={`status-badge ${props.is_service ? "primary" : "info"}`}>
            {props.is_service ? "Service" : "Product"}
          </span>
        ),
      },
      {
        key: "is_active",
        name: "Status",
        selector: (row: ProductData) => row.is_active,
        sortable: true,
        cell: (props: ProductData) => {
          const statusColors = {
            true: "success",
            false: "danger",
          };
          return (
            <span
              className={`status-badge ${
                statusColors[String(props.is_active) as keyof typeof statusColors] ||
                "secondary"
              }`}
            >
              {props.is_active ? "Active" : "Inactive"}
            </span>
          );
        },
      },
      {
        key: "created_at",
        name: "Created",
        selector: (row: ProductData) => row.created_at,
        sortable: true,
        cell: (props: ProductData) => (
          <span className="text-muted">
            {moment(props.created_at).format("DD/MM/YYYY")}
          </span>
        ),
      },
      {
        key: "Action",
        name: "ACTION",
        selector: (row: ProductData) => row.id,
        sortable: false,
        cell: (props: ProductData) => (
          <>  
          <DatatableActionButton
                    actions={[
                        {
                            label: 'Edit',
                            icon: <FiEdit />,
                            onClick: () => handleEditProduct(props),
                            className: 'gap-2'
                        },
                        {
                            label: 'Delete',
                            icon: <FiTrash2 />,
                            onClick: () => handleDeleteProduct(props),
                            className: 'text-danger gap-2'
                        }
                    ]}
                />
          </>
         
        ),
      },
    ],
    [session?.user?.permissions]
  );
  const fetchCategories = useCallback(async () => {
    try {
      const categoriesData = await getProductCategoriesList();
      setCategories(categoriesData || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  }, []);
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const memoizedFilters = useMemo(() => currentFilters, [currentFilters]);

  const fetchProducts = useCallback(
    async (page = 1, perPage = 15, search = "") => {
      try {
        const response = await getProducts({
          page,
          per_page: perPage,
          search,
          ...memoizedFilters,
        });

        // The getProducts function returns PaginationWrapper<ProductData>
        // which has the structure: { data: ProductData[], pagination: {...} }
        return {
          data: response.data, // The actual product array
          total: response.pagination.total,
          page: response.pagination.current_page,
          per_page: response.pagination.per_page,
          last_page: response.pagination.last_page,
        };
      } catch (error) {
        console.error("Error fetching products:", error);
        throw error;
      }
    },
    [memoizedFilters]
  );

  const handleFiltersChange = useCallback((filters: any) => {
    setCurrentFilters(filters);
  }, []);

  // Edit Product Modal
  const [selectedProduct, setSelectedProduct] = useState<ProductData | null>(
    null
  );
  const [showEditProductModal, setShowEditProductModal] =
    useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<boolean>(false);

  const handleEditProduct = useCallback((props: ProductData) => {
    setSelectedProduct(props);
    setShowEditProductModal(true);
  }, []);

  const handleSubmitEditProduct = useCallback(async () => {
    if (!selectedProduct) return;

    if (!selectedProduct.name) {
      toast.error("Please enter a product name");
      return;
    }
    if (!selectedProduct.category_id) {
      toast.error("Please select a category");
      return;
    }
    if (!selectedProduct.base_price || parseFloat(selectedProduct.base_price) <= 0) {
      toast.error("Please enter a valid price");
      return;
    }

    setEditingProduct(true);
    try {
      const productData: ProductCreateUpdatePayload = {
        name: selectedProduct.name,
        description: selectedProduct.description || "",
        category_id: selectedProduct.category_id,
        base_price: selectedProduct.base_price,
        is_active: selectedProduct.is_active ?? true,
        is_service: selectedProduct.is_service,
        currency: selectedProduct.currency || "USD",
      };

      const response = await updateProduct(selectedProduct.id, productData);

      if (response) {
        setSelectedProduct(null);
        setShowEditProductModal(false);
        setRefreshKey((prev) => prev + 1);
        toast.success("Product updated successfully");
      }
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error("Failed to update product");
    } finally {
      setEditingProduct(false);
    }
  }, [selectedProduct]);

  // Create Product Modal
  const [showCreateProductModal, setShowCreateProductModal] =
    useState<boolean>(false);
  const [creatingProduct, setCreatingProduct] = useState<boolean>(false);
  const [newProduct, setNewProduct] = useState<ProductCreateUpdatePayload>({
    name: "",
    description: "",
    category_id: "",
    base_price: "",
    is_active: true,
    is_service: false,
    currency: "USD",
  });

  const handleSubmitCreateProduct = useCallback(async () => {
    if (!newProduct.name) {
      toast.error("Please enter a product name");
      return;
    }
    if (!newProduct.category_id) {
      toast.error("Please select a category");
      return;
    }
    if (!newProduct.base_price || parseFloat(newProduct.base_price) <= 0) {
      toast.error("Please enter a valid price");
      return;
    }

    setCreatingProduct(true);
    try {
      const response = await createProduct(newProduct);

      if (response) {
        setNewProduct({
          name: "",
          description: "",
          category_id: "",
          base_price: "",
          is_active: true,
          is_service: false,
          currency: "USD",
        });
        setShowCreateProductModal(false);
        setRefreshKey((prev) => prev + 1);
        toast.success("Product created successfully");
      }
    } catch (error) {
      console.error("Error creating product:", error);
      toast.error("Failed to create product");
    } finally {
      setCreatingProduct(false);
    }
  }, [newProduct]);

  // Modal handlers
  const openCreateProductModal = useCallback(
    () => setShowCreateProductModal(true),
    []
  );
  const closeCreateProductModal = useCallback(() => {
    setShowCreateProductModal(false);
    setNewProduct({
      name: "",
      description: "",
      category_id: "",
      base_price: "",
      is_active: true,
      is_service: false,
      currency: "USD",
    });
  }, []);

  const closeEditProductModal = useCallback(() => {
    setShowEditProductModal(false);
    setSelectedProduct(null);
  }, []);

  // Input handlers
  const handleNewProductChange = useCallback(
    (field: keyof ProductCreateUpdatePayload, value: any) => {
      setNewProduct((prev: ProductCreateUpdatePayload) => ({
        ...prev,
        [field]: value,
      }));
    },
    []
  );

  const handleEditProductChange = useCallback(
    (field: keyof ProductData, value: any) => {
      setSelectedProduct((prev: ProductData | null) => ({
        ...prev!,
        [field]: value,
      }));
    },
    []
  );

  // Product Delete Handlers
  const handleDeleteProduct = useCallback((props: ProductData) => {
    setSelectedProduct(props);
    setShowDeleteProductModal(true);
  }, []);

  const handleSubmitDeleteProduct = useCallback(async () => {
    if (!selectedProduct) return;

      try {
        await deleteProduct(selectedProduct.id);
        setSelectedProduct(null);
        setShowDeleteProductModal(false);
        setConfirmDeleteProduct("");
        setRefreshKey((prev) => prev + 1);
        toast.success("Product deleted successfully");
      } catch (error) {
        console.error("Error deleting product:", error);
        toast.error("Failed to delete product");
      }

  }, [confirmDeleteProduct, selectedProduct]);


  // Category Management Handlers
  const openCategoryModal = useCallback(async () => {
    try {
      const response = await getProductCategories();
      setCategoryList(response.data);
      setShowCategoryModal(true);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Failed to fetch categories");
    }
  }, []);

  const closeCategoryModal = useCallback(() => {
    setShowCategoryModal(false);
    setCategoryList([]);
  }, []);

  const handleEditCategory = useCallback((category: ProductCategoryData) => {
    setSelectedCategory(category);
    setShowEditCategoryModal(true);
  }, []);

  const handleDeleteCategory = useCallback((category: ProductCategoryData) => {
    setSelectedCategory(category);
    setShowDeleteCategoryModal(true);
  }, []);

  const handleSubmitEditCategory = useCallback(async () => {
    if (!selectedCategory) return;

    if (!selectedCategory.name) {
      toast.error("Please enter a category name");
      return;
    }

    setEditingCategory(true);
    try {
      const categoryData: ProductCategoryCreateUpdatePayload = {
        name: selectedCategory.name,
        description: selectedCategory.description || "",
        is_active: selectedCategory.is_active,
      };

      await updateProductCategory(selectedCategory.id, categoryData);
      setSelectedCategory(null);
      setShowEditCategoryModal(false);
      await openCategoryModal(); // Refresh the list
      await fetchCategories(); // Refresh the dropdown
      toast.success("Category updated successfully");
    } catch (error) {
      console.error("Error updating category:", error);
      toast.error("Failed to update category");
    } finally {
      setEditingCategory(false);
    }
  }, [selectedCategory, openCategoryModal]);

  const handleSubmitDeleteCategory = useCallback(async () => {
    if (!selectedCategory) return;

    
      try {
        await deleteProductCategory(selectedCategory.id);
        setSelectedCategory(null);
        setShowDeleteCategoryModal(false);
        setConfirmDeleteCategory("");
        await openCategoryModal(); // Refresh the list
        await fetchCategories(); // Refresh the dropdown
        toast.success("Category deleted successfully");
      } catch (error) {
        console.error("Error deleting category:", error);
        toast.error("Failed to delete category");
      }
   
  }, [confirmDeleteCategory, selectedCategory, openCategoryModal]);

  // Create Category Handlers
  const openCreateCategoryModal = useCallback(() => {
    setNewCategory({
      name: "",
      description: "",
      is_active: true,
    });
    setShowCreateCategoryModal(true);
  }, []);

  const closeCreateCategoryModal = useCallback(() => {
    setShowCreateCategoryModal(false);
    setNewCategory({
      name: "",
      description: "",
      is_active: true,
    });
  }, []);

  const handleNewCategoryChange = useCallback(
    (field: keyof ProductCategoryCreateUpdatePayload, value: any) => {
      setNewCategory((prev: ProductCategoryCreateUpdatePayload) => ({
        ...prev,
        [field]: value,
      }));
    },
    []
  );

  const handleSubmitCreateCategory = useCallback(async () => {
    if (!newCategory.name) {
      toast.error("Please enter a category name");
      return;
    }

    setCreatingCategory(true);
    try {
      await createProductCategory(newCategory);
      setNewCategory({
        name: "",
        description: "",
        is_active: true,
      });
      setShowCreateCategoryModal(false);
      await openCategoryModal(); // Refresh the list
      await fetchCategories(); // Refresh the dropdown
      toast.success("Category created successfully");
    } catch (error) {
      console.error("Error creating category:", error);
      toast.error("Failed to create category");
    } finally {
      setCreatingCategory(false);
    }
  }, [newCategory, openCategoryModal]);


 

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Products" />

      <PageHeader
        title="Products"
        showSearch={true}
        searchPlaceholder="Search products..."
        searchValue={currentFilters.search || ""}
        onSearchChange={(value) => handleFiltersChange({...currentFilters, search: value})}
        buttons={
          <>
          <Button variant="primary" size="sm" onClick={openCreateProductModal}>New Product</Button>
          <Button variant="secondary" size="sm" onClick={openCategoryModal}>Manage Categories</Button>
          </>
        }
      />


      <GenericListPage
        columns={columns}
        fetchData={fetchProducts}
        title="Products"
        searchPlaceholder="Search products..."
        defaultPageSize={15}
        filters={memoizedFilters}
        refreshKey={refreshKey}
        search={false }
        tableStyle="table-style-2"
      />

      {/* Create Product Modal */}
      <FormModal
        show={showCreateProductModal}
        onHide={closeCreateProductModal}
        title="Create New Product"
        desc="Fill in the details below to create a new product"
        formHtml={
          <>
            <div className="row">
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label htmlFor="newProductName">Product Name</label>
                  <input
                    type="text"
                    className="form-control"
                    id="newProductName"
                    value={newProduct.name}
                    onChange={(e) =>
                      handleNewProductChange("name", e.target.value)
                    }
                    placeholder="Enter product name"
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label htmlFor="newProductCategory">Category</label>
                  <select
                    className="form-control"
                    id="newProductCategory"
                    value={newProduct.category_id}
                    onChange={(e) =>
                      handleNewProductChange("category_id", e.target.value)
                    }
                  >
                    <option value="">Select Category</option>
                    {categories.map((category: ProductCategoryData) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label htmlFor="newProductPrice">Base Price</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    id="newProductPrice"
                    value={newProduct.base_price}
                    onChange={(e) =>
                      handleNewProductChange("base_price", e.target.value)
                    }
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label htmlFor="newProductCurrency">Currency</label>
                  <select
                    className="form-control"
                    id="newProductCurrency"
                    value={newProduct.currency}
                    onChange={(e) =>
                      handleNewProductChange("currency", e.target.value)
                    }
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="CAD">CAD</option>
                    <option value="AUD">AUD</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label htmlFor="newProductType">Type</label>
                  <select
                    className="form-control"
                    id="newProductType"
                    value={newProduct.is_service ? "service" : "product"}
                    onChange={(e) =>
                      handleNewProductChange("is_service", e.target.value === "service")
                    }
                  >
                    <option value="product">Product</option>
                    <option value="service">Service</option>
                  </select>
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label htmlFor="newProductStatus">Status</label>
                  <select
                    className="form-control"
                    id="newProductStatus"
                    value={newProduct.is_active ? "active" : "inactive"}
                    onChange={(e) =>
                      handleNewProductChange("is_active", e.target.value === "active")
                    }
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-12">
                <div className="form-group mb-3">
                  <label htmlFor="newProductDescription">Description</label>
                  <textarea
                    className="form-control"
                    id="newProductDescription"
                    value={newProduct.description}
                    onChange={(e) =>
                      handleNewProductChange("description", e.target.value)
                    }
                    rows={3}
                    placeholder="Enter product description..."
                  />
                </div>
              </div>
            </div>
          </>
        }
        submitButtonText={creatingProduct ? "Creating..." : "Create Product"}
        cancelButtonText="Close"
        onSubmit={handleSubmitCreateProduct}
        onCancel={closeCreateProductModal}
        submitButtonVariant="primary"
        cancelButtonVariant="secondary"
      />

      {/* Edit Product Modal */}
      {showEditProductModal && selectedProduct && (
        <FormModal
          show={showEditProductModal}
          onHide={closeEditProductModal}
          title={`Edit Product: ${selectedProduct.name}`}
          desc="Update the product details below"
          formHtml={
            <>
              <div className="row">
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label htmlFor="editProductName">Product Name</label>
                    <input
                      type="text"
                      className="form-control"
                      id="editProductName"
                      value={selectedProduct.name || ""}
                      onChange={(e) =>
                        handleEditProductChange("name", e.target.value)
                      }
                      placeholder="Enter product name"
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label htmlFor="editProductCategory">Category</label>
                    <select
                      className="form-control"
                      id="editProductCategory"
                      value={selectedProduct.category_id || ""}
                      onChange={(e) =>
                        handleEditProductChange("category_id", e.target.value)
                      }
                    >
                      <option value="">Select Category</option>
                      {categories.map((category: ProductCategoryData) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label htmlFor="editProductPrice">Base Price</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      id="editProductPrice"
                      value={selectedProduct.base_price || ""}
                      onChange={(e) =>
                        handleEditProductChange("base_price", e.target.value)
                      }
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label htmlFor="editProductCurrency">Currency</label>
                    <select
                      className="form-control"
                      id="editProductCurrency"
                      value={selectedProduct.currency || "USD"}
                      onChange={(e) =>
                        handleEditProductChange("currency", e.target.value)
                      }
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                      <option value="CAD">CAD</option>
                      <option value="AUD">AUD</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label htmlFor="editProductType">Type</label>
                    <select
                      className="form-control"
                      id="editProductType"
                      value={selectedProduct.is_service ? "service" : "product"}
                      onChange={(e) =>
                        handleEditProductChange("is_service", e.target.value === "service")
                      }
                    >
                      <option value="product">Product</option>
                      <option value="service">Service</option>
                    </select>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label htmlFor="editProductStatus">Status</label>
                    <select
                      className="form-control"
                      id="editProductStatus"
                      value={selectedProduct.is_active ? "active" : "inactive"}
                      onChange={(e) =>
                        handleEditProductChange("is_active", e.target.value === "active")
                      }
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-md-12">
                  <div className="form-group mb-3">
                    <label htmlFor="editProductDescription">Description</label>
                    <textarea
                      className="form-control"
                      id="editProductDescription"
                      value={selectedProduct.description || ""}
                      onChange={(e) =>
                        handleEditProductChange("description", e.target.value)
                      }
                      rows={3}
                      placeholder="Enter product description..."
                    />
                  </div>
                </div>
              </div>
            </>
          }
          submitButtonText={editingProduct ? "Updating..." : "Update Product"}
          cancelButtonText="Close"
          onSubmit={handleSubmitEditProduct}
          onCancel={closeEditProductModal}
          submitButtonVariant="primary"
          cancelButtonVariant="secondary"
        />
      )}

      {/* Category Management Modal */}
      <FormModal
        show={showCategoryModal}
        onHide={closeCategoryModal}
        title="Manage Product Categories"
        desc="View and manage your product categories below"
        formHtml={
          <>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">Product Categories</h5>
              <Button 
                variant="primary" 
                size="sm" 
                onClick={openCreateCategoryModal}
              >
                <FiPlus className="me-1" />
                Create Category
              </Button>
            </div>
            <div className="table-responsive">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th>Products Count</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryList.map((category: ProductCategoryData) => (
                    <tr key={category.id}>
                      <td>
                        <div className="fw-bold">{category.name}</div>
                      </td>
                      <td>
                        <div className="text-muted">
                          {category.description || "No description"}
                        </div>
                      </td>
                      <td>
                        <span
                          className={`status-badge ${
                            category.is_active ? "success" : "danger"
                          }`}
                        >
                          {category.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>
                        <span className="badge bg-info">
                          {category.products?.length || 0}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons-container">
                          <button
                            className="btn btn-sm btn-outline-primary me-1"
                            onClick={() => handleEditCategory(category)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDeleteCategory(category)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        }
        submitButtonText=""
        cancelButtonText="Close"
        onSubmit={() => {}}
        onCancel={closeCategoryModal}
        submitButtonVariant="primary"
        cancelButtonVariant="secondary"
        ShowSubmitButton={false}
      />

      {/* Edit Category Modal */}
      {showEditCategoryModal && selectedCategory && (
        <FormModal
          show={showEditCategoryModal}
          onHide={() => setShowEditCategoryModal(false)}
          title={`Edit Category: ${selectedCategory.name}`}
          desc="Update the category details below"
          formHtml={
            <>
              <div className="form-group mb-3">
                <label htmlFor="editCategoryName">Category Name</label>
                <input
                  type="text"
                  className="form-control"
                  id="editCategoryName"
                  value={selectedCategory.name || ""}
                  onChange={(e) =>
                    setSelectedCategory({
                      ...selectedCategory,
                      name: e.target.value,
                    })
                  }
                  placeholder="Enter category name"
                />
              </div>
              <div className="form-group mb-3">
                <label htmlFor="editCategoryDescription">Description</label>
                <textarea
                  className="form-control"
                  id="editCategoryDescription"
                  value={selectedCategory.description || ""}
                  onChange={(e) =>
                    setSelectedCategory({
                      ...selectedCategory,
                      description: e.target.value,
                    })
                  }
                  rows={3}
                  placeholder="Enter category description..."
                />
              </div>
              <div className="form-group mb-3">
                <label htmlFor="editCategoryStatus">Status</label>
                <select
                  className="form-control"
                  id="editCategoryStatus"
                  value={selectedCategory.is_active ? "active" : "inactive"}
                  onChange={(e) =>
                    setSelectedCategory({
                      ...selectedCategory,
                      is_active: e.target.value === "active",
                    })
                  }
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </>
          }
          submitButtonText={editingCategory ? "Updating..." : "Update Category"}
          cancelButtonText="Close"
          onSubmit={handleSubmitEditCategory}
          onCancel={() => setShowEditCategoryModal(false)}
          submitButtonVariant="primary"
          cancelButtonVariant="secondary"
        />
      )}

      {/* Delete Category Modal */}
      {showDeleteCategoryModal && selectedCategory && (
        <ConfirmModal
          show={showDeleteCategoryModal}
          onHide={() => setShowDeleteCategoryModal(false)}
          title="Delete Category?"
          description="Are you sure you want to delete category {targetName}? This action cannot be undone and will affect all products in this category."
          targetName={selectedCategory.name}
          confirmButtonText="Delete"
          cancelButtonText="Close"
          onConfirm={handleSubmitDeleteCategory}
          onCancel={() => setShowDeleteCategoryModal(false)}
          confirmButtonVariant="danger"
          cancelButtonVariant="secondary"
          requireTextConfirmation={true}
          confirmationPlaceholder="Type the word DELETE to confirm"
          confirmationLabel=""
          requiredConfirmationText="DELETE"
        />
      )}

      {/* Delete Product Modal */}
      {showDeleteProductModal && selectedProduct && (
        <ConfirmModal
          show={showDeleteProductModal}
          onHide={() => setShowDeleteProductModal(false)}
          title="Delete Product?"
          description="Are you sure you want to delete product {targetName}? This action cannot be undone."
          targetName={selectedProduct.name}
          confirmButtonText="Delete"
          cancelButtonText="Close"
          onConfirm={handleSubmitDeleteProduct}
          onCancel={() => setShowDeleteProductModal(false)}
          confirmButtonVariant="danger"
          cancelButtonVariant="secondary"
          requireTextConfirmation={true}
          confirmationPlaceholder="Type the word DELETE to confirm"
          confirmationLabel=""
          requiredConfirmationText="DELETE"
        />
      )}

      {/* Create Category Modal */}
      <FormModal
        show={showCreateCategoryModal}
        onHide={closeCreateCategoryModal}
        title="Create New Category"
        desc="Fill in the details below to create a new product category"
        formHtml={
          <>
            <div className="form-group mb-3">
              <label htmlFor="newCategoryName">Category Name *</label>
              <input
                type="text"
                className="form-control"
                id="newCategoryName"
                value={newCategory.name}
                onChange={(e) =>
                  handleNewCategoryChange("name", e.target.value)
                }
                placeholder="Enter category name"
              />
            </div>
            <div className="form-group mb-3">
              <label htmlFor="newCategoryDescription">Description</label>
              <textarea
                className="form-control"
                id="newCategoryDescription"
                value={newCategory.description}
                onChange={(e) =>
                  handleNewCategoryChange("description", e.target.value)
                }
                rows={3}
                placeholder="Enter category description..."
              />
            </div>
            <div className="form-group mb-3">
              <label htmlFor="newCategoryStatus">Status</label>
              <select
                className="form-control"
                id="newCategoryStatus"
                value={newCategory.is_active ? "active" : "inactive"}
                onChange={(e) =>
                  handleNewCategoryChange("is_active", e.target.value === "active")
                }
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </>
        }
        submitButtonText={creatingCategory ? "Creating..." : "Create Category"}
        cancelButtonText="Cancel"
        onSubmit={handleSubmitCreateCategory}
        onCancel={closeCreateCategoryModal}
        submitButtonVariant="primary"
        cancelButtonVariant="secondary"
        isSubmitting={creatingCategory}
      />

    </React.Fragment>
  );
};

ProductList.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default ProductList;
