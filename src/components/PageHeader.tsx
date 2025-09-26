import React from 'react';
import { Row, Col, Button } from 'react-bootstrap';

interface PageHeaderProps {
  title: string;
  showSearch?: boolean;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  buttons?: React.ReactNode;
  filters?: React.ReactNode;
  className?: string;
  leftGrid?: number;
  rightGrid?: number;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  showSearch = false,
  searchPlaceholder = "Search...",
  searchValue = "",
  onSearchChange,
  buttons,
  filters,
  className = "",
  leftGrid = 5,
  rightGrid = 7
}) => {
  return (
    <>
      <Row className={`mb-3 ${className}`}>
        <Col md={12}>
          <div className="page-header-title style-2">
            <Row className="d-flex justify-content-between align-items-center">
              <Col md={leftGrid}>
                <h2 className="mb-0">{title}</h2>
              </Col>

              <Col md={rightGrid} className="d-flex justify-content-end">
                <div className="action-buttons">
                  {showSearch && (
                    <div className="search-container">
                      <i className="fas fa-search search-icon"></i>
                      <input 
                        type="text" 
                        className="search-bar" 
                        placeholder={searchPlaceholder}
                        value={searchValue}
                        onChange={(e) => onSearchChange?.(e.target.value)}
                      />
                    </div>
                  )}

{filters}

{buttons}
                  
                
                </div>
              </Col>
            </Row>
          </div>
        </Col>
      </Row>
    </>
  );
};

export default PageHeader;
