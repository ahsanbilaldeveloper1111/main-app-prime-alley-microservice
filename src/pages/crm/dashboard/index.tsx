import React, { ReactElement, useState, useEffect, useCallback } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { Card, Row, Col, Button, Spinner, ListGroup } from "react-bootstrap";
import { useSession } from "next-auth/react";
import { getCrmDashboard } from "@utils/crm";
import {
  TrendingUp,
  Calendar,
  Users,
  UserPlus,
  DollarSign,
  ShoppingCart,
  CheckCircle,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { toast } from "react-toastify";
import moment from "moment";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  LineChart,
  Line,
} from "recharts";

import StatsCards from "@components/GenericStatsCards";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import { GlobalDateTimeFormat, formatNumber } from "@utils/Helper";

const CrmDashboard = () => {
  const { data: session } = useSession();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const dashboard = await getCrmDashboard().then(
        (res: any) => res.data.data,
      );
      setDashboardData(dashboard);

      setLoading(false);
    } catch (error: any) {
      console.error("Failed to fetch dashboard data:", error);
      setError(error?.message || "Failed to load dashboard data");
      setLoading(false);
      toast.error(error?.message || "Failed to load dashboard data");
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "400px" }}
      >
        <Spinner animation="border">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        {error}
        <Button
          variant="outline-danger"
          size="sm"
          className="ms-3"
          onClick={fetchDashboardData}
        >
          Retry
        </Button>
      </div>
    );
  }

  // Campaign Performance data from API
  const campaignData =
    dashboardData?.campaign_performance?.chart_data?.map((item: any) => ({
      name: item.month_label || item.month,
      Leads: Number(item.leads) || 0,
      Deals: Number(item.deals) || 0,
      Orders: Number(item.orders) || 0,
    })) || [];

  // Tasks data from API
  const tasksData = dashboardData?.task_statuses
    ? [
        {
          name: "Completed",
          value: dashboardData.task_statuses.completed || 0,
          color: "#20C997",
        },
        {
          name: "Pending",
          value: dashboardData.task_statuses.pending || 0,
          color: "#FFC107",
        },
        {
          name: "Overdue",
          value: dashboardData.task_statuses.overdue || 0,
          color: "#FD7E14",
        },
      ]
    : [];

  const totalTasks = tasksData.reduce((sum, item) => sum + item.value, 0);
  const completedPercentage =
    totalTasks > 0 ? Math.round((tasksData[0]?.value / totalTasks) * 100) : 0;

  // Calculate funnel percentages (relative to Prospects as 100%)
  const prospectsCount = dashboardData?.counts?.crm_data || 0;
  const leadsCount = dashboardData?.counts?.leads || 0;
  const dealsCount = dashboardData?.counts?.deals || 0;
  const ordersCount = dashboardData?.counts?.orders || 0;
  const orderConversionPercentage =
    dashboardData?.conversion_ratios?.order_conversion_percentage || 0;

  const prospectsPercentage = prospectsCount > 0 ? 100 : 0;
  const leadsPercentage =
    prospectsCount > 0 ? Math.round((leadsCount / prospectsCount) * 100) : 0;
  const dealsPercentage =
    prospectsCount > 0 ? Math.round((dealsCount / prospectsCount) * 100) : 0;
  const ordersPercentage =
    prospectsCount > 0 ? Math.round((ordersCount / prospectsCount) * 100) : 0;

  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle="CRM"
        mainLink="/crm/dashboard"
        subTitle="Dashboard"
      />

      <>
        <Row className="mb-4 align-items-center">
          <Col xs={12} md={7} className="mb-2 mb-md-0">
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <h4 style={{ margin: 0, fontWeight: 600, color: "#1E293B" }}>
                CRM Dashboard
              </h4>
            </div>
          </Col>
        </Row>
        <div className="mb-4">
          <StatsCards
            gridMinWidth="180px"
            data={[
              {
                title: "Prospects",
                value: formatNumber(dashboardData?.counts?.crm_data || 0, true),
                icon: Users,
                iconColor: "#0EA5E9",
                iconBgColor: "#E0F2FE",
              },
              {
                title: "Leads",
                value: formatNumber(dashboardData?.counts?.leads || 0, true),
                icon: UserPlus,
                iconColor: "#3B82F6",
                iconBgColor: "#DBEAFE",
              },
              {
                title: "Deals",
                value: formatNumber(dashboardData?.counts?.deals || 0, true),
                icon: DollarSign,
                iconColor: "#F59E0B",
                iconBgColor: "#FEF3C7",
              },
              {
                title: "Orders",
                value: formatNumber(dashboardData?.counts?.orders || 0, true),
                icon: ShoppingCart,
                iconColor: "#F97316",
                iconBgColor: "#FED7AA",
              },
              {
                title: "Leads to Deals Conversion",
                value: `${(dashboardData?.conversion_ratios?.lead_to_deal ?? 0).toFixed(2)}%`,
                icon: TrendingUp,
                iconColor: "#0EA5E9",
                iconBgColor: "#E0F2FE",
              },
              {
                title: "Deals to Orders Conversion",
                value: `${(dashboardData?.conversion_ratios?.deal_to_order ?? 0).toFixed(2)}%`,
                icon: TrendingUp,
                iconColor: "#10B981",
                iconBgColor: "#D1FAE5",
              },
            ]}
          />
        </div>

        {/* Main Content */}
        <Row className="g-4">
          {/* Left Column */}
          <Col xxl={4} xl={6} lg={12} md={12}>
            {/* Leads Funnel */}
            <Card
              style={{
                border: "none",
                borderRadius: "12px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                marginBottom: "24px",
              }}
            >
              <Card.Body>
                <h5
                  style={{
                    fontSize: "16px",
                    fontWeight: 600,
                    marginBottom: "20px",
                    color: "#1E293B",
                  }}
                >
                  Leads Funnel
                </h5>
                <p
                  style={{
                    fontSize: "13px",
                    color: "#94A3B8",
                    marginBottom: "16px",
                  }}
                >
                  Stage Volume
                </p>

                <div style={{ marginBottom: "12px" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "12px",
                      marginBottom: "8px",
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span
                        style={{
                          fontSize: "14px",
                          color: "#1E293B",
                          fontWeight: 500,
                        }}
                      >
                        Prospects
                      </span>
                      <span
                        style={{
                          fontSize: "13px",
                          color: "#64748B",
                          fontWeight: 600,
                        }}
                      >
                        {formatNumber(prospectsCount, true)}
                      </span>
                    </div>
                    <div
                      style={{
                        flex: 1,
                        marginLeft: "12px",
                        display: "flex",
                        justifyContent: "flex-end",
                      }}
                    >
                      <div
                        style={{
                          width: "100%",
                          maxWidth: "260px",
                          height: "32px",
                          backgroundColor: "#E6EEF9",
                          borderRadius: "8px",
                        }}
                      >
                        <div
                          style={{
                            width: `${prospectsPercentage}%`,
                            height: "100%",
                            backgroundColor: "#3B82F6",
                            borderRadius: "8px",
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: "12px" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "12px",
                      marginBottom: "8px",
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span
                        style={{
                          fontSize: "14px",
                          color: "#1E293B",
                          fontWeight: 500,
                        }}
                      >
                        Leads
                      </span>
                      <span
                        style={{
                          fontSize: "13px",
                          color: "#64748B",
                          fontWeight: 600,
                        }}
                      >
                        {formatNumber(leadsCount, true)}
                      </span>
                    </div>
                    <div
                      style={{
                        flex: 1,
                        marginLeft: "12px",
                        display: "flex",
                        justifyContent: "flex-end",
                      }}
                    >
                      <div
                        style={{
                          width: "100%",
                          maxWidth: "260px",
                          height: "32px",
                          backgroundColor: "#ECFDF5",
                          borderRadius: "8px",
                        }}
                      >
                        <div
                          style={{
                            width: `${leadsPercentage}%`,
                            height: "100%",
                            backgroundColor: "#14B8A6",
                            borderRadius: "8px",
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: "12px" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "12px",
                      marginBottom: "8px",
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span
                        style={{
                          fontSize: "14px",
                          color: "#1E293B",
                          fontWeight: 500,
                        }}
                      >
                        Deals
                      </span>
                      <span
                        style={{
                          fontSize: "13px",
                          color: "#64748B",
                          fontWeight: 600,
                        }}
                      >
                        {formatNumber(dealsCount, true)}
                      </span>
                    </div>
                    <div
                      style={{
                        flex: 1,
                        marginLeft: "12px",
                        display: "flex",
                        justifyContent: "flex-end",
                      }}
                    >
                      <div
                        style={{
                          width: "100%",
                          maxWidth: "260px",
                          height: "32px",
                          backgroundColor: "#FFFAEB",
                          borderRadius: "8px",
                        }}
                      >
                        <div
                          style={{
                            width: `${dealsPercentage}%`,
                            height: "100%",
                            backgroundColor: "#F59E0B",
                            borderRadius: "8px",
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "12px",
                      marginBottom: "8px",
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span
                        style={{
                          fontSize: "14px",
                          color: "#1E293B",
                          fontWeight: 500,
                        }}
                      >
                        Orders
                      </span>
                      <span
                        style={{
                          fontSize: "13px",
                          color: "#64748B",
                          fontWeight: 600,
                        }}
                      >
                        {formatNumber(ordersCount, true)}
                      </span>
                    </div>
                    <div
                      style={{
                        flex: 1,
                        marginLeft: "12px",
                        display: "flex",
                        justifyContent: "flex-end",
                      }}
                    >
                      <div
                        style={{
                          width: "100%",
                          maxWidth: "260px",
                          height: "32px",
                          backgroundColor: "#FFF7ED",
                          borderRadius: "8px",
                        }}
                      >
                        <div
                          style={{
                            width: `${ordersPercentage}%`,
                            height: "100%",
                            backgroundColor: "#F97316",
                            borderRadius: "8px",
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                <p style={{ fontSize: "13px", color: "#64748B", margin: 0 }}>
                  Prospects → Orders conversion:{" "}
                  {orderConversionPercentage.toFixed(2)}%
                </p>
              </Card.Body>
            </Card>

            {/* Recent Activities */}
            <Card
              style={{
                border: "none",
                borderRadius: "12px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
              }}
            >
              <Card.Body>
                <h5
                  style={{
                    fontSize: "16px",
                    fontWeight: 600,
                    marginBottom: "20px",
                    color: "#1E293B",
                  }}
                >
                  Recent Activities
                </h5>

                <ListGroup variant="flush">
                  {(dashboardData?.recent_activities || [])
                    .slice(0, 5)
                    .map((activity: any, index: number) => {
                      const getIcon = () => {
                        if (activity.type === "lead")
                          return <UserPlus size={16} color="#3B82F6" />;
                        if (activity.type === "meeting")
                          return <Calendar size={16} color="#10B981" />;
                        if (activity.type === "followup")
                          return <CheckCircle size={16} color="#10B981" />;
                        return <Users size={16} color="#10B981" />;
                      };
                      const getBgColor = () => {
                        if (activity.type === "lead") return "#DBEAFE";
                        if (activity.type === "meeting") return "#D1FAE5";
                        if (activity.type === "followup") return "#D1FAE5";
                        return "#D1FAE5";
                      };
                      const getTypeLabel = () => {
                        if (activity.type === "lead") return "Lead";
                        if (activity.type === "meeting") return "Meeting";
                        if (activity.type === "followup") return "Follow-up";
                        return "Activity";
                      };
                      return (
                        <ListGroup.Item
                          key={activity.id || index}
                          style={{
                            padding: "16px 0",
                            border: "none",
                            borderBottom:
                              index < 4 ? "1px solid #F1F5F9" : "none",
                          }}
                        >
                          <div style={{ display: "flex", gap: "12px" }}>
                            <div
                              style={{
                                width: "36px",
                                height: "36px",
                                borderRadius: "50%",
                                backgroundColor: getBgColor(),
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                              }}
                            >
                              {getIcon()}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "start",
                                  marginBottom: "4px",
                                }}
                              >
                                <div>
                                  <span
                                    style={{
                                      fontSize: "13px",
                                      color: "#64748B",
                                    }}
                                  >
                                    {(() => {
                                      const formatted = moment
                                        .utc(activity.created_at)
                                        .local()
                                        .format("DD MMM YYYY,hh:mm:ss A");
                                      return formatted.replace(
                                        /(\d{2} )(\w{3})( \d{4})/,
                                        (match, day, month, year) =>
                                          `${day}${month.toUpperCase()}${year}`,
                                      );
                                    })()}
                                  </span>
                                  <span
                                    style={{
                                      fontSize: "14px",
                                      color: "#1E293B",
                                      marginLeft: "8px",
                                      fontWeight: 500,
                                    }}
                                  >
                                    {activity.description || "Activity"}
                                  </span>
                                </div>
                                <div
                                  style={{
                                    padding: "4px 12px",
                                    backgroundColor: "#F1F5F9",
                                    borderRadius: "6px",
                                    fontSize: "12px",
                                    color: "#64748B",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                  }}
                                >
                                  {getTypeLabel()}
                                </div>
                              </div>
                              {activity.user_extension && (
                                <p
                                  style={{
                                    fontSize: "13px",
                                    color: "#94A3B8",
                                    margin: 0,
                                  }}
                                >
                                  Extension: {activity.user_extension}
                                </p>
                              )}
                            </div>
                          </div>
                        </ListGroup.Item>
                      );
                    })}
                  {(!dashboardData?.recent_activities ||
                    dashboardData.recent_activities.length === 0) && (
                    <ListGroup.Item
                      style={{ padding: "16px 0", border: "none" }}
                    >
                      <p
                        style={{
                          fontSize: "13px",
                          color: "#94A3B8",
                          margin: 0,
                          textAlign: "center",
                        }}
                      >
                        No recent activities
                      </p>
                    </ListGroup.Item>
                  )}
                </ListGroup>
              </Card.Body>
            </Card>

            {/* Upcoming Meetings */}
            <Card
              style={{
                border: "none",
                borderRadius: "12px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                marginTop: "24px",
              }}
            >
              <Card.Body>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "20px",
                  }}
                >
                  <h5
                    style={{
                      fontSize: "16px",
                      fontWeight: 600,
                      margin: 0,
                      color: "#1E293B",
                    }}
                  >
                    Upcoming Meetings
                  </h5>
                  <a
                    href="#"
                    style={{
                      fontSize: "14px",
                      color: "#3B82F6",
                      textDecoration: "none",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    View Calendar <ChevronRight size={16} />
                  </a>
                </div>

                <ListGroup variant="flush">
                  {(dashboardData?.upcoming_meetings || [])
                    .slice(0, 5)
                    .map((meeting: any, index: number) => {
                      const initials = meeting.name
                        ? meeting.name.charAt(0).toUpperCase()
                        : "M";
                      const companyName =
                        meeting.lead?.company_name ||
                        meeting.deal?.company_name ||
                        "";
                      const meetingTime = meeting.meeting_time
                        ? moment(meeting.meeting_time).format("HH:mm")
                        : "";
                      return (
                        <ListGroup.Item
                          key={meeting.id || index}
                          style={{
                            padding: "16px 0",
                            border: "none",
                            borderBottom:
                              index <
                              (dashboardData?.upcoming_meetings?.length || 0) -
                                1
                                ? "1px solid #F1F5F9"
                                : "none",
                          }}
                        >
                          <div style={{ display: "flex", gap: "12px" }}>
                            <div
                              style={{
                                width: "40px",
                                height: "40px",
                                borderRadius: "50%",
                                backgroundColor: "#DBEAFE",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                                fontSize: "16px",
                                fontWeight: 600,
                                color: "#3B82F6",
                              }}
                            >
                              {initials}
                            </div>
                            <div style={{ flex: 1 }}>
                              <h6
                                style={{
                                  fontSize: "14px",
                                  fontWeight: 600,
                                  margin: "0 0 4px 0",
                                  color: "#1E293B",
                                }}
                              >
                                {meeting.name}{" "}
                                {companyName && (
                                  <span style={{ color: "#3B82F6" }}>
                                    – {companyName}
                                  </span>
                                )}
                              </h6>
                              <p
                                style={{
                                  fontSize: "13px",
                                  color: "#64748B",
                                  margin: 0,
                                }}
                              >
                                {meeting.meeting_type}{" "}
                                {meetingTime && `– ${meetingTime}`}
                              </p>
                            </div>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                              }}
                            >
                              <Calendar size={14} color="#94A3B8" />
                              <span
                                style={{ fontSize: "13px", color: "#64748B" }}
                              >
                                {moment(meeting.meeting_date).format(
                                  "MMM DD, YYYY",
                                )}
                              </span>
                            </div>
                          </div>
                        </ListGroup.Item>
                      );
                    })}
                  {(!dashboardData?.upcoming_meetings ||
                    dashboardData.upcoming_meetings.length === 0) && (
                    <ListGroup.Item
                      style={{ padding: "16px 0", border: "none" }}
                    >
                      <p
                        style={{
                          fontSize: "13px",
                          color: "#94A3B8",
                          margin: 0,
                          textAlign: "center",
                        }}
                      >
                        No upcoming meetings
                      </p>
                    </ListGroup.Item>
                  )}
                </ListGroup>
              </Card.Body>
            </Card>
          </Col>

          {/* Middle Column */}
          <Col xxl={4} xl={6} lg={12} md={12}>
            {/* Orders Revenue */}
            <Card
              style={{
                border: "none",
                borderRadius: "12px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                marginBottom: "24px",
              }}
            >
              <Card.Body>
                <h5
                  style={{
                    fontSize: "16px",
                    fontWeight: 600,
                    marginBottom: "8px",
                    color: "#1E293B",
                  }}
                >
                  Orders Revenue
                </h5>
                <p
                  style={{
                    fontSize: "13px",
                    color: "#64748B",
                    marginBottom: "16px",
                  }}
                >
                  Total Order Revenue
                </p>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    marginBottom: "20px",
                  }}
                >
                  <h2
                    style={{
                      fontSize: "32px",
                      fontWeight: 700,
                      margin: 0,
                      color: "#1E293B",
                    }}
                  >
                    AED {formatNumber(dashboardData?.order_revenue_aed || 0)}
                  </h2>
                  <div style={{ height: "32px" }}>
                    <svg width="120" height="32" viewBox="0 0 120 32">
                      <path
                        d="M0,16 L10,20 L20,12 L30,18 L40,8 L50,14 L60,10 L70,6 L80,4 L90,8 L100,6 L110,4 L120,2"
                        fill="none"
                        stroke="#10B981"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>

                <div
                  style={{
                    width: "100%",
                    height: "40px",
                    background:
                      "linear-gradient(90deg, #14B8A6 0%, #10B981 100%)",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontWeight: 600,
                    fontSize: "16px",
                    marginBottom: "16px",
                  }}
                >
                  AED {formatNumber(dashboardData?.order_revenue_aed || 0)}
                </div>

                <p
                  style={{
                    fontSize: "13px",
                    color: "#64748B",
                    margin: 0,
                    lineHeight: "1.6",
                  }}
                >
                  Tip: Track pipeline volume in the Leads Funnel to monitor
                  conversion rates. Revenue is only generated at the Orders
                  stage.
                </p>
              </Card.Body>
            </Card>

            {/* Tasks Completion */}
            <Card
              style={{
                border: "none",
                borderRadius: "12px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                marginBottom: "24px",
              }}
            >
              <Card.Body>
                <h5
                  style={{
                    fontSize: "16px",
                    fontWeight: 600,
                    marginBottom: "24px",
                    color: "#1E293B",
                  }}
                >
                  Tasks Completion
                </h5>

                <Row>
                  <Col md={6}>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={tasksData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {tasksData.map((entry) => (
                            <Cell
                              key={`cell-${entry.name}`}
                              fill={entry.color}
                            />
                          ))}
                        </Pie>
                        <text
                          x="50%"
                          y="50%"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          style={{
                            fontSize: "28px",
                            fontWeight: 700,
                            fill: "#1E293B",
                          }}
                        >
                          {completedPercentage}%
                        </text>
                        <text
                          x="50%"
                          y="60%"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          style={{ fontSize: "13px", fill: "#64748B" }}
                        >
                          Completed
                        </text>
                      </PieChart>
                    </ResponsiveContainer>
                  </Col>
                  <Col
                    md={6}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                    }}
                  >
                    {tasksData.map((item) => (
                      <div
                        key={item.name}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "16px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <div
                            style={{
                              width: "12px",
                              height: "12px",
                              borderRadius: "50%",
                              backgroundColor: item.color,
                            }}
                          ></div>
                          <span style={{ fontSize: "14px", color: "#64748B" }}>
                            {item.name}
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: "16px",
                            fontWeight: 600,
                            color: "#1E293B",
                          }}
                        >
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Upcoming Tasks */}
            <Card
              style={{
                border: "none",
                borderRadius: "12px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
              }}
            >
              <Card.Body>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "20px",
                  }}
                >
                  <h5
                    style={{
                      fontSize: "16px",
                      fontWeight: 600,
                      margin: 0,
                      color: "#1E293B",
                    }}
                  >
                    Upcoming Tasks
                  </h5>
                  {session?.user?.permissions?.includes("view-crm-tasks") && (
                    <Link
                      href="/crm/tasks"
                      style={{
                        fontSize: "14px",
                        color: "#3B82F6",
                        textDecoration: "none",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      View All <ChevronRight size={16} />
                    </Link>
                  )}
                </div>

                <ListGroup variant="flush">
                  {(dashboardData?.upcoming_tasks || [])
                    .slice(0, 5)
                    .map((task: any, index: number) => {
                      const initials = task.name
                        ? task.name.charAt(0).toUpperCase()
                        : "T";
                      const isOverdue = task.status === "overdue";
                      const bgColor = isOverdue ? "#F1F5F9" : "#D1FAE5";
                      const textColor = isOverdue ? "#64748B" : "#10B981";
                      return (
                        <ListGroup.Item
                          key={task.id || index}
                          style={{
                            padding: "16px 0",
                            border: "none",
                            borderBottom:
                              index <
                              (dashboardData?.upcoming_tasks?.length || 0) - 1
                                ? "1px solid #F1F5F9"
                                : "none",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              gap: "12px",
                              alignItems: "start",
                            }}
                          >
                            <div
                              style={{
                                width: "36px",
                                height: "36px",
                                borderRadius: "50%",
                                backgroundColor: "#DBEAFE",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                                fontSize: "14px",
                                fontWeight: 600,
                                color: "#3B82F6",
                              }}
                            >
                              {initials}
                            </div>
                            <div style={{ flex: 1 }}>
                              <h6
                                style={{
                                  fontSize: "14px",
                                  fontWeight: 600,
                                  margin: "0 0 4px 0",
                                  color: "#1E293B",
                                }}
                              >
                                {task.name}
                              </h6>
                              {task.company_name && (
                                <p
                                  style={{
                                    fontSize: "13px",
                                    color: "#64748B",
                                    margin: 0,
                                  }}
                                >
                                  {task.company_name}
                                </p>
                              )}
                            </div>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                padding: "4px 12px",
                                backgroundColor: bgColor,
                                borderRadius: "6px",
                                textTransform: "uppercase",
                              }}
                            >
                              <Calendar size={14} color={textColor} />
                              <span
                                style={{
                                  fontSize: "13px",
                                  color: textColor,
                                  fontWeight: 500,
                                }}
                              >
                                {moment(task.due_date).format(
                                  GlobalDateTimeFormat,
                                )}
                              </span>
                            </div>
                          </div>
                        </ListGroup.Item>
                      );
                    })}
                  {(!dashboardData?.upcoming_tasks ||
                    dashboardData.upcoming_tasks.length === 0) && (
                    <ListGroup.Item
                      style={{ padding: "16px 0", border: "none" }}
                    >
                      <p
                        style={{
                          fontSize: "13px",
                          color: "#94A3B8",
                          margin: 0,
                          textAlign: "center",
                        }}
                      >
                        No upcoming tasks
                      </p>
                    </ListGroup.Item>
                  )}
                </ListGroup>
              </Card.Body>
            </Card>
          </Col>

          {/* Right Column */}
          <Col xxl={4} xl={12} lg={12} md={12}>
            {/* Campaign Performance */}
            <Card
              style={{
                border: "none",
                borderRadius: "12px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                marginBottom: "16px",
              }}
            >
              <Card.Body style={{ padding: "20px" }}>
                <h5
                  style={{
                    fontSize: "16px",
                    fontWeight: 600,
                    marginBottom: "20px",
                    color: "#1E293B",
                  }}
                >
                  Campaign Performance
                </h5>

                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={campaignData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#F1F5F9"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10, fill: "#94A3B8" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "#94A3B8" }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <Tooltip />
                    <Legend
                      wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }}
                      iconType="circle"
                      iconSize={8}
                    />
                    <Line
                      type="monotone"
                      dataKey="Leads"
                      stroke="#14B8A6"
                      strokeWidth={2}
                      dot={{ r: 2 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="Deals"
                      stroke="#F59E0B"
                      strokeWidth={2}
                      dot={{ r: 2 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="Orders"
                      stroke="#F97316"
                      strokeWidth={2}
                      dot={{ r: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card.Body>
            </Card>

            {/* Top Customers */}
            <Card
              style={{
                border: "none",
                borderRadius: "12px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                marginBottom: "16px",
              }}
            >
              <Card.Body style={{ padding: "20px" }}>
                <h5
                  style={{
                    fontSize: "16px",
                    fontWeight: 600,
                    marginBottom: "16px",
                    color: "#1E293B",
                  }}
                >
                  Recent Leads
                </h5>

                <div
                  style={{
                    fontSize: "10px",
                    color: "#94A3B8",
                    fontWeight: 500,
                    marginBottom: "12px",
                    display: "grid",
                    gridTemplateColumns: "36px 1fr 120px 80px 140px",
                    gap: "8px",
                    paddingLeft: "4px",
                  }}
                >
                  <span></span>
                  <span>Lead</span>
                  <span style={{ textAlign: "left" }}>Campaign Name</span>
                  <span style={{ textAlign: "right" }}>Stage At</span>
                  {/* <span style={{ textAlign: 'right' }}>Created At</span> */}
                </div>

                <ListGroup variant="flush">
                  {(dashboardData?.recent_leads || [])
                    .slice(0, 5)
                    .map((lead: any, index: number) => {
                      const initials = lead.name
                        ? lead.name.charAt(0).toUpperCase()
                        : "L";
                      const campaignName = lead.campaign?.name || "-";
                      const stageName = lead.stage?.name || "-";
                      const stageColor = lead.stage?.color || "#64748B";
                      return (
                        <ListGroup.Item
                          key={lead.id || index}
                          style={{
                            padding: "10px 0",
                            border: "none",
                            borderBottom:
                              index <
                              (dashboardData?.recent_leads?.length || 0) - 1
                                ? "1px solid #F1F5F9"
                                : "none",
                          }}
                        >
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "36px 1fr 120px 80px 140px",
                              gap: "8px",
                              alignItems: "center",
                            }}
                          >
                            <div
                              style={{
                                width: "28px",
                                height: "28px",
                                borderRadius: "50%",
                                backgroundColor: "#DBEAFE",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "12px",
                                fontWeight: 600,
                                color: "#3B82F6",
                              }}
                            >
                              {initials}
                            </div>
                            <span
                              style={{
                                fontSize: "13px",
                                color: "#1E293B",
                                fontWeight: 500,
                              }}
                            >
                              {lead.name || "-"}
                            </span>
                            <span
                              style={{
                                fontSize: "13px",
                                color: "#1E293B",
                                fontWeight: 500,
                                textAlign: "left",
                              }}
                            >
                              {campaignName}
                            </span>
                            <span
                              style={{
                                fontSize: "13px",
                                color: stageColor,
                                fontWeight: 500,
                                textAlign: "right",
                              }}
                            >
                              {stageName}
                            </span>
                            {/* <span style={{ fontSize: '12px', color: '#64748B', textAlign: 'right' }}>
                            {convertDateTimeWithOffsetToLocal(lead.created_at,undefined,'DD MMM YYYY,hh:mm:ss A')}
                          </span> */}
                          </div>
                        </ListGroup.Item>
                      );
                    })}
                  {(!dashboardData?.recent_leads ||
                    dashboardData.recent_leads.length === 0) && (
                    <ListGroup.Item
                      style={{ padding: "10px 0", border: "none" }}
                    >
                      <p
                        style={{
                          fontSize: "13px",
                          color: "#94A3B8",
                          margin: 0,
                          textAlign: "center",
                        }}
                      >
                        No recent leads
                      </p>
                    </ListGroup.Item>
                  )}
                </ListGroup>
              </Card.Body>
            </Card>

            {/* Recent Deals */}
            <Card
              style={{
                border: "none",
                borderRadius: "12px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
              }}
            >
              <Card.Body style={{ padding: "20px" }}>
                <h5
                  style={{
                    fontSize: "16px",
                    fontWeight: 600,
                    marginBottom: "16px",
                    color: "#1E293B",
                  }}
                >
                  Recent Deals
                </h5>

                <div
                  style={{
                    fontSize: "10px",
                    color: "#94A3B8",
                    fontWeight: 500,
                    marginBottom: "12px",
                    display: "grid",
                    gridTemplateColumns: "36px 1fr 100px 100px",
                    gap: "8px",
                    paddingLeft: "4px",
                  }}
                >
                  <span></span>
                  <span>LEAD</span>
                  <span style={{ textAlign: "right" }}>DEAL VALUE</span>
                  <span style={{ textAlign: "right" }}>LAST ORDERS</span>
                </div>

                <ListGroup variant="flush">
                  {(dashboardData?.recent_deals || [])
                    .slice(0, 5)
                    .map((deal: any, index: number) => {
                      const initials = deal.name
                        ? deal.name.charAt(0).toUpperCase()
                        : "D";
                      const companyName =
                        deal.company_name || deal.ticket?.company_name || "N/A";
                      const dealValue = deal.grand_total || deal.net_value || 0;
                      const currency = deal.currency || "AED";
                      return (
                        <ListGroup.Item
                          key={deal.id || index}
                          style={{
                            padding: "10px 0",
                            border: "none",
                            borderBottom:
                              index <
                              (dashboardData?.recent_deals?.length || 0) - 1
                                ? "1px solid #F1F5F9"
                                : "none",
                          }}
                        >
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "36px 1fr 100px 100px",
                              gap: "8px",
                              alignItems: "center",
                            }}
                          >
                            <div
                              style={{
                                width: "28px",
                                height: "28px",
                                borderRadius: "50%",
                                backgroundColor: "#DBEAFE",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "12px",
                                fontWeight: 600,
                                color: "#3B82F6",
                              }}
                            >
                              {initials}
                            </div>
                            <span
                              style={{
                                fontSize: "13px",
                                color: "#1E293B",
                                fontWeight: 500,
                              }}
                            >
                              {companyName}
                            </span>
                            <span
                              style={{
                                fontSize: "13px",
                                color: "#1E293B",
                                fontWeight: 600,
                                textAlign: "right",
                              }}
                            >
                              {currency} {formatNumber(Number(dealValue))}
                            </span>
                            <span
                              style={{
                                fontSize: "12px",
                                color: "#64748B",
                                textAlign: "right",
                              }}
                            >
                              {moment(deal.created_at).format("MMM DD, YYYY")}
                            </span>
                          </div>
                        </ListGroup.Item>
                      );
                    })}
                  {(!dashboardData?.recent_deals ||
                    dashboardData.recent_deals.length === 0) && (
                    <ListGroup.Item
                      style={{ padding: "10px 0", border: "none" }}
                    >
                      <p
                        style={{
                          fontSize: "13px",
                          color: "#94A3B8",
                          margin: 0,
                          textAlign: "center",
                        }}
                      >
                        No recent deals
                      </p>
                    </ListGroup.Item>
                  )}
                </ListGroup>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </>
    </React.Fragment>
  );
};

CrmDashboard.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CrmDashboard;
