import { OvertimePolicyForm } from "@page-modules/workforce/company-config/OvertimePolicyForm";

import {

  createDefaultOvertimePolicyFormState,

  validateOvertimePolicyForm,

  type OvertimePolicyFormState,

  type OvertimeTenantOption,

} from "@page-modules/workforce/company-config/overtimeDomain";

import {

  PoliciesAttendanceFormShell,
  PoliciesAttendanceFormSidebar,
  PoliciesAttendanceFormSidebarFooter,

  PoliciesAttendanceFormValidationMessage,

  PoliciesAttendanceTenantField,

} from "@page-modules/workforce/shared/policiesAttendanceFormSidebarUi";

import React, { useEffect, useState } from "react";



export type CreateOvertimePolicySidebarProps = Readonly<{

  show: boolean;

  isAdmin: boolean;

  tenantOptions: readonly OvertimeTenantOption[];

  lockedTenantId: string;

  isSubmitting: boolean;

  onClose: () => void;

  onSubmit: (input: { tenantId: string; form: OvertimePolicyFormState }) => void;

}>;



export function CreateOvertimePolicySidebar({

  show,

  isAdmin,

  tenantOptions,

  lockedTenantId,

  isSubmitting,

  onClose,

  onSubmit,

}: CreateOvertimePolicySidebarProps) {

  const [form, setForm] = useState(createDefaultOvertimePolicyFormState);

  const [selectedTenantId, setSelectedTenantId] = useState("");

  const [validationError, setValidationError] = useState<string | null>(null);



  useEffect(() => {

    if (!show) return;

    setForm(createDefaultOvertimePolicyFormState());

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

    validationError ?? validateOvertimePolicyForm(form, resolvedTenantId);

  const canSubmit = !validationMessage && !isSubmitting;



  const handleSubmit = () => {

    const error = validateOvertimePolicyForm(form, resolvedTenantId);

    if (error) {

      setValidationError(error);

      return;

    }

    onSubmit({ tenantId: resolvedTenantId, form });

  };



  return (

    <PoliciesAttendanceFormSidebar

      show={show}

      title="Add overtime policy"

      onHide={onClose}

      disableClose={isSubmitting}

      footer={

        <PoliciesAttendanceFormSidebarFooter

          onClose={onClose}

          onSubmit={handleSubmit}

          isSubmitting={isSubmitting}

          canSubmit={canSubmit}

          submitLabel="Create policy"

        />

      }

    >

      <PoliciesAttendanceFormShell>

        <PoliciesAttendanceTenantField

          id="overtime-policy-tenant"

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



        <OvertimePolicyForm

          form={form}

          disabled={isSubmitting}

          onChange={(nextForm) => {

            setValidationError(null);

            setForm(nextForm);

          }}

        />



        <PoliciesAttendanceFormValidationMessage message={validationMessage} />

      </PoliciesAttendanceFormShell>

    </PoliciesAttendanceFormSidebar>

  );

}


