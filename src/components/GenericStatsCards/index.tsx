import React from 'react';
import { LucideIcon, Circle } from 'lucide-react';

export interface StatsCardData {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
  subtitle?: string;
  badge?: {
    text: string;
    bgColor: string;
    textColor: string;
  };
  metric?: {
    text: string;
    dotColor: string;
  };
  link?: {
    text: string;
    onClick: () => void;
  };
  additionalText?: string;
}

interface StatsCardsProps {
  data: StatsCardData[];
  gridMinWidth?: string;
}

const StatsCards: React.FC<StatsCardsProps> = ({ 
  data, 
  gridMinWidth = '200px' 
}) => {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(auto-fit, minmax(${gridMinWidth}, 1fr))`,
      gap: '16px',
      marginBottom: '16px'
    }}>
      {data.map((card, index) => {
        const IconComponent = card.icon;
        const iconColor = card.iconColor || '#6366F1';
        const iconBgColor = card.iconBgColor || '#EEF2FF';

        return (
          <div 
            key={index}
            style={{
              background: '#FFFFFF',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid #F3F4F6'
            }}
          >
            {/* Icon and Value */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '16px', 
              marginBottom: '12px' 
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: iconBgColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <IconComponent size={24} color={iconColor} strokeWidth={2} />
              </div>
              <div style={{
                fontSize: '36px',
                fontWeight: '700',
                color: '#111827',
                lineHeight: '1'
              }}>
                {card.value}
              </div>
            </div>

            {/* Title */}
            <div style={{
              fontSize: '14px',
              color: '#6B7280',
              fontWeight: '500',
              marginBottom: '12px'
            }}>
              {card.title}
            </div>

            {/* Badge */}
            {card.badge && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
                background: card.badge.bgColor,
                color: card.badge.textColor
              }}>
                {card.badge.text}
              </span>
            )}

            {/* Metric with Dot */}
            {card.metric && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                color: '#374151',
                marginTop: card.badge ? '8px' : '0'
              }}>
                <Circle size={8} fill={card.metric.dotColor} color={card.metric.dotColor} />
                <span>{card.metric.text}</span>
              </div>
            )}

            {/* Link */}
            {card.link && (
              <a 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  card.link?.onClick();
                }}
                style={{
                  fontSize: '13px',
                  color: '#6366F1',
                  textDecoration: 'none',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'inline-block',
                  marginTop: card.badge || card.metric ? '8px' : '0'
                }}
              >
                {card.link.text}
              </a>
            )}

            {/* Additional Text */}
            {card.additionalText && (
              <div style={{ 
                fontSize: '12px', 
                color: '#9CA3AF', 
                marginTop: '8px' 
              }}>
                {card.additionalText}
              </div>
            )}

            {/* Subtitle */}
            {card.subtitle && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                color: '#374151',
                marginTop: card.badge || card.metric || card.link ? '8px' : '0'
              }}>
                <Circle size={8} fill="#6366F1" color="#6366F1" />
                <span>{card.subtitle}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default StatsCards;
