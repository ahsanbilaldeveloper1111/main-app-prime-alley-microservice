import React from 'react';
import Link from 'next/link';
import { Col } from 'react-bootstrap';
import EmptyState from '@components/EmptyState';

export interface CallDashboardStatsTableColumn<T> {
  header: string;
  cell: (row: T) => React.ReactNode;
}

export interface CallDashboardStatsTableProps<T> {
  show: boolean;
  title: string;
  emptyTitle: string;
  emptyDescription: string;
  data: T[];
  columns: CallDashboardStatsTableColumn<T>[];
  viewAllHref: string;
  viewAllLabel?: string;
}

function primitiveKeyPart(value: unknown): string | undefined {
  if (value == null || value === '') return undefined;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return undefined;
}

function previewRowKey(row: Record<string, unknown>, index: number): string {
  const ext = primitiveKeyPart(row.Extension);
  if (ext !== undefined) {
    return `ext-${ext}-${index}`;
  }
  const country = primitiveKeyPart(row.Country);
  if (country !== undefined) {
    return `country-${country}-${index}`;
  }
  return `row-${index}`;
}

function CallDashboardStatsTable<T>({
  show,
  title,
  emptyTitle,
  emptyDescription,
  data,
  columns,
  viewAllHref,
  viewAllLabel = 'View All',
}: Readonly<CallDashboardStatsTableProps<T>>): React.ReactElement | null {
  if (!show) return null;

  return (
    <Col xs={12} lg={6}>
      <div className="card">
        <div className="card-body">
          {data.length === 0 ? (
            <EmptyState
              title={emptyTitle}
              description={emptyDescription}
              isTableRow={true}
              colSpan={columns.length}
            />
          ) : (
            <>
              <h5 className="mb-0 app-title-heading">{title}</h5>
              <div className="table-responsive">
                <table className="table table-bordered table-striped table-sm ">
                  <thead>
                    <tr>
                      {columns.map((col) => (
                        <th key={col.header}>{col.header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((row, index) => {
                      const r = row as Record<string, unknown>;
                      const rowKey = previewRowKey(r, index);
                      return (
                        <tr key={rowKey}>
                          {columns.map((col) => (
                            <td key={col.header}>{col.cell(row)}</td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div className="d-flex justify-content-center">
                  <Link href={viewAllHref} className="link-primary">
                    {viewAllLabel}
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Col>
  );
}

export default CallDashboardStatsTable;
