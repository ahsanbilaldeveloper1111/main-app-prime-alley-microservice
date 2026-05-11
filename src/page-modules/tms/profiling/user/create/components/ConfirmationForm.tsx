import React, { forwardRef } from "react";
import { Button } from "react-bootstrap";

interface ConfirmationFormProps {
    completedSteps: Set<number>;
    getCurrentLoadingState: (step: number) => boolean;
    canProceedToNext: (step: number) => boolean;
    onSubmit: () => void;
}

const ConfirmationForm = forwardRef<HTMLDivElement, ConfirmationFormProps>(({
    completedSteps,
    getCurrentLoadingState,
    canProceedToNext,
    onSubmit,
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
