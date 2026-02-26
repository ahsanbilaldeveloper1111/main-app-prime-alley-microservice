import React, { ReactElement, useState, useEffect } from "react";
import { useRouter } from "next/router";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import {
  Card,
  CardBody,
  Col,
  Row,
  Form,
  Button,
  Alert,
} from "react-bootstrap";
import Link from "next/link";
import { FiArrowLeft, FiSave, FiXCircle, FiInfo } from "react-icons/fi";
import { 
  createOrderLostReason, 
  updateOrderLostReason, 
  getOrderLostReason,
  OrderLostReasonData
} from "@utils/sales";
import { toast } from "react-toastify";

const ManageLostReason: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const isEditMode = Boolean(id);
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#dc3545",
    sequence: 0,
    active: true,
  });

  useEffect(() => {
    if (isEditMode && id) {
      loadLostReason(Number(id));
    }
  }, [id, isEditMode]);

  const loadLostReason = async (reasonId: number) => {
    try {
      setLoading(true);
      const reason = await getOrderLostReason(reasonId);
      setFormData({
        name: reason.name,
        description: reason.description || "",
        color: reason.color || "#dc3545",
        sequence: reason.sequence || 0,
        active: reason.active,
      });
    } catch (error) {
      console.error("Failed to load lost reason:", error);
      toast.error("Failed to load lost reason");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Lost reason name is required";
    }

    if (formData.sequence < 0) {
      newErrors.sequence = "Sequence must be 0 or greater";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      if (isEditMode) {
        await updateOrderLostReason(Number(id), formData);
        toast.success("Lost reason updated successfully!");
      } else {
        await createOrderLostReason(formData);
        toast.success("Lost reason created successfully!");
      }
      router.push("/sales/lost-reasons");
    } catch (error) {
      console.error("Failed to save lost reason:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle="Sales"
        mainLink="/sales"
        subTitle="Lost Reasons"
      />
      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title">
            <h2 className="mb-0">{isEditMode ? "Edit Lost Reason" : "Create New Lost Reason"}</h2>
            <p className="text-muted mb-0">
              {isEditMode ? "Update lost reason configuration" : "Add a new reason for why orders are lost"}
            </p>
          </div>
        </Col>
      </Row>

      <Row>
        <Col lg={8}>
          <Card>
            <CardBody>
              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={8}>
                    <Form.Group className="mb-3">
                      <Form.Label>Reason Name *</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="e.g., Price too high, No budget, Competitor won"
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        isInvalid={!!errors.name}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.name}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Color</Form.Label>
                      <Form.Control
                        type="color"
                        value={formData.color}
                        onChange={(e) => handleInputChange("color", e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Sequence</Form.Label>
                      <Form.Control
                        type="number"
                        min="0"
                        value={formData.sequence}
                        onChange={(e) => handleInputChange("sequence", parseInt(e.target.value) || 0)}
                        isInvalid={!!errors.sequence}
                      />
                      <Form.Text className="text-muted">
                        Order in the list (lower numbers come first)
                      </Form.Text>
                      <Form.Control.Feedback type="invalid">
                        {errors.sequence}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Status</Form.Label>
                      <Form.Check
                        type="switch"
                        id="active-switch"
                        label="Active"
                        checked={formData.active}
                        onChange={(e) => handleInputChange("active", e.target.checked)}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="Provide more details about this lost reason..."
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                  />
                </Form.Group>

                <Alert variant="info">
                  <FiInfo className="me-2" />
                  <strong>Lost Reason Tips:</strong>
                  <ul className="mb-0 mt-2">
                    <li>Use clear, specific names that help identify patterns</li>
                    <li>Sequence determines the order in dropdowns and lists</li>
                    <li>Colors help visually distinguish between reasons</li>
                  </ul>
                </Alert>

                <div className="d-flex gap-2">
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={loading}
                    className="d-flex align-items-center gap-2"
                  >
                    <FiSave />
                    {loading ? "Saving..." : isEditMode ? "Update Lost Reason" : "Create Lost Reason"}
                  </Button>
                  <Link href="/sales/lost-reasons">
                    <Button variant="outline-secondary" className="d-flex align-items-center gap-2">
                      <FiArrowLeft />
                      Back to Lost Reasons
                    </Button>
                  </Link>
                </div>
              </Form>
            </CardBody>
          </Card>
        </Col>

        <Col lg={4}>
          <Card>
            <CardBody>
              <h5 className="mb-3">Lost Reason Preview</h5>
              
              <div className="lost-reason-preview p-3 border rounded" style={{ backgroundColor: formData.color + '20' }}>
                <div className="d-flex align-items-center gap-2 mb-2">
                  <div 
                    className="reason-indicator rounded-circle" 
                    style={{ 
                      width: '12px', 
                      height: '12px', 
                      backgroundColor: formData.color 
                    }}
                  />
                  <span className="fw-medium">{formData.name || "Reason Name"}</span>
                  <span className="badge bg-secondary">{formData.sequence}</span>
                </div>
                
                <small className="text-muted">
                  {formData.description || "No description provided"}
                </small>
                
                <div className="mt-2">
                  <small className="text-muted">
                    Status: {formData.active ? "Active" : "Inactive"}
                  </small>
                </div>
              </div>

              <div className="mt-3">
                <h6>Common Lost Reasons</h6>
                <div className="d-flex flex-column gap-2">
                  <div className="d-flex align-items-center gap-2">
                    <div className="reason-dot" style={{ backgroundColor: '#dc3545' }} />
                    <span className="text-muted">Price too high</span>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <div className="reason-dot" style={{ backgroundColor: '#fd7e14' }} />
                    <span className="text-muted">No budget</span>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <div className="reason-dot" style={{ backgroundColor: '#6f42c1' }} />
                    <span className="text-muted">Competitor won</span>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <div className="reason-dot" style={{ backgroundColor: '#20c997' }} />
                    <span className="text-muted">Timing issues</span>
                  </div>
                </div>
              </div>

              <style jsx>{`
                .reason-dot {
                  width: 8px;
                  height: 8px;
                  border-radius: 50%;
                }
              `}</style>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </React.Fragment>
  );
};

export default ManageLostReason;
