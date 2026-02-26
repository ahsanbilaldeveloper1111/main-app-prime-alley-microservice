import React from 'react';
import { Card } from 'react-bootstrap';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  iconColor: string;
  iconBgColor?: string;
  cardGradient?: string;
  valueColor?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon: Icon,
  iconColor,
  iconBgColor,
  cardGradient,
  valueColor
}) => {
  return (
    <Card 
      className="stat-card w-100" 
      style={{ 
        background: cardGradient || '#ffffff',
        border: cardGradient ? 'none' : '1px solid #e2e8f0'
      }}
    >
      <div className="d-flex justify-content-between align-items-start">
        <div>
          <h6 className="stat-label">{title}</h6>
          <h2 className="stat-number" style={{ color: valueColor || '#1F2937' }}>
            {value}
          </h2>
        </div>
        <div 
          className="stat-icon" 
          style={{ 
            backgroundColor: iconBgColor || 'transparent',
            color: iconColor 
          }}
        >
          <Icon />
        </div>
      </div>
    </Card>
  );
};

export default StatsCard;
