import "@components/billings/customer/billingCustomerDatatablePortalStyles";
import React, { ReactElement } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { AccountOverviewBillingEditModal } from "@components/billings/customer/account-overview/AccountOverviewBillingEditModal";
import { AccountOverviewBottomSection } from "@components/billings/customer/account-overview/AccountOverviewBottomSection";
import { AccountOverviewHeroRow } from "@components/billings/customer/account-overview/AccountOverviewHeroRow";
import { AccountOverviewInformationCards } from "@components/billings/customer/account-overview/AccountOverviewInformationCards";
import { AccountOverviewManageAccountModal } from "@components/billings/customer/account-overview/AccountOverviewManageAccountModal";
import { AccountOverviewTaxEditModal } from "@components/billings/customer/account-overview/AccountOverviewTaxEditModal";
import { AccountOverviewToolbar } from "@components/billings/customer/account-overview/AccountOverviewToolbar";
import { useBillingCustomerAccountOverview } from "@hooks/billing/useBillingCustomerAccountOverview";

const CURRENCY_LOCKED_TITLE =
  "Currency is already set and cannot be changed." as const;

const AccountOverview = () => {
  const o = useBillingCustomerAccountOverview();

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Account Overview" />

      <AccountOverviewToolbar
        companyOptions={o.companyOptions}
        selectedCompanyId={o.selectedCompanyId}
        onCompanyChange={o.handleToolbarCompanyChange}
        currencyOptions={o.currencyOptions}
        customerCurrency={o.customerCurrency}
        isLoadingCustomer={o.isLoadingCustomer}
        isLoadingCurrencies={o.isLoadingCurrencies}
        isSavingCurrency={o.isSavingCurrency}
        isCurrencyLocked={o.isCurrencyLocked}
        currencyLockedTitle={CURRENCY_LOCKED_TITLE}
        onCurrencyChange={o.handleToolbarCurrencyChange}
      />

      <div>
        <AccountOverviewHeroRow
          selectedCompanyName={o.selectedCompanyName}
          selectedCompanyId={o.selectedCompanyId}
          companyDetails={o.companyDetails}
          dashboardCounters={o.dashboardCounters}
          onPayNow={o.goToInvoices}
          onViewInvoices={o.goToInvoices}
        />

        <AccountOverviewInformationCards
          selectedCompanyId={o.selectedCompanyId}
          isLoadingCustomer={o.isLoadingCustomer}
          companyDetails={o.companyDetails}
          selectedCompanyName={o.selectedCompanyName}
          onOpenTaxEdit={o.openTaxEditModal}
          paymentMethodBody={o.paymentMethodBody}
        />

        <AccountOverviewBottomSection
          recentInvoices={o.recentInvoices}
          paymentHistory={o.paymentHistory}
          onViewAllInvoices={o.goToInvoices}
          onViewAllPayments={o.goToPaymentHistory}
          onInvoicesStatus={o.goToInvoices}
          onUpdatePaymentMethod={o.goToBillingSettings}
          onViewSubscriptions={o.goToSubscriptions}
        />
      </div>

      <AccountOverviewBillingEditModal
        show={o.showBillingEditModal}
        billingInfo={o.billingInfo}
        selectedCountryOption={o.selectedCountryOption}
        countryOptions={o.countryOptionsStatic}
        isSaving={o.isSavingBillingInfo}
        onHide={o.hideBillingEditModal}
        onBillingChange={o.setBillingInfo}
        onSave={o.flushBillingSave}
      />

      <AccountOverviewTaxEditModal
        show={o.showTaxEditModal}
        taxEditSaving={o.taxEditSaving}
        taxForm={o.taxForm}
        onHide={o.hideTaxEditModal}
        onTaxFormChange={o.setTaxForm}
        onSave={o.flushTaxSave}
      />

      <AccountOverviewManageAccountModal
        show={o.showManageAccountModal}
        billingInfo={o.billingInfo}
        onHide={o.hideManageAccountModal}
        onBillingChange={o.setBillingInfo}
      />
    </React.Fragment>
  );
};

AccountOverview.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default AccountOverview;
