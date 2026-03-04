import React, { useState, useEffect } from "react";
import { Button, Card, Col, Dropdown, Row } from 'react-bootstrap';
import Select from 'react-select';
import { toast } from "react-toastify";
import { getResellers } from "@utils/accounts";
import { FiFilter } from "react-icons/fi";

interface CompaniesFiltersProps {
  onFiltersChange?: (filters: Record<string, any>) => void;
  onExport?: (exportType: string, filters: Record<string, any>) => void;
  showExport?: boolean;
  showFilters?: boolean;
  exportOptions?: Array<{ label: string; value: string }>;
}

interface ResellerOption {
  value: number;
  label: string;
}

export default function CompaniesFilters({ 
  onFiltersChange, 
  onExport, 
  showExport = false, 
  showFilters = false,
  exportOptions = [
    { label: 'Excel', value: 'excel' },
  ]
}: CompaniesFiltersProps) {
  const [selectedFilters, setSelectedFilters] = useState<Record<string, any>>({});
  const [resellers, setResellers] = useState<ResellerOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFiltersDropdown, setShowFiltersDropdown] = useState(false);

  // Load resellers on component mount
  useEffect(() => {
    const loadResellers = async () => {
      try {
        setLoading(true);
        const resellersData = await getResellers();
        const resellerOptions = resellersData.data.map((reseller: any) => ({
          value: reseller.id,
          label: reseller.name
        }));
        setResellers(resellerOptions);
      } catch (error) {
        console.error("Error loading resellers:", error);
        toast.error("Failed to load resellers");
      } finally {
        setLoading(false);
      }
    };

    loadResellers();
  }, []);

  const handleFilterChange = (fieldName: string, value: any) => {
    const newFilters = {
      ...selectedFilters,
      [fieldName]: value
    };
    
    setSelectedFilters(newFilters);
    
    // Call immediate callback for real-time filtering
    if (onFiltersChange) {
      onFiltersChange(newFilters);
    }
  };

  const handleApplyFilters = () => {
    setShowFiltersDropdown(false);
    if (onFiltersChange) {
      onFiltersChange(selectedFilters);
    }
  };

  const clearFilters = () => {
    setSelectedFilters({});
    if (onFiltersChange) {
      onFiltersChange({});
    }
  };

  const handleExport = (exportType: string) => {
    if (onExport) {
      onExport(exportType, selectedFilters);
    } else {
      console.warn('onExport prop is not provided');
      toast.warning('Export functionality not configured');
    }
  };

  const removeFilter = (key: string) => {
    const newFilters = { ...selectedFilters };
    delete newFilters[key];
    setSelectedFilters(newFilters);
    
    if (onFiltersChange) {
      onFiltersChange(newFilters);
    }
  };

  const renderFilterBadges = () => {
    return Object.entries(selectedFilters)
      .filter(([key, value]) => {
        if (value === null || value === undefined || value === '') return false;
        if (Array.isArray(value) && value.length === 0) return false;
        return true;
      })
      .map(([key, value]) => {
        let displayValue = value;
        if (Array.isArray(value)) {
          displayValue = value.join(', ');
        }

        return (
          <span key={key} className="badge bg-primary" style={{fontSize: '12px', marginRight: '5px', marginBottom: '5px'}}>
            {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: {displayValue}
            <span
              className="btn-close btn-close-white ms-2 text-white"
              onClick={() => removeFilter(key)}
              style={{ cursor: 'pointer' }}
            ></span>
          </span>
        );
      });
  };

  return (
    <div className="d-flex align-items-center ms-auto gap-2">
      {/* <div className="d-flex align-items-center">
        <div className="d-block align-items-center gap-2" style={{textAlign: 'right'}}>
          {renderFilterBadges()}
        </div>
      </div> */}
      
      {/* {Object.keys(selectedFilters).length > 0 && (
        <span 
          className="text-primary tagClearFilter" 
          onClick={clearFilters}
          style={{ cursor: 'pointer', minWidth: '75px' }}
        >
          Clear Filters
        </span>
      )} */}
      
      {showFilters && (
        <Dropdown show={showFiltersDropdown} onToggle={setShowFiltersDropdown}>
          <Dropdown.Toggle variant="info" size='sm'>
            <FiFilter size={10} />
            Filters
          </Dropdown.Toggle>
          <Dropdown.Menu className="filterBoxDropdown p-0" style={{width: '400px'}}>
            <Dropdown.ItemText className="p-0">
              <Card className="mb-0">
                <Card.Header className="p-3 bg-gray-200">
                  <h5>Filter Companies</h5>
                  <small className="text-muted d-block mt-1">
                    Filter companies by reseller, phone, or email
                  </small>
                </Card.Header>
                <Card.Body className="p-3">
                  <div className="form-group mb-3">
                    <label className="form-label mb-1">Reseller</label>
                    <Select
                      className="w-100"
                      classNamePrefix="select"
                      isClearable={true}
                      isSearchable={true}
                      isLoading={loading}
                      value={resellers.find(option => option.value === selectedFilters.reseller_id) || null}
                      onChange={(selected) => handleFilterChange('reseller_id', selected?.value || '')}
                      options={resellers}
                      placeholder="Select reseller"
                    />
                  </div>

                  <div className="form-group mb-3">
                    <label className="form-label mb-1">Company Phone</label>
                    <input
                      className="form-control form-control-sm"
                      type="text"
                      value={selectedFilters.phone || ''}
                      placeholder="Enter phone number"
                      onChange={(e) => handleFilterChange('phone', e.target.value)}
                    />
                  </div>

                  <div className="form-group mb-3">
                    <label className="form-label mb-1">Company Email</label>
                    <input
                      className="form-control form-control-sm"
                      type="text"
                      value={selectedFilters.email || ''}
                      placeholder="Enter email address"
                      onChange={(e) => handleFilterChange('email', e.target.value)}
                    />
                  </div>
                  <Row>
                <Col md={12} className="d-flex justify-content-end gap-2">
                  <Button variant="outline-primary" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                  <Button variant="primary" onClick={handleApplyFilters}>
                    Apply Filters
                  </Button>
                </Col>
              </Row>
                
                </Card.Body>
              </Card>
              
            </Dropdown.ItemText>
          </Dropdown.Menu>
        </Dropdown>
      )}

      {showExport && (
        <button className="btn btn-export" id="export-btn" onClick={() => handleExport('excel')}>
          <i className="fas fa-download"></i> Export
        </button>
      )}
    </div>
  );
}
