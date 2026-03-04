import "@assets/scss/datatable-style.scss";
import React, {
  ReactElement,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";

import { useState } from "react";
import { Button, Form } from "react-bootstrap";

import "@assets/scss/billing.scss";
import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import PageHeader from "@components/PageHeader";

import "@assets/scss/datatable-style.scss";
import { GetProducts } from "@utils/accounting";
import { getMinifiedCompanies } from "@utils/crm";
import { useSession } from "next-auth/react";
import moment from "moment";
import { formatNumber, GlobalDateFormat } from "@utils/Helper";
import { Filter, Package, FileText, Calendar } from "lucide-react";

import GenericTable, { TableColumn } from "@components/GenericTable";
import GenericFilterSidebar, { FilterField } from "@components/GenericFilterSidebar";
import GenericSidebar from "@components/GenericSidebar";
import { ModuleSlug } from "@utils/Helper";

interface Product {
  id: number;
  name: string;
  category: string;
  price: string;
  type: string;
  totalAmount: string;
  status: string;
  created: string;
}

const ProductDetails = () => {
  const { data: session } = useSession();

  const [companies, setCompanies] = useState<any[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [errorCompanies, setErrorCompanies] = useState<string | null>(null);
  const [companyOptions, setCompanyOptions] = useState<{ id: string | number; name?: string }[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | number | "">("");


  useEffect(() => {
    const fetchCompanyOptions = async () => {
      try {
        const result = await getMinifiedCompanies({ send_all: "true" });
        setCompanyOptions(result ?? []);
      } catch (e) {
        console.error("Error fetching company options:", e);
      }
    };
    fetchCompanyOptions();
  }, []);
    

  const [showFiltersSidebar, setShowFiltersSidebar] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentFilters, setCurrentFilters] = useState<{
    search?: string;
    status?: string;
    billing_cycle?: string;
  }>({});

  const [dataList, setDataList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    rowsPerPage: 15,
    totalRows: 0,
  });

  const requestIdRef = useRef(0);

  const handleOpenFiltersSidebar = useCallback(() => {
    setShowFiltersSidebar(true);
  }, []);

  const handleCloseFiltersSidebar = useCallback(() => {
    setShowFiltersSidebar(false);
  }, []);

  const fetchProducts = useCallback(async () => {
    requestIdRef.current += 1;
    const currentRequestId = requestIdRef.current;
    setLoading(true);
    try {
      const response = await GetProducts({
        page: pagination.currentPage,
        per_page: pagination.rowsPerPage,
        search: currentFilters.search || "",
        status: currentFilters.status || undefined,
        billing_cycle: currentFilters.billing_cycle || undefined,
        ...(selectedCompanyId ? { crm_company_id: selectedCompanyId } : {}),
      }) as any;

      if (currentRequestId !== requestIdRef.current) return;

      const list = response?.dataList ?? response?.data ?? [];
      const total = response?.meta?.total ?? response?.recordsTotal ?? response?.recordsFiltered ?? 0;
      setDataList(list);
      setTotalRecords(total);
      setPagination((prev) => ({ ...prev, totalRows: total }));
    } catch (error) {
      if (currentRequestId !== requestIdRef.current) return;
      console.error("Error fetching products:", error);
      setDataList([]);
      setTotalRecords(0);
      setPagination((prev) => ({ ...prev, totalRows: 0 }));
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [pagination.currentPage, pagination.rowsPerPage, currentFilters, refreshKey, selectedCompanyId]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const tableColumns: TableColumn<any>[] = useMemo(
    () => [
      {
        key: "name",
        label: "Subscription Name",
        sortable: true,
        type: "text",
        accessor: (row) => row?.product?.name ?? "",
        render: (row) => (
          <div>
            <span className="fw-semibold">{row?.product?.name ?? "-"}</span>
          </div>
        ),
      },
      {
        key: "status",
        label: "Status",
        sortable: true,
        type: "badge",
        accessor: (row) =>
          row?.product?.is_active ? "Active" : "Suspended",
        badge: {
          getVariant: (row) =>
            row?.product?.is_active ? "success" : "danger",
        },
      },
      {
        key: "billing_cycle",
        label: "Billing Cycle",
        sortable: true,
        type: "text",
        accessor: (row) => row?.billing_cycle ?? "",
        render: (row) => (
          <span className="text-capitalize">
            {row?.billing_cycle || "-"}
          </span>
        ),
      },
      {
        key: "renewal_start_date",
        label: "Current Period Start",
        sortable: true,
        type: "text",
        accessor: (row) =>
          row?.renewal_start_date
            ? moment(row.renewal_start_date).format(GlobalDateFormat)
            : "",
        emptyValue: "-",
      },
      {
        key: "renewal_end_date",
        label: "Current Period End",
        sortable: true,
        type: "text",
        accessor: (row) =>
          row?.renewal_end_date
            ? moment(row.renewal_end_date).format(GlobalDateFormat)
            : "",
        emptyValue: "-",
      },
      {
        key: "subscriptions",
        label: "Quantity",
        sortable: true,
        type: "text",
        accessor: (row) => row?.subscriptions ?? "0",
        emptyValue: "0",
      },
      {
        key: "selling_price",
        label: "Price",
        sortable: true,
        type: "custom",
        render: (row) => (
          <span>
            {row?.company?.profile?.currency ||
              row?.product?.currency ||
              "USD"}{" "}
            {formatNumber(row?.selling_price)}
          </span>
        ),
      },
    ],
    []
  );

  const [selectedProductView, setSelectedProductView] = useState<any | null>(
    null
  );
  const [showProductSidebar, setShowProductSidebar] = useState(false);

  const getInitials = (name: string) => {
    if (!name || typeof name !== "string") return "NA";
    return name
      .trim()
      .split(/\s+/)
      .map((s) => s[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRandomColor = (seed: string) => {
    const colors = [
      "#6366f1", "#8b5cf6", "#ec4899", "#ef4444", "#f59e0b",
      "#10b981", "#06b6d4", "#3b82f6",
    ];
    let n = 0;
    for (let i = 0; i < (seed || "").length; i++) n += seed.charCodeAt(i);
    return colors[n % colors.length];
  };

  const handleViewProduct = useCallback((row: any) => {
    setSelectedProductView(row);
    setShowProductSidebar(true);
  }, []);

  const handleCloseProductSidebar = useCallback(() => {
    setShowProductSidebar(false);
    setSelectedProductView(null);
  }, []);

  

  const filterFields: FilterField[] = useMemo(
    () => [
      {
        id: "search",
        label: "Search",
        type: "text",
        value: currentFilters.search ?? "",
        onChange: (value) =>
          setCurrentFilters((prev) => ({ ...prev, search: value })),
        placeholder: "Search products...",
      },
      {
        id: "status",
        label: "Status",
        type: "dropdown",
        value: currentFilters.status ?? "",
        onChange: (value) =>
          setCurrentFilters((prev) => ({ ...prev, status: value || undefined })),
        options: [
          { value: "", label: "All Status" },
          { value: "Active", label: "Active" },
          { value: "Trial", label: "Trial" },
          { value: "Inactive", label: "Inactive" },
        ],
      },
      {
        id: "billing_cycle",
        label: "Billing Cycle",
        type: "dropdown",
        value: currentFilters.billing_cycle ?? "",
        onChange: (value) =>
          setCurrentFilters((prev) => ({
            ...prev,
            billing_cycle: value || undefined,
          })),
        options: [
          { value: "", label: "All Types" },
          { value: "monthly", label: "Monthly" },
          { value: "quarterly", label: "Quarterly" },
          { value: "yearly", label: "Yearly" },
          { value: "one time", label: "One-time" },
        ],
      },
    ],
    [currentFilters.search, currentFilters.status, currentFilters.billing_cycle]
  );

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Customer Dashboard" />

      {/* <PageHeader
        title="Subscriptions"
        description="Manage your recurring services & renewals."
        showSearch={false}
        buttons={
          <>
            <Button
              variant="outline-secondary"
              onClick={handleOpenFiltersSidebar}
            >
              <Filter size={16} className="me-2" />
              Filters
            </Button>
          </>
        }
      /> */}

<div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4">
        <div className="mb-3 mb-md-0">
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <a href="/dashboard" className="text-decoration-none">
                  Accounting
                </a>
              </li>
              <li className="breadcrumb-item active fw-bold" aria-current="page">
                Subscriptions
              </li>
            </ol>
          </nav>
        </div>

        <div className="d-flex flex-wrap gap-2 align-items-center">
          <Form.Select
            size="sm"
            style={{ width: "220px" }}
            value={String(selectedCompanyId)}
            onChange={(e) =>
              setSelectedCompanyId(e.target.value === "" ? "" : e.target.value)
            }
          >
            <option value="">All companies</option>
            {companyOptions.map((c: { id: string | number; name?: string }) => (
              <option key={c.id} value={c.id}>
                {c.name ?? c.id}
              </option>
            ))}
          </Form.Select>
          <Button
            variant="outline-secondary"
            onClick={handleOpenFiltersSidebar}
          >
            <Filter size={16} className="me-2" />
            Filters
          </Button>
        </div>
      </div>
      <GenericTable
        data={dataList}
        columns={tableColumns}
        pagination={{
          currentPage: pagination.currentPage,
          rowsPerPage: pagination.rowsPerPage,
          totalRows: totalRecords,
          pageSizeOptions: [10, 15, 25, 50],
        }}
        onPaginationChange={(page, rowsPerPage) => {
          setPagination((prev) => ({
            ...prev,
            currentPage: page,
            rowsPerPage,
          }));
        }}
        sortable={true}
        loading={loading}
        emptyMessage="No subscriptions found"
        loadingMessage="Loading subscriptions..."
        hover={true}
        uniqueKey="id"
        onRowClick={(row) => handleViewProduct(row)}
        customizableColumns={true}
        columnStorageKey="customer-product-details-columns"
      />

      <GenericFilterSidebar
        isOpen={showFiltersSidebar}
        onClose={handleCloseFiltersSidebar}
        title="Filters"
        subtitle="Filter subscriptions by status and billing cycle"
        width="400px"
        filters={filterFields}
        onApply={() => {
          setPagination((prev) => ({ ...prev, currentPage: 1 }));
          setRefreshKey((k) => k + 1);
          setShowFiltersSidebar(false);
        }}
        onReset={() => {
          setCurrentFilters({});
          setPagination((prev) => ({ ...prev, currentPage: 1 }));
          setRefreshKey((k) => k + 1);
        }}
      />

      <GenericSidebar
        isOpen={showProductSidebar}
        onClose={handleCloseProductSidebar}
        moduleSlug={ModuleSlug.BILLING}
        title={selectedProductView?.product?.name ?? "Subscription Details"}
        subtitle={
          selectedProductView?.product?.is_active ? "Active" : "Suspended"
        }
        metadata={
          selectedProductView?.product?.id
            ? `Product ID: #${selectedProductView.product.id}`
            : undefined
        }
        avatar={{
          initials: getInitials(
            selectedProductView?.product?.name ?? "NA"
          ),
          name: selectedProductView?.product?.name ?? "NA",
          gradient: getRandomColor(
            selectedProductView?.product?.name ?? ""
          ),
        }}
        width="400px"
        sections={[
          {
            id: "subscription-info",
            title: "Subscription Information",
            icon: Package,
            fields: [
              {
                label: "Subscription Name",
                value: selectedProductView?.product?.name ?? "N/A",
              },
              {
                label: "Status",
                value: selectedProductView?.product?.is_active
                  ? "Active"
                  : "Suspended",
                type: "badge",
                badgeVariant: selectedProductView?.product?.is_active
                  ? "success"
                  : "danger",
              },
              {
                label: "Billing Cycle",
                value: selectedProductView?.billing_cycle
                  ? String(selectedProductView.billing_cycle)
                  : "N/A",
              },
              {
                label: "Current Period Start",
                value: selectedProductView?.renewal_start_date ?? null,
                type: "date",
                icon: Calendar,
              },
              {
                label: "Current Period End",
                value: selectedProductView?.renewal_end_date ?? null,
                type: "date",
                icon: Calendar,
              },
              {
                label: "Quantity",
                value: selectedProductView?.subscriptions ?? "0",
              },
              {
                label: "Price",
                value:
                  (selectedProductView?.company?.profile?.currency ||
                    selectedProductView?.product?.currency ||
                    "USD") +
                  " " +
                  formatNumber(selectedProductView?.selling_price ?? 0),
              },
            ],
          },
          {
            id: "product-details",
            title: "Product Details",
            icon: FileText,
            fields: [
              {
                label: "Category",
                value:
                  selectedProductView?.product?.category?.name ?? "N/A",
              },
              {
                label: "Base Price",
                value:
                  (selectedProductView?.company?.profile?.currency ||
                    selectedProductView?.product?.currency ||
                    "USD") +
                  " " +
                  formatNumber(
                    selectedProductView?.product?.base_price ?? 0
                  ),
              },
            ],
          },
        ]}
      />
    </React.Fragment>
  );
};

ProductDetails.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default ProductDetails;
