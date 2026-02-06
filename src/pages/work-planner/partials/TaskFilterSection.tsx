import React from 'react';
import { Form } from 'react-bootstrap';
import { Search, X } from 'lucide-react';
import SelectBox from '@components/SelectBox';
import type { SelectBoxOption } from '@components/SelectBox';

export interface TaskFilterSectionProps {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  filterProject: string;
  onFilterProjectChange: (value: string) => void;
  filterAssignee: string[];
  onFilterAssigneeChange: (value: string[]) => void;
  filterStatus: string;
  onFilterStatusChange: (value: string) => void;
  filterPriority: string;
  onFilterPriorityChange: (value: string) => void;
  filterCreatedAtFrom: string;
  onFilterCreatedAtFromChange: (value: string) => void;
  filterCreatedAtTo: string;
  onFilterCreatedAtToChange: (value: string) => void;
  projectOptions: SelectBoxOption[];
  assigneeOptions: SelectBoxOption[];
  statusOptions: SelectBoxOption[];
  priorityOptions: SelectBoxOption[];
  onApplyFilters: () => void;
  onClearFilters: () => void;
  /** Hide project dropdown (e.g. when already in project context). Default false. */
  hideProjectFilter?: boolean;
  /** Placeholder for search input. Default "Search tasks..." */
  searchPlaceholder?: string;
}

const TaskFilterSection: React.FC<TaskFilterSectionProps> = ({
  searchTerm,
  onSearchTermChange,
  filterProject,
  onFilterProjectChange,
  filterAssignee,
  onFilterAssigneeChange,
  filterStatus,
  onFilterStatusChange,
  filterPriority,
  onFilterPriorityChange,
  filterCreatedAtFrom,
  onFilterCreatedAtFromChange,
  filterCreatedAtTo,
  onFilterCreatedAtToChange,
  projectOptions,
  assigneeOptions,
  statusOptions,
  priorityOptions,
  onApplyFilters,
  onClearFilters,
  hideProjectFilter = false,
  searchPlaceholder = 'Search tasks...'
}) => {
  const hasActiveFilters =
    searchTerm.trim() !== '' ||
    (!hideProjectFilter && filterProject !== 'All Projects') ||
    filterAssignee.length > 0 ||
    filterStatus !== 'All Status' ||
    filterPriority !== 'All Priority' ||
    filterCreatedAtFrom !== '' ||
    filterCreatedAtTo !== '';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onApplyFilters();
  };

  return (
    <div style={{
      backgroundColor: 'white',
      padding: '1.5rem',
      borderRadius: '12px',
      marginBottom: '1.5rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
    }}>
      <form onSubmit={handleSubmit} style={{ display: 'contents' }}>
      <div style={{
        display: 'flex',
        flexWrap: 'wrap' as const,
        gap: '1rem'
      }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flex: '1 1 150px' }}>
          <Search size={16} color="#6B7280" style={{ position: 'absolute', left: '0.75rem', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              paddingLeft: '2.5rem',
              border: '1px solid #E5E9F2',
              borderRadius: '6px',
              fontSize: '0.9rem',
              outline: 'none',
              fontFamily: 'inherit'
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = '#4680FF'}
            onBlur={(e) => e.currentTarget.style.borderColor = '#E5E9F2'}
          />
        </div>

        {!hideProjectFilter && (
          <div style={{ flex: '1 1 130px' }}>
            <SelectBox
              value={filterProject === 'All Projects' ? null : filterProject}
              onChange={(value) => {
                const val = Array.isArray(value) ? value[0] : value;
                onFilterProjectChange(val ? String(val) : 'All Projects');
              }}
              options={projectOptions}
              placeholder="Project"
              isSearchable
            />
          </div>
        )}

        <div style={{ flex: '1 1 130px' }}>
          <SelectBox
            value={filterAssignee.length > 0 ? filterAssignee : null}
            onChange={(value) => {
              if (Array.isArray(value)) {
                onFilterAssigneeChange(value.map(v => String(v)));
              } else if (value) {
                onFilterAssigneeChange([String(value)]);
              } else {
                onFilterAssigneeChange([]);
              }
            }}
            options={assigneeOptions}
            placeholder="Assignee"
            isSearchable
            isMulti
          />
        </div>

        <div style={{ flex: '1 1 120px' }}>
          <SelectBox
            value={filterStatus === 'All Status' ? null : filterStatus}
            onChange={(value) => {
              const val = Array.isArray(value) ? value[0] : value;
              onFilterStatusChange(val ? String(val) : 'All Status');
            }}
            options={statusOptions}
            placeholder="Status"
            isSearchable
          />
        </div>

        <div style={{ flex: '1 1 120px' }}>
          <SelectBox
            value={filterPriority === 'All Priority' ? null : filterPriority}
            onChange={(value) => {
              const val = Array.isArray(value) ? value[0] : value;
              onFilterPriorityChange(val ? String(val) : 'All Priority');
            }}
            options={priorityOptions}
            placeholder="Priority"
            isSearchable
          />
        </div>

        <div style={{ flex: '1 1 140px' }}>
          <Form.Control
            type="date"
            value={filterCreatedAtFrom}
            onChange={(e) => onFilterCreatedAtFromChange(e.target.value)}
            placeholder="Start date"
            style={{ fontSize: '0.875rem', minHeight: '38px' }}
          />
        </div>
        <div style={{ flex: '1 1 140px' }}>
          <Form.Control
            type="date"
            value={filterCreatedAtTo}
            onChange={(e) => onFilterCreatedAtToChange(e.target.value)}
            placeholder="End date"
            style={{ fontSize: '0.875rem', minHeight: '38px' }}
          />
        </div>

        <button
          type="submit"
          style={{
            flex: '0 1 auto',
            padding: '0.625rem 1rem',
            backgroundColor: '#4680FF',
            color: 'white',
            border: '1px solid #4680FF',
            borderRadius: '6px',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            whiteSpace: 'nowrap'
          }}
        >
          <Search size={16} />
          Filter
        </button>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            style={{
              flex: '0 1 auto',
              padding: '0.625rem 1rem',
              backgroundColor: 'white',
              color: '#4680FF',
              border: '1px solid #4680FF',
              borderRadius: '6px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              fontSize: '0.9rem',
              transition: 'all 0.2s',
              fontFamily: 'inherit',
              whiteSpace: 'nowrap' as const
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
          >
            Clear
            <X size={16} />
          </button>
        )}
      </div>
      </form>
    </div>
  );
};

export default TaskFilterSection;