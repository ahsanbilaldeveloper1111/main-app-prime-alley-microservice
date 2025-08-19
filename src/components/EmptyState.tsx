import React from 'react';
import NoData from '../assets/images/no-data.svg';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  className?: string;
  isTableRow?: boolean;
  colSpan?: number;
}

const EmptyState: React.FC<EmptyStateProps> = ({ 
  title, 
  description, 
  icon,
  className = "",
  isTableRow = false,
  colSpan = 6
}) => {
  const defaultIcon = (
    <div className="empty-state-icon">
      <img src={NoData.src} alt="No Data" />
    </div>
  );

  if (isTableRow) {
    return (
      <div className="text-center py-4">
      <div className={`empty-state ${className}`}>
        {icon || defaultIcon}
        <h5 className="empty-state-title mt-3 mb-2">{title}</h5>
        <p className="empty-state-description text-muted mb-0">{description}</p>
      </div>
    </div>
    );
  }

  return (
    <div className={`empty-state text-center py-5 ${className}`}>
      {icon || defaultIcon}
      <h5 className="empty-state-title mt-3 mb-2">{title}</h5>
      <p className="empty-state-description text-muted mb-0">{description}</p>
    </div>
  );
};

export default EmptyState; 