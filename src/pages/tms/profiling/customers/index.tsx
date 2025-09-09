import "@assets/scss/datatable-style.scss";
import React, {
  ReactElement,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import Link from "next/link";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericListPage from "@components/GenericListPage";
import { Column } from "@components/CustomDataTable";
import { Button, Modal, Row } from "react-bootstrap";
import { Col } from "react-bootstrap";
import { toast } from "react-toastify";
import { useTokenService } from "src/hooks/useTokenService";
import { useSession } from "next-auth/react";
import moment from "moment";
import Select from "react-select";

import { ListCustomerProfiling, DeleteCompany, AddUpdateICCID } from "@utils/tms/tmsProfiling";

interface SelectOption {
  value: number;
  label: string;
}

const CustomerProfilingList = () => {
  const { data: session, status } = useSession();

  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [currentFilters, setCurrentFilters] = useState({});

  const columns: Column[] = useMemo(
    () => [
      {key: "name",name: "Name",selector: (row: any) => row.name,sortable: true},
      {key: "users_count",name: "Users Count",selector: (row: any) => row.users_count,sortable: true},
      {key: "iccids",name: "ICCID Group",selector: (row: any) => row.iccid_group,sortable: true,
        cell: (row: any) => {
          if (row.iccids && Array.isArray(row.iccids)) {
            const names = row.iccids.map((iccid: any) => iccid.name);
            return names.join(', ');
          }
          return '';
        }
      },
      {key:'organization_unit',name:'Organization Unit',selector: (row: any) => row.organization_unit,sortable: true},
      {key: 'action', name: 'Action', selector: (row: any) => row.action, sortable: true,
        cell: (row: any) => {
          return <div className="d-flex gap-2">
            
            <Button size="sm" variant="outline-primary"  onClick={() => {
              console.log(row);
            }}>Edit</Button>

            <Button size="sm" variant="outline-danger" onClick={() => handleDeleteCompany(row)}>Delete</Button>

            <Button size="sm" variant="outline-primary" onClick={() => handleOpenIccidModal(row)}>Create/Update ICCID</Button>


          </div>
        }
      },
      
      
    ],
    []
  );


  const [selectedCompany, setSelectedCompany] = useState<number | null>(null);
  const [selectedCompanyName, setSelectedCompanyName] = useState<string | null>(null);
  const [showDeleteCompanyModal, setShowDeleteCompanyModal] = useState<boolean>(false);
  const [confirmDelete, setConfirmDelete] = useState<string>("");
  
  // ICCID Modal states
  const [showIccidModal, setShowIccidModal] = useState<boolean>(false);
  const [selectedRowData, setSelectedRowData] = useState<any>(null);
  const [iccids, setIccids] = useState<any[]>([]);
  const [newIccidName, setNewIccidName] = useState<string>("");
  const [newIccidValue, setNewIccidValue] = useState<string>("");
  
  // Edit ICCID states
  const [editingIccid, setEditingIccid] = useState<any>(null);
  const [editingName, setEditingName] = useState<string>("");
  const [editingNumbers, setEditingNumbers] = useState<string[]>([]);
  const [newNumberInput, setNewNumberInput] = useState<string>("");

  const handleDeleteCompany = (props: any) => {
    setSelectedCompany(props.id);
    setSelectedCompanyName(props.name);
    setShowDeleteCompanyModal(true);
};

const handleSubmitDeleteCompany = async () => {
  const confirmDeleteValue = confirmDelete.trim().toLowerCase();
  if(confirmDeleteValue == "delete"){
      const response = await DeleteCompany(selectedCompany as number);
      if(response){
          setSelectedCompany(null);
          setSelectedCompanyName(null);
          setShowDeleteCompanyModal(false);
          setConfirmDelete("");
          setRefreshKey(prev => prev + 1); // Trigger refresh
      }
  }else{
      toast.error('Please type the word delete to confirm');
  }
};

// ICCID Modal handlers
const handleOpenIccidModal = (row: any) => {
  setSelectedRowData(row);
  setIccids(row.iccids || []);
  setNewIccidName("");
  setNewIccidValue("");
  setShowIccidModal(true);
};

const handleCloseIccidModal = () => {
  setShowIccidModal(false);
  setSelectedRowData(null);
  setIccids([]);
  setNewIccidName("");
  setNewIccidValue("");
  setEditingIccid(null);
  setEditingName("");
  setEditingNumbers([]);
  setNewNumberInput("");
};

const handleAddIccid = async () => {
  if (!newIccidName.trim() || !newIccidValue.trim()) {
    toast.error('Please fill in both ICCID group name and ICCID number');
    return;
  }
  
  const payload = {
    name: newIccidName.trim(),
    iccid_numbers: [newIccidValue.trim()],
    company_id: selectedRowData.id
  };

  try {
    const response = await AddUpdateICCID(payload);
    if (response) {
      // Add to local state for immediate UI update
      // const newIccid = {
      //   name: newIccidName.trim(),
      //   value: newIccidValue.trim(),
      //   id: Date.now() // Simple ID generation for local state
      // };
      
      // setIccids(prev => [...prev, newIccid]);
      setNewIccidName("");
      setNewIccidValue("");
      toast.success('ICCID added successfully');
    }
  } catch (error) {
    console.error('Error adding ICCID:', error);
    toast.error('Failed to add ICCID');
  }
};

// Edit ICCID handlers
const handleEditIccid = (iccid: any) => {
  setEditingIccid(iccid);
  setEditingName(iccid.name);
  setEditingNumbers([...iccid.iccid_numbers]);
  setNewNumberInput("");
};

const handleCancelEdit = () => {
  setEditingIccid(null);
  setEditingName("");
  setEditingNumbers([]);
  setNewNumberInput("");
};

const handleRemoveNumber = (index: number) => {
  setEditingNumbers(prev => prev.filter((_, i) => i !== index));
};

const handleAddNumber = () => {
  if (newNumberInput.trim()) {
    setEditingNumbers(prev => [...prev, newNumberInput.trim()]);
    setNewNumberInput("");
  }
};


const handleSaveEdit = async () => {
  const filteredNumbers = editingNumbers.filter(n => n.trim());
  
  if (!editingName.trim() || filteredNumbers.length === 0) {
    toast.error('Please provide a name and at least one ICCID number');
    return;
  }

  const payload = {
    name: editingName.trim(),
    iccid_numbers: filteredNumbers,
    company_id: selectedRowData.id,
    id: editingIccid.id
  };

  try {
    const response = await AddUpdateICCID(payload);
    if (response) {
      // Update local state
      setIccids(prev => prev.map(iccid => 
        iccid.id === editingIccid.id 
          ? { ...iccid, name: editingName.trim(), iccid_numbers: filteredNumbers }
          : iccid
      ));
      
      handleCancelEdit();
      toast.success('ICCID updated successfully');
    }
  } catch (error: any) {
    console.error('Error updating ICCID:', error);
    
    // Handle validation errors from API
    if (error?.response?.data?.code === 422 && error?.response?.data?.response?.errors) {
      const errors = error.response.data.response.errors;
      const errorMessages = Object.values(errors).flat();
      
      // Show specific error messages
      errorMessages.forEach((message: any) => {
        toast.error(message);
      });
    } else if (error?.response?.data?.response?.message) {
      // Show general error message
      toast.error(error.response.data.response.message);
    } else {
      // Fallback error message
      toast.error('Failed to update ICCID');
    }
  }
};

  const memoizedFilters = useMemo(() => currentFilters, [currentFilters]);

  const fetchCustomerProfiling = useCallback(
      
      async (page = 1, perPage = 15, search = "") => {
        return await ListCustomerProfiling();
      },
      [memoizedFilters]
    );


  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle="Customer Profiling"
        mainLink="/tms/profiling/customer"
        subTitle="Customer Profiling"
      />
      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title d-flex align-items-center justify-content-between">
            <h2 className="mb-0">
              List Customer Profiling
            </h2>
            <Link href="/tms/profiling/customers/create" className="btn btn-primary ms-2">Add New</Link>
          </div>
        </Col>
      </Row>

      
        <GenericListPage
          columns={columns}
          fetchData={fetchCustomerProfiling}
          title="Customer Profiling"
          searchPlaceholder="Search Customer Profiling..."
          defaultPageSize={15}
          filters={memoizedFilters}
          refreshKey={refreshKey}
          search={true}
        />

{showDeleteCompanyModal && (
                <Modal
                    show={showDeleteCompanyModal}
                    onHide={() => setShowDeleteCompanyModal(false)}
                >
                    <Modal.Header closeButton>
                        <Modal.Title>Delete Company?</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <p>
                            Are you sure you want to delete this <b className="text-danger">{selectedCompanyName}</b> company?
                        </p>
                        <p>
                            Type the word <b className="text-danger">delete</b> to confirm
                        </p>
                        <input type="text" className="form-control" id="confirmDelete" value={confirmDelete} onChange={(e) => setConfirmDelete(e.target.value)} placeholder="Type the word delete to confirm" />

                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowDeleteCompanyModal(false)}>Close</Button>
                        <Button variant="danger" onClick={() => handleSubmitDeleteCompany()}>Delete</Button>
                    </Modal.Footer>
                    
                </Modal>
            )}

{/* ICCID Management Modal */}
{showIccidModal && (
  <Modal
    show={showIccidModal}
    onHide={handleCloseIccidModal}
    size="lg"
  >
    <Modal.Header closeButton>
      <Modal.Title>Manage ICCIDs - {selectedRowData?.name}</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      {/* Existing ICCIDs List */}
      <div className="mb-4">
        <h6>Existing ICCIDs:</h6>
        {iccids.length > 0 ? (
          <div className="table-responsive">
            <table className="table table-sm table-striped">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>ICCID Numbers</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {iccids.map((iccid, index) => (
                  <React.Fragment key={iccid.id || index}>
                    <tr>
                      <td>{iccid.name}</td>
                      <td style={{ width: '300px', maxWidth: '300px' }}>
                        <div style={{ maxHeight: '120px', overflowY: 'auto' }}>
                          {iccid.iccid_numbers && iccid.iccid_numbers.length > 0 ? (
                            <div>
                              {iccid.iccid_numbers.map((number: any, numIndex: any) => (
                                <span key={numIndex} className="badge bg-secondary me-1 mb-1">
                                  {number}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted">No numbers</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <Button
                          size="sm"
                          variant="outline-primary"
                          onClick={() => handleEditIccid(iccid)}
                        >
                          Edit
                        </Button>
                      </td>
                    </tr>
                    {editingIccid && editingIccid.id === iccid.id && (
                      <tr>
                        <td colSpan={3} className="p-0">
                          <div className="bg-light border-top p-3">
                            <div className="row">
                              <div className="col-md-6">
                                <label className="form-label fw-bold">ICCID Group Name</label>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={editingName}
                                  onChange={(e) => setEditingName(e.target.value)}
                                  placeholder="Enter ICCID group name"
                                />
                              </div>
                              <div className="col-md-6">
                                <label className="form-label fw-bold">Add New Number</label>
                                <div className="d-flex gap-2">
                                  <input
                                    type="text"
                                    className="form-control"
                                    value={newNumberInput}
                                    onChange={(e) => setNewNumberInput(e.target.value)}
                                    placeholder="Add new ICCID number"
                                    onKeyPress={(e) => {
                                      if (e.key === 'Enter' && newNumberInput.trim()) {
                                        handleAddNumber();
                                      }
                                    }}
                                  />
                                  <Button
                                    variant="outline-success"
                                    onClick={handleAddNumber}
                                    disabled={!newNumberInput.trim()}
                                  >
                                    Add
                                  </Button>
                                </div>
                              </div>
                            </div>
                            <div className="mt-3">
                              <label className="form-label fw-bold">ICCID Numbers</label>
                              <div className="border rounded p-3 bg-white" style={{ minHeight: '80px', maxHeight: '150px', overflowY: 'auto' }}>
                                {editingNumbers.filter(n => n.trim()).length > 0 ? (
                                  editingNumbers.filter(n => n.trim()).map((number, numIndex) => (
                                    <span key={numIndex} className="badge bg-primary me-1 mb-1 d-inline-flex align-items-center">
                                      {number}
                                      <button
                                        type="button"
                                        className="btn-close btn-close-white ms-1"
                                        style={{ fontSize: '0.6em' }}
                                        onClick={() => handleRemoveNumber(numIndex)}
                                        aria-label="Remove"
                                      ></button>
                                    </span>
                                  ))
                                ) : (
                                  <div className="text-muted text-center py-2">
                                    No ICCID numbers added yet
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="mt-3 d-flex gap-2">
                              <Button 
                                variant="success" 
                                onClick={handleSaveEdit}
                              >
                                Save Changes
                              </Button>
                              <Button variant="outline-secondary" onClick={handleCancelEdit}>
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-muted">No ICCIDs found for this customer.</p>
        )}
      </div>

      {/* Add New ICCID Form */}
      <div className="border-top pt-3">
        <div className="alert alert-primary bg-primary text-white">
          Add New ICCID
        </div>
        <Row>
          <Col md={6}>
            <div className="mb-3">
              <label htmlFor="iccidName" className="form-label">ICCID Group Name</label>
              <input
                type="text"
                className="form-control"
                id="iccidName"
                value={newIccidName}
                onChange={(e) => setNewIccidName(e.target.value)}
                placeholder="Enter ICCID group name"
              />
            </div>
          </Col>
          <Col md={6}>
            <div className="mb-3">
              <label htmlFor="iccidValue" className="form-label">ICCID Number</label>
              <input
                type="text"
                className="form-control"
                id="iccidValue"
                value={newIccidValue}
                onChange={(e) => setNewIccidValue(e.target.value)}
                placeholder="Enter ICCID number"
              />
            </div>
          </Col>
        </Row>
        <Button 
          variant="primary" 
          onClick={handleAddIccid}
          disabled={!newIccidName.trim() || !newIccidValue.trim()}
        >
          Add ICCID
        </Button>
      </div>
    </Modal.Body>
    <Modal.Footer>
      <Button variant="secondary" onClick={handleCloseIccidModal}>
        Close
      </Button>
    </Modal.Footer>
  </Modal>
)}

      

    </React.Fragment>
  );
};

CustomerProfilingList.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CustomerProfilingList;