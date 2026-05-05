import React from 'react';
import type { TrendByCountry } from './types';
import { Row } from 'react-bootstrap';
import { useAppSelector } from '../../toolkit/hooks';
import { formatCallDuration } from './callDashboardFormatters';
import CallDashboardStatsTable from './CallDashboardStatsTable';

const CallDashboardStatsTablesRow: React.FC = () => {
  const extensionData = useAppSelector((s) => s.callDashboard.extensionData);
  const trendByCountryData = useAppSelector((s) => s.callDashboard.trendByCountryData);

  return (
    <Row>
      <CallDashboardStatsTable
        show
        title="Call by Extension"
        emptyTitle="No Call by Extension Data"
        emptyDescription="List of call by extension data will appear here."
        data={extensionData}
        columns={[
          { header: 'Extension', cell: (row) => String(row.Extension ?? '') },
          { header: 'Calls', cell: (row) => String(row.Calls ?? '') },
          { header: 'Answered', cell: (row) => String(row.Answered ?? '') },
          { header: 'Un Answered', cell: (row) => String(row.Unanswered ?? '') },
          {
            header: 'Duration',
            cell: (row) => formatCallDuration(Number(row.TotalDuration)),
          },
        ]}
        viewAllHref="/reports/call-analytics/stats/extension"
      />

      <CallDashboardStatsTable<TrendByCountry>
        show
        title="Call Stats by Country"
        emptyTitle="No Call Stats by Country Data"
        emptyDescription="List of call stats by country data will appear here."
        data={trendByCountryData}
        columns={[
          { header: 'Country', cell: (row) => row.Country },
          { header: 'Calls', cell: (row) => row.Calls },
          { header: 'Answered', cell: (row) => row.Answered },
          { header: 'Un Answered', cell: (row) => row.Unanswered },
          {
            header: 'Duration',
            cell: (row) => formatCallDuration(Number(row.TotalDuration)),
          },
        ]}
        viewAllHref="/reports/call-analytics/stats/country"
      />
    </Row>
  );
};

export default CallDashboardStatsTablesRow;
