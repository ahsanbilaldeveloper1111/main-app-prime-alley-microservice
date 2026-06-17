import { ACCOUNT_DEFAULTS_FONT } from '@components/main-settings/accountDefaultsTabPrimitives'

import { MAIN_SETTINGS_FONT_SIZE } from '@components/main-settings/mainSettingsTokens'

import {

  MainSettingsFormSidebar,

  type MainSettingsFormSidebarProps,

} from '@components/main-settings/MainSettingsFormSidebar'

import {

  MAIN_SETTINGS_FORM_READONLY_VALUE_CLASS,

  MAIN_SETTINGS_FORM_SELECT_CLASS,

  MainSettingsFormField,

} from '@components/main-settings/MainSettingsFormPrimitives'

import React from 'react'

import { Form } from 'react-bootstrap'



/** Applied to P&A sidebars so form styles do not leak to CRM / other settings forms. */

export const POLICIES_ATTENDANCE_FORM_SIDEBAR_CLASS =

  'main-settings-form-sidebar--policies-attendance'



const POLICIES_ATTENDANCE_FORM_SIDEBAR_PANEL_CLASS =

  'policies-attendance-form-sidebar-panel'



export function PoliciesAttendanceFormSidebar({

  sidebarClassName,

  ...props

}: MainSettingsFormSidebarProps) {

  return (

    <MainSettingsFormSidebar

      {...props}

      sidebarClassName={[

        POLICIES_ATTENDANCE_FORM_SIDEBAR_CLASS,

        POLICIES_ATTENDANCE_FORM_SIDEBAR_PANEL_CLASS,

        sidebarClassName,

      ]

        .filter(Boolean)

        .join(' ')}

    />

  )

}



export const policiesAttendanceValidationTextStyle: React.CSSProperties = {

  fontFamily: ACCOUNT_DEFAULTS_FONT,

  fontSize: MAIN_SETTINGS_FONT_SIZE.sm,

  color: '#dc3545',

}



export type PoliciesAttendanceTenantOption = Readonly<{

  value: string

  label: string

}>



export function PoliciesAttendanceFormSidebarFooterBar({

  children,

}: Readonly<{

  children: React.ReactNode

}>) {

  return (

    <div className="create-task-sidebar-footer policies-attendance-form-sidebar-footer contact-sidebar-footer w-100">

      <div className="main-settings-form-sidebar-footer__actions">

        {children}

      </div>

    </div>

  )

}



export type PoliciesAttendanceSidebarCancelButtonProps = Readonly<{

  onClick: () => void

  disabled?: boolean

  label?: string

}>



export function PoliciesAttendanceSidebarCancelButton({

  onClick,

  disabled = false,

  label = 'Cancel',

}: PoliciesAttendanceSidebarCancelButtonProps) {

  return (

    <button

      type="button"

      onClick={onClick}

      disabled={disabled}

      className="contact-form-btn-cancel workforce-sidebar-btn-cancel"

    >

      {label}

    </button>

  )

}



export type PoliciesAttendanceSidebarPrimaryButtonProps = Readonly<{

  onClick: () => void

  disabled?: boolean

  label: string

  submittingLabel?: string

  isSubmitting?: boolean

}>



export function PoliciesAttendanceSidebarPrimaryButton({

  onClick,

  disabled = false,

  label,

  submittingLabel = 'Saving...',

  isSubmitting = false,

}: PoliciesAttendanceSidebarPrimaryButtonProps) {

  return (

    <button

      type="button"

      onClick={onClick}

      disabled={disabled}

      className="contact-form-btn-create workforce-sidebar-btn-create"

    >

      {isSubmitting ? submittingLabel : label}

    </button>

  )

}



export type PoliciesAttendanceFormSidebarFooterProps = Readonly<{

  onClose: () => void

  onSubmit: () => void

  isSubmitting: boolean

  canSubmit: boolean

  submitLabel: string

  submittingLabel?: string

  cancelLabel?: string

}>



export function PoliciesAttendanceFormSidebarFooter({

  onClose,

  onSubmit,

  isSubmitting,

  canSubmit,

  submitLabel,

  submittingLabel = 'Creating...',

  cancelLabel = 'Cancel',

}: PoliciesAttendanceFormSidebarFooterProps) {

  return (

    <PoliciesAttendanceFormSidebarFooterBar>

      <PoliciesAttendanceSidebarCancelButton

        onClick={onClose}

        disabled={isSubmitting}

        label={cancelLabel}

      />

      <PoliciesAttendanceSidebarPrimaryButton

        onClick={onSubmit}

        disabled={!canSubmit}

        label={submitLabel}

        submittingLabel={submittingLabel}

        isSubmitting={isSubmitting}

      />

    </PoliciesAttendanceFormSidebarFooterBar>

  )

}



export type PoliciesAttendanceTenantFieldProps = Readonly<{

  id: string

  isAdmin: boolean

  tenantOptions: readonly PoliciesAttendanceTenantOption[]

  selectedTenantId: string

  lockedTenantId: string

  disabled?: boolean

  onTenantChange: (tenantId: string) => void

}>



export function PoliciesAttendanceTenantField({

  id,

  isAdmin,

  tenantOptions,

  selectedTenantId,

  lockedTenantId,

  disabled = false,

  onTenantChange,

}: PoliciesAttendanceTenantFieldProps) {

  const displayTenantId = isAdmin ? selectedTenantId : lockedTenantId



  if (isAdmin) {

    return (

      <MainSettingsFormField id={id} label="Tenant *">

        <Form.Select

          className={MAIN_SETTINGS_FORM_SELECT_CLASS}

          value={selectedTenantId}

          disabled={disabled || tenantOptions.length === 0}

          onChange={(event) => onTenantChange(event.target.value)}

        >

          {tenantOptions.length === 0 ? (

            <option value="">No tenants available</option>

          ) : (

            tenantOptions.map((option) => (

              <option key={option.value} value={option.value}>

                {option.label}

              </option>

            ))

          )}

        </Form.Select>

      </MainSettingsFormField>

    )

  }



  const tenantLabel =

    tenantOptions.find((option) => option.value === displayTenantId)?.label ??

    displayTenantId



  return (

    <MainSettingsFormField id={id} label="Tenant *">

      <div className={MAIN_SETTINGS_FORM_READONLY_VALUE_CLASS} aria-readonly="true">

        {tenantLabel}

      </div>

    </MainSettingsFormField>

  )

}



export function PoliciesAttendanceFormShell({

  children,

}: Readonly<{

  children: React.ReactNode

}>) {

  return (

    <div className="policies-attendance-form-shell" style={{ fontFamily: ACCOUNT_DEFAULTS_FONT }}>

      {children}

    </div>

  )

}



export function PoliciesAttendanceFormValidationMessage({

  message,

}: Readonly<{

  message: string | null

}>) {

  if (!message) return null



  return (

    <p className="text-danger mb-0 mt-1" style={policiesAttendanceValidationTextStyle}>

      {message}

    </p>

  )

}

