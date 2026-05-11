import React from "react";
import { Card, Button, Modal, Row, Col, Badge } from "react-bootstrap";
import { AuditLog } from "@models/tms/AuditLog";

function formatAuditFieldLabel(fieldKey: string): string {
    return fieldKey
        .split("_")
        .filter((w) => w.length > 0)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" ");
}

function keyPartFromUnknown(item: unknown): string {
    if (typeof item === "object") {
        if (item === null) {
            return "null";
        }
        try {
            return JSON.stringify(item);
        } catch {
            return "[Unserializable]";
        }
    }
    if (typeof item === "string" || typeof item === "number" || typeof item === "boolean") {
        return String(item);
    }
    if (typeof item === "bigint") {
        return String(item);
    }
    if (typeof item === "symbol") {
        return String(item);
    }
    if (typeof item === "function") {
        return item.name ? `fn:${item.name}` : "fn:anonymous";
    }
    if (item === undefined) {
        return "undefined";
    }
    return "unknown";
}

function stableArrayItemKey(prefix: string, index: number, item: unknown): string {
    const raw = keyPartFromUnknown(item);
    const slice = raw.length > 160 ? raw.slice(0, 160) : raw;
    return `${prefix}-${index}-${slice}`;
}



interface AuditLogDetailProps {
    auditLog: AuditLog;
    close: () => void;
    show: boolean;
}

const AuditLogDetail = ({ auditLog, close, show }: AuditLogDetailProps) => {

    const getStatusBadge = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'success':
                return <Badge bg="success">Success</Badge>;
            case 'error':
                return <Badge bg="danger">Error</Badge>;
            case 'warning':
                return <Badge bg="warning" text="dark">Warning</Badge>;
            case 'info':
                return <Badge bg="info">Info</Badge>;
            default:
                return <Badge bg="secondary">{status || 'Unknown'}</Badge>;
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const parseJsonData = (data: any) => {
        if (!data) return null;
        
        // If it's already an object or array, return it
        if (typeof data === 'object') return data;
        
        // If it's a string, try to parse it as JSON
        if (typeof data === 'string') {
            try {
                return JSON.parse(data);
            } catch {
                return data; // Return as string if parsing fails
            }
        }
        
        return data;
    };

    const formatValue = (value: any, depth: number = 0): string => {
        if (value === null || value === undefined) return 'N/A';
        
        if (typeof value === 'string') {
            return value;
        }
        
        if (typeof value === 'number' || typeof value === 'boolean') {
            return String(value);
        }
        
        if (Array.isArray(value)) {
            if (depth > 2) return '[Array]'; // Prevent infinite recursion
            return `[${value.map(item => formatValue(item, depth + 1)).join(', ')}]`;
        }
        
        if (typeof value === 'object') {
            if (depth > 2) return '{Object}'; // Prevent infinite recursion
            const entries = Object.entries(value).map(([key, val]) => 
                `${key}: ${formatValue(val, depth + 1)}`
            );
            return `{${entries.join(', ')}}`;
        }
        
        return String(value);
    };

    const renderDataComparison = () => {
        if (!auditLog.old_values && !auditLog.new_values) {
            return null;
        }

        const oldData = parseJsonData(auditLog.old_values);
        const newData = parseJsonData(auditLog.new_values);

        // Handle different data types
        if ((Array.isArray(oldData) && oldData.length > 0) || (Array.isArray(newData) && newData.length > 0)) {
            // Handle arrays
            return renderArrayComparison(oldData, newData);
        } else if (typeof oldData === 'object' && oldData !== null && typeof newData === 'object' && newData !== null) {
            // Both are objects
            return renderObjectComparison(oldData, newData);
        } else {
            // Handle primitive values or mixed types
            return renderPrimitiveComparison(oldData, newData);
        }
    };

    const renderArrayComparison = (oldArray: any[], newArray: any[]) => {
        const oldArrayData = Array.isArray(oldArray) ? oldArray : [];
        const newArrayData = Array.isArray(newArray) ? newArray : [];
        
        const hasChanges = JSON.stringify(oldArrayData) !== JSON.stringify(newArrayData);

        return (
            <Card className="border-0 shadow-sm mt-3">
                <Card.Header className="bg-info text-white" style={{ 
                    background: 'linear-gradient(135deg, #17a2b8 0%, #138496 100%) !important',
                    borderBottom: 'none',
                    borderRadius: '0.375rem 0.375rem 0 0'
                }}>
                    <h5 className="mb-0 text-white d-flex align-items-center">
                        <i data-feather="list" style={{ width: '20px', height: '20px', marginRight: '8px' }} />{' '}
                        Array Changes
                        {hasChanges && <Badge bg="warning" className="ms-2">Modified</Badge>}
                    </h5>
                </Card.Header>
                <Card.Body style={{ padding: '1.5rem' }}>
                    <Row className="g-3">
                        <Col md={6}>
                            <div className="array-section">
                                <h6 className="text-danger mb-2">
                                    <i data-feather="minus-circle" style={{ width: '16px', height: '16px', marginRight: '4px' }} />{' '}
                                    Old Array ({oldArrayData.length} items)
                                </h6>
                                <div className="array-content old-array">
                                    {oldArrayData.length > 0 ? (
                                        oldArrayData.map((item, index) => (
                                            <div key={stableArrayItemKey('old', index, item)} className={`array-item ${hasChanges && index < newArrayData.length && JSON.stringify(item) !== JSON.stringify(newArrayData[index]) ? 'changed' : ''}`}>
                                                <div className="array-item-header">
                                                    <span className="array-index">[{index}]</span>
                                                </div>
                                                <div className="array-item-content">
                                                    {renderValueContent(item)}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <span className="no-data">Empty array</span>
                                    )}
                                </div>
                            </div>
                        </Col>
                        <Col md={6}>
                            <div className="array-section">
                                <h6 className="text-success mb-2">
                                    <i data-feather="plus-circle" style={{ width: '16px', height: '16px', marginRight: '4px' }} />{' '}
                                    New Array ({newArrayData.length} items)
                                </h6>
                                <div className="array-content new-array">
                                    {newArrayData.length > 0 ? (
                                        newArrayData.map((item, index) => (
                                            <div key={stableArrayItemKey('new', index, item)} className={`array-item ${hasChanges && index < oldArrayData.length && JSON.stringify(item) !== JSON.stringify(oldArrayData[index]) ? 'changed' : ''}`}>
                                                <div className="array-item-header">
                                                    <span className="array-index">[{index}]</span>
                                                </div>
                                                <div className="array-item-content">
                                                    {renderValueContent(item)}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <span className="no-data">Empty array</span>
                                    )}
                                </div>
                            </div>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>
        );
    };

    const renderObjectComparison = (oldObj: any, newObj: any) => {
        const allKeys = Array.from(new Set([...Object.keys(oldObj || {}), ...Object.keys(newObj || {})]));

        if (allKeys.length === 0) {
            return null;
        }

        return (
            <Card className="border-0 shadow-sm mt-3">
                <Card.Header className="bg-info text-white" style={{ 
                    background: 'linear-gradient(135deg, #17a2b8 0%, #138496 100%) !important',
                    borderBottom: 'none',
                    borderRadius: '0.375rem 0.375rem 0 0'
                }}>
                    <h5 className="mb-0 text-white d-flex align-items-center">
                        <i data-feather="git-compare" style={{ width: '20px', height: '20px', marginRight: '8px' }} />{' '}
                        Data Changes
                    </h5>
                </Card.Header>
                <Card.Body style={{ padding: '1.5rem' }}>
                    <Row className="g-3">
                        <Col md={12}>
                            <div className="comparison-header">
                                <div className="old-column">
                                    <h6 className="text-danger mb-2">
                                        <i data-feather="minus-circle" style={{ width: '16px', height: '16px', marginRight: '4px' }} />{' '}
                                        Old Values
                                    </h6>
                                </div>
                                <div className="new-column">
                                    <h6 className="text-success mb-2">
                                        <i data-feather="plus-circle" style={{ width: '16px', height: '16px', marginRight: '4px' }} />{' '}
                                        New Values
                                    </h6>
                                </div>
                            </div>
                        </Col>
                        {allKeys.map((key) => {
                            const oldValue = oldObj?.[key];
                            const newValue = newObj?.[key];
                            const hasChanged = JSON.stringify(oldValue) !== JSON.stringify(newValue);

                            return (
                                <Col md={12} key={key}>
                                    <div className={`data-change-item ${hasChanged ? 'changed' : 'unchanged'}`}>
                                        <div className="field-name">
                                            <strong>{formatAuditFieldLabel(key)}</strong>
                                        </div>
                                        <div className="field-values">
                                            <div className="old-value">
                                                <div className="value-content">
                                                    {renderValueContent(oldValue)}
                                                </div>
                                            </div>
                                            <div className="change-arrow">
                                                <i data-feather="arrow-right" style={{ width: '16px', height: '16px' }}></i>
                                            </div>
                                            <div className="new-value">
                                                <div className="value-content">
                                                    {renderValueContent(newValue)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Col>
                            );
                        })}
                    </Row>
                </Card.Body>
            </Card>
        );
    };

    const renderValueContent = (value: any) => {
        if (value === null || value === undefined) {
            return <span className="null-value">N/A</span>;
        }

        if (Array.isArray(value)) {
            return (
                <div className="array-display">
                    {value.length === 0 ? (
                        <span className="empty-array">Empty Array</span>
                    ) : (
                        value.map((item, index) => (
                            <div key={stableArrayItemKey('vc', index, item)} className="array-item-display">
                                {/* <span className="item-index">[{index}]</span> */}
                                <div className="item-content capitalize">
                                    {renderValueContent(item)}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            );
        }

        if (typeof value === 'object') {
            return (
                <div className="object-display">
                    {Object.keys(value).length === 0 ? (
                        <span className="empty-object">Empty Object</span>
                    ) : (
                        Object.entries(value).map(([key, val]) => (
                            <div key={key} className="object-item-display">
                                <span className="object-key">{key}:</span>
                                <div className="object-value">
                                    {renderValueContent(val)}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            );
        }

        return <span className="primitive-value">{String(value)}</span>;
    };

    const renderPrimitiveComparison = (oldValue: any, newValue: any) => {
        const hasChanged = oldValue !== newValue;
        
        return (
            <Card className="border-0 shadow-sm mt-3">
                <Card.Header className="bg-info text-white" style={{ 
                    background: 'linear-gradient(135deg, #17a2b8 0%, #138496 100%) !important',
                    borderBottom: 'none',
                    borderRadius: '0.375rem 0.375rem 0 0'
                }}>
                    <h5 className="mb-0 text-white d-flex align-items-center">
                        <i data-feather="git-compare" style={{ width: '20px', height: '20px', marginRight: '8px' }} />{' '}
                        Value Changes
                    </h5>
                </Card.Header>
                <Card.Body style={{ padding: '1.5rem' }}>
                    <Row className="g-3">
                        <Col md={12}>
                            <div className={`data-change-item ${hasChanged ? 'changed' : 'unchanged'}`}>
                                <div className="field-values">
                                    <div className="old-value">
                                        <span className="value-text">
                                            {formatValue(oldValue)}
                                        </span>
                                    </div>
                                    <div className="change-arrow">
                                        <i data-feather="arrow-right" style={{ width: '16px', height: '16px' }}></i>
                                    </div>
                                    <div className="new-value">
                                        <span className="value-text">
                                            {formatValue(newValue)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>
        );
    };

    const renderAdditionalData = () => {
        const additionalFields = [
            { key: 'status', label: 'Status', icon: 'activity' },
            { key: 'description', label: 'Description', icon: 'file-text' },
            { key: 'metadata', label: 'Metadata', icon: 'database' },
            { key: 'context', label: 'Context', icon: 'layers' },
        ];

        const fieldsToShow = additionalFields.filter(field => 
            auditLog[field.key as keyof AuditLog] !== undefined && 
            auditLog[field.key as keyof AuditLog] !== null
        );

        if (fieldsToShow.length === 0) return null;

        return (
            <Card className="border-0 shadow-sm mt-3">
                <Card.Header className="bg-warning text-white" style={{ 
                    background: 'linear-gradient(135deg, #ffc107 0%, #e0a800 100%) !important',
                    borderBottom: 'none',
                    borderRadius: '0.375rem 0.375rem 0 0'
                }}>
                    <h5 className="mb-0 text-white d-flex align-items-center">
                        <i className="fas fa-info-circle me-2" />{' '}
                        Additional Information
                    </h5>
                </Card.Header>
                <Card.Body style={{ padding: '1.5rem' }}>
                    <Row className="g-3">
                        {fieldsToShow.map((field) => {
                            const value = auditLog[field.key as keyof AuditLog];
                            const formattedValue = typeof value === 'object' ? 
                                JSON.stringify(value, null, 2) : 
                                String(value);

                            return (
                                <Col md={12} key={field.key}>
                                    <div className="detail-item">
                                        <label className="detail-label" htmlFor={`audit-additional-${field.key}`}>
                                            <i data-feather={field.icon} />{' '}
                                            {field.label}
                                        </label>
                                        <div id={`audit-additional-${field.key}`} className="detail-value">
                                            {field.key === 'status' ? (
                                                getStatusBadge(formattedValue)
                                            ) : (
                                                <pre className="mb-0" style={{ 
                                                    whiteSpace: 'pre-wrap', 
                                                    wordBreak: 'break-word',
                                                    fontSize: '0.875rem',
                                                    fontFamily: 'inherit'
                                                }}>
                                                    {formattedValue}
                                                </pre>
                                            )}
                                        </div>
                                    </div>
                                </Col>
                            );
                        })}
                    </Row>
                </Card.Body>
            </Card>
        );
    };

    return (
        <Modal className="detail-modal-info" show={show} onHide={close} size="lg" centered>
            <Modal.Header closeButton style={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                borderBottom: 'none'
            }}>
                <Modal.Title style={{ fontWeight: '600' }} id="audit-log-modal-title">
                    <i className="fas fa-clipboard-list me-2" />{' '}
                    Audit Log Details
                </Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ padding: '1.5rem' }}>
                <Card className="border-0 shadow-sm">
                    <Card.Header className="bg-primary text-white" style={{ 
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important',
                        borderBottom: 'none',
                        borderRadius: '0.375rem 0.375rem 0 0'
                    }}>
                        <h5 className="mb-0 text-white d-flex align-items-center">
                            <i className="fas fa-info-circle me-2" />{' '}
                            Log Information
                        </h5>
                    </Card.Header>
                    <Card.Body style={{ padding: '1.5rem' }}>
                        <Row className="g-3">
                            <Col md={6}>
                                <div className="detail-item">
                                    <label className="detail-label" htmlFor="audit-log-company">
                                        <i data-feather="briefcase" />{' '}
                                        Company
                                    </label>
                                    <p id="audit-log-company" className="detail-value">{auditLog.company?.name || 'N/A'}</p>
                                </div>
                            </Col>
                            <Col md={6}>
                                <div className="detail-item">
                                    <label className="detail-label" htmlFor="audit-log-user">
                                        <i data-feather="user" />{' '}
                                        User
                                    </label>
                                    <p id="audit-log-user" className="detail-value">{auditLog.user?.name || 'N/A'}</p>
                                </div>
                            </Col>
                          
                            {auditLog.action && (
                                <Col md={12}>
                                    <div className="detail-item">
                                        <label className="detail-label" htmlFor="audit-log-action">
                                            <i data-feather="zap" />{' '}
                                            Action
                                        </label>
                                        <p id="audit-log-action" className="detail-value">{auditLog.action}</p>
                                    </div>
                                </Col>
                            )}
                          
                            {auditLog.ip_address && (
                                <Col md={6}>
                                    <div className="detail-item">
                                        <label className="detail-label" htmlFor="audit-log-ip">
                                            <i data-feather="monitor" />{' '}
                                            IP Address
                                        </label>
                                        <p id="audit-log-ip" className="detail-value">{auditLog.ip_address}</p>
                                    </div>
                                </Col>
                            )}
                            {auditLog.user_agent && (
                                <Col md={6}>
                                    <div className="detail-item">
                                        <label className="detail-label" htmlFor="audit-log-user-agent">
                                            <i data-feather="tablet" />{' '}
                                            User Agent
                                        </label>
                                        <p id="audit-log-user-agent" className="detail-value text-truncate" title={auditLog.user_agent}>
                                            {auditLog.user_agent}
                                        </p>
                                    </div>
                                </Col>
                            )}
                            <Col md={6}>
                                <div className="detail-item">
                                    <label className="detail-label" htmlFor="audit-log-created">
                                        <i data-feather="calendar" />{' '}
                                        Created At
                                    </label>
                                    <p id="audit-log-created" className="detail-value">
                                        {auditLog.created_at ? formatDate(auditLog.created_at) : 'N/A'}
                                    </p>
                                </div>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>
                
                {/* Data Changes Section */}
                {renderDataComparison()}
                
                {/* Additional Information Section */}
                {renderAdditionalData()}
               
            </Modal.Body>
            <Modal.Footer style={{ 
                borderTop: '1px solid #e9ecef',
                padding: '1rem 1.5rem'
            }}>
                <Button 
                    variant="secondary" 
                    onClick={close}
                    style={{
                        background: 'linear-gradient(135deg, #6c757d 0%, #495057 100%)',
                        border: 'none',
                        padding: '0.5rem 1.5rem',
                        borderRadius: '0.375rem',
                        fontWeight: '500'
                    }}
                >
                    <span className="d-inline-flex align-items-center gap-2">
                        <i className="fas fa-times" aria-hidden />
                        <span>Close</span>
                    </span>
                </Button>
            </Modal.Footer>
            
            <style>{`
                .comparison-header {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 1rem;
                    padding: 0.5rem;
                    background-color: #f8f9fa;
                    border-radius: 0.25rem;
                }
                
                .old-column, .new-column {
                    flex: 1;
                    text-align: center;
                }
                
                .data-change-item {
                    padding: 0.75rem;
                    border: 1px solid #e9ecef;
                    border-radius: 0.25rem;
                    margin-bottom: 0.5rem;
                    background-color: #fff;
                }
                
                .data-change-item.changed {
                    border-left: 4px solid #28a745;
                    background-color: #f8fff9;
                }
                
                .data-change-item.unchanged {
                    border-left: 4px solid #6c757d;
                    background-color: #f8f9fa;
                }
                
                .field-name {
                    font-weight: 600;
                    color: #495057;
                    margin-bottom: 0.5rem;
                    font-size: 0.875rem;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                
                .field-values {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }
                
                .old-value, .new-value {
                    flex: 1;
                    padding: 0.5rem;
                    border-radius: 0.25rem;
                    min-height: 40px;
                    display: flex;
                    align-items: center;
                }
                
                .old-value {
                    background-color: #fff5f5;
                    border: 1px solid #fed7d7;
                }
                
                .new-value {
                    background-color: #f0fff4;
                    border: 1px solid #c6f6d5;
                }
                
                .change-arrow {
                    color: #6c757d;
                    display: flex;
                    align-items: center;
                }
                
                .value-text {
                    word-break: break-word;
                    font-family: 'Courier New', monospace;
                    font-size: 0.875rem;
                }
                
                .array-section {
                    height: 100%;
                }
                
                .array-content {
                    max-height: 300px;
                    overflow-y: auto;
                    border: 1px solid #e9ecef;
                    border-radius: 0.25rem;
                    padding: 0.5rem;
                }
                
                .old-array {
                    background-color: #fff5f5;
                    border-color: #fed7d7;
                }
                
                .new-array {
                    background-color: #f0fff4;
                    border-color: #c6f6d5;
                }
                
                .array-item {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.25rem 0;
                    border-bottom: 1px solid #f1f3f4;
                }
                
                .array-item:last-child {
                    border-bottom: none;
                }
                
                .array-item.changed {
                    background-color: #fff3cd;
                    border-left: 3px solid #ffc107;
                    padding-left: 0.5rem;
                }
                
                .array-item-header {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    margin-bottom: 0.5rem;
                }
                
                .array-item-content {
                    flex: 1;
                    margin-left: 2rem;
                }
                
                .array-index {
                    font-weight: 600;
                    color: #6c757d;
                    font-size: 0.75rem;
                    min-width: 30px;
                }
                
                .array-value {
                    flex: 1;
                    font-family: 'Courier New', monospace;
                    font-size: 0.875rem;
                }
                
                .no-data {
                    color: #6c757d;
                    font-style: italic;
                }
                
                .detail-item {
                    margin-bottom: 1rem;
                }
                
                .detail-label {
                    font-weight: 600;
                    color: #495057;
                    margin-bottom: 0.5rem;
                    font-size: 0.875rem;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                
                .detail-value {
                    color: #212529;
                    margin-bottom: 0;
                    font-size: 1rem;
                    padding: 0.5rem;
                    background-color: #f8f9fa;
                    border-radius: 0.25rem;
                    border-left: 3px solid #667eea;
                }
                
                .modal-content {
                    border: none;
                    border-radius: 0.5rem;
                    box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
                }
                
                .modal-header .btn-close {
                    filter: invert(1);
                }

                .array-preview {
                    font-size: 0.875rem;
                    color: #6c757d;
                    margin-bottom: 0.5rem;
                }

                .array-indicator {
                    font-weight: 600;
                    color: #007bff;
                }

                .array-item-preview {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.25rem 0;
                    border-bottom: 1px solid #f1f3f4;
                }

                .array-item-preview:last-child {
                    border-bottom: none;
                }

                .array-index {
                    font-weight: 600;
                    color: #6c757d;
                    font-size: 0.75rem;
                    min-width: 30px;
                }

                .array-value {
                    flex: 1;
                    font-family: 'Courier New', monospace;
                    font-size: 0.875rem;
                }

                .array-more {
                    font-style: italic;
                    color: #6c757d;
                }

                .object-preview {
                    font-size: 0.875rem;
                    color: #6c757d;
                    margin-bottom: 0.5rem;
                }

                .object-indicator {
                    font-weight: 600;
                    color: #007bff;
                }

                .object-item-preview {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.25rem 0;
                    border-bottom: 1px solid #f1f3f4;
                }

                .object-item-preview:last-child {
                    border-bottom: none;
                }

                .object-key {
                    font-weight: 600;
                    color: #495057;
                    font-size: 0.875rem;
                }

                .object-value {
                    flex: 1;
                    font-family: 'Courier New', monospace;
                    font-size: 0.875rem;
                }

                .object-more {
                    font-style: italic;
                    color: #6c757d;
                }

                .object-in-array {
                    font-size: 0.875rem;
                    color: #6c757d;
                    margin-bottom: 0.5rem;
                }

                .object-key-value {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.25rem 0;
                    border-bottom: 1px solid #f1f3f4;
                }

                .object-key-value:last-child {
                    border-bottom: none;
                }

                .object-key {
                    font-weight: 600;
                    color: #495057;
                    font-size: 0.875rem;
                }

                .object-value {
                    flex: 1;
                    font-family: 'Courier New', monospace;
                    font-size: 0.875rem;
                }

                .array-in-array {
                    font-size: 0.875rem;
                    color: #6c757d;
                    margin-bottom: 0.5rem;
                }

                .array-summary {
                    font-weight: 600;
                    color: #007bff;
                }

                .sub-array-item {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.25rem 0;
                    border-bottom: 1px solid #f1f3f4;
                }

                .sub-array-item:last-child {
                    border-bottom: none;
                }

                .sub-index {
                    font-weight: 600;
                    color: #6c757d;
                    font-size: 0.75rem;
                    min-width: 30px;
                }

                .sub-value {
                    flex: 1;
                    font-family: 'Courier New', monospace;
                    font-size: 0.875rem;
                }

                .more-indicator {
                    font-style: italic;
                    color: #6c757d;
                }

                .value-content {
                    width: 100%;
                    min-height: 40px;
                    display: flex;
                    align-items: flex-start;
                    padding: 0.5rem;
                }

                .null-value {
                    color: #6c757d;
                    font-style: italic;
                }

                .array-display {
                    width: 100%;
                    font-size: 0.875rem;
                }

                .empty-array {
                    color: #6c757d;
                    font-style: italic;
                    padding: 0.5rem;
                    background-color: #f8f9fa;
                    border-radius: 0.25rem;
                    text-align: center;
                }

                .array-item-display {
                    display: flex;
                    align-items: flex-start;
                    gap: 0.5rem;
                    padding: 0.5rem;
                    margin-bottom: 0.25rem;
                    background-color: #f8f9fa;
                    border-radius: 0.25rem;
                    border-left: 3px solid #007bff;
                }

                .array-item-display:last-child {
                    margin-bottom: 0;
                }

                .item-index {
                    font-weight: 600;
                    color: #007bff;
                    font-size: 0.75rem;
                    min-width: 35px;
                    padding: 0.25rem 0.5rem;
                    background-color: #e3f2fd;
                    border-radius: 0.25rem;
                    text-align: center;
                }

                .item-content {
                    flex: 1;
                    padding-left: 0.5rem;
                }

                .object-display {
                    width: 100%;
                    font-size: 0.875rem;
                }

                .empty-object {
                    color: #6c757d;
                    font-style: italic;
                    padding: 0.5rem;
                    background-color: #f8f9fa;
                    border-radius: 0.25rem;
                    text-align: center;
                }

                .object-item-display {
                    display: flex;
                    align-items: flex-start;
                    gap: 0.5rem;
                    padding: 0.5rem;
                    margin-bottom: 0.25rem;
                    background-color: #fff3cd;
                    border-radius: 0.25rem;
                    border-left: 3px solid #ffc107;
                }

                .object-item-display:last-child {
                    margin-bottom: 0;
                }

                .object-key {
                    font-weight: 600;
                    color: #856404;
                    font-size: 0.875rem;
                    min-width: 80px;
                    padding: 0.25rem 0.5rem;
                    background-color: #fff8e1;
                    border-radius: 0.25rem;
                    text-align: right;
                }

                .object-value {
                    flex: 1;
                    padding-left: 0.5rem;
                }

                .primitive-value {
                    font-family: 'Courier New', monospace;
                    font-size: 0.875rem;
                    color: #212529;
                    padding: 0.5rem;
                    background-color: #e9ecef;
                    border-radius: 0.25rem;
                    word-break: break-word;
                }
            `}</style>
        </Modal>
    );
};

export default AuditLogDetail;
