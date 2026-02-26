import React, { useRef, useState, useEffect, useCallback } from "react";
import { Button, Col, Dropdown, Row } from 'react-bootstrap';
import Select from 'react-select';
import { toast } from "react-toastify";
import { ListGsmManagement } from "@utils/GsmManagement";
import { GetCompanyList } from "@utils/GsmAssign";
import { FiFilter } from "react-icons/fi";

interface CompanyPOFiltersProps {
  onFiltersChange: (filters: any) => void;
}

export default function CompanyPOFilters({ onFiltersChange }: CompanyPOFiltersProps) {
  const [selectedFilters, setSelectedFilters] = useState<Record<string, any>>({});
  const [selectedGsm, setSelectedGsm] = useState<any>(null);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [gsmOptions, setGsmOptions] = useState<any[]>([]);
  const [companyOptions, setCompanyOptions] = useState<any[]>([]);
  const [isLoadingGsm, setIsLoadingGsm] = useState(false);
  const [isLoadingCompany, setIsLoadingCompany] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch GSM options
  const fetchGsmOptions = useCallback(async () => {
    setIsLoadingGsm(true);
    try {
      const response = await ListGsmManagement({ page: 1, perPage: 1000 });
      if (response && response.dataList) {
        const gsmOptions = response.dataList.map((gsm: any) => ({
          value: gsm.id,
          label: `${gsm.name} (${gsm.ip_address})`,
          gsm: gsm
        }));
        setGsmOptions(gsmOptions);
      }
    } catch (error) {
      console.error('Error fetching GSM options:', error);
      toast.error('Failed to fetch GSM options');
    } finally {
      setIsLoadingGsm(false);
    }
  }, []);

  // Fetch company options from GetCompanyList
  const fetchCompanyOptions = useCallback(async () => {
    setIsLoadingCompany(true);
    try {
      const response = await GetCompanyList();
      
      if (response && response.data) {
        const companies = response.data.map((item: any) => ({
          value: item.identifier, // Use identifier field
          label: item.name, // Display name for user
          company: item
        }));
        setCompanyOptions(companies);
      }
    } catch (error) {
      console.error('Error fetching company options:', error);
      toast.error('Failed to fetch company options');
    } finally {
      setIsLoadingCompany(false);
    }
  }, []);

  useEffect(() => {
    fetchGsmOptions();
    fetchCompanyOptions();
  }, [fetchGsmOptions, fetchCompanyOptions]);

  const handleApplyFilters = () => {
    const filters: any = {};
    
    if (selectedGsm) filters.gsm_id = selectedGsm.value;
    if (selectedCompany) filters.company = selectedCompany.value;

    setSelectedFilters(filters);
    onFiltersChange(filters);
    
    if (dropdownRef.current) {
      dropdownRef.current.classList.remove("show");
      dropdownRef.current.blur();
      toast.success("Filters applied successfully");
    }
  };

  const handleResetFilters = () => {
    setSelectedGsm(null);
    setSelectedCompany(null);
    setSelectedFilters({});
    onFiltersChange({});
    toast.success("Filters reset successfully");
  };

  return (
    <div className="d-flex align-items-center ms-auto gap-2">
     
      
     

      <Dropdown>
        <Dropdown.Toggle variant="info" size='sm'>
          <FiFilter size={10} />
          Filters
        </Dropdown.Toggle>
        <Dropdown.Menu className="filterBoxDropdown" style={{width: '500px'}} ref={dropdownRef}>
          <Dropdown.ItemText>
            <Row>
              <Col md={12} className="p-3">
                <h6 className="mb-3">Filter Options</h6>
                
                {/* GSM ID Filter */}
                <div className="mb-3">
                  <label className="form-label">GSM ID</label>
                  <Select
                    value={selectedGsm}
                    onChange={setSelectedGsm}
                    options={gsmOptions}
                    placeholder="Select GSM..."
                    isLoading={isLoadingGsm}
                    isClearable
                    isSearchable
                  />
                </div>

                {/* Company Filter */}
                <div className="mb-3">
                  <label className="form-label">Company</label>
                  <Select
                    value={selectedCompany}
                    onChange={setSelectedCompany}
                    options={companyOptions}
                    placeholder="Select Company..."
                    isLoading={isLoadingCompany}
                    isClearable
                    isSearchable
                  />
                </div>

                {/* Action Buttons */}
                <div className="d-flex gap-2">
                  <Button variant="primary" size="sm" onClick={handleApplyFilters}>
                    Apply Filters
                  </Button>
                  <Button variant="secondary" size="sm" onClick={handleResetFilters}>
                    Reset
                  </Button>
                </div>
              </Col>
            </Row>
          </Dropdown.ItemText>
        </Dropdown.Menu>
      </Dropdown>
    </div>
  );
}
