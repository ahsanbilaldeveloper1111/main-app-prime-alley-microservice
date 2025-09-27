import "@assets/scss/datatable-style.scss";
import React, {
  ReactElement,
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericListPage from "@components/GenericListPage";
import {
  getCompanies,
  createUpdateCompany,
  deleteCompany,
  importCompanies,
  exportCompanies,
  generateTemplate,
  downloadTemplate,
  getResellers,
  getCompany,
  getPaymentMethods,
  createPaymentMethod,
  getPublishableKey,
  setDefaultPaymentMethod,
  deletePaymentMethod,
  CompanyData,
  PaymentMethodData,
  createAndConfirmPaymentMethod,
} from "@utils/accounting";
import { Column } from "@components/CustomDataTable";
import { Button, Modal, Row, Col, Form, Alert, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import moment from "moment";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

import PageHeader from "@components/PageHeader";
import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import PageSummaryGrid from "@components/PageSummaryGrid";
import FormModal from "../../partial/FormModal";
import ConfirmModal from "@pages/partial/ConfirmModal";
import SuccessfulModal from "@pages/partial/SuccessfulModal";
import { FiEdit, FiTrash2 } from "react-icons/fi";
import TableAction from "@components/TableAction";
import CompaniesFilters from "@components/filters/CompaniesFilters";

// Stripe Card Form Component
const StripeCardForm = ({
  cardData,
  onCardDataChange,
  onSaveCard,
  isSavingCard,
  stripePublishableKey,
}: {
  cardData: { cardholderName: string; isDefault: boolean };
  onCardDataChange: (field: string, value: any) => void;
  onSaveCard: (stripeToken: string) => void;
  isSavingCard: boolean;
  stripePublishableKey: string;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [cardError, setCardError] = useState<string>("");
  const [isCardComplete, setIsCardComplete] = useState<boolean>(false);
  const [cardBrand, setCardBrand] = useState<string>("");

  const handleCardChange = (event: any) => {
    setCardError(event.error ? event.error.message : "");
    setIsCardComplete(event.complete);

    // Extract card brand from the event
    if (event.brand) {
      setCardBrand(event.brand);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      toast.error("Stripe is not initialized");
      return;
    }

    if (!cardData.cardholderName.trim()) {
      toast.error("Please enter cardholder name");
      return;
    }

    if (!isCardComplete) {
      toast.error("Please complete the card details");
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      toast.error("Card element not found");
      return;
    }

    try {
      const { token, error } = await stripe.createToken(cardElement, {
        name: cardData.cardholderName,
      });

      if (error) {
        toast.error(error.message || "Failed to create card token");
        return;
      }

      if (token) {
        onSaveCard(token.id);
      }
    } catch (error) {
      console.error("Error creating token:", error);
      toast.error("Failed to process card");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="row">
        <div className="col-md-6">
          <div className="form-group mb-3">
            <label htmlFor="cardholderName">Cardholder Name *</label>
            <input
              type="text"
              className="form-control"
              id="cardholderName"
              value={cardData.cardholderName}
              onChange={(e) =>
                onCardDataChange("cardholderName", e.target.value)
              }
              placeholder="Enter cardholder name"
              required
            />
          </div>
        </div>
        <div className="col-md-6">
          <div className="form-group mb-3">
            <div className="form-check mt-4">
              <input
                className="form-check-input"
                type="checkbox"
                id="isDefault"
                checked={cardData.isDefault}
                onChange={(e) =>
                  onCardDataChange("isDefault", e.target.checked)
                }
              />
              <label className="form-check-label" htmlFor="isDefault">
                Set as Default Payment Method
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-12">
          <div className="form-group mb-3">
            <label>Card Details *</label>
            {cardBrand && (
              <div className="mb-2">
                <span className="badge bg-primary me-2">
                  {cardBrand.toUpperCase()}
                </span>
                {isCardComplete && (
                  <span className="text-success">
                    <i className="fas fa-check-circle me-1"></i>
                    Card details complete
                  </span>
                )}
              </div>
            )}
            <div
              className={`border rounded p-3 ${
                cardError
                  ? "border-danger"
                  : isCardComplete
                  ? "border-success"
                  : ""
              }`}
            >
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: "16px",
                      color: "#424770",
                      fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
                      "::placeholder": {
                        color: "#aab7c4",
                      },
                    },
                    invalid: {
                      color: "#9e2146",
                      iconColor: "#9e2146",
                    },
                    complete: {
                      color: "#4caf50",
                      iconColor: "#4caf50",
                    },
                  },
                  hidePostalCode: true,
                }}
                onChange={handleCardChange}
              />
            </div>
            {cardError && (
              <div className="text-danger mt-2">
                <small>{cardError}</small>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-12">
          <Button
            type="submit"
            variant="primary"
            disabled={
              isSavingCard ||
              !stripe ||
              !isCardComplete ||
              !cardData.cardholderName.trim()
            }
          >
            {isSavingCard ? "Saving Card..." : "Save Card"}
          </Button>
        </div>
      </div>
    </form>
  );
};

const CompanyList = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [refreshKey, setRefreshKey] = useState<number>(0);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [selectedCompany, setSelectedCompany] = useState<CompanyData | null>(
    null
  );

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    country: "",
    reseller_id: "",
    profile: {
      currency: "USD",
      vat_rate: "0.00",
      vat_exemption: false,
      tax_id: "",
      discount_type: "flat_percentage",
      address: "",
      discount_limit: "0.00",
      discount_applicability: [] as string[],
      payment_methods: [] as string[],
      payment_mode: "one_time",
      credit_limit: "0.00",
      early_payment_discount: "0.00",
      late_fee_rule: "0.00",
      payment_terms: 30,
      outstanding_invoices: "0.00",
      discounts_applied_ytd: "0.00",
      vat_collected: "0.00",
      active_subscriptions: "0",
      last_refund_date: "",
      profile_status: "incomplete",
      selected_products: [] as string[],
    },
  });

  // Import states
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importProgress, setImportProgress] = useState<number>(0);
  const [isImporting, setIsImporting] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingCompany, setIsLoadingCompany] = useState<boolean>(false);
  const [resellers, setResellers] = useState<{ id: number; name: string }[]>(
    []
  );
  const [activeTab, setActiveTab] = useState<string>("basic-info");

  // Stripe payment methods state
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodData[]>([]);
  const [isLoadingPaymentMethods, setIsLoadingPaymentMethods] =
    useState<boolean>(false);
  const [isSavingCard, setIsSavingCard] = useState<boolean>(false);
  const [stripePublishableKey, setStripePublishableKey] = useState<string>("");
  const [cardData, setCardData] = useState({
    cardholderName: "",
    isDefault: false,
  });

  // Load resellers on component mount
  useEffect(() => {
    const loadResellers = async () => {
      try {
        const resellersData = await getResellers();
        setResellers(resellersData.data);
      } catch (error) {
        console.error("Error loading resellers:", error);
        // Fallback to empty array if API fails
        setResellers([]);
      }
    };

    loadResellers();
  }, []);

  // Load Stripe publishable key from environment
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (key) {
      setStripePublishableKey(key);
    } else {
      console.error(
        "Stripe publishable key not found in environment variables"
      );
    }
  }, []);

  // Load payment methods when editing a company
  const loadPaymentMethods = useCallback(async (profileId: number) => {
    if (!profileId) return;

    setIsLoadingPaymentMethods(true);
    try {
      const methods = await getPaymentMethods(profileId);
      console.log("ZE Payment methods loaded:", methods);
      setPaymentMethods(methods);
    } catch (error) {
      console.error("Error loading payment methods:", error);
      setPaymentMethods([]);
    } finally {
      setIsLoadingPaymentMethods(false);
    }
  }, []);

  // Table columns
  const columns: Column[] = useMemo(
    () => [
      {
        key: "id",
        name: "ID",
        selector: (row: any) => row.id,
        sortable: true,
        cell: (props: any) => (
          <span className="fw-bold text-primary">#{props.id}</span>
        ),
      },
      {
        key: "name",
        name: "Company Name",
        selector: (row: any) => row.name,
        sortable: true,
        cell: (props: any) => <div className="fw-bold">{props.name}</div>,
      },
      {
        key: "email",
        name: "Email",
        selector: (row: any) => row.email,
        sortable: true,
        cell: (props: any) => (
          <span className="text-muted">{props.email || "N/A"}</span>
        ),
      },
      {
        key: "phone",
        name: "Phone",
        selector: (row: any) => row.phone,
        sortable: true,
        cell: (props: any) => (
          <span className="text-muted">{props.phone || "N/A"}</span>
        ),
      },
      {
        key: "country",
        name: "Country",
        selector: (row: any) => row.country,
        sortable: true,
        cell: (props: any) => (
          <span className="text-muted">{props.country || "N/A"}</span>
        ),
      },
      {
        key: "reseller-name",
        name: "Reseller",
        selector: (row: any) => row.reseller?.name,
        sortable: true,
        cell: (props: any) => (
          <span className="text-muted">
            {props.reseller?.name || "N/A"}
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
            <TableAction
              actions={[
                {
                  label: "Edit",
                  icon: FiEdit,
                  onClick: () => handleEditCompany(props),
                  //  permission: 'edit-companies',
                  variant: "edit",
                },
                {
                  label: "Pricing",
                  icon: FiEdit,
                  onClick: () =>
                    router.push(
                      `/accounting/companies/product-pricing?companyId=${props.id}`
                    ),
                  //  permission: 'edit-companies',
                  variant: "edit",
                },
                {
                  label: "Delete",
                  icon: FiTrash2,
                  onClick: () => handleDeleteCompany(props),
                  //  permission: 'delete-companies',
                  variant: "delete",
                },
              ]}
            />
          </>
        ),
      },
    ],
    []
  );

 

  // Reset form data
  const resetFormData = useCallback(() => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      country: "",
      reseller_id: "",
      profile: {
        currency: "USD",
        vat_rate: "0.00",
        vat_exemption: false,
        tax_id: "",
        discount_type: "flat_percentage",
        address: "",
        discount_limit: "0.00",
        discount_applicability: [] as string[],
        payment_methods: [] as string[],
        payment_mode: "one_time",
        credit_limit: "0.00",
        early_payment_discount: "0.00",
        late_fee_rule: "0.00",
        payment_terms: 30,
        outstanding_invoices: "0.00",
        discounts_applied_ytd: "0.00",
        vat_collected: "0.00",
        active_subscriptions: "0",
        last_refund_date: "",
        profile_status: "incomplete",
        selected_products: [] as string[],
      },
    });
  }, []);

  // Handle create company
  const handleCreateCompany = useCallback(async () => {
    if (!formData.name.trim()) {
      toast.error("Please enter a company name");
      return;
    }
    if (!formData.email.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    setIsLoading(true);
    try {
      await createUpdateCompany(formData);
      toast.success("Company created successfully");
      setShowCreateModal(false);
      resetFormData();
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error("Error creating company:", error);
    } finally {
      setIsLoading(false);
    }
  }, [formData, resetFormData]);

  // Handle edit company
  const handleEditCompany = useCallback(
    async (company: CompanyData) => {
      setSelectedCompany(company);
      setActiveTab("basic-info"); // Reset to first tab
      setIsLoadingCompany(true);
      setShowEditModal(true);

      try {
        // Fetch fresh company data by ID
        const freshCompanyData = await getCompany(company.id);
        console.log("Fresh company data loaded:", freshCompanyData);
        console.log("Fresh company profile:", freshCompanyData.profile);

        setFormData({
          name: freshCompanyData.name,
          email: freshCompanyData.email,
          phone: freshCompanyData.phone ?? "",
          country: freshCompanyData.country ?? "",
          reseller_id: freshCompanyData.reseller_id?.toString() ?? "",
          profile: {
            currency: freshCompanyData.profile?.currency ?? "USD",
            vat_rate: freshCompanyData.profile?.vat_rate?.toString() ?? "0.00",
            vat_exemption: Boolean(freshCompanyData.profile?.vat_exemption),
            tax_id: freshCompanyData.profile?.tax_id ?? "",
            discount_type:
              freshCompanyData.profile?.discount_type ?? "flat_percentage",
            address: freshCompanyData.profile?.address ?? "",
            discount_limit:
              freshCompanyData.profile?.discount_limit?.toString() ?? "0.00",
            discount_applicability:
              freshCompanyData.profile?.discount_applicability ??
              ([] as string[]),
            payment_methods:
              freshCompanyData.profile?.payment_methods ?? ([] as string[]),
            payment_mode: freshCompanyData.profile?.payment_mode ?? "one_time",
            credit_limit:
              freshCompanyData.profile?.credit_limit?.toString() ?? "0.00",
            early_payment_discount:
              freshCompanyData.profile?.early_payment_discount?.toString() ??
              "0.00",
            late_fee_rule:
              freshCompanyData.profile?.late_fee_rule?.toString() ?? "0.00",
            payment_terms:
              Number(freshCompanyData.profile?.payment_terms) || 30,
            outstanding_invoices:
              freshCompanyData.profile?.outstanding_invoices?.toString() ??
              "0.00",
            discounts_applied_ytd:
              freshCompanyData.profile?.discounts_applied_ytd?.toString() ??
              "0.00",
            vat_collected:
              freshCompanyData.profile?.vat_collected?.toString() ?? "0.00",
            active_subscriptions:
              freshCompanyData.profile?.active_subscriptions?.toString() ?? "0",
            last_refund_date: freshCompanyData.profile?.last_refund_date ?? "",
            profile_status:
              freshCompanyData.profile?.profile_status ?? "incomplete",
            selected_products:
              freshCompanyData.profile?.selected_products ?? ([] as string[]),
          },
        });

        // Load payment methods if profile exists
        if (freshCompanyData.id) {
          await loadPaymentMethods(freshCompanyData.id);
        }
      } catch (error) {
        console.error("Error loading company data:", error);
        toast.error("Failed to load company data");
        setShowEditModal(false);
      } finally {
        setIsLoadingCompany(false);
      }
    },
    [loadPaymentMethods]
  );

  // Handle update company
  const handleUpdateCompany = useCallback(async () => {
    if (!selectedCompany) return;

    if (!formData.name.trim()) {
      toast.error("Please enter a company name");
      return;
    }
    if (!formData.email.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    setIsLoading(true);
    try {
      await createUpdateCompany({ ...formData, id: selectedCompany.id });
      toast.success("Company updated successfully");
      setShowEditModal(false);
      setSelectedCompany(null);
      resetFormData();
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error("Error updating company:", error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCompany, formData, resetFormData]);

  // Handle delete company
  const handleDeleteCompany = useCallback((company: CompanyData) => {
    setSelectedCompany(company);
    setShowDeleteModal(true);
  }, []);

  const [successModalTitle, setSuccessModalTitle] = useState<string>("");
  const [successModalDescription, setSuccessModalDescription] =
    useState<string>("");
  const [showExportSuccessfulModal, setShowExportSuccessfulModal] =
    useState<boolean>(false);

  // Handle confirm delete
  const handleConfirmDelete = useCallback(async () => {
    if (!selectedCompany) return;

    setIsLoading(true);
    try {
      await deleteCompany(selectedCompany.id);
      toast.success("Company deleted successfully");
      setShowDeleteModal(false);
      setSelectedCompany(null);
      setSuccessModalTitle("Successfully Deleted");
      setSuccessModalDescription(
        "The company data has been successfully deleted."
      );
      setShowExportSuccessfulModal(true);

      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error("Error deleting company:", error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCompany]);

  // Handle import companies
  const handleImportCompanies = useCallback(async () => {
    if (!importFile) {
      toast.error("Please select a file to import");
      return;
    }

    setIsImporting(true);
    setImportProgress(0);
    try {
      await importCompanies(importFile);
      toast.success("Companies imported successfully");
      setShowImportModal(false);
      setImportFile(null);
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error("Error importing companies:", error);
    } finally {
      setIsImporting(false);
      setImportProgress(0);
    }
  }, [importFile]);


  // Handle download template
  const handleDownloadTemplate = useCallback(async () => {
    try {
      const blob = await downloadTemplate();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "companies-template.xlsx";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Template downloaded successfully");
    } catch (error) {
      console.error("Error downloading template:", error);
    }
  }, []);

  // Modal handlers
  const openCreateModal = useCallback(() => {
    resetFormData();
    setActiveTab("basic-info"); // Reset to first tab
    setShowCreateModal(true);
  }, [resetFormData]);

  const closeCreateModal = useCallback(() => {
    setShowCreateModal(false);
    resetFormData();
  }, [resetFormData]);

  const closeEditModal = useCallback(() => {
    setShowEditModal(false);
    setSelectedCompany(null);
    setIsLoadingCompany(false);
    setPaymentMethods([]);
    setCardData({
      cardholderName: "",
      isDefault: false,
    });
    resetFormData();
  }, [resetFormData]);

  const closeDeleteModal = useCallback(() => {
    setShowDeleteModal(false);
    setSelectedCompany(null);
  }, []);

  const closeImportModal = useCallback(() => {
    setShowImportModal(false);
    setImportFile(null);
    setImportProgress(0);
  }, []);

  // Form input handlers
  const handleInputChange = useCallback((field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  // Profile input handlers
  const handleProfileInputChange = useCallback((field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        [field]: value,
      },
    }));
  }, []);

  // File input handler
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setImportFile(file);
      }
    },
    []
  );

  // Card data handlers
  const handleCardDataChange = useCallback((field: string, value: any) => {
    setCardData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  // Handle save card with Stripe token
  const handleSaveCard = useCallback(
    async (stripeToken: string) => {
      if (!selectedCompany?.id) {
        toast.error("No profile found for this company");
        return;
      }

      setIsSavingCard(true);
      try {
        const payload = {
          cardholderName: cardData.cardholderName,
          isDefault: cardData.isDefault,
          stripeToken: stripeToken,
        };

        await createAndConfirmPaymentMethod(selectedCompany.id, payload);
        toast.success("Card saved successfully");

        // Reload payment methods
        await loadPaymentMethods(selectedCompany.id);

        // Reset card data
        setCardData({
          cardholderName: "",
          isDefault: false,
        });
      } catch (error) {
        console.error("Error saving card:", error);
        toast.error("Failed to save card");
      } finally {
        setIsSavingCard(false);
      }
    },
    [selectedCompany, cardData, loadPaymentMethods]
  );

  // Handle set default payment method
  const handleSetDefaultPaymentMethod = useCallback(
    async (paymentMethodId: string) => {
      if (!selectedCompany?.id) {
        toast.error("No company selected");
        return;
      }

      try {
        await setDefaultPaymentMethod(selectedCompany.id, paymentMethodId);
        toast.success("Default payment method updated");

        // Reload payment methods
        await loadPaymentMethods(selectedCompany.id);
      } catch (error) {
        console.error("Error setting default payment method:", error);
        toast.error("Failed to set default payment method");
      }
    },
    [selectedCompany, loadPaymentMethods]
  );

  // Handle remove payment method
  const handleRemovePaymentMethod = useCallback(
    async (paymentMethodId: string) => {
      if (
        !window.confirm("Are you sure you want to remove this payment method?")
      ) {
        return;
      }

      try {
        await deletePaymentMethod(paymentMethodId);
        toast.success("Payment method removed");

        // Reload payment methods
        if (selectedCompany?.id) {
          await loadPaymentMethods(selectedCompany.id);
        }
      } catch (error) {
        console.error("Error removing payment method:", error);
        toast.error("Failed to remove payment method");
      }
    },
    [selectedCompany, loadPaymentMethods]
  );

  const [currentFilters, setCurrentFilters] = useState<any>({});
  
  const handleFiltersChange = useCallback((filters: any) => {
    setCurrentFilters(filters);
  }, [setCurrentFilters]);

  // Handle export companies
  const handleExportCompanies = useCallback(async (exportType: string, filters: Record<string, any> = {}) => {
    try {
      const exportFilters = {
        ...currentFilters,
        ...filters
      };
      const blob = await exportCompanies(exportFilters);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `companies-export-${moment().format("YYYY-MM-DD")}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Companies exported successfully");
    } catch (error) {
      console.error("Error exporting companies:", error);
    }
  }, [currentFilters]);

  // Fetch companies function
  const fetchCompanies = useCallback(
    async (page = 1, perPage = 15, search = "") => {
      return await getCompanies({
        page,
        per_page: perPage,
        search: search || currentFilters?.search,
        reseller_id: currentFilters?.reseller_id,
        phone: currentFilters?.phone,
        email: currentFilters?.email,
      });
    },
    [currentFilters]
  );

  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle="Accounting"
        mainLink="/accounting/companies"
        subTitle="Companies"
      />

      <PageHeader
        title="Companies"
        showSearch={true}
        searchPlaceholder="Search companies..."
        searchValue={currentFilters.search || ""}
        onSearchChange={(value) =>
          handleFiltersChange({ ...currentFilters, search: value })
        }
        buttons={
          <div className="d-flex align-items-center gap-2">
            <CompaniesFilters
              onFiltersChange={handleFiltersChange}
              showFilters={true}
              showExport={true}
              onExport={handleExportCompanies}
            />
            <Button variant="primary" size="sm" onClick={openCreateModal}>
              New Company
            </Button>
          </div>
        }
      />

      <GenericListPage
        columns={columns}
        fetchData={fetchCompanies}
        title="Companies"
        searchPlaceholder="Search companies..."
        defaultPageSize={15}
        refreshKey={refreshKey}
        search={false}
        filters={currentFilters}
        tableStyle="table-style-2"
      />

      {/* Create Modal */}
      <FormModal
        show={showCreateModal}
        onHide={closeCreateModal}
        title="Create New Company"
        desc="Please fill in the details below to create a new company."
        formHtml={
          <>
            <div className="row">
              <div className="col-12">
                <ul className="nav nav-tabs" id="system-tabs" role="tablist">
                  <li className="nav-item" role="presentation">
                    <button
                      className={`nav-link ${
                        activeTab === "basic-info" ? "active" : ""
                      }`}
                      id="create-basic-info-tab"
                      type="button"
                      role="tab"
                      onClick={() => setActiveTab("basic-info")}
                    >
                      Basic Information
                    </button>
                  </li>
                  <li className="nav-item" role="presentation">
                    <button
                      className={`nav-link ${
                        activeTab === "profile" ? "active" : ""
                      }`}
                      id="create-profile-tab"
                      type="button"
                      role="tab"
                      onClick={() => setActiveTab("profile")}
                    >
                      Profile Settings
                    </button>
                  </li>
                  <li className="nav-item" role="presentation">
                    <button
                      className={`nav-link ${
                        activeTab === "payment" ? "active" : ""
                      }`}
                      id="create-payment-tab"
                      type="button"
                      role="tab"
                      onClick={() => setActiveTab("payment")}
                    >
                      Payment & Billing
                    </button>
                  </li>
                  <li className="nav-item" role="presentation">
                    <button
                      className={`nav-link ${
                        activeTab === "discounts" ? "active" : ""
                      }`}
                      id="create-discounts-tab"
                      type="button"
                      role="tab"
                      onClick={() => setActiveTab("discounts")}
                    >
                      Discounts & Terms
                    </button>
                  </li>
                </ul>

                <div className="tab-content" id="createCompanyTabsContent">
                  {/* Basic Information Tab */}
                  <div
                    className={`tab-pane fade ${
                      activeTab === "basic-info" ? "show active" : ""
                    }`}
                    id="create-basic-info"
                    role="tabpanel"
                    aria-labelledby="create-basic-info-tab"
                  >
                    <div className="row mt-3">
                      <div className="col-md-6">
                        <div className="form-group mb-3">
                          <label htmlFor="createName">Company Name *</label>
                          <input
                            type="text"
                            className="form-control"
                            id="createName"
                            value={formData.name}
                            onChange={(e) =>
                              handleInputChange("name", e.target.value)
                            }
                            placeholder="Enter company name"
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group mb-3">
                          <label htmlFor="createEmail">Email *</label>
                          <input
                            type="email"
                            className="form-control"
                            id="createEmail"
                            value={formData.email}
                            onChange={(e) =>
                              handleInputChange("email", e.target.value)
                            }
                            placeholder="Enter email address"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-md-6">
                        <div className="form-group mb-3">
                          <label htmlFor="createPhone">Phone</label>
                          <input
                            type="text"
                            className="form-control"
                            id="createPhone"
                            value={formData.phone}
                            onChange={(e) =>
                              handleInputChange("phone", e.target.value)
                            }
                            placeholder="Enter phone number"
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group mb-3">
                          <label htmlFor="createCountry">Country</label>
                          <input
                            type="text"
                            className="form-control"
                            id="createCountry"
                            value={formData.country}
                            onChange={(e) =>
                              handleInputChange("country", e.target.value)
                            }
                            placeholder="Enter country"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-md-6">
                        <div className="form-group mb-3">
                          <label htmlFor="createReseller">Reseller</label>
                          <select
                            className="form-control"
                            id="createReseller"
                            value={formData.reseller_id}
                            onChange={(e) =>
                              handleInputChange("reseller_id", e.target.value)
                            }
                          >
                            <option value="">Select Reseller</option>
                            {resellers.map((reseller) => (
                              <option
                                key={reseller.id}
                                value={reseller.id.toString()}
                              >
                                {reseller.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Profile Settings Tab */}
                  <div
                    className={`tab-pane fade ${
                      activeTab === "profile" ? "show active" : ""
                    }`}
                    id="create-profile"
                    role="tabpanel"
                    aria-labelledby="create-profile-tab"
                  >
                    <div className="row mt-3">
                      <div className="col-md-6">
                        <div className="form-group mb-3">
                          <label htmlFor="createCurrency">Currency</label>
                          <select
                            className="form-control"
                            id="createCurrency"
                            value={formData.profile.currency}
                            onChange={(e) =>
                              handleProfileInputChange(
                                "currency",
                                e.target.value
                              )
                            }
                          >
                            <option value="USD">USD</option>
                            <option value="EUR">EUR</option>
                            <option value="GBP">GBP</option>
                            <option value="CAD">CAD</option>
                          </select>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group mb-3">
                          <label htmlFor="createTaxId">Tax ID</label>
                          <input
                            type="text"
                            className="form-control"
                            id="createTaxId"
                            value={formData.profile.tax_id}
                            onChange={(e) =>
                              handleProfileInputChange("tax_id", e.target.value)
                            }
                            placeholder="Enter tax ID"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-md-12">
                        <div className="form-group mb-3">
                          <label htmlFor="createAddress">Address</label>
                          <textarea
                            className="form-control"
                            id="createAddress"
                            rows={3}
                            value={formData.profile.address}
                            onChange={(e) =>
                              handleProfileInputChange(
                                "address",
                                e.target.value
                              )
                            }
                            placeholder="Enter company address"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-md-6">
                        <div className="form-group mb-3">
                          <label htmlFor="createVatRate">VAT Rate (%)</label>
                          <input
                            type="number"
                            step="0.01"
                            className="form-control"
                            id="createVatRate"
                            value={formData.profile.vat_rate}
                            onChange={(e) =>
                              handleProfileInputChange(
                                "vat_rate",
                                e.target.value
                              )
                            }
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group mb-3">
                          <div className="form-check mt-4">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id="createVatExemption"
                              checked={formData.profile.vat_exemption}
                              onChange={(e) =>
                                handleProfileInputChange(
                                  "vat_exemption",
                                  e.target.checked
                                )
                              }
                            />
                            <label
                              className="form-check-label"
                              htmlFor="createVatExemption"
                            >
                              VAT Exemption
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-md-6">
                        <div className="form-group mb-3">
                          <label htmlFor="createProfileStatus">
                            Profile Status
                          </label>
                          <select
                            className="form-control"
                            id="createProfileStatus"
                            value={formData.profile.profile_status}
                            onChange={(e) =>
                              handleProfileInputChange(
                                "profile_status",
                                e.target.value
                              )
                            }
                          >
                            <option value="incomplete">Incomplete</option>
                            <option value="complete">Complete</option>
                            <option value="verified">Verified</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payment & Billing Tab */}
                  <div
                    className={`tab-pane fade ${
                      activeTab === "payment" ? "show active" : ""
                    }`}
                    id="create-payment"
                    role="tabpanel"
                    aria-labelledby="create-payment-tab"
                  >
                    <div className="row mt-3">
                      <div className="col-md-6">
                        <div className="form-group mb-3">
                          <label htmlFor="createPaymentMode">
                            Payment Mode
                          </label>
                          <select
                            className="form-control"
                            id="createPaymentMode"
                            value={formData.profile.payment_mode}
                            onChange={(e) =>
                              handleProfileInputChange(
                                "payment_mode",
                                e.target.value
                              )
                            }
                          >
                            <option value="one_time">One Time</option>
                            <option value="recurring">Recurring</option>
                            <option value="subscription">Subscription</option>
                          </select>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group mb-3">
                          <label htmlFor="createPaymentTerms">
                            Payment Terms (Days)
                          </label>
                          <input
                            type="number"
                            className="form-control"
                            id="createPaymentTerms"
                            value={formData.profile.payment_terms}
                            onChange={(e) =>
                              handleProfileInputChange(
                                "payment_terms",
                                parseInt(e.target.value) || 0
                              )
                            }
                            placeholder="30"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-md-6">
                        <div className="form-group mb-3">
                          <label htmlFor="createCreditLimit">
                            Credit Limit
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            className="form-control"
                            id="createCreditLimit"
                            value={formData.profile.credit_limit}
                            onChange={(e) =>
                              handleProfileInputChange(
                                "credit_limit",
                                e.target.value
                              )
                            }
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group mb-3">
                          <label htmlFor="createOutstandingInvoices">
                            Outstanding Invoices
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            className="form-control"
                            id="createOutstandingInvoices"
                            value={formData.profile.outstanding_invoices}
                            onChange={(e) =>
                              handleProfileInputChange(
                                "outstanding_invoices",
                                e.target.value
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
                          <label htmlFor="createActiveSubscriptions">
                            Active Subscriptions
                          </label>
                          <input
                            type="number"
                            className="form-control"
                            id="createActiveSubscriptions"
                            value={formData.profile.active_subscriptions}
                            onChange={(e) =>
                              handleProfileInputChange(
                                "active_subscriptions",
                                e.target.value
                              )
                            }
                            placeholder="0"
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group mb-3">
                          <label htmlFor="createLastRefundDate">
                            Last Refund Date
                          </label>
                          <input
                            type="date"
                            className="form-control"
                            id="createLastRefundDate"
                            value={formData.profile.last_refund_date}
                            onChange={(e) =>
                              handleProfileInputChange(
                                "last_refund_date",
                                e.target.value
                              )
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Discounts & Terms Tab */}
                  <div
                    className={`tab-pane fade ${
                      activeTab === "discounts" ? "show active" : ""
                    }`}
                    id="create-discounts"
                    role="tabpanel"
                    aria-labelledby="create-discounts-tab"
                  >
                    <div className="row mt-3">
                      <div className="col-md-6">
                        <div className="form-group mb-3">
                          <label htmlFor="createDiscountType">
                            Discount Type
                          </label>
                          <select
                            className="form-control"
                            id="createDiscountType"
                            value={formData.profile.discount_type}
                            onChange={(e) =>
                              handleProfileInputChange(
                                "discount_type",
                                e.target.value
                              )
                            }
                          >
                            <option value="flat_percentage">
                              Flat Percentage
                            </option>
                            <option value="flat_amount">Flat Amount</option>
                            <option value="tiered">Tiered</option>
                          </select>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group mb-3">
                          <label htmlFor="createDiscountLimit">
                            Discount Limit (%)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            className="form-control"
                            id="createDiscountLimit"
                            value={formData.profile.discount_limit}
                            onChange={(e) =>
                              handleProfileInputChange(
                                "discount_limit",
                                e.target.value
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
                          <label htmlFor="createEarlyPaymentDiscount">
                            Early Payment Discount (%)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            className="form-control"
                            id="createEarlyPaymentDiscount"
                            value={formData.profile.early_payment_discount}
                            onChange={(e) =>
                              handleProfileInputChange(
                                "early_payment_discount",
                                e.target.value
                              )
                            }
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group mb-3">
                          <label htmlFor="createLateFeeRule">
                            Late Fee Rule (%)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            className="form-control"
                            id="createLateFeeRule"
                            value={formData.profile.late_fee_rule}
                            onChange={(e) =>
                              handleProfileInputChange(
                                "late_fee_rule",
                                e.target.value
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
                          <label htmlFor="createDiscountsAppliedYtd">
                            Discounts Applied YTD
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            className="form-control"
                            id="createDiscountsAppliedYtd"
                            value={formData.profile.discounts_applied_ytd}
                            onChange={(e) =>
                              handleProfileInputChange(
                                "discounts_applied_ytd",
                                e.target.value
                              )
                            }
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group mb-3">
                          <label htmlFor="createVatCollected">
                            VAT Collected
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            className="form-control"
                            id="createVatCollected"
                            value={formData.profile.vat_collected}
                            onChange={(e) =>
                              handleProfileInputChange(
                                "vat_collected",
                                e.target.value
                              )
                            }
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        }
        submitButtonText="Submit"
        cancelButtonText="Cancel"
        onSubmit={handleCreateCompany}
      />

      {/* Edit Modal */}
      <FormModal
        show={showEditModal}
        onHide={closeEditModal}
        title={`Edit Company #${selectedCompany?.id}`}
        desc="Please fill in the details below to edit the company."
        formHtml={
          <>
            {isLoadingCompany ? (
              <div className="text-center py-4">
                <Spinner animation="border" className="me-2" />
                <span>Loading company data...</span>
              </div>
            ) : (
              <div className="row">
                <div className="col-12">
                  <ul
                    className="nav nav-tabs"
                    id="editCompanyTabs"
                    role="tablist"
                  >
                    <li className="nav-item" role="presentation">
                      <button
                        className={`nav-link ${
                          activeTab === "basic-info" ? "active" : ""
                        }`}
                        id="basic-info-tab"
                        type="button"
                        role="tab"
                        onClick={() => setActiveTab("basic-info")}
                      >
                        Basic Information
                      </button>
                    </li>
                    <li className="nav-item" role="presentation">
                      <button
                        className={`nav-link ${
                          activeTab === "profile" ? "active" : ""
                        }`}
                        id="profile-tab"
                        type="button"
                        role="tab"
                        onClick={() => setActiveTab("profile")}
                      >
                        Profile Settings
                      </button>
                    </li>
                    <li className="nav-item" role="presentation">
                      <button
                        className={`nav-link ${
                          activeTab === "payment" ? "active" : ""
                        }`}
                        id="payment-tab"
                        type="button"
                        role="tab"
                        onClick={() => setActiveTab("payment")}
                      >
                        Payment & Billing
                      </button>
                    </li>
                    <li className="nav-item" role="presentation">
                      <button
                        className={`nav-link ${
                          activeTab === "discounts" ? "active" : ""
                        }`}
                        id="discounts-tab"
                        type="button"
                        role="tab"
                        onClick={() => setActiveTab("discounts")}
                      >
                        Discounts & Terms
                      </button>
                    </li>
                    <li className="nav-item" role="presentation">
                      <button
                        className={`nav-link ${
                          activeTab === "payment-methods" ? "active" : ""
                        }`}
                        id="payment-methods-tab"
                        type="button"
                        role="tab"
                        onClick={() => setActiveTab("payment-methods")}
                      >
                        Payment Methods
                      </button>
                    </li>
                  </ul>

                  <div className="tab-content" id="editCompanyTabsContent">
                    {/* Basic Information Tab */}
                    <div
                      className={`tab-pane fade ${
                        activeTab === "basic-info" ? "show active" : ""
                      }`}
                      id="basic-info"
                      role="tabpanel"
                      aria-labelledby="basic-info-tab"
                    >
                      <div className="row mt-3">
                        <div className="col-md-6">
                          <div className="form-group mb-3">
                            <label htmlFor="editName">Company Name *</label>
                            <input
                              type="text"
                              className="form-control"
                              id="editName"
                              value={formData.name}
                              onChange={(e) =>
                                handleInputChange("name", e.target.value)
                              }
                              placeholder="Enter company name"
                            />
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="form-group mb-3">
                            <label htmlFor="editEmail">Email *</label>
                            <input
                              type="email"
                              className="form-control"
                              id="editEmail"
                              value={formData.email}
                              onChange={(e) =>
                                handleInputChange("email", e.target.value)
                              }
                              placeholder="Enter email address"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="row">
                        <div className="col-md-6">
                          <div className="form-group mb-3">
                            <label htmlFor="editPhone">Phone</label>
                            <input
                              type="text"
                              className="form-control"
                              id="editPhone"
                              value={formData.phone}
                              onChange={(e) =>
                                handleInputChange("phone", e.target.value)
                              }
                              placeholder="Enter phone number"
                            />
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="form-group mb-3">
                            <label htmlFor="editCountry">Country</label>
                            <input
                              type="text"
                              className="form-control"
                              id="editCountry"
                              value={formData.country}
                              onChange={(e) =>
                                handleInputChange("country", e.target.value)
                              }
                              placeholder="Enter country"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="row">
                        <div className="col-md-6">
                          <div className="form-group mb-3">
                            <label htmlFor="editReseller">Reseller</label>
                            <select
                              className="form-control"
                              id="editReseller"
                              value={formData.reseller_id}
                              onChange={(e) =>
                                handleInputChange("reseller_id", e.target.value)
                              }
                            >
                              <option value="">Select Reseller</option>
                              {resellers.map((reseller) => (
                                <option
                                  key={reseller.id}
                                  value={reseller.id.toString()}
                                >
                                  {reseller.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Profile Settings Tab */}
                    <div
                      className={`tab-pane fade ${
                        activeTab === "profile" ? "show active" : ""
                      }`}
                      id="profile"
                      role="tabpanel"
                      aria-labelledby="profile-tab"
                    >
                      <div className="row mt-3">
                        <div className="col-md-6">
                          <div className="form-group mb-3">
                            <label htmlFor="editCurrency">Currency</label>
                            <select
                              className="form-control"
                              id="editCurrency"
                              value={formData.profile.currency}
                              onChange={(e) =>
                                handleProfileInputChange(
                                  "currency",
                                  e.target.value
                                )
                              }
                            >
                              <option value="USD">USD</option>
                              <option value="EUR">EUR</option>
                              <option value="GBP">GBP</option>
                              <option value="CAD">CAD</option>
                            </select>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="form-group mb-3">
                            <label htmlFor="editTaxId">Tax ID</label>
                            <input
                              type="text"
                              className="form-control"
                              id="editTaxId"
                              value={formData.profile.tax_id}
                              onChange={(e) =>
                                handleProfileInputChange(
                                  "tax_id",
                                  e.target.value
                                )
                              }
                              placeholder="Enter tax ID"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="row">
                        <div className="col-md-12">
                          <div className="form-group mb-3">
                            <label htmlFor="editAddress">Address</label>
                            <textarea
                              className="form-control"
                              id="editAddress"
                              rows={3}
                              value={formData.profile.address}
                              onChange={(e) =>
                                handleProfileInputChange(
                                  "address",
                                  e.target.value
                                )
                              }
                              placeholder="Enter company address"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="row">
                        <div className="col-md-6">
                          <div className="form-group mb-3">
                            <label htmlFor="editVatRate">VAT Rate (%)</label>
                            <input
                              type="number"
                              step="0.01"
                              className="form-control"
                              id="editVatRate"
                              value={formData.profile.vat_rate}
                              onChange={(e) =>
                                handleProfileInputChange(
                                  "vat_rate",
                                  e.target.value
                                )
                              }
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="form-group mb-3">
                            <div className="form-check mt-4">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="editVatExemption"
                                checked={formData.profile.vat_exemption}
                                onChange={(e) =>
                                  handleProfileInputChange(
                                    "vat_exemption",
                                    e.target.checked
                                  )
                                }
                              />
                              <label
                                className="form-check-label"
                                htmlFor="editVatExemption"
                              >
                                VAT Exemption
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="row">
                        <div className="col-md-6">
                          <div className="form-group mb-3">
                            <label htmlFor="editProfileStatus">
                              Profile Status
                            </label>
                            <select
                              className="form-control"
                              id="editProfileStatus"
                              value={formData.profile.profile_status}
                              onChange={(e) =>
                                handleProfileInputChange(
                                  "profile_status",
                                  e.target.value
                                )
                              }
                            >
                              <option value="incomplete">Incomplete</option>
                              <option value="complete">Complete</option>
                              <option value="verified">Verified</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Payment & Billing Tab */}
                    <div
                      className={`tab-pane fade ${
                        activeTab === "payment" ? "show active" : ""
                      }`}
                      id="payment"
                      role="tabpanel"
                      aria-labelledby="payment-tab"
                    >
                      <div className="row mt-3">
                        <div className="col-md-6">
                          <div className="form-group mb-3">
                            <label htmlFor="editPaymentMode">
                              Payment Mode
                            </label>
                            <select
                              className="form-control"
                              id="editPaymentMode"
                              value={formData.profile.payment_mode}
                              onChange={(e) =>
                                handleProfileInputChange(
                                  "payment_mode",
                                  e.target.value
                                )
                              }
                            >
                              <option value="one_time">One Time</option>
                              <option value="recurring">Recurring</option>
                              <option value="subscription">Subscription</option>
                            </select>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="form-group mb-3">
                            <label htmlFor="editPaymentTerms">
                              Payment Terms (Days)
                            </label>
                            <input
                              type="number"
                              className="form-control"
                              id="editPaymentTerms"
                              value={formData.profile.payment_terms}
                              onChange={(e) =>
                                handleProfileInputChange(
                                  "payment_terms",
                                  parseInt(e.target.value) || 0
                                )
                              }
                              placeholder="30"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="row">
                        <div className="col-md-6">
                          <div className="form-group mb-3">
                            <label htmlFor="editCreditLimit">
                              Credit Limit
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              className="form-control"
                              id="editCreditLimit"
                              value={formData.profile.credit_limit}
                              onChange={(e) =>
                                handleProfileInputChange(
                                  "credit_limit",
                                  e.target.value
                                )
                              }
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="form-group mb-3">
                            <label htmlFor="editOutstandingInvoices">
                              Outstanding Invoices
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              className="form-control"
                              id="editOutstandingInvoices"
                              value={formData.profile.outstanding_invoices}
                              onChange={(e) =>
                                handleProfileInputChange(
                                  "outstanding_invoices",
                                  e.target.value
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
                            <label htmlFor="editActiveSubscriptions">
                              Active Subscriptions
                            </label>
                            <input
                              type="number"
                              className="form-control"
                              id="editActiveSubscriptions"
                              value={formData.profile.active_subscriptions}
                              onChange={(e) =>
                                handleProfileInputChange(
                                  "active_subscriptions",
                                  e.target.value
                                )
                              }
                              placeholder="0"
                            />
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="form-group mb-3">
                            <label htmlFor="editLastRefundDate">
                              Last Refund Date
                            </label>
                            <input
                              type="date"
                              className="form-control"
                              id="editLastRefundDate"
                              value={formData.profile.last_refund_date}
                              onChange={(e) =>
                                handleProfileInputChange(
                                  "last_refund_date",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Discounts & Terms Tab */}
                    <div
                      className={`tab-pane fade ${
                        activeTab === "discounts" ? "show active" : ""
                      }`}
                      id="discounts"
                      role="tabpanel"
                      aria-labelledby="discounts-tab"
                    >
                      <div className="row mt-3">
                        <div className="col-md-6">
                          <div className="form-group mb-3">
                            <label htmlFor="editDiscountType">
                              Discount Type
                            </label>
                            <select
                              className="form-control"
                              id="editDiscountType"
                              value={formData.profile.discount_type}
                              onChange={(e) =>
                                handleProfileInputChange(
                                  "discount_type",
                                  e.target.value
                                )
                              }
                            >
                              <option value="flat_percentage">
                                Flat Percentage
                              </option>
                              <option value="flat_amount">Flat Amount</option>
                              <option value="tiered">Tiered</option>
                            </select>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="form-group mb-3">
                            <label htmlFor="editDiscountLimit">
                              Discount Limit (%)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              className="form-control"
                              id="editDiscountLimit"
                              value={formData.profile.discount_limit}
                              onChange={(e) =>
                                handleProfileInputChange(
                                  "discount_limit",
                                  e.target.value
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
                            <label htmlFor="editEarlyPaymentDiscount">
                              Early Payment Discount (%)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              className="form-control"
                              id="editEarlyPaymentDiscount"
                              value={formData.profile.early_payment_discount}
                              onChange={(e) =>
                                handleProfileInputChange(
                                  "early_payment_discount",
                                  e.target.value
                                )
                              }
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="form-group mb-3">
                            <label htmlFor="editLateFeeRule">
                              Late Fee Rule (%)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              className="form-control"
                              id="editLateFeeRule"
                              value={formData.profile.late_fee_rule}
                              onChange={(e) =>
                                handleProfileInputChange(
                                  "late_fee_rule",
                                  e.target.value
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
                            <label htmlFor="editDiscountsAppliedYtd">
                              Discounts Applied YTD
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              className="form-control"
                              id="editDiscountsAppliedYtd"
                              value={formData.profile.discounts_applied_ytd}
                              onChange={(e) =>
                                handleProfileInputChange(
                                  "discounts_applied_ytd",
                                  e.target.value
                                )
                              }
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="form-group mb-3">
                            <label htmlFor="editVatCollected">
                              VAT Collected
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              className="form-control"
                              id="editVatCollected"
                              value={formData.profile.vat_collected}
                              onChange={(e) =>
                                handleProfileInputChange(
                                  "vat_collected",
                                  e.target.value
                                )
                              }
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Payment Methods Tab */}
                    <div
                      className={`tab-pane fade ${
                        activeTab === "payment-methods" ? "show active" : ""
                      }`}
                      id="payment-methods"
                      role="tabpanel"
                      aria-labelledby="payment-methods-tab"
                    >
                      <div className="row mt-3">
                        <div className="col-12">
                          <h5 className="mb-3">Payment Methods</h5>

                          {/* Add New Card Form */}
                          <div className="card mb-4">
                            <div className="card-header">
                              <h6 className="mb-0">Add New Card</h6>
                            </div>
                            <div className="card-body">
                              {stripePublishableKey ? (
                                <Elements
                                  stripe={loadStripe(stripePublishableKey)}
                                >
                                  <StripeCardForm
                                    cardData={cardData}
                                    onCardDataChange={handleCardDataChange}
                                    onSaveCard={handleSaveCard}
                                    isSavingCard={isSavingCard}
                                    stripePublishableKey={stripePublishableKey}
                                  />
                                </Elements>
                              ) : (
                                <div className="text-center py-3">
                                  <Spinner
                                    animation="border"
                                    size="sm"
                                    className="me-2"
                                  />
                                  <span>Loading Stripe...</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Existing Payment Methods */}
                          <div className="card">
                            <div className="card-header">
                              <h6 className="mb-0">Existing Payment Methods</h6>
                            </div>
                            <div className="card-body">
                              {isLoadingPaymentMethods ? (
                                <div className="text-center py-3">
                                  <Spinner
                                    animation="border"
                                    size="sm"
                                    className="me-2"
                                  />
                                  <span>Loading payment methods...</span>
                                </div>
                              ) : paymentMethods.length > 0 ? (
                                <div className="table-responsive">
                                  <table className="table table-sm">
                                    <thead>
                                      <tr>
                                        <th>Type</th>
                                        <th>Details</th>
                                        <th>Default</th>
                                        <th>Created</th>
                                        <th>Actions</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {paymentMethods.map((method) => (
                                        <tr key={method.id}>
                                          <td>
                                            <span className="badge bg-primary">
                                              {method.type === "card"
                                                ? "Card"
                                                : "Bank Account"}
                                            </span>
                                          </td>
                                          <td>
                                            {method.type === "card" &&
                                            method.card ? (
                                              <div>
                                                <div className="fw-bold">
                                                  {method.card.brand.toUpperCase()}{" "}
                                                  •••• {method.card.last4}
                                                </div>
                                                <small className="text-muted">
                                                  Expires{" "}
                                                  {method.card.exp_month}/
                                                  {method.card.exp_year}
                                                </small>
                                                {method.billing_details
                                                  ?.name && (
                                                  <div className="mt-1">
                                                    <small className="text-info">
                                                      <i className="fas fa-user me-1"></i>
                                                      {
                                                        method.billing_details
                                                          .name
                                                      }
                                                    </small>
                                                  </div>
                                                )}
                                              </div>
                                            ) : method.type ===
                                                "bank_account" &&
                                              method.bank_account ? (
                                              <div>
                                                <div className="fw-bold">
                                                  {
                                                    method.bank_account
                                                      .bank_name
                                                  }{" "}
                                                  ••••{" "}
                                                  {method.bank_account.last4}
                                                </div>
                                                <small className="text-muted">
                                                  Routing:{" "}
                                                  {
                                                    method.bank_account
                                                      .routing_number
                                                  }
                                                </small>
                                                {method.billing_details
                                                  ?.name && (
                                                  <div className="mt-1">
                                                    <small className="text-info">
                                                      <i className="fas fa-user me-1"></i>
                                                      {
                                                        method.billing_details
                                                          .name
                                                      }
                                                    </small>
                                                  </div>
                                                )}
                                              </div>
                                            ) : (
                                              <span className="text-muted">
                                                Unknown
                                              </span>
                                            )}
                                          </td>
                                          <td>
                                            {method.is_default ? (
                                              <span className="badge bg-success">
                                                Default
                                              </span>
                                            ) : (
                                              <span className="text-muted">
                                                -
                                              </span>
                                            )}
                                          </td>
                                          <td>
                                            <small className="text-muted">
                                              {moment(method.created_at).format(
                                                "MMM DD, YYYY"
                                              )}
                                            </small>
                                          </td>
                                          <td>
                                            <div className="btn-group btn-group-sm">
                                              <Button
                                                variant="outline-primary"
                                                size="sm"
                                                disabled={method.is_default}
                                                onClick={() =>
                                                  handleSetDefaultPaymentMethod(
                                                    method.id
                                                  )
                                                }
                                              >
                                                {method.is_default
                                                  ? "Default"
                                                  : "Set Default"}
                                              </Button>
                                              <Button
                                                variant="outline-danger"
                                                size="sm"
                                                onClick={() =>
                                                  handleRemovePaymentMethod(
                                                    method.id
                                                  )
                                                }
                                              >
                                                Remove
                                              </Button>
                                            </div>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <div className="text-center py-4">
                                  <p className="text-muted mb-0">
                                    No payment methods found
                                  </p>
                                  <small className="text-muted">
                                    Add a card above to get started
                                  </small>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        }
        submitButtonText="Submit"
        cancelButtonText="Cancel"
        onSubmit={handleUpdateCompany}
      />
      {/* Delete Modal */}
      <ConfirmModal
        show={showDeleteModal}
        onHide={closeDeleteModal}
        title="Delete Company"
        description="Are you sure you want to delete this company?"
        targetName={selectedCompany?.name || ""}
        onConfirm={handleConfirmDelete}
      />

      {showExportSuccessfulModal && (
        <SuccessfulModal
          show={showExportSuccessfulModal}
          onHide={() => setShowExportSuccessfulModal(false)}
          title={successModalTitle}
          description={successModalDescription}
        />
      )}

      {/* Import Modal */}
      <Modal show={showImportModal} onHide={closeImportModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Import Companies</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="info">
            <strong>Import Instructions:</strong>
            <ul className="mb-0 mt-2">
              <li>Download the template first to see the required format</li>
              <li>Fill in the company data in the template</li>
              <li>Upload the completed file using the form below</li>
              <li>Supported formats: Excel (.xlsx, .xls) and CSV</li>
            </ul>
          </Alert>

          <div className="form-group mb-3">
            <label htmlFor="importFile">Select File *</label>
            <input
              type="file"
              className="form-control"
              id="importFile"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
            />
            <small className="text-muted">Maximum file size: 10MB</small>
          </div>

          {importFile && (
            <Alert variant="success">
              <strong>Selected file:</strong> {importFile.name}
              <br />
              <small>
                Size: {(importFile.size / 1024 / 1024).toFixed(2)} MB
              </small>
            </Alert>
          )}

          {isImporting && (
            <div className="mt-3">
              <div className="d-flex align-items-center">
                <Spinner animation="border" size="sm" className="me-2" />
                <span>Importing companies...</span>
              </div>
              <div className="progress mt-2">
                <div
                  className="progress-bar"
                  role="progressbar"
                  style={{ width: `${importProgress}%` }}
                  aria-valuenow={importProgress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  {importProgress}%
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeImportModal}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleImportCompanies}
            disabled={!importFile || isImporting}
          >
            {isImporting ? "Importing..." : "Import Companies"}
          </Button>
        </Modal.Footer>
      </Modal>
    </React.Fragment>
  );
};

CompanyList.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CompanyList;
