import { useState, useCallback } from 'react';

interface UseFormErrorsReturn {
    errors: Record<string, string[]>;
    touched: Record<string, boolean>;
    setErrors: (errors: Record<string, string[]>) => void;
    setFieldTouched: (fieldName: string, touched: boolean) => void;
    setAllTouched: (fieldNames?: string[]) => void;
    clearFieldError: (fieldName: string) => void;
    clearAllFieldError: () => void;
    hasErrors: boolean;
}

export const useFormErrors = (): UseFormErrorsReturn => {
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});

    const setFieldTouched = useCallback((fieldName: string, isTouched: boolean) => {
        setTouched(prev => ({
            ...prev,
            [fieldName]: isTouched
        }));
    }, []);

    const setAllTouched = useCallback((fieldNames?: string[]) => {
        // If fieldNames is provided, use those, otherwise mark all fields with errors as touched
        const fieldsToTouch = fieldNames || Object.keys(errors);
        
        const touchedFields = fieldsToTouch.reduce((acc, field) => {
            acc[field] = true;
            return acc;
        }, {} as Record<string, boolean>);
        
        setTouched(touchedFields);
    }, [errors]);

    const clearAllFieldError = useCallback(() => {
        setErrors({});
    }, []);
    
    const clearFieldError = useCallback((fieldName: string) => {
        setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[fieldName];
            return newErrors;
        });
    }, []);

    const hasErrors = Object.keys(errors).length > 0;

    return {
        errors,
        touched,
        setErrors,
        setFieldTouched,
        setAllTouched,
        clearFieldError,
        clearAllFieldError,
        hasErrors
    };
}; 