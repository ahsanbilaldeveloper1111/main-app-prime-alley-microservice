import React from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { formatJourneyStepStatusForDisplay, type JourneyStepRecord } from "../journeyDomain";

export interface JourneyStepsSidebarSectionProps {
  steps: JourneyStepRecord[];
  loading: boolean;
  isCompleted: boolean;
  canAddStep: boolean;
  canEditStep: boolean;
  canDeleteStep: boolean;
  deletingStepId: number | null;
  onAddStep: () => void;
  onEditStep: (step: JourneyStepRecord) => void;
  onDeleteStep: (step: JourneyStepRecord) => void;
}

const JourneyStepsSidebarSection: React.FC<JourneyStepsSidebarSectionProps> = ({
  steps,
  loading,
  isCompleted,
  canAddStep,
  canEditStep,
  canDeleteStep,
  deletingStepId,
  onAddStep,
  onEditStep,
  onDeleteStep,
}) => (
  <div className="journey-page__steps-root">
    <div className="journey-page__steps-head">
      <span className="journey-page__steps-title">Journey Steps</span>
      {!isCompleted && canAddStep && (
        <button type="button" className="journey-page__btn-add-step" onClick={onAddStep}>
          <Plus size={16} />
          Add step
        </button>
      )}
    </div>

    {loading && <div className="journey-page__steps-muted">Loading steps...</div>}
    {!loading && steps.length === 0 && <div className="journey-page__steps-muted">No steps yet.</div>}
    {!loading && steps.length > 0 && (
      <ul className="journey-page__steps-list">
        {steps.map((step) => {
          const fallbackKey = `${step.title ?? "untitled"}-${step.stage ?? "nostage"}-${step.due_date ?? "nodue"}`;
          return (
            <li
              key={step.id == null ? fallbackKey : `journey-step-${step.id}`}
              className="journey-page__step-card"
            >
              <div className="journey-page__step-card-inner">
                <div className="journey-page__step-main">
                  <div className="journey-page__step-title">{step.title || "—"}</div>
                  <div className="journey-page__step-meta">
                    {step.stage ? <span className="journey-page__step-stage">{step.stage}</span> : null}
                    {step.status ? (
                      <span className="journey-page__step-status-chip">
                        {formatJourneyStepStatusForDisplay(step.status)}
                      </span>
                    ) : null}
                  </div>
                  {step.description && <div className="journey-page__step-desc">{step.description}</div>}
                </div>
                {!isCompleted && (canEditStep || canDeleteStep) ? (
                  <div className="journey-page__step-actions">
                    {canEditStep ? (
                      <button
                        type="button"
                        className="journey-page__step-btn journey-page__step-btn--edit"
                        title="Edit"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditStep(step);
                        }}
                      >
                        <Pencil size={14} />
                      </button>
                    ) : null}
                    {canDeleteStep ? (
                      <button
                        type="button"
                        className="journey-page__step-btn journey-page__step-btn--delete"
                        title="Delete"
                        disabled={deletingStepId === step.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteStep(step);
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    )}
  </div>
);

export default JourneyStepsSidebarSection;
