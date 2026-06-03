import React, { useState } from "react";
import { Modal } from "react-bootstrap";
import { setOnboardingComplete } from "./workloadOnboarding";

type OnboardingChoice = "sample" | "fresh" | null;

type Props = Readonly<{
  show: boolean;
  onComplete: (choice: OnboardingChoice) => void;
}>;

const FEATURES = [
  {
    icon: "ti-layout-columns",
    title: "Two views",
    desc: "Spreadsheet for capacity overview, Board for task-level management.",
  },
  {
    icon: "ti-switch-horizontal",
    title: "Drag to reassign",
    desc: "In Board view, drag a task card to another member column to reassign it.",
  },
  {
    icon: "ti-calendar",
    title: "Reschedule easily",
    desc: 'Use "Move to" on any card to change the due date without opening the task.',
  },
  {
    icon: "ti-alert-triangle",
    title: "Overload warnings",
    desc: "Red cells and alerts appear when a member exceeds 100% capacity.",
  },
];

export function WorkloadOnboardingModal({ show, onComplete }: Props) {
  const [step, setStep] = useState<1 | 2>(1);

  function handleSkip() {
    setOnboardingComplete();
    onComplete(null);
  }

  function handleNext() {
    setStep(2);
  }

  function handleChoice(choice: "sample" | "fresh") {
    setOnboardingComplete();
    onComplete(choice);
  }

  return (
    <Modal
      show={show}
      onHide={handleSkip}
      centered
      className="workload-onboarding-modal"
      backdrop="static"
      keyboard={false}
    >
      <Modal.Header>
        <Modal.Title>
          {step === 1 ? "Welcome to Workload" : "How would you like to start?"}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {step === 1 ? (
          <div className="workload-onboarding-modal__features">
            {FEATURES.map((f) => (
              <div key={f.title} className="workload-onboarding-modal__feature-item">
                <div className="workload-onboarding-modal__feature-icon">
                  <i className={`ti ${f.icon}`} aria-hidden="true" />
                </div>
                <div className="workload-onboarding-modal__feature-text">
                  <div className="workload-onboarding-modal__feature-title">{f.title}</div>
                  <div className="workload-onboarding-modal__feature-desc">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="workload-onboarding-modal__choices">
            <button
              type="button"
              className="workload-onboarding-modal__choice-card"
              onClick={() => handleChoice("sample")}
            >
              <i className="ti ti-database" aria-hidden="true" />
              <div className="workload-onboarding-modal__choice-title">Load sample data</div>
              <div className="workload-onboarding-modal__choice-desc">
                See the page with realistic tasks and members — great for exploring features.
              </div>
            </button>
            <button
              type="button"
              className="workload-onboarding-modal__choice-card"
              onClick={() => handleChoice("fresh")}
            >
              <i className="ti ti-plus" aria-hidden="true" />
              <div className="workload-onboarding-modal__choice-title">Fresh start</div>
              <div className="workload-onboarding-modal__choice-desc">
                Start with your real team data. You can always explore sample data later.
              </div>
            </button>
          </div>
        )}
      </Modal.Body>

      <Modal.Footer>
        <button
          type="button"
          className="workload-onboarding-modal__skip"
          onClick={handleSkip}
        >
          Skip
        </button>
        <div className="workload-onboarding-modal__dots">
          <span className={`workload-onboarding-modal__dot ${step === 1 ? "is-active" : ""}`} />
          <span className={`workload-onboarding-modal__dot ${step === 2 ? "is-active" : ""}`} />
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          {step === 2 ? (
            <button
              type="button"
              className="workload-onboarding-modal__back"
              onClick={() => setStep(1)}
            >
              Back
            </button>
          ) : null}
          {step === 1 ? (
            <button
              type="button"
              className="workload-onboarding-modal__next"
              onClick={handleNext}
            >
              Next
            </button>
          ) : (
            <div style={{ width: "60px" }} />
          )}
        </div>
      </Modal.Footer>
    </Modal>
  );
}
