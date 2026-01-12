import "@assets/scss/datatable-style.scss";
import React, {
  ReactElement,
  useState,
  useEffect,
  useCallback,
} from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { toast } from 'react-toastify';
import DeleteConfirmationModal from "@pages/partial/DeleteConfirmationModal";
import {
  fetchLocalDNDBlocks,
  addLocalDNDBlock,
  deleteLocalDNDBlock,
  bulkDeleteLocalDNDBlocks,
  bulkAddLocalDNDBlocks,
  LocalDNDBlockRecord,
} from "@utils/dncr";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import { Row, Col, Card, Form, Button, Table } from 'react-bootstrap';
import { Upload, RefreshCw, Trash2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Download } from 'lucide-react';


const AddRecords = () => {
    const [calledNumber, setCalledNumber] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [comments, setComments] = useState('');
    const [selectedItems, setSelectedItems] = useState<number[]>([]);
    const [searchNumber, setSearchNumber] = useState('');
    const [filterCompany, setFilterCompany] = useState('');
    const [itemsPerPage, setItemsPerPage] = useState(100);
    const [currentPage, setCurrentPage] = useState(1);
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [csvPreview, setCsvPreview] = useState<string>('');

    // API state
    const [loading, setLoading] = useState(false);
    const [apiData, setApiData] = useState<LocalDNDBlockRecord[]>([]);
    const [totalRecords, setTotalRecords] = useState(0);
    const [error, setError] = useState<string | null>(null);

    // Delete state
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
    const [recordToDelete, setRecordToDelete] = useState<LocalDNDBlockRecord | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Form submission state
    const [submitting, setSubmitting] = useState(false);
    const [bulkSubmitting, setBulkSubmitting] = useState(false);

    // Applied filters
    const [appliedFilters, setAppliedFilters] = useState({
      search: '',
      company: ''
    });

    // Fetch Local DND Blocks data from API
    const fetchData = useCallback(async () => {
      setLoading(true);
      setError(null);
      try {
        const offset = (currentPage - 1) * itemsPerPage;
        const params: any = {
          limit: itemsPerPage,
          offset: offset,
        };

        // Add filter parameters
        if (appliedFilters.search) {
          params.search = appliedFilters.search;
        }
        if (appliedFilters.company) {
          params.company = appliedFilters.company;
        }

        const response = await fetchLocalDNDBlocks(params);
        
        if (response?.status === 'success') {
          setApiData(response.records || []);
          setTotalRecords(response.total || 0);
        } else {
          setError('Failed to fetch records');
          setApiData([]);
        }
      } catch (err: any) {
        console.error('Error fetching records:', err);
        setError(err.response?.data?.message || 'Failed to fetch records');
        setApiData([]);
      } finally {
        setLoading(false);
      }
    }, [currentPage, itemsPerPage, appliedFilters]);

    // Fetch data on mount and when pagination/filters change
    useEffect(() => {
      fetchData();
    }, [fetchData]);

    // Calculate total pages
    const totalPages = Math.ceil(totalRecords / itemsPerPage);
  
    // Add single record
    const handleAddBlock = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!calledNumber.trim()) {
        toast.error('Please enter a called number');
        return;
      }

      setSubmitting(true);
      try {
        const response = await addLocalDNDBlock({
          called_number: calledNumber.trim(),
          company_name: companyName.trim() || undefined,
          comments: comments.trim() || undefined
        });

        if (response?.status === 'success') {
          toast.success(response.message || 'Record added successfully');
        setCalledNumber('');
        setCompanyName('');
        setComments('');
          // Refresh the data
          fetchData();
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
  
    // Handle CSV file selection
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
  
    const handleBulkUpload = async () => {
      if (!csvFile || !csvPreview) {
        toast.error('Please select a CSV file');
        return;
      }
  
      setBulkSubmitting(true);
      try {
        const response = await bulkAddLocalDNDBlocks(csvPreview);
        
        if (response?.status === 'success') {
          toast.success(response.message || `Successfully added ${response.records_added || 0} record(s)`);
          setCsvFile(null);
          setCsvPreview('');
        // Reset file input
        const fileInput = document.getElementById('csvFileInput') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
          // Refresh the data
          fetchData();
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
  
    // Handle delete single record
    const handleDeleteClick = (record: LocalDNDBlockRecord) => {
      setRecordToDelete(record);
      setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
      if (!recordToDelete) return;

      setDeleting(true);
      try {
        const response = await deleteLocalDNDBlock(recordToDelete.id);
        
        if (response?.status === 'success') {
          toast.success(response.message || 'Record deleted successfully');
          setShowDeleteModal(false);
          setRecordToDelete(null);
          // Refresh the data
          fetchData();
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
      if (selectedItems.length === 0) {
        toast.warning('Please select at least one record to delete');
        return;
      }
      setShowBulkDeleteModal(true);
    };

    const handleConfirmBulkDelete = async () => {
      if (selectedItems.length === 0) return;

      setDeleting(true);
      try {
        const response = await bulkDeleteLocalDNDBlocks(selectedItems);
        
        if (response?.status === 'success') {
          toast.success(response.message || `${selectedItems.length} record(s) deleted successfully`);
          setShowBulkDeleteModal(false);
          setSelectedItems([]);
          // Refresh the data
          fetchData();
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
  
    // Handle checkbox selection
    const handleSelectRecord = (recordId: number) => {
      setSelectedItems(prev => 
        prev.includes(recordId) 
          ? prev.filter(id => id !== recordId)
          : [...prev, recordId]
      );
    };

    // Handle select all
    const handleSelectAll = () => {
      if (selectedItems.length === apiData.length) {
        setSelectedItems([]);
      } else {
        setSelectedItems(apiData.map(record => record.id));
      }
    };
  
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

    // Apply filters handler
    const handleApplyFilters = () => {
      setAppliedFilters({
        search: searchNumber,
        company: filterCompany
      });
      setCurrentPage(1); // Reset to first page when filters change
      setSelectedItems([]); // Clear selections when filters change
    };

    // Reset filters
    const handleResetFilters = () => {
      setSearchNumber('');
      setFilterCompany('');
      setAppliedFilters({
        search: '',
        company: ''
      });
      setCurrentPage(1);
      setSelectedItems([]); // Clear selections when filters reset
    };
  
    // Refresh data
    const handleRefresh = () => {
      handleResetFilters();
      fetchData();
    };

    // Pagination handlers
    const handleFirstPage = () => setCurrentPage(1);
    const handleLastPage = () => setCurrentPage(totalPages);
    const handleNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
    const handlePrevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
    const handleItemsPerPageChange = (value: number) => {
      setItemsPerPage(value);
      setCurrentPage(1);
      setSelectedItems([]); // Clear selections when page size changes
    };

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Local DND Call Block Management" />

     {/* Header */}
     <div className="mb-4">
          <h4 style={{ color: '#212529', fontWeight: '600', marginBottom: '0.5rem' }}>
            Local DND Call Block Management
          </h4>
          <p style={{ color: '#6c757d', fontSize: '0.875rem', marginBottom: 0 }}>
            Manage company-specific blocked numbers
          </p>
        </div>

        {/* Add Records Section */}
        <Row className="g-3 mb-4">
          {/* Add Single Record */}
          <Col lg={6}>
            <Card className="border" style={{ height: '100%', backgroundColor: '#ffffff', borderRadius: '12px', borderColor: '#dee2e6' }}>
              <Card.Body className="p-3">
                <h6 className="mb-3" style={{ color: '#212529', fontWeight: '600', fontSize: '1rem' }}>
                  <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>+</span> Add Single Record
                </h6>
                <Form onSubmit={handleAddBlock}>
                  <Form.Group className="mb-3">
                    <Form.Label style={{ fontWeight: '500', color: '#6c757d', fontSize: '0.875rem' }}>
                      Called Number <span style={{ color: '#dc3545' }}>*</span>
                    </Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="e.g. 0501234567"
                      value={calledNumber}
                      onChange={(e) => setCalledNumber(e.target.value)}
                      required
                      style={{ 
                        padding: '0.5rem 0.75rem',
                        fontSize: '0.875rem',
                        border: '1px solid #dee2e6',
                        borderRadius: '8px'
                      }}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label style={{ fontWeight: '500', color: '#6c757d', fontSize: '0.875rem' }}>
                      Company Name <span style={{ color: '#dc3545' }}>*</span>
                    </Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="e.g. Acme Corporation"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      required
                      style={{ 
                        padding: '0.5rem 0.75rem',
                        fontSize: '0.875rem',
                        border: '1px solid #dee2e6',
                        borderRadius: '8px'
                      }}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label style={{ fontWeight: '500', color: '#6c757d', fontSize: '0.875rem' }}>
                      Comments (Optional)
                    </Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      placeholder="Reason for blocking..."
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      style={{ 
                        padding: '0.5rem 0.75rem',
                        fontSize: '0.875rem',
                        border: '1px solid #dee2e6',
                        borderRadius: '8px'
                      }}
                    />
                  </Form.Group>

                  <Button 
                    type="submit"
                    disabled={submitting}
                    style={{
                      width: '100%',
                      padding: '0.5rem 1rem',
                      backgroundColor: '#4f46e5',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#ffffff'
                    }}
                  >
                    {submitting ? 'Adding...' : 'Add Block'}
                  </Button>
                </Form>
              </Card.Body>
            </Card>
          </Col>

          {/* Bulk Add Records */}
          <Col lg={6}>
            <Card className="border" style={{ height: '100%', backgroundColor: '#ffffff', borderRadius: '12px', borderColor: '#dee2e6' }}>
              <Card.Body className="p-3">
                <h6 className="mb-3" style={{ color: '#212529', fontWeight: '600', fontSize: '1rem' }}>
                  <Upload size={18} /> Bulk Add Records (CSV)
                </h6>
                <p style={{ color: '#6c757d', fontSize: '0.875rem', marginBottom: '1rem' }}>
                  Upload a CSV file with columns: <strong>called_number</strong>, <strong>company_name</strong>, <strong>comments</strong>
                </p>
                
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
                      Download Sample
                    </Button>
                  </div>
                  <div style={{
                    backgroundColor: '#f8f9fa',
                    border: '1px solid #dee2e6',
                    borderRadius: '6px',
                    padding: '8px',
                    fontSize: '0.75rem',
                    fontFamily: 'monospace',
                    overflowX: 'auto'
                  }}>
                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
{`called_number,company_name,comments
0501234567,Acme Corporation,Bulk upload
0557890123,Tech Solutions Ltd,DND List`}
                    </pre>
                  </div>
                </div>

                <Form.Group className="mb-3">
                  <Form.Label style={{ fontWeight: '500', color: '#6c757d', fontSize: '0.875rem' }}>
                    Choose CSV File
                  </Form.Label>
                  <Form.Control
                    id="csvFileInput"
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    disabled={bulkSubmitting}
                    style={{ 
                      padding: '0.5rem',
                      fontSize: '0.875rem',
                      border: '1px solid #dee2e6',
                      borderRadius: '8px'
                    }}
                  />
                  {csvPreview && (
                    <Form.Text className="text-muted small d-block mt-2">
                      {csvFile?.name} ({(csvFile?.size || 0) / 1024} KB)
                    </Form.Text>
                  )}
                </Form.Group>

                <Button
                  onClick={handleBulkUpload}
                  disabled={!csvFile || bulkSubmitting}
                  style={{
                    width: '100%',
                    padding: '0.5rem 1rem',
                    backgroundColor: '#4f46e5',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#ffffff'
                  }}
                >
                  {bulkSubmitting ? 'Uploading...' : 'Upload & Add'}
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Blocked Numbers List */}
        <Card className="border" style={{ backgroundColor: '#ffffff', borderRadius: '12px', borderColor: '#dee2e6' }}>
          <Card.Body className="p-0">
            <div className="d-flex justify-content-between align-items-center p-3 border-bottom" style={{ borderColor: '#dee2e6 !important' }}>
              <h6 className="mb-0" style={{ color: '#212529', fontWeight: '600' }}>
                Blocked Numbers List
              </h6>
              <div className="d-flex align-items-center gap-2">
                {selectedItems.length > 0 && (
                <Button
                    variant="danger"
                  size="sm"
                    onClick={handleBulkDeleteClick}
                  style={{ 
                      border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    padding: '0.375rem 0.75rem'
                  }}
                >
                  <Trash2 size={14} style={{ marginRight: '4px' }} />
                    Delete Selected ({selectedItems.length})
                </Button>
                )}
                <Button
                  variant="light"
                  size="sm"
                  onClick={handleRefresh}
                  style={{ 
                    backgroundColor: '#f8f9fa',
                    border: '1px solid #dee2e6',
                    borderRadius: '8px',
                    color: '#212529',
                    fontSize: '0.875rem',
                    padding: '0.375rem 0.75rem'
                  }}
                >
                  <RefreshCw size={14} style={{ marginRight: '4px' }} />
                  Refresh
                </Button>
              </div>
            </div>

            {/* Search and Filter */}
            <div className="p-3">
            <Row className="g-2 mb-3">
              <Col md={4}>
                <Form.Control
                  type="text"
                  placeholder="Search by number..."
                  value={searchNumber}
                  onChange={(e) => setSearchNumber(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
                  style={{ 
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.875rem',
                    border: '1px solid #dee2e6',
                    borderRadius: '8px'
                  }}
                />
              </Col>
              <Col md={4}>
                <Form.Control
                  type="text"
                  placeholder="Filter by company..."
                  value={filterCompany}
                  onChange={(e) => setFilterCompany(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
                  style={{ 
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.875rem',
                    border: '1px solid #dee2e6',
                    borderRadius: '8px'
                  }}
                />
              </Col>
              <Col md={4}>
                <div className="d-flex gap-2">
                <Form.Select
                  value={itemsPerPage}
                    onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                  style={{ 
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.875rem',
                    border: '1px solid #dee2e6',
                    borderRadius: '8px'
                  }}
                >
                  <option value={10}>10 per page</option>
                  <option value={25}>25 per page</option>
                  <option value={50}>50 per page</option>
                  <option value={100}>100 per page</option>
                </Form.Select>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleApplyFilters}
                    style={{
                      backgroundColor: '#4f46e5',
                      border: 'none',
                      borderRadius: '8px'
                    }}
                  >
                    Apply
                  </Button>
                  <Button
                    variant="light"
                    size="sm"
                    onClick={handleResetFilters}
                    style={{
                      border: '1px solid #dee2e6',
                      borderRadius: '8px'
                    }}
                  >
                    Reset
                  </Button>
                </div>
              </Col>
            </Row>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
              <Table className="mb-0" style={{ minWidth: '1400px' }}>
                <thead style={{ backgroundColor: '#f8f9fa' }}>
                  <tr>
                    <th style={{ color: '#6c757d', fontWeight: '500', fontSize: '0.75rem', padding: '12px', border: 'none', width: '50px' }}>
                      <Form.Check
                        type="checkbox"
                        checked={apiData.length > 0 && selectedItems.length === apiData.length}
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
                              checked={selectedItems.includes(record.id)}
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

            {/* Pagination */}
              <div className="d-flex justify-content-between align-items-center p-3 border-top" style={{ borderColor: '#dee2e6 !important' }}>
                <span style={{ color: '#6c757d', fontSize: '0.875rem' }}>
                {totalRecords} Records | Page {currentPage} of {totalPages || 1}
                </span>
                <div className="d-flex align-items-center gap-2">
                  <Button
                    variant="light"
                    size="sm"
                  onClick={handleFirstPage}
                    disabled={currentPage === 1}
                    style={{ backgroundColor: '#f8f9fa', border: '1px solid #dee2e6', color: '#212529' }}
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
        itemName={`${selectedItems.length} record(s)`}
        itemType="block"
        loading={deleting}
      />

    </React.Fragment>
  );
};

AddRecords.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default AddRecords;
