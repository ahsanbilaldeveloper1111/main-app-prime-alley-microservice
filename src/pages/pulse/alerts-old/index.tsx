import "@assets/scss/datatable-style.scss";
import '@assets/scss/common.scss';
import React, { ReactElement, useState, useCallback } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericListPage from "@components/GenericListPage";
import { Column } from "@components/CustomDataTable";
import { Row, Col } from "react-bootstrap";
import { toast } from "react-toastify";
import { useSession } from "next-auth/react";

import AlertsFilters from "@components/filters/AlertsFilters";
import {
  getAlerts,
  getMonitoringDashboard,
  resolveAlert,
  Alert
} from "@utils/netops";
import {
  convertUTCToUserTimezone
} from "@utils/Helper";


import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import PageSummaryGrid, { SummaryCard } from '@components/PageSummaryGrid';
import DatatableActionButton from "@components/DatatableActionButton";
import { FiCheck } from "react-icons/fi";



interface Summary {
  total_alerts: number;
  critical_alerts: number;
  high_alerts: number;
  medium_alerts: number;
  low_alerts: number;
}

const Alerts = () => {
  const { data: session, status } = useSession();

  const columns: Column[] = [
    {
      key: "alert_type",
      name: "Alert Type",
      selector: (row: any) => row.alert_type,
      sortable: true,
      cell: (props: any) => {
        const getAlertTypeColor = (type: string) => {
          switch (type) {
            case "SERVICE_DOWN":
              return "danger";
            case "SERVICE_RECOVERY":
              return "success";
            case "DEVICE_DOWN":
              return "danger";
            case "DEVICE_RECOVERY":
              return "success";
            case "PING_TIMEOUT":
              return "warning";
            case "HOST_UNREACHABLE":
              return "warning";
            default:
              return "info";
          }
        };
        return (
          <span className={`status-badge ${getAlertTypeColor(props.alert_type)}`}>
            {props.alert_type.replace("_", " ")}
          </span>
        );
      },
    },
    {
      key: "severity",
      name: "Severity",
      selector: (row: any) => row.severity,
      sortable: true,
      cell: (props: any) => {
        const getSeverityColor = (severity: string) => {
          switch (severity) {
            case "CRITICAL":
              return "danger";
            case "HIGH":
              return "warning";
            case "MEDIUM":
              return "info";
            case "LOW":
              return "info";
            default:
              return "info";
          }
        };
        return (
          <span className={`status-badge ${getSeverityColor(props.severity)}`}>
            {props.severity}
          </span>
        );
      },
    },
    {
      key: "message",
      name: "Message",
      selector: (row: any) => row.message,
      sortable: true,
      cell: (props: any) => {
        return (
          <div
            className="text-truncate"
            style={{ maxWidth: "400px" }}
            title={props.message}
          >
            {props.message}
          </div>
        );
      },
    },
    {
      key: "is_resolved",
      name: "Status",
      selector: (row: any) => row.is_resolved,
      sortable: true,
      cell: (props: any) => {
        return (
          <span
            className={`status-badge ${props.is_resolved ? "warning" : "success"}`}
          >
            {props.is_resolved ? "Resolved" : "Active"}
          </span>
        );
      },
    },
    {
      key: "created_at",
      name: "Created At",
      selector: (row: any) => row.created_at,
      sortable: true,
      cell: (props: any) => {
        const formattedDate = convertUTCToUserTimezone(props.created_at, {
          outputFormat: "DD-MM-YYYY hh:mm:ss A",
        });
        const formattedTime = convertUTCToUserTimezone(props.created_at, {
          outputFormat: "hh:mm:ss A",
        });
        return (
          <div>
            <div>{formattedDate}</div>
            <small className="text-muted">{formattedTime}</small>
          </div>
        );
      },
    },
    {
      key: "resolved_at",
      name: "Resolved At",
      selector: (row: any) => row.resolved_at,
      sortable: true,
      cell: (props: any) => {
        if (!props.resolved_at) return <span className="text-muted">N/A</span>;
        const formattedDate = convertUTCToUserTimezone(props.resolved_at, {
          outputFormat: "DD-MM-YYYY hh:mm:ss A",
        });
        const formattedTime = convertUTCToUserTimezone(props.resolved_at, {
          outputFormat: "hh:mm:ss A",
        });
        return (
          <div>
            <div>{formattedDate}</div>
            <small className="text-muted">{formattedTime}</small>
          </div>
        );
      },
    },
    {
      key: "duration",
      name: "Duration",
      selector: (row: any) => row.created_at,
      sortable: true,
      cell: (props: any) => {
        if (props.is_resolved && props.resolved_at) {
          const created = new Date(props.created_at);
          const resolved = new Date(props.resolved_at);
          const duration = Math.floor(
            (resolved.getTime() - created.getTime()) / (1000 * 60)
          ); // minutes

          if (duration < 60) {
            return `${duration}m`;
          } else if (duration < 1440) {
            return `${Math.floor(duration / 60)}h ${duration % 60}m`;
          } else {
            return `${Math.floor(duration / 1440)}d ${Math.floor(
              (duration % 1440) / 60
            )}h`;
          }
        } else if (!props.is_resolved) {
          const created = new Date(props.created_at);
          const now = new Date();
          const duration = Math.floor(
            (now.getTime() - created.getTime()) / (1000 * 60)
          ); // minutes

          if (duration < 60) {
            return `${duration}m`;
          } else if (duration < 1440) {
            return `${Math.floor(duration / 60)}h ${duration % 60}m`;
          } else {
            return `${Math.floor(duration / 1440)}d ${Math.floor(
              (duration % 1440) / 60
            )}h`;
          }
        }
        return <span className="text-muted">N/A</span>;
      },
    },

    ...(session?.user?.permissions?.includes('resolve-alert-netops') ? [
      
    {
      key: "actions",
      name: "Actions",
      selector: (row: any) => row.id,
      sortable: false,
      cell: (props: any) => {
        const actions = [];
        
        if (!props.is_resolved) {
          actions.push({
            label: 'Resolve',
            icon: resolvingAlertId === props.id ? (
              <i className="fas fa-spinner fa-spin"></i>
            ) : (
              <FiCheck />
            ),
            onClick: () => handleResolveAlert(props.id),
            className: 'text-success gap-2',
            disabled: resolvingAlertId === props.id
          });
        }
        
        return (
          <DatatableActionButton
            actions={actions}
          />
        );
      },
    },
  ] : []),

  ];

  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [currentFilters, setCurrentFilters] = useState<Record<string, any>>({});
  const [summary, setSummary] = useState<Summary>({
    total_alerts: 0,
    critical_alerts: 0,
    high_alerts: 0,
    medium_alerts: 0,
    low_alerts: 0,
  });
  const [resolvingAlertId, setResolvingAlertId] = useState<number | null>(null);

  // Create cards data for PageSummaryGrid
  const summaryCards: SummaryCard[] = [
    {
      id: "total-alerts",
      title: "Total Alerts",
      value: summary?.total_alerts || 0,
      description: "Total alerts in the system",
      delay: 0.1,
      showAnimatedNumber: true,
      animationDuration: 1000,
      fontStyle: "style-2",
    },
    {
      id: "critical-alerts",
      title: "Critical",
      value: summary?.critical_alerts || 0,
      description: "Critical severity alerts",
      delay: 0.3,
      showAnimatedNumber: true,
      animationDuration: 1000,
      fontStyle: "style-2",
    },
    {
      id: "high-alerts",
      title: "High",
      value: summary?.high_alerts || 0,
      description: "High severity alerts",
      delay: 0.5,
      showAnimatedNumber: true,
      animationDuration: 1000,
      fontStyle: "style-2",
    },
    {
      id: "medium-alerts",
      title: "Medium",
      value: summary?.medium_alerts || 0,
      description: "Medium severity alerts",
      delay: 0.7,
      showAnimatedNumber: true,
      animationDuration: 1000,
      fontStyle: "style-2",
    },
  ];

  const fetchAlerts = useCallback(
    async (page = 1, perPage = 15, search = "") => {
      try {
        const [alertsResponse, dashboardResponse] = await Promise.all([
          getAlerts({
            page,
            perPage,
            limit: perPage,
            search,
            ...currentFilters,
          }),
          getMonitoringDashboard(),
        ]);

        // Calculate alert summary from alerts data
        const alerts = (alertsResponse as any)?.alerts ?? [];
        const alertSummary = {
          total_alerts: alerts.length,
          critical_alerts: alerts.filter(
            (alert: Alert) => alert.severity === "CRITICAL"
          ).length,
          high_alerts: alerts.filter(
            (alert: Alert) => alert.severity === "HIGH"
          ).length,
          medium_alerts: alerts.filter(
            (alert: Alert) => alert.severity === "MEDIUM"
          ).length,
          low_alerts: alerts.filter((alert: Alert) => alert.severity === "LOW")
            .length,
        };

        setSummary(alertSummary);

        // Return alerts data in the format expected by GenericListPage
        return {
          data: alerts,
          total: alerts.length,
          current_page: page,
          per_page: perPage,
          last_page: Math.ceil(alerts.length / perPage),
        };
      } catch (error) {
        console.error("Error fetching alerts:", error);
        toast.error("Failed to fetch alerts");
        return {
          data: [],
          total: 0,
          current_page: 1,
          per_page: perPage,
          last_page: 1,
        };
      }
    },
    [currentFilters]
  );

  const handleFiltersChange = (filters: any) => {
    setCurrentFilters(filters);
  };

  const handleResolveAlert = async (alertId: number) => {
    try {
      setResolvingAlertId(alertId);
      await resolveAlert(alertId);
      toast.success("Alert resolved successfully");
      // Refresh the data
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error("Error resolving alert:", error);
      toast.error("Failed to resolve alert");
    } finally {
      setResolvingAlertId(null);
    }
  };

  const handleExport = async (
    exportType: string,
    filters: Record<string, any>
  ) => {
    try {
      // TODO: Implement export functionality
      toast.info("Export functionality will be implemented soon");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Export failed");
    }
  };

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Call Logs" />

      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title style-2">
            <Row className="d-flex justify-content-between align-items-center">
              <Col md={4}>
                <h2 className="mb-0">Alerts</h2>
              </Col>

              <Col md={8} className="d-flex justify-content-end">
                <div className="action-buttons">
                  <div className="search-container">
                           <i className="fas fa-search search-icon"></i>
                           <input type="text" className="search-bar" placeholder="Search alerts..." onChange={(e) => handleFiltersChange({...currentFilters, search: e.target.value})}/>
                       </div>

                  <AlertsFilters
                    onFiltersChange={handleFiltersChange}
                    onExport={handleExport}
                    moduleSlug="alerts"
                  />
                </div>
              </Col>
            </Row>
          </div>
        </Col>
      </Row>

      <PageSummaryGrid cards={summaryCards} />

      <GenericListPage
        columns={columns}
        fetchData={fetchAlerts}
        title="Alerts"
        searchPlaceholder="Search alerts..."
        defaultPageSize={15}
        filters={currentFilters}
        refreshKey={refreshKey}
        search={false}
        tableStyle="table-style-2"
      />
    </React.Fragment>
  );
};

Alerts.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default Alerts;
