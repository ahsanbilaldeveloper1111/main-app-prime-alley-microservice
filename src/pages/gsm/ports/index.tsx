import '@assets/scss/datatable-style.scss';
import React, { ReactElement, useEffect, useState } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import GenericListPage from '@components/GenericListPage';
import { ListPorts } from '@utils/ports';
import { getGsmData } from '@utils/GsmManagement';

import { Column } from '@components/CustomDataTable';
import { Button, DropdownItem, DropdownMenu, Dropdown, Modal, Row,DropdownToggle   } from 'react-bootstrap';
import { Col } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useTokenService } from 'src/hooks/useTokenService';
import { useSession } from 'next-auth/react';
import Select from 'react-select';
import '@assets/scss/gsm-assign.scss';
import '@assets/scss/dashboard-card.scss';
import '@assets/scss/common.scss';
import {motion} from 'framer-motion';

import GsmPortFilter from '@components/filters/GsmPortFilter';

import AnimatedNumber from '@components/AnimatedNumber';
import imgStatus1 from '@assets/images/widget/img-status-1.svg'
import imgStatus2 from '@assets/images/widget/img-status-2.svg'
import imgStatus3 from '@assets/images/widget/img-status-3.svg'
import imgStatus4 from '@assets/images/widget/img-status-4.svg'
import { FiEdit, FiMoreVertical } from 'react-icons/fi';


const GsmPorts = () => {
    const { data:session, status } = useSession();
   
    
    const columns: Column[] = [
        { key: 'id', name: 'IP Address', selector: (row: any) => row.ip_address, sortable: true,
          cell: (props: any) => (
            <div style={{minWidth: '120px'}}>
              {props?.gsm?.ip_address}
            </div>
          )
          
         },
        { key: 'port_number', name: 'Port', selector: (row: any) => row.port_number, sortable: true },
        { key: 'mobile_number', name: 'Mobile Number', selector: (row: any) => row.mobile_number, sortable: true },
       
        { key: 'sim_status', name: 'Sim Status', selector: (row: any) => row.sim_status, sortable: true,
          cell: (props: any) => (
            <div>
              {props?.sim_status==='REGISTER_OK' && <span className="status-badge success">REGISTERED</span>}
              {props?.sim_status==='UNREGISTER_OK' && <span className="status-badge danger">UNREGISTERED</span>}
              {props?.sim_status==='NO_SIM' && <span className="status-badge warning">NO SIM</span>}
              {props?.sim_status==='POWER_OFF' && <span className="status-badge danger">POWER OFF</span>}
            </div>
          )
         },
        { key: 'operator', name: 'Operator', selector: (row: any) => row.operator, sortable: true },
        { key: 'signal_status', name: 'Signal Status', selector: (row: any) => row.signal_status, sortable: true,
          cell: (props: any) => (
            <div>
              {props?.status==='up' && <span className="status-badge success">
                <i className="fas fa-signal"></i>
                </span>}
              {props?.status==='down' && <span className="status-badge danger">
                <i className="fas fa-signal-slash"></i>
                </span>}
            </div>
          )
         },
        { key: 'imei', name: 'IMEI', selector: (row: any) => row.imei, sortable: true },
        { key: 'imsi', name: 'IMSI', selector: (row: any) => row.imsi, sortable: true },
        { key: 'iccid', name: 'ICCID', selector: (row: any) => row.iccid, sortable: true },
        { key: 'status', name: 'Port Status', selector: (row: any) => row.port_status, sortable: true,
          cell: (props: any) => (
            <div>
              {props?.status==='up' && <span className="status-badge success">Active</span>}
              {props?.status==='down' && <span className="status-badge danger">Not Active</span>}
            </div>
          )
         },
        { key: 'companyies', name: 'Company', selector: (row: any) => row.companies, sortable: true,
          cell: (props: any) => (
            <div>
              {props?.companies?.[0]?.name}
            </div>
          )
         },
        {
          key: 'Action',
          name: 'action',
          selector: (row: any) => row.id,
          sortable: false,
          cell: (props: any) => (
              
              <div className="d-flex gap-3">
                  {/* {session?.user?.permissions?.includes('update-mobile-number-gsm-ports') && 
                    props?.unassigned_ports?.length > 0 && (
                      <button className="btn btn-sm btn-outline-primary" onClick={() => handleUpdateMobileNumber(props.id)}>Update Mobile Number</button>
                  )}     */}

<Dropdown
                className="table-action-dropdown"
                //drop="start"
                placement="top-start"
            >
                <DropdownToggle variant="outline-secondary" size="sm">
                    <FiMoreVertical size={14} />
                </DropdownToggle>
                <DropdownMenu>
                    <DropdownItem className="action-edit" onClick={() => handleUpdateMobileNumber(props.id)}>
                        <FiEdit className="me-2" />
                        Update Mobile Number
                    </DropdownItem>
                   
                    
                </DropdownMenu>
            </Dropdown>
              </div>
          ),
      },
    

    ];

    const [refreshKey, setRefreshKey] = useState<number>(0);
    const [currentFilters, setCurrentFilters] = useState({});

    const fetchGsmPorts = async (page = 1, perPage = 15, search = "") => {
        return await ListPorts({ page, perPage, search, filters: currentFilters });
    };

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

    const handleUpdateMobileNumber = async (id: number) => {
        console.log(id);
        setShowUpdateMobileNumberModal(true);
    }


    const [showExportSuccessfulModal, setShowExportSuccessfulModal] = useState(false);

    const handleExportSuccessful = async () => {
        setShowExportSuccessfulModal(true);
    }

    const [showUpdateMobileNumberModal, setShowUpdateMobileNumberModal] = useState(false);
    const [showUpdateMobileNumberSubmitModal, setShowUpdateMobileNumberSubmitModal] = useState(false);

    const submitMobileNumberUpdate = async () => {
      setShowUpdateMobileNumberModal(false);
        setShowUpdateMobileNumberSubmitModal(true);
    }

   
  
    
    return (
        <React.Fragment>
            <BreadcrumbItem mainTitle="" mainLink="" subTitle="Call Logs" />
            <Row className="mb-3">
            <Col md={12}>
                <div className="page-header-title style-2">
                <Row className="align-items-center">
                    <Col md={3}>
                      <h2 className="mb-0 d-flex align-items-center">
                      Ports

                      </h2>
                    </Col>
                    <Col md={9} className="d-flex justify-content-end">

                      
                      <div className="action-buttons">
                        <div className="search-container">
                            <i className="fas fa-search search-icon"></i>
                            <input type="text" className="search-bar" placeholder="Search IP, ICCID, Mobile..."/>
                        </div>
                        <GsmPortFilter onFiltersChange={handleFiltersChange} showExport={false} />
                        
                        <button className="btn btn-export" id="export-btn" onClick={handleExportSuccessful}>
                            <i className="fas fa-download"></i> Export
                        </button>
                    </div>
                    </Col>
                  </Row>
               
                
                </div>
            </Col>
            </Row>

            {/* GSM Summary Cards */}
            <div className="dashboard-grid">
                <motion.div 
                    className="dashboard-card"
                    initial={{ opacity: 0, x: -100, scale: 0.8 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    transition={{ 
                        duration: 0.8, 
                        delay: 0.1,
                        type: "spring",
                        stiffness: 100,
                        damping: 15
                    }}
                    whileHover={{ 
                        scale: 1.05,
                        transition: { duration: 0.2 }
                    }}
                >
                    <h3>Total Ports</h3>
                    <div className="value" id="total-gsms-count">
                        <AnimatedNumber value={6} duration={1000} fontStyle='style-2' />
                    </div>
                    <p>Total ports in the system</p>
                    
                </motion.div>
                
                <motion.div 
                    className="dashboard-card"
                    initial={{ opacity: 0, x: -100, scale: 0.8 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    transition={{ 
                        duration: 0.8, 
                        delay: 0.3,
                        type: "spring",
                        stiffness: 100,
                        damping: 15
                    }}
                    whileHover={{ 
                        scale: 1.05,
                        transition: { duration: 0.2 }
                    }}
                >
                    <h3>Registered Ports</h3>
                    <div className="value" id="assigned-gsms-count">
                        <AnimatedNumber value={4} duration={1000}  fontStyle='style-2' />
                    </div>
                    <p>Registered ports in the system</p>
                    
                </motion.div>
                
                <motion.div 
                    className="dashboard-card"
                    initial={{ opacity: 0, x: -100, scale: 0.8 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    transition={{ 
                        duration: 0.8, 
                        delay: 0.5,
                        type: "spring",
                        stiffness: 100,
                        damping: 15
                    }}
                    whileHover={{ 
                        scale: 1.05,
                        transition: { duration: 0.2 }
                    }}
                >
                    <h3>Unregistered Ports</h3>
                    <div className="value" id="unassigned-gsms-count">
                        <AnimatedNumber value={2} duration={1000}  fontStyle='style-2' />
                    </div>
                    <p>Unregistered ports in the system</p>
                    
                </motion.div>
                
                <motion.div 
                    className="dashboard-card"
                    initial={{ opacity: 0, x: -100, scale: 0.8 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    transition={{ 
                        duration: 0.8, 
                        delay: 0.7,
                        type: "spring",
                        stiffness: 100,
                        damping: 15
                    }}
                    whileHover={{ 
                        scale: 1.05,
                        transition: { duration: 0.2 }
                    }}
                >
                  
                    <h3>Active Ports</h3>
                    <div className="value" id="total-ports-count">
                        <AnimatedNumber value={60} duration={1000} fontStyle='style-2' />
                    </div>
                    <p>Active ports in the system</p>
                    
                </motion.div>
            </div>


            {session?.user?.permissions?.includes('list-gsm-ports') && (
                 <GenericListPage
                 columns={columns}
                 fetchData={fetchGsmPorts}
                 title="GSM Ports List"
                 searchPlaceholder="Search ..."
                 defaultPageSize={15}
                 filters={currentFilters}
                 refreshKey={refreshKey}
                 search={false}
                 tableStyle="table-style-2"
                
             />
            )}

{showExportSuccessfulModal && (
              <div id="action-modal" className="modal customModal" style={{display: 'flex'}}>
              <div className="modal-content">
                  <span className="close-btn" id="action-close-btn" onClick={() => setShowExportSuccessfulModal(false)}><i className="fas fa-times"></i></span>
                  <h2 id="action-modal-title">Export Successful!</h2>
                  <p id="action-modal-text">The GSM ports data has been successfully exported as a JSON file.</p>
                  <div className="modal-footer">
                      <button className="btn btn-export" id="action-cancel-btn" style={{display: 'none'}} onClick={() => setShowExportSuccessfulModal(false)}>Cancel</button>
                      <button className="btn btn-primary" id="action-confirm-btn" onClick={() => setShowExportSuccessfulModal(false)}>Done</button>
                  </div>
              </div>
          </div>
            )}


            {showUpdateMobileNumberSubmitModal && (
              <div id="action-modal" className="modal customModal" style={{display: 'flex'}}>
              <div className="modal-content">
                  <span className="close-btn" id="action-close-btn" onClick={() => setShowUpdateMobileNumberSubmitModal(false)}><i className="fas fa-times"></i></span>
                  <h2 id="action-modal-title">Successful!</h2>
                  <p id="action-modal-text">The GSM ports mobile number has been successfully updated.</p>
                  <div className="modal-footer">
                      <button className="btn btn-export" id="action-cancel-btn" style={{display: 'none'}} onClick={() => setShowUpdateMobileNumberSubmitModal(false)}>Cancel</button>
                      <button className="btn btn-primary" id="action-confirm-btn" onClick={() => setShowUpdateMobileNumberSubmitModal(false)}>Done</button>
                  </div>
              </div>
          </div>
            )}

            


{showUpdateMobileNumberModal && (
              <div id="action-modal" className="modal customModal" style={{display: 'flex'}}>
              <div className="modal-content">
                  <span className="close-btn" id="action-close-btn" onClick={() => setShowUpdateMobileNumberModal(false)}><i className="fas fa-times"></i></span>
                  <h2 id="action-modal-title">Update Mobile Number!</h2>

                  <div className="form-group mb-3">
                    <label htmlFor="mobile_number">Mobile Number</label>
                    <input type="text" className="form-control" id="mobile_number" placeholder="Enter Mobile Number" />
                  </div>
                  
                  <div className="modal-footer">
                      <button className="btn btn-secondary " style={{display: 'none'}} id="action-cancel-btn"  onClick={() => setShowUpdateMobileNumberModal(false)}>Cancel</button>
                      <button className="btn btn-primary" id="action-confirm-btn" onClick={() => submitMobileNumberUpdate()}>Update Mobile Number</button>
                  </div>
              </div>
          </div>
            )}
        
        </React.Fragment>
    );
};

GsmPorts.getLayout = (page: ReactElement) => {
    return <Layout>{page}</Layout>;
};

export default GsmPorts;