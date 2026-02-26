import React from 'react';
import { Col } from 'react-bootstrap';
import dynamic from 'next/dynamic';

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface LoginActivityBreakdownChartProps {
    chartData: {
        series: {name: string, data: number[], color?: string}[];
        options: any;
    };
}

const LoginActivityBreakdownChart: React.FC<LoginActivityBreakdownChartProps> = ({ chartData }) => {
    return (
        <Col md={4}>
            <div className="card">
                <div className="card-body">
                    <h5>Login Activity Breakdown</h5>
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

export default LoginActivityBreakdownChart;

