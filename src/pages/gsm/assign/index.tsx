import '@assets/scss/datatable-style.scss';
import React, { ReactElement, useEffect, useState } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import GenericListPage from '@components/GenericListPage';
import { ListGsmAssign, AssignPorts,UnassignPorts,DelinkCompany,EditAssign,NewAssignement } from '@utils/GsmAssign';
import { getGsmData } from '@utils/GsmManagement';

import { Column } from '@components/CustomDataTable';
import { Button, DropdownItem, DropdownMenu, Dropdown, Modal, Row, DropdownToggle } from 'react-bootstrap';
import { Col } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useTokenService } from 'src/hooks/useTokenService';
import { useSession } from 'next-auth/react';
import Select from 'react-select';
import '@assets/scss/gsm-assign.scss';
import '@assets/scss/dashboard-card.scss';

import GsmCompanyFilter from '@components/filters/GsmCompanyFilter';
import AnimatedNumber from '@components/AnimatedNumber';
import imgStatus1 from '@assets/images/widget/img-status-1.svg'
import imgStatus2 from '@assets/images/widget/img-status-2.svg'
import imgStatus3 from '@assets/images/widget/img-status-3.svg'
import imgStatus4 from '@assets/images/widget/img-status-4.svg'
import { FiEdit, FiTrash2,FiMoreVertical } from 'react-icons/fi';
import AddGsmModel from '@pages/gsm/partial/AddGsmModel';
import SuccessfulModal from '@pages/partial/SuccessfulModal';
import ConfirmModal from '@pages/partial/ConfirmModal';
import PortLinkUnlinkModal from '../partial/PortLinkUnlinkModal';


const GsmAssign = () => {
    const { data:session, status } = useSession();
   
    const columns: Column[] = [
        { key: 'gsm_name', name: 'GSM Name', selector: (row: any) => row.gsm_name, sortable: true },
        { key: 'gsm_ip', name: 'GSM IP', selector: (row: any) => row.gsm_ip, sortable: true },
        { key: 'company_name', name: 'Company', selector: (row: any) => row.company_name, sortable: true },
        { key: 'assigned_ports', name: 'Ports', selector: (row: any) => row.assigned_ports, sortable: true },
        
        {
          key: 'Action',
          name: 'ACTION',
          selector: (row: any) => row.id,
          sortable: false,
          cell: (props: any) => (
              
              <div className="action-buttons-container">

                {/* gsm_id, company_id , unassigned_ports, assigned_ports*/}
  

                  {/* {session?.user?.permissions?.includes('assign-port-gsm-assignment') && 
                    props?.unassigned_ports?.length > 0 && (
                      <button className="btn btn-sm btn-outline-primary" onClick={() => handleAssignPorts(props)}>Assign Ports</button>
                  )}  

                  {session?.user?.permissions?.includes('unassign-port-gsm-assignment')  && props?.assigned_ports?.length > 0 && (
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleUnassignPorts(props)}>Unassign Ports</button>
                  )} */}

                  {/* <button className="btn btn-sm btn-outline-primary" onClick={() => handleAssignPortsNew(props)}>Assign Ports</button>

                  {session?.user?.permissions?.includes('company-unlink-gsm-assignment')  && (
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelinkCompany(props)}>Delink Company</button>
                  )}
                  
                  {session?.user?.permissions?.includes('edit-link-gsm-assignment')  && (
                      <button className="btn btn-sm btn-outline-primary" onClick={() => handleEditLink(props)}>Edit</button>
                  )} */}

<Dropdown
                className="table-action-dropdown"
                //drop="start"
                placement="top-start"
            >
                <DropdownToggle variant="outline-secondary" size="sm">
                    <FiMoreVertical size={14} />
                </DropdownToggle>
                <DropdownMenu>
                    <DropdownItem className="action-edit" onClick={() => handleAssignGsm()}>
                        <FiEdit className="me-2" />
                        Edit
                    </DropdownItem>
                    <DropdownItem className="action-view" onClick={() => handleAssignPortsNew(props)}>
                        <FiEdit className="me-2" />
                        Ports
                    </DropdownItem>
                    <DropdownItem className="action-delete" onClick={() => handleDelinkCompany(props)}>
                        <FiTrash2 className="me-2" />
                        Delete
                    </DropdownItem>
                </DropdownMenu>
            </Dropdown>

                  
              </div>
          ),
      },
      



    ];

    const [refreshKey, setRefreshKey] = useState<number>(0);
    const [currentFilters, setCurrentFilters] = useState({});

    const fetchGsmAssign = async (page = 1, perPage = 15, search = "") => {
        return await ListGsmAssign({ page, perPage, search, filters: currentFilters });
    };

    const handleFiltersChange = (filters: any) => {
        setCurrentFilters(filters);
    };

    const handleExport = async (exportType: string, filters: Record<string, any>) => {
      setShowExportSuccessfulModal(true);
        // try {
        //     const response = await ExportCallLogs({ page: 1, perPage: 15, search: "", filters, isExport: true, exportType });
        //     console.log(response);
        // } catch (error) {
        //     console.error('Export error:', error);
        //     toast.error('Export failed. Please try again.');
        // }
    };

    const [showAssignPortsModal, setShowAssignPortsModal] = useState(false);
    const [selectedPortAssignGsm, setSelectedPortAssignGsm] = useState<any>(null);
    const [selectedGsmAssign, setSelectedGsmAssign] = useState<any>(null);
    const [selectedCompanyAssignGsm, setSelectedCompanyAssignGsm] = useState<any>(null);
    const [GsmUnassignedPorts, setGsmUnassignedPorts] = useState<any>([]);
    const [selectedUnassignedPorts, setSelectedUnassignedPorts] = useState<any>([]);

    const handleAssignPorts = (props: any) => {
        setSelectedPortAssignGsm(props.assigned_ports);
        setSelectedCompanyAssignGsm(props.company_id);
        setSelectedGsmAssign(props.gsm_id);
        setGsmUnassignedPorts(props.unassigned_ports);
        setSelectedUnassignedPorts([]);
        setShowAssignPortsModal(true);
    };

    const [showAssignPortsModalNew, setShowAssignPortsModalNew] = useState(false);
    const [selectedPorts, setSelectedPorts] = useState<number[]>([]);
    const [gsmName, setGsmName] = useState('');
    
    const handleAssignPortsNew = (props: any) => {
        setGsmName(props.gsm_name || 'GSM Device');
        setSelectedPorts([]);
        setShowAssignPortsModalNew(true);
    };

    const handlePortToggle = (portNumber: number) => {
        setSelectedPorts(prev => {
            if (prev.includes(portNumber)) {
                return prev.filter(port => port !== portNumber);
            } else {
                return [...prev, portNumber];
            }
        });
    };

    const [successfulPortsModal, setSuccessfulPortsModal] = useState(false);
    const handleSavePorts = () => {
        console.log('Selected ports:', selectedPorts);
        // Add your save logic here
        setShowAssignPortsModalNew(false);
        setSelectedPorts([]);
        setSuccessfulPortsModal(true);
    };

    const handleSubmitAssignPorts = async () => {
        try {
           const response = await AssignPorts(selectedGsmAssign, selectedCompanyAssignGsm, selectedUnassignedPorts);
           if(response){
            setSelectedUnassignedPorts([]);
            setSelectedCompanyAssignGsm(null);
            setSelectedPortAssignGsm(null);
            setSelectedGsmAssign(null);
            setGsmUnassignedPorts([]);
            setShowAssignPortsModal(false);
            setRefreshKey(refreshKey + 1);
           }
        } catch (error) {
            console.error('Assign ports error:', error);
            toast.error('Assign ports failed. Please try again.');
        }
    };

    const [showUnassignPortsModal, setShowUnassignPortsModal] = useState(false);
    const [GsmAssignedPorts, setGsmAssignedPorts] = useState<any>([]);
    const [selectedGsmUnassign, setSelectedGsmUnassign] = useState<any>(null);
    const [selectedCompanyUnassign, setSelectedCompanyUnassign] = useState<any>(null);
    const [selectedAssignedToUnAssign, setSelectedAssignedToUnAssign] = useState<any>([]);

    const handleUnassignPorts = (props: any) => {
      console.log(props);
      if(props.assigned_ports.length > 0){
        // Convert assigned_ports string to array of objects for Select component
        const portsArray = props.assigned_ports.split(',').map((portNumber: string) => ({
          id: portNumber.trim(),
          port_number: portNumber.trim()
        }));
        setGsmAssignedPorts(portsArray);
      }

        setSelectedGsmUnassign(props.gsm_id);
        setSelectedCompanyUnassign(props.company_id);
       // setSelectedAssignedToUnAssign(props.assigned_to);
        setShowUnassignPortsModal(true);
    };

    const handleSubmitUnassignPorts = async () => {
        try {
          console.log(selectedAssignedToUnAssign);
          const selectedUnAssignPorts = selectedAssignedToUnAssign.map((port: any) => port.port_number);
          console.log(selectedUnAssignPorts);
          if(selectedUnAssignPorts.length == 0){
            toast.error('Please select at least one port to unassign');
            return;
          }
          const response = await UnassignPorts(selectedGsmUnassign, selectedCompanyUnassign, selectedUnAssignPorts);
          if(response){
            setShowUnassignPortsModal(false);
            setSelectedAssignedToUnAssign([]);
            setSelectedGsmUnassign(null);
            setSelectedCompanyUnassign(null);
            setGsmAssignedPorts([]);
            setRefreshKey(refreshKey + 1);
          }
        } catch (error) {
            
        }
    }

    const handleSubmitDelinkCompany = async () => {
      setShowDelinkCompanyModal(false);
    }

    const [showDelinkCompanyModal, setShowDelinkCompanyModal] = useState(false);
    const handleDelinkCompany = async (props: any) => {
      setShowDelinkCompanyModal(true);


      return;
      const response = await DelinkCompany(props.id);
      if(response){
        setRefreshKey(refreshKey + 1);
      }
    }

    const [showEditLinkModal, setShowEditLinkModal] = useState(false);
    const [selectedGsmEditLink, setSelectedGsmEditLink] = useState<any>(null);
    const [selectedCompanyEditLink, setSelectedCompanyEditLink] = useState<any>(null);

    const [gsmList, setGsmList] = useState<any>([]);
    const [companyList, setCompanyList] = useState<any>([]);

    const [selectedEditAssign, setSelectedEditAssign] = useState<any>(null);

    const handleEditLink = async (props: any) => {
      const response = await getGsmData();
      console.log(response);
      console.log(props);
      if(response){
        setGsmList(response?.gsm);
        setCompanyList(response?.company);
        setSelectedGsmEditLink(props.gsm_ip);
        setSelectedCompanyEditLink(props.company_identifier);
        setSelectedEditAssign(props.id);
        setShowEditLinkModal(true);
      }
    }

    const handleSubmitEditLink = async () => {
      console.log(selectedEditAssign, selectedGsmEditLink, selectedCompanyEditLink);
      const response = await EditAssign(selectedEditAssign, selectedGsmEditLink, selectedCompanyEditLink);
      if(response){
        setShowEditLinkModal(false);
        setRefreshKey(refreshKey + 1);
      }
    }

    const [showCreateAssignementModal, setShowCreateAssignementModal] = useState(false);
    const [selectedGsmCreateAssignement, setSelectedGsmCreateAssignement] = useState<any>(null);
    const [selectedCompanyCreateAssignement, setSelectedCompanyCreateAssignement] = useState<any>(null);

    const handleCreateAssignement = async () => {
      const response = await getGsmData();
      console.log(response);
      if(response){
        setGsmList(response?.gsm);
        setCompanyList(response?.company);
        setShowCreateAssignementModal(true);
      }
      
    }
    const handleSubmitCreateAssignement = async () => {
      const response = await NewAssignement(selectedGsmCreateAssignement, selectedCompanyCreateAssignement);
      if(response){
        setShowCreateAssignementModal(false);
        setRefreshKey(refreshKey + 1);
      }
    }

    const [showAssignGsmModal, setShowAssignGsmModal] = useState(false);

    const handleAssignGsm = async () => {
      setShowAssignGsmModal(true);
    }

    const handleAssignmentSuccess = (assignment: { selectedGsm: string; selectedCompany: string }) => {
      console.log('Assignment successful:', assignment);
      // Add any additional logic here if needed
      setRefreshKey(refreshKey + 1); // Refresh the list
    }

    const [showExportSuccessfulModal, setShowExportSuccessfulModal] = useState(false);

    const handleExportSuccessful = async () => {
      setShowExportSuccessfulModal(true);
    }
   

  
    
    return (
        <React.Fragment>
            <BreadcrumbItem mainTitle="" mainLink="" subTitle="Call Logs" />
            <Row className="mb-3">
            <Col md={12}>
                <div className="page-header-title style-2">
                <Row className="align-items-center">
                    <Col md={5}>
                      <h2 className="mb-0 d-flex align-items-center">
                      GSM Assign

                      
                      {/* {session?.user?.permissions?.includes('company-link-gsm-assignment') && (
                          <Button variant="outline-primary" size="sm" className="ms-3" onClick={() => handleCreateAssignement()}>New Assign</Button>
                      )} */}

                      </h2>
                    </Col>
                    <Col md={7} className="d-flex justify-content-end">
                      {/* <GsmCompanyFilter onFiltersChange={handleFiltersChange} onExport={handleExport} /> */}
                      <div className="action-buttons">
                        <div className="search-container">
                            <i className="fas fa-search search-icon"></i>
                            <input type="text" className="search-bar" placeholder="Search GSM, Company..."/>
                        </div>
                        <button className="btn btn-primary" id="new-assign-btn" onClick={() => handleAssignGsm()}>
                            <i className="fas fa-plus"></i> New Assign
                        </button>
                        <button className="btn btn-export" id="export-btn" onClick={handleExportSuccessful}>
                            <i className="fas fa-download"></i> Export
                        </button>
                    </div>
                    </Col>
                  </Row>
               
                
                </div>
            </Col>
            </Row>


            {session?.user?.permissions?.includes('list-gsm-assignment') && (
                 <GenericListPage
                 columns={columns}
                 fetchData={fetchGsmAssign}
                 title="GSM Companies List"
                 searchPlaceholder="Search ..."
                 defaultPageSize={15}
                 filters={currentFilters}
                 refreshKey={refreshKey}
                 search={false}
                 tableStyle="table-style-2"
                 
             />
            )}

            {showAssignPortsModal && (
                <Modal
                show={showAssignPortsModal}
                onHide={() => setShowAssignPortsModal(false)}
                >
                    <Modal.Header closeButton>
                        <Modal.Title id="contained-modal-title-vcenter">
                            Assign Ports
                        </Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                      <div className="form-group mb-3">
                        <label htmlFor="company_id">Ports</label>

                        <Select
                            options={GsmUnassignedPorts.map((port: any) => (
                              { 
                                value: port.id, 
                                label: `Port ${port.port_number}` }))}
                            value={selectedUnassignedPorts.map((portId: any) => {
                                const port = GsmUnassignedPorts.find((p: any) => p.id === portId);
                                return { value: portId, label: `Port ${port?.port_number}` };
                            })}
                            onChange={(selectedOptions) => {
                                if (selectedOptions && Array.isArray(selectedOptions) && selectedOptions.length > 0) {
                                    // Extract only the IDs from selected options
                                    const selectedPortIds = selectedOptions.map((option: any) => option.value);
                                    setSelectedUnassignedPorts(selectedPortIds);
                                } else {
                                    setSelectedUnassignedPorts([]);
                                }
                            }}
                            isMulti
                        />
                      </div>

                     
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowAssignPortsModal(false)}>Close</Button>
                        <Button variant="primary" onClick={handleSubmitAssignPorts}>Assign</Button>
                    </Modal.Footer>
                </Modal>
            )}

            {showUnassignPortsModal && (
                <Modal
                show={showUnassignPortsModal}
                onHide={() => setShowUnassignPortsModal(false)}
                >
                    <Modal.Header closeButton>
                      <Modal.Title id="contained-modal-title-vcenter">
                        Unassign Ports
                      </Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                      <div className="form-group mb-3">
                        <label htmlFor="company_id">Ports</label>
                        <Select
                            options={GsmAssignedPorts.map((port: any) => (
                              { value: port.id, label: `Port ${port.port_number}` }))}
                            value={selectedAssignedToUnAssign.map((port: any) => (
                              { value: port.id, label: `Port ${port.port_number}` }))}
                            onChange={(selectedOptions) => {
                                if (selectedOptions && Array.isArray(selectedOptions) && selectedOptions.length > 0) {
                                    // Map the selected options back to the original port objects
                                    const selectedPorts = selectedOptions.map((option: any) => {
                                        return GsmAssignedPorts.find((port: any) => port.id === option.value);
                                    }).filter(Boolean);
                                    setSelectedAssignedToUnAssign(selectedPorts);
                                } else {
                                    setSelectedAssignedToUnAssign([]);
                                }
                            }}
                            isMulti
                        />
                      </div>
                    </Modal.Body>
                    <Modal.Footer>
                      <Button variant="secondary" onClick={() => setShowUnassignPortsModal(false)}>Close</Button>
                      <Button variant="primary" onClick={handleSubmitUnassignPorts}>Unassign</Button>
                    </Modal.Footer>
                </Modal>
            )}

            {showEditLinkModal && (
                <Modal
                show={showEditLinkModal}
                onHide={() => setShowEditLinkModal(false)}
                >
                    <Modal.Header closeButton>
                        <Modal.Title id="contained-modal-title-vcenter">
                            Edit Link
                        </Modal.Title>
                    </Modal.Header>
                    <Modal.Body>

                    <div className="form-group mb-3">
                        <label htmlFor="company_id">GSM</label>
                        <Select 
                        options={gsmList.map((gsm: any) => ({ value: gsm.id, label: gsm.name }))} 
                        value={gsmList.find((gsm: any) => gsm.id === selectedGsmEditLink) ? 
                          { value: selectedGsmEditLink, label: gsmList.find((gsm: any) => gsm.id === selectedGsmEditLink)?.name } : 
                          null
                        } 
                        onChange={(selectedOption) => setSelectedGsmEditLink(selectedOption?.value)} 

                        />
                      </div>


                      <div className="form-group mb-3">
                        <label htmlFor="company_id">Company</label>
                        <Select 
                        options={companyList.map((company: any) => ({ value: company?.identifier, label: company?.name }))} 
                        value={companyList.find((company: any) => company?.identifier === selectedCompanyEditLink) ? 
                          { value: selectedCompanyEditLink, label: companyList.find((company: any) => company?.identifier === selectedCompanyEditLink)?.name } : 
                          null
                        } 
                        onChange={(selectedOption) => setSelectedCompanyEditLink(selectedOption?.value)} 
                        
                        />
                      </div>

                    </Modal.Body>
                    <Modal.Footer>
                      <Button variant="secondary" onClick={() => setShowEditLinkModal(false)}>Close</Button>
                      <Button variant="primary" onClick={handleSubmitEditLink}>Edit</Button>
                    </Modal.Footer>
                </Modal>
            )}

            {showCreateAssignementModal && (
                <Modal
                show={showCreateAssignementModal}
                onHide={() => setShowCreateAssignementModal(false)}
                >
                  <Modal.Header closeButton>
                    <Modal.Title id="contained-modal-title-vcenter">
                      New Assign
                    </Modal.Title>
                  </Modal.Header>
                  <Modal.Body>
                    <div className="form-group mb-3">
                      <label htmlFor="company_id">GSM</label>
                      <Select 
                        options={gsmList.map((gsm: any) => ({ value: gsm?.id, label: gsm.name }))} 
                        value={selectedGsmCreateAssignement ? 
                          { value: selectedGsmCreateAssignement, label: gsmList.find((gsm: any) => gsm?.id === selectedGsmCreateAssignement)?.name } : 
                          null
                        } 
                        onChange={(selectedOption) => {
                          console.log('GSM selectedOption:', selectedOption);
                          setSelectedGsmCreateAssignement(selectedOption?.value || null);
                        }} 
                      />
                    </div>

                    <div className="form-group mb-3">
                      <label htmlFor="company_id">Company</label>
                      <Select 
                        options={companyList.map((company: any) => ({ value: company?.identifier, label: company?.name }))} 
                        value={selectedCompanyCreateAssignement ? 
                          { value: selectedCompanyCreateAssignement, label: companyList.find((company: any) => company?.identifier === selectedCompanyCreateAssignement)?.name } : 
                          null
                        } 
                        onChange={(selectedOption) => {
                          console.log('Company selectedOption:', selectedOption);
                          setSelectedCompanyCreateAssignement(selectedOption?.value || null);
                        }} 
                      />
                    </div>
                  </Modal.Body>
                  <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowCreateAssignementModal(false)}>Close</Button>
                    <Button variant="primary" onClick={handleSubmitCreateAssignement}>Create</Button>
                  </Modal.Footer>
                </Modal>
            )}


            <AddGsmModel 
              show={showAssignGsmModal}
              onHide={() => setShowAssignGsmModal(false)}
              onSuccess={handleAssignmentSuccess}
            />



{successfulPortsModal && (
<>
  <SuccessfulModal
  show={successfulPortsModal}
  onHide={() => setSuccessfulPortsModal(false)}
  title="Ports Updated!"
  description={`The ports for **${selectedCompanyAssignGsm}** have been successfully updated to: **${selectedPorts.join(', ')}**.`}
  confirmButtonText="OK"
  />

          </>
            )}

             {showAssignPortsModalNew && (
                <PortLinkUnlinkModal
                show={showAssignPortsModalNew}
                onHide={() => setShowAssignPortsModalNew(false)}
                gsmName={gsmName}
                initialSelectedPorts={selectedPorts}
                maxPorts={32}
                onSave={handleSavePorts}
              />
            
             )}

            {showDelinkCompanyModal && (
                <>
              <ConfirmModal
                show={showDelinkCompanyModal}
                onHide={() => setShowDelinkCompanyModal(false)}
                title="Delink Company"
                description="Are you sure you want to delink **Production** from **Prime Alley Technology LLC**? This action cannot be undone."
                targetName="this operation"
                confirmButtonText="Confirm Delink"
                onConfirm={(confirmationText) => handleSubmitDelinkCompany()}
              />
              </>
            
            )}

            {showExportSuccessfulModal && (
              <>
              <SuccessfulModal
                show={showExportSuccessfulModal}
                onHide={() => setShowExportSuccessfulModal(false)}
                title="Export Successful!"
                description="The GSM data has been successfully exported as a JSON file."
                confirmButtonText="OK"
              />
              </>
              )}
           
            

        
        </React.Fragment>
    );
};

GsmAssign.getLayout = (page: ReactElement) => {
    return <Layout>{page}</Layout>;
};

export default GsmAssign;