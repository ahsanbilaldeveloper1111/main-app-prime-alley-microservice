import React, { useRef, useState } from "react";
import { Button, Card, Col, Dropdown, Row } from 'react-bootstrap';
import Select from 'react-select';
import { toast } from "react-toastify";

interface ProductsFiltersProps {
  onFiltersChange: (filters: any) => void;
}

export default function ProductsFilters({ onFiltersChange }: ProductsFiltersProps) {
  const [selectedFilters, setSelectedFilters] = useState<Record<string, any>>({});
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [selectedBrand, setSelectedBrand] = useState<any>(null);
  const [selectedStatus, setSelectedStatus] = useState<any>(null);
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [productSearch, setProductSearch] = useState<string>('');

  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleApplyFilters = () => {
    const filters: any = {};
    
    if (productSearch) filters.product_search = productSearch;
    if (selectedCategory) filters.category = selectedCategory.value;
    if (selectedBrand) filters.brand = selectedBrand.value;
    if (selectedStatus) filters.active = selectedStatus.value;
    if (minPrice) filters.min_price = minPrice;
    if (maxPrice) filters.max_price = maxPrice;

    setSelectedFilters(filters);
    onFiltersChange(filters);
    
    if (dropdownRef.current) {
      dropdownRef.current.classList.remove("show");
      dropdownRef.current.blur();
      toast.success("Filters applied successfully");
    }
  };

  const handleResetFilters = () => {
    setProductSearch('');
    setSelectedCategory(null);
    setSelectedBrand(null);
    setSelectedStatus(null);
    setMinPrice('');
    setMaxPrice('');
    setSelectedFilters({});
    onFiltersChange({});
    toast.success("Filters reset successfully");
  };

  const categoryOptions = [
    { value: 'electronics', label: 'Electronics' },
    { value: 'clothing', label: 'Clothing' },
    { value: 'books', label: 'Books' },
    { value: 'home', label: 'Home & Garden' },
    { value: 'sports', label: 'Sports & Outdoors' },
    { value: 'automotive', label: 'Automotive' },
    { value: 'health', label: 'Health & Beauty' }
  ];

  const brandOptions = [
    { value: 'apple', label: 'Apple' },
    { value: 'samsung', label: 'Samsung' },
    { value: 'nike', label: 'Nike' },
    { value: 'adidas', label: 'Adidas' },
    { value: 'sony', label: 'Sony' },
    { value: 'lg', label: 'LG' }
  ];

  const statusOptions = [
    { value: 'true', label: 'Active' },
    { value: 'false', label: 'Inactive' }
  ];

  return (
    <div className="d-flex align-items-center ms-auto gap-2">
      <Dropdown ref={dropdownRef}>
        <Dropdown.Toggle variant="outline-secondary" size="sm" id="products-filters-dropdown">
          <i className="ti ti-filter me-1"></i>
          Filters
        </Dropdown.Toggle>
        <Dropdown.Menu className="p-3" style={{ width: '400px' }}>
          <div className="mb-3">
            <h6 className="mb-2">Product Filters</h6>
          </div>
          
          <Row>
            <Col md={12} className="mb-3">
              <label className="form-label mb-1">Product Search</label>
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Product name, SKU"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
              />
            </Col>
          </Row>

          <Row>
            <Col md={6} className="mb-3">
              <label className="form-label mb-1">Category</label>
              <Select
                isClearable
                placeholder="Select category"
                value={selectedCategory}
                onChange={setSelectedCategory}
                options={categoryOptions}
                className="react-select-container"
                classNamePrefix="react-select"
              />
            </Col>
            <Col md={6} className="mb-3">
              <label className="form-label mb-1">Brand</label>
              <Select
                isClearable
                placeholder="Select brand"
                value={selectedBrand}
                onChange={setSelectedBrand}
                options={brandOptions}
                className="react-select-container"
                classNamePrefix="react-select"
              />
            </Col>
          </Row>

          <Row>
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
            <Col md={6} className="mb-3">
              <label className="form-label mb-1">Min Price</label>
              <input
                type="number"
                className="form-control form-control-sm"
                placeholder="0.00"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                min="0"
                step="0.01"
              />
            </Col>
          </Row>

          <Row>
            <Col md={6} className="mb-3">
              <label className="form-label mb-1">Max Price</label>
              <input
                type="number"
                className="form-control form-control-sm"
                placeholder="1000.00"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                min="0"
                step="0.01"
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
