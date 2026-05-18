import { AnalysisPricingTab } from '@components/main-settings/ai-analysis/pricing/AnalysisPricingTab'

import { AnalysisMonthlyRollupTab } from '@components/main-settings/ai-analysis/monthly-rollup/AnalysisMonthlyRollupTab'

import { AnalysisPerCallCostTab } from '@components/main-settings/ai-analysis/per-call-cost/AnalysisPerCallCostTab'

import { AnalysisTenantTab } from '@components/main-settings/ai-analysis/tenant/AnalysisTenantTab'

import { HEADER_CONSTANTS } from '@constants/headerConstants'

import ManageExtensions from '@pages/ai-ml/manage-extensions'

import ManualAnalysis from '@pages/ai-ml/analysis'

import React from 'react'

import type { ControlledTabsProps, Tab } from '../types'

import { SettingsSectionTabShell } from './SettingsSectionTabShell'

import { useSettingsSectionTabs } from './useSettingsSectionTabs'



import './communicationsEmbedded.scss'



const { PERMISSIONS } = HEADER_CONSTANTS



const communicationsTabs: Tab[] = [

  {

    id: 'manage-extensions',

    label: 'Manage Analysis',

    permission: PERMISSIONS.MANAGE_EXTENSIONS_AIML,

  },

  {

    id: 'manual-analysis',

    label: 'Manual Analysis',

    permission: PERMISSIONS.TRANSCRIPTION_ANALYSIS_AIML,

  },

  { id: 'pricing', label: 'Pricing', permission: PERMISSIONS.AI_ML_SERVICES },

  { id: 'tenant', label: 'Tenant', permission: PERMISSIONS.AI_ML_SERVICES },

  {

    id: 'monthly-rollup',

    label: 'Monthly Rollup',

    permission: PERMISSIONS.AI_ML_SERVICES,

  },

  {

    id: 'per-call-cost',

    label: 'Per-Call Cost',

    permission: PERMISSIONS.AI_ML_SERVICES,

  },

]



function CommunicationsTabPanel({ activeTab }: Readonly<{ activeTab: string }>) {

  switch (activeTab) {

    case 'manage-extensions':

      return (

        <div className="communications-tab-panel__embed communications-tab-panel__embed--manage-extensions">

          <ManageExtensions />

        </div>

      )

    case 'manual-analysis':

      return (

        <div className="communications-tab-panel__embed communications-tab-panel__embed--manual-analysis">

          <ManualAnalysis />

        </div>

      )

    case 'pricing':

      return <AnalysisPricingTab />

    case 'tenant':

      return <AnalysisTenantTab />

    case 'monthly-rollup':

      return <AnalysisMonthlyRollupTab />

    case 'per-call-cost':

      return <AnalysisPerCallCostTab />

    default:

      return null

  }

}



export const CommunicationsPage: React.FC<ControlledTabsProps> = ({

  activeTab: routeActiveTab,

  onTabChange,

}: Readonly<ControlledTabsProps>) => {

  const { allowedTabs, activeTab, selectTab } = useSettingsSectionTabs(

    routeActiveTab,

    onTabChange,

    communicationsTabs,

    'manage-extensions',

  )



  return (

    <SettingsSectionTabShell

      title="Communications"

      allowedTabs={allowedTabs}

      activeTab={activeTab}

      onSelectTab={selectTab}

      dense

    >

      <div className="communications-tab-panel">

        <CommunicationsTabPanel activeTab={activeTab} />

      </div>

    </SettingsSectionTabShell>

  )

}

