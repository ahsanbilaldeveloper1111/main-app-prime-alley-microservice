import React, { useState } from "react";
import { Button, Card, Form, Badge, InputGroup, Row, Col } from "react-bootstrap";
import { FiSearch, FiFilter } from "react-icons/fi";

interface BarFiltersProps {
  leftContent?: React.ReactNode;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSearch: () => void;
  searchPlaceholder?: string;
  showSearch?: boolean;
  showFilters?: boolean;
  filters?: Record<string, any>;
  filterContent?: React.ReactNode;
  onReset?: () => void;
  onSubmit?: () => void;
}

const BarFilters: React.FC<BarFiltersProps> = ({
  leftContent,
  searchValue,
  onSearchChange,
  onSearch,
  searchPlaceholder = "Search...",
  showSearch = true,
  showFilters = true,
  filters = {},
  filterContent,
  onReset,
  onSubmit
}) => {
  // Calculate advanced filter count (excluding 'search' key)
  const advancedFilterCount = Object.keys(filters).filter(key => key !== 'search').length;
  
  // State for toggling filter content visibility
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  return (
    <>
      <Card className="border-0 shadow-sm mb-3">
        <Card.Body className="p-3">
          <div className="d-flex flex-column flex-lg-row justify-content-between align-items-stretch align-items-lg-center gap-3">
            {/* Left Side: Custom Content */}
            {leftContent && (
              <div className="d-flex gap-2 flex-wrap align-items-center flex-grow-1">
                {leftContent}
              </div>
            )}

            {/* Right Side: Search and Filters */}
            <div className="d-flex flex-column flex-sm-row gap-2 align-items-stretch align-items-sm-center flex-shrink-0">
              {showSearch && (
                <InputGroup style={{ width: '300px', minWidth: '200px' }} className="flex-shrink-0">
                  <Form.Control
                    style={{ height: '41px' }}
                    type="text"
                    placeholder={searchPlaceholder}
                    value={searchValue}
                    onChange={(e) => onSearchChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        onSearch();
                      }
                    }}
                  />
                  <Button 
                    variant="outline-secondary"
                    onClick={onSearch}
                  >
                    <FiSearch size={16} />
                  </Button>
                </InputGroup>
              )}
              {showFilters && (
                <Button 
                  variant={showAdvancedFilters ? 'primary' : 'outline-secondary'}
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="d-flex align-items-center flex-shrink-0"
                >
                  <FiFilter size={16} className="me-2" />
                  Filters
                  {advancedFilterCount > 0 && (
                    <Badge bg="light" text="dark" className="ms-2">
                      {advancedFilterCount}
                    </Badge>
                  )}
                </Button>
              )}
            </div>
          </div>
        </Card.Body>
      </Card>

      {showFilters && showAdvancedFilters && filterContent && (
        <Card className="border-0 shadow-sm mb-3">
          <Card.Body className="p-3">
            <Row className="g-3 align-items-end">
              {filterContent}
              
                <Col md="auto">
                  <div className="d-flex gap-2">
                    {onSubmit && (
                      <Button 
                        variant="primary"
                        onClick={onSubmit}
                        className="d-flex align-items-center"
                        title="Apply Filters"
                      >
                        Apply Filters
                      </Button>
                    )}
                    {onReset && advancedFilterCount > 0 && (
                      <Button 
                        variant="outline-secondary"
                        onClick={onReset}
                        className="d-flex align-items-center"
                        title="Reset Filters"
                      >
                        Reset
                      </Button>
                    )}
                  </div>
                </Col>
             
            </Row>
          </Card.Body>
        </Card>
      )}
    </>
  );
};

export default BarFilters;
