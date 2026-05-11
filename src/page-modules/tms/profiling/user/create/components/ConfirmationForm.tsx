import React, { forwardRef } from "react";
import { Button } from "react-bootstrap";
import { VerifyLdapUserParams, VerifyUserInfoParams } from "@models/tms/UnfidiedOp";

interface ConfirmationFormProps {
    verifyLdapUserFormData: VerifyLdapUserParams;
    verifyUserInfoFormData: VerifyUserInfoParams;
    companyData: any;
    completedSteps: Set<number>;
    isUpdateMode: boolean;
    getCurrentLoadingState: (step: number) => boolean;
    canProceedToNext: (step: number) => boolean;
    onSubmit: () => void;
    apiProgress: Record<
        string,
        {
            status: "pending" | "in_progress" | "completed" | "failed";
            message: string;
        }
    >;
    overallProgress: number;
    getStepStatusBadgeClass: (status: string) => string;
}

const ConfirmationForm = forwardRef<HTMLDivElement, ConfirmationFormProps>(({
    verifyLdapUserFormData,
    verifyUserInfoFormData,
    companyData,
    completedSteps,
    isUpdateMode,
    getCurrentLoadingState,
    canProceedToNext,
    onSubmit,
    apiProgress,
    overallProgress,
    getStepStatusBadgeClass,
}, ref) => {
    return (
        <div
            ref={ref}
            className="mb-5 shadow-sm"
        >
            <div className="text-end mt-3 mb-5">
                    <Button
                        variant="success"
                        onClick={onSubmit}
                        disabled={
                            getCurrentLoadingState(3) ||
                            !canProceedToNext(3) ||
                            !completedSteps.has(2)
                        }
                    >
                        {getCurrentLoadingState(3) ? (
                            <output className="d-inline-flex align-items-center gap-2 border-0 bg-transparent p-0 m-0">
                                <span
                                    className="spinner-border spinner-border-sm"
                                    aria-hidden="true"
                                />
                                <span>Submitting...</span>
                            </output>
                        ) : (
                            "Submit User Profile"
                        )}
                    </Button>
                </div>
        </div>
    );
});

ConfirmationForm.displayName = "ConfirmationForm";

export default ConfirmationForm;
