import React from 'react';
import './CircularProgressLoader.scss';

interface CircularProgressLoaderProps {
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'danger';
  showText?: boolean;
  text?: string;
  className?: string;
}

const CircularProgressLoader: React.FC<CircularProgressLoaderProps> = ({
  size = 'medium',
  color = 'primary',
  showText = false,
  text = 'Loading...',
  className = ''
}) => {
  const sizeClasses = {
    small: 'circular-loader-sm',
    medium: 'circular-loader-md',
    large: 'circular-loader-lg'
  };

  const colorClasses = {
    primary: 'circular-loader-primary',
    secondary: 'circular-loader-secondary',
    success: 'circular-loader-success',
    info: 'circular-loader-info',
    warning: 'circular-loader-warning',
    danger: 'circular-loader-danger'
  };

  return (
    <div className={`circular-loader-container ${sizeClasses[size]} ${colorClasses[color]} ${className}`}>
      <div className="circular-loader">
        <div className="circular-loader-inner">
          <div className="circular-loader-spinner"></div>
        </div>
      </div>
      {showText && (
        <div className="circular-loader-text">
          {text}
        </div>
      )}
    </div>
  );
};

export default CircularProgressLoader;
