import React from 'react';
import { Row, Col, Card } from 'react-bootstrap';
import ChartDonut from './ChartDonut';

const ChartDonutExample: React.FC = () => {
  // Sample data for different chart types
  const callsData = [120, 85, 95, 110, 75];
  const callsLabels = ['Answered', 'Unanswered', 'Missed', 'Busy', 'Failed'];

  const timeData = [300, 250, 280, 320, 240];
  const timeLabels = ['0-30s', '30-60s', '1-2m', '2-5m', '5m+'];

  const costData = [25.50, 18.75, 22.00, 28.50, 16.80];
  const costLabels = ['Local', 'National', 'International', 'Premium', 'Toll-Free'];

  const percentageData = [45, 25, 20, 10];
  const percentageLabels = ['Mobile', 'Landline', 'VoIP', 'Other'];

  return (
    <div className="p-4">
      <h2 className="mb-4">ChartDonut Component Examples</h2>
      
      <Row>
        <Col md={6} className="mb-4">
          <Card>
            <Card.Body>
              <ChartDonut
                title="Call Status Distribution"
                series={callsData}
                labels={callsLabels}
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
              <ChartDonut
                title="Call Duration Distribution"
                series={timeData}
                labels={timeLabels}
                dataType="time"
                height={300}
                colors={['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7']}
                showLegend={true}
                legendPosition="bottom"
                donutWidth="70%"
              />
            </Card.Body>
          </Card>
        </Col>

        <Col md={6} className="mb-4">
          <Card>
            <Card.Body>
              <ChartDonut
                title="Cost Distribution by Type"
                series={costData}
                labels={costLabels}
                dataType="cost"
                height={300}
                colors={['#96ceb4', '#ffeaa7', '#dda0dd', '#fdcb6e', '#74b9ff']}
                showDataLabels={true}
                dataLabelsFormatter={(value) => `$${value.toFixed(0)}`}
                donutWidth="50%"
                strokeWidth={2}
              />
            </Card.Body>
          </Card>
        </Col>

        <Col md={6} className="mb-4">
          <Card>
            <Card.Body>
              <ChartDonut
                title="Device Type Distribution"
                series={percentageData}
                labels={percentageLabels}
                dataType="percentage"
                height={300}
                colors={['#00b894', '#00cec9', '#0984e3', '#6c5ce7']}
                showDataLabels={true}
                legendPosition="left"
                donutWidth="80%"
                animateOnMount={true}
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col md={6} className="mb-4">
          <Card>
            <Card.Body>
              <ChartDonut
                title="Custom Data with Custom Formatter"
                series={[150, 90, 120, 80]}
                labels={['Product A', 'Product B', 'Product C', 'Product D']}
                dataType="custom"
                height={300}
                customTooltipFormatter={(value, seriesName) => `${seriesName}: ${value} units sold`}
                dataLabelsFormatter={(value) => `${value} units`}
                colors={['#e17055', '#d63031', '#fdcb6e', '#e84393']}
                showLegend={true}
                legendPosition="top"
              />
            </Card.Body>
          </Card>
        </Col>

        <Col md={6} className="mb-4">
          <Card>
            <Card.Body>
              <h5>Loading State Example</h5>
              <ChartDonut
                title="Loading Chart"
                series={[]}
                labels={[]}
                loading={true}
                height={300}
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col md={12}>
          <Card>
            <Card.Body>
              <ChartDonut
                title="Large Donut Chart Example"
                series={[35, 25, 20, 15, 5]}
                labels={['Excellent', 'Good', 'Average', 'Poor', 'Very Poor']}
                dataType="percentage"
                height={400}
                width={500}
                colors={['#00b894', '#00cec9', '#fdcb6e', '#e17055', '#d63031']}
                showDataLabels={true}
                legendPosition="right"
                donutWidth="65%"
                showFullScreenButton={true}
                onFullScreenClick={() => console.log('Large chart full screen')}
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ChartDonutExample; 