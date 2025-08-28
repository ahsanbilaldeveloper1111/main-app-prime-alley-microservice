import { toast } from "react-toastify";
import axiosInstance from "./axios";


// API Response Structure from Controlhub
interface ControlhubResponse<T> {
  code: number;
  message: string;
  data: {
    success: boolean;
    data: T;
  };
}

// Pagination wrapper
interface PaginationWrapper<T> {
  data: T[];
  total: number;
  current_page: number;
  per_page: number;
  last_page: number;
}

// Base interfaces matching myapp models exactly
export interface OrderStageData {
  id: number;
  name: string;
  description: string | null;
  type: 'new' | 'processing' | 'completed' | 'cancelled' | 'default';
  color: string;
  is_default: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrderLostReasonData {
  id: number;
  name: string;
  description: string | null;
  color: string;
  sequence: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductVariantData {
  id: number;
  product_id: number;
  variant_name: string;
  variant_value: string;
  sku: string;
  price_adjustment: string | number;
  buy_cost_adjustment: string | number;
  available_quantity: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductData {
  id: number;
  name: string;
  description: string | null;
  sku: string;
  category: string | null;
  brand: string | null;
  price: number;
  buy_cost: number;
  available_quantity: number;
  weight: number;
  dimensions: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
  variants?: ProductVariantData[];
}

export interface OrderItemData {
  id: number;
  order_id: number;
  product_id: number;
  product_variant_id: number | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  discount_amount: number;
  tax_amount: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  product?: ProductData;
  variant?: ProductVariantData;
  variant_info?: string;
}

export interface OrderData {
  id: number;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  customer_address: string | null;
  order_date: string;
  expected_delivery_date: string | null;
  order_stage_id: number | null;
  lost_reason_id: number | null;
  lost_notes: string | null;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  shipping_amount: number;
  total_amount: number;
  final_amount: number;
  status: string;
  notes: string | null;
  is_lost: boolean;
  is_completed: boolean;
  can_be_edited: boolean;
  created_at: string;
  updated_at: string;
  stage?: OrderStageData;
  lost_reason?: OrderLostReasonData;
  items?: OrderItemData[];
}

// Sales Analytics Data
export interface SalesAnalyticsData {
  date?: string;
  month?: string;
  year?: number;
  total_orders: number;
  total_revenue: number;
  total_profit: number;
}

// Sales Dashboard Data
export interface SalesDashboardData {
  analytics: SalesAnalyticsData[];
  totalOrders: number;
  totalProducts: number;
  totalStages: number;
  recentOrders: OrderData[];
  ordersByStage: Array<{
    stage_name: string;
    count: number;
    color: string;
  }>;
}

export interface CreateOrderRequest {
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  customer_address?: string;
  order_date: string;
  expected_delivery_date?: string;
  order_stage_id: number;
  notes?: string;
  tax_amount?: number;
  discount_amount?: number;
  total_amount: number;
  currency: string;
  items: Array<{
    product_id: number;
    product_variant_id?: number;
    quantity: number;
    unit_price: number;
    notes?: string;
  }>;
}

export interface UpdateOrderRequest extends Partial<CreateOrderRequest> {
  id: number;
}

export interface MarkOrderLostRequest {
  order_id: number;
  lost_reason_id?: number;
  notes?: string;
}

export interface PaginationParams extends Record<string, any> {
  page?: number;
  perPage?: number;
  search?: string;
  filters?: Record<string, any>;
}

// Helper function to extract data from controlhub response
function extractData<T>(response: any): T {
  console.log("Extracting data from response:", response);

  // Handle successful response with nested data structure
  if (response?.code === 200 && response?.data?.success) {
    console.log("Extracting from nested data structure:", response.data.data);
    return response.data.data;
  }

  // Handle direct data response (fallback)
  if (response?.data) {
    console.log("Extracting from direct data:", response.data);
    return response.data;
  }

  console.error("Failed to extract data from response:", response);

  throw new Error(
    response?.data?.message || response?.message || "API request failed"
  );
}

// Order Management
export const listOrders = async (
  params: PaginationParams = {}
): Promise<PaginationWrapper<OrderData>> => {
  try {
    const { page = 1, perPage = 15, search = "", ...filters } = params;
    
    const requestData = {
      page,
      per_page: perPage,
      search,
      ...filters
    };
    
    const response = await axiosInstance.post("/sales/orders", requestData);
    return extractData<PaginationWrapper<OrderData>>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch orders");
    throw error;
  }
};

export const getOrder = async (id: number): Promise<OrderData> => {
  try {
    const response = await axiosInstance.post("/sales/view-order", { id });
    return extractData<OrderData>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch order");
    throw error;
  }
};

export const createOrder = async (orderData: CreateOrderRequest): Promise<OrderData> => {
  try {
    const response = await axiosInstance.post("/sales/create-order", orderData);
    toast.success("Order created successfully");
    return extractData<OrderData>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to create order");
    throw error;
  }
};

export const updateOrder = async (id: number, orderData: UpdateOrderRequest): Promise<OrderData> => {
  try {
    const { id: _, ...orderDataWithoutId } = orderData;
    const response = await axiosInstance.post("/sales/update-order", { id, ...orderDataWithoutId });
    toast.success("Order updated successfully");
    return extractData<OrderData>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to update order");
    throw error;
  }
};

export const deleteOrder = async (id: number): Promise<void> => {
  try {
    await axiosInstance.post("/sales/delete-order", { id });
    toast.success("Order deleted successfully");
  } catch (error: any) {
    toast.error(error?.message || "Failed to delete order");
    throw error;
  }
};

export const markOrderLost = async (data: MarkOrderLostRequest): Promise<OrderData> => {
  try {
    const response = await axiosInstance.post("/sales/mark-order-lost", data);
    toast.success("Order marked as lost successfully");
    return extractData<OrderData>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to mark order as lost");
    throw error;
  }
};

// Order Stages Management
export const listOrderStages = async (): Promise<OrderStageData[]> => {
  try {
    const response = await axiosInstance.post("/sales/stages");
    return extractData<OrderStageData[]>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch order stages");
    throw error;
  }
};

export const createOrderStage = async (stageData: Partial<OrderStageData>): Promise<OrderStageData> => {
  try {
    const response = await axiosInstance.post("/sales/create-stage", stageData);
    return extractData<OrderStageData>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to create order stage");
    throw error;
  }
};

export const updateOrderStage = async (id: number, stageData: Partial<OrderStageData>): Promise<OrderStageData> => {
  try {
    const { id: _, ...stageDataWithoutId } = stageData;
    const response = await axiosInstance.post("/sales/update-stage", { id, ...stageDataWithoutId });
    toast.success("Order stage updated successfully");
    return extractData<OrderStageData>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to update order stage");
    throw error;
  }
};

export const deleteOrderStage = async (id: number): Promise<void> => {
  try {
    await axiosInstance.post("/sales/delete-stage", { id });
    toast.success("Order stage deleted successfully");
  } catch (error: any) {
    toast.error(error?.message || "Failed to delete order stage");
    throw error;
  }
};

export const getOrderStage = async (id: number): Promise<OrderStageData> => {
  try {
    const response = await axiosInstance.post("/sales/view-stage", { id });
    return extractData<OrderStageData>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch order stage");
    throw error;
  }
};

// Order Lost Reasons Management
export const listOrderLostReasons = async (): Promise<OrderLostReasonData[]> => {
  try {
    const response = await axiosInstance.post("/sales/lost-reasons");
    return extractData<OrderLostReasonData[]>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch lost reasons");
    throw error;
  }
};

export const createOrderLostReason = async (reasonData: Partial<OrderLostReasonData>): Promise<OrderLostReasonData> => {
  try {
    const response = await axiosInstance.post("/sales/create-lost-reason", reasonData);
    toast.success("Lost reason created successfully");
    return extractData<OrderLostReasonData>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to create lost reason");
    throw error;
  }
};

export const updateOrderLostReason = async (id: number, reasonData: Partial<OrderLostReasonData>): Promise<OrderLostReasonData> => {
  try {
    const { id: _, ...reasonDataWithoutId } = reasonData;
    const response = await axiosInstance.post("/sales/update-lost-reason", { id, ...reasonDataWithoutId });
    toast.success("Lost reason updated successfully");
    return extractData<OrderLostReasonData>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to update lost reason");
    throw error;
  }
};

export const deleteOrderLostReason = async (id: number): Promise<void> => {
  try {
    await axiosInstance.post("/sales/delete-lost-reason", { id });
    toast.success("Lost reason deleted successfully");
  } catch (error: any) {
    toast.error(error?.message || "Failed to delete lost reason");
    throw error;
  }
};

export const getOrderLostReason = async (id: number): Promise<OrderLostReasonData> => {
  try {
    const response = await axiosInstance.post("/sales/view-lost-reason", { id });
    return extractData<OrderLostReasonData>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch lost reason");
    throw error;
  }
};

// Product Management
export const listProducts = async (
  params: PaginationParams = {}
): Promise<PaginationWrapper<ProductData>> => {
  try {
    const { page = 1, perPage = 15, search = "", filters = {} } = params;
    
    const requestData = {
      page,
      per_page: perPage,
      search,
      filters
    };
    
    const response = await axiosInstance.post("/sales/products", requestData);
    return extractData<PaginationWrapper<ProductData>>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch products");
    throw error;
  }
};

export const getProduct = async (id: number): Promise<ProductData> => {
  try {
    const response = await axiosInstance.post("/sales/view-product", { id });
    return extractData<ProductData>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch product");
    throw error;
  }
};

export const createProduct = async (productData: Partial<ProductData>): Promise<ProductData> => {
  try {
    const response = await axiosInstance.post("/sales/create-product", productData);
    toast.success("Product created successfully");
    return extractData<ProductData>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to create product");
    throw error;
  }
};

export const updateProduct = async (id: number, productData: Partial<ProductData>): Promise<ProductData> => {
  try {
    const { id: _, ...productDataWithoutId } = productData;
    const response = await axiosInstance.post("/sales/update-product", { id, ...productDataWithoutId });
    toast.success("Product updated successfully");
    return extractData<ProductData>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to update product");
    throw error;
  }
};

export const deleteProduct = async (id: number): Promise<void> => {
  try {
    await axiosInstance.post("/sales/delete-product", { id });
    toast.success("Product deleted successfully");
  } catch (error: any) {
    toast.error(error?.message || "Failed to delete product");
    throw error;
  }
};

// Product Variants Management
export const createProductVariant = async (variantData: Partial<ProductVariantData>): Promise<ProductVariantData> => {
  try {
    const response = await axiosInstance.post("/sales/variants", variantData);
    toast.success("Product variant created successfully");
    return extractData<ProductVariantData>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to create product variant");
    throw error;
  }
};

export const updateProductVariant = async (id: number, variantData: Partial<ProductVariantData>): Promise<ProductVariantData> => {
  try {
    const { id: _, ...variantDataWithoutId } = variantData;
    const response = await axiosInstance.post("/sales/update-variant", { id, ...variantDataWithoutId });
    toast.success("Product variant updated successfully");
    return extractData<ProductVariantData>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to update product variant");
    throw error;
  }
};

export const deleteProductVariant = async (id: number): Promise<void> => {
  try {
    await axiosInstance.post("/sales/delete-variant", { id });
    toast.success("Product variant deleted successfully");
  } catch (error: any) {
    toast.error(error?.message || "Failed to delete product variant");
    throw error;
  }
};

// Sales Analytics
export const getSalesAnalytics = async (params: {
  period: 'daily' | 'monthly' | 'yearly';
  start_date: string;
  end_date: string;
}): Promise<SalesAnalyticsData[]> => {
  try {
    const response = await axiosInstance.post("/sales/analytics", params);
    return extractData<any>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch sales analytics");
    throw error;
  }
};

// Additional helper functions based on available routes
export const getOrdersByStage = async (stageId: number): Promise<OrderData[]> => {
  try {
    const response = await axiosInstance.get(`/sales/orders/by-stage/${stageId}`);
    return extractData<OrderData[]>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch orders by stage");
    throw error;
  }
};

export const getOrdersByStatus = async (status: string): Promise<OrderData[]> => {
  try {
    const response = await axiosInstance.get(`/sales/orders/by-status/${status}`);
    return extractData<OrderData[]>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch orders by status");
    throw error;
  }
};

export const getLostOrders = async (): Promise<OrderData[]> => {
  try {
    const response = await axiosInstance.post("/sales/lost-orders");
    return extractData<OrderData[]>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch lost orders");
    throw error;
  }
};

// Dashboard data will be constructed from analytics and other API calls
export const getSalesDashboardData = async (): Promise<SalesDashboardData> => {
  try {
    // Get analytics data for the current month
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);
    
    const analytics = await getSalesAnalytics({
      period: 'monthly',
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0]
    });
    
    // Get other data for dashboard
    const [orders, products, stages] = await Promise.all([
      listOrders({ perPage: 1000 }), // Get all orders for counting
      listProducts({ perPage: 1000 }), // Get all products for counting
      listOrderStages()
    ]);
    
    return {
      analytics,
      totalOrders: orders.total,
      totalProducts: products.total,
      totalStages: stages.length,
      recentOrders: orders.data.slice(0, 5), // Last 5 orders
      ordersByStage: stages.map(stage => ({
        stage_name: stage.name,
        count: orders.data.filter(order => order.order_stage_id === stage.id).length,
        color: stage.color
      }))
    };
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch sales dashboard data");
    throw error;
  }
};
