import React from 'react';
import './CircularProgressCircle.scss';

interface CircularProgressCircleProps {
  progress: number; // 0-100
  size?: 'small' | 'medium' | 'large';
  strokeWidth?: number;
  showPercentage?: boolean;
  className?: string;
  color?: string;
  backgroundColor?: string;
  textColor?: string;
  animated?: boolean;
}

const CircularProgressCircle: React.FC<CircularProgressCircleProps> = ({
  progress,
  size = 'small',
  strokeWidth,
  showPercentage = true,
  className = '',
  color = '#28a745', // Green color
  backgroundColor = '#e9ecef', // Gray color
  textColor = '#495057',
  animated = true
}) => {
  const sizeClasses = {
    small: { size: 20, stroke: 2 },
    medium: { size: 60, stroke: 4 },
    large: { size: 80, stroke: 6 }
  };

  const dimensions = sizeClasses[size];
  const radius = (dimensions.size - dimensions.stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const actualStrokeWidth = strokeWidth || dimensions.stroke;
  const actualSize = dimensions.size;

  return (
    <div className={`circular-progress-container ${className}`}>
      <div className="circular-progress-wrapper" style={{ width: actualSize, height: actualSize }}>
        <svg
          width={actualSize}
          height={actualSize}
          className="circular-progress-svg"
        >
          {/* Background circle */}
          <circle
            cx={actualSize / 2}
            cy={actualSize / 2}
            r={radius}
            fill="none"
            stroke={backgroundColor}
            strokeWidth={actualStrokeWidth}
            className="circular-progress-bg"
          />
          {/* Progress circle */}
          <circle
            cx={actualSize / 2}
            cy={actualSize / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={actualStrokeWidth}
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={`circular-progress-fill ${animated ? 'animated' : ''}`}
            style={{
              transform: 'rotate(-90deg)',
              transformOrigin: '50% 50%'
            }}
          />
        </svg>
        {showPercentage && (
          <div 
            className="circular-progress-text"
            style={{ 
              color: textColor,
              fontSize: actualSize * 0.2,
              fontWeight: '600'
            }}
          >
            {Math.round(progress)}%
          </div>
        )}
      </div>
    </div>
  );
};

export default CircularProgressCircle;
