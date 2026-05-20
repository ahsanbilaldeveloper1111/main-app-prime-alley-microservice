import React from "react";
import { CheckCircle } from "lucide-react";

export function getEditDealWizardProgressWidthPercent(
  formStep: number,
  hasTemplateStep: boolean,
): number {
  const totalVisibleSteps = hasTemplateStep ? 5 : 4;
  let visualPosition = formStep;
  if (!hasTemplateStep && formStep > 2) {
    visualPosition = formStep - 1;
  }
  return ((visualPosition + 1) / totalVisibleSteps) * 100;
}

function editDealWizardStepLabel(step: number): string {
  switch (step) {
    case 0:
      return "Deal Info";
    case 1:
      return "Company Info";
    case 2:
      return "Characteristics";
    case 3:
      return "Progress & Notes";
    default:
      return "Estimation";
  }
}

function editDealWizardStepDisplayNumber(
  step: number,
  dealTemplate: unknown,
): number {
  if (!dealTemplate && step > 2) {
    return step;
  }
  return step + 1;
}

export type EditDealWizardTimelineProps = Readonly<{
  formStep: number;
  setFormStep: (step: number) => void;
  dealTemplate: unknown;
}>;

export function EditDealWizardTimeline({
  formStep,
  setFormStep,
  dealTemplate,
}: EditDealWizardTimelineProps) {
  const hasTemplateStep = Boolean(dealTemplate);
  const widthPct = getEditDealWizardProgressWidthPercent(
    formStep,
    hasTemplateStep,
  );

  return (
    <div className="mb-4">
      <div className="d-flex align-items-center justify-content-between position-relative">
        <div
          className="position-absolute bg-light"
          style={{
            left: "0",
            right: "0",
            top: "20px",
            height: "2px",
            zIndex: 0,
          }}
        />
        <div
          className="position-absolute bg-primary"
          style={{
            left: "0",
            top: "20px",
            height: "2px",
            width: `${widthPct}%`,
            zIndex: 0,
            transition: "width 0.3s ease",
          }}
        />

        {[0, 1, 2, 3, 4].map((step) => {
          if (step === 2 && !dealTemplate) {
            return null;
          }

          const displayNumber = editDealWizardStepDisplayNumber(
            step,
            dealTemplate,
          );

          return (
            <button
              key={step}
              type="button"
              className="text-center position-relative border-0 bg-transparent p-0"
              style={{ cursor: "pointer", flex: 1 }}
              onClick={() => setFormStep(step)}
              aria-current={formStep === step ? "step" : undefined}
            >
              <div
                className={`rounded-circle d-flex align-items-center justify-content-center mx-auto ${formStep >= step ? "bg-primary text-white" : "bg-light text-muted"}`}
                style={{
                  width: "40px",
                  height: "40px",
                  zIndex: 1,
                  position: "relative",
                }}
              >
                {formStep > step ? (
                  <CheckCircle size={20} />
                ) : (
                  displayNumber
                )}
              </div>
              <small
                className={`d-block mt-2 ${formStep === step ? "fw-bold text-primary" : "text-muted"}`}
              >
                {editDealWizardStepLabel(step)}
              </small>
            </button>
          );
        })}
      </div>
    </div>
  );
}
