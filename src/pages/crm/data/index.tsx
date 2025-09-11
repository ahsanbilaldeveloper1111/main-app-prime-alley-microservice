import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useState, useEffect, useCallback, useMemo } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericListPage from "@components/GenericListPage";
import CrmFilters from "@components/filters/CrmFilters";
import { Button, Card, Row, Col, Form, Alert, Spinner, Modal, Badge } from "react-bootstrap";
import { toast } from "react-toastify";
import { useSession } from "next-auth/react";
import moment from "moment";
import { FiUpload, FiDatabase, FiSearch, FiFilter, FiTrash2, FiEye, FiUser, FiCheck, FiUsers } from "react-icons/fi";
import { Column } from "@components/CustomDataTable";
import { 
  getCrmData, 
  uploadCrmDataCsv, 
  deleteCrmData,
  assignCrmDataToExtension,
  markCrmDataAsViewed,
  CrmDataItem, 
  CrmDataPagination, 
  CrmDataResponse 
} from "@utils/crm";
import { GetHierarchyData } from "@utils/users";

const CrmDataManagement = () => {
  const { data: session } = useSession();
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentFilters, setCurrentFilters] = useState<Record<string, any>>({});
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedDataItem, setSelectedDataItem] = useState<CrmDataItem | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<CrmDataItem | null>(null);
  const [selectedRows, setSelectedRows] = useState<CrmDataItem[]>([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignExtension, setAssignExtension] = useState("");
  const [extensions, setExtensions] = useState<any[]>([]);

  const memoizedFilters = useMemo(() => currentFilters, [currentFilters]);

  // Fetch extensions data
  useEffect(() => {
    const fetchExtensions = async () => {
      try {
        const hierarchyData = await GetHierarchyData();
        if (hierarchyData?.extensions) {
          setExtensions(hierarchyData.extensions);
        }
      } catch (error) {
        console.error("Failed to fetch extensions:", error);
      }
    };
    fetchExtensions();
  }, []);

  // Handle filter changes
  const handleFiltersChange = useCallback((filters: Record<string, any>) => {
    setCurrentFilters(filters);
    setRefreshKey((prev) => prev + 1);
  }, []);

  // Fetch CRM data for GenericListPage
  const fetchCrmData = useCallback(
    async (page = 1, perPage = 15, search = "") => {
      const params: any = {
        page,
        per_page: perPage,
      };

      if (search) {
        params.search = search;
      }

      // Add filter parameters
      if (memoizedFilters.phone) {
        params.phone = memoizedFilters.phone;
      }

      const response = await getCrmData(params);
      console.log("CRM Data Response:", response);

      // Transform to GenericListPage expected format
      return {
        dataList: response.data || [],
        meta: {
          total: response.pagination.total || 0,
          current_page: response.pagination.current_page || page,
          per_page: response.pagination.per_page || perPage,
          last_page: response.pagination.last_page || 1,
        },
      };
    },
    [memoizedFilters]
  );

  // CSV validation function
  const validateCsvFile = (file: File): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    // Check file type
    if (!file.type.includes("csv") && !file.name.toLowerCase().endsWith(".csv")) {
      errors.push("File must be a CSV file");
    }
    
    // Check file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      errors.push("File size must be less than 10MB");
    }
    
    // Check if file is empty
    if (file.size === 0) {
      errors.push("File cannot be empty");
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };

  // Handle file selection
  const handleFileSelect = (file: File) => {
    const validation = validateCsvFile(file);
    
    if (validation.isValid) {
      setSelectedFile(file);
    } else {
      validation.errors.forEach(error => toast.error(error));
    }
  };

  // Handle drag and drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  // Upload CSV file
  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a file to upload");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const response = await uploadCrmDataCsv(selectedFile);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setSelectedFile(null);
      setShowUploadModal(false);
      setUploadProgress(0);
      
      // Refresh data
      setRefreshKey(prev => prev + 1);
    } catch (error: any) {
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
    }
  };

  // Handle view data item
  const handleViewData = useCallback((item: CrmDataItem) => {
    setSelectedDataItem(item);
    setShowViewModal(true);
  }, []);

  // Handle delete data item
  const handleDeleteData = useCallback((item: CrmDataItem) => {
    setItemToDelete(item);
    setShowDeleteModal(true);
  }, []);

  // Confirm delete
  const confirmDelete = useCallback(async () => {
    if (!itemToDelete) return;

    try {
      await deleteCrmData(itemToDelete.id);
      setShowDeleteModal(false);
      setItemToDelete(null);
      setRefreshKey(prev => prev + 1);
    } catch (error: any) {
      console.error("Delete error:", error);
    }
  }, [itemToDelete]);

  // Handle row selection
  const handleRowSelection = useCallback((rows: CrmDataItem[]) => {
    setSelectedRows(rows);
  }, []);

  // Handle assign to extension
  const handleAssignToExtension = useCallback(async () => {
    if (!assignExtension.trim()) {
      toast.error("Please select a user");
      return;
    }

    if (selectedRows.length === 0) {
      toast.error("Please select at least one item");
      return;
    }

    try {
      await assignCrmDataToExtension(
        assignExtension.trim(),
        selectedRows.map(row => row.id)
      );
      setShowAssignModal(false);
      setAssignExtension("");
      setSelectedRows([]);
      handleAssignModalClose();
      setRefreshKey(prev => prev + 1);
    } catch (error: any) {
      console.error("Assign error:", error);
    }
  }, [assignExtension, selectedRows]);

  // Handle mark as viewed
  const handleMarkAsViewed = useCallback(async (item: CrmDataItem) => {
    try {
      await markCrmDataAsViewed(item.id);
      setRefreshKey(prev => prev + 1);
    } catch (error: any) {
      console.error("Mark as viewed error:", error);
    }
  }, []);

  // Handle assign modal close
  const handleAssignModalClose = useCallback(() => {
    setShowAssignModal(false);
    setAssignExtension("");
    setSelectedRows([]);
  }, []);

  // Define columns for GenericListPage
  const columns: Column[] = useMemo(
    () => [
      {
        key: "id",
        name: "ID",
        selector: (row: any) => row.id,
        sortable: true,
        cell: (props: any) => (
          <div className="fw-medium">#{props.id}</div>
        ),
      },
      {
        key: "phone",
        name: "Phone",
        selector: (row: any) => row.phone,
        sortable: true,
        cell: (props: any) => (
          <div>
            {props.phone ? (
              <Badge bg="info">{props.phone}</Badge>
            ) : (
              <span className="text-muted">N/A</span>
            )}
          </div>
        ),
      },
      {
        key: "user_extension",
        name: "Assigned To",
        selector: (row: any) => row.user_extension,
        sortable: true,
        cell: (props: any) => (
          <div>
            {props.user_extension ? (
              <Badge bg="success">
                {extensions.find(
                  (extension: any) =>
                    extension.id.toString() === props.user_extension?.toString()
                )?.display_name || props.user_extension}
              </Badge>
            ) : (
              <span className="text-muted">Unassigned</span>
            )}
          </div>
        ),
      },
      {
        key: "is_viewed",
        name: "Status",
        selector: (row: any) => row.is_viewed,
        sortable: true,
        cell: (props: any) => (
          <div>
            {props.is_viewed ? (
              <Badge bg="primary">Viewed</Badge>
            ) : (
              <Badge bg="warning">New</Badge>
            )}
          </div>
        ),
      },
      {
        key: "data",
        name: "Data",
        selector: (row: any) => row.data,
        sortable: false,
        cell: (props: any) => (
          <div className="text-truncate" style={{ maxWidth: "300px" }}>
            {Object.entries(props.data || {}).length > 0 ? (
              Object.entries(props.data).slice(0, 2).map(([key, value]) => (
                <div key={key} className="small mb-1">
                  <span className="fw-bold text-primary">{key}:</span> {String(value)}
                </div>
              ))
            ) : (
              <span className="text-muted small">No data</span>
            )}
            {Object.entries(props.data || {}).length > 2 && (
              <div className="small text-muted">
                +{Object.entries(props.data).length - 2} more fields
              </div>
            )}
          </div>
        ),
      },
      {
        key: "created_at",
        name: "Created At",
        selector: (row: any) => row.created_at,
        sortable: true,
        cell: (props: any) => (
          <span>
            {props.created_at
              ? moment(props.created_at).format("MMM DD, YYYY HH:mm")
              : "Unknown"}
          </span>
        ),
      },
      {
        key: "actions",
        name: "Actions",
        selector: (row: any) => row.id,
        sortable: false,
        cell: (props: any) => (
          <div className="d-flex gap-1">
            <Button
              variant="outline-primary"
              size="sm"
              onClick={() => handleViewData(props)}
              title="View Details"
            >
              <FiEye size={14} />
            </Button>
            {!props.is_viewed && (
              <Button
                variant="outline-success"
                size="sm"
                onClick={() => handleMarkAsViewed(props)}
                title="Mark as Viewed"
              >
                <FiCheck size={14} />
              </Button>
            )}
            <Button
              variant="outline-danger"
              size="sm"
              onClick={() => handleDeleteData(props)}
              title="Delete Record"
            >
              <FiTrash2 size={14} />
            </Button>
          </div>
        ),
      },
    ],
    [handleViewData, handleMarkAsViewed, handleDeleteData, extensions]
  );

  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle="CRM"
        mainLink="/crm/dashboard"
        subTitle="Data Management"
      />

      <div className="container-fluid">
        {/* Header */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h1 className="h3 mb-0 d-flex align-items-center">
                  <FiDatabase className="me-2" />
                  CRM Data Management
                </h1>
                <p className="text-muted">
                  Upload and manage your CRM data from CSV files
                </p>
              </div>
              <div className="d-flex gap-2">
                {selectedRows.length > 0 && (
                  <Button
                    variant="success"
                    onClick={() => setShowAssignModal(true)}
                  >
                    <FiUsers className="me-2" />
                    Assign ({selectedRows.length})
                  </Button>
                )}
                <Button
                  variant="primary"
                  onClick={() => setShowUploadModal(true)}
                >
                  <FiUpload className="me-2" />
                  Upload CSV
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* CRM Filters */}
        <div className="row mb-3">
        </div>

        {/* CRM Data List */}
        <div className="row">
          <div className="col-12">
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <GenericListPage
                  columns={columns}
                  fetchData={fetchCrmData}
                  title="CRM Data"
                  searchPlaceholder="Search CRM data..."
                  defaultPageSize={15}
                  filters={memoizedFilters}
                  refreshKey={refreshKey}
                  rowSelection={true}
                  onSelectionChange={handleRowSelection}
                />
              </Card.Body>
            </Card>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      <Modal show={showUploadModal} onHide={() => setShowUploadModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title className="d-flex align-items-center">
            <FiUpload className="me-2" />
            Upload CSV File
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div
            className={`border-2 border-dashed rounded p-4 text-center ${
              dragActive ? "border-primary bg-light" : "border-secondary"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {selectedFile ? (
              <div>
                <FiDatabase className="text-success" style={{ fontSize: "3rem" }} />
                <p className="mt-2 mb-0">
                  <strong>{selectedFile.name}</strong>
                </p>
                <p className="text-muted small">
                  Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={() => setSelectedFile(null)}
                >
                  Remove File
                </Button>
              </div>
            ) : (
              <div>
                <FiUpload className="text-muted" style={{ fontSize: "3rem" }} />
                <p className="mt-2 mb-0">Drag and drop your CSV file here</p>
                <p className="text-muted small">or</p>
                <Button
                  variant="outline-primary"
                  onClick={() => document.getElementById("fileInput")?.click()}
                >
                  Browse Files
                </Button>
                <input
                  id="fileInput"
                  type="file"
                  accept=".csv"
                  onChange={handleFileInputChange}
                  style={{ display: "none" }}
                />
              </div>
            )}
          </div>

          {uploading && (
            <div className="mt-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="progress">
                <div
                  className="progress-bar"
                  role="progressbar"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          <Alert variant="info" className="mt-3">
            <strong>CSV Format Requirements:</strong>
            <ul className="mb-0 mt-2">
              <li>First row should contain column headers</li>
              <li>Phone numbers should be in a column named "phone" (case insensitive)</li>
              <li>Maximum file size: 10MB</li>
              <li>Supported formats: CSV, TXT</li>
            </ul>
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowUploadModal(false)}
            disabled={uploading}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
          >
            {uploading ? (
              <>
                <Spinner size="sm" className="me-2" />
                Uploading...
              </>
            ) : (
              "Upload File"
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* View Data Modal */}
      <Modal show={showViewModal} onHide={() => setShowViewModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title className="d-flex align-items-center">
            <FiEye className="me-2" />
            View CRM Data - #{selectedDataItem?.id}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedDataItem && (
            <div>
              <Row >
                <Col className="mb-3" md={6}>
                  <strong>ID:</strong> {selectedDataItem.id}
                </Col>
                <Col className="mb-3" md={6}>
                  <strong>Phone:</strong> {selectedDataItem.phone || "N/A"}
                </Col>
                <Col className="mb-3" md={6}>
                  <strong>Assigned To:</strong> {selectedDataItem.user_extension ? (
                    extensions.find(
                      (extension: any) =>
                        extension.id.toString() === selectedDataItem.user_extension?.toString()
                    )?.display_name || selectedDataItem.user_extension
                  ) : "Unassigned"}
                </Col>
                <Col className="mb-3" md={6}>
                  <strong>Status:</strong> {selectedDataItem.is_viewed ? "Viewed" : "New"}
                </Col>
                <Col className="mb-3" md={6}>
                  <strong>Created At:</strong> {moment(selectedDataItem.created_at).format("MMM DD, YYYY HH:mm")}
                </Col>
                <Col className="mb-3" md={6}>
                  <strong>Updated At:</strong> {moment(selectedDataItem.updated_at).format("MMM DD, YYYY HH:mm")}
                </Col>
                {Object.entries(selectedDataItem.data || {}).map(([key, value]) => (
                  <Col className="mb-3" key={key} md={6}>
                    <strong>{key}:</strong> {String(value) || "N/A"}
                  </Col>
                ))}
              </Row>
             
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowViewModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title className="d-flex align-items-center">
            <FiTrash2 className="me-2" />
            Delete CRM Data
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Are you sure you want to delete this CRM data record?
          </p>
          {itemToDelete && (
            <div className="alert alert-warning">
              <strong>Record ID:</strong> #{itemToDelete.id}<br />
              <strong>Phone:</strong> {itemToDelete.phone || "N/A"}<br />
              <strong>Assigned To:</strong> {itemToDelete.user_extension ? (
                extensions.find(
                  (extension: any) =>
                    extension.id.toString() === itemToDelete.user_extension?.toString()
                )?.display_name || itemToDelete.user_extension
              ) : "Unassigned"}<br />
              <strong>Created:</strong> {moment(itemToDelete.created_at).format("MMM DD, YYYY HH:mm")}
            </div>
          )}
          <p className="text-danger">
            <strong>This action cannot be undone.</strong>
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            Delete Record
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Assign to Extension Modal */}
      <Modal show={showAssignModal} onHide={handleAssignModalClose}>
        <Modal.Header closeButton>
          <Modal.Title className="d-flex align-items-center">
            <FiUsers className="me-2" />
            Assign to User Extension
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Assign <strong>{selectedRows.length}</strong> selected items to a user extension.
          </p>
          
          <Form.Group className="mb-3">
            <Form.Label>Assign to User</Form.Label>
            <Form.Select
              value={assignExtension}
              onChange={(e) => setAssignExtension(e.target.value)}
            >
              <option value="">Select a user...</option>
              {extensions.map((extension: any) => (
                <option key={extension.id} value={extension.id}>
                  {extension.display_name || extension.name || extension.id}
                </option>
              ))}
            </Form.Select>
            <Form.Text className="text-muted">
              Select the user you want to assign these items to.
            </Form.Text>
          </Form.Group>

          <div className="alert alert-info">
            <strong>Selected Items:</strong>
            <ul className="mb-0 mt-2">
              {selectedRows.slice(0, 5).map((item) => (
                <li key={item.id}>
                  #{item.id} - {item.phone || "No phone"} 
                  {item.user_extension && (
                    <span className="text-muted">
                      {" "}(Currently: {extensions.find(
                        (extension: any) =>
                          extension.id.toString() === item.user_extension?.toString()
                      )?.display_name || item.user_extension})
                    </span>
                  )}
                </li>
              ))}
              {selectedRows.length > 5 && (
                <li>... and {selectedRows.length - 5} more items</li>
              )}
            </ul>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleAssignModalClose}>
            Cancel
          </Button>
          <Button variant="success" onClick={handleAssignToExtension}>
            Assign Items
          </Button>
        </Modal.Footer>
      </Modal>
    </React.Fragment>
  );
};

CrmDataManagement.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CrmDataManagement;
