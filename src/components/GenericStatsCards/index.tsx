import React from 'react';
import { LucideIcon, Circle } from 'lucide-react';

export interface StatsCardData {
  title: string;
  value: string | number;
  icon?: LucideIcon;
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
  /** Font size for the stat value (e.g. '24px', '36px'). Defaults to '36px'. */
  valueFontSize?: string;
}

const StatsCards: React.FC<StatsCardsProps> = ({ 
  data, 
  gridMinWidth = '200px',
  valueFontSize = '36px'
}) => {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(auto-fit, minmax(${gridMinWidth}, 1fr))`,
      gap: '16px',
      marginBottom: '16px',
      background: '#FFFFFF',
      borderRadius: '10px',
      border: '1px solid #cccccc'
    }}>
      {data.map((card) => {
        const IconComponent = card.icon;
        const iconColor = card.iconColor || '#6366F1';
        const iconBgColor = card.iconBgColor || '#EEF2FF';
        const cardKey = card.title + '|' + String(card.value) + '|' + (card.subtitle || '') + '|' + (card.additionalText || '');

        return (
          <div 
            key={cardKey}
            style={{
              
              
              padding: '20px 0 40px 0',
              
            }}
          >
          

            {/* Title */}
            <div style={{
              fontSize: '14px',
              color: '#141414',
              fontWeight: '500',
              marginBottom: '8px',
              textAlign: 'center'
            }}>
              {card.title}
            </div>

            {/* Value */}
            <div style={{
              fontSize: '28px',
              fontWeight: '500',
              color: '#006162',
              lineHeight: '1',
              textAlign: 'center'
            }}>
              {card.value}
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
                justifyContent: 'center',
                width: '100%',
                gap: '6px',
                fontSize: '13px',
                color: '#374151',
                textAlign: 'center',
                marginTop: card.badge ? '8px' : '0'
              }}>
                <Circle size={8} fill={card.metric.dotColor} color={card.metric.dotColor} />
                <span>{card.metric.text}</span>
              </div>
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
                justifyContent: 'center',
                width: '100%',
                gap: '6px',
                fontSize: '13px',
                color: '#374151',
                textAlign: 'center',
                marginTop: card.badge || card.metric ? '8px' : '0'
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
