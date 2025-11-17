import React from 'react';
import { Col } from 'react-bootstrap';
import dynamic from 'next/dynamic';

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface UserGrowthChartProps {
    chartData: {
        series: Array<{ name: string; data: number[] }>;
        options: any;
    };
}

const UserGrowthChart: React.FC<UserGrowthChartProps> = ({ chartData }) => {
    return (
        <Col md={7} className="mb-3">
            <div className="card">
                <div className="card-body">
                    <h5>User Growth (Last 6 Months)</h5>
                    <ReactApexChart
                        options={chartData.options}
                        series={chartData.series}
                        type="area"
                        height={300}
                    />
                </div>
            </div>
        </Col>
    );
};

export default UserGrowthChart;

