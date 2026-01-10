import "@assets/scss/datatable-style.scss";
import React, {
  ReactElement,
  useState,
  useEffect,
  useCallback,
} from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import axiosInstance from "@utils/axios";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import { Row, Col, Card, Form, Button, Table, Dropdown, Modal } from 'react-bootstrap';
import { Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Building2, Plus, Trash2, Upload, Download } from 'lucide-react';
import { toast } from 'react-toastify';
import DeleteConfirmationModal from "@pages/partial/DeleteConfirmationModal";

// API Response Types
interface LocalDNDBlockRecord {
  id: number;
  called_number: string;
  company_name: string;
  date_time: string;
  comments: string;
}

interface LocalDNDResponse {
  status: string;
  total: number;
  records: LocalDNDBlockRecord[];
  limit: number;
  offset: number;
}

interface AddLocalDNDResponse {
  status: string;
  message: string;
  record_id: number;
}

interface BulkAddLocalDNDResponse {
  status: string;
  message: string;
  records_added?: number;
}

const LocalDNDCallBlock = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(100);
  const [searchQuery, setSearchQuery] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    company: ''
  });
  
  // API state
  const [loading, setLoading] = useState(false);
  const [apiData, setApiData] = useState<LocalDNDBlockRecord[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    called_number: '',
    comments: ''
  });

  // Delete state
  const [selectedRecords, setSelectedRecords] = useState<number[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<LocalDNDBlockRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Bulk add state
  const [showBulkAddModal, setShowBulkAddModal] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<string>('');
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

  // Fetch Local DND Blocks data from API
  const fetchLocalDNDBlocks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const offset = (currentPage - 1) * recordsPerPage;
      const params: any = {
        limit: recordsPerPage,
        offset: offset,
      };

      // Add filter parameters
      if (appliedFilters.search) {
        params.search = appliedFilters.search;
      }
      if (appliedFilters.company) {
        params.company = appliedFilters.company;
      }

      const response = await axiosInstance.get<LocalDNDResponse>('/dncr/local-dnd-blocks', { params });
      
      if (response.data?.status === 'success') {
        setApiData(response.data.records || []);
        setTotalRecords(response.data.total || 0);
      } else {
        setError('Failed to fetch Local DND blocks');
        setApiData([]);
      }
    } catch (err: any) {
      console.error('Error fetching Local DND blocks:', err);
      setError(err.response?.data?.message || 'Failed to fetch Local DND blocks');
      setApiData([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, recordsPerPage, appliedFilters]);

  // Fetch data on mount and when pagination/filters change
  useEffect(() => {
    fetchLocalDNDBlocks();
  }, [fetchLocalDNDBlocks]);

  // Format DateTime
  const formatDateTime = (dateTimeStr: string) => {
    try {
      const date = new Date(dateTimeStr);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).replace(',', '');
    } catch {
      return dateTimeStr;
    }
  };

  const totalPages = Math.ceil(totalRecords / recordsPerPage);

  // Handle add record
  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.called_number.trim()) {
      toast.error('Please enter a called number');
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        called_number: formData.called_number.trim(),
      };

      // Only include optional fields if they have values
      if (formData.comments.trim()) {
        payload.comments = formData.comments.trim();
      }

      const response = await axiosInstance.post<AddLocalDNDResponse>('/dncr/local-dnd-blocks/add', payload);
      
      if (response.data?.status === 'success') {
        toast.success(response.data.message || 'Record added successfully');
        setShowAddModal(false);
        setFormData({
          called_number: '',
          comments: ''
        });
        // Refresh the data
        fetchLocalDNDBlocks();
      } else {
        toast.error('Failed to add record');
      }
    } catch (err: any) {
      console.error('Error adding record:', err);
      toast.error(err.response?.data?.message || 'Failed to add record');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle modal close
  const handleCloseModal = () => {
    setShowAddModal(false);
    setFormData({
      called_number: '',
      comments: ''
    });
  };

  // Handle checkbox selection
  const handleSelectRecord = (recordId: number) => {
    setSelectedRecords(prev => 
      prev.includes(recordId) 
        ? prev.filter(id => id !== recordId)
        : [...prev, recordId]
    );
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedRecords.length === apiData.length) {
      setSelectedRecords([]);
    } else {
      setSelectedRecords(apiData.map(record => record.id));
    }
  };

  // Handle delete single record
  const handleDeleteClick = (record: LocalDNDBlockRecord) => {
    setRecordToDelete(record);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!recordToDelete) return;

    setDeleting(true);
    try {
      const response = await axiosInstance.delete(`/dncr/local-dnd-blocks/delete/${recordToDelete.id}`);
      
      if (response.data?.status === 'success') {
        toast.success(response.data.message || 'Record deleted successfully');
        setShowDeleteModal(false);
        setRecordToDelete(null);
        // Refresh the data
        fetchLocalDNDBlocks();
      } else {
        toast.error('Failed to delete record');
      }
    } catch (err: any) {
      console.error('Error deleting record:', err);
      toast.error(err.response?.data?.message || 'Failed to delete record');
    } finally {
      setDeleting(false);
    }
  };

  // Handle bulk delete
  const handleBulkDeleteClick = () => {
    if (selectedRecords.length === 0) {
      toast.warning('Please select at least one record to delete');
      return;
    }
    setShowBulkDeleteModal(true);
  };

  const handleConfirmBulkDelete = async () => {
    if (selectedRecords.length === 0) return;

    setDeleting(true);
    try {
      const payload = {
        ids: selectedRecords
      };

      const response = await axiosInstance.post('/dncr/local-dnd-blocks/bulk-delete', payload);
      
      if (response.data?.status === 'success') {
        toast.success(response.data.message || `${selectedRecords.length} record(s) deleted successfully`);
        setShowBulkDeleteModal(false);
        setSelectedRecords([]);
        // Refresh the data
        fetchLocalDNDBlocks();
      } else {
        toast.error('Failed to delete records');
      }
    } catch (err: any) {
      console.error('Error bulk deleting records:', err);
      toast.error(err.response?.data?.message || 'Failed to delete records');
    } finally {
      setDeleting(false);
    }
  };

  // Apply filters handler
  const handleApplyFilters = () => {
    setAppliedFilters({
      search: searchQuery,
      company: companyFilter
    });
    setCurrentPage(1); // Reset to first page when filters change
    setSelectedRecords([]); // Clear selections when filters change
  };

  // Reset filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setCompanyFilter('');
    setAppliedFilters({
      search: '',
      company: ''
    });
    setCurrentPage(1);
    setSelectedRecords([]); // Clear selections when filters reset
  };

  // Pagination handlers
  const handleFirstPage = () => setCurrentPage(1);
  const handleLastPage = () => setCurrentPage(totalPages);
  const handleNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const handlePrevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  const handleRecordsPerPageChange = (value: number) => {
    setRecordsPerPage(value);
    setCurrentPage(1);
    setSelectedRecords([]); // Clear selections when page size changes
  };

  // Download sample CSV
  const downloadSampleCSV = () => {
    const sampleData = [
      ['called_number', 'company_name', 'comments'],
      ['0501234567', 'Acme Corporation', 'Bulk upload - Campaign 2026'],
      ['0557890123', 'Tech Solutions Ltd', 'DND List Import'],
      ['0509876543', 'Global Industries', 'Customer requested block']
    ];

    const csvContent = sampleData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'local_dnd_blocks_sample.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // Handle CSV file selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      toast.error('Please select a CSV file');
      return;
    }

    setCsvFile(file);

    // Read and preview file
    try {
      const text = await file.text();
      setCsvPreview(text);
    } catch (err) {
      console.error('Error reading file:', err);
      toast.error('Failed to read CSV file');
    }
  };

  // Handle bulk add
  const handleBulkAdd = async () => {
    if (!csvFile || !csvPreview) {
      toast.error('Please select a CSV file');
      return;
    }

    setBulkSubmitting(true);
    try {
      const payload = {
        csv_data: csvPreview
      };

      const response = await axiosInstance.post<BulkAddLocalDNDResponse>('/dncr/local-dnd-blocks/bulk-add', payload);
      
      if (response.data?.status === 'success') {
        toast.success(response.data.message || `Successfully added ${response.data.records_added || 0} record(s)`);
        setShowBulkAddModal(false);
        setCsvFile(null);
        setCsvPreview('');
        // Reset file input
        const fileInput = document.getElementById('csv-file-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        // Refresh the data
        fetchLocalDNDBlocks();
      } else {
        toast.error('Failed to add records');
      }
    } catch (err: any) {
      console.error('Error bulk adding records:', err);
      toast.error(err.response?.data?.message || 'Failed to add records');
    } finally {
      setBulkSubmitting(false);
    }
  };

  // Handle bulk add modal close
  const handleCloseBulkAddModal = () => {
    setShowBulkAddModal(false);
    setCsvFile(null);
    setCsvPreview('');
    // Reset file input
    const fileInput = document.getElementById('csv-file-input') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };


  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Local DND Call Block" />

      {/* Header */}
      <div className="mb-4 d-flex justify-content-between align-items-center">
        <h4 style={{ color: '#212529', fontWeight: '600' }}>
          Local DND Call Block <span style={{ color: '#6c757d' }}>— Blocked Numbers</span>
        </h4>
        <div className="d-flex gap-2">
          {selectedRecords.length > 0 && (
            <Button
              variant="danger"
              onClick={handleBulkDeleteClick}
              style={{
                border: 'none',
                borderRadius: '8px',
                height: '38px',
                fontSize: '0.875rem',
                padding: '0 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Trash2 size={16} />
              Delete Selected ({selectedRecords.length})
            </Button>
          )}
          <Button
            onClick={() => setShowBulkAddModal(true)}
            variant="outline-primary"
            style={{
              border: '1px solid #4f46e5',
              borderRadius: '8px',
              color: '#4f46e5',
              height: '38px',
              fontSize: '0.875rem',
              padding: '0 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'transparent'
            }}
          >
            <Upload size={16} />
            Bulk Add
          </Button>
          <Button
            onClick={() => setShowAddModal(true)}
            style={{
              backgroundColor: '#4f46e5',
              border: 'none',
              borderRadius: '8px',
              color: '#ffffff',
              height: '38px',
              fontSize: '0.875rem',
              padding: '0 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Plus size={16} />
            Add Block
          </Button>
        </div>
      </div>

      {/* Search and Filter Row */}
      <Row className="mb-3">
          <Col>
            <div className="d-flex flex-wrap gap-2 align-items-center justify-content-between">
              <div className="d-flex flex-wrap gap-2 align-items-center">
                {/* Search Filter */}
                <div className="d-flex align-items-center" style={{ backgroundColor: '#ffffff', border: '1px solid #dee2e6', borderRadius: '8px', padding: '8px 12px', height: '38px' }}>
                  <Search size={16} style={{ color: '#6c757d', marginRight: '8px' }} />
                  <Form.Control
                    type="text"
                    placeholder="Search (Called Number or Comments)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
                    style={{ 
                      border: 'none', 
                      boxShadow: 'none',
                      fontSize: '0.875rem',
                      color: '#212529',
                      width: '250px',
                      padding: '0'
                    }}
                  />
                </div>
                
                {/* Company Filter */}
                <div className="d-flex align-items-center" style={{ backgroundColor: '#ffffff', border: '1px solid #dee2e6', borderRadius: '8px', padding: '8px 12px', height: '38px' }}>
                  <Building2 size={16} style={{ color: '#6c757d', marginRight: '8px' }} />
                  <Form.Control
                    type="text"
                    placeholder="Company Name"
                    value={companyFilter}
                    onChange={(e) => setCompanyFilter(e.target.value)}
                    style={{ 
                      border: 'none', 
                      boxShadow: 'none',
                      fontSize: '0.875rem',
                      width: '200px',
                      padding: '0'
                    }}
                  />
                </div>
              </div>

              {/* Action Buttons - Right Side */}
              <div className="d-flex gap-2 align-items-center">
                <Button 
                  variant="light" 
                  onClick={handleResetFilters}
                  style={{ 
                    backgroundColor: '#ffffff', 
                    border: '1px solid #dee2e6', 
                    borderRadius: '8px', 
                    color: '#212529',
                    height: '38px',
                    fontSize: '0.875rem',
                    padding: '0 16px'
                  }}
                >
                  Reset
                </Button>
                
                <Button 
                  onClick={handleApplyFilters}
                  style={{ 
                    backgroundColor: '#4f46e5', 
                    border: 'none', 
                    borderRadius: '8px', 
                    color: '#ffffff',
                    height: '38px',
                    fontSize: '0.875rem',
                    padding: '0 16px'
                  }}
                >
                  Apply Filters
                </Button>
              </div>
            </div>
          </Col>
        </Row>

        {/* Active Filters Display */}
        {(appliedFilters.search || appliedFilters.company) && (
          <div className="mb-3 px-2">
            <div className="d-flex gap-2 align-items-center flex-wrap">
              <span style={{ color: '#6c757d', fontSize: '0.875rem' }}>Active Filters:</span>
              {appliedFilters.search && (
                <span style={{ backgroundColor: '#e0e7ff', color: '#4f46e5', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem' }}>
                  Search: {appliedFilters.search}
                </span>
              )}
              {appliedFilters.company && (
                <span style={{ backgroundColor: '#e0e7ff', color: '#4f46e5', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem' }}>
                  Company: {appliedFilters.company}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Table Section */}
        <Card className="border" style={{ backgroundColor: '#ffffff', borderRadius: '12px', borderColor: '#dee2e6' }}>
          <Card.Body className="p-0">
            <div className="d-flex justify-content-between align-items-center p-3 border-bottom" style={{ borderColor: '#dee2e6 !important' }}>
              <h6 className="mb-0" style={{ color: '#212529' }}>
                Local DND Blocks <span style={{ color: '#6c757d' }}>— Blocked Numbers</span>
              </h6>
              <div className="d-flex align-items-center gap-2">
                <span style={{ color: '#6c757d', fontSize: '0.875rem' }}>
                  {totalRecords} Records | Page {currentPage} of {totalPages || 1}
                </span>
                <Button 
                  variant="light" 
                  size="sm" 
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  style={{ backgroundColor: '#f8f9fa', border: '1px solid #dee2e6', color: '#212529' }}
                >
                  <ChevronLeft size={16} />
                </Button>
                <Button 
                  variant="light" 
                  size="sm" 
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages || totalPages === 0}
                  style={{ backgroundColor: '#f8f9fa', border: '1px solid #dee2e6', color: '#212529' }}
                >
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <Table className="mb-0" style={{ minWidth: '800px' }}>
                <thead style={{ backgroundColor: '#f8f9fa' }}>
                  <tr>
                    <th style={{ color: '#6c757d', fontWeight: '500', fontSize: '0.75rem', padding: '12px', border: 'none', width: '50px' }}>
                      <Form.Check
                        type="checkbox"
                        checked={apiData.length > 0 && selectedRecords.length === apiData.length}
                        onChange={handleSelectAll}
                        disabled={loading || apiData.length === 0}
                      />
                    </th>
                    <th style={{ color: '#6c757d', fontWeight: '500', fontSize: '0.75rem', padding: '12px', border: 'none' }}>ID</th>
                    <th style={{ color: '#6c757d', fontWeight: '500', fontSize: '0.75rem', padding: '12px', border: 'none' }}>CALLED NUMBER</th>
                    <th style={{ color: '#6c757d', fontWeight: '500', fontSize: '0.75rem', padding: '12px', border: 'none' }}>COMPANY NAME</th>
                    <th style={{ color: '#6c757d', fontWeight: '500', fontSize: '0.75rem', padding: '12px', border: 'none' }}>DATE/TIME</th>
                    <th style={{ color: '#6c757d', fontWeight: '500', fontSize: '0.75rem', padding: '12px', border: 'none' }}>COMMENTS</th>
                    <th style={{ color: '#6c757d', fontWeight: '500', fontSize: '0.75rem', padding: '12px', border: 'none', width: '80px' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    if (loading) {
                      return (
                        <tr>
                          <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: '#6c757d' }}>
                            Loading...
                          </td>
                        </tr>
                      );
                    }
                    if (error) {
                      return (
                        <tr>
                          <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: '#dc3545' }}>
                            {error}
                          </td>
                        </tr>
                      );
                    }
                    if (apiData.length > 0) {
                      return apiData.map((record) => (
                        <tr key={record.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                          <td style={{ padding: '12px', border: 'none' }}>
                            <Form.Check
                              type="checkbox"
                              checked={selectedRecords.includes(record.id)}
                              onChange={() => handleSelectRecord(record.id)}
                            />
                          </td>
                          <td style={{ color: '#212529', fontSize: '0.875rem', padding: '12px', border: 'none' }}>{record.id}</td>
                          <td style={{ color: '#212529', fontSize: '0.875rem', padding: '12px', border: 'none' }}>{record.called_number}</td>
                          <td style={{ color: '#212529', fontSize: '0.875rem', padding: '12px', border: 'none' }}>{record.company_name || '-'}</td>
                          <td style={{ color: '#212529', fontSize: '0.875rem', padding: '12px', border: 'none' }}>{formatDateTime(record.date_time)}</td>
                          <td style={{ color: '#212529', fontSize: '0.875rem', padding: '12px', border: 'none' }}>
                            <span style={{ color: '#6c757d' }}>{record.comments || '-'}</span>
                          </td>
                          <td style={{ padding: '12px', border: 'none' }}>
                            <Button
                              variant="link"
                              size="sm"
                              onClick={() => handleDeleteClick(record)}
                              style={{
                                color: '#dc3545',
                                padding: '4px 8px',
                                textDecoration: 'none'
                              }}
                              title="Delete record"
                            >
                              <Trash2 size={16} />
                            </Button>
                          </td>
                        </tr>
                      ));
                    }
                    return (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: '#6c757d' }}>
                          No records found matching your filters
                        </td>
                      </tr>
                    );
                  })()}
                </tbody>
              </Table>
            </div>

            <div className="d-flex justify-content-between align-items-center p-3 border-top" style={{ borderColor: '#dee2e6 !important' }}>
              <span style={{ color: '#6c757d', fontSize: '0.875rem' }}>
                {totalRecords} Records | Page {currentPage} of {totalPages || 1}
              </span>
              <div className="d-flex align-items-center gap-2">
                <span style={{ color: '#6c757d', fontSize: '0.875rem', marginRight: '8px' }}>Records per page:</span>
                <Dropdown>
                  <Dropdown.Toggle variant="light" size="sm" style={{ backgroundColor: '#f8f9fa', border: '1px solid #dee2e6', color: '#212529' }}>
                    {recordsPerPage} ▼
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item onClick={() => handleRecordsPerPageChange(10)}>10</Dropdown.Item>
                    <Dropdown.Item onClick={() => handleRecordsPerPageChange(25)}>25</Dropdown.Item>
                    <Dropdown.Item onClick={() => handleRecordsPerPageChange(50)}>50</Dropdown.Item>
                    <Dropdown.Item onClick={() => handleRecordsPerPageChange(100)}>100</Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
                <Button 
                  variant="light" 
                  size="sm" 
                  onClick={handleFirstPage}
                  disabled={currentPage === 1}
                  style={{ backgroundColor: '#f8f9fa', border: '1px solid #dee2e6', color: '#212529', marginLeft: '12px' }}
                >
                  <ChevronsLeft size={16} />
                </Button>
                <Button 
                  variant="light" 
                  size="sm" 
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  style={{ backgroundColor: '#f8f9fa', border: '1px solid #dee2e6', color: '#212529' }}
                >
                  <ChevronLeft size={16} />
                </Button>
                <Button 
                  variant="primary" 
                  size="sm" 
                  style={{ backgroundColor: '#4f46e5', border: 'none', minWidth: '32px' }}
                >
                  {currentPage}
                </Button>
                <Button 
                  variant="light" 
                  size="sm" 
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages || totalPages === 0}
                  style={{ backgroundColor: '#f8f9fa', border: '1px solid #dee2e6', color: '#212529' }}
                >
                  <ChevronRight size={16} />
                </Button>
                <Button 
                  variant="light" 
                  size="sm" 
                  onClick={handleLastPage}
                  disabled={currentPage === totalPages || totalPages === 0}
                  style={{ backgroundColor: '#f8f9fa', border: '1px solid #dee2e6', color: '#212529' }}
                >
                  <ChevronsRight size={16} />
                </Button>
              </div>
            </div>
          </Card.Body>
        </Card>

      {/* Add Record Modal */}
      <Modal show={showAddModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Add Local DND Block</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleAddRecord}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>
                Called Number <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter called number (e.g., 0501234567)"
                value={formData.called_number}
                onChange={(e) => setFormData({ ...formData, called_number: e.target.value })}
                required
              />
              <Form.Text className="text-muted">
                The phone number to be blocked
              </Form.Text>
            </Form.Group>

            

            <Form.Group className="mb-3">
              <Form.Label>Comments</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Enter comments (optional)"
                value={formData.comments}
                onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
              />
              <Form.Text className="text-muted">
                Optional: Additional notes or reason for blocking
              </Form.Text>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal} disabled={submitting}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              type="submit" 
              disabled={submitting}
              style={{ backgroundColor: '#4f46e5', border: 'none' }}
            >
              {submitting ? 'Adding...' : 'Add Block'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Bulk Add Modal */}
      <Modal show={showBulkAddModal} onHide={handleCloseBulkAddModal} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Bulk Add Local DND Blocks</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-4">
            <h6 className="mb-3">CSV Format</h6>
            <p className="text-muted small mb-3">
              Upload a CSV file with columns: <strong>called_number</strong>, <strong>company_name</strong>, <strong>comments</strong>
            </p>
            
            {/* Sample CSV Display */}
            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="text-muted small">Sample CSV format:</span>
                <Button
                  variant="link"
                  size="sm"
                  onClick={downloadSampleCSV}
                  style={{
                    padding: '0',
                    textDecoration: 'none',
                    color: '#4f46e5',
                    fontSize: '0.875rem'
                  }}
                >
                  <Download size={14} className="me-1" />
                  Download Sample CSV
                </Button>
              </div>
              <div style={{
                backgroundColor: '#f8f9fa',
                border: '1px solid #dee2e6',
                borderRadius: '6px',
                padding: '12px',
                fontSize: '0.75rem',
                fontFamily: 'monospace',
                overflowX: 'auto',
                maxHeight: '200px',
                overflowY: 'auto'
              }}>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
{`called_number,company_name,comments
0501234567,Acme Corporation,Bulk upload - Campaign 2026
0557890123,Tech Solutions Ltd,DND List Import
0509876543,Global Industries,Customer requested block`}
                </pre>
              </div>
            </div>

            {/* File Upload */}
            <Form.Group className="mb-3">
              <Form.Label>Select CSV File</Form.Label>
              <Form.Control
                id="csv-file-input"
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                disabled={bulkSubmitting}
              />
              <Form.Text className="text-muted">
                Select a CSV file with the required columns
              </Form.Text>
            </Form.Group>

            {/* File Preview */}
            {csvPreview && (
              <div className="mt-3">
                <h6 className="mb-2">File Preview</h6>
                <div style={{
                  backgroundColor: '#f8f9fa',
                  border: '1px solid #dee2e6',
                  borderRadius: '6px',
                  padding: '12px',
                  fontSize: '0.75rem',
                  fontFamily: 'monospace',
                  maxHeight: '200px',
                  overflow: 'auto'
                }}>
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{csvPreview}</pre>
                </div>
                <Form.Text className="text-muted small mt-2">
                  {csvFile?.name} ({(csvFile?.size || 0) / 1024} KB)
                </Form.Text>
              </div>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseBulkAddModal} disabled={bulkSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleBulkAdd}
            disabled={!csvFile || bulkSubmitting}
            style={{ backgroundColor: '#4f46e5', border: 'none' }}
          >
            {bulkSubmitting ? (
              <>
                <div className="spinner-border spinner-border-sm me-2" role="status" />
                Uploading...
              </>
            ) : (
              'Upload & Add Records'
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      {recordToDelete && (
        <DeleteConfirmationModal
          show={showDeleteModal}
          onHide={() => {
            setShowDeleteModal(false);
            setRecordToDelete(null);
          }}
          onConfirm={handleConfirmDelete}
          itemName={`blocked number ${recordToDelete.called_number}`}
          itemType="block"
          loading={deleting}
          
        />
      )}

      {/* Bulk Delete Confirmation Modal */}
      <DeleteConfirmationModal
        show={showBulkDeleteModal}
        onHide={() => setShowBulkDeleteModal(false)}
        onConfirm={handleConfirmBulkDelete}
        itemName={`${selectedRecords.length} record(s)`}
        itemType="block"
        loading={deleting}
        
      />

    </React.Fragment>
  );
};

LocalDNDCallBlock.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default LocalDNDCallBlock;
