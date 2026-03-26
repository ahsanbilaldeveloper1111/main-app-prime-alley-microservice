import React, { useEffect, useRef } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Eye,
  HelpCircle,
  Phone,
  PhoneCall
} from 'lucide-react'
import { Card, Button, Badge } from 'react-bootstrap'
import { CtiDevice } from '@components/live-calls/utils/types'
import UserCard from './UserCard'
import { getSectionIcon, getSectionTitle } from '@components/live-calls/utils/helpers'

const SECTION_HEADER_ACCENT: Record<string, string> = {
  supervision: '#f59e0b',
  onCall: '#22c55e',
  activeIdle: '#6b7280',
  downOffline: '#ef4444'
}

function sectionHeaderAccentColor(sectionKey: string): string {
  return SECTION_HEADER_ACCENT[sectionKey] ?? '#6b7280'
}

const SECTION_ICONS_BY_NAME: Record<string, LucideIcon> = {
  Eye,
  Phone,
  CheckCircle,
  AlertCircle,
  PhoneCall,
  help: HelpCircle
}

function SectionHeaderGlyph({ iconName }: Readonly<{ iconName: string }>) {
  const Icon = SECTION_ICONS_BY_NAME[iconName]
  if (!Icon) {
    return null
  }
  return <Icon size={20} />
}

interface SectionContainerProps {
  sectionKey: string
  sectionDns: Array<{ dn: string; devices: CtiDevice[]; call: any; active: boolean }>
  summaryData: { extensions: number }
  animatingCards: Set<string>
  cardAnimations: { [dn: string]: 'adding' | null }
  activeMonitoring: any
  showPopup: any
  session: any
  getUserDataExtensions: () => any
  getCallStateForDevice: (dn: string, deviceName: string) => any
  setSelectedMonitor: React.Dispatch<React.SetStateAction<Record<string, string>>>
  setTempMonitorSelection: React.Dispatch<React.SetStateAction<Record<string, string | null>>>
  setSelectedTone: React.Dispatch<React.SetStateAction<Record<string, string>>>
  setShowPopup: React.Dispatch<React.SetStateAction<any>>
  setNotification: React.Dispatch<React.SetStateAction<{ type: string; message: string } | null>>
  stopMonitoring: (dn: string, type: string) => Promise<boolean>
  startMonitoringLocal: (dn: string, monitorType: string, toneType: string | undefined, showPopup: any) => Promise<boolean>
  selectedTone: Record<string, string>
  isDnInActiveCall: (dn: string) => boolean
  userAddress?: string | null
  monitoringStartTime?: Record<string, Date>
  idleSinceByDn?: Record<string, string>
  isCollapsed: boolean
  onToggle: () => void
}

function syncCollapseWithContent(
  prevHasContent: boolean,
  hasContent: boolean,
  isCollapsed: boolean,
  onToggle: () => void
): void {
  if (prevHasContent === hasContent) {
    return
  }
  const shouldCollapse = !hasContent && !isCollapsed
  const shouldExpand = hasContent && isCollapsed
  if (shouldCollapse || shouldExpand) {
    onToggle()
  }
}

const SectionContainer: React.FC<Readonly<SectionContainerProps>> = ({
  sectionKey,
  sectionDns,
  summaryData: _summaryData,
  animatingCards,
  cardAnimations,
  activeMonitoring,
  showPopup,
  session,
  getUserDataExtensions,
  getCallStateForDevice,
  setSelectedMonitor,
  setTempMonitorSelection,
  setSelectedTone,
  setShowPopup,
  setNotification,
  stopMonitoring,
  startMonitoringLocal,
  selectedTone,
  isDnInActiveCall,
  userAddress,
  monitoringStartTime,
  idleSinceByDn,
  isCollapsed,
  onToggle
}) => {
  const hasContent = sectionDns.length > 0
  const prevHasContentRef = useRef(hasContent)

  const sectionTitle = getSectionTitle(sectionKey)
  const sectionIconName = getSectionIcon(sectionKey)
  const headerAccent = sectionHeaderAccentColor(sectionKey)
  const CollapseChevron = !hasContent || isCollapsed ? ChevronRight : ChevronDown

  useEffect(() => {
    const prevHasContent = prevHasContentRef.current
    prevHasContentRef.current = hasContent
    syncCollapseWithContent(prevHasContent, hasContent, isCollapsed, onToggle)
  }, [hasContent, isCollapsed, onToggle])

  return (
    <div className="mb-4" data-section={sectionKey}>
      <Card className="border-0 shadow-sm mb-0">
        <Card.Body className="p-3">
          <div className="d-flex justify-content-between align-items-center">
            <Button
              variant="link"
              className="p-0 text-dark text-decoration-none d-flex align-items-center gap-2"
              onClick={onToggle}
              style={{ fontSize: '1.1rem', fontWeight: '600' }}
            >
              <CollapseChevron size={20} />

              <div style={{ color: headerAccent }}>
                <SectionHeaderGlyph iconName={sectionIconName} />
              </div>
              <span>{sectionTitle}</span>
            </Button>
            <Badge
              bg="light"
              text="dark"
              className="px-3 py-2 border"
              style={{ fontSize: '0.85rem', fontWeight: '600' }}
            >
              {sectionDns.length}
            </Badge>
          </div>
        </Card.Body>
      </Card>

      {hasContent && !isCollapsed && (
        <div className="row g-3 justify-content-left align-items-left m-0">
          {sectionDns.map(({ dn, devices: deviceList, call, active }) => (
            <UserCard
              key={dn}
              dn={dn}
              devices={deviceList}
              call={call}
              active={active}
              sectionKey={sectionKey}
              animatingCards={animatingCards}
              cardAnimations={cardAnimations}
              activeMonitoring={activeMonitoring}
              showPopup={showPopup}
              session={session}
              getUserDataExtensions={getUserDataExtensions}
              getCallStateForDevice={getCallStateForDevice}
              setSelectedMonitor={setSelectedMonitor}
              setTempMonitorSelection={setTempMonitorSelection}
              setSelectedTone={setSelectedTone}
              setShowPopup={setShowPopup}
              setNotification={setNotification}
              stopMonitoring={stopMonitoring}
              startMonitoringLocal={startMonitoringLocal}
              selectedTone={selectedTone}
              isDnInActiveCall={isDnInActiveCall}
              userAddress={userAddress}
              monitoringStartTime={monitoringStartTime}
              idleSinceByDn={idleSinceByDn}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default SectionContainer
