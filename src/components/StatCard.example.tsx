import React from 'react';
import { Row } from 'react-bootstrap';
import StatCard from './StatCard';
import imgStatus1 from '@assets/images/widget/img-status-1.svg';

const StatCardExample: React.FC = () => {
  return (
    <div className="p-4">
      <h2 className="mb-4">StatCard Component Examples</h2>
      
      <Row>
        {/* Basic examples */}
        <StatCard
          title="Total Calls"
          value={1250}
          valueType="number"
          icon="phone"
          bgImage={imgStatus1.src}
          delay={0}
        />

        <StatCard
          title="Avg Ring Time"
          value={45}
          valueType="seconds"
          icon="phone_in_talk"
          bgImage={imgStatus1.src}
          delay={1}
        />

        <StatCard
          title="Avg Duration"
          value={180}
          valueType="seconds"
          icon="info"
          bgImage={imgStatus1.src}
          delay={2}
        />

        <StatCard
          title="Total Cost"
          value={1250.75}
          valueType="cost"
          icon="payment"
          bgImage={imgStatus1.src}
          delay={3}
        />
      </Row>

      <Row className="mt-4">
        <h4>Different Variants</h4>
        
        <StatCard
          title="Success Metric"
          value={95}
          valueType="number"
          icon="check_circle"
          variant="success"
          size="sm"
          delay={0}
        />

        <StatCard
          title="Warning Metric"
          value={75}
          valueType="number"
          icon="warning"
          variant="warning"
          size="sm"
          delay={1}
        />

        <StatCard
          title="Danger Metric"
          value={25}
          valueType="number"
          icon="error"
          variant="danger"
          size="sm"
          delay={2}
        />

        <StatCard
          title="Info Metric"
          value={150}
          valueType="number"
          icon="info"
          variant="info"
          size="sm"
          delay={3}
        />
      </Row>

      <Row className="mt-4">
        <h4>Custom Formatting</h4>
        
        <StatCard
          title="Custom Formatted"
          value={1234567}
          valueType="number"
          icon="trending_up"
          formatValue={(value) => `${(value / 1000).toFixed(1)}K`}
          size="md"
          delay={0}
        />

        <StatCard
          title="Percentage"
          value={85.5}
          valueType="number"
          icon="percent"
          formatValue={(value) => `${value.toFixed(1)}%`}
          size="md"
          delay={1}
        />
      </Row>

      <Row className="mt-4">
        <h4>Different Sizes</h4>
        
        <StatCard
          title="Small Card"
          value={42}
          valueType="number"
          icon="star"
          size="sm"
          delay={0}
        />

        <StatCard
          title="Large Card"
          value={999}
          valueType="number"
          icon="favorite"
          size="lg"
          delay={1}
        />
      </Row>

      <Row className="mt-4">
        <h4>Without Animation</h4>
        
        <StatCard
          title="No Animation"
          value={500}
          valueType="number"
          icon="speed"
          showAnimation={false}
          size="md"
        />
      </Row>
    </div>
  );
};

export default StatCardExample; 