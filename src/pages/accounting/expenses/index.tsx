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
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpense,
  getExpenseCategories,
  createExpenseCategory,
  updateExpenseCategory,
  deleteExpenseCategory,
  ExpenseData,
  ExpenseCreateUpdatePayload,
  ExpenseCategoryData,
  ExpenseCategoryCreateUpdatePayload,
} from "@utils/accounting";
import { Column } from "@components/CustomDataTable";
import { Button, Modal, Row } from "react-bootstrap";
import { Col } from "react-bootstrap";
import { toast } from "react-toastify";
import { useSession } from "next-auth/react";
import moment from "moment";
import "@assets/scss/gsm-assign.scss";
import "@assets/scss/dashboard-card.scss";
import "@assets/scss/common.scss";
import { motion } from "framer-motion";

interface SelectOption {
  value: number;
  label: string;
}

const ExpenseList = () => {
  const { data: session, status } = useSession();

  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [currentFilters, setCurrentFilters] = useState({});

  const [categories, setCategories] = useState<ExpenseCategoryData[]>([]);

  // Category Management
  const [showCategoryModal, setShowCategoryModal] = useState<boolean>(false);
  const [categoryList, setCategoryList] = useState<ExpenseCategoryData[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategoryData | null>(null);
  const [showEditCategoryModal, setShowEditCategoryModal] = useState<boolean>(false);
  const [showCreateCategoryModal, setShowCreateCategoryModal] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<boolean>(false);
  const [creatingCategory, setCreatingCategory] = useState<boolean>(false);
  const [showDeleteCategoryModal, setShowDeleteCategoryModal] = useState<boolean>(false);
  const [confirmDeleteCategory, setConfirmDeleteCategory] = useState<string>("");
  const [newCategory, setNewCategory] = useState<ExpenseCategoryCreateUpdatePayload>({
    name: "",
    description: "",
    color: "#007bff",
    is_active: true,
  });

  // Expense Delete Modal
  const [showDeleteExpenseModal, setShowDeleteExpenseModal] = useState<boolean>(false);
  const [confirmDeleteExpense, setConfirmDeleteExpense] = useState<string>("");

  const columns: Column[] = useMemo(
    () => [
      {
        key: "description",
        name: "Description",
        selector: (row: ExpenseData) => row.description,
        sortable: true,
        cell: (props: ExpenseData) => (
          <div>
            <div className="fw-bold text-primary">{props.description}</div>
            {props.expense_number && (
              <div className="text-muted small">#{props.expense_number}</div>
            )}
          </div>
        ),
      },
      {
        key: "category",
        name: "Category",
        selector: (row: ExpenseData) => row.category?.name,
        sortable: true,
        cell: (props: ExpenseData) => (
          <span 
            className="badge"
            style={{ backgroundColor: props.category?.color || '#6c757d' }}
          >
            {props.category?.name || "No Category"}
          </span>
        ),
      },
      {
        key: "amount",
        name: "Amount",
        selector: (row: ExpenseData) => row.amount,
        sortable: true,
        cell: (props: ExpenseData) => (
          <span className="fw-bold text-success">
            {props.currency_code}{" "}
            {parseFloat(props.amount || "0").toFixed(2)}
          </span>
        ),
      },
      {
        key: "tax_amount",
        name: "Tax",
        selector: (row: ExpenseData) => row.tax_amount,
        sortable: true,
        cell: (props: ExpenseData) => (
          <span className="text-warning">
            {props.currency_code}{" "}
            {parseFloat(props.tax_amount || "0").toFixed(2)}
          </span>
        ),
      },
      {
        key: "total_amount",
        name: "Total",
        selector: (row: ExpenseData) => row.total_amount,
        sortable: true,
        cell: (props: ExpenseData) => (
          <span className="fw-bold text-primary">
            {props.currency_code}{" "}
            {parseFloat(props.total_amount || "0").toFixed(2)}
          </span>
        ),
      },
      {
        key: "payment_status",
        name: "Status",
        selector: (row: ExpenseData) => row.payment_status,
        sortable: true,
        cell: (props: ExpenseData) => {
          const statusColors = {
            pending: "warning",
            paid: "success",
            failed: "danger",
            cancelled: "secondary",
          };
          return (
            <span
              className={`status-badge ${
                statusColors[props.payment_status as keyof typeof statusColors] ||
                "secondary"
              }`}
            >
              {props.payment_status}
            </span>
          );
        },
      },
      {
        key: "expense_date",
        name: "Date",
        selector: (row: ExpenseData) => row.expense_date,
        sortable: true,
        cell: (props: ExpenseData) => (
          <span className="text-muted">
            {moment(props.expense_date).format("DD/MM/YYYY")}
          </span>
        ),
      },
      {
        key: "Action",
        name: "ACTION",
        selector: (row: ExpenseData) => row.id,
        sortable: false,
        cell: (props: ExpenseData) => (
          <div className="action-buttons-container">
            <button
              className="btn btn-sm btn-outline-primary"
              onClick={() => handleEditExpense(props)}
            >
              Edit
            </button>
            <button
              className="btn btn-sm btn-outline-danger"
              onClick={() => handleDeleteExpense(props)}
            >
              Delete
            </button>
          </div>
        ),
      },
    ],
    [session?.user?.permissions]
  );
  const fetchCategories = useCallback(async () => {
    try {
      const categoriesData = await getExpenseCategories();
      setCategories(categoriesData.data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const memoizedFilters = useMemo(() => currentFilters, [currentFilters]);

  const fetchExpenses = useCallback(
    async (page = 1, perPage = 15, search = "") => {
      try {
        const response = await getExpenses({
          page,
          per_page: perPage,
          search,
          ...memoizedFilters,
        });

        // The getExpenses function returns PaginationWrapper<ExpenseData>
        // which has the structure: { data: ExpenseData[], pagination: {...} }
        return {
          data: response.data, // The actual expense array
          total: response.pagination.total,
          page: response.pagination.current_page,
          per_page: response.pagination.per_page,
          last_page: response.pagination.last_page,
        };
      } catch (error) {
        console.error("Error fetching expenses:", error);
        throw error;
      }
    },
    [memoizedFilters]
  );

  const handleFiltersChange = useCallback((filters: any) => {
    setCurrentFilters(filters);
  }, []);

  // Edit Expense Modal
  const [selectedExpense, setSelectedExpense] = useState<ExpenseData | null>(
    null
  );
  const [showEditExpenseModal, setShowEditExpenseModal] =
    useState<boolean>(false);
  const [editingExpense, setEditingExpense] = useState<boolean>(false);

  const handleEditExpense = useCallback((props: ExpenseData) => {
    setSelectedExpense(props);
    setShowEditExpenseModal(true);
  }, []);

  const handleSubmitEditExpense = useCallback(async () => {
    if (!selectedExpense) return;

    if (!selectedExpense.description) {
      toast.error("Please enter a description");
      return;
    }
    if (!selectedExpense.category_id) {
      toast.error("Please select a category");
      return;
    }
    if (!selectedExpense.amount || parseFloat(selectedExpense.amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setEditingExpense(true);
    try {
      const expenseData: ExpenseCreateUpdatePayload = {
        category_id: selectedExpense.category_id,
        expense_date: selectedExpense.expense_date,
        description: selectedExpense.description,
        amount: selectedExpense.amount,
        tax_amount: selectedExpense.tax_amount,
        total_amount: selectedExpense.total_amount,
      };

      const response = await updateExpense(selectedExpense.id, expenseData);

      if (response) {
        setSelectedExpense(null);
        setShowEditExpenseModal(false);
        setRefreshKey((prev) => prev + 1);
        toast.success("Expense updated successfully");
      }
    } catch (error) {
      console.error("Error updating expense:", error);
      toast.error("Failed to update expense");
    } finally {
      setEditingExpense(false);
    }
  }, [selectedExpense]);

  // Create Expense Modal
  const [showCreateExpenseModal, setShowCreateExpenseModal] =
    useState<boolean>(false);
  const [creatingExpense, setCreatingExpense] = useState<boolean>(false);
  const [newExpense, setNewExpense] = useState<ExpenseCreateUpdatePayload>({
    category_id: "",
    expense_date: moment().format("YYYY-MM-DD"),
    description: "",
    amount: "",
    tax_amount: "",
    total_amount: "",
  });

  const handleSubmitCreateExpense = useCallback(async () => {
    if (!newExpense.description) {
      toast.error("Please enter a description");
      return;
    }
    if (!newExpense.category_id) {
      toast.error("Please select a category");
      return;
    }
    if (!newExpense.amount || parseFloat(newExpense.amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setCreatingExpense(true);
    try {
      const response = await createExpense(newExpense);

      if (response) {
        setNewExpense({
          category_id: "",
          expense_date: moment().format("YYYY-MM-DD"),
          description: "",
          amount: "",
          tax_amount: "",
          total_amount: "",
        });
        setShowCreateExpenseModal(false);
        setRefreshKey((prev) => prev + 1);
        toast.success("Expense created successfully");
      }
    } catch (error) {
      console.error("Error creating expense:", error);
      toast.error("Failed to create expense");
    } finally {
      setCreatingExpense(false);
    }
  }, [newExpense]);

  // Modal handlers
  const openCreateExpenseModal = useCallback(
    () => setShowCreateExpenseModal(true),
    []
  );
  const closeCreateExpenseModal = useCallback(() => {
    setShowCreateExpenseModal(false);
    setNewExpense({
      category_id: "",
      expense_date: moment().format("YYYY-MM-DD"),
      description: "",
      amount: "",
      tax_amount: "",
      total_amount: "",
    });
  }, []);

  const closeEditExpenseModal = useCallback(() => {
    setShowEditExpenseModal(false);
    setSelectedExpense(null);
  }, []);

  // Input handlers
  const handleNewExpenseChange = useCallback(
    (field: keyof ExpenseCreateUpdatePayload, value: any) => {
      setNewExpense((prev: ExpenseCreateUpdatePayload) => ({
        ...prev,
        [field]: value,
      }));
    },
    []
  );

  const handleEditExpenseChange = useCallback(
    (field: keyof ExpenseData, value: any) => {
      setSelectedExpense((prev: ExpenseData | null) => ({
        ...prev!,
        [field]: value,
      }));
    },
    []
  );
  
  // Expense Delete Handlers
  const handleDeleteExpense = useCallback((props: ExpenseData) => {
    setSelectedExpense(props);
    setShowDeleteExpenseModal(true);
  }, []);

  const handleSubmitDeleteExpense = useCallback(async () => {
    if (!selectedExpense) return;

    const confirmDeleteValue = confirmDeleteExpense.trim();
    if (confirmDeleteValue === "DELETE") {
      try {
        await deleteExpense(selectedExpense.id);
        setSelectedExpense(null);
        setShowDeleteExpenseModal(false);
        setConfirmDeleteExpense("");
        setRefreshKey((prev) => prev + 1);
        toast.success("Expense deleted successfully");
      } catch (error) {
        console.error("Error deleting expense:", error);
        toast.error("Failed to delete expense");
      }
    } else {
      toast.error("Please type the word DELETE to confirm");
    }
  }, [confirmDeleteExpense, selectedExpense]);

  // Category Management Handlers
  const openCategoryModal = useCallback(async () => {
    try {
      const response = await getExpenseCategories();
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

  const handleEditCategory = useCallback((category: ExpenseCategoryData) => {
    setSelectedCategory(category);
    setShowEditCategoryModal(true);
  }, []);

  const handleDeleteCategory = useCallback((category: ExpenseCategoryData) => {
    setSelectedCategory(category);
    setShowDeleteCategoryModal(true);
  }, []);

  const handleCreateCategory = useCallback(() => {
    setNewCategory({
      name: "",
      description: "",
      color: "#007bff",
      is_active: true,
    });
    setShowCreateCategoryModal(true);
  }, []);

  const handleSubmitCreateCategory = useCallback(async () => {
    if (!newCategory.name) {
      toast.error("Please enter a category name");
      return;
    }

    setCreatingCategory(true);
    try {
      await createExpenseCategory(newCategory);
      setNewCategory({
        name: "",
        description: "",
        color: "#007bff",
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

  const handleNewCategoryChange = useCallback(
    (field: keyof ExpenseCategoryCreateUpdatePayload, value: any) => {
      setNewCategory((prev: ExpenseCategoryCreateUpdatePayload) => ({
        ...prev,
        [field]: value,
      }));
    },
    []
  );

  const handleSubmitEditCategory = useCallback(async () => {
    if (!selectedCategory) return;

    if (!selectedCategory.name) {
      toast.error("Please enter a category name");
      return;
    }

    setEditingCategory(true);
    try {
      const categoryData: ExpenseCategoryCreateUpdatePayload = {
        name: selectedCategory.name,
        description: selectedCategory.description || "",
        color: selectedCategory.color,
        is_active: selectedCategory.is_active,
      };

      await updateExpenseCategory(selectedCategory.id, categoryData);
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

    const confirmDeleteValue = confirmDeleteCategory.trim();
    if (confirmDeleteValue === "DELETE") {
      try {
        await deleteExpenseCategory(selectedCategory.id);
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
    } else {
      toast.error("Please type the word DELETE to confirm");
    }
  }, [confirmDeleteCategory, selectedCategory, openCategoryModal]);




  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Expenses" />

      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title style-2">
            <Row className="d-flex justify-content-between align-items-center">
              <Col md={4}>
                <h2 className="mb-0">Expenses</h2>
              </Col>

              <Col md={8} className="d-flex justify-content-end">
                <div className="action-buttons">
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    className="me-2"
                    onClick={openCategoryModal}
                  >
                    Manage Categories
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={openCreateExpenseModal}
                  >
                    New Expense
                  </Button>
                </div>
              </Col>
            </Row>
          </div>
        </Col>
      </Row>

      <GenericListPage
        columns={columns}
        fetchData={fetchExpenses}
        title="Expenses"
        searchPlaceholder="Search expenses..."
        defaultPageSize={15}
        filters={memoizedFilters}
        refreshKey={refreshKey}
        search={true}
        tableStyle="table-style-2"
      />

      {/* Create Expense Modal */}
      {showCreateExpenseModal && (
        <Modal
          show={showCreateExpenseModal}
          onHide={closeCreateExpenseModal}
          size="lg"
        >
          <Modal.Header closeButton>
            <Modal.Title>Create New Expense</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="row">
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label htmlFor="newExpenseCategory">Category</label>
                  <select
                    className="form-control"
                    id="newExpenseCategory"
                    value={newExpense.category_id}
                    onChange={(e) =>
                      handleNewExpenseChange("category_id", e.target.value)
                    }
                  >
                    <option value="">Select Category</option>
                    {categories.map((category: ExpenseCategoryData) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label htmlFor="newExpenseDate">Expense Date</label>
                  <input
                    type="date"
                    className="form-control"
                    id="newExpenseDate"
                    value={newExpense.expense_date}
                    onChange={(e) =>
                      handleNewExpenseChange("expense_date", e.target.value)
                    }
                  />
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-12">
                <div className="form-group mb-3">
                  <label htmlFor="newExpenseDescription">Description</label>
                  <input
                    type="text"
                    className="form-control"
                    id="newExpenseDescription"
                    value={newExpense.description}
                    onChange={(e) =>
                      handleNewExpenseChange("description", e.target.value)
                    }
                    placeholder="Enter expense description"
                  />
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-4">
                <div className="form-group mb-3">
                  <label htmlFor="newExpenseAmount">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    id="newExpenseAmount"
                    value={newExpense.amount}
                    onChange={(e) =>
                      handleNewExpenseChange("amount", e.target.value)
                    }
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="col-md-4">
                <div className="form-group mb-3">
                  <label htmlFor="newExpenseTaxAmount">Tax Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    id="newExpenseTaxAmount"
                    value={newExpense.tax_amount}
                    onChange={(e) =>
                      handleNewExpenseChange("tax_amount", e.target.value)
                    }
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="col-md-4">
                <div className="form-group mb-3">
                  <label htmlFor="newExpenseTotalAmount">Total Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    id="newExpenseTotalAmount"
                    value={newExpense.total_amount}
                    onChange={(e) =>
                      handleNewExpenseChange("total_amount", e.target.value)
                    }
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={closeCreateExpenseModal}>
              Close
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmitCreateExpense}
              disabled={creatingExpense}
            >
              {creatingExpense ? "Creating..." : "Create Expense"}
            </Button>
          </Modal.Footer>
        </Modal>
      )}

      {/* Edit Expense Modal */}
      {showEditExpenseModal && selectedExpense && (
        <Modal
          show={showEditExpenseModal}
          onHide={closeEditExpenseModal}
          size="lg"
        >
          <Modal.Header closeButton>
            <Modal.Title>
              Edit Expense: {selectedExpense.description}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="row">
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label htmlFor="editExpenseCategory">Category</label>
                  <select
                    className="form-control"
                    id="editExpenseCategory"
                    value={selectedExpense.category_id || ""}
                    onChange={(e) =>
                      handleEditExpenseChange("category_id", e.target.value)
                    }
                  >
                    <option value="">Select Category</option>
                    {categories.map((category: ExpenseCategoryData) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label htmlFor="editExpenseDate">Expense Date</label>
                  <input
                    type="date"
                    className="form-control"
                    id="editExpenseDate"
                    value={selectedExpense.expense_date ? moment(selectedExpense.expense_date).format("YYYY-MM-DD") : ""}
                    onChange={(e) =>
                      handleEditExpenseChange("expense_date", e.target.value)
                    }
                  />
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-12">
                <div className="form-group mb-3">
                  <label htmlFor="editExpenseDescription">Description</label>
                  <input
                    type="text"
                    className="form-control"
                    id="editExpenseDescription"
                    value={selectedExpense.description || ""}
                    onChange={(e) =>
                      handleEditExpenseChange("description", e.target.value)
                    }
                    placeholder="Enter expense description"
                  />
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-4">
                <div className="form-group mb-3">
                  <label htmlFor="editExpenseAmount">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    id="editExpenseAmount"
                    value={selectedExpense.amount || ""}
                    onChange={(e) =>
                      handleEditExpenseChange("amount", e.target.value)
                    }
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="col-md-4">
                <div className="form-group mb-3">
                  <label htmlFor="editExpenseTaxAmount">Tax Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    id="editExpenseTaxAmount"
                    value={selectedExpense.tax_amount || ""}
                    onChange={(e) =>
                      handleEditExpenseChange("tax_amount", e.target.value)
                    }
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="col-md-4">
                <div className="form-group mb-3">
                  <label htmlFor="editExpenseTotalAmount">Total Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    id="editExpenseTotalAmount"
                    value={selectedExpense.total_amount || ""}
                    onChange={(e) =>
                      handleEditExpenseChange("total_amount", e.target.value)
                    }
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={closeEditExpenseModal}>
              Close
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmitEditExpense}
              disabled={editingExpense}
            >
              {editingExpense ? "Updating..." : "Update Expense"}
            </Button>
          </Modal.Footer>
        </Modal>
      )}

      {/* Category Management Modal */}
      {showCategoryModal && (
        <Modal
          show={showCategoryModal}
          onHide={closeCategoryModal}
          size="lg"
        >
          <Modal.Header closeButton>
            <Modal.Title>Manage Expense Categories</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">Categories</h5>
              <Button
                variant="primary"
                size="sm"
                onClick={handleCreateCategory}
              >
                Create Category
              </Button>
            </div>
            <div className="table-responsive">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Color</th>
                    <th>Status</th>
                    <th>Expenses Count</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryList.map((category: ExpenseCategoryData) => (
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
                          className="badge"
                          style={{ backgroundColor: category.color }}
                        >
                          {category.color}
                        </span>
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
                          {(category as any).expenses?.length || 0}
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
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={closeCategoryModal}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      )}

      {/* Edit Category Modal */}
      {showEditCategoryModal && selectedCategory && (
        <Modal
          show={showEditCategoryModal}
          onHide={() => setShowEditCategoryModal(false)}
          size="lg"
        >
          <Modal.Header closeButton>
            <Modal.Title>Edit Category: {selectedCategory.name}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
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
              <label htmlFor="editCategoryColor">Color</label>
              <input
                type="color"
                className="form-control"
                id="editCategoryColor"
                value={selectedCategory.color || "#000000"}
                onChange={(e) =>
                  setSelectedCategory({
                    ...selectedCategory,
                    color: e.target.value,
                  })
                }
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
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowEditCategoryModal(false)}
            >
              Close
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmitEditCategory}
              disabled={editingCategory}
            >
              {editingCategory ? "Updating..." : "Update Category"}
            </Button>
          </Modal.Footer>
        </Modal>
      )}

      {/* Delete Category Modal */}
      {showDeleteCategoryModal && selectedCategory && (
        <Modal
          show={showDeleteCategoryModal}
          onHide={() => setShowDeleteCategoryModal(false)}
        >
          <Modal.Header closeButton>
            <Modal.Title>Delete Category?</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>
              Are you sure you want to delete category{" "}
              <b className="text-danger">{selectedCategory.name}</b>?
            </p>
            <p>
              This action cannot be undone and will affect all expenses in this
              category.
            </p>
            <p>
              Type the word <b className="text-danger">DELETE</b> to confirm
            </p>
            <input
              type="text"
              className="form-control"
              id="confirmDeleteCategory"
              value={confirmDeleteCategory}
              onChange={(e) => setConfirmDeleteCategory(e.target.value)}
              placeholder="Type the word DELETE to confirm"
            />
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowDeleteCategoryModal(false)}
            >
              Close
            </Button>
            <Button variant="danger" onClick={handleSubmitDeleteCategory}>
              Delete
            </Button>
          </Modal.Footer>
        </Modal>
      )}

      {/* Delete Expense Modal */}
      {showDeleteExpenseModal && selectedExpense && (
        <Modal
          show={showDeleteExpenseModal}
          onHide={() => setShowDeleteExpenseModal(false)}
        >
          <Modal.Header closeButton>
            <Modal.Title>Delete Expense?</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>
              Are you sure you want to delete expense{" "}
              <b className="text-danger">{selectedExpense.description}</b>?
            </p>
            <p>
              This action cannot be undone.
            </p>
            <p>
              Type the word <b className="text-danger">DELETE</b> to confirm
            </p>
            <input
              type="text"
              className="form-control"
              id="confirmDeleteExpense"
              value={confirmDeleteExpense}
              onChange={(e) => setConfirmDeleteExpense(e.target.value)}
              placeholder="Type the word DELETE to confirm"
            />
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowDeleteExpenseModal(false)}
            >
              Close
            </Button>
            <Button variant="danger" onClick={handleSubmitDeleteExpense}>
              Delete
            </Button>
          </Modal.Footer>
        </Modal>
      )}

      {/* Create Category Modal */}
      {showCreateCategoryModal && (
        <Modal
          show={showCreateCategoryModal}
          onHide={() => setShowCreateCategoryModal(false)}
          size="lg"
        >
          <Modal.Header closeButton>
            <Modal.Title>Create New Category</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="form-group mb-3">
              <label htmlFor="newCategoryName">Category Name</label>
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
              <label htmlFor="newCategoryColor">Color</label>
              <div className="d-flex align-items-center">
                <input
                  type="color"
                  className="form-control me-2"
                  id="newCategoryColor"
                  value={newCategory.color}
                  onChange={(e) =>
                    handleNewCategoryChange("color", e.target.value)
                  }
                  style={{ width: "60px", height: "38px" }}
                />
                <input
                  type="text"
                  className="form-control"
                  value={newCategory.color}
                  onChange={(e) =>
                    handleNewCategoryChange("color", e.target.value)
                  }
                  placeholder="#000000"
                />
              </div>
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
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowCreateCategoryModal(false)}
            >
              Close
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmitCreateCategory}
              disabled={creatingCategory}
            >
              {creatingCategory ? "Creating..." : "Create Category"}
            </Button>
          </Modal.Footer>
        </Modal>
      )}

    </React.Fragment>
  );
};

ExpenseList.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default ExpenseList;