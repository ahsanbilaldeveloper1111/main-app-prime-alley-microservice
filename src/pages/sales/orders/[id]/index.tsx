import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from "@layout/index";
import { 
  Card, 
  CardBody, 
  Col, 
  Row, 
  Table, 
  Badge, 
  Button, 
  Alert,
  Spinner,
  Modal,
  Form
} from 'react-bootstrap';
import Select from 'react-select';
import Link from "next/link";

import { 
  FiEdit, 
  FiTrash2,
  FiAlertTriangle
} from 'react-icons/fi';
import { 
  getOrder,
  deleteOrder,
  markOrderLost,
  listOrderLostReasons,
  OrderData,
  OrderLostReasonData
} from '../../../../utils/sales';
import { toast } from 'react-toastify';

const OrderView: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lostReasons, setLostReasons] = useState<OrderLostReasonData[]>([]);
  const [showLostModal, setShowLostModal] = useState(false);
  const [selectedLostReason, setSelectedLostReason] = useState<number | ''>('');
  const [lostNotes, setLostNotes] = useState('');

  useEffect(() => {
    if (id) {
      loadOrder();
      loadLostReasons();
    }
  }, [id]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const orderData = await getOrder(Number(id));
      setOrder(orderData);
    } catch (error) {
      console.error('Failed to load order:', error);
      toast.error('Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  const loadLostReasons = async () => {
    try {
      const lostReasonsData = await listOrderLostReasons();
      setLostReasons(lostReasonsData);
    } catch (error) {
      console.error('Failed to load lost reasons:', error);
    }
  };

  const handleDeleteOrder = async () => {
    if (!order) return;
    
    if (confirm(`Are you sure you want to delete order ${order.order_number}? This action cannot be undone.`)) {
      try {
        await deleteOrder(order.id);
        toast.success('Order deleted successfully');
        router.push('/sales/orders');
      } catch (error) {
        console.error('Failed to delete order:', error);
      }
    }
  };

  const handleMarkLost = async () => {
    if (!order) return;
    
    try {
      await markOrderLost({
        order_id: order.id,
        lost_reason_id: selectedLostReason || undefined,
        notes: lostNotes || undefined
      });
      setShowLostModal(false);
      setSelectedLostReason('');
      setLostNotes('');
      loadOrder(); // Reload order to get updated data
      toast.success('Order marked as lost successfully');
    } catch (error) {
      console.error('Failed to mark order as lost:', error);
    }
  };

  const getStageColor = (stage: any) => {
    if (stage?.type === 'completed') return 'success';
    if (stage?.type === 'cancelled') return 'danger';
    return 'primary';
  };

  const getStatusBadge = () => {
    if (!order) return null;
    
    if (order.stage?.type === 'completed') return <Badge color="success">Completed</Badge>;
    if (order.stage?.type === 'cancelled') return <Badge color="danger">Cancelled</Badge>;
    if (order.lost_reason) return <Badge color="warning">Lost</Badge>;
    return <Badge color="primary">Active</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="page-content">
        <div className="container-fluid">
          <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
            <Spinner color="primary" />
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="page-content">
        <div className="container-fluid">
          <Alert color="danger">
            Order not found
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <Row>
        <Col lg={12}>
          <Card className="border-0 shadow-sm">
            <CardBody className="p-4">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <h5 className="mb-1">Order #{order.order_number}</h5>
                  <p className="text-muted mb-0">Created on {formatDate(order.created_at)}</p>
                </div>
                <div className="d-flex gap-2">
                  {getStatusBadge()}
                  {order.can_be_edited && (
                    <Link href={`/sales/orders/${order.id}/edit`}>
                      <Button color="warning" size="sm">
                        <FiEdit size={16} className="me-2" />
                        Edit Order
                      </Button>
                    </Link>
                  )}
                  {order.can_be_edited && (
                    <Button color="danger" size="sm" onClick={handleDeleteOrder}>
                      <FiTrash2 size={16} className="me-2" />
                      Delete
                    </Button>
                  )}
                  {!order.is_completed && !order.lost_reason && (
                    <Button 
                      color="warning" 
                      size="sm"
                      onClick={() => setShowLostModal(true)}
                    >
                      <FiAlertTriangle size={16} className="me-2" />
                      Mark Lost
                    </Button>
                  )}
                </div>
              </div>

              <Row>
                <Col md={6}>
                  <div className="d-flex align-items-center mb-2">
                    <span className="fw-medium">{order.customer_name}</span>
                  </div>
                  {order.customer_email && (
                    <div className="d-flex align-items-center mb-2">
                      <span>{order.customer_email}</span>
                    </div>
                  )}
                  {order.customer_phone && (
                    <div className="d-flex align-items-center mb-2">
                      <span>{order.customer_phone}</span>
                    </div>
                  )}
                  {order.customer_address && (
                    <div className="d-flex align-items-start mb-2">
                      <span>{order.customer_address}</span>
                    </div>
                  )}
                </Col>
                <Col md={6}>
                  <div className="d-flex align-items-center mb-2">
                    <span>Order Date: {formatDate(order.order_date)}</span>
                  </div>
                  {order.expected_delivery_date && (
                    <div className="d-flex align-items-center mb-2">
                      <span>Expected Delivery: {formatDate(order.expected_delivery_date)}</span>
                    </div>
                  )}
                  <div className="d-flex align-items-center mb-2">
                    <span>Stage: {order.stage?.name}</span>
                  </div>
                </Col>
              </Row>
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Row>
        {/* Order Items */}
        <Col lg={8}>
          <Card className="border-0 shadow-sm">
            <CardBody className="p-4">
              <div className="d-flex align-items-center mb-3">
                <h5 className="mb-0">Order Items</h5>
              </div>

              {order.items && order.items.length > 0 ? (
                <div className="table-responsive">
                  <Table className="table-nowrap align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Product</th>
                        <th>Variant</th>
                        <th>Quantity</th>
                        <th>Unit Price</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map((item, index) => (
                        <tr key={index}>
                          <td>
                            <div className="fw-medium">{item.product?.name}</div>
                            <small className="text-muted">SKU: {item.product?.sku}</small>
                          </td>
                          <td>
                            {item?.variant_info ? (
                              <Badge color="info">{item?.variant_info}</Badge>
                            ) : (
                              <span className="text-muted">No variant</span>
                            )}
                          </td>
                          <td>{item.quantity}</td>
                          <td>{formatCurrency(item.unit_price)}</td>
                          <td className="fw-medium">{formatCurrency(item.total_price)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="text-muted">No items found</div>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Notes */}
          {order.notes && (
            <Card className="border-0 shadow-sm mt-4">
              <CardBody className="p-4">
                <div className="d-flex align-items-center mb-3">
                  <h5 className="mb-0">Notes</h5>
                </div>
                <p className="mb-0">{order.notes}</p>
              </CardBody>
            </Card>
          )}
        </Col>

        {/* Order Summary */}
        <Col lg={4}>
          <Card className="border-0 shadow-sm">
            <CardBody className="p-4">
              <div className="d-flex align-items-center mb-3">
                <h5 className="mb-0">Order Summary</h5>
              </div>

              <div className="d-flex justify-content-between mb-2">
                <span>Subtotal:</span>
                <span>{formatCurrency(order.total_amount)}</span>
              </div>

              {order.tax_amount > 0 && (
                <div className="d-flex justify-content-between mb-2">
                  <span>Tax:</span>
                  <span>{formatCurrency(order.tax_amount)}</span>
                </div>
              )}

              {order.discount_amount > 0 && (
                <div className="d-flex justify-content-between mb-2">
                  <span>Discount:</span>
                  <span>-{formatCurrency(order.discount_amount)}</span>
                </div>
              )}

              <hr />
              <div className="d-flex justify-content-between fw-bold fs-5">
                <span>Total:</span>
                <span>{formatCurrency(order.final_amount)}</span>
              </div>

              {/* Stage Information */}
              {order.stage && (
                <div className="mt-4">
                  <h6 className="mb-2">Current Stage</h6>
                  <Badge color={getStageColor(order.stage)} className="fs-6 p-2">
                    {order.stage.name}
                  </Badge>
                  {order.stage.description && (
                    <p className="text-muted small mt-2 mb-0">{order.stage.description}</p>
                  )}
                </div>
              )}

              {/* Lost Reason */}
              {order.lost_reason && (
                <div className="mt-4">
                  <h6 className="mb-2">Lost Reason</h6>
                  <Badge color="warning" className="fs-6 p-2">
                    {order.lost_reason.name}
                  </Badge>
                  {order.lost_reason.description && (
                    <p className="text-muted small mt-2 mb-0">{order.lost_reason.description}</p>
                  )}
                </div>
              )}

              {/* Inventory Status */}
              </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Action Buttons */}
      <Row className="mt-4">
        <Col lg={12}>
          <div className="d-flex justify-content-between">
            <Link href="/sales/orders">
              <Button color="secondary">
                Back to Orders
              </Button>
            </Link>
            <div className="d-flex gap-2">
              {order.can_be_edited && (
                <Link href={`/sales/orders/${order.id}/edit`}>
                  <Button color="warning">
                    <FiEdit size={16} className="me-2" />
                    Edit Order
                  </Button>
                </Link>
              )}
              {order.can_be_edited && (
                <Button color="danger" onClick={handleDeleteOrder}>
                  <FiTrash2 size={16} className="me-2" />
                  Delete Order
                </Button>
              )}
            </div>
          </div>
        </Col>
      </Row>

      {/* Mark Lost Modal */}
      {showLostModal && (
        <Modal show={showLostModal} onHide={() => setShowLostModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Mark Order as Lost</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Lost Reason</Form.Label>
                <Select
                  options={lostReasons.map(reason => ({ value: reason.id, label: reason.name }))}
                  value={selectedLostReason ? { value: selectedLostReason, label: lostReasons.find(r => r.id === selectedLostReason)?.name || '' } : null}
                  onChange={(selectedOption) => setSelectedLostReason(selectedOption?.value || '')}
                  placeholder="Select a reason"
                  isClearable
                  classNamePrefix="react-select"
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Additional Notes</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Provide additional details about why this order was lost..."
                  value={lostNotes}
                  onChange={(e) => setLostNotes(e.target.value)}
                />
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowLostModal(false)}>
              Cancel
            </Button>
            <Button variant="warning" onClick={handleMarkLost}>
              Mark Lost Reason
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </Layout>
  );
};

export default OrderView;
