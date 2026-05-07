import dynamic from 'next/dynamic';

const CallDashboardApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

export default CallDashboardApexChart;
