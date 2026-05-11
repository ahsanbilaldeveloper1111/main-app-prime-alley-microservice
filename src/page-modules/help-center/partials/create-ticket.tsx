import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Row, Col, Card, Form, Button } from 'react-bootstrap';
import type { LucideIcon } from 'lucide-react';
import {
  Paperclip,
  CheckCircle2,
  ChevronRight,
  X,
  FileQuestion,
  Phone,
  Plus,
  RotateCcw,
  Eye,
  Trash2
} from 'lucide-react';
import { useRouter } from 'next/router';
import { CreateUserTicket } from '@utils/tickets';
import { GetAllTypes } from '@utils/ticket-types';
import { toast } from 'react-toastify';
import RichTextEditor from './RichTextEditor';

interface CreateTicketProps {
  onBack: () => void;
}

type TicketTypeOption = {
  id: number | string;
  name?: string;
};

function normalizeTicketTypeList(data: unknown): TicketTypeOption[] {
  if (Array.isArray(data)) {
    return data as TicketTypeOption[];
  }
  return [];
}

function stripHTML(html: string): string {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent ?? tmp.innerText ?? '';
}

function getPriorityDisplayLabel(priority: string): string {
  switch (priority) {
    case '0':
      return 'Low';
    case '1':
      return 'Medium';
    case '2':
      return 'High';
    case '3':
      return 'Critical';
    default:
      return 'Not selected';
  }
}

function openBlobInNewTab(file: File): void {
  const url = URL.createObjectURL(file);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.target = '_blank';
  anchor.rel = 'noopener noreferrer';
  anchor.click();
  globalThis.setTimeout(() => URL.revokeObjectURL(url), 500);
}

function ticketIdToDisplayString(id: unknown): string | null {
  if (id === undefined || id === null) {
    return null;
  }
  if (typeof id === 'string' || typeof id === 'number') {
    return String(id);
  }
  return null;
}

interface FormStepProgressProps {
  steps: { number: number; label: string }[];
  currentStep: number;
  setCurrentStep: (step: number) => void;
}

function FormStepProgress({
  steps,
  currentStep,
  setCurrentStep
}: Readonly<FormStepProgressProps>) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '0'
      }}
    >
      {steps.map((step, index) => (
        <React.Fragment key={step.number}>
          <button
            type="button"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: step.number <= currentStep + 1 ? 'pointer' : 'default',
              border: 'none',
              background: 'none',
              padding: 0,
              fontFamily: 'inherit',
              textAlign: 'left'
            }}
            onClick={() => {
              if (step.number <= currentStep + 1) {
                setCurrentStep(step.number);
              }
            }}
            aria-current={currentStep === step.number ? 'step' : undefined}
            aria-label={`Step ${step.number}: ${step.label}`}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: currentStep >= step.number ? '#4680ff' : '#e9ecef',
                color: currentStep >= step.number ? '#fff' : '#6c757d',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              {currentStep > step.number ? (
                <CheckCircle2 aria-hidden size={16} />
              ) : (
                step.number
              )}
            </div>
            <span
              style={{
                fontSize: '14px',
                fontWeight: currentStep === step.number ? '600' : '400',
                color: currentStep >= step.number ? '#4680ff' : '#6c757d'
              }}
            >
              {step.label}
            </span>
          </button>
          {index < steps.length - 1 && (
            <ChevronRight aria-hidden size={16} color="#6c757d" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

const reviewFieldLabelStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#6c757d',
  display: 'block',
  marginBottom: '4px'
};

const CreateTicket: React.FC<CreateTicketProps> = ({ onBack }) => {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form state
  const [category, setCategory] = useState<string>("");
  const [subject, setSubject] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [descriptionHTML, setDescriptionHTML] = useState<string>("");
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [newTicketPriority, setNewTicketPriority] = useState<string>('');

  // Data state
  const [types, setTypes] = useState<TicketTypeOption[]>([]);

  // UI state
  const [creatingTicket, setCreatingTicket] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedTicketId, setSubmittedTicketId] = useState('');

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const typesData = await GetAllTypes();
        setTypes(normalizeTicketTypeList(typesData));
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);


  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const file = files[0];
    if (!file) return;

    const maxSize = 1 * 1024 * 1024; // 1MB
    if (file.size > maxSize) {
      toast.error(`${file.name} exceeds 1MB limit`);
      return;
    }

    setAttachedFiles([file]);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Remove file
  const removeFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleEditorChange = (html: string, text: string) => {
    setDescriptionHTML(html);
    setDescription(text);
  };

  const handleSubmit = useCallback(async () => {
    if (!category) {
      toast.error('Please select a category');
      return;
    }
    const trimmedSubject = subject.trim();
    if (trimmedSubject.length < 5) {
      toast.error('Please enter a subject (Min: 5 chars)');
      return;
    }
    const plainText = descriptionHTML ? stripHTML(descriptionHTML) : description;
    if (plainText.length < 50 || plainText.length > 500) {
      toast.error('Description must be between 50 and 500 characters');
      return;
    }

    const maxFileSize = 1024 * 1024;
    for (let i = 0; i < attachedFiles.length; i++) {
      const file = attachedFiles[i];
      if (file.size > maxFileSize) {
        toast.error(`File ${i + 1} size must be less than 1MB`);
        return;
      }
    }

    const typeId =
      category || (types.length > 0 ? String(types[0].id) : '');
    const priority = Number.parseInt(newTicketPriority || '0', 10);
    const ticketDescription = descriptionHTML || description;

    setCreatingTicket(true);
    try {
      const response: unknown = await CreateUserTicket(
        subject,
        ticketDescription,
        Number.parseInt(typeId.toString(), 10),
        priority,
        attachedFiles.length > 0 ? attachedFiles : undefined
      );
      const rawId =
        response &&
        typeof response === 'object' &&
        'data' in response
          ? Reflect.get(response, 'data')
          : undefined;
      const extractedId =
        rawId !== null && typeof rawId === 'object' && 'id' in rawId
          ? Reflect.get(rawId, 'id')
          : undefined;
      const ticketId = ticketIdToDisplayString(extractedId);

      if (ticketId !== null && ticketId.length > 0) {
        setSubmittedTicketId(ticketId);
        setIsSubmitted(true);
        toast.success('Ticket created successfully!');
      }
    } catch (error: unknown) {
      console.error('Error creating ticket:', error);
    } finally {
      setCreatingTicket(false);
    }
  }, [
    category,
    subject,
    description,
    descriptionHTML,
    attachedFiles,
    newTicketPriority,
    types
  ]);

  const steps = [
    { number: 1, label: 'Describe Issue' },
    { number: 2, label: 'Select Priority' },
    { number: 3, label: 'Review' }
  ];

  if (isSubmitted) {
    return (
      <div style={{ background: '#f4f7fa', minHeight: '100vh', padding: '40px 20px' }}>
        <Card style={{
          background: '#fff',
          border: '1px solid #e9ecef',
          borderRadius: '8px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
          textAlign: 'center',
          padding: '60px 40px',
          maxWidth: '600px',
          margin: '0 auto'
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
            <CheckCircle2 aria-hidden size={40} color="#fff" strokeWidth={2.5} />
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
            marginBottom: '40px'
          }}>
            Your ticket <span style={{ color: '#4680ff', fontWeight: '600' }}>#{submittedTicketId}</span> has been successfully created.
          </p>

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
        </Card>
      </div>
    );
  }

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

  const suggestedArticles: {
    title: string;
    subtitle: string;
    description: string;
    icon: LucideIcon;
    color: string;
  }[] = [
    {
      title: 'Setting Up',
      subtitle: 'Two-Factor Authentication',
      description: 'Step-by-step help for securing your account.',
      icon: Plus,
      color: '#4680ff'
    },
    {
      title: 'Resetting Your 2FA',
      subtitle: 'Device',
      description: 'Replace or reset your authentication device.',
      icon: RotateCcw,
      color: '#04a9f5'
    },
    {
      title: 'Troubleshooting',
      subtitle: '2FA Issues',
      description: 'Fix common two-factor sign-in problems.',
      icon: FileQuestion,
      color: '#5babf6'
    }
  ];

  return (
    <div >
      <div >
        <Row className="g-3">
          {/* Main Content - Left Column */}
          <Col xs={12} lg={8}>
            {/* Form Card */}
            <Card style={{
              background: '#fff',
              border: '1px solid #e9ecef',
              borderRadius: '8px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}>
              <Card.Body style={{ padding: '32px' }}>
                {/* Header */}
                <div style={{ marginBottom: '32px' }}>
                  <h1 style={{
                    fontSize: '32px',
                    fontWeight: '700',
                    color: '#2c3e50',
                    marginBottom: '8px'
                  }}>
                    Create Ticket
                  </h1>
                  <p style={{
                    fontSize: '16px',
                    color: '#6c757d',
                    marginBottom: '24px'
                  }}>
                    Tell us how we can assist you
                  </p>

                  {/* Step Progress Indicator */}
                  <FormStepProgress
                    steps={steps}
                    currentStep={currentStep}
                    setCurrentStep={setCurrentStep}
                  />
                </div>
            {/* Category */}
            <div style={{ marginBottom: '24px' }}>
              <Form.Label style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#2c3e50',
                marginBottom: '8px',
                display: 'block'
              }}>
                Category
              </Form.Label>
              <Form.Select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                }}
                style={{
                  fontSize: '14px',
                  padding: '10px 14px',
                  border: '1px solid #dee2e6',
                  borderRadius: '6px',
                  width: '100%'
                }}
              >
                <option value="">Select a category</option>
                {types.map((type) => (
                  <option key={String(type.id)} value={String(type.id)}>
                    {type.name}
                  </option>
                ))}
              </Form.Select>
            </div>

            {/* Subject */}
            <div style={{ marginBottom: '24px' }}>
              <Form.Label style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#2c3e50',
                marginBottom: '8px',
                display: 'block'
              }}>
                Subject
              </Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter a brief summary of the issue..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                style={{
                  fontSize: '14px',
                  padding: '10px 14px',
                  border: '1px solid #dee2e6',
                  borderRadius: '6px'
                }}
              />
            </div>

            {/* Describe the issue */}
            <div style={{ marginBottom: '24px' }}>
              <Form.Label style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#2c3e50',
                marginBottom: '8px',
                display: 'block'
              }}>
                Describe the issue
              </Form.Label>

              <RichTextEditor
                value={descriptionHTML}
                onChange={handleEditorChange}
                placeholder="Describe your issue in detail..."
                minHeight="150px"
                maxHeight="300px"
                maxLength={500}
              />
            </div>

            {/* File Upload Section */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
              paddingTop: '16px',
              borderTop: '1px solid #e9ecef',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                flexWrap: 'wrap'
              }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                <Button
                  variant="outline-secondary"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={attachedFiles.length >= 1}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    border: '1px solid #dee2e6',
                    borderRadius: '6px',
                    background: '#fff',
                    color: '#495057',
                    fontSize: '14px'
                  }}
                >
                  <Paperclip aria-hidden size={16} />
                  Add screenshot
                </Button>
                <span style={{
                  fontSize: '13px',
                  color: '#6c757d'
                }}>
                  1 file (Up to 1MB)
                </span>
              </div>
              {currentStep === 1 && (
                <Button
                  onClick={() => {
                    // Validate step 1 before moving forward
                    if (!category) {
                      toast.error("Please select a category");
                      return;
                    }
                    if (!subject?.trim() || subject?.trim()?.length < 5) {
                      toast.error("Please enter a subject (Min: 5 chars)");
                      return;
                    }
                    if (description.length < 50) {
                      toast.error("Description must be at least 50 characters");
                      return;
                    }
                    setCurrentStep(2);
                  }}
                  style={{
                    background: '#4680ff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '10px 24px',
                    fontSize: '14px',
                    fontWeight: '500',
                    minWidth: '120px'
                  }}
                >
                  Next
                </Button>
              )}
            </div>

            {/* Additional Info Text - Only show on step 1 */}
            {currentStep === 1 && (
              <>
                <p style={{
                  fontSize: '13px',
                  color: '#6c757d',
                  marginBottom: '24px',
                  fontStyle: 'italic'
                }}>
                  Need to share more details? You can send additional screenshots after ticket creation.
                </p>

                {/* Attached Files Preview */}
                {attachedFiles.length > 0 && (
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '12px',
                    marginBottom: '24px'
                  }}>
                    {attachedFiles.map((file, index: number) => (
                      <div
                        key={`${file.name}-${file.size}-${index}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 12px',
                          background: '#f8f9fa',
                          border: '1px solid #dee2e6',
                          borderRadius: '6px',
                          fontSize: '13px',
                          color: '#495057'
                        }}
                      >
                        <Paperclip aria-hidden size={14} />
                        <span style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {file.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#6c757d',
                            cursor: 'pointer',
                            padding: '0',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                        >
                          <X aria-hidden size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Step 2: Select Priority */}
            {currentStep === 2 && (
              <div>
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  color: '#2c3e50',
                  marginBottom: '24px'
                }}>
                  Select Priority
                </h3>
                <div style={{ marginBottom: '24px' }}>
                  <Form.Label style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#2c3e50',
                    marginBottom: '8px',
                    display: 'block'
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
                      borderRadius: '6px',
                      width: '100%'
                    }}
                  >
                    <option value="">Select Priority</option>
                    <option value="0">Low</option>
                    <option value="1">Medium</option>
                    <option value="2">High</option>
                    <option value="3">Critical</option>
                  </Form.Select>
                </div>

                {/* Navigation Buttons */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingTop: '16px',
                  borderTop: '1px solid #e9ecef'
                }}>
                  <Button
                    variant="outline-secondary"
                    onClick={() => setCurrentStep(1)}
                    style={{
                      border: '1px solid #dee2e6',
                      borderRadius: '6px',
                      padding: '10px 24px',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#495057',
                      background: '#fff'
                    }}
                  >
                    Back
                  </Button>
                  <Button
                    onClick={() => {
                      if (!newTicketPriority) {
                        toast.error("Please select a priority");
                        return;
                      }
                      setCurrentStep(3);
                    }}
                    style={{
                      background: '#4680ff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '10px 24px',
                      fontSize: '14px',
                      fontWeight: '500',
                      minWidth: '120px'
                    }}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Review */}
            {currentStep === 3 && (
              <div>
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  color: '#2c3e50',
                  marginBottom: '24px'
                }}>
                  Review
                </h3>
                
                <div style={{ marginBottom: '24px' }}>
                  <div style={{
                    padding: '16px',
                    background: '#f8f9fa',
                    borderRadius: '8px',
                    border: '1px solid #e9ecef'
                  }}>
                    <div style={{ marginBottom: '16px' }}>
                      <div style={reviewFieldLabelStyle}>Category</div>
                      <p style={{
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#2c3e50',
                        margin: 0
                      }}>
                        {types.find((t) => String(t.id) === String(category))?.name || 'Not selected'}
                      </p>
                    </div>
                    <div style={{ marginBottom: '16px' }}>
                      <div style={reviewFieldLabelStyle}>Subject</div>
                      <p style={{
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#2c3e50',
                        margin: 0
                      }}>{subject || 'Not provided'}</p>
                    </div>
                    <div style={{ marginBottom: '16px' }}>
                      <div style={reviewFieldLabelStyle}>Description</div>
                      <p style={{
                        fontSize: '14px',
                        color: '#2c3e50',
                        margin: 0,
                        whiteSpace: 'pre-wrap'
                      }}>{description || 'Not provided'}</p>
                    </div>
                    <div style={{ marginBottom: '16px' }}>
                      <div style={reviewFieldLabelStyle}>Priority</div>
                      <p style={{
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#2c3e50',
                        margin: 0
                      }}>
                        {getPriorityDisplayLabel(newTicketPriority)}
                      </p>
                    </div>
                    <div>
                      <div style={{
                        fontSize: '12px',
                        color: '#6c757d',
                        display: 'block',
                        marginBottom: '8px'
                      }}>Attachments</div>
                      {attachedFiles.length > 0 ? (
                        <div style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '8px'
                        }}>
                          {attachedFiles.map((file, index: number) => (
                            <div
                              key={`${file.name}-${file.size}-${index}`}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '8px 12px',
                                background: '#fff',
                                border: '1px solid #dee2e6',
                                borderRadius: '6px',
                                fontSize: '12px',
                                color: '#495057'
                              }}
                            >
                              <Paperclip aria-hidden size={14} />
                              <span style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {file.name}
                              </span>
                              <span style={{ color: '#6c757d', fontSize: '11px' }}>
                                ({(file.size / 1024).toFixed(1)} KB)
                              </span>
                              <button
                                type="button"
                                onClick={() => openBlobInNewTab(file)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#4680ff',
                                  cursor: 'pointer',
                                  padding: '4px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  borderRadius: '4px',
                                  transition: 'background 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = '#f0f4ff';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = 'none';
                                }}
                                title="View file"
                                aria-label={`View file ${file.name}`}
                              >
                                <Eye aria-hidden size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => removeFile(index)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#dc3545',
                                  cursor: 'pointer',
                                  padding: '4px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  borderRadius: '4px',
                                  transition: 'background 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = '#fff5f5';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = 'none';
                                }}
                                title="Remove file"
                                aria-label={`Remove file ${file.name}`}
                              >
                                <Trash2 aria-hidden size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p style={{
                          fontSize: '14px',
                          color: '#6c757d',
                          margin: 0,
                          fontStyle: 'italic'
                        }}>No attachments</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingTop: '16px',
                  borderTop: '1px solid #e9ecef'
                }}>
                  <Button
                    variant="outline-secondary"
                    onClick={() => setCurrentStep(2)}
                    style={{
                      border: '1px solid #dee2e6',
                      borderRadius: '6px',
                      padding: '10px 24px',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#495057',
                      background: '#fff'
                    }}
                  >
                    Back
                  </Button>
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
                      minWidth: '140px'
                    }}
                  >
                    {creatingTicket ? 'Submitting...' : 'Submit Ticket'}
                  </Button>
                </div>
              </div>
            )}
          </Card.Body>
        </Card>
          </Col>

          {/* Sidebar - Right Column */}
          <Col xs={12} lg={4}>
            {/* Help Suggestions Card */}
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
                  Looks like you need help with Two-Factor Authentication?
                </h5>

                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  marginBottom: '20px'
                }}>
                  {helpSuggestions.map((suggestion) => {
                    const Icon = suggestion.icon;
                    return (
                      <button
                        key={suggestion.title}
                        type="button"
                        onClick={() => router.push('/help-center/knowledge-base')}
                        aria-label={`Open knowledge base: ${suggestion.title}`}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '12px',
                          padding: '12px',
                          background: '#f8f9fa',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          border: '1px solid transparent',
                          width: '100%',
                          textAlign: 'left',
                          fontFamily: 'inherit',
                          margin: 0
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
                          <Icon aria-hidden size={18} color={suggestion.color} />
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
                      </button>
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
                    <ChevronRight aria-hidden size={16} color="#6c757d" />
                  </div>

                  <Row className="g-2">
                    <Col xs={6}>
                      <Button
                        variant="outline-secondary"
                        type="button"
                        onClick={() => router.push('/help-center/knowledge-base')}
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
                        <FileQuestion aria-hidden size={16} />
                        FAQ
                      </Button>
                    </Col>
                    <Col xs={6}>
                      <Button
                        variant="outline-secondary"
                        type="button"
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
                        <Phone aria-hidden size={16} />
                        No, continue with ticket
                      </Button>
                    </Col>
                  </Row>
                </div>
              </Card.Body>
            </Card>

            {/* Frequently Used Topics Card */}
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
                    <button
                      key={topic}
                      type="button"
                      onClick={() => router.push('/help-center/knowledge-base')}
                      aria-label={`${topic} — open knowledge base`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        padding: '12px 0',
                        cursor: 'pointer',
                        borderBottom: index < frequentTopics.length - 1 ? '1px solid #f0f0f0' : 'none',
                        background: 'none',
                        borderTop: 'none',
                        borderLeft: 'none',
                        borderRight: 'none',
                        fontFamily: 'inherit',
                        textAlign: 'left',
                        margin: 0
                      }}
                    >
                      <span style={{
                        fontSize: '13px',
                        color: '#495057'
                      }}>
                        {topic}
                      </span>
                      <ChevronRight aria-hidden size={16} color="#c0c0c0" />
                    </button>
                  ))}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Suggested Articles Section */}
        <div style={{ marginTop: '32px' }}>
          <h5 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#2c3e50',
            marginBottom: '20px'
          }}>
            Suggested Articles
          </h5>
          <Row className="g-3">
            {suggestedArticles.map((article) => {
              const Icon = article.icon;
              return (
                <Col xs={12} sm={4} key={`${article.title}-${article.subtitle}`}>
                  <button
                    type="button"
                    onClick={() => router.push('/help-center/knowledge-base')}
                    aria-label={`Open suggested article: ${article.title} ${article.subtitle}`}
                    style={{
                      padding: '16px',
                      background: '#fff',
                      border: '1px solid #e9ecef',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      height: '100%',
                      width: '100%',
                      display: 'block',
                      textAlign: 'left',
                      fontFamily: 'inherit',
                      margin: 0,
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#f8f9fa';
                      e.currentTarget.style.borderColor = article.color;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#fff';
                      e.currentTarget.style.borderColor = '#e9ecef';
                    }}
                  >
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
                      <Icon aria-hidden size={20} color={article.color} />
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
                  </button>
                </Col>
              );
            })}
          </Row>
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <Button
              variant="link"
              type="button"
              onClick={() => router.push('/help-center/knowledge-base')}
              style={{
                fontSize: '13px',
                color: '#4680ff',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: 0
              }}
            >
              See All Suggestions <ChevronRight aria-hidden size={16} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateTicket;
