import React, { useState, useEffect } from 'react';
import CustomDataTable, { Column, ServerPaginationInfo } from './CustomDataTable';

// Example API function (replace with your actual API)
const fetchUsersFromAPI = async (params: any) => {
  // Simulate API call with Laravel-style response
  const { page = 1, perPage = 15, search = "", draw = 1 } = params;
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Simulate Laravel pagination response
  const totalItems = 150; // Total items in database
  const totalPages = Math.ceil(totalItems / perPage);
  const startIndex = (page - 1) * perPage;
  const endIndex = startIndex + perPage;
  
  // Generate mock data
  const mockData = Array.from({ length: Math.min(perPage, totalItems - startIndex) }, (_, index) => ({
    id: startIndex + index + 1,
    ldap_uid: `uid${startIndex + index + 1}`,
    name: `User ${startIndex + index + 1}`,
    email: `user${startIndex + index + 1}@example.com`,
    phone: `+1-555-${String(startIndex + index + 1).padStart(4, '0')}`,
    ou: `OU${Math.floor((startIndex + index) / 10) + 1}`,
    department: `Dept ${Math.floor((startIndex + index) / 5) + 1}`,
    company: 'Example Corp',
    role: ['Admin', 'User', 'Manager'][(startIndex + index) % 3],
    group: ['Group A', 'Group B', 'Group C'][(startIndex + index) % 3],
    status: ['Active', 'Inactive'][(startIndex + index) % 2],
    last_synced_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
  }));

  // Filter by search term if provided
  const filteredData = search 
    ? mockData.filter(user => 
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase()) ||
        user.company.toLowerCase().includes(search.toLowerCase())
      )
    : mockData;

  return {
    draw: draw,
    recordsTotal: totalItems,
    recordsFiltered: filteredData.length,
    users: filteredData,
    meta: {
      current_page: page,
      total: totalItems,
      per_page: perPage,
      last_page: totalPages,
      next_page_url: page < totalPages ? `/api/users?page=${page + 1}` : null,
      prev_page_url: page > 1 ? `/api/users?page=${page - 1}` : null,
    }
  };
};

// Example columns configuration
const exampleColumns: Column[] = [
  {
    key: 'ID',
    name: 'ID',
    selector: (row: any) => row.id,
    sortable: true
  },
  {
    key: 'LDAP UID',
    name: 'LDAP UID',
    selector: (row: any) => row.ldap_uid,
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
    key: 'Phone',
    name: 'Phone',
    selector: (row: any) => row.phone,
    sortable: true
  },
  {
    key: 'Department',
    name: 'Department',
    selector: (row: any) => row.department,
    sortable: true
  },
  {
    key: 'Company',
    name: 'Company',
    selector: (row: any) => row.company,
    sortable: true
  },
  {
    key: 'Role',
    name: 'Role',
    selector: (row: any) => row.role,
    sortable: true,
    cell: (props: any) => (
      <span className={`badge ${props.role === 'Admin' ? 'bg-danger' : props.role === 'Manager' ? 'bg-warning' : 'bg-success'}`}>
        {props.role}
      </span>
    )
  },
  {
    key: 'Status',
    name: 'Status',
    selector: (row: any) => row.status,
    sortable: true,
    cell: (props: any) => (
      <span className={`badge ${props.status === 'Active' ? 'bg-success' : 'bg-secondary'}`}>
        {props.status}
      </span>
    )
  },
  {
    key: 'Last Synced',
    name: 'Last Synced',
    selector: (row: any) => row.last_synced_at,
    sortable: true,
    cell: (props: any) => (
      <span>{new Date(props.last_synced_at).toLocaleDateString()}</span>
    )
  },
  {
    key: 'Actions',
    name: 'Actions',
    selector: (row: any) => row.id,
    sortable: false,
    cell: (props: any) => (
      <div className="d-flex gap-2">
        <button className="btn btn-sm btn-primary">Edit</button>
        <button className="btn btn-sm btn-info">View</button>
        <button className="btn btn-sm btn-danger">Delete</button>
      </div>
    )
  }
];

// Example component showing server-side pagination
const CustomDataTableServerExample: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [paginationInfo, setPaginationInfo] = useState<ServerPaginationInfo>({
    totalRows: 0,
    totalPages: 0,
    currentPage: 1,
    perPage: 15
  });
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [draw, setDraw] = useState<number>(1);

  // Function to fetch data with server-side pagination
  const fetchData = async (page: number = 1, perPage: number = 15, search: string = "") => {
    setLoading(true);
    try {
      const response = await fetchUsersFromAPI({
        page,
        perPage,
        search,
        draw: draw + 1
      });
      
      setDraw(prev => prev + 1);
      
      // Handle Laravel pagination response format
      if (response && response.users && response.meta) {
        setData(response.users);
        setPaginationInfo({
          totalRows: response.meta.total,
          totalPages: response.meta.last_page,
          currentPage: response.meta.current_page,
          perPage: response.meta.per_page
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Server-side pagination handlers
  const handlePageChange = (page: number) => {
    fetchData(page, paginationInfo.perPage, searchTerm);
  };

  const handlePerPageChange = (perPage: number) => {
    fetchData(1, perPage, searchTerm);
  };

  const handleSearch = (search: string) => {
    setSearchTerm(search);
    fetchData(1, paginationInfo.perPage, search);
  };

  const handleRowClick = (row: any) => {
    
  };

  return (
    <div className="p-4">
      <h1>Server-Side Pagination Example</h1>
      <p className="text-muted mb-4">
        This example demonstrates server-side pagination with Laravel-style API response format.
        The pagination, search, and page size changes are handled by the server.
      </p>
      
      <CustomDataTable
        columns={exampleColumns}
        data={data}
        title="Users with Server-Side Pagination"
        loading={loading}
        defaultPageSize={15}
        pageSizeOptions={[10, 15, 25, 50]}
        searchPlaceholder="Search users by name, email, or company..."
        onRowClick={handleRowClick}
        // Server-side pagination props
        serverSide={true}
        paginationInfo={paginationInfo}
        onPageChange={handlePageChange}
        onPerPageChange={handlePerPageChange}
        onSearch={handleSearch}
      />

      <div className="mt-4 p-3 bg-light rounded">
        <h5>Current State:</h5>
        <ul className="mb-0">
          <li>Total Rows: {paginationInfo.totalRows}</li>
          <li>Current Page: {paginationInfo.currentPage}</li>
          <li>Per Page: {paginationInfo.perPage}</li>
          <li>Total Pages: {paginationInfo.totalPages}</li>
          <li>Search Term: "{searchTerm}"</li>
          <li>Data Items: {data.length}</li>
        </ul>
      </div>
    </div>
  );
};

export default CustomDataTableServerExample; 