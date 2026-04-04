import React, { useState, useEffect, useCallback, useMemo } from "react";
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
import { JOURNEY_STATUS_OPTIONS as STATUS_OPTIONS } from "@utils/workforce/journeyStatusOptions";

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
  status: "In Progress" | "On Track" | "Completed";
  role?: string;
  department?: string;
  total_steps_count?: string | number;
  completed_steps_count?: string | number;
}

interface OnboardingDetailSidebarProps {
  employee: OnboardingEmployee;
  onClose: () => void;
  onRefreshJourneys?: () => void;
}

function statusDisplayToApiValue(display: string): string {
  const map: Record<string, string> = {
    "In Progress": "in_progress",
    "On Track": "on_track",
    "Completed": "completed",
  };
  return map[display] ?? "in_progress";
}

function isEmployeeJourneyDisplayCompleted(status: string): boolean {
  return status.trim().toLowerCase() === "completed";
}

/** e.g. `in_progress` → `In Progress` */
function formatJourneyStepStatusForDisplay(status: string): string {
  return status
    .split("_")
    .filter((segment) => segment.length > 0)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase())
    .join(" ");
}

function logJourneySidebarError(context: string, error: unknown): void {
  console.error(`[OnboardingDetailSidebar] ${context}`, error);
}

/** `journey.start_date` (ISO) → `YYYY-MM-DD` for `<input type="date" min>` (UTC calendar date). */
function journeyStartDateToInputMin(iso: string | null | undefined): string | undefined {
  if (iso == null || String(iso).trim() === "") return undefined;
  const trimmed = String(iso).trim();
  if (Number.isNaN(Date.parse(trimmed))) return undefined;
  return moment.utc(trimmed).format("YYYY-MM-DD");
}

function readJourneyStartDateFromPayload(data: unknown): string | null {
  if (data == null || typeof data !== "object") return null;
  const s = (data as { start_date?: unknown }).start_date;
  return typeof s === "string" && s.trim() !== "" ? s.trim() : null;
}

function clampDueDateToJourneyMin(due: string, min: string | undefined): string {
  if (min == null || min === "") return due;
  return due < min ? min : due;
}

const OnboardingDetailSidebar: React.FC<OnboardingDetailSidebarProps> = ({ employee, onClose, onRefreshJourneys }) => {
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
    stage: "",
    title: "",
    description: "",
    due_date: new Date().toISOString().slice(0, 10),
    status: "pending",
    sort_order: 0,
  });

  const [editingStep, setEditingStep] = useState<JourneyStepRecord | null>(null);
  const [editStepForm, setEditStepForm] = useState({
    stage: "",
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
  const [showDeleteStepModal, setShowDeleteStepModal] = useState(false);
  const [stepPendingDelete, setStepPendingDelete] = useState<JourneyStepRecord | null>(null);
  const [journeyStartDateIso, setJourneyStartDateIso] = useState<string | null>(null);

  useEffect(() => {
    setStatusValue(statusDisplayToApiValue(employee.status));
  }, [employee.id, employee.status]);

  const isJourneyCompleted = useMemo(
    () => statusValue === "completed" || isEmployeeJourneyDisplayCompleted(employee.status),
    [statusValue, employee.status],
  );

  const journeyDueDateMin = useMemo(
    () => journeyStartDateToInputMin(journeyStartDateIso),
    [journeyStartDateIso],
  );

  const journeyId = Number(employee.id);
  const canUpdateJourney = Number.isInteger(journeyId) && journeyId > 0;

  useEffect(() => {
    if (!canUpdateJourney) return;
    setJourneyStartDateIso(null);
    let cancelled = false;
    setStepsLoading(true);
    getJourney(journeyId)
      .then((data) => {
        if (cancelled) return;
        const raw = data as { steps?: JourneyStepRecord[]; start_date?: string };
        const list = Array.isArray(raw?.steps) ? raw.steps : [];
        setJourneySteps(list);
        setJourneyStartDateIso(readJourneyStartDateFromPayload(raw));
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          logJourneySidebarError("getJourney failed", error);
          setJourneySteps([]);
          setJourneyStartDateIso(null);
        }
      })
      .finally(() => {
        if (!cancelled) setStepsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [journeyId, canUpdateJourney]);

  useEffect(() => {
    if (!showAddStepForm || journeyDueDateMin == null) return;
    setAddStepForm((f) =>
      f.due_date < journeyDueDateMin ? { ...f, due_date: journeyDueDateMin } : f,
    );
  }, [showAddStepForm, journeyDueDateMin]);

  const handleAddStepSubmit = async () => {
    if (!canUpdateJourney) return;

    if(!addStepForm.title.trim()) {
      toast.error("Task is required");
      return;
    }
    if (
      journeyDueDateMin != null &&
      addStepForm.due_date !== "" &&
      addStepForm.due_date < journeyDueDateMin
    ) {
      toast.error("Due date cannot be before the journey start date.");
      return;
    }
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
      const nextDue = clampDueDateToJourneyMin(
        new Date().toISOString().slice(0, 10),
        journeyDueDateMin,
      );
      setAddStepForm({
        stage: "",
        title: "",
        description: "",
        due_date: nextDue,
        status: "pending",
        sort_order: journeySteps.length,
      });
      const data = await getJourney(journeyId) as { steps?: JourneyStepRecord[] };
      const list = Array.isArray(data?.steps) ? data.steps : [];
      setJourneySteps(list);
      onRefreshJourneys?.();
    } catch (error: unknown) {
      logJourneySidebarError("createJourneyStep failed", error);
    } finally {
      setAddStepSubmitting(false);
    }
  };

  const openEditStep = (step: JourneyStepRecord) => {
    const dueRaw = step.due_date
      ? moment(step.due_date).format("YYYY-MM-DD")
      : new Date().toISOString().slice(0, 10);
    const due = clampDueDateToJourneyMin(dueRaw, journeyDueDateMin);
    setEditingStep(step);
    setEditStepForm({
      stage: step.stage ?? "",
      title: step.title ?? "",
      description: step.description ?? "",
      due_date: due,
      status: step.status ?? "pending",
      sort_order: Number(step.sort_order ?? 0),
    });
  };

  const handleEditStepSubmit = async () => {
    if (!editingStep?.id || !canUpdateJourney) return;
    if (
      journeyDueDateMin != null &&
      editStepForm.due_date !== "" &&
      editStepForm.due_date < journeyDueDateMin
    ) {
      toast.error("Due date cannot be before the journey start date.");
      return;
    }
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
    } catch (error: unknown) {
      logJourneySidebarError("updateJourneyStep failed", error);
    } finally {
      setEditStepSubmitting(false);
    }
  };

  const openDeleteStepModal = (step: JourneyStepRecord) => {
    if (step.id == null) return;
    setStepPendingDelete(step);
    setShowDeleteStepModal(true);
  };

  const confirmDeleteStep = useCallback(async () => {
    const step = stepPendingDelete;
    if (step?.id == null || !canUpdateJourney) {
      setShowDeleteStepModal(false);
      setStepPendingDelete(null);
      return;
    }
    setDeletingStepId(step.id);
    try {
      await deleteJourneyStep(journeyId, step.id);
      toast.success("Step deleted.");
      const data = (await getJourney(journeyId)) as { steps?: JourneyStepRecord[] };
      setJourneySteps(Array.isArray(data?.steps) ? data.steps : []);
      onRefreshJourneys?.();
      setShowDeleteStepModal(false);
      setStepPendingDelete(null);
    } catch (error: unknown) {
      logJourneySidebarError("deleteJourneyStep failed", error);
    } finally {
      setDeletingStepId(null);
    }
  }, [stepPendingDelete, journeyId, canUpdateJourney, onRefreshJourneys]);

  const closeDeleteStepModal = () => {
    setShowDeleteStepModal(false);
    setStepPendingDelete(null);
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
    } catch (error: unknown) {
      logJourneySidebarError("deleteJourney failed", error);
    } finally {
      setDeletingJourney(false);
    }
  };

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    if (!canUpdateJourney || isJourneyCompleted) return;
    setStatusUpdating(true);
    try {
      await updateJourney(journeyId, { status: newStatus });
      setStatusValue(newStatus);
      toast.success("Status updated.");
      onRefreshJourneys?.();
    } catch (error: unknown) {
      logJourneySidebarError("updateJourney failed", error);
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

  const handleSendReminder = () => {
    toast.info(`Reminder sent to ${employee.name}`);
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
                {employee.status}
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
                  <button
                    key={person}
                    type="button"
                    onClick={() => {
                      setShowAssigneeDropdown(false);
                    }}
                    style={{
                      padding: '10px 16px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      width: '100%',
                      border: 'none',
                      backgroundColor: 'white',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'white'; }}
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
                  </button>
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
              <article
                key={suggestion.id}
                style={{
                  display: 'flex',
                  gap: '12px',
                  padding: '16px',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  transition: 'all 0.2s',
                  border: '1px solid #e9d5ff'
                }}
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
              </article>
            ))}
          </div>
        </div>
      </div>

      {/* Status */}
      {canUpdateJourney && (
        <div style={{ padding: "16px 24px", borderTop: "1px solid #e9d5ff" }}>
          <label
            htmlFor="journey-sidebar-journey-status"
            style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "8px" }}
          >
            Status
          </label>
          <select
            id="journey-sidebar-journey-status"
            className="form-select"
            value={statusValue}
            onChange={handleStatusChange}
            disabled={statusUpdating || isJourneyCompleted}
            style={{
              width: "100%",
              padding: "10px 12px",
              fontSize: "14px",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              backgroundColor: isJourneyCompleted ? "#f9fafb" : "white",
              color: "#1f2937",
              cursor: statusUpdating || isJourneyCompleted ? "not-allowed" : "pointer",
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
            <span style={{ fontSize: "13px", fontWeight: "600", color: "#374151" }}>Steps</span>
           
            {!isEmployeeJourneyDisplayCompleted(employee.status) && (
              <button
                type="button"
                onClick={() => {
                  setAddStepForm((f) => ({
                    ...f,
                    sort_order: journeySteps.length,
                    due_date: clampDueDateToJourneyMin(f.due_date, journeyDueDateMin),
                  }));
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
            )}
          </div>
          {stepsLoading && (
            <div style={{ fontSize: "13px", color: "#6b7280" }}>Loading steps…</div>
          )}
          {!stepsLoading && journeySteps.length === 0 && !showAddStepForm && (
            <div style={{ fontSize: "13px", color: "#6b7280" }}>No steps yet.</div>
          )}
          {!stepsLoading && (journeySteps.length > 0 || showAddStepForm) && (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {journeySteps.map((step, stepIndex) => (
                <li
                  key={step.id == null ? `journey-step-fallback-${stepIndex}` : `journey-step-${step.id}`}
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
                            {formatJourneyStepStatusForDisplay(step.status)}
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
                    {!isEmployeeJourneyDisplayCompleted(employee.status) && (
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
                            openDeleteStepModal(step);
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
                    )}
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
                    placeholder="Type the stage"
                    value={addStepForm.stage}
                    onChange={(e) => setAddStepForm((f) => ({ ...f, stage: e.target.value }))}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Task <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Type the task"
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
                    min={journeyDueDateMin}
                    value={addStepForm.due_date}
                    onChange={(e) =>
                      setAddStepForm((f) => ({
                        ...f,
                        due_date: clampDueDateToJourneyMin(e.target.value, journeyDueDateMin),
                      }))
                    }
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
                disabled={addStepSubmitting || !addStepForm.title.trim()}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#6366f1",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: addStepSubmitting || !addStepForm.title.trim() ? "not-allowed" : "pointer",
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
                  min={journeyDueDateMin}
                  value={editStepForm.due_date}
                  onChange={(e) =>
                    setEditStepForm((f) => ({
                      ...f,
                      due_date: clampDueDateToJourneyMin(e.target.value, journeyDueDateMin),
                    }))
                  }
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
        show={showDeleteStepModal}
        onHide={closeDeleteStepModal}
        onConfirm={confirmDeleteStep}
        itemName={
          stepPendingDelete?.title?.trim()
            ? `step "${stepPendingDelete.title.trim()}"`
            : "this journey step"
        }
        itemType="step"
        loading={deletingStepId != null}
      />
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