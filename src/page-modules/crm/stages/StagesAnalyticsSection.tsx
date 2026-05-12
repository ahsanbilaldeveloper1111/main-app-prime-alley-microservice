import React from "react";
import { Card, Col, Row } from "react-bootstrap";
import { Layers, Target, TrendingUp } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { StagesKpiCard } from "@page-modules/crm/stages/StagesKpiCard";

export interface StagesAnalyticsData {
  total: number;
  byType: {
    lead: number;
    deal: number;
    order: number;
    lost_reason: number;
  };
  stagesByType: { type: string; count: number; fill: string }[];
}

export interface StagesAnalyticsSectionProps {
  analyticsData: StagesAnalyticsData;
}

/** Used by the stages page to render the analytics KPI row + pie chart. */
export const StagesAnalyticsSection: React.FC<StagesAnalyticsSectionProps> = ({
  analyticsData,
}) => {
  return (
    <>
      <Row className="mb-4">
        <Col lg={3} md={6} className="mb-3">
          <StagesKpiCard
            title="Total Stages"
            value={analyticsData.total.toString()}
            icon={<Layers size={24} />}
            color="primary"
          />
        </Col>
        <Col lg={3} md={6} className="mb-3">
          <StagesKpiCard
            title="Lead Stages"
            value={analyticsData.byType.lead.toString()}
            icon={<Target size={24} />}
            color="primary"
          />
        </Col>
        <Col lg={3} md={6} className="mb-3">
          <StagesKpiCard
            title="Deal Stages"
            value={analyticsData.byType.deal.toString()}
            icon={<TrendingUp size={24} />}
            color="warning"
          />
        </Col>
        <Col lg={3} md={6} className="mb-3">
          <StagesKpiCard
            title="Order Stages"
            value={analyticsData.byType.order.toString()}
            icon={<Layers size={24} />}
            color="success"
          />
        </Col>
      </Row>

      {analyticsData.stagesByType.length > 0 && (
        <Row className="mb-4">
          <Col lg={6} className="mb-4">
            <Card className="border-0 shadow-sm h-100">
              <Card.Body>
                <h5 className="mb-4 fw-bold">Stages by Type</h5>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={analyticsData.stagesByType}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(props) => {
                        const slice = props as unknown as {
                          type?: string;
                          count?: number;
                          payload?: { type?: string; count?: number };
                        };
                        const p = slice.payload ?? slice;
                        return `${p.type ?? ""}: ${p.count ?? 0}`;
                      }}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {analyticsData.stagesByType.map((entry) => (
                        <Cell
                          key={`pie-slice-${entry.type}`}
                          fill={entry.fill}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </>
  );
};
