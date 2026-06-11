import React, { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";

import {
  AnalysisFormSkeleton,
  tenantFormSkeletonFields,
} from "../shared/AnalysisFormSkeleton";
import { formatAnalysisLastUpdated } from "../shared/formatAnalysisTimestamp";
import { TenantField } from "./AnalysisTenantShared";
import { validateAnalysisTenantForm } from "./mapAnalysisTenant";
import type { AnalysisTenantFormValues } from "./types";
import { defaultAnalysisTenantFormValues } from "./types";
import type { useAIAnalysisTenantPage } from "./useAIAnalysisTenantPage";

type TenantPageState = ReturnType<typeof useAIAnalysisTenantPage>;

export const AnalysisTenantSettingsPanel: React.FC<
  Readonly<{
    appliedTenantId: string;
    appliedCompanyLabel: string;
    tenantQuery: TenantPageState["tenantQuery"];
    saveMutation: TenantPageState["saveMutation"];
  }>
> = ({ appliedTenantId, appliedCompanyLabel, tenantQuery, saveMutation }) => {
  const {
    data: tenantData,
    formValues: fetchedFormValues,
    isLoading: tenantLoading,
    isError: tenantError,
    isSuccess: tenantLoaded,
    refetch: refetchTenant,
    dataUpdatedAt,
    tenantId: queryTenantId,
    updatedAt,
    hasApiData,
  } = tenantQuery;

  const [values, setValues] = useState<AnalysisTenantFormValues>(
    defaultAnalysisTenantFormValues(),
  );
  const [formHydrated, setFormHydrated] = useState(false);

  useEffect(() => {
    setValues(defaultAnalysisTenantFormValues(appliedTenantId, appliedCompanyLabel));
    setFormHydrated(false);
  }, [appliedTenantId]);

  useEffect(() => {
    if (
      appliedTenantId &&
      queryTenantId === appliedTenantId &&
      tenantLoading === false
    ) {
      setValues(fetchedFormValues);
      setFormHydrated(true);
    }
  }, [
    appliedTenantId,
    queryTenantId,
    dataUpdatedAt,
    fetchedFormValues,
    tenantLoading,
  ]);

  const handleSave = useCallback(() => {
    const validationError = validateAnalysisTenantForm(values, tenantData ?? null);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    saveMutation.mutate(values);
  }, [saveMutation, tenantData, values]);

  const isSaving = saveMutation.isPending;
  const fieldsDisabled = tenantLoading || isSaving || formHydrated === false;
  const lastUpdatedLabel = formatAnalysisLastUpdated(updatedAt);

  if (!appliedTenantId) {
    return (
      <p className="ai-analysis-tenant-config__hint">
        Select a company and apply the filter to edit tenant settings.
      </p>
    );
  }

  if (tenantLoading && formHydrated === false) {
    return <AnalysisFormSkeleton fields={tenantFormSkeletonFields()} />;
  }

  if (tenantError) {
    return (
      <p className="ai-analysis-tenant-config__hint">
        Could not load tenant settings.{" "}
        <button
          type="button"
          className="btn btn-link p-0 align-baseline"
          onClick={() => {
            refetchTenant().catch(() => undefined);
          }}
        >
          Retry
        </button>
      </p>
    );
  }

  if (!tenantLoaded || !formHydrated) {
    return null;
  }

  return (
    <>
      {hasApiData ? null : (
        <p className="ai-analysis-tenant-config__hint">
          No tenant settings returned — enter values and save to create settings.
        </p>
      )}

      <div key={appliedTenantId} className="ai-analysis-tenant-config__grid">
        <TenantField
          label="Company ID"
          value={values.tenantId || appliedTenantId}
          readOnly
        />
        <TenantField
          label="Name"
          value={values.name || appliedCompanyLabel}
          disabled={fieldsDisabled}
          onChange={(v) => setValues((prev) => ({ ...prev, name: v }))}
        />
        <TenantField
          label="Industry type"
          value={values.industryType}
          disabled={fieldsDisabled}
          onChange={(v) => setValues((prev) => ({ ...prev, industryType: v }))}
        />
        <TenantField
          label="Primary language"
          value={values.primaryLanguage}
          disabled={fieldsDisabled}
          onChange={(v) =>
            setValues((prev) => ({ ...prev, primaryLanguage: v }))
          }
        />
        <TenantField
          label="Monthly call limit"
          value={values.monthlyCallLimit}
          type="number"
          step="1"
          hint="Leave empty for unlimited"
          disabled={fieldsDisabled}
          onChange={(v) =>
            setValues((prev) => ({ ...prev, monthlyCallLimit: v }))
          }
        />
        <TenantField
          label="Alert threshold %"
          value={values.alertThresholdPct}
          type="number"
          step="1"
          hint="0–100"
          disabled={fieldsDisabled}
          onChange={(v) =>
            setValues((prev) => ({ ...prev, alertThresholdPct: v }))
          }
        />
        <TenantField
          label="Cost limit USD"
          value={values.costLimitUsd}
          type="number"
          step="0.01"
          disabled={fieldsDisabled}
          onChange={(v) => setValues((prev) => ({ ...prev, costLimitUsd: v }))}
        />
        <TenantField
          label="$ per call"
          value={values.costPerCallUsd}
          type="number"
          step="0.000001"
          hint="Empty = use global pricing"
          disabled={fieldsDisabled}
          onChange={(v) => setValues((prev) => ({ ...prev, costPerCallUsd: v }))}
        />
        <TenantField
          label="$ per 1M input tokens"
          value={values.costPer1MInputTokensUsd}
          type="number"
          step="0.000001"
          hint="Empty = use global pricing"
          disabled={fieldsDisabled}
          onChange={(v) =>
            setValues((prev) => ({ ...prev, costPer1MInputTokensUsd: v }))
          }
        />
        <TenantField
          label="$ per 1M output tokens"
          value={values.costPer1MOutputTokensUsd}
          type="number"
          step="0.000001"
          hint="Empty = use global pricing"
          disabled={fieldsDisabled}
          onChange={(v) =>
            setValues((prev) => ({ ...prev, costPer1MOutputTokensUsd: v }))
          }
        />
      </div>

      {lastUpdatedLabel ? (
        <p className="ai-analysis-tenant-config__meta">
          Last updated: {lastUpdatedLabel}
        </p>
      ) : null}

      <button
        type="button"
        className="ai-analysis-tenant-config__save"
        onClick={handleSave}
        disabled={isSaving || fieldsDisabled}
      >
        {isSaving ? "Saving…" : "Save"}
      </button>
    </>
  );
};
