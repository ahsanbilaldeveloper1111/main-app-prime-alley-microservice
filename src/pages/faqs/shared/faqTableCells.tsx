import React from 'react';
import { Edit, Trash2 } from 'lucide-react';
import { Button } from 'react-bootstrap';

// ===== createFaqEditDeleteActionCell =====
export function createFaqEditDeleteActionCell(
  onEdit: (props: any) => void,
  onDelete: (props: any) => void
) {
  return function FaqActionCell(props: any) {
    return (
      <div className="d-flex gap-2">
        <Button
          variant="light"
          className="btn-action-style-2 p-1 text-primary"
          title="Edit"
          onClick={() => onEdit(props)}
        >
          <Edit size={16} />
        </Button>
        <Button
          variant="light"
          className="btn-action-style-2 p-1 text-danger"
          title="Delete"
          onClick={() => onDelete(props)}
        >
          <Trash2 size={16} />
        </Button>
      </div>
    );
  };
}

// ===== renderFaqDescriptionCell =====
interface DescriptionCellProps {
  description?: string;
  maxWidth?: string;
}

export function renderFaqDescriptionCell(props: any, options?: { maxWidth?: string }) {
  return (
    <div style={{ maxWidth: options?.maxWidth }}>
      <span className={props.description ? '' : 'text-muted'}>
        {props.description || 'No description'}
      </span>
    </div>
  );
}

// ===== renderFaqModuleCell =====
export function renderFaqModuleCell(props: any) {
  if (props.faq_module) {
    return (
      <div>
        <span
          className="status-badge primary"
          title={props.faq_module.description || ''}
        >
          {props.faq_module.name}
        </span>
      </div>
    );
  }
  return <span className="text-muted">No module</span>;
}

// ===== renderFaqCountCell =====
export function renderFaqCountCell(props: any) {
  return (
    <div>
      <span className="status-badge primary">{props.faqs_count || 0}</span>
    </div>
  );
}
