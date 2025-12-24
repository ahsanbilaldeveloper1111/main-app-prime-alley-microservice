import React from 'react'
import { Col, Row } from 'react-bootstrap'
import SectionContainer from './SectionContainer'
import { SECTION_ORDER } from './constants'
import { CtiDevice } from './types'

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
  selectedTone: Record<string, string>
  isDnInActiveCall: (dn: string) => boolean
  loading: boolean
  selectedTeam: string
  searchQuery: string
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
  selectedTone,
  isDnInActiveCall,
  loading,
  selectedTeam,
  searchQuery
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
  const matchesFilters = React.useCallback((dn: string) => {
    // Search filter
    if (searchQuery && searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      const dnLower = String(dn).toLowerCase()
      if (!dnLower.includes(query)) {
        return false
      }
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

    return true
  }, [selectedTeam, searchQuery, userDataExtensions])

  // Group DNs by sections and apply filters
  const dnsList = Object.values(dnsMap)
  const sections = {
    supervision: [] as any[],
    onCall: [] as any[],
    activeIdle: [] as any[],
    downOffline: [] as any[]
  }

  dnsList.forEach(({ dn, devices }: any) => {
    // Apply filters
    if (!matchesFilters(dn)) {
      return
    }

    const deviceList = Object.values(devices || {}) as CtiDevice[]
    const call = getDnCallState(dn)
    const active = hasActiveCalls(dn)
    const section = categorizeDns(dn, deviceList, call, active)
    
    sections[section as keyof typeof sections].push({ dn, devices: deviceList, call, active })
  })

  return (
    <Row className="mt-3">
      <Col md={12}>
        <div className="container-fluid pt-3 pb-3">
          {SECTION_ORDER.map(sectionKey => {
            const sectionDns = sections[sectionKey as keyof typeof sections]

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
                selectedTone={selectedTone}
                isDnInActiveCall={isDnInActiveCall}
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

