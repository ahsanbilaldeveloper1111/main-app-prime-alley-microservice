import React from "react";
import { Badge, Modal } from "react-bootstrap";
import { FileText, Layers, X } from "lucide-react";
import { FiEdit2 } from "react-icons/fi";
import { CrmDescriptionDetailsBlock } from "@components/crm/crmTruncatedDescriptionCell";
import { MainSettingsFormSidebar } from "@components/main-settings/MainSettingsFormSidebar";
import { useCrmSettingsPrefersSidebar } from "@page-modules/crm/shared/CrmSettingsPanelShell";
import { formatCrmPreviewDate } from "@utils/Helper";
import {
  getTypeBadgeColor,
  getTypeDisplayName,
  type StageRow,
} from "@page-modules/crm/stages/stagesPageModel";

export interface StageViewModalProps {
  show: boolean;
  stage: StageRow;
  canEdit: boolean;
  onHide: () => void;
  onEdit: () => void;
}

function StageViewFooter({
  canEdit,
  onEdit,
  onHide,
}: Readonly<{
  canEdit: boolean;
  onEdit: () => void;
  onHide: () => void;
}>) {
  return (
    <div className="w-100 d-flex justify-content-end stages-crm-dialog-footer">
      {canEdit && (
        <button type="button" className="stages-crm-btn-primary" onClick={onEdit}>
          <FiEdit2 size={16} aria-hidden />
          Edit Stage
        </button>
      )}
      <button type="button" className="stages-crm-btn-secondary" onClick={onHide}>
        Close
      </button>
    </div>
  );
}

function StageViewContent({ stage }: Readonly<{ stage: StageRow }>) {
  return (
    <>
      <div className="stages-view-section-title">
        <Layers size={18} className="stages-view-section-icon" aria-hidden />
        Stage Information
      </div>
      <div className="stages-view-grid">
        <div className="stages-view-tile">
          <div className="stages-view-tile-label">Stage Name</div>
          <div className="stages-view-tile-value">{stage.name}</div>
        </div>
        <div className="stages-view-tile">
          <div className="stages-view-tile-label">Sequence</div>
          <div className="stages-view-tile-value">{stage.sequence}</div>
        </div>
        <div className="stages-view-tile">
          <div className="stages-view-tile-label">Type</div>
          <div className="stages-view-tile-value">
            <Badge bg={getTypeBadgeColor(stage.type)}>
              {getTypeDisplayName(stage.type)}
            </Badge>
          </div>
        </div>
        <div className="stages-view-tile">
          <div className="stages-view-tile-label">Color</div>
          <div className="stages-view-tile-value stages-view-tile-value-row">
            <div
              className="stages-view-color-swatch"
              aria-label={`Color ${stage.color}`}
              title={stage.color}
              style={{ backgroundColor: stage.color }}
            />
          </div>
        </div>
        <div className="stages-view-tile">
          <div className="stages-view-tile-label">Created Date</div>
          <div className="stages-view-tile-value">
            {formatCrmPreviewDate(stage.created_at)}
          </div>
        </div>
      </div>

      <div className="stages-view-section-title">
        <FileText size={18} className="stages-view-section-icon" aria-hidden />
        Description
      </div>
      <CrmDescriptionDetailsBlock
        text={stage.description}
        emptyDisplay="No description"
      />
    </>
  );
}

/** Read-only details for a single stage (sidebar in Main Settings, modal elsewhere). */
export const StageViewModal: React.FC<StageViewModalProps> = ({
  show,
  stage,
  canEdit,
  onHide,
  onEdit,
}) => {
  const preferSidebar = useCrmSettingsPrefersSidebar();
  const footer = (
    <StageViewFooter canEdit={canEdit} onEdit={onEdit} onHide={onHide} />
  );

  if (preferSidebar) {
    return (
      <MainSettingsFormSidebar
        show={show}
        onHide={onHide}
        title={stage.name}
        footer={footer}
      >
        <p className="text-muted small mb-3">Stage Details</p>
        <StageViewContent stage={stage} />
      </MainSettingsFormSidebar>
    );
  }

  return (
    <Modal show={show} onHide={onHide} size="xl" centered>
      <div className="stages-view-header">
        <button
          type="button"
          className="stages-view-close"
          aria-label="Close stage details"
          onClick={onHide}
        >
          <X size={20} aria-hidden />
        </button>
        <h3 className="stages-view-title">{stage.name}</h3>
        <p className="stages-view-subtitle">Stage Details</p>
      </div>

      <Modal.Body className="stages-view-body">
        <StageViewContent stage={stage} />
        <div className="stages-view-footer">{footer}</div>
      </Modal.Body>
    </Modal>
  );
};
