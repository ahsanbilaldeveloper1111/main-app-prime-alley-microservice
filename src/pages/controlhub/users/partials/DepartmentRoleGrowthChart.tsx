import React from 'react';
import { Col } from 'react-bootstrap';
import dynamic from 'next/dynamic';

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface DepartmentRoleGrowthChartProps {
    chartData: {
        series: {name: string, data: number[]}[];
        options: any;
    };
}

const DepartmentRoleGrowthChart: React.FC<DepartmentRoleGrowthChartProps> = ({ chartData }) => {
    return (
        <Col md={4}>
            <div className="card">
                <div className="card-body">
                    <h5>Department / Role Growth</h5>
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

export default DepartmentRoleGrowthChart;

