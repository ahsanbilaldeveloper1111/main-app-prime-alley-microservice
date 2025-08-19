import React, { useState, useEffect } from 'react';
import CustomDataTable, { Column } from './CustomDataTable';

// Example data
const sampleData = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    role: 'Admin',
    status: 'Active',
    department: 'IT',
    lastLogin: '2024-01-15'
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'User',
    status: 'Active',
    department: 'HR',
    lastLogin: '2024-01-14'
  },
  // Add more sample data as needed
];

// Example columns configuration
const exampleColumns: Column[] = [
  {
    key: 'ID',
    name: 'ID',
    selector: (row: any) => row.id,
    sortable: true
  },
  {
    key: 'Name',
    name: 'Name',
    selector: (row: any) => row.name,
    sortable: true
  },
  {
    key: 'Email',
    name: 'Email',
    selector: (row: any) => row.email,
    sortable: true
  },
  {
    key: 'Role',
    name: 'Role',
    selector: (row: any) => row.role,
    sortable: true
  },
  {
    key: 'Status',
    name: 'Status',
    selector: (row: any) => row.status,
    sortable: true,
    cell: (props: any) => (
      <span className={`badge ${props.status === 'Active' ? 'bg-success' : 'bg-danger'}`}>
        {props.status}
      </span>
    )
  },
  {
    key: 'Department',
    name: 'Department',
    selector: (row: any) => row.department,
    sortable: true
  },
  {
    key: 'Last Login',
    name: 'Last Login',
    selector: (row: any) => row.lastLogin,
    sortable: true
  },
  {
    key: 'Actions',
    name: 'Actions',
    selector: (row: any) => row.id,
    sortable: false,
    cell: (props: any) => (
      <div className="d-flex gap-2">
        <button className="btn btn-sm btn-primary">Edit</button>
        <button className="btn btn-sm btn-danger">Delete</button>
      </div>
    )
  }
];

// Example component showing different configurations
const CustomDataTableExample: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setData(sampleData);
      setLoading(false);
    }, 1000);
  }, []);

  const handleRowClick = (row: any) => {
    
  };

  return (
    <div className="p-4">
      <h1>CustomDataTable Examples</h1>
      
      {/* Basic Example */}
      <div className="mb-5">
        <h3>Basic Example</h3>
        <CustomDataTable
          columns={exampleColumns}
          data={data}
          title="Basic DataTable"
          loading={loading}
          onRowClick={handleRowClick}
        />
      </div>

      {/* Custom Configuration Example */}
      <div className="mb-5">
        <h3>Custom Configuration</h3>
        <CustomDataTable
          columns={exampleColumns.slice(0, 4)} // Only first 4 columns
          data={data}
          title="Custom Configuration"
          loading={loading}
          defaultPageSize={5}
          pageSizeOptions={[5, 10, 25]}
          searchPlaceholder="Search users..."
          showColumnVisibility={false}
          showPageSizeSelector={false}
          className="table-striped"
          striped={true}
          highlightOnHover={true}
          pointerOnHover={true}
        />
      </div>

      {/* Minimal Example */}
      <div className="mb-5">
        <h3>Minimal Example</h3>
        <CustomDataTable
          columns={exampleColumns.slice(0, 3)}
          data={data}
          loading={loading}
          showSearch={false}
          showColumnVisibility={false}
          showPageSizeSelector={false}
        />
      </div>
    </div>
  );
};

export default CustomDataTableExample; 