import React, { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { Form } from 'react-bootstrap'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export type MainSettingsOverflowTabItem = Readonly<{
  id: string
  label: string
}>

export type MainSettingsOverflowTabBarProps = Readonly<{
  tabs: readonly MainSettingsOverflowTabItem[]
  activeTabId: string
  onSelect: (tabId: string) => void
  tabBarClassName?: string
  tabBarShellClassName?: string
  tabRowClassName?: string
  tabButtonClassName?: string
  tabButtonActiveClassName?: string
  tabBarStyle?: CSSProperties
  tabRowStyle?: CSSProperties
  getTabButtonStyle?: (isActive: boolean, isFirst: boolean, isLast: boolean) => CSSProperties
}>

function getScrollStep(container: HTMLDivElement): number {
  return Math.max(120, Math.floor(container.clientWidth * 0.75))
}

function measureTabButtonHeight(row: HTMLDivElement | null): number | null {
  if (!row) return null

  const tabButtons = row.querySelectorAll<HTMLElement>('button[role="tab"]')
  if (tabButtons.length === 0) return null

  let maxHeight = 0
  tabButtons.forEach((button) => {
    maxHeight = Math.max(maxHeight, button.offsetHeight)
  })

  return maxHeight > 0 ? maxHeight : null
}

export const MainSettingsOverflowTabBar: React.FC<MainSettingsOverflowTabBarProps> = ({
  tabs,
  activeTabId,
  onSelect,
  tabBarClassName = '',
  tabBarShellClassName = 'settings-section-shell__tab-bar',
  tabRowClassName = 'settings-section-shell__tab-row main-settings-overflow-tab-bar__row',
  tabButtonClassName = 'settings-section-shell__tab-btn',
  tabButtonActiveClassName = 'settings-section-shell__tab-btn--active',
  tabBarStyle,
  tabRowStyle,
  getTabButtonStyle,
}) => {
  const mobileSelectId = useId()
  const scrollRef = useRef<HTMLDivElement>(null)
  const tabRowRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const [tabButtonHeight, setTabButtonHeight] = useState<number | null>(null)

  const syncTabButtonHeight = useCallback(() => {
    setTabButtonHeight(measureTabButtonHeight(tabRowRef.current))
  }, [])

  const updateScrollState = useCallback(() => {
    const container = scrollRef.current
    if (!container) {
      setCanScrollLeft(false)
      setCanScrollRight(false)
      return
    }

    const maxScrollLeft = container.scrollWidth - container.clientWidth
    setCanScrollLeft(container.scrollLeft > 1)
    setCanScrollRight(container.scrollLeft < maxScrollLeft - 1)
  }, [])

  const scrollTabs = useCallback((direction: 'left' | 'right') => {
    const container = scrollRef.current
    if (!container) return

    const delta = direction === 'left' ? -getScrollStep(container) : getScrollStep(container)
    container.scrollBy({ left: delta, behavior: 'smooth' })
  }, [])

  const showNav = canScrollLeft || canScrollRight

  useEffect(() => {
    const container = scrollRef.current
    if (!container) return undefined

    updateScrollState()

    const handleScroll = () => updateScrollState()
    container.addEventListener('scroll', handleScroll, { passive: true })

    const resizeObserver = new ResizeObserver(() => updateScrollState())
    resizeObserver.observe(container)

    return () => {
      container.removeEventListener('scroll', handleScroll)
      resizeObserver.disconnect()
    }
  }, [tabs.length, updateScrollState])

  useLayoutEffect(() => {
    syncTabButtonHeight()

    const row = tabRowRef.current
    if (!row) return undefined

    const resizeObserver = new ResizeObserver(() => syncTabButtonHeight())
    resizeObserver.observe(row)
    row.querySelectorAll('button[role="tab"]').forEach((button) => {
      resizeObserver.observe(button)
    })

    return () => resizeObserver.disconnect()
  }, [tabs, activeTabId, showNav, syncTabButtonHeight])

  useEffect(() => {
    const container = scrollRef.current
    if (!container) return

    const activeButton = container.querySelector<HTMLButtonElement>(
      `[data-tab-id="${activeTabId}"]`,
    )
    activeButton?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
    updateScrollState()
    syncTabButtonHeight()
  }, [activeTabId, tabs, updateScrollState, syncTabButtonHeight])

  const tabBarCssVars =
    tabButtonHeight != null
      ? ({ '--ms-tab-btn-height': `${tabButtonHeight}px` } as CSSProperties)
      : undefined

  const getNavButtonStyle = (variant: 'prev' | 'next'): CSSProperties | undefined => {
    const tabBorder = '1px solid #c4c4c4'
    const measuredHeightStyle =
      tabButtonHeight != null
        ? {
            height: tabButtonHeight,
            minHeight: tabButtonHeight,
            paddingTop: 0,
            paddingBottom: 0,
          }
        : undefined

    const navBorderStyle: CSSProperties = {
      background: 'whitesmoke',
      borderTop: tabBorder,
      borderBottom: 'none',
      borderLeft: tabBorder,
      borderRight: tabBorder,
    }

    if (!getTabButtonStyle) {
      return {
        ...navBorderStyle,
        ...measuredHeightStyle,
      }
    }

    const isFirst = variant === 'prev'
    const isLast = variant === 'next'

    return {
      ...getTabButtonStyle(false, isFirst, isLast),
      ...navBorderStyle,
      ...measuredHeightStyle,
      paddingLeft: 8,
      paddingRight: 8,
      minWidth: undefined,
      width: undefined,
      flex: '0 0 auto',
    }
  }

  return (
    <div
      className={[
        'main-settings-overflow-tab-bar',
        tabBarShellClassName,
        showNav ? 'main-settings-overflow-tab-bar--overflow' : '',
        tabBarClassName,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ ...tabBarStyle, ...tabBarCssVars }}
    >
      <div className="main-settings-overflow-tab-bar__mobile-select d-md-none">
        <Form.Select
          id={mobileSelectId}
          className="main-settings-form-select"
          value={activeTabId}
          aria-label="Select section"
          onChange={(event) => onSelect(event.target.value)}
        >
          {tabs.map((tab) => (
            <option key={tab.id} value={tab.id}>
              {tab.label}
            </option>
          ))}
        </Form.Select>
      </div>

      <div className="main-settings-overflow-tab-bar__desktop d-none d-md-flex">
        {showNav ? (
          <button
            type="button"
            className={[
              tabButtonClassName,
              'main-settings-overflow-tab-bar__nav',
              'main-settings-overflow-tab-bar__nav--prev',
            ].join(' ')}
            aria-label="Scroll tabs left"
            disabled={!canScrollLeft}
            onClick={() => scrollTabs('left')}
            style={getNavButtonStyle('prev')}
          >
            <ChevronLeft size={16} aria-hidden focusable={false} />
          </button>
        ) : null}

        <div ref={scrollRef} className="main-settings-overflow-tab-bar__scroll">
          <div
            ref={tabRowRef}
            className={tabRowClassName}
            style={tabRowStyle}
            role="tablist"
          >
            {tabs.map((tab, index) => {
              const isActive = activeTabId === tab.id
              const isFirst = index === 0
              const isLast = index === tabs.length - 1
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  data-tab-id={tab.id}
                  aria-selected={isActive}
                  onClick={() => onSelect(tab.id)}
                  className={[
                    tabButtonClassName,
                    isActive ? tabButtonActiveClassName : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  style={getTabButtonStyle?.(isActive, isFirst, isLast)}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        {showNav ? (
          <button
            type="button"
            className={[
              tabButtonClassName,
              'main-settings-overflow-tab-bar__nav',
              'main-settings-overflow-tab-bar__nav--next',
            ].join(' ')}
            aria-label="Scroll tabs right"
            disabled={!canScrollRight}
            onClick={() => scrollTabs('right')}
            style={getNavButtonStyle('next')}
          >
            <ChevronRight size={16} aria-hidden focusable={false} />
          </button>
        ) : null}
      </div>
    </div>
  )
}
