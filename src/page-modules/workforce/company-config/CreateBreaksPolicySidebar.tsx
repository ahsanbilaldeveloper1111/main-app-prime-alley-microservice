import { useMainAppLookups } from "@hooks/useMainAppLookups";
import { BreaksPolicyForm } from "@page-modules/workforce/company-config/BreaksPolicyForm";

import {

  createDefaultBreaksPolicyFormState,

  validateBreaksPolicyForm,

  type BreaksPolicyFormState,

  type BreaksTenantOption,

} from "@page-modules/workforce/company-config/breaksDomain";

import {

  PoliciesAttendanceFormShell,
  PoliciesAttendanceFormSidebar,
  PoliciesAttendanceFormSidebarFooter,

  PoliciesAttendanceFormValidationMessage,

  PoliciesAttendanceTenantField,

} from "@page-modules/workforce/shared/policiesAttendanceFormSidebarUi";

import React, { useEffect, useState } from "react";



export type CreateBreaksPolicySidebarProps = Readonly<{

  show: boolean;

  isAdmin: boolean;

  tenantOptions: readonly BreaksTenantOption[];

  lockedTenantId: string;

  isSubmitting: boolean;

  onClose: () => void;

  onSubmit: (input: { tenantId: string; form: BreaksPolicyFormState }) => void;

}>;



export function CreateBreaksPolicySidebar({

  show,

  isAdmin,

  tenantOptions,

  lockedTenantId,

  isSubmitting,

  onClose,

  onSubmit,

}: CreateBreaksPolicySidebarProps) {
  const { mainAppDepartments } = useMainAppLookups();
  const [form, setForm] = useState(createDefaultBreaksPolicyFormState);

  const [selectedTenantId, setSelectedTenantId] = useState("");

  const [validationError, setValidationError] = useState<string | null>(null);



  useEffect(() => {

    if (!show) return;

    setForm(createDefaultBreaksPolicyFormState());

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

    validationError ?? validateBreaksPolicyForm(form, resolvedTenantId);

  const canSubmit = !validationMessage && !isSubmitting;



  const handleSubmit = () => {

    const error = validateBreaksPolicyForm(form, resolvedTenantId);

    if (error) {

      setValidationError(error);

      return;

    }

    onSubmit({ tenantId: resolvedTenantId, form });

  };



  return (

    <PoliciesAttendanceFormSidebar

      show={show}

      title="Add break policy"

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

          id="breaks-policy-tenant"

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



        <BreaksPolicyForm
          form={form}
          disabled={isSubmitting}
          departmentOptions={mainAppDepartments}
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


