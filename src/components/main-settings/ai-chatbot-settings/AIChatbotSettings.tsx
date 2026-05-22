import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "react-bootstrap";
import { Filter } from "lucide-react";
import Select from "react-select";
import { HEADER_CONSTANTS } from "@constants/headerConstants";
import { usePermissions } from "@utils/permissionUtils";
import { toast } from "react-toastify";

import "./aiChatbotSettings.scss";

const { PERMISSIONS } = HEADER_CONSTANTS;

import type {
  AIChatbotModelOption,
  AIChatbotSettingsFormValues,
} from "./types";
import { defaultAIChatbotSettingsFormValues } from "./types";
import {
  formatTenantMarginPctDisplay,
  resolvePricingForModel,
  validateAIChatbotSettingsForm,
  type TenantChatPricingTable,
} from "./mapTenantChatSettings";
import type { ChatCompanyOption } from "@page-modules/chat/useChatCompaniesQuery";
import { AI_CHATBOT_FIELD_PLACEHOLDERS } from "./constants";
import { AIChatbotSettingsFormSkeleton } from "./AIChatbotSettingsFormSkeleton";
import { AIChatbotSettingsHistoryPanel } from "./AIChatbotSettingsHistoryPanel";
import { ModelPricingDefaultsTable } from "./ModelPricingDefaultsTable";
import {
  AI_CHATBOT_SETTINGS_INNER_TABS,
  type AIChatbotSettingsInnerTab,
} from "./tenantSettingsHistoryTypes";
import { PerUserBudgetOverridesSection } from "./PerUserBudgetOverridesSection";
import {
  formatTenantCompanyBudgetTotal,
  tenantCompanyBudgetTotalHint,
} from "./tenantCompanyBudgetTotal";
import { useAIChatbotSettingsPage } from "./useAIChatbotSettingsPage";
import { useChatTenantSettingsHistory } from "./useChatTenantSettingsHistory";
import { useMainSettingsUsersForChatbotQuery } from "./useMainSettingsUsersForChatbotQuery";

type CompanySelectOption = { value: string; label: string };

function CompanyFilterBar(
  props: Readonly<{
    companiesLoading: boolean;
    companyOptions: CompanySelectOption[];
    selectedCompanyOption: CompanySelectOption | null;
    onCompanySelect: (companyId: string) => void;
    onApplyFilter: () => void;
    appliedCompanyLabel?: string;
  }>,
) {
  const {
    companiesLoading,
    companyOptions,
    selectedCompanyOption,
    onCompanySelect,
    onApplyFilter,
    appliedCompanyLabel,
  } = props;

  return (
    <div className="ai-chatbot-settings__company-filter">
      <div className="ai-chatbot-settings__company-select">
        <span className="ai-chatbot-settings__field-label">Company</span>
        <Select<CompanySelectOption>
          isLoading={companiesLoading}
          options={companyOptions}
          value={selectedCompanyOption}
          onChange={(opt) => onCompanySelect(opt?.value ?? "")}
          placeholder="Select company..."
          isClearable
          classNamePrefix="ai-chatbot-company"
        />
      </div>
      <Button
        type="button"
        variant="primary"
        className="ai-chatbot-settings__filter-btn"
        onClick={onApplyFilter}
      >
        <Filter size={16} className="me-2" aria-hidden />
        Filter
      </Button>
      {appliedCompanyLabel ? (
        <p className="ai-chatbot-settings__company-active">
          Viewing: <strong>{appliedCompanyLabel}</strong>
        </p>
      ) : null}
    </div>
  );
}

function buildModelSelectOptions(
  apiOptions: AIChatbotModelOption[],
  selectedValue: string,
): AIChatbotModelOption[] {
  const seen = new Set<string>();
  const options: AIChatbotModelOption[] = [];

  const add = (value: string, label: string) => {
    const trimmed = value.trim();
    if (!trimmed || seen.has(trimmed)) return;
    seen.add(trimmed);
    options.push({ value: trimmed, label });
  };

  for (const opt of apiOptions) {
    add(opt.value, opt.label);
  }

  if (selectedValue.trim()) {
    add(selectedValue, selectedValue);
  }

  return options;
}

function NumberField(
  props: Readonly<{
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    min?: number;
    max?: number;
    step?: number | string;
    disabled?: boolean;
  }>,
) {
  const {
    label,
    value,
    onChange,
    placeholder,
    min = 0,
    max,
    step = 1,
    disabled = false,
  } = props;
  return (
    <label className="ai-chatbot-settings__field">
      <span className="ai-chatbot-settings__field-label">{label}</span>
      <input
        type="number"
        className="ai-chatbot-settings__input"
        min={min}
        max={max}
        step={step}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function ReadonlyField(props: Readonly<{ label: string; value: string }>) {
  const { label, value } = props;
  return (
    <div className="ai-chatbot-settings__field">
      <span className="ai-chatbot-settings__field-label">{label}</span>
      <p className="ai-chatbot-settings__readonly-value">{value}</p>
    </div>
  );
}

function AIChatbotSettingsInnerTabs(
  props: Readonly<{
    activeTab: AIChatbotSettingsInnerTab;
    onSelectTab: (tab: AIChatbotSettingsInnerTab) => void;
  }>,
) {
  const { activeTab, onSelectTab } = props;
  return (
    <div className="ai-chatbot-settings__inner-tab-row" role="tablist">
      {AI_CHATBOT_SETTINGS_INNER_TABS.map((tab, index) => {
        const isActive = activeTab === tab.id;
        const isLast = index === AI_CHATBOT_SETTINGS_INNER_TABS.length - 1;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelectTab(tab.id)}
            className={[
              "ai-chatbot-settings__inner-tab-btn",
              isActive ? "ai-chatbot-settings__inner-tab-btn--active" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            style={isLast ? { borderRight: "1px solid #e0e0e0" } : undefined}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

function AIChatbotCompanyHeader(
  props: Readonly<{
    showCompanyFilter: boolean;
    companiesLoading: boolean;
    companyOptions: CompanySelectOption[];
    selectedCompanyOption: CompanySelectOption | null;
    onCompanySelect: (companyId: string) => void;
    onApplyFilter: () => void;
    viewingCompanyLabel?: string;
  }>,
): React.ReactNode {
  if (props.showCompanyFilter) {
    return (
      <CompanyFilterBar
        companiesLoading={props.companiesLoading}
        companyOptions={props.companyOptions}
        selectedCompanyOption={props.selectedCompanyOption}
        onCompanySelect={props.onCompanySelect}
        onApplyFilter={props.onApplyFilter}
        appliedCompanyLabel={props.viewingCompanyLabel}
      />
    );
  }
  if (props.viewingCompanyLabel) {
    return (
      <p className="ai-chatbot-settings__company-active">
        Viewing: <strong>{props.viewingCompanyLabel}</strong>
      </p>
    );
  }
  return null;
}

function AIChatbotSettingsNoTenantView(
  props: Readonly<{
    showCompanyFilter: boolean;
    companiesLoading: boolean;
    companyOptions: CompanySelectOption[];
    selectedCompanyOption: CompanySelectOption | null;
    onCompanySelect: (companyId: string) => void;
    onApplyFilter: () => void;
    innerTab: AIChatbotSettingsInnerTab;
    onSelectTab: (tab: AIChatbotSettingsInnerTab) => void;
  }>,
): React.ReactElement {
  const hint = props.showCompanyFilter
    ? "Select a company to load settings."
    : "Your account is not linked to a company. Contact an administrator.";

  return (
    <div className="ai-chatbot-settings">
      {props.showCompanyFilter ? (
        <CompanyFilterBar
          companiesLoading={props.companiesLoading}
          companyOptions={props.companyOptions}
          selectedCompanyOption={props.selectedCompanyOption}
          onCompanySelect={props.onCompanySelect}
          onApplyFilter={props.onApplyFilter}
        />
      ) : null}
      <AIChatbotSettingsInnerTabs
        activeTab={props.innerTab}
        onSelectTab={props.onSelectTab}
      />
      <p className="ai-chatbot-settings__hint">{hint}</p>
    </div>
  );
}

type AIChatbotSettingsFormContentProps = Readonly<{
  values: AIChatbotSettingsFormValues;
  fieldsDisabled: boolean;
  canEditSettings: boolean;
  isSaving: boolean;
  isError: boolean;
  hasApiData: boolean;
  formHydrated: boolean;
  appliedTenantId: string;
  innerTab: AIChatbotSettingsInnerTab;
  companies: ChatCompanyOption[];
  modelSelectOptions: AIChatbotModelOption[];
  pricingTable: TenantChatPricingTable;
  totalCompanyBudgetLabel: string;
  totalCompanyBudgetHint: string;
  onRetry: () => void;
  onSave: () => void;
  onModelChange: (model: string) => void;
  onMarginChange: (value: string) => void;
  updateRateLimit: (
    key: keyof AIChatbotSettingsFormValues["rateLimits"],
    next: string,
  ) => void;
  updateBudget: (
    key: keyof AIChatbotSettingsFormValues["budget"],
    next: string,
  ) => void;
  updatePricing: (
    key: keyof AIChatbotSettingsFormValues["pricing"],
    next: string,
  ) => void;
}>;

function AIChatbotSettingsFormContent(
  props: AIChatbotSettingsFormContentProps,
): React.ReactElement {
  const {
    values,
    fieldsDisabled,
    canEditSettings,
    isSaving,
    isError,
    hasApiData,
    formHydrated,
    appliedTenantId,
    innerTab,
    companies,
    modelSelectOptions,
    totalCompanyBudgetLabel,
    totalCompanyBudgetHint,
    onRetry,
    onSave,
    onModelChange,
    onMarginChange,
    updateRateLimit,
    updateBudget,
    updatePricing,
  } = props;

  return (
    <>
      {isError ? (
        <p className="ai-chatbot-settings__status">
          Could not load settings. Using defaults.{" "}
          <button
            type="button"
            className="ai-chatbot-settings__retry"
            onClick={onRetry}
          >
            Retry
          </button>
        </p>
      ) : null}

      {!isError && !hasApiData && formHydrated ? (
        <p className="ai-chatbot-settings__hint">
          No settings returned — using built-in defaults.
        </p>
      ) : null}

      <div className="ai-chatbot-settings__section">
        <p className="ai-chatbot-settings__row-label">Rate limits</p>
        <div className="ai-chatbot-settings__grid-2">
          <NumberField
            label="User / min"
            value={values.rateLimits.perUserPerMinute}
            onChange={(v) => updateRateLimit("perUserPerMinute", v)}
            placeholder={
              AI_CHATBOT_FIELD_PLACEHOLDERS.rateLimits.perUserPerMinute
            }
            disabled={fieldsDisabled}
          />
        </div>
      </div>

      <div className="ai-chatbot-settings__section">
        <p className="ai-chatbot-settings__row-label">
          Default per user budget
        </p>
        <div className="ai-chatbot-settings__grid-2">
          <NumberField
            label="Default per user budget (USD)"
            value={values.budget.defaultUserBudgetUsd}
            onChange={(v) => updateBudget("defaultUserBudgetUsd", v)}
            placeholder={
              AI_CHATBOT_FIELD_PLACEHOLDERS.budget.defaultUserBudgetUsd
            }
            step="0.01"
            min={0}
            disabled={fieldsDisabled}
          />
          <NumberField
            label="Default alert threshold (%)"
            value={values.budget.defaultBudgetThresholdPct}
            onChange={(v) => updateBudget("defaultBudgetThresholdPct", v)}
            placeholder={
              AI_CHATBOT_FIELD_PLACEHOLDERS.budget.defaultBudgetThresholdPct
            }
            min={0}
            max={100}
            step="1"
            disabled={fieldsDisabled}
          />
          <ReadonlyField
            label="Total company budget this month (USD)"
            value={totalCompanyBudgetLabel}
          />
        </div>
        <p className="ai-chatbot-settings__hint">
          Applied as the default monthly cap for users without their own
          budget. Alert threshold triggers when a user&apos;s spend reaches
          this percentage of their cap.
        </p>
        <p className="ai-chatbot-settings__hint">{totalCompanyBudgetHint}</p>
      </div>

      <PerUserBudgetOverridesSection
        tenantId={appliedTenantId}
        companies={companies}
        enabled={innerTab === "settings" && Boolean(appliedTenantId)}
        canEdit={canEditSettings}
      />

      <div className="ai-chatbot-settings__section">
        <p className="ai-chatbot-settings__row-label">Model & pricing</p>
        <div className="ai-chatbot-settings__grid-2 mb-3">
          {canEditSettings ? (
            <NumberField
              label="Cost margin (%)"
              value={values.marginPct}
              onChange={onMarginChange}
              placeholder={AI_CHATBOT_FIELD_PLACEHOLDERS.marginPct}
              step="0.01"
              min={0}
              disabled={fieldsDisabled}
            />
          ) : (
            <ReadonlyField
              label="Cost margin (%)"
              value={formatTenantMarginPctDisplay(values.marginPct)}
            />
          )}
        </div>
        <p className="ai-chatbot-settings__hint mb-3">
          Margin is added on top of base LLM cost when computing tenant-facing
          rates and thread costs. Leave blank for no margin. Tenants only see
          effective prices on the dashboard, not this percentage or base costs.
        </p>
        <div className="ai-chatbot-settings__grid-3">
          <label className="ai-chatbot-settings__field">
            <span className="ai-chatbot-settings__field-label">
              OpenAI model
            </span>
            <select
              className="ai-chatbot-settings__select"
              value={values.openAiModel}
              disabled={fieldsDisabled}
              onChange={(e) => onModelChange(e.target.value)}
            >
              <option value="">Select model…</option>
              {modelSelectOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <NumberField
            label="Input $ / 1M tokens"
            value={values.pricing.inputCostPerMillion}
            onChange={(v) => updatePricing("inputCostPerMillion", v)}
            placeholder={
              AI_CHATBOT_FIELD_PLACEHOLDERS.pricing.inputCostPerMillion
            }
            step="0.000001"
            min={0}
            disabled={fieldsDisabled}
          />
          <NumberField
            label="Output $ / 1M tokens"
            value={values.pricing.outputCostPerMillion}
            onChange={(v) => updatePricing("outputCostPerMillion", v)}
            placeholder={
              AI_CHATBOT_FIELD_PLACEHOLDERS.pricing.outputCostPerMillion
            }
            step="0.000001"
            min={0}
            disabled={fieldsDisabled}
          />
        </div>
      </div>

      <ModelPricingDefaultsTable pricingTable={props.pricingTable} />

      {canEditSettings ? (
        <button
          type="button"
          className="ai-chatbot-settings__save"
          onClick={onSave}
          disabled={isSaving || fieldsDisabled}
        >
          {isSaving ? "Saving…" : "Save"}
        </button>
      ) : (
        <p className="ai-chatbot-settings__hint">
          You have view-only access to tenant settings.
        </p>
      )}
    </>
  );
}

export const AIChatbotSettings: React.FC = () => {
  const { hasPermission } = usePermissions();
  const canEditSettings = hasPermission(
    PERMISSIONS.EDIT_TENANT_SETTINGS_AI_CHAT,
  );

  const [innerTab, setInnerTab] =
    useState<AIChatbotSettingsInnerTab>("settings");

  const {
    showCompanyFilter,
    companiesLoading,
    companyOptions,
    selectedCompanyOption,
    viewingCompanyLabel,
    appliedTenantId,
    companies,
    handleCompanySelect,
    handleApplyFilter,
    settingsQuery,
    saveMutation,
  } = useAIChatbotSettingsPage();

  const historyCtx = useChatTenantSettingsHistory(
    appliedTenantId,
    innerTab === "history",
  );
  const { resetFiltersForTenant } = historyCtx;

  const {
    tenantId: queryTenantId,
    dataUpdatedAt,
    formValues: fetchedFormValues,
    modelOptions,
    pricingTable,
    rawSettings,
    isLoading,
    isError,
    refetch,
    hasApiData,
  } = settingsQuery;

  const [values, setValues] = useState<AIChatbotSettingsFormValues>(
    defaultAIChatbotSettingsFormValues(),
  );
  const [formHydrated, setFormHydrated] = useState(false);

  useEffect(() => {
    setValues(defaultAIChatbotSettingsFormValues());
    setFormHydrated(false);
    setInnerTab("settings");
    resetFiltersForTenant();
  }, [appliedTenantId, resetFiltersForTenant]);

  useEffect(() => {
    if (!appliedTenantId || queryTenantId !== appliedTenantId || isLoading) {
      return;
    }
    const next = fetchedFormValues ?? defaultAIChatbotSettingsFormValues();
    setValues(next);
    setFormHydrated(true);
  }, [
    appliedTenantId,
    queryTenantId,
    dataUpdatedAt,
    fetchedFormValues,
    isLoading,
  ]);

  const updateRateLimit = useCallback(
    (key: keyof AIChatbotSettingsFormValues["rateLimits"], next: string) => {
      setValues((prev) => ({
        ...prev,
        rateLimits: { ...prev.rateLimits, [key]: next },
      }));
    },
    [],
  );

  const updateBudget = useCallback(
    (key: keyof AIChatbotSettingsFormValues["budget"], next: string) => {
      setValues((prev) => ({
        ...prev,
        budget: { ...prev.budget, [key]: next },
      }));
    },
    [],
  );

  const updatePricing = useCallback(
    (key: keyof AIChatbotSettingsFormValues["pricing"], next: string) => {
      setValues((prev) => ({
        ...prev,
        pricing: { ...prev.pricing, [key]: next },
      }));
    },
    [],
  );

  const handleSave = useCallback(() => {
    if (!canEditSettings) {
      toast.error("You do not have permission to edit tenant settings.");
      return;
    }
    const validationError = validateAIChatbotSettingsForm(
      values,
      appliedTenantId,
    );
    if (validationError) {
      toast.error(validationError);
      return;
    }
    saveMutation.mutate(values);
  }, [appliedTenantId, canEditSettings, saveMutation, values]);

  const handleModelChange = useCallback(
    (model: string) => {
      const pricing = model
        ? resolvePricingForModel(rawSettings, model)
        : null;
      setValues((prev) => ({
        ...prev,
        openAiModel: model,
        pricing: pricing
          ? {
              inputCostPerMillion: pricing.inputCostPerMillion,
              outputCostPerMillion: pricing.outputCostPerMillion,
            }
          : prev.pricing,
      }));
    },
    [rawSettings],
  );

  const handleMarginChange = useCallback((marginPct: string) => {
    setValues((prev) => ({ ...prev, marginPct }));
  }, []);

  const handleRetry = useCallback(() => {
    refetch().catch(() => undefined);
  }, [refetch]);

  const isSaving = saveMutation.isPending;
  const fieldsDisabled =
    isLoading || !formHydrated || isSaving || !canEditSettings;

  const modelSelectOptions = useMemo(
    () => buildModelSelectOptions(modelOptions, values.openAiModel),
    [modelOptions, values.openAiModel],
  );

  const showFormSkeleton =
    Boolean(appliedTenantId) &&
    (isLoading || !formHydrated || queryTenantId !== appliedTenantId);

  const settingsTabActive = innerTab === "settings" && Boolean(appliedTenantId);

  const directoryUsersQuery = useMainSettingsUsersForChatbotQuery(
    settingsTabActive,
    appliedTenantId,
    companies,
  );
  const directoryUserCount = directoryUsersQuery.users.length;
  const directoryUsersLoading =
    directoryUsersQuery.isPending ||
    (directoryUsersQuery.isFetching && directoryUserCount === 0);

  const totalCompanyBudgetLabel = useMemo(
    () =>
      formatTenantCompanyBudgetTotal(
        values.budget.defaultUserBudgetUsd,
        directoryUserCount,
        directoryUsersLoading,
      ),
    [
      values.budget.defaultUserBudgetUsd,
      directoryUserCount,
      directoryUsersLoading,
    ],
  );

  const totalCompanyBudgetHint = useMemo(
    () =>
      tenantCompanyBudgetTotalHint(
        values.budget.defaultUserBudgetUsd,
        directoryUserCount,
        directoryUsersLoading,
      ),
    [
      values.budget.defaultUserBudgetUsd,
      directoryUserCount,
      directoryUsersLoading,
    ],
  );

  if (!appliedTenantId) {
    return (
      <AIChatbotSettingsNoTenantView
        showCompanyFilter={showCompanyFilter}
        companiesLoading={companiesLoading}
        companyOptions={companyOptions}
        selectedCompanyOption={selectedCompanyOption}
        onCompanySelect={handleCompanySelect}
        onApplyFilter={handleApplyFilter}
        innerTab={innerTab}
        onSelectTab={setInnerTab}
      />
    );
  }

  const showSettingsForm =
    innerTab === "settings" && !showFormSkeleton;

  return (
    <form
      key={appliedTenantId}
      className="ai-chatbot-settings"
      onSubmit={(e) => e.preventDefault()}
    >
      <AIChatbotCompanyHeader
        showCompanyFilter={showCompanyFilter}
        companiesLoading={companiesLoading}
        companyOptions={companyOptions}
        selectedCompanyOption={selectedCompanyOption}
        onCompanySelect={handleCompanySelect}
        onApplyFilter={handleApplyFilter}
        viewingCompanyLabel={viewingCompanyLabel}
      />

      <AIChatbotSettingsInnerTabs
        activeTab={innerTab}
        onSelectTab={setInnerTab}
      />

      {innerTab === "history" ? (
        <AIChatbotSettingsHistoryPanel ctx={historyCtx} />
      ) : null}

      {innerTab === "settings" && showFormSkeleton ? (
        <AIChatbotSettingsFormSkeleton />
      ) : null}

      {showSettingsForm ? (
        <AIChatbotSettingsFormContent
          values={values}
          fieldsDisabled={fieldsDisabled}
          canEditSettings={canEditSettings}
          isSaving={isSaving}
          isError={isError}
          hasApiData={hasApiData}
          formHydrated={formHydrated}
          appliedTenantId={appliedTenantId}
          innerTab={innerTab}
          companies={companies}
          modelSelectOptions={modelSelectOptions}
          pricingTable={pricingTable}
          totalCompanyBudgetLabel={totalCompanyBudgetLabel}
          totalCompanyBudgetHint={totalCompanyBudgetHint}
          onRetry={handleRetry}
          onSave={handleSave}
          onModelChange={handleModelChange}
          onMarginChange={handleMarginChange}
          updateRateLimit={updateRateLimit}
          updateBudget={updateBudget}
          updatePricing={updatePricing}
        />
      ) : null}
    </form>
  );
};
