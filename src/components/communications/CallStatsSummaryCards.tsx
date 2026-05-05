import React, { useMemo } from 'react';
import { Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed, PhoneOff } from 'lucide-react';
import StatsCards from '@components/GenericStatsCards';
import { useAppSelector } from '../../toolkit/hooks';

const GRID_MIN_WIDTH = '180px';

const CallStatsSummaryCards: React.FC = () => {
  const stats = useAppSelector((s) => s.callDashboard.generalStats);

  const data = useMemo(
    () => [
      {
        title: 'Total Calls',
        value: stats.totalCalls,
        icon: Phone,
        iconColor: '#3B82F6',
        iconBgColor: '#DBEAFE',
        subtitle: 'Total calls in the system',
      },
      {
        title: 'Inbound',
        value: stats.totalInbound,
        icon: PhoneIncoming,
        iconColor: '#10B981',
        iconBgColor: '#D1FAE5',
        subtitle: 'Inbound calls in the system',
      },
      {
        title: 'Outbound',
        value: stats.totalOutbound,
        icon: PhoneOutgoing,
        iconColor: '#0EA5E9',
        iconBgColor: '#E0F2FE',
        subtitle: 'Outbound calls in the system',
      },
      {
        title: 'Missed Incoming',
        value: stats.totalMissedIncoming,
        icon: PhoneMissed,
        iconColor: '#F59E0B',
        iconBgColor: '#FEF3C7',
        subtitle: 'Missed incoming calls in the system',
      },
      {
        title: 'Missed Outgoing',
        value: stats.totalMissedOutgoing,
        icon: PhoneOff,
        iconColor: '#EF4444',
        iconBgColor: '#FEE2E2',
        subtitle: 'Missed outgoing calls in the system',
      },
    ],
    [stats],
  );

  return (
    <div className="mb-4">
      <StatsCards data={data} gridMinWidth={GRID_MIN_WIDTH} />
    </div>
  );
};

export default CallStatsSummaryCards;
