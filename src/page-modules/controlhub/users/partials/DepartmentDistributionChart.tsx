import React from 'react';
import { Col } from 'react-bootstrap';
import dynamic from 'next/dynamic';

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface DepartmentDistributionChartProps {
    chartData: {
        series: number[];
        options: any;
    };
}

const DepartmentDistributionChart: React.FC<DepartmentDistributionChartProps> = ({ chartData }) => {
    return (
        <Col md={5} className="mb-3">
            <div className="card">
                <div className="card-body">
                    <h5>Department Distribution</h5>
                    <ReactApexChart
                        options={chartData.options}
                        series={chartData.series}
                        type="donut"
                        height={300}
                    />
                </div>
            </div>
        </Col>
    );
};

export default DepartmentDistributionChart;

