import React from "react";

interface APIProgressSectionProps {
    apiProgress: Record<
        string,
        {
            status: "pending" | "in_progress" | "completed" | "failed";
            message: string;
        }
    >;
    overallProgress: number;
    isUpdateMode: boolean;
    getStepStatusBadgeClass: (status: string) => string;
}

const APIProgressSection: React.FC<APIProgressSectionProps> = ({
    apiProgress,
    overallProgress,
    isUpdateMode,
    getStepStatusBadgeClass,
}) => {
    return (
        <div className="api-progress-section mt-4">
            <div className="progress-container">
                <h5 className="text-primary mb-3">
                    <i className="ph-duotone ph-gear-six me-2"></i>
                    {isUpdateMode ? "System Update Progress" : "System Processing Progress"}
                </h5>

                {/* Overall Progress Bar */}
                {/* <div className="progress-wrapper mb-4">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="fw-bold">Overall Progress</span>
                        <span className="text-primary fw-bold">{overallProgress}%</span>
                    </div>
                    <div className="custom-progress-bar">
                        <div
                            className="progress-bar"
                            style={{
                                width: `${overallProgress}%`,
                            }}
                        ></div>
                    </div>
                </div> */}

                {/* Individual API Step Progress */}
                {/* <div className="api-steps-progress">
                    {Object.entries(apiProgress)
                        .filter(([stepKey, stepData]) => {
                            // Show exact steps based on mode to avoid duplicates
                            if (isUpdateMode) {
                                return [
                                    "updateLdapUser",
                                    "removeMobileLine",
                                    "removeMobilePhone",
                                    "addMobileLine",
                                    "addMobilePhone",
                                    "updateMobileAppUser",
                                    "updateMobileUser",
                                    "updateLine",
                                    "addNewPhone",
                                    "updateUserDevices",
                                    "updatePhone",
                                    "addRemoteDestinationProfile",
                                    "addRemoteDestination",
                                    "updateDNCR",
                                ].includes(stepKey);
                            } else {
                                return [
                                    "createLdapUser",
                                    "createLocalUser",
                                    "runLdapSync",
                                    "addLine",
                                    "addPhone",
                                    "updateAppUser",
                                    "updateUser",
                                    "addRemoteDestinationProfile",
                                    "addRemoteDestination",
                                    "updateDNCR",
                                ].includes(stepKey);
                            }
                        })
                        .map(([stepKey, stepData]) => (
                            <div
                                key={stepKey}
                                className={`api-step-item ${stepData.status}`}
                            >
                                <div className="step-header">
                                    <div className="step-icon">
                                        {stepData.status === "completed" && (
                                            <i className="ph-duotone ph-check-circle text-success"></i>
                                        )}
                                        {stepData.status === "in_progress" && (
                                            <div className="spinner-border spinner-border-sm text-primary"></div>
                                        )}
                                        {stepData.status === "failed" && (
                                            <i className="ph-duotone ph-times-circle text-danger"></i>
                                        )}
                                        {stepData.status === "pending" && (
                                            <i className="ph-duotone ph-clock text-muted"></i>
                                        )}
                                    </div>
                                    <div className="step-content">
                                        <h6 className="mb-1">{stepData.message}</h6>
                                        <small className="text-muted">
                                            {stepData.status === "completed" && "Completed successfully"}
                                            {stepData.status === "in_progress" && "Processing..."}
                                            {stepData.status === "failed" && "Failed - will retry"}
                                            {stepData.status === "pending" && "Waiting to start"}
                                        </small>
                                    </div>
                                    <div className="step-status">
                                        <span
                                            className={`badge ${getStepStatusBadgeClass(stepData.status)}`}
                                        >
                                            {stepData.status.replace("_", " ")}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                </div> */}
            </div>

            {/* Custom CSS for API Progress Section */}
            <style>{`
                /* API Progress Section Styles */
                .api-progress-section {
                    margin-top: 2rem;
                }

                .api-steps-progress {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

                .api-step-item {
                    padding: 1rem;
                    border-radius: 12px;
                    border: 2px solid transparent;
                    transition: all 0.3s ease;
                    background: white;
                }

                .api-step-item.pending {
                    border-color: #dee2e6;
                    background: #f8f9fa;
                }

                .api-step-item.in_progress {
                    border-color: #007bff;
                    background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
                    box-shadow: 0 4px 16px rgba(0, 123, 255, 0.2);
                }

                .api-step-item.completed {
                    border-color: #28a745;
                    background: linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%);
                    box-shadow: 0 4px 16px rgba(40, 167, 80, 0.2);
                }

                .api-step-item.failed {
                    border-color: #dc3545;
                    background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%);
                    box-shadow: 0 4px 16px rgba(220, 53, 69, 0.2);
                }

                .step-header {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }

                .step-icon {
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    background: white;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }

                .step-content {
                    flex: 1;
                }

                .step-content h6 {
                    margin: 0;
                    font-weight: 600;
                    color: #333;
                }

                .step-content small {
                    color: #6c757d;
                }

                .step-status .badge {
                    font-size: 0.75rem;
                    padding: 0.5rem 0.75rem;
                    border-radius: 20px;
                    text-transform: capitalize;
                }
            `}</style>
        </div>
    );
};

export default APIProgressSection;
