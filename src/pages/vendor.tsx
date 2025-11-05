
import React, { useState } from 'react';
import { Card, Row, Col, Button, Badge, Form, Table, ProgressBar, Modal,Alert } from 'react-bootstrap';
import { 
  LayoutDashboard,
  Users,
  ShoppingCart,
  Wallet,
  Package,
  BarChart3,
  Boxes,
  Truck,
  FileText,
  TrendingUp,
  DollarSign,
  UserPlus,
  Eye,
  Edit,
  Trash2,
  Download,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  Calendar,
  ArrowUp,
  ArrowDown,
  UserCheck,
  UserX,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  RefreshCw,
  Store,


  Upload,
 
  AlertTriangle,

  TrendingDown,
  ArrowUpCircle,
  ArrowDownCircle,
  Star,
  Mail,
  Phone,
  MapPin,
  Warehouse
} from 'lucide-react';
import "@assets/scss/billing.scss";

import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    AreaChart,
    Area
  } from 'recharts';

  interface InventoryItem {
    id: number;
    sku: string;
    productName: string;
    category: string;
    currentStock: number;
    reorderLevel: number;
    maxStock: number;
    warehouse: string;
    unitPrice: number;
    totalValue: number;
    lastUpdated: string;
    status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  }
  
  interface StockMovement {
    id: number;
    date: string;
    type: 'In' | 'Out' | 'Adjustment';
    productName: string;
    quantity: number;
    reason: string;
    performedBy: string;
  }
  interface Supplier {
    id: number;
    name: string;
    code: string;
    email: string;
    phone: string;
    address: string;
    country: string;
    category: string;
    productsSupplied: number;
    totalOrders: number;
    totalSpent: number;
    rating: number;
    status: 'Active' | 'Inactive' | 'Pending';
    paymentTerms: string;
    leadTime: string;
    lastOrderDate: string;
  }
  
  interface PurchaseOrder {
    id: string;
    supplier: string;
    date: string;
    totalAmount: number;
    status: 'Pending' | 'Confirmed' | 'Shipped' | 'Delivered' | 'Cancelled';
    expectedDelivery: string;
  }
  // Chart Components
  const RevenueAreaChart = () => {
    const data = [
      { name: 'Jan', revenue: 45000, profit: 18000 },
      { name: 'Feb', revenue: 52000, profit: 21000 },
      { name: 'Mar', revenue: 48000, profit: 19200 },
      { name: 'Apr', revenue: 61000, profit: 24400 },
      { name: 'May', revenue: 55000, profit: 22000 },
      { name: 'Jun', revenue: 67000, profit: 26800 },
      { name: 'Jul', revenue: 72000, profit: 28800 },
      { name: 'Aug', revenue: 68000, profit: 27200 },
      { name: 'Sep', revenue: 79000, profit: 31600 },
      { name: 'Oct', revenue: 85000, profit: 34000 }
    ];
  
    return (
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0d6efd" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#0d6efd" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#198754" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#198754" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip 
            contentStyle={{ backgroundColor: '#fff', border: '1px solid #ddd' }}
            formatter={(value) => `£${value.toLocaleString()}`}
          />
          <Legend />
          <Area 
            type="monotone" 
            dataKey="revenue" 
            stroke="#0d6efd" 
            fillOpacity={1} 
            fill="url(#colorRevenue)"
            name="Total Revenue"
          />
          <Area 
            type="monotone" 
            dataKey="profit" 
            stroke="#198754" 
            fillOpacity={1} 
            fill="url(#colorProfit)"
            name="Net Profit"
          />
        </AreaChart>
      </ResponsiveContainer>
    );
  };

  const OrderStatusChart = () => {
    const data = [
      { name: 'Completed', value: 425, color: '#198754' },
      { name: 'Processing', value: 156, color: '#0d6efd' },
      { name: 'Pending', value: 89, color: '#ffc107' },
      { name: 'Cancelled', value: 45, color: '#dc3545' }
    ];

    const renderLabel = (entry: any) => {
      const total = data.reduce((sum, item) => sum + item.value, 0);
      const percent = ((entry.value / total) * 100).toFixed(0);
      return `${percent}%`;
    };
  
    return (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={true}
            label={renderLabel}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => `${value} orders`} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  const ResellerPerformanceChart = () => {
    const data = [
      { name: 'Top Reseller', sales: 125000, orders: 245 },
      { name: 'Reseller A', sales: 98000, orders: 198 },
      { name: 'Reseller B', sales: 87000, orders: 176 },
      { name: 'Reseller C', sales: 75000, orders: 152 },
      { name: 'Reseller D', sales: 62000, orders: 128 },
      { name: 'Reseller E', sales: 54000, orders: 105 }
    ];
  
    return (
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" angle={-15} textAnchor="end" height={80} />
          <YAxis />
          <Tooltip 
            contentStyle={{ backgroundColor: '#fff', border: '1px solid #ddd' }}
            formatter={(value, name) => {
              if (name === 'sales') return `£${value.toLocaleString()}`;
              return value;
            }}
          />
          <Legend />
          <Bar dataKey="sales" fill="#0d6efd" name="Total Sales (£)" />
          <Bar dataKey="orders" fill="#198754" name="Total Orders" />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const ProductCategoryChart = () => {
    const data = [
      { name: "Premium", value: 145, revenue: 7245 },
      { name: "Basic", value: 298, revenue: 5364 },
      { name: "Enterprise", value: 89, revenue: 8901 },
      { name: "Add-ons", value: 456, revenue: 4560 },
    ];
  
    const COLORS = ["#0d6efd", "#198754", "#ffc107", "#dc3545"];
  
    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip
            formatter={(value: number, name: string) =>
              name === "revenue"
                ? [`£${value.toLocaleString()}`, "Revenue"]
                : [`${value} products`, "Products"]
            }
          />
          <Legend />
  
          <Bar dataKey="value" name="Products">
            {data.map((entry, index) => (
              <Cell key={`bar-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
  
          <Bar dataKey="revenue" name="Revenue (£)">
            {data.map((entry, index) => (
              <Cell key={`bar-rev-${index}`} fill={COLORS[index % COLORS.length]} opacity={0.5} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const CommissionTrendChart = () => {
    const data = [
      { month: 'Jan', commission: 6750, resellers: 12 },
      { month: 'Feb', commission: 7800, resellers: 14 },
      { month: 'Mar', commission: 7200, resellers: 13 },
      { month: 'Apr', commission: 9150, resellers: 16 },
      { month: 'May', commission: 8250, resellers: 15 },
      { month: 'Jun', commission: 10050, resellers: 18 },
      { month: 'Jul', commission: 10800, resellers: 19 },
      { month: 'Aug', commission: 10200, resellers: 18 },
      { month: 'Sep', commission: 11850, resellers: 21 },
      { month: 'Oct', commission: 12750, resellers: 22 }
    ];
  
    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip 
            contentStyle={{ backgroundColor: '#fff', border: '1px solid #ddd' }}
            formatter={(value, name) => {
              if (name === 'Commission Paid') return `£${value.toLocaleString()}`;
              return value;
            }}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="commission" 
            stroke="#0d6efd" 
            strokeWidth={3}
            name="Commission Paid"
          />
        </LineChart>
      </ResponsiveContainer>
    );
  };

 

const VendorPortal = () => {
  const [activeScreen, setActiveScreen] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showResellerModal, setShowResellerModal] = useState(false);
  const [selectedReseller, setSelectedReseller] = useState<any>(null);
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [showAdjustStockModal, setShowAdjustStockModal] = useState(false);
  const [showStockHistoryModal, setShowStockHistoryModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<InventoryItem | null>(null);
  // States
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [showViewSupplierModal, setShowViewSupplierModal] = useState(false);
  const [showPurchaseOrderModal, setShowPurchaseOrderModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  const [supplierFormData, setSupplierFormData] = useState({
    name: '',
    code: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    postalCode: '',
    category: '',
    contactPerson: '',
    taxId: '',
    paymentTerms: '',
    leadTime: '',
    notes: ''
  });

  const [purchaseOrderData, setPurchaseOrderData] = useState({
    supplierId: '',
    orderDate: new Date().toISOString().split('T')[0],
    expectedDelivery: '',
    items: [{ productName: '', quantity: '', unitPrice: '', totalPrice: '' }],
    shippingCost: '',
    notes: ''
  });
  const [stockFormData, setStockFormData] = useState({
    productId: '',
    quantity: '',
    warehouse: '',
    reason: '',
    notes: ''
  });

  const [adjustmentFormData, setAdjustmentFormData] = useState({
    adjustmentType: 'Add',
    quantity: '',
    reason: '',
    notes: ''
  });
  const menuItems = [
    { id: 'dashboard', title: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { id: 'products', title: 'Product Management', icon: <Package size={18} /> },
    { id: 'resellers', title: 'Reseller Management', icon: <Store size={18} /> },
    { id: 'orders', title: 'Order Management', icon: <ShoppingCart size={18} /> },
    { id: 'revenue', title: 'Revenue & Commission', icon: <Wallet size={18} /> },
    { id: 'customers', title: 'Customer Management', icon: <Users size={18} /> },
    { id: 'inventory', title: 'Inventory Management', icon: <Boxes size={18} /> },      // 🧱 Represents stock/items
  { id: 'supplier', title: 'Supplier Management', icon: <Truck size={18} /> }, 
    { id: 'reports', title: 'Reports & Analytics', icon: <BarChart3 size={18} /> }
  ];

  const renderSuppliers = () => {
    
  
    // Sample Data
    const suppliers: Supplier[] = [
      {
        id: 1,
        name: 'Tech Components Ltd',
        code: 'SUP-001',
        email: 'sales@techcomponents.com',
        phone: '+44 20 1234 5678',
        address: '123 Tech Street, London',
        country: 'United Kingdom',
        category: 'Hardware',
        productsSupplied: 24,
        totalOrders: 145,
        totalSpent: 125450,
        rating: 4.8,
        status: 'Active',
        paymentTerms: 'Net 30',
        leadTime: '7-10 days',
        lastOrderDate: '2024-10-12'
      },
      {
        id: 2,
        name: 'Global Software Solutions',
        code: 'SUP-002',
        email: 'contact@globalsoftware.com',
        phone: '+1 555 987 6543',
        address: '456 Silicon Valley, California',
        country: 'United States',
        category: 'Software',
        productsSupplied: 18,
        totalOrders: 89,
        totalSpent: 89650,
        rating: 4.5,
        status: 'Active',
        paymentTerms: 'Net 45',
        leadTime: '3-5 days',
        lastOrderDate: '2024-10-08'
      },
      {
        id: 3,
        name: 'Network Equipment Co',
        code: 'SUP-003',
        email: 'orders@networkequip.com',
        phone: '+44 161 555 4321',
        address: '789 Network Ave, Manchester',
        country: 'United Kingdom',
        category: 'Hardware',
        productsSupplied: 32,
        totalOrders: 167,
        totalSpent: 156780,
        rating: 4.9,
        status: 'Active',
        paymentTerms: 'Net 30',
        leadTime: '5-7 days',
        lastOrderDate: '2024-10-15'
      },
      {
        id: 4,
        name: 'Cloud Services Provider',
        code: 'SUP-004',
        email: 'support@cloudservices.com',
        phone: '+44 20 9876 5432',
        address: '321 Cloud Way, Leeds',
        country: 'United Kingdom',
        category: 'Services',
        productsSupplied: 12,
        totalOrders: 56,
        totalSpent: 67890,
        rating: 4.2,
        status: 'Active',
        paymentTerms: 'Net 60',
        leadTime: '1-2 days',
        lastOrderDate: '2024-10-10'
      },
      {
        id: 5,
        name: 'Asian Electronics Hub',
        code: 'SUP-005',
        email: 'sales@asianelectronics.com',
        phone: '+86 10 5555 8888',
        address: '555 Tech Park, Beijing',
        country: 'China',
        category: 'Hardware',
        productsSupplied: 45,
        totalOrders: 23,
        totalSpent: 34500,
        rating: 3.8,
        status: 'Inactive',
        paymentTerms: 'Net 30',
        leadTime: '14-21 days',
        lastOrderDate: '2024-08-15'
      }
    ];
  
    const purchaseOrders: PurchaseOrder[] = [
      { id: 'PO-2024-145', supplier: 'Network Equipment Co', date: '2024-10-15', totalAmount: 12450, status: 'Confirmed', expectedDelivery: '2024-10-22' },
      { id: 'PO-2024-144', supplier: 'Tech Components Ltd', date: '2024-10-12', totalAmount: 8900, status: 'Shipped', expectedDelivery: '2024-10-19' },
      { id: 'PO-2024-143', supplier: 'Global Software Solutions', date: '2024-10-08', totalAmount: 15600, status: 'Delivered', expectedDelivery: '2024-10-13' },
      { id: 'PO-2024-142', supplier: 'Cloud Services Provider', date: '2024-10-05', totalAmount: 5400, status: 'Pending', expectedDelivery: '2024-10-20' }
    ];
  
    const summaryCards = [
      { title: 'Total Suppliers', value: '28', icon: <Users size={24} />, color: 'primary', change: '+3 this month' },
      { title: 'Active Suppliers', value: '24', icon: <CheckCircle size={24} />, color: 'success', change: '85.7%' },
      { title: 'Total Spent', value: '£474,270', icon: <DollarSign size={24} />, color: 'info', change: '+18.5%' },
      { title: 'Pending Orders', value: '8', icon: <Clock size={24} />, color: 'warning', change: 'Needs review' }
    ];
  
    const categoryData = [
      { name: 'Hardware', value: 45, color: '#0d6efd' },
      { name: 'Software', value: 25, color: '#198754' },
      { name: 'Services', value: 20, color: '#ffc107' },
      { name: 'Other', value: 10, color: '#dc3545' }
    ];
  
    const spendingTrendData = [
      { month: 'Jun', amount: 38000 },
      { month: 'Jul', amount: 42000 },
      { month: 'Aug', amount: 39500 },
      { month: 'Sep', amount: 45000 },
      { month: 'Oct', amount: 51000 }
    ];
  
    // Handlers
    const handleAddSupplier = () => {
      console.log('Add Supplier:', supplierFormData);
      alert('Supplier added successfully!');
      setShowAddSupplierModal(false);
      setSupplierFormData({
        name: '', code: '', email: '', phone: '', address: '', city: '', country: '',
        postalCode: '', category: '', contactPerson: '', taxId: '', paymentTerms: '',
        leadTime: '', notes: ''
      });
    };
  
    const handleViewSupplier = (supplier: Supplier) => {
      setSelectedSupplier(supplier);
      setShowViewSupplierModal(true);
    };
  
    const handleCreatePurchaseOrder = () => {
      console.log('Purchase Order:', purchaseOrderData);
      alert('Purchase order created successfully!');
      setShowPurchaseOrderModal(false);
    };
  
    const addPOItem = () => {
      setPurchaseOrderData({
        ...purchaseOrderData,
        items: [...purchaseOrderData.items, { productName: '', quantity: '', unitPrice: '', totalPrice: '' }]
      });
    };
  
    const removePOItem = (index: number) => {
      if (purchaseOrderData.items.length > 1) {
        const newItems = purchaseOrderData.items.filter((_, i) => i !== index);
        setPurchaseOrderData({ ...purchaseOrderData, items: newItems });
      }
    };
  
    const handlePOItemChange = (index: number, field: string, value: string) => {
      const newItems = [...purchaseOrderData.items];
      newItems[index] = { ...newItems[index], [field]: value };
      
      if (field === 'quantity' || field === 'unitPrice') {
        const quantity = parseFloat(newItems[index].quantity) || 0;
        const unitPrice = parseFloat(newItems[index].unitPrice) || 0;
        newItems[index].totalPrice = (quantity * unitPrice).toFixed(2);
      }
      
      setPurchaseOrderData({ ...purchaseOrderData, items: newItems });
    };
  
    // Charts
    const SupplierCategoryChart = () => {
      const renderLabel = (entry: any) => {
        const total = categoryData.reduce((sum, item) => sum + item.value, 0);
        const percent = ((entry.value / total) * 100).toFixed(0);
        return `${percent}%`;
      };
  
      return (
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={categoryData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={5}
              dataKey="value"
              label={renderLabel}
            >
              {categoryData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      );
    };
  
    const SpendingTrendChart = () => (
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={spendingTrendData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip formatter={(value) => `£${value}`} />
          <Line type="monotone" dataKey="amount" stroke="#0d6efd" strokeWidth={2} name="Spending" />
        </LineChart>
      </ResponsiveContainer>
    );
  
    // Modals
    const AddSupplierModal = () => (
      <Modal show={showAddSupplierModal} onHide={() => setShowAddSupplierModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Add New Supplier</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          <Form>
            <h6 className="mb-3">Basic Information</h6>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Supplier Name *</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter supplier name"
                    value={supplierFormData.name}
                    onChange={(e) => setSupplierFormData({ ...supplierFormData, name: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Supplier Code *</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="e.g., SUP-001"
                    value={supplierFormData.code}
                    onChange={(e) => setSupplierFormData({ ...supplierFormData, code: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email *</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="supplier@example.com"
                    value={supplierFormData.email}
                    onChange={(e) => setSupplierFormData({ ...supplierFormData, email: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Phone *</Form.Label>
                  <Form.Control
                    type="tel"
                    placeholder="+44 20 1234 5678"
                    value={supplierFormData.phone}
                    onChange={(e) => setSupplierFormData({ ...supplierFormData, phone: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Category *</Form.Label>
                  <Form.Select
                    value={supplierFormData.category}
                    onChange={(e) => setSupplierFormData({ ...supplierFormData, category: e.target.value })}
                  >
                    <option value="">Select category</option>
                    <option value="Hardware">Hardware</option>
                    <option value="Software">Software</option>
                    <option value="Services">Services</option>
                    <option value="Other">Other</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Contact Person</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Contact person name"
                    value={supplierFormData.contactPerson}
                    onChange={(e) => setSupplierFormData({ ...supplierFormData, contactPerson: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>
  
            <h6 className="mb-3 mt-4">Address Information</h6>
            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Address</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Street address"
                    value={supplierFormData.address}
                    onChange={(e) => setSupplierFormData({ ...supplierFormData, address: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>City</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="City"
                    value={supplierFormData.city}
                    onChange={(e) => setSupplierFormData({ ...supplierFormData, city: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Country *</Form.Label>
                  <Form.Select
                    value={supplierFormData.country}
                    onChange={(e) => setSupplierFormData({ ...supplierFormData, country: e.target.value })}
                  >
                    <option value="">Select country</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="United States">United States</option>
                    <option value="China">China</option>
                    <option value="Germany">Germany</option>
                    <option value="Other">Other</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Postal Code</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Postal code"
                    value={supplierFormData.postalCode}
                    onChange={(e) => setSupplierFormData({ ...supplierFormData, postalCode: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Tax ID</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Tax identification number"
                    value={supplierFormData.taxId}
                    onChange={(e) => setSupplierFormData({ ...supplierFormData, taxId: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>
  
            <h6 className="mb-3 mt-4">Business Terms</h6>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Payment Terms</Form.Label>
                  <Form.Select
                    value={supplierFormData.paymentTerms}
                    onChange={(e) => setSupplierFormData({ ...supplierFormData, paymentTerms: e.target.value })}
                  >
                    <option value="">Select payment terms</option>
                    <option value="Net 15">Net 15</option>
                    <option value="Net 30">Net 30</option>
                    <option value="Net 45">Net 45</option>
                    <option value="Net 60">Net 60</option>
                    <option value="Due on Receipt">Due on Receipt</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Lead Time</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="e.g., 7-10 days"
                    value={supplierFormData.leadTime}
                    onChange={(e) => setSupplierFormData({ ...supplierFormData, leadTime: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Notes</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="Additional notes about the supplier..."
                    value={supplierFormData.notes}
                    onChange={(e) => setSupplierFormData({ ...supplierFormData, notes: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowAddSupplierModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleAddSupplier}
            disabled={!supplierFormData.name || !supplierFormData.code || !supplierFormData.email || !supplierFormData.country}
          >
            Add Supplier
          </Button>
        </Modal.Footer>
      </Modal>
    );
  
    const ViewSupplierModal = () => (
      <Modal show={showViewSupplierModal} onHide={() => setShowViewSupplierModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Supplier Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedSupplier && (
            <div>
              <Row className="mb-4">
                <Col md={8}>
                  <h5 className="mb-3">{selectedSupplier.name}</h5>
                  <div className="mb-2">
                    <Badge bg="light" text="dark" className="me-2">{selectedSupplier.code}</Badge>
                    <Badge bg={selectedSupplier.status === 'Active' ? 'success' : 'secondary'} className="bg-opacity-10 text-dark">
                      {selectedSupplier.status}
                    </Badge>
                  </div>
                </Col>
                <Col md={4} className="text-end">
                  <div className="mb-2">
                    <Star className="text-warning" size={16} fill="currentColor" />
                    <span className="ms-1 fw-semibold">{selectedSupplier.rating}/5.0</span>
                  </div>
                  <small className="text-muted">{selectedSupplier.category}</small>
                </Col>
              </Row>
  
              <Row className="mb-4">
                <Col md={6}>
                  <h6 className="text-muted mb-3">Contact Information</h6>
                  <div className="mb-2">
                    <Mail size={16} className="me-2 text-muted" />
                    <small>{selectedSupplier.email}</small>
                  </div>
                  <div className="mb-2">
                    <Phone size={16} className="me-2 text-muted" />
                    <small>{selectedSupplier.phone}</small>
                  </div>
                  <div className="mb-2">
                    <MapPin size={16} className="me-2 text-muted" />
                    <small>{selectedSupplier.address}, {selectedSupplier.country}</small>
                  </div>
                </Col>
                <Col md={6}>
                  <h6 className="text-muted mb-3">Business Information</h6>
                  <div className="mb-2">
                    <small className="text-muted">Payment Terms:</small>
                    <span className="ms-2 fw-semibold">{selectedSupplier.paymentTerms}</span>
                  </div>
                  <div className="mb-2">
                    <small className="text-muted">Lead Time:</small>
                    <span className="ms-2 fw-semibold">{selectedSupplier.leadTime}</span>
                  </div>
                  <div className="mb-2">
                    <small className="text-muted">Last Order:</small>
                    <span className="ms-2 fw-semibold">{selectedSupplier.lastOrderDate}</span>
                  </div>
                </Col>
              </Row>
  
              <Row className="mb-4">
                <Col md={3}>
                  <Card className="border">
                    <Card.Body className="text-center">
                      <Package size={24} className="text-primary mb-2" />
                      <h4 className="mb-1">{selectedSupplier.productsSupplied}</h4>
                      <small className="text-muted">Products</small>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="border">
                    <Card.Body className="text-center">
                      <TrendingUp size={24} className="text-success mb-2" />
                      <h4 className="mb-1">{selectedSupplier.totalOrders}</h4>
                      <small className="text-muted">Orders</small>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card className="border">
                    <Card.Body className="text-center">
                      <DollarSign size={24} className="text-info mb-2" />
                      <h4 className="mb-1">£{selectedSupplier.totalSpent.toLocaleString()}</h4>
                      <small className="text-muted">Total Spent</small>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
  
              <div className="d-flex gap-2">
                <Button variant="primary" className="flex-grow-1">
                  <Edit size={16} className="me-2" />
                  Edit Supplier
                </Button>
                <Button variant="outline-primary">
                  Create Purchase Order
                </Button>
              </div>
            </div>
          )}
        </Modal.Body>
      </Modal>
    );
  
    const PurchaseOrderModal = () => (
      <Modal show={showPurchaseOrderModal} onHide={() => setShowPurchaseOrderModal(false)} size="xl" centered>
        <Modal.Header closeButton>
          <Modal.Title>Create Purchase Order</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          <Form>
            <Row className="mb-4">
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Supplier *</Form.Label>
                  <Form.Select
                    value={purchaseOrderData.supplierId}
                    onChange={(e) => setPurchaseOrderData({ ...purchaseOrderData, supplierId: e.target.value })}
                  >
                    <option value="">Select supplier</option>
                    {suppliers.filter(s => s.status === 'Active').map(supplier => (
                      <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Order Date *</Form.Label>
                  <Form.Control
                    type="date"
                    value={purchaseOrderData.orderDate}
                    onChange={(e) => setPurchaseOrderData({ ...purchaseOrderData, orderDate: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Expected Delivery *</Form.Label>
                  <Form.Control
                    type="date"
                    value={purchaseOrderData.expectedDelivery}
                    onChange={(e) => setPurchaseOrderData({ ...purchaseOrderData, expectedDelivery: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>
  
            <h6 className="mb-3">Order Items</h6>
            <Table bordered>
              <thead className="bg-light">
                <tr>
                  <th style={{ width: '35%' }}>Product Name</th>
                  <th style={{ width: '15%' }}>Quantity</th>
                  <th style={{ width: '20%' }}>Unit Price (£)</th>
                  <th style={{ width: '20%' }}>Total (£)</th>
                  <th style={{ width: '10%' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {purchaseOrderData.items.map((item, index) => (
                  <tr key={index}>
                    <td>
                      <Form.Control
                        size="sm"
                        type="text"
                        placeholder="Product name"
                        value={item.productName}
                        onChange={(e) => handlePOItemChange(index, 'productName', e.target.value)}
                      />
                    </td>
                    <td>
                      <Form.Control
                        size="sm"
                        type="number"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => handlePOItemChange(index, 'quantity', e.target.value)}
                      />
                    </td>
                    <td>
                      <Form.Control
                        size="sm"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={item.unitPrice}
                        onChange={(e) => handlePOItemChange(index, 'unitPrice', e.target.value)}
                      />
                    </td>
                    <td>
                      <Form.Control
                        size="sm"
                        type="text"
                        value={item.totalPrice}
                        disabled
                        className="bg-light"
                      />
                    </td>
                    <td className="text-center">
                      {purchaseOrderData.items.length > 1 && (
                        <Button
                          variant="link"
                          size="sm"
                          className="text-danger p-0"
                          onClick={() => removePOItem(index)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <Button variant="outline-primary" size="sm" onClick={addPOItem}>
              <Plus size={16} className="me-1" />
              Add Item
            </Button>
  
            <Row className="mt-4">
              <Col md={8}>
                <Form.Group className="mb-3">
                  <Form.Label>Notes</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="Order notes..."
                    value={purchaseOrderData.notes}
                    onChange={(e) => setPurchaseOrderData({ ...purchaseOrderData, notes: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Card className="border">
                  <Card.Body>
                    <div className="d-flex justify-content-between mb-2">
                      <span>Subtotal:</span>
                      <span className="fw-semibold">
                        £{purchaseOrderData.items.reduce((sum, item) => sum + (parseFloat(item.totalPrice) || 0), 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span>Shipping:</span>
                      <Form.Control
                        size="sm"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={purchaseOrderData.shippingCost}
                        onChange={(e) => setPurchaseOrderData({ ...purchaseOrderData, shippingCost: e.target.value })}
                        style={{ width: '100px' }}
                      />
                    </div>
                    <hr />
                    <div className="d-flex justify-content-between">
                      <span className="fw-bold">Total:</span>
                      <span className="fw-bold h5 text-primary mb-0">
                        £{(
                          purchaseOrderData.items.reduce((sum, item) => sum + (parseFloat(item.totalPrice) || 0), 0) +
                          (parseFloat(purchaseOrderData.shippingCost) || 0)
                        ).toFixed(2)}
                      </span>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowPurchaseOrderModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleCreatePurchaseOrder}>
            Create Purchase Order
          </Button>
        </Modal.Footer>
      </Modal>
    );
  
    return (
      <div>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="mb-1">Supplier Management</h2>
            <p className="text-muted mb-0">Manage your supplier network and purchase orders</p>
          </div>
          <div className="d-flex gap-2">
            <Button variant="outline-primary" onClick={() => setShowPurchaseOrderModal(true)}>
              <Package size={16} className="me-2" />
              Create PO
            </Button>
            <Button variant="primary" onClick={() => setShowAddSupplierModal(true)}>
              <Plus size={16} className="me-2" />
              Add Supplier
            </Button>
          </div>
        </div>
  
        {/* Summary Cards */}
        <Row className="mb-4">
          {summaryCards.map((card, index) => (
            <Col lg={3} md={6} key={index} className="mb-3">
              <Card>
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div className={`bg-${card.color} bg-opacity-10 rounded p-3`}>
                      <div className={`text-${card.color}`}>{card.icon}</div>
                    </div>
                  </div>
                  <h3 className="mb-1">{card.value}</h3>
                  <p className="text-muted mb-0 small">{card.title}</p>
                  <small className="text-muted">{card.change}</small>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
  
        {/* Charts */}
        <Row className="mb-4">
          <Col lg={6} className="mb-4">
            <Card>
              <Card.Body>
                <h5 className="mb-4">Suppliers by Category</h5>
                <SupplierCategoryChart />
              </Card.Body>
            </Card>
          </Col>
          <Col lg={6} className="mb-4">
            <Card>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h5 className="mb-0">Spending Trend</h5>
                  <Form.Select size="sm" style={{ width: '150px' }}>
                    <option>Last 6 months</option>
                    <option>Last 12 months</option>
                    <option>This year</option>
                  </Form.Select>
                </div>
                <SpendingTrendChart />
              </Card.Body>
            </Card>
          </Col>
        </Row>
  
        {/* Filters */}
        <Card className="mb-4">
          <Card.Body>
            <Row className="align-items-center">
              <Col md={3}>
                <Form.Control type="search" placeholder="Search suppliers..." />
              </Col>
              <Col md={2}>
                <Form.Select>
                  <option>All Categories</option>
                  <option>Hardware</option>
                  <option>Software</option>
                  <option>Services</option>
                  <option>Other</option>
                </Form.Select>
              </Col>
              <Col md={2}>
                <Form.Select>
                  <option>All Countries</option>
                  <option>United Kingdom</option>
                  <option>United States</option>
                  <option>China</option>
                  <option>Germany</option>
                </Form.Select>
              </Col>
              <Col md={2}>
                <Form.Select>
                  <option>All Status</option>
                  <option>Active</option>
                  <option>Inactive</option>
                  <option>Pending</option>
                </Form.Select>
              </Col>
              <Col md={2}>
                <Form.Select>
                  <option>Sort by: Name</option>
                  <option>Total Spent</option>
                  <option>Rating</option>
                  <option>Recent Order</option>
                </Form.Select>
              </Col>
              <Col md={1}>
                <Button variant="outline-primary" className="w-100">
                  <Filter size={16} />
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>
  
        {/* Suppliers Table */}
        <Card className="mb-4">
          <Card.Body>
            <h5 className="mb-4">All Suppliers</h5>
            <Table responsive hover>
              <thead className="bg-light">
                <tr>
                  <th>Code</th>
                  <th>Supplier Name</th>
                  <th>Category</th>
                  <th>Contact</th>
                  <th>Products</th>
                  <th>Total Orders</th>
                  <th>Total Spent</th>
                  <th>Rating</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map((supplier) => (
                  <tr key={supplier.id}>
                    <td className="fw-semibold">{supplier.code}</td>
                    <td>
                      <div>
                        <div className="fw-semibold">{supplier.name}</div>
                        <small className="text-muted">{supplier.country}</small>
                      </div>
                    </td>
                    <td>
                      <Badge bg="light" text="dark" className="fw-normal">
                        {supplier.category}
                      </Badge>
                    </td>
                    <td>
                      <div className="small">
                        <div><Mail size={12} className="me-1" />{supplier.email}</div>
                        <div className="text-muted"><Phone size={12} className="me-1" />{supplier.phone}</div>
                      </div>
                    </td>
                    <td className="text-center">{supplier.productsSupplied}</td>
                    <td className="text-center">{supplier.totalOrders}</td>
                    <td className="fw-semibold">£{supplier.totalSpent.toLocaleString()}</td>
                    <td>
                      <div className="d-flex align-items-center">
                        <Star size={14} className="text-warning me-1" fill="currentColor" />
                        <span className="fw-semibold">{supplier.rating}</span>
                      </div>
                    </td>
                    <td>
                      <Badge bg={
                        supplier.status === 'Active' ? 'success' : 
                        supplier.status === 'Pending' ? 'warning' : 'secondary'
                      } className="bg-opacity-10 text-dark">
                        {supplier.status}
                      </Badge>
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <Button 
                          variant="link" 
                          size="sm" 
                          className="p-1"
                          title="View Details"
                          onClick={() => handleViewSupplier(supplier)}
                        >
                          <Eye size={16} />
                        </Button>
                        <Button 
                          variant="link" 
                          size="sm" 
                          className="p-1"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </Button>
                        <Button 
                          variant="link" 
                          size="sm" 
                          className="p-1 text-danger"
                          title="Delete"
                        >
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
  
        {/* Purchase Orders */}
        <Card>
          <Card.Body>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="mb-0">Recent Purchase Orders</h5>
              <Button variant="link" size="sm">View All</Button>
            </div>
            <Table responsive hover>
              <thead className="bg-light">
                <tr>
                  <th>PO Number</th>
                  <th>Supplier</th>
                  <th>Order Date</th>
                  <th>Expected Delivery</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {purchaseOrders.map((po) => (
                  <tr key={po.id}>
                    <td className="fw-semibold">{po.id}</td>
                    <td>{po.supplier}</td>
                    <td>{po.date}</td>
                    <td>{po.expectedDelivery}</td>
                    <td className="fw-semibold">£{po.totalAmount.toLocaleString()}</td>
                    <td>
                      <Badge bg={
                        po.status === 'Delivered' ? 'success' : 
                        po.status === 'Shipped' ? 'info' :
                        po.status === 'Confirmed' ? 'primary' :
                        po.status === 'Pending' ? 'warning' : 'danger'
                      } className="bg-opacity-10 text-dark">
                        {po.status}
                      </Badge>
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <Button variant="link" size="sm" className="p-1" title="View">
                          <Eye size={16} />
                        </Button>
                        <Button variant="link" size="sm" className="p-1" title="Download">
                          <Download size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
  
        {/* Modals */}
        {AddSupplierModal()}
        {ViewSupplierModal()}
        {PurchaseOrderModal()}
      </div>
    );
  };
  
  const renderInventory = () => {
    // States
   
  
    // Sample Data
    const inventoryData: InventoryItem[] = [
      { 
        id: 1, 
        sku: 'UCASS-GW-16', 
        productName: 'UCASS- Gateway 16 Channel', 
        category: 'Gateway', 
        currentStock: 45, 
        reorderLevel: 20, 
        maxStock: 100, 
        warehouse: 'Main Warehouse', 
        unitPrice: 250, 
        totalValue: 11250, 
        lastUpdated: '2024-10-15', 
        status: 'In Stock' 
      },
      { 
        id: 2, 
        sku: 'UCASS-AP-001', 
        productName: 'UCASS- Advance Policy', 
        category: 'Policy', 
        currentStock: 12, 
        reorderLevel: 15, 
        maxStock: 50, 
        warehouse: 'Main Warehouse', 
        unitPrice: 180, 
        totalValue: 2160, 
        lastUpdated: '2024-10-14', 
        status: 'Low Stock' 
      },
      { 
        id: 3, 
        sku: 'UCASS-SLA-PRO', 
        productName: 'UCASS-SLA Premium', 
        category: 'SLA', 
        currentStock: 0, 
        reorderLevel: 10, 
        maxStock: 30, 
        warehouse: 'Main Warehouse', 
        unitPrice: 350, 
        totalValue: 0, 
        lastUpdated: '2024-10-10', 
        status: 'Out of Stock' 
      },
      { 
        id: 4, 
        sku: 'UCASS-BAS-001', 
        productName: 'UCASS-Basic', 
        category: 'Basic Services', 
        currentStock: 78, 
        reorderLevel: 25, 
        maxStock: 100, 
        warehouse: 'Secondary Warehouse', 
        unitPrice: 120, 
        totalValue: 9360, 
        lastUpdated: '2024-10-15', 
        status: 'In Stock' 
      },
      { 
        id: 5, 
        sku: 'UCASS-ENT-SUI', 
        productName: 'UCASS- Enterprise Suite', 
        category: 'Advanced Services', 
        currentStock: 8, 
        reorderLevel: 10, 
        maxStock: 40, 
        warehouse: 'Main Warehouse', 
        unitPrice: 500, 
        totalValue: 4000, 
        lastUpdated: '2024-10-12', 
        status: 'Low Stock' 
      }
    ];
  
    const stockMovements: StockMovement[] = [
      { id: 1, date: '2024-10-15 14:30', type: 'In', productName: 'UCASS- Gateway 16 Channel', quantity: 25, reason: 'Purchase Order #PO-1234', performedBy: 'John Admin' },
      { id: 2, date: '2024-10-15 12:15', type: 'Out', productName: 'UCASS-Basic', quantity: 10, reason: 'Order #ORD-2845', performedBy: 'System' },
      { id: 3, date: '2024-10-14 16:45', type: 'Adjustment', productName: 'UCASS- Advance Policy', quantity: -3, reason: 'Damaged items', performedBy: 'Sarah Manager' },
      { id: 4, date: '2024-10-14 10:20', type: 'Out', productName: 'UCASS-SLA Premium', quantity: 5, reason: 'Order #ORD-2844', performedBy: 'System' },
      { id: 5, date: '2024-10-13 15:00', type: 'In', productName: 'UCASS- Enterprise Suite', quantity: 15, reason: 'Purchase Order #PO-1233', performedBy: 'John Admin' }
    ];
  
    const summaryCards = [
      { title: 'Total Products', value: '48', icon: <Package size={24} />, color: 'primary', change: '+5 this month' },
      { title: 'Total Stock Value', value: '£126,850', icon: <TrendingUp size={24} />, color: 'success', change: '+12.5%' },
      { title: 'Low Stock Items', value: '8', icon: <AlertTriangle size={24} />, color: 'warning', change: 'Needs attention' },
      { title: 'Out of Stock', value: '3', icon: <TrendingDown size={24} />, color: 'danger', change: 'Reorder now' }
    ];
  
    const warehouseData = [
      { name: 'Main Warehouse', stock: 850, percentage: 68, color: '#0d6efd' },
      { name: 'Secondary Warehouse', stock: 320, percentage: 26, color: '#198754' },
      { name: 'Returns Center', stock: 75, percentage: 6, color: '#ffc107' }
    ];
  
    const categoryStockData = [
      { category: 'Gateway', stock: 145 },
      { category: 'Policy', stock: 89 },
      { category: 'SLA', stock: 45 },
      { category: 'Basic Services', stock: 234 },
      { category: 'Advanced Services', stock: 98 }
    ];
  
    // Handlers
    const handleAddStock = () => {
      console.log('Add Stock:', stockFormData);
      alert('Stock added successfully!');
      setShowAddStockModal(false);
      setStockFormData({ productId: '', quantity: '', warehouse: '', reason: '', notes: '' });
    };
  
    const handleAdjustStock = () => {
      console.log('Adjust Stock:', adjustmentFormData);
      alert('Stock adjusted successfully!');
      setShowAdjustStockModal(false);
      setAdjustmentFormData({ adjustmentType: 'Add', quantity: '', reason: '', notes: '' });
    };
  
    const handleViewHistory = (product: InventoryItem) => {
      setSelectedProduct(product);
      setShowStockHistoryModal(true);
    };
  
    // Charts
    const WarehouseStockChart = () => {
      const renderLabel = (entry: any) => {
        return `${entry.percentage}%`;
      };
  
      return (
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={warehouseData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={5}
              dataKey="stock"
              label={renderLabel}
            >
              {warehouseData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      );
    };
  
    const CategoryStockChart = () => (
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={categoryStockData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="category" angle={-45} textAnchor="end" height={80} />
          <YAxis />
          <Tooltip />
          <Bar dataKey="stock" fill="#0d6efd" name="Stock Quantity" />
        </BarChart>
      </ResponsiveContainer>
    );
  
    // Modals
    const AddStockModal = () => (
      <Modal show={showAddStockModal} onHide={() => setShowAddStockModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Add Stock</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Product *</Form.Label>
              <Form.Select
                value={stockFormData.productId}
                onChange={(e) => setStockFormData({ ...stockFormData, productId: e.target.value })}
              >
                <option value="">Select product</option>
                {inventoryData.map(item => (
                  <option key={item.id} value={item.id}>{item.productName} ({item.sku})</option>
                ))}
              </Form.Select>
            </Form.Group>
  
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Quantity *</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="Enter quantity"
                    value={stockFormData.quantity}
                    onChange={(e) => setStockFormData({ ...stockFormData, quantity: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Warehouse *</Form.Label>
                  <Form.Select
                    value={stockFormData.warehouse}
                    onChange={(e) => setStockFormData({ ...stockFormData, warehouse: e.target.value })}
                  >
                    <option value="">Select warehouse</option>
                    <option value="Main Warehouse">Main Warehouse</option>
                    <option value="Secondary Warehouse">Secondary Warehouse</option>
                    <option value="Returns Center">Returns Center</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
  
            <Form.Group className="mb-3">
              <Form.Label>Reason *</Form.Label>
              <Form.Select
                value={stockFormData.reason}
                onChange={(e) => setStockFormData({ ...stockFormData, reason: e.target.value })}
              >
                <option value="">Select reason</option>
                <option value="Purchase Order">Purchase Order</option>
                <option value="Return from Customer">Return from Customer</option>
                <option value="Transfer from Another Warehouse">Transfer from Another Warehouse</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="Other">Other</option>
              </Form.Select>
            </Form.Group>
  
            <Form.Group className="mb-3">
              <Form.Label>Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Additional notes..."
                value={stockFormData.notes}
                onChange={(e) => setStockFormData({ ...stockFormData, notes: e.target.value })}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowAddStockModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleAddStock}
            disabled={!stockFormData.productId || !stockFormData.quantity || !stockFormData.warehouse || !stockFormData.reason}
          >
            <ArrowUpCircle size={16} className="me-1" />
            Add Stock
          </Button>
        </Modal.Footer>
      </Modal>
    );
  
    const AdjustStockModal = () => (
      <Modal show={showAdjustStockModal} onHide={() => setShowAdjustStockModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Stock Adjustment</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="info" className="mb-3">
            <small>Use this to correct inventory discrepancies or record damages/losses.</small>
          </Alert>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Adjustment Type *</Form.Label>
              <Form.Select
                value={adjustmentFormData.adjustmentType}
                onChange={(e) => setAdjustmentFormData({ ...adjustmentFormData, adjustmentType: e.target.value })}
              >
                <option value="Add">Add Stock</option>
                <option value="Remove">Remove Stock</option>
              </Form.Select>
            </Form.Group>
  
            <Form.Group className="mb-3">
              <Form.Label>Quantity *</Form.Label>
              <Form.Control
                type="number"
                placeholder="Enter quantity"
                value={adjustmentFormData.quantity}
                onChange={(e) => setAdjustmentFormData({ ...adjustmentFormData, quantity: e.target.value })}
              />
            </Form.Group>
  
            <Form.Group className="mb-3">
              <Form.Label>Reason *</Form.Label>
              <Form.Select
                value={adjustmentFormData.reason}
                onChange={(e) => setAdjustmentFormData({ ...adjustmentFormData, reason: e.target.value })}
              >
                <option value="">Select reason</option>
                <option value="Damaged Items">Damaged Items</option>
                <option value="Lost/Stolen">Lost/Stolen</option>
                <option value="Expired">Expired</option>
                <option value="Inventory Count Correction">Inventory Count Correction</option>
                <option value="Quality Issues">Quality Issues</option>
                <option value="Other">Other</option>
              </Form.Select>
            </Form.Group>
  
            <Form.Group className="mb-3">
              <Form.Label>Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                placeholder="Additional details..."
                value={adjustmentFormData.notes}
                onChange={(e) => setAdjustmentFormData({ ...adjustmentFormData, notes: e.target.value })}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowAdjustStockModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleAdjustStock}
            disabled={!adjustmentFormData.quantity || !adjustmentFormData.reason}
          >
            Save Adjustment
          </Button>
        </Modal.Footer>
      </Modal>
    );
  
    const StockHistoryModal = () => (
      <Modal show={showStockHistoryModal} onHide={() => setShowStockHistoryModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Stock Movement History</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedProduct && (
            <div className="mb-4">
              <h6 className="mb-2">{selectedProduct.productName}</h6>
              <div className="d-flex gap-3">
                <small className="text-muted">SKU: {selectedProduct.sku}</small>
                <small className="text-muted">Current Stock: <strong>{selectedProduct.currentStock}</strong></small>
              </div>
            </div>
          )}
          
          <Table responsive hover>
            <thead className="bg-light">
              <tr>
                <th>Date/Time</th>
                <th>Type</th>
                <th>Quantity</th>
                <th>Reason</th>
                <th>Performed By</th>
              </tr>
            </thead>
            <tbody>
              {stockMovements.slice(0, 10).map((movement) => (
                <tr key={movement.id}>
                  <td className="small">{movement.date}</td>
                  <td>
                    <Badge bg={
                      movement.type === 'In' ? 'success' : 
                      movement.type === 'Out' ? 'primary' : 'warning'
                    } className="bg-opacity-10 text-dark">
                      {movement.type === 'In' ? <ArrowUpCircle size={12} /> : 
                       movement.type === 'Out' ? <ArrowDownCircle size={12} /> : '⚙️'}
                      {' '}{movement.type}
                    </Badge>
                  </td>
                  <td className={`fw-semibold ${movement.quantity > 0 ? 'text-success' : 'text-danger'}`}>
                    {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                  </td>
                  <td className="small">{movement.reason}</td>
                  <td className="small">{movement.performedBy}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-primary">
            <Download size={16} className="me-1" />
            Export History
          </Button>
          <Button variant="secondary" onClick={() => setShowStockHistoryModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    );
  
    return (
      <div>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="mb-1">Inventory Management</h2>
            <p className="text-muted mb-0">Monitor and manage your stock levels</p>
          </div>
          <div className="d-flex gap-2">
            <Button variant="outline-primary">
              <Download size={16} className="me-2" />
              Export
            </Button>
            <Button variant="primary" onClick={() => setShowAddStockModal(true)}>
              <Plus size={16} className="me-2" />
              Add Stock
            </Button>
          </div>
        </div>
  
        {/* Summary Cards */}
        <Row className="mb-4">
          {summaryCards.map((card, index) => (
            <Col lg={3} md={6} key={index} className="mb-3">
              <Card>
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div className={`bg-${card.color} bg-opacity-10 rounded p-3`}>
                      <div className={`text-${card.color}`}>{card.icon}</div>
                    </div>
                  </div>
                  <h3 className="mb-1">{card.value}</h3>
                  <p className="text-muted mb-0 small">{card.title}</p>
                  <small className="text-muted">{card.change}</small>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
  
        {/* Low Stock Alert */}
        {inventoryData.filter(item => item.status === 'Low Stock' || item.status === 'Out of Stock').length > 0 && (
          <Alert variant="warning" className="mb-4">
            <div className="d-flex align-items-center">
              <AlertTriangle size={20} className="me-2" />
              <div>
                <strong>Attention Required:</strong> You have {inventoryData.filter(item => item.status === 'Low Stock').length} low stock items and {inventoryData.filter(item => item.status === 'Out of Stock').length} out of stock items. Please reorder soon.
              </div>
            </div>
          </Alert>
        )}
  
        {/* Charts */}
        <Row className="mb-4">
          <Col lg={6} className="mb-4">
            <Card>
              <Card.Body>
                <h5 className="mb-4">Stock by Warehouse</h5>
                <WarehouseStockChart />
              </Card.Body>
            </Card>
          </Col>
          <Col lg={6} className="mb-4">
            <Card>
              <Card.Body>
                <h5 className="mb-4">Stock by Category</h5>
                <CategoryStockChart />
              </Card.Body>
            </Card>
          </Col>
        </Row>
  
        {/* Filters */}
        <Card className="mb-4">
          <Card.Body>
            <Row className="align-items-center">
              <Col md={3}>
                <Form.Control type="search" placeholder="Search products..." />
              </Col>
              <Col md={2}>
                <Form.Select>
                  <option>All Categories</option>
                  <option>Gateway</option>
                  <option>Policy</option>
                  <option>SLA</option>
                  <option>Basic Services</option>
                </Form.Select>
              </Col>
              <Col md={2}>
                <Form.Select>
                  <option>All Warehouses</option>
                  <option>Main Warehouse</option>
                  <option>Secondary Warehouse</option>
                  <option>Returns Center</option>
                </Form.Select>
              </Col>
              <Col md={2}>
                <Form.Select>
                  <option>All Status</option>
                  <option>In Stock</option>
                  <option>Low Stock</option>
                  <option>Out of Stock</option>
                </Form.Select>
              </Col>
              <Col md={2}>
                <Button variant="outline-primary" className="w-100">
                  <Filter size={16} className="me-2" />
                  Apply
                </Button>
              </Col>
              <Col md={1}>
                <Button variant="outline-secondary" className="w-100" title="Stock History">
                  <BarChart3 size={16} />
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>
  
        {/* Inventory Table */}
        <Card>
          <Card.Body>
            <Table responsive hover>
              <thead className="bg-light">
                <tr>
                  <th>SKU</th>
                  <th>Product Name</th>
                  <th>Category</th>
                  <th>Current Stock</th>
                  <th>Reorder Level</th>
                  <th>Warehouse</th>
                  <th>Unit Price</th>
                  <th>Total Value</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {inventoryData.map((item) => (
                  <tr key={item.id}>
                    <td className="fw-semibold">{item.sku}</td>
                    <td>{item.productName}</td>
                    <td>
                      <Badge bg="light" text="dark" className="fw-normal">
                        {item.category}
                      </Badge>
                    </td>
                    <td>
                      <div>
                        <span className={`fw-semibold ${
                          item.currentStock <= item.reorderLevel ? 'text-danger' : 
                          item.currentStock < item.maxStock * 0.3 ? 'text-warning' : 'text-success'
                        }`}>
                          {item.currentStock}
                        </span>
                        <div style={{ width: '100px' }}>
                          <ProgressBar 
                            now={(item.currentStock / item.maxStock) * 100} 
                            variant={
                              item.currentStock <= item.reorderLevel ? 'danger' : 
                              item.currentStock < item.maxStock * 0.3 ? 'warning' : 'success'
                            }
                            style={{ height: '4px' }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="text-muted">{item.reorderLevel}</td>
                    <td>
                      <small className="text-muted">
                        <Warehouse size={14} className="me-1" />
                        {item.warehouse}
                      </small>
                    </td>
                    <td>£{item.unitPrice.toFixed(2)}</td>
                    <td className="fw-semibold">£{item.totalValue.toFixed(2)}</td>
                    <td>
                      <Badge bg={
                        item.status === 'In Stock' ? 'success' : 
                        item.status === 'Low Stock' ? 'warning' : 'danger'
                      } className="bg-opacity-10 text-dark">
                        {item.status}
                      </Badge>
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <Button 
                          variant="link" 
                          size="sm" 
                          className="p-1" 
                          title="View History"
                          onClick={() => handleViewHistory(item)}
                        >
                          <Eye size={16} />
                        </Button>
                        <Button 
                          variant="link" 
                          size="sm" 
                          className="p-1" 
                          title="Adjust Stock"
                          onClick={() => {
                            setSelectedProduct(item);
                            setShowAdjustStockModal(true);
                          }}
                        >
                          <Edit size={16} />
                        </Button>
                        <Button 
                          variant="link" 
                          size="sm" 
                          className="p-1 text-success" 
                          title="Add Stock"
                          onClick={() => {
                            setStockFormData({ ...stockFormData, productId: item.id.toString() });
                            setShowAddStockModal(true);
                          }}
                        >
                          <ArrowUpCircle size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
  
        {/* Recent Stock Movements */}
        <Card className="mt-4">
          <Card.Body>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="mb-0">Recent Stock Movements</h5>
              <Button variant="link" size="sm">View All</Button>
            </div>
            <Table responsive hover>
              <thead className="bg-light">
                <tr>
                  <th>Date/Time</th>
                  <th>Type</th>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Reason</th>
                  <th>Performed By</th>
                </tr>
              </thead>
              <tbody>
                {stockMovements.slice(0, 5).map((movement) => (
                  <tr key={movement.id}>
                    <td className="small">{movement.date}</td>
                    <td>
                      <Badge bg={
                        movement.type === 'In' ? 'success' : 
                        movement.type === 'Out' ? 'primary' : 'warning'
                      } className="bg-opacity-10 text-dark">
                        {movement.type === 'In' ? <ArrowUpCircle size={12} /> : 
                         movement.type === 'Out' ? <ArrowDownCircle size={12} /> : '⚙️'}
                        {' '}{movement.type}
                      </Badge>
                    </td>
                    <td>{movement.productName}</td>
                    <td className={`fw-semibold ${movement.quantity > 0 ? 'text-success' : 'text-danger'}`}>
                      {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                    </td>
                    <td className="small">{movement.reason}</td>
                    <td className="small">{movement.performedBy}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
  
        {/* Modals */}
        {AddStockModal()}
        {AdjustStockModal()}
        {StockHistoryModal()}
      </div>
    );
  };
  

  // Dashboard Screen
  const renderDashboard = () => {
    const kpiData = [
      { title: 'Total Revenue', value: '£685,450', change: '+18.5%', isPositive: true, icon: <DollarSign size={24} />, color: 'primary' },
      { title: 'Active Resellers', value: '47', change: '+12.8%', isPositive: true, icon: <Store size={24} />, color: 'success' },
      { title: 'Total Orders', value: '1,247', change: '+22.3%', isPositive: true, icon: <ShoppingCart size={24} />, color: 'info' },
      { title: 'Total Customers', value: '2,845', change: '+15.7%', isPositive: true, icon: <Users size={24} />, color: 'warning' }
    ];

    const recentOrders = [
      { id: 'ORD-2845', reseller: 'Tech Distribution Ltd', customer: 'Acme Corp', product: 'Premium Suite', amount: '£2,499', status: 'Completed', date: '2024-10-14' },
      { id: 'ORD-2844', reseller: 'Digital Partners Inc', customer: 'Global Tech', product: 'Basic Plan', amount: '£899', status: 'Processing', date: '2024-10-14' },
      { id: 'ORD-2843', reseller: 'Smart Solutions', customer: 'Enterprise Co', product: 'Enterprise Suite', amount: '£5,999', status: 'Completed', date: '2024-10-13' },
      { id: 'ORD-2842', reseller: 'Cloud Resellers', customer: 'StartUp Ltd', product: 'Basic Plan', amount: '£899', status: 'Pending', date: '2024-10-13' },
      { id: 'ORD-2841', reseller: 'Tech Distribution Ltd', customer: 'Tech Corp', product: 'Premium Suite', amount: '£2,499', status: 'Completed', date: '2024-10-12' }
    ];

    const topResellers = [
      { name: 'Tech Distribution Ltd', sales: '£125,450', orders: 245, growth: '+25%' },
      { name: 'Digital Partners Inc', sales: '£98,320', orders: 198, growth: '+18%' },
      { name: 'Smart Solutions', sales: '£87,650', orders: 176, growth: '+22%' },
      { name: 'Cloud Resellers', sales: '£75,890', orders: 152, growth: '+15%' }
    ];

    return (
      <div>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="mb-1">Vendor Dashboard</h2>
            <p className="text-muted mb-0">Complete overview of your vendor operations and performance</p>
          </div>
          <Button variant="primary">
            <Download size={16} className="me-2" />
            Export Dashboard
          </Button>
        </div>

        {/* KPI Cards */}
        <Row className="mb-4">
          {kpiData.map((kpi, index) => (
            <Col lg={3} md={6} key={index} className="mb-3">
              <Card>
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div className={`bg-${kpi.color} bg-opacity-10 rounded p-3`}>
                      <div className={`text-${kpi.color}`}>{kpi.icon}</div>
                    </div>
                    <Badge bg={kpi.isPositive ? 'success' : 'danger'} className="bg-opacity-10">
                      {kpi.isPositive ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                      {kpi.change}
                    </Badge>
                  </div>
                  <h3 className="mb-1">{kpi.value}</h3>
                  <p className="text-muted mb-0 small">{kpi.title}</p>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>

        <Row>
          {/* Revenue Chart */}
          <Col lg={8} className="mb-4">
            <Card style={{ minHeight: '445px' }}>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h5 className="mb-0">Revenue & Profit Trends</h5>
                  <Form.Select size="sm" style={{ width: '150px' }}>
                    <option>Last 30 days</option>
                    <option>Last 3 months</option>
                    <option>Last 6 months</option>
                    <option>Last year</option>
                  </Form.Select>
                </div>
                <RevenueAreaChart />
              </Card.Body>
            </Card>
          </Col>

          {/* Order Status Distribution */}
          <Col lg={4} className="mb-4">
            <Card>
              <Card.Body>
                <h5 className="mb-4">Order Status Distribution</h5>
                <OrderStatusChart />
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row>
          {/* Recent Orders */}
          <Col lg={8} className="mb-4">
            <Card>
              <Card.Body>
                <h5 className="mb-4">Recent Orders</h5>
                <Table responsive hover>
                  <thead className="bg-light">
                    <tr>
                      <th>Order ID</th>
                      <th>Reseller</th>
                      <th>Customer</th>
                      <th>Product</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order) => (
                      <tr key={order.id}>
                        <td className="fw-semibold">{order.id}</td>
                        <td>{order.reseller}</td>
                        <td>{order.customer}</td>
                        <td>{order.product}</td>
                        <td className="fw-semibold">{order.amount}</td>
                        <td>
                          <Badge bg={
                            order.status === 'Completed' ? 'success' : 
                            order.status === 'Processing' ? 'info' : 'warning'
                          } className="bg-opacity-10 text-dark">
                            {order.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>

          {/* Top Resellers */}
          <Col lg={4} className="mb-4">
            <Card>
              <Card.Body>
                <h5 className="mb-4">Top Performing Resellers</h5>
                {topResellers.map((reseller, index) => (
                  <div key={index} className="mb-4 pb-3 border-bottom">
                    <div className="d-flex justify-content-between mb-2">
                      <span className="fw-semibold">{reseller.name}</span>
                      <Badge bg="success" className="bg-opacity-10 text-dark">
                        {reseller.growth}
                      </Badge>
                    </div>
                    <div className="d-flex justify-content-between">
                      <small className="text-muted">{reseller.orders} orders</small>
                      <small className="fw-semibold">{reseller.sales}</small>
                    </div>
                  </div>
                ))}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>
    );
  };

  // Product Management Screen
  const renderProducts = () => {
    const products = [
      { id: 1, name: 'Premium Suite', category: 'Software', sku: 'PRD-001', price: '£2,499', cost: '£1,500', stock: 'Unlimited', status: 'Active', sales: 145 },
      { id: 2, name: 'Basic Plan', category: 'Software', sku: 'PRD-002', price: '£899', cost: '£540', stock: 'Unlimited', status: 'Active', sales: 298 },
      { id: 3, name: 'Enterprise Suite', category: 'Software', sku: 'PRD-003', price: '£5,999', cost: '£3,600', stock: 'Unlimited', status: 'Active', sales: 89 },
      { id: 4, name: 'Cloud Storage 1TB', category: 'Add-ons', sku: 'PRD-004', price: '£99', cost: '£60', stock: 'Unlimited', status: 'Active', sales: 456 },
      { id: 5, name: 'Security Module', category: 'Add-ons', sku: 'PRD-005', price: '£299', cost: '£180', stock: 'Limited', status: 'Low Stock', sales: 234 },
      { id: 6, name: 'Analytics Dashboard', category: 'Add-ons', sku: 'PRD-006', price: '£499', cost: '£300', stock: 'Unlimited', status: 'Active', sales: 167 }
    ];

    return (
      <div>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="mb-1">Product Management</h2>
            <p className="text-muted mb-0">Manage your master product catalog</p>
          </div>
          <Button variant="primary" onClick={() => setShowProductModal(true)}>
            <Plus size={16} className="me-2" />
            Add New Product
          </Button>
        </div>

        {/* Product Stats */}
        <Row className="mb-4">
          <Col md={3} className="mb-3">
            <Card className='p-3'>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h3 className="mb-1">156</h3>
                    <p className="text-muted mb-0 small">Total Products</p>
                  </div>
                  <div className="bg-primary bg-opacity-10 rounded p-2">
                    <Package className="text-primary" size={20} />
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} className="mb-3">
            <Card className='p-3'>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h3 className="text-success mb-1">142</h3>
                    <p className="text-muted mb-0 small">Active Products</p>
                  </div>
                  <div className="bg-success bg-opacity-10 rounded p-2">
                    <CheckCircle className="text-success" size={20} />
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} className="mb-3">
            <Card className='p-3'>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h3 className="text-warning mb-1">14</h3>
                    <p className="text-muted mb-0 small">Low Stock</p>
                  </div>
                  <div className="bg-warning bg-opacity-10 rounded p-2">
                    <AlertCircle className="text-warning" size={20} />
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} className="mb-3">
            <Card className='p-3'>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h3 className="text-info mb-1">£685k</h3>
                    <p className="text-muted mb-0 small">Total Revenue</p>
                  </div>
                  <div className="bg-info bg-opacity-10 rounded p-2">
                    <DollarSign className="text-info" size={20} />
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Filters and Search */}
        <Card className="mb-4">
          <Card.Body>
            <Row className="align-items-center">
              <Col md={4}>
                <Form.Control type="search" placeholder="Search products..." />
              </Col>
              <Col md={2}>
                <Form.Select>
                  <option>All Categories</option>
                  <option>Software</option>
                  <option>Add-ons</option>
                  <option>Services</option>
                </Form.Select>
              </Col>
              <Col md={2}>
                <Form.Select>
                  <option>All Status</option>
                  <option>Active</option>
                  <option>Low Stock</option>
                  <option>Inactive</option>
                </Form.Select>
              </Col>
              <Col md={2}>
                <Form.Select>
                  <option>Sort by</option>
                  <option>Name A-Z</option>
                  <option>Price Low-High</option>
                  <option>Sales High-Low</option>
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
                  <th>Product Name</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Cost Price</th>
                  <th>Selling Price</th>
                  <th>Stock</th>
                  <th>Sales</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td className="fw-semibold">{product.name}</td>
                    <td>{product.sku}</td>
                    <td>{product.category}</td>
                    <td>{product.cost}</td>
                    <td className="fw-semibold">{product.price}</td>
                    <td>{product.stock}</td>
                    <td>{product.sales}</td>
                    <td>
                      <Badge bg={product.status === 'Active' ? 'success' : 'warning'} className="bg-opacity-10 text-dark">
                        {product.status}
                      </Badge>
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <Button variant="link" size="sm" className="p-1">
                          <Eye size={16} />
                        </Button>
                        <Button variant="link" size="sm" className="p-1">
                          <Edit size={16} />
                        </Button>
                        <Button variant="link" size="sm" className="p-1 text-danger">
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

        {/* Product Performance */}
        <Row className="mt-4">
          <Col lg={12}>
            <Card>
              <Card.Body>
                <h5 className="mb-4">Product Category Performance</h5>
                <Row>
                  <Col lg={12}>
                    <ProductCategoryChart />
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>
    );
  };

  // Reseller Management Screen
  const renderResellers = () => {
    const resellers = [
      { id: 1, name: 'Tech Distribution Ltd', email: 'contact@techdist.com', status: 'Active', joinDate: '2024-01-15', totalSales: '£125,450', commission: '£18,817', orders: 245, rating: 4.8 },
      { id: 2, name: 'Digital Partners Inc', email: 'info@digitalpartners.com', status: 'Active', joinDate: '2024-02-20', totalSales: '£98,320', commission: '£14,748', orders: 198, rating: 4.6 },
      { id: 3, name: 'Smart Solutions', email: 'hello@smartsol.com', status: 'Active', joinDate: '2024-03-10', totalSales: '£87,650', commission: '£13,147', orders: 176, rating: 4.7 },
      { id: 4, name: 'Cloud Resellers', email: 'team@cloudres.com', status: 'Pending', joinDate: '2024-09-05', totalSales: '£15,200', commission: '£2,280', orders: 32, rating: 4.2 },
      { id: 5, name: 'Enterprise Distributors', email: 'sales@entdist.com', status: 'Active', joinDate: '2024-04-12', totalSales: '£112,890', commission: '£16,933', orders: 223, rating: 4.9 },
      { id: 6, name: 'Global Tech Partners', email: 'info@globaltech.com', status: 'Inactive', joinDate: '2023-11-20', totalSales: '£45,670', commission: '£6,850', orders: 89, rating: 3.8 }
    ];

    const handleApproveReseller = (reseller: any) => {
      setSelectedReseller(reseller);
      setShowResellerModal(true);
    };

    return (
      <div>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="mb-1">Reseller Management</h2>
            <p className="text-muted mb-0">Approve, manage and track your reseller network</p>
          </div>
          <Button variant="primary">
            <UserPlus size={16} className="me-2" />
            Invite Reseller
          </Button>
        </div>

        {/* Reseller Stats */}
        <Row className="mb-4">
          <Col md={3} className="mb-3">
            <Card className='customer-management-card p-3'>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h3 className="text-primary mb-1">47</h3>
                    <p className="text-muted mb-0 small">Total Resellers</p>
                  </div>
                  <div className="bg-primary bg-opacity-10 rounded p-2">
                    <Store className="text-primary" size={20} />
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} className="mb-3">
            <Card className='customer-management-card p-3'>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h3 className="text-success mb-1">42</h3>
                    <p className="text-muted mb-0 small">Active Resellers</p>
                  </div>
                  <div className="bg-success bg-opacity-10 rounded p-2">
                    <UserCheck className="text-success" size={20} />
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} className="mb-3">
            <Card className='customer-management-card p-3'>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h3 className="text-warning mb-1">3</h3>
                    <p className="text-muted mb-0 small">Pending Approval</p>
                  </div>
                  <div className="bg-warning bg-opacity-10 rounded p-2">
                    <Clock className="text-warning" size={20} />
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} className="mb-3">
            <Card className='customer-management-card p-3'>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h3 className="text-danger mb-1">2</h3>
                    <p className="text-muted mb-0 small">Inactive</p>
                  </div>
                  <div className="bg-danger bg-opacity-10 rounded p-2">
                    <UserX className="text-danger" size={20} />
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Filters */}
        <Card className="mb-4">
          <Card.Body>
            <Row className="align-items-center">
              <Col md={5}>
                <Form.Control type="search" placeholder="Search resellers..." />
              </Col>
              <Col md={3}>
                <Form.Select>
                  <option>All Status</option>
                  <option>Active</option>
                  <option>Pending</option>
                  <option>Inactive</option>
                </Form.Select>
              </Col>
              <Col md={2}>
                <Form.Select>
                  <option>Sort by</option>
                  <option>Sales High-Low</option>
                  <option>Orders High-Low</option>
                  <option>Rating High-Low</option>
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

        {/* Resellers Table */}
        <Card className="mb-4">
          <Card.Body>
            <Table responsive hover>
              <thead className="bg-light">
                <tr>
                  <th>Reseller Name</th>
                  <th>Email</th>
                  <th>Join Date</th>
                  <th>Total Sales</th>
                  <th>Commission Paid</th>
                  <th>Orders</th>
                  <th>Rating</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {resellers.map((reseller) => (
                  <tr key={reseller.id}>
                    <td className="fw-semibold">{reseller.name}</td>
                    <td>{reseller.email}</td>
                    <td>{reseller.joinDate}</td>
                    <td className="fw-semibold">{reseller.totalSales}</td>
                    <td className="text-success fw-semibold">{reseller.commission}</td>
                    <td>{reseller.orders}</td>
                    <td>
                      <div className="d-flex align-items-center">
                        <span className="me-1">⭐</span>
                        <span>{reseller.rating}</span>
                      </div>
                    </td>
                    <td>
                      <Badge bg={
                        reseller.status === 'Active' ? 'success' : 
                        reseller.status === 'Pending' ? 'warning' : 'secondary'
                      } className="bg-opacity-10 text-dark">
                        {reseller.status}
                      </Badge>
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        {reseller.status === 'Pending' && (
                          <Button 
                            variant="success" 
                            size="sm" 
                            onClick={() => handleApproveReseller(reseller)}
                          >
                            <CheckCircle size={14} className="me-1" />
                            Approve
                          </Button>
                        )}
                        <Button variant="link" size="sm" className="p-1">
                          <Eye size={16} />
                        </Button>
                        <Button variant="link" size="sm" className="p-1">
                          <Edit size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>

        {/* Reseller Performance Chart */}
        <Card>
          <Card.Body>
            <h5 className="mb-4">Top Reseller Performance</h5>
            <ResellerPerformanceChart />
          </Card.Body>
        </Card>

        {/* Approve Reseller Modal */}
        <Modal show={showResellerModal} onHide={() => setShowResellerModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Approve Reseller</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedReseller && (
              <>
                <p>Are you sure you want to approve <strong>{selectedReseller.name}</strong>?</p>
                <div className="alert alert-info">
                  <small>Once approved, the reseller will have access to your product catalog and can start placing orders.</small>
                </div>
                <Form>
                  <Form.Group className="mb-3">
                    <Form.Label>Commission Rate (%)</Form.Label>
                    <Form.Control type="number" placeholder="15" defaultValue="15" />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Credit Limit</Form.Label>
                    <Form.Control type="number" placeholder="£50,000" />
                  </Form.Group>
                </Form>
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowResellerModal(false)}>
              Cancel
            </Button>
            <Button variant="success" onClick={() => {
              alert('Reseller approved successfully!');
              setShowResellerModal(false);
            }}>
              <CheckCircle size={16} className="me-2" />
              Approve Reseller
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    );
  };

  // Order Management Screen
  const renderOrders = () => {
    const orders = [
      { id: 'ORD-2845', reseller: 'Tech Distribution Ltd', customer: 'Acme Corp', product: 'Premium Suite', quantity: 1, amount: '£2,499', commission: '£374.85', status: 'Completed', date: '2024-10-14' },
      { id: 'ORD-2844', reseller: 'Digital Partners Inc', customer: 'Global Tech', product: 'Basic Plan', quantity: 5, amount: '£4,495', commission: '£674.25', status: 'Processing', date: '2024-10-14' },
      { id: 'ORD-2843', reseller: 'Smart Solutions', customer: 'Enterprise Co', product: 'Enterprise Suite', quantity: 2, amount: '£11,998', commission: '£1,799.70', status: 'Completed', date: '2024-10-13' },
      { id: 'ORD-2842', reseller: 'Cloud Resellers', customer: 'StartUp Ltd', product: 'Basic Plan', quantity: 1, amount: '£899', commission: '£134.85', status: 'Pending', date: '2024-10-13' },
      { id: 'ORD-2841', reseller: 'Enterprise Distributors', customer: 'Tech Corp', product: 'Premium Suite', quantity: 3, amount: '£7,497', commission: '£1,124.55', status: 'Completed', date: '2024-10-12' },
      { id: 'ORD-2840', reseller: 'Tech Distribution Ltd', customer: 'Digital Inc', product: 'Cloud Storage 1TB', quantity: 10, amount: '£990', commission: '£148.50', status: 'Processing', date: '2024-10-12' },
      { id: 'ORD-2839', reseller: 'Smart Solutions', customer: 'Smart Corp', product: 'Security Module', quantity: 2, amount: '£598', commission: '£89.70', status: 'Cancelled', date: '2024-10-11' }
    ];

    return (
      <div>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="mb-1">Order Management</h2>
            <p className="text-muted mb-0">Monitor and manage all orders across your reseller network</p>
          </div>
          <Button variant="primary">
            <Download size={16} className="me-2" />
            Export Orders
          </Button>
        </div>

        {/* Order Stats */}
        <Row className="mb-4">
          <Col md={3} className="mb-3">
            <Card className='p-3'>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h3 className="mb-1">1,247</h3>
                    <p className="text-muted mb-0 small">Total Orders</p>
                  </div>
                  <div className="bg-primary bg-opacity-10 rounded p-2">
                    <ShoppingCart className="text-primary" size={20} />
                  </div>
                </div>
                <small className="text-success">
                  <ArrowUp size={12} /> +22.3% from last month
                </small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} className="mb-3">
            <Card className='p-3'>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h3 className="text-success mb-1">976</h3>
                    <p className="text-muted mb-0 small">Completed</p>
                  </div>
                  <div className="bg-success bg-opacity-10 rounded p-2">
                    <CheckCircle className="text-success" size={20} />
                  </div>
                </div>
                <small className="text-muted">78% completion rate</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} className="mb-3">
            <Card className='p-3'>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h3 className="text-info mb-1">189</h3>
                    <p className="text-muted mb-0 small">Processing</p>
                  </div>
                  <div className="bg-info bg-opacity-10 rounded p-2">
                    <RefreshCw className="text-info" size={20} />
                  </div>
                </div>
                <small className="text-muted">15% in progress</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} className="mb-3">
            <Card className='p-3'>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h3 className="text-warning mb-1">82</h3>
                    <p className="text-muted mb-0 small">Pending</p>
                  </div>
                  <div className="bg-warning bg-opacity-10 rounded p-2">
                    <Clock className="text-warning" size={20} />
                  </div>
                </div>
                <small className="text-muted">Awaiting action</small>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Filters */}
        <Card className="mb-4">
          <Card.Body>
            <Row className="align-items-center">
              <Col md={3}>
                <Form.Control type="search" placeholder="Search orders..." />
              </Col>
              <Col md={2}>
                <Form.Select>
                  <option>All Status</option>
                  <option>Completed</option>
                  <option>Processing</option>
                  <option>Pending</option>
                  <option>Cancelled</option>
                </Form.Select>
              </Col>
              <Col md={2}>
                <Form.Select>
                  <option>All Resellers</option>
                  <option>Tech Distribution</option>
                  <option>Digital Partners</option>
                  <option>Smart Solutions</option>
                </Form.Select>
              </Col>
              <Col md={2}>
                <Form.Control type="date" />
              </Col>
              <Col md={2}>
                <Form.Control type="date" />
              </Col>
              <Col md={1}>
                <Button variant="outline-primary" className="w-100">
                  <Filter size={16} />
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Orders Table */}
        <Card>
          <Card.Body>
            <Table responsive hover>
              <thead className="bg-light">
                <tr>
                  <th>Order ID</th>
                  <th>Reseller</th>
                  <th>Customer</th>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Amount</th>
                  <th>Commission</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td className="fw-semibold">{order.id}</td>
                    <td>{order.reseller}</td>
                    <td>{order.customer}</td>
                    <td>{order.product}</td>
                    <td>{order.quantity}</td>
                    <td className="fw-semibold">{order.amount}</td>
                    <td className="text-success">{order.commission}</td>
                    <td>
                      <Badge bg={
                        order.status === 'Completed' ? 'success' : 
                        order.status === 'Processing' ? 'info' :
                        order.status === 'Pending' ? 'warning' : 'danger'
                      } className="bg-opacity-10 text-dark">
                        {order.status}
                      </Badge>
                    </td>
                    <td>{order.date}</td>
                    <td>
                      <div className="d-flex gap-2">
                        <Button variant="link" size="sm" className="p-1">
                          <Eye size={16} />
                        </Button>
                        <Button variant="link" size="sm" className="p-1">
                          <Download size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
            
            {/* Pagination */}
            <div className="d-flex justify-content-between align-items-center mt-3">
              <div className="text-muted">
                Showing 1 to 10 of 1,247 orders
              </div>
              <div className="d-flex gap-2">
                <Button variant="outline-secondary" size="sm">
                  <ChevronLeft size={16} />
                </Button>
                <Button variant="primary" size="sm">1</Button>
                <Button variant="outline-secondary" size="sm">2</Button>
                <Button variant="outline-secondary" size="sm">3</Button>
                <Button variant="outline-secondary" size="sm">...</Button>
                <Button variant="outline-secondary" size="sm">125</Button>
                <Button variant="outline-secondary" size="sm">
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          </Card.Body>
        </Card>
      </div>
    );
  };

  // Revenue & Commission Screen
  const renderRevenue = () => {
    const commissionPayouts = [
      { id: 'PAY-001', reseller: 'Tech Distribution Ltd', period: 'October 2024', sales: '£125,450', commission: '£18,817.50', rate: '15%', status: 'Paid', date: '2024-11-01' },
      { id: 'PAY-002', reseller: 'Digital Partners Inc', period: 'October 2024', sales: '£98,320', commission: '£14,748.00', rate: '15%', status: 'Paid', date: '2024-11-01' },
      { id: 'PAY-003', reseller: 'Smart Solutions', period: 'October 2024', sales: '£87,650', commission: '£13,147.50', rate: '15%', status: 'Processing', date: '2024-11-01' },
      { id: 'PAY-004', reseller: 'Cloud Resellers', period: 'October 2024', sales: '£15,200', commission: '£2,280.00', rate: '15%', status: 'Pending', date: '2024-11-01' },
      { id: 'PAY-005', reseller: 'Enterprise Distributors', period: 'October 2024', sales: '£112,890', commission: '£16,933.50', rate: '15%', status: 'Paid', date: '2024-11-01' }
    ];

    return (
      <div>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="mb-1">Revenue & Commission</h2>
            <p className="text-muted mb-0">Track revenue, profit margins, and commission payments</p>
          </div>
          <Button variant="primary">
            <Download size={16} className="me-2" />
            Download Financial Report
          </Button>
        </div>

        {/* Revenue Overview */}
        <Row className="mb-4">
          <Col lg={3} md={6} className="mb-3">
            <Card className="border-start border-primary border-4 p-3">
              <Card.Body>
                <h3 className="text-primary mb-1">£685,450</h3>
                <p className="text-muted mb-0 small">Total Revenue</p>
                <small className="text-success">
                  <ArrowUp size={12} /> +18.5% vs last month
                </small>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={3} md={6} className="mb-3">
            <Card className="border-start border-success border-4 p-3">
              <Card.Body>
                <h3 className="text-success mb-1">£410,720</h3>
                <p className="text-muted mb-0 small">Gross Profit</p>
                <small className="text-muted">59.9% margin</small>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={3} md={6} className="mb-3">
            <Card className="border-start border-warning border-4 p-3">
              <Card.Body>
                <h3 className="text-warning mb-1">£102,817</h3>
                <p className="text-muted mb-0 small">Commission Paid</p>
                <small className="text-muted">15% of revenue</small>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={3} md={6} className="mb-3">
            <Card className="border-start border-info border-4 p-3">
              <Card.Body>
                <h3 className="text-info mb-1">£307,903</h3>
                <p className="text-muted mb-0 small">Net Profit</p>
                <small className="text-success">
                  <ArrowUp size={12} /> +21.3% vs last month
                </small>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Revenue Charts */}
        <Row className="mb-4">
          <Col lg={8} className="mb-4">
            <Card>
              <Card.Body>
                <h5 className="mb-4">Revenue & Profit Trends</h5>
                <RevenueAreaChart />
              </Card.Body>
            </Card>
          </Col>
          <Col lg={4} className="mb-4">
            <Card>
              <Card.Body>
                <h5 className="mb-4">Commission Trends</h5>
                <CommissionTrendChart />
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Commission Structure */}
        <Row className="mb-4">
          <Col lg={6} className="mb-4">
            <Card>
              <Card.Body>
                <h5 className="mb-4">Commission Structure</h5>
                <Table>
                  <thead className="bg-light">
                    <tr>
                      <th>Sales Tier</th>
                      <th>Commission Rate</th>
                      <th>Active Resellers</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>£0 - £25,000</td>
                      <td className="fw-semibold">10%</td>
                      <td>8 resellers</td>
                    </tr>
                    <tr className="table-primary">
                      <td>£25,001 - £75,000</td>
                      <td className="fw-semibold">15%</td>
                      <td>22 resellers</td>
                    </tr>
                    <tr>
                      <td>£75,001 - £150,000</td>
                      <td className="fw-semibold">18%</td>
                      <td>12 resellers</td>
                    </tr>
                    <tr>
                      <td>£150,001+</td>
                      <td className="fw-semibold">20%</td>
                      <td>5 resellers</td>
                    </tr>
                  </tbody>
                </Table>
                <div className="alert alert-info mb-0 mt-3">
                  <small>Commission rates are automatically adjusted based on monthly sales volume</small>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={6} className="mb-4">
            <Card>
              <Card.Body>
                <h5 className="mb-4">Monthly Breakdown</h5>
                <div className="mb-3 pb-3 border-bottom">
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Gross Revenue</span>
                    <span className="fw-semibold">£685,450</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Cost of Sales</span>
                    <span className="text-danger">-£274,730</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="fw-semibold">Gross Profit</span>
                    <span className="fw-semibold text-success">£410,720</span>
                  </div>
                </div>
                <div className="mb-3 pb-3 border-bottom">
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Commission Paid</span>
                    <span className="text-danger">-£102,817</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="fw-semibold">Net Profit</span>
                    <span className="fw-semibold text-success">£307,903</span>
                  </div>
                </div>
                <div>
                  <ProgressBar className="mb-2">
                    <ProgressBar variant="success" now={60} key={1} label="60% Gross Margin" />
                    <ProgressBar variant="warning" now={15} key={2} label="15% Commission" />
                  </ProgressBar>
                  <small className="text-muted">Profit margin: 44.9%</small>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Commission Payouts */}
        <Card>
          <Card.Body>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="mb-0">Commission Payouts</h5>
              <Button variant="success" size="sm">
                <CheckCircle size={16} className="me-2" />
                Process All Pending
              </Button>
            </div>
            <Table responsive hover>
              <thead className="bg-light">
                <tr>
                  <th>Payout ID</th>
                  <th>Reseller</th>
                  <th>Period</th>
                  <th>Total Sales</th>
                  <th>Commission</th>
                  <th>Rate</th>
                  <th>Status</th>
                  <th>Payout Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {commissionPayouts.map((payout) => (
                  <tr key={payout.id}>
                    <td className="fw-semibold">{payout.id}</td>
                    <td>{payout.reseller}</td>
                    <td>{payout.period}</td>
                    <td>{payout.sales}</td>
                    <td className="fw-semibold text-success">{payout.commission}</td>
                    <td>{payout.rate}</td>
                    <td>
                      <Badge bg={
                        payout.status === 'Paid' ? 'success' : 
                        payout.status === 'Processing' ? 'info' : 'warning'
                      } className="bg-opacity-10 text-dark">
                        {payout.status}
                      </Badge>
                    </td>
                    <td>{payout.date}</td>
                    <td>
                      <div className="d-flex gap-2">
                        <Button variant="link" size="sm" className="p-1">
                          <Eye size={16} />
                        </Button>
                        <Button variant="link" size="sm" className="p-1">
                          <Download size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      </div>
    );
  };

  // Customer Management Screen
  const renderCustomers = () => {
    const customers = [
      { id: 1, name: 'Acme Corp', email: 'contact@acme.com', reseller: 'Tech Distribution Ltd', products: 8, totalSpent: '£15,450', status: 'Active', joined: '2024-01-15', lastOrder: '2024-10-14' },
      { id: 2, name: 'Global Tech', email: 'info@globaltech.com', reseller: 'Digital Partners Inc', products: 5, totalSpent: '£8,920', status: 'Active', joined: '2024-02-20', lastOrder: '2024-10-13' },
      { id: 3, name: 'Enterprise Co', email: 'hello@enterprise.com', reseller: 'Smart Solutions', products: 12, totalSpent: '£28,750', status: 'Active', joined: '2024-03-10', lastOrder: '2024-10-14' },
      { id: 4, name: 'StartUp Ltd', email: 'team@startup.com', reseller: 'Cloud Resellers', products: 3, totalSpent: '£3,280', status: 'Active', joined: '2024-08-05', lastOrder: '2024-10-10' },
      { id: 5, name: 'Tech Corp', email: 'sales@techcorp.com', reseller: 'Enterprise Distributors', products: 15, totalSpent: '£45,670', status: 'Active', joined: '2024-04-12', lastOrder: '2024-10-12' },
      { id: 6, name: 'Digital Inc', email: 'info@digitalinc.com', reseller: 'Tech Distribution Ltd', products: 6, totalSpent: '£11,250', status: 'Inactive', joined: '2024-05-20', lastOrder: '2024-08-15' }
    ];

    return (
      <div>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="mb-1">Customer Management</h2>
            <p className="text-muted mb-0">View and manage all customers across your reseller network</p>
          </div>
          <Button variant="primary">
            <Download size={16} className="me-2" />
            Export Customers
          </Button>
        </div>

        {/* Customer Stats */}
        <Row className="mb-4">
          <Col md={3} className="mb-3">
            <Card className='customer-management-card p-3'>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h3 className="text-primary mb-1">2,845</h3>
                    <p className="text-muted mb-0 small">Total Customers</p>
                  </div>
                  <div className="bg-primary bg-opacity-10 rounded p-2">
                    <Users className="text-primary" size={20} />
                  </div>
                </div>
                <small className="text-success">
                  <ArrowUp size={12} /> +15.7% from last month
                </small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} className="mb-3">
            <Card className='customer-management-card p-3'>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h3 className="text-success mb-1">2,598</h3>
                    <p className="text-muted mb-0 small">Active Customers</p>
                  </div>
                  <div className="bg-success bg-opacity-10 rounded p-2">
                    <UserCheck className="text-success" size={20} />
                  </div>
                </div>
                <small className="text-muted">91.3% active rate</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} className="mb-3">
            <Card className='customer-management-card p-3'>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h3 className="text-info mb-1">£241</h3>
                    <p className="text-muted mb-0 small">Avg Customer Value</p>
                  </div>
                  <div className="bg-info bg-opacity-10 rounded p-2">
                    <DollarSign className="text-info" size={20} />
                  </div>
                </div>
                <small className="text-success">
                  <ArrowUp size={12} /> +8.2% increase
                </small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} className="mb-3">
            <Card className='customer-management-card p-3'>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h3 className="text-warning mb-1">247</h3>
                    <p className="text-muted mb-0 small">New This Month</p>
                  </div>
                  <div className="bg-warning bg-opacity-10 rounded p-2">
                    <UserPlus className="text-warning" size={20} />
                  </div>
                </div>
                <small className="text-muted">Strong growth</small>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Filters */}
        <Card className="mb-4">
          <Card.Body>
            <Row className="align-items-center">
              <Col md={4}>
                <Form.Control type="search" placeholder="Search customers..." />
              </Col>
              <Col md={2}>
                <Form.Select>
                  <option>All Resellers</option>
                  <option>Tech Distribution</option>
                  <option>Digital Partners</option>
                  <option>Smart Solutions</option>
                </Form.Select>
              </Col>
              <Col md={2}>
                <Form.Select>
                  <option>All Status</option>
                  <option>Active</option>
                  <option>Inactive</option>
                </Form.Select>
              </Col>
              <Col md={2}>
                <Form.Select>
                  <option>Sort by</option>
                  <option>Spent High-Low</option>
                  <option>Orders High-Low</option>
                  <option>Recent Activity</option>
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

        {/* Customers Table */}
        <Card>
          <Card.Body>
            <Table responsive hover>
              <thead className="bg-light">
                <tr>
                  <th>Customer Name</th>
                  <th>Email</th>
                  <th>Reseller</th>
                  <th>Products</th>
                  <th>Total Spent</th>
                  <th>Status</th>
                  <th>Last Order</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id}>
                    <td className="fw-semibold">{customer.name}</td>
                    <td>{customer.email}</td>
                    <td>{customer.reseller}</td>
                    <td>{customer.products}</td>
                    <td className="fw-semibold">{customer.totalSpent}</td>
                    <td>
                      <Badge bg={customer.status === 'Active' ? 'success' : 'secondary'} className="bg-opacity-10 text-dark">
                        {customer.status}
                      </Badge>
                    </td>
                    <td>{customer.lastOrder}</td>
                    <td>
                      <div className="d-flex gap-2">
                        <Button variant="link" size="sm" className="p-1">
                          <Eye size={16} />
                        </Button>
                        <Button variant="link" size="sm" className="p-1">
                          <FileText size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
            
            {/* Pagination */}
            <div className="d-flex justify-content-between align-items-center mt-3">
              <div className="text-muted">
                Showing 1 to 10 of 2,845 customers
              </div>
              <div className="d-flex gap-2">
                <Button variant="outline-secondary" size="sm">
                  <ChevronLeft size={16} />
                </Button>
                <Button variant="primary" size="sm">1</Button>
                <Button variant="outline-secondary" size="sm">2</Button>
                <Button variant="outline-secondary" size="sm">3</Button>
                <Button variant="outline-secondary" size="sm">...</Button>
                <Button variant="outline-secondary" size="sm">285</Button>
                <Button variant="outline-secondary" size="sm">
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          </Card.Body>
        </Card>
      </div>
    );
  };

  // Reports & Analytics Screen
  const renderReports = () => {
    return (
      <div>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="mb-1">Reports & Analytics</h2>
            <p className="text-muted mb-0">Comprehensive insights into your vendor operations</p>
          </div>
          <Button variant="primary">
            <Download size={16} className="me-2" />
            Export All Reports
          </Button>
        </div>

        {/* Report Filters */}
        <Card className="mb-4">
          <Card.Body>
            <Row className="align-items-center">
              <Col md={3}>
                <Form.Label>Report Type</Form.Label>
                <Form.Select>
                  <option>Sales Overview</option>
                  <option>Revenue Analysis</option>
                  <option>Reseller Performance</option>
                  <option>Product Performance</option>
                  <option>Customer Analytics</option>
                  <option>Commission Report</option>
                </Form.Select>
              </Col>
              <Col md={3}>
                <Form.Label>From Date</Form.Label>
                <Form.Control type="date" defaultValue="2024-01-01" />
              </Col>

              <Col md={3}>
                <Form.Label>To Date</Form.Label>
                <Form.Control type="date" defaultValue="2024-10-14" />
              </Col>
              <Col md={3}>
                <Form.Label>&nbsp;</Form.Label>
                <Button variant="primary" className="w-100">
                  <Search size={16} className="me-2" />
                  Generate Report
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>


        {/* Key Performance Metrics */}
        <Row className="mb-4">
          <Col lg={3} md={6} className="mb-3">
            <Card>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <h6 className="text-muted mb-0">Revenue Growth</h6>
                  <Badge bg="success" className="bg-opacity-10">
                    <ArrowUp size={12} /> 18.5%
                  </Badge>
                </div>
                <h3 className="mb-0">£685,450</h3>
                <small className="text-muted">vs last period</small>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={3} md={6} className="mb-3">
            <Card>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <h6 className="text-muted mb-0">Reseller Growth</h6>
                  <Badge bg="success" className="bg-opacity-10">
                    <ArrowUp size={12} /> 12.8%
                  </Badge>
                </div>
                <h3 className="mb-0">47</h3>
                <small className="text-muted">Active resellers</small>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={3} md={6} className="mb-3">
            <Card>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <h6 className="text-muted mb-0">Order Volume</h6>
                  <Badge bg="success" className="bg-opacity-10">
                    <ArrowUp size={12} /> 22.3%
                  </Badge>
                </div>
                <h3 className="mb-0">1,247</h3>
                <small className="text-muted">Total orders</small>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={3} md={6} className="mb-3">
            <Card>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <h6 className="text-muted mb-0">Profit Margin</h6>
                  <Badge bg="success" className="bg-opacity-10">
                    <ArrowUp size={12} /> 2.1%
                  </Badge>
                </div>
                <h3 className="mb-0">44.9%</h3>
                <small className="text-muted">Net margin</small>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Charts Section */}
        <Row className="mb-4">
          <Col lg={8} className="mb-4">
            <Card>
              <Card.Body>
                <h5 className="mb-4">Revenue Trends (10 Months)</h5>
                <RevenueAreaChart />
              </Card.Body>
            </Card>
          </Col>
          <Col lg={4} className="mb-4">
            <Card>
              <Card.Body>
                <h5 className="mb-4">Order Status</h5>
                <OrderStatusChart />
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row className="mb-4">
          <Col lg={8} className="mb-4">
            <Card>
              <Card.Body>
                <h5 className="mb-4">Top Reseller Performance</h5>
                <ResellerPerformanceChart />
              </Card.Body>
            </Card>
          </Col>
          <Col lg={4} className="mb-4">
            <Card>
              <Card.Body>
                <h5 className="mb-4">Product Categories</h5>
                <ProductCategoryChart />
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Performance Tables */}
        <Row>
          <Col lg={6} className="mb-4">
            <Card>
              <Card.Body>
                <h5 className="mb-4">Top Products by Revenue</h5>
                <Table className='theTable' hover>
                  <thead className="bg-light">
                    <tr>
                      <th>Product</th>
                      <th>Units Sold</th>
                      <th>Revenue</th>
                      <th>Growth</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="fw-semibold">Premium Suite</td>
                      <td>145</td>
                      <td className="fw-semibold">£362,355</td>
                      <td>
                        <Badge bg="success" className="bg-opacity-10" style={{color: 'blue'}}>
                          <ArrowUp size={12} /> 25%
                        </Badge>
                      </td>
                    </tr>
                    <tr>
                      <td className="fw-semibold">Enterprise Suite</td>
                      <td>89</td>
                      <td className="fw-semibold">£533,911</td>
                      <td>
                        <Badge bg="success" className="bg-opacity-10" style={{color: 'blue'}}>
                          <ArrowUp size={12} /> 32%
                        </Badge>
                      </td>
                    </tr>
                    <tr>
                      <td className="fw-semibold">Basic Plan</td>
                      <td>298</td>
                      <td className="fw-semibold">£267,902</td>
                      <td>
                        <Badge bg="success" className="bg-opacity-10" style={{color: 'blue'}}>
                          <ArrowUp size={12} /> 18%
                        </Badge>
                      </td>
                    </tr>
                    <tr>
                      <td className="fw-semibold">Cloud Storage 1TB</td>
                      <td>456</td>
                      <td className="fw-semibold">£45,144</td>
                      <td>
                        <Badge bg="success" className="bg-opacity-10" style={{color: 'blue'}}>
                          <ArrowUp size={12} /> 15%
                        </Badge>
                      </td>
                    </tr>
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={6} className="mb-4">
            <Card>
              <Card.Body>
                <h5 className="mb-4">Top Resellers by Sales</h5>
                <Table hover>
                  <thead className="bg-light">
                    <tr>
                      <th>Reseller</th>
                      <th>Orders</th>
                      <th>Sales</th>
                      <th>Growth</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="fw-semibold">Tech Distribution Ltd</td>
                      <td>245</td>
                      <td className="fw-semibold">£125,450</td>
                      <td>
                        <Badge bg="success" className="bg-opacity-10" style={{color: 'blue'}}>
                          <ArrowUp size={12} /> 25%
                        </Badge>
                      </td>
                    </tr>
                    <tr>
                      <td className="fw-semibold">Enterprise Distributors</td>
                      <td>223</td>
                      <td className="fw-semibold">£112,890</td>
                      <td>
                        <Badge bg="success" className="bg-opacity-10" style={{color: 'blue'}}>
                          <ArrowUp size={12} /> 28%
                        </Badge>
                      </td>
                    </tr>
                    <tr>
                      <td className="fw-semibold">Digital Partners Inc</td>
                      <td>198</td>
                      <td className="fw-semibold">£98,320</td>
                      <td>
                        <Badge bg="success" className="bg-opacity-10" style={{color: 'blue'}}>
                          <ArrowUp size={12} /> 18%
                        </Badge>
                      </td>
                    </tr>
                    <tr>
                      <td className="fw-semibold">Smart Solutions</td>
                      <td>176</td>
                      <td className="fw-semibold">£87,650</td>
                      <td>
                        <Badge bg="success" className="bg-opacity-10" style={{color: 'blue'}}>
                          <ArrowUp size={12} /> 22%
                        </Badge>
                      </td>
                    </tr>
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Regional Performance */}
        <Card>
          <Card.Body>
            <h5 className="mb-4">Regional Performance Analysis</h5>
            <Row>
              <Col md={3} className="mb-3">
                <div className="border rounded p-3">
                  <h6 className="text-muted mb-2">United Kingdom</h6>
                  <h4 className="mb-2">£425,890</h4>
                  <ProgressBar now={62} variant="primary" className="mb-2" style={{ height: '6px' }} />
                  <small className="text-muted">62% of total revenue</small>
                </div>
              </Col>
              <Col md={3} className="mb-3">
                <div className="border rounded p-3">
                  <h6 className="text-muted mb-2">Europe</h6>
                  <h4 className="mb-2">£178,340</h4>
                  <ProgressBar now={26} variant="success" className="mb-2" style={{ height: '6px' }} />
                  <small className="text-muted">26% of total revenue</small>
                </div>
              </Col>
              <Col md={3} className="mb-3">
                <div className="border rounded p-3">
                  <h6 className="text-muted mb-2">North America</h6>
                  <h4 className="mb-2">£61,680</h4>
                  <ProgressBar now={9} variant="info" className="mb-2" style={{ height: '6px' }} />
                  <small className="text-muted">9% of total revenue</small>
                </div>
              </Col>
              <Col md={3} className="mb-3">
                <div className="border rounded p-3">
                  <h6 className="text-muted mb-2">Rest of World</h6>
                  <h4 className="mb-2">£20,540</h4>
                  <ProgressBar now={3} variant="warning" className="mb-2" style={{ height: '6px' }} />
                  <small className="text-muted">3% of total revenue</small>
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeScreen) {
      case 'dashboard': return renderDashboard();
      case 'products': return renderProducts();
      case 'resellers': return renderResellers();
      case 'orders': return renderOrders();
      case 'revenue': return renderRevenue();
      case 'customers': return renderCustomers();
      case 'inventory': return renderInventory();
      case 'supplier': return renderSuppliers();
      case 'reports': return renderReports();
     
      default: return renderDashboard();
    }
  };

  return (
    <div className="container-fluid p-0">
      <Row className="g-0">
        {/* Mobile Toggle Button */}
        <Button
          variant="primary"
          className="position-fixed d-lg-none rounded-circle"
          style={{
            top: '20px',
            right: '20px',
            zIndex: 1100,
            width: '50px',
            height: '50px',
            padding: '0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <ChevronLeft size={24} /> : <ChevronRight size={24} />}
        </Button>

        {/* Overlay */}
        {sidebarOpen && (
          <div
            className="position-fixed d-lg-none"
            style={{
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              zIndex: 1040
            }}
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <Col lg={2} className={`d-lg-block ${sidebarOpen ? 'd-block' : 'd-none'}`}>
          <Card 
            style={{ 
              minHeight: '100vh',
              height: '100%',
              position: 'fixed',
              width: '250px',
              borderRadius: '0',
              zIndex: 1050,
              overflowY: 'auto'
            }}
          >
            <Card.Body className="p-0">
              <div className="p-4 border-bottom">
                <h4 className="mb-0">Vendor Portal</h4>
                
              </div>
              <div className="list-group list-group-flush">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    className={`list-group-item list-group-item-action d-flex align-items-center border-0 ${
                      activeScreen === item.id ? 'active bg-primary text-white' : ''
                    }`}
                    onClick={() => {
                      setActiveScreen(item.id);
                      setSidebarOpen(false);
                    }}
                  >
                    <span className="me-2">{item.icon}</span>
                    <span className="">{item.title}</span>
                  </button>
                ))}
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Main Content */}
        <Col lg={10} className="ms-auto">
          <div className="p-4">
            {renderContent()}
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default VendorPortal;

