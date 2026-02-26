import React, { useState, useEffect } from "react";
import {
  X,
  Briefcase,
  Calendar,
  Check,
  ChevronDown,
  Bell,
  MoreVertical,
  Lightbulb,
  User,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  updateJourney,
  getJourney,
  createJourneyStep,
  updateJourneyStep,
  deleteJourneyStep,
  deleteJourney,
} from "@utils/staffManagement";
import { toast } from "react-toastify";
import { Form, Modal } from "react-bootstrap";
import DeleteConfirmationModal from "@pages/partial/DeleteConfirmationModal";
import { GlobalDateTimeFormat } from "@utils/Helper";
import moment from "moment";

/** API journey step shape */
interface JourneyStepRecord {
  id?: number;
  journey_id?: string | number;
  stage?: string;
  title?: string;
  description?: string;
  status?: string;
  sort_order?: string | number;
  due_date?: string | null;
  completed_at?: string | null;
  [key: string]: unknown;
}

interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
}

interface Suggestion {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}

interface OnboardingEmployee {
  id: string;
  name: string;
  avatar: string;
  startDate: string;
  stages: string[];
  progress: number;
  status: 'In Progress' | 'On Track' | 'Overdue' | 'Completed';
  role?: string;
  department?: string;
}

interface OnboardingDetailSidebarProps {
  employee: OnboardingEmployee;
  onClose: () => void;
  onRefreshJourneys?: () => void;
}

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "in_progress", label: "In Progress" },
  { value: "on_track", label: "On Track" },
  { value: "overdue", label: "Overdue" },
  { value: "completed", label: "Completed" },
];

function statusDisplayToApiValue(display: string): string {
  const map: Record<string, string> = {
    "In Progress": "in_progress",
    "On Track": "on_track",
    Overdue: "overdue",
    Completed: "completed",
  };
  return map[display] ?? "in_progress";
}

const OnboardingDetailSidebar: React.FC<OnboardingDetailSidebarProps> = ({ employee, onClose, onRefreshJourneys }) => {
  const [activeTab, setActiveTab] = useState<"Onboarding" | "Audit & Risk Center">("Onboarding");
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [statusValue, setStatusValue] = useState<string>(() =>
    statusDisplayToApiValue(employee.status)
  );
  const [statusUpdating, setStatusUpdating] = useState(false);

  const [journeySteps, setJourneySteps] = useState<JourneyStepRecord[]>([]);
  const [stepsLoading, setStepsLoading] = useState(false);
  const [showAddStepForm, setShowAddStepForm] = useState(false);
  const [addStepSubmitting, setAddStepSubmitting] = useState(false);
  const [addStepForm, setAddStepForm] = useState({
    stage: "General",
    title: "",
    description: "",
    due_date: new Date().toISOString().slice(0, 10),
    status: "pending",
    sort_order: 0,
  });

  const [editingStep, setEditingStep] = useState<JourneyStepRecord | null>(null);
  const [editStepForm, setEditStepForm] = useState({
    stage: "General",
    title: "",
    description: "",
    due_date: "",
    status: "pending",
    sort_order: 0,
  });
  const [editStepSubmitting, setEditStepSubmitting] = useState(false);
  const [deletingStepId, setDeletingStepId] = useState<number | null>(null);
  const [deletingJourney, setDeletingJourney] = useState(false);
  const [showDeleteJourneyModal, setShowDeleteJourneyModal] = useState(false);

  useEffect(() => {
    setStatusValue(statusDisplayToApiValue(employee.status));
  }, [employee.id, employee.status]);

  const journeyId = Number(employee.id);
  const canUpdateJourney = Number.isInteger(journeyId) && journeyId > 0;

  useEffect(() => {
    if (!canUpdateJourney) return;
    let cancelled = false;
    setStepsLoading(true);
    getJourney(journeyId)
      .then((data) => {
        if (cancelled) return;
        const raw = data as { steps?: JourneyStepRecord[] };
        const list = Array.isArray(raw?.steps) ? raw.steps : [];
        setJourneySteps(list);
      })
      .catch(() => {
        if (!cancelled) setJourneySteps([]);
      })
      .finally(() => {
        if (!cancelled) setStepsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [journeyId, canUpdateJourney]);

  const handleAddStepSubmit = async () => {
    if (!canUpdateJourney) return;
    setAddStepSubmitting(true);
    try {
      await createJourneyStep(journeyId, {
        stage: addStepForm.stage,
        title: addStepForm.title,
        description: addStepForm.description,
        due_date: addStepForm.due_date,
        status: addStepForm.status,
        sort_order: addStepForm.sort_order,
       
      });
      toast.success("Step added.");
      setShowAddStepForm(false);
      setAddStepForm({
        stage: "General",
        title: "",
        description: "",
        due_date: new Date().toISOString().slice(0, 10),
        status: "pending",
        sort_order: journeySteps.length,
      });
      const data = await getJourney(journeyId) as { steps?: JourneyStepRecord[] };
      const list = Array.isArray(data?.steps) ? data.steps : [];
      setJourneySteps(list);
      onRefreshJourneys?.();
    } catch {
      // createJourneyStep handles error toast
    } finally {
      setAddStepSubmitting(false);
    }
  };

  const openEditStep = (step: JourneyStepRecord) => {
    const due = step.due_date
      ? moment(step.due_date).format("YYYY-MM-DD")
      : new Date().toISOString().slice(0, 10);
    setEditingStep(step);
    setEditStepForm({
      stage: step.stage ?? "General",
      title: step.title ?? "",
      description: step.description ?? "",
      due_date: due,
      status: step.status ?? "pending",
      sort_order: Number(step.sort_order ?? 0),
    });
  };

  const handleEditStepSubmit = async () => {
    if (!editingStep?.id || !canUpdateJourney) return;
    setEditStepSubmitting(true);
    try {
      await updateJourneyStep(journeyId, editingStep.id, {
        stage: editStepForm.stage,
        title: editStepForm.title,
        description: editStepForm.description,
        due_date: editStepForm.due_date,
        status: editStepForm.status,
        sort_order: editStepForm.sort_order,
        
      });
      toast.success("Step updated.");
      setEditingStep(null);
      const data = (await getJourney(journeyId)) as { steps?: JourneyStepRecord[] };
      setJourneySteps(Array.isArray(data?.steps) ? data.steps : []);
      onRefreshJourneys?.();
    } catch {
      // updateJourneyStep handles error toast
    } finally {
      setEditStepSubmitting(false);
    }
  };

  const handleDeleteStep = async (step: JourneyStepRecord) => {
    if (step.id == null || !canUpdateJourney) return;
    // if (!window.confirm("Delete this step?")) return;
    setDeletingStepId(step.id);
    try {
      await deleteJourneyStep(journeyId, step.id);
      toast.success("Step deleted.");
      const data = (await getJourney(journeyId)) as { steps?: JourneyStepRecord[] };
      setJourneySteps(Array.isArray(data?.steps) ? data.steps : []);
      onRefreshJourneys?.();
    } catch {
      // deleteJourneyStep handles error toast
    } finally {
      setDeletingStepId(null);
    }
  };

  const handleDeleteJourney = async () => {
    if (!canUpdateJourney) return;
    setDeletingJourney(true);
    try {
      await deleteJourney(journeyId);
      toast.success("Journey deleted.");
      setShowDeleteJourneyModal(false);
      onRefreshJourneys?.();
      onClose();
    } catch {
      // deleteJourney handles error toast
    } finally {
      setDeletingJourney(false);
    }
  };

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    if (!canUpdateJourney) return;
    setStatusUpdating(true);
    try {
      await updateJourney(journeyId, { status: newStatus });
      setStatusValue(newStatus);
      toast.success("Status updated.");
      onRefreshJourneys?.();
    } catch {
      // updateJourney handles error toast
    } finally {
      setStatusUpdating(false);
    }
  };

  // Dynamic checklist based on employee progress
  const allChecklistItems = [
    { id: '1', label: 'HR documentation submitted', threshold: 0 },
    { id: '2', label: 'Offer letter signed', threshold: 25 },
    { id: '3', label: 'Documents received and verified', threshold: 50 },
    { id: '4', label: 'IT equipment assigned', threshold: 75 },
    { id: '5', label: 'Workspace setup completed', threshold: 100 }
  ];

  const checklistItems: ChecklistItem[] = allChecklistItems.map(item => ({
    id: item.id,
    label: item.label,
    completed: employee.progress >= item.threshold
  }));

  const completedCount = checklistItems.filter(item => item.completed).length;
  const totalCount = checklistItems.length;
  const checklistProgress = Math.round((completedCount / totalCount) * 100);

  const suggestions: Suggestion[] = [
    {
      id: '1',
      icon: <Lightbulb size={20} color="#f59e0b" />,
      title: 'Onboarding delay Likely',
      description: 'IT tasks may face a 2-day delay'
    },
    {
      id: '2',
      icon: <Lightbulb size={20} color="#f59e0b" />,
      title: 'Checklist auto-generated',
      description: 'Pre-made onboarding list tailored for roles'
    }
  ];

  const handleSubmit = () => {
    console.log('Submit clicked');
    alert('Onboarding submitted successfully');
  };

  const handleCancel = () => {
    console.log('Cancel clicked');
    alert('Onboarding cancelled');
  };

  const handleSendReminder = () => {
    console.log('Send reminder clicked');
    alert(`Reminder sent to ${employee.name}`);
  };

  return (
    <div style={{
      width: '420px',
      height: '100vh',
      backgroundColor: '#ffffff',
      boxShadow: '-2px 0 8px rgba(0,0,0,0.1)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Header Section */}
      <div style={{
        padding: '20px 24px',
        borderBottom: '1px solid #e9d5ff'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <h2 style={{ 
            fontSize: '20px', 
            fontWeight: '600', 
            color: '#1f2937',
            margin: 0
          }}>
            Onboarding Detail
          </h2>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {canUpdateJourney && (
              <button
                type="button"
                onClick={() => setShowDeleteJourneyModal(true)}
                disabled={deletingJourney}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 12px",
                  backgroundColor: "transparent",
                  color: "#b91c1c",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: deletingJourney ? "not-allowed" : "pointer",
                }}
              >
                <Trash2 size={16} />
              </button>
            )}
            <button
              onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              color: '#6b7280',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <X size={24} />
          </button>
        </div>
        </div>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <h3 style={{ 
              fontSize: '20px', 
              fontWeight: '600', 
              color: '#1f2937',
              margin: '0 0 8px 0'
            }}>
              {employee.name}
            </h3>
            <div style={{ marginBottom: '12px' }}>
              <p style={{ 
                fontSize: '14px', 
                color: '#6b7280',
                margin: '0 0 4px 0',
                fontWeight: '500'
              }}>
                New Hire
              </p>
              {employee.role && (
                <p style={{ 
                  fontSize: '14px', 
                  color: '#6b7280',
                  margin: '0 0 12px 0'
                }}>
                  {employee.role}
                </p>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {employee.department && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Briefcase size={14} color="#9ca3af" />
                  <span style={{ fontSize: '13px', color: '#6b7280' }}>
                    {employee.department}
                  </span>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={14} color="#9ca3af" />
                <span style={{ fontSize: '13px', color: '#6b7280' }}>
                  {employee.startDate}
                </span>
              </div>
            </div>
          </div>

          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <User size={40} color="white" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      {/* <div style={{
        display: 'flex',
        gap: '8px',
        padding: '16px 24px',
        borderBottom: '1px solid #e9d5ff'
      }}>
        <button
          onClick={() => setActiveTab('Onboarding')}
          style={{
            padding: '8px 16px',
            backgroundColor: activeTab === 'Onboarding' ? '#6366f1' : 'white',
            color: activeTab === 'Onboarding' ? 'white' : '#6b7280',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s'
          }}
        >
          <User size={16} />
          Onboarding
        </button>
        <button
          onClick={() => setActiveTab('Audit & Risk Center')}
          style={{
            padding: '8px 16px',
            backgroundColor: activeTab === 'Audit & Risk Center' ? '#8b5cf6' : 'white',
            color: activeTab === 'Audit & Risk Center' ? 'white' : '#6b7280',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          Audit & Risk Center
        </button>
      </div> */}

      {/* Scrollable Content */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '24px',
        display: 'none',
      }}>
        {/* Hir-date Section */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px'
        }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
  <Calendar size={18} color="#8b5cf6" />
  <span style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>
    Hire date
  </span>
  <span style={{ fontSize: '14px', color: '#9ca3af' }}>
    Mar 2, 2023
  </span>
</div>

          <button
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              color: '#9ca3af'
            }}
          >
            <MoreVertical size={18} />
          </button>
        </div>

        {/* Progress Bar */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px'
          }}>
            <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
              {completedCount} of {totalCount} completed ({checklistProgress}%)
            </span>
          </div>
          <div style={{
            width: '100%',
            height: '8px',
            backgroundColor: '#e9d5ff',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${checklistProgress}%`,
              height: '100%',
              backgroundColor: '#8b5cf6',
              borderRadius: '4px',
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>

        {/* Checklist Items */}
        <div style={{ marginBottom: '24px' }}>
          {checklistItems.map(item => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 0',
                borderBottom: '1px solid #e9d5ff'
              }}
            >
              <div style={{
                width: '20px',
                height: '20px',
                borderRadius: '4px',
                backgroundColor: item.completed ? '#8b5cf6' : '#e9d5ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {item.completed && <Check size={14} color="white" />}
              </div>
              <span style={{ 
                fontSize: '14px', 
                color: '#4b5563',
                textDecoration: item.completed ? 'line-through' : 'none'
              }}>
                {item.label}
              </span>
            </div>
          ))}
        </div>

        {/* Assignee and Reminder Section */}
        <div style={{ 
          display: 'flex', 
          gap: '12px',
          marginBottom: '24px'
        }}>
          <div style={{ position: 'relative', flex: '1 1 0' }}>
            <button
              onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
              style={{
                width: '100%',
                padding: '10px 16px',
                border: '1px solid #e9d5ff',
                borderRadius: '8px',
                backgroundColor: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <User size={14} color="white" />
                </div>
                <span>Hassan Mir</span>
              </div>
              <ChevronDown size={16} />
            </button>
            {showAssigneeDropdown && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: '4px',
                backgroundColor: 'white',
                border: '1px solid #e9d5ff',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                zIndex: 10
              }}>
                {['Hassan Mir', 'Adeel Raza', 'Farah Ahmed'].map(person => (
                  <div
                    key={person}
                    onClick={() => {
                      setShowAssigneeDropdown(false);
                      console.log('Selected:', person);
                    }}
                    style={{
                      padding: '10px 16px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                  >
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <User size={14} color="white" />
                    </div>
                    {person}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <button
            onClick={handleSendReminder}
            style={{
              flex: '1 1 0',
              padding: '10px 0px',
              backgroundColor: 'white',
              color: '#6b7280',
              border: '1px solid #e9d5ff',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
          >
            <Bell size={16} />
            Send reminder
          </button>
        </div>

        {/* AI Suggestions Section */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <h4 style={{ 
              fontSize: '16px', 
              fontWeight: '600', 
              color: '#1f2937',
              margin: 0
            }}>
              AI Suggestions
            </h4>
            <button
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                color: '#9ca3af'
              }}
            >
              <MoreVertical size={20} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {suggestions.map(suggestion => (
              <div
                key={suggestion.id}
                style={{
                  display: 'flex',
                  gap: '12px',
                  padding: '16px',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  border: '1px solid #e9d5ff'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fefcff'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: '#fef3c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {suggestion.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontSize: '14px', 
                    fontWeight: '500', 
                    color: '#1f2937',
                    marginBottom: '4px'
                  }}>
                    {suggestion.title}
                  </div>
                  <div style={{ 
                    fontSize: '13px', 
                    color: '#6b7280',
                    lineHeight: '1.5'
                  }}>
                    {suggestion.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Status */}
      {canUpdateJourney && (
        <div style={{ padding: "16px 24px", borderTop: "1px solid #e9d5ff" }}>
          <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "8px" }}>
            Status
          </label>
          <select
            className="form-select"
            value={statusValue}
            onChange={handleStatusChange}
            disabled={statusUpdating}
            style={{
              width: "100%",
              padding: "10px 12px",
              fontSize: "14px",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              backgroundColor: "white",
              color: "#1f2937",
              cursor: statusUpdating ? "not-allowed" : "pointer",
            }}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {statusUpdating && (
            <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "6px" }}>Updating…</div>
          )}
        </div>
      )}

      {/* Steps list & Add step */}
      {canUpdateJourney && (
        <div style={{ padding: "16px 24px", borderTop: "1px solid #e9d5ff", flex: 1, overflow: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <label style={{ fontSize: "13px", fontWeight: "600", color: "#374151" }}>Steps</label>
            <button
              type="button"
              onClick={() => {
                setAddStepForm((f) => ({ ...f, sort_order: journeySteps.length }));
                setShowAddStepForm(true);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 12px",
                backgroundColor: "#6366f1",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              <Plus size={16} />
              Add step
            </button>
          </div>
          {stepsLoading ? (
            <div style={{ fontSize: "13px", color: "#6b7280" }}>Loading steps…</div>
          ) : journeySteps.length === 0 && !showAddStepForm ? (
            <div style={{ fontSize: "13px", color: "#6b7280" }}>No steps yet.</div>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {journeySteps.map((step) => (
                <li
                  key={step.id ?? step.title ?? String(Math.random())}
                  style={{
                    padding: "12px",
                    marginBottom: "8px",
                    backgroundColor: "#f9fafb",
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "14px", fontWeight: "600", color: "#1f2937", marginBottom: "4px" }}>
                        {step.title || "—"}
                      </div>
                      <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}>
                        {step.stage && <span style={{ marginRight: "8px" }}>{step.stage}</span>}
                        {step.status && (
                          <span style={{ padding: "2px 6px", backgroundColor: "#e5e7eb", borderRadius: "4px" }}>
                            {step.status}
                          </span>
                        )}
                      </div>
                      {step.description && (
                        <div style={{ fontSize: "13px", color: "#4b5563" }}>{step.description}</div>
                      )}
                      {step.due_date && (
                        <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>
                          Due: {moment(step.due_date).format(GlobalDateTimeFormat)}
                        </div>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditStep(step);
                        }}
                        title="Edit"
                        style={{
                          padding: "6px",
                          border: "none",
                          borderRadius: "6px",
                          backgroundColor: "#e0e7ff",
                          color: "#4338ca",
                          cursor: "pointer",
                        }}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteStep(step);
                        }}
                        disabled={deletingStepId === step.id}
                        title="Delete"
                        style={{
                          padding: "6px",
                          border: "none",
                          borderRadius: "6px",
                          backgroundColor: "#fee2e2",
                          color: "#b91c1c",
                          cursor: deletingStepId === step.id ? "not-allowed" : "pointer",
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <Modal show={showAddStepForm} onHide={() => setShowAddStepForm(false)} centered style={{ zIndex: 99999 }}>
            <Modal.Header closeButton>
              <Modal.Title>New step</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <Form.Group className="mb-3">
                  <Form.Label>Stage</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Stage"
                    value={addStepForm.stage}
                    onChange={(e) => setAddStepForm((f) => ({ ...f, stage: e.target.value }))}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Title</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Title"
                    value={addStepForm.title}
                    onChange={(e) => setAddStepForm((f) => ({ ...f, title: e.target.value }))}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    placeholder="Description"
                    value={addStepForm.description}
                    onChange={(e) => setAddStepForm((f) => ({ ...f, description: e.target.value }))}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Due Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={addStepForm.due_date}
                    onChange={(e) => setAddStepForm((f) => ({ ...f, due_date: e.target.value }))}
                  />
                </Form.Group>
                {/* <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Control
                    as="select"
                    value={addStepForm.status}
                    onChange={(e) => setAddStepForm((f) => ({ ...f, status: e.target.value }))}
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </Form.Control>
                </Form.Group> */}
                {/* <Form.Group className="mb-3">
                  <Form.Label>Sort Order</Form.Label>
                  <Form.Control
                    type="number"
                    min={0}
                    value={addStepForm.sort_order}
                    onChange={(e) => setAddStepForm((f) => ({ ...f, sort_order: Number(e.target.value) || 0 }))}
                  />
                </Form.Group> */}
               
              </div>
            </Modal.Body>
            <Modal.Footer>
              <button
                type="button"
                onClick={() => setShowAddStepForm(false)}
                disabled={addStepSubmitting}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "white",
                  color: "#6b7280",
                  border: "1px solid #e5e7eb",
                  borderRadius: "6px",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: addStepSubmitting ? "not-allowed" : "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddStepSubmit}
                disabled={addStepSubmitting}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#6366f1",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: addStepSubmitting ? "not-allowed" : "pointer",
                }}
              >
                {addStepSubmitting ? "Adding…" : "Add step"}
              </button>
            </Modal.Footer>
          </Modal>

          <Modal show={editingStep != null} onHide={() => setEditingStep(null)} centered style={{ zIndex: 99999 }}>
            <Modal.Header closeButton>
              <Modal.Title>Edit step</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form.Group className="mb-3">
                <Form.Label>Stage</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Stage"
                  value={editStepForm.stage}
                  onChange={(e) => setEditStepForm((f) => ({ ...f, stage: e.target.value }))}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Title</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Title"
                  value={editStepForm.title}
                  onChange={(e) => setEditStepForm((f) => ({ ...f, title: e.target.value }))}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  placeholder="Description"
                  value={editStepForm.description}
                  onChange={(e) => setEditStepForm((f) => ({ ...f, description: e.target.value }))}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Due Date</Form.Label>
                <Form.Control
                  type="date"
                  value={editStepForm.due_date}
                  onChange={(e) => setEditStepForm((f) => ({ ...f, due_date: e.target.value }))}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Status</Form.Label>
                <Form.Control
                  as="select"
                  value={editStepForm.status}
                  onChange={(e) => setEditStepForm((f) => ({ ...f, status: e.target.value }))}
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </Form.Control>
              </Form.Group>
              {/* <Form.Group className="mb-3">
                <Form.Label>Sort Order</Form.Label>
                <Form.Control
                  type="number"
                  min={0}
                  value={editStepForm.sort_order}
                  onChange={(e) => setEditStepForm((f) => ({ ...f, sort_order: Number(e.target.value) || 0 }))}
                />
              </Form.Group> */}
            </Modal.Body>
            <Modal.Footer>
              <button
                type="button"
                onClick={() => setEditingStep(null)}
                disabled={editStepSubmitting}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "white",
                  color: "#6b7280",
                  border: "1px solid #e5e7eb",
                  borderRadius: "6px",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: editStepSubmitting ? "not-allowed" : "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleEditStepSubmit}
                disabled={editStepSubmitting}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#6366f1",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: editStepSubmitting ? "not-allowed" : "pointer",
                }}
              >
                {editStepSubmitting ? "Saving…" : "Save"}
              </button>
            </Modal.Footer>
          </Modal>
        </div>
      )}

      {/* Footer Action Buttons */}
      {/* <div style={{
        padding: '20px 24px',
        borderTop: '1px solid #e9d5ff',
        display: 'flex',
        gap: '12px',
        backgroundColor: '#f5f3ff'
      }}>
        <button
          onClick={handleCancel}
          style={{
            flex: 1,
            padding: '12px 20px',
            backgroundColor: 'white',
            color: '#6b7280',
            border: '1px solid #e9d5ff',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fafafa'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          style={{
            flex: 1,
            padding: '12px 20px',
            backgroundColor: '#6366f1',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#7c3aed'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#8b5cf6'}
        >
          Submit
        </button>
      </div> */}

      <DeleteConfirmationModal
        show={showDeleteJourneyModal}
        onHide={() => setShowDeleteJourneyModal(false)}
        onConfirm={handleDeleteJourney}
        itemName={`onboarding journey for ${employee.name}`}
        itemType="journey"
        loading={deletingJourney}
      />
    </div>
  );
};

export default OnboardingDetailSidebar;