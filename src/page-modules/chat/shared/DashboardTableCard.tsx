import React from "react";
import { Card } from "react-bootstrap";

export function DashboardTableCard(
  props: Readonly<{
    title: string;
    children: React.ReactNode;
    compact?: boolean;
  }>,
) {
  const { title, children, compact } = props;
  return (
    <Card className="h-100 border-0 shadow-sm">
      <Card.Body className={compact ? "py-2 px-3" : undefined}>
        <h5 className={`fw-semibold ${compact ? "mb-2 fs-6" : "mb-3"}`}>
          {title}
        </h5>
        <div className="table-responsive mb-0">{children}</div>
      </Card.Body>
    </Card>
  );
}
