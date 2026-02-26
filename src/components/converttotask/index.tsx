import React, { useState } from 'react';
import { Modal, Button, Form, Row, Col, Badge } from 'react-bootstrap';
import { 
  X, 
  Calendar, 
  User, 
  FileText, 
  Ticket, 
  FileSpreadsheet, 
  Phone,
  Search,
  Check,
  Tag,
  Users,
  Flag,
  ListTodo
} from 'lucide-react';

interface ConvertToTaskModalProps {
  show: boolean;
  onHide: () => void;
  onConvert?: (data: TaskData) => void;
  onConvertAndOpen?: (data: TaskData) => void;
}

interface TaskData {
  project: string;
  status: string;
  priority: string;
  labels: string[];
  assignee: string;
  dueDate: string;
  linkedRecords: string[];
  keepAsOriginal: boolean;
  openAfterCreate: boolean;
}

interface LinkableRecord {
  id: string;
  title: string;
  subtitle: string;
  type: 'lead' | 'ticket' | 'invoice' | 'call';
  icon: React.ReactNode;
}

const ConvertToTaskModal: React.FC<ConvertToTaskModalProps> = ({
  show,
  onHide,
  onConvert,
  onConvertAndOpen
}) => {
  const [formData, setFormData] = useState<TaskData>({
    project: 'Website Redesign',
    status: 'To Do',
    priority: 'Normal',
    labels: ['Sales'],
    assignee: 'John Doe',
    dueDate: '2024-04-18',
    linkedRecords: [],
    keepAsOriginal: true,
    openAfterCreate: false
  });

  const [searchQuery, setSearchQuery] = useState('');

  const availableRecords: LinkableRecord[] = [
    {
      id: '1',
      title: 'Ahmad Hasan',
      subtitle: 'Lead',
      type: 'lead',
      icon: <User size={18} />
    },
    {
      id: '2',
      title: 'Support Ticket #2145',
      subtitle: 'Ticket, #21AM - Website Redesign',
      type: 'ticket',
      icon: <Ticket size={18} />
    },
    {
      id: '3',
      title: 'Invoice #1023',
      subtitle: 'Invoices',
      type: 'invoice',
      icon: <FileSpreadsheet size={18} />
    },
    {
      id: '4',
      title: 'Call with Ahmad',
      subtitle: 'Today, 9:00 AM',
      type: 'call',
      icon: <Phone size={18} />
    }
  ];

  const getRecordBgColor = (type: string) => {
    switch (type) {
      case 'lead':
        return '#4A90E2';
      case 'ticket':
        return '#5B7BA4';
      case 'invoice':
        return '#D4A853';
      case 'call':
        return '#5B7BA4';
      default:
        return '#6C757D';
    }
  };

  const filteredRecords = availableRecords.filter(
    record =>
      record.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleConvert = () => {
    if (onConvert) {
      onConvert(formData);
    }
    onHide();
  };

  const handleConvertAndOpen = () => {
    if (onConvertAndOpen) {
      onConvertAndOpen(formData);
    }
    onHide();
  };

  const toggleLinkedRecord = (recordId: string) => {
    setFormData(prev => ({
      ...prev,
      linkedRecords: prev.linkedRecords.includes(recordId)
        ? prev.linkedRecords.filter(id => id !== recordId)
        : [...prev.linkedRecords, recordId]
    }));
  };

  return (
    <Modal 
      show={show} 
      onHide={onHide} 
      centered 
      size="lg"
      className="convert-task-modal"
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
          Convert to Task
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
        {/* Project Selection */}
        <Form.Group className="mb-3">
          <Form.Label className="fw-semibold mb-2" style={{ fontSize: '14px', color: '#2d3748' }}>
            <FileText size={16} className="me-2" style={{ verticalAlign: 'middle' }} />
            Project
          </Form.Label>
          <Form.Select
            value={formData.project}
            onChange={(e) => setFormData({ ...formData, project: e.target.value })}
            className="py-2"
            style={{ fontSize: '14px' }}
          >
            <option value="Website Redesign">Website Redesign</option>
            <option value="Mobile App Development">Mobile App Development</option>
            <option value="Marketing Campaign Q1">Marketing Campaign Q1</option>
            <option value="Customer Portal">Customer Portal</option>
            <option value="Internal CRM System">Internal CRM System</option>
          </Form.Select>
        </Form.Group>

        {/* Status, Priority, Labels Row */}
        <Row className="mb-3">
          <Col xs={12} md={4} className="mb-3 mb-md-0">
            <Form.Group>
              <Form.Label className="fw-semibold mb-2" style={{ fontSize: '14px', color: '#2d3748' }}>
                <ListTodo size={16} className="me-2" style={{ verticalAlign: 'middle' }} />
                Status
              </Form.Label>
              <Form.Select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="py-2"
                style={{ fontSize: '14px' }}
              >
                <option value="To Do">To Do</option>
                <option value="In Progress">In Progress</option>
                <option value="In Review">In Review</option>
                <option value="Blocked">Blocked</option>
                <option value="Done">Done</option>
              </Form.Select>
            </Form.Group>
          </Col>

          <Col xs={12} md={4} className="mb-3 mb-md-0">
            <Form.Group>
              <Form.Label className="fw-semibold mb-2" style={{ fontSize: '14px', color: '#2d3748' }}>
                <Flag size={16} className="me-2" style={{ verticalAlign: 'middle' }} />
                Priority
              </Form.Label>
              <Form.Select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="py-2"
                style={{ fontSize: '14px' }}
              >
                <option value="Low">🟢 Low</option>
                <option value="Normal">🔵 Normal</option>
                <option value="High">🟠 High</option>
                <option value="Urgent">🔴 Urgent</option>
              </Form.Select>
            </Form.Group>
          </Col>

          <Col xs={12} md={4}>
            <Form.Group>
              <Form.Label className="fw-semibold mb-2" style={{ fontSize: '14px', color: '#2d3748' }}>
                <Tag size={16} className="me-2" style={{ verticalAlign: 'middle' }} />
                Category
              </Form.Label>
              <Form.Select 
                className="py-2"
                style={{ fontSize: '14px' }}
                onChange={(e) => {
                  const label = e.target.value;
                  if (label && !formData.labels.includes(label)) {
                    setFormData({ ...formData, labels: [...formData.labels, label] });
                  }
                }}
              >
                <option value="">Select a label...</option>
                <option value="Sales">Sales</option>
                <option value="Support">Support</option>
                <option value="Development">Development</option>
                <option value="Design">Design</option>
                <option value="Marketing">Marketing</option>
                <option value="Finance">Finance</option>
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>

        {/* Assignees and Due Date Row */}
        <Row className="mb-3">
          <Col xs={12} md={6} className="mb-3 mb-md-0">
            <Form.Group>
              <Form.Label className="fw-semibold mb-2" style={{ fontSize: '14px', color: '#2d3748' }}>
                <Users size={16} className="me-2" style={{ verticalAlign: 'middle' }} />
                Assignee
              </Form.Label>
              <Form.Select
                value={formData.assignee}
                onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
                className="py-2"
                style={{ fontSize: '14px' }}
              >
                <option value="">Select assignee...</option>
                <option value="John Doe">John Doe</option>
                <option value="Jane Smith">Jane Smith</option>
                <option value="Bob Wilson">Bob Wilson</option>
                <option value="Sarah Johnson">Sarah Johnson</option>
                <option value="Mike Brown">Mike Brown</option>
              </Form.Select>
            </Form.Group>
          </Col>

          <Col xs={12} md={6}>
            <Form.Group>
              <Form.Label className="fw-semibold mb-2" style={{ fontSize: '14px', color: '#2d3748' }}>
                <Calendar size={16} className="me-2" style={{ verticalAlign: 'middle' }} />
                Due Date
              </Form.Label>
              <div className="position-relative">
                <Form.Control
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="py-2"
                  style={{ fontSize: '14px' }}
                />
              </div>
            </Form.Group>
          </Col>
        </Row>

        {/* Labels Display */}
        {formData.labels.length > 0 && (
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold mb-2" style={{ fontSize: '14px', color: '#2d3748' }}>
              Selected Labels
            </Form.Label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {formData.labels.map((label, index) => (
                <Badge 
                  key={index}
                  bg="primary" 
                  className="d-inline-flex align-items-center gap-2 px-3 py-2"
                  style={{ fontSize: '0.875rem', cursor: 'pointer' }}
                  onClick={() => {
                    setFormData({
                      ...formData,
                      labels: formData.labels.filter((_, i) => i !== index)
                    });
                  }}
                >
                  <Tag size={12} />
                  {label}
                  <X size={12} />
                </Badge>
              ))}
            </div>
          </Form.Group>
        )}

        {/* Link Record Section */}
        <Form.Group className="mb-3">
          <Form.Label className="fw-semibold mb-2" style={{ fontSize: '14px', color: '#2d3748' }}>
            <Search size={16} className="me-2" style={{ verticalAlign: 'middle' }} />
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
              placeholder="Search records to link..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="py-2"
              style={{ paddingLeft: '40px', fontSize: '14px' }}
            />
          </div>

          {/* Linkable Records List */}
          <div 
            className="border rounded"
            style={{ 
              maxHeight: '240px', 
              overflowY: 'auto',
              backgroundColor: '#f8fafc'
            }}
          >
            {filteredRecords.length === 0 ? (
              <div className="p-4 text-center text-muted" style={{ fontSize: '14px' }}>
                No records found
              </div>
            ) : (
              filteredRecords.map((record) => (
                <div
                  key={record.id}
                  className="d-flex align-items-center p-3 border-bottom cursor-pointer"
                  style={{ 
                    cursor: 'pointer',
                    backgroundColor: formData.linkedRecords.includes(record.id) ? '#edf6ff' : 'white',
                    transition: 'background-color 0.2s'
                  }}
                  onClick={() => toggleLinkedRecord(record.id)}
                  onMouseEnter={(e) => {
                    if (!formData.linkedRecords.includes(record.id)) {
                      e.currentTarget.style.backgroundColor = '#f8fafc';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!formData.linkedRecords.includes(record.id)) {
                      e.currentTarget.style.backgroundColor = 'white';
                    }
                  }}
                >
                  <div
                    className="d-flex align-items-center justify-content-center rounded me-3 text-white"
                    style={{
                      width: '36px',
                      height: '36px',
                      backgroundColor: getRecordBgColor(record.type),
                      flexShrink: 0
                    }}
                  >
                    {record.icon}
                  </div>
                  <div className="flex-grow-1 overflow-hidden">
                    <div className="fw-semibold text-truncate" style={{ fontSize: '0.9rem', color: '#2d3748' }}>
                      {record.title}
                    </div>
                    <div className="text-muted small text-truncate" style={{ fontSize: '0.8rem' }}>
                      {record.subtitle}
                    </div>
                  </div>
                  {formData.linkedRecords.includes(record.id) && (
                    <Check size={18} className="text-primary ms-2" style={{ flexShrink: 0 }} />
                  )}
                </div>
              ))
            )}
          </div>
        </Form.Group>

        {/* Checkboxes */}
        <div className="mt-4" style={{ 
          padding: '16px',
          backgroundColor: '#f8fafc',
          borderRadius: '6px',
          border: '1px solid #e8eef5'
        }}>
          <Form.Check
            type="checkbox"
            id="keep-as-todo"
            label="Keep as To-Do (creates task but keeps original to-do)"
            checked={formData.keepAsOriginal}
            onChange={(e) => setFormData({ ...formData, keepAsOriginal: e.target.checked })}
            className="mb-2"
            style={{ fontSize: '14px' }}
          />
          <Form.Check
            type="checkbox"
            id="open-after-create"
            label="Open task after create"
            checked={formData.openAfterCreate}
            onChange={(e) => setFormData({ ...formData, openAfterCreate: e.target.checked })}
            style={{ fontSize: '14px' }}
          />
        </div>
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
          variant="outline-primary" 
          onClick={handleConvertAndOpen}
          style={{
            padding: '8px 20px',
            fontSize: '14px',
            fontWeight: '600'
          }}
        >
          Convert & Open
        </Button>
        <Button 
          variant="primary" 
          onClick={handleConvert}
          style={{
            padding: '8px 20px',
            fontSize: '14px',
            fontWeight: '600',
            backgroundColor: '#4e6fa5',
            borderColor: '#4e6fa5'
          }}
        >
          Convert
        </Button>
      </Modal.Footer>

      <style>{`
        .convert-task-modal .modal-header .btn-close {
          display: none;
        }
      `}</style>
    </Modal>
  );
};

export default ConvertToTaskModal;