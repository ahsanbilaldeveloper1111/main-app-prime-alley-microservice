import type { ReactNode } from 'react'

export type Tab = Readonly<{
  id: string
  label: string
  permission?: string
}>

export type ControlledTabsProps = Readonly<{
  activeTab?: string
  onTabChange?: (tabId: string) => void
}>

export type SectionRenderer = (opts: Readonly<{
  subTab?: string
  onSubTabChange?: (tabId: string) => void
}>) => ReactNode
