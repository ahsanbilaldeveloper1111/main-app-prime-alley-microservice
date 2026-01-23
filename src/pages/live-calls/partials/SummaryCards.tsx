import React from 'react'
import { Card, Col, Row } from 'react-bootstrap'
import { Headset, PhoneCall, UserCheck, Clock, UserX, PhoneIncoming, Hourglass } from 'lucide-react'
import { calculateLongestCallDuration } from '@components/live-calls/utils/helpers'

interface SummaryCardsProps {
  supervisionCount: number
  onCallCount: number
  activeIdleCount: number
  downOfflineCount: number
  callStateMap: Record<string, any>
  categorizedDns: Record<string, string>
  oldestIdleInfo: { dn: string; deviceName: string; when: string } | null
  getUserDataExtensions: () => any
}

const SummaryCards: React.FC<SummaryCardsProps> = ({
  supervisionCount,
  onCallCount,
  activeIdleCount,
  downOfflineCount,
  callStateMap,
  categorizedDns,
  oldestIdleInfo,
  getUserDataExtensions
}) => {
  const longestCallDuration = calculateLongestCallDuration(callStateMap)

  return (
    <div className="mb-4">
      <Row className="g-3">
        {/* Live Coaching Card */}
        <Col xs={6} sm={6} md={4} lg={3} xl>
          <Card 
            className="border-0 shadow-sm h-100" 
            style={{ 
              backgroundColor: '#ffffff',
              borderLeft: '4px solid #f59e0b'
            }}
          >
            <Card.Body className="p-3 d-flex align-items-center justify-content-between">
              <div 
                className="rounded d-flex align-items-center justify-content-center"
                style={{ 
                  width: '48px', 
                  height: '48px',
                  minWidth: '48px',
                  backgroundColor: '#fef3c7',
                  color: '#f59e0b'
                }}
              >
                <Headset size={22} />
              </div>
              <div className="text-end ms-3">
                <div className="fw-bold mb-1" style={{ fontSize: '1.75rem', lineHeight: '1', color: '#1f2937' }}>
                  {supervisionCount}
                </div>
                <div className="text-muted fw-semibold" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Live Coaching
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Live Calls Card */}
        <Col xs={6} sm={6} md={4} lg={3} xl>
          <Card 
            className="border-0 shadow-sm h-100" 
            style={{ 
              backgroundColor: '#ffffff',
              borderLeft: '4px solid #22c55e'
            }}
          >
            <Card.Body className="p-3 d-flex align-items-center justify-content-between">
              <div 
                className="rounded d-flex align-items-center justify-content-center"
                style={{ 
                  width: '48px', 
                  height: '48px',
                  minWidth: '48px',
                  backgroundColor: '#dcfce7',
                  color: '#22c55e'
                }}
              >
                <PhoneCall size={22} />
              </div>
              <div className="text-end ms-3">
                <div className="fw-bold mb-1" style={{ fontSize: '1.75rem', lineHeight: '1', color: '#1f2937' }}>
                  {onCallCount}
                </div>
                <div className="text-muted fw-semibold" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Live Calls
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Available Card */}
        <Col xs={6} sm={6} md={4} lg={3} xl>
          <Card 
            className="border-0 shadow-sm h-100" 
            style={{ 
              backgroundColor: '#ffffff',
              borderLeft: '4px solid #6b7280'
            }}
          >
            <Card.Body className="p-3 d-flex align-items-center justify-content-between">
              <div 
                className="rounded d-flex align-items-center justify-content-center"
                style={{ 
                  width: '48px', 
                  height: '48px',
                  minWidth: '48px',
                  backgroundColor: '#f3f4f6',
                  color: '#6b7280'
                }}
              >
                <UserCheck size={22} />
              </div>
              <div className="text-end ms-3">
                <div className="fw-bold mb-1" style={{ fontSize: '1.75rem', lineHeight: '1', color: '#1f2937' }}>
                  {activeIdleCount}
                </div>
                <div className="text-muted fw-semibold" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Available
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Idle Card */}
        <Col xs={6} sm={6} md={4} lg={3} xl>
          <Card 
            className="border-0 shadow-sm h-100" 
            style={{ 
              backgroundColor: '#ffffff',
              borderLeft: '4px solid #f59e0b'
            }}
          >
            <Card.Body className="p-3 d-flex align-items-center justify-content-between">
              <div 
                className="rounded d-flex align-items-center justify-content-center"
                style={{ 
                  width: '48px', 
                  height: '48px',
                  minWidth: '48px',
                  backgroundColor: '#fef3c7',
                  color: '#f59e0b'
                }}
              >
                <Clock size={22} />
              </div>
              <div className="text-end ms-3">
                <div className="fw-bold mb-1" style={{ fontSize: '1.75rem', lineHeight: '1', color: '#1f2937' }}>
                  {activeIdleCount}
                </div>
                <div className="text-muted fw-semibold" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Idle
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Offline Card */}
        <Col xs={6} sm={6} md={4} lg={3} xl>
          <Card 
            className="border-0 shadow-sm h-100" 
            style={{ 
              backgroundColor: '#ffffff',
              borderLeft: '4px solid #ef4444'
            }}
          >
            <Card.Body className="p-3 d-flex align-items-center justify-content-between">
              <div 
                className="rounded d-flex align-items-center justify-content-center"
                style={{ 
                  width: '48px', 
                  height: '48px',
                  minWidth: '48px',
                  backgroundColor: '#fee2e2',
                  color: '#ef4444'
                }}
              >
                <UserX size={22} />
              </div>
              <div className="text-end ms-3">
                <div className="fw-bold mb-1" style={{ fontSize: '1.75rem', lineHeight: '1', color: '#1f2937' }}>
                  {downOfflineCount}
                </div>
                <div className="text-muted fw-semibold" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Offline
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Longest Call Duration Card */}
        <Col xs={6} sm={6} md={4} lg={3} xl>
          <Card 
            className="border-0 shadow-sm h-100" 
            style={{ 
              backgroundColor: '#ffffff',
              borderLeft: '4px solid #22c55e'
            }}
          >
            <Card.Body className="p-3 d-flex align-items-center justify-content-between">
              <div 
                className="rounded d-flex align-items-center justify-content-center"
                style={{ 
                  width: '48px', 
                  height: '48px',
                  minWidth: '48px',
                  backgroundColor: '#dcfce7',
                  color: '#22c55e'
                }}
              >
                <PhoneIncoming size={22} />
              </div>
              <div className="text-end ms-3">
                <div className="fw-bold mb-1" style={{ fontSize: '1.75rem', lineHeight: '1', color: '#1f2937' }}>
                  {longestCallDuration}
                </div>
                <div className="text-muted fw-semibold" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
                  Longest Call
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        
      </Row>
    </div>
  )
}

export default SummaryCards

