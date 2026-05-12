import { GetClientGsmProfile, GetCompanyList } from "@utils/GsmAssign";
import type { Column } from "@components/CustomDataTable";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { CompanyPOData, CompanyPOFilterState } from "./companyPOTypes";

export function useCompanyPOPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentFilters, setCurrentFilters] = useState<CompanyPOFilterState>({});

  const columns: Column<CompanyPOData>[] = useMemo(
    () => [
      {
        key: "company_name",
        name: "Company Name",
        selector: (row: CompanyPOData) => row.company_name,
        sortable: true,
      },
      {
        key: "assigned_gsms",
        name: "Assigned GSMs",
        selector: (row: CompanyPOData) => row.assigned_gsms,
        sortable: true,
        cell: (props: CompanyPOData) => (
          <div>
            <span
              className={`status-badge  text-wrap ${props.assigned_gsms ? "success" : "info"}`}
              style={{ maxWidth: "200px" }}
            >
              {props.assigned_gsms ? props.assigned_gsms : "N/A"}
            </span>
          </div>
        ),
      },
      {
        key: "gsm_count",
        name: "GSM Count",
        selector: (row: CompanyPOData) => row.gsm_count,
        sortable: true,
        cell: (props: CompanyPOData) => <span className="status-badge primary">{props.gsm_count}</span>,
      },
      {
        key: "assigned_ports",
        name: "Assigned Ports",
        selector: (row: CompanyPOData) => row.assigned_ports,
        sortable: true,
        cell: (props: CompanyPOData) => (
          <div>
            <span
              className={`status-badge ${props.assigned_ports ? "primary" : "info"} text-wrap`}
              style={{ maxWidth: "200px" }}
            >
              {props.assigned_ports ? props.assigned_ports : "N/A"}
            </span>
          </div>
        ),
      },
      {
        key: "port_count",
        name: "Port Count",
        selector: (row: CompanyPOData) => row.port_count,
        sortable: true,
        cell: (props: CompanyPOData) => <span className="status-badge primary">{props.port_count}</span>,
      },
    ],
    [],
  );

  const fetchCompanyPOData = useCallback(
    async (page = 1, perPage = 15, search = "") => {
      try {
        const response = await GetClientGsmProfile({
          page,
          perPage,
          search,
          filters: currentFilters,
        });

        if (response?.data?.data) {
          const paginationData = response.data;
          return {
            data: paginationData.data || [],
            total: paginationData.total || 0,
            last_page: paginationData.last_page || 1,
            current_page: paginationData.current_page || page,
            per_page: paginationData.per_page || perPage,
          };
        }

        let data: CompanyPOData[] = response?.data || response || [];

        if (currentFilters.gsm_id) {
          data = data.filter((item: CompanyPOData) =>
            item.assigned_gsms.includes(currentFilters.gsm_id!.toString()),
          );
        }

        if (currentFilters.company) {
          data = data.filter(
            (item: CompanyPOData) =>
              (item.company_identifier && item.company_identifier === currentFilters.company) ||
              item.company_name.toLowerCase().includes(currentFilters.company!.toLowerCase()),
          );
        }

        const totalRows = data.length;
        const totalPages = Math.ceil(totalRows / perPage) || 1;
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
    [currentFilters],
  );

  const handleRefresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  const handleFiltersChange = useCallback((filters: CompanyPOFilterState) => {
    setCurrentFilters(filters);
  }, []);

  useEffect(() => {
    GetCompanyList();
  }, []);

  const memoizedFilters = useMemo(() => currentFilters, [currentFilters]);

  return {
    refreshKey,
    columns,
    fetchCompanyPOData,
    handleRefresh,
    handleFiltersChange,
    memoizedFilters,
  };
}
