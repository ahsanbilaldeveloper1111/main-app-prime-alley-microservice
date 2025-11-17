import React from 'react';
import { Row, Col } from 'react-bootstrap';
import PageSummaryGrid, { SummaryCard } from '@components/PageSummaryGrid';
import ActiveInactiveUsersChart from './ActiveInactiveUsersChart';
import LoginActivityBreakdownChart from './LoginActivityBreakdownChart';
import DepartmentRoleGrowthChart from './DepartmentRoleGrowthChart';
import LoginHeatMapChart from './LoginHeatMapChart';
import UserLocationChart from './UserLocationChart';
import InsightSummaryCards from './InsightSummaryCards';

interface InsightTabProps {
    summaryCards: SummaryCard[];
    userActivityChart: {
        series: {name: string, data: number[], color?: string}[];
        options: any;
    };
    failedLoginAttemptsChart: {
        series: {name: string, data: number[], color?: string}[];
        options: any;
    };
    departmentGrowthChart: {
        series: {name: string, data: number[]}[];
        options: any;
    };
    loginHeatMapChart: {
        series: {name: string, data: number[]}[];
        options: any;
    };
    userLocationChart: {
        series: {name: string, data: number[]}[];
        options: any;
    };
}

const InsightTab: React.FC<InsightTabProps> = ({
    summaryCards,
    userActivityChart,
    failedLoginAttemptsChart,
    departmentGrowthChart,
    loginHeatMapChart,
    userLocationChart
}) => {
    return (
        <React.Fragment>
            <PageSummaryGrid cards={summaryCards} />

            <Row>
                <ActiveInactiveUsersChart chartData={userActivityChart} />
                <LoginActivityBreakdownChart chartData={failedLoginAttemptsChart} />
                <DepartmentRoleGrowthChart chartData={departmentGrowthChart} />
            </Row>

            <Row>
                <LoginHeatMapChart chartData={loginHeatMapChart} />
                <Col md={4}>
                    <InsightSummaryCards />
                    <UserLocationChart chartData={userLocationChart} />
                </Col>
            </Row>
        </React.Fragment>
    );
};

export default InsightTab;

