import React, { useState, useMemo } from 'react';
import { Spinner } from 'react-bootstrap';
import { FileText, Calendar, CheckCircle2, AlertCircle, Clock, Edit, Trash2 } from 'lucide-react';
import StatsCards, { StatsCardData } from '@components/GenericStatsCards';
import DeleteConfirmationModal from '@pages/partial/DeleteConfirmationModal';
import CreateTaskModal from '@components/work-planner/createtask-modal';
import { deleteTask, getTask, getTaskActivities } from '@utils/tasks';
import TaskDetailOffcanvas from '@pages/work-planner/partials/TaskDetailOffcanvas';
import TasksTable, { type TaskRow } from '@pages/work-planner/partials/TasksTable';
import TaskFilterSection from '@pages/work-planner/partials/TaskFilterSection';
import type { PaginationState } from '@pages/work-planner/partials/TasksTable';

export interface ListTabFilters {
  searchTerm: string;
  filterAssignee: string[];
  filterStatus: string;
  filterPriority: string;
  filterCreatedAtFrom: string;
  filterCreatedAtTo: string;
}

interface ListTabProps {
  tasksList: any[];
  loading: boolean;
  listSummary: any;
  listPagination?: PaginationState | null;
  setListPagination?: React.Dispatch<React.SetStateAction<PaginationState>>;
  styles: any;
  selectedProject?: any;
  extensions?: any[];
  labels?: any[];
  statuses?: any[];
  onApplyFilters?: (filters: ListTabFilters) => void;
  onClearFilters?: () => void;
  onRefresh?: () => void;
}

const ListTab: React.FC<ListTabProps> = ({ 
  tasksList, 
  loading, 
  listSummary, 
  listPagination: listPaginationProp,
  setListPagination,
  styles,
  selectedProject,
  extensions = [],
  labels = [],
  statuses = [],
  onApplyFilters,
  onClearFilters,
  onRefresh
}) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const [loadingTaskDetail, setLoadingTaskDetail] = useState(false);
  const [taskActivities, setTaskActivities] = useState<any[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState<'activity' | 'comments' | 'documents'>('activity');
  const [taskComments, setTaskComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');

  // Filter form state (user can change without triggering search; API is called on Filter click)
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAssignee, setFilterAssignee] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState('All Status');
  const [filterPriority, setFilterPriority] = useState('All Priority');
  const [filterCreatedAtFrom, setFilterCreatedAtFrom] = useState('');
  const [filterCreatedAtTo, setFilterCreatedAtTo] = useState('');
  
  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return { bg: '#FEE2E2', color: '#991B1B' };
      case 'medium':
      case 'normal':
        return { bg: '#FEF3C7', color: '#92400E' };
      case 'low':
        return { bg: '#E0E7FF', color: '#3730A3' };
      default:
        return { bg: '#F3F4F6', color: '#6B7280' };
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const handleTaskClick = async (task: any) => {
    setSelectedTask(task);
    setShowTaskDetail(true);
    setTaskActivities([]);
    setTaskComments([]);
    setActiveDetailTab('activity');

    // Fetch full task data using getTask API with relations
    if (task.id) {
      try {
        setLoadingTaskDetail(true);
        const withRelations = [
          'parent',
          'parent.status',
          'parent.project',
          'parent.assignees',
          'parent.children',
          'children',
          'children.status',
          'children.assignees',
          'project',
          'status',
          'assignees',
          'labels',
          'comments'
        ];
        const taskData = await getTask(task.id, withRelations);
        if (taskData) {
          setSelectedTask(taskData);
        }

        // Fetch task activities
        try {
          setLoadingActivities(true);
          const activitiesResponse = await getTaskActivities(task.id, 1, 5);
          if (activitiesResponse) {
            setTaskActivities(Array.isArray(activitiesResponse) ? activitiesResponse : []);
          }
        } catch (activityError) {
          console.error('Error fetching task activities:', activityError);
          setTaskActivities([]);
        } finally {
          setLoadingActivities(false);
        }
      } catch (error) {
        console.error('Error fetching task details:', error);
      } finally {
        setLoadingTaskDetail(false);
      }
    }
  };

  const handleEdit = (task: any, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setSelectedTask(task);
    setShowTaskDetail(false);
    setShowEditModal(true);
  };

  const handleDelete = (task: any, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setSelectedTask(task);
    setShowDeleteModal(true);
  };

  const handleEditFromDetail = () => {
    if (!selectedTask) return;
    setShowTaskDetail(false);
    setShowEditModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedTask?.id) return;
    
    try {
      setDeleting(true);
      await deleteTask(selectedTask.id);
      setShowDeleteModal(false);
      setSelectedTask(null);
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    } finally {
      setDeleting(false);
    }
  };

  const handleTaskUpdate = () => {
    setShowEditModal(false);
    setSelectedTask(null);
    if (onRefresh) {
      onRefresh();
    }
  };

  const getStatusVariant = (status: string | any) => {
    if (typeof status === 'object' && status?.name) {
      status = status.name;
    }
    switch (status?.toLowerCase()) {
      case 'to do':
      case 'todo':
        return 'info';
      case 'in progress':
        return 'warning';
      case 'in review':
        return 'secondary';
      case 'overdue':
        return 'danger';
      case 'completed':
      case 'done':
        return 'success';
      default:
        return 'primary';
    }
  };

  const getPriorityVariant = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
      case 'urgent':
        return 'danger';
      case 'medium':
      case 'normal':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'secondary';
    }
  };

  // Helper function to get user name from extension number
  const getUserNameFromExtension = (extensionNumber: string): string => {
    if (!extensionNumber || !extensions || extensions.length === 0) {
      return extensionNumber || 'Unknown';
    }
    
    const extension = extensions.find((ext: any) => 
      ext.extension_number === extensionNumber || 
      ext.id === extensionNumber ||
      String(ext.id) === String(extensionNumber)
    );
    
    return extension?.user?.name || extension?.name || extensionNumber || 'Unknown';
  };

  const getAssigneeInfo = (assignees: any[]) => {
    if (!assignees || assignees.length === 0) {
      return [];
    }
    
    return assignees.map((assignee: any) => {
      const extensionNumber = assignee.extension_number || '';
      const name = assignee.user?.name || assignee.name || getUserNameFromExtension(extensionNumber);
      const initials = name !== extensionNumber && name !== 'Unknown'
        ? name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
        : (extensionNumber || 'UN').substring(0, 2).toUpperCase();
      
      return {
        name: name,
        initials: initials,
        extension_number: extensionNumber
      };
    });
  };

  // Assignee options from extensions (value: extension id/number, label: name)
  const assigneeOptions = useMemo(() => {
    if (!extensions?.length) return [];
    return extensions.map((ext: any) => ({
      value: String(ext.id ?? ext.extension_number ?? ext),
      label: ext.user?.name ?? ext.name ?? ext.extension_number ?? String(ext.id ?? 'Unknown')
    }));
  }, [extensions]);

  const statusOptionsList = useMemo(() => {
    const base = [{ value: 'All Status', label: 'All Status' }];
    if (!statuses?.length) return base;
    const fromStatuses = statuses.map((s: any) => ({ value: s.name, label: s.name }));
    return [...base, ...fromStatuses];
  }, [statuses]);

  const priorityOptionsList = [
    { value: 'All Priority', label: 'All Priority' },
    { value: 'Low', label: 'Low' },
    { value: 'Medium', label: 'Medium' },
    { value: 'High', label: 'High' },
    { value: 'Urgent', label: 'Urgent' }
  ];

  const handleApplyFiltersList = () => {
    if (onApplyFilters) {
      onApplyFilters({
        searchTerm,
        filterAssignee,
        filterStatus,
        filterPriority,
        filterCreatedAtFrom,
        filterCreatedAtTo
      });
    }
  };

  const handleClearFiltersList = () => {
    setSearchTerm('');
    setFilterAssignee([]);
    setFilterStatus('All Status');
    setFilterPriority('All Priority');
    setFilterCreatedAtFrom('');
    setFilterCreatedAtTo('');
    onClearFilters?.();
  };

  // Prepare summary cards data for GenericStatsCards
  const summaryCardsData: StatsCardData[] = listSummary
    ? [
        { title: 'Total', value: listSummary.total || 0, icon: FileText, iconColor: '#4680FF', iconBgColor: '#E3F2FD' },
        { title: 'Open', value: listSummary.open || 0, icon: FileText, iconColor: '#4680FF', iconBgColor: '#E3F2FD' },
        { title: 'Overdue', value: listSummary.overdue || 0, icon: AlertCircle, iconColor: '#DC2626', iconBgColor: '#FFEBEE' },
        { title: 'Due This Week', value: listSummary.dueThisWeek || 0, icon: Clock, iconColor: '#FFB64D', iconBgColor: '#FFF3E0' },
        { title: 'Completed', value: listSummary.completed || 0, icon: CheckCircle2, iconColor: '#2CA87F', iconBgColor: '#E8F5E9' }
      ]
    : [];

  return (
    <>
      {/* Summary Cards */}
      {listSummary && summaryCardsData.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <StatsCards data={summaryCardsData} gridMinWidth="160px" />
        </div>
      )}

      <div style={styles.card}>
        {/* <div style={styles.cardHeader}>
          <h5 style={styles.cardTitle}>Tasks List</h5>
        </div> */}

        <TaskFilterSection
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          filterProject=""
          onFilterProjectChange={() => {}}
          filterAssignee={filterAssignee}
          onFilterAssigneeChange={setFilterAssignee}
          filterStatus={filterStatus}
          onFilterStatusChange={setFilterStatus}
          filterPriority={filterPriority}
          onFilterPriorityChange={setFilterPriority}
          filterCreatedAtFrom={filterCreatedAtFrom}
          onFilterCreatedAtFromChange={setFilterCreatedAtFrom}
          filterCreatedAtTo={filterCreatedAtTo}
          onFilterCreatedAtToChange={setFilterCreatedAtTo}
          projectOptions={[]}
          assigneeOptions={assigneeOptions}
          statusOptions={statusOptionsList}
          priorityOptions={priorityOptionsList}
          onApplyFilters={handleApplyFiltersList}
          onClearFilters={handleClearFiltersList}
          hideProjectFilter
          searchPlaceholder="Search tasks..."
        />

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <Spinner animation="border" />
        </div>
      ) : tasksList.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#6B7280' }}>
          <FileText size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
          <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: '500' }}>No tasks found</p>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', opacity: 0.7 }}>Tasks will appear here once they are created</p>
        </div>
      ) : (
        <div style={styles.tableWrapper}>
          <TasksTable
            tasks={tasksList.map((task: any): TaskRow => ({
              id: String(task.id),
              title: task.title,
              status: typeof task.status === 'object' ? task.status?.name : task.status,
              priority: task.priority || 'Normal',
              project: selectedProject?.name || '',
              rawData: task
            }))}
            loading={loading}
            pagination={{
              page: listPaginationProp?.page ?? 1,
              limit: listPaginationProp?.limit ?? tasksList.length,
              total: listPaginationProp?.total ?? tasksList.length,
              last_page: listPaginationProp?.last_page ?? 1,
              from: listPaginationProp?.from ?? (tasksList.length > 0 ? 1 : 0),
              to: listPaginationProp?.to ?? tasksList.length
            }}
            setPagination={setListPagination ?? (() => {})}
            onTaskClick={(task) => handleTaskClick(task.rawData || task)}
            hierarchyDataExtensions={extensions?.map((e: any) => ({ id: e.id, extension_number: e.id, name: e.name })) ?? []}
            getStatusVariant={(s) => getStatusVariant(s)}
            getPriorityVariant={(p) => getPriorityVariant(p || '')}
            itemLabel="tasks"
          />
        </div>
      )}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        show={showDeleteModal}
        onHide={() => {
          setShowDeleteModal(false);
          setSelectedTask(null);
        }}
        onConfirm={confirmDelete}
        itemName={selectedTask?.title || `Task #${selectedTask?.task_id || selectedTask?.id}`}
        itemType="task"
        loading={deleting}
      />

      {/* Edit Task Modal */}
      <CreateTaskModal
        show={showEditModal}
        onHide={() => {
          setShowEditModal(false);
          setSelectedTask(null);
        }}
        onCreate={handleTaskUpdate}
        extensions={extensions}
        labels={labels}
        statuses={statuses}
        project={selectedProject}
        task={selectedTask}
        isEdit={true}
      />

      {/* Task Details Offcanvas */}
      <TaskDetailOffcanvas
        show={showTaskDetail}
        onHide={() => {
          setShowTaskDetail(false);
          setSelectedTask(null);
          setTaskActivities([]);
        }}
        selectedTask={selectedTask ? {
          id: String(selectedTask.id),
          title: selectedTask.title,
          status: typeof selectedTask.status === 'object' ? selectedTask.status?.name : selectedTask.status,
          priority: selectedTask.priority || 'Normal',
          project: selectedTask.project?.name || 'No Project',
          dueDate: selectedTask.due_date ? formatDate(selectedTask.due_date) : undefined,
          description: selectedTask.description,
          rawData: selectedTask
        } : null}
        taskActivities={taskActivities}
        loadingActivities={loadingActivities}
        activeDetailTab={activeDetailTab}
        setActiveDetailTab={setActiveDetailTab}
        taskComments={taskComments}
        setTaskComments={setTaskComments}
        loadingComments={loadingComments}
        setLoadingComments={setLoadingComments}
        newComment={newComment}
        setNewComment={setNewComment}
        submittingComment={submittingComment}
        setSubmittingComment={setSubmittingComment}
        editingCommentId={editingCommentId}
        setEditingCommentId={setEditingCommentId}
        editingCommentText={editingCommentText}
        setEditingCommentText={setEditingCommentText}
        onEditTask={handleEditFromDetail}
        onOpenDeleteModal={() => {
          setShowTaskDetail(false);
          setShowDeleteModal(true);
        }}
        hierarchyDataExtensions={extensions?.map((e: any) => ({ id: e.id, extension_number: e.id, name: e.name })) ?? []}
        getStatusVariant={(status) => getStatusVariant(status)}
        getPriorityVariant={(priority) => getPriorityVariant(priority || '')}
      />
    </>
  );
};

export default ListTab;
