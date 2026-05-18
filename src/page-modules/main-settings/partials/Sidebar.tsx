import React, { useState } from 'react'
import { Search, ChevronLeft } from 'lucide-react'
import { useRouter } from 'next/router'
import { usePermissions } from '@utils/permissionUtils'
import { sidebarGroups, defaultSubTabBySection, type SidebarItem } from '@config/mainSettingsConfig'

type SidebarProps = {
  activeSection: string
  onNavigate: (sectionId: string, subTabId?: string) => void
}

function navRowBackground(isActive: boolean, isHovered: boolean): string {
  if (isActive) {
    return 'whitesmoke'
  }
  if (isHovered) {
    return '#f5f5f5'
  }
  return 'transparent'
}

type SidebarNavItemProps = Readonly<{
  item: SidebarItem
  isActive: boolean
  isHovered: boolean
  onSelect: () => void
  onHoverEnter: () => void
  onHoverLeave: () => void
}>

function SidebarNavItem({
  item,
  isActive,
  isHovered,
  onSelect,
  onHoverEnter,
  onHoverLeave,
}: SidebarNavItemProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={isActive ? 'true' : undefined}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        paddingLeft: '20px',
        paddingRight: '16px',
        paddingTop: '5px',
        paddingBottom: '5px',
        cursor: 'pointer',
        background: navRowBackground(isActive, isHovered),
        border: 'none',
        borderLeft: isActive ? '3px solid #141414' : '3px solid transparent',
        color: 'rgb(20, 20, 20)',
        fontFamily: 'Lexend Deca, Helvetica, Arial, sans-serif',
        fontSize: '14px',
        fontWeight: isActive ? 400 : 300,
        letterSpacing: '0px',
        lineHeight: '24px',
        transition: 'background 0.12s, border-color 0.12s',
        userSelect: 'none',
        textAlign: 'left',
        boxSizing: 'border-box',
      }}
      onMouseEnter={onHoverEnter}
      onMouseLeave={onHoverLeave}
    >
      <span>{item.label}</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {item.badge !== undefined && item.badge !== '' && (
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
        {item.externalLink === true && (
          <span style={{ fontSize: '11px', color: '#aaa' }} aria-hidden>
            ↗
          </span>
        )}
      </span>
    </button>
  )
}

const Sidebar: React.FC<SidebarProps> = ({ activeSection, onNavigate }) => {
  const router = useRouter()
  const { hasPermission } = usePermissions()
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [hoveredNavItemId, setHoveredNavItemId] = useState<string | null>(null)

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
          aria-label="Back to dashboard"
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
          <ChevronLeft size={18} aria-hidden focusable={false} />
          {' '}
          Dashboard
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
          type="button"
          onClick={() => setShowSearch((open) => !open)}
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
          aria-expanded={showSearch}
          aria-controls="settings-sidebar-search"
        >
          <Search size={18} aria-hidden focusable={false} />
        </button>
      </div>

      {/* Search Input */}
      {showSearch && (
        <div
          id="settings-sidebar-search"
          style={{ paddingLeft: '20px', paddingRight: '20px', marginBottom: '16px' }}
        >
          <div style={{ position: 'relative' }}>
            <Search
              size={16}
              aria-hidden
              focusable={false}
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
              id="settings-sidebar-search-input"
              type="text"
              placeholder="Search settings..."
              aria-label="Search settings"
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
        const permissionFilteredItems = group.items.filter((item) => {
          const required = item.permission
          if (!required) return true
          if (typeof required === 'string') return hasPermission(required)
          return required.some((perm) => hasPermission(perm))
        })
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
              const isHovered = hoveredNavItemId === item.id
              return (
                <SidebarNavItem
                  key={item.id}
                  item={item}
                  isActive={isActive}
                  isHovered={isHovered}
                  onSelect={() => handleItemClick(item.id)}
                  onHoverEnter={() => {
                    if (!isActive) {
                      setHoveredNavItemId(item.id)
                    }
                  }}
                  onHoverLeave={() => setHoveredNavItemId(null)}
                />
              )
            })}
          </div>
        )
      })}
    </aside>
  )
}

export default Sidebar
