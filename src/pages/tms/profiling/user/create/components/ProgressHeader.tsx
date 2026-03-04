import React from "react";
import { ProgressBar } from "react-bootstrap";

interface ProgressHeaderProps {
    progress: number;
    currentStep: number;
    completedSteps: Set<number>;
}

const ProgressHeader: React.FC<ProgressHeaderProps> = ({
    progress,
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
                        {/* Enhanced Progress Steps */}
                <div className="row mt-4">
                    <div className="col-md-6">
                        <div
                            className={`progress-step-card ${completedSteps.has(1) ? "completed" : currentStep === 1 ? "active" : "pending"}`}
                        >
                            <div className="step-icon-wrapper">
                                {completedSteps.has(1) ? (
                                    <i className="ph-duotone ph-check-circle text-success"></i>
                                ) : (
                                    <span className="step-number">1</span>
                                )}
                            </div>
                            <div className="step-content">
                                <h6 className="mb-1 fw-semibold">
                                    Create LDAP User
                                </h6>
                                <small className="text-muted">
                                    Basic user information & credentials
                                </small>
                                {completedSteps.has(1) && (
                                    <div className="completion-badge">
                                        <i className="ph-duotone ph-check me-1"></i>
                                        Completed
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div
                            className={`progress-step-card ${completedSteps.has(2) ? "completed" : currentStep === 2 ? "active" : "pending"}`}
                        >
                            <div className="step-icon-wrapper">
                                {completedSteps.has(2) ? (
                                    <i className="ph-duotone ph-check-circle text-success"></i>
                                ) : (
                                    <span className="step-number">2</span>
                                )}
                            </div>
                            <div className="step-content">
                                <h6 className="mb-1 fw-semibold">
                                    Add Calling Access
                                </h6>
                                <small className="text-muted">
                                    Call permissions & mobile settings
                                </small>
                                {completedSteps.has(2) && (
                                    <div className="completion-badge">
                                        <i className="ph-duotone ph-check me-1"></i>
                                        Completed
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    {/* <div className="col-md-4">
                        <div
                            className={`progress-step-card ${completedSteps.has(3) ? "completed" : currentStep === 3 ? "active" : "pending"}`}
                        >
                            <div className="step-icon-wrapper">
                                {completedSteps.has(3) ? (
                                    <i className="ph-duotone ph-check-circle text-success"></i>
                                ) : (
                                    <span className="step-number">3</span>
                                )}
                            </div>
                            <div className="step-content">
                                <h6 className="mb-1 fw-semibold">
                                    Confirm & Submit
                                </h6>
                                <small className="text-muted">
                                    Review and finalize profile
                                </small>
                                {completedSteps.has(3) && (
                                    <div className="completion-badge">
                                        <i className="ph-duotone ph-check me-1"></i>
                                        Completed
                                    </div>
                                )}
                            </div>
                        </div>
                    </div> */}
                </div>
                    </div>
                    {/* <div className="col-md-3">
                        <div className="progress-container">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <span className="text-muted small fw-medium">
                                    Progress
                                </span>
                                <span className="text-primary fw-bold fs-6">
                                    {Math.round(progress)}%
                                </span>
                            </div>
                            <div className="progress-wrapper">
                                <ProgressBar
                                    now={progress}
                                    className="custom-progress-bar mb-2"
                                    style={{ height: "12px" }}
                                    variant="primary"
                                />
                                <div className="progress-steps-indicator">
                                    <span
                                        className={`step-dot ${completedSteps.has(1) ? "completed" : currentStep === 1 ? "active" : "pending"}`}
                                    ></span>
                                    <span
                                        className={`step-dot ${completedSteps.has(2) ? "completed" : currentStep === 2 ? "active" : "pending"}`}
                                    ></span>
                                    <span
                                        className={`step-dot ${completedSteps.has(3) ? "completed" : currentStep === 3 ? "active" : "pending"}`}
                                    ></span>
                                </div>
                                <small className="text-muted d-block text-center">
                                    Step {currentStep} of 3
                                </small>
                            </div>
                        </div>
                    </div> */}
                </div>

                
            </div>

            {/* Custom CSS for enhanced progress steps */}
            <style>{`
                /* Enhanced Progress Container */
                .progress-container {
                    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                    padding: 1.5rem;
                    border-radius: 16px;
                    border: 1px solid #dee2e6;
                    box-shadow: 0 4px 16px rgba(0,0,0,0.08);
                }
                
                .progress-wrapper {
                    position: relative;
                }
                
                /* Custom Progress Bar */
                .custom-progress-bar {
                    border-radius: 8px;
                    overflow: hidden;
                    background: #e9ecef;
                    box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
                }
                
                .custom-progress-bar .progress-bar {
                    background: linear-gradient(90deg, #007bff 0%, #0056b3 100%);
                    border-radius: 8px;
                    transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: 0 2px 8px rgba(0, 123, 255, 0.3);
                }
                
                /* Progress Steps Indicator */
                .progress-steps-indicator {
                    display: flex;
                    justify-content: center;
                    gap: 0.5rem;
                    margin: 0.5rem 0;
                }
                
                .step-dot {
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    transition: all 0.3s ease;
                }
                
                .step-dot.pending {
                    background: #dee2e6;
                    border: 2px solid #ced4da;
                }
                
                .step-dot.active {
                    background: #007bff;
                    border: 2px solid #0056b3;
                    box-shadow: 0 0 0 4px rgba(0, 123, 255, 0.2);
                    animation: pulse 2s infinite;
                }
                
                .step-dot.completed {
                    background: #28a745;
                    border: 2px solid #1e7e34;
                    box-shadow: 0 0 0 4px rgba(40, 167, 69, 0.2);
                }
                
                /* Enhanced Progress Step Cards */
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
                
                .progress-step-card::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 4px;
                    background: #dee2e6;
                    transition: all 0.4s ease;
                    display:none;
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
                
                .progress-step-card.active::before {
                    background: linear-gradient(90deg, #2196f3 0%, #1976d2 100%);
                    box-shadow: 0 2px 8px rgba(33, 150, 243, 0.4);
                }
                
                .progress-step-card.completed {
                    background: linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%);
                    border-color: #4caf50;
                    box-shadow: 0 8px 24px rgba(76, 175, 80, 0.15);
                    transform: translateY(-2px);
                }
                
                .progress-step-card.completed::before {
                    background: linear-gradient(90deg, #4caf50 0%, #388e3c 100%);
                    box-shadow: 0 2px 8px rgba(76, 175, 80, 0.4);
                }
                
                .progress-step-card:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 12px 32px rgba(0,0,0,0.12);
                }
                
                /* Step Icon Wrapper */
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
                
                /* Step Content */
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
                
                .step-content small {
                    font-size: 0.875rem;
                    line-height: 1.4;
                }
                
                /* Completion Badge */
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
                
                /* Animations */
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
                
                /* Responsive Design */
                @media (max-width: 768px) {
                    .progress-container {
                        padding: 1rem;
                        margin-bottom: 1rem;
                    }
                    
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
