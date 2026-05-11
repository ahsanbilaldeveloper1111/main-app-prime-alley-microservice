import BusinessTypes from '@pages/crm/business-types'
import Campaigns from '@pages/crm/campaigns'
import DealTemplates from '@pages/crm/deal-templates'
import Industries from '@pages/crm/industries'
import Products from '@pages/crm/products'
import Stages from '@pages/crm/stages'
import React from 'react'

const settingsEmbed = { hideBreadcrumb: true as const }

/** Each tab: CRM page with settings chrome; list search uses `useDebouncedSearchInput` (400ms). */
export function SmartCrmTabPanel({ activeTab }: Readonly<{ activeTab: string }>) {
  switch (activeTab) {
    case 'stages':
      return <Stages {...settingsEmbed} />
    case 'industries':
      return <Industries {...settingsEmbed} />
    case 'products':
      return <Products {...settingsEmbed} />
    case 'deal-templates':
      return <DealTemplates {...settingsEmbed} />
    case 'business-types':
      return <BusinessTypes {...settingsEmbed} />
    case 'campaigns':
      return <Campaigns {...settingsEmbed} />
    default:
      return null
  }
}
