import React, { useState } from 'react'
import { Search, ChevronLeft } from 'lucide-react'
import { useRouter } from 'next/router'
import { usePermissions } from '@utils/permissionUtils'
import {
  sidebarGroups,
  defaultSubTabBySection,
  settingsSubTabSearchItems,
  type SidebarItem,
} from '@config/mainSettingsConfig'
import { MAIN_SETTINGS_BORDER, MAIN_SETTINGS_RADIUS } from '@components/main-settings/mainSettingsTokens'

type SidebarProps = {
  activeSection: string
  onNavigate: (sectionId: string, subTabId?: string) => void
  isMobileOpen?: boolean
}

function sidebarItemPermissionAllowed(
  required: SidebarItem["permission"],
  hasPermission: (permission: string) => boolean,
): boolean {
  if (!required) {
    return true;
  }
  if (typeof required === "string") {
    return hasPermission(required);
  }
  return required.some((permission) => hasPermission(permission));
}

function navRowBackground(isActive: boolean, isHovered: boolean): string {
  if (isActive) {
    return '#f2f2f2'
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
      className={[
        'main-settings-sidebar__nav-item',
        isActive ? 'main-settings-sidebar__nav-item--active' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        background: navRowBackground(isActive, isHovered),
        borderLeft: isActive ? `5px solid ${MAIN_SETTINGS_BORDER.accent}` : '5px solid transparent',
        borderTopRightRadius: isActive || isHovered ? MAIN_SETTINGS_RADIUS.md : 0,
        borderBottomRightRadius: isActive || isHovered ? MAIN_SETTINGS_RADIUS.md : 0,
      }}
      onMouseEnter={onHoverEnter}
      onMouseLeave={onHoverLeave}
    >
      <span>{item.label}</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {item.badge !== undefined && item.badge !== '' && (
          <span className="main-settings-sidebar__badge">
            {item.badge}
          </span>
        )}
        {item.externalLink === true && (
          <span className="main-settings-sidebar__external-icon" aria-hidden>
            ↗
          </span>
        )}
      </span>
    </button>
  )
}

const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  onNavigate,
  isMobileOpen = false,
}) => {
  const router = useRouter()
  const activeSubTab =
    typeof router.query.subTab === 'string' ? router.query.subTab : undefined
  const { hasPermission } = usePermissions()
  const [searchQuery, setSearchQuery] = useState('')
  const [hoveredNavItemId, setHoveredNavItemId] = useState<string | null>(null)

  const handleItemClick = (itemId: string, subTabId?: string) => {
    const defaultSubTab = subTabId ?? defaultSubTabBySection[itemId]
    onNavigate(itemId, defaultSubTab)
  }

  const q = searchQuery.trim().toLowerCase()

  const filteredSubTabSearchItems = q
    ? settingsSubTabSearchItems.filter(
        (item) =>
          sidebarItemPermissionAllowed(item.permission, hasPermission) &&
          item.label.toLowerCase().includes(q),
      )
    : []

  return (
    <aside
      id="main-settings-sidebar"
      className={[
        'main-settings-sidebar',
        isMobileOpen ? 'is-open' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        borderRight: `1px solid ${MAIN_SETTINGS_BORDER.subtle}`,
      }}
    >
      {/* Back to Dashboard */}
      <div className="main-settings-sidebar__header">
        <button
          type="button"
          onClick={() => router.push('/')}
          aria-label="Back to dashboard"
          className="main-settings-sidebar__dashboard-link"
        >
          <ChevronLeft size={14} aria-hidden focusable={false} />
          Dashboard
        </button>
      </div>

      {/* Search */}
      <div
        id="settings-sidebar-search"
        style={{
          marginBottom: 0,
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ position: 'relative', width: '100%' }}>
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
            type="search"
            placeholder="Search Settings"
            aria-label="Search Settings"
            className="main-settings-sidebar__search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              border: `1px solid ${MAIN_SETTINGS_BORDER.default}`,
              borderRadius: MAIN_SETTINGS_RADIUS.md,
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = MAIN_SETTINGS_BORDER.default
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = MAIN_SETTINGS_BORDER.default
            }}
          />
        </div>
      </div>

      <div className="main-settings-sidebar__divider">
        <hr
          aria-hidden
          style={{
            border: 'none',
            borderTop: `1px solid ${MAIN_SETTINGS_BORDER.subtle}`,
            width: '100%',
            margin: 0,
          }}
        />
      </div>

      <div className="main-settings-sidebar__scroll">
      {/* Groups */}
      {sidebarGroups.map((group) => {
        const permissionFilteredItems = group.items.filter((item) =>
          sidebarItemPermissionAllowed(item.permission, hasPermission),
        )
        const filteredItems = q
          ? permissionFilteredItems.filter((item) =>
              item.label.toLowerCase().includes(q),
            )
          : permissionFilteredItems

        if (filteredItems.length === 0) return null

        return (
          <div key={group.heading} className="main-settings-sidebar__group">
            <div className="main-settings-sidebar__group-heading">
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

      {filteredSubTabSearchItems.length > 0 && (
        <div className="main-settings-sidebar__group">
          <div className="main-settings-sidebar__group-heading">
            Pages
          </div>
          {filteredSubTabSearchItems.map((item) => {
            const isActive =
              activeSection === item.sectionId && activeSubTab === item.subTabId
            const itemKey = `${item.sectionId}-${item.subTabId}`
            const isHovered = hoveredNavItemId === itemKey
            return (
              <SidebarNavItem
                key={itemKey}
                item={{ id: itemKey, label: item.label }}
                isActive={isActive}
                isHovered={isHovered}
                onSelect={() => {
                  setSearchQuery('')
                  handleItemClick(item.sectionId, item.subTabId)
                }}
                onHoverEnter={() => {
                  if (!isActive) {
                    setHoveredNavItemId(itemKey)
                  }
                }}
                onHoverLeave={() => setHoveredNavItemId(null)}
              />
            )
          })}
        </div>
      )}
      </div>
    </aside>
  )
}

export default Sidebar
