import React from 'react';
import { Col } from 'react-bootstrap';
import dynamic from 'next/dynamic';

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface ActiveInactiveUsersChartProps {
    chartData: {
        series: {name: string, data: number[]}[];
        options: any;
    };
}

const ActiveInactiveUsersChart: React.FC<ActiveInactiveUsersChartProps> = ({ chartData }) => {
    return (
        <Col md={4}>
            <div className="card">
                <div className="card-body">
                    <h5>Active vs Inactive Users</h5>
                    <ReactApexChart
                        options={chartData.options}
                        series={chartData.series}
                        type="bar"
                        height={300}
                    />
                </div>
            </div>
        </Col>
    );
};

export default ActiveInactiveUsersChart;

