import {

  MAIN_SETTINGS_FORM_CONTROL_CLASS,

  MAIN_SETTINGS_FORM_SELECT_CLASS,

  MainSettingsFormField,

} from "@components/main-settings/MainSettingsFormPrimitives";

import {

  BREAK_TYPE_FORM_OPTIONS,

  createDefaultBreakTypeFormState,

  validateCreateBreakTypeForm,

  type BreakTypeTenantOption,

  type CreateBreakTypeFormState,

} from "@page-modules/workforce/company-config/breakTypesDomain";

import {

  PoliciesAttendanceFormShell,
  PoliciesAttendanceFormSidebar,
  PoliciesAttendanceFormSidebarFooter,

  PoliciesAttendanceFormValidationMessage,

  PoliciesAttendanceTenantField,

} from "@page-modules/workforce/shared/policiesAttendanceFormSidebarUi";

import React, { useEffect, useState } from "react";

import { Form } from "react-bootstrap";



export type CreateBreakTypeSidebarProps = Readonly<{

  show: boolean;

  isAdmin: boolean;

  tenantOptions: readonly BreakTypeTenantOption[];

  lockedTenantId: string;

  isSubmitting: boolean;

  onClose: () => void;

  onSubmit: (input: { tenantId: string; form: CreateBreakTypeFormState }) => void;

}>;



export function CreateBreakTypeSidebar({

  show,

  isAdmin,

  tenantOptions,

  lockedTenantId,

  isSubmitting,

  onClose,

  onSubmit,

}: CreateBreakTypeSidebarProps) {

  const [form, setForm] = useState(createDefaultBreakTypeFormState);

  const [selectedTenantId, setSelectedTenantId] = useState("");

  const [validationError, setValidationError] = useState<string | null>(null);



  useEffect(() => {

    if (!show) return;

    setForm(createDefaultBreakTypeFormState());

    setValidationError(null);

    if (isAdmin) {

      const defaultId =

        lockedTenantId && tenantOptions.some((option) => option.value === lockedTenantId)

          ? lockedTenantId

          : tenantOptions[0]?.value ?? "";

      setSelectedTenantId(defaultId);

      return;

    }

    setSelectedTenantId(lockedTenantId);

  }, [isAdmin, lockedTenantId, show, tenantOptions]);



  const resolvedTenantId = isAdmin ? selectedTenantId : lockedTenantId;

  const validationMessage =

    validationError ?? validateCreateBreakTypeForm(form, resolvedTenantId);

  const canSubmit = !validationMessage && !isSubmitting;



  const updateForm = <K extends keyof CreateBreakTypeFormState>(

    key: K,

    value: CreateBreakTypeFormState[K],

  ) => {

    setValidationError(null);

    setForm((current) => ({ ...current, [key]: value }));

  };



  const handleSubmit = () => {

    const error = validateCreateBreakTypeForm(form, resolvedTenantId);

    if (error) {

      setValidationError(error);

      return;

    }

    onSubmit({ tenantId: resolvedTenantId, form });

  };



  return (

    <PoliciesAttendanceFormSidebar

      show={show}

      title="Add break type"

      onHide={onClose}

      disableClose={isSubmitting}

      footer={

        <PoliciesAttendanceFormSidebarFooter

          onClose={onClose}

          onSubmit={handleSubmit}

          isSubmitting={isSubmitting}

          canSubmit={canSubmit}

          submitLabel="Create break type"

        />

      }

    >

      <PoliciesAttendanceFormShell>

        <PoliciesAttendanceTenantField

          id="break-type-tenant"

          isAdmin={isAdmin}

          tenantOptions={tenantOptions}

          selectedTenantId={selectedTenantId}

          lockedTenantId={lockedTenantId}

          disabled={isSubmitting}

          onTenantChange={(tenantId) => {

            setValidationError(null);

            setSelectedTenantId(tenantId);

          }}

        />



        <MainSettingsFormField id="break-type-name" label="Name *">

          <Form.Control

            type="text"

            className={MAIN_SETTINGS_FORM_CONTROL_CLASS}

            placeholder="Lunch"

            value={form.name}

            disabled={isSubmitting}

            onChange={(event) => updateForm("name", event.target.value)}

          />

        </MainSettingsFormField>



        <MainSettingsFormField id="break-type-type" label="Type *">

          <Form.Select

            className={MAIN_SETTINGS_FORM_SELECT_CLASS}

            value={form.type}

            disabled={isSubmitting}

            onChange={(event) => updateForm("type", event.target.value)}

          >

            {BREAK_TYPE_FORM_OPTIONS.map((option) => (

              <option key={option.value} value={option.value}>

                {option.label}

              </option>

            ))}

          </Form.Select>

        </MainSettingsFormField>



        <MainSettingsFormField

          id="break-type-duration"

          label="Duration (minutes) *"

          hint="Length of the break in minutes."

        >

          <Form.Control

            type="number"

            min={1}

            className={MAIN_SETTINGS_FORM_CONTROL_CLASS}

            value={form.duration_minutes}

            disabled={isSubmitting}

            onChange={(event) =>

              updateForm(

                "duration_minutes",

                event.target.value === "" ? 0 : Number(event.target.value),

              )

            }

          />

        </MainSettingsFormField>



        <MainSettingsFormField id="break-type-paid" label="Paid break">

          <Form.Check

            type="checkbox"

            id="break-type-is-paid"

            label="This break is paid"

            checked={form.is_paid}

            disabled={isSubmitting}

            onChange={(event) => updateForm("is_paid", event.target.checked)}

          />

        </MainSettingsFormField>



        <MainSettingsFormField id="break-type-active" label="Active">

          <Form.Check

            type="checkbox"

            id="break-type-is-active"

            label="Break type is active"

            checked={form.is_active}

            disabled={isSubmitting}

            onChange={(event) => updateForm("is_active", event.target.checked)}

          />

        </MainSettingsFormField>



        <PoliciesAttendanceFormValidationMessage message={validationMessage} />

      </PoliciesAttendanceFormShell>

    </PoliciesAttendanceFormSidebar>

  );

}


