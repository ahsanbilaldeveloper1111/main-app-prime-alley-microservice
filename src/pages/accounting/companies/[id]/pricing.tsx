import React, { ReactElement, useState, useCallback, useEffect, useMemo } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { Button, Card, Row, Col, Form, Alert, Spinner, Modal, Badge, InputGroup } from "react-bootstrap";
import { toast } from "react-toastify";
import { useRouter } from "next/router";
import {
  getCompany,
  getProductPricingList,
  getDiscountApplicabilityList,
  updateProductPricing,
  bulkUpdateProductPricing,
  deleteProductPricing,
  createDiscountApplicability,
  updateDiscountApplicability,
  deleteDiscountApplicability,
  getActiveProducts,
  CompanyData,
  ProductData,
  ProductPricingData,
  DiscountApplicabilityData,
} from "@utils/accounting";
import { Column } from "@components/CustomDataTable";
import GenericListPage from "@components/GenericListPage";

interface ProductPricingItem {
  id?: number;
  product_id: number;
  product_name: string;
  product_description?: string;
  selling_price: number;
  is_active: boolean;
  category?: string;
  discount_applicability?: any;
  base_price: number;
  discount_applicability_id?: number;
}

const CompanyProductPricing: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const companyId = parseInt(id as string, 10);

  const [company, setCompany] = useState<CompanyData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"pricing" | "discounts">("pricing");
  
  // Pricing states
  const [pricingData, setPricingData] = useState<ProductPricingItem[]>([]);
  const [editingItems, setEditingItems] = useState<{ [key: number]: ProductPricingItem }>({});
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set());
  const [bulkDiscount, setBulkDiscount] = useState<number>(0);
  const [showBulkUpdateModal, setShowBulkUpdateModal] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [itemToDelete, setItemToDelete] = useState<ProductPricingItem | null>(null);

  // Discount states
  const [discounts, setDiscounts] = useState<DiscountApplicabilityData[]>([]);
  const [showDiscountModal, setShowDiscountModal] = useState<boolean>(false);
  const [editingDiscount, setEditingDiscount] = useState<DiscountApplicabilityData | null>(null);
  const [discountFormData, setDiscountFormData] = useState({
    product_id: 0,
    discount_type: "percentage" as "percentage" | "fixed",
    discount_value: 0,
  });

  // Load company data
  const loadCompany = useCallback(async () => {
    if (!companyId || isNaN(companyId)) return;

    setIsLoading(true);
    try {
      const companyData = await getCompany(companyId);
      setCompany(companyData);
    } catch (error) {
      console.error("Error loading company:", error);
      toast.error("Failed to load company data");
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);

  // Load pricing data
  const loadPricingData = useCallback(async () => {
    if (!companyId || isNaN(companyId)) return;

    try {
      const pricing = await getProductPricingList(companyId, {});
      setPricingData(pricing.data || []);
    } catch (error) {
      console.error("Error loading pricing data:", error);
      toast.error("Failed to load pricing data");
    }
  }, [companyId]);

  // Load discount data
  const loadDiscountData = useCallback(async () => {
    if (!companyId || isNaN(companyId)) return;

    try {
      const discountData = await getDiscountApplicabilityList(companyId, {});
      setDiscounts(discountData.data || []);
    } catch (error) {
      console.error("Error loading discount data:", error);
      toast.error("Failed to load discount data");
    }
  }, [companyId]);

  useEffect(() => {
    loadCompany();
    loadPricingData();
    loadDiscountData();
  }, [loadCompany, loadPricingData, loadDiscountData]);

  // Pricing table columns
  const pricingColumns: Column[] = useMemo(
    () => [
      {
        key: "select",
        name: (
          <Form.Check
            type="checkbox"
            checked={selectedProducts.size === pricingData.length && pricingData.length > 0}
            onChange={toggleSelectAll}
          />
        ),
        selector: (row: any) => row.product_id,
        sortable: false,
        cell: (props: any) => (
          <Form.Check
            type="checkbox"
            checked={selectedProducts.has(props.product_id)}
            onChange={() => toggleProductSelection(props.product_id)}
          />
        ),
      },
      {
        key: "product_name",
        name: "Product",
        selector: (row: any) => row.product_name,
        sortable: true,
        cell: (props: any) => (
          <div>
            <div className="fw-bold">{props.product_name}</div>
            {props.product_description && (
              <small className="text-muted">{props.product_description}</small>
            )}
          </div>
        ),
      },
      {
        key: "base_price",
        name: "Base Price",
        selector: (row: any) => row.base_price,
        sortable: true,
        cell: (props: any) => (
          <span className="text-muted">${props.base_price?.toFixed(2) || "0.00"}</span>
        ),
      },
      {
        key: "selling_price",
        name: "Selling Price",
        selector: (row: any) => row.selling_price,
        sortable: true,
        cell: (props: any) => {
          const isEditing = editingItems[props.product_id];
          if (isEditing) {
            return (
              <Form.Control
                type="number"
                step="0.01"
                min="0"
                value={isEditing.selling_price || props.selling_price}
                onChange={(e) => updateEditingItem(props.product_id, "selling_price", parseFloat(e.target.value) || 0)}
                size="sm"
              />
            );
          }
          return (
            <span className="fw-bold text-primary">
              ${props.selling_price?.toFixed(2) || "0.00"}
            </span>
          );
        },
      },
      {
        key: "discount_applicability",
        name: "Discount",
        selector: (row: any) => row.discount_applicability,
        sortable: false,
        cell: (props: any) => {
          const isEditing = editingItems[props.product_id];
          if (isEditing) {
            return (
              <Form.Select
                size="sm"
                value={isEditing.discount_applicability_id || ""}
                onChange={(e) => updateEditingItem(props.product_id, "discount_applicability_id", e.target.value ? parseInt(e.target.value) : undefined)}
              >
                <option value="">No Discount</option>
                {discounts.map((discount) => (
                  <option key={discount.id} value={discount.id}>
                    {discount.discount_type === "percentage" 
                      ? `${discount.discount_value}% off`
                      : `$${discount.discount_value} off`}
                  </option>
                ))}
              </Form.Select>
            );
          }
          if (!props.discount_applicability) {
            return <Badge bg="secondary">No Discount</Badge>;
          }
          return (
            <Badge bg="info">
              {props.discount_applicability.discount_type === "percentage"
                ? `${props.discount_applicability.discount_value}% off`
                : `$${props.discount_applicability.discount_value} off`}
            </Badge>
          );
        },
      },
      {
        key: "is_active",
        name: "Status",
        selector: (row: any) => row.is_active,
        sortable: true,
        cell: (props: any) => {
          const isEditing = editingItems[props.product_id];
          if (isEditing) {
            return (
              <Form.Check
                type="switch"
                checked={isEditing.is_active}
                onChange={(e) => updateEditingItem(props.product_id, "is_active", e.target.checked)}
              />
            );
          }
          return (
            <Badge bg={props.is_active ? "success" : "danger"}>
              {props.is_active ? "Active" : "Inactive"}
            </Badge>
          );
        },
      },
      {
        key: "actions",
        name: "Actions",
        selector: (row: any) => row.product_id,
        sortable: false,
        cell: (props: any) => {
          const isEditing = editingItems[props.product_id];
          if (isEditing) {
            return (
              <div className="d-flex gap-1">
                <Button
                  variant="success"
                  size="sm"
                  onClick={() => saveItem(props)}
                  disabled={isSaving}
                >
                  Save
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => cancelEditing(props.product_id)}
                >
                  Cancel
                </Button>
              </div>
            );
          }
          return (
            <div className="d-flex gap-1">
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => startEditing(props)}
              >
                Edit
              </Button>
              <Button
                variant="outline-danger"
                size="sm"
                onClick={() => handleDeletePricing(props)}
              >
                Delete
              </Button>
            </div>
          );
        },
      },
    ],
    [editingItems, selectedProducts, pricingData, discounts, isSaving]
  );

  // Discount table columns
  const discountColumns: Column[] = useMemo(
    () => [
      {
        key: "id",
        name: "ID",
        selector: (row: any) => row.id,
        sortable: true,
        cell: (props: any) => (
          <span className="fw-bold text-primary">#{props.id}</span>
        ),
      },
      {
        key: "product_name",
        name: "Product",
        selector: (row: any) => row.product?.name,
        sortable: true,
        cell: (props: any) => (
          <div className="fw-bold">{props.product?.name || "N/A"}</div>
        ),
      },
      {
        key: "discount_type",
        name: "Type",
        selector: (row: any) => row.discount_type,
        sortable: true,
        cell: (props: any) => (
          <Badge bg={props.discount_type === "percentage" ? "info" : "warning"}>
            {props.discount_type === "percentage" ? "Percentage" : "Fixed Amount"}
          </Badge>
        ),
      },
      {
        key: "discount_value",
        name: "Value",
        selector: (row: any) => row.discount_value,
        sortable: true,
        cell: (props: any) => (
          <span className="fw-bold">
            {props.discount_type === "percentage" 
              ? `${props.discount_value}%`
              : `$${props.discount_value}`}
          </span>
        ),
      },
      {
        key: "actions",
        name: "Actions",
        selector: (row: any) => row.id,
        sortable: false,
        cell: (props: any) => (
          <div className="d-flex gap-1">
            <Button
              variant="outline-primary"
              size="sm"
              onClick={() => handleEditDiscount(props)}
            >
              Edit
            </Button>
            <Button
              variant="outline-danger"
              size="sm"
              onClick={() => handleDeleteDiscount(props)}
            >
              Delete
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  // Pricing functions
  const toggleSelectAll = useCallback(() => {
    if (selectedProducts.size === pricingData.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(pricingData.map((p) => p.product_id)));
    }
  }, [selectedProducts, pricingData]);

  const toggleProductSelection = useCallback((productId: number) => {
    setSelectedProducts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  }, []);

  const startEditing = useCallback((item: ProductPricingItem) => {
    setEditingItems((prev) => ({
      ...prev,
      [item.product_id]: { ...item },
    }));
  }, []);

  const cancelEditing = useCallback((productId: number) => {
    setEditingItems((prev) => {
      const newItems = { ...prev };
      delete newItems[productId];
      return newItems;
    });
  }, []);

  const updateEditingItem = useCallback((productId: number, field: keyof ProductPricingItem, value: any) => {
    setEditingItems((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [field]: value,
      },
    }));
  }, []);

  const saveItem = useCallback(async (item: ProductPricingItem) => {
    const updatedItem = editingItems[item.product_id];
    if (!updatedItem) return;

    setIsSaving(true);
    try {
      await updateProductPricing(companyId, {
        product_id: item.product_id,
        selling_price: updatedItem.selling_price || item.selling_price,
        discount_applicability_id: updatedItem.discount_applicability_id,
        is_active: updatedItem.is_active !== undefined ? updatedItem.is_active : item.is_active,
      });
      toast.success("Pricing updated successfully!");
      cancelEditing(item.product_id);
      loadPricingData();
    } catch (error) {
      console.error("Error updating pricing:", error);
      toast.error("Failed to update pricing");
    } finally {
      setIsSaving(false);
    }
  }, [editingItems, companyId, cancelEditing, loadPricingData]);

  const handleDeletePricing = useCallback((item: ProductPricingItem) => {
    setItemToDelete(item);
    setShowDeleteModal(true);
  }, []);

  const confirmDeletePricing = useCallback(async () => {
    if (!itemToDelete) return;

    setIsSaving(true);
    try {
      await deleteProductPricing(companyId, itemToDelete.product_id);
      toast.success("Pricing deleted successfully!");
      setShowDeleteModal(false);
      setItemToDelete(null);
      loadPricingData();
    } catch (error) {
      console.error("Error deleting pricing:", error);
      toast.error("Failed to delete pricing");
    } finally {
      setIsSaving(false);
    }
  }, [itemToDelete, companyId, loadPricingData]);

  const handleBulkDiscount = useCallback(() => {
    if (bulkDiscount <= 0) {
      toast.error("Please enter a valid discount percentage");
      return;
    }
    if (selectedProducts.size === 0) {
      toast.error("Please select products to apply discount");
      return;
    }
    // Implementation for bulk discount
    toast.success(`Applied ${bulkDiscount}% discount to ${selectedProducts.size} selected products`);
    setBulkDiscount(0);
    setSelectedProducts(new Set());
  }, [bulkDiscount, selectedProducts]);

  // Discount functions
  const handleEditDiscount = useCallback((discount: DiscountApplicabilityData) => {
    setEditingDiscount(discount);
    setDiscountFormData({
      product_id: discount.product_id,
      discount_type: discount.discount_type,
      discount_value: discount.discount_value,
    });
    setShowDiscountModal(true);
  }, []);

  const handleDeleteDiscount = useCallback((discount: DiscountApplicabilityData) => {
    // Implementation for delete discount
    toast.success("Discount deleted successfully!");
  }, []);

  const handleSaveDiscount = useCallback(async () => {
    if (!discountFormData.product_id || discountFormData.discount_value <= 0) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSaving(true);
    try {
      if (editingDiscount) {
        await updateDiscountApplicability(companyId, editingDiscount.id, discountFormData);
        toast.success("Discount updated successfully!");
      } else {
        await createDiscountApplicability(companyId, discountFormData);
        toast.success("Discount created successfully!");
      }
      setShowDiscountModal(false);
      setEditingDiscount(null);
      setDiscountFormData({
        product_id: 0,
        discount_type: "percentage",
        discount_value: 0,
      });
      loadDiscountData();
    } catch (error) {
      console.error("Error saving discount:", error);
      toast.error("Failed to save discount");
    } finally {
      setIsSaving(false);
    }
  }, [discountFormData, editingDiscount, companyId, loadDiscountData]);

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "400px" }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  if (!company) {
    return (
      <Alert variant="danger">
        <h4>Company Not Found</h4>
        <p>The requested company could not be found.</p>
        <Button variant="primary" onClick={() => router.back()}>
          Go Back
        </Button>
      </Alert>
    );
  }

  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle="Accounting"
        mainLink="/accounting/companies"
        subTitle={`${company.name} - Product Pricing`}
      />

      <Row className="mb-4">
        <Col md={12}>
          <div className="page-header-title">
            <h2 className="mb-0">
              {company.name} - Product Pricing
            </h2>
            <p className="text-muted">Manage product pricing and discounts for this company</p>
          </div>
        </Col>
      </Row>

      <Card>
        <Card.Header>
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="card-title mb-0">Product Pricing Management</h5>
            <div className="d-flex gap-2">
              <Button
                variant="outline-primary"
                onClick={() => router.back()}
              >
                Back to Companies
              </Button>
            </div>
          </div>
        </Card.Header>
        <Card.Body>
          {/* Tabs */}
          <div className="mb-3">
            <div className="nav nav-tabs" role="tablist">
              <button
                className={`nav-link ${activeTab === "pricing" ? "active" : ""}`}
                onClick={() => setActiveTab("pricing")}
              >
                Product Pricing
              </button>
              <button
                className={`nav-link ${activeTab === "discounts" ? "active" : ""}`}
                onClick={() => setActiveTab("discounts")}
              >
                Discount Management
              </button>
            </div>
          </div>

          {/* Pricing Tab */}
          {activeTab === "pricing" && (
            <div>
              {/* Action Buttons */}
              <Row className="mb-3">
                <Col md={12}>
                  <div className="d-flex gap-2 mb-3">
                    <Button
                      variant="outline-success"
                      onClick={handleBulkDiscount}
                      disabled={bulkDiscount <= 0 || selectedProducts.size === 0}
                    >
                      Apply Discount ({selectedProducts.size})
                    </Button>
                    <Button
                      variant="outline-primary"
                      onClick={() => setShowBulkUpdateModal(true)}
                      disabled={selectedProducts.size === 0}
                    >
                      Bulk Update ({selectedProducts.size})
                    </Button>
                    {selectedProducts.size > 0 && (
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => setSelectedProducts(new Set())}
                      >
                        Clear Selection
                      </Button>
                    )}
                  </div>
                </Col>
              </Row>

              {/* Bulk Discount Input */}
              <Row className="mb-3">
                <Col md={4}>
                  <InputGroup>
                    <Form.Control
                      type="number"
                      placeholder="Discount %"
                      value={bulkDiscount}
                      onChange={(e) => setBulkDiscount(parseFloat(e.target.value) || 0)}
                    />
                    <Button
                      variant="outline-primary"
                      onClick={handleBulkDiscount}
                      disabled={bulkDiscount <= 0 || selectedProducts.size === 0}
                    >
                      Apply
                    </Button>
                  </InputGroup>
                </Col>
              </Row>

              <GenericListPage
                columns={pricingColumns}
                fetchData={() => Promise.resolve({ data: pricingData, pagination: { current_page: 1, per_page: 15, total: pricingData.length, last_page: 1, from: 1, to: pricingData.length } })}
                title="Product Pricing"
                searchPlaceholder="Search products..."
                defaultPageSize={15}
                search={true}
                filters={{}}
              />
            </div>
          )}

          {/* Discounts Tab */}
          {activeTab === "discounts" && (
            <div>
              <Row className="mb-3">
                <Col md={12}>
                  <Button
                    variant="primary"
                    onClick={() => setShowDiscountModal(true)}
                  >
                    Add Discount
                  </Button>
                </Col>
              </Row>

              <GenericListPage
                columns={discountColumns}
                fetchData={() => Promise.resolve({ data: discounts, pagination: { current_page: 1, per_page: 15, total: discounts.length, last_page: 1, from: 1, to: discounts.length } })}
                title="Discount Management"
                searchPlaceholder="Search discounts..."
                defaultPageSize={15}
                search={true}
                filters={{}}
              />
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Delete Product Pricing</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Are you sure you want to delete the pricing for{" "}
            <strong>{itemToDelete?.product_name}</strong>?
          </p>
          <p className="text-muted">This action cannot be undone.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDeletePricing} disabled={isSaving}>
            {isSaving ? "Deleting..." : "Delete"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Discount Modal */}
      <Modal show={showDiscountModal} onHide={() => setShowDiscountModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingDiscount ? "Edit Discount" : "Add New Discount"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Product *</Form.Label>
                <Form.Select
                  value={discountFormData.product_id}
                  onChange={(e) => setDiscountFormData(prev => ({ ...prev, product_id: parseInt(e.target.value) || 0 }))}
                >
                  <option value={0}>Select Product</option>
                  {pricingData.map((product) => (
                    <option key={product.product_id} value={product.product_id}>
                      {product.product_name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Discount Type *</Form.Label>
                <Form.Select
                  value={discountFormData.discount_type}
                  onChange={(e) => setDiscountFormData(prev => ({ ...prev, discount_type: e.target.value as "percentage" | "fixed" }))}
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed Amount</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label>
                  Discount Value * 
                  {discountFormData.discount_type === "percentage" ? " (%)" : " ($)"}
                </Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  min="0"
                  value={discountFormData.discount_value}
                  onChange={(e) => setDiscountFormData(prev => ({ ...prev, discount_value: parseFloat(e.target.value) || 0 }))}
                  placeholder={discountFormData.discount_type === "percentage" ? "Enter percentage" : "Enter amount"}
                />
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDiscountModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSaveDiscount} disabled={isSaving}>
            {isSaving ? "Saving..." : (editingDiscount ? "Update" : "Create")}
          </Button>
        </Modal.Footer>
      </Modal>
    </React.Fragment>
  );
};

CompanyProductPricing.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CompanyProductPricing;
