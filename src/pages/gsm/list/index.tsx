import '@assets/scss/datatable-style.scss';
import React, { ReactElement, useEffect, useState, useCallback } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import GenericListPage from '@components/GenericListPage';
import { ListGsmManagement, addGsm, updateGsm, deleteGsm } from '@utils/GsmManagement';

import { Column } from '@components/CustomDataTable';
import { Button, Modal, Row } from 'react-bootstrap';
import { Col } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useTokenService } from 'src/hooks/useTokenService';
import { useSession } from 'next-auth/react';
import GsmListFilter from '@components/filters/GsmListFilter';

import AnimatedNumber from '@components/AnimatedNumber';
import imgStatus1 from '@assets/images/widget/img-status-1.svg'
import imgStatus2 from '@assets/images/widget/img-status-2.svg'
import imgStatus3 from '@assets/images/widget/img-status-3.svg'
import imgStatus4 from '@assets/images/widget/img-status-4.svg'


const GsmList = () => {
    const { data:session, status } = useSession();
   
    const columns: Column[] = [
        { key: 'ip_address', name: 'IP Address', selector: (row: any) => row.ip_address, sortable: true },
        { key: 'name', name: 'Name', selector: (row: any) => row.name, sortable: true },
        { key: 'username', name: 'Username', selector: (row: any) => row.username, sortable: true },
        { key: 'device_status', name: 'Device Status', selector: (row: any) => row.device_status, sortable: true,
          cell: (row: any) => (
           
            <span className={`badge ${row.device_status == "power_off" ? 'bg-danger' : 'bg-success'}`}>{row?.device_status?.toUpperCase()}</span>
          )
        },
        { key: 'companies', name: 'Companies', selector: (row: any) => row.company_name, sortable: true },
        // { key: 'status', name: 'Status', selector: (row: any) => row.status, sortable: true,
        //   cell: (row: any) => (
        //     <span className={`badge ${row.status == "active" ? 'bg-success' : 'bg-danger'}`}>{row.status.charAt(0).toUpperCase() + row.status.slice(1)}</span>
        //   )
        //  },
        {
          key: 'Action',
          name: 'ACTION',
          selector: (row: any) => row.id,
          sortable: false,
          cell: (props: any) => (
              
              <div className="action-buttons-container">
  
                  {session?.user?.permissions?.includes('edit-gsm-management')  && (
                      <button className="btn btn-sm btn-outline-primary" onClick={() => handleEditGsm(props)}>Edit</button>
                  )}  

                  {session?.user?.permissions?.includes('delete-gsm-management')  && (
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteGsm(props)}>Delete</button>
                  )}

                  
              </div>
          ),
      },
    ];

    const [refreshKey, setRefreshKey] = useState<number>(0);
    const [currentFilters, setCurrentFilters] = useState({});

    const fetchGsm = useCallback(async (page = 1, perPage = 15, search = "") => {
        return await ListGsmManagement({ page, perPage, search, filters: currentFilters });
    }, [currentFilters]);

    const handleFiltersChange = (filters: any) => {
        setCurrentFilters(filters);
    };

    const handleExport = async (exportType: string, filters: Record<string, any>) => {
        // try {
        //     const response = await ExportCallLogs({ page: 1, perPage: 15, search: "", filters, isExport: true, exportType });
        //     console.log(response);
        // } catch (error) {
        //     console.error('Export error:', error);
        //     toast.error('Export failed. Please try again.');
        // }
    };

    const [showCreateGsmModal, setShowCreateGsmModal] = useState(false);
    const [newGsmName, setNewGsmName] = useState('');
    const [newGsmIpAddress, setNewGsmIpAddress] = useState('');
    const [newGsmUsername, setNewGsmUsername] = useState('');
    const [newGsmPassword, setNewGsmPassword] = useState('');
    const handleSubmitCreateGsm = async () => {
      if(newGsmName == '' || newGsmIpAddress == '' || newGsmUsername == '' || newGsmPassword == ''){
        toast.error('Please fill all the fields');
        return;
      }
      const response = await addGsm(newGsmName, newGsmIpAddress, newGsmUsername, newGsmPassword);
      if(response){
          setShowCreateGsmModal(false);
          setNewGsmName('');
          setNewGsmIpAddress('');
          setNewGsmUsername('');
          setNewGsmPassword('');
          setRefreshKey(refreshKey + 1);
      }
    };

    const [showEditGsmModal, setShowEditGsmModal] = useState(false);
    const [editGsmId, setEditGsmId] = useState('');
    const [editGsmName, setEditGsmName] = useState('');
    const [editGsmIpAddress, setEditGsmIpAddress] = useState('');
    const [editGsmUsername, setEditGsmUsername] = useState('');
    const [editGsmPassword, setEditGsmPassword] = useState('');
    const [editGsmStatus, setEditGsmStatus] = useState('');

    const handleEditGsm = (props: any) => {
      setShowEditGsmModal(true);
      setEditGsmId(props.id);
      setEditGsmName(props.name);
      setEditGsmIpAddress(props.ip_address);
      setEditGsmUsername(props.username);
      setEditGsmPassword(props.password);
      setEditGsmStatus(props.status);
      setShowEditGsmModal(true);
  };

    const handleSubmitEditGsm = async () => {
      if(editGsmName == '' || editGsmIpAddress == '' || editGsmUsername == '' || editGsmPassword == ''){
        toast.error('Please fill all the fields');
        return;
      }
      const response = await updateGsm(editGsmId, editGsmName, editGsmIpAddress, editGsmUsername, editGsmPassword, editGsmStatus);
      if(response){
        setShowEditGsmModal(false);
        setEditGsmName('');
        setEditGsmIpAddress('');
        setEditGsmUsername('');
        setEditGsmPassword('');
        setEditGsmStatus('');
        setRefreshKey(refreshKey + 1);
      }
    };
    
    const [showDeleteGsmModal, setShowDeleteGsmModal] = useState<boolean>(false);
    const [confirmDelete, setConfirmDelete] = useState<string>("");
    const [selectedGsm, setSelectedGsm] = useState<string>("");
    const [selectedGsmName, setSelectedGsmName] = useState<string>("");

    const handleDeleteGsm = (props: any) => {
        setSelectedGsm(props.id);
        setSelectedGsmName(props.name);
        setShowDeleteGsmModal(true);
    };

    const handleSubmitDeleteGsm = async () => {
      const confirmDeleteValue = confirmDelete.trim().toLowerCase();
        if(confirmDeleteValue == "delete"){
        const response = await deleteGsm(selectedGsm);
        if(response){
            setShowDeleteGsmModal(false);
            setSelectedGsm('');
            setSelectedGsmName('');
            setRefreshKey(refreshKey + 1);
        }else{
          toast.error('Failed to delete GSM');
        }
      }else{
        toast.error('Please type the word delete to confirm');
      }
    };

   
    
    return (
        <React.Fragment>
            <BreadcrumbItem mainTitle="" mainLink="" subTitle="Call Logs" />
            <Row className="mb-3">
            <Col md={12}>
                <div className="page-header-title">
                <Row className="align-items-center">
                    <Col md={5}>
                      <h2 className="mb-0 d-flex align-items-center">
                      Gsm Management
                      
                      {session?.user?.permissions?.includes('add-gsm-management') && (
                          <Button variant="outline-primary" size="sm" className="ms-3" onClick={() => setShowCreateGsmModal(true)}>New Gsm</Button>
                      )}

                      </h2>
                    </Col>
                    <Col md={7} className="d-flex justify-content-end">
                      <GsmListFilter onFiltersChange={handleFiltersChange} onExport={handleExport} />
                    </Col>
                  </Row>
               
                
                </div>
            </Col>
            </Row>


            {session?.user?.permissions?.includes('list-gsm-management') && (
                 <GenericListPage
                 columns={columns}
                 fetchData={fetchGsm}
                 title="GSM List"
                 searchPlaceholder="Search gsm list..."
                 defaultPageSize={15}
                 filters={currentFilters}
                 refreshKey={refreshKey}
             />
            )}

            {showCreateGsmModal && (
                 <Modal
                 show={showCreateGsmModal}
                 onHide={() => setShowCreateGsmModal(false)}
             >
                 <Modal.Header closeButton>
                     <Modal.Title>New Gsm</Modal.Title>
                 </Modal.Header>
                 <Modal.Body>
                    
                     <div className="form-group mb-3">
                         <label htmlFor="newGsmName">Gsm Name</label>
                         <input type="text" className="form-control" id="newGsmName"  value={newGsmName} onChange={(e) => setNewGsmName(e.target.value)} placeholder="Gsm Name" required/>
                     </div>

                     <div className="form-group mb-3"> 
                        <label htmlFor="newGsmIpAddress">Ip Address</label>
                        <input type="text" className="form-control" id="newGsmIpAddress"  value={newGsmIpAddress} onChange={(e) => setNewGsmIpAddress(e.target.value)} placeholder="Gsm Ip Address" required/>
                     </div>

                     <div className="form-group mb-3"> 
                        <label htmlFor="newGsmUsername">Username</label>
                        <input type="text" className="form-control" id="newGsmUsername"  value={newGsmUsername} onChange={(e) => setNewGsmUsername(e.target.value)} placeholder="Gsm Username" required/>
                     </div>

                     <div className="form-group mb-3"> 
                        <label htmlFor="newGsmPassword">Password</label>
                        <input type="password" className="form-control" id="newGsmPassword"  value={newGsmPassword} onChange={(e) => setNewGsmPassword(e.target.value)} placeholder="Gsm Password" required/>
                     </div>
                     

                 </Modal.Body>
                 <Modal.Footer>
                     <Button variant="secondary" onClick={() => setShowCreateGsmModal(false)}>Close</Button>
                     <Button variant="primary" onClick={() => handleSubmitCreateGsm()}>Create</Button>
                 </Modal.Footer>
             </Modal>
            )}


            {showEditGsmModal && (
                <Modal
                show={showEditGsmModal}
                onHide={() => setShowEditGsmModal(false)}
            >
                <Modal.Header closeButton>
                    <Modal.Title>Edit Gsm</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  <div className="form-group mb-3">
                    <label htmlFor="editGsmName">Gsm Name</label>
                    <input type="text" className="form-control" id="editGsmName"  value={editGsmName} onChange={(e) => setEditGsmName(e.target.value)} placeholder="Gsm Name" required/>
                  </div>

                  <div className="form-group mb-3">
                    <label htmlFor="editGsmIpAddress">Ip Address</label>
                    <input type="text" className="form-control" id="editGsmIpAddress"  value={editGsmIpAddress} onChange={(e) => setEditGsmIpAddress(e.target.value)} placeholder="Gsm Ip Address" required/>
                  </div>

                  <div className="form-group mb-3">
                    <label htmlFor="editGsmUsername">Username</label>
                    <input type="text" className="form-control" id="editGsmUsername"  value={editGsmUsername} onChange={(e) => setEditGsmUsername(e.target.value)} placeholder="Gsm Username" required/>
                  </div>

                  <div className="form-group mb-3">
                    <label htmlFor="editGsmPassword">Password</label>
                    <input type="password" className="form-control" id="editGsmPassword"  value={editGsmPassword} onChange={(e) => setEditGsmPassword(e.target.value)} placeholder="Gsm Password" required/>
                  </div>
                  

                </Modal.Body>
                <Modal.Footer>
                  <Button variant="secondary" onClick={() => setShowEditGsmModal(false)}>Close</Button>
                  <Button variant="primary" onClick={() => handleSubmitEditGsm()}>Edit</Button>
                </Modal.Footer>
            </Modal>
            )}

            {showDeleteGsmModal && (
                <Modal
                    show={showDeleteGsmModal}
                    onHide={() => setShowDeleteGsmModal(false)}
                >
                    <Modal.Header closeButton>
                        <Modal.Title>Delete Gsm?</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <p>
                            Are you sure you want to delete this <b className="text-danger">{selectedGsmName}</b> gsm?
                        </p>
                        <p>
                            Type the word <b className="text-danger">delete</b> to confirm
                        </p>
                        <input type="text" className="form-control" id="confirmDelete" value={confirmDelete} onChange={(e) => setConfirmDelete(e.target.value)} placeholder="Type the word delete to confirm" />

                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowDeleteGsmModal(false)}>Close</Button>
                        <Button variant="danger" onClick={() => handleSubmitDeleteGsm()}>Delete</Button>
                    </Modal.Footer>
                    
                </Modal>
            )}
            

        
        </React.Fragment>
    );
};

GsmList.getLayout = (page: ReactElement) => {
    return <Layout>{page}</Layout>;
};

export default GsmList;
