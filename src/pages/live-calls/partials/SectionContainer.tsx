import React, { useEffect } from 'react'
import { Card, Button, Badge } from 'react-bootstrap'
import { ChevronRight, ChevronDown } from 'lucide-react'
import { CtiDevice } from '@components/live-calls/utils/types'
import UserCard from './UserCard'
import { getSectionColor, getSectionIcon, getSectionTitle } from '@components/live-calls/utils/helpers'
import { Eye, Phone, CheckCircle, AlertCircle, PhoneCall, Maximize2, ExternalLink, Volume2, Mic, Users, Headset, User, Bell, ChevronLeft, Menu, Search, Filter, ChevronUp, UserCheck, Clock, Timer, UserX, PhoneIncoming, Hourglass } from 'lucide-react';

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
  isCollapsed: boolean
  onToggle: () => void
}

const SectionContainer: React.FC<SectionContainerProps> = ({
  sectionKey,
  sectionDns,
  summaryData,
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
  isCollapsed,
  onToggle
}) => {
  const hasContent = sectionDns.length > 0

  const sectionTitle = getSectionTitle(sectionKey)
  const sectionIcon = getSectionIcon(sectionKey)
  const sectionColor = getSectionColor(sectionKey)

  // Get icon color based on section
  const iconColor = sectionKey === 'supervision' ? '#f59e0b' : 
                    sectionKey === 'onCall' ? '#22c55e' : 
                    sectionKey === 'activeIdle' ? '#6b7280' : 
                    sectionKey === 'offline' ? '#ef4444' : '#ef4444'

  // Auto-collapse section if no agents available
  useEffect(() => {
    if (!hasContent && !isCollapsed) {
      onToggle()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasContent, isCollapsed])

  return (
    <div className="mb-4" data-section={sectionKey}>
      {/* Section Header */}
      <Card className="border-0 shadow-sm mb-0">
        <Card.Body className="p-3">
          <div className="d-flex justify-content-between align-items-center">
            <Button
              variant="link"
              className="p-0 text-dark text-decoration-none d-flex align-items-center gap-2"
              onClick={onToggle}
              style={{ fontSize: '1.1rem', fontWeight: '600' }}
            >
              {(!hasContent || isCollapsed) ? <ChevronRight size={20} /> : <ChevronDown size={20} />}
              
              <div style={{ 
                      color: sectionKey === 'supervision' ? '#f59e0b' : 
                             sectionKey === 'onCall' ? '#22c55e' : 
                             sectionKey === 'activeIdle' ? '#6b7280' : 
                             sectionKey === 'downOffline' ? '#ef4444' : '#6b7280'
                    }}>
                      {sectionIcon === 'Eye' ? <Eye size={20} /> : sectionIcon === 'Phone' ? <Phone size={20} /> : sectionIcon === 'CheckCircle' ? <CheckCircle size={20} /> : sectionIcon === 'AlertCircle' ? <AlertCircle size={20} /> : sectionIcon === 'PhoneCall' ? <PhoneCall size={20} /> : null}
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

      {/* Progress Bar */}
      {/* {!isCollapsed && sectionDns.length > 0 && (
        <div className="progress-container mb-3">
          <div className="progress" style={{ height: '6px', backgroundColor: '#e9ecef' }}>
            <div 
              className="progress-bar" 
              role="progressbar" 
              style={{ 
                width: `${summaryData.extensions > 0 ? (sectionDns.length / summaryData.extensions) * 100 : 0}%`,
                backgroundColor: sectionColor,
                transition: 'width 0.3s ease'
              }}
              aria-valuenow={sectionDns.length}
              aria-valuemin={0}
              aria-valuemax={summaryData.extensions}
            />
          </div>
        </div>
      )} */}

      {/* Section Content */}
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
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default SectionContainer

