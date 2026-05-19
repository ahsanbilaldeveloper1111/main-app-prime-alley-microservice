import React from "react";
import { Badge, Button, Form, Spinner, Table } from "react-bootstrap";
import { Edit, Eye, PlusCircle, Trash2 } from "lucide-react";
import type { CrmProduct } from "@utils/crm";

export interface IndustryProductsSectionProps {
  industryProducts: CrmProduct[];
  loadingProducts: boolean;
  canCreateProduct: boolean;
  canEditProduct: boolean;
  canDeleteProduct: boolean;
  onAddProduct: () => void;
  onViewProduct: (p: CrmProduct) => void;
  onEditProduct: (p: CrmProduct) => void;
  onDeleteProduct: (p: CrmProduct) => void;
}

function formatProductPrice(price: string | null | undefined): string {
  return Number.parseFloat(price || "0").toFixed(2);
}

function ProductActionsCell({
  product,
  canEditProduct,
  canDeleteProduct,
  onViewProduct,
  onEditProduct,
  onDeleteProduct,
}: Readonly<{
  product: CrmProduct;
  canEditProduct: boolean;
  canDeleteProduct: boolean;
  onViewProduct: (p: CrmProduct) => void;
  onEditProduct: (p: CrmProduct) => void;
  onDeleteProduct: (p: CrmProduct) => void;
}>) {
  return (
    <div className="d-flex gap-1">
      <Button
        variant="link"
        size="sm"
        className="p-1"
        title="View"
        onClick={() => onViewProduct(product)}
      >
        <Eye size={16} />
      </Button>
      {canEditProduct && (
        <Button
          variant="link"
          size="sm"
          className="p-1"
          title="Edit"
          onClick={() => onEditProduct(product)}
        >
          <Edit size={16} />
        </Button>
      )}
      {canDeleteProduct && (
        <Button
          variant="link"
          size="sm"
          className="p-1 text-danger"
          title="Delete"
          onClick={() => onDeleteProduct(product)}
        >
          <Trash2 size={16} />
        </Button>
      )}
    </div>
  );
}

/** Renders the list of products belonging to a product group inside the detail modal. */
export function IndustryProductsSection({
  industryProducts,
  loadingProducts,
  canCreateProduct,
  canEditProduct,
  canDeleteProduct,
  onAddProduct,
  onViewProduct,
  onEditProduct,
  onDeleteProduct,
}: Readonly<IndustryProductsSectionProps>) {
  return (
    <div className="mb-3 mt-4">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <Form.Label className="text-muted small mb-0">
          Products ({industryProducts.length})
        </Form.Label>
        <div className="d-flex align-items-center gap-2">
          {canCreateProduct && (
            <Button
              variant="primary"
              size="sm"
              onClick={onAddProduct}
              className="d-flex align-items-center gap-1"
            >
              <PlusCircle size={14} />
              Add Product
            </Button>
          )}
        </div>
      </div>

      {loadingProducts && (
        <div className="text-center py-3">
          <Spinner animation="border" size="sm" variant="primary" />
          <p className="text-muted small mt-2 mb-0">Loading products...</p>
        </div>
      )}

      {!loadingProducts && industryProducts.length === 0 && (
        <div className="text-center py-3 border rounded">
          <p className="text-muted small mb-0">
            No products found for this product group
          </p>
        </div>
      )}

      {!loadingProducts && industryProducts.length > 0 && (
        <div className="border rounded industries-product-table-wrap">
          <Table hover className="mb-0 industries-product-table">
            <thead className="bg-light">
              <tr>
                <th>Product Name</th>
                <th>SKU</th>
                <th>Price</th>
                <th>Currency</th>
                <th>Category</th>
                <th>Brand</th>
                <th>Status</th>
                <th className="industries-product-table-actions-col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {industryProducts.map((product) => (
                <tr key={product.id}>
                  <td className="fw-semibold">{product.name}</td>
                  <td>
                    <Badge bg="light" text="dark" className="font-monospace">
                      {product.sku}
                    </Badge>
                  </td>
                  <td className="fw-semibold text-success">
                    {product.currency} {formatProductPrice(product.price)}
                  </td>
                  <td>{product.currency}</td>
                  <td>
                    <Badge bg="info" className="bg-opacity-10 text-dark">
                      {product.category || "N/A"}
                    </Badge>
                  </td>
                  <td>{product.brand || "N/A"}</td>
                  <td>
                    <Badge bg={product.active ? "success" : "secondary"}>
                      {product.active ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="industries-product-table-actions-col">
                    <ProductActionsCell
                      product={product}
                      canEditProduct={canEditProduct}
                      canDeleteProduct={canDeleteProduct}
                      onViewProduct={onViewProduct}
                      onEditProduct={onEditProduct}
                      onDeleteProduct={onDeleteProduct}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}
    </div>
  );
}
