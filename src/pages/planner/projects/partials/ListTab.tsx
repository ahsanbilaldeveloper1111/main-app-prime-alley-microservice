import React, { useState } from 'react';
import { FileText, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import StatsCards from '@components/GenericStatsCards';
import type { StatsCardData } from '@components/GenericStatsCards';
import DeleteConfirmationModal from '@pages/partial/DeleteConfirmationModal';
import CreateTaskModal from '@components/work-planner/createtask-modal';
import { deleteTask, type ListTasksSummary } from '@utils/tasks';
import TaskDetailOffcanvas from "@components/planner/taskDetailOffcanvas/TaskDetailOffcanvas";
import TasksListingPage from "@pages/planner/tasks";
import type { PaginationState } from "@components/planner/workPlannerPagePartials/TasksTable";

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
  embeddedListRefreshSignal?: number;
  onEmbeddedListSummary?: (summary: ListTasksSummary | undefined) => void;
}

function resolveStatusLabel(status: unknown): string {
  if (typeof status === 'object' && status !== null && 'name' in status) {
    const n = (status as { name?: unknown }).name;
    if (typeof n === 'string') {
      return n;
    }
  }
  if (typeof status === 'string') {
    return status;
  }
  return '';
}

const ListTab: React.FC<ListTabProps> = ({
  tasksList: _tasksList,
  loading: _loading,
  listSummary,
  listPagination: _listPaginationProp,
  setListPagination: _setListPagination,
  styles,
  selectedProject,
  extensions = [],
  labels = [],
  statuses = [],
  onApplyFilters: _onApplyFilters,
  onClearFilters: _onClearFilters,
  onRefresh,
  embeddedListRefreshSignal,
  onEmbeddedListSummary,
}) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const [taskActivities, setTaskActivities] = useState<any[]>([]);
  const [loadingActivities] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState<'activity' | 'comments' | 'documents'>('activity');
  const [taskComments, setTaskComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
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
      onRefresh?.();
    } catch (error) {
      console.error('Error deleting task:', error);
    } finally {
      setDeleting(false);
    }
  };

  const handleTaskUpdate = () => {
    setShowEditModal(false);
    setSelectedTask(null);
    onRefresh?.();
  };

  const getStatusVariant = (status: unknown) => {
    const s = resolveStatusLabel(status).toLowerCase();
    switch (s) {
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

  const summaryCardsData: StatsCardData[] = listSummary
    ? [
        {
          title: 'Total',
          value: listSummary.total || 0,
          icon: FileText,
          iconColor: '#4680FF',
          iconBgColor: '#E3F2FD',
        },
        {
          title: 'Open',
          value: listSummary.open || 0,
          icon: FileText,
          iconColor: '#4680FF',
          iconBgColor: '#E3F2FD',
        },
        {
          title: 'Overdue',
          value: listSummary.overdue || 0,
          icon: AlertCircle,
          iconColor: '#DC2626',
          iconBgColor: '#FFEBEE',
        },
        {
          title: 'Due This Week',
          value: listSummary.dueThisWeek || 0,
          icon: Clock,
          iconColor: '#FFB64D',
          iconBgColor: '#FFF3E0',
        },
        {
          title: 'Completed',
          value: listSummary.completed || 0,
          icon: CheckCircle2,
          iconColor: '#2CA87F',
          iconBgColor: '#E8F5E9',
        },
      ]
    : [];

  const hierarchyForOffcanvas =
    extensions?.map((e: any) => ({ id: e.id, extension_number: e.id, name: e.name })) ?? [];

  return (
    <>
      {listSummary && summaryCardsData.length > 0 && (
        <div style={{ marginBottom: '1.5rem', padding: '15px', background: '#FFFFFF' }}>
          <StatsCards data={summaryCardsData} gridMinWidth="160px" />
        </div>
      )}

      <div style={styles.card}>
        <TasksListingPage
          omitTodoTaskType
          hierarchyExtensionsFromParent={extensions}
          embeddedListRefreshSignal={embeddedListRefreshSignal}
          onEmbeddedListSummary={onEmbeddedListSummary}
          sidebarProject={
            selectedProject
              ? {
                  id: selectedProject.id,
                  name: selectedProject.name,
                  color: selectedProject.color,
                  statuses: selectedProject.statuses,
                  labels: selectedProject.labels,
                }
              : undefined
          }
        />
      </div>

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

      <TaskDetailOffcanvas
        show={showTaskDetail}
        onHide={() => {
          setShowTaskDetail(false);
          setSelectedTask(null);
          setTaskActivities([]);
        }}
        selectedTask={
          selectedTask
            ? {
                id: String(selectedTask.id),
                title: selectedTask.title,
                status:
                  typeof selectedTask.status === 'object'
                    ? selectedTask.status?.name
                    : selectedTask.status,
                priority: selectedTask.priority || 'Normal',
                project: selectedTask.project?.name || 'No Project',
                dueDate: selectedTask.due_date ? formatDate(selectedTask.due_date) : undefined,
                description: selectedTask.description,
                rawData: selectedTask,
              }
            : null
        }
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
        hierarchyDataExtensions={hierarchyForOffcanvas}
        getStatusVariant={(status) => getStatusVariant(status)}
        getPriorityVariant={(priority) => getPriorityVariant(priority || '')}
      />
    </>
  );
};

export default ListTab;
