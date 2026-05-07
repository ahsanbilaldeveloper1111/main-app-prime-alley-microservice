import "@assets/scss/datatable-style.scss";
import React, {
  ReactElement,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericListPage from "@components/GenericListPage";
import { GetClientGsmProfile, GetCompanyList } from "@utils/GsmAssign";
import { Column } from "@components/CustomDataTable";
import { Button, Row, Col } from "react-bootstrap";
import { useSession } from "next-auth/react";
import moment from "moment";
import CompanyPOFilters from "@components/filters/CompanyPOFilters";

import '@assets/scss/common.scss';
import { FiRefreshCw } from "react-icons/fi";

interface CompanyPOData {
  company_name: string;
  assigned_gsms: string;
  gsm_count: number;
  assigned_ports: string;
  port_count: number;
  company_identifier?: string; // Add company identifier if available
}

interface CompanyPOFilters {
  gsm_id?: string;
  company?: string; // This will now be the company identifier
}

const CompanyPO = () => {
  const { data: session, status } = useSession();
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [currentFilters, setCurrentFilters] = useState<CompanyPOFilters>({});

  const columns: Column[] = useMemo(
    () => [
      {
        key: "company_name",
        name: "Company Name",
        selector: (row: CompanyPOData) => row.company_name,
        sortable: true
      },
      {
        key: "assigned_gsms",
        name: "Assigned GSMs",
        selector: (row: CompanyPOData) => row.assigned_gsms,
        sortable: true,
        cell: (props: CompanyPOData) => (
          <div>
            <span className={`status-badge  text-wrap ${props.assigned_gsms ? 'success' : 'info'}`} style={{ maxWidth: "200px" }}>
              {props.assigned_gsms ? props.assigned_gsms : 'N/A'}
            </span>
          </div>
        ),
      },
      {
        key: "gsm_count",
        name: "GSM Count",
        selector: (row: CompanyPOData) => row.gsm_count,
        sortable: true,
        cell: (props: CompanyPOData) => (
          <span className="status-badge primary">
            {props.gsm_count}
          </span>
        ),
      },
      {
        key: "assigned_ports",
        name: "Assigned Ports",
        selector: (row: CompanyPOData) => row.assigned_ports,
        sortable: true,
        cell: (props: CompanyPOData) => (
          <div>
            <span className={`status-badge ${props.assigned_ports ? 'primary' : 'info'} text-wrap`} style={{ maxWidth: "200px" }}>
              {props.assigned_ports ? props.assigned_ports : 'N/A'}
            </span>
          </div>
        ),
      },
      {
        key: "port_count",
        name: "Port Count",
        selector: (row: CompanyPOData) => row.port_count,
        sortable: true,
        cell: (props: CompanyPOData) => (
          <span className="status-badge primary">
            {props.port_count}
          </span>
        ),
      },
    ],
    []
  );

  const fetchCompanyPOData = useCallback(
    async (page = 1, perPage = 15, search = "") => {
      try {
        // Send pagination parameters to the API
        const response = await GetClientGsmProfile({
          page,
          perPage,
          search,
          filters: currentFilters
        });
        
       // console.log("ZEZEZE", response);          
        // Check if the API returns the expected nested structure
        if (response && response.data && response.data.data) {
          // API handles pagination server-side with nested structure
          const paginationData = response.data;
         // console.log("ZEZEZE 2", paginationData);          
          return {
            data: paginationData.data || [],
            total: paginationData.total || 0,
            last_page: paginationData.last_page || 1,
            current_page: paginationData.current_page || page,
            per_page: paginationData.per_page || perPage,
          };
        } else {
          // Fallback: API returns raw data array, handle pagination client-side
          let data = response?.data || response || [];
          
          // Apply additional filters (as fallback if API doesn't handle them)
          if (currentFilters.gsm_id) {
            data = data.filter((item: CompanyPOData) =>
              item.assigned_gsms.includes(currentFilters.gsm_id!.toString())
            );
          }
          
          if (currentFilters.company) {
            data = data.filter((item: CompanyPOData) =>
              // Try to match by company identifier first, fallback to company name
              (item.company_identifier && item.company_identifier === currentFilters.company) ||
              item.company_name.toLowerCase().includes(currentFilters.company!.toLowerCase())
            );
          }
          
          // Calculate pagination
          const totalRows = data.length;
          const totalPages = Math.ceil(totalRows / perPage);
          const startIndex = (page - 1) * perPage;
          const endIndex = startIndex + perPage;
          const paginatedData = data.slice(startIndex, endIndex);
          
          return {
            data: paginatedData,
            total: totalRows,
            last_page: totalPages,
            current_page: page,
            per_page: perPage,
          };
        }
      } catch (error) {
        console.error("Error fetching company PO data:", error);
        return {
          data: [],
          total: 0,
          last_page: 0,
          current_page: 1,
          per_page: perPage,
        };
      }
    },
    [currentFilters]
  );

  const handleRefresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  const handleFiltersChange = useCallback((filters: CompanyPOFilters) => {
    setCurrentFilters(filters);
  }, []);

  useEffect(() => {
    GetCompanyList();
  }, []);

  const memoizedFilters = useMemo(() => currentFilters, [currentFilters]);

  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle="Company"
        mainLink="/company"
        subTitle="Company PO"
      />


<Row className="mb-3">
            <Col md={12}>
                <div className="page-header-title style-2">
                <Row className="d-flex justify-content-between align-items-center">
                    <Col md={5}>
						{/* <h2 className="mb-0">GSM Profiling</h2> */}
					</Col>
                    <Col md={7} className="d-flex justify-content-end">
                      
                    <div className="action-buttons">
                        {/* <div className="search-container">
                            <i className="fas fa-search search-icon"></i>
                            <input type="text" className="search-bar" placeholder="Search GSM, Company..."/>
                        </div> */}

                        <CompanyPOFilters onFiltersChange={handleFiltersChange}  />
                       
                        <button className="btn btn-primary" onClick={handleRefresh}>
                            <FiRefreshCw className="me-2" /> Refresh
                        </button>
                    </div>



                    </Col>
                  </Row>
               
                
                </div>
            </Col>
            </Row>

            
      

        <GenericListPage
          columns={columns}
          fetchData={fetchCompanyPOData}
          title="Company PO"
          searchPlaceholder="Search companies, GSMs, or ports..."
          defaultPageSize={15}
          refreshKey={refreshKey}
          search={false}
          filters={memoizedFilters}
          tableStyle="table-style-2"
        
        />
    </React.Fragment>
  );
};

CompanyPO.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CompanyPO;
