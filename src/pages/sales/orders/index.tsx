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
import { Column } from "@components/CustomDataTable";
import {
  Button,
  Modal,
  Row,
  Col,
  Badge,
  Dropdown,
  Form,
  Alert,
} from "react-bootstrap";
import {
  FiEdit,
  FiTrash2,
  FiEye,
  FiXCircle,
  FiPlus,
  FiMoreVertical,
} from "react-icons/fi";
import Link from "next/link";
import { toast } from "react-toastify";
import { useSession } from "next-auth/react";
import moment from "moment";
import {
  listOrders,
  deleteOrder,
  markOrderLost,
  listOrderStages,
  listOrderLostReasons,
} from "@utils/sales";
import { OrderData, OrderStageData, OrderLostReasonData } from "@utils/sales";
import SalesOrderFilters from "@components/filters/SalesOrderFilters";

const OrdersList = () => {
  const { data: session, status } = useSession();
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [currentFilters, setCurrentFilters] = useState<Record<string, any>>({});
  const [stages, setStages] = useState<OrderStageData[]>([]);
  const [lostReasons, setLostReasons] = useState<OrderLostReasonData[]>([]);
  
  // Mark as Lost Modal State
  const [showMarkLostModal, setShowMarkLostModal] = useState(false);
  const [orderToMarkLost, setOrderToMarkLost] = useState<OrderData | null>(null);
  const [lostReasonId, setLostReasonId] = useState<number | undefined>(undefined);
  const [lostNotes, setLostNotes] = useState("");

  // Fetch stages and lost reasons on component mount
  useEffect(() => {
    fetchStages();
    fetchLostReasons();
  }, []);

  const fetchStages = async () => {
    try {
      const stagesData = await listOrderStages();
      setStages(stagesData || []);
    } catch (error) {
      console.error("Failed to fetch stages:", error);
    }
  };

  const fetchLostReasons = async () => {
    try {
      const reasonsData = await listOrderLostReasons();
      setLostReasons(reasonsData || []);
    } catch (error) {
      console.error("Failed to fetch lost reasons:", error);
    }
  };

  const memoizedFilters = useMemo(() => {
    console.log('memoizedFilters updated:', currentFilters);
    return currentFilters;
  }, [currentFilters]);

  const fetchOrders = useCallback(
    async (page = 1, perPage = 15, search = "") => {
      console.log('fetchOrders called with memoizedFilters:', memoizedFilters);
      
      const params: any = {
        page,
        perPage,
        search,
        ...memoizedFilters  // Use memoizedFilters from component state
      };

      console.log('fetchOrders final params:', params);
      return await listOrders(params);
    },
    [memoizedFilters]  // Add memoizedFilters as dependency
  );

  const handleFiltersChange = useCallback((filters: any) => {
    console.log('Filters changed in orders page:', filters);
    console.log('Current filters before update:', currentFilters);
    setCurrentFilters(filters);
    setRefreshKey(prev => prev + 1);
  }, [currentFilters]);

  // Mark Order Lost Handlers
  const handleMarkLost = useCallback((order: OrderData) => {
    setOrderToMarkLost(order);
    setShowMarkLostModal(true);
  }, []);

  const handleMarkLostSubmit = useCallback(async () => {
    if (!orderToMarkLost || !lostReasonId) return;

    try {
      await markOrderLost({
        order_id: orderToMarkLost.id,
        lost_reason_id: lostReasonId,
        notes: lostNotes || undefined,
      });
      setShowMarkLostModal(false);
      setOrderToMarkLost(null);
      setLostReasonId(undefined);
      setLostNotes("");
      toast.success("Order marked as lost successfully!");
      setRefreshKey((oldKey) => oldKey + 1);
    } catch (error) {
      console.error("Failed to mark order as lost:", error);
    }
  }, [orderToMarkLost, lostReasonId, lostNotes]);

  const columns: Column[] = useMemo(
    () => [
      {
        key: "order_number",
        name: "Order #",
        selector: (row: any) => row.order_number,
        sortable: true,
        cell: (props: any) => (
          <div>
            <div className="fw-medium">{props.order_number}</div>
            <small className="text-muted">
              {props.customer_name || "No Customer"}
            </small>
          </div>
        ),
      },
      {
        key: "customer_name",
        name: "Customer",
        selector: (row: any) => row.customer_name,
        sortable: true,
        cell: (props: any) => (
          <div>
            <div className="fw-medium">{props.customer_name || "No Customer"}</div>
            <small className="text-muted">
              {props.customer_email || "No Email"}
            </small>
          </div>
        ),
      },
      {
        key: "order_date",
        name: "Date",
        selector: (row: any) => row.order_date,
        sortable: true,
        cell: (props: any) => (
          <span className="text-muted">
            {props.order_date
              ? moment(props.order_date).format("DD/MM/YYYY")
              : "-"}
          </span>
        ),
      },
      {
        key: "stage_name",
        name: "Stage",
        selector: (row: any) => row.stage?.name || "New",
        sortable: true,
        cell: (props: any) => {
          const stage = props.stage;
          if (!stage) return <Badge bg="secondary">New</Badge>;
          
          return (
            <Badge 
              bg="secondary"
              style={{ 
                backgroundColor: stage.color || '#6c757d',
                color: '#fff'
              }}
            >
              {stage.name}
            </Badge>
          );
        },
      },
      {
        key: "status",
        name: "Status",
        selector: (row: any) => row.status,
        sortable: true,
        cell: (props: any) => {
          const status = props.status || "pending";
          const isLost = props.is_lost || false;

          if (isLost) {
            return (
              <div>
                <Badge bg="danger">Lost</Badge>
                {props.lost_reason && (
                  <div className="mt-1">
                    <small className="text-muted">
                      Reason: {props.lost_reason.name}
                    </small>
                  </div>
                )}
              </div>
            );
          }

          const statusColors: Record<string, string> = {
            pending: "warning",
            processing: "info",
            completed: "success",
            cancelled: "danger",
          };

          return (
            <Badge bg={statusColors[status] || "secondary"}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
          );
        },
      },
      {
        key: "total_amount",
        name: "Total",
        selector: (row: any) => row.total_amount,
        sortable: true,
        cell: (props: any) => (
          <span className="fw-medium">
            ${props.total_amount ? parseFloat(props.total_amount).toFixed(2) : "0.00"}
          </span>
        ),
      },
      {
        key: "items_count",
        name: "Items",
        selector: (row: any) => row.items?.length || 0,
        sortable: true,
        cell: (props: any) => (
          <Badge bg="info">{props.items?.length || 0}</Badge>
        ),
      },
      {
        key: "Action",
        name: "ACTION",
        selector: (row: any) => row.id,
        sortable: false,
        cell: (props: any) => (
          <div className="action-buttons-container">
            <Dropdown>
              <Dropdown.Toggle variant="outline-secondary" size="sm" id={`dropdown-${props.id}`}>
                <FiMoreVertical size={14} />
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item as={Link} href={`/sales/orders/${props.id}`}>
                  <FiEye className="me-2" />
                  View
                </Dropdown.Item>
                {!props.is_lost && props.stage?.type !== "completed" && (
                  <Dropdown.Item as={Link} href={`/sales/orders/${props.id}/edit`}>
                    <FiEdit className="me-2" />
                    Edit
                  </Dropdown.Item>
                )}
                <Dropdown.Divider />
                {!props.is_lost && (
                  <Dropdown.Item onClick={() => handleMarkLost(props)} className="text-warning">
                    <FiXCircle className="me-2" />
                    Mark Lost
                  </Dropdown.Item>
                )}
                <Dropdown.Divider />
                <Dropdown.Item onClick={() => handleDeleteOrder(props)} className="text-danger">
                  <FiTrash2 className="me-2" />
                  Delete
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        ),
      },
    ],
    []
  );

  const handleDeleteOrder = async (order: OrderData) => {
    if (window.confirm(`Are you sure you want to delete order ${order.order_number}?`)) {
      try {
        await deleteOrder(order.id);
        toast.success("Order deleted successfully");
        setRefreshKey(prev => prev + 1);
      } catch (error: any) {
        toast.error(error?.message || "Failed to delete order");
      }
    }
  };

  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle="Sales"
        mainLink="/sales"
        subTitle="Orders"
      />
      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title">
            <h2 className="mb-0 d-flex align-items-center">
              Orders
              {/* {session?.user?.permissions?.includes("create-orders") && ( */}
                <Button
                  variant="outline-primary"
                  size="sm"
                  className="ms-3"
                  href="/sales/orders/create"
                >
                  <FiPlus className="me-2" />
                  New Order
                </Button>
              {/* )} */}
            </h2>
          </div>
        </Col>
      </Row>

      {/* Sales Order Filters */}
      <div className="row mb-3">
        <div className="col-12">
          <SalesOrderFilters onFiltersChange={handleFiltersChange} />
        </div>
      </div>

      {/* {session?.user?.permissions?.includes("view-orders") && ( */}
        <GenericListPage
          columns={columns}
          fetchData={fetchOrders}
          title="Orders"
          searchPlaceholder="Search orders..."
          defaultPageSize={15}
          filters={memoizedFilters}
          refreshKey={refreshKey}
          search
        />
      {/* )} */}

      {/* Mark Order Lost Modal */}
      <Modal
        show={showMarkLostModal}
        onHide={() => setShowMarkLostModal(false)}
      >
        <Modal.Header closeButton>
          <Modal.Title>Mark Order as Lost</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="warning">
            <strong>Warning!</strong> Marking this order as lost will change its status and cannot be easily undone.
          </Alert>
          
          <div className="mb-3">
            <strong>Order:</strong> {orderToMarkLost?.order_number}
            <br />
            <strong>Customer:</strong> {orderToMarkLost?.customer_name}
          </div>

          <Form.Group className="mb-3">
            <Form.Label>Lost Reason *</Form.Label>
          <Form.Select
              value={lostReasonId || ""}
              onChange={(e) =>
                setLostReasonId(e.target.value ? Number(e.target.value) : undefined)
              }
              required
            >
              <option value="">Select a reason</option>
              {lostReasons.map((reason) => (
                <option key={reason.id} value={reason.id}>
                  {reason.name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
          
          <Form.Group>
            <Form.Label>Additional Notes</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={lostNotes}
              onChange={(e) => setLostNotes(e.target.value)}
              placeholder="Please provide additional notes about why this order was lost..."
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowMarkLostModal(false)}
          >
            Cancel
          </Button>
          <Button 
            variant="warning" 
            onClick={handleMarkLostSubmit}
            disabled={!lostReasonId}
          >
            Mark as Lost
          </Button>
        </Modal.Footer>
      </Modal>
    </React.Fragment>
  );
};

OrdersList.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default OrdersList;
