import { FilterTab } from './GenericFilter';
import moment from 'moment';

// User Filters Configuration
export const userFiltersConfig: FilterTab[] = [
  {
    id: 'user-filters',
    title: 'User Information',
    icon: 'ti ti-users',
    fields: [
      {
        type: 'text',
        name: 'name',
        label: 'Name',
        placeholder: 'Type Name'
      },
      {
        type: 'text',
        name: 'email',
        label: 'Email',
        placeholder: 'Type Email'
      },
      {
        type: 'text',
        name: 'phone',
        label: 'Phone',
        placeholder: 'Type Phone'
      }
    ]
  },
  {
    id: 'user-role-group',
    title: 'Role & Group',
    icon: 'ti ti-users',
    fields: [
      {
        type: 'text',
        name: 'role',
        label: 'Role',
        placeholder: 'Type Role'
      },
      {
        type: 'text',
        name: 'group',
        label: 'Group',
        placeholder: 'Type Group'
      }
    ]
  },
  {
    id: 'user-company-department',
    title: 'Company & Department',
    icon: 'ti ti-users',
    fields: [
      {
        type: 'text',
        name: 'department',
        label: 'Department',
        placeholder: 'Type Department'
      },
      {
        type: 'text',
        name: 'company',
        label: 'Company',
        placeholder: 'Type Company'
      },
    ]
  },
  {
    id: 'user-status',
    title: 'User Status',
    icon: 'ti ti-users',
    fields: [
      
      {
        type: 'select',
        name: 'status',
        label: 'Status',
        options: [
          { value: 'Active', label: 'Active' },
          { value: 'InActive', label: 'In-Active' }
        ]
      }
    ]
  }
];

// Role Filters Configuration
export const roleFiltersConfig: FilterTab[] = [
  {
    id: 'roles-filters',
    title: 'Roles Filters',
    icon: 'ti ti-users',
    fields: [
      {
        type: 'text',
        name: 'name',
        label: 'Name',
        placeholder: 'Type Name'
      },
      
    ]
  }
];

// Group Filters Configuration
export const groupFiltersConfig: FilterTab[] = [
  {
    id: 'groups-filters',
    title: 'Groups Filters',
    icon: 'ti ti-users',
    fields: [
      {
        type: 'text',
        name: 'name',
        label: 'Name',
        placeholder: 'Type Name'
      }
    ]
  }
];

// Call Logs Filters Configuration
export const createCallLogsFiltersConfig = (hierarchyData?: any, isVisibleCallDirection: boolean = true): FilterTab[] => {
  const filters: FilterTab[] = [];

  // Conditionally add call direction filter
  if (isVisibleCallDirection) {
    filters.push({
      id: 'call-direction',
      title: 'Call Direction',
      icon: 'ti ti-phone-call',
      fields: [
        {
          type: 'radio',
          name: 'call_direction',
          label: 'Choose Call Direction',
          options: [
            { value: 'OUTGOING', label: 'Outgoing' },
            { value: 'INCOMING', label: 'Incoming' },
            { value: 'Both', label: 'Both' }
          ]
        }
      ]
    });
  }

  // Add other filters
  filters.push(
    
    {
      id: 'call-status',
      title: 'Call Status',
      icon: 'ti ti-phone-call',
      fields: [
       
        {
          type: 'radio',
          name: 'is_answered',
          label: 'Choose Call Status',
          options: [
            { value: 'true', label: 'Answered' },
            { value: 'false', label: 'Not Answered' },
            { value: '', label: 'Both' }
          ]
        }
      ]
    },
    {
      id: 'call-duration',
      title: 'Call Duration',
      icon: 'ti ti-clock',
      fields: [
       
        {
          type: 'number',
          name: 'duration',
          min:1,
          label: 'Type Call Duration',
          placeholder: 'Enter Call Duration'
        }
      ]
    },
    {
      id: 'call-ring-time',
      title: 'Ring Time',
      icon: 'ti ti-clock',
      fields: [
       
        {
          type: 'number',
          name: 'ring_time',
          min:1,
          label: 'Type Ring Time',
          placeholder: 'Enter Ring Time'
        }
      ]
    },
    {
      id: 'duration-operator',
      title: 'Duration Operator',
      icon: 'ti ti-operator',
      fields: [
       
        {
          type: 'select',
          name: 'duration_operator',
          label: 'Duration Operator',
          options: [
            { value: 'lte', label: 'Less than or equal' },
            { value: 'gte', label: 'Greater than or equal' }
          ]
        }
      ]
    },
    {
      id: 'ring-time-operator',
      title: 'Ring Time Operator',
      icon: 'ti ti-operator',
      fields: [
       
        {
          type: 'select',
          name: 'ring_time_operator',
          label: 'Ring Time Operator',
          options: [
            { value: 'lte', label: 'Less than or equal' },
            { value: 'gte', label: 'Greater than or equal' }
          ]
        }
      ]
    },
    {
      id: 'called-numbers',
      title: 'Called Numbers',
      icon: 'ti ti-phone-call',
      fields: [
       
        {
          type: 'multiSelect',
          name: 'called_numbers',
          label: 'Called Numbers',
          // isMulti: true,
          options: []
        }
      ]
    },
    {
      id: 'called-user',
      title: 'Called User',
      icon: 'ti ti-user',
      fields: [
       
        {
          type: 'select',
          name: 'called_user',
          label: 'Called User',
          isMulti: true,
          options: hierarchyData?.users?.map((user: { id: string; name: string }) => ({
            value: user.id,
            label: user.name
          })) || []
        }
      ]
    },
    {
      id: 'call-extensions',
      title: 'Extension',
      icon: 'ti ti-users',
      fields: [
        {
          type: 'select',
          isMulti: true,
          name: 'extension',
          label: 'Extension Names',
          options: hierarchyData?.users?.map((user: { id: string; name: string }) => ({
            value: user.id,
            label: user.name
          })) || []
        },
        {
          type: 'select',
          isMulti: true,
          name: 'extension_number',
          label: 'Extension Numbers',
          options: hierarchyData?.extensions?.map((ext: { id: string; name: string }) => ({
            value: ext.id,
            label: ext.name
          })) || []
        }
      ]
    },
    {
      id: 'traffic-type',
      title: 'Traffic Type',
      icon: 'ti ti-traffic-lights',
      fields: [
       
        {
          type: 'select',
          name: 'traffic_type',
          label: 'Traffic Type',
          isMulti: false,
          options: [
            { value: '', label: 'All' },
            { value: 'internal', label: 'Internal' },
            { value: 'external', label: 'External' },
          ]
        }
      ]
    },
    {
      id: 'destination-type',
      title: 'Destination Type',
      icon: 'ti ti-map-pin',
      fields: [
       
        {
          type: 'select',
          name: 'destination_type',
          label: 'Destination Type',
          isMulti: false,
          options: [
            { value: '', label: 'All' },
            { value: 'local', label: 'Local' },
            { value: 'national', label: 'National' },
            { value: 'international', label: 'International' },
          ]
        }
      ]
    },
    {
      id: 'call-departments',
      title: 'Departments',
      icon: 'ti ti-users',
      fields: [
        {
          type: 'select',
          isMulti: true,
          name: 'department',
          label: 'Departments',
          options: hierarchyData?.departments?.map((dept: { id: string; name: string }) => ({
            value: dept.id,
            label: dept.name
          })) || []
        }
      ]
    },
    {
      id: 'date-range',
      title: 'Date Range',
      icon: 'ti ti-calendar',
      fields: [
        {
          type: 'date',
          name: 'start_datetime',
          label: 'Start Date Time',
          placeholder: 'Select start date and time',
          //value: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' '),
        },
        {
          type: 'date',
          name: 'end_datetime',
          label: 'End Date Time',
          placeholder: 'Select end date and time (must be after start date)',
          //value: new Date().toISOString().slice(0, 19).replace('T', ' '),
        }
      ]
    }
  );

  return filters;
};

// Default Call Logs Filters Configuration (for backward compatibility)
export const callLogsFiltersConfig: FilterTab[] = createCallLogsFiltersConfig();




// Call Logs Filters Configuration
export const createCallRecordingsFiltersConfig = (hierarchyData?: any, isVisibleCallDirection: boolean = true): FilterTab[] => {
  const filters: FilterTab[] = [];

  // Conditionally add call direction filter
  if (isVisibleCallDirection) {
    filters.push({
      id: 'call-direction',
      title: 'Call Direction',
      icon: 'ti ti-phone-call',
      fields: [
        {
          type: 'radio',
          name: 'call_direction',
          label: 'Choose Call Direction',
          options: [
            { value: 'OUTGOING', label: 'Outgoing' },
            { value: 'INCOMING', label: 'Incoming' },
            { value: 'Both', label: 'Both' }
          ]
        }
      ]
    });
  }

  // Add other filters
  filters.push(
    

    
    {
      id: 'call-extensions',
      title: 'Extension',
      icon: 'ti ti-users',
      fields: [
        {
          type: 'select',
          isMulti: true,
          name: 'extension',
          label: 'Extensions',
          options: hierarchyData?.extensions?.map((ext: { id: string; name: string }) => ({
            value: ext.id,
            label: ext.name
          })) || []
        },
        {
          type: 'select',
          isMulti: true,
          name: 'remote_party_number',
          label: 'Remote Party Numbers',
          options: hierarchyData?.extensions?.map((ext: { id: string; name: string }) => ({
            value: ext.id,
            label: ext.name
          })) || []
        }
      ]
    },
    
   
    {
      id: 'date-range',
      title: 'Date Range',
      icon: 'ti ti-calendar',
      fields: [
        {
          type: 'date',
          name: 'start_date',
          label: 'Start Date',
          placeholder: 'Select start date',
          //value: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0] + ' 00:00:00'
        },
        {
          type: 'date',
          name: 'end_date',
          label: 'End Date ',
          placeholder: 'Select end date (must be after start date)',
          //value: new Date().toISOString().split('T')[0] + ' 23:59:59'
        }
      ]
    }
  );

  return filters;
};

export const callRecordingsFiltersConfig: FilterTab[] = createCallRecordingsFiltersConfig();




// Call Logs Filters Configuration
export const createTicketFiltersConfig = (hierarchyData?: any): FilterTab[] => {
  const filters: FilterTab[] = [];

  // Add other filters
  filters.push(
    {
      id: 'module-hierarchy',
      title: 'Module Hierarchy',
      icon: 'ti ti-package',
      description: 'Filter tickets by module, submodule, and submodule child. Select options in order: Module → Submodule → Submodule Child',
      fields: [
        {
          type: 'select',
          isMulti: false,
          name: 'module_id',
          label: 'Module',
          placeholder: 'Select Module',
          options: hierarchyData?.modules?.map((module: { id: string; name: string }) => ({
            value: module.id,
            label: module.name
          })) || []
        },
        {
          type: 'select',
          isMulti: false,
          name: 'submodule_id',
          label: 'Submodule',
          placeholder: hierarchyData?.submodules?.length > 0 ? 'Select Submodule' : 'Select Module first',
          options: hierarchyData?.submodules?.map((submodule: { id: string; name: string }) => ({
            value: submodule.id,
            label: submodule.name
          })) || [],
          disabled: !hierarchyData?.submodules?.length,
          description: 'Select a module first to see available submodules'
        },
        {
          type: 'select',
          isMulti: false,
          name: 'submodule_child_id',
          label: 'Submodule Child',
          placeholder: hierarchyData?.submoduleChildren?.length > 0 ? 'Select Submodule Child' : 'Select Submodule first',
          options: hierarchyData?.submoduleChildren?.map((child: { id: string; name: string }) => ({
            value: child.id,
            label: child.name
          })) || [],
          disabled: !hierarchyData?.submoduleChildren?.length,
          description: 'Select a submodule first to see available submodule children'
        }
      ]
    },
    {
      id: 'status',
      title: 'Status',
      icon: 'ti ti-toggle-right',
      fields: [
        {
          type: 'select',
          isMulti: true,
          name: 'status_id',
          label: 'Status',
          options: hierarchyData?.statuses?.map((status: { id: string; name: string }) => ({
            value: status.id,
            label: status.name
          })) || []
        }
      ]
    },
    {
      id: 'types',
      title: 'Types',
      icon: 'ti ti-tag',
      fields: [
        {
          type: 'select',
          isMulti: true,
          name: 'type_id',
          label: 'Types',
          options: hierarchyData?.types?.map((type: { id: string; name: string }) => ({
            value: type.id,
            label: type.name
          })) || []
        }
      ]
    },
    {
      id: 'call-extensions',
      title: 'Extensions',
      icon: 'ti ti-users',
      fields: [
        {
          type: 'select',
          isMulti: true,
          name: 'extensions',
          label: 'Extensions',
          options: hierarchyData?.extensions?.map((ext: { id: string; name: string,display_name: string }) => ({
            value: ext.id,
            label: ext.display_name+ ' ('+ext.name+')'
          })) || []
        },
        
      ]
    },
    
   
    {
      id: 'date-range',
      title: 'Date Range',
      icon: 'ti ti-calendar',
      fields: [
        {
          type: 'date',
          name: 'start_date',
          label: 'Start Date',
          placeholder: 'Select start date',
          //value: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0] + ' 00:00:00'
        },
        {
          type: 'date',
          name: 'end_date',
          label: 'End Date ',
          placeholder: 'Select end date (must be after start date)',
          //value: new Date().toISOString().split('T')[0] + ' 23:59:59'
        }
      ]
    }
  );

  return filters;
};

export const ticketFiltersConfig: FilterTab[] = createTicketFiltersConfig();





////////////////////////==================== GSM Filters Configuration ====================////////////////////////

// Gsm List Filters Configuration
export const createGsmListFiltersConfig = (hierarchyData?: any): FilterTab[] => [
  
  {
    id: 'ip_address',
    title: 'IP Address',
    icon: 'ti ti-world',
    fields: [
      {
        type: 'text',
        isMulti: true,
        name: 'ip_address',
        label: 'IP Address',
        placeholder: 'Enter IP Address'
      }
    ]
  },

  {
    id: 'device_status',
    title: 'Device Status',
    icon: 'ti ti-power',
    fields: [
      {
        type: 'select',
        isMulti: true,
        name: 'device_status',
        label: 'Device Status',
        options: [
          { value: '', label: 'All' },
          { value: 'power_on', label: 'Power On' },
          { value: 'power_off', label: 'Power Off' }
        ]
      }
    ]
  },
  
 
];



export const createGsmCompanyFiltersConfig = (hierarchyData?: any): FilterTab[] => [
  {
    id: 'gsm_filters',
    title: 'GSM Filters',
    icon: 'ti ti-users',
    fields: [
      {
        type: 'select',
        isMulti: false,
        name: 'gsm',
        label: 'GSM',
        options: hierarchyData?.gsm?.map((gsm: { id: string; name: string }) => ({
          value: gsm.id,
          label: gsm.name
        })) || []
      }
    ]
  },

  {
    id: 'company_filters',
    title: 'Company Filters',
    icon: 'ti ti-building',
    fields: [
      {
        type: 'select',
        isMulti: false,
        name: 'company',
        label: 'Company',
        options: hierarchyData?.company?.map((company: { id: string; name: string }) => ({
          value: company.name,
          label: company.name
        })) || []
      }
    ]
  },
  
 
];

export const createGsmPortFiltersConfig = (hierarchyData?: any): FilterTab[] => [
  {
    id: 'gsm_filters',
    title: 'GSM Filters',
    icon: 'ti ti-filter',
    fields: [
      {
        type: 'select',
        isMulti: false,
        name: 'gsm',
        label: 'GSM',
        options: hierarchyData?.gsm?.map((gsm: { id: string; name: string }) => ({
          value: gsm.id,
          label: gsm.name
        })) || []
      },
      {
        type: 'select',
        isMulti: false,
        name: 'port',
        label: 'Port',
        options: [
          { value: '', label: 'All' },
          { value: 'power_on', label: 'Power On' },
          { value: 'power_off', label: 'Power Off' }
        ]
      }
      
    ]
  },

  {
    id: 'company_filters',
    title: 'Company Filters',
    icon: 'ti ti-building',
    fields: [
      {
        type: 'select',
        isMulti: false,
        name: 'company',
        label: 'Company',
        options: hierarchyData?.company?.map((company: { id: string; name: string }) => ({
          value: company.name,
          label: company.name
        })) || []
      }
    ]
  },

  {
    id: 'sim_status',
    title: 'Sim Status',
    icon: 'ti ti-filter',
    fields: [
      {
        type: 'select',
        isMulti: false,
        name: 'sim_status',
        label: 'Sim Status',
        options: [
          { value: '', label: 'All' },
          { value: 'REGISTER_OK', label: 'REGISTER' },
          { value: 'UNREGISTER_OK', label: 'UNREGISTER' },
          { value: 'NO_SIM', label: 'NO SIM' },
          { value: 'POWER_OFF', label: 'POWER OFF' },
        ]
      }
    ]
  },

  {
    id: 'sim_operator',
    title: 'Sim Operator',
    icon: 'ti ti-filter',
    fields: [
      {
        type: 'select',
        isMulti: false,
        name: 'operator',
        label: 'Sim Operator',
        options: [
          { value: '', label: 'All' },
          { value: 'Etisalat', label: 'Etisalat by e&' },
          { value: 'du', label: 'DU' }
        ]
      }
    ]
  },

  {
    id: 'mobile_number',
    title: 'Mobile Number',
    icon: 'ti ti-phone',
    fields: [
      {
        type: 'text',
        isMulti: false,
        name: 'mobile_number',
        label: 'Mobile Number',
        placeholder: 'Enter Mobile Number'
      }
    ]
  },

  {
    id: 'port_info',
    title: 'Port Info',
    icon: 'ti ti-phone',
    fields: [
      {
        type: 'text',
        isMulti: false,
        name: 'imei',
        label: 'IMEI',
        placeholder: 'Enter IMEI'
      },
      {
        type: 'text',
        isMulti: false,
        name: 'imsi',
        label: 'IMSI',
        placeholder: 'Enter IMSI'
      },
      {
        type: 'text',
        isMulti: false,
        name: 'iccid',
        label: 'ICCID',
        placeholder: 'Enter ICCID'
      }
    ]
  },
  
 
];


export const createGsmInboxFiltersConfig = (hierarchyData?: any): FilterTab[] => [
  {
    id: 'gsm_filters',
    title: 'GSM Filters',
    icon: 'ti ti-filter',
    fields: [
      {
        type: 'select',
        isMulti: false,
        name: 'gsm_id',
        label: 'GSM Device',
        options: [
          { value: '', label: 'All GSM Devices' },
          ...(hierarchyData?.gsm?.map((gsm: { id: string; name: string }) => ({
            value: gsm.id,
            label: gsm.name
          })) || [])
        ]
      }
    ]
  },
  {
    id: 'sender_filters',
    title: 'Sender Filters',
    icon: 'ti ti-phone',
    fields: [
      {
        type: 'text',
        isMulti: false,
        name: 'sender',
        label: 'Sender Number',
        placeholder: 'Enter sender mobile number'
      }
    ]
  }
];
























// Product Filters Configuration
export const productFiltersConfig: FilterTab[] = [
  {
    id: 'product-details',
    title: 'Product Details',
    icon: 'ti ti-package',
    fields: [
      {
        type: 'text',
        name: 'product_name',
        label: 'Product Name',
        placeholder: 'Enter product name'
      },
      {
        type: 'text',
        name: 'sku',
        label: 'SKU',
        placeholder: 'Enter SKU'
      },
      {
        type: 'select',
        name: 'category',
        label: 'Category',
        options: [
          { value: 'electronics', label: 'Electronics' },
          { value: 'clothing', label: 'Clothing' },
          { value: 'books', label: 'Books' },
          { value: 'home', label: 'Home & Garden' }
        ]
      },
      {
        type: 'select',
        name: 'status',
        label: 'Status',
        options: [
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' },
          { value: 'discontinued', label: 'Discontinued' }
        ]
      }
    ]
  },
  {
    id: 'pricing',
    title: 'Pricing',
    icon: 'ti ti-currency-dollar',
    fields: [
      {
        type: 'text',
        name: 'min_price',
        label: 'Minimum Price',
        placeholder: 'Enter minimum price'
      },
      {
        type: 'text',
        name: 'max_price',
        label: 'Maximum Price',
        placeholder: 'Enter maximum price'
      },
      {
        type: 'checkbox',
        name: 'on_sale',
        label: 'On Sale',
        options: [
          { value: 'true', label: 'On Sale' }
        ]
      }
    ]
  }
];

// Order Filters Configuration
export const orderFiltersConfig: FilterTab[] = [
  {
    id: 'order-info',
    title: 'Order Information',
    icon: 'ti ti-shopping-cart',
    fields: [
      {
        type: 'text',
        name: 'order_id',
        label: 'Order ID',
        placeholder: 'Enter order ID'
      },
      {
        type: 'select',
        name: 'order_status',
        label: 'Order Status',
        options: [
          { value: 'pending', label: 'Pending' },
          { value: 'processing', label: 'Processing' },
          { value: 'shipped', label: 'Shipped' },
          { value: 'delivered', label: 'Delivered' },
          { value: 'cancelled', label: 'Cancelled' }
        ]
      },
      {
        type: 'select',
        name: 'payment_status',
        label: 'Payment Status',
        options: [
          { value: 'pending', label: 'Pending' },
          { value: 'paid', label: 'Paid' },
          { value: 'failed', label: 'Failed' },
          { value: 'refunded', label: 'Refunded' }
        ]
      }
    ]
  },
  {
    id: 'order-date',
    title: 'Order Date',
    icon: 'ti ti-calendar',
    fields: [
      {
        type: 'date',
        name: 'order_date',
        label: 'Order Date Range'
      }
    ]
  },
  {
    id: 'customer',
    title: 'Customer',
    icon: 'ti ti-user',
    fields: [
      {
        type: 'text',
        name: 'customer_name',
        label: 'Customer Name',
        placeholder: 'Enter customer name'
      },
      {
        type: 'text',
        name: 'customer_email',
        label: 'Customer Email',
        placeholder: 'Enter customer email'
      }
    ]
  }
];

// Generic Date Range Filter
export const dateRangeFilterConfig: FilterTab[] = [
  {
    id: 'date-range',
    title: 'Date Range',
    icon: 'ti ti-calendar',
    fields: [
      {
        type: 'date',
        name: 'start_date',
        label: 'Start Date',
        placeholder: 'Select start date'
      },
      {
        type: 'date',
        name: 'end_date',
        label: 'End Date',
        placeholder: 'Select end date (must be after start date)'
      }
    ]
  }
];

// Generic Status Filter
export const statusFilterConfig: FilterTab[] = [
  {
    id: 'status',
    title: 'Status',
    icon: 'ti ti-toggle-right',
    fields: [
      {
        type: 'select',
        name: 'status',
        label: 'Status',
        options: [
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' },
          { value: 'pending', label: 'Pending' },
          { value: 'suspended', label: 'Suspended' }
        ]
      }
    ]
  }
];

// Helper function to create custom filter configs
export const createCustomFilterConfig = (
  tabs: FilterTab[],
  showExport: boolean = true,
  exportOptions?: Array<{ label: string; action: () => void }>
) => {
  return {
    tabs,
    showExport,
    exportOptions
  };
}; 

// CRM Filters Configuration
export const createCrmFiltersConfig = (
  stages: any[] = [], 
  campaigns: any[] = [], 
  extensions: any[] = [], 
  staticTags: any[] = []
): FilterTab[] => {
  return [
    {
      id: 'stage',
      title: 'Stage',
      icon: 'ti ti-target',
      fields: [
        {
          type: 'select',
          name: 'stage_id',
          label: 'Stage',
          options: stages.map((stage: { id: number; name: string }) => ({
            value: stage.id.toString(),
            label: stage.name
          })) || []
        }
      ]
    },
    {
      id: 'status',
      title: 'Status',
      icon: 'ti ti-toggle-right',
      fields: [
        {
          type: 'select',
          name: 'is_lost',
          label: 'Lead/Opportunity Status',
          value: 'false',
          options: [
            { value: 'false', label: 'Active' },
            { value: 'true', label: 'Lost' }
          ]
        }
      ]
    },
    {
      id: 'campaigns',
      title: 'Campaigns',
      icon: 'ti ti-target',
      fields: [
        {
          type: 'select',
          isMulti: true,
          name: 'campaign_id',
          label: 'Campaigns',
          options: campaigns.map((campaign: { id: number; name: string }) => ({
            value: campaign.id.toString(),
            label: campaign.name
          })) || []
        }
      ]
    },
    {
      id: 'tags',
      title: 'Tags',
      icon: 'ti ti-tag',
      fields: [
        {
          type: 'select',
          isMulti: true,
          name: 'tags',
          label: 'Tags',
          options: staticTags || []
        }
      ]
    },
    {
      id: 'assignment-status',
      title: 'Assignment Status',
      icon: 'ti ti-user-check',
      fields: [
        {
          type: 'select',
          name: 'assignment_status',
          label: 'Assignment Status',
          options: [
            { value: '', label: 'All' },
            { value: 'assigned', label: 'Assigned' },
            { value: 'unassigned', label: 'Unassigned' }
          ]
        }
      ]
    },
    {
      id: 'user-extensions',
      title: 'Users',
      icon: 'ti ti-users',
      fields: [
        {
          type: 'select',
          isMulti: true,
          name: 'user_extension',
          label: 'Users',
          options: extensions.map((extension: { id: string; display_name: string; name: string }) => ({
            value: extension.id,
            label: extension.display_name || extension.name || extension.id
          })) || []
        }
      ]
    },
    {
      id: 'date-range',
      title: 'Date Range',
      icon: 'ti ti-calendar',
      fields: [
        {
          type: 'date',
          name: 'start_date',
          label: 'Start Date',
          placeholder: 'Select start date'
        },
        {
          type: 'date',
          name: 'end_date',
          label: 'End Date',
          placeholder: 'Select end date (must be after start date)'
        }
      ]
    }
  ];
};

// CRM Data Filters Configuration (for CRM data management page)
export const createCrmDataFiltersConfig = (
  campaigns: any[] = [], 
  extensions: any[] = [], 
  staticTags: any[] = []
): FilterTab[] => {
  return [
    {
      id: 'assignment-status',
      title: 'Assignment Status',
      icon: 'ti ti-user-check',
      fields: [
        {
          type: 'select',
          name: 'assignment_status',
          label: 'Assignment Status',
          options: [
            { value: '', label: 'All' },
            { value: 'assigned', label: 'Assigned' },
            { value: 'unassigned', label: 'Unassigned' }
          ]
        }
      ]
    },
    {
      id: 'user-extensions',
      title: 'Users',
      icon: 'ti ti-users',
      fields: [
        {
          type: 'select',
          isMulti: true,
          name: 'user_extension',
          label: 'Users',
          options: extensions.map((extension: { id: string; display_name: string; name: string }) => ({
            value: extension.id,
            label: extension.display_name || extension.name || extension.id
          })) || []
        }
      ]
    },
    {
      id: 'view-status',
      title: 'View Status',
      icon: 'ti ti-eye',
      fields: [
        {
          type: 'select',
          name: 'is_viewed',
          label: 'View Status',
          options: [
            { value: '', label: 'All' },
            { value: 'true', label: 'Viewed' },
            { value: 'false', label: 'New' }
          ]
        }
      ]
    },
    {
      id: 'date-range',
      title: 'Date Range',
      icon: 'ti ti-calendar',
      fields: [
        {
          type: 'date',
          name: 'start_date',
          label: 'Start Date',
          placeholder: 'Select start date'
        },
        {
          type: 'date',
          name: 'end_date',
          label: 'End Date',
          placeholder: 'Select end date (must be after start date)'
        }
      ]
    }
  ];
}; 

// Sales Order Filters Configuration
export const createSalesOrderFiltersConfig = (stages: any[] = []): FilterTab[] => {
  return [
    {
      id: 'stage',
      title: 'Stage',
      icon: 'ti ti-target',
      fields: [
        {
          type: 'select',
          name: 'stage_id',
          label: 'Order Stage',
          options: stages.map((stage: { id: number; name: string }) => ({
            value: stage.id.toString(),
            label: stage.name
          })) || []
        }
      ]
    },
    {
      id: 'status',
      title: 'Status',
      icon: 'ti ti-toggle-right',
      fields: [
        {
          type: 'select',
          name: 'status',
          label: 'Order Status',
          options: [
            { value: 'pending', label: 'Pending' },
            { value: 'processing', label: 'Processing' },
            { value: 'completed', label: 'Completed' },
            { value: 'cancelled', label: 'Cancelled' }
          ]
        }
      ]
    },
    {
      id: 'date-range',
      title: 'Date Range',
      icon: 'ti ti-calendar',
      fields: [
        {
          type: 'date',
          name: 'date_from',
          label: 'From Date',
          placeholder: 'Select start date'
        },
        {
          type: 'date',
          name: 'date_to',
          label: 'To Date',
          placeholder: 'Select end date'
        }
      ]
    }
  ];
};

// Campaign Filters Configuration
export const createCampaignFiltersConfig = (): FilterTab[] => {
  return [
    {
      id: 'campaign-status',
      title: 'Campaign Status',
      icon: 'ti ti-toggle-right',
      fields: [
        {
          type: 'select',
          name: 'status',
          label: 'Status',
          options: [
            { value: '', label: 'All Statuses' },
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' }
          ]
        }
      ]
    },
    {
      id: 'campaign-dates',
      title: 'Campaign Dates',
      icon: 'ti ti-calendar',
      fields: [
        {
          type: 'date',
          name: 'date_from',
          label: 'Start Date From',
          placeholder: 'Select start date'
        },
        {
          type: 'date',
          name: 'date_to',
          label: 'End Date To',
          placeholder: 'Select end date'
        }
      ]
    },
    {
      id: 'campaign-search',
      title: 'Search',
      icon: 'ti ti-search',
      fields: [
        {
          type: 'text',
          name: 'search',
          label: 'Search Campaigns',
          placeholder: 'Search by name or description'
        }
      ]
    }
  ];
}; 