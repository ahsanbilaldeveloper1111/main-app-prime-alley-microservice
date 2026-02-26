import React from 'react';

interface ComingSoonProps {
  title?: string;
  description?: string;
  icon?: string;
  className?: string;
}

const ComingSoon: React.FC<ComingSoonProps> = ({
  title = "Coming Soon",
  description = "This feature is under development and will be available soon.",
  icon = "ph-duotone ph-clock",
  className = ""
}) => {
  return (
    <div className={`d-flex justify-content-center align-items-center ${className}`} style={{ minHeight: '400px' }}>
      <div className="text-center">
        <i className={`${icon} mb-4`} style={{ fontSize: '4rem', color: '#6c757d' }}></i>
        <h2 className="text-muted mb-3">{title}</h2>
        <p className="text-muted">{description}</p>
      </div>
    </div>
  );
};

export default ComingSoon; 