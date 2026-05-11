import React, { memo } from "react";
import type { PaymentMethod } from "./accountOverviewTypes";
import { PaymentMethodEmptyState } from "./PaymentMethodEmptyState";

export type AccountOverviewPaymentMethodBodyProps = Readonly<{
  paymentMethods: PaymentMethod[];
  onBillingSettings: () => void;
}>;

export const AccountOverviewPaymentMethodBody = memo(
  function AccountOverviewPaymentMethodBody({
    paymentMethods,
    onBillingSettings,
  }: AccountOverviewPaymentMethodBodyProps) {
  const methods = paymentMethods ?? [];
  const defaultMethod = methods.find((m) => m?.is_default === true);

  if (defaultMethod?.card) {
    return (
      <>
        <div className="d-flex justify-content-between align-items-center py-1 border-bottom">
          <small className="text-muted" style={{ fontSize: "0.75rem" }}>
            Card
          </small>
          <span className="fw-semibold" style={{ fontSize: "0.8rem" }}>
            •••• {defaultMethod.card.last4}
          </span>
        </div>

        <div className="d-flex justify-content-between align-items-center py-1 border-bottom">
          <small className="text-muted" style={{ fontSize: "0.75rem" }}>
            Card Type
          </small>
          <span className="fw-semibold" style={{ fontSize: "0.8rem" }}>
            {defaultMethod.card.brand}
          </span>
        </div>

        <div className="d-flex justify-content-between align-items-center py-1">
          <small className="text-muted" style={{ fontSize: "0.75rem" }}>
            Expiry
          </small>
          <span className="fw-semibold" style={{ fontSize: "0.8rem" }}>
            {defaultMethod.card.exp_month}/{defaultMethod.card.exp_year}
          </span>
        </div>
      </>
    );
  }

  if (methods.length > 0) {
    return (
      <PaymentMethodEmptyState
        message="No default payment method set"
        buttonText="Manage Payment Methods"
        onAction={onBillingSettings}
      />
    );
  }

  return (
    <PaymentMethodEmptyState
      message="No payment method added"
      buttonText="Add Card"
      onAction={onBillingSettings}
    />
  );
});
