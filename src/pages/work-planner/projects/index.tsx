import "@assets/scss/datatable-style.scss";
import React, {
  ReactElement,
} from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import  { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { listProjects, createProject, updateProject, deleteProject, getProject, getRecentActivity, getOverdueTasks } from '@utils/tasks';
import DeleteConfirmationModal from '@pages/partial/DeleteConfirmationModal';
import { ModuleSlug } from '@utils/Helper';
import { useHierarchyData } from '@components/filters/useHierarchyData';
import { Spinner, Modal } from 'react-bootstrap';
import Select, { SingleValue, StylesConfig } from 'react-select';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Button, 
  Form, 
  Table, 
  Badge, 
  Dropdown,
  Nav,
  InputGroup,
  Offcanvas,
  ProgressBar
} from 'react-bootstrap';
import { 
  FolderOpen,
  Folder,
  Plus, 
  ChevronDown, 
  Search, 
  X,
  MoreVertical,
  Calendar,
  AlertCircle,
  CalendarDays,
  Users,
  Grid3x3,
  Bell,
  ChevronUp,
  Settings,
  Palette,
  Smartphone,
  Megaphone,
  Monitor,
  Headphones,
  Rocket,
  MessageCircle,
  Clock,
  CheckCircle2,
  UserPlus,
  Edit3,
  Trash2,
  Link,
  ExternalLink,
  Archive
} from 'lucide-react';
// API Response Types
interface ApiProject {
  id: number;
  name: string;
  description?: string;
  color: string;
  status: string;
  owner_extension_number?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  created_at: string;
  updated_at: string;
  tasks?: Array<any>;
  members?: Array<{ 
    id?: number;
    extension_number: string; 
    role: string;
    user?: any; // If members.user relation is loaded
  }>;
  labels?: Array<any>;
  statuses?: Array<any>;
}

interface Project {
  id: string;
  name: string;
  icon: React.ElementType;
  iconColor: string;
  members: Array<{ name: string; initials: string; color: string }>;
  open: number;
  overdue: number;
  lastUpdate: string;
  status: 'Active' | 'Completed' | 'Archived';
  owner: string;
  team: string;
  apiData?: ApiProject; // Store original API data
}

type SelectOption = { value: string; label: string };
type AppliedProjectFilters = {
  search: string;
  status: string; // status key: active|completed|archived|all
  owner: string; // extension number or "All Owners"
  team: string; // extension number or "All Teams"
};

const WorkPlannerProjects = () => {
    const router = useRouter();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Fetch extensions for getting user names
    const { hierarchyDataExtensions, loading: hierarchyLoading } = useHierarchyData(ModuleSlug.WORK_PLANNER);
    const [showProjectModal, setShowProjectModal] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [projectFormData, setProjectFormData] = useState({
      name: '',
      description: '',
      color: '#3b82f6'
    });
    const [stats, setStats] = useState({
      activeProjects: 0,
      totalProjects: 0,
      tasksDueThisWeek: 0,
      overdueAcrossProjects: 0
    });
    const [pagination, setPagination] = useState<{
      page: number;
      limit: number;
      total: number;
      last_page: number;
      from: number;
      to: number;
    }>({
      page: 1,
      limit: 15,
      total: 0,
      last_page: 1,
      from: 0,
      to: 0
    });
    
    // Fetch projects on mount and when pagination changes
    useEffect(() => {
      if (!hierarchyLoading) {
        fetchProjects({ search: searchTerm, status: filterStatus, owner: filterOwner });
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pagination.page, pagination.limit, hierarchyLoading]);
    
    const fetchProjects = async (filters?: Partial<AppliedProjectFilters>) => {
      try {
        setLoading(true);
        const statusParam = filters?.status && filters.status !== 'all' ? filters.status : undefined;
        const ownerParam = filters?.owner && filters.owner !== 'All Owners' ? [filters.owner] : undefined;
        const response = await listProjects({
          page: pagination.page,
          limit: pagination.limit,
          search: filters?.search || '',
          status: statusParam,
          user_extensions: ownerParam
        });
        
        // Response structure: { success, message, data: [...], pagination, summary }
        if (response && response.success === true && response.data && Array.isArray(response.data)) {
          const projectsData = response.data.map((apiProject: ApiProject) => mapApiProjectToProject(apiProject));
          setProjects(projectsData);

          // Update pagination from response
          if (response.pagination) {
            setPagination(prev => ({
              page: response.pagination.page || 1,
              limit: response.pagination.limit || 15,
              total: response.pagination.total || 0,
              last_page: response.pagination.last_page || 1,
              from: response.pagination.from || 0,
              to: response.pagination.to || 0
            }));
          }
          
          // Update stats from response
          if (response.summary) {
            setStats({
              activeProjects: response.summary.active || 0,
              totalProjects: response.summary.total || 0,
              tasksDueThisWeek: response.summary.task_due_this_week || 0,
              overdueAcrossProjects: response.summary.overdue_tasks || 0
            });
          }
        } else if (response && response.success === false) {
          // Error already shown by validateResponse
          setProjects([]);
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };
    
    // Map API project to component Project interface
    const mapApiProjectToProject = (apiProject: ApiProject): Project => {
      // Calculate open and overdue tasks
      const tasks = apiProject.tasks || [];
      const openTasks = tasks.filter((t: any) => !t.is_completed).length;
      const overdueTasks = tasks.filter((t: any) => {
        if (!t.due_date) return false;
        const dueDate = new Date(t.due_date);
        return !t.is_completed && dueDate < new Date();
      }).length;
      
      // Map members
      const members = (apiProject.members || []).map((member, idx) => {
        const colors = ['#667eea', '#f56565', '#48bb78', '#ed64a6', '#4299e1', '#9f7aea', '#fc8181'];
        const initials = member.extension_number.substring(0, 2).toUpperCase();
        return {
          name: member.extension_number,
          initials,
          color: colors[idx % colors.length]
        };
      });
      
      // Format last update
      const lastUpdate = apiProject.updated_at 
        ? new Date(apiProject.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : 'N/A';
      
      // Default icon based on project name
      type IconComponent = typeof Folder;
      const iconMap: Record<string, IconComponent> = {
        'website': Palette,
        'mobile': Smartphone,
        'marketing': Megaphone,
        'it': Monitor,
        'client': Users,
        'support': Headphones,
        'product': Rocket,
        'crm': Settings
      };
      
      const projectNameLower = apiProject.name.toLowerCase();
      let Icon: IconComponent = Folder;
      for (const key in iconMap) {
        if (projectNameLower.includes(key)) {
          Icon = iconMap[key];
          break;
        }
      }
      
      return {
        id: apiProject.id.toString(),
        name: apiProject.name,
        icon: Icon,
        iconColor: apiProject.color || '#3b82f6',
        members,
        open: openTasks,
        overdue: overdueTasks,
        lastUpdate,
        status: apiProject.status === 'active' ? 'Active' : apiProject.status === 'completed' ? 'Completed' : 'Archived',
        owner: members[0]?.name || 'N/A',
        team: 'Team', // You may want to add team to API response
        apiData: apiProject
      };
    };
    
    const handleCreateProject = () => {
      setEditingProject(null);
      setProjectFormData({
        name: '',
        description: '',
        color: '#3b82f6'
      });
      setShowProjectModal(true);
    };
    
    const handleEditProject = (project: Project) => {
      setEditingProject(project);
      setProjectFormData({
        name: project.name,
        description: project.apiData?.description || '',
        color: project.iconColor
      });
      setShowProjectModal(true);
    };
    
    const handleDeleteProject = (project: Project) => {
      setProjectToDelete(project);
      setShowDeleteModal(true);
    };
    
    const confirmDelete = async () => {
      if (!projectToDelete) return;
      
      try {
        setDeleting(true);
        const result = await deleteProject(projectToDelete.id);
        if (result) {
          await fetchProjects(appliedFilters);
          setShowDeleteModal(false);
          setProjectToDelete(null);
        }
      } catch (error) {
        console.error('Error deleting project:', error);
      } finally {
        setDeleting(false);
      }
    };
    
    const handleSubmitProject = async (e: React.FormEvent) => {
      e.preventDefault();
      
      try {
        setSubmitting(true);
        const projectData = {
          name: projectFormData.name,
          description: projectFormData.description,
          color: projectFormData.color
        };
        
        let result;
        if (editingProject) {
          result = await updateProject(editingProject.id, projectData);
        } else {
          result = await createProject(projectData);
        }
        
        if (result) {
          await fetchProjects(appliedFilters);
          setShowProjectModal(false);
          setEditingProject(null);
          setProjectFormData({
            name: '',
            description: '',
            color: '#3b82f6'
          });
        }
      } catch (error) {
        console.error('Error saving project:', error);
      } finally {
        setSubmitting(false);
      }
    };
    
    const [activeTab, setActiveTab] = useState('All Tasks');
      const [searchTerm, setSearchTerm] = useState('');
      const [filterStatus, setFilterStatus] = useState<'active' | 'completed' | 'archived' | 'all'>('active');
      const [filterOwner, setFilterOwner] = useState('All Owners');
      const [filterTeam, setFilterTeam] = useState('All Teams');
      const [appliedFilters, setAppliedFilters] = useState<AppliedProjectFilters>({
        search: '',
        status: 'active',
        owner: 'All Owners',
        team: 'All Teams'
      });
    const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set());
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [selectedProjectDetails, setSelectedProjectDetails] = useState<ApiProject | null>(null);
    const [loadingProjectDetails, setLoadingProjectDetails] = useState(false);
    const [projectActivities, setProjectActivities] = useState<any[]>([]);
    const [loadingActivities, setLoadingActivities] = useState(false);
    const [overdueTasks, setOverdueTasks] = useState<any[]>([]);
    const [loadingOverdueTasks, setLoadingOverdueTasks] = useState(false);
    const [showProjectDetail, setShowProjectDetail] = useState(false);
    const [detailTab, setDetailTab] = useState('Activity');
    
    const handleProjectClick = async (project: Project) => {
      setSelectedProject(project);
      setShowProjectDetail(true);
      setLoadingProjectDetails(true);
      setLoadingOverdueTasks(true);
      
      try {
        // Fetch full project details with all relations
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
          getRecentActivity(Number(project.id)),
          getOverdueTasks(Number(project.id))
        ]);
        
        if (projectDetails) {
          setSelectedProjectDetails(projectDetails);
        } else {
          // Fallback to basic project data if API fails
          setSelectedProjectDetails(project.apiData || null);
        }
        
        if (activities && Array.isArray(activities)) {
          setProjectActivities(activities);
        } else {
          setProjectActivities([]);
        }
        
        if (overdue && Array.isArray(overdue)) {
          setOverdueTasks(overdue);
        } else {
          setOverdueTasks([]);
        }
      } catch (error) {
        console.error('Error fetching project details:', error);
        // Fallback to basic project data
        setSelectedProjectDetails(project.apiData || null);
        setProjectActivities([]);
        setOverdueTasks([]);
      } finally {
        setLoadingProjectDetails(false);
        setLoadingActivities(false);
        setLoadingOverdueTasks(false);
      }
    };
    
    // Helper function to format time ago
    const formatTimeAgo = (dateString: string) => {
      const date = new Date(dateString);
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
      
      if (diffInSeconds < 60) return 'just now';
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
      if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
      
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };
    
    // Helper function to format full date and time
    const formatDateTime = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    };
    
    // Helper function to get user name from extension number
    const getUserNameFromExtension = (extensionNumber: string): string => {
      if (!extensionNumber || !hierarchyDataExtensions || hierarchyDataExtensions.length === 0) {
        return extensionNumber || 'Unknown';
      }
      
      const extension = (hierarchyDataExtensions as any[]).find((ext: any) => 
        ext.extension_number === extensionNumber || 
        ext.id === extensionNumber ||
        String(ext.id) === String(extensionNumber)
      );
      
      return extension?.user?.name || extension?.name || extensionNumber || 'Unknown';
    };
    
    // Helper function to get initials from extension number or name
    const getInitials = (extensionNumber: string) => {
      if (!extensionNumber || extensionNumber === 'system') return 'SY';
      const userName = getUserNameFromExtension(extensionNumber);
      if (userName !== extensionNumber && userName !== 'Unknown') {
        return userName.split(' ').map((n: string) => n[0]).join('').substring(0, 1).toUpperCase();
      }
      return extensionNumber.substring(0, 2).toUpperCase();
    };
    
    // Helper function to get color for avatar
    const getAvatarColor = (extensionNumber: string, index: number) => {
      const colors = ['#667eea', '#f56565', '#48bb78', '#ed64a6', '#4299e1', '#9f7aea', '#fc8181', '#f59e0b'];
      if (extensionNumber === 'system') return '#6b7280';
      return colors[index % colors.length];
    };
    
    // Helper function to get status color based on action
    const getActionColor = (action: string) => {
      switch (action) {
        case 'status_changed':
          return '#3b82f6';
        case 'updated':
          return '#f59e0b';
        case 'created':
          return '#10b981';
        case 'completed':
          return '#10b981';
        case 'deleted':
          return '#ef4444';
        default:
          return '#6b7280';
      }
    };
    
      const handleSelectProject = (projectId: string) => {
        const newSelected = new Set(selectedProjects);
        if (newSelected.has(projectId)) {
          newSelected.delete(projectId);
        } else {
          newSelected.add(projectId);
        }
        setSelectedProjects(newSelected);
      };
    
      const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
          setSelectedProjects(new Set(filteredProjects.map(p => p.id)));
        } else {
          setSelectedProjects(new Set());
        }
      };
    
      const clearFilters = () => {
        setSearchTerm('');
        setFilterStatus('active');
        setFilterOwner('All Owners');
        setFilterTeam('All Teams');
        const cleared: AppliedProjectFilters = { search: '', status: 'active', owner: 'All Owners', team: 'All Teams' };
        setAppliedFilters(cleared);
        fetchProjects(cleared);
      };

      const handleApplyFilters = () => {
        setPagination(prev => ({ ...prev, page: 1 }));
        const next: AppliedProjectFilters = {
          search: searchTerm,
          status: filterStatus,
          owner: filterOwner,
          team: filterTeam
        };
        setAppliedFilters(next);
        fetchProjects(next);
      };
    
      // Current user (from header avatar)
      const currentUser = 'John D.';
    
      // Get projects based on active tab
      const getTabFilteredProjects = () => {
        let tabProjects = [...projects];
        
        if (activeTab === 'My Work') {
          // Show only projects where current user is owner or a team member
          tabProjects = tabProjects.filter(project => 
            project.owner === currentUser || 
            project.members.some(member => member.name === currentUser)
          );
        } else if (activeTab === 'Activity') {
          // Sort by last update date (most recent first)
          tabProjects = tabProjects.sort((a, b) => {
            const dateA = new Date(a.lastUpdate);
            const dateB = new Date(b.lastUpdate);
            return dateB.getTime() - dateA.getTime();
          });
        }
        // 'All Tasks' shows all projects (no additional filtering)
        
        return tabProjects;
      };
    
      const filteredProjects = getTabFilteredProjects().filter(project => {
        const matchesSearch =
          project.name.toLowerCase().includes(appliedFilters.search.toLowerCase()) ||
          project.id.toLowerCase().includes(appliedFilters.search.toLowerCase());
        const projectStatusKey = String(project.apiData?.status || project.status || '').toLowerCase();
        const matchesStatus = appliedFilters.status === 'all' || projectStatusKey === appliedFilters.status;
        const projectOwnerExt = project.apiData?.owner_extension_number || project.owner;
        const matchesOwner = appliedFilters.owner === 'All Owners' || String(projectOwnerExt || '') === String(appliedFilters.owner);

        const projectMembers = (project.apiData?.members || project.members || []) as any[];
        const matchesTeam =
          appliedFilters.team === 'All Teams' ||
          projectMembers.some((m: any) => String(m?.extension_number || m?.name || '') === String(appliedFilters.team));
        
        return matchesSearch && matchesStatus && matchesOwner && matchesTeam;
      });

      const userOptions = (() => {
        const list = (hierarchyDataExtensions as any[]) || [];
        const seen = new Set<string>();
        return list
          .map((ext: any) => {
            const value = String(ext?.extension_number || ext?.id || '').trim();
            const label = String(ext?.user?.name || ext?.name || value).trim();
            return { value, label };
          })
          .filter(o => o.value)
          .filter(o => {
            if (seen.has(o.value)) return false;
            seen.add(o.value);
            return true;
          })
          .sort((a, b) => a.label.localeCompare(b.label));
      })();

      const ownerSelectOptions: SelectOption[] = [{ value: 'All Owners', label: 'All Owners' }, ...userOptions];
      const teamSelectOptions: SelectOption[] = [{ value: 'All Teams', label: 'All Teams' }, ...userOptions];

      const selectStyles: StylesConfig<SelectOption, false> = {
        control: (base, state) => ({
          ...base,
          width: '100%',
          minHeight: '44px',
          border: '1px solid #E5E9F2',
          borderRadius: '6px',
          boxShadow: 'none',
          backgroundColor: 'white',
          cursor: 'pointer',
          ':hover': {
            borderColor: '#E5E9F2',
          },
        }),
        valueContainer: (base) => ({
          ...base,
          padding: '0 10px',
        }),
        input: (base) => ({
          ...base,
          margin: 0,
          padding: 0,
        }),
        placeholder: (base) => ({
          ...base,
          color: '#6B7280',
          fontSize: '0.9rem',
        }),
        singleValue: (base) => ({
          ...base,
          color: '#1F2937',
          fontSize: '0.9rem',
        }),
        indicatorSeparator: () => ({ display: 'none' }),
        dropdownIndicator: (base) => ({ ...base, padding: '0 8px' }),
        menu: (base) => ({
          ...base,
          zIndex: 20,
        }),
      };
      const statuses: Array<{ value: 'active' | 'completed' | 'archived' | 'all'; label: string }> = [
        { value: 'all', label: 'All Status' },
        { value: 'active', label: 'Active' },
        { value: 'completed', label: 'Completed' },
        { value: 'archived', label: 'Archived' }
      ];
    
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
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Work Planner Projects" />

      <>
      <style>{`
        
        
        .header-section {
          background-color: white;
          padding: 1.5rem 0;
          margin-bottom: 2rem;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        
        .stat-card {
          border: none;
          border-radius: 12px;
          padding: 1.25rem 1.5rem;
          height: 100%;
          transition: transform 0.2s, box-shadow 0.2s;
          cursor: pointer;
          min-height: 120px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        
        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        
        .stat-card.active-projects {
          background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
        }
        
        .stat-card.total-projects {
          background: linear-gradient(135deg, #dbeafe 0%, #93c5fd 100%);
        }
        
        .stat-card.due-week {
          background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
        }
        
        .stat-card.overdue {
          background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
        }
        
        .stat-icon {
          width: 60px;
          height: 60px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
        }
        
        .stat-icon.active-projects {
          background-color: #0ea5e9;
          color: #ffffff;
        }
        
        .stat-icon.total-projects {
          background-color: #3b82f6;
          color: #ffffff;
        }
        
        .stat-icon.due-week {
          background-color: #3b82f6;
          color: #ffffff;
        }
        
        .stat-icon.overdue {
          background-color: #ef4444;
          color: #ffffff;
        }
        
        .stat-number {
          font-size: 2rem;
          font-weight: 700;
          margin: 0.5rem 0 0.25rem 0;
        }
        
        .stat-label {
          font-size: 0.875rem;
          opacity: 0.8;
          margin: 0;
        }
        
        .tabs-section {
          background-color: white;
          padding: 1rem 1.5rem 0 1.5rem;
          border-radius: 12px 12px 0 0;
          border-bottom: 2px solid #e2e8f0;
        }
        
        .nav-tabs {
          border: none;
        }
        
        .nav-tabs .nav-link {
          color: #64748b;
          border: none;
          border-bottom: 3px solid transparent;
          padding: 0.75rem 1.5rem;
          font-weight: 500;
          background: transparent;
        }
        
        .nav-tabs .nav-link.active {
          color: #3b82f6;
          background: transparent;
          border-bottom: 3px solid #3b82f6;
        }
        
        .table-container {
          background-color: white;
          border-radius: 0 0 12px 12px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          max-height: inherit !important;
        }
        
        .projects-table {
          margin: 0;
        }
        
        .projects-table thead th {
          background-color: #f8fafc;
          border-bottom: 2px solid #e2e8f0;
          color: #475569;
          font-weight: 600;
          font-size: 0.875rem;
          padding: 1rem;
          white-space: nowrap;
          border-top: none;
        }
        
        .projects-table tbody td {
          padding: 1rem;
          vertical-align: middle;
          border-bottom: 1px solid #f1f5f9;
        }
        
        .projects-table tbody tr {
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .projects-table tbody tr:hover {
          background-color: #f8fafc;
        }
        
        .project-name {
          font-weight: 600;
          color: #334155;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        
        .project-icon {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          flex-shrink: 0;
        }
        
        .member-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          color: white;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 600;
          margin-right: -8px;
          border: 2px solid white;
          position: relative;
        }
        
        .member-avatar:first-child {
          margin-left: 0;
        }
        
        .member-count {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background-color: #e2e8f0;
          color: #64748b;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 600;
          margin-right: -8px;
          border: 2px solid white;
        }
        
        .overdue-count {
          color: #ef4444;
          font-weight: 600;
        }
        
        .project-detail-panel {
          width: 500px;
        }
        
        .project-detail-header {
          padding: 1.25rem 1.5rem;
          border-bottom: 2px solid #e2e8f0;
          background-color: #f8fafc;
        }
        
        .project-detail-body {
          padding: 1.5rem;
          background-color: #ffffff;
        }
        
        .detail-section {
          margin-bottom: 1.25rem;
          padding: 1rem;
          background-color: #f8fafc;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }
        
        .detail-label {
          font-size: 0.75rem;
          color: #64748b;
          margin-bottom: 0.625rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .detail-tabs {
          border-bottom: 2px solid #e2e8f0;
          margin: 1.5rem -1.5rem 1.5rem -1.5rem;
          padding: 0 1.5rem;
        }
        
        .detail-tabs .nav-link {
          color: #64748b;
          border: none;
          border-bottom: 2px solid transparent;
          padding: 0.75rem 1rem;
          font-weight: 500;
          font-size: 0.875rem;
          background: transparent;
          margin-bottom: -2px;
        }
        
        .detail-tabs .nav-link.active {
          color: #3b82f6;
          background: transparent;
          border-bottom: 2px solid #3b82f6;
        }
        
        @media (max-width: 768px) {
          .project-detail-panel {
            width: 100%;
          }
          .stat-card {
            margin-bottom: 1rem;
          }
          
          .table-responsive {
            font-size: 0.875rem;
          }
        }

        .table-responsive .table th:last-child, .table-responsive .table td:last-child {
          min-width: initial !important;
        }
        .table-responsive .table th:first-child, .table-responsive .table td:first-child {
          min-width: initial !important;
          max-width: initial !important;
        }
      `}</style>

      

      <div className="project-dashboard">
        <div className="header-section">
          <Container fluid>
            <Row className="align-items-center mb-4">
              <Col>
                <div className="d-flex align-items-center">
                  <Folder size={32} className="text-primary me-2" />
                  <h2 className="mb-0 fw-bold">Projects</h2>
                </div>
              </Col>
              <Col xs="auto">
                <Button 
                  variant="primary" 
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  onClick={handleCreateProject}
                >
                  <Plus size={18} />
                  <span>Create Project</span>
                </Button>
              </Col>
            </Row>

            <Row className="g-3">
              <Col xs={12} sm={6} lg={3}>
                <Card className="stat-card active-projects">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <p className="stat-number">{stats.activeProjects}</p>
                      <p className="stat-label">Active Projects</p>
                    </div>
                    <div className="stat-icon active-projects">
                      <FolderOpen />
                    </div>
                  </div>
                </Card>
              </Col>
              <Col xs={12} sm={6} lg={3}>
                <Card className="stat-card total-projects">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <p className="stat-number">{stats.totalProjects}</p>
                      <p className="stat-label">Total Projects</p>
                    </div>
                    <div className="stat-icon total-projects">
                      <Folder />
                    </div>
                  </div>
                </Card>
              </Col>
              <Col xs={12} sm={6} lg={3}>
                <Card className="stat-card due-week">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <p className="stat-number">{stats.tasksDueThisWeek}</p>
                      <p className="stat-label">Tasks Due This Week</p>
                    </div>
                    <div className="stat-icon due-week">
                      <CalendarDays />
                    </div>
                  </div>
                </Card>
              </Col>
              <Col xs={12} sm={6} lg={3}>
                <Card className="stat-card overdue">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <p className="stat-number">{stats.overdueAcrossProjects}</p>
                      <p className="stat-label">Overdue Across Projects</p>
                    </div>
                    <div className="stat-icon overdue">
                      <AlertCircle />
                    </div>
                  </div>
                </Card>
              </Col>
            </Row>
          </Container>
        </div>

        <Container fluid>
          <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '12px',
            marginBottom: '1.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '1rem'
            }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Search size={16} color="#6B7280" style={{ position: 'absolute', left: '0.75rem', pointerEvents: 'none' }} />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
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

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #E5E9F2',
                  borderRadius: '6px',
                  fontSize: '0.9rem',
                  outline: 'none',
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                  backgroundColor: 'white'
                }}
              >
                {statuses.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>

              <Select<SelectOption, false>
                options={ownerSelectOptions}
                value={ownerSelectOptions.find(o => o.value === filterOwner) || ownerSelectOptions[0]}
                onChange={(opt: SingleValue<SelectOption>) => setFilterOwner(opt?.value || 'All Owners')}
                styles={selectStyles}
                isSearchable
                placeholder="Owner / PM"
              />

              {/* <Select<SelectOption, false>
                options={teamSelectOptions}
                value={teamSelectOptions.find(o => o.value === filterTeam) || teamSelectOptions[0]}
                onChange={(opt: SingleValue<SelectOption>) => setFilterTeam(opt?.value || 'All Teams')}
                styles={selectStyles}
                isSearchable
                placeholder="Team"
              /> */}

              <button
                onClick={handleApplyFilters}
                style={{
                  padding: '0.625rem 1.25rem',
                  backgroundColor: '#4680FF',
                  color: 'white',
                  border: '1px solid #4680FF',
                  borderRadius: '6px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  fontSize: '0.9rem'
                }}
              >
                Filters
              </button>

              <button
                onClick={clearFilters}
                style={{
                  padding: '0.625rem 1.25rem',
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
                  fontFamily: 'inherit'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
              >
                Clear Filters
                <X size={16} />
              </button>
            </div>
          </div>

          {/* <div className="tabs-section">
            <Nav variant="tabs">
              <Nav.Item>
                <Nav.Link 
                  active={activeTab === 'All Tasks'}
                  onClick={() => setActiveTab('All Tasks')}
                >
                  All Tasks ({projects.length})
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link 
                  active={activeTab === 'My Work'}
                  onClick={() => setActiveTab('My Work')}
                >
                  My Work ({getTabFilteredProjects().filter(p => p.owner === currentUser || p.members.some(m => m.name === currentUser)).length})
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link 
                  active={activeTab === 'Activity'}
                  onClick={() => setActiveTab('Activity')}
                >
                  Activity
                </Nav.Link>
              </Nav.Item>
            </Nav>
          </div> */}

          <div className="table-container">
            <div className="table-responsive">
              {loading ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                  <Spinner animation="border" role="status" className="me-2">
                    <span className="visually-hidden">Loading...</span>
                  </Spinner>
                  <p style={{ marginTop: '1rem' }}>Loading projects...</p>
                </div>
              ) : filteredProjects.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                  <FolderOpen size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                  <p style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                    {activeTab === 'My Work' ? 'No projects assigned to you' : 'No projects found'}
                  </p>
                  <p style={{ fontSize: '0.875rem', marginBottom: 0 }}>
                    {activeTab === 'My Work' 
                      ? 'You are not currently assigned to any projects matching the filters.'
                      : 'Try adjusting your filters or search criteria.'}
                  </p>
                </div>
              ) : (
              <Table className="projects-table" hover>
                <thead>
                  <tr>
                    <th style={{ width: '50px' }}>
                      <Form.Check 
                        type="checkbox"
                        onChange={handleSelectAll}
                        checked={selectedProjects.size === filteredProjects.length && filteredProjects.length > 0}
                      />
                    </th>
                    <th>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        Project Name
                        <ChevronUp size={14} />
                      </div>
                    </th>
                    <th>Members</th>
                    <th>Open</th>
                    <th>Overdue</th>
                    <th>Last Update</th>
                    <th style={{ width: '100px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProjects.map(project => (
                    <tr
                      key={project.id}
                      onClick={() => handleProjectClick(project)}
                    >
                      <td onClick={(e) => e.stopPropagation()}>
                        <Form.Check 
                          type="checkbox"
                          checked={selectedProjects.has(project.id)}
                          onChange={() => handleSelectProject(project.id)}
                        />
                      </td>
                      <td>
                        <div className="project-name">
                          <div className="project-icon" style={{ backgroundColor: project.iconColor + '20' }}>
                            <project.icon size={20} style={{ color: project.iconColor }} />
                          </div>
                          <span>{project.name}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <div className="member-avatar bg-primary">
                                {project?.members?.length || 0}
                          </div>
                          </div>
                      </td>
                      <td>{project.open}</td>
                      <td>
                        <span className={project.overdue > 0 ? 'overdue-count' : ''}>
                          {project.overdue}
                        </span>
                      </td>
                      <td>{project.lastUpdate}</td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <Button 
                            variant="primary" 
                            size="sm"
                            style={{ fontSize: '0.8125rem', padding: '0.375rem 0.75rem' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleProjectClick(project);
                            }}
                          >
                            Open
                          </Button>
                          <Dropdown>
                            <Dropdown.Toggle
                              as="button"
                              bsPrefix="custom-dropdown-toggle"
                              className="p-0 border-0 bg-transparent"
                              style={{ color: '#718096', cursor: 'pointer' }}
                            >
                              <MoreVertical size={16} />
                            </Dropdown.Toggle>

                            <Dropdown.Menu align="end" style={{ fontSize: '0.875rem' }}>
                              <Dropdown.Item 
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditProject(project);
                                }}
                              >
                                <Settings size={14} />
                                <span>Edit Project</span>
                              </Dropdown.Item>
                              {/* <Dropdown.Item style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Users size={14} />
                                <span>Manage Team</span>
                              </Dropdown.Item> */}
                              <Dropdown.Divider />
                              <Dropdown.Item 
                                className="text-danger" 
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteProject(project);
                                }}
                              >
                                <Trash2 size={14} />
                                <span>Delete Project</span>
                              </Dropdown.Item>
                            </Dropdown.Menu>
                          </Dropdown>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              )}
              
              {/* Pagination Controls */}
              {!loading && pagination.last_page > 1 && filteredProjects.length > 0 && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '20px',
                  paddingTop: '16px',
                  paddingBottom: '16px',
                  paddingLeft: '16px',
                  paddingRight: '16px',
                  borderTop: '1px solid #e8eef5'
                }}>
                  <div style={{ fontSize: '13px', color: '#718096' }}>
                    Showing {pagination.from || 0} to {pagination.to || 0} of {pagination.total || 0} projects
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                      onClick={() => {
                        if (pagination.page > 1 && !loading) {
                          setPagination(prev => ({ ...prev, page: prev.page - 1 }));
                        }
                      }}
                      disabled={pagination.page === 1 || loading}
                      style={{
                        padding: '6px 12px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        backgroundColor: (pagination.page === 1 || loading) ? '#f8fafc' : 'white',
                        color: (pagination.page === 1 || loading) ? '#cbd5e0' : '#4a5568',
                        cursor: (pagination.page === 1 || loading) ? 'not-allowed' : 'pointer',
                        fontSize: '13px',
                        fontWeight: '500',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        if (pagination.page > 1 && !loading) {
                          e.currentTarget.style.backgroundColor = '#f8fafc';
                          e.currentTarget.style.borderColor = '#cbd5e0';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (pagination.page > 1 && !loading) {
                          e.currentTarget.style.backgroundColor = 'white';
                          e.currentTarget.style.borderColor = '#e2e8f0';
                        }
                      }}
                    >
                      Previous
                    </button>
                    
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {Array.from({ length: Math.min(5, pagination.last_page) }, (_, i) => {
                        let pageNum;
                        if (pagination.last_page <= 5) {
                          pageNum = i + 1;
                        } else if (pagination.page <= 3) {
                          pageNum = i + 1;
                        } else if (pagination.page >= pagination.last_page - 2) {
                          pageNum = pagination.last_page - 4 + i;
                        } else {
                          pageNum = pagination.page - 2 + i;
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => {
                              if (!loading && pagination.page !== pageNum) {
                                setPagination(prev => ({ ...prev, page: pageNum }));
                              }
                            }}
                            disabled={loading}
                            style={{
                              minWidth: '32px',
                              height: '32px',
                              padding: '0 8px',
                              border: '1px solid #e2e8f0',
                              borderRadius: '6px',
                              backgroundColor: pagination.page === pageNum ? '#5b8fd8' : (loading ? '#f8fafc' : 'white'),
                              color: pagination.page === pageNum ? 'white' : (loading ? '#cbd5e0' : '#4a5568'),
                              cursor: loading ? 'not-allowed' : 'pointer',
                              fontSize: '13px',
                              fontWeight: pagination.page === pageNum ? '600' : '500',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              if (pagination.page !== pageNum && !loading) {
                                e.currentTarget.style.backgroundColor = '#f8fafc';
                                e.currentTarget.style.borderColor = '#cbd5e0';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (pagination.page !== pageNum && !loading) {
                                e.currentTarget.style.backgroundColor = 'white';
                                e.currentTarget.style.borderColor = '#e2e8f0';
                              }
                            }}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    
                    <button
                      onClick={() => {
                        if (pagination.page < pagination.last_page && !loading) {
                          setPagination(prev => ({ ...prev, page: prev.page + 1 }));
                        }
                      }}
                      disabled={pagination.page >= pagination.last_page || loading}
                      style={{
                        padding: '6px 12px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        backgroundColor: (pagination.page >= pagination.last_page || loading) ? '#f8fafc' : 'white',
                        color: (pagination.page >= pagination.last_page || loading) ? '#cbd5e0' : '#4a5568',
                        cursor: (pagination.page >= pagination.last_page || loading) ? 'not-allowed' : 'pointer',
                        fontSize: '13px',
                        fontWeight: '500',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        if (pagination.page < pagination.last_page && !loading) {
                          e.currentTarget.style.backgroundColor = '#f8fafc';
                          e.currentTarget.style.borderColor = '#cbd5e0';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (pagination.page < pagination.last_page && !loading) {
                          e.currentTarget.style.backgroundColor = 'white';
                          e.currentTarget.style.borderColor = '#e2e8f0';
                        }
                      }}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Container>
      </div>

      {/* Project Detail Sidebar */}
      <Offcanvas 
        show={showProjectDetail} 
        onHide={() => setShowProjectDetail(false)} 
        placement="end"
        className="project-detail-panel"
      >
        <Offcanvas.Header className="project-detail-header" style={{ position: 'relative' }}>
          <Offcanvas.Title>
            <div className="d-flex align-items-center gap-3">
              {selectedProject && (
                <>
                  <div className="project-icon" style={{ backgroundColor: selectedProject.iconColor + '20' }}>
                    <selectedProject.icon size={24} style={{ color: selectedProject.iconColor }} />
                  </div>
                  <div>
                    <div className="fw-bold" style={{ fontSize: '1.125rem', marginBottom: '0.25rem' }}>{selectedProject.name}</div>
                    <Badge 
                      bg={selectedProject.status === 'Active' ? 'success' : selectedProject.status === 'Archived' ? 'warning' : 'secondary'}
                      style={{ fontSize: '0.7rem', fontWeight: '600', letterSpacing: '0.5px' }}
                    >
                      {selectedProject.status.toUpperCase()}
                    </Badge>
                  </div>
                </>
              )}
            </div>
          </Offcanvas.Title>
          <div className="d-flex align-items-center gap-2" style={{ position: 'absolute', right: '3rem', top: '50%', transform: 'translateY(-50%)' }}>
            {selectedProject && (
              <Button
                variant="link"
                className="p-0"
                onClick={(e) => {
                  e.preventDefault();
                  window.open(`/work-planner/projects/${selectedProject.id}`, '_blank');
                }}
                style={{ 
                  color: '#6b7280',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  borderRadius: '4px'
                }}
                title="Open in new tab"
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                  e.currentTarget.style.color = '#3b82f6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#6b7280';
                }}
              >
                <ExternalLink size={18} />
              </Button>
            )}
            <Button
              variant="link"
              className="p-0"
              onClick={() => setShowProjectDetail(false)}
              style={{ 
                color: '#6b7280',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                borderRadius: '4px'
              }}
              title="Close"
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
                e.currentTarget.style.color = '#ef4444';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#6b7280';
              }}
            >
              <X size={18} />
            </Button>
          </div>
        </Offcanvas.Header>
        <Offcanvas.Body className="project-detail-body">
          {loadingProjectDetails ? (
            <div className="text-center py-5">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading project details...</span>
              </Spinner>
              <p className="mt-3 text-muted">Loading project details...</p>
            </div>
          ) : selectedProject && (
            <>
              {/* Project Stats */}
              <Row className="g-2 mb-3">
                <Col xs={6}>
                  <div className="detail-section">
                    <div className="detail-label">Open Tasks</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#3b82f6' }}>
                      {selectedProject.open}
                    </div>
                  </div>
                </Col>
                <Col xs={6}>
                  <div className="detail-section">
                    <div className="detail-label">Overdue Tasks</div>
                    {loadingOverdueTasks ? (
                      <Spinner animation="border" size="sm" />
                    ) : (
                      <div style={{ fontSize: '1.75rem', fontWeight: '700', color: (overdueTasks.length > 0) ? '#ef4444' : '#10b981' }}>
                        {overdueTasks.length}
                      </div>
                    )}
                  </div>
                </Col>
              </Row>

              {/* Project Progress */}
              <div className="detail-section">
                <div className="detail-label">Project Progress</div>
                <ProgressBar 
                  now={Math.round((1 - selectedProject.open / (selectedProject.open + 50)) * 100)} 
                  style={{ height: '10px', marginBottom: '0.5rem' }}
                  variant="primary"
                />
                <div style={{ fontSize: '0.875rem', color: '#64748b', textAlign: 'right' }}>
                  {Math.round((1 - selectedProject.open / (selectedProject.open + 50)) * 100)}% Complete
                </div>
              </div>

              {/* Owner/PM and Team in one row */}
              <Row className="g-2 mb-3">
                <Col xs={6}>
                  <div className="detail-section">
                    <div className="detail-label">Owner / PM</div>
                    <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#334155', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {selectedProjectDetails?.owner_extension_number ? (
                        <>
                          <div
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%',
                              backgroundColor: '#667eea',
                              color: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.7rem',
                              fontWeight: '600'
                            }}
                          >
                            {getInitials(selectedProjectDetails.owner_extension_number)}
                          </div>
                          <span>{getUserNameFromExtension(selectedProjectDetails.owner_extension_number)}</span>
                        </>
                      ) : (
                        <>
                          <div
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%',
                              backgroundColor: '#667eea',
                              color: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.7rem',
                              fontWeight: '600'
                            }}
                          >
                            {selectedProject.apiData?.owner_extension_number 
                              ? getInitials(selectedProject.apiData.owner_extension_number)
                              : selectedProject.owner.split(' ').map(n => n[0]).join('')}
                          </div>
                          <span>
                            {selectedProject.apiData?.owner_extension_number 
                              ? getUserNameFromExtension(selectedProject.apiData.owner_extension_number)
                              : selectedProject.owner}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </Col>
                <Col xs={6}>
                  <div className="detail-section">
                    <div className="detail-label">Status</div>
                    <Badge 
                      bg={selectedProjectDetails?.status === 'active' ? 'success' : selectedProjectDetails?.status === 'completed' ? 'secondary' : selectedProjectDetails?.status === 'archived' ? 'warning' : 'info'}
                      style={{ 
                        fontSize: '0.75rem', 
                        fontWeight: '600',
                        padding: '0.5rem 0.75rem',
                        display: 'inline-block'
                      }}
                    >
                      {(selectedProjectDetails?.status || selectedProject.status).toUpperCase()}
                    </Badge>
                  </div>
                </Col>
              </Row>

              {/* Team Members */}
              <div className="detail-section">
                <div className="detail-label">Team Members ({selectedProjectDetails?.members?.length || selectedProject.members.length})</div>
                <div className="d-flex flex-wrap gap-2">
                  {(selectedProjectDetails?.members || selectedProject.members).map((member: any, idx: number) => {
                    const memberData = selectedProjectDetails?.members?.[idx] || member;
                    const extensionNumber = memberData.extension_number || memberData.name || '';
                    const initials = extensionNumber.substring(0, 2).toUpperCase();
                    const colors = ['#667eea', '#f56565', '#48bb78', '#ed64a6', '#4299e1', '#9f7aea', '#fc8181'];
                    const color = memberData.color || colors[idx % colors.length];
                    
                    return (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        backgroundColor: 'white',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        flex: '1 1 calc(50% - 0.25rem)',
                        minWidth: '120px'
                      }}
                    >
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          backgroundColor: color,
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.7rem',
                          fontWeight: '600',
                          flexShrink: 0
                        }}
                      >
                        {getInitials(extensionNumber)}
                      </div>
                      <span style={{ fontSize: '0.8125rem', fontWeight: '500', color: '#334155', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {memberData.user?.name || getUserNameFromExtension(extensionNumber)} {memberData.role ? `(${memberData.role})` : ''}
                      </span>
                    </div>
                    );
                  })}
                </div>
              </div>

              {/* Last Update */}
              <div className="detail-section">
                <div className="detail-label">Last Updated</div>
                <div className="d-flex align-items-center" style={{ fontSize: '0.9rem', fontWeight: '500' }}>
                  <Calendar size={16} className="me-2 text-muted" />
                  <span>
                    {selectedProjectDetails?.updated_at 
                      ? new Date(selectedProjectDetails.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : selectedProject.lastUpdate}
                  </span>
                </div>
              </div>
              
              {/* Description */}
              {selectedProjectDetails?.description && (
                <div className="detail-section">
                  <div className="detail-label">Description</div>
                  <div style={{ fontSize: '0.875rem', color: '#475569' }}>
                    {selectedProjectDetails.description}
                  </div>
                </div>
              )}

              {/* Tabs for Activity/Comments/History */}
              <Nav variant="tabs" className="detail-tabs" activeKey={detailTab} onSelect={(k) => k && setDetailTab(k)}>
                <Nav.Item>
                  <Nav.Link eventKey="Activity">
                    Activity
                  </Nav.Link>
                </Nav.Item>
                
                <Nav.Item>
                  <Nav.Link eventKey="History">
                    History
                  </Nav.Link>
                </Nav.Item>
              </Nav>

              {/* Tab Content */}
              <div style={{ marginTop: '1.5rem' }}>
                {/* Activity Tab */}
                {detailTab === 'Activity' && (
                  <div>
                    <div className="detail-label" style={{ marginBottom: '1rem' }}>Recent Activity</div>
                    {loadingActivities ? (
                      <div className="text-center py-3">
                        <Spinner animation="border" size="sm" />
                      </div>
                    ) : projectActivities.length === 0 ? (
                      <div className="text-center py-3 text-muted" style={{ fontSize: '0.875rem' }}>
                        No recent activity
                      </div>
                    ) : (
                      <div className="d-flex flex-column gap-3">
                        {projectActivities.slice(0, 10).map((activity: any, idx: number) => {
                          const extensionNumber = activity.extension_number || 'system';
                          const initials = getInitials(extensionNumber);
                          const avatarColor = getAvatarColor(extensionNumber, idx);
                          const taskTitle = activity.task?.title || activity.task?.task_id || 'Task';
                          const actionText = activity.description || `${activity.action} task`;
                          
                          return (
                            <div key={activity.id || idx} className="d-flex gap-2">
                              <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                backgroundColor: avatarColor,
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.7rem',
                                fontWeight: '600',
                                flexShrink: 0
                              }}>
                                {initials}
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '0.875rem', color: '#334155' }}>
                                  <span style={{ fontWeight: '600' }}>{extensionNumber === 'system' ? 'System' : extensionNumber}</span> {actionText}
                                  {activity.task && (
                                    <span style={{ fontWeight: '600', color: '#3b82f6' }}> {taskTitle}</span>
                                  )}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                                  {formatTimeAgo(activity.created_at)}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                

                {/* History Tab */}
                {detailTab === 'History' && (
                  <div>
                    <div className="detail-label" style={{ marginBottom: '1rem' }}>Project History</div>
                    {loadingActivities ? (
                      <div className="text-center py-3">
                        <Spinner animation="border" size="sm" />
                      </div>
                    ) : projectActivities.length === 0 ? (
                      <div className="text-center py-3 text-muted" style={{ fontSize: '0.875rem' }}>
                        No history available
                      </div>
                    ) : (
                      <div className="d-flex flex-column gap-2">
                        {projectActivities.map((activity: any, idx: number) => {
                          const extensionNumber = activity.extension_number || 'system';
                          const actionColor = getActionColor(activity.action);
                          const taskTitle = activity.task?.title || activity.task?.task_id || 'Task';
                          const actionText = activity.description || `${activity.action} task`;
                          
                          return (
                            <div key={activity.id || idx} style={{
                              padding: '0.75rem',
                              backgroundColor: '#f8fafc',
                              borderRadius: '8px',
                              border: '1px solid #e2e8f0',
                              borderLeft: `3px solid ${actionColor}`
                            }}>
                              <div className="d-flex align-items-center gap-2 mb-2">
                                {activity.action === 'status_changed' && <CheckCircle2 size={16} style={{ color: actionColor }} />}
                                {activity.action === 'updated' && <Edit3 size={16} style={{ color: actionColor }} />}
                                {activity.action === 'created' && <Plus size={16} style={{ color: actionColor }} />}
                                {activity.action === 'completed' && <CheckCircle2 size={16} style={{ color: actionColor }} />}
                                {activity.action === 'archived' && <Archive size={16} style={{ color: actionColor }} />}
                                {!['status_changed', 'updated', 'created', 'completed'].includes(activity.action) && (
                                  <AlertCircle size={16} style={{ color: actionColor }} />
                                )}
                                <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#334155' }}>
                                  {actionText}
                                </span>
                              </div>
                              <div style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '0.25rem' }}>
                                <span style={{ fontWeight: '600' }}>{extensionNumber === 'system' ? 'System' : extensionNumber}</span>
                                {activity.task && (
                                  <> - <span style={{ fontWeight: '600', color: '#3b82f6' }}>{taskTitle}</span></>
                                )}
                              </div>
                              {activity.old_values && activity.new_values && (
                                <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem', fontStyle: 'italic' }}>
                                  Changed: {JSON.stringify(activity.old_values)} → {JSON.stringify(activity.new_values)}
                                </div>
                              )}
                              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                {formatDateTime(activity.created_at)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </Offcanvas.Body>
      </Offcanvas>

      {/* Project Form Modal */}
      <Modal 
        show={showProjectModal} 
        onHide={() => {
          setShowProjectModal(false);
          setEditingProject(null);
          setProjectFormData({
            name: '',
            description: '',
            color: '#3b82f6'
          });
        }}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>{editingProject ? 'Edit Project' : 'Create New Project'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmitProject}>
            <Form.Group className="mb-3">
              <Form.Label>Project Name <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                value={projectFormData.name}
                onChange={(e) => setProjectFormData({ ...projectFormData, name: e.target.value })}
                placeholder="Enter project name"
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={projectFormData.description}
                onChange={(e) => setProjectFormData({ ...projectFormData, description: e.target.value })}
                placeholder="Enter project description"
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Color</Form.Label>
              <div className="d-flex align-items-center gap-3">
                <Form.Control
                  type="color"
                  value={projectFormData.color}
                  onChange={(e) => setProjectFormData({ ...projectFormData, color: e.target.value })}
                  style={{ width: '80px', height: '40px' }}
                />
                <Form.Control
                  type="text"
                  value={projectFormData.color}
                  onChange={(e) => setProjectFormData({ ...projectFormData, color: e.target.value })}
                  placeholder="#3b82f6"
                  style={{ flex: 1 }}
                />
              </div>
            </Form.Group>
            
            <div className="d-flex justify-content-end gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowProjectModal(false);
                  setEditingProject(null);
                  setProjectFormData({
                    name: '',
                    description: '',
                    color: '#3b82f6'
                  });
                }}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={submitting || !projectFormData.name.trim()}
              >
                {submitting ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                      className="me-2"
                    />
                    {editingProject ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  editingProject ? 'Update Project' : 'Create Project'
                )}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        show={showDeleteModal}
        onHide={() => {
          setShowDeleteModal(false);
          setProjectToDelete(null);
        }}
        onConfirm={confirmDelete}
        itemName={projectToDelete?.name}
        itemType="project"
        loading={deleting}
      />
    </>

    </React.Fragment>
  );
};

WorkPlannerProjects.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default WorkPlannerProjects;
