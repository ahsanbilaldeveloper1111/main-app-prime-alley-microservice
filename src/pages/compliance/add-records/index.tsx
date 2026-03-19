import "@assets/scss/datatable-style.scss";
import React, {
  ReactElement,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { toast } from 'react-toastify';
import DeleteConfirmationModal from "@pages/partial/DeleteConfirmationModal";
import GenericTable, {
  TableAction,
  TableColumn,
  ToolbarConfig,
} from "@components/GenericTable";
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
import { Row, Col, Card, Form, Button } from 'react-bootstrap';
import { Upload, RefreshCw, Trash2, Download } from 'lucide-react';

type FetchParams = {
  limit: number;
  offset: number;
  search?: string;
};

type CsvRecordPayload = {
  called_number: string;
  comments: string;
};

const CALLED_NUMBER_REGEX = /^05\d{8}$/;

function isValidCalledNumber(value: string): boolean {
  return CALLED_NUMBER_REGEX.test(value.trim());
}

function getErrorMessage(err: unknown, fallback: string): string {
  if (typeof err === "object" && err !== null && "response" in err) {
    const response = (err as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) return response.data.message;
  }
  return fallback;
}

const AddRecords = () => {
    const [calledNumber, setCalledNumber] = useState('');
    const [comments, setComments] = useState('');
    const [selectedItems, setSelectedItems] = useState<number[]>([]);
    const [searchNumber, setSearchNumber] = useState('');
    const [itemsPerPage, setItemsPerPage] = useState(100);
    const [currentPage, setCurrentPage] = useState(1);
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [csvPreview, setCsvPreview] = useState<string>('');
    const csvInputRef = useRef<HTMLInputElement | null>(null);

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
      search: ''
    });

    // Fetch Local DND Blocks data from API
    const fetchData = useCallback(async () => {
      setLoading(true);
      setError(null);
      try {
        const offset = (currentPage - 1) * itemsPerPage;
        const params: FetchParams = {
          limit: itemsPerPage,
          offset: offset,
        };

        // Add filter parameters
        if (appliedFilters.search) {
          params.search = appliedFilters.search;
        }

        const response = await fetchLocalDNDBlocks(params);
        
        if (response?.status === 'success') {
          setApiData(response.records || []);
          setTotalRecords(response.total || 0);
        } else {
          setError('Failed to fetch records');
          setApiData([]);
          setTotalRecords(0);
        }
      } catch (err: unknown) {
        console.error('Error fetching records:', err);
        setError(getErrorMessage(err, 'Failed to fetch records'));
        setApiData([]);
        setTotalRecords(0);
      } finally {
        setLoading(false);
      }
    }, [currentPage, itemsPerPage, appliedFilters]);

    // Fetch data on mount and when pagination/filters change
    useEffect(() => {
      void fetchData();
    }, [fetchData]);

    const resetCsvSelection = useCallback(() => {
      setCsvFile(null);
      setCsvPreview('');
      if (csvInputRef.current) {
        csvInputRef.current.value = '';
      }
    }, []);

    // Add single record
    const handleAddBlock = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!calledNumber.trim()) {
        toast.error('Please enter a called number');
        return;
      }

      const trimmedNumber = calledNumber.trim();
      if (!isValidCalledNumber(trimmedNumber)) {
        toast.error('Called number must be exactly 10 digits');
        return;
      }

      setSubmitting(true);
      try {
        const response = await addLocalDNDBlock({
          called_number: calledNumber.trim(),
          comments: comments.trim() || undefined
        });

        if (response?.status === 'success') {
          toast.success(response.message || 'Record added successfully');
        setCalledNumber('');
        setComments('');
          // Refresh the data
          await fetchData();
        }else if (response?.status === 'error') {
          toast.error(response?.error || 'Failed to add record');
        }
         else {
          toast.error('Failed to add record');
        }
      } catch (err: unknown) {
        console.error('Error adding record:', err);
        toast.error(getErrorMessage(err, 'Failed to add record'));
      } finally {
        setSubmitting(false);
      }
    };
  
    // Handle CSV file selection
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Validate file type
      if (!file.name.toLowerCase().endsWith('.csv')) {
        toast.error('Please select a CSV file');
        resetCsvSelection();
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
        resetCsvSelection();
      }
    };

    // Download sample CSV
    const downloadSampleCSV = () => {
      const sampleData = [
        ['called_number', 'comments'],
        ['0511111111', 'Comments for the record'],
        ['0511111112', 'Comments for the record']
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
        // Parse CSV text into records array
        const lines = csvPreview.trim().split('\n');
        if (lines.length < 2) {
          toast.error('CSV file must contain at least a header row and one data row');
          resetCsvSelection();
          return;
        }

        // Skip header row (first line)
        const dataLines = lines.slice(1);
        const records: CsvRecordPayload[] = [];
        for (const line of dataLines) {
          const values = line.split(',').map((v) => v.trim());
          const calledNum = values[0];
          if (!calledNum) continue;
          if (!isValidCalledNumber(calledNum)) {
            toast.error(`Invalid called number in CSV: ${calledNum}`);
            resetCsvSelection();
            return;
          }
          records.push({
            called_number: calledNum,
            comments: values[1] || '',
          });
        }

        if (records.length === 0) {
          toast.error('No valid records found in CSV file');
          setBulkSubmitting(false);
          return;
        }

        // Format payload as required
        const payload = {
          records: records
        };

        const response = await bulkAddLocalDNDBlocks(payload);
        
        if (response?.status === 'success') {
          toast.success(response.message || `Successfully added ${response.records_added || 0} record(s)`);
          resetCsvSelection();
          // Refresh the data
          await fetchData();
        } else {
          toast.error('Failed to add records');
        }
      } catch (err: unknown) {
        console.error('Error bulk adding records:', err);
        toast.error(getErrorMessage(err, 'Failed to add records'));
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
          await fetchData();
        } else {
          toast.error('Failed to delete record');
        }
      } catch (err: unknown) {
        console.error('Error deleting record:', err);
        toast.error(getErrorMessage(err, 'Failed to delete record'));
      } finally {
        setDeleting(false);
      }
    };
  
    // Handle bulk delete
    const handleBulkDeleteClick = () => {
      if (selectedItems.length === 0) {
        toast.warn('Please select at least one record to delete');
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
          await fetchData();
      } else {
          toast.error('Failed to delete records');
        }
      } catch (err: unknown) {
        console.error('Error bulk deleting records:', err);
        toast.error(getErrorMessage(err, 'Failed to delete records'));
      } finally {
        setDeleting(false);
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
        search: searchNumber
      });
      setCurrentPage(1); // Reset to first page when filters change
      setSelectedItems([]); // Clear selections when filters change
    };

    // Reset filters
    const handleResetFilters = () => {
      setSearchNumber('');
      setAppliedFilters({
        search: ''
      });
      setCurrentPage(1);
      setSelectedItems([]); // Clear selections when filters reset
    };
  
    // Refresh data
    const handleRefresh = () => {
      handleResetFilters();
      void fetchData();
    };

    const handleItemsPerPageChange = (value: number) => {
      setItemsPerPage(value);
      setCurrentPage(1);
      setSelectedItems([]); // Clear selections when page size changes
    };

    const selectedRows = apiData.filter((record) => selectedItems.includes(record.id));

    const toolbarConfig: ToolbarConfig = {
      showSearch: true,
      searchValue: searchNumber,
      searchPlaceholder: 'Search by number...',
      onSearchChange: setSearchNumber,
      onSearch: handleApplyFilters,
      showFilterPills: false,
      showMoreFiltersButton: false,
      customActions: (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {selectedItems.length > 0 && (
            <Button
              variant="danger"
              size="sm"
              onClick={handleBulkDeleteClick}
              style={{ border: 'none', borderRadius: '8px', fontSize: '0.875rem', padding: '0.375rem 0.75rem' }}
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
              padding: '0.375rem 0.75rem',
            }}
          >
            <RefreshCw size={14} style={{ marginRight: '4px' }} />
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleApplyFilters}
            style={{ backgroundColor: '#4f46e5', border: 'none', borderRadius: '8px' }}
          >
            Apply
          </Button>
          <Button
            variant="light"
            size="sm"
            onClick={handleResetFilters}
            style={{ border: '1px solid #dee2e6', borderRadius: '8px' }}
          >
            Reset
          </Button>
        </div>
      ),
    };

    const columns: TableColumn<LocalDNDBlockRecord>[] = [
      { key: 'id', label: 'ID', type: 'text', sortable: false },
      { key: 'called_number', label: 'CALLED NUMBER', type: 'text', sortable: false },
      {
        key: 'company_name',
        label: 'COMPANY NAME',
        type: 'text',
        sortable: false,
        emptyValue: '-',
      },
      {
        key: 'date_time',
        label: 'DATE/TIME',
        type: 'custom',
        sortable: false,
        render: (row) => formatDateTime(row.date_time),
      },
      {
        key: 'comments',
        label: 'COMMENTS',
        type: 'custom',
        sortable: false,
        render: (row) => <span style={{ color: '#6c757d' }}>{row.comments || '-'}</span>,
      },
    ];

    const actions: TableAction<LocalDNDBlockRecord>[] = [
      {
        label: 'Delete',
        icon: <Trash2 size={16} />,
        onClick: (row) => handleDeleteClick(row),
        variant: 'link',
        className: 'text-danger',
      },
    ];

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
                  Upload a CSV file with columns: <strong>called_number</strong>, <strong>comments</strong>
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
{`called_number,comments
0511111111,Comments for the record
0511111112,Comments for the record`}
                    </pre>
                  </div>
                </div>

                <Form.Group className="mb-3">
                  <Form.Label style={{ fontWeight: '500', color: '#6c757d', fontSize: '0.875rem' }}>
                    Choose CSV File
                  </Form.Label>
                  <Form.Control
                    ref={csvInputRef}
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

        <div className="mb-2" style={{ color: '#212529', fontWeight: '600' }}>
          Blocked Numbers List
        </div>

        <GenericTable<LocalDNDBlockRecord>
          data={apiData}
          columns={columns}
          actions={actions}
          showActions={true}
          actionsLabel="ACTIONS"
          loading={loading}
          loadingMessage="Loading..."
          emptyMessage={error || 'No records found matching your filters'}
          uniqueKey="id"
          selectable={true}
          selectedRows={selectedRows}
          onSelectionChange={(rows) => setSelectedItems(rows.map((row) => row.id))}
          showToolbar={true}
          toolbar={toolbarConfig}
          showToolbarActions={false}
          pagination={{
            currentPage,
            rowsPerPage: itemsPerPage,
            totalRows: totalRecords,
            pageSizeOptions: [10, 25, 50, 100],
          }}
          onPaginationChange={(page, rowsPerPageValue) => {
            if (rowsPerPageValue !== itemsPerPage) {
              handleItemsPerPageChange(rowsPerPageValue);
              return;
            }
            setCurrentPage(page);
          }}
        />

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
