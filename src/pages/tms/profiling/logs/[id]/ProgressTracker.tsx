import React from 'react';
import { Card, Spinner } from 'react-bootstrap';

export interface ProgressStep {
    key: string;
    title: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    message?: string;
}

interface ProgressTrackerProps {
    title: string;
    steps: ProgressStep[];
    variant?: 'vertical' | 'horizontal';
    showProgress?: boolean;
}

const ProgressTracker: React.FC<ProgressTrackerProps> = ({ 
    title, 
    steps, 
    variant = 'vertical',
    showProgress = false 
}) => {
    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed': return '✓';
            case 'failed': return '✗';
            case 'in_progress': return <Spinner animation="border" size="sm" />;
            default: return '○';
        }
    };

    const getStatusClass = (status: string) => {
        switch (status) {
            case 'completed': return 'text-success';
            case 'failed': return 'text-danger';
            case 'in_progress': return 'text-warning';
            default: return 'text-muted';
        }
    };

    if (variant === 'horizontal') {
        return (
            <Card className="mb-3">
                <Card.Header>{title}</Card.Header>
                <Card.Body>
                    <div className="d-flex flex-wrap gap-2">
                        {steps.map((step) => (
                            <div key={step.key} className="d-flex align-items-center">
                                <span className={`me-2 ${getStatusClass(step.status)}`}>
                                    {getStatusIcon(step.status)}
                                </span>
                                <span className="badge bg-light text-dark">
                                    {step.title}
                                </span>
                            </div>
                        ))}
                    </div>
                </Card.Body>
            </Card>
        );
    }

    return (
        <Card className="mb-3">
            <Card.Header>{title}</Card.Header>
            <Card.Body>
                <div className="d-flex flex-column gap-2">
                    {steps.map((step) => (
                        <div key={step.key} className="d-flex align-items-center p-2 border rounded">
                            <span className={`me-3 ${getStatusClass(step.status)}`}>
                                {getStatusIcon(step.status)}
                            </span>
                            <div className="flex-grow-1">
                                <div className="fw-bold">{step.title}</div>
                                {step.message && <small className="text-muted">{step.message}</small>}
                            </div>
                        </div>
                    ))}
                </div>
            </Card.Body>
        </Card>
    );
};

export default ProgressTracker;
