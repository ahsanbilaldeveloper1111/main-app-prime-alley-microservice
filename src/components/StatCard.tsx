import React from 'react';
import { Col } from 'react-bootstrap';
import { motion } from 'framer-motion';
import AnimatedNumber from './AnimatedNumber';

export interface StatCardProps {
  title: string;
  value: number;
  valueType?: 'number' | 'seconds' | 'cost';
  icon?: string;
  iconColor?: string;
  bgImage?: string;
  className?: string;
  delay?: number;
  showAnimation?: boolean;
  formatValue?: (value: number) => string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  valueType = 'number',
  icon,
  iconColor = 'bg-brand-color-1',
  bgImage,
  className = '',
  delay = 0,
  showAnimation = true,
  formatValue,
  size = '',
  variant = 'default'
}) => {
  // Helper function to convert seconds to minutes and seconds format
  const formatTimeFromSeconds = (seconds: number): string => {
    if (seconds === null || seconds === undefined || isNaN(seconds)) {
      return '0s';
    }
    
    if (seconds === 0) return '0s';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    if (minutes === 0) {
      return `${remainingSeconds}s`;
    } else if (remainingSeconds === 0) {
      return `${minutes}m`;
    } else {
      return `${minutes}m ${remainingSeconds}s`;
    }
  };

  // Format value based on type
  const getFormattedValue = (): React.ReactNode => {
    // Ensure value is a valid number
    const safeValue = value !== undefined && value !== null && !isNaN(value) ? value : 0;

    if (formatValue) {
      return formatValue(safeValue);
    }

    if (safeValue <= 0) {
      return <h2 className="mb-0 f-w-500">0</h2>;
    }

    switch (valueType) {
      case 'seconds':
        return <h2 className="mb-0 f-w-500">{formatTimeFromSeconds(safeValue)}</h2>;
      case 'cost':
        return <AnimatedNumber value={safeValue} duration={1000} />;
      case 'number':
      default:
        return <AnimatedNumber value={safeValue} duration={1000} />;
    }
  };

  // Get variant colors
  const getVariantColors = () => {
    switch (variant) {
      case 'primary':
        return 'bg-primary';
      case 'success':
        return 'bg-success';
      case 'warning':
        return 'bg-warning';
      case 'danger':
        return 'bg-danger';
      case 'info':
        return 'bg-info';
      default:
        return iconColor;
    }
  };

  // Get size classes
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'col-md-3 col-sm-6';
      case 'lg':
        return 'col-md-8 col-sm-12';
      case 'md':
      case 'xl':
        return 'col-md-12 col-sm-12';
      default:
        return 'col-md-6 col-sm-6';
    }
  };

  const cardContent = (
    <div className={`card statistics-card-1 ${className}`}>
      <div className="card-body">
        {bgImage && <img src={bgImage} alt="background" className="img-fluid img-bg" />}
        <div className="d-flex align-items-center">
          {icon && (
            <div className={`avtar ${getVariantColors()} text-white me-3`}>
              <i className={`material-icons-two-tone text-white`}>{icon}</i>
            </div>
          )}
          <div>
            <p className="text-muted mb-0">{title}</p>
            <div className="d-flex align-items-end">
              {getFormattedValue()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (!showAnimation) {
    return (
      <Col className={getSizeClasses()}>
        {cardContent}
      </Col>
    );
  }

  return (
    <Col className={getSizeClasses()}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 * delay }}
      >
        {cardContent}
      </motion.div>
    </Col>
  );
};

export default StatCard; 