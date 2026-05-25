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
  /** When set, the whole card is clickable (e.g. apply a list filter). */
  onClick?: () => void;
}

interface StatsCardsProps {
  data: StatsCardData[];
  gridMinWidth?: string;
  columns?: number;
  /** Font size for the stat value (e.g. '24px', '36px'). Defaults to '36px'. */
  valueFontSize?: string;
}

const StatsCards: React.FC<StatsCardsProps> = ({ 
  data, 
  gridMinWidth = 'clamp(120px, 12vw, 200px)',
  columns,
  valueFontSize = '36px'
}) => {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: columns ? `repeat(${columns}, 1fr)` : `repeat(auto-fit, minmax(${gridMinWidth}, 1fr))`,
      gap: '16px',
      marginBottom: '16px',
      background: '#FFFFFF',
      borderRadius: '10px',
      border: '1px solid #cccccc',
      overflow: 'hidden',
    }}>
      {data.map((card) => {
        const cardKey = card.title + '|' + String(card.value) + '|' + (card.subtitle || '') + '|' + (card.additionalText || '');
        const interactive = typeof card.onClick === 'function';
        const shellStyle: React.CSSProperties = {
          padding: '16px 12px',
          borderRadius: interactive ? '8px' : undefined,
          transition: interactive ? 'background-color 0.15s ease' : undefined,
          overflow: 'hidden',
          minWidth: 0,
          ...(interactive
            ? {
                cursor: 'pointer' as const,
                border: 'none',
                background: 'transparent',
                width: '100%',
                font: 'inherit',
                textAlign: 'inherit' as const,
                display: 'block',
              }
            : {}),
        };

        const cardBody = (
          <React.Fragment>
            {/* Title */}
            <div 
              title={card.title}
              style={{
                fontSize: 'clamp(10px, 0.8vw, 12px)',
                color: '#141414',
                fontWeight: '500',
                marginBottom: '8px',
                textAlign: 'center',
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 1,
                WebkitBoxOrient: 'vertical' as const,
              }}>
              {card.title}
            </div>

            {/* Value */}
            <div style={{
              fontSize: '28px',
              fontWeight: '500',
              color: '#0066CC',
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
                flexWrap: 'nowrap',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                gap: '6px',
                fontSize: '13px',
                color: '#374151',
                textAlign: 'center',
                marginTop: card.badge ? '8px' : '0'
              }}>
                <Circle size={8} fill={card.metric.dotColor} color={card.metric.dotColor} style={{ flexShrink: 0 }} />
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
                flexWrap: 'nowrap',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                minWidth: 0,
                overflow: 'hidden',
                gap: '6px',
                fontSize: 'clamp(9px, 0.7vw, 11px)',
                color: '#374151',
                textAlign: 'center',
                marginTop: card.badge || card.metric ? '8px' : '0'
              }}>
                <Circle size={8} fill="#0066CC" color="#0066CC" style={{ flexShrink: 0 }} />
                <span 
                  title={card.subtitle}
                >
                  {card.subtitle && card.subtitle.length > 15 
                    ? card.subtitle.substring(0, 15) + '...' 
                    : card.subtitle}
                </span>
              </div>
            )}
          </React.Fragment>
        );

        if (interactive) {
          return (
            <button
              key={cardKey}
              type="button"
              onClick={card.onClick}
              style={shellStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#F9FAFB';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {cardBody}
            </button>
          );
        }

        return (
          <div key={cardKey} style={shellStyle}>
            {cardBody}
          </div>
        );
      })}
    </div>
  );
};

export default StatsCards;
