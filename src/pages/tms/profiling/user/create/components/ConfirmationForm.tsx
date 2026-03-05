import React, { forwardRef } from "react";
import { Card, Button } from "react-bootstrap";
import { VerifyLdapUserParams, VerifyUserInfoParams } from "@models/tms/UnfidiedOp";
import { MobileUser, DNCRCallingAccess, FacInfoCallingAccess, DeviceType } from "@models/tms/Company";
import APIProgressSection from "./APIProgressSection";

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
            className={`mb-4 shadow-sm mb-5`}
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
                            <>
                                <span
                                    className="spinner-border spinner-border-sm me-2"
                                    role="status"
                                    aria-hidden="true"
                                ></span>
                                Submitting...
                            </>
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
