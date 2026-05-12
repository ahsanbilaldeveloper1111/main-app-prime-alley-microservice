import React from 'react'
import { Card, Col, Row } from 'react-bootstrap'
import type { LucideIcon } from 'lucide-react'
import { Headset, PhoneCall, UserCheck, Clock, UserX, PhoneIncoming } from 'lucide-react'
import { calculateLongestCallDuration } from '@components/live-calls/utils/helpers'

interface SummaryCardsProps {
  supervisionCount: number
  onCallCount: number
  activeIdleCount: number
  downOfflineCount: number
  callStateMap: Record<string, unknown>
  categorizedDns: Record<string, string>
  oldestIdleInfo: { dn: string; deviceName: string; when: string } | null
  getUserDataExtensions: () => unknown
}

type SummaryCardConfig = Readonly<{
  key: string
  borderColor: string
  iconBg: string
  iconColor: string
  Icon: LucideIcon
  label: string
  value: string | number
  labelStyle?: React.CSSProperties
}>

function SummaryStatCard({
  borderColor,
  iconBg,
  iconColor,
  Icon,
  label,
  value,
  labelStyle,
}: Omit<SummaryCardConfig, 'key'>) {
  return (
    <Card
      className="border-0 shadow-sm h-100"
      style={{
        backgroundColor: '#ffffff',
        borderLeft: `4px solid ${borderColor}`,
      }}
    >
      <Card.Body className="p-3 d-flex align-items-center justify-content-between">
        <div
          className="rounded d-flex align-items-center justify-content-center"
          style={{
            width: '48px',
            height: '48px',
            minWidth: '48px',
            backgroundColor: iconBg,
            color: iconColor,
          }}
        >
          <Icon size={22} />
        </div>
        <div className="text-end ms-3">
          <div
            className="fw-bold mb-1"
            style={{ fontSize: '1.75rem', lineHeight: '1', color: '#1f2937' }}
          >
            {value}
          </div>
          <div
            className="text-muted fw-semibold"
            style={{
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              ...labelStyle,
            }}
          >
            {label}
          </div>
        </div>
      </Card.Body>
    </Card>
  )
}

const colProps = { xs: 6 as const, sm: 6 as const, md: 4 as const, lg: 3 as const, xl: true as const }

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

  const cards: SummaryCardConfig[] = [
    {
      key: 'coaching',
      borderColor: '#f59e0b',
      iconBg: '#fef3c7',
      iconColor: '#f59e0b',
      Icon: Headset,
      label: 'Live Coaching',
      value: supervisionCount,
    },
    {
      key: 'live',
      borderColor: '#22c55e',
      iconBg: '#dcfce7',
      iconColor: '#22c55e',
      Icon: PhoneCall,
      label: 'Live Calls',
      value: onCallCount,
    },
    {
      key: 'available',
      borderColor: '#6b7280',
      iconBg: '#f3f4f6',
      iconColor: '#6b7280',
      Icon: UserCheck,
      label: 'Available',
      value: activeIdleCount,
    },
    {
      key: 'idle',
      borderColor: '#f59e0b',
      iconBg: '#fef3c7',
      iconColor: '#f59e0b',
      Icon: Clock,
      label: 'Idle',
      value: activeIdleCount,
    },
    {
      key: 'offline',
      borderColor: '#ef4444',
      iconBg: '#fee2e2',
      iconColor: '#ef4444',
      Icon: UserX,
      label: 'Offline',
      value: downOfflineCount,
    },
    {
      key: 'longest',
      borderColor: '#22c55e',
      iconBg: '#dcfce7',
      iconColor: '#22c55e',
      Icon: PhoneIncoming,
      label: 'Longest Call',
      value: longestCallDuration,
      labelStyle: { whiteSpace: 'nowrap' },
    },
  ]

  return (
    <div className="mb-4">
      <Row className="g-3">
        {cards.map(
          ({
            key,
            borderColor,
            iconBg,
            iconColor,
            Icon,
            label,
            value,
            labelStyle,
          }) => (
            <Col key={key} {...colProps}>
              <SummaryStatCard
                borderColor={borderColor}
                iconBg={iconBg}
                iconColor={iconColor}
                Icon={Icon}
                label={label}
                value={value}
                labelStyle={labelStyle}
              />
            </Col>
          ),
        )}
      </Row>
    </div>
  )
}

export default SummaryCards
