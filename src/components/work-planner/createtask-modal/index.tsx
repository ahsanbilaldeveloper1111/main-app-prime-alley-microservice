import React, { useState } from 'react';
import { Modal, Button, Form, Row, Col, Badge } from 'react-bootstrap';
import { 
  X, 
  Calendar, 
  User, 
  FileText, 
  Tag,
  Users,
  Flag,
  ListTodo,
  Plus,
  Search,
  Link as LinkIcon,
  FolderOpen,
  Circle,
  AlertCircle,
  Check,
  Ticket,
  FileSpreadsheet,
  Phone
} from 'lucide-react';

interface CreateTaskModalProps {
  show: boolean;
  onHide: () => void;
  onCreate?: (data: CreateTaskFormData) => void;
  onCreateAndOpen?: (data: CreateTaskFormData) => void;
}

interface UserType {
  id: number;
  name: string;
  avatar: string;
  initials: string;
}

interface Project {
  id: number;
  name: string;
  icon: string;
  color: string;
}

interface Label {
  id: number;
  name: string;
  color: string;
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

interface LinkedRecord {
  id: number;
  type: 'crm' | 'call' | 'ticket' | 'invoice';
  title: string;
  reference: string;
}

interface ActivityEntry {
  id: number;
  user: UserType;
  action: string;
  timestamp: Date;
  type: 'assignment' | 'comment';
  content?: string;
}

interface CreateTaskFormData {
  title: string;
  description: string;
  projectId: number | null;
  statusId: number | null;
  priorityId: number | null;
  assigneeIds: number[];
  dueDate: string;
  labelIds: number[];
  linkedRecordIds: number[];
}

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  show,
  onHide,
  onCreate,
  onCreateAndOpen
}) => {
  const [formData, setFormData] = useState<CreateTaskFormData>({
    title: '',
    description: '',
    projectId: 1,
    statusId: 1,
    priorityId: 2,
    assigneeIds: [1, 2, 3],
    dueDate: '',
    labelIds: [1, 2, 3, 4],
    linkedRecordIds: []
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);

  // Sample data
  const users: UserType[] = [
    { id: 1, name: "John D.", avatar: "/avatars/john.jpg", initials: "JD" },
    { id: 2, name: "Sarah M.", avatar: "/avatars/sarah.jpg", initials: "SM" },
    { id: 3, name: "Emily R.", avatar: "/avatars/emily.jpg", initials: "ER" },
    { id: 4, name: "Michael B.", avatar: "/avatars/michael.jpg", initials: "MB" },
    { id: 5, name: "Jessica L.", avatar: "/avatars/jessica.jpg", initials: "JL" }
  ];

  const projects: Project[] = [
    { id: 1, name: "Website Redesign", icon: "🔵", color: "#3b82f6" },
    { id: 2, name: "Mobile App Development", icon: "🔵", color: "#3b82f6" },
    { id: 3, name: "Marketing Campaign", icon: "🟡", color: "#eab308" },
    { id: 4, name: "IT Infrastructure", icon: "🟢", color: "#10b981" },
    { id: 5, name: "Client Portal", icon: "🟣", color: "#a855f7" },
    { id: 6, name: "Customer Support", icon: "🟠", color: "#f97316" },
    { id: 7, name: "Product Launch", icon: "🔵", color: "#3b82f6" },
    { id: 8, name: "CRM Upgrade", icon: "🟣", color: "#a855f7" }
  ];

  const statuses: Status[] = [
    { id: 1, name: "To Do", icon: "🔵", color: "#3b82f6" },
    { id: 2, name: "In Progress", icon: "🟡", color: "#eab308" },
    { id: 3, name: "In Review", icon: "🟣", color: "#a855f7" },
    { id: 4, name: "Completed", icon: "🟢", color: "#10b981" },
    { id: 5, name: "On Hold", icon: "🔴", color: "#ef4444" },
    { id: 6, name: "Blocked", icon: "⚫", color: "#64748b" }
  ];

  const priorities: Priority[] = [
    { id: 1, name: "Low", icon: "🟢", color: "#10b981" },
    { id: 2, name: "Medium", icon: "🟡", color: "#eab308" },
    { id: 3, name: "High", icon: "🟠", color: "#f97316" },
    { id: 4, name: "Urgent", icon: "🔴", color: "#ef4444" }
  ];

  const labels: Label[] = [
    { id: 1, name: "UI/UX", color: "#E8D5FF" },
    { id: 2, name: "Bug", color: "#FFD1D1" },
    { id: 3, name: "Customer", color: "#C7E3FF" },
    { id: 4, name: "CRM", color: "#FFE5B8" },
    { id: 5, name: "Frontend", color: "#C1F5D0" },
    { id: 6, name: "Backend", color: "#FFDAA8" },
    { id: 7, name: "Database", color: "#DFC7FF" },
    { id: 8, name: "API", color: "#B8F0E8" },
    { id: 9, name: "Documentation", color: "#FFF4C7" },
    { id: 10, name: "Testing", color: "#FFD0E8" }
  ];

  const linkedRecords: LinkedRecord[] = [
    { id: 1, type: 'crm', title: 'Ahmad Hasan', reference: 'Lead' },
    { id: 2, type: 'ticket', title: 'Support Ticket #2145', reference: '#21AM - Website Redesign' },
    { id: 3, type: 'invoice', title: 'Invoice #1023', reference: 'Invoices' },
    { id: 4, type: 'call', title: 'Call with Ahmad', reference: 'Today, 9:00 AM' }
  ];

  const activities: ActivityEntry[] = [
    {
      id: 1,
      user: { id: 1, name: "Teddy", avatar: "/avatars/teddy.jpg", initials: "TD" },
      action: "assigned John D.",
      timestamp: new Date('2024-04-22'),
      type: 'assignment'
    },
    {
      id: 2,
      user: { id: 2, name: "Sarah M.", avatar: "/avatars/sarah.jpg", initials: "SM" },
      action: "",
      timestamp: new Date('2024-04-22'),
      type: 'comment',
      content: "@John D. Can you take a look at this issue?"
    }
  ];

  const handleCreate = () => {
    if (!formData.title.trim()) {
      alert('Please enter a task title');
      return;
    }
    if (onCreate) {
      onCreate(formData);
    }
    onHide();
  };

  const handleCreateAndOpen = () => {
    if (!formData.title.trim()) {
      alert('Please enter a task title');
      return;
    }
    if (onCreateAndOpen) {
      onCreateAndOpen(formData);
    }
    onHide();
  };

  const toggleLabel = (labelId: number) => {
    setFormData(prev => ({
      ...prev,
      labelIds: prev.labelIds.includes(labelId)
        ? prev.labelIds.filter(id => id !== labelId)
        : [...prev.labelIds, labelId]
    }));
  };

  const toggleAssignee = (userId: number) => {
    setFormData(prev => ({
      ...prev,
      assigneeIds: prev.assigneeIds.includes(userId)
        ? prev.assigneeIds.filter(id => id !== userId)
        : [...prev.assigneeIds, userId]
    }));
  };

  const selectedProject = projects.find(p => p.id === formData.projectId);
  const selectedStatus = statuses.find(s => s.id === formData.statusId);
  const selectedPriority = priorities.find(p => p.id === formData.priorityId);
  const selectedAssignees = users.filter(u => formData.assigneeIds.includes(u.id));
  const selectedLabels = labels.filter(l => formData.labelIds.includes(l.id));

  return (
    <Modal 
      show={show} 
      onHide={onHide} 
      centered 
      size="lg"
      className="create-task-modal"
    >
      <Modal.Header style={{ 
        borderBottom: '1px solid #e8eef5',
        paddingBottom: '16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Modal.Title style={{ 
          fontSize: '18px', 
          fontWeight: '600',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <ListTodo size={20} color="#4e6fa5" />
          Create Task
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
            alignItems: 'center'
          }}
        >
          <X size={20} />
        </Button>
      </Modal.Header>

      <Modal.Body className="py-4">
        {/* Title Field - Required */}
        <Form.Group className="mb-3">
          <Form.Label className="fw-semibold mb-2" style={{ fontSize: '14px', color: '#2d3748' }}>
            <FileText size={16} className="me-2" style={{ verticalAlign: 'middle' }} />
            Title <span style={{ color: '#ef4444' }}>*</span>
          </Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter task title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="py-2"
            style={{ fontSize: '14px' }}
            required
          />
        </Form.Group>

        {/* Description Field */}
        <Form.Group className="mb-3">
          <Form.Label className="fw-semibold mb-2" style={{ fontSize: '14px', color: '#2d3748' }}>
            <FileText size={16} className="me-2" style={{ verticalAlign: 'middle' }} />
            Description
          </Form.Label>
          <Form.Control
            as="textarea"
            rows={2}
            placeholder="Describe the task..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="py-2"
            style={{ fontSize: '14px', resize: 'vertical' }}
          />
        </Form.Group>

        {/* Project and Assignees Row */}
        <Row className="mb-3">
          <Col xs={12} md={6} className="mb-3 mb-md-0">
            <Form.Group>
              <Form.Label className="fw-semibold mb-2" style={{ fontSize: '14px', color: '#2d3748' }}>
                <FolderOpen size={16} className="me-2" style={{ verticalAlign: 'middle' }} />
                Project
              </Form.Label>
              <Form.Select
                value={formData.projectId || ''}
                onChange={(e) => setFormData({ ...formData, projectId: Number(e.target.value) })}
                className="py-2"
                style={{ fontSize: '14px' }}
              >
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                     {project.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>

          <Col xs={12} md={6}>
            <Form.Group>
              <Form.Label className="fw-semibold mb-2" style={{ fontSize: '14px', color: '#2d3748' }}>
                <Calendar size={16} className="me-2" style={{ verticalAlign: 'middle' }} />
                Due Date
              </Form.Label>
              <Form.Control
                type="date"
                placeholder="Select date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="py-2"
                style={{ fontSize: '14px' }}
              />
            </Form.Group>
          </Col>
        </Row>

        {/* Status and Priority Row */}
        <Row className="mb-3">
          <Col xs={12} md={6} className="mb-3 mb-md-0">
            <Form.Group>
              <Form.Label className="fw-semibold mb-2" style={{ fontSize: '14px', color: '#2d3748' }}>
                <ListTodo size={16} className="me-2" style={{ verticalAlign: 'middle' }} />
                Status
              </Form.Label>
              <Form.Select
                value={formData.statusId || ''}
                onChange={(e) => setFormData({ ...formData, statusId: Number(e.target.value) })}
                className="py-2"
                style={{ fontSize: '14px' }}
              >
                {statuses.map(status => (
                  <option key={status.id} value={status.id}>
                    {status.name}
                  </option>
                ))}
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
                value={formData.priorityId || ''}
                onChange={(e) => setFormData({ ...formData, priorityId: Number(e.target.value) })}
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

        {/* Assignees Field */}
        <Form.Group className="mb-3">
          <Form.Label className="fw-semibold mb-2" style={{ fontSize: '14px', color: '#2d3748' }}>
            <Users size={16} className="me-2" style={{ verticalAlign: 'middle' }} />
            Assignees
          </Form.Label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
            {selectedAssignees.map((user) => (
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
                  cursor: 'pointer'
                }}
                onClick={() => toggleAssignee(user.id)}
              >
                {/* <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.65rem',
                    fontWeight: '600'
                  }}
                >
                  {user.initials}
                </div> */}
                <span style={{ color: '#2d3748', fontWeight: '500' }}>{user.name}</span>
                <X size={14} style={{ color: '#64748b' }} />
              </div>
            ))}
            
            <Button
              variant="light"
              size="sm"
              onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                fontSize: '0.875rem',
                border: '1px solid #e2e8f0',
                borderRadius: '6px'
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
                maxHeight: '200px',
                overflowY: 'auto'
              }}
            >
              {users.map((user) => (
                <div
                  key={user.id}
                  className="d-flex align-items-center justify-content-between p-3 border-bottom cursor-pointer"
                  style={{
                    cursor: 'pointer',
                    backgroundColor: formData.assigneeIds.includes(user.id) ? '#edf6ff' : 'white',
                    transition: 'background-color 0.2s'
                  }}
                  onClick={() => {
                    toggleAssignee(user.id);
                    setShowAssigneeDropdown(false);
                  }}
                  onMouseEnter={(e) => {
                    if (!formData.assigneeIds.includes(user.id)) {
                      e.currentTarget.style.backgroundColor = '#f8fafc';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!formData.assigneeIds.includes(user.id)) {
                      e.currentTarget.style.backgroundColor = 'white';
                    }
                  }}
                >
                  <span style={{ fontSize: '14px', color: '#2d3748', fontWeight: '500' }}>{user.name}</span>
                  {formData.assigneeIds.includes(user.id) && (
                    <Check size={18} className="text-primary" style={{ flexShrink: 0 }} />
                  )}
                </div>
              ))}
            </div>
          )}
        </Form.Group>

        {/* Labels Field */}
        <Form.Group className="mb-3">
          <Form.Label className="fw-semibold mb-2" style={{ fontSize: '14px', color: '#2d3748' }}>
            <Tag size={16} className="me-2" style={{ verticalAlign: 'middle' }} />
            Labels
          </Form.Label>
          
          {/* Selected Labels Display */}
          {selectedLabels.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
              {selectedLabels.map((label) => (
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
    borderRadius: '0.375rem' // same default Bootstrap badge feel
  }}
  onClick={() => toggleLabel(label.id)}
>
  <Tag size={12} />
  {label.name}
  <X size={12} />
</div>

              ))}
            </div>
          )}
          
          {/* Available Labels */}
          <div 
            className="border rounded p-3"
            style={{ 
              backgroundColor: '#f8fafc',
              maxHeight: '140px',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {labels.map((label) => (
                <div
  key={label.id}
  className="d-inline-block"
  style={{
    backgroundColor: formData.labelIds.includes(label.id) ? label.color : '#ffffff',
    color: '#2d3748',
    fontSize: '0.75rem',
    fontWeight: '500',
    padding: '6px 12px',
    cursor: 'pointer',
    border: formData.labelIds.includes(label.id)
      ? '2px solid #3b82f6'
      : '1px solid #e2e8f0',
    borderRadius: '0.375rem', // badge feel
    transition: 'all 0.2s',
    userSelect: 'none'
  }}
  onClick={() => toggleLabel(label.id)}
>
  {label.name}
</div>

              ))}
            </div>
          </div>
        </Form.Group>

        {/* Link Record Field */}
        <Form.Group className="mb-3">
          <Form.Label className="fw-semibold mb-2" style={{ fontSize: '14px', color: '#2d3748' }}>
            <LinkIcon size={16} className="me-2" style={{ verticalAlign: 'middle' }} />
            Link Records
          </Form.Label>
          <div className="position-relative mb-2">
            <Search 
              size={16} 
              className="position-absolute text-muted" 
              style={{ left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
            />
            <Form.Control
              type="text"
              placeholder="Search CRM, call, ticket, invoice..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="py-2"
              style={{ 
                paddingLeft: '40px',
                fontSize: '14px' 
              }}
            />
          </div>

          {/* Linked Records Display */}
          {searchQuery && (
            <div 
              className="border rounded"
              style={{ 
                maxHeight: '200px', 
                overflowY: 'auto',
                backgroundColor: '#f8fafc'
              }}
            >
              {linkedRecords
                .filter(record => 
                  record.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  record.reference.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((record) => (
                  <div
                    key={record.id}
                    className="d-flex align-items-center p-3 border-bottom cursor-pointer"
                    style={{ 
                      cursor: 'pointer',
                      backgroundColor: formData.linkedRecordIds.includes(record.id) ? '#edf6ff' : 'white',
                      transition: 'background-color 0.2s'
                    }}
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        linkedRecordIds: prev.linkedRecordIds.includes(record.id)
                          ? prev.linkedRecordIds.filter(id => id !== record.id)
                          : [...prev.linkedRecordIds, record.id]
                      }));
                    }}
                    onMouseEnter={(e) => {
                      if (!formData.linkedRecordIds.includes(record.id)) {
                        e.currentTarget.style.backgroundColor = '#f8fafc';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!formData.linkedRecordIds.includes(record.id)) {
                        e.currentTarget.style.backgroundColor = 'white';
                      }
                    }}
                  >
                    <div
                      className="d-flex align-items-center justify-content-center rounded me-3 text-white"
                      style={{
                        width: '36px',
                        height: '36px',
                        backgroundColor: record.type === 'crm' ? '#4A90E2' : 
                                       record.type === 'ticket' ? '#5B7BA4' :
                                       record.type === 'invoice' ? '#D4A853' : '#5B7BA4',
                        flexShrink: 0
                      }}
                    >
                      {record.type === 'crm' ? <User size={18} /> :
                       record.type === 'ticket' ? <Ticket size={18} /> :
                       record.type === 'invoice' ? <FileSpreadsheet size={18} /> :
                       <Phone size={18} />}
                    </div>
                    <div className="flex-grow-1 overflow-hidden">
                      <div className="fw-semibold text-truncate" style={{ fontSize: '0.9rem', color: '#2d3748' }}>
                        {record.title}
                      </div>
                      <div className="text-muted small text-truncate" style={{ fontSize: '0.8rem' }}>
                        {record.reference}
                      </div>
                    </div>
                    {formData.linkedRecordIds.includes(record.id) && (
                      <Check size={18} className="text-primary ms-2" style={{ flexShrink: 0 }} />
                    )}
                  </div>
                ))}
            </div>
          )}
        </Form.Group>
      </Modal.Body>

      <Modal.Footer style={{ 
        borderTop: '1px solid #e8eef5',
        paddingTop: '16px',
        display: 'flex',
        gap: '8px',
        justifyContent: 'flex-end'
      }}>
        <Button 
          variant="light" 
          onClick={onHide}
          style={{
            padding: '8px 20px',
            fontSize: '14px',
            fontWeight: '600',
            border: '1px solid #e2e8f0'
          }}
        >
          Cancel
        </Button>
        <Button 
          variant="primary" 
          onClick={handleCreateAndOpen}
          style={{
            padding: '8px 20px',
            fontSize: '14px',
            fontWeight: '600',
            backgroundColor: '#3b82f6',
            borderColor: '#3b82f6'
          }}
        >
          Create & Open
        </Button>
        <Button 
          variant="primary" 
          onClick={handleCreate}
          style={{
            padding: '8px 20px',
            fontSize: '14px',
            fontWeight: '600',
            backgroundColor: '#4e6fa5',
            borderColor: '#4e6fa5'
          }}
        >
          Create
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

export default CreateTaskModal;
