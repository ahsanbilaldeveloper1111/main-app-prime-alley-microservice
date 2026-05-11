import React from 'react'
import Sidebar from './Sidebar'

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
  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .main-settings-content-wrapper {
              overflow: hidden;
              height: calc(100vh - 50px);
            }
          `,
        }}
      />
      <div
        style={{
          display: 'flex',
          height: '100vh',
          overflow: 'hidden',
          background: '#ffffff',
          fontFamily: 'Lexend Deca, Helvetica, Arial, sans-serif',
        }}
      >
        <Sidebar activeSection={activeSection} onNavigate={onNavigate} />
        <main
          style={{
            flex: 1,
            background: '#ffffff',
            overflowY: 'auto',
            height: '100%',
          }}
        >
          {children}
        </main>
      </div>
    </>
  )
}

export default SettingsLayout
