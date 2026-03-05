import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Card, Form, Button, Badge } from 'react-bootstrap';
import {
  ChevronLeft,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  Code,
  MoreHorizontal,
  Paperclip,
  Plus,
  RotateCcw,
  Phone,
  CheckCircle2,
  ChevronRight,
  FileQuestion,
  Clock,
  X
} from 'lucide-react';
import { CreateTicket as CreateTicketAPI } from '@utils/tickets';
import { GetAllModules, GetAllSubmodules, GetAllSubmoduleChildren } from '@utils/ticket-module';
import { GetAllStatuses } from '@utils/ticket-statuses';
import { GetAllTypes } from '@utils/ticket-types';
import { GetHierarchyData } from '@utils/users';
import { ModuleSlug } from '@utils/Helper';
import { useSession } from 'next-auth/react';
import { toast } from 'react-toastify';
import moment from 'moment';
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';

interface CreateTicketProps {
  onBack: () => void;
}

const CreateTicket: React.FC<CreateTicketProps> = ({ onBack }) => {
  const { data: session } = useSession();
  
  // Form state
  const [newTicketTitle, setNewTicketTitle] = useState<string>("");
  const [newTicketDescription, setNewTicketDescription] = useState<string>("");
  const [newTicketType, setNewTicketType] = useState<string>("");
  const [newTicketStatus, setNewTicketStatus] = useState<string>("");
  const [newTicketModule, setNewTicketModule] = useState<string>("");
  const [newTicketSubmodule, setNewTicketSubmodule] = useState<string>("");
  const [newTicketSubmoduleChild, setNewTicketSubmoduleChild] = useState<string>("");
  const [newTicketPriority, setNewTicketPriority] = useState<string>("");
  const [newTicketDueDate, setNewTicketDueDate] = useState<string>("");
  const [newTicketUserExtension, setNewTicketUserExtension] = useState<string[]>([]);
  const [newTicketImages, setNewTicketImages] = useState<File[]>([]);
  const [newTicketTags, setNewTicketTags] = useState<string[]>([]);
  
  // Data state
  const [modules, setModules] = useState<any[]>([]);
  const [types, setTypes] = useState<any[]>([]);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [submodules, setSubmodules] = useState<any[]>([]);
  const [submoduleChildren, setSubmoduleChildren] = useState<any[]>([]);
  const [extensions, setExtensions] = useState<any[]>([]);
  
  // UI state
  const [creatingTicket, setCreatingTicket] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedTicketId, setSubmittedTicketId] = useState('');

  // Default tags suggestions
  const defaultTags = [
    "urgent",
    "bug",
    "feature",
    "enhancement",
    "documentation"
  ];

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [modulesData, typesData, statusesData, hierarchyData] = await Promise.all([
          GetAllModules(),
          GetAllTypes(),
          GetAllStatuses(),
          GetHierarchyData(ModuleSlug.TICKET)
        ]);
        
        setModules(modulesData || []);
        setTypes(typesData || []);
        setStatuses(statusesData || []);
        setExtensions(hierarchyData?.extensions || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    
    fetchData();
  }, []);

  // Fetch submodules when module changes
  const fetchSubmodules = useCallback(async (moduleId: string) => {
    if (moduleId) {
      try {
        const submoduleData = await GetAllSubmodules();
        const filteredSubmodules = submoduleData?.filter((sub: any) => sub.module_id == moduleId) || [];
        setSubmodules(filteredSubmodules);
        setNewTicketSubmodule("");
        setNewTicketSubmoduleChild("");
        setSubmoduleChildren([]);
      } catch (error) {
        console.error("Error fetching submodules:", error);
      }
    } else {
      setSubmodules([]);
      setNewTicketSubmodule("");
      setNewTicketSubmoduleChild("");
      setSubmoduleChildren([]);
    }
  }, []);

  // Fetch submodule children when submodule changes
  const fetchSubmoduleChildren = useCallback(async (submoduleId: string) => {
    if (submoduleId) {
      try {
        const childrenData = await GetAllSubmoduleChildren();
        const filteredChildren = childrenData?.filter((child: any) => child.submodule_id == submoduleId) || [];
        setSubmoduleChildren(filteredChildren);
        setNewTicketSubmoduleChild("");
      } catch (error) {
        console.error("Error fetching submodule children:", error);
      }
    } else {
      setSubmoduleChildren([]);
      setNewTicketSubmoduleChild("");
    }
  }, []);

  const suggestedArticles = [
    {
      title: 'Setting Up',
      subtitle: 'Two-Factor Authentication',
      description: 'Browse help articles sosent',
      icon: Plus,
      color: '#4680ff'
    },
    {
      title: 'Resetting Your 2FA',
      subtitle: 'Device',
      description: 'Find out eosents solutions',
      icon: RotateCcw,
      color: '#04a9f5'
    },
    {
      title: 'Troubleshooting',
      subtitle: '2FA Issues',
      description: 'Fix, eweeting- problems',
      icon: FileQuestion,
      color: '#5babf6'
    }
  ];

  const helpSuggestions = [
    {
      title: 'Setting Up Two-Factor Authentication',
      description: 'Read step-by-step guide',
      icon: CheckCircle2,
      color: '#4680ff'
    },
    {
      title: 'Troubleshooting 2FA Issues',
      description: 'Explore common solutions',
      icon: FileQuestion,
      color: '#04a9f5'
    }
  ];

  const frequentTopics = [
    'Setting Up Two-Factor Authentication',
    'How do I change my billing plan?',
    "Can't find your answer?"
  ];

  const handleSubmit = useCallback(async () => {
    // Validation
    if (!newTicketTitle?.trim() || newTicketTitle?.trim()?.length < 5) {
      toast.error("Please enter a ticket title (Min: 5 chars)");
      return;
    }
    if (!newTicketType) {
      toast.error("Please select a ticket type");
      return;
    }
    if (newTicketDescription.length < 50 || newTicketDescription.length > 500) {
      toast.error("Ticket description must be between 50 and 500 characters");
      return;
    }
    if (!newTicketStatus) {
      toast.error("Please select a ticket status");
      return;
    }
    if (!newTicketModule) {
      toast.error("Please select a ticket module");
      return;
    }
    if (!newTicketSubmodule) {
      toast.error("Please select a ticket primary issue");
      return;
    }
    if (!newTicketPriority) {
      toast.error("Please select a ticket priority");
      return;
    }

    // Validate images
    if (newTicketImages && newTicketImages.length > 0) {
      const maxSize = 5 * 1024 * 1024; // 5 MB
      for (let i = 0; i < newTicketImages.length; i++) {
        const image = newTicketImages[i];
        if (!image.type?.includes("image/")) {
          toast.error(`Attachment ${i + 1} must be an image (jpeg, png, jpg, gif)`);
          return;
        }
        if (image.size > maxSize) {
          toast.error(`Attachment ${i + 1} size must be less than 5MB`);
          return;
        }
      }
    }

    const formData = new FormData();
    formData.append("title", newTicketTitle);
    formData.append("description", newTicketDescription);
    formData.append("ticket_type_id", newTicketType);
    formData.append("ticket_status_id", newTicketStatus);
    formData.append("module_id", newTicketModule);
    if (newTicketSubmodule) {
      formData.append("submodule_id", newTicketSubmodule);
    }
    if (newTicketSubmoduleChild) {
      formData.append("submodule_child_id", newTicketSubmoduleChild);
    }
    formData.append("priority", newTicketPriority || "0");
    formData.append("created_by", session?.user?.phone || "");
    
    if (newTicketDueDate) {
      formData.append("due_date", newTicketDueDate);
    }
    
    if (session?.user?.permissions?.includes("assign-user-tickets") && newTicketUserExtension && newTicketUserExtension.length > 0) {
      newTicketUserExtension.forEach((ext) => {
        formData.append("user_extension[]", ext);
      });
    }
    
    if (newTicketTags && newTicketTags.length > 0) {
      newTicketTags.forEach((tag) => {
        formData.append("tags[]", tag);
      });
    }
    
    if (newTicketImages && newTicketImages.length > 0) {
      newTicketImages.forEach((image) => {
        formData.append("image[]", image);
      });
    }

    setCreatingTicket(true);
    let response = null;
    try {
      response = await CreateTicketAPI(formData);
    } catch (error) {
      toast.error("Failed to create ticket");
      console.error("Create ticket error:", error);
    } finally {
      setCreatingTicket(false);
    }
    
    if (response) {
      // Generate a ticket ID for display
      const ticketId = '#' + Math.floor(100000 + Math.random() * 900000);
      setSubmittedTicketId(ticketId);
    setIsSubmitted(true);
      
      // Reset form
      setNewTicketTitle("");
      setNewTicketDescription("");
      setNewTicketType("");
      setNewTicketStatus("");
      setNewTicketModule("");
      setNewTicketSubmodule("");
      setNewTicketSubmoduleChild("");
      setNewTicketPriority("");
      setNewTicketDueDate("");
      setNewTicketUserExtension([]);
      setNewTicketTags([]);
      setNewTicketImages([]);
      setSubmodules([]);
      setSubmoduleChildren([]);
    }
  }, [
    newTicketTitle,
    newTicketDescription,
    newTicketType,
    newTicketStatus,
    newTicketModule,
    newTicketSubmodule,
    newTicketSubmoduleChild,
    newTicketPriority,
    newTicketDueDate,
    newTicketUserExtension,
    newTicketTags,
    newTicketImages,
    session?.user?.phone,
    session?.user?.permissions
  ]);

  return (
    <div style={{ background: '#f4f7fa', minHeight: '100vh', paddingBottom: '40px' }}>
      {/* Breadcrumb */}
      <div style={{ marginBottom: '20px' }}>
        <Button
          variant="link"
          onClick={onBack}
          style={{
            textDecoration: 'none',
            color: '#6c757d',
            fontSize: '14px',
            padding: 0,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px'
          }}
        >
          <ChevronLeft size={16} /> Help Center
        </Button>
        <span style={{ color: '#6c757d', margin: '0 8px' }}>›</span>
        <span 
          onClick={onBack}
          style={{ color: '#6c757d', fontSize: '14px', cursor: 'pointer' }}
        >
          My Tickets
        </span>
        <span style={{ color: '#6c757d', margin: '0 8px' }}>›</span>
        <span style={{ color: '#2c3e50', fontWeight: '600', fontSize: '14px' }}>
          Create Ticket
        </span>
      </div>
      <Row className="g-3">
        {/* Main Content: Form or Success Message */}
        <Col xs={12} lg={8}>
          {isSubmitted ? (
            <Card style={{
              background: '#fff',
              border: '1px solid #e9ecef',
              borderRadius: '8px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              textAlign: 'center',
              padding: '60px 40px'
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: '#1de9b6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px'
              }}>
                <CheckCircle2 size={40} color="#fff" strokeWidth={2.5} />
              </div>

              <h2 style={{
                fontSize: '28px',
                fontWeight: '700',
                color: '#2c3e50',
                marginBottom: '16px'
              }}>
                Ticket Submitted!
              </h2>

              <p style={{
                fontSize: '16px',
                color: '#495057',
                marginBottom: '8px'
              }}>
                Your ticket <span style={{ color: '#4680ff', fontWeight: '600' }}>{submittedTicketId}</span> has been successfully created.
              </p>

              <p style={{
                fontSize: '15px',
                color: '#6c757d',
                marginBottom: '40px'
              }}>
                Our support team will get back to you shortly.
              </p>

              {/* Expected Response Time Card */}
              <Card style={{
                background: '#f8f9fa',
                border: '1px solid #e9ecef',
                borderRadius: '8px',
                padding: '24px',
                marginBottom: '32px',
                textAlign: 'left'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '16px'
                }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '8px',
                    background: '#f4c22b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Clock size={24} color="#fff" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h5 style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#2c3e50',
                      marginBottom: '8px'
                    }}>
                      Expected Response Time
                    </h5>
                    <p style={{
                      fontSize: '15px',
                      color: '#495057',
                      marginBottom: '8px'
                    }}>
                      Within <Badge bg="secondary" style={{ fontSize: '11px', fontWeight: '500' }}>1 business day</Badge>
                    </p>
                    <p style={{
                      fontSize: '13px',
                      color: '#6c757d',
                      marginBottom: 0
                    }}>
                      Standard Support: Mon-Fri, 9 AM - 5 PM
                    </p>
                  </div>
                </div>
              </Card>

              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'center',
                flexWrap: 'wrap'
              }}>
                <Button
                  onClick={onBack}
                  style={{
                    background: '#4680ff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '12px 32px',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  View My Tickets
                </Button>
                <Button
                  variant="outline-secondary"
                  onClick={() => {
                    setIsSubmitted(false);
                    setNewTicketTitle("");
                    setNewTicketDescription("");
                    setNewTicketType("");
                    setNewTicketStatus("");
                    setNewTicketModule("");
                    setNewTicketSubmodule("");
                    setNewTicketSubmoduleChild("");
                    setNewTicketPriority("");
                    setNewTicketDueDate("");
                    setNewTicketUserExtension([]);
                    setNewTicketTags([]);
                    setNewTicketImages([]);
                    setSubmodules([]);
                    setSubmoduleChildren([]);
                    setSubmittedTicketId('');
                    // Reset file input
                    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
                    if (fileInput) {
                      fileInput.value = "";
                    }
                  }}
                  style={{
                    borderRadius: '6px',
                    padding: '12px 32px',
                    fontSize: '14px',
                    fontWeight: '500',
                    border: '1px solid #dee2e6',
                    color: '#495057'
                  }}
                >
                  Create Another Ticket
                </Button>
              </div>
            </Card>
          ) : (
            <Card style={{
              background: '#fff',
              border: '1px solid #e9ecef',
              borderRadius: '8px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}>
              <Card.Body style={{ padding: '32px' }}>
                {/* Header */}
                <div style={{ marginBottom: '24px' }}>
                  <h2 style={{
                    fontSize: '28px',
                    fontWeight: '700',
                    color: '#2c3e50',
                    marginBottom: '8px'
                  }}>
                    Create Ticket
                  </h2>
                  <p style={{
                    fontSize: '15px',
                    color: '#6c757d',
                    marginBottom: '24px'
                  }}>
                    Tell us how we can assist you
                  </p>

                </div>

                {/* Title */}
                <div style={{ marginBottom: '24px' }}>
                  <Form.Label style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#2c3e50',
                    marginBottom: '8px'
                  }}>
                    Ticket Title <span style={{ color: '#dc3545' }}>*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter a brief summary of the issue..."
                    value={newTicketTitle}
                    onChange={(e) => setNewTicketTitle(e.target.value)}
                    style={{
                      fontSize: '14px',
                      padding: '10px 14px',
                      border: '1px solid #dee2e6',
                      borderRadius: '6px'
                    }}
                  />
                  <Form.Text style={{ fontSize: '12px', color: '#6c757d' }}>
                    Minimum 5 characters required
                  </Form.Text>
                        </div>

                {/* Type and Priority Row */}
                <Row className="g-3" style={{ marginBottom: '24px' }}>
                  <Col md={6}>
                    <Form.Label style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#2c3e50',
                      marginBottom: '8px'
                    }}>
                      Ticket Type <span style={{ color: '#dc3545' }}>*</span>
                    </Form.Label>
                    <Form.Select
                      value={newTicketType}
                      onChange={(e) => setNewTicketType(e.target.value)}
                      style={{
                        fontSize: '14px',
                        padding: '10px 14px',
                        border: '1px solid #dee2e6',
                        borderRadius: '6px'
                      }}
                    >
                      <option value="">Select Type</option>
                      {types.map((type: any) => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </Form.Select>
                  </Col>
                  <Col md={6}>
                    <Form.Label style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#2c3e50',
                      marginBottom: '8px'
                    }}>
                      Priority <span style={{ color: '#dc3545' }}>*</span>
                    </Form.Label>
                    <Form.Select
                      value={newTicketPriority}
                      onChange={(e) => setNewTicketPriority(e.target.value)}
                      style={{
                        fontSize: '14px',
                        padding: '10px 14px',
                        border: '1px solid #dee2e6',
                        borderRadius: '6px'
                      }}
                    >
                      <option value="">Select Priority</option>
                      <option value="0">Low</option>
                      <option value="1">Medium</option>
                      <option value="2">High</option>
                      <option value="3">Critical</option>
                    </Form.Select>
                  </Col>
                </Row>

                {/* Describe the issue */}
                <div style={{ marginBottom: '24px' }}>
                  <Form.Label style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#2c3e50',
                    marginBottom: '8px'
                  }}>
                    Describe the issue
                  </Form.Label>

                  {/* Rich Text Toolbar */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '8px 12px',
                    background: '#f8f9fa',
                    border: '1px solid #dee2e6',
                    borderBottom: 'none',
                    borderRadius: '6px 6px 0 0'
                  }}>
                    <Button
                      variant="link"
                      style={{
                        padding: '6px',
                        color: '#6c757d',
                        minWidth: 'auto',
                        border: 'none'
                      }}
                    >
                      <Bold size={16} />
                    </Button>
                    <Button
                      variant="link"
                      style={{
                        padding: '6px',
                        color: '#6c757d',
                        minWidth: 'auto',
                        border: 'none'
                      }}
                    >
                      <Italic size={16} />
                    </Button>
                    <Button
                      variant="link"
                      style={{
                        padding: '6px',
                        color: '#6c757d',
                        minWidth: 'auto',
                        border: 'none'
                      }}
                    >
                      <Underline size={16} />
                    </Button>
                    <div style={{
                      width: '1px',
                      height: '20px',
                      background: '#dee2e6',
                      margin: '0 4px'
                    }} />
                    <Button
                      variant="link"
                      style={{
                        padding: '6px',
                        color: '#6c757d',
                        minWidth: 'auto',
                        border: 'none'
                      }}
                    >
                      <List size={16} />
                    </Button>
                    <Button
                      variant="link"
                      style={{
                        padding: '6px',
                        color: '#6c757d',
                        minWidth: 'auto',
                        border: 'none'
                      }}
                    >
                      <ListOrdered size={16} />
                    </Button>
                    <div style={{
                      width: '1px',
                      height: '20px',
                      background: '#dee2e6',
                      margin: '0 4px'
                    }} />
                    <Button
                      variant="link"
                      style={{
                        padding: '6px',
                        color: '#6c757d',
                        minWidth: 'auto',
                        border: 'none'
                      }}
                    >
                      <AlignLeft size={16} />
                    </Button>
                    <Button
                      variant="link"
                      style={{
                        padding: '6px',
                        color: '#6c757d',
                        minWidth: 'auto',
                        border: 'none'
                      }}
                    >
                      <AlignCenter size={16} />
                    </Button>
                    <div style={{
                      width: '1px',
                      height: '20px',
                      background: '#dee2e6',
                      margin: '0 4px'
                    }} />
                    <Button
                      variant="link"
                      style={{
                        padding: '6px',
                        color: '#6c757d',
                        minWidth: 'auto',
                        border: 'none'
                      }}
                    >
                      <Code size={16} />
                    </Button>
                    <div style={{ marginLeft: 'auto' }}>
                      <Button
                        variant="link"
                        style={{
                          padding: '6px',
                          color: '#6c757d',
                          minWidth: 'auto',
                          border: 'none'
                        }}
                      >
                        <MoreHorizontal size={16} />
                      </Button>
                    </div>
                  </div>

                  {/* Text Area */}
                  <Form.Control
                    as="textarea"
                    rows={6}
                    placeholder="Describe your issue in detail (Min: 50 chars, Max: 500 chars)..."
                    value={newTicketDescription}
                    onChange={(e) => setNewTicketDescription(e.target.value)}
                    maxLength={500}
                    style={{
                      fontSize: '14px',
                      padding: '12px 14px',
                      border: '1px solid #dee2e6',
                      borderTop: 'none',
                      borderRadius: '0 0 6px 6px',
                      resize: 'none'
                    }}
                  />
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                    marginTop: '8px',
                    padding: '0 4px'
                  }}>
                    <Form.Text style={{ 
                      fontSize: '12px', 
                      color: newTicketDescription.length < 50 ? '#dc3545' : '#28a745'
                    }}>
                      {newTicketDescription.length < 50 
                        ? `Minimum 50 characters required (${50 - newTicketDescription.length} more needed)`
                        : 'Description looks good!'}
                    </Form.Text>
                    <Form.Text style={{ fontSize: '12px', color: '#6c757d' }}>
                      {newTicketDescription.length}/500 characters
                    </Form.Text>
                  </div>
                </div>

                {/* Add Images */}
                <div style={{ marginBottom: '24px' }}>
                  <Form.Label style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#2c3e50',
                  marginBottom: '8px'
                }}>
                    Attachments (Optional)
                  </Form.Label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      if (files.length > 3) {
                        toast.error("Maximum 3 images allowed");
                        const limitedFiles = files.slice(0, 3);
                        setNewTicketImages(limitedFiles);
                        // Reset file input
                        const fileInput = e.target;
                        const dataTransfer = new DataTransfer();
                        limitedFiles.forEach(file => dataTransfer.items.add(file));
                        fileInput.files = dataTransfer.files;
                      } else {
                        setNewTicketImages(files);
                      }
                    }}
                    style={{
                      fontSize: '14px',
                      padding: '8px',
                      border: '1px solid #dee2e6',
                      borderRadius: '6px',
                      width: '100%'
                    }}
                  />
                  <Form.Text style={{ fontSize: '12px', color: '#6c757d', display: 'block', marginTop: '4px' }}>
                    Supported formats: JPG, PNG, GIF. Max size: 5MB per image. Maximum 3 images.
                  </Form.Text>
                  
                  {newTicketImages.length > 0 && (
                    <div style={{ marginTop: '12px' }}>
                  <div style={{
                    display: 'flex',
                        flexWrap: 'wrap', 
                        gap: '8px' 
                  }}>
                        {newTicketImages.map((file, index) => (
                          <Badge 
                            key={index}
                            bg="light" 
                            text="dark" 
                      style={{
                              padding: '8px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                              fontSize: '12px'
                      }}
                    >
                            <Paperclip size={14} />
                            <span>{file.name}</span>
                            <span style={{ color: '#6c757d' }}>
                              ({(file.size / 1024).toFixed(1)} KB)
                    </span>
                            <Button
                              variant="link"
                              size="sm"
                              style={{
                                padding: 0,
                                minWidth: 'auto',
                                color: '#dc3545',
                                textDecoration: 'none'
                              }}
                              onClick={() => {
                                setNewTicketImages(newTicketImages.filter((_, i) => i !== index));
                                // Reset file input
                                const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
                                if (fileInput) {
                                  fileInput.value = "";
                                }
                              }}
                            >
                              <X size={14} />
                            </Button>
                          </Badge>
                        ))}
                  </div>
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  marginTop: '24px',
                  paddingTop: '24px',
                  borderTop: '1px solid #e9ecef'
                }}>
                  <Button
                    onClick={handleSubmit}
                    disabled={creatingTicket}
                    style={{
                      background: '#4680ff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '12px 32px',
                      fontSize: '14px',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      opacity: creatingTicket ? 0.6 : 1
                    }}
                  >
                    {creatingTicket ? 'Creating...' : 'Submit Ticket'}
                  </Button>
                </div>
              </Card.Body>
            </Card>
          )}
        </Col>
        {/* Sidebar - Always Visible */}
        <Col xs={12} lg={4}>
          {/* Help Suggestions */}
          <Card style={{
            background: '#fff',
            border: '1px solid #e9ecef',
            borderRadius: '8px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            marginBottom: '16px'
          }}>
            <Card.Body style={{ padding: '20px' }}>
              <h5 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#2c3e50',
                marginBottom: '16px'
              }}>
                Look like you need help with Two-Factor Authentication?
              </h5>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                marginBottom: '20px'
              }}>
                {helpSuggestions.map((suggestion, index) => {
                  const Icon = suggestion.icon;
                  return (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                        padding: '12px',
                        background: '#f8f9fa',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#f0f4f8';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#f8f9fa';
                      }}
                    >
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        background: suggestion.color + '20',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <Icon size={18} color={suggestion.color} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <h6 style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#2c3e50',
                          marginBottom: '2px',
                          lineHeight: '1.3'
                        }}>
                          {suggestion.title}
                        </h6>
                        <p style={{
                          fontSize: '12px',
                          color: '#6c757d',
                          marginBottom: 0,
                          lineHeight: '1.3'
                        }}>
                          {suggestion.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Did this help? */}
              <div style={{
                paddingTop: '16px',
                borderTop: '1px solid #e9ecef'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px'
                }}>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#2c3e50'
                  }}>
                    Did this help?
                  </span>
                  <ChevronRight size={16} color="#6c757d" />
                </div>

                <Row className="g-2">
                  <Col xs={6}>
                    <Button
                      variant="outline-secondary"
                      style={{
                        width: '100%',
                        padding: '8px',
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        border: '1px solid #dee2e6',
                        color: '#495057'
                      }}
                    >
                      <FileQuestion size={16} />
                      FA Q
                    </Button>
                  </Col>
                  <Col xs={6}>
                    <Button
                      variant="outline-secondary"
                      style={{
                        width: '100%',
                        padding: '8px',
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        border: '1px solid #dee2e6',
                        color: '#495057'
                      }}
                    >
                      <Phone size={16} />
                      No, continue with ticket
                    </Button>
                  </Col>
                </Row>
              </div>
            </Card.Body>
          </Card>

          {/* Frequently Used Topics */}
          <Card style={{
            background: '#fff',
            border: '1px solid #e9ecef',
            borderRadius: '8px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
          }}>
            <Card.Body style={{ padding: '20px' }}>
              <h5 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#2c3e50',
                marginBottom: '16px'
              }}>
                Frequently Used Topics
              </h5>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0'
              }}>
                {frequentTopics.map((topic, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 0',
                      cursor: 'pointer',
                      borderBottom: index < frequentTopics.length - 1 ? '1px solid #f0f0f0' : 'none'
                    }}
                  >
                    <span style={{
                      fontSize: '13px',
                      color: '#495057'
                    }}>
                      {topic}
                    </span>
                    <ChevronRight size={16} color="#c0c0c0" />
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      {/* Suggested Articles - Always Visible at Bottom */}
      <Row className="g-3" style={{ marginTop: '16px' }}>
        <Col xs={12}>
          <Card style={{
            background: '#fff',
            border: '1px solid #e9ecef',
            borderRadius: '8px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
          }}>
            <Card.Body style={{ padding: '20px' }}>
              <h5 style={{
                fontSize: '15px',
                fontWeight: '600',
                color: '#2c3e50',
                marginBottom: '16px'
              }}>
                Suggested Articles
              </h5>
              <Row className="g-3">
                {suggestedArticles.map((article, index) => {
                  const Icon = article.icon;
                  return (
                    <Col xs={12} sm={4} key={index}>
                      <div style={{
                        padding: '16px',
                        background: '#f8f9fa',
                        border: '1px solid #e9ecef',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        height: '100%'
                      }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#f0f4f8';
                          e.currentTarget.style.borderColor = article.color;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#f8f9fa';
                          e.currentTarget.style.borderColor = '#e9ecef';
                        }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '8px',
                          background: article.color + '20',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: '12px'
                        }}>
                          <Icon size={20} color={article.color} />
                        </div>
                        <h6 style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#2c3e50',
                          marginBottom: '2px',
                          lineHeight: '1.3'
                        }}>
                          {article.title}
                        </h6>
                        <p style={{
                          fontSize: '13px',
                          fontWeight: '600',
                          color: '#2c3e50',
                          marginBottom: '8px',
                          lineHeight: '1.3'
                        }}>
                          {article.subtitle}
                        </p>
                        <p style={{
                          fontSize: '12px',
                          color: '#6c757d',
                          marginBottom: 0,
                          lineHeight: '1.4'
                        }}>
                          {article.description}
                        </p>
                      </div>
                    </Col>
                  );
                })}
              </Row>
              <div style={{ textAlign: 'center', marginTop: '16px' }}>
                <Button
                  variant="link"
                  style={{
                    fontSize: '13px',
                    color: '#4680ff',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  See All Suggestions <ChevronRight size={16} />
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default CreateTicket;