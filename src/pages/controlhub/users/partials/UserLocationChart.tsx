import React from 'react';
import { Col } from 'react-bootstrap';
import dynamic from 'next/dynamic';

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface UserLocationChartProps {
    chartData: {
        series: {name: string, data: number[]}[];
        options: any;
    };
}

const UserLocationChart: React.FC<UserLocationChartProps> = ({ chartData }) => {
    return (
        <Col md={4}>
            <div className="card">
                <div className="card-body">
                    <h5>Active user location</h5>
                    <ReactApexChart
                        options={chartData.options}
                        series={chartData.series}
                        type="bar"
                        height={350}
                    />
                </div>
            </div>
        </Col>
    );
};

export default UserLocationChart;

