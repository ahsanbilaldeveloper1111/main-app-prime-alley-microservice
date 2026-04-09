import React, { Dispatch, SetStateAction } from "react";
import { Button, Modal, Badge } from "react-bootstrap";
import { toast } from "react-toastify";
import { Layers, X, Trash2 } from "lucide-react";
import type { TabConfig } from "@components/GenericTable";

export type CrmDealsListAddTabModalProps = Readonly<{
  show: boolean;
  onHide: () => void;
  stages: ReadonlyArray<{ id: string | number; name: string }>;
  customTabs: readonly TabConfig[];
  setCustomTabs: Dispatch<SetStateAction<TabConfig[]>>;
  filterCounts: Record<string, number> & {
    lost?: number;
    deleted?: number;
    rejected?: number;
  };
  showRejectedTab?: boolean;
}>;

export function CrmDealsListAddTabModal({
  show,
  onHide,
  stages,
  customTabs,
  setCustomTabs,
  filterCounts,
  showRejectedTab = false,
}: CrmDealsListAddTabModalProps) {
  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>Add New Tab</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="text-muted mb-3">Select a filter to add as a new tab</p>
        <div className="d-grid gap-2">
          {stages.map((stage) => {
            const isAlreadyAdded = customTabs.some(
              (t) => t.id === stage.id.toString(),
            );
            const stageCount =
              (filterCounts as Record<number | string, number>)[stage.id] || 0;
            return (
              <Button
                key={stage.id}
                variant="outline-primary"
                onClick={() => {
                  if (!isAlreadyAdded) {
                    setCustomTabs([
                      ...customTabs,
                      {
                        id: stage.id.toString(),
                        label: stage.name,
                        count: stageCount,
                        removable: true,
                      },
                    ]);
                    onHide();
                    toast.success("Tab added successfully!");
                  }
                }}
                disabled={isAlreadyAdded}
                className="d-flex align-items-center justify-content-start"
                style={{ textAlign: "left" }}
              >
                <Layers size={16} className="me-2" />
                {stage.name}
                {stageCount > 0 && (
                  <Badge bg="secondary" className="ms-auto">
                    {stageCount}
                  </Badge>
                )}
              </Button>
            );
          })}
          <Button
            variant="outline-primary"
            onClick={() => {
                if (!customTabs.some((t) => t.id === "lost")) {
                setCustomTabs([
                  ...customTabs,
                  {
                    id: "lost",
                    label: "Lost",
                    count: filterCounts.lost || 0,
                    removable: true,
                  },
                ]);
                onHide();
                toast.success("Tab added successfully!");
              }
            }}
            disabled={customTabs.some((t) => t.id === "lost")}
            className="d-flex align-items-center justify-content-start"
            style={{ textAlign: "left" }}
          >
            <X size={16} className="me-2" />
            Lost
            {(filterCounts.lost || 0) > 0 && (
              <Badge bg="secondary" className="ms-auto">
                {filterCounts.lost || 0}
              </Badge>
            )}
          </Button>
          <Button
            variant="outline-primary"
            onClick={() => {
                if (!customTabs.some((t) => t.id === "deleted")) {
                setCustomTabs([
                  ...customTabs,
                  {
                    id: "deleted",
                    label: "Deleted",
                    count: filterCounts.deleted || 0,
                    removable: true,
                  },
                ]);
                onHide();
                toast.success("Tab added successfully!");
              }
            }}
            disabled={customTabs.some((t) => t.id === "deleted")}
            className="d-flex align-items-center justify-content-start"
            style={{ textAlign: "left" }}
          >
            <Trash2 size={16} className="me-2" />
            Deleted
            {(filterCounts.deleted || 0) > 0 && (
              <Badge bg="secondary" className="ms-auto">
                {filterCounts.deleted || 0}
              </Badge>
            )}
          </Button>
          {showRejectedTab ? (
            <Button
              variant="outline-primary"
              onClick={() => {
                if (!customTabs.some((t) => t.id === "rejected")) {
                  setCustomTabs([
                    ...customTabs,
                    {
                      id: "rejected",
                      label: "Rejected",
                      count: filterCounts.rejected || 0,
                      removable: true,
                    },
                  ]);
                  onHide();
                  toast.success("Tab added successfully!");
                }
              }}
              disabled={customTabs.some((t) => t.id === "rejected")}
              className="d-flex align-items-center justify-content-start"
              style={{ textAlign: "left" }}
            >
              <X size={16} className="me-2" />
              Rejected
              {(filterCounts.rejected || 0) > 0 && (
                <Badge bg="secondary" className="ms-auto">
                  {filterCounts.rejected || 0}
                </Badge>
              )}
            </Button>
          ) : null}
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
