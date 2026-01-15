import "@assets/scss/datatable-style.scss";
import React, {
  ReactElement,
  useState,
  useEffect,
} from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericListPage from "@components/GenericListPage";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import PageHeader from "@components/PageHeader";
import { Container, Row, Col, Card, Nav, Spinner, Table, Badge, Form, InputGroup, Button, Dropdown } from "react-bootstrap";
import { getProject, listTasks, getProjectLabels, getRecentActivity, getOverdueTasks, createTask } from "@utils/tasks";
import CreateTaskModal from "@components/work-planner/createtask-modal";
import { useRouter } from "next/router";
import { getAutoTimezone, ModuleSlug } from "@utils/Helper";
import { useHierarchyData } from "@components/filters/useHierarchyData";
import { 
  List, 
  LayoutGrid, 
  FileText,
  Calendar,
  User,
  Tag,
  AlertCircle,
  CheckCircle2,
  Clock,
  Search,
  Plus,
  ChevronDown,
  X
} from "lucide-react";

const WorkPlannerProjectsDetails = () => {
  const router = useRouter();
  const { id } = router.query;
  const [activeTab, setActiveTab] = useState("list");
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [labels, setLabels] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [overdueTasks, setOverdueTasks] = useState<any[]>([]);
  const [boardTasks, setBoardTasks] = useState<any[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [loadingBoard, setLoadingBoard] = useState(false);
  const [pagination, setPagination] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAssignee, setSelectedAssignee] = useState("All Assignees");
  const [selectedPriority, setSelectedPriority] = useState("All Priorities");
  const [selectedLabel, setSelectedLabel] = useState("All Labels");
  const [selectedDate, setSelectedDate] = useState("All Dates");
  const [showCompleted, setShowCompleted] = useState(false);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [selectedStatusForTask, setSelectedStatusForTask] = useState<number | null>(null);
  const [creatingTask, setCreatingTask] = useState(false);

  // Fetch extensions using hierarchy API
  const { hierarchyDataExtensions } = useHierarchyData(ModuleSlug.CALL_RECORDINGS);

  // Fetch project and initial data
  useEffect(() => {
    if (id) {
      fetchProjectData();
    }
  }, [id]);

  // Fetch tasks when List tab is active
  useEffect(() => {
    if (id && activeTab === "list") {
      fetchTasks();
    }
  }, [id, activeTab]);

  // Fetch board data when Board tab is active
  useEffect(() => {
    if (id && activeTab === "board") {
      fetchBoardData();
      fetchBoardTasks();
    }
  }, [id, activeTab]);

  const fetchProjectData = async () => {
    try {
      setLoading(true);
      const withRelations = [
        'statuses',
        'statuses.tasks',
        'members.user',
        'tasks',
        'tasks.assignees',
        'tasks.labels',
        'tasks.status',
        'statuses',
        'owner'
      ];
      
      const [projectData, labelsData] = await Promise.all([
        getProject(id as string, withRelations),
        getProjectLabels(id as string)
      ]);

      if (projectData) {
        setProject(projectData);
      }

      if (labelsData && Array.isArray(labelsData)) {
        setLabels(labelsData);
      }
    } catch (error) {
      console.error('Error fetching project data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    try {
      setLoadingTasks(true);
      const withRelations = ['assignees', 'labels', 'status'];
      const response = await listTasks({
        project_id: Number(id),
        withRelations
      });

      if (response && response.success !== false) {
        setTasks(response.data || []);
        setPagination(response.pagination || null);
        setSummary(response.summary || null);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoadingTasks(false);
    }
  };

  const fetchBoardData = async () => {
    try {
      setLoadingBoard(true);
      const [activitiesData, overdueData] = await Promise.all([
        getRecentActivity(Number(id)),
        getOverdueTasks(Number(id))
      ]);

      if (activitiesData && Array.isArray(activitiesData)) {
        setActivities(activitiesData);
      }

      if (overdueData && Array.isArray(overdueData)) {
        setOverdueTasks(overdueData);
      }
    } catch (error) {
      console.error('Error fetching board data:', error);
    } finally {
      setLoadingBoard(false);
    }
  };

  const fetchBoardTasks = async () => {
    try {
      const withRelations = ['assignees', 'labels', 'status'];
      const response = await listTasks({
        project_id: Number(id),
        withRelations
      });

      if (response && response.success !== false) {
        setBoardTasks(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching board tasks:', error);
    }
  };

  // Group tasks by status
  const getTasksByStatus = (statusId: string | number | null) => {
    let filtered = boardTasks.filter((task: any) => {
      // Filter by search
      if (searchTerm && !task.title.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      // Filter by completed
      if (!showCompleted && task.is_completed) {
        return false;
      }
      // Filter by assignee
      if (selectedAssignee !== "All Assignees") {
        const hasAssignee = task.assignees?.some((a: any) => a.extension_number === selectedAssignee);
        if (!hasAssignee) return false;
      }
      // Filter by priority
      if (selectedPriority !== "All Priorities") {
        if (task.priority?.toLowerCase() !== selectedPriority.toLowerCase()) {
          return false;
        }
      }
      // Filter by label
      if (selectedLabel !== "All Labels") {
        const hasLabel = task.labels?.some((l: any) => l.name === selectedLabel);
        if (!hasLabel) return false;
      }
      return true;
    });

    if (statusId === null) {
      return filtered.filter((task: any) => !task.status_id);
    }
    return filtered.filter((task: any) => String(task.status_id) === String(statusId));
  };

  // Get summary counts
  const getSummaryCounts = () => {
    const allTasks = boardTasks.filter((task: any) => !task.is_completed);
    const openCount = allTasks.filter((t: any) => !t.status_id || !project?.statuses?.find((s: any) => String(s.id) === String(t.status_id) && s.is_completed)).length;
    const inProgressCount = allTasks.filter((t: any) => {
      const status = project?.statuses?.find((s: any) => String(s.id) === String(t.status_id));
      return status && status.name.toLowerCase().includes('progress');
    }).length;
    const reviewCount = allTasks.filter((t: any) => {
      const status = project?.statuses?.find((s: any) => String(s.id) === String(t.status_id));
      return status && status.name.toLowerCase().includes('review');
    }).length;
    const overdueCount = overdueTasks.length;

    return { openCount, inProgressCount, reviewCount, overdueCount };
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedAssignee("All Assignees");
    setSelectedPriority("All Priorities");
    setSelectedLabel("All Labels");
    setSelectedDate("All Dates");
    setShowCompleted(false);
  };

  // Get unique assignees, priorities, and labels from tasks
  const getAllAssignees = () => {
    const assignees = new Set<string>();
    boardTasks.forEach((task: any) => {
      task.assignees?.forEach((a: any) => assignees.add(a.extension_number));
    });
    return Array.from(assignees);
  };

  const getAllPriorities = () => {
    const priorities = new Set<string>();
    boardTasks.forEach((task: any) => {
      if (task.priority) priorities.add(task.priority);
    });
    return Array.from(priorities);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

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

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'danger';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'secondary';
    }
  };

  // Map priority ID to priority string
  const mapPriorityIdToString = (priorityId: number | null): string => {
    // Based on the modal's priority structure: 1=Low, 2=Normal, 3=High
    switch (priorityId) {
      case 1:
        return 'low';
      case 2:
        return 'normal';
      case 3:
        return 'high';
      default:
        return 'normal';
    }
  };

  // Handle opening create task modal
  const handleOpenCreateTaskModal = (statusId: number) => {
    setSelectedStatusForTask(statusId);
    setShowCreateTaskModal(true);
  };

  // Handle task creation
  const handleCreateTask = async (formData: any) => {
    try {
      setCreatingTask(true);
      
      // Auto-fetch timezone
      const autoTimezone = getAutoTimezone();
      
      // Map form data to API payload
      const payload: any = {
        title: formData.title,
        description: formData.description || '',
        status_id: selectedStatusForTask || formData.statusId || project?.statuses?.[0]?.id,
        priority: mapPriorityIdToString(formData.priorityId),
        due_date: formData.dueDate || '',
        start_date: formData.startDate || formData.start_date || '',
        estimated_hours: formData.estimatedHours || formData.estimated_hours || '',
        progress: formData.progress !== undefined ? formData.progress : 0,
        extension_numbers: formData.assigneeIds?.map((id: number) => {
          // Find the extension by id from hierarchyDataExtensions
          const extension = (hierarchyDataExtensions as any)?.find((ext: any) => Number(ext.id) === id);
          return extension ? extension.id : String(id);
        }) || [],
        label_ids: formData.labelIds || [],
        timezone: autoTimezone
      };

      // Add project_id if available (optional)
      if (id) {
        payload.project_id = Number(id);
      }

      const result = await createTask(payload);
      
      if (result) {
        // Refresh board tasks and list tasks
        if (activeTab === "board") {
          await fetchBoardTasks();
        } else if (activeTab === "list") {
          await fetchTasks();
        }
        setShowCreateTaskModal(false);
        setSelectedStatusForTask(null);
      }
    } catch (error) {
      console.error('Error creating task:', error);
    } finally {
      setCreatingTask(false);
    }
  };

  if (loading) {
    return (
      <React.Fragment>
        <BreadcrumbItem mainTitle="" mainLink="" subTitle="Work Planner Projects Details" />
        <PageHeader title="Work Planner Projects Details" showSearch={false} />
        <Container>
          <div className="text-center py-5">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
          </div>
        </Container>
      </React.Fragment>
    );
  }

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Work Planner Projects Details" />

      <PageHeader
        title={project?.name || "Work Planner Projects Details"}
        showSearch={false}
      />

      <Container fluid className="py-4">
        {/* Tabs */}
        <Card className="mb-4">
          <Card.Body className="p-0">
            <Nav variant="tabs" defaultActiveKey="list" onSelect={(k) => setActiveTab(k || "list")}>
              <Nav.Item>
                <Nav.Link eventKey="list" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <List size={16} />
                  List
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="board" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <LayoutGrid size={16} />
                  Board
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="report" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileText size={16} />
                  Report
                </Nav.Link>
              </Nav.Item>
            </Nav>
          </Card.Body>
        </Card>

        {/* Tab Content */}
        {activeTab === "list" && (
          <Card>
            <Card.Body>
              {loadingTasks ? (
                <div className="text-center py-5">
                  <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading tasks...</span>
                  </Spinner>
                </div>
              ) : (
                <>
                  {summary && (
                    <Row className="mb-4">
                      <Col md={12}>
                        <div className="d-flex gap-3 flex-wrap">
                          <Badge bg="primary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                            Total: {summary.total}
                          </Badge>
                          <Badge bg="info" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                            Open: {summary.open}
                          </Badge>
                          <Badge bg="danger" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                            Overdue: {summary.overdue}
                          </Badge>
                          <Badge bg="warning" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                            Due This Week: {summary.dueThisWeek}
                          </Badge>
                          <Badge bg="success" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                            Completed: {summary.completed}
                          </Badge>
                        </div>
                      </Col>
                    </Row>
                  )}

                  <Table responsive striped hover>
                    <thead>
                      <tr>
                        <th>Task ID</th>
                        <th>Title</th>
                        <th>Status</th>
                        <th>Priority</th>
                        <th>Assignees</th>
                        <th>Labels</th>
                        <th>Due Date</th>
                        <th>Progress</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tasks.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="text-center py-4 text-muted">
                            No tasks found
                          </td>
                        </tr>
                      ) : (
                        tasks.map((task: any) => (
                          <tr key={task.id}>
                            <td>{task.task_id || `#${task.id}`}</td>
                            <td>
                              <div>
                                <strong>{task.title}</strong>
                                {task.description && (
                                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                                    {task.description.replace(/<[^>]*>/g, '').substring(0, 50)}...
                                  </div>
                                )}
                              </div>
                            </td>
                            <td>
                              {task.status ? (
                                <Badge 
                                  style={{ 
                                    backgroundColor: task.status.color || '#6b7280',
                                    color: 'white'
                                  }}
                                >
                                  {task.status.name}
                                </Badge>
                              ) : (
                                <Badge bg="secondary">No Status</Badge>
                              )}
                            </td>
                            <td>
                              <Badge bg={getPriorityColor(task.priority)}>
                                {task.priority || 'Normal'}
                              </Badge>
                            </td>
                            <td>
                              <div className="d-flex gap-1">
                                {task.assignees && task.assignees.length > 0 ? (
                                  task.assignees.map((assignee: any, idx: number) => (
                                    <Badge key={idx} bg="info" style={{ fontSize: '0.7rem' }}>
                                      {assignee.extension_number}
                                    </Badge>
                                  ))
                                ) : (
                                  <span className="text-muted">Unassigned</span>
                                )}
                              </div>
                            </td>
                            <td>
                              <div className="d-flex gap-1 flex-wrap">
                                {task.labels && task.labels.length > 0 ? (
                                  task.labels.map((label: any, idx: number) => (
                                    <Badge 
                                      key={idx}
                                      style={{ 
                                        backgroundColor: label.color || '#06b6d4',
                                        color: 'white',
                                        fontSize: '0.7rem'
                                      }}
                                    >
                                      {label.name}
                                    </Badge>
                                  ))
                                ) : (
                                  <span className="text-muted">-</span>
                                )}
                              </div>
                            </td>
                            <td>
                              {task.due_date ? (
                                <div>
                                  <Calendar size={14} className="me-1" />
                                  {formatDate(task.due_date)}
                                </div>
                              ) : (
                                <span className="text-muted">-</span>
                              )}
                            </td>
                            <td>
                              <div className="d-flex align-items-center gap-2">
                                <div style={{ width: '60px', height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                                  <div 
                                    style={{ 
                                      width: `${task.progress || 0}%`, 
                                      height: '100%', 
                                      backgroundColor: task.progress === 100 ? '#10b981' : '#3b82f6' 
                                    }}
                                  />
                                </div>
                                <span style={{ fontSize: '0.875rem' }}>{task.progress || 0}%</span>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </Table>
                </>
              )}
            </Card.Body>
          </Card>
        )}

        {activeTab === "board" && (
          <Card>
            <Card.Body>
              {loadingBoard ? (
                <div className="text-center py-5">
                  <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading board data...</span>
                  </Spinner>
                </div>
              ) : (
                <>
                  {/* Summary Cards */}
                  <Row className="mb-4">
                    {(() => {
                      const counts = getSummaryCounts();
                      return (
                        <>
                          <Col md={3}>
                            <Card style={{ border: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                              <Card.Body>
                                <div className="fw-bold" style={{ fontSize: '1.5rem', color: '#334155' }}>
                                  Open {counts.openCount}
                                </div>
                              </Card.Body>
                            </Card>
                          </Col>
                          <Col md={3}>
                            <Card style={{ border: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                              <Card.Body>
                                <div className="fw-bold" style={{ fontSize: '1.5rem', color: '#334155' }}>
                                  In Progress {counts.inProgressCount}
                                </div>
                              </Card.Body>
                            </Card>
                          </Col>
                          <Col md={3}>
                            <Card style={{ border: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                              <Card.Body>
                                <div className="fw-bold" style={{ fontSize: '1.5rem', color: '#334155' }}>
                                  Review {counts.reviewCount}
                                </div>
                              </Card.Body>
                            </Card>
                          </Col>
                          <Col md={3}>
                            <Card style={{ border: '2px solid #ef4444', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                              <Card.Body>
                                <div className="fw-bold" style={{ fontSize: '1.5rem', color: '#ef4444' }}>
                                  Overdue {counts.overdueCount}
                                </div>
                              </Card.Body>
                            </Card>
                          </Col>
                        </>
                      );
                    })()}
                  </Row>

                  {/* Search and Filters */}
                  <Row className="mb-4">
                    <Col md={12}>
                      <div className="d-flex gap-2 align-items-center flex-wrap">
                        <InputGroup style={{ flex: '1', minWidth: '200px' }}>
                          <InputGroup.Text style={{ backgroundColor: 'white', borderRight: 'none' }}>
                            <Search size={16} color="#6b7280" />
                          </InputGroup.Text>
                          <Form.Control
                            type="text"
                            placeholder="Search tasks..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ borderLeft: 'none' }}
                          />
                        </InputGroup>

                        <Dropdown>
                          <Dropdown.Toggle variant="outline-secondary" style={{ minWidth: '150px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            {selectedAssignee}
                            <ChevronDown size={16} />
                          </Dropdown.Toggle>
                          <Dropdown.Menu>
                            <Dropdown.Item onClick={() => setSelectedAssignee("All Assignees")}>
                              All Assignees
                            </Dropdown.Item>
                            {getAllAssignees().map((assignee) => (
                              <Dropdown.Item key={assignee} onClick={() => setSelectedAssignee(assignee)}>
                                {assignee}
                              </Dropdown.Item>
                            ))}
                          </Dropdown.Menu>
                        </Dropdown>

                        <Dropdown>
                          <Dropdown.Toggle variant="outline-secondary" style={{ minWidth: '150px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            {selectedPriority}
                            <ChevronDown size={16} />
                          </Dropdown.Toggle>
                          <Dropdown.Menu>
                            <Dropdown.Item onClick={() => setSelectedPriority("All Priorities")}>
                              All Priorities
                            </Dropdown.Item>
                            {getAllPriorities().map((priority) => (
                              <Dropdown.Item key={priority} onClick={() => setSelectedPriority(priority)}>
                                {priority}
                              </Dropdown.Item>
                            ))}
                          </Dropdown.Menu>
                        </Dropdown>

                        <Dropdown>
                          <Dropdown.Toggle variant="outline-secondary" style={{ minWidth: '150px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            {selectedLabel}
                            <ChevronDown size={16} />
                          </Dropdown.Toggle>
                          <Dropdown.Menu>
                            <Dropdown.Item onClick={() => setSelectedLabel("All Labels")}>
                              All Labels
                            </Dropdown.Item>
                            {labels.map((label) => (
                              <Dropdown.Item key={label.id} onClick={() => setSelectedLabel(label.name)}>
                                {label.name}
                              </Dropdown.Item>
                            ))}
                          </Dropdown.Menu>
                        </Dropdown>

                        <Dropdown>
                          <Dropdown.Toggle variant="outline-secondary" style={{ minWidth: '150px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            {selectedDate}
                            <ChevronDown size={16} />
                          </Dropdown.Toggle>
                          <Dropdown.Menu>
                            <Dropdown.Item onClick={() => setSelectedDate("All Dates")}>
                              All Dates
                            </Dropdown.Item>
                            <Dropdown.Item onClick={() => setSelectedDate("Today")}>
                              Today
                            </Dropdown.Item>
                            <Dropdown.Item onClick={() => setSelectedDate("This Week")}>
                              This Week
                            </Dropdown.Item>
                            <Dropdown.Item onClick={() => setSelectedDate("This Month")}>
                              This Month
                            </Dropdown.Item>
                          </Dropdown.Menu>
                        </Dropdown>

                        <Form.Check
                          type="switch"
                          id="completed-switch"
                          label="Completed"
                          checked={showCompleted}
                          onChange={(e) => setShowCompleted(e.target.checked)}
                          style={{ marginLeft: 'auto' }}
                        />

                        <Button variant="outline-secondary" onClick={clearFilters}>
                          Clear
                        </Button>
                      </div>
                    </Col>
                  </Row>

                  {/* Kanban Board */}
                  <Row>
                    <Col md={12}>
                      <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '16px' }}>
                        {project?.statuses && project.statuses.length > 0 ? (
                          project.statuses
                            .sort((a: any, b: any) => Number(a.order) - Number(b.order))
                            .map((status: any) => {
                              const statusTasks = getTasksByStatus(status.id);
                              return (
                                <div
                                  key={status.id}
                                  style={{
                                    minWidth: '280px',
                                    width: '280px',
                                    backgroundColor: '#f9fafb',
                                    borderRadius: '8px',
                                    padding: '12px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    maxHeight: 'calc(100vh - 400px)',
                                    overflowY: 'auto'
                                  }}
                                >
                                  {/* Column Header */}
                                  <div
                                    style={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                      marginBottom: '12px',
                                      padding: '8px 12px',
                                      borderRadius: '6px',
                                      backgroundColor: status.color + '20'
                                    }}
                                  >
                                    <div className="d-flex align-items-center gap-2">
                                      <div
                                        style={{
                                          width: '12px',
                                          height: '12px',
                                          borderRadius: '50%',
                                          backgroundColor: status.color
                                        }}
                                      />
                                      <span style={{ fontWeight: '600', fontSize: '0.875rem' }}>
                                        {status.name}
                                      </span>
                                      <Badge
                                        bg="secondary"
                                        style={{ fontSize: '0.7rem', padding: '2px 6px' }}
                                      >
                                        {statusTasks.length}
                                      </Badge>
                                    </div>
                                    <Button
                                      variant="link"
                                      className="p-0"
                                      onClick={() => handleOpenCreateTaskModal(status.id)}
                                      style={{
                                        width: '24px',
                                        height: '24px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderRadius: '50%',
                                        backgroundColor: '#3b82f6',
                                        color: 'white',
                                        minWidth: '24px'
                                      }}
                                      title="Add task"
                                    >
                                      <Plus size={14} />
                                    </Button>
                                  </div>

                                  {/* Tasks */}
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {statusTasks.length === 0 ? (
                                      <div
                                        style={{
                                          padding: '24px',
                                          textAlign: 'center',
                                          color: '#9ca3af',
                                          fontSize: '0.875rem'
                                        }}
                                      >
                                        No tasks
                                      </div>
                                    ) : (
                                      statusTasks.map((task: any) => (
                                        <Card
                                          key={task.id}
                                          style={{
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                          }}
                                          onMouseEnter={(e) => {
                                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                          }}
                                          onMouseLeave={(e) => {
                                            e.currentTarget.style.boxShadow = 'none';
                                            e.currentTarget.style.transform = 'translateY(0)';
                                          }}
                                        >
                                          <Card.Body style={{ padding: '12px' }}>
                                            <div className="mb-2">
                                              <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '4px' }}>
                                                {task.task_id || `#${task.id}`}
                                              </div>
                                              <div style={{ fontWeight: '600', fontSize: '0.875rem', marginBottom: '8px' }}>
                                                {task.title}
                                              </div>
                                            </div>

                                            {task.priority && (
                                              <Badge
                                                bg={getPriorityColor(task.priority)}
                                                style={{ fontSize: '0.7rem', marginBottom: '8px' }}
                                              >
                                                {task.priority}
                                              </Badge>
                                            )}

                                            {task.assignees && task.assignees.length > 0 && (
                                              <div className="d-flex gap-1 mb-2">
                                                {task.assignees.slice(0, 3).map((assignee: any, idx: number) => (
                                                  <div
                                                    key={idx}
                                                    style={{
                                                      width: '24px',
                                                      height: '24px',
                                                      borderRadius: '50%',
                                                      backgroundColor: '#667eea',
                                                      color: 'white',
                                                      display: 'flex',
                                                      alignItems: 'center',
                                                      justifyContent: 'center',
                                                      fontSize: '0.7rem',
                                                      fontWeight: '600'
                                                    }}
                                                    title={assignee.extension_number}
                                                  >
                                                    {assignee.extension_number.substring(0, 2).toUpperCase()}
                                                  </div>
                                                ))}
                                                {task.assignees.length > 3 && (
                                                  <div
                                                    style={{
                                                      width: '24px',
                                                      height: '24px',
                                                      borderRadius: '50%',
                                                      backgroundColor: '#e5e7eb',
                                                      color: '#6b7280',
                                                      display: 'flex',
                                                      alignItems: 'center',
                                                      justifyContent: 'center',
                                                      fontSize: '0.7rem',
                                                      fontWeight: '600'
                                                    }}
                                                  >
                                                    +{task.assignees.length - 3}
                                                  </div>
                                                )}
                                              </div>
                                            )}

                                            {task.labels && task.labels.length > 0 && (
                                              <div className="d-flex gap-1 flex-wrap">
                                                {task.labels.map((label: any, idx: number) => (
                                                  <Badge
                                                    key={idx}
                                                    style={{
                                                      backgroundColor: label.color || '#06b6d4',
                                                      color: 'white',
                                                      fontSize: '0.65rem',
                                                      padding: '2px 6px'
                                                    }}
                                                  >
                                                    {label.name}
                                                  </Badge>
                                                ))}
                                              </div>
                                            )}

                                            {task.due_date && (
                                              <div
                                                style={{
                                                  fontSize: '0.75rem',
                                                  color: '#6b7280',
                                                  marginTop: '8px',
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                  gap: '4px'
                                                }}
                                              >
                                                <Calendar size={12} />
                                                {formatDate(task.due_date)}
                                              </div>
                                            )}
                                          </Card.Body>
                                        </Card>
                                      ))
                                    )}
                                  </div>
                                </div>
                              );
                            })
                        ) : (
                          <div className="text-center py-5 text-muted">
                            No statuses found. Please add statuses to the project.
                          </div>
                        )}
                      </div>
                    </Col>
                  </Row>
                </>
              )}
            </Card.Body>
          </Card>
        )}

        {activeTab === "report" && (
          <Card>
            <Card.Body>
              <div className="text-center py-5">
                <FileText size={48} className="text-muted mb-3" />
                <h4 className="text-muted">Coming Soon</h4>
                <p className="text-muted">Reports feature is under development</p>
              </div>
            </Card.Body>
          </Card>
        )}

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
          linkedRecords={project ? [{ id: project.id, type: 'crm' as const, title: project.name, reference: `Project #${project.id}` }] : []}
          project={project ? { id: project.id, name: project.name, icon: '', color: '' } : undefined}
          statuses={project?.statuses?.map((status: any) => ({ id: status.id, name: status.name, icon: '', color: status.color || '' })) || []}
        />
      </Container>
    </React.Fragment>
  );
};

WorkPlannerProjectsDetails.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default WorkPlannerProjectsDetails;
