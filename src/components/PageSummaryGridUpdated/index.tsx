// import '@assets/scss/page-summary-grid-updated.scss';
import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Badge } from 'react-bootstrap';
import { ChevronDown, ChevronUp } from 'lucide-react';

// Built-in AnimatedNumber component
const AnimatedNumber: React.FC<{
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
}> = ({ value, duration = 1000, prefix = '', suffix = '' }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOutQuart * value));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);

  return (
    <span>
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
};

export interface SummaryCard {
  id: string;
  title: string;
  value: number | string;
  description?: string;
  showAnimatedNumber?: boolean;
  animationDuration?: number;
  prefix?: string;
  suffix?: string;
  icon?: React.ReactNode;
  color?: string; // Bootstrap color: primary, success, danger, warning, info, etc.
  trend?: string;
  trendValue?: string;
  isPositive?: boolean;
}

export interface PageSummaryGridUpdatedProps {
  cards: SummaryCard[];
  cardsPerRow?: 2 | 3 | 4;
  showExpandButton?: boolean;
  initialVisibleRows?: number;
  className?: string;
}

const PageSummaryGridUpdated: React.FC<PageSummaryGridUpdatedProps> = ({
  cards,
  cardsPerRow = 4,
  showExpandButton = true,
  initialVisibleRows = 1,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const cardsToShow = isExpanded ? cards.length : (initialVisibleRows * cardsPerRow);
  const visibleCards = cards.slice(0, cardsToShow);
  const hasMoreCards = cards.length > cardsToShow;

  // Map cardsPerRow to Bootstrap column size
  const getColSize = () => {
    switch (cardsPerRow) {
      case 2: return { lg: 6, md: 6 };
      case 3: return { lg: 4, md: 6 };
      case 4: return { lg: 3, md: 6 };
      default: return { lg: 3, md: 6 };
    }
  };

  const colSize = getColSize();

  return (
    <div className={className}>
      <Row className="mb-3">
        {visibleCards.map((card, index) => {
          const cardColor = card.color || 'primary';
          
          return (
            <Col 
              lg={colSize.lg} 
              md={colSize.md} 
              key={card.id} 
              className="mb-3"
            >
              <Card className="h-100">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    {card.icon && (
                      <div className={`bg-${cardColor} bg-opacity-10 rounded p-3`}>
                        <div className={`text-${cardColor}`} style={{ fontSize: '24px' }}>
                          {card.icon}
                        </div>
                      </div>
                    )}
                    {card.trend && (
                      <Badge 
                        bg={card.isPositive ? 'success' : 'danger'} 
                        className="bg-opacity-10"
                      >
                        {card.isPositive ? (
                          <ChevronUp size={12} className="me-1" />
                        ) : (
                          <ChevronDown size={12} className="me-1" />
                        )}
                        {card.trend}
                      </Badge>
                    )}
                  </div>
                  
                  <h3 className="mb-1">
                    {typeof card.value === 'number' && card.showAnimatedNumber !== false ? (
                      <AnimatedNumber 
                        value={card.value}
                        duration={card.animationDuration || 1000}
                        prefix={card.prefix || ''}
                        suffix={card.suffix || ''}
                      />
                    ) : (
                      `${card.prefix || ''}${card.value}${card.suffix || ''}`
                    )}
                  </h3>
                  
                  <p className="text-muted mb-0 small">{card.title}</p>
                  
                  {card.description && (
                    <p className="text-muted mb-0 mt-2" style={{ fontSize: '0.75rem' }}>
                      {card.description}
                    </p>
                  )}
                </Card.Body>
              </Card>
            </Col>
          );
        })}
      </Row>

      {/* Expand/Collapse Button */}
      {showExpandButton && cards.length > (initialVisibleRows * cardsPerRow) && (
        <div className="text-center mb-4">
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <>
                <ChevronUp size={16} className="me-2" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown size={16} className="me-2" />
                Show {cards.length - cardsToShow} More
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default PageSummaryGridUpdated;