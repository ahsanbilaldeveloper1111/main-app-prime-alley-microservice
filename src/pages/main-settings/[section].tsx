import React, { ReactElement, useEffect } from 'react'
import { useRouter } from 'next/router'
import Layout from '@layout/index'
import SettingsLayout from './partials/SettingsLayout'
import { sectionPageMap } from './index'
import { defaultSubTabBySection } from './config/settingsConfig'

const MainSettingsSectionPage = () => {
  const router = useRouter()
  const section = router.query.section as string | undefined

  useEffect(() => {
    if (!router.isReady || !section) return
    const renderer = sectionPageMap[section]
    if (!renderer) return
    const defaultSubTab = defaultSubTabBySection[section]
    if (defaultSubTab) {
      router.replace(`/main-settings/${section}/${defaultSubTab}`)
    }
  }, [router.isReady, section, router])

  if (!router.isReady || !section) return null

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

  const defaultSubTab = defaultSubTabBySection[section]
  if (defaultSubTab) {
    return null
  }

  const handleNavigate = (sectionId: string, subTabId?: string) => {
    const href = subTabId ? `/main-settings/${sectionId}/${subTabId}` : `/main-settings/${sectionId}`
    router.push(href)
  }

  const content = renderer({
    subTab: undefined,
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

MainSettingsSectionPage.getLayout = (page: ReactElement) => page

export default MainSettingsSectionPage
