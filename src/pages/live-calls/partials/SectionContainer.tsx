import React from 'react'
import { CtiDevice } from './_types'
import UserCard from './UserCard'
import { getSectionColor, getSectionIcon, getSectionTitle } from './_helpers'

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
  selectedTone: Record<string, string>
  isDnInActiveCall: (dn: string) => boolean
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
  selectedTone,
  isDnInActiveCall
}) => {
  const hasContent = sectionDns.length > 0

  return (
    <div 
      key={sectionKey} 
      className="mb-3 section-card-header" 
      data-section={sectionKey} 
      style={{ borderColor: getSectionColor(sectionKey) }}
    >
      <div className="d-flex align-items-center justify-content-between card-header-top-section">
        <div className="d-flex align-items-center">
          <i className="material-icons-two-tone me-2" style={{ fontSize: '1.5rem' }}>
            {getSectionIcon(sectionKey)}
          </i>
          <h6 className="mb-0 app-title-heading">{getSectionTitle(sectionKey)}</h6>
        </div>
        <span className="badge" style={{ backgroundColor: getSectionColor(sectionKey) }}>
          {sectionDns.length}
        </span>
      </div>

      {/* Progress Bar */}
      {sectionDns.length > 0 && (
        <div className="progress-container">
          <div className="progress" style={{ height: '6px', backgroundColor: '#e9ecef' }}>
            <div 
              className="progress-bar" 
              role="progressbar" 
              style={{ 
                width: `${summaryData.extensions > 0 ? (sectionDns.length / summaryData.extensions) * 100 : 0}%`,
                backgroundColor: getSectionColor(sectionKey),
                transition: 'width 0.3s ease'
              }}
              aria-valuenow={sectionDns.length}
              aria-valuemin={0}
              aria-valuemax={summaryData.extensions}
            />
          </div>
        </div>
      )}

      <div className={`card-body-section ${hasContent ? 'has-content' : ''}`} data-section={sectionKey}>
        {hasContent ? (
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
                selectedTone={selectedTone}
                isDnInActiveCall={isDnInActiveCall}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default SectionContainer

