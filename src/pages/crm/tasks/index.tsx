import "@assets/scss/datatable-style.scss";
import { useRouter } from 'next/router';
import React, {
  ReactElement,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  createTaskNote,
  updateTaskNote,
  deleteTaskNote,
  TaskData,
  TaskNote,
} from "@utils/crm";
import { GetHierarchyData } from "@utils/users";
import {
  Button,
  Row,
  Col,
  Badge,
  Dropdown,
  Form,
  Card,
  Table,
  InputGroup,
  Modal,
} from "react-bootstrap";
import Select from 'react-select';
import { ModuleSlug } from "@utils/Helper";
import {
  CheckCircle,
  BarChart3,
  Plus,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  X,
  PlusCircle,
  CheckSquare,
  Clock,
  Search,
  Filter,
  Layers,
  Calendar,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Mail,
  Phone,
  Building2,
  User,
  AlertCircle,
  Activity,
  MessageSquare,
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';
import Link from "next/link";
import { toast } from "react-toastify";
import { useSession } from "next-auth/react";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";

// KPI Card Component
interface KPICardData {
  title: string;
  value: string;
  change?: string;
  isPositive?: boolean;
  icon: React.ReactNode;
  color: string;
  onClick?: () => void;
}

const KPICard: React.FC<KPICardData> = ({ title, value, change, isPositive, icon, color, onClick }) => {
  return (
    <Card 
      className={onClick ? 'h-100' : ''} 
      style={{ 
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        border: '1px solid #e9ecef'
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }
      }}
    >
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div className={`bg-${color} bg-opacity-10 rounded p-3`}>
            <div className={`text-${color}`}>{icon}</div>
          </div>
          {change && (
            <Badge bg={isPositive ? 'success' : 'danger'} className="bg-opacity-10">
              {isPositive ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
              {change}
            </Badge>
          )}
        </div>
        <h3 className="mb-1">{value}</h3>
        <p className="text-muted mb-0 small">{title}</p>
      </Card.Body>
    </Card>
  );
};

const CrmTasks = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    rowsPerPage: 10,
    sortColumn: '',
    sortDirection: 'asc' as 'asc' | 'desc',
  });
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<number[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<string[]>(() => {
    const saved = localStorage.getItem('tasksSelectedColumns');
    return saved ? JSON.parse(saved) : ['task', 'assignedTo', 'contact', 'company', 'urgency', 'status', 'dueDate'];
  });
  const [extensions, setExtensions] = useState<any[]>([]);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showTaskViewModal, setShowTaskViewModal] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskData | null>(null);
  const [viewingTask, setViewingTask] = useState<TaskData | null>(null);
  const [taskFormData, setTaskFormData] = useState({
    name: '',
    user_extension: '',
    created_by: '',
    urgency: 'med' as 'low' | 'med' | 'high',
    phone: '',
    email: '',
    company_name: '',
    due_date: '',
    notes: [] as Array<{ note: string }>,
  });
  const [selectedUserExtension, setSelectedUserExtension] = useState<any>(null);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [editingNote, setEditingNote] = useState<TaskNote | null>(null);
  const [noteText, setNoteText] = useState('');
  const [taskToDelete, setTaskToDelete] = useState<{ id: number } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Fetch extensions
  useEffect(() => {
    const fetchExtensions = async () => {
      try {
        const data = await GetHierarchyData(ModuleSlug.CRM_LEADS);
        setExtensions(data.users || []);
      } catch (error) {
        console.error('Failed to fetch extensions:', error);
      }
    };
    fetchExtensions();
  }, []);

  // Fetch tasks
  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getTasks({
        page: pagination.currentPage,
        per_page: pagination.rowsPerPage,
        search: search || undefined,
      });
      setTasks(response.data || []);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.currentPage, pagination.rowsPerPage, search]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Fetch single task
  const fetchTask = useCallback(async (taskId: number) => {
    try {
      const task = await getTask(taskId);
      setViewingTask(task);
    } catch (error) {
      console.error('Failed to fetch task:', error);
    }
  }, []);

  // Handle sort
  const handleSort = (column: string) => {
    setPagination(prev => ({
      ...prev,
      sortColumn: column,
      sortDirection: prev.sortColumn === column && prev.sortDirection === 'asc' ? 'desc' : 'asc',
    }));
  };

  // Sort data
  const sortData = <T extends Record<string, any>>(data: T[], sortColumn: string, sortDirection: 'asc' | 'desc'): T[] => {
    if (!sortColumn) return data;
    return [...data].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      if (aVal === bVal) return 0;
      if (sortDirection === 'asc') {
        return aVal < bVal ? -1 : 1;
      } else {
        return aVal > bVal ? -1 : 1;
      }
    });
  };

  // Paginate data
  const paginateData = <T,>(data: T[], currentPage: number, rowsPerPage: number): T[] => {
    const start = (currentPage - 1) * rowsPerPage;
    return data.slice(start, start + rowsPerPage);
  };

  // Get total pages
  const getTotalPages = (dataLength: number, rowsPerPage: number): number => {
    return Math.ceil(dataLength / rowsPerPage);
  };

  // Render pagination controls
  const renderPaginationControls = (
    dataLength: number,
    paginationState: any,
    setPaginationState: (state: any) => void,
    label: string
  ) => {
    const totalPages = getTotalPages(dataLength, paginationState.rowsPerPage);
    const start = (paginationState.currentPage - 1) * paginationState.rowsPerPage + 1;
    const end = Math.min(paginationState.currentPage * paginationState.rowsPerPage, dataLength);

    return (
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
        <div className="d-flex align-items-center gap-2">
          <span className="text-muted small">
            Showing {start} to {end} of {dataLength} {label}
          </span>
          <Form.Select
            size="sm"
            style={{ width: 'auto' }}
            value={paginationState.rowsPerPage}
            onChange={(e) => {
              setPaginationState({
                ...paginationState,
                rowsPerPage: Number(e.target.value),
                currentPage: 1,
              });
            }}
          >
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </Form.Select>
        </div>
        <div className="d-flex align-items-center gap-1">
          <Button
            variant="outline-secondary"
            size="sm"
            disabled={paginationState.currentPage === 1}
            onClick={() => setPaginationState({ ...paginationState, currentPage: 1 })}
          >
            <ChevronsLeft size={16} />
          </Button>
          <Button
            variant="outline-secondary"
            size="sm"
            disabled={paginationState.currentPage === 1}
            onClick={() => setPaginationState({ ...paginationState, currentPage: paginationState.currentPage - 1 })}
          >
            <ChevronLeft size={16} />
          </Button>
          <span className="px-3">
            Page {paginationState.currentPage} of {totalPages}
          </span>
          <Button
            variant="outline-secondary"
            size="sm"
            disabled={paginationState.currentPage === totalPages}
            onClick={() => setPaginationState({ ...paginationState, currentPage: paginationState.currentPage + 1 })}
          >
            <ChevronRight size={16} />
          </Button>
          <Button
            variant="outline-secondary"
            size="sm"
            disabled={paginationState.currentPage === totalPages}
            onClick={() => setPaginationState({ ...paginationState, currentPage: totalPages })}
          >
            <ChevronsRight size={16} />
          </Button>
        </div>
      </div>
    );
  };

  // Render sort icon
  const renderSortIcon = (column: string) => {
    if (pagination.sortColumn !== column) {
      return <ArrowUpDown size={14} className="text-muted" />;
    }
    return pagination.sortDirection === 'asc' ? (
      <ArrowUp size={14} className="text-primary" />
    ) : (
      <ArrowDown size={14} className="text-primary" />
    );
  };

  // Handle create/update task
  const handleSubmitTask = useCallback(async () => {
    if (!taskFormData.name || !taskFormData.user_extension || !taskFormData.due_date) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      if (editingTask) {
        await updateTask(editingTask.id!, {
          name: taskFormData.name,
          user_extension: taskFormData.user_extension,
          created_by: taskFormData.created_by || (session?.user as any)?.extension || 'admin',
          urgency: taskFormData.urgency,
          phone: taskFormData.phone || undefined,
          email: taskFormData.email || undefined,
          company_name: taskFormData.company_name || undefined,
          due_date: taskFormData.due_date,
        });
      } else {
        await createTask({
          name: taskFormData.name,
          user_extension: taskFormData.user_extension,
          created_by: taskFormData.created_by || (session?.user as any)?.extension || 'admin',
          urgency: taskFormData.urgency,
          phone: taskFormData.phone || undefined,
          email: taskFormData.email || undefined,
          company_name: taskFormData.company_name || undefined,
          due_date: taskFormData.due_date,
          notes: taskFormData.notes.length > 0 ? taskFormData.notes : undefined,
        });
      }
      setShowTaskModal(false);
      setEditingTask(null);
      setTaskFormData({
        name: '',
        user_extension: '',
        created_by: '',
        urgency: 'med',
        phone: '',
        email: '',
        company_name: '',
        due_date: '',
        notes: [],
      });
      setSelectedUserExtension(null);
      fetchTasks();
    } catch (error) {
      console.error('Failed to save task:', error);
    }
  }, [taskFormData, editingTask, session, fetchTasks]);

  // Handle delete task
  const handleDeleteTask = useCallback(async () => {
    if (!taskToDelete) return;
    try {
      await deleteTask(taskToDelete.id);
      setShowDeleteModal(false);
      setTaskToDelete(null);
      fetchTasks();
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  }, [taskToDelete, fetchTasks]);

  // Handle create note
  const handleCreateNote = useCallback(async () => {
    if (!noteText.trim()) return;
    
    // If we're in the task form modal (creating/editing task), add to form data
    if (showTaskModal) {
      setTaskFormData(prev => ({
        ...prev,
        notes: [...prev.notes, { note: noteText }],
      }));
      setNoteText('');
      setShowNoteModal(false);
      return;
    }
    
    // Otherwise, we're in the view modal, use API
    if (!viewingTask?.id) return;
    try {
      await createTaskNote(viewingTask.id, { note: noteText });
      setNoteText('');
      setShowNoteModal(false);
      fetchTask(viewingTask.id);
    } catch (error) {
      console.error('Failed to create note:', error);
    }
  }, [noteText, viewingTask, showTaskModal, fetchTask]);

  // Handle update note
  const handleUpdateNote = useCallback(async () => {
    if (!noteText.trim() || !editingNote) return;
    
    // If we're in the task form modal (creating/editing task), update in form data
    // editingNote.id will be the index when editing form notes
    if (showTaskModal && editingNote.id !== undefined && typeof editingNote.id === 'number' && editingNote.id >= 0) {
      const noteIndex = editingNote.id;
      setTaskFormData(prev => {
        const updatedNotes = [...prev.notes];
        updatedNotes[noteIndex] = { note: noteText };
        return {
          ...prev,
          notes: updatedNotes,
        };
      });
      setNoteText('');
      setEditingNote(null);
      setShowNoteModal(false);
      return;
    }
    
    // Otherwise, we're in the view modal, use API
    if (!viewingTask?.id || !editingNote.id) return;
    try {
      await updateTaskNote(viewingTask.id, editingNote.id, { note: noteText });
      setNoteText('');
      setEditingNote(null);
      setShowNoteModal(false);
      fetchTask(viewingTask.id);
    } catch (error) {
      console.error('Failed to update note:', error);
    }
  }, [noteText, editingNote, viewingTask, showTaskModal, fetchTask]);

  // Handle delete note
  const handleDeleteNote = useCallback(async (noteId: number) => {
    if (!viewingTask?.id) return;
    if (!confirm('Are you sure you want to delete this note?')) return;
    try {
      await deleteTaskNote(viewingTask.id, noteId);
      fetchTask(viewingTask.id);
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  }, [viewingTask, fetchTask]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    let filtered = tasks;

    // Quick filters
    if (activeFilter === 'high-urgency') {
      filtered = filtered.filter(t => t.urgency === 'high');
    } else if (activeFilter === 'overdue') {
      const today = new Date().toISOString().split('T')[0];
      filtered = filtered.filter(t => t.due_date < today);
    } else if (activeFilter === 'my-tasks') {
      const userExtension = (session?.user as any)?.extension;
      if (userExtension) {
        filtered = filtered.filter(t => t.user_extension === userExtension);
      }
    }

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(t =>
        t.name?.toLowerCase().includes(searchLower) ||
        t.company_name?.toLowerCase().includes(searchLower) ||
        t.email?.toLowerCase().includes(searchLower) ||
        t.phone?.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [tasks, activeFilter, search, session]);

  // Get analytics data
  const analyticsData = useMemo(() => {
    const total = filteredTasks.length;
    const highUrgency = filteredTasks.filter(t => t.urgency === 'high').length;
    const medUrgency = filteredTasks.filter(t => t.urgency === 'med').length;
    const lowUrgency = filteredTasks.filter(t => t.urgency === 'low').length;
    const today = new Date().toISOString().split('T')[0];
    const overdue = filteredTasks.filter(t => t.due_date < today).length;

    return {
      total,
      highUrgency,
      medUrgency,
      lowUrgency,
      overdue,
    };
  }, [filteredTasks]);

  // Get urgency badge color
  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return <Badge bg="danger">High</Badge>;
      case 'med':
        return <Badge bg="warning">Medium</Badge>;
      case 'low':
        return <Badge bg="secondary">Low</Badge>;
      default:
        return <Badge bg="secondary">{urgency}</Badge>;
    }
  };

  // Extension options for select
  const extensionOptions = useMemo(() => {
    console.log("ZEZEZE", extensions);
    return extensions.map(ext => ({
      value: ext.id,
      label: ext.display_name || ext.name || ext.id,
    }));
  }, [extensions]);

  return (
    <React.Fragment>
      <BreadcrumbItem mainLink="/crm/tasks" mainTitle="CRM" subTitle="Tasks" />
      <Row>
        <Col sm="12">
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <div>
                <h4 className="card-title mb-0">Task Management</h4>
                <p className="text-muted mb-0 small">Track and manage tasks with complete history logging</p>
              </div>
              <div className="d-flex gap-2">
                <Button
                  variant={showAnalytics ? "primary" : "outline-secondary"}
                  onClick={() => setShowAnalytics(!showAnalytics)}
                >
                  <BarChart3 size={16} className="me-2" />
                  {showAnalytics ? 'Hide Analytics' : 'Show Analytics'}
                </Button>
                <Button variant="primary" onClick={() => {
                  setEditingTask(null);
                  setTaskFormData({
                    name: '',
                    user_extension: '',
                    created_by: (session?.user as any)?.extension || 'admin',
                    urgency: 'med',
                    phone: '',
                    email: '',
                    company_name: '',
                    due_date: '',
                    notes: [],
                  });
                  setSelectedUserExtension(null);
                  setShowTaskModal(true);
                }}>
                  <Plus size={16} className="me-2" />
                  Create Task
                </Button>
              </div>
            </Card.Header>
            <Card.Body>
              {/* Analytics Section */}
              {showAnalytics && (
                <>
                  <Row className="mb-4">
                    <Col lg={3} md={6} className="mb-3">
                      <KPICard
                        title="Total Tasks"
                        value={analyticsData.total.toString()}
                        icon={<CheckCircle size={24} />}
                        color="primary"
                      />
                    </Col>
                    <Col lg={3} md={6} className="mb-3">
                      <KPICard
                        title="High Urgency"
                        value={analyticsData.highUrgency.toString()}
                        icon={<AlertCircle size={24} />}
                        color="danger"
                      />
                    </Col>
                    <Col lg={3} md={6} className="mb-3">
                      <KPICard
                        title="Medium Urgency"
                        value={analyticsData.medUrgency.toString()}
                        icon={<Clock size={24} />}
                        color="warning"
                      />
                    </Col>
                    <Col lg={3} md={6} className="mb-3">
                      <KPICard
                        title="Overdue"
                        value={analyticsData.overdue.toString()}
                        icon={<Activity size={24} />}
                        color="danger"
                      />
                    </Col>
                  </Row>

                  <Row className="mb-4">
                    <Col md={6} className="mb-3">
                      <Card className="border-0 shadow-sm h-100">
                        <Card.Body>
                          <h6 className="fw-bold mb-3">Tasks by Urgency</h6>
                          <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                              <Pie
                                data={[
                                  { name: 'High', value: analyticsData.highUrgency, color: '#dc3545' },
                                  { name: 'Medium', value: analyticsData.medUrgency, color: '#ffc107' },
                                  { name: 'Low', value: analyticsData.lowUrgency, color: '#6c757d' },
                                ]}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {[
                                  { name: 'High', value: analyticsData.highUrgency, color: '#dc3545' },
                                  { name: 'Medium', value: analyticsData.medUrgency, color: '#ffc107' },
                                  { name: 'Low', value: analyticsData.lowUrgency, color: '#6c757d' },
                                ].map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={6} className="mb-3">
                      <Card className="border-0 shadow-sm h-100">
                        <Card.Body>
                          <h6 className="fw-bold mb-3">Urgency Distribution</h6>
                          <ResponsiveContainer width="100%" height={250}>
                            <BarChart
                              data={[
                                { urgency: 'High', count: analyticsData.highUrgency },
                                { urgency: 'Medium', count: analyticsData.medUrgency },
                                { urgency: 'Low', count: analyticsData.lowUrgency },
                              ]}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="urgency" />
                              <YAxis />
                              <Tooltip />
                              <Bar dataKey="count" fill="#dc3545" />
                            </BarChart>
                          </ResponsiveContainer>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                </>
              )}

              {/* Filters and Search */}
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-3">
                <div className="d-flex gap-2 flex-wrap">
                  <Button
                    variant={activeFilter === 'all' ? 'primary' : 'outline-secondary'}
                    size="sm"
                    onClick={() => setActiveFilter('all')}
                  >
                    All
                  </Button>
                  <Button
                    variant={activeFilter === 'my-tasks' ? 'primary' : 'outline-secondary'}
                    size="sm"
                    onClick={() => setActiveFilter('my-tasks')}
                  >
                    My Tasks
                  </Button>
                  <Button
                    variant={activeFilter === 'high-urgency' ? 'primary' : 'outline-secondary'}
                    size="sm"
                    onClick={() => setActiveFilter('high-urgency')}
                  >
                    High Urgency
                  </Button>
                  <Button
                    variant={activeFilter === 'overdue' ? 'primary' : 'outline-secondary'}
                    size="sm"
                    onClick={() => setActiveFilter('overdue')}
                  >
                    Overdue
                  </Button>
                </div>
                <InputGroup style={{ maxWidth: '300px' }}>
                  <InputGroup.Text>
                    <Search size={16} />
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Search tasks..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </InputGroup>
              </div>

              {/* Bulk Actions and Column Customization */}
              <div className="d-flex justify-content-end gap-2 mb-3">
                {selectedTasks.length > 0 && (
                  <Dropdown>
                    <Dropdown.Toggle variant="outline-primary" size="sm">
                      <CheckSquare size={16} className="me-2" />
                      Bulk Actions ({selectedTasks.length})
                    </Dropdown.Toggle>
                    <Dropdown.Menu align="end">
                      <Dropdown.Item
                        onClick={() => {
                          // Add bulk delete logic
                          setTaskToDelete({ id: selectedTasks[0] });
                          setShowDeleteModal(true);
                        }}
                        className="d-flex align-items-center text-danger"
                      >
                        <Trash2 size={14} className="me-2" />
                        Delete Selected ({selectedTasks.length})
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                )}

                <Dropdown>
                  <Dropdown.Toggle variant="outline-secondary" size="sm">
                    <Layers size={16} className="me-2" />
                    Customize Table
                  </Dropdown.Toggle>
                  <Dropdown.Menu align="end" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {[
                      { key: 'task', label: 'Task' },
                      { key: 'assignedTo', label: 'Assigned To' },
                      { key: 'contact', label: 'Contact' },
                      { key: 'company', label: 'Company' },
                      { key: 'urgency', label: 'Urgency' },
                      { key: 'dueDate', label: 'Due Date' },
                    ].map((col) => (
                      <Dropdown.Item key={col.key} as="div">
                        <Form.Check
                          type="checkbox"
                          label={col.label}
                          checked={selectedColumns.includes(col.key)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedColumns([...selectedColumns, col.key]);
                            } else {
                              setSelectedColumns(selectedColumns.filter(c => c !== col.key));
                            }
                            localStorage.setItem('tasksSelectedColumns', JSON.stringify(
                              e.target.checked
                                ? [...selectedColumns, col.key]
                                : selectedColumns.filter(c => c !== col.key)
                            ));
                          }}
                        />
                      </Dropdown.Item>
                    ))}
                    <Dropdown.Divider />
                    <Dropdown.Item onClick={() => {
                      const defaultCols = ['task', 'assignedTo', 'contact', 'company', 'urgency', 'dueDate'];
                      setSelectedColumns(defaultCols);
                      localStorage.setItem('tasksSelectedColumns', JSON.stringify(defaultCols));
                    }}>
                      Reset to Default
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </div>

              {/* Tasks Table */}
              <div className="table-responsive">
                <Table hover className="mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th style={{ width: '50px' }}>
                        <Form.Check
                          type="checkbox"
                          checked={filteredTasks.length > 0 && filteredTasks.every(t => selectedTasks.includes(t.id!))}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTasks(filteredTasks.map(t => t.id!));
                            } else {
                              setSelectedTasks([]);
                            }
                          }}
                        />
                      </th>
                      {selectedColumns.includes('task') && (
                        <th>
                          <div className="d-flex align-items-center gap-2" style={{ cursor: 'pointer' }} onClick={() => handleSort('name')}>
                            Task {renderSortIcon('name')}
                          </div>
                        </th>
                      )}
                      {selectedColumns.includes('assignedTo') && <th>Assigned To</th>}
                      {selectedColumns.includes('contact') && <th>Contact</th>}
                      {selectedColumns.includes('company') && <th>Company</th>}
                      {selectedColumns.includes('urgency') && (
                        <th>
                          <div className="d-flex align-items-center gap-2" style={{ cursor: 'pointer' }} onClick={() => handleSort('urgency')}>
                            Urgency {renderSortIcon('urgency')}
                          </div>
                        </th>
                      )}
                      {selectedColumns.includes('dueDate') && (
                        <th>
                          <div className="d-flex align-items-center gap-2" style={{ cursor: 'pointer' }} onClick={() => handleSort('due_date')}>
                            Due Date {renderSortIcon('due_date')}
                          </div>
                        </th>
                      )}
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={selectedColumns.length + 2} className="text-center py-4">
                          Loading...
                        </td>
                      </tr>
                    ) : filteredTasks.length === 0 ? (
                      <tr>
                        <td colSpan={selectedColumns.length + 2} className="text-center py-4 text-muted">
                          No tasks found
                        </td>
                      </tr>
                    ) : (
                      sortData(filteredTasks, pagination.sortColumn, pagination.sortDirection).map((task) => {
                        const isOverdue = task.due_date < new Date().toISOString().split('T')[0];
                        return (
                          <tr key={task.id}>
                            <td>
                              <Form.Check
                                type="checkbox"
                                checked={selectedTasks.includes(task.id!)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedTasks([...selectedTasks, task.id!]);
                                  } else {
                                    setSelectedTasks(selectedTasks.filter(id => id !== task.id));
                                  }
                                }}
                              />
                            </td>
                            {selectedColumns.includes('task') && (
                              <td>
                                <div className="fw-semibold">{task.name}</div>
                                {task.created_at && (
                                  <small className="text-muted">
                                    Created: {new Date(task.created_at).toLocaleDateString()}
                                  </small>
                                )}
                              </td>
                            )}
                            {selectedColumns.includes('assignedTo') && (
                              <td>
                                <div className="d-flex align-items-center gap-2">
                                  <User size={14} className="text-muted" />
                                  {extensions.find(e => e.id === task.user_extension)?.display_name || task.user_extension}
                                </div>
                              </td>
                            )}
                            {selectedColumns.includes('contact') && (
                              <td>
                                <div className="fw-medium">{task.email || task.phone || '-'}</div>
                                {task.phone && task.email && (
                                  <small className="text-muted">{task.phone}</small>
                                )}
                              </td>
                            )}
                            {selectedColumns.includes('company') && (
                              <td>{task.company_name || '-'}</td>
                            )}
                            {selectedColumns.includes('urgency') && (
                              <td>{getUrgencyBadge(task.urgency)}</td>
                            )}
                            {selectedColumns.includes('dueDate') && (
                              <td>
                                <div className="d-flex align-items-center gap-2">
                                  <Calendar size={14} className={isOverdue ? 'text-danger' : 'text-muted'} />
                                  <span className={isOverdue ? 'text-danger fw-semibold' : ''}>
                                    {new Date(task.due_date).toLocaleDateString()}
                                  </span>
                                </div>
                              </td>
                            )}
                            <td>
                              <div className="d-flex gap-1">
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="p-1"
                                  title="View Details"
                                  onClick={() => {
                                    fetchTask(task.id!);
                                    setShowTaskViewModal(true);
                                  }}
                                >
                                  <Eye size={16} />
                                </Button>
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="p-1"
                                  title="Edit Task"
                                  onClick={() => {
                                    setEditingTask(task);
                                    setTaskFormData({
                                      name: task.name,
                                      user_extension: task.user_extension,
                                      created_by: task.created_by,
                                      urgency: task.urgency,
                                      phone: task.phone || '',
                                      email: task.email || '',
                                      company_name: task.company_name || '',
                                      due_date: task.due_date,
                                      notes: task.notes?.map(n => ({ note: n.note })) || [],
                                    });
                                    setSelectedUserExtension(extensionOptions.find(o => o.value === task.user_extension) || null);
                                    setShowTaskModal(true);
                                  }}
                                >
                                  <Edit size={16} />
                                </Button>
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="p-1 text-danger"
                                  title="Delete Task"
                                  onClick={() => {
                                    setTaskToDelete({ id: task.id! });
                                    setShowDeleteModal(true);
                                  }}
                                >
                                  <Trash2 size={16} />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="mt-3">
                {renderPaginationControls(filteredTasks.length, pagination, setPagination, 'tasks')}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Create/Edit Task Modal */}
      <Modal show={showTaskModal} onHide={() => {
        setShowTaskModal(false);
        setEditingTask(null);
        setTaskFormData({
          name: '',
          user_extension: '',
          created_by: '',
          urgency: 'med',
          phone: '',
          email: '',
          company_name: '',
          due_date: '',
          notes: [],
        });
        setSelectedUserExtension(null);
      }} size="lg" centered>
        <Modal.Header closeButton className="border-bottom">
          <Modal.Title>{editingTask ? 'Edit Task' : 'Create New Task'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={(e) => { e.preventDefault(); handleSubmitTask(); }}>
          <Modal.Body className="p-4">
            <Row className="g-3">
              <Col md={12}>
                <Form.Group>
                  <Form.Label>Task Name <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter task name"
                    value={taskFormData.name}
                    onChange={(e) => setTaskFormData({ ...taskFormData, name: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Assigned To (User Extension) <span className="text-danger">*</span></Form.Label>
                  <Select
                    value={selectedUserExtension}
                    onChange={(option) => {
                      setSelectedUserExtension(option);
                      setTaskFormData({ ...taskFormData, user_extension: option?.value || '' });
                    }}
                    options={extensionOptions}
                    styles={{
                      control: (base) => ({
                        ...base,
                        minHeight: '38px',
                      }),
                    }}
                    placeholder="Select user..."
                    isClearable
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Urgency <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    value={taskFormData.urgency}
                    onChange={(e) => setTaskFormData({ ...taskFormData, urgency: e.target.value as 'low' | 'med' | 'high' })}
                    required
                  >
                    <option value="low">Low</option>
                    <option value="med">Medium</option>
                    <option value="high">High</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Phone</Form.Label>
                  <Form.Control
                    type="tel"
                    placeholder="Enter phone number"
                    value={taskFormData.phone}
                    onChange={(e) => setTaskFormData({ ...taskFormData, phone: e.target.value })}
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="Enter email address"
                    value={taskFormData.email}
                    onChange={(e) => setTaskFormData({ ...taskFormData, email: e.target.value })}
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Company Name</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter company name"
                    value={taskFormData.company_name}
                    onChange={(e) => setTaskFormData({ ...taskFormData, company_name: e.target.value })}
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Due Date <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="date"
                    value={taskFormData.due_date}
                    onChange={(e) => setTaskFormData({ ...taskFormData, due_date: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </Form.Group>
              </Col>

              <Col md={12}>
                <Form.Group>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <Form.Label className="mb-0">Notes</Form.Label>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      type="button"
                      onClick={() => {
                        setEditingNote(null);
                        setNoteText('');
                        setShowNoteModal(true);
                      }}
                    >
                      <Plus size={14} className="me-1" />
                      Add Note
                    </Button>
                  </div>
                  {taskFormData.notes.length > 0 ? (
                    <div className="border rounded p-3" style={{ background: '#f8f9fa', maxHeight: '300px', overflowY: 'auto' }}>
                      {taskFormData.notes.map((note, index) => (
                        <Card key={index} className="mb-2" style={{ border: '1px solid #dee2e6' }}>
                          <Card.Body className="p-3">
                            <div className="d-flex justify-content-between align-items-start">
                              <div style={{ flex: 1 }}>
                                <p className="mb-1" style={{ whiteSpace: 'pre-wrap', fontSize: '14px' }}>{note.note}</p>
                              </div>
                              <div className="d-flex gap-1">
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="p-1"
                                  type="button"
                                  onClick={() => {
                                    setEditingNote({ id: index as any, note: note.note });
                                    setNoteText(note.note);
                                    setShowNoteModal(true);
                                  }}
                                >
                                  <Edit size={14} />
                                </Button>
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="p-1 text-danger"
                                  type="button"
                                  onClick={() => {
                                    setTaskFormData({
                                      ...taskFormData,
                                      notes: taskFormData.notes.filter((_, i) => i !== index),
                                    });
                                  }}
                                >
                                  <Trash2 size={14} />
                                </Button>
                              </div>
                            </div>
                          </Card.Body>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="border rounded p-4 text-center text-muted" style={{ background: '#f8f9fa', borderStyle: 'dashed' }}>
                      <MessageSquare size={24} className="mb-2" style={{ opacity: 0.5 }} />
                      <div style={{ fontSize: '14px' }}>No notes added yet. Click "Add Note" to add one.</div>
                    </div>
                  )}
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer className="border-top">
            <Button variant="outline-secondary" onClick={() => {
              setShowTaskModal(false);
              setEditingTask(null);
              setTaskFormData({
                name: '',
                user_extension: '',
                created_by: '',
                urgency: 'med',
                phone: '',
                email: '',
                company_name: '',
                due_date: '',
                notes: [],
              });
              setSelectedUserExtension(null);
            }}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editingTask ? 'Update Task' : 'Create Task'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Task View Modal */}
      <Modal show={showTaskViewModal} onHide={() => {
        setShowTaskViewModal(false);
        setViewingTask(null);
      }} size="xl" centered>
        <div style={{
          color: 'black',
          padding: '30px',
          position: 'relative',
          borderTopLeftRadius: '8px',
          borderTopRightRadius: '8px',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <button
            onClick={() => {
              setShowTaskViewModal(false);
              setViewingTask(null);
            }}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: 'black',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              cursor: 'pointer',
              transition: 'all 0.3s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
              e.currentTarget.style.transform = 'rotate(90deg)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
              e.currentTarget.style.transform = 'rotate(0deg)';
            }}
          >
            <X size={20} />
          </button>
          <h3 style={{ margin: 0, fontWeight: 600, fontSize: '24px' }}>
            {viewingTask?.name}
          </h3>
          <p style={{ margin: '8px 0 0 0', opacity: 0.9, fontSize: '14px' }}>
            Task Details
          </p>
        </div>

        <Modal.Body style={{ padding: '30px' }}>
          {/* Task Information Section */}
          <div style={{
            fontSize: '16px',
            fontWeight: 600,
            color: '#1f2937',
            marginBottom: '20px',
            paddingBottom: '10px',
            borderBottom: '2px solid #f8f9fa',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <CheckCircle size={18} style={{ color: '#4680ff' }} />
            Task Information
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px',
            marginBottom: '30px'
          }}>
            <div style={{
              background: '#f8f9fa',
              padding: '16px',
              borderRadius: '10px',
            }}>
              <div style={{
                fontSize: '12px',
                fontWeight: 600,
                color: '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '6px'
              }}>Assigned To</div>
              <div style={{ fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                <User size={14} style={{ color: '#4680ff', marginRight: '6px' }} />
                {viewingTask && (extensions.find(e => e.id === viewingTask.user_extension)?.display_name || viewingTask.user_extension)}
              </div>
            </div>
            <div style={{
              background: '#f8f9fa',
              padding: '16px',
              borderRadius: '10px',
            }}>
              <div style={{
                fontSize: '12px',
                fontWeight: 600,
                color: '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '6px'
              }}>Urgency</div>
              <div style={{ fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                {viewingTask && getUrgencyBadge(viewingTask.urgency)}
              </div>
            </div>
            <div style={{
              background: '#f8f9fa',
              padding: '16px',
              borderRadius: '10px',
            }}>
              <div style={{
                fontSize: '12px',
                fontWeight: 600,
                color: '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '6px'
              }}>Due Date</div>
              <div style={{ fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                <Calendar size={14} style={{ color: '#4680ff', marginRight: '6px' }} />
                {viewingTask && new Date(viewingTask.due_date).toLocaleDateString()}
              </div>
            </div>
            {viewingTask?.company_name && (
              <div style={{
                background: '#f8f9fa',
                padding: '16px',
                borderRadius: '10px',
              }}>
                <div style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '6px'
                }}>Company</div>
                <div style={{ fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                  <Building2 size={14} style={{ color: '#4680ff', marginRight: '6px' }} />
                  {viewingTask.company_name}
                </div>
              </div>
            )}
            {viewingTask?.email && (
              <div style={{
                background: '#f8f9fa',
                padding: '16px',
                borderRadius: '10px',
              }}>
                <div style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '6px'
                }}>Email</div>
                <div style={{ fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                  <Mail size={14} style={{ color: '#4680ff', marginRight: '6px' }} />
                  {viewingTask.email}
                </div>
              </div>
            )}
            {viewingTask?.phone && (
              <div style={{
                background: '#f8f9fa',
                padding: '16px',
                borderRadius: '10px',
              }}>
                <div style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '6px'
                }}>Phone</div>
                <div style={{ fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                  <Phone size={14} style={{ color: '#4680ff', marginRight: '6px' }} />
                  {viewingTask.phone}
                </div>
              </div>
            )}
          </div>

          {/* Notes Section */}
          <div style={{
            fontSize: '16px',
            fontWeight: 600,
            color: '#1f2937',
            marginBottom: '20px',
            paddingBottom: '10px',
            borderBottom: '2px solid #f8f9fa',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <MessageSquare size={18} style={{ color: '#4680ff' }} />
              Notes
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setEditingNote(null);
                setNoteText('');
                setShowNoteModal(true);
              }}
            >
              <Plus size={14} className="me-1" />
              Add Note
            </Button>
          </div>

          {viewingTask?.notes && viewingTask.notes.length > 0 ? (
            <div style={{ marginBottom: '30px' }}>
              {viewingTask.notes.map((note, index) => (
                <Card key={note.id || index} className="mb-3" style={{ border: '1px solid #e5e7eb' }}>
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-start">
                      <div style={{ flex: 1 }}>
                        <p className="mb-2" style={{ whiteSpace: 'pre-wrap' }}>{note.note}</p>
                        {note.created_at && (
                          <small className="text-muted">
                            {new Date(note.created_at).toLocaleString()}
                          </small>
                        )}
                      </div>
                      <div className="d-flex gap-1">
                        <Button
                          variant="link"
                          size="sm"
                          className="p-1"
                          onClick={() => {
                            setEditingNote(note);
                            setNoteText(note.note);
                            setShowNoteModal(true);
                          }}
                        >
                          <Edit size={14} />
                        </Button>
                        <Button
                          variant="link"
                          size="sm"
                          className="p-1 text-danger"
                          onClick={() => handleDeleteNote(note.id!)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-muted mb-3" style={{
              background: '#f8f9fa',
              borderRadius: '8px',
              border: '1px dashed #dee2e6'
            }}>
              <MessageSquare size={32} className="mb-2" style={{ opacity: 0.5 }} />
              <div>No notes yet. Click "Add Note" to add one.</div>
            </div>
          )}
        </Modal.Body>

        <Modal.Footer className="border-top" style={{ background: 'white', padding: '1rem 1.5rem' }}>
          <Button
            variant="outline-secondary"
            onClick={() => {
              setShowTaskViewModal(false);
              setViewingTask(null);
            }}
            style={{ borderRadius: '8px', padding: '0.5rem 1.5rem' }}
          >
            Close
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setShowTaskViewModal(false);
              if (viewingTask) {
                setEditingTask(viewingTask);
                setTaskFormData({
                  name: viewingTask.name,
                  user_extension: viewingTask.user_extension,
                  created_by: viewingTask.created_by,
                  urgency: viewingTask.urgency,
                  phone: viewingTask.phone || '',
                  email: viewingTask.email || '',
                  company_name: viewingTask.company_name || '',
                  due_date: viewingTask.due_date,
                  notes: viewingTask.notes?.map(n => ({ note: n.note })) || [],
                });
                setSelectedUserExtension(extensionOptions.find(o => o.value === viewingTask.user_extension) || null);
                setShowTaskModal(true);
              }
            }}
            style={{ borderRadius: '8px', padding: '0.5rem 1.5rem' }}
          >
            <Edit size={16} className="me-1" />
            Edit Task
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Add/Edit Note Modal */}
      <Modal show={showNoteModal} onHide={() => {
        setShowNoteModal(false);
        setEditingNote(null);
        setNoteText('');
      }} centered>
        <Modal.Header closeButton>
          <Modal.Title>{editingNote ? 'Edit Note' : 'Add Note'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Note</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              placeholder="Enter note..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => {
            setShowNoteModal(false);
            setEditingNote(null);
            setNoteText('');
          }}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={editingNote ? handleUpdateNote : handleCreateNote}
            disabled={!noteText.trim()}
          >
            {editingNote ? 'Update Note' : 'Add Note'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => {
        setShowDeleteModal(false);
        setTaskToDelete(null);
      }} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete this task? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => {
            setShowDeleteModal(false);
            setTaskToDelete(null);
          }}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteTask}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </React.Fragment>
  );
};

CrmTasks.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CrmTasks;

