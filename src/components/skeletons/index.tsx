import React from 'react';

// Skeleton placeholder components
export const TextSkeleton = ({ lines = 5, lastLineWidth = '60%' }: { lines?: number; lastLineWidth?: string }) => (
  <div className="skeleton-container">
    {Array.from({ length: lines }, (_, index) => {
      const lineNumber = index + 1;
      return (
        <div
          key={lineNumber}
          className="skeleton-text"
          style={{
            width: lineNumber === lines ? lastLineWidth : '100%',
            animationDelay: `${lineNumber * 0.1}s`
          }}
        />
      );
    })}
  </div>
);

export const ListSkeleton = ({ items = 3 }: { items?: number }) => (
  <div className="skeleton-list-container">
    {Array.from({ length: items }, (_, index) => (
      <div key={index} className="skeleton-list-item">
        <div className="skeleton-icon" />
        <div className="skeleton-text-line" style={{ animationDelay: `${index * 0.1}s` }} />
      </div>
    ))}
  </div>
);

export const CategorySkeleton = ({ items = 4 }: { items?: number }) => (
  <div className="skeleton-category-container">
    {Array.from({ length: items }, (_, index) => (
      <div key={index} className="mb-2 callType skeleton-category-item">
        <div className="ic_box bg-success skeleton-category-icon-box">
          <div className="skeleton-category-icon" />
        </div>
        <div className="skeleton-category-text-container">
          <div className="skeleton-category-text" style={{ width: `${60 + (index * 10)}%`, animationDelay: `${index * 0.1}s` }} />
        </div>
      </div>
    ))}
  </div>
);

export const TableSkeleton = ({ rows = 3, cols = 3 }: { rows?: number; cols?: number }) => (
  <div className="table-responsive">
    <table className="table-bordered table-sm w-100">
      <thead>
        <tr>
          {Array.from({ length: cols }, (_, i) => (
            <th key={i}>
              <div className="skeleton-table-header" />
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }, (_, rowIndex) => (
          <tr key={rowIndex}>
            {Array.from({ length: cols }, (_, colIndex) => (
              <td key={colIndex}>
                <div className="skeleton-table-cell" style={{ width: colIndex === cols - 1 ? '60%' : '80%', animationDelay: `${(rowIndex * cols + colIndex) * 0.1}s` }} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

