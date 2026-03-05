import React, { useState, useMemo } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import type { SelectBoxOption } from '@components/SelectBox';
import GenericFilterSidebar, { FilterField } from '@components/GenericFilterSidebar';

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
  const [showFilterSidebar, setShowFilterSidebar] = useState(false);

  const projectFilterOptions = useMemo(
    () => projectOptions.map((o) => ({ value: o.value, label: o.label })),
    [projectOptions]
  );
  const assigneeFilterOptions = useMemo(
    () => assigneeOptions.map((o) => ({ value: o.value, label: o.label })),
    [assigneeOptions]
  );
  const statusFilterOptions = useMemo(
    () => statusOptions.map((o) => ({ value: o.value, label: o.label })),
    [statusOptions]
  );
  const priorityFilterOptions = useMemo(
    () => priorityOptions.map((o) => ({ value: o.value, label: o.label })),
    [priorityOptions]
  );

  const filterFields: FilterField[] = useMemo(() => {
    const fields: FilterField[] = [
      { id: 'search', label: 'Search', type: 'text', value: searchTerm, onChange: (v: string) => onSearchTermChange(v ?? ''), placeholder: searchPlaceholder },
      { id: 'assignee', label: 'Assignee', type: 'multi-select', value: assigneeOptions.filter((o) => filterAssignee.includes(String(o.value))), onChange: (v: any) => onFilterAssigneeChange(Array.isArray(v) ? v.map((x: any) => String(x.value)) : []), options: assigneeFilterOptions, placeholder: 'Select assignees' },
      { id: 'status', label: 'Status', type: 'dropdown', value: filterStatus, onChange: (v) => onFilterStatusChange(v ?? 'All Status'), options: statusFilterOptions },
      { id: 'priority', label: 'Priority', type: 'dropdown', value: filterPriority, onChange: (v) => onFilterPriorityChange(v ?? 'All Priority'), options: priorityFilterOptions },
      { id: 'createdFrom', label: 'Created from', type: 'date', value: filterCreatedAtFrom, onChange: (v) => onFilterCreatedAtFromChange(v ?? '') },
      { id: 'createdTo', label: 'Created to', type: 'date', value: filterCreatedAtTo, onChange: (v) => onFilterCreatedAtToChange(v ?? '') }
    ];
    if (!hideProjectFilter) {
      fields.splice(1, 0, { id: 'project', label: 'Project', type: 'dropdown', value: filterProject, onChange: (v) => onFilterProjectChange(v ?? 'All Projects'), options: projectFilterOptions });
    }
    return fields;
  }, [
    searchTerm,
    filterProject,
    filterAssignee,
    filterStatus,
    filterPriority,
    filterCreatedAtFrom,
    filterCreatedAtTo,
    assigneeOptions,
    assigneeFilterOptions,
    statusFilterOptions,
    priorityFilterOptions,
    projectFilterOptions,
    hideProjectFilter,
    searchPlaceholder,
    onSearchTermChange,
    onFilterProjectChange,
    onFilterAssigneeChange,
    onFilterStatusChange,
    onFilterPriorityChange,
    onFilterCreatedAtFromChange,
    onFilterCreatedAtToChange
  ]);

  return (
    <>
      <div
  style={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
    flexWrap: 'wrap',
    gap: '0.75rem'
  }}
>
  {/* Title */}
  <div
    style={{
      fontSize: '1.125rem',
      fontWeight: 600,
      color: 'rgb(31, 41, 55)'
    }}
  >
    Tasks List
  </div>

  {/* Filters Button */}
  <button
    type="button"
    onClick={() => setShowFilterSidebar(true)}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.5rem 1rem',
      backgroundColor: 'white',
      color: '#4680FF',
      border: '1px solid #4680FF',
      borderRadius: '6px',
      fontWeight: 500,
      fontSize: '0.9rem',
      cursor: 'pointer',
      transition: '0.2s'
    }}
    onMouseOver={(e) => {
      e.currentTarget.style.backgroundColor = '#F9FAFB';
    }}
    onMouseOut={(e) => {
      e.currentTarget.style.backgroundColor = 'white';
    }}
  >
    <SlidersHorizontal size={18} />
    Filters
  </button>
</div>


      <GenericFilterSidebar
        isOpen={showFilterSidebar}
        onClose={() => setShowFilterSidebar(false)}
        title="Filters"
        subtitle="Filter tasks"
        filters={filterFields}
        onApply={() => { onApplyFilters(); setShowFilterSidebar(false); }}
        onReset={() => { onClearFilters(); setShowFilterSidebar(false); }}
        width="400px"
        showApplyButton
        showResetButton
      />
    </>
  );
};

export default TaskFilterSection;