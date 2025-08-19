import React from 'react';
import { Row, Col, Card } from 'react-bootstrap';
import ChartBar from './ChartBar';

const ChartBarExample: React.FC = () => {
  // Sample data for different chart types
  const callsData = [
    { name: 'Total', data: [120, 85, 95, 110, 75] },
    { name: 'Answered', data: [100, 70, 80, 90, 60] },
    { name: 'Unanswered', data: [20, 15, 15, 20, 15] }
  ];

  const timeData = [
    { name: 'Max Duration', data: [300, 250, 280, 320, 240] },
    { name: 'Avg Duration', data: [180, 150, 170, 200, 140] },
    { name: 'Min Duration', data: [60, 45, 50, 80, 40] }
  ];

  const costData = [
    { name: 'Max Cost', data: [25.50, 18.75, 22.00, 28.50, 16.80] },
    { name: 'Avg Cost', data: [15.25, 12.50, 14.75, 18.00, 11.20] },
    { name: 'Min Cost', data: [5.00, 3.25, 4.50, 7.50, 2.80] }
  ];

  const categories = ['USA', 'Canada', 'UK', 'Germany', 'France'];

  return (
    <div className="p-4">
      <h2 className="mb-4">ChartBar Component Examples</h2>
      
      <Row>
        <Col md={6} className="mb-4">
          <Card>
            <Card.Body>
              <ChartBar
                title="Calls by Country"
                series={callsData}
                categories={categories}
                dataType="calls"
                height={300}
                showFullScreenButton={true}
                onFullScreenClick={() => console.log('Full screen clicked')}
              />
            </Card.Body>
          </Card>
        </Col>

        <Col md={6} className="mb-4">
          <Card>
            <Card.Body>
              <ChartBar
                title="Duration by Country"
                series={timeData}
                categories={categories}
                dataType="time"
                height={300}
                colors={['#ff6b6b', '#4ecdc4', '#45b7d1']}
                showLegend={true}
                legendPosition="bottom"
              />
            </Card.Body>
          </Card>
        </Col>

        <Col md={6} className="mb-4">
          <Card>
            <Card.Body>
              <ChartBar
                title="Cost by Country"
                series={costData}
                categories={categories}
                dataType="cost"
                height={300}
                colors={['#96ceb4', '#ffeaa7', '#dda0dd']}
                showDataLabels={true}
                barHeight="80%"
                borderRadius={8}
              />
            </Card.Body>
          </Card>
        </Col>

        <Col md={6} className="mb-4">
          <Card>
            <Card.Body>
              <ChartBar
                title="Custom Data"
                series={[
                  { name: 'Series A', data: [45, 52, 38, 24, 33] },
                  { name: 'Series B', data: [35, 41, 62, 42, 13] }
                ]}
                categories={categories}
                dataType="custom"
                height={300}
                customTooltipFormatter={(value, seriesName) => `${seriesName}: ${value} units`}
                horizontal={false}
                showLegend={true}
                legendPosition="top"
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col md={12}>
          <Card>
            <Card.Body>
              <h5>Loading State Example</h5>
              <ChartBar
                title="Loading Chart"
                series={[]}
                categories={[]}
                loading={true}
                height={200}
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ChartBarExample; 