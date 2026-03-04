import React, { useRef, useState } from "react";
import { Button, Col, Dropdown, Row } from 'react-bootstrap';
import DatePicker from "react-datepicker";
import Select from 'react-select';
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "react-toastify";

interface OrdersFiltersProps {
  onFiltersChange: (filters: any) => void;
}

export default function OrdersFilters({ onFiltersChange }: OrdersFiltersProps) {
  const [selectedFilters, setSelectedFilters] = useState<Record<string, any>>({});
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [selectedStage, setSelectedStage] = useState<any>(null);
  const [selectedStatus, setSelectedStatus] = useState<any>(null);
  const [customerSearch, setCustomerSearch] = useState<string>('');

  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleApplyFilters = () => {
    const filters: any = {};
    
    if (customerSearch) filters.customer_search = customerSearch;
    if (selectedStage) filters.stage_id = selectedStage.value;
    if (selectedStatus) filters.status = selectedStatus.value;
    if (startDate) filters.date_from = startDate.toISOString().split('T')[0];
    if (endDate) filters.date_to = endDate.toISOString().split('T')[0];

    setSelectedFilters(filters);
    onFiltersChange(filters);
    
    if (dropdownRef.current) {
      dropdownRef.current.classList.remove("show");
      dropdownRef.current.blur();
      toast.success("Filters applied successfully");
    }
  };

  const handleResetFilters = () => {
    setCustomerSearch('');
    setSelectedStage(null);
    setSelectedStatus(null);
    setStartDate(null);
    setEndDate(null);
    setSelectedFilters({});
    onFiltersChange({});
    toast.success("Filters reset successfully");
  };

  const stageOptions = [
    { value: 'new', label: 'New' },
    { value: 'processing', label: 'Processing' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'processing', label: 'Processing' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  return (
    <div className="d-flex align-items-center ms-auto gap-2">
      <Dropdown ref={dropdownRef}>
        <Dropdown.Toggle variant="outline-secondary" size="sm" id="orders-filters-dropdown">
          <i className="ti ti-filter me-1"></i>
          Filters
        </Dropdown.Toggle>
        <Dropdown.Menu className="p-3" style={{ width: '400px' }}>
          <div className="mb-3">
            <h6 className="mb-2">Order Filters</h6>
          </div>
          
          <Row>
            <Col md={12} className="mb-3">
              <label className="form-label mb-1">Customer Search</label>
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Customer name, email, order #"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
              />
            </Col>
          </Row>

          <Row>
            <Col md={6} className="mb-3">
              <label className="form-label mb-1">Stage</label>
              <Select
                isClearable
                placeholder="Select stage"
                value={selectedStage}
                onChange={setSelectedStage}
                options={stageOptions}
                className="react-select-container"
                classNamePrefix="react-select"
              />
            </Col>
            <Col md={6} className="mb-3">
              <label className="form-label mb-1">Status</label>
              <Select
                isClearable
                placeholder="Select status"
                value={selectedStatus}
                onChange={setSelectedStatus}
                options={statusOptions}
                className="react-select-container"
                classNamePrefix="react-select"
              />
            </Col>
          </Row>

          <Row>
            <Col md={6} className="mb-3">
              <label className="form-label mb-1">From Date</label>
              <DatePicker
                selected={startDate}
                onChange={(date) => setStartDate(date)}
                selectsStart
                startDate={startDate}
                endDate={endDate}
                className="form-control form-control-sm"
                placeholderText="Select start date"
                dateFormat="dd/MM/yyyy"
              />
            </Col>
            <Col md={6} className="mb-3">
              <label className="form-label mb-1">To Date</label>
              <DatePicker
                selected={endDate}
                onChange={(date) => setEndDate(date)}
                selectsEnd
                startDate={startDate}
                endDate={endDate}
                minDate={startDate || undefined}
                className="form-control form-control-sm"
                placeholderText="Select end date"
                dateFormat="dd/MM/yyyy"
              />
            </Col>
          </Row>

          <div className="d-flex gap-2">
            <Button variant="primary" size="sm" onClick={handleApplyFilters} className="flex-fill">
              Apply Filters
            </Button>
            <Button variant="outline-secondary" size="sm" onClick={handleResetFilters} className="flex-fill">
              Reset
            </Button>
          </div>
        </Dropdown.Menu>
      </Dropdown>
    </div>
  );
}
