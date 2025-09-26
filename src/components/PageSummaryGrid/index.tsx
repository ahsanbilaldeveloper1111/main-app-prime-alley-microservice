import React from 'react';
import { motion } from 'framer-motion';
import AnimatedNumber from '@components/AnimatedNumber';
import '@assets/scss/page-summary-grid.scss';

export interface SummaryCard {
  id: string;
  title: string;
  value: number;
  description: string;
  delay?: number;
  showAnimatedNumber?: boolean;
  animationDuration?: number;
  fontStyle?: string;
  textColor?: string;
  prefix?: string;
  suffix?: string;
  valueType?: string;
  size?: string;
}

export interface PageSummaryGridProps {
  cards: SummaryCard[];
  className?: string;
  cardClassName?: string;
  animationStagger?: number;
  baseDelay?: number;
}

const PageSummaryGrid: React.FC<PageSummaryGridProps> = ({
  cards,
  className = "dashboard-grid",
  cardClassName = "dashboard-card",
  animationStagger = 0.2,
  baseDelay = 0.1
}) => {
  return (
    <div className={className}>
      {cards.map((card, index) => (
        <motion.div
          key={card.id}
          className={cardClassName}
          initial={{ opacity: 0, x: -100, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{
            duration: 0.8,
            delay: card.delay ?? (baseDelay + (index * animationStagger)),
            type: "spring",
            stiffness: 100,
            damping: 15
          }}
          whileHover={{
            scale: 1.05,
            transition: { duration: 0.2 }
          }}
        >
          <h3>{card.title}</h3>
          <div className="value" id={`${card.id}-count`}>
            {card.value > 0 && card.showAnimatedNumber !== false ? (
              <AnimatedNumber 
                value={card.value} 
                duration={card.animationDuration ?? 1000} 
                fontStyle={card.fontStyle ?? 'style-2'}
                textColor={card.textColor ?? ''}
                suffix={card.suffix ?? ''}
                prefix={card.prefix ?? ''}
                valueType={card.valueType ?? ''}
                size={card.size ?? ''}
              />
            ) : (
              <h2 className="mb-0 f-w-500 style-2">{card?.prefix ?? ''}{card.value ?? 0}{card?.suffix ?? ''}</h2>
            )}
          </div>
          <p>{card.description}</p>
        </motion.div>
      ))}
    </div>
  );
};

export default PageSummaryGrid;
