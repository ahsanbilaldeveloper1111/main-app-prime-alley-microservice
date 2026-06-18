import type { CompanyConfigPolicyPanelProps } from "@page-modules/workforce/company-config/companyConfigPanelTypes";
import { GracePeriodPolicyForm } from "@page-modules/workforce/company-config/GracePeriodPolicyForm";
import {
  createDefaultGracePeriodPolicyFormState,
  formatGracePeriodPolicyUpdatedAt,
  validateGracePeriodPolicyForm,
  gracePeriodPolicyToFormState,
  type GracePeriodPolicyFormState,
} from "@page-modules/workforce/company-config/gracePeriodDomain";
import { useCreateGracePeriodPolicyMutation } from "@page-modules/workforce/company-config/useCreateGracePeriodPolicyMutation";
import { useGracePeriodPolicyQuery } from "@page-modules/workforce/company-config/useGracePeriodPolicyQuery";
import React, { useCallback, useEffect, useState } from "react";
import { Button, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";

export function GracePeriodPolicyPanel({
  resolvedTenantId,
  isTenantListReady,
}: CompanyConfigPolicyPanelProps) {
  const [form, setForm] = useState<GracePeriodPolicyFormState>(
    createDefaultGracePeriodPolicyFormState,
  );
  const [formHydrated, setFormHydrated] = useState(false);

  const createGracePeriodPolicyMutation = useCreateGracePeriodPolicyMutation();

  const gracePeriodPolicyQuery = useGracePeriodPolicyQuery({
    tenantId: resolvedTenantId || null,
    enabled: isTenantListReady,
  });

  useEffect(() => {
    setFormHydrated(false);
    setForm(createDefaultGracePeriodPolicyFormState());
  }, [resolvedTenantId]);

  useEffect(() => {
    if (!resolvedTenantId || gracePeriodPolicyQuery.isLoading) {
      return;
    }
    setForm(gracePeriodPolicyToFormState(gracePeriodPolicyQuery.data));
    setFormHydrated(true);
  }, [
    resolvedTenantId,
    gracePeriodPolicyQuery.data,
    gracePeriodPolicyQuery.dataUpdatedAt,
    gracePeriodPolicyQuery.isLoading,
  ]);

  const handleSave = useCallback(() => {
    const validationError = validateGracePeriodPolicyForm(form, resolvedTenantId);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    createGracePeriodPolicyMutation.mutate({ tenantId: resolvedTenantId, form });
  }, [resolvedTenantId, form, createGracePeriodPolicyMutation]);

  const isSaving = createGracePeriodPolicyMutation.isPending;
  const fieldsDisabled =
    !resolvedTenantId || gracePeriodPolicyQuery.isLoading || isSaving || formHydrated === false;
  const lastUpdatedLabel = formatGracePeriodPolicyUpdatedAt(
    gracePeriodPolicyQuery.data?.updated_at,
  );

  if (!resolvedTenantId) {
    return (
      <p className="company-config-panel__hint">Select a tenant to load grace period policy.</p>
    );
  }

  if (gracePeriodPolicyQuery.isError) {
    return (
      <div className="company-config-panel__status company-config-panel__status--error">
        <p>Failed to load grace period policy.</p>
        <Button
          type="button"
          variant="outline-secondary"
          size="sm"
          onClick={() => gracePeriodPolicyQuery.refetch()}
        >
          Retry
        </Button>
      </div>
    );
  }

  if (gracePeriodPolicyQuery.isLoading && formHydrated === false) {
    return (
      <div className="company-config-panel__status" aria-live="polite">
        <Spinner animation="border" size="sm" role="status" className="me-2" />
        Loading grace period policy…
      </div>
    );
  }

  if (!formHydrated) {
    return null;
  }

  return (
    <div className="company-config-panel__card">
      {gracePeriodPolicyQuery.data == null ? (
        <p className="company-config-panel__hint">
          No grace period policy saved yet — configure values below and save.
        </p>
      ) : null}

      <GracePeriodPolicyForm form={form} disabled={fieldsDisabled} onChange={setForm} />

      {lastUpdatedLabel ? (
        <p className="company-config-panel__meta">Last updated: {lastUpdatedLabel}</p>
      ) : null}

      <div className="company-config-panel__actions">
        <Button type="button" variant="primary" disabled={fieldsDisabled} onClick={handleSave}>
          {isSaving ? "Saving…" : "Save policy"}
        </Button>
      </div>
    </div>
  );
}
