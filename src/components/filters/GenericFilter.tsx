import React, { useState, useRef, useEffect } from "react";
import { Button, Card, Col, Dropdown, Row } from 'react-bootstrap';
import DatePicker from "react-datepicker";
import CreatableSelect from 'react-select/creatable';
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "react-toastify";
import Select from 'react-select';


interface SelectOption {
  value: number;
  label: string;
}

// Types for the generic filter system
  export interface FilterField {
    type: 'text' | 'select' | 'date' | 'multiSelect' | 'radio' | 'checkbox' | 'number';
  name: string;
  label: string;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  defaultValue?: any;
  validation?: (value: any) => boolean;
  isMulti?: boolean;
  min?: number;
  value?: any;
}

export interface FilterTab {
  id: string;
  title: string;
  icon: string;
  fields: FilterField[];
}

export interface GenericFilterProps {
  tabs: FilterTab[];
  onFiltersChange?: (filters: Record<string, any>) => void;
  showExport?: boolean;
  showFilters?: boolean;
  exportOptions?: Array<{ label: string; value: string }>;
  onExport?: (exportType: string, filters: Record<string, any>) => void;
  additionalButtons?: React.ReactNode;
  dropdownWidth?: string;
  controlledFilters?: Record<string, any>; // Allow external control of filters
  onReset?: () => void; // Callback for when component is reset
}

export default function GenericFilter({ 
  tabs, 
  onFiltersChange, 
  showExport = false, 
  showFilters = false,
  exportOptions = [
    { label: 'Excel', value: 'excel' },
    //{ label: 'PDF', value: 'pdf' }
  ],
  onExport,
  additionalButtons,
  dropdownWidth = '500px',
  controlledFilters,
  onReset
}: GenericFilterProps) {
  const [selectedFilters, setSelectedFilters] = useState<Record<string, any>>({});
  const [multiSelectValues, setMultiSelectValues] = useState<Record<string, any[]>>({});
  const [dateValues, setDateValues] = useState<Record<string, Date | undefined>>({});
  const [activeTab, setActiveTab] = useState(0);
  const [resetKey, setResetKey] = useState(0); // Add reset key for forcing re-render
  const [hasBeenCleared, setHasBeenCleared] = useState(false); // Flag to track if filters have been cleared
  const isInitialized = useRef(false); // Ref to track if component has been initialized
  const prevTabs = useRef(tabs); // Ref to track previous tabs to detect changes
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Initialize default values from field.value properties
  useEffect(() => {
    // Reset initialization flag when tabs change to allow re-initialization with new defaults
    if (JSON.stringify(tabs) !== JSON.stringify(prevTabs.current)) {
      isInitialized.current = false;
      setHasBeenCleared(false);
      prevTabs.current = tabs;
    }
    
    // Only initialize if filters haven't been cleared
    if (hasBeenCleared) {
      return;
    }
    
    const initialFilters: Record<string, any> = {};
    const initialDateValues: Record<string, Date | undefined> = {};
    
    tabs.forEach(tab => {
      tab.fields.forEach(field => {
        if (field.value !== undefined && field.value !== null) {
          if (field.type === 'date') {
            // Use the field.value directly since it's already in YYYY-MM-DD HH:mm:ss format
            initialFilters[field.name] = field.value;
            // Also set the dateValues for the DatePicker component
            initialDateValues[field.name] = new Date(field.value);
          } else {
            initialFilters[field.name] = field.value;
          }
        }
      });
    });
    
    if (Object.keys(initialFilters).length > 0) {
      setSelectedFilters(initialFilters);
      // Also set the dateValues for date fields
      if (Object.keys(initialDateValues).length > 0) {
        setDateValues(initialDateValues);
      }
      // Send initial filters to API only once during initialization and only if not already initialized
      if (onFiltersChange && !isInitialized.current) {
        isInitialized.current = true;
        onFiltersChange(initialFilters);
      }
    }
  }, [tabs, hasBeenCleared, onFiltersChange]);

  // Sync with controlledFilters when provided
  useEffect(() => {
    if (controlledFilters) {
      setSelectedFilters(controlledFilters);
      // Also sync dateValues for date fields
      const newDateValues: Record<string, Date | undefined> = {};
      tabs.forEach(tab => {
        tab.fields.forEach(field => {
          if (field.type === 'date' && controlledFilters[field.name]) {
            const dateString = controlledFilters[field.name];
            if (dateString) {
              newDateValues[field.name] = new Date(dateString);
            }
          }
        });
      });
      setDateValues(newDateValues);
    }
  }, [controlledFilters, tabs]);

  // Initialize dateValues from selectedFilters when selectedFilters changes
  useEffect(() => {
    const newDateValues: Record<string, Date | undefined> = {};
    tabs.forEach(tab => {
      tab.fields.forEach(field => {
        if (field.type === 'date' && selectedFilters[field.name]) {
          const dateString = selectedFilters[field.name];
          if (dateString) {
            newDateValues[field.name] = new Date(dateString);
          }
        }
      });
    });
    setDateValues(prev => ({ ...prev, ...newDateValues }));
  }, [selectedFilters, tabs]);

  const handleFilterChange = (fieldName: string, value: any) => {
    setSelectedFilters((prev) => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const handleMultiSelectChange = (fieldName: string, selected: any) => {
    const values = selected ? selected.map((opt: any) => opt.value) : [];
    setMultiSelectValues((prev) => ({
      ...prev,
      [fieldName]: selected || []
    }));
    setSelectedFilters((prev) => ({
      ...prev,
      [fieldName]: values
    }));
  };

  const handleDateChange = (fieldName: string, date: Date) => {
    setDateValues((prev) => ({
      ...prev,
      [fieldName]: date
    }));
    
    setSelectedFilters((prev) => ({
      ...prev,
      [fieldName]: date ? formatDateToCustomFormat(date) : null
    }));

    // Real-time validation for date range
    validateDateRangeRealTime(fieldName, date);
  };

  // Real-time date range validation
  const validateDateRangeRealTime = (changedFieldName: string, changedDate: Date) => {
    // Check for common date range field pairs
    const dateRangePairs = [
      { start: 'start_datetime', end: 'end_datetime' },
      { start: 'start_date', end: 'end_date' }
    ];

    for (const pair of dateRangePairs) {
      if (changedFieldName === pair.start || changedFieldName === pair.end) {
        const startDate = changedFieldName === pair.start ? changedDate : selectedFilters[pair.start];
        const endDate = changedFieldName === pair.end ? changedDate : selectedFilters[pair.end];
        
        if (startDate && endDate) {
          const start = new Date(startDate);
          const end = new Date(endDate);
          
          // Check if dates are valid
          if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return; // Skip validation for invalid dates
          }
          
          if (end < start) {
            // Show warning toast for real-time validation
            const startStr = start.toLocaleDateString();
            const endStr = end.toLocaleDateString();
            toast.warning(`Date range issue: End date (${endStr}) is earlier than start date (${startStr})`);
          }
        }
        break;
      }
    }
  };

  // Helper function to format date as YYYY-MM-DD HH:mm:ss
  const formatDateToCustomFormat = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  // Add date range validation function
  const validateDateRange = (): boolean => {
    // Check for common date range field pairs
    const dateRangePairs = [
      { start: 'start_datetime', end: 'end_datetime' },
      { start: 'start_date', end: 'end_date' }
    ];

    for (const pair of dateRangePairs) {
      const startDate = selectedFilters[pair.start];
      const endDate = selectedFilters[pair.end];
      
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        // Check if dates are valid
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          toast.error(`Invalid date format detected`);
          return false;
        }
        
        if (end < start) {
          toast.error(`End date (${end.toLocaleDateString()}) cannot be earlier than start date (${start.toLocaleDateString()})`);
          return false;
        }
      }
    }
    
    return true;
  };

  const handleApplyFilters = () => {
    // Validate date range before applying filters
    if (!validateDateRange()) {
      return;
    }

    if (dropdownRef.current) {
      dropdownRef.current.classList.remove("show");
      dropdownRef.current.blur();
      //toast.success("Filters applied successfully");
    }
    
    if (onFiltersChange) {
      onFiltersChange(selectedFilters);
    }
    
    // Remove the resetFormFieldsToCurrentState call that was causing date filters to reset
    // setTimeout(() => {
    //   resetFormFieldsToCurrentState();
    // }, 0);
  };

  const clearFilters = () => {
    // Get default values from field definitions
    const defaultFilters = getDefaultValues();
    
    //console.log('Clearing filters, preserving defaults:', defaultFilters);
    
    // Only clear non-default filters, preserve default values
    setSelectedFilters(defaultFilters);
    setMultiSelectValues({});
    
    // Reset dateValues but preserve default date values
    const defaultDateValues: Record<string, Date | undefined> = {};
    tabs.forEach(tab => {
      tab.fields.forEach(field => {
        if (field.type === 'date' && field.value) {
          const dateString = field.value;
          if (dateString) {
            defaultDateValues[field.name] = new Date(dateString);
          }
        }
      });
    });
    setDateValues(defaultDateValues);
    
    setResetKey(prev => prev + 1); // Force re-render of all form components
    setHasBeenCleared(true); // Set flag to true after clearing
    isInitialized.current = false; // Reset initialization flag to allow re-initialization with new defaults
    
    // Only call onFiltersChange if there are actual default filters to apply
    if (onFiltersChange && Object.keys(defaultFilters).length > 0) {
      onFiltersChange(defaultFilters);
    }
    
    // Force a re-render of form fields to show cleared state
    setTimeout(() => {
      resetFormFieldsToCurrentState();
    }, 0);
  };

  const resetToDefaults = () => {
    setHasBeenCleared(false); // Reset the flag to allow default initialization
    isInitialized.current = false; // Reset initialization flag to force re-initialization
    setResetKey(prev => prev + 1); // Force re-render
  };

  // Function to force reset component with new default values
  const forceResetWithNewDefaults = () => {
    setHasBeenCleared(false);
    isInitialized.current = false;
    setSelectedFilters({});
    setDateValues({});
    setMultiSelectValues({});
    setResetKey(prev => prev + 1);
    
    // Don't call onReset immediately to prevent cascading effects
    // The initialization useEffect will handle calling onFiltersChange when ready
  };

  // Manual reset function that can be called explicitly
  const manualReset = () => {
    forceResetWithNewDefaults();
    if (onReset) {
      onReset();
    }
  };

  const removeFilter = (key: string) => {
    // Check if this field has a default value
    let hasDefaultValue = false;
    let defaultValue = null as any;
    let isDateField = false;
    
    tabs.forEach(tab => {
      tab.fields.forEach(field => {
        if (field.name === key) {
          if (field.value !== undefined && field.value !== null) {
            hasDefaultValue = true;
            defaultValue = field.value;
          }
          if (field.type === 'date') {
            isDateField = true;
          }
        }
      });
    });
    
    setSelectedFilters((prev) => {
      const updated = { ...prev };
      if (hasDefaultValue) {
        // Reset to default value instead of removing
        updated[key] = defaultValue;
      } else {
        // Remove completely if no default value
        delete updated[key];
      }
      return updated;
    });
    
    // Also remove from multiSelectValues if it exists
    setMultiSelectValues((prev) => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
    
    // Handle dateValues properly
    setDateValues((prev) => {
      const updated = { ...prev };
      if (isDateField && hasDefaultValue && defaultValue) {
        // Set to default date value
        updated[key] = new Date(defaultValue);
      } else {
        // Remove if no default value
        delete updated[key];
      }
      return updated;
    });
  };

  const handleExport = (exportType: string) => {
    //console.log('Export clicked:', exportType);
    //console.log('Current filters:', selectedFilters);
    //console.log('onExport function exists:', !!onExport);
    
    if (onExport) {
      onExport(exportType, selectedFilters);
    } else {
      console.warn('onExport prop is not provided. Please pass onExport function to handle export.');
      toast.warning('Export functionality not configured');
    }
  };

  const handleTabChange = (tabIndex: number) => {
    setActiveTab(tabIndex);
  };

  // Function to reset form fields to current selectedFilters state
  const resetFormFieldsToCurrentState = () => {
    // Force a re-render by updating the resetKey
    setResetKey(prev => prev + 1);
  };

  // Helper function to get default values from field definitions
  const getDefaultValues = (): Record<string, any> => {
    const defaultFilters: Record<string, any> = {};
    
    tabs.forEach(tab => {
      tab.fields.forEach(field => {
        if (field.value !== undefined && field.value !== null) {
          defaultFilters[field.name] = field.value;
        }
      });
    });
    
    return defaultFilters;
  };

  // Check if there are date validation errors
  const hasDateValidationErrors = (): boolean => {
    const dateRangePairs = [
      { start: 'start_datetime', end: 'end_datetime' },
      { start: 'start_date', end: 'end_date' }
    ];

    for (const pair of dateRangePairs) {
      const startDate = selectedFilters[pair.start];
      const endDate = selectedFilters[pair.end];
      
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        // Check if dates are valid
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          return true; // Invalid dates are considered validation errors
        }
        
        if (end < start) {
          return true;
        }
      }
    }
    
    return false;
  };

  const renderField = (field: FilterField) => {
    switch (field.type) {
      
      case 'number':
        return (
          <div key={field.name} className="d-flex gap-2">
            <div className="w-100">
              <label className="form-label mb-1">{field.label}</label>
              <input
            key={field.name}
            className="form-control form-control-sm"
            type="number"
            min={field.min}
            name={field.name}
            id={field.name}
            value={selectedFilters[field.name] || ''}
            placeholder={field.placeholder || `Type ${field.label}`}
            onChange={(e) => handleFilterChange(field.name, e.target.value)}
          />
            </div>
          </div>
          
        );
      
      case 'text':
        return (
          <div key={field.name} className="d-flex gap-2">
            <div className="w-100">
              <label className="form-label mb-1">{field.label}</label>
              <input
            key={field.name}
            className="form-control form-control-sm"
            type="text"
            name={field.name}
            id={field.name}
            value={selectedFilters[field.name] || ''}
            placeholder={field.placeholder || `Type ${field.label}`}
            onChange={(e) => handleFilterChange(field.name, e.target.value)}
          />
            </div>
          </div>
          
        );

      case 'select':
        return (
          <div key={field.name} className="d-flex gap-2">
            <div className="w-100">
              <label className="form-label mb-1">{field.label}</label>
            
                <Select
                key={field.name}
                className="w-100"
                classNamePrefix="select"
                isClearable={true}
                isMulti={field.isMulti}
                isSearchable={true}
                value={field.isMulti 
                  ? (selectedFilters[field.name] || []).map((val: string) => 
                      field.options?.find(opt => opt.value === val)
                    ).filter(Boolean)
                  : field.options?.find(opt => opt.value === selectedFilters[field.name]) || null
                }
                onChange={(e) => {
                  if (field.isMulti) {
                    const values = e ? (e as any[]).map((option: any) => option.value) : [];
                    // Send as array for multi-select (more standard format)
                    handleFilterChange(field.name, values);
                  } else {
                    handleFilterChange(field.name, (e as any)?.value || '');
                  }
                }}
                name={field.name}
                options={field.options?.map((option) => ({ 
                  value: option.value,
                  label: option.label
                }))}
              
              />
          
          </div>
          </div>
          
        );

      case 'multiSelect':
        // Convert selectedFilters values back to CreatableSelect format
        const multiSelectCurrentValues = selectedFilters[field.name] 
          ? (selectedFilters[field.name] as string[]).map(val => ({ value: val, label: val }))
          : [];
        
        return (
          <CreatableSelect
            key={field.name}
            isMulti
            onChange={(selected) => handleMultiSelectChange(field.name, selected)}
            value={multiSelectCurrentValues}
            placeholder={field.placeholder || `Type to create ${field.label}`}
            options={field.options}
            styles={{
              control: (base) => ({
                ...base,
                borderColor: '#ced4da',
                boxShadow: 'none',
                fontSize: '12px',
                fontWeight: 'normal',
                textTransform: 'capitalize'
              })
            }}
          />
        );

      case 'date':
        // Use dateValues state for the DatePicker component
        // Prioritize user's selected date over default values
        const displayDate = dateValues[field.name] || 
          (selectedFilters[field.name] ? new Date(selectedFilters[field.name]) : null) ||
          (field.value ? new Date(field.value) : null);
        
        // Check if this field has validation errors
        const hasError = hasDateValidationErrors();
        const isStartDate = field.name.includes('start');
        const isEndDate = field.name.includes('end');
        
        // Get the corresponding start/end date for validation
        let validationError = false;
        let errorMessage = '';
        let minDate: Date | undefined;
        let maxDate: Date | undefined;
        
        if (isStartDate || isEndDate) {
          const dateRangePairs = [
            { start: 'start_datetime', end: 'end_datetime' },
            { start: 'start_date', end: 'end_date' }
          ];
          
          for (const pair of dateRangePairs) {
            if (field.name === pair.start || field.name === pair.end) {
              const startDate = selectedFilters[pair.start];
              const endDate = selectedFilters[pair.end];
              
              if (startDate && endDate) {
                const start = new Date(startDate);
                const end = new Date(endDate);
                
                if (end < start) {
                  validationError = true;
                  if (isStartDate) {
                    errorMessage = 'Start date cannot be later than end date';
                    maxDate = end; // Limit start date to not exceed end date
                  } else {
                    errorMessage = 'End date cannot be earlier than start date';
                    minDate = start; // Limit end date to not be before start date
                  }
                }
              }
              break;
            }
          }
        }
        
        return (
          <div key={field.name} className="d-flex gap-2">
            <div className="w-100">
              <label className="form-label mb-1">{field.label}</label>
              <DatePicker
                selected={displayDate}
                onChange={(date) => handleDateChange(field.name, date as Date)}
                className={`form-control form-control-sm ${validationError ? 'is-invalid' : ''}`}
                placeholderText={field.placeholder || `Select ${field.label}`}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={15}
                timeCaption="Time"
                dateFormat="MMM dd, yyyy h:mm aa"
                key={`${field.name}-${resetKey}`} // Add key to force re-render when needed
                minDate={minDate}
                maxDate={maxDate}
              />
              {validationError && (
                <div className="invalid-feedback d-block">
                  {errorMessage}
                </div>
              )}
            </div>
          </div>
        );

      case 'radio':
        return (
          <div key={field.name}>
            <label className="form-label mb-1">{field.label}</label>
            {field.options?.map((option) => (
              <div key={option.value} className="form-check">
                <input
                  className="form-check-input"
                  type="radio"
                  name={field.name}
                  id={`${field.name}-${option.value}`}
                  value={option.value}
                  checked={selectedFilters[field.name] === option.value}
                  onChange={(e) => handleFilterChange(field.name, e.target.value)}
                />
                <label className="form-check-label" style={{fontSize: '12px'}} htmlFor={`${field.name}-${option.value}`}>
                  {option.label}
                </label>
              </div>
            ))}
          </div>
        );

      case 'checkbox':
        return (
          <div key={field.name}>
            {field.options?.map((option) => (
              <div key={option.value} className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  name={field.name}
                  id={`${field.name}-${option.value}`}
                  value={option.value}
                  checked={(selectedFilters[field.name] || []).includes(option.value)}
                  onChange={(e) => {
                    const currentValues = selectedFilters[field.name] || [];
                    const newValues = e.target.checked
                      ? [...currentValues, option.value]
                      : currentValues.filter((v: string) => v !== option.value);
                    handleFilterChange(field.name, newValues);
                  }}
                />
                <label className="form-check-label" htmlFor={`${field.name}-${option.value}`}>
                  {option.label}
                </label>
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  const toTitleCase = (str: string) => {
    return str
      .replace(/_/g, ' ') // Replace underscores with spaces
      .replace(/([a-z])([A-Z])/g, '$1 $2') // Add space before capital letters (for camelCase)
      .replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()); // Capitalize first letter of each word
  };

  const renderFilterBadges = () => {
    //console.log('selectedFilters', selectedFilters);
    return Object.entries(selectedFilters)
      .filter(([key, value]) => {
        // Filter out empty values but allow arrays with items and objects with properties
        if (value === null || value === undefined || value === '') return false;
        if (Array.isArray(value) && value.length === 0) return false;
        if (typeof value === 'object' && Object.keys(value).length === 0) return false;
        return true;
      })
      .map(([key, value]) => {
        let displayValue = value;
        if (Array.isArray(value)) {
          displayValue = value.join(', ');
        } else if (typeof value === 'object' && value !== null) {
          // For multi-select objects, display just the keys as comma-separated values
          // Check if this looks like a multi-select object (all keys equal their values)
          const keys = Object.keys(value);
          const isMultiSelectObject = keys.every(key => value[key] === key);
          
          if (isMultiSelectObject) {
            displayValue = keys.join(', ');
          } else {
            displayValue = Object.entries(value)
              .filter(([k, v]) => v !== null && v !== undefined && v !== '')
              .map(([k, v]) => `${k}: ${v}`)
              .join(', ');
          }
        } else if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(.\d+)?Z$/.test(value)) {
          // If value is a UTC ISO string, format it with timezone
          const dateObj = new Date(value);
          const options: Intl.DateTimeFormatOptions = {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          };
          const localString = dateObj.toLocaleString(undefined, options);
          // Get timezone offset in hours and minutes
          const offset = -dateObj.getTimezoneOffset();
          const sign = offset >= 0 ? '+' : '-';
          const pad = (n: number) => n.toString().padStart(2, '0');
          const hours = pad(Math.floor(Math.abs(offset) / 60));
          const minutes = pad(Math.abs(offset) % 60);
          // displayValue = `${localString} ;(UTC${sign}${hours}:${minutes})`;
          displayValue = `${localString}`;
        }

        return (
          <span key={key} className="badge bg-primary" style={{fontSize: '12px', marginRight: '5px', marginBottom: '5px'}}>
            {toTitleCase(key)}: {displayValue}
            <span
              className="btn-close btn-close-white ms-2 text-white"
              onClick={() => removeFilter(key)}
              style={{ cursor: 'pointer' }}
            ></span>
          </span>
        );
      });
  };

  return (
    <div className="d-flex align-items-center ms-auto gap-2">
      <div className="d-flex align-items-center">
        <div className="d-block align-items-center gap-2" style={{textAlign: 'right'}}  >
            {renderFilterBadges()}
        </div>
      </div>
      
      {Object.keys(selectedFilters).length > 0 && (
        <span 
          className="text-primary tagClearFilter" 
          onClick={clearFilters}
          style={{ cursor: 'pointer',minWidth: '75px' }}
        >
          Clear Filters
        </span>
      )}
      
      {additionalButtons}
      
      {showFilters && (
        <Dropdown onToggle={(isOpen) => {
          if (isOpen) {
            resetFormFieldsToCurrentState();
          }
        }}>
          <Dropdown.Toggle variant="primary" size='sm'>
            <span className="ti ti-filter"></span>
          Filters
        </Dropdown.Toggle>
        <Dropdown.Menu className="filterBoxDropdown" style={{width: dropdownWidth}} ref={dropdownRef}>
          <Dropdown.ItemText>
            <Row>
              <Col md={5} className="bg-gray-200 p-3 filterBox">
                <div className='filterBox-content'>
                  <ul className="nav flex-column nav-pills" role="tablist" aria-orientation="vertical">
                    {tabs.map((tab, index) => (
                      <li key={tab.id}>
                        <button 
                          className={`nav-tab-link ${index === activeTab ? 'active' : ''}`}
                          onClick={() => handleTabChange(index)}
                          role="tab"
                          aria-selected={index === activeTab}
                        >
                          <span className={tab.icon}></span>
                          <span className="ms-2">{tab.title}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </Col>
              <Col md={7}>
                <div className="tab-content" id="v-pills-tabContent">
                  {tabs.map((tab, index) => (
                    <div 
                      key={tab.id}
                      className={`tab-pane fade ${index === activeTab ? 'show active' : ''}`}
                      role="tabpanel"
                      aria-labelledby={`v-pills-tab-${index + 1}`}
                    >
                      <Card>
                        <Card.Header className="p-3 bg-gray-200">
                          <h5>{tab.title}</h5>
                        </Card.Header>
                        <Card.Body className="p-2">
                          {tab.fields.map((field) => (
                            <div key={field.name} className="form-group mb-2">
                              {renderField(field)}
                            </div>
                          ))}
                        </Card.Body>
                      </Card>
                    </div>
                  ))}
                </div>
              </Col>
            </Row>
            <Row>
              <Col md={12} className="d-flex justify-content-end gap-2">
                <Button variant="outline-primary" onClick={clearFilters}>
                  Clear Filters
                </Button>
                <Button 
                  variant="primary" 
                  onClick={handleApplyFilters}
                  disabled={hasDateValidationErrors()}
                  title={hasDateValidationErrors() ? "Please fix date range validation errors" : ""}
                >
                  Apply Filters
                </Button>
              </Col>
            </Row>
          </Dropdown.ItemText>
        </Dropdown.Menu>
      </Dropdown>
      )}

      {showExport && (
        <Button variant="outline-primary" size='sm' onClick={() => handleExport('excel')}><span className="ti ti-download"></span> Export</Button>
        // <Dropdown>
        //   <Dropdown.Toggle variant="outline-primary" id="dropdown-basic" size='sm'>
        //     <span className="ti ti-download"></span>
        //     Export
        //   </Dropdown.Toggle>
        //   <Dropdown.Menu>
        //     {exportOptions.map((option, index) => (
        //       <Dropdown.Item 
        //         key={index} 
        //         onClick={() => handleExport(option.value)}
        //       >
        //         {option.label}
        //       </Dropdown.Item>
        //     ))}
        //   </Dropdown.Menu>
        // </Dropdown>
      )}
    </div>
  );
} 