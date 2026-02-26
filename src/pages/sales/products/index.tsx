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
  FiPlus,
  FiMoreVertical,
} from "react-icons/fi";
import Link from "next/link";
import { toast } from "react-toastify";
import { useSession } from "next-auth/react";
import moment from "moment";
import {
  listProducts,
  deleteProduct,
  ProductData,
} from "@utils/sales";
import ProductsFilters from "@components/filters/ProductsFilters";

const ProductsList = () => {
  const { data: session, status } = useSession();
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [currentFilters, setCurrentFilters] = useState({});

  const fetchProducts = useCallback(
    async (page = 1, perPage = 15, search = "") => {
      const response = await listProducts({
        page,
        perPage,
        search,
        filters: memoizedFilters,
      });
      console.log("ZE RES WA", response);
      return response;
    },
    [currentFilters]
  );

  const memoizedFilters = useMemo(() => currentFilters, [currentFilters]);

  const handleFiltersChange = useCallback((filters: any) => {
    setCurrentFilters(filters);
  }, []);

  const columns: Column[] = useMemo(
    () => [
      {
        key: "name",
        name: "Product",
        selector: (row: any) => row.name,
        sortable: true,
        cell: (props: any) => (
          <div>
            <div className="fw-medium">{props.name}</div>
            <small className="text-muted">
              SKU: {props.sku || "No SKU"}
            </small>
          </div>
        ),
      },
      {
        key: "category",
        name: "Category",
        selector: (row: any) => row.category,
        sortable: true,
        cell: (props: any) => (
          <Badge bg="secondary">
            {props.category || "Uncategorized"}
          </Badge>
        ),
      },
      {
        key: "brand",
        name: "Brand",
        selector: (row: any) => row.brand,
        sortable: true,
        cell: (props: any) => (
          <span>{props.brand || "No Brand"}</span>
        ),
      },
      {
        key: "base_price",
        name: "Price",
        selector: (row: any) => row.base_price,
        sortable: true,
        cell: (props: any) => (
          <div>
            <div className="fw-medium">
              ${props.price ? parseFloat(props.price).toFixed(2) : "0.00"}
            </div>
            {props.buy_cost && (
              <small className="text-muted">
                Cost: ${parseFloat(props.buy_cost).toFixed(2)}
              </small>
            )}
          </div>
        ),
      },
      {
        key: "available_quantity",
        name: "Stock",
        selector: (row: any) => row.available_quantity,
        sortable: true,
        cell: (props: any) => {
          const quantity = props.available_quantity || 0;
          let badgeColor = "success";
          if (quantity <= 10) badgeColor = "warning";
          if (quantity === 0) badgeColor = "danger";
          
          return (
            <Badge bg={badgeColor}>
              {quantity} units
            </Badge>
          );
        },
      },
      {
        key: "created_at",
        name: "Created",
        selector: (row: any) => row.created_at,
        sortable: true,
        cell: (props: any) => (
          <span className="text-muted">
            {props.created_at
              ? moment(props.created_at).format("DD/MM/YYYY")
              : "-"}
          </span>
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
                <Dropdown.Item as={Link} href={`/sales/products/${props.id}`}>
                  <FiEye className="me-2" />
                  View
                </Dropdown.Item>
                <Dropdown.Item as={Link} href={`/sales/products/manage?id=${props.id}`}>
                  <FiEdit className="me-2" />
                  Edit
                </Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item onClick={() => handleDeleteProduct(props)} className="text-danger">
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

  const handleDeleteProduct = async (product: ProductData) => {
    if (window.confirm(`Are you sure you want to delete product "${product.name}"?`)) {
      try {
        await deleteProduct(product.id);
        toast.success("Product deleted successfully");
        setRefreshKey(prev => prev + 1);
      } catch (error: any) {
        toast.error(error?.message || "Failed to delete product");
      }
    }
  };

  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle="Sales"
        mainLink="/sales"
        subTitle="Products"
      />
      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title">
            <h2 className="mb-0 d-flex align-items-center">
              Products
              {session?.user?.permissions?.includes("create-products") && (
                <Button
                  variant="outline-primary"
                  size="sm"
                  className="ms-3"
                  href="/sales/products/manage"
                >
                  <FiPlus className="me-2" />
                  New Product
                </Button>
              )}
              {/* <ProductsFilters onFiltersChange={handleFiltersChange} /> */}
            </h2>
          </div>
        </Col>
      </Row>

      {/* {session?.user?.permissions?.includes("view-products") && ( */}
        <GenericListPage
          columns={columns}
          fetchData={fetchProducts}
          title="Products"
          searchPlaceholder="Search products..."
          defaultPageSize={15}
          filters={memoizedFilters}
          refreshKey={refreshKey}
          search
        />
      {/* )} */}
    </React.Fragment>
  );
};

ProductsList.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default ProductsList;
