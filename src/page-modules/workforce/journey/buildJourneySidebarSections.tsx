import type { ChangeEvent, Dispatch, SetStateAction } from "react";
import React from "react";
import { Briefcase, Check, Target, User } from "lucide-react";
import type { SidebarSection } from "@components/GenericSidebarNew";
import { JOURNEY_STATUS_OPTIONS } from "@utils/workforce/journeyStatusOptions";
import JourneyStepsSidebarSection from "./partials/JourneyStepsSidebarSection";
import {
  deriveJourneyProgressFromSteps,
  getStatusColor,
  type JourneyStepRecord,
  type OnboardingEmployee,
} from "./journeyDomain";

export interface BuildJourneySidebarSectionsParams {
  selectedEmployee: OnboardingEmployee | null;
  journeyIdValid: boolean;
  stepsLoading: boolean;
  journeySteps: JourneyStepRecord[];
  canUpdateJourneyRecord: boolean;
  canCreateJourneyStep: boolean;
  canUpdateJourneyStep: boolean;
  canDeleteJourneyStepPerm: boolean;
  deletingStepId: number | null;
  statusValue: string;
  statusUpdating: boolean;
  isJourneyCompleted: boolean;
  handleStatusChange: (e: ChangeEvent<HTMLSelectElement>) => void | Promise<void>;
  setShowAddStepForm: Dispatch<SetStateAction<boolean>>;
  setEditingStep: Dispatch<SetStateAction<JourneyStepRecord | null>>;
  openDeleteStepModal: (step: JourneyStepRecord) => void;
}

export function buildJourneySidebarSections({
  selectedEmployee,
  journeyIdValid,
  stepsLoading,
  journeySteps,
  canUpdateJourneyRecord,
  canCreateJourneyStep,
  canUpdateJourneyStep,
  canDeleteJourneyStepPerm,
  deletingStepId,
  statusValue,
  statusUpdating,
  isJourneyCompleted,
  handleStatusChange,
  setShowAddStepForm,
  setEditingStep,
  openDeleteStepModal,
}: Readonly<BuildJourneySidebarSectionsParams>): SidebarSection[] {
  if (!selectedEmployee) return [];

  const useLiveStepsProgress = journeyIdValid && !stepsLoading;
  const liveProgress = useLiveStepsProgress ? deriveJourneyProgressFromSteps(journeySteps) : null;
  const totalSteps = liveProgress ? liveProgress.total : Math.max(1, Number(selectedEmployee.total_steps_count ?? 0));
  const completedSteps = liveProgress ? liveProgress.completed : Number(selectedEmployee.completed_steps_count ?? 0);
  const progressPercent = liveProgress ? liveProgress.progress : selectedEmployee.progress;
  const statusColors = getStatusColor(selectedEmployee.status);

  return [
    {
      id: "journey-employee-details",
      title: "Employee Details",
      icon: User,
      collapsible: true,
      defaultExpanded: true,
      fields: [
        { label: "Extension", value: selectedEmployee.user_id || "—" },
        { label: "Department", value: selectedEmployee.department_name || "—" },
        { label: "Designation", value: selectedEmployee.designation || "—" },
        { label: "Start Date", value: selectedEmployee.startDate || "—" },
        { label: "Role", value: selectedEmployee.role || "—" },
      ],
    },
    {
      id: "journey-employment-info",
      title: "Employment Info",
      icon: Briefcase,
      collapsible: true,
      defaultExpanded: true,
      fields: [
        { label: "Contract Type", value: selectedEmployee.contract_type || "—" },
        { label: "Employment Type", value: selectedEmployee.employment_type || "—" },
      ],
    },
    {
      id: "journey-onboarding-progress",
      title: "Onboarding Progress",
      icon: Target,
      collapsible: true,
      defaultExpanded: true,
      customContent: (
        <div className="journey-page__sb-section-pad">
          <div className="journey-page__sb-progress-head">
            <span className="journey-page__sb-progress-muted">
              {completedSteps} of {totalSteps} steps completed
            </span>
            <span className="journey-page__sb-progress-pct">{progressPercent}%</span>
          </div>
          <div className="journey-page__sb-progress-track">
            <div className="journey-page__sb-progress-fill" style={{ width: `${progressPercent}%` }} />
          </div>
          <div
            className="journey-page__sb-status-pill"
            style={{ backgroundColor: statusColors.bg }}
          >
            <span
              className="journey-page__sb-status-dot"
              style={{ backgroundColor: statusColors.dot }}
            />
            <span className="journey-page__sb-status-label" style={{ color: statusColors.color }}>
              {selectedEmployee.status}
            </span>
          </div>
        </div>
      ),
    },
    {
      id: "journey-status",
      title: "Status",
      icon: Target,
      collapsible: true,
      defaultExpanded: true,
      customContent: (
        <div className="journey-page__sb-section-pad">
          <label htmlFor="journey-sidebar-status" className="journey-page__sb-field-label">
            Journey Status
          </label>
          <select
            id="journey-sidebar-status"
            className="form-select journey-page__sb-status-select"
            value={statusValue}
            onChange={handleStatusChange}
            disabled={statusUpdating || isJourneyCompleted || !canUpdateJourneyRecord}
          >
            {JOURNEY_STATUS_OPTIONS.map((opt: { value: string; label: string }) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {statusUpdating && <div className="journey-page__sb-status-hint">Updating...</div>}
        </div>
      ),
    },
    {
      id: "journey-steps",
      title: "Steps",
      icon: Check,
      collapsible: true,
      defaultExpanded: true,
      customContent: (
        <JourneyStepsSidebarSection
          steps={journeySteps}
          loading={stepsLoading}
          isCompleted={isJourneyCompleted}
          canAddStep={canCreateJourneyStep}
          canEditStep={canUpdateJourneyStep}
          canDeleteStep={canDeleteJourneyStepPerm}
          deletingStepId={deletingStepId}
          onAddStep={() => setShowAddStepForm(true)}
          onEditStep={(step) => setEditingStep(step)}
          onDeleteStep={openDeleteStepModal}
        />
      ),
    },
  ];
}
