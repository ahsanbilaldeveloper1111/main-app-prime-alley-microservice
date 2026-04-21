import React from "react";
import { Table } from "react-bootstrap";
import { formatOrderCurrencyAmount } from "./orderViewModalUtils";

const thStyle: React.CSSProperties = {
  padding: "12px 16px",
  fontSize: "11px",
  fontWeight: 700,
  color: "#6b7280",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const tdBase: React.CSSProperties = {
  padding: "14px 16px",
  fontSize: "13px",
  color: "#1f2937",
};

const footerLabelCell: React.CSSProperties = {
  padding: "12px 16px",
  textAlign: "right",
  fontSize: "13px",
  color: "#6b7280",
};

const footerValueCell: React.CSSProperties = {
  padding: "12px 16px",
  fontSize: "13px",
  color: "#1f2937",
};

export function OrderViewModalOrderItemsTable(props: {
  readonly viewingOrder: {
    currency?: string;
    items?: unknown[];
    total_amount?: string;
    discount_amount?: string;
    tax_amount?: string;
    final_amount?: string;
  };
  readonly hasItemDescriptionColumn: boolean;
  readonly footerColSpan: number;
}): React.ReactElement {
  const { viewingOrder, hasItemDescriptionColumn, footerColSpan } = props;
  const items = Array.isArray(viewingOrder.items) ? viewingOrder.items : [];
  const currency = viewingOrder.currency;

  return (
    <div
      style={{
        background: "white",
        border: "1px solid #e5e7eb",
        borderRadius: "12px",
        overflow: "hidden",
      }}
    >
      <div style={{ overflowX: "auto" }}>
        <Table
          hover
          style={{
            width: "100%",
            marginBottom: 0,
            tableLayout: "auto",
          }}
        >
          <thead style={{ background: "#f9fafb" }}>
            <tr>
              <th style={thStyle}>#</th>
              <th style={thStyle}>Product Name</th>
              <th style={thStyle}>SKU</th>
              <th style={thStyle}>Quantity</th>
              {hasItemDescriptionColumn ? (
                <th style={thStyle}>Description</th>
              ) : null}
              <th style={thStyle}>Unit Price</th>
              <th style={thStyle}>Total Price</th>
            </tr>
          </thead>
          <tbody>
            {items.map((rawItem: unknown, index: number) => {
              const item = rawItem as {
                id?: unknown;
                product_name?: string;
                product?: { name?: string; sku?: string };
                quantity?: string;
                description?: string;
                unit_price?: string;
                total_price?: string;
              };
              const rowKey =
                item.id != null &&
                (typeof item.id === "string" || typeof item.id === "number")
                  ? String(item.id)
                  : `row-${index}`;
              return (
                <tr
                  key={rowKey}
                  style={{ borderBottom: "1px solid #f3f4f6" }}
                >
                  <td style={tdBase}>{index + 1}</td>
                  <td
                    style={{
                      ...tdBase,
                      fontWeight: 600,
                    }}
                  >
                    {item.product_name || item.product?.name || "N/A"}
                  </td>
                  <td style={{ ...tdBase, color: "#6b7280" }}>
                    {item.product?.sku || "N/A"}
                  </td>
                  <td style={tdBase}>{item.quantity || "0"}</td>
                  {hasItemDescriptionColumn ? (
                    <td
                      style={{
                        ...tdBase,
                        color: "#6b7280",
                        maxWidth: "200px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.description || "-"}
                    </td>
                  ) : null}
                  <td style={tdBase}>
                    {formatOrderCurrencyAmount(currency, item.unit_price)}
                  </td>
                  <td style={{ ...tdBase, fontWeight: 600 }}>
                    {formatOrderCurrencyAmount(currency, item.total_price)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot style={{ background: "#f9fafb", fontWeight: 600 }}>
            <tr>
              <td colSpan={footerColSpan} style={footerLabelCell}>
                Subtotal:
              </td>
              <td style={footerValueCell}>
                {formatOrderCurrencyAmount(currency, viewingOrder.total_amount)}
              </td>
            </tr>
            {viewingOrder.discount_amount &&
            Number.parseFloat(viewingOrder.discount_amount) > 0 ? (
              <tr>
                <td colSpan={footerColSpan} style={footerLabelCell}>
                  Discount:
                </td>
                <td style={{ ...footerValueCell, color: "#dc2626" }}>
                  -{" "}
                  {formatOrderCurrencyAmount(
                    currency,
                    viewingOrder.discount_amount,
                  )}
                </td>
              </tr>
            ) : null}
            {viewingOrder.tax_amount &&
            Number.parseFloat(viewingOrder.tax_amount) > 0 ? (
              <tr>
                <td colSpan={footerColSpan} style={footerLabelCell}>
                  Tax:
                </td>
                <td style={footerValueCell}>
                  {formatOrderCurrencyAmount(
                    currency,
                    viewingOrder.tax_amount,
                  )}
                </td>
              </tr>
            ) : null}
            <tr style={{ fontSize: "16px" }}>
              <td
                colSpan={footerColSpan}
                style={{
                  ...footerLabelCell,
                  fontSize: "14px",
                  color: "#1f2937",
                  fontWeight: 700,
                }}
              >
                Total:
              </td>
              <td
                style={{
                  ...footerValueCell,
                  fontSize: "14px",
                  fontWeight: 700,
                }}
              >
                {formatOrderCurrencyAmount(
                  currency,
                  viewingOrder.final_amount ?? viewingOrder.total_amount,
                )}
              </td>
            </tr>
          </tfoot>
        </Table>
      </div>
    </div>
  );
}
