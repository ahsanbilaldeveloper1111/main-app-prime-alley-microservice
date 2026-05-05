import React from 'react';
import { Row } from 'react-bootstrap';
import { useAppDispatch, useAppSelector } from '../../toolkit/hooks';
import {
  setShowCountryChartModal,
  setShowDepartmentChartModal,
  setShowExtensionChartModal,
} from '../../toolkit/callDashboard/slice';
import CallBarChartCard from './CallBarChartCard';

const CallDashboardBarChartsRow: React.FC = () => {
  const dispatch = useAppDispatch();
  const showCountryChart = useAppSelector((s) => s.callDashboard.showCountryChart);
  const countryChartData = useAppSelector((s) => s.callDashboard.countryChartData);
  const CountryChart = useAppSelector((s) => s.callDashboard.countryChart);
  const showDepartmentChart = useAppSelector((s) => s.callDashboard.showDepartmentChart);
  const departmentChartData = useAppSelector(
    (s) => s.callDashboard.departmentChartData,
  );
  const DepartmentChart = useAppSelector((s) => s.callDashboard.departmentChart);
  const showExtensionChart = useAppSelector((s) => s.callDashboard.showExtensionChart);
  const extensionChartData = useAppSelector((s) => s.callDashboard.extensionChartData);
  const ExtensionChart = useAppSelector((s) => s.callDashboard.extensionChart);

  return (
    <Row>
      <CallBarChartCard
        show={showCountryChart}
        dataLength={countryChartData.length}
        title="Calls by Country"
        emptyTitle="No Calls by Country Data"
        emptyDescription="Chart data will appear here when available."
        onExpand={() => dispatch(setShowCountryChartModal(true))}
        chartOptions={CountryChart.options}
        chartSeries={CountryChart.series}
      />
      <CallBarChartCard
        show={showDepartmentChart}
        dataLength={departmentChartData.length}
        title="Call by Department"
        emptyTitle="No Calls by Department Data"
        emptyDescription="Chart data will appear here when available."
        onExpand={() => dispatch(setShowDepartmentChartModal(true))}
        chartOptions={DepartmentChart.options}
        chartSeries={DepartmentChart.series}
      />
      <CallBarChartCard
        show={showExtensionChart}
        dataLength={extensionChartData.length}
        title="Call by Extension"
        emptyTitle="No Calls by Extension Data"
        emptyDescription="Chart data will appear here when available."
        onExpand={() => dispatch(setShowExtensionChartModal(true))}
        chartOptions={ExtensionChart.options}
        chartSeries={ExtensionChart.series}
      />
    </Row>
  );
};

export default CallDashboardBarChartsRow;
