import { HEADER_CONSTANTS } from '@constants/headerConstants'
import PaymentMethods from '@pages/billing/customer/payment-methods'
import React from 'react'
import type { ControlledTabsProps, Tab } from '../types'
import { SettingsSectionTabShell } from './SettingsSectionTabShell'
import { useSettingsSectionTabs } from './useSettingsSectionTabs'

const { PERMISSIONS } = HEADER_CONSTANTS

const billingTabs: Tab[] = [
  { id: 'payment-methods', label: 'Payment Methods', permission: PERMISSIONS.VIEW_PAYMENT_METHODS_BILLING },
]

function BillingTabPanel({ activeTab }: Readonly<{ activeTab: string }>) {
  if (activeTab === 'payment-methods') {
    return <PaymentMethods />
  }
  return null
}

export const BillingPage: React.FC<ControlledTabsProps> = ({
  activeTab: routeActiveTab,
  onTabChange,
}: Readonly<ControlledTabsProps>) => {
  const { allowedTabs, activeTab, selectTab } = useSettingsSectionTabs(
    routeActiveTab,
    onTabChange,
    billingTabs,
    'payment-methods'
  )

  return (
    <SettingsSectionTabShell title="Billing" allowedTabs={allowedTabs} activeTab={activeTab} onSelectTab={selectTab}>
      <BillingTabPanel activeTab={activeTab} />
    </SettingsSectionTabShell>
  )
}
