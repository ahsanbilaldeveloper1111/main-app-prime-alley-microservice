import React, { useState, useEffect } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  ArrowLeftRight,
  Calendar,
  Database,
  LayoutGrid,
  Plus,
  X,
} from "lucide-react";
import { setOnboardingComplete } from "./workloadOnboarding";

type OnboardingChoice = "sample" | "fresh" | null;

type Props = Readonly<{
  show: boolean;
  onComplete: (choice: OnboardingChoice) => void;
}>;

const FEATURES: ReadonlyArray<{
  icon: LucideIcon;
  title: string;
  desc: string;
}> = [
  {
    icon: LayoutGrid,
    title: "Two views",
    desc: "Spreadsheet for capacity overview, Board for task-level management.",
  },
  {
    icon: ArrowLeftRight,
    title: "Drag to reassign",
    desc: "In Board view, drag a task card to another member column to reassign it.",
  },
  {
    icon: Calendar,
    title: "Reschedule easily",
    desc: 'Use "Move to" on any card to change the due date without opening the task.',
  },
  {
    icon: AlertTriangle,
    title: "Overload warnings",
    desc: "Red cells and alerts appear when a member exceeds 100% capacity.",
  },
];

export function WorkloadOnboardingModal({ show, onComplete }: Props) {
  const [step, setStep] = useState<1 | 2>(1);

  useEffect(() => {
    if (show) {
      setStep(1);
    }
  }, [show]);

  useEffect(() => {
    if (show) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, [show]);

  if (!show) return null;

  function handleSkip() {
    setOnboardingComplete();
    document.body.style.overflow = "";
    document.body.style.paddingRight = "";
    onComplete(null);
  }

  function handleNext() {
    setStep(2);
  }

  function handleChoice(choice: "sample" | "fresh") {
    setOnboardingComplete();
    document.body.style.overflow = "";
    document.body.style.paddingRight = "";
    onComplete(choice);
  }

  return (
    <div className="workload-onboarding-overlay">
      <div className="workload-onboarding-modal">
        <div className="workload-onboarding-modal__header">
          <div className="workload-onboarding-modal__title">
            {step === 1 ? "Welcome to Workload" : "How would you like to start?"}
          </div>
          <button
            type="button"
            className="workload-onboarding-modal__close"
            onClick={handleSkip}
            aria-label="Close"
          >
            <X size={18} aria-hidden />
          </button>
        </div>

        <div className="workload-onboarding-modal__body">
          {step === 1 ? (
            <div className="workload-onboarding-modal__features">
              {FEATURES.map((f) => (
                <div key={f.title} className="workload-onboarding-modal__feature-item">
                  <div className="workload-onboarding-modal__feature-icon">
                    <f.icon size={20} aria-hidden />
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
                <Database size={24} aria-hidden />
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
                <Plus size={24} aria-hidden />
                <div className="workload-onboarding-modal__choice-title">Fresh start</div>
                <div className="workload-onboarding-modal__choice-desc">
                  Start with your real team data. You can always explore sample data later.
                </div>
              </button>
            </div>
          )}
        </div>

        <div className="workload-onboarding-modal__footer">
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
        </div>
      </div>
    </div>
  );
}
