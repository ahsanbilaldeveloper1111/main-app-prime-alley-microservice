import {
  createElement,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  Dispatch,
  ReactElement,
  RefObject,
  SetStateAction,
} from "react";
import type { SingleValue } from "react-select";
import { toast } from "react-toastify";
import router from "next/router";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { billingCustomerKeys } from "../../query/keys";

import {
  GetPaymentMethods,
  UpdateCompanyDetails,
  GetDashboardCounters,
  GetPayments,
  GetCurrencies,
} from "@utils/accounting";
import { getInvoices, updateCustomer } from "@utils/accounts";
import {
  ensureCustomerExistsForCrmCompany,
  type EnsureCustomerSettledResult,
  useEnsureCustomerForCrmCompany,
} from "@hooks/billing/useEnsureCustomerForCrmCompany";
import { useMinifiedCompaniesForSelect } from "@hooks/billing/useMinifiedCompaniesForSelect";
import { billingCustomerRoutes } from "@utils/billingCustomerRoutes";
import { getErrorMessage } from "@utils/errors";
import { resolveCompanyLabelForToolbar } from "@components/billings/customer/account-overview/AccountOverviewToolbar";
import {
  buildCountrySelectOptions,
  extractOverviewInvoices,
  extractOverviewPayments,
  extractPaymentMethodsList,
  normalizeCurrencyOptionsFromUnknown,
  parseOverviewDashboardCounters,
} from "@components/billings/customer/account-overview/accountOverviewParsing";
import {
  INITIAL_BILLING_FORM,
  type BillingCustomerView,
  type BillingInfoFormState,
  type CountrySelectOption,
  type OverviewDashboardCounters,
  type OverviewInvoiceRow,
  type OverviewPaymentRow,
  type PaymentMethod,
} from "@components/billings/customer/account-overview/accountOverviewTypes";
import {
  formatVatRateString,
  parseVatPercentToClampedNumber,
} from "@components/billings/customer/account-overview/accountOverviewVat";
import { AccountOverviewPaymentMethodBody } from "@components/billings/customer/account-overview/AccountOverviewPaymentMethodBody";

export const BILLING_CUSTOMER_ACCOUNT_OVERVIEW_ROUTES = {
  invoices: billingCustomerRoutes.invoices(),
  subscriptions: billingCustomerRoutes.subscriptions(),
  paymentHistory: billingCustomerRoutes.paymentHistory(),
  billingSettings: "/settings?tab=billing",
} as const;

function useMountedRef(): RefObject<boolean> {
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);
  return mountedRef;
}

export type UseBillingCustomerAccountOverviewResult = Readonly<{
  billingInfo: BillingInfoFormState;
  setBillingInfo: Dispatch<SetStateAction<BillingInfoFormState>>;
  companyDetails: BillingCustomerView | null;
  companyOptions: ReturnType<typeof useMinifiedCompaniesForSelect>["companyOptions"];
  selectedCompanyId: string | number;
  selectedCompanyName: string;
  customerCurrency: string;
  currencyOptions: CountrySelectOption[];
  isLoadingCurrencies: boolean;
  isLoadingCustomer: boolean;
  isSavingCurrency: boolean;
  isCurrencyLocked: boolean;
  paymentMethods: PaymentMethod[];
  paymentHistory: OverviewPaymentRow[];
  recentInvoices: OverviewInvoiceRow[];
  showBillingEditModal: boolean;
  showManageAccountModal: boolean;
  showTaxEditModal: boolean;
  taxEditSaving: boolean;
  taxForm: { vat_rate: string; vat_exemption: boolean };
  setTaxForm: Dispatch<
    SetStateAction<{ vat_rate: string; vat_exemption: boolean }>
  >;
  isSavingBillingInfo: boolean;
  dashboardCounters: OverviewDashboardCounters | null;
  countryOptionsStatic: CountrySelectOption[];
  selectedCountryOption: SingleValue<CountrySelectOption>;
  paymentMethodBody: ReactElement;

  handleToolbarCompanyChange: (nextId: string | number | "") => void;
  handleToolbarCurrencyChange: (nextCurrency: string) => void;
  goToInvoices: () => void;
  goToBillingSettings: () => void;
  goToPaymentHistory: () => void;
  goToSubscriptions: () => void;
  openTaxEditModal: () => void;
  hideBillingEditModal: () => void;
  hideTaxEditModal: () => void;
  hideManageAccountModal: () => void;
  saveBillingInfo: () => Promise<void>;
  saveTaxInfo: () => Promise<void>;
  flushBillingSave: () => void;
  flushTaxSave: () => void;
}>;

export function useBillingCustomerAccountOverview(): UseBillingCustomerAccountOverviewResult {
  const mountedRef = useMountedRef();

  const [billingInfo, setBillingInfo] =
    useState<BillingInfoFormState>(INITIAL_BILLING_FORM);
  const billingInfoRef = useRef(billingInfo);
  billingInfoRef.current = billingInfo;

  const [companyDetails, setCompanyDetails] =
    useState<BillingCustomerView | null>(null);
  const { companyOptions } = useMinifiedCompaniesForSelect(
    "billing_overview_load_companies_failed",
  );

  const [selectedCompanyId, setSelectedCompanyId] = useState<
    string | number
  >("");
  const [selectedCompanyName, setSelectedCompanyName] = useState("");
  const [customerData, setCustomerData] = useState<BillingCustomerView | null>(
    null,
  );
  const [customerCurrency, setCustomerCurrency] = useState("");
  const companyQueryKey =
    selectedCompanyId !== "" && selectedCompanyId != null
      ? String(selectedCompanyId)
      : "";
  const queryClient = useQueryClient();
  const [isLoadingCustomer, setIsLoadingCustomer] = useState(false);
  const [isSavingCurrency, setIsSavingCurrency] = useState(false);

  const [showBillingEditModal, setShowBillingEditModal] = useState(false);
  const [showManageAccountModal, setShowManageAccountModal] = useState(false);
  const [showTaxEditModal, setShowTaxEditModal] = useState(false);
  const [taxEditSaving, setTaxEditSaving] = useState(false);
  const [taxForm, setTaxForm] = useState<{
    vat_rate: string;
    vat_exemption: boolean;
  }>({
    vat_rate: "0.00",
    vat_exemption: false,
  });
  const taxFormRef = useRef(taxForm);
  taxFormRef.current = taxForm;

  const [isSavingBillingInfo, setIsSavingBillingInfo] = useState(false);

  useEffect(() => {
    if (!selectedCompanyId) {
      setCustomerData(null);
      setCompanyDetails(null);
      setCustomerCurrency("");
      setIsLoadingCustomer(false);
      return;
    }
    setIsLoadingCustomer(true);
  }, [selectedCompanyId]);

  const onAccountingCustomerSettled = useCallback(
    (result: EnsureCustomerSettledResult) => {
      if (!mountedRef.current) return;
      const { customer } = result;
      const view = customer as BillingCustomerView;
      setCustomerData(view);
      setCompanyDetails(view);
      const existingCurrency = String(
        view.profile?.currency ?? view.profile?.currency_code ?? "",
      );
      setCustomerCurrency(existingCurrency);
    },
    [],
  );

  const onAccountingCustomerFailed = useCallback(() => {
    if (!mountedRef.current) return;
    setCustomerData(null);
    setCustomerCurrency("");
  }, []);

  const onAccountingCustomerFinished = useCallback(() => {
    if (!mountedRef.current) return;
    setIsLoadingCustomer(false);
  }, []);

  useEnsureCustomerForCrmCompany(selectedCompanyId, {
    onSettled: onAccountingCustomerSettled,
    onFailed: onAccountingCustomerFailed,
    onFinished: onAccountingCustomerFinished,
    errorToastId: "billing_overview_load_customer_failed",
  });

  const currenciesQuery = useQuery({
    queryKey: billingCustomerKeys.currencies.all(),
    queryFn: async () => {
      try {
        const raw = await GetCurrencies();
        return normalizeCurrencyOptionsFromUnknown(raw);
      } catch (err) {
        toast.error(`Failed to load currencies: ${getErrorMessage(err)}`, {
          toastId: "billing_overview_load_currencies_failed",
        });
        return [];
      }
    },
    enabled: Boolean(companyQueryKey),
    staleTime: 600_000,
  });

  const paymentMethodsQuery = useQuery({
    queryKey: billingCustomerKeys.paymentMethods.forCompany(companyQueryKey),
    queryFn: async () => {
      try {
        const response = await GetPaymentMethods({
          crm_company_id: selectedCompanyId,
        });
        return extractPaymentMethodsList(response);
      } catch (error) {
        toast.error(`Failed to load payment methods: ${getErrorMessage(error)}`, {
          toastId: "billing_overview_load_payment_methods_failed",
        });
        return [];
      }
    },
    enabled: Boolean(companyQueryKey),
  });

  const paymentHistoryQuery = useQuery({
    queryKey: billingCustomerKeys.payments.recentOverview(companyQueryKey),
    queryFn: async () => {
      try {
        const response = await GetPayments({
          page: 1,
          per_page: 3,
          limit: 3,
          crm_company_id: selectedCompanyId,
        });
        return extractOverviewPayments(response);
      } catch (error) {
        toast.error(`Failed to load payment history: ${getErrorMessage(error)}`, {
          toastId: "billing_overview_load_payment_history_failed",
        });
        return [];
      }
    },
    enabled: Boolean(companyQueryKey),
  });

  const recentInvoicesQuery = useQuery({
    queryKey: billingCustomerKeys.invoices.recentOverview(companyQueryKey),
    queryFn: async () => {
      try {
        const response = await getInvoices({
          page: 1,
          per_page: 3,
          limit: 3,
          crm_company_id: selectedCompanyId,
        });
        return extractOverviewInvoices(response);
      } catch (error) {
        toast.error(`Failed to load recent invoices: ${getErrorMessage(error)}`, {
          toastId: "billing_overview_load_recent_invoices_failed",
        });
        return [];
      }
    },
    enabled: Boolean(companyQueryKey),
  });

  const dashboardCountersQuery = useQuery({
    queryKey:
      billingCustomerKeys.dashboardCounters.overviewSlice(companyQueryKey),
    queryFn: async () => {
      try {
        const response = await GetDashboardCounters({
          crm_company_id: selectedCompanyId,
        });
        return parseOverviewDashboardCounters(response);
      } catch (error) {
        toast.error(
          `Failed to load dashboard counters: ${getErrorMessage(error)}`,
          { toastId: "billing_overview_load_counters_failed" },
        );
        return null;
      }
    },
    enabled: Boolean(companyQueryKey),
  });

  const currencyOptions = currenciesQuery.data ?? [];
  const isLoadingCurrencies =
    Boolean(companyQueryKey) &&
    (currenciesQuery.isPending || currenciesQuery.isFetching);
  const paymentMethods: PaymentMethod[] = paymentMethodsQuery.data ?? [];
  const paymentHistory: OverviewPaymentRow[] = paymentHistoryQuery.data ?? [];
  const recentInvoices: OverviewInvoiceRow[] =
    recentInvoicesQuery.data ?? [];
  const dashboardCounters: OverviewDashboardCounters | null =
    dashboardCountersQuery.data ?? null;

  const isCurrencyLocked = useMemo(() => {
    const profileCurrency =
      customerData?.profile?.currency ?? customerData?.profile?.currency_code;
    if (typeof profileCurrency === "string")
      return profileCurrency.trim() !== "";
    return profileCurrency != null;
  }, [customerData]);

  const selectedCompanyIdRef = useRef(selectedCompanyId);
  selectedCompanyIdRef.current = selectedCompanyId;

  const handleCurrencyChange = useCallback(
    async (nextCurrency: string) => {
      if (isCurrencyLocked) {
        toast.info("Currency is already set and cannot be changed.", {
          toastId: "billing_overview_currency_locked",
        });
        return;
      }
      if (nextCurrency === customerCurrency) return;

      setCustomerCurrency(nextCurrency);
      const companyId = selectedCompanyIdRef.current;
      if (!companyId) return;

      setIsSavingCurrency(true);
      try {
        await ensureCustomerExistsForCrmCompany(companyId);
        if (!mountedRef.current) return;

        const nextProfile = { currency: nextCurrency };
        await updateCustomer(companyId, {
          crm_company_id: companyId,
          profile: nextProfile,
        });
        if (!mountedRef.current) return;

        toast.success("Customer currency updated");

        try {
          const { customer: refreshedCustomer } =
            await ensureCustomerExistsForCrmCompany(companyId);
          if (!mountedRef.current) return;

          const refreshedView = refreshedCustomer as BillingCustomerView;
          setCustomerData(refreshedView);
          setCompanyDetails(refreshedView);
          const refreshedCurrency = String(
            refreshedView.profile?.currency ??
              refreshedView.profile?.currency_code ??
              "",
          );
          setCustomerCurrency(refreshedCurrency);
          void queryClient.invalidateQueries({
            queryKey: billingCustomerKeys.crm(String(companyId)),
          });
          void queryClient.invalidateQueries({
            queryKey: billingCustomerKeys.dashboard.prefix(String(companyId)),
          });
        } catch (refreshErr) {
          if (!mountedRef.current) return;
          toast.error(
            `Updated currency, but failed to refresh customer: ${getErrorMessage(refreshErr)}`,
            { toastId: "billing_overview_refresh_customer_failed" },
          );
        }
      } catch (err) {
        if (!mountedRef.current) return;
        toast.error(`Failed to update currency: ${getErrorMessage(err)}`);
      } finally {
        if (mountedRef.current) setIsSavingCurrency(false);
      }
    },
    [isCurrencyLocked, customerCurrency, queryClient],
  );

  useLayoutEffect(() => {
    if (companyOptions.length === 0) return;
    setSelectedCompanyId((prev) => {
      const hasSelection = !(prev === "" || prev == null);
      if (hasSelection) {
        return prev;
      }
      const firstId = companyOptions[0]?.id;
      return firstId ?? prev;
    });
  }, [companyOptions]);

  useLayoutEffect(() => {
    if (!selectedCompanyId) return;
    setSelectedCompanyName(
      resolveCompanyLabelForToolbar(selectedCompanyId, companyOptions),
    );
  }, [selectedCompanyId, companyOptions]);

  useEffect(() => {
    if (!companyDetails || !showBillingEditModal) return;
    const profile = companyDetails.profile ?? {};
    setBillingInfo({
      name: companyDetails.name || "",
      email: companyDetails.email || "",
      phone: companyDetails.phone || "",
      country:
        companyDetails.country ||
        (typeof profile.country === "string" ? profile.country : "") ||
        "",
      profile: {
        address:
          typeof profile.address === "string" ? profile.address : "",
        postal_code:
          typeof profile.postal_code === "string" ? profile.postal_code : "",
      },
    });
  }, [companyDetails, showBillingEditModal]);

  const countryOptionsStatic = useMemo(() => buildCountrySelectOptions(), []);

  const saveBillingInfo = useCallback(async () => {
    setIsSavingBillingInfo(true);
    try {
      const response = await UpdateCompanyDetails(billingInfoRef.current);
      if (!mountedRef.current) return;

      if (response) {
        toast.success("Billing information updated successfully");
        setShowBillingEditModal(false);
        return;
      }
      toast.error("Failed to update billing information");
    } catch (error) {
      if (!mountedRef.current) return;
      toast.error(
        `Failed to update billing information: ${getErrorMessage(error)}`,
      );
    } finally {
      if (mountedRef.current) setIsSavingBillingInfo(false);
    }
  }, []);

  const openTaxEditModal = useCallback(() => {
    const p = companyDetails?.profile ?? customerData?.profile;
    setTaxForm({
      vat_rate: formatVatRateString(p?.vat_rate),
      vat_exemption: Boolean(p?.vat_exemption),
    });
    setShowTaxEditModal(true);
  }, [companyDetails, customerData]);

  const saveTaxInfo = useCallback(async () => {
    const companyId = selectedCompanyIdRef.current;
    if (!companyId) {
      toast.error("Select a company first");
      return;
    }
    setTaxEditSaving(true);
    try {
      await ensureCustomerExistsForCrmCompany(companyId);
      if (!mountedRef.current) return;

      const form = taxFormRef.current;
      const n = parseVatPercentToClampedNumber(form.vat_rate);
      await updateCustomer(companyId, {
        crm_company_id: companyId,
        profile: {
          vat_rate: formatVatRateString(String(n)),
          vat_exemption: form.vat_exemption,
        },
      });
      if (!mountedRef.current) return;

      toast.success("Tax information updated");
      setShowTaxEditModal(false);

      const { customer } = await ensureCustomerExistsForCrmCompany(companyId);
      if (!mountedRef.current) return;

      const view = customer as BillingCustomerView;
      setCustomerData(view);
      setCompanyDetails(view);
      void queryClient.invalidateQueries({
        queryKey: billingCustomerKeys.crm(String(companyId)),
      });
    } catch (err) {
      if (!mountedRef.current) return;
      toast.error(`Failed to update tax information: ${getErrorMessage(err)}`, {
        toastId: "billing_overview_tax_update_failed",
      });
    } finally {
      if (mountedRef.current) setTaxEditSaving(false);
    }
  }, [queryClient]);

  const goToInvoices = useCallback(() => {
    router.push(BILLING_CUSTOMER_ACCOUNT_OVERVIEW_ROUTES.invoices).then(
      () => undefined,
    );
  }, []);

  const goToBillingSettings = useCallback(() => {
    router.push(BILLING_CUSTOMER_ACCOUNT_OVERVIEW_ROUTES.billingSettings).then(
      () => undefined,
    );
  }, []);

  const goToPaymentHistory = useCallback(() => {
    router.push(BILLING_CUSTOMER_ACCOUNT_OVERVIEW_ROUTES.paymentHistory).then(
      () => undefined,
    );
  }, []);

  const goToSubscriptions = useCallback(() => {
    router.push(BILLING_CUSTOMER_ACCOUNT_OVERVIEW_ROUTES.subscriptions).then(
      () => undefined,
    );
  }, []);

  const handleToolbarCompanyChange = useCallback(
    (next: string | number | "") => {
      setSelectedCompanyId(next === "" ? "" : next);
      if (next !== "" && next != null) {
        setSelectedCompanyName(
          resolveCompanyLabelForToolbar(next, companyOptions),
        );
      } else {
        setSelectedCompanyName("");
      }
    },
    [companyOptions],
  );

  const handleToolbarCurrencyChange = useCallback(
    (nextCurrency: string) => {
      handleCurrencyChange(nextCurrency).catch(() => undefined);
    },
    [handleCurrencyChange],
  );

  const hideBillingEditModal = useCallback(() => {
    setShowBillingEditModal(false);
  }, []);

  const hideTaxEditModal = useCallback(() => {
    setShowTaxEditModal(false);
  }, []);

  const hideManageAccountModal = useCallback(() => {
    setShowManageAccountModal(false);
  }, []);

  const selectedCountryOption = useMemo((): SingleValue<CountrySelectOption> => {
    const profile = companyDetails?.profile ?? {};
    const profileCountry =
      typeof profile.country === "string" ? profile.country : "";
    const countryValue =
      billingInfo.country ||
      companyDetails?.country ||
      profileCountry ||
      "";
    if (!countryValue.trim()) return null;
    const v = countryValue.trim().toLowerCase();
    return (
      countryOptionsStatic.find(
        (opt) =>
          opt.value === countryValue ||
          opt.value.toLowerCase() === v ||
          opt.label.toLowerCase() === v,
      ) ?? null
    );
  }, [
    billingInfo.country,
    companyDetails?.country,
    companyDetails?.profile,
    countryOptionsStatic,
  ]);

  const flushBillingSave = useCallback(() => {
    void saveBillingInfo();
  }, [saveBillingInfo]);

  const flushTaxSave = useCallback(() => {
    void saveTaxInfo();
  }, [saveTaxInfo]);

  const paymentMethodBody = useMemo(
    () =>
      createElement(AccountOverviewPaymentMethodBody, {
        paymentMethods,
        onBillingSettings: goToBillingSettings,
      }),
    [paymentMethods, goToBillingSettings],
  );

  return {
    billingInfo,
    setBillingInfo,
    companyDetails,
    companyOptions,
    selectedCompanyId,
    selectedCompanyName,
    customerCurrency,
    currencyOptions,
    isLoadingCurrencies,
    isLoadingCustomer,
    isSavingCurrency,
    isCurrencyLocked,
    paymentMethods,
    paymentHistory,
    recentInvoices,
    showBillingEditModal,
    showManageAccountModal,
    showTaxEditModal,
    taxEditSaving,
    taxForm,
    setTaxForm,
    isSavingBillingInfo,
    dashboardCounters,
    countryOptionsStatic,
    selectedCountryOption,
    paymentMethodBody,

    handleToolbarCompanyChange,
    handleToolbarCurrencyChange,
    goToInvoices,
    goToBillingSettings,
    goToPaymentHistory,
    goToSubscriptions,
    openTaxEditModal,
    hideBillingEditModal,
    hideTaxEditModal,
    hideManageAccountModal,
    saveBillingInfo,
    saveTaxInfo,
    flushBillingSave,
    flushTaxSave,
  };
}
