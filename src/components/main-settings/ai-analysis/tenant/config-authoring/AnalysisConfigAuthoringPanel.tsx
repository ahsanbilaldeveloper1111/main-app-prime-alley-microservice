import React, { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";

import {
  AnalysisCompanyConfigValidationError,
  type AnalysisConfigValidationIssue,
} from "@utils/aiAnalytics";

import { AnalysisFormSkeleton } from "../../shared/AnalysisFormSkeleton";
import { formatAnalysisLastUpdated } from "../../shared/formatAnalysisTimestamp";
import { ConfigAuthoringFormSections } from "./ConfigAuthoringFormSections";
import { ConfigAuthoringIssuesPanel } from "./ConfigAuthoringIssuesPanel";
import { validateConfigAuthoringForm } from "./mapCompanyConfig";
import type { ConfigAuthoringFormValues } from "./types";
import { defaultConfigAuthoringFormValues } from "./types";
import { useAnalysisCompanyConfigQuery } from "./useAnalysisCompanyConfigQuery";
import { useUpdateAnalysisCompanyConfigMutation } from "./useUpdateAnalysisCompanyConfigMutation";

const CONFIG_SKELETON_FIELDS = [
  { id: "config-stated-industry" },
  { id: "config-authored-by" },
];

function resolveSessionAuthor(user: unknown): string {
  if (!user || typeof user !== "object") {
    return "";
  }
  const record = user as Record<string, unknown>;
  const name = record.name;
  if (typeof name === "string" && name.trim()) {
    return name.trim();
  }
  const email = record.email;
  if (typeof email === "string" && email.trim()) {
    return email.trim();
  }
  return "";
}

function ConfigMetadata(props: Readonly<{
  companyId: string;
  inferredIndustry: string | null;
  configSha256: string | null;
  registryVersion: string | null;
  updatedAt: string | null;
}>) {
  const lastUpdated = formatAnalysisLastUpdated(props.updatedAt);
  return (
    <div className="ai-analysis-tenant-config__config-meta">
      <p>
        <span className="ai-analysis-tenant-config__config-meta-label">Company ID</span>
        {props.companyId}
      </p>
      {props.inferredIndustry ? (
        <p>
          <span className="ai-analysis-tenant-config__config-meta-label">
            Inferred industry
          </span>
          {props.inferredIndustry}
        </p>
      ) : null}
      {props.configSha256 ? (
        <p>
          <span className="ai-analysis-tenant-config__config-meta-label">Config SHA256</span>
          <code>{props.configSha256}</code>
        </p>
      ) : null}
      {props.registryVersion ? (
        <p>
          <span className="ai-analysis-tenant-config__config-meta-label">
            Registry version
          </span>
          {props.registryVersion}
        </p>
      ) : null}
      {lastUpdated ? (
        <p>
          <span className="ai-analysis-tenant-config__config-meta-label">Last updated</span>
          {lastUpdated}
        </p>
      ) : null}
    </div>
  );
}

export const AnalysisConfigAuthoringPanel: React.FC<
  Readonly<{
    appliedCompanyId: string;
    appliedCompanyLabel: string;
  }>
> = ({ appliedCompanyId, appliedCompanyLabel }) => {
  const { data: session } = useSession();
  const sessionAuthor = resolveSessionAuthor(session?.user);

  const configQuery = useAnalysisCompanyConfigQuery(
    appliedCompanyId,
    sessionAuthor,
    Boolean(appliedCompanyId),
  );
  const saveMutation = useUpdateAnalysisCompanyConfigMutation(appliedCompanyId);

  const {
    data: configData,
    formValues: fetchedFormValues,
    isLoading: configLoading,
    isError: configError,
    isSuccess: configLoaded,
    refetch: refetchConfig,
    dataUpdatedAt,
    companyId: queryCompanyId,
    updatedAt,
    hasApiData,
  } = configQuery;

  const [values, setValues] = useState<ConfigAuthoringFormValues>(
    defaultConfigAuthoringFormValues(sessionAuthor),
  );
  const [formHydrated, setFormHydrated] = useState(false);
  const [saveWarnings, setSaveWarnings] = useState<AnalysisConfigValidationIssue[]>(
    [],
  );
  const [saveErrors, setSaveErrors] = useState<AnalysisConfigValidationIssue[]>([]);

  useEffect(() => {
    setValues(defaultConfigAuthoringFormValues(sessionAuthor));
    setFormHydrated(false);
    setSaveWarnings([]);
    setSaveErrors([]);
  }, [appliedCompanyId, sessionAuthor]);

  useEffect(() => {
    if (
      appliedCompanyId &&
      queryCompanyId === appliedCompanyId &&
      configLoading === false
    ) {
      setValues(fetchedFormValues);
      setFormHydrated(true);
    }
  }, [
    appliedCompanyId,
    queryCompanyId,
    dataUpdatedAt,
    fetchedFormValues,
    configLoading,
  ]);

  const handleSave = useCallback(() => {
    setSaveWarnings([]);
    setSaveErrors([]);

    const validationError = validateConfigAuthoringForm(values);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    saveMutation.mutate(values, {
      onSuccess: (result) => {
        setSaveWarnings(result.warnings);
        setSaveErrors([]);
      },
      onError: (error: unknown) => {
        if (error instanceof AnalysisCompanyConfigValidationError) {
          setSaveErrors(error.issues);
          setSaveWarnings([]);
          toast.error(error.message);
          return;
        }
        setSaveErrors([]);
      },
    });
  }, [saveMutation, values]);

  const isSaving = saveMutation.isPending;
  const fieldsDisabled = configLoading || isSaving || formHydrated === false;

  if (!appliedCompanyId) {
    return (
      <p className="ai-analysis-tenant-config__hint">
        Select a company and apply the filter to edit config authoring.
      </p>
    );
  }

  if (configLoading && formHydrated === false) {
    return <AnalysisFormSkeleton fields={CONFIG_SKELETON_FIELDS} />;
  }

  if (configError) {
    return (
      <p className="ai-analysis-tenant-config__hint">
        Could not load company config.{" "}
        <button
          type="button"
          className="btn btn-link p-0 align-baseline"
          onClick={() => {
            refetchConfig().catch(() => undefined);
          }}
        >
          Retry
        </button>
      </p>
    );
  }

  if (!configLoaded || !formHydrated) {
    return null;
  }

  return (
    <>
      {hasApiData ? null : (
        <p className="ai-analysis-tenant-config__hint">
          No config returned for <strong>{appliedCompanyLabel}</strong> — define
          values below and save to create config.
        </p>
      )}

      <ConfigMetadata
        companyId={configData?.company_id || appliedCompanyId}
        inferredIndustry={configData?.inferred_industry ?? null}
        configSha256={configData?.config_sha256 ?? null}
        registryVersion={configData?.registry_version ?? null}
        updatedAt={updatedAt}
      />

      <ConfigAuthoringIssuesPanel
        title="Validation blocked"
        issues={saveErrors}
        variant="error"
      />
      <ConfigAuthoringIssuesPanel
        title="Save warnings"
        issues={saveWarnings}
        variant="warning"
      />

      <ConfigAuthoringFormSections
        values={values}
        disabled={fieldsDisabled}
        onChange={setValues}
      />

      <button
        type="button"
        className="ai-analysis-tenant-config__save"
        onClick={handleSave}
        disabled={isSaving || fieldsDisabled}
      >
        {isSaving ? "Saving…" : "Save config"}
      </button>
    </>
  );
};
