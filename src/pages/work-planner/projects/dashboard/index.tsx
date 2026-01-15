import "@assets/scss/datatable-style.scss";
import React, {
  ReactElement,
  useState,
  useEffect
} from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import { 
  LayoutDashboard, Plus, LayoutGrid, ChevronDown, Search,
  MoreVertical, Clock, AlertCircle, CheckCircle2, 
  FileText, Users, Calendar, TrendingUp, Filter, X, User, Grid3x3, Bell, Folder
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip 
} from 'recharts';
import { Row, Col, Modal, Button, Container, Spinner } from 'react-bootstrap';
import StatsCard from '@components/work-planner/stats-cards';
import TasksReports from '@components/work-planner/tasks-reports';
import CreateTaskModal from '@components/work-planner/createtask-modal';
import BoardView from './BoardView';
import { listProjects, getProject, getRecentActivity, getOverdueTasks, listTasks } from '@utils/tasks';
import { formatDateForTable, getAutoTimezone, ModuleSlug } from '@utils/Helper';
import { useHierarchyData } from '@components/filters/useHierarchyData';

const WorkPlannerProjectsDashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [selectedProject, setSelectedProject] = useState<any>(null);
    const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
    const [projects, setProjects] = useState<any[]>([]);
    const [loadingProjects, setLoadingProjects] = useState(true);
    const [showProjectDropdown, setShowProjectDropdown] = useState(false);
    const [showMoreDropdown, setShowMoreDropdown] = useState(false);
    const [showActivityModal, setShowActivityModal] = useState(false);
    const [showTasksModal, setShowTasksModal] = useState(false);
    const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
    const [creatingTask, setCreatingTask] = useState(false);
    const [selectedStatusForTask, setSelectedStatusForTask] = useState<number | null>(null);
    
    // Fetch extensions for CreateTaskModal
    const { hierarchyDataExtensions, loading: hierarchyLoading } = useHierarchyData(ModuleSlug.CALL_RECORDINGS);
    
    // Project data
    const [projectData, setProjectData] = useState<any>(null);
    const [assignees, setAssignees] = useState<any[]>([]);
    const [labels, setLabels] = useState<any[]>([]);
    const [statuses, setStatuses] = useState<any[]>([]);
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
    
    // Fetch projects list
    useEffect(() => {
      const fetchProjects = async () => {
        try {
          setLoadingProjects(true);
          const response = await listProjects({ page: 1, limit: 100 });
          if (response && response.success === true && response.data && Array.isArray(response.data)) {
            setProjects(response.data);
            // Auto-select first project if available
            if (response.data.length > 0 && !selectedProject) {
              handleProjectSelect(response.data[0]);
            }
          }
        } catch (error) {
          console.error('Error fetching projects:', error);
        } finally {
          setLoadingProjects(false);
        }
      };
      
      fetchProjects();
    }, []);
    
    // Fetch project data, activities, and overdue tasks when project is selected
    const handleProjectSelect = async (project: any) => {
      setSelectedProject(project);
      setSelectedProjectId(project.id);
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
          getProject(project.id, withRelations),
          getRecentActivity(project.id),
          getOverdueTasks(project.id)
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
          // Helper to get status name for a task
          const getTaskStatusName = (task: any): string => {
            if (task.status?.name) return task.status.name;
            const statusId = String(task.status_id);
            return statusMap[statusId]?.name || '';
          };
          
          // Open: All tasks that are not completed
          const openTasks = tasks.filter((t: any) => !t.is_completed).length;
          
          // In Progress: Tasks with status name containing "In Progress" or "progress" (case insensitive)
          const inProgressTasks = tasks.filter((t: any) => {
            const statusName = getTaskStatusName(t).toLowerCase();
            return statusName.includes('progress') || statusName.includes('in progress');
          }).length;
          
          // Done (30d): All completed tasks (can be enhanced to filter by last 30 days)
          const doneTasks = tasks.filter((t: any) => t.is_completed).length;
          
          // Overdue: Tasks with due_date in the past and not completed
          const now = new Date();
          const overdueTasksFromProject = tasks.filter((t: any) => {
            if (t.is_completed || !t.due_date) return false;
            const dueDate = new Date(t.due_date);
            return dueDate < now;
          });
          const overdueCount = overdueTasksFromProject.length;
          
          // Unassigned: Tasks with no assignees
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
    
    // Fetch board tasks when board tab is active and project is selected
    useEffect(() => {
      if (activeTab === 'board' && selectedProject?.id) {
        fetchBoardTasks();
      }
    }, [activeTab, selectedProject?.id]);
    
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
    
    // Group tasks by status for board view
    const getTasksByStatus = (statusId: string | number | null) => {
      let filtered = boardTasks.filter((task: any) => {
        // Filter by search
        if (boardSearchTerm && !task.title?.toLowerCase().includes(boardSearchTerm.toLowerCase())) {
          return false;
        }
        // Filter by completed
        if (!showCompletedTasks && task.is_completed) {
          return false;
        }
        // Filter by assignee
        if (boardSelectedAssignee !== 'All Assignees') {
          const hasAssignee = task.assignees?.some((a: any) => {
            const assigneeName = a.user?.name || a.extension_number || '';
            return assigneeName === boardSelectedAssignee;
          });
          if (!hasAssignee) return false;
        }
        // Filter by priority
        if (boardSelectedPriority !== 'All Priorities') {
          if (task.priority?.toLowerCase() !== boardSelectedPriority.toLowerCase()) {
            return false;
          }
        }
        // Filter by label
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
    
    // Handle task creation - called after modal successfully creates task
    // The modal handles the API call, this just refreshes the data
    const handleCreateTask = async (formData: any) => {
      if (!selectedProject) {
        return;
      }
      
      try {
        setCreatingTask(true);
        
        // Refresh project data to show new task
        // The modal already called the createTask API, so we just refresh here
        if (selectedProject) {
          await handleProjectSelect(selectedProject);
          // Refresh board tasks if on board tab
          if (activeTab === 'board') {
            await fetchBoardTasks();
          }
        }
      } catch (error) {
        console.error('Error refreshing task data:', error);
      } finally {
        setCreatingTask(false);
      }
    };
  
    const styles = {
      container: { backgroundColor: '#F4F7FA', minHeight: '100vh', paddingBottom: '2rem' },
      header: { backgroundColor: '#fff', borderBottom: '1px solid #E5E9F2', padding: '1rem 0' },
      headerInner: { maxWidth: '1400px', margin: '0 auto', padding: '0 1.5rem' },
      headerContent: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' as const, gap: '1rem' },
      headerLeft: { display: 'flex', alignItems: 'center', gap: '1rem' },
      logoBox: { width: '40px', height: '40px', backgroundColor: '#4680FF', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 },
      title: { margin: 0, fontWeight: '600', color: '#1F2937', fontSize: '1.5rem' },
      dropdown: { position: 'relative' as const, display: 'inline-block' },
      dropdownButton: { backgroundColor: '#F4F7FA', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: '500', color: '#1F2937', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem' },
      dropdownMenu: { position: 'absolute' as const, top: '100%', left: 0, marginTop: '0.5rem', backgroundColor: '#fff', border: '1px solid #E5E9F2', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', minWidth: '180px', zIndex: 1000 },
      dropdownItem: { padding: '0.75rem 1rem', cursor: 'pointer', fontSize: '0.9rem', color: '#4B5563', borderBottom: '1px solid #F3F4F6', transition: 'background 0.2s' },
      headerRight: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap' as const },
      button: { padding: '0.625rem 1.25rem', backgroundColor: '#4680FF', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', transition: 'background 0.2s' },
      buttonOutline: { padding: '0.625rem 1.25rem', backgroundColor: 'white', color: '#4680FF', border: '1px solid #4680FF', borderRadius: '6px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', transition: 'all 0.2s' },
      buttonLight: { padding: '0.625rem', backgroundColor: '#F4F7FA', color: '#6B7280', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'background 0.2s' },
      tabsContainer: { backgroundColor: '#fff', borderBottom: '1px solid #E5E9F2' },
      tabsInner: { maxWidth: '1400px', margin: '0 auto', padding: '0 1.5rem', display: 'flex', gap: '2rem' },
      tab: { background: 'none', border: 'none', padding: '1rem 0', fontSize: '0.95rem', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s', position: 'relative' as const },
      contentContainer: { maxWidth: '1400px', margin: '0 auto', padding: '0 1.5rem', marginTop: '1.5rem' },
      grid: { display: 'grid', gap: '1rem', marginBottom: '1.5rem' },
      gridFive: { gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' },
      gridTwo: { gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))' },
      card: { backgroundColor: 'white', border: 'none', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', padding: '1.5rem' },
      cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
      cardTitle: { margin: 0, fontWeight: '600', color: '#1F2937', fontSize: '1.1rem' },
      statusCard: { display: 'flex', justifyContent: 'space-between', alignItems: 'start' },
      statusInfo: { flex: 1 },
      statusLabel: { color: '#6B7280', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: '500' },
      statusCount: { fontSize: '2rem', fontWeight: '600', color: '#1F2937' },
      iconBox: { width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
      filterRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' },
      input: { width: '100%', padding: '0.75rem', border: '1px solid #E5E9F2', borderRadius: '6px', fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit' },
      select: { width: '100%', padding: '0.75rem', border: '1px solid #E5E9F2', borderRadius: '6px', fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit', cursor: 'pointer', backgroundColor: 'white' },
      inputGroup: { position: 'relative' as const, display: 'flex', alignItems: 'center' },
      inputIcon: { position: 'absolute' as const, left: '0.75rem', pointerEvents: 'none' as const },
      inputWithIcon: { paddingLeft: '2.5rem' },
      chartContainer: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'center' },
      legendItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' },
      legendDot: { width: '12px', height: '12px', borderRadius: '50%', marginRight: '0.5rem' },
      badge: { padding: '0.25rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600', display: 'inline-block' },
      table: { width: '100%', borderCollapse: 'collapse' as const },
      th: { fontSize: '0.75rem', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' as const, letterSpacing: '0.5px', padding: '0.75rem', textAlign: 'left' as const, backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E9F2' },
      td: { padding: '1rem 0.75rem', borderBottom: '1px solid #F3F4F6', color: '#4B5563', fontSize: '0.9rem' },
      activityItem: { display: 'flex', gap: '1rem', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #F3F4F6' },
      activityAvatar: { fontSize: '2rem', flexShrink: 0 },
      activityContent: { flex: 1 },
      activityText: { fontSize: '0.9rem', color: '#4B5563', marginBottom: '0.25rem', lineHeight: '1.5' },
      activityTime: { fontSize: '0.8rem', color: '#9CA3AF' },
      link: { color: '#4680FF', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '500', cursor: 'pointer' },
      tableWrapper: { overflowX: 'auto' as const }
    };

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Work Planner Projects Dashboard" />

    <>
      <style>{`
        .stat-card {
          border: none;
          border-radius: 12px;
          padding: 1.25rem 1.5rem;
          transition: transform 0.2s, box-shadow 0.2s;
          min-height: 120px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        
        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        
        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          flex-shrink: 0;
        }
        
        .stat-number {
          font-size: 2rem;
          font-weight: 700;
          margin: 0.5rem 0 0.25rem 0;
        }
        
        .stat-label {
          font-size: 0.875rem;
          color: #6B7280;
          font-weight: 500;
          margin: 0;
        }
      `}</style>
     
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerInner}>
            <div style={styles.headerContent}>
              <div style={styles.headerLeft}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Folder size={32} className="text-primary" style={{ marginRight: '0.5rem' }} />
                <h2 className="mb-0 fw-bold">Projects</h2>
              </div>
              
              <div style={styles.dropdown}>
                <button 
                  style={styles.dropdownButton}
                  onClick={() => setShowProjectDropdown(!showProjectDropdown)}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#E5E9F2'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#F4F7FA'}
                  disabled={loadingProjects}
                >
                  {loadingProjects ? (
                    <Spinner size="sm" animation="border" />
                  ) : (
                    <>
                      {selectedProject?.name || 'Select Project'}
                      <ChevronDown size={16} />
                    </>
                  )}
                </button>
                {showProjectDropdown && !loadingProjects && (
                  <div style={styles.dropdownMenu}>
                    {projects.map((project, index) => (
                      <div 
                        key={project.id}
                        style={{
                          ...styles.dropdownItem,
                          borderBottom: index === projects.length - 1 ? 'none' : '1px solid #F3F4F6'
                        }}
                        onClick={() => { 
                          handleProjectSelect(project); 
                          setShowProjectDropdown(false); 
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
                      >
                        {project.name}
                      </div>
                    ))}
                    {projects.length === 0 && (
                      <div style={styles.dropdownItem}>
                        No projects available
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div style={styles.headerRight}>
              <Button 
                variant="primary" 
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                onClick={() => {
                  if (!selectedProject) {
                    alert('Please select a project first');
                    return;
                  }
                  setShowCreateTaskModal(true);
                }}
                disabled={!selectedProject || hierarchyLoading}
              >
                <Plus size={18} />
                <span>Create Task</span>
              </Button>
              
              <Button 
                variant="outline-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                onClick={() => setActiveTab('board')}
              >
                <LayoutGrid size={18} />
                Board View
              </Button>
              
              <div style={styles.dropdown}>
                <button 
                  style={styles.buttonLight}
                  onClick={() => setShowMoreDropdown(!showMoreDropdown)}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#E5E9F2'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#F4F7FA'}
                >
                  <MoreVertical size={18} />
                </button>
                {showMoreDropdown && (
                  <div style={{...styles.dropdownMenu, right: 0, left: 'auto'}}>
                    <div 
                      style={styles.dropdownItem}
                      onClick={() => setShowMoreDropdown(false)}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
                    >
                      Export Data
                    </div>
                    <div 
                      style={{...styles.dropdownItem, borderBottom: 'none'}}
                      onClick={() => setShowMoreDropdown(false)}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
                    >
                      Settings
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabsContainer}>
        <div style={styles.tabsInner}>
          {['Overview', 'Board', 'List', 'Reports'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab.toLowerCase())}
              style={{
                ...styles.tab,
                color: activeTab === tab.toLowerCase() ? '#4680FF' : '#6B7280',
                borderBottom: activeTab === tab.toLowerCase() ? '2px solid #4680FF' : '2px solid transparent'
              } as React.CSSProperties}
              onMouseOver={(e) => {
                if (activeTab !== tab.toLowerCase()) {
                  e.currentTarget.style.color = '#4680FF';
                }
              }}
              onMouseOut={(e) => {
                if (activeTab !== tab.toLowerCase()) {
                  e.currentTarget.style.color = '#6B7280';
                }
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={styles.contentContainer}>
        {activeTab === 'overview' ? (
          <>
        {/* Status Cards */}
        {loadingProjectData ? (
          <Row className="g-3" style={{ marginBottom: '1.5rem' }}>
            <Col xs={12} className="text-center">
              <Spinner animation="border" />
            </Col>
          </Row>
        ) : (
          <Row className="g-3" style={{ marginBottom: '1.5rem' }}>
            {statusCards.map((card, index) => (
              <Col xs={12} sm={6} lg key={index} className="d-flex">
                <StatsCard
                  title={card.title}
                  value={card.count}
                  icon={card.icon}
                  iconColor={card.color}
                  iconBgColor={card.bgLight}
                  valueColor="#1F2937"
                />
              </Col>
            ))}
          </Row>
        )}

        {/* Filters */}
        <div style={styles.card}>
          <div style={styles.filterRow}>
            <div style={styles.inputGroup}>
              <Search size={16} color="#6B7280" style={styles.inputIcon} />
              <input 
                type="text" 
                placeholder="Search tasks..."
                style={{...styles.input, ...styles.inputWithIcon}}
                onFocus={(e) => e.target.style.borderColor = '#4680FF'}
                onBlur={(e) => e.target.style.borderColor = '#E5E9F2'}
              />
            </div>
            
            <select style={styles.select}>
              <option>Assignee</option>
              {assignees.map((assignee) => (
                <option key={assignee.id} value={assignee.id}>
                  {assignee.name}
                </option>
              ))}
            </select>
            
            <select style={styles.select}>
              <option>Label</option>
              {labels.map((label) => (
                <option key={label.id} value={label.id}>
                  {label.name}
                </option>
              ))}
            </select>
            
            <select style={styles.select}>
              <option>Status</option>
              {statuses.map((status) => (
                <option key={status.id} value={status.id}>
                  {status.name}
                </option>
              ))}
            </select>
            
            <button 
              style={{...styles.buttonOutline, justifyContent: 'center'}}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
            >
              <X size={16} />
              Clear Filters
            </button>
          </div>
        </div>

        {/* Charts Row */}
        <div style={{...styles.grid, ...styles.gridTwo}}>
          {/* Tasks by Status */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h5 style={styles.cardTitle}>Tasks by Status</h5>
              <button 
                style={{...styles.buttonLight, padding: '0.5rem'}}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#E5E9F2'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#F4F7FA'}
              >
                <MoreVertical size={18} />
              </button>
            </div>
            
            {tasksByStatus.length === 0 || tasksByStatus.every(item => item.value === 0) ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '3rem 2rem',
                color: '#6B7280'
              }}>
                <FileText size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: '500' }}>No tasks by status</p>
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', opacity: 0.7 }}>Tasks will appear here once they are created</p>
              </div>
            ) : (
              <div style={styles.chartContainer}>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={tasksByStatus}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {tasksByStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
                
                <div>
                  {tasksByStatus.map((item, index) => (
                    <div key={index} style={styles.legendItem}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div style={{...styles.legendDot, backgroundColor: item.color}}></div>
                        <span style={{ fontSize: '0.9rem', color: '#4B5563' }}>{item.name}</span>
                      </div>
                      <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#1F2937' }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Workload by Assignee */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h5 style={styles.cardTitle}>Workload by Assignee</h5>
              <button 
                style={{...styles.buttonLight, padding: '0.5rem'}}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#E5E9F2'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#F4F7FA'}
              >
                <MoreVertical size={18} />
              </button>
            </div>
            
            {workloadData.length === 0 || workloadData.every(person => 
              person.backlog === 0 && person.todo === 0 && person.progress === 0 && person.review === 0 && person.done === 0
            ) ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '3rem 2rem',
                color: '#6B7280'
              }}>
                <Users size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: '500' }}>No workload data</p>
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', opacity: 0.7 }}>Workload will appear here once tasks are assigned</p>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={workloadData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E9F2" vertical={false} />
                    <XAxis 
                      dataKey="initials" 
                      tick={{ fontSize: 12, fill: '#6B7280' }}
                      interval={0}
                      axisLine={{ stroke: '#E5E9F2' }}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 12, fill: '#6B7280' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <RechartsTooltip 
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #E5E9F2',
                        borderRadius: '8px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Bar dataKey="backlog" stackId="a" fill="#9E9E9E" />
                    <Bar dataKey="todo" stackId="a" fill="#4680FF" />
                    <Bar dataKey="progress" stackId="a" fill="#FFB64D" />
                    <Bar dataKey="review" stackId="a" fill="#DC2626" />
                    <Bar dataKey="done" stackId="a" fill="#2CA87F" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                
                <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.75rem', color: '#6B7280' }}>
                  {workloadData.map((person, index) => (
                    <div key={index} style={{ display: 'inline-block', margin: '0 0.5rem' }}>
                      {person.initials}: {person.name}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Bottom Row */}
        <div style={{...styles.grid, ...styles.gridTwo}}>
          {/* Recent Activity */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h5 style={styles.cardTitle}>Recent Activity</h5>
              <span 
                style={{...styles.link, cursor: 'pointer'}}
                onClick={() => setShowActivityModal(true)}
              >
                View All →
              </span>
            </div>
            
            <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
              {loadingActivities ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <Spinner animation="border" />
                </div>
              ) : recentActivity.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#6B7280' }}>
                  No recent activity
                </div>
              ) : (
                recentActivity.map((activity: any, index: number) => {
                  const user = activity.user || activity.action_by || 'Unknown';
                  const initials = user.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
                  const colors = ['#48bb78', '#f56565', '#4299e1', '#ed64a6', '#667eea', '#9f7aea', '#fc8181', '#ed8936'];
                  const color = colors[index % colors.length];
                  
                  return (
                    <div key={activity.id || index} style={styles.activityItem}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: color,
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        flexShrink: 0
                      }}>
                        {initials}
                      </div>
                      
                      <div style={styles.activityContent}>
                        <div style={styles.activityText}>
                          <strong style={{ color: '#1F2937' }}>{user}</strong>
                          {' '}{activity.action || activity.activity_type || 'performed action on'}{' '}
                          <strong style={{ color: '#1F2937' }}>{activity.task?.title || activity.description || 'task'}</strong>
                          {activity.status && (
                            <>
                              {' '}to{' '}
                              <span style={{
                                padding: '0.125rem 0.5rem',
                                backgroundColor: '#E0F2FE',
                                color: '#0369A1',
                                borderRadius: '4px',
                                fontSize: '0.8rem',
                                fontWeight: '500'
                              }}>
                                {activity.status}
                              </span>
                            </>
                          )}
                        </div>
                        <div style={styles.activityTime}>
                          {activity.created_at ? formatDateForTable(activity.created_at) : activity.time || 'Recently'}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Top Overdue Tasks */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h5 style={styles.cardTitle}>Top Overdue Tasks</h5>
              {overdueTasks.length > 0 && (
                <span 
                  style={{...styles.link, cursor: 'pointer'}}
                  onClick={() => setShowTasksModal(true)}
                >
                  View All →
                </span>
              )}
            </div>
            
            {loadingOverdue ? (
              <div style={{ textAlign: 'center', padding: '3rem 2rem' }}>
                <Spinner animation="border" />
              </div>
            ) : overdueTasks.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '3rem 2rem',
                color: '#6B7280'
              }}>
                <AlertCircle size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: '500' }}>No overdue tasks</p>
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', opacity: 0.7 }}>All tasks are up to date</p>
              </div>
            ) : (
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Title</th>
                      <th style={styles.th}>Priority</th>
                      <th style={styles.th}>Assignee</th>
                      <th style={styles.th}>Due Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overdueTasks.map((task) => (
                      <tr 
                        key={task.id}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
                      >
                        <td style={styles.td}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ color: '#4680FF', fontWeight: '600', cursor: 'pointer' }}>{task.id}</span>
                            <span style={{ color: '#6B7280' }}>{task.title}</span>
                          </div>
                        </td>
                        <td style={styles.td}>
                          <span style={{
                            ...styles.badge,
                            backgroundColor: task.priority === 'High' ? '#FEE2E2' : task.priority === 'Medium' ? '#FEF3C7' : '#E0E7FF',
                            color: task.priority === 'High' ? '#991B1B' : task.priority === 'Medium' ? '#92400E' : '#3730A3'
                          }}>
                            {task.priority}
                          </span>
                        </td>
                        <td style={styles.td}>{task.assignee}</td>
                        <td style={styles.td}>{task.dueDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        </>
        ) : activeTab === 'board' ? (
          <>
            <BoardView
              selectedProject={selectedProject}
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
              onClearFilters={() => {
                setBoardSearchTerm('');
                setBoardSelectedAssignee('All Assignees');
                setBoardSelectedPriority('All Priorities');
                setBoardSelectedLabel('All Labels');
                setShowCompletedTasks(false);
              }}
              onCreateTask={(statusId) => {
                setSelectedStatusForTask(statusId);
                setShowCreateTaskModal(true);
              }}
              getAllBoardAssignees={getAllBoardAssignees}
              getAllBoardPriorities={getAllBoardPriorities}
              getTasksByStatus={getTasksByStatus}
            />
            
            {/* Bottom Row - Recent Activity & Overdue Tasks */}
            <div style={{...styles.grid, ...styles.gridTwo, marginTop: '1.5rem'}}>
              {/* Recent Activity */}
              <div style={styles.card}>
                <div style={styles.cardHeader}>
                  <h5 style={styles.cardTitle}>Recent Activity</h5>
                  <span 
                    style={{...styles.link, cursor: 'pointer'}}
                    onClick={() => setShowActivityModal(true)}
                  >
                    View All →
                  </span>
                </div>
                
                <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
                  {loadingActivities ? (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                      <Spinner animation="border" />
                    </div>
                  ) : recentActivity.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#6B7280' }}>
                      No recent activity
                    </div>
                  ) : (
                    recentActivity.map((activity: any, index: number) => {
                      const user = activity.user || activity.action_by || 'Unknown';
                      const initials = user.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
                      const colors = ['#48bb78', '#f56565', '#4299e1', '#ed64a6', '#667eea', '#9f7aea', '#fc8181', '#ed8936'];
                      const color = colors[index % colors.length];
                      
                      return (
                        <div key={activity.id || index} style={styles.activityItem}>
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            backgroundColor: color,
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            flexShrink: 0
                          }}>
                            {initials}
                          </div>
                          
                          <div style={styles.activityContent}>
                            <div style={styles.activityText}>
                              <strong style={{ color: '#1F2937' }}>{user}</strong>
                              {' '}{activity.action || activity.activity_type || 'performed action on'}{' '}
                              <strong style={{ color: '#1F2937' }}>{activity.task?.title || activity.description || 'task'}</strong>
                              {activity.status && (
                                <span style={{
                                  ...styles.badge,
                                  backgroundColor: '#D1F2EB',
                                  color: '#0C7064',
                                  marginLeft: '0.5rem'
                                }}>
                                  {activity.status}
                                </span>
                              )}
                            </div>
                            <div style={styles.activityTime}>
                              {activity.created_at ? formatDateForTable(activity.created_at) : activity.time || 'Recently'}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Top Overdue Tasks */}
              <div style={styles.card}>
                <div style={styles.cardHeader}>
                  <h5 style={styles.cardTitle}>Top Overdue Tasks</h5>
                  <span 
                    style={{...styles.link, cursor: 'pointer'}}
                    onClick={() => setShowTasksModal(true)}
                  >
                    View All →
                  </span>
                </div>
                
                <div style={styles.tableWrapper}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Title</th>
                        <th style={styles.th}>Priority</th>
                        <th style={styles.th}>Assignee</th>
                        <th style={styles.th}>Due Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingOverdue ? (
                        <tr>
                          <td colSpan={4} style={{ textAlign: 'center', padding: '2rem' }}>
                            <Spinner animation="border" />
                          </td>
                        </tr>
                      ) : overdueTasks.length === 0 ? (
                        <tr>
                          <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: '#6B7280' }}>
                            No overdue tasks
                          </td>
                        </tr>
                      ) : (
                        overdueTasks.map((task) => (
                          <tr 
                            key={task.id}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
                          >
                            <td style={styles.td}>
                              <span style={{ color: '#6B7280', marginRight: '0.5rem' }}>
                                {task.id}
                              </span>
                              <span style={{ color: '#1F2937', fontWeight: '500' }}>
                                {task.title}
                              </span>
                            </td>
                            <td style={styles.td}>
                              <span style={{
                                ...styles.badge,
                                backgroundColor: task.priority === 'High' ? '#FEE2E2' : task.priority === 'Medium' ? '#FEF3C7' : '#D1FAE5',
                                color: task.priority === 'High' ? '#991B1B' : task.priority === 'Medium' ? '#92400E' : '#065F46'
                              }}>
                                {task.priority}
                              </span>
                            </td>
                            <td style={styles.td}>{task.assignee}</td>
                            <td style={styles.td}>{task.dueDate}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        ) : activeTab === 'list' ? (
          <div style={styles.card}>
            <h5 style={styles.cardTitle}>List View</h5>
            <p style={{ color: '#6B7280' }}>List view coming soon...</p>
          </div>
        ) : activeTab === 'reports' ? (
          <TasksReports embedded={true} />
        ) : null}
      </div>
      </div>

      {/* Recent Activity Modal */}
      <Modal show={showActivityModal} onHide={() => setShowActivityModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>All Recent Activity</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div>
            {loadingActivities ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <Spinner animation="border" />
              </div>
            ) : allActivity.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#6B7280' }}>
                No activity found
              </div>
            ) : (
              allActivity.map((activity: any, index: number) => {
                const user = activity.user || activity.action_by || 'Unknown';
                const initials = user.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
                const colors = ['#48bb78', '#f56565', '#4299e1', '#ed64a6', '#667eea', '#9f7aea', '#fc8181', '#ed8936'];
                const color = colors[index % colors.length];
                
                return (
                  <div key={activity.id || index} style={styles.activityItem}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: color,
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      flexShrink: 0
                    }}>
                      {initials}
                    </div>
                    
                    <div style={styles.activityContent}>
                      <div style={styles.activityText}>
                        <strong style={{ color: '#1F2937' }}>{user}</strong>
                        {' '}{activity.action || activity.activity_type || 'performed action on'}{' '}
                        <strong style={{ color: '#1F2937' }}>{activity.task?.title || activity.description || 'task'}</strong>
                        {activity.status && (
                          <span style={{
                            ...styles.badge,
                            backgroundColor: '#D1F2EB',
                            color: '#0C7064',
                            marginLeft: '0.5rem'
                          }}>
                            {activity.status}
                          </span>
                        )}
                      </div>
                      <div style={styles.activityTime}>
                        {activity.created_at ? formatDateForTable(activity.created_at) : activity.time || 'Recently'}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowActivityModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* All Overdue Tasks Modal */}
      <Modal show={showTasksModal} onHide={() => setShowTasksModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>All Overdue Tasks</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Title</th>
                  <th style={styles.th}>Priority</th>
                  <th style={styles.th}>Assignee</th>
                  <th style={styles.th}>Due Date</th>
                </tr>
              </thead>
              <tbody>
                {loadingOverdue ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '2rem' }}>
                      <Spinner animation="border" />
                    </td>
                  </tr>
                ) : allOverdueTasks.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: '#6B7280' }}>
                      No overdue tasks
                    </td>
                  </tr>
                ) : (
                  allOverdueTasks.map((task) => (
                    <tr 
                      key={task.id}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
                    >
                      <td style={styles.td}>
                        <span style={{ color: '#6B7280', marginRight: '0.5rem' }}>
                          {task.id}
                        </span>
                        <span style={{ color: '#1F2937', fontWeight: '500' }}>
                          {task.title}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.badge,
                          backgroundColor: task.priority === 'High' ? '#FEE2E2' : task.priority === 'Medium' ? '#FEF3C7' : '#D1FAE5',
                          color: task.priority === 'High' ? '#991B1B' : task.priority === 'Medium' ? '#92400E' : '#065F46'
                        }}>
                          {task.priority}
                        </span>
                      </td>
                      <td style={styles.td}>{task.assignee}</td>
                      <td style={styles.td}>{task.dueDate}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowTasksModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

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

    </React.Fragment>
  );
};

WorkPlannerProjectsDashboard.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default WorkPlannerProjectsDashboard;
