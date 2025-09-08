import { useState, useCallback } from 'react';

export type ProgressStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

export interface ProgressItem {
    status: ProgressStatus;
    message: string;
}

export const useProgressTracker = () => {
    const [progress, setProgress] = useState<Record<string, ProgressItem>>({});
    const [currentStep, setCurrentStep] = useState<number>(0);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);

    const updateProgress = useCallback((key: string, status: ProgressStatus, message: string) => {
        setProgress(prev => ({
            ...prev,
            [key]: { status, message }
        }));
    }, []);

    const resetProgress = useCallback(() => {
        setProgress({});
        setCurrentStep(0);
    }, []);

    const startProcessing = useCallback(() => {
        setIsProcessing(true);
    }, []);

    const stopProcessing = useCallback(() => {
        setIsProcessing(false);
    }, []);

    const getProgressSteps = useCallback((stepMapping: Record<string, string>) => {
        return Object.entries(stepMapping).map(([key, title]) => ({
            key,
            title,
            status: progress[key]?.status || 'pending',
            message: progress[key]?.message || ''
        }));
    }, [progress]);

    return {
        progress,
        currentStep,
        isProcessing,
        updateProgress,
        resetProgress,
        startProcessing,
        stopProcessing,
        getProgressSteps,
        setCurrentStep
    };
};
