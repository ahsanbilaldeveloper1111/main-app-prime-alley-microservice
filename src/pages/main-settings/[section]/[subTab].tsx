import React, { ReactElement } from 'react'
import { useRouter } from 'next/router'
import Layout from '@layout/index'
import SettingsLayout from '../partials/SettingsLayout'
import { sectionPageMap } from '../index'

const MainSettingsSectionSubTabPage = () => {
  const router = useRouter()
  const section = router.query.section as string | undefined
  const subTab = router.query.subTab as string | undefined

  if (!router.isReady || !section || !subTab) return null

  const renderer = sectionPageMap[section]
  if (!renderer) {
    return (
      <Layout>
        <div style={{ padding: '32px 40px' }}>
          <p style={{ color: '#999', fontSize: '14px' }}>Section not found.</p>
        </div>
      </Layout>
    )
  }

  const handleNavigate = (sectionId: string, subTabId?: string) => {
    const href = subTabId ? `/main-settings/${sectionId}/${subTabId}` : `/main-settings/${sectionId}`
    router.push(href)
  }

  const content = renderer({
    subTab,
    onSubTabChange: (tabId) => handleNavigate(section, tabId),
  })

  return (
    <Layout>
      <SettingsLayout activeSection={section} onNavigate={handleNavigate}>
        {content}
      </SettingsLayout>
    </Layout>
  )
}

MainSettingsSectionSubTabPage.getLayout = (page: ReactElement) => page

export default MainSettingsSectionSubTabPage
