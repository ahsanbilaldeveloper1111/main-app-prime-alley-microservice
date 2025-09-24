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
  getInvoices,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  getInvoice,
  InvoiceData,
  InvoiceCreateUpdatePayload,
  InvoiceItemCreateUpdatePayload,
  CompanyData,
} from "@utils/accounting";
import { getCompanies } from "@utils/accounting";
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

const InvoiceList = () => {
  const { data: session, status } = useSession();

  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [currentFilters, setCurrentFilters] = useState({});

  const [companies, setCompanies] = useState<CompanyData[]>([]);

  const columns: Column[] = useMemo(
    () => [
      {
        key: "invoice_number",
        name: "Invoice Number",
        selector: (row: InvoiceData) => row.invoice_number,
        sortable: true,
        cell: (props: InvoiceData) => (
          <div>
            <div className="fw-bold text-primary">#{props.invoice_number}</div>
          </div>
        ),
      },
      {
        key: "company",
        name: "Company",
        selector: (row: InvoiceData) => row.company?.name,
        sortable: true,
        cell: (props: InvoiceData) => (
          <span className="badge bg-info">
            {props.company?.name || "Unknown Company"}
          </span>
        ),
      },
      {
        key: "subtotal",
        name: "Subtotal",
        selector: (row: InvoiceData) => row.subtotal,
        sortable: true,
        cell: (props: InvoiceData) => (
          <span className="fw-bold text-success">
            {props.currency_code} {parseFloat(props.subtotal || "0").toFixed(2)}
          </span>
        ),
      },
      {
        key: "tax_amount",
        name: "Tax Amount",
        selector: (row: InvoiceData) => row.tax_amount,
        sortable: true,
        cell: (props: InvoiceData) => (
          <span className="text-warning">
            {props.currency_code}{" "}
            {parseFloat(props.tax_amount || "0").toFixed(2)}
          </span>
        ),
      },
      {
        key: "total_amount",
        name: "Total Amount",
        selector: (row: InvoiceData) => row.total_amount,
        sortable: true,
        cell: (props: InvoiceData) => (
          <span className="fw-bold text-primary">
            {props.currency_code}{" "}
            {parseFloat(props.total_amount || "0").toFixed(2)}
          </span>
        ),
      },
      {
        key: "status",
        name: "Status",
        selector: (row: InvoiceData) => row.status,
        sortable: true,
        cell: (props: InvoiceData) => {
          const statusColors = {
            draft: "info",
            sent: "primary",
            paid: "success",
            overdue: "warning",
            cancelled: "danger",
          };
          return (
            <span
              className={`status-badge ${
                statusColors[props.status as keyof typeof statusColors] ||
                "bg-secondary"
              } text-uppercase`}
            >
              {props.status}
            </span>
          );
        },
      },
      {
        key: "due_date",
        name: "Due Date",
        selector: (row: InvoiceData) => row.due_date,
        sortable: true,
        cell: (props: InvoiceData) => (
          <span className="text-muted">
            {props.due_date
              ? moment(props.due_date).format("DD/MM/YYYY")
              : "No due date"}
          </span>
        ),
      },
      {
        key: "invoice_date",
        name: "Invoice Date",
        selector: (row: InvoiceData) => row.invoice_date,
        sortable: true,
        cell: (props: InvoiceData) => (
          <span className="text-muted">
            {moment(props.invoice_date).format("DD/MM/YYYY")}
          </span>
        ),
      },
      {
        key: "Action",
        name: "ACTION",
        selector: (row: InvoiceData) => row.id,
        sortable: false,
        cell: (props: InvoiceData) => (
          <div className="action-buttons-container">
            <button
              className="btn btn-sm btn-outline-primary me-1"
              onClick={() => handleEditInvoice(props)}
            >
              Edit
            </button>
            <button
              className="btn btn-sm btn-outline-danger"
              onClick={() => handleDeleteInvoice(props)}
            >
              Delete
            </button>
          </div>
        ),
      },
    ],
    [session?.user?.permissions]
  );

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const companiesData = await getCompanies();
        setCompanies(companiesData.data || []);
        console.log("Companies:", companiesData);
      } catch (error) {
        console.error("Error fetching companies:", error);
      }
    };
    fetchCompanies();
  }, []);

  const memoizedFilters = useMemo(() => currentFilters, [currentFilters]);

  const fetchInvoices = useCallback(
    async (page = 1, perPage = 15, search = "") => {
      try {
        const response = await getInvoices({
          page,
          per_page: perPage,
          search,
          ...memoizedFilters,
        });

        // The getInvoices function returns PaginationWrapper<InvoiceData>
        // which has the structure: { data: InvoiceData[], pagination: {...} }
        return {
          data: response.data, // The actual invoice array
          total: response.pagination.total,
          page: response.pagination.current_page,
          per_page: response.pagination.per_page,
          last_page: response.pagination.last_page,
        };
      } catch (error) {
        console.error("Error fetching invoices:", error);
        throw error;
      }
    },
    [memoizedFilters]
  );

  const handleFiltersChange = useCallback((filters: any) => {
    setCurrentFilters(filters);
  }, []);

  // Edit Invoice Modal
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceData | null>(
    null
  );
  const [showEditInvoiceModal, setShowEditInvoiceModal] =
    useState<boolean>(false);
  const [editingInvoice, setEditingInvoice] = useState<boolean>(false);

  // Delete Invoice Modal
  const [showDeleteInvoiceModal, setShowDeleteInvoiceModal] = useState<boolean>(false);
  const [confirmDeleteInvoice, setConfirmDeleteInvoice] = useState<string>("");

  const handleEditInvoice = useCallback((props: InvoiceData) => {
    setSelectedInvoice(props);
    setShowEditInvoiceModal(true);
  }, []);

  const handleSubmitEditInvoice = useCallback(async () => {
    if (!selectedInvoice) return;

    if (!selectedInvoice.company_id) {
      toast.error("Please select a company");
      return;
    }
    if (
      !selectedInvoice.subtotal ||
      parseFloat(selectedInvoice.subtotal) <= 0
    ) {
      toast.error("Please enter a valid subtotal");
      return;
    }
    if (!selectedInvoice.due_date) {
      toast.error("Please select a due date");
      return;
    }

    setEditingInvoice(true);
    try {
      const invoiceData: InvoiceCreateUpdatePayload = {
        company_id: selectedInvoice.company_id,
        invoice_date: selectedInvoice.invoice_date,
        due_date: selectedInvoice.due_date,
        payment_mode: selectedInvoice.payment_mode,
        currency_code: selectedInvoice.currency_code,
        exchange_rate: selectedInvoice.exchange_rate,
        tax_amount: parseFloat(selectedInvoice.tax_amount),
        notes: selectedInvoice.notes || "",
        terms_conditions: selectedInvoice.terms_conditions || "",
        items: selectedInvoice.items.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          tax_rate: item.tax_rate,
        })),
        subtotal: parseFloat(selectedInvoice.subtotal),
        total_amount: parseFloat(selectedInvoice.total_amount),
      };

      const response = await updateInvoice(selectedInvoice.id, invoiceData);

      if (response) {
        setSelectedInvoice(null);
        setShowEditInvoiceModal(false);
        setRefreshKey((prev) => prev + 1);
        toast.success("Invoice updated successfully");
      }
    } catch (error) {
      console.error("Error updating invoice:", error);
      toast.error("Failed to update invoice");
    } finally {
      setEditingInvoice(false);
    }
  }, [selectedInvoice]);

  // Create Invoice Modal
  const [showCreateInvoiceModal, setShowCreateInvoiceModal] =
    useState<boolean>(false);
  const [creatingInvoice, setCreatingInvoice] = useState<boolean>(false);
  const [newInvoice, setNewInvoice] = useState<InvoiceCreateUpdatePayload>({
    company_id: "",
    invoice_date: moment().format("YYYY-MM-DD"),
    due_date: "",
    payment_mode: "one_time",
    currency_code: "USD",
    exchange_rate: "1.000000",
    tax_amount: 0,
    notes: "",
    terms_conditions: "",
    items: [],
    subtotal: 0,
    total_amount: 0,
  });

  const handleSubmitCreateInvoice = useCallback(async () => {
    if (!newInvoice.company_id) {
      toast.error("Please select a company");
      return;
    }
    if (!newInvoice.subtotal || newInvoice.subtotal <= 0) {
      toast.error("Please enter a valid subtotal");
      return;
    }
    if (!newInvoice.due_date) {
      toast.error("Please select a due date");
      return;
    }

    setCreatingInvoice(true);
    try {
      const response = await createInvoice(newInvoice);

      if (response) {
        setNewInvoice({
          company_id: "",
          invoice_date: moment().format("YYYY-MM-DD"),
          due_date: "",
          payment_mode: "one_time",
          currency_code: "USD",
          exchange_rate: "1.000000",
          tax_amount: 0,
          notes: "",
          terms_conditions: "",
          items: [],
          subtotal: 0,
          total_amount: 0,
        });
        setShowCreateInvoiceModal(false);
        setRefreshKey((prev) => prev + 1);
        toast.success("Invoice created successfully");
      }
    } catch (error) {
      console.error("Error creating invoice:", error);
      toast.error("Failed to create invoice");
    } finally {
      setCreatingInvoice(false);
    }
  }, [newInvoice]);

  // Modal handlers
  const openCreateInvoiceModal = useCallback(
    () => setShowCreateInvoiceModal(true),
    []
  );
  const closeCreateInvoiceModal = useCallback(() => {
    setShowCreateInvoiceModal(false);
    setNewInvoice({
      company_id: "",
      invoice_date: moment().format("YYYY-MM-DD"),
      due_date: "",
      payment_mode: "one_time",
      currency_code: "USD",
      exchange_rate: "1.000000",
      tax_amount: 0,
      notes: "",
      terms_conditions: "",
      items: [],
      subtotal: 0,
      total_amount: 0,
    });
  }, []);

  const closeEditInvoiceModal = useCallback(() => {
    setShowEditInvoiceModal(false);
    setSelectedInvoice(null);
  }, []);

  // Delete Invoice Handlers
  const handleDeleteInvoice = useCallback((props: InvoiceData) => {
    setSelectedInvoice(props);
    setShowDeleteInvoiceModal(true);
  }, []);

  const handleSubmitDeleteInvoice = useCallback(async () => {
    if (!selectedInvoice) return;

    const confirmDeleteValue = confirmDeleteInvoice.trim();
    if (confirmDeleteValue === "DELETE") {
      try {
        await deleteInvoice(selectedInvoice.id);
        setSelectedInvoice(null);
        setShowDeleteInvoiceModal(false);
        setConfirmDeleteInvoice("");
        setRefreshKey((prev) => prev + 1);
        toast.success("Invoice deleted successfully");
      } catch (error) {
        console.error("Error deleting invoice:", error);
        toast.error("Failed to delete invoice");
      }
    } else {
      toast.error("Please type the word DELETE to confirm");
    }
  }, [confirmDeleteInvoice, selectedInvoice]);

  // Input handlers
  const handleNewInvoiceChange = useCallback(
    (field: keyof InvoiceCreateUpdatePayload, value: any) => {
      setNewInvoice((prev: InvoiceCreateUpdatePayload) => ({
        ...prev,
        [field]: value,
      }));
    },
    []
  );

  const handleEditInvoiceChange = useCallback(
    (field: keyof InvoiceData, value: any) => {
      setSelectedInvoice((prev: InvoiceData | null) => ({
        ...prev!,
        [field]: value,
      }));
    },
    []
  );

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Call Logs" />

      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title style-2">
            <Row className="d-flex justify-content-between align-items-center">
              <Col md={4}>
                <h2 className="mb-0">Invoices</h2>
              </Col>

              <Col md={8} className="d-flex justify-content-end">
                <div className="action-buttons">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={openCreateInvoiceModal}
                  >
                    New Invoice
                  </Button>
                </div>
              </Col>
            </Row>
          </div>
        </Col>
      </Row>
     

      <GenericListPage
        columns={columns}
        fetchData={fetchInvoices}
        title="Invoices"
        searchPlaceholder="Search invoices..."
        defaultPageSize={15}
        filters={memoizedFilters}
        refreshKey={refreshKey}
        search={false}
        tableStyle="table-style-2"
      />

      {/* Create Invoice Modal */}
      {showCreateInvoiceModal && (
        <Modal
          show={showCreateInvoiceModal}
          onHide={closeCreateInvoiceModal}
          size="lg"
        >
          <Modal.Header closeButton>
            <Modal.Title>Create New Invoice</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="row">
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label htmlFor="newInvoiceCompany">Company</label>
                  <select
                    className="form-control"
                    id="newInvoiceCompany"
                    value={newInvoice.company_id}
                    onChange={(e) =>
                      handleNewInvoiceChange("company_id", e.target.value)
                    }
                  >
                    <option value="">Select Company</option>
                    {companies.map((company: CompanyData) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label htmlFor="newInvoiceDate">Invoice Date</label>
                  <input
                    type="date"
                    className="form-control"
                    id="newInvoiceDate"
                    value={newInvoice.invoice_date}
                    onChange={(e) =>
                      handleNewInvoiceChange("invoice_date", e.target.value)
                    }
                  />
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label htmlFor="newInvoiceDueDate">Due Date</label>
                  <input
                    type="date"
                    className="form-control"
                    id="newInvoiceDueDate"
                    value={newInvoice.due_date}
                    onChange={(e) =>
                      handleNewInvoiceChange("due_date", e.target.value)
                    }
                    min={moment().format("YYYY-MM-DD")}
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label htmlFor="newInvoicePaymentMode">Payment Mode</label>
                  <select
                    className="form-control"
                    id="newInvoicePaymentMode"
                    value={newInvoice.payment_mode}
                    onChange={(e) =>
                      handleNewInvoiceChange("payment_mode", e.target.value)
                    }
                  >
                    <option value="one_time">One Time</option>
                    <option value="recurring">Recurring</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label htmlFor="newInvoiceSubtotal">Subtotal</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    id="newInvoiceSubtotal"
                    value={newInvoice.subtotal}
                    onChange={(e) =>
                      handleNewInvoiceChange(
                        "subtotal",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label htmlFor="newInvoiceTaxAmount">Tax Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    id="newInvoiceTaxAmount"
                    value={newInvoice.tax_amount}
                    onChange={(e) =>
                      handleNewInvoiceChange(
                        "tax_amount",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label htmlFor="newInvoiceTotalAmount">Total Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    id="newInvoiceTotalAmount"
                    value={newInvoice.total_amount}
                    onChange={(e) =>
                      handleNewInvoiceChange(
                        "total_amount",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label htmlFor="newInvoiceCurrency">Currency</label>
                  <select
                    className="form-control"
                    id="newInvoiceCurrency"
                    value={newInvoice.currency_code}
                    onChange={(e) =>
                      handleNewInvoiceChange("currency_code", e.target.value)
                    }
                  >
                    <option value="USD">USD</option>
                    <option value="AED">AED</option>
                    <option value="PKR">PKR</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label htmlFor="newInvoiceExchangeRate">Exchange Rate</label>
                  <input
                    type="number"
                    step="0.000001"
                    className="form-control"
                    id="newInvoiceExchangeRate"
                    value={newInvoice.exchange_rate}
                    onChange={(e) =>
                      handleNewInvoiceChange("exchange_rate", e.target.value)
                    }
                    placeholder="1.000000"
                  />
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-12">
                <div className="form-group mb-3">
                  <label htmlFor="newInvoiceNotes">Notes</label>
                  <textarea
                    className="form-control"
                    id="newInvoiceNotes"
                    value={newInvoice.notes}
                    onChange={(e) =>
                      handleNewInvoiceChange("notes", e.target.value)
                    }
                    rows={3}
                    placeholder="Additional notes..."
                  />
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-12">
                <div className="form-group mb-3">
                  <label htmlFor="newInvoiceTerms">Terms & Conditions</label>
                  <textarea
                    className="form-control"
                    id="newInvoiceTerms"
                    value={newInvoice.terms_conditions}
                    onChange={(e) =>
                      handleNewInvoiceChange("terms_conditions", e.target.value)
                    }
                    rows={3}
                    placeholder="Terms and conditions..."
                  />
                </div>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={closeCreateInvoiceModal}>
              Close
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmitCreateInvoice}
              disabled={creatingInvoice}
            >
              {creatingInvoice ? "Creating..." : "Create Invoice"}
            </Button>
          </Modal.Footer>
        </Modal>
      )}

      {/* Edit Invoice Modal */}
      {showEditInvoiceModal && selectedInvoice && (
        <Modal
          show={showEditInvoiceModal}
          onHide={closeEditInvoiceModal}
          size="lg"
        >
          <Modal.Header closeButton>
            <Modal.Title>
              Edit Invoice #{selectedInvoice.invoice_number}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="row">
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label htmlFor="editInvoiceCompany">Company</label>
                  <select
                    className="form-control"
                    id="editInvoiceCompany"
                    value={selectedInvoice.company_id || ""}
                    onChange={(e) =>
                      handleEditInvoiceChange("company_id", e.target.value)
                    }
                  >
                    <option value="">Select Company</option>
                    {companies.map((company: CompanyData) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label htmlFor="editInvoiceDate">Invoice Date</label>
                  <input
                    type="date"
                    className="form-control"
                    id="editInvoiceDate"
                    value={
                      selectedInvoice.invoice_date
                        ? moment(selectedInvoice.invoice_date).format(
                            "YYYY-MM-DD"
                          )
                        : ""
                    }
                    onChange={(e) =>
                      handleEditInvoiceChange("invoice_date", e.target.value)
                    }
                  />
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label htmlFor="editInvoiceDueDate">Due Date</label>
                  <input
                    type="date"
                    className="form-control"
                    id="editInvoiceDueDate"
                    value={
                      selectedInvoice.due_date
                        ? moment(selectedInvoice.due_date).format("YYYY-MM-DD")
                        : ""
                    }
                    onChange={(e) =>
                      handleEditInvoiceChange("due_date", e.target.value)
                    }
                    min={moment().format("YYYY-MM-DD")}
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label htmlFor="editInvoicePaymentMode">Payment Mode</label>
                  <select
                    className="form-control"
                    id="editInvoicePaymentMode"
                    value={selectedInvoice.payment_mode || "one_time"}
                    onChange={(e) =>
                      handleEditInvoiceChange("payment_mode", e.target.value)
                    }
                  >
                    <option value="one_time">One Time</option>
                    <option value="recurring">Recurring</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label htmlFor="editInvoiceSubtotal">Subtotal</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    id="editInvoiceSubtotal"
                    value={selectedInvoice.subtotal || ""}
                    onChange={(e) =>
                      handleEditInvoiceChange("subtotal", e.target.value)
                    }
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label htmlFor="editInvoiceTaxAmount">Tax Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    id="editInvoiceTaxAmount"
                    value={selectedInvoice.tax_amount || ""}
                    onChange={(e) =>
                      handleEditInvoiceChange("tax_amount", e.target.value)
                    }
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label htmlFor="editInvoiceTotalAmount">Total Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    id="editInvoiceTotalAmount"
                    value={selectedInvoice.total_amount || ""}
                    onChange={(e) =>
                      handleEditInvoiceChange("total_amount", e.target.value)
                    }
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label htmlFor="editInvoiceCurrency">Currency</label>
                  <select
                    className="form-control"
                    id="editInvoiceCurrency"
                    value={selectedInvoice.currency_code || "USD"}
                    onChange={(e) =>
                      handleEditInvoiceChange("currency_code", e.target.value)
                    }
                  >
                    <option value="USD">USD</option>
                    <option value="AED">AED</option>
                    <option value="PKR">PKR</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label htmlFor="editInvoiceExchangeRate">Exchange Rate</label>
                  <input
                    type="number"
                    step="0.000001"
                    className="form-control"
                    id="editInvoiceExchangeRate"
                    value={selectedInvoice.exchange_rate || "1.000000"}
                    onChange={(e) =>
                      handleEditInvoiceChange("exchange_rate", e.target.value)
                    }
                    placeholder="1.000000"
                  />
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-12">
                <div className="form-group mb-3">
                  <label htmlFor="editInvoiceNotes">Notes</label>
                  <textarea
                    className="form-control"
                    id="editInvoiceNotes"
                    value={selectedInvoice.notes || ""}
                    onChange={(e) =>
                      handleEditInvoiceChange("notes", e.target.value)
                    }
                    rows={3}
                    placeholder="Additional notes..."
                  />
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-12">
                <div className="form-group mb-3">
                  <label htmlFor="editInvoiceTerms">Terms & Conditions</label>
                  <textarea
                    className="form-control"
                    id="editInvoiceTerms"
                    value={selectedInvoice.terms_conditions || ""}
                    onChange={(e) =>
                      handleEditInvoiceChange(
                        "terms_conditions",
                        e.target.value
                      )
                    }
                    rows={3}
                    placeholder="Terms and conditions..."
                  />
                </div>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={closeEditInvoiceModal}>
              Close
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmitEditInvoice}
              disabled={editingInvoice}
            >
              {editingInvoice ? "Updating..." : "Update Invoice"}
            </Button>
          </Modal.Footer>
        </Modal>
      )}

      {/* Delete Invoice Modal */}
      {showDeleteInvoiceModal && selectedInvoice && (
        <Modal
          show={showDeleteInvoiceModal}
          onHide={() => setShowDeleteInvoiceModal(false)}
        >
          <Modal.Header closeButton>
            <Modal.Title>Delete Invoice?</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>
              Are you sure you want to delete invoice{" "}
              <b className="text-danger">#{selectedInvoice.invoice_number}</b>?
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
              id="confirmDeleteInvoice"
              value={confirmDeleteInvoice}
              onChange={(e) => setConfirmDeleteInvoice(e.target.value)}
              placeholder="Type the word DELETE to confirm"
            />
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowDeleteInvoiceModal(false)}
            >
              Close
            </Button>
            <Button variant="danger" onClick={handleSubmitDeleteInvoice}>
              Delete
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </React.Fragment>
  );
};

InvoiceList.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default InvoiceList;
