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
  downloadFile,
  downloadReceipt,
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

import { motion } from "framer-motion";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import PageHeader from "@components/PageHeader";
import FormModal from "@pages/partial/FormModal";
import ConfirmModal from "@pages/partial/ConfirmModal";
import SuccessfulModal from "@pages/partial/SuccessfulModal";
import PageSummaryGrid, { SummaryCard } from '@components/PageSummaryGrid';
import DatatableActionButton from "@components/DatatableActionButton";
import { FiEdit, FiTrash2, FiEye,FiPlus,FiDownload } from "react-icons/fi";


interface SelectOption {
  value: number;
  label: string;
}

const ExpenseList = () => {
  const { data: session, status } = useSession();

  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [currentFilters, setCurrentFilters] = useState<{ search?: string }>({});

  const [categories, setCategories] = useState<ExpenseCategoryData[]>([]);

  // Category Management
  const [showCategoryModal, setShowCategoryModal] = useState<boolean>(false);
  const [categoryList, setCategoryList] = useState<ExpenseCategoryData[]>([]);
  const [selectedCategory, setSelectedCategory] =
    useState<ExpenseCategoryData | null>(null);
  const [showEditCategoryModal, setShowEditCategoryModal] =
    useState<boolean>(false);
  const [showCreateCategoryModal, setShowCreateCategoryModal] =
    useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<boolean>(false);
  const [creatingCategory, setCreatingCategory] = useState<boolean>(false);
  const [showDeleteCategoryModal, setShowDeleteCategoryModal] =
    useState<boolean>(false);
  const [confirmDeleteCategory, setConfirmDeleteCategory] =
    useState<string>("");
  const [newCategory, setNewCategory] =
    useState<ExpenseCategoryCreateUpdatePayload>({
      name: "",
      description: "",
      color: "#007bff",
      is_active: true,
    });

  // Expense Delete Modal
  const [showDeleteExpenseModal, setShowDeleteExpenseModal] =
    useState<boolean>(false);
  const [confirmDeleteExpense, setConfirmDeleteExpense] = useState<string>("");

  // View Attachments Modal
  const [showViewAttachmentsModal, setShowViewAttachmentsModal] =
    useState<boolean>(false);
  const [selectedExpenseForAttachments, setSelectedExpenseForAttachments] =
    useState<ExpenseData | null>(null);
  const [downloadingFile, setDownloadingFile] = useState<number | null>(null);

  const columns: Column[] = useMemo(
    () => [
      {
        key: "description",
        name: "Description",
        selector: (row: ExpenseData) => row.description,
        sortable: true,
        cell: (props: ExpenseData) => (
          <div>
            <div>{props.description}</div>
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
          <>
          <span
            className="status-badge info"
            // style={{ backgroundColor: props.category?.color || "#6c757d" }}
          >
            {props.category?.name || "No Category"}
          </span>
          
          </>
        ),
      },
      {
        key: "amount",
        name: "Amount",
        selector: (row: ExpenseData) => row.amount,
        sortable: true,
        cell: (props: ExpenseData) => (
          <span>
            {props.currency_code} {parseFloat(props.amount || "0").toFixed(2)}
          </span>
        ),
      },
      {
        key: "tax_amount",
        name: "Tax",
        selector: (row: ExpenseData) => row.tax_amount,
        sortable: true,
        cell: (props: ExpenseData) => (
          <div>
            <span >
              {props.currency_code}{" "}
              {parseFloat(props.tax_amount || "0").toFixed(2)}
            </span>
            <br />
            <small className="text-muted">
              ({props.tax_type || "amount"})
            </small>
          </div>
        ),
      },
      {
        key: "total_amount",
        name: "Total",
        selector: (row: ExpenseData) => row.total_amount,
        sortable: true,
        cell: (props: ExpenseData) => (
          <span>
            {props.currency_code}{" "}
            {parseFloat(props.total_amount || "0").toFixed(2)}
          </span>
        ),
      },
      {
        key: "expense_date",
        name: "Date",
        selector: (row: ExpenseData) => row.expense_date,
        sortable: true,
        cell: (props: ExpenseData) => (
          <span>
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
          <DatatableActionButton
            actions={[
              {
                label: "View Attachments",
                icon: <FiEye />,
                onClick: () => handleViewAttachments(props),
                className: 'gap-2'
              },
              {
                label: "Edit",
                icon: <FiEdit />,
                onClick: () => handleEditExpense(props),
                className: 'gap-2'
              },
              {
                label: "Delete",
                icon: <FiTrash2 />,
                onClick: () => handleDeleteExpense(props),
                className: 'text-danger gap-2'
              },
            ]}
          />
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
  const [editExpenseFiles, setEditExpenseFiles] = useState<File[]>([]);

  const handleEditExpense = useCallback((props: ExpenseData) => {
    setSelectedExpense(props);
    setEditExpenseFiles([]); // Reset files when opening edit modal
    setShowEditExpenseModal(true);
  }, []);

  // File validation function
  const validateFile = useCallback((file: File): boolean => {
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    if (!allowedTypes.includes(file.type)) {
      toast.error(`File ${file.name} is not a valid format. Only PDF, PNG, and JPEG files are allowed.`);
      return false;
    }
    
    if (file.size > maxSize) {
      toast.error(`File ${file.name} is too large. Maximum size is 10MB.`);
      return false;
    }
    
    return true;
  }, []);

  // File handling functions
  const handleNewExpenseFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(validateFile);
    setNewExpenseFiles(prev => [...prev, ...validFiles]);
  }, [validateFile]);

  const handleEditExpenseFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(validateFile);
    setEditExpenseFiles(prev => [...prev, ...validFiles]);
  }, [validateFile]);

  const removeNewExpenseFile = useCallback((index: number) => {
    setNewExpenseFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const removeEditExpenseFile = useCallback((index: number) => {
    setEditExpenseFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  // View Attachments Handlers
  const handleViewAttachments = useCallback((expense: ExpenseData) => {
    setSelectedExpenseForAttachments(expense);
    setShowViewAttachmentsModal(true);
  }, []);

  const closeViewAttachmentsModal = useCallback(() => {
    setShowViewAttachmentsModal(false);
    setSelectedExpenseForAttachments(null);
    setDownloadingFile(null);
  }, []);

  const handleDownloadFile = useCallback(async (expenseId: number, fileIndex: number) => {
    setDownloadingFile(fileIndex);
    try {
      const { blob, filename } = await downloadFile(expenseId, fileIndex);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("File downloaded successfully");
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error("Failed to download file");
    } finally {
      setDownloadingFile(null);
    }
  }, []);


  const getFileIcon = useCallback((fileType: string) => {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('image')) return '🖼️';
    return '📎';
  }, []);

  const formatFileSize = useCallback((bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  // Calculate total amount based on amount, tax_type, and tax_amount
  const calculateTotalAmount = useCallback((amount: string, taxAmount: string, taxType: string) => {
    const baseAmount = parseFloat(amount) || 0;
    const taxValue = parseFloat(taxAmount) || 0;
    
    let calculatedTax = 0;
    if (taxType === 'percentage') {
      calculatedTax = (baseAmount * taxValue) / 100;
    } else {
      calculatedTax = taxValue;
    }
    
    return (baseAmount + calculatedTax).toFixed(2);
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
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('category_id', selectedExpense.category_id);
      formData.append('expense_date', selectedExpense.expense_date);
      formData.append('description', selectedExpense.description);
      formData.append('amount', selectedExpense.amount);
      formData.append('tax_amount', selectedExpense.tax_amount || '0');
      formData.append('tax_type', selectedExpense.tax_type || 'amount');
      formData.append('total_amount', selectedExpense.total_amount || '0');
      formData.append('currency', selectedExpense.currency);

      // Add receipt files
      editExpenseFiles.forEach((file, index) => {
        formData.append(`receipt_files[${index}]`, file);
      });

      const response = await updateExpense(selectedExpense.id, formData);

      if (response) {
        setSelectedExpense(null);
        setEditExpenseFiles([]);
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
  }, [selectedExpense, editExpenseFiles]);

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
    tax_type: "amount",
    total_amount: "",
    currency: "USD",
  });
  const [newExpenseFiles, setNewExpenseFiles] = useState<File[]>([]);

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
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('category_id', newExpense.category_id);
      formData.append('expense_date', newExpense.expense_date);
      formData.append('description', newExpense.description);
      formData.append('amount', newExpense.amount);
      formData.append('tax_amount', newExpense.tax_amount || '0');
      formData.append('tax_type', newExpense.tax_type);
      formData.append('total_amount', newExpense.total_amount || '0');
      formData.append('currency', newExpense.currency);

      // Add receipt files
      newExpenseFiles.forEach((file, index) => {
        formData.append(`receipt_files[${index}]`, file);
      });

      const response = await createExpense(formData);

      if (response) {
        setNewExpense({
          category_id: "",
          expense_date: moment().format("YYYY-MM-DD"),
          description: "",
          amount: "",
          tax_amount: "",
          tax_type: "amount",
          total_amount: "",
          currency: "USD",
        });
        setNewExpenseFiles([]);
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
  }, [newExpense, newExpenseFiles]);

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
      tax_type: "amount",
      total_amount: "",
      currency: "USD",
    });
    setNewExpenseFiles([]);
  }, []);

  const closeEditExpenseModal = useCallback(() => {
    setShowEditExpenseModal(false);
    setSelectedExpense(null);
    setEditExpenseFiles([]);
  }, []);

  // Input handlers
  const handleNewExpenseChange = useCallback(
    (field: keyof ExpenseCreateUpdatePayload, value: any) => {
      setNewExpense((prev: ExpenseCreateUpdatePayload) => {
        const updatedExpense = {
          ...prev,
          [field]: value,
        };
        
        // Auto-calculate total when amount, tax_amount, or tax_type changes
        if (field === 'amount' || field === 'tax_amount' || field === 'tax_type') {
          updatedExpense.total_amount = calculateTotalAmount(
            field === 'amount' ? value : updatedExpense.amount,
            field === 'tax_amount' ? value : updatedExpense.tax_amount,
            field === 'tax_type' ? value : updatedExpense.tax_type
          );
        }
        
        return updatedExpense;
      });
    },
    [calculateTotalAmount]
  );

  const handleEditExpenseChange = useCallback(
    (field: keyof ExpenseData, value: any) => {
      setSelectedExpense((prev: ExpenseData | null) => {
        if (!prev) return prev;
        
        const updatedExpense = {
          ...prev,
          [field]: value,
        };
        
        // Auto-calculate total when amount, tax_amount, or tax_type changes
        if (field === 'amount' || field === 'tax_amount' || field === 'tax_type') {
          updatedExpense.total_amount = calculateTotalAmount(
            field === 'amount' ? value : updatedExpense.amount,
            field === 'tax_amount' ? value : updatedExpense.tax_amount,
            field === 'tax_type' ? value : updatedExpense.tax_type
          );
        }
        
        return updatedExpense;
      });
    },
    [calculateTotalAmount]
  );

  // Expense Delete Handlers
  const handleDeleteExpense = useCallback((props: ExpenseData) => {
    setSelectedExpense(props);
    setShowDeleteExpenseModal(true);
  }, []);

  const handleSubmitDeleteExpense = useCallback(async (confirmationText: string) => {
    if (!selectedExpense) return;

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
  }, [selectedExpense]);

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

  const handleSubmitDeleteCategory = useCallback(async (confirmationText: string) => {
    if (!selectedCategory) return;
    
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
  }, [selectedCategory, openCategoryModal]);

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Expenses" />

      <PageHeader
        title="Expenses"
        leftGrid={3}
        rightGrid={9}
        showSearch={true}
        searchPlaceholder="Search expenses..."
        searchValue={currentFilters.search || ""}
        onSearchChange={(value) =>
          handleFiltersChange({ ...currentFilters, search: value })
        }
        buttons={
          <>
            <Button
              variant="primary"
              size="sm"
              onClick={openCreateExpenseModal}
            >
              New Expense
            </Button>

            <Button variant="secondary" size="sm" onClick={openCategoryModal}>
              Categories
            </Button>
          </>
        }
      />

      <GenericListPage
        columns={columns}
        fetchData={fetchExpenses}
        title="Expenses"
        searchPlaceholder="Search expenses..."
        defaultPageSize={15}
        filters={memoizedFilters}
        refreshKey={refreshKey}
        search={false}
        tableStyle="table-style-2"
      />

      {/* Create Expense Modal */}
      <FormModal
        show={showCreateExpenseModal}
        onHide={closeCreateExpenseModal}
        title="Create New Expense"
        desc="Please fill in the details below to create a new expense."
        submitButtonText={creatingExpense ? "Creating..." : "Create Expense"}
        cancelButtonText="Close"
        onSubmit={handleSubmitCreateExpense}
        onCancel={closeCreateExpenseModal}
        formHtml={
          <>
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
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label htmlFor="newExpenseCurrency">Currency</label>
                  <select
                    className="form-control"
                    id="newExpenseCurrency"
                    value={newExpense.currency}
                    onChange={(e) =>
                      handleNewExpenseChange("currency", e.target.value)
                    }
                  >
                    <option value="USD">USD</option>
                    <option value="AED">AED</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label htmlFor="newExpenseAmount">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
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
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label htmlFor="newExpenseTaxAmount">Tax Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
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
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label htmlFor="newExpenseTaxType">Tax Type</label>
                  <select
                    className="form-control"
                    id="newExpenseTaxType"
                    value={newExpense.tax_type}
                    onChange={(e) =>
                      handleNewExpenseChange("tax_type", e.target.value)
                    }
                  >
                    <option value="amount">Amount</option>
                    <option value="percentage">Percentage</option>
                  </select>
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label htmlFor="newExpenseTotalAmount">Total Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-control"
                    id="newExpenseTotalAmount"
                    value={newExpense.total_amount}
                    readOnly
                    style={{ backgroundColor: '#f8f9fa', cursor: 'not-allowed' }}
                    placeholder="0.00"
                  />
                  <small className="form-text text-muted">
                    Automatically calculated based on amount and tax
                  </small>
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-12">
                <div className="form-group mb-3">
                  <label htmlFor="newExpenseFiles">Receipt Files</label>
                  <input
                    type="file"
                    className="form-control"
                    id="newExpenseFiles"
                    multiple
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={handleNewExpenseFileChange}
                  />
                  <small className="form-text text-muted">
                    Upload PDF, PNG, or JPEG files (max 10MB each)
                  </small>
                </div>
                {newExpenseFiles.length > 0 && (
                  <div className="mt-2">
                    <h6>Selected Files:</h6>
                    <div className="list-group">
                      {newExpenseFiles.map((file, index) => (
                        <div key={index} className="list-group-item d-flex justify-content-between align-items-center">
                          <span>{file.name}</span>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => removeNewExpenseFile(index)}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        }
      />

      {/* Edit Expense Modal */}
      <FormModal
        show={showEditExpenseModal}
        onHide={closeEditExpenseModal}
        title={`Edit Expense: ${selectedExpense?.description || ""}`}
        desc="Please update the expense details below."
        submitButtonText={editingExpense ? "Updating..." : "Update Expense"}
        cancelButtonText="Close"
        onSubmit={handleSubmitEditExpense}
        onCancel={closeEditExpenseModal}
        formHtml={
          <>
            <div className="row">
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label htmlFor="editExpenseCategory">Category</label>
                  <select
                    className="form-control"
                    id="editExpenseCategory"
                    value={selectedExpense?.category_id || ""}
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
                    value={
                      selectedExpense?.expense_date
                        ? moment(selectedExpense.expense_date).format(
                            "YYYY-MM-DD"
                          )
                        : ""
                    }
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
                    value={selectedExpense?.description || ""}
                    onChange={(e) =>
                      handleEditExpenseChange("description", e.target.value)
                    }
                    placeholder="Enter expense description"
                  />
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label htmlFor="editExpenseCurrency">Currency</label>
                  <select
                    className="form-control"
                    id="editExpenseCurrency"
                    value={selectedExpense?.currency || "USD"}
                    onChange={(e) =>
                      handleEditExpenseChange("currency", e.target.value)
                    }
                  >
                    <option value="USD">USD</option>
                    <option value="AED">AED</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label htmlFor="editExpenseAmount">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-control"
                    id="editExpenseAmount"
                    value={selectedExpense?.amount || ""}
                    onChange={(e) =>
                      handleEditExpenseChange("amount", e.target.value)
                    }
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label htmlFor="editExpenseTaxAmount">Tax Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-control"
                    id="editExpenseTaxAmount"
                    value={selectedExpense?.tax_amount || ""}
                    onChange={(e) =>
                      handleEditExpenseChange("tax_amount", e.target.value)
                    }
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label htmlFor="editExpenseTaxType">Tax Type</label>
                  <select
                    className="form-control"
                    id="editExpenseTaxType"
                    value={selectedExpense?.tax_type || "amount"}
                    onChange={(e) =>
                      handleEditExpenseChange("tax_type", e.target.value)
                    }
                  >
                    <option value="amount">Amount</option>
                    <option value="percentage">Percentage</option>
                  </select>
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label htmlFor="editExpenseTotalAmount">Total Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-control"
                    id="editExpenseTotalAmount"
                    value={selectedExpense?.total_amount || ""}
                    readOnly
                    style={{ backgroundColor: '#f8f9fa', cursor: 'not-allowed' }}
                    placeholder="0.00"
                  />
                  <small className="form-text text-muted">
                    Automatically calculated based on amount and tax
                  </small>
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-12">
                <div className="form-group mb-3">
                  <label htmlFor="editExpenseFiles">Receipt Files</label>
                  <input
                    type="file"
                    className="form-control"
                    id="editExpenseFiles"
                    multiple
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={handleEditExpenseFileChange}
                  />
                  <small className="form-text text-muted">
                    Upload PDF, PNG, or JPEG files (max 10MB each)
                  </small>
                </div>
                {editExpenseFiles.length > 0 && (
                  <div className="mt-2">
                    <h6>Selected Files:</h6>
                    <div className="list-group">
                      {editExpenseFiles.map((file, index) => (
                        <div key={index} className="list-group-item d-flex justify-content-between align-items-center">
                          <span>{file.name}</span>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => removeEditExpenseFile(index)}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        }
      />

      {/* Category Management Modal */}
      <FormModal
        show={showCategoryModal}
        onHide={closeCategoryModal}
        title="Manage Expense Categories"
        desc="View and manage all expense categories. You can create new categories, edit existing ones, or delete unused categories."
        submitButtonText="Create New Category"
        cancelButtonText="Close"
        onSubmit={handleCreateCategory}
        onCancel={closeCategoryModal}
        ShowSubmitButton={false}
        formHtml={
          <>
          <div className="d-flex mb-3 justify-content-end align-items-end text-end">
            <button className="btn btn-sm btn-primary app-button" onClick={handleCreateCategory}>Create New Category</button>
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
                        <div>{category.name}</div>
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
                        <span className="status-badge primary">
                          {(category as any).expenses?.length || 0}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons-container">
                          <button
                            className="btn btn-sm btn-primary app-button me-1"
                            onClick={() => handleEditCategory(category)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-sm btn-danger app-button"
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
      />

      {/* Edit Category Modal */}
      <FormModal
        show={showEditCategoryModal}
        onHide={() => setShowEditCategoryModal(false)}
        title={`Edit Category: ${selectedCategory?.name || ""}`}
        desc="Please update the category details below."
        submitButtonText={editingCategory ? "Updating..." : "Update Category"}
        cancelButtonText="Close"
        onSubmit={handleSubmitEditCategory}
        onCancel={() => setShowEditCategoryModal(false)}
        formHtml={
          <>
            <div className="form-group mb-3">
              <label htmlFor="editCategoryName">Category Name</label>
              <input
                type="text"
                className="form-control"
                id="editCategoryName"
                value={selectedCategory?.name || ""}
                onChange={(e) =>
                  selectedCategory && setSelectedCategory({
                    ...selectedCategory,
                    name: e.target.value,
                  } as ExpenseCategoryData)
                }
                placeholder="Enter category name"
              />
            </div>
            <div className="form-group mb-3">
              <label htmlFor="editCategoryDescription">Description</label>
              <textarea
                className="form-control"
                id="editCategoryDescription"
                value={selectedCategory?.description || ""}
                onChange={(e) =>
                  selectedCategory && setSelectedCategory({
                    ...selectedCategory,
                    description: e.target.value,
                  } as ExpenseCategoryData)
                }
                rows={3}
                placeholder="Enter category description..."
              />
            </div>
            <div className="form-group mb-3">
              <label htmlFor="editCategoryColor">Color</label>
              <div className="d-flex align-items-center">
                <input
                  type="color"
                  className="form-control me-2"
                  id="editCategoryColor"
                  value={selectedCategory?.color || "#000000"}
                  onChange={(e) =>
                    selectedCategory && setSelectedCategory({
                      ...selectedCategory,
                      color: e.target.value,
                    } as ExpenseCategoryData)
                  }
                  style={{ width: "60px", height: "38px" }}
                />
                <input
                  type="text"
                  className="form-control"
                  value={selectedCategory?.color || "#000000"}
                  onChange={(e) =>
                    selectedCategory && setSelectedCategory({
                      ...selectedCategory,
                      color: e.target.value,
                    } as ExpenseCategoryData)
                  }
                  placeholder="#000000"
                />
              </div>
            </div>
            <div className="form-group mb-3">
              <label htmlFor="editCategoryStatus">Status</label>
              <select
                className="form-control"
                id="editCategoryStatus"
                value={selectedCategory?.is_active ? "active" : "inactive"}
                onChange={(e) =>
                  selectedCategory && setSelectedCategory({
                    ...selectedCategory,
                    is_active: e.target.value === "active",
                  } as ExpenseCategoryData)
                }
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </>
        }
      />

      {/* Delete Category Modal */}
      <ConfirmModal
        show={showDeleteCategoryModal}
        onHide={() => setShowDeleteCategoryModal(false)}
        title="Delete Category?"
        description={`Are you sure you want to delete category ${selectedCategory?.name}? This action cannot be undone and will affect all expenses in this category.`}
        onConfirm={handleSubmitDeleteCategory}
        onCancel={() => setShowDeleteCategoryModal(false)}
        targetName={selectedCategory?.name || ""}
      />

      {/* Delete Expense Modal */}
      <ConfirmModal
        show={showDeleteExpenseModal}
        onHide={() => setShowDeleteExpenseModal(false)}
        title="Delete Expense?"
        description={`Are you sure you want to delete expense ${selectedExpense?.description}? This action cannot be undone.`}
        targetName={selectedExpense?.description || ""}
        onConfirm={handleSubmitDeleteExpense}
        onCancel={() => setShowDeleteExpenseModal(false)}
      />

      {/* Create Category Modal */}
      <FormModal
        show={showCreateCategoryModal}
        onHide={() => setShowCreateCategoryModal(false)}
        title="Create New Category"
        desc="Please fill in the details below to create a new expense category."
        submitButtonText={creatingCategory ? "Creating..." : "Create Category"}
        cancelButtonText="Close"
        onSubmit={handleSubmitCreateCategory}
        onCancel={() => setShowCreateCategoryModal(false)}
        formHtml={
          <>
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
                  handleNewCategoryChange(
                    "is_active",
                    e.target.value === "active"
                  )
                }
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </>
        }
      />

      {/* View Attachments Modal */}
      <FormModal
        show={showViewAttachmentsModal}
        onHide={closeViewAttachmentsModal}
        title={`Attachments - ${selectedExpenseForAttachments?.description || ""}`}
        desc="View and download receipt files attached to this expense."
        submitButtonText="Close"
        ShowSubmitButton={false}
        cancelButtonText=" close"
        onSubmit={closeViewAttachmentsModal}
        onCancel={closeViewAttachmentsModal}
        formHtml={
          <>
            <div className="mb-3">
              <h6>Receipt Files</h6>
              {selectedExpenseForAttachments?.files && selectedExpenseForAttachments.files.length > 0 ? (
                <div className="list-group">
                  {selectedExpenseForAttachments.files.map((file, index) => (
                    <div key={index} className="list-group-item d-flex justify-content-between align-items-center">
                      <div className="d-flex align-items-center">
                        <span className="me-2" style={{ fontSize: '1.2em' }}>
                          {getFileIcon(file.type)}
                        </span>
                        <div>
                          <div className="fw-bold">{file.name}</div>
                          <small className="text-muted">
                            {formatFileSize(file.size)} • {file.type}
                          </small>
                          <br />
                          <small className="text-muted">
                            Uploaded: {moment(file.uploaded_at).format('DD/MM/YYYY HH:mm')}
                          </small>
                        </div>
                      </div>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleDownloadFile(selectedExpenseForAttachments.id, index)}
                        disabled={downloadingFile === index}
                      >
                        {downloadingFile === index ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                            Downloading...
                          </>
                        ) : (
                          <>
                            <FiDownload className="me-1" />
                            Download
                          </>
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted py-3">
                  <p>No receipt files attached to this expense.</p>
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="mt-3 p-3 bg-light rounded">
              <h6>Summary</h6>
              <div className="row">
                <div className="col-md-6">
                  <small className="text-muted">Total Files:</small>
                  <div className="fw-bold">
                    {(selectedExpenseForAttachments?.files?.length || 0) }
                  </div>
                </div>
                <div className="col-md-6">
                  <small className="text-muted">Total Size:</small>
                  <div className="fw-bold">
                    {formatFileSize(
                      (selectedExpenseForAttachments?.files?.reduce((total, file) => total + file.size, 0) || 0)
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        }
      />
    </React.Fragment>
  );
};

ExpenseList.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default ExpenseList;
