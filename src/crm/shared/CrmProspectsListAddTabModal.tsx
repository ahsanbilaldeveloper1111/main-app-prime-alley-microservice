import React from "react";
import { Button, Modal } from "react-bootstrap";
import { toast } from "react-toastify";
import { FiCalendar, FiTarget } from "react-icons/fi";
import type { Dispatch, SetStateAction } from "react";

export type CrmProspectsListAddTabModalProps = Readonly<{
  show: boolean;
  onHide: () => void;
  customTabs: readonly { id: string; label: string; count?: number; removable?: boolean }[];
  setCustomTabs: Dispatch<
    SetStateAction<{ id: string; label: string; count?: number; removable?: boolean }[]>
  >;
  scheduledRecordsCount: number;
  hasLeadsTabLabel: string;
}>;

/**
 * Add custom filter tabs (scheduled / has leads) — shared by quotes and prospects list UIs.
 */
export function CrmProspectsListAddTabModal({
  show,
  onHide,
  customTabs,
  setCustomTabs,
  scheduledRecordsCount,
  hasLeadsTabLabel,
}: CrmProspectsListAddTabModalProps) {
  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>Add New Tab</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="text-muted mb-3">Select a filter to add as a new tab</p>
        <div className="d-grid gap-2">
          <Button
            variant="outline-primary"
            onClick={() => {
              if (!customTabs.some((t) => t.id === "scheduled")) {
                setCustomTabs([
                  ...customTabs,
                  {
                    id: "scheduled",
                    label: "Scheduled",
                    count: scheduledRecordsCount,
                    removable: true,
                  },
                ]);
                onHide();
                toast.success("Tab added successfully!");
              }
            }}
            disabled={customTabs.some((t) => t.id === "scheduled")}
          >
            <FiCalendar size={16} className="me-2" />
            Scheduled
          </Button>
          <Button
            variant="outline-primary"
            onClick={() => {
              if (!customTabs.some((t) => t.id === "has_leads")) {
                setCustomTabs([
                  ...customTabs,
                  {
                    id: "has_leads",
                    label: hasLeadsTabLabel,
                    removable: true,
                  },
                ]);
                onHide();
                toast.success("Tab added successfully!");
              }
            }}
            disabled={customTabs.some((t) => t.id === "has_leads")}
          >
            <FiTarget size={16} className="me-2" />
            {hasLeadsTabLabel}
          </Button>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
