import BusinessTypesPanel from '@page-modules/crm/business-types/BusinessTypesPanel'
import CrmCampaignsPanel from '@page-modules/crm/campaigns/CrmCampaignsPanel'
import DealTemplatesPanel from '@page-modules/crm/deal-templates/DealTemplatesPanel'
import IndustriesPanel from '@page-modules/crm/industries/IndustriesPanel'
import ProductsPanel from '@page-modules/crm/products/ProductsPanel'
import StagesPanel from '@page-modules/crm/stages/StagesPanel'
import React from 'react'

/** Each tab: Smart CRM admin panel; list search uses `useDebouncedSearchInput` (400ms). */
export function SmartCrmTabPanel({ activeTab }: Readonly<{ activeTab: string }>) {
  switch (activeTab) {
    case 'stages':
      return <StagesPanel />
    case 'industries':
      return <IndustriesPanel />
    case 'products':
      return <ProductsPanel />
    case 'deal-templates':
      return <DealTemplatesPanel />
    case 'business-types':
      return <BusinessTypesPanel />
    case 'campaigns':
      return <CrmCampaignsPanel />
    default:
      return null
  }
}
