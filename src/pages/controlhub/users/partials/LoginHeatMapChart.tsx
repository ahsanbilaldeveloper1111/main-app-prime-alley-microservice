import React from 'react';
import { Col } from 'react-bootstrap';
import dynamic from 'next/dynamic';

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface LoginHeatMapChartProps {
    chartData: {
        series: {name: string, data: number[]}[];
        options: any;
    };
}

const LoginHeatMapChart: React.FC<LoginHeatMapChartProps> = ({ chartData }) => {
    return (
        <Col md={8}>
            <div className="card">
                <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5 className="mb-0">Login Heat Map</h5>
                    </div>
                    <ReactApexChart
                        options={chartData.options}
                        series={chartData.series}
                        type="heatmap"
                        height={420}
                    />
                </div>
            </div>
        </Col>
    );
};

export default LoginHeatMapChart;

