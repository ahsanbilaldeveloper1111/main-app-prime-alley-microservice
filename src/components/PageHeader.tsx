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
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  showSearch = false,
  searchPlaceholder = "Search...",
  searchValue = "",
  onSearchChange,
  buttons,
  filters,
  className = ""
}) => {
  return (
    <>
      <Row className={`mb-3 ${className}`}>
        <Col md={12}>
          <div className="page-header-title style-2">
            <Row className="d-flex justify-content-between align-items-center">
              <Col md={4}>
                <h2 className="mb-0">{title}</h2>
              </Col>

              <Col md={8} className="d-flex justify-content-end">
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
                  
                  {filters && (
                    <div className="ms-3">
                      {filters}
                    </div>
                  )}
                  
                  {buttons && (
                    <div className="ms-3">
                      {buttons}
                    </div>
                  )}
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
