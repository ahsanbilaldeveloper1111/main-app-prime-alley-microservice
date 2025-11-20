import "@assets/scss/datatable-style.scss";
import React, {
  ReactElement,
} from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";

import CompanyLogo2 from "@assets/images/Prime3.png";
import { useState } from 'react';
import { Card, Row, Col, Button, Badge, Form, Table, Modal, Dropdown, ProgressBar } from 'react-bootstrap';
import { 
  Eye, CreditCard, Clock, Wallet, ChevronRight, ChevronLeft,
  Edit, Trash2, Filter, Plus, Settings, Download, LayoutDashboard,
  Package, FileText, Bell, Check, DollarSign, TrendingUp, AlertCircle,
  Users, ArrowUp, ArrowDown
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

import "@assets/scss/billing.scss";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import PageHeader from "@components/PageHeader";

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
    
    interface Invoice {
      id: number;
      invoice: string;
      date: string;
      dueDate: string;
      amount: string;
      status: string;
      paymentMethod: string;
      items: { name: string; quantity: number; price: string }[];
      subtotal: string;
      tax: string;
      total: string;
    }

const ProductDetails = () => {

  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  
    const [products, setProducts] = useState<Product[]>([
      { id: 1, name: 'UCASS Gateway 16 Channel', category: 'Gateway', price: '£300.00', type: 'Monthly', totalAmount: '£3,600.00', status: 'Active', created: '2024-10-15' },
      { id: 2, name: 'UCASS Advance Policy', category: 'Policy', price: '£216.00', type: 'Annual', totalAmount: '£216.00', status: 'Trial', created: '2024-10-20' },
      { id: 3, name: 'UCASS SLA', category: 'SLA', price: '£420.00', type: 'Monthly', totalAmount: '£5,040.00', status: 'Active', created: '2024-10-10' },
      { id: 4, name: 'UCASS Basic', category: 'Basic', price: '£144.00', type: 'One-time', totalAmount: '£144.00', status: 'Inactive', created: '2024-10-25' }
    ]);
  
    const [newProduct, setNewProduct] = useState({
      name: '',
      category: '',
      price: '',
      type: 'Monthly',
      status: 'Active'
    });


    // Products Management
  const renderProducts = () => {
      const handleAddProduct = () => {
        const today = new Date().toISOString().split('T')[0];
        const price = parseFloat(newProduct.price) || 0;
        const multiplier = newProduct.type === 'Annual' ? 1 : newProduct.type === 'Monthly' ? 12 : 1;
        const totalAmount = price * multiplier;
        
        const product: Product = {
          id: products.length + 1,
          name: newProduct.name,
          category: newProduct.category,
          price: `£${price.toFixed(2)}`,
          type: newProduct.type,
          totalAmount: `£${totalAmount.toFixed(2)}`,
          status: newProduct.status,
          created: today
        };
        
        setProducts([...products, product]);
        setShowProductModal(false);
        setNewProduct({ name: '', category: '', price: '', type: 'Monthly', status: 'Active' });
      };
  
      const handleEditProduct = (product: Product) => {
        setSelectedProduct(product);
        setShowViewModal(true);
      };
  
      const handleDeleteProduct = (id: number) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
          setProducts(products.filter(p => p.id !== id));
        }
      };
  
      const AddProductModal = () => (
        <Modal show={showProductModal} onHide={() => setShowProductModal(false)} size="lg" centered>
          <Modal.Header closeButton>
            <Modal.Title>Add New Product</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Row>
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label>Product Name *</Form.Label>
                    <Form.Control
                      type="text"
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                      placeholder="Enter product name"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Category *</Form.Label>
                    <Form.Select
                      value={newProduct.category}
                      onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    >
                      <option value="">Select category</option>
                      <option>Gateway</option>
                      <option>Policy</option>
                      <option>SLA</option>
                      <option>Basic</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Price *</Form.Label>
                    <Form.Control
                      type="number"
                      step="0.01"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                      placeholder="0.00"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Type *</Form.Label>
                    <Form.Select
                      value={newProduct.type}
                      onChange={(e) => setNewProduct({ ...newProduct, type: e.target.value })}
                    >
                      <option>Monthly</option>
                      <option>Annual</option>
                      <option>One-time</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Status *</Form.Label>
                    <Form.Select
                      value={newProduct.status}
                      onChange={(e) => setNewProduct({ ...newProduct, status: e.target.value })}
                    >
                      <option>Active</option>
                      <option>Trial</option>
                      <option>Inactive</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setShowProductModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAddProduct}>
              Add Product
            </Button>
          </Modal.Footer>
        </Modal>
      );
  
      const ViewProductModal = () => {
        if (!selectedProduct) return null;
        
        const getStatusColor = (status: string): string => {
          switch (status) {
            case 'Active': return 'success';
            case 'Trial': return 'warning';
            case 'Inactive': return 'secondary';
            default: return 'primary';
          }
        };
  
        return (
          <Modal show={showViewModal} onHide={() => setShowViewModal(false)} size="lg" centered>
            <Modal.Header closeButton>
              <Modal.Title>Product Details</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <div className="mb-4 pb-4 border-bottom">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h4 className="mb-2">{selectedProduct.name}</h4>
                    <p className="text-muted mb-0">Product ID: #{selectedProduct.id}</p>
                  </div>
                  <Badge bg={getStatusColor(selectedProduct.status)} className="px-3 py-2">
                    {selectedProduct.status}
                  </Badge>
                </div>
              </div>
  
              <Row>
                <Col md={6} className="mb-3">
                  <div className="p-3 bg-light rounded">
                    <p className="text-muted mb-1 small">Category</p>
                    <p className="mb-0 fw-semibold">{selectedProduct.category}</p>
                  </div>
                </Col>
                <Col md={6} className="mb-3">
                  <div className="p-3 bg-light rounded">
                    <p className="text-muted mb-1 small">Type</p>
                    <p className="mb-0 fw-semibold">{selectedProduct.type}</p>
                  </div>
                </Col>
                <Col md={6} className="mb-3">
                  <div className="p-3 bg-light rounded">
                    <p className="text-muted mb-1 small">Price</p>
                    <p className="mb-0 fw-semibold text-primary">{selectedProduct.price}</p>
                  </div>
                </Col>
                <Col md={6} className="mb-3">
                  <div className="p-3 bg-light rounded">
                    <p className="text-muted mb-1 small">Total Amount</p>
                    <p className="mb-0 fw-semibold text-success">{selectedProduct.totalAmount}</p>
                  </div>
                </Col>
              </Row>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="outline-secondary" onClick={() => setShowViewModal(false)}>Close</Button>
              <Button variant="primary"><Edit size={16} className="me-2" />Edit Product</Button>
            </Modal.Footer>
          </Modal>
        );
      };
  
      return (
        <div>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="mb-1">My Products</h2>
              <p className="text-muted mb-0">Manage your subscriptions and services</p>
            </div>
            <Button variant="primary" onClick={() => setShowProductModal(true)}>
              <Plus size={16} className="me-2" />
              Add Product
            </Button>
          </div>
  
          {/* Stats Cards */}
          <Row className="mb-4">
            <Col md={3} className="mb-3">
              <Card>
                <Card.Body>
                  <h3 className="mb-1">24</h3>
                  <p className="text-muted mb-0 small">Total Products</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} className="mb-3">
              <Card>
                <Card.Body>
                  <h3 className="text-success mb-1">20</h3>
                  <p className="text-muted mb-0 small">Active</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} className="mb-3">
              <Card>
                <Card.Body>
                  <h3 className="text-warning mb-1">4</h3>
                  <p className="text-muted mb-0 small">Trial</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} className="mb-3">
              <Card>
                <Card.Body>
                  <h3 className="text-info mb-1">£1,080</h3>
                  <p className="text-muted mb-0 small">Total Value</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>
  
          {/* Filters */}
          <Card className="mb-4">
            <Card.Body>
              <Row className="align-items-center">
                <Col md={4}>
                  <Form.Control type="search" placeholder="Search products..." />
                </Col>
                <Col md={2}>
                  <Form.Select>
                    <option>All Categories</option>
                    <option>Gateway</option>
                    <option>Policy</option>
                    <option>SLA</option>
                  </Form.Select>
                </Col>
                <Col md={2}>
                  <Form.Select>
                    <option>All Status</option>
                    <option>Active</option>
                    <option>Trial</option>
                    <option>Inactive</option>
                  </Form.Select>
                </Col>
                <Col md={2}>
                  <Form.Select>
                    <option>All Types</option>
                    <option>Monthly</option>
                    <option>Annual</option>
                    <option>One-time</option>
                  </Form.Select>
                </Col>
                <Col md={2}>
                  <Button variant="outline-primary" className="w-100">
                    <Filter size={16} className="me-2" />
                    Apply
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>
  
          {/* Products Table */}
          <Card>
            <Card.Body>
              <Table responsive hover>
                <thead className="bg-light">
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Type</th>
                    <th>Total Amount</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td className="fw-semibold">{product.name}</td>
                      <td>{product.category}</td>
                      <td className="text-primary fw-semibold">{product.price}</td>
                      <td>{product.type}</td>
                      <td className="text-success fw-semibold">{product.totalAmount}</td>
                      <td>
                        <Badge bg={product.status === 'Active' ? 'success' : product.status === 'Trial' ? 'warning' : 'secondary'} className="bg-opacity-10 text-dark">
                          {product.status}
                        </Badge>
                      </td>
                      <td>{product.created}</td>
                      <td>
                        <div className="d-flex gap-2">
                          <Button variant="link" size="sm" className="p-1" onClick={() => handleEditProduct(product)}>
                            <Eye size={16} />
                          </Button>
                          <Button variant="link" size="sm" className="p-1 text-danger" onClick={() => handleDeleteProduct(product.id)}>
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
  
          {AddProductModal()}
          {ViewProductModal()}
        </div>
      );
    };




  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Customer Dashboard" />

      {/* <PageHeader
        title="Customer Dashboard"
        showSearch={false}
      /> */}

      {renderProducts()}

      

    </React.Fragment>
  );
};

ProductDetails.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default ProductDetails;
