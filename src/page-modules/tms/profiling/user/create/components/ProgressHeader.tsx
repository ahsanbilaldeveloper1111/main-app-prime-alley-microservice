import React from "react";

interface ProgressHeaderProps {
    currentStep: number;
    completedSteps: Set<number>;
}

interface StepCopy {
    number: number;
    title: string;
    subtitle: string;
}

const PROGRESS_STEPS: StepCopy[] = [
    {
        number: 1,
        title: "Create LDAP User",
        subtitle: "Basic user information & credentials",
    },
    {
        number: 2,
        title: "Add Calling Access",
        subtitle: "Call permissions & mobile settings",
    },
];

interface ProgressStepCardProps extends StepCopy {
    currentStep: number;
    completedSteps: Set<number>;
}

function ProgressStepCard(props: Readonly<ProgressStepCardProps>) {
    const { number: stepNum, title, subtitle, currentStep, completedSteps } =
        props;
    const isDone = completedSteps.has(stepNum);
    let phase: "completed" | "active" | "pending";
    if (isDone) {
        phase = "completed";
    } else if (currentStep === stepNum) {
        phase = "active";
    } else {
        phase = "pending";
    }

    return (
        <div className={`progress-step-card ${phase}`}>
            <div className="step-icon-wrapper">
                {isDone ? (
                    <i className="ph-duotone ph-check-circle text-success"></i>
                ) : (
                    <span className="step-number">{stepNum}</span>
                )}
            </div>
            <div className="step-content">
                <h6 className="mb-1 fw-semibold">{title}</h6>
                <small className="text-muted">{subtitle}</small>
                {isDone ? (
                    <div className="completion-badge">
                        <i className="ph-duotone ph-check me-1" aria-hidden />
                        {' '}
                        Completed
                    </div>
                ) : null}
            </div>
        </div>
    );
}

const ProgressHeader: React.FC<Readonly<ProgressHeaderProps>> = ({
    currentStep,
    completedSteps,
}) => {
    return (
        <div
            className="bg-white border-bottom py-4 mb-4 shadow-sm"
            style={{ zIndex: 1000 }}
        >
            <div className="container-fluid">
                <div className="row align-items-center">
                    <div className="col-md-12">
                        <div className="row mt-4">
                            {PROGRESS_STEPS.map((step) => (
                                <div
                                    className="col-md-6"
                                    key={`progress-step-${step.number}`}
                                >
                                    <ProgressStepCard
                                        number={step.number}
                                        title={step.title}
                                        subtitle={step.subtitle}
                                        currentStep={currentStep}
                                        completedSteps={completedSteps}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .progress-step-card {
                    display: flex;
                    align-items: flex-start;
                    padding: 1.5rem;
                    border-radius: 16px;
                    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                    border: 2px solid transparent;
                    background: white;
                    box-shadow: 0 2px 12px rgba(0,0,0,0.06);
                    position: relative;
                    overflow: hidden;
                }

                .progress-step-card.pending {
                    background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
                    border-color: #e9ecef;
                }

                .progress-step-card.active {
                    border-color: #2196f3;
                    box-shadow: 0 8px 24px rgba(33, 150, 243, 0.15);
                    transform: translateY(-2px);
                }

                .progress-step-card.completed {
                    background: linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%);
                    border-color: #4caf50;
                    box-shadow: 0 8px 24px rgba(76, 175, 80, 0.15);
                    transform: translateY(-2px);
                }

                .progress-step-card:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 12px 32px rgba(0,0,0,0.12);
                }

                .step-icon-wrapper {
                    width: 48px;
                    height: 48px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-right: 1rem;
                    font-weight: bold;
                    transition: all 0.4s ease;
                    flex-shrink: 0;
                }

                .progress-step-card.pending .step-icon-wrapper {
                    background: linear-gradient(135deg, #6c757d 0%, #495057 100%);
                    color: white;
                    box-shadow: 0 4px 12px rgba(108, 117, 125, 0.3);
                }

                .progress-step-card.active .step-icon-wrapper {
                    background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
                    color: white;
                    box-shadow: 0 6px 20px rgba(33, 150, 243, 0.4);
                    animation: pulse 2s infinite;
                }

                .progress-step-card.completed .step-icon-wrapper {
                    background: linear-gradient(135deg, #28a745 0%, #1e7e34 100%);
                    color: white;
                    box-shadow: 0 6px 20px rgba(40, 167, 69, 0.4);
                }

                .step-number {
                    font-size: 1.2rem;
                    font-weight: 700;
                }

                .step-icon-wrapper i {
                    font-size: 1.5rem;
                }

                .step-content {
                    flex: 1;
                    min-width: 0;
                }

                .step-content h6 {
                    color: #495057;
                    margin-bottom: 0.5rem;
                    font-weight: 600;
                }

                .progress-step-card.active .step-content h6 {
                    color: #1565c0;
                }

                .progress-step-card.completed .step-content h6 {
                    color: #2e7d32;
                }

                .completion-badge {
                    display: inline-flex;
                    align-items: center;
                    background: #28a745;
                    color: white;
                    padding: 0.25rem 0.75rem;
                    border-radius: 20px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    margin-top: 0.5rem;
                    box-shadow: 0 2px 8px rgba(40, 167, 69, 0.3);
                    animation: fadeInUp 0.6s ease-out;
                }

                @keyframes pulse {
                    0%, 100% {
                        box-shadow: 0 6px 20px rgba(33, 150, 243, 0.4);
                    }
                    50% {
                        box-shadow: 0 6px 30px rgba(33, 150, 243, 0.7);
                    }
                }

                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @media (max-width: 768px) {
                    .progress-step-card {
                        padding: 1rem;
                        margin-bottom: 1rem;
                    }

                    .step-icon-wrapper {
                        width: 40px;
                        height: 40px;
                        margin-right: 0.75rem;
                    }

                    .step-number {
                        font-size: 1rem;
                    }

                    .step-icon-wrapper i {
                        font-size: 1.25rem;
                    }
                }
            `}</style>
        </div>
    );
};

export default ProgressHeader;
