import React, { ReactElement, useEffect } from 'react'
import { useRouter } from 'next/router'
import Layout from '@layout/index'

export type { SectionRenderer } from './sectionPageMap'
export { sectionPageMap } from './sectionPageMap'

const MainSettingsIndex = () => {
  const router = useRouter()
  useEffect(() => {
    router.replace('/main-settings/general-prefs')
  }, [router])
  return null
}

MainSettingsIndex.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>
}

export default MainSettingsIndex
