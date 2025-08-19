import '@assets/scss/datatable-style.scss';
import React, { ReactElement, useEffect, useState } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import GenericListPage from '@components/GenericListPage';
import { ListPorts } from '@utils/ports';
import { getGsmData } from '@utils/GsmManagement';

import { Column } from '@components/CustomDataTable';
import { Button, Modal, Row } from 'react-bootstrap';
import { Col } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useTokenService } from 'src/hooks/useTokenService';
import { useSession } from 'next-auth/react';
import Select from 'react-select';

import GsmPortFilter from '@components/filters/GsmPortFilter';

import AnimatedNumber from '@components/AnimatedNumber';
import imgStatus1 from '@assets/images/widget/img-status-1.svg'
import imgStatus2 from '@assets/images/widget/img-status-2.svg'
import imgStatus3 from '@assets/images/widget/img-status-3.svg'
import imgStatus4 from '@assets/images/widget/img-status-4.svg'


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
       
        { key: 'sim_status', name: 'Sim Status', selector: (row: any) => row.sim_status, sortable: true },
        { key: 'operator', name: 'Operator', selector: (row: any) => row.operator, sortable: true },
        { key: 'signal_status', name: 'Signal Status', selector: (row: any) => row.signal_status, sortable: true },
        { key: 'imei', name: 'IMEI', selector: (row: any) => row.imei, sortable: true },
        { key: 'imsi', name: 'IMSI', selector: (row: any) => row.imsi, sortable: true },
        { key: 'iccid', name: 'ICCID', selector: (row: any) => row.iccid, sortable: true },
        { key: 'port_status', name: 'Port Status', selector: (row: any) => row.port_status, sortable: true },
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
                  {session?.user?.permissions?.includes('update-mobile-number-gsm-ports') && 
                    props?.unassigned_ports?.length > 0 && (
                      <button className="btn btn-sm btn-outline-primary" onClick={() => handleUpdateMobileNumber(props.id)}>Update Mobile Number</button>
                  )}    
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
    }

   
  
    
    return (
        <React.Fragment>
            <BreadcrumbItem mainTitle="" mainLink="" subTitle="Call Logs" />
            <Row className="mb-3">
            <Col md={12}>
                <div className="page-header-title">
                <Row className="align-items-center">
                    <Col md={5}>
                      <h2 className="mb-0 d-flex align-items-center">
                      Ports

                      </h2>
                    </Col>
                    <Col md={7} className="d-flex justify-content-end">
                      <GsmPortFilter onFiltersChange={handleFiltersChange} onExport={handleExport} />
                    </Col>
                  </Row>
               
                
                </div>
            </Col>
            </Row>


            {session?.user?.permissions?.includes('list-gsm-ports') && (
                 <GenericListPage
                 columns={columns}
                 fetchData={fetchGsmPorts}
                 title="GSM Ports List"
                 searchPlaceholder="Search ..."
                 defaultPageSize={15}
                 filters={currentFilters}
                 refreshKey={refreshKey}
             />
            )}
        
        </React.Fragment>
    );
};

GsmPorts.getLayout = (page: ReactElement) => {
    return <Layout>{page}</Layout>;
};

export default GsmPorts;