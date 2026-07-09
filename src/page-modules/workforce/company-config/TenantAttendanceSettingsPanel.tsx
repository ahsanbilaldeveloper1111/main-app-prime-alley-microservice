import {
  attendanceSettingsToFormState,
  createDefaultAttendanceSettingsFormState,
  type AttendanceSettingsFormState,
} from "@page-modules/workforce/company-config/attendanceSettingsDomain";
import { useAttendanceSettingsQuery } from "@page-modules/workforce/company-config/useAttendanceSettingsQuery";
import { useUpdateAttendanceSettingsMutation } from "@page-modules/workforce/company-config/useUpdateAttendanceSettingsMutation";
import type { CompanyConfigPolicyPanelProps } from "@page-modules/workforce/company-config/companyConfigPanelTypes";
import {
  MAIN_SETTINGS_FORM_CONTROL_CLASS,
  MainSettingsFormField,
} from "@components/main-settings/MainSettingsFormPrimitives";
import React, { useEffect, useState } from "react";
import { Button, Form, Spinner } from "react-bootstrap";

export function TenantAttendanceSettingsPanel({
  resolvedTenantId,
  isTenantListReady,
}: CompanyConfigPolicyPanelProps) {
  const [form, setForm] = useState(createDefaultAttendanceSettingsFormState);
  const [formHydrated, setFormHydrated] = useState(false);

  const settingsQuery = useAttendanceSettingsQuery(resolvedTenantId || null, isTenantListReady);
  const updateSettingsMutation = useUpdateAttendanceSettingsMutation();

  useEffect(() => {
    if (!resolvedTenantId) {
      setForm(createDefaultAttendanceSettingsFormState());
      setFormHydrated(false);
      return;
    }
    if (settingsQuery.isLoading) {
      return;
    }
    setForm(attendanceSettingsToFormState(settingsQuery.data));
    setFormHydrated(true);
  }, [resolvedTenantId, settingsQuery.data, settingsQuery.dataUpdatedAt, settingsQuery.isLoading]);

  const updateForm = <K extends keyof AttendanceSettingsFormState>(
    key: K,
    value: AttendanceSettingsFormState[K],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  if (!resolvedTenantId) {
    return <p className="company-config-panel__hint">Select a tenant to load attendance settings.</p>;
  }

  if (settingsQuery.isError) {
    return (
      <div className="company-config-panel__status company-config-panel__status--error">
        <p>Failed to load attendance settings.</p>
        <Button type="button" variant="outline-secondary" size="sm" onClick={() => settingsQuery.refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  if (settingsQuery.isLoading && !formHydrated) {
    return (
      <output className="company-config-panel__status">
        <Spinner animation="border" size="sm" aria-hidden />
        <span>Loading attendance settings…</span>
      </output>
    );
  }

  const isSaving = updateSettingsMutation.isPending;
  const fieldsDisabled = isSaving || !formHydrated;

  return (
    <div className="company-config-panel__form-card">
      <p className="company-config-panel__hint">
        Configure tenant-wide attendance behaviour. Changing break structure mode archives or restores
        break type definitions on the backend — break types reload after save.
      </p>

      <MainSettingsFormField
        id="attendance-settings-multiple-break-types"
        label="Break structure"
        hint="Multiple named break types show a picker on start break. Single generic break uses one active type."
      >
        <Form.Check
          type="switch"
          id="attendance-settings-multiple-break-types-enabled"
          label="Multiple break types"
          checked={form.multiple_break_types_enabled}
          disabled={fieldsDisabled}
          onChange={(event) => updateForm("multiple_break_types_enabled", event.target.checked)}
        />
      </MainSettingsFormField>

      <MainSettingsFormField
        id="attendance-settings-auto-checkout"
        label="Auto checkout"
        hint="Automatically check out employees when check-in duration reaches the shift hard limit."
      >
        <Form.Check
          type="switch"
          id="attendance-settings-auto-checkout-on-hard-limit"
          label="Auto checkout on hard limit"
          checked={form.auto_checkout_on_hard_limit}
          disabled={fieldsDisabled}
          onChange={(event) => updateForm("auto_checkout_on_hard_limit", event.target.checked)}
        />
      </MainSettingsFormField>

      <MainSettingsFormField
        id="attendance-settings-timezone"
        label="Timezone"
        hint="Optional. Example: Asia/Dubai"
      >
        <Form.Control
          type="text"
          className={MAIN_SETTINGS_FORM_CONTROL_CLASS}
          placeholder="Asia/Dubai"
          value={form.timezone}
          disabled={fieldsDisabled}
          onChange={(event) => updateForm("timezone", event.target.value)}
        />
      </MainSettingsFormField>

      <div className="company-config-panel__actions">
        <Button
          type="button"
          variant="primary"
          disabled={fieldsDisabled}
          onClick={() =>
            updateSettingsMutation.mutate({
              tenantId: resolvedTenantId,
              form,
            })
          }
        >
          {isSaving ? "Saving…" : "Save attendance settings"}
        </Button>
      </div>
    </div>
  );
}
