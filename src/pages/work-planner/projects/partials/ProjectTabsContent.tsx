import React, { useState, useEffect, useImperativeHandle, forwardRef, useCallback } from "react";
import { useRouter } from 'next/router';
import { Button, Spinner } from 'react-bootstrap';
import { 
  FileText, Users, AlertCircle, Clock, CheckCircle2
} from 'lucide-react';
import TasksReports from '@components/work-planner/tasks-reports';
import CreateTaskModal from '@components/work-planner/createtask-modal';
import { getProject, getRecentActivity, getOverdueTasks, listTasks } from '@utils/tasks';
import { formatDateForTable } from '@utils/Helper';
import TabsNavigation from './TabsNavigation';
import OverviewTab from './OverviewTab';
import BoardTab from './BoardTab';
import ListTab from './ListTab';
import MembersTab from './MembersTab';
import StatusesTab from './StatusesTab';
import LabelsTab from './LabelsTab';
import ActivityModal from './ActivityModal';
import OverdueTasksModal from './OverdueTasksModal';

interface ProjectTabsContentProps {
  selectedProject: any;
  hierarchyDataExtensions?: any[];
  hierarchyLoading?: boolean;
  onCreateTask?: (formData: any) => Promise<void>;
}

export interface ProjectTabsContentRef {
  openCreateTaskModal: () => void;
  switchToBoardView: () => void;
}

const ProjectTabsContent = forwardRef<ProjectTabsContentRef, ProjectTabsContentProps>(({
  selectedProject,
  hierarchyDataExtensions = [],
  hierarchyLoading = false,
  onCreateTask
}, ref) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showTasksModal, setShowTasksModal] = useState(false);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [selectedStatusForTask, setSelectedStatusForTask] = useState<number | null>(null);

  // Read tab from URL query on mount and when router is ready
  useEffect(() => {
    if (router.isReady) {
      const tabFromUrl = router.query.tab as string;
      if (tabFromUrl) {
        const validTabs = ['overview', 'board', 'list', 'members', 'statuses', 'labels', 'reports'];
        if (validTabs.includes(tabFromUrl.toLowerCase())) {
          setActiveTab(tabFromUrl.toLowerCase());
        }
      }
    }
  }, [router.isReady, router.query.tab]);

  // Handle tab change with URL update
  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    // Update URL without page reload
    router.push(
      {
        pathname: router.pathname,
        query: { ...router.query, tab }
      },
      undefined,
      { shallow: true }
    );
  }, [router]);

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    openCreateTaskModal: () => {
      if (selectedProject) {
        setShowCreateTaskModal(true);
      }
    },
    switchToBoardView: () => {
      handleTabChange('board');
    }
  }), [selectedProject, handleTabChange]);
  
  // Project data
  const [projectData, setProjectData] = useState<any>(null);
  const [assignees, setAssignees] = useState<any[]>([]);
  const [labels, setLabels] = useState<any[]>([]);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loadingProjectData, setLoadingProjectData] = useState(false);
  
  // Activities and overdue tasks
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [allActivity, setAllActivity] = useState<any[]>([]);
  const [overdueTasks, setOverdueTasks] = useState<any[]>([]);
  const [allOverdueTasks, setAllOverdueTasks] = useState<any[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [loadingOverdue, setLoadingOverdue] = useState(false);
  
  // Board view data
  const [boardTasks, setBoardTasks] = useState<any[]>([]);
  const [loadingBoardTasks, setLoadingBoardTasks] = useState(false);
  const [boardSearchTerm, setBoardSearchTerm] = useState('');
  const [boardSelectedAssignee, setBoardSelectedAssignee] = useState('All Assignees');
  const [boardSelectedPriority, setBoardSelectedPriority] = useState('All Priorities');
  const [boardSelectedLabel, setBoardSelectedLabel] = useState('All Labels');
  const [showCompletedTasks, setShowCompletedTasks] = useState(false);
  
  // List view data
  const [tasksList, setTasksList] = useState<any[]>([]);
  const [loadingListTasks, setLoadingListTasks] = useState(false);
  const [listPagination, setListPagination] = useState<any>(null);
  const [listSummary, setListSummary] = useState<any>(null);
  
  // Stats
  const [statusCards, setStatusCards] = useState([
    { title: 'Open', count: 0, icon: FileText, color: '#4680FF', bgLight: '#E3F2FD' },
    { title: 'In Progress', count: 0, icon: Clock, color: '#FFB64D', bgLight: '#FFF3E0' },
    { title: 'Done (30d)', count: 0, icon: CheckCircle2, color: '#2CA87F', bgLight: '#E8F5E9' },
    { title: 'Overdue', count: 0, icon: AlertCircle, color: '#DC2626', bgLight: '#FFEBEE' },
    { title: 'Unassigned', count: 0, icon: Users, color: '#4FC3F7', bgLight: '#E1F5FE' }
  ]);
  const [tasksByStatus, setTasksByStatus] = useState<any[]>([]);
  const [workloadData, setWorkloadData] = useState<any[]>([]);

  // Fetch project data when selectedProject changes
  useEffect(() => {
    if (selectedProject?.id) {
      fetchProjectData();
    }
  }, [selectedProject?.id]);

  // Fetch board tasks when board tab is active and project is selected
  useEffect(() => {
    if (activeTab === 'board' && selectedProject?.id) {
      fetchBoardTasks();
    }
  }, [activeTab, selectedProject?.id]);

  // Fetch list tasks when list tab is active and project is selected
  useEffect(() => {
    if (activeTab === 'list' && selectedProject?.id) {
      fetchListTasks();
    }
  }, [activeTab, selectedProject?.id]);

  const fetchProjectData = async () => {
    if (!selectedProject?.id) return;
    
    setLoadingProjectData(true);
    setLoadingActivities(true);
    setLoadingOverdue(true);
    
    try {
      const withRelations = [
        'members.user',
        'tasks',
        'tasks.assignees',
        'tasks.labels',
        'tasks.status',
        'statuses',
        'owner'
      ];
      
      const [projectDetails, activities, overdue] = await Promise.all([
        getProject(selectedProject.id, withRelations),
        getRecentActivity(selectedProject.id),
        getOverdueTasks(selectedProject.id)
      ]);
      
      if (projectDetails) {
        setProjectData(projectDetails);
        
        // Extract assignees from members
        const projectAssignees = projectDetails.members?.map((member: any) => ({
          id: member.user?.id || member.extension_number,
          name: member.user?.name || member.user?.display_name || member.extension_number,
          extension_number: member.extension_number
        })) || [];
        setAssignees(projectAssignees);
        
        // Extract labels
        const projectLabels = projectDetails.labels || [];
        setLabels(projectLabels);
        
        // Extract statuses
        const projectStatuses = projectDetails.statuses || [];
        setStatuses(projectStatuses);
        
        // Extract members
        const projectMembers = projectDetails.members || [];
        setMembers(projectMembers);
        
        // Get tasks array
        const tasks = projectDetails.tasks || [];
        
        // Create a map of status_id to status for quick lookup
        const statusMap: Record<string, any> = {};
        projectStatuses.forEach((status: any) => {
          statusMap[String(status.id)] = status;
        });
        
        // Update tasks by status - count tasks for each status
        const statusTaskCounts: Record<string, number> = {};
        tasks.forEach((task: any) => {
          const statusId = String(task.status_id);
          const status = statusMap[statusId];
          if (status) {
            const statusName = status.name;
            statusTaskCounts[statusName] = (statusTaskCounts[statusName] || 0) + 1;
          }
        });
        
        const tasksByStatusData = projectStatuses.map((status: any) => ({
          name: status.name,
          value: statusTaskCounts[status.name] || 0,
          color: status.color || '#9E9E9E'
        }));
        setTasksByStatus(tasksByStatusData);
        
        // Calculate stats
        const getTaskStatusName = (task: any): string => {
          if (task.status?.name) return task.status.name;
          const statusId = String(task.status_id);
          return statusMap[statusId]?.name || '';
        };
        
        const openTasks = tasks.filter((t: any) => !t.is_completed).length;
        
        const inProgressTasks = tasks.filter((t: any) => {
          const statusName = getTaskStatusName(t).toLowerCase();
          return statusName.includes('progress') || statusName.includes('in progress');
        }).length;
        
        const doneTasks = tasks.filter((t: any) => t.is_completed).length;
        
        const now = new Date();
        const overdueTasksFromProject = tasks.filter((t: any) => {
          if (t.is_completed || !t.due_date) return false;
          const dueDate = new Date(t.due_date);
          return dueDate < now;
        });
        const overdueCount = overdueTasksFromProject.length;
        
        const unassignedTasks = tasks.filter((t: any) => 
          !t.assignees || t.assignees.length === 0
        ).length;
        
        setStatusCards([
          { title: 'Open', count: openTasks, icon: FileText, color: '#4680FF', bgLight: '#E3F2FD' },
          { title: 'In Progress', count: inProgressTasks, icon: Clock, color: '#FFB64D', bgLight: '#FFF3E0' },
          { title: 'Done (30d)', count: doneTasks, icon: CheckCircle2, color: '#2CA87F', bgLight: '#E8F5E9' },
          { title: 'Overdue', count: overdueCount, icon: AlertCircle, color: '#DC2626', bgLight: '#FFEBEE' },
          { title: 'Unassigned', count: unassignedTasks, icon: Users, color: '#4FC3F7', bgLight: '#E1F5FE' }
        ]);
        
        // Calculate workload by assignee
        const workloadMap: Record<string, any> = {};
        tasks.forEach((task: any) => {
          const taskAssignees = task.assignees || [];
          const statusName = getTaskStatusName(task).toLowerCase();
          
          if (taskAssignees.length === 0) {
            if (!workloadMap['Unassigned']) {
              workloadMap['Unassigned'] = { name: 'Unassigned', initials: 'UN', backlog: 0, todo: 0, progress: 0, review: 0, done: 0 };
            }
            if (statusName.includes('backlog')) workloadMap['Unassigned'].backlog++;
            else if (statusName.includes('todo') || statusName.includes('to do')) workloadMap['Unassigned'].todo++;
            else if (statusName.includes('progress')) workloadMap['Unassigned'].progress++;
            else if (statusName.includes('review')) workloadMap['Unassigned'].review++;
            else if (task.is_completed) workloadMap['Unassigned'].done++;
          } else {
            taskAssignees.forEach((assignee: any) => {
              const assigneeName = assignee.user?.name || assignee.extension_number || 'Unknown';
              const initials = assigneeName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
              
              if (!workloadMap[assigneeName]) {
                workloadMap[assigneeName] = { name: assigneeName, initials, backlog: 0, todo: 0, progress: 0, review: 0, done: 0 };
              }
              
              if (statusName.includes('backlog')) workloadMap[assigneeName].backlog++;
              else if (statusName.includes('todo') || statusName.includes('to do')) workloadMap[assigneeName].todo++;
              else if (statusName.includes('progress')) workloadMap[assigneeName].progress++;
              else if (statusName.includes('review')) workloadMap[assigneeName].review++;
              else if (task.is_completed) workloadMap[assigneeName].done++;
            });
          }
        });
        
        setWorkloadData(Object.values(workloadMap));
      }
      
      if (activities && Array.isArray(activities)) {
        setAllActivity(activities);
        setRecentActivity(activities.slice(0, 4));
      } else {
        setAllActivity([]);
        setRecentActivity([]);
      }
      
      if (overdue && Array.isArray(overdue)) {
        const formattedOverdue = overdue.map((task: any) => ({
          id: `#${task.id}`,
          title: task.title || 'Untitled Task',
          priority: task.priority || 'Medium',
          assignee: task.assignees?.[0]?.user?.name || task.assignees?.[0]?.extension_number || 'Unassigned',
          dueDate: task.due_date ? formatDateForTable(task.due_date) : 'N/A'
        }));
        setAllOverdueTasks(formattedOverdue);
        setOverdueTasks(formattedOverdue.slice(0, 5));
      } else {
        setAllOverdueTasks([]);
        setOverdueTasks([]);
      }
    } catch (error) {
      console.error('Error fetching project data:', error);
    } finally {
      setLoadingProjectData(false);
      setLoadingActivities(false);
      setLoadingOverdue(false);
    }
  };

  const fetchBoardTasks = async () => {
    if (!selectedProject?.id) return;
    
    try {
      setLoadingBoardTasks(true);
      const withRelations = ['assignees', 'labels', 'status'];
      const response = await listTasks({
        project_id: Number(selectedProject.id),
        withRelations
      });

      if (response && response.success !== false) {
        setBoardTasks(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching board tasks:', error);
    } finally {
      setLoadingBoardTasks(false);
    }
  };

  const fetchListTasks = async () => {
    if (!selectedProject?.id) return;
    
    try {
      setLoadingListTasks(true);
      const withRelations = ['assignees', 'labels', 'status'];
      const response = await listTasks({
        project_id: Number(selectedProject.id),
        withRelations
      });

      if (response && response.success !== false) {
        setTasksList(response.data || []);
        setListPagination(response.pagination || null);
        setListSummary(response.summary || null);
      }
    } catch (error) {
      console.error('Error fetching list tasks:', error);
    } finally {
      setLoadingListTasks(false);
    }
  };
  
  // Group tasks by status for board view
  const getTasksByStatus = (statusId: string | number | null) => {
    let filtered = boardTasks.filter((task: any) => {
      if (boardSearchTerm && !task.title?.toLowerCase().includes(boardSearchTerm.toLowerCase())) {
        return false;
      }
      if (!showCompletedTasks && task.is_completed) {
        return false;
      }
      if (boardSelectedAssignee !== 'All Assignees') {
        const hasAssignee = task.assignees?.some((a: any) => {
          const assigneeName = a.user?.name || a.extension_number || '';
          return assigneeName === boardSelectedAssignee;
        });
        if (!hasAssignee) return false;
      }
      if (boardSelectedPriority !== 'All Priorities') {
        if (task.priority?.toLowerCase() !== boardSelectedPriority.toLowerCase()) {
          return false;
        }
      }
      if (boardSelectedLabel !== 'All Labels') {
        const hasLabel = task.labels?.some((l: any) => l.name === boardSelectedLabel);
        if (!hasLabel) return false;
      }
      return true;
    });

    if (statusId === null) {
      return filtered.filter((task: any) => !task.status_id);
    }
    return filtered.filter((task: any) => String(task.status_id) === String(statusId));
  };
  
  // Get all assignees from board tasks
  const getAllBoardAssignees = (): string[] => {
    const assigneeSet = new Set<string>();
    boardTasks.forEach((task: any) => {
      if (task.assignees && task.assignees.length > 0) {
        task.assignees.forEach((assignee: any) => {
          const name = assignee.user?.name || assignee.extension_number || '';
          if (name) assigneeSet.add(name);
        });
      }
    });
    return Array.from(assigneeSet).sort();
  };
  
  // Get all priorities from board tasks
  const getAllBoardPriorities = (): string[] => {
    const prioritySet = new Set<string>();
    boardTasks.forEach((task: any) => {
      if (task.priority) {
        prioritySet.add(task.priority.charAt(0).toUpperCase() + task.priority.slice(1));
      }
    });
    return Array.from(prioritySet).sort();
  };
  
  // Handle task creation
  const handleCreateTask = async (formData: any) => {
    if (!selectedProject) {
      return;
    }
    
    try {
      if (onCreateTask) {
        await onCreateTask(formData);
      }
      
      // Refresh project data
      await fetchProjectData();
      
      // Refresh board tasks if on board tab
      if (activeTab === 'board') {
        await fetchBoardTasks();
      }
      
      // Refresh list tasks if on list tab
      if (activeTab === 'list') {
        await fetchListTasks();
      }
    } catch (error) {
      console.error('Error refreshing task data:', error);
    }
  };

  const styles = {
    tabsContainer: { backgroundColor: '#fff', borderBottom: '1px solid #E5E9F2' },
    tabsInner: { maxWidth: '1400px', margin: '0 auto', padding: '0 1.5rem', display: 'flex', gap: '2rem' },
    tab: { background: 'none', border: 'none', padding: '1rem 0', fontSize: '0.95rem', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s', position: 'relative' as const },
    contentContainer: { maxWidth: '1400px', margin: '0 auto', padding: '0 1.5rem', marginTop: '1.5rem' },
    grid: { display: 'grid', gap: '1rem', marginBottom: '1.5rem' },
    gridTwo: { gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))' },
    card: { backgroundColor: 'white', border: 'none', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', padding: '1.5rem' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
    cardTitle: { margin: 0, fontWeight: '600', color: '#1F2937', fontSize: '1.1rem' },
    filterRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' },
    input: { width: '100%', padding: '0.75rem', border: '1px solid #E5E9F2', borderRadius: '6px', fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit' },
    select: { width: '100%', padding: '0.75rem', border: '1px solid #E5E9F2', borderRadius: '6px', fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit', cursor: 'pointer', backgroundColor: 'white' },
    inputGroup: { position: 'relative' as const, display: 'flex', alignItems: 'center' },
    inputIcon: { position: 'absolute' as const, left: '0.75rem', pointerEvents: 'none' as const },
    inputWithIcon: { paddingLeft: '2.5rem' },
    buttonOutline: { padding: '0.625rem 1.25rem', backgroundColor: 'white', color: '#4680FF', border: '1px solid #4680FF', borderRadius: '6px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', transition: 'all 0.2s' },
    buttonLight: { padding: '0.625rem', backgroundColor: '#F4F7FA', color: '#6B7280', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'background 0.2s' },
    chartContainer: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'center' },
    legendItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' },
    legendDot: { width: '12px', height: '12px', borderRadius: '50%', marginRight: '0.5rem' },
    badge: { padding: '0.25rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600', display: 'inline-block' },
    table: { width: '100%', borderCollapse: 'collapse' as const },
    th: { fontSize: '0.75rem', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' as const, letterSpacing: '0.5px', padding: '0.75rem', textAlign: 'left' as const, backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E9F2' },
    td: { padding: '1rem 0.75rem', borderBottom: '1px solid #F3F4F6', color: '#4B5563', fontSize: '0.9rem' },
    activityItem: { display: 'flex', gap: '1rem', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #F3F4F6' },
    activityContent: { flex: 1 },
    activityText: { fontSize: '0.9rem', color: '#4B5563', marginBottom: '0.25rem', lineHeight: '1.5' },
    activityTime: { fontSize: '0.8rem', color: '#9CA3AF' },
    link: { color: '#4680FF', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '500', cursor: 'pointer' },
    tableWrapper: { overflowX: 'auto' as const }
  };

  return (
    <>
      {/* Tabs */}
      <TabsNavigation 
        activeTab={activeTab} 
        onTabChange={handleTabChange}
      />

      {/* Content */}
      <div style={styles.contentContainer}>
        {!selectedProject ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#6B7280' }}>
            <p>Please select a project to view details</p>
          </div>
        ) : activeTab === 'overview' ? (
          <OverviewTab
            statusCards={statusCards}
            loadingProjectData={loadingProjectData}
            assignees={assignees}
            labels={labels}
            statuses={statuses}
            tasksByStatus={tasksByStatus}
            workloadData={workloadData}
            recentActivity={recentActivity}
            loadingActivities={loadingActivities}
            overdueTasks={overdueTasks}
            loadingOverdue={loadingOverdue}
            onViewActivity={() => setShowActivityModal(true)}
            onViewOverdue={() => setShowTasksModal(true)}
            styles={styles}
          />
        ) : activeTab === 'board' ? (
          <BoardTab
            selectedProject={selectedProject}
            hierarchyDataExtensions={hierarchyDataExtensions}
            statuses={statuses}
            boardTasks={boardTasks}
            loadingBoardTasks={loadingBoardTasks}
            labels={labels}
            boardSearchTerm={boardSearchTerm}
            setBoardSearchTerm={setBoardSearchTerm}
            boardSelectedAssignee={boardSelectedAssignee}
            setBoardSelectedAssignee={setBoardSelectedAssignee}
            boardSelectedPriority={boardSelectedPriority}
            setBoardSelectedPriority={setBoardSelectedPriority}
            boardSelectedLabel={boardSelectedLabel}
            setBoardSelectedLabel={setBoardSelectedLabel}
            showCompletedTasks={showCompletedTasks}
            setShowCompletedTasks={setShowCompletedTasks}
            onCreateTask={(statusId) => {
              setSelectedStatusForTask(statusId);
              setShowCreateTaskModal(true);
            }}
            getAllBoardAssignees={getAllBoardAssignees}
            getAllBoardPriorities={getAllBoardPriorities}
            getTasksByStatus={getTasksByStatus}
            recentActivity={recentActivity}
            loadingActivities={loadingActivities}
            overdueTasks={overdueTasks}
            loadingOverdue={loadingOverdue}
            onViewActivity={() => setShowActivityModal(true)}
            onViewOverdue={() => setShowTasksModal(true)}
            styles={styles}
            onTaskStatusChange={() => {
              // Refresh board tasks and project data when task status changes
              if (activeTab === 'board' && selectedProject?.id) {
                fetchBoardTasks();
                fetchProjectData();
              }
            }}
          />
        ) : activeTab === 'list' ? (
          <ListTab
            tasksList={tasksList}
            loading={loadingListTasks}
            listSummary={listSummary}
            styles={styles}
            selectedProject={selectedProject}
            extensions={hierarchyDataExtensions as any}
            labels={labels}
            statuses={statuses}
            onRefresh={() => {
              if (activeTab === 'list' && selectedProject?.id) {
                fetchListTasks();
                fetchProjectData();
              }
            }}
          />
        ) : activeTab === 'members' ? (
          <MembersTab
            selectedProject={selectedProject}
            members={members}
            loading={loadingProjectData}
            onRefresh={fetchProjectData}
            styles={styles}
            hierarchyDataExtensions={hierarchyDataExtensions}
          />
        ) : activeTab === 'statuses' ? (
          <StatusesTab
            selectedProject={selectedProject}
            statuses={statuses}
            loading={loadingProjectData}
            onRefresh={fetchProjectData}
            styles={styles}
          />
        ) : activeTab === 'labels' ? (
          <LabelsTab
            selectedProject={selectedProject}
            labels={labels}
            loading={loadingProjectData}
            onRefresh={fetchProjectData}
            styles={styles}
          />
        ) : activeTab === 'reports' ? (
          <>
          {/* <TasksReports embedded={true} /> */}
          Coming Soon
          </>
        ) : null}
      </div>

      {/* Recent Activity Modal */}
      <ActivityModal
        show={showActivityModal}
        onHide={() => setShowActivityModal(false)}
        activities={allActivity}
        loading={loadingActivities}
      />

      {/* All Overdue Tasks Modal */}
      <OverdueTasksModal
        show={showTasksModal}
        onHide={() => setShowTasksModal(false)}
        tasks={allOverdueTasks}
        loading={loadingOverdue}
      />

      {/* Create Task Modal */}
      <CreateTaskModal
        show={showCreateTaskModal}
        onHide={() => {
          setShowCreateTaskModal(false);
          setSelectedStatusForTask(null);
        }}
        onCreate={handleCreateTask}
        onCreateAndOpen={handleCreateTask}
        extensions={hierarchyDataExtensions as any}
        labels={labels}
        linkedRecords={selectedProject ? [{ id: selectedProject.id, type: 'crm' as const, title: selectedProject.name, reference: `Project #${selectedProject.id}` }] : []}
        project={selectedProject ? { id: selectedProject.id, name: selectedProject.name, icon: '', color: selectedProject.color || '' } : undefined}
        statuses={statuses.map((status: any) => ({ id: status.id, name: status.name, icon: '', color: status.color || '' }))}
        selectedStatusForTask={selectedStatusForTask}
      />
    </>
  );
});

ProjectTabsContent.displayName = 'ProjectTabsContent';

export default ProjectTabsContent;
