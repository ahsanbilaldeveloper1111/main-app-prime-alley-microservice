import React from 'react'
import { Col, Row } from 'react-bootstrap'
import SectionContainer from './SectionContainer'
import { SECTION_ORDER } from '@components/live-calls/utils/constants'
import { CtiDevice } from '@components/live-calls/utils/types'

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
  loading,
  selectedTeam,
  selectedStatus,
  sortBy,
  searchQuery,
  collapsedSections,
  toggleSection
}) => {
  // Get user data extensions for filtering
  const userDataExtensions = React.useMemo(() => {
    try {
      return getUserDataExtensions?.() || {}
    } catch (error) {
      console.error('Error getting user data extensions for filtering:', error)
      return {}
    }
  }, [getUserDataExtensions])

  // Filter function to check if DN matches filters
  const matchesFilters = React.useCallback((dn: string, section: string) => {
    // Search filter
    if (searchQuery && searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      const dnLower = String(dn).toLowerCase()
      
      // Check if DN matches first (fast path)
      const matchesDn = dnLower.includes(query)
      if (matchesDn) {
        return true // DN matches, no need to check name
      }
      
      // Try multiple DN formats to get extension data
      const dnString = String(dn)
      const dnNumber = Number(dn)
      const extensionData = userDataExtensions[dn] || userDataExtensions[dnString] || userDataExtensions[dnNumber] || null
      
      if (!extensionData) {
        // No extension data and DN doesn't match, exclude
        return false
      }
      
      // Get user name - try multiple possible fields
      const userName = extensionData?.name || extensionData?.user_name || extensionData?.userName || ''
      
      // Check if name matches (only if name exists)
      if (userName && userName.trim()) {
        const userNameLower = String(userName).toLowerCase().trim()
        const matchesName = userNameLower.includes(query)
        if (matchesName) {
          return true // Name matches
        }
      }
      
      // Neither DN nor name matches
      return false
    }

    // Team filter
    if (selectedTeam && selectedTeam !== 'all') {
      const extensionData = userDataExtensions[dn] || userDataExtensions[String(dn)] || userDataExtensions[Number(dn)]
      const teamNames = extensionData?.team_name || []
      
      if (teamNames.length === 0) {
        // If user has no teams assigned, exclude them when a team is selected
        return false
      }
      
      // Get team names from getUserTeams to match by ID or name
      const selectedTeamStr = String(selectedTeam).toLowerCase().trim()
      
      // Check if any team name matches the selected team (by name or ID)
      const teamMatch = teamNames.some((teamName: string) => {
        const teamNameStr = String(teamName).toLowerCase().trim()
        // Exact match or partial match
        return teamNameStr === selectedTeamStr || 
               teamNameStr.includes(selectedTeamStr) || 
               selectedTeamStr.includes(teamNameStr)
      })
      
      if (!teamMatch) {
        return false
      }
    }

    // Status filter
    if (selectedStatus && selectedStatus !== 'all') {
      // Map filter values to section keys
      const statusMap: Record<string, string> = {
        'supervision': 'supervision',
        'oncall': 'onCall',
        'active': 'activeIdle',
        'offline': 'downOffline'
      }
      
      const targetSection = statusMap[selectedStatus.toLowerCase()]
      if (targetSection && section !== targetSection) {
        return false
      }
    }

    return true
  }, [selectedTeam, selectedStatus, searchQuery, userDataExtensions])

  // Group DNs by sections and apply filters
  const dnsList = Object.values(dnsMap)
  const sections = {
    supervision: [] as any[],
    onCall: [] as any[],
    activeIdle: [] as any[],
    downOffline: [] as any[]
  }

  dnsList.forEach(({ dn, devices }: any) => {
    const deviceList = Object.values(devices || {}) as CtiDevice[]
    const call = getDnCallState(dn)
    const active = hasActiveCalls(dn)
    const section = categorizeDns(dn, deviceList, call, active)
    
    // Apply filters (including status filter which needs the section)
    if (!matchesFilters(dn, section)) {
      return
    }
    
    sections[section as keyof typeof sections].push({ dn, devices: deviceList, call, active })
  })

  // Sort by duration if sortBy is set
  const sortSectionsByDuration = (sectionArray: any[], sortOrder: string) => {
    if (sortOrder === 'none') return sectionArray

    return [...sectionArray].sort((a, b) => {
      const getCallDuration = (item: any) => {
        if (!item.call || !item.call.eventTime) return 0
        const eventTime = new Date(item.call.eventTime).getTime()
        const now = Date.now()
        return now - eventTime // Duration in milliseconds
      }

      const durationA = getCallDuration(a)
      const durationB = getCallDuration(b)

      if (sortOrder === 'longest') {
        return durationB - durationA // Longest first (descending)
      } else if (sortOrder === 'shortest') {
        return durationA - durationB // Shortest first (ascending)
      }

      return 0
    })
  }

  // Apply sorting to each section
  const sortedSections = {
    supervision: sortSectionsByDuration(sections.supervision, sortBy),
    onCall: sortSectionsByDuration(sections.onCall, sortBy),
    activeIdle: sortSectionsByDuration(sections.activeIdle, sortBy),
    downOffline: sortSectionsByDuration(sections.downOffline, sortBy)
  }

  return (
    <Row className="mt-3">
      <Col md={12}>
        <div className="container-fluid pt-3 pb-3">
          {SECTION_ORDER.map(sectionKey => {
            const sectionDns = sortedSections[sectionKey as keyof typeof sortedSections]

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
                isCollapsed={collapsedSections[sectionKey] || false}
                onToggle={() => toggleSection(sectionKey)}
              />
            )
          })}
          {loading && (
            <div className="col-12 text-center">
              <div className="loading-spinner">
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </Col>
    </Row>
  )
}

export default SectionsRenderer

