import React from 'react';
import { useAppDispatch, useAppSelector } from '../../toolkit/hooks';
import {
  setShowCountryChartModal,
  setShowDepartmentChartModal,
  setShowExtensionChartModal,
} from '../../toolkit/callDashboard/slice';
import CallChartDetailModal from './CallChartDetailModal';

const CallDashboardChartModalsRow: React.FC = () => {
  const dispatch = useAppDispatch();
  const showCountryChartModal = useAppSelector(
    (s) => s.callDashboard.showCountryChartModal,
  );
  const showDepartmentChartModal = useAppSelector(
    (s) => s.callDashboard.showDepartmentChartModal,
  );
  const showExtensionChartModal = useAppSelector(
    (s) => s.callDashboard.showExtensionChartModal,
  );
  const CountryChart = useAppSelector((s) => s.callDashboard.countryChart);
  const DepartmentChart = useAppSelector((s) => s.callDashboard.departmentChart);
  const ExtensionChart = useAppSelector((s) => s.callDashboard.extensionChart);

  return (
    <>
      <CallChartDetailModal
        show={showCountryChartModal}
        title="Calls by Country"
        onHide={() => dispatch(setShowCountryChartModal(false))}
        chartOptions={CountryChart.options}
        chartSeries={CountryChart.series}
      />

      <CallChartDetailModal
        show={showDepartmentChartModal}
        title="Calls by Department"
        onHide={() => dispatch(setShowDepartmentChartModal(false))}
        chartOptions={DepartmentChart.options}
        chartSeries={DepartmentChart.series}
      />

      <CallChartDetailModal
        show={showExtensionChartModal}
        title="Calls by Extension"
        onHide={() => dispatch(setShowExtensionChartModal(false))}
        chartOptions={ExtensionChart.options}
        chartSeries={ExtensionChart.series}
      />
    </>
  );
};

export default CallDashboardChartModalsRow;
