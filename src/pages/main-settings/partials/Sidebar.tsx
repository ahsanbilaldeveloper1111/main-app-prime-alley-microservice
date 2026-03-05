import React, { useState } from 'react'
import { Search, ChevronLeft } from 'lucide-react'
import { useRouter } from 'next/router'
import { usePermissions } from '@utils/permissionUtils'
import { sidebarGroups, defaultSubTabBySection } from '@config/mainSettingsConfig'

type SidebarProps = {
  activeSection: string
  onNavigate: (sectionId: string, subTabId?: string) => void
}

const Sidebar: React.FC<SidebarProps> = ({ activeSection, onNavigate }) => {
  const router = useRouter()
  const { hasPermission } = usePermissions()
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const handleItemClick = (itemId: string) => {
    const defaultSubTab = defaultSubTabBySection[itemId]
    onNavigate(itemId, defaultSubTab)
  }

  return (
    <aside
      style={{
        width: '255px',
        minWidth: '255px',
        background: '#ffffff',
        borderRight: '1px solid #e8e8e8',
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
        height: '100%',
        overflow: 'hidden',
        padding: '21px',
      }}
    >
      {/* Back to Dashboard */}
      <div style={{ paddingLeft: '20px', paddingRight: '20px', marginBottom: '20px' }}>
        <button
          type="button"
          onClick={() => router.push('/')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'transparent',
            border: '1px solid #e0e0e0',
            borderRadius: '4px',
            padding: '10px 22px',
            cursor: 'pointer',
            fontSize: '14px',
            fontFamily: 'Lexend Deca, Helvetica, Arial, sans-serif',
            color: '#141414',
            fontWeight: 300,
            position: 'relative',
            left: '-45px',
          }}
        >
          <span style={{ fontSize: '14px' }}><ChevronLeft size={18} /></span> Dashboard
        </button>
      </div>

      {/* Settings heading + search icon */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingLeft: '20px',
          paddingRight: '20px',
          marginBottom: '20px',
        }}
      >
        <span
          style={{
            fontSize: '20px',
            fontStyle: 'normal',
            fontWeight: 600,
            textTransform: 'none',
            fontFamily: 'Lexend Deca, Helvetica, Arial, sans-serif',
            letterSpacing: '0px',
            lineHeight: '24px',
            color: '#141414',
          }}
        >
          Settings
        </span>
        <button
          onClick={() => setShowSearch(!showSearch)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            color: '#555',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Search settings"
        >
          <Search size={18} />
        </button>
      </div>

      {/* Search Input */}
      {showSearch && (
        <div style={{ paddingLeft: '20px', paddingRight: '20px', marginBottom: '16px' }}>
          <div style={{ position: 'relative' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#888',
                pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              placeholder="Search settings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              style={{
                width: '100%',
                padding: '8px 12px 8px 34px',
                fontSize: '13px',
                fontFamily: 'Lexend Deca, Helvetica, Arial, sans-serif',
                color: '#141414',
                border: '1px solid #d0d0d0',
                borderRadius: '4px',
                outline: 'none',
                background: '#fff',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#0091ae')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#d0d0d0')}
            />
          </div>
        </div>
      )}

      {/* Groups */}
      {sidebarGroups.map((group) => {
        const permissionFilteredItems = group.items.filter(
          (item) => !item.permission || hasPermission(item.permission)
        )
        const filteredItems = searchQuery.trim()
          ? permissionFilteredItems.filter((item) =>
              item.label.toLowerCase().includes(searchQuery.toLowerCase())
            )
          : permissionFilteredItems

        if (filteredItems.length === 0) return null

        return (
          <div key={group.heading} style={{ marginBottom: '8px' }}>
            <div
              style={{
                paddingLeft: '20px',
                paddingRight: '20px',
                paddingTop: '12px',
                paddingBottom: '6px',
                fontFamily: 'Lexend Deca, Helvetica, Arial, sans-serif',
                fontWeight: 600,
                fontSize: '16px',
                color: '#141414',
                lineHeight: '20px',
              }}
            >
              {group.heading}
            </div>
            {filteredItems.map((item) => {
              const isActive = activeSection === item.id
              return (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingLeft: '20px',
                    paddingRight: '16px',
                    paddingTop: '5px',
                    paddingBottom: '5px',
                    cursor: 'pointer',
                    background: isActive ? 'whitesmoke' : 'transparent',
                    borderLeft: isActive ? '3px solid #141414' : '3px solid transparent',
                    color: 'rgb(20, 20, 20)',
                    fontFamily: 'Lexend Deca, Helvetica, Arial, sans-serif',
                    fontSize: '14px',
                    fontWeight: isActive ? 400 : 300,
                    letterSpacing: '0px',
                    lineHeight: '24px',
                    transition: 'background 0.12s, border-color 0.12s',
                    userSelect: 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) (e.currentTarget as HTMLDivElement).style.background = '#f5f5f5'
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) (e.currentTarget as HTMLDivElement).style.background = 'transparent'
                  }}
                >
                  <span>{item.label}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {item.badge && (
                      <span
                        style={{
                          background: '#7b5cf5',
                          color: '#fff',
                          fontSize: '10px',
                          fontWeight: 600,
                          padding: '1px 6px',
                          borderRadius: '3px',
                          letterSpacing: '0.3px',
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                    {item.externalLink && (
                      <span style={{ fontSize: '11px', color: '#aaa' }}>↗</span>
                    )}
                  </span>
                </div>
              )
            })}
          </div>
        )
      })}
    </aside>
  )
}

export default Sidebar
