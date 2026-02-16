import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';
import { X, Calendar, FileText, FolderOpen, Flag, Users, Repeat, Clock, Bell, Plus, Search, Check } from 'lucide-react';
import { listProjects, createRecurringTask, updateRecurringTask } from '@utils/tasks';
import { getAutoTimezone } from '@utils/Helper';
import RichTextEditor from '../../../pages/help-center/partials/RichTextEditor';
import { toast } from 'react-toastify';

interface Extension {
  id: string;
  name: string;
  extension_number?: string;
}

interface UserType {
  id: number;
  name: string;
  initials: string;
}

interface Label {
  id: number;
  name: string;
  color: string;
}

interface Project {
  id: number;
  name: string;
  color: string;
  statuses?: Array<{
    id: number;
    name: string;
    color: string;
    order: string;
    is_default: boolean;
    is_completed: boolean;
  }>;
  labels?: Array<{
    id: number;
    name: string;
    color: string;
    description?: string;
  }>;
}

interface Status {
  id: number;
  name: string;
  icon: string;
  color: string;
}

interface Priority {
  id: number;
  name: string;
  icon: string;
  color: string;
}

type Frequency = '' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
type CustomUnit = 'days' | 'weeks' | 'months' | 'years';

interface CreateRecurringTaskFormData {
  title: string;
  description: string;
  projectId: number | null;
  statusId: number | null;
  priorityId: number | null;
  assigneeIds: number[];
  labelIds: number[];

  frequency: Frequency;
  repeatInterval: number;
  repeatOnDays: string[]; // Weekly selection
  customUnit: CustomUnit;
  customInterval: number;

  startDate: string;
  endDate: string;
  occurrences: string;
  dueTime: string;
  reminderMinutes: string;
}

interface CreateRecurringTaskModalProps {
  show: boolean;
  onHide: () => void;
  onCreate?: (data: CreateRecurringTaskFormData) => void;
  onCreateAndOpen?: (data: CreateRecurringTaskFormData) => void;
  extensions?: Extension[];
  labels?: Label[];
  project?: Project;
  statuses?: Status[];
  task?: any;
  isEdit?: boolean;
  selectedStatusForTask?: number | null;
}

const CreateRecurringTaskModal: React.FC<CreateRecurringTaskModalProps> = ({
  show,
  onHide,
  onCreate,
  onCreateAndOpen,
  extensions = [],
  labels: propLabels = [],
  project: propProject,
  statuses: propStatuses = [],
  task: editTask,
  isEdit = false,
  selectedStatusForTask = null,
}) => {
  const mapPriorityStringToId = (priority: string | null | undefined): number => {
    const priorityMap: Record<string, number> = {
      low: 1,
      normal: 2,
      medium: 2,
      high: 3,
      urgent: 4,
    };
    return priorityMap[String(priority || 'normal').toLowerCase()] || 2;
  };

  const formatDateForInput = (dateString: string | null | undefined): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch {
      return '';
    }
  };

  const getInitialFormData = (): CreateRecurringTaskFormData => {
    if (isEdit && editTask) {
      const assigneeIds =
        editTask.assignees?.map((assignee: any) => {
          const extension = extensions.find((ext: any) => ext.id === assignee.extension_number || ext.extension_number === assignee.extension_number);
          return extension ? Number(extension.id) : Number(assignee.extension_number);
        }) ||
        editTask.extension_numbers?.map((extNum: string) => {
          const extension = extensions.find((ext: any) => ext.id === extNum || ext.extension_number === extNum);
          return extension ? Number(extension.id) : Number(extNum);
        }) ||
        [];

      const freq: Frequency = (editTask.frequency ? String(editTask.frequency).toLowerCase() : '') as Frequency;

      // Only read frequency_config for custom frequency
      const config = freq === 'custom' ? editTask.frequency_config || {} : {};
      const repeatInterval = Number(editTask.repeat_interval || 1);

      const repeatOnDays: string[] = (() => {
        // Prefer explicit repeat_on (comma separated) if present
        if (editTask.repeat_on && typeof editTask.repeat_on === 'string') {
          return editTask.repeat_on
            .split(',')
            .map((s: string) => s.trim())
            .filter(Boolean);
        }
        if (Array.isArray(config.days_of_week)) return config.days_of_week;
        if (config.day_of_week) return [String(config.day_of_week)];
        return [];
      })();

      return {
        title: editTask.title || '',
        description: editTask.description || '',
        projectId: editTask.project_id || editTask.project?.id || null,
        statusId: editTask.status_id || editTask.status?.id || selectedStatusForTask || null,
        priorityId: mapPriorityStringToId(editTask.priority),
        assigneeIds,
        labelIds: editTask.label_ids || editTask.labels?.map((l: any) => l.id) || [],

        frequency: freq,
        repeatInterval: freq === 'custom' ? 1 : repeatInterval > 0 ? repeatInterval : 1,
        repeatOnDays,
        customUnit: (freq === 'custom' && config.unit ? String(config.unit).toLowerCase() : 'days') as CustomUnit,
        customInterval: freq === 'custom' ? Number(config.interval || 1) || 1 : 1,

        startDate: formatDateForInput(editTask.start_date || editTask.due_date),
        endDate: formatDateForInput(editTask.end_date),
        occurrences: editTask.occurrences ? String(editTask.occurrences) : '',
        dueTime: (() => {
          const due = editTask.due_time || '';
          if (typeof due !== 'string') return '';
          // API may return full datetime like "2026-02-01T09:00:00" or a time like "09:00"
          if (due.includes('T')) {
            const timePart = due.split('T')[1] || '';
            return timePart.slice(0, 5);
          }
          return due.slice(0, 5);
        })(),
        reminderMinutes: editTask.reminder_minutes ? String(editTask.reminder_minutes) : '',
      };
    }

    const today = new Date().toISOString().split('T')[0];

    return {
      title: '',
      description: '',
      projectId: propProject?.id || null,
      statusId: selectedStatusForTask || (propStatuses.length > 0 ? propStatuses[0].id : null),
      priorityId: 0,
      assigneeIds: [],
      labelIds: [],

      frequency: '',
      repeatInterval: 1,
      repeatOnDays: [],
      customUnit: 'days',
      customInterval: 1,

      startDate: today,
      endDate: '',
      occurrences: '',
      dueTime: '',
      reminderMinutes: '',
    };
  };

  const [formData, setFormData] = useState<CreateRecurringTaskFormData>(getInitialFormData());
  const [fetchedProjects, setFetchedProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assigneeSearchQuery, setAssigneeSearchQuery] = useState('');
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);

  const users: UserType[] = useMemo(
    () =>
      extensions.map(ext => ({
        id: Number(ext.id),
        name: ext.name,
        initials: String(ext.name || '')
          .split(' ')
          .filter(Boolean)
          .map(n => n[0])
          .join('')
          .substring(0, 2)
          .toUpperCase(),
      })),
    [extensions]
  );

  useEffect(() => {
    const fetchProjects = async () => {
      if (!show) return;
      try {
        setLoadingProjects(true);
        const response = await listProjects({ page: 1, limit: 100 });
        if (response && response.success === true && response.data && Array.isArray(response.data)) {
          const projectsList = response.data.map((project: any) => ({
            id: project.id,
            name: project.name,
            color: project.color || '#3b82f6',
            statuses: project.statuses || [],
            labels: project.labels || [],
          }));
          setFetchedProjects(projectsList);
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
        setFetchedProjects([]);
      } finally {
        setLoadingProjects(false);
      }
    };

    fetchProjects();
  }, [show]);

  useEffect(() => {
    if (!show) return;
    // Wait for projects if editing (so status/project mapping stays stable)
    if (isEdit && editTask && fetchedProjects.length === 0 && loadingProjects) return;
    setFormData(getInitialFormData());
  }, [show, editTask, isEdit, fetchedProjects, loadingProjects, selectedStatusForTask]);

  const projects: Project[] = fetchedProjects.length > 0 ? fetchedProjects : propProject ? [propProject] : [];

  const statuses: Status[] = useMemo(() => {
    if (!formData.projectId) return propStatuses;
    const selectedProject = fetchedProjects.find(p => p.id === formData.projectId);
    if (selectedProject && Array.isArray(selectedProject.statuses)) {
      return selectedProject.statuses.map((status: any) => ({
        id: status.id,
        name: status.name,
        icon: '',
        color: status.color || '#3b82f6',
      }));
    }
    return propStatuses;
  }, [formData.projectId, fetchedProjects, propStatuses]);

  const labels: Label[] = useMemo(() => {
    if (!formData.projectId) return propLabels;
    const selectedProject = fetchedProjects.find(p => p.id === formData.projectId);
    if (selectedProject && Array.isArray(selectedProject.labels)) {
      return selectedProject.labels.map((label: any) => ({
        id: label.id,
        name: label.name,
        color: label.color || '#3b82f6',
      }));
    }
    return propLabels;
  }, [formData.projectId, fetchedProjects, propLabels]);

  const priorities: Priority[] = [
    { id: 0, name: 'Select Priority', icon: '', color: '#6c757d' },
    { id: 1, name: 'Low', icon: '🟢', color: '#10b981' },
    { id: 2, name: 'Medium', icon: '🟡', color: '#eab308' },
    { id: 3, name: 'High', icon: '🟠', color: '#f97316' },
    { id: 4, name: 'Urgent', icon: '🔴', color: '#ef4444' },
  ];

  const mapPriorityIdToString = (priorityId: number | null): string | undefined => {
    if (!priorityId || priorityId === 0) return '';
    const priorityMap: Record<number, string> = { 1: 'low', 2: 'normal', 3: 'high', 4: 'urgent' };
    return priorityMap[priorityId] || undefined;
  };

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const toggleRepeatOnDay = (day: string) => {
    setFormData(prev => ({
      ...prev,
      // Backend payload uses a single `repeat_on` string (e.g. "monday"), so enforce single selection
      repeatOnDays: prev.repeatOnDays.includes(day) ? [] : [day],
    }));
  };

  const toggleLabel = (labelId: number) => {
    setFormData(prev => ({
      ...prev,
      labelIds: prev.labelIds.includes(labelId) ? prev.labelIds.filter(id => id !== labelId) : [...prev.labelIds, labelId],
    }));
  };

  const toggleAssignee = (userId: number) => {
    setFormData(prev => ({
      ...prev,
      assigneeIds: prev.assigneeIds.includes(userId) ? prev.assigneeIds.filter(id => id !== userId) : [...prev.assigneeIds, userId],
    }));
  };

  const selectedLabels = labels.filter(l => formData.labelIds.includes(l.id));
  const selectedAssignees = users.filter(u => formData.assigneeIds.includes(u.id));

  const handleSubmit = async (openAfterCreate: boolean) => {
    if (isSubmitting) return;

    if (!formData.title.trim()) {
      toast.error('Please enter a task title');
      return;
    }
    
  
    if (!formData.frequency) {
      toast.error('Please select a frequency');
      return;
    }
    if (!formData.startDate) {
      toast.error('Please select a start date');
      return;
    }

    const interval = Math.max(1, Number((formData.frequency === 'custom' ? formData.customInterval : formData.repeatInterval) || 1));

    const reminderMinutes = formData.reminderMinutes.trim() ? Number(formData.reminderMinutes) : null;
    const occurrences =
      formData.occurrences && String(formData.occurrences).trim()
        ? Number(String(formData.occurrences).trim())
        : null;

    const extension_numbers =
      formData.assigneeIds?.map((id: number) => {
        const extension = extensions.find((ext: any) => Number(ext.id) === id);
        return extension ? extension.id : String(id);
      }) || [];

    const timezone = getAutoTimezone();

    const dueTimeDateTime = (() => {
      // Payload format: "YYYY-MM-DDTHH:mm:ss" (date is same as start_date)
      if (!formData.dueTime || !formData.startDate) return undefined;
      const time = String(formData.dueTime).slice(0, 5);
      if (!time) return undefined;
      return `${formData.startDate}T${time}:00`;
    })();

    const repeatOnLower = (() => {
      if (formData.frequency !== 'weekly') return undefined;
      const selected = formData.repeatOnDays?.[0];
      if (!selected) return undefined; // weekly with no fixed weekday
      return String(selected).toLowerCase();
    })();

    const payload: any = {
      title: formData.title,
      description: formData.description || '',
      timezone,
      frequency: formData.frequency,
      repeat_interval: formData.frequency === 'custom' ? undefined : interval,
      repeat_on: repeatOnLower,
      start_date: formData.startDate,
      end_date: formData.endDate ? formData.endDate : null,
      due_time: dueTimeDateTime,
      reminder_minutes: reminderMinutes && Number.isFinite(reminderMinutes) && reminderMinutes >= 0 ? reminderMinutes : undefined,
      occurrences: occurrences && Number.isFinite(occurrences) && occurrences >= 1 ? occurrences : undefined,
      priority: mapPriorityIdToString(formData.priorityId) || undefined,
      project_id: formData.projectId,
      status_id: formData.statusId,
      extension_numbers,
      label_ids: formData.labelIds || [],
      type: 'recurring',
    };

    if (formData.frequency === 'custom') {
      payload.frequency_config = {
        unit: formData.customUnit,
        interval,
      };
    }

    try {
      setIsSubmitting(true);
      if (isEdit && editTask?.id) {
        const result = await updateRecurringTask(editTask.id, payload);
        if (result) {
          if (openAfterCreate) onCreateAndOpen?.(formData);
          else onCreate?.(formData);
          onHide();
        }
      } else {
        const result = await createRecurringTask(payload);
        if (result) {
          if (openAfterCreate) onCreateAndOpen?.(formData);
          else onCreate?.(formData);
          onHide();
        }
      }
    } catch (error) {
      console.error(`Error ${isEdit ? 'updating' : 'creating'} recurring task:`, error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered size="lg" className="create-task-modal">
      <Modal.Header
        style={{
          borderBottom: '1px solid #e8eef5',
          paddingBottom: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Modal.Title
          style={{
            fontSize: '18px',
            fontWeight: '600',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#4e6fa5 !important',

          }}
        >
          <Repeat size={20} color="#4e6fa5" />
          {isEdit ? 'Edit Recurring' : 'Create Recurring'}
        </Modal.Title>
        <Button
          variant="link"
          onClick={onHide}
          style={{
            background: 'none',
            border: 'none',
            padding: '4px',
            cursor: 'pointer',
            color: '#6c757d',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <X size={20} />
        </Button>
      </Modal.Header>

      <Modal.Body className="py-4">
        {/* Title */}
        <Form.Group className="mb-3">
          <Form.Label className="fw-semibold mb-2" style={{ fontSize: '14px', color: '#2d3748' }}>
            <FileText size={16} className="me-2" style={{ verticalAlign: 'middle' }} />
            Title <span style={{ color: '#ef4444' }}>*</span>
          </Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter task title"
            value={formData.title}
            onChange={e => setFormData({ ...formData, title: e.target.value })}
            className="py-2"
            style={{ fontSize: '14px' }}
            required
          />
        </Form.Group>

        {/* Description */}
        <Form.Group className="mb-3">
          <Form.Label className="fw-semibold mb-2" style={{ fontSize: '14px', color: '#2d3748' }}>
            <FileText size={16} className="me-2" style={{ verticalAlign: 'middle' }} />
            Description
          </Form.Label>
          <RichTextEditor
            value={formData.description || ''}
            onChange={(html: string) => setFormData({ ...formData, description: html })}
            placeholder="Describe the task..."
            minHeight="100px"
            maxHeight="200px"
            maxLength={5000}
          />
        </Form.Group>

        {/* Project / Status / Priority */}
        <Row className="mb-3">
          <Col xs={12} md={6} className="mb-3 mb-md-0">
            <Form.Group>
              <Form.Label className="fw-semibold mb-2" style={{ fontSize: '14px', color: '#2d3748' }}>
                <FolderOpen size={16} className="me-2" style={{ verticalAlign: 'middle' }} />
                Project <span style={{ color: '#ef4444' }}>*</span>
              </Form.Label>
              <Form.Select
                value={formData.projectId || ''}
                onChange={e => setFormData({ ...formData, projectId: Number(e.target.value) || null, statusId: null })}
                className="py-2"
                style={{ fontSize: '14px' }}
                disabled={loadingProjects || projects.length === 0}
              >
                {loadingProjects ? (
                  <option value="">Loading projects...</option>
                ) : projects.length === 0 ? (
                  <option value="">No projects available</option>
                ) : (
                  <>
                    <option value="">Select project</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </>
                )}
              </Form.Select>
            </Form.Group>
          </Col>

          <Col xs={12} md={6}>
            <Form.Group>
              <Form.Label className="fw-semibold mb-2" style={{ fontSize: '14px', color: '#2d3748' }}>
                <Flag size={16} className="me-2" style={{ verticalAlign: 'middle' }} />
                Priority
              </Form.Label>
              <Form.Select
                value={formData.priorityId || 0}
                onChange={e => setFormData({ ...formData, priorityId: Number(e.target.value) })}
                className="py-2"
                style={{ fontSize: '14px' }}
              >
                {priorities.map(priority => (
                  <option key={priority.id} value={priority.id}>
                    {priority.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>

        <Row className="mb-3">
          <Col xs={12} md={6} className="mb-3 mb-md-0">
            <Form.Group>
              <Form.Label className="fw-semibold mb-2" style={{ fontSize: '14px', color: '#2d3748' }}>
                <FileText size={16} className="me-2" style={{ verticalAlign: 'middle' }} />
                Status <span style={{ color: '#ef4444' }}>*</span>
              </Form.Label>
              <Form.Select
                value={formData.statusId || ''}
                onChange={e => setFormData({ ...formData, statusId: Number(e.target.value) || null })}
                className="py-2"
                style={{ fontSize: '14px' }}
                disabled={!formData.projectId || statuses.length === 0}
              >
                {!formData.projectId ? (
                  <option value="">Select a project first</option>
                ) : statuses.length === 0 ? (
                  <option value="">No statuses available</option>
                ) : (
                  <>
                    <option value="">Select status</option>
                    {statuses.map(status => (
                      <option key={status.id} value={status.id}>
                        {status.name}
                      </option>
                    ))}
                  </>
                )}
              </Form.Select>
            </Form.Group>
          </Col>

          <Col xs={12} md={6}>
            <Form.Group>
              <Form.Label className="fw-semibold mb-2" style={{ fontSize: '14px', color: '#2d3748' }}>
                <Bell size={16} className="me-2" style={{ verticalAlign: 'middle' }} />
                Reminder (minutes before)
              </Form.Label>
              <Form.Control
                type="number"
                min={0}
                placeholder="e.g. 15"
                value={formData.reminderMinutes}
                onChange={e => setFormData({ ...formData, reminderMinutes: e.target.value })}
                className="py-2"
                style={{ fontSize: '14px' }}
              />
            </Form.Group>
          </Col>
        </Row>

        {/* Recurrence */}
        <div className="border rounded p-3 mb-3" style={{ backgroundColor: '#f8fafc' }}>
          <div className="fw-semibold mb-2" style={{ fontSize: '14px', color: '#2d3748', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Repeat size={16} />
            Recurrence
          </div>

          <Row className="mb-3">
            <Col xs={12} md={6} className="mb-3 mb-md-0">
              <Form.Group>
                <Form.Label className="fw-semibold mb-2" style={{ fontSize: '14px', color: '#2d3748' }}>
                  Frequency <span style={{ color: '#ef4444' }}>*</span>
                </Form.Label>
                <Form.Select
                  value={formData.frequency}
                  required
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      frequency: e.target.value as Frequency,
                      repeatInterval: 1,
                      repeatOnDays: [],
                      customUnit: 'days',
                      customInterval: 1,
                    }))
                  }
                  className="py-2"
                  style={{ fontSize: '14px' }}
                >
                 <option value="">Select Frequency</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                  <option value="custom">Custom</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col xs={12} md={6}>
              <Form.Group>
                <Form.Label className="fw-semibold mb-2" style={{ fontSize: '14px', color: '#2d3748' }}>
                  Occurrences (leave empty for no limit)
                </Form.Label>
                <Form.Control
                  type="number"
                  min={1}
                  placeholder="e.g. 10"
                  value={formData.occurrences}
                  onChange={e => setFormData({ ...formData, occurrences: e.target.value })}
                  className="py-2"
                  style={{ fontSize: '14px' }}
                />
              </Form.Group>
            </Col>
            </Row>
            <Row className="mb-3">

            <Col xs={12} md={6}>
              <Form.Group>
                <Form.Label className="fw-semibold mb-2" style={{ fontSize: '14px', color: '#2d3748' }}>
                  Start Date <span style={{ color: '#ef4444' }}>*</span>
                </Form.Label>
                <Form.Control
                  type="date"
                  value={formData.startDate}
                  onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                  className="py-2"
                  style={{ fontSize: '14px' }}
                />
              </Form.Group>
            </Col>
          
            <Col xs={12} md={6} className="mb-3 mb-md-0">
              <Form.Group>
                <Form.Label className="fw-semibold mb-2" style={{ fontSize: '14px', color: '#2d3748' }}>
                  End Date
                </Form.Label>
                <Form.Control
                  type="date"
                  value={formData.endDate}
                  min={formData.startDate || undefined}
                  onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                  className="py-2"
                  style={{ fontSize: '14px' }}
                />
              </Form.Group>
            </Col>

            
          </Row>

          <Row className="mb-3">
            <Col xs={12} md={6} className="mb-3 mb-md-0">
              <Form.Group>
                <Form.Label className="fw-semibold mb-2" style={{ fontSize: '14px', color: '#2d3748' }}>
                  <Clock size={16} className="me-2" style={{ verticalAlign: 'middle' }} />
                  Due Time
                </Form.Label>
                <Form.Control
                  type="time"
                  value={formData.dueTime}
                  onChange={e => setFormData({ ...formData, dueTime: e.target.value })}
                  className="py-2"
                  style={{ fontSize: '14px' }}
                />
              </Form.Group>
            </Col>

            <Col xs={12} md={6}>
              {/* Repeat Interval / Unit */}
              {formData.frequency === 'custom' ? (
                <Row>
                  <Col xs={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold mb-2" style={{ fontSize: '14px', color: '#2d3748' }}>
                        Unit
                      </Form.Label>
                      <Form.Select
                        value={formData.customUnit}
                        onChange={e => setFormData({ ...formData, customUnit: e.target.value as CustomUnit })}
                        className="py-2"
                        style={{ fontSize: '14px' }}
                      >
                        <option value="days">Days</option>
                        <option value="weeks">Weeks</option>
                        <option value="months">Months</option>
                        <option value="years">Yearly</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col xs={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold mb-2" style={{ fontSize: '14px', color: '#2d3748' }}>
                        Interval (min 1)
                      </Form.Label>
                      <Form.Control
                        type="number"
                        min={1}
                        value={formData.customInterval}
                        onChange={e => setFormData({ ...formData, customInterval: Math.max(1, Number(e.target.value || 1)) })}
                        className="py-2"
                        style={{ fontSize: '14px' }}
                      />
                    </Form.Group>
                  </Col>
                </Row>
              ) : (
                <Form.Group>
                  <Form.Label className="fw-semibold mb-2" style={{ fontSize: '14px', color: '#2d3748' }}>
                    Repeat Interval (min 1)
                  </Form.Label>
                  <Form.Control
                    type="number"
                    min={0}
                    value={formData.repeatInterval}
                    onChange={e => setFormData({ ...formData, repeatInterval: Math.max(0, Number(e.target.value || 0)) })}
                    className="py-2"
                    style={{ fontSize: '14px' }}
                    placeholder={
                      formData.frequency === 'daily'
                        ? 'Repeat every N daily'
                        : formData.frequency === 'monthly'
                          ? 'Repeat every N monthly'
                          : formData.frequency === 'yearly'
                            ? 'Repeat every N yearly'
                            : formData.frequency === 'weekly'
                              ? 'Repeat every N weekly'
                              : 'Repeat every N'
                    }
                  />
                </Form.Group>
              )}
            </Col>
          </Row>

          {formData.frequency === 'weekly' && (
            <div className="mt-2">
              <div className="fw-semibold mb-2" style={{ fontSize: '14px', color: '#2d3748' }}>
                Repeat On
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {daysOfWeek.map(day => {
                  const selected = formData.repeatOnDays.includes(day);
                  return (
                    <div
                      key={day}
                      onClick={() => toggleRepeatOnDay(day)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        border: selected ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                        backgroundColor: selected ? '#edf6ff' : '#ffffff',
                        cursor: 'pointer',
                        fontSize: '13px',
                        userSelect: 'none',
                      }}
                    >
                      {day}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Assignees */}
        <Form.Group className="mb-3">
          <Form.Label className="fw-semibold mb-2" style={{ fontSize: '14px', color: '#2d3748' }}>
            <Users size={16} className="me-2" style={{ verticalAlign: 'middle' }} />
            Assignees
          </Form.Label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
            {selectedAssignees.map(user => (
              <div
                key={user.id}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  backgroundColor: '#edf6ff',
                  border: '1px solid #bfdbfe',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                }}
                onClick={() => toggleAssignee(user.id)}
              >
                <span style={{ color: '#2d3748', fontWeight: '500' }}>{user.name}</span>
                <X size={14} style={{ color: '#64748b' }} />
              </div>
            ))}

            <Button
              variant="light"
              size="sm"
              onClick={() => {
                setShowAssigneeDropdown(!showAssigneeDropdown);
                if (!showAssigneeDropdown) {
                  setAssigneeSearchQuery('');
                }
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                fontSize: '0.875rem',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
              }}
            >
              <Plus size={14} />
              Add Assignee
            </Button>
          </div>

          {/* Assignee Dropdown */}
          {showAssigneeDropdown && (
            <div
              className="border rounded"
              style={{
                backgroundColor: '#f8fafc',
                maxHeight: '300px',
                overflowY: 'auto',
              }}
            >
              {/* Search Input */}
              <div className="p-2 border-bottom" style={{ backgroundColor: 'white' }}>
                <div className="position-relative">
                  <Search
                    size={16}
                    className="position-absolute text-muted"
                    style={{ left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                  />
                  <Form.Control
                    type="text"
                    placeholder="Search assignees..."
                    value={assigneeSearchQuery}
                    onChange={e => setAssigneeSearchQuery(e.target.value)}
                    className="py-2"
                    style={{
                      paddingLeft: '40px',
                      fontSize: '14px',
                    }}
                    autoFocus
                  />
                </div>
              </div>

              {/* Filtered Users List */}
              {(() => {
                const filteredUsers = users.filter(user => user.name.toLowerCase().includes(assigneeSearchQuery.toLowerCase()));

                return filteredUsers.length === 0 ? (
                  <div className="p-3 text-center text-muted" style={{ fontSize: '14px' }}>
                    {assigneeSearchQuery ? 'No assignees found' : 'No extensions available'}
                  </div>
                ) : (
                  filteredUsers.map(user => (
                    <div
                      key={user.id}
                      className="d-flex align-items-center justify-content-between p-3 border-bottom cursor-pointer"
                      style={{
                        cursor: 'pointer',
                        backgroundColor: formData.assigneeIds.includes(user.id) ? '#edf6ff' : 'white',
                        transition: 'background-color 0.2s',
                      }}
                      onClick={() => {
                        toggleAssignee(user.id);
                        setShowAssigneeDropdown(false);
                        setAssigneeSearchQuery('');
                      }}
                      onMouseEnter={e => {
                        if (!formData.assigneeIds.includes(user.id)) {
                          e.currentTarget.style.backgroundColor = '#f8fafc';
                        }
                      }}
                      onMouseLeave={e => {
                        if (!formData.assigneeIds.includes(user.id)) {
                          e.currentTarget.style.backgroundColor = 'white';
                        }
                      }}
                    >
                      <span style={{ fontSize: '14px', color: '#2d3748', fontWeight: '500' }}>{user.name}</span>
                      {formData.assigneeIds.includes(user.id) && <Check size={18} className="text-primary" style={{ flexShrink: 0 }} />}
                    </div>
                  ))
                );
              })()}
            </div>
          )}
        </Form.Group>

        {/* Labels */}
        <Form.Group className="mb-3">
          <Form.Label className="fw-semibold mb-2" style={{ fontSize: '14px', color: '#2d3748' }}>
            <Calendar size={16} className="me-2" style={{ verticalAlign: 'middle' }} />
            Labels
          </Form.Label>
          {selectedLabels.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
              {selectedLabels.map(label => (
                <div
                  key={label.id}
                  className="d-inline-flex align-items-center gap-2 px-3 py-2"
                  style={{
                    backgroundColor: label.color,
                    color: '#2d3748',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    border: 'none',
                    borderRadius: '0.375rem',
                  }}
                  onClick={() => toggleLabel(label.id)}
                >
                  {label.name} <X size={12} />
                </div>
              ))}
            </div>
          )}

          <div className="border rounded p-3" style={{ backgroundColor: '#f8fafc', maxHeight: '140px', overflowY: 'auto' }}>
            {labels.length === 0 ? (
              <div className="text-center text-muted" style={{ fontSize: '14px' }}>
                No labels available
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {labels.map(label => (
                  <div
                    key={label.id}
                    style={{
                      backgroundColor: formData.labelIds.includes(label.id) ? label.color : '#ffffff',
                      color: '#2d3748',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      padding: '6px 12px',
                      cursor: 'pointer',
                      border: formData.labelIds.includes(label.id) ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                      borderRadius: '0.375rem',
                      transition: 'all 0.2s',
                      userSelect: 'none',
                    }}
                    onClick={() => toggleLabel(label.id)}
                  >
                    {label.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Form.Group>
      </Modal.Body>

      <Modal.Footer
        style={{
          borderTop: '1px solid #e8eef5',
          paddingTop: '16px',
          display: 'flex',
          gap: '8px',
          justifyContent: 'flex-end',
        }}
      >
        <Button
          variant="light"
          onClick={onHide}
          style={{
            padding: '8px 20px',
            fontSize: '14px',
            fontWeight: '600',
            border: '1px solid #e2e8f0',
          }}
        >
          Cancel
        </Button>

        <Button
          variant="primary"
          type="button"
          onClick={() => handleSubmit(false)}
          disabled={isSubmitting}
          style={{
            padding: '8px 20px',
            fontSize: '14px',
            fontWeight: '600',
            backgroundColor: '#4e6fa5',
            borderColor: '#4e6fa5',
          }}
        >
          {isSubmitting ? 'Processing...' : isEdit ? 'Update' : 'Create'}
        </Button>
      </Modal.Footer>

      <style>{`
        .create-task-modal .modal-header .btn-close {
          display: none;
        }
      `}</style>
    </Modal>
  );
};

export default CreateRecurringTaskModal;

