import React, { useCallback, useEffect, useState } from 'react'
import { Menu } from 'lucide-react'
import Sidebar from './Sidebar'
import './main-settings-layout.scss'

type SettingsLayoutProps = {
  activeSection: string
  onNavigate: (sectionId: string, subTabId?: string) => void
  children: React.ReactNode
}

const SettingsLayout: React.FC<SettingsLayoutProps> = ({
  activeSection,
  onNavigate,
  children,
}) => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const handleNavigate = useCallback(
    (sectionId: string, subTabId?: string) => {
      onNavigate(sectionId, subTabId)
      setMobileNavOpen(false)
    },
    [onNavigate],
  )

  useEffect(() => {
    if (!mobileNavOpen) {
      return undefined
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [mobileNavOpen])

  return (
    <div className="main-settings-root">
        {mobileNavOpen ? (
          <button
            type="button"
            className="main-settings-sidebar-backdrop"
            aria-label="Close settings menu"
            onClick={() => setMobileNavOpen(false)}
          />
        ) : null}

        <Sidebar
          activeSection={activeSection}
          onNavigate={handleNavigate}
          isMobileOpen={mobileNavOpen}
        />

        <main className="main-settings-main">
          <button
            type="button"
            className="main-settings-mobile-nav-toggle"
            aria-expanded={mobileNavOpen}
            aria-controls="main-settings-sidebar"
            onClick={() => setMobileNavOpen((open) => !open)}
          >
            <Menu size={18} aria-hidden focusable={false} />
            Settings menu
          </button>
          {children}
        </main>
    </div>
  )
}

export default SettingsLayout
