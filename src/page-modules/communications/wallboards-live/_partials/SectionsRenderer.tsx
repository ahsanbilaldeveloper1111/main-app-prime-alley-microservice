import React from 'react'
import { Col, Row } from 'react-bootstrap'
import SectionContainer from './SectionContainer'
import { SECTION_ORDER } from '@components/live-calls/utils/constants'
import { getCallSortDurationMs } from '@components/live-calls/utils/helpers'
import { CtiDevice } from '@components/live-calls/utils/types'
import {
  isSilentMonitoringType,
  parseWallboardTimestampToMs,
} from '@components/communications/wallboards-live/wallboardEventParsing'
import { ctiAddressesEquivalent } from '@utils/ctiAddressMatching'

const SECTION_STATUS_MAP: Record<string, string> = {
  supervision: 'supervision',
  oncall: 'onCall',
  active: 'activeIdle',
  offline: 'downOffline',
}

type SectionBuckets = {
  supervision: any[]
  onCall: any[]
  activeIdle: any[]
  downOffline: any[]
}

function getExtensionRecord(
  userDataExtensions: Record<string, any>,
  dn: string
): Record<string, any> | null {
  return (
    userDataExtensions[dn] ??
    userDataExtensions[String(dn)] ??
    userDataExtensions[Number(dn)] ??
    null
  )
}

function matchesSearchQuery(
  dn: string,
  query: string,
  userDataExtensions: Record<string, any>
): boolean {
  const dnLower = String(dn).toLowerCase()
  if (dnLower.includes(query)) {
    return true
  }
  const extensionData = getExtensionRecord(userDataExtensions, dn)
  if (!extensionData) {
    return false
  }
  const userName =
    extensionData.name ??
    extensionData.user_name ??
    extensionData.userName ??
    ''
  if (!userName?.trim()) {
    return false
  }
  const userNameLower = String(userName).toLowerCase().trim()
  return userNameLower.includes(query)
}

function matchesTeamSelection(
  dn: string,
  selectedTeam: string,
  userDataExtensions: Record<string, any>
): boolean {
  const extensionData = getExtensionRecord(userDataExtensions, dn)
  const teamNames = extensionData?.team_name ?? []
  // Include users when team metadata is missing — do not hide them from the wallboard.
  if (teamNames.length === 0) {
    return true
  }
  const selectedTeamStr = String(selectedTeam).toLowerCase().trim()
  return teamNames.some((teamName: string) => {
    const teamNameStr = String(teamName).toLowerCase().trim()
    return (
      teamNameStr === selectedTeamStr ||
      teamNameStr.includes(selectedTeamStr) ||
      selectedTeamStr.includes(teamNameStr)
    )
  })
}

function matchesStatusSelection(section: string, selectedStatus: string): boolean {
  const targetSection = SECTION_STATUS_MAP[selectedStatus.toLowerCase()]
  if (targetSection !== undefined && section !== targetSection) {
    return false
  }
  return true
}

function devicesObjectToList(devices: unknown): CtiDevice[] {
  if (devices == null || typeof devices !== 'object') {
    return []
  }
  return Object.values(devices as Record<string, CtiDevice>)
}

function idleElapsedSortMs(
  dn: string,
  idleSinceByDn: Record<string, string>,
): number {
  const iso = idleSinceByDn[String(dn)]
  if (!iso) return 0
  const start = parseWallboardTimestampToMs(iso)
  if (start <= 0) return 0
  return Math.max(0, Date.now() - start)
}

function compareByCallDuration(
  a: any,
  b: any,
  sortOrder: string,
  idleSinceByDn?: Record<string, string>,
): number {
  if (idleSinceByDn) {
    const durationA = idleElapsedSortMs(a.dn, idleSinceByDn)
    const durationB = idleElapsedSortMs(b.dn, idleSinceByDn)
    if (sortOrder === 'longest') {
      return durationB - durationA
    }
    if (sortOrder === 'shortest') {
      return durationA - durationB
    }
    return 0
  }
  const durationA = a.call ? getCallSortDurationMs(a.call) : 0
  const durationB = b.call ? getCallSortDurationMs(b.call) : 0
  if (sortOrder === 'longest') {
    return durationB - durationA
  }
  if (sortOrder === 'shortest') {
    return durationA - durationB
  }
  return 0
}

function sortSectionsByDuration(
  sectionArray: any[],
  sortOrder: string,
  idleSinceByDn?: Record<string, string>,
): any[] {
  if (sortOrder === 'none') {
    return sectionArray
  }
  return [...sectionArray].sort((a, b) =>
    compareByCallDuration(a, b, sortOrder, idleSinceByDn),
  )
}

/**
 * SILENT: hide the supervisor's Live Coaching card from everyone except the monitor who started it.
 */
function shouldOmitSupervisorRowForSilentMonitoring(
  dn: string,
  userAddress: string | null | undefined,
  activeMonitoring: { monitor?: string; type?: string | null },
  _section: string,
): boolean {
  if (!isSilentMonitoringType(activeMonitoring?.type)) {
    return false
  }
  const monitorDn = activeMonitoring.monitor
  if (monitorDn == null || userAddress == null || userAddress === '') {
    return false
  }
  return (
    ctiAddressesEquivalent(dn, monitorDn) &&
    !ctiAddressesEquivalent(userAddress, monitorDn)
  )
}

interface SectionsRendererProps {
  dnsMap: Record<string, any>
  summaryData: { extensions: number }
  getDnCallState: (dn: string) => any
  hasActiveCalls: (dn: string) => boolean
  categorizeDns: (dn: string, devices: CtiDevice[], call: any, active: boolean) => string
  animatingCards: Set<string>
  cardAnimations: { [dn: string]: 'adding' | null }
  activeMonitoring: any
  showPopup: any
  session: any
  getUserDataExtensions: () => any
  getCallStatesForDn: (dn: string) => unknown[]
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
  loading: boolean
  selectedTeam: string
  selectedStatus: string
  sortBy: string
  searchQuery: string
  collapsedSections: { [key: string]: boolean }
  toggleSection: (section: string) => void
}

const SectionsRenderer: React.FC<SectionsRendererProps> = ({
  dnsMap,
  summaryData,
  getDnCallState,
  hasActiveCalls,
  categorizeDns,
  animatingCards,
  cardAnimations,
  activeMonitoring,
  showPopup,
  session,
  getUserDataExtensions,
  getCallStatesForDn,
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
  loading,
  selectedTeam,
  selectedStatus,
  sortBy,
  searchQuery,
  collapsedSections,
  toggleSection,
}) => {
  const [extensionsUpdateCounter, setExtensionsUpdateCounter] = React.useState(0)

  const userDataExtensions = React.useMemo(() => {
    try {
      return getUserDataExtensions?.() || {}
    } catch (error) {
      console.error('Error getting user data extensions for filtering:', error)
      return {}
    }
  }, [getUserDataExtensions, extensionsUpdateCounter])

  React.useEffect(() => {
    if (!getUserDataExtensions) {
      return
    }

    const extensions = getUserDataExtensions() || {}
    const hasData = Object.keys(extensions).length > 0

    if (hasData) {
      return
    }

    const maxRetries = 30
    let retryCount = 0

    const retryInterval = setInterval(() => {
      if (!getUserDataExtensions) {
        clearInterval(retryInterval)
        return
      }

      const currentExtensions = getUserDataExtensions() || {}
      const currentHasData = Object.keys(currentExtensions).length > 0

      if (currentHasData) {
        setExtensionsUpdateCounter((prev) => prev + 1)
        clearInterval(retryInterval)
      } else {
        retryCount += 1
        if (retryCount % 5 === 0) {
          setExtensionsUpdateCounter((prev) => prev + 1)
        }
        if (retryCount >= maxRetries) {
          clearInterval(retryInterval)
        }
      }
    }, retryCount < 10 ? 200 : 1000)

    return () => {
      clearInterval(retryInterval)
    }
  }, [getUserDataExtensions, extensionsUpdateCounter])

  const matchesFilters = React.useCallback(
    (dn: string, section: string) => {
      if (searchQuery?.trim()) {
        const query = searchQuery.toLowerCase().trim()
        if (!matchesSearchQuery(dn, query, userDataExtensions)) {
          return false
        }
      }

      if (selectedTeam && selectedTeam !== 'all') {
        if (!matchesTeamSelection(dn, selectedTeam, userDataExtensions)) {
          return false
        }
      }

      if (selectedStatus && selectedStatus !== 'all') {
        if (!matchesStatusSelection(section, selectedStatus)) {
          return false
        }
      }

      return true
    },
    [selectedTeam, selectedStatus, searchQuery, userDataExtensions]
  )

  const dnsList = Object.values(dnsMap)
  const sections: SectionBuckets = {
    supervision: [],
    onCall: [],
    activeIdle: [],
    downOffline: [],
  }

  dnsList.forEach((entry: { dn: string; devices: unknown }) => {
    const { dn, devices } = entry
    const deviceList = devicesObjectToList(devices)
    const call = getDnCallState(dn)
    const active = hasActiveCalls(dn)
    const section = categorizeDns(dn, deviceList, call, active)

    if (shouldOmitSupervisorRowForSilentMonitoring(dn, userAddress, activeMonitoring, section)) {
      return
    }
    if (!matchesFilters(dn, section)) {
      return
    }

    const bucket = sections[section as keyof SectionBuckets]
    if (bucket) {
      bucket.push({ dn, devices: deviceList, call, active })
    }
  })

  const sortedSections: SectionBuckets = {
    supervision: sortSectionsByDuration(sections.supervision, sortBy),
    onCall: sortSectionsByDuration(sections.onCall, sortBy),
    activeIdle: sortSectionsByDuration(sections.activeIdle, sortBy, idleSinceByDn),
    downOffline: sortSectionsByDuration(sections.downOffline, sortBy),
  }

  return (
    <Row className="mt-3">
      <Col md={12}>
        <div className="container-fluid pt-3 pb-3">
          {SECTION_ORDER.map((sectionKey) => {
            const sectionDns = sortedSections[sectionKey as keyof SectionBuckets]

            return (
              <SectionContainer
                key={sectionKey}
                sectionKey={sectionKey}
                sectionDns={sectionDns}
                summaryData={summaryData}
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
                isCollapsed={collapsedSections[sectionKey] || false}
                onToggle={() => toggleSection(sectionKey)}
              />
            )
          })}
          {loading && (
            <div className="col-12 text-center">
              <div className="loading-spinner">
                <output className="d-inline-block" aria-live="polite">
                  <div className="spinner-border" aria-hidden="true" />
                  <span className="visually-hidden">Loading...</span>
                </output>
              </div>
            </div>
          )}
        </div>
      </Col>
    </Row>
  )
}

export default SectionsRenderer
