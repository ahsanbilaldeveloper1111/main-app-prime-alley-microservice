import React from "react";
import { Button, Form, Modal } from "react-bootstrap";
import { Plus } from "lucide-react";
import { TOTAL_VIEWS, POSSIBLE_TABS, persistVisibleTabIds } from "./plannerTasksListingDomain";
import "./plannerTasksListing.scss";

type Tab = (typeof POSSIBLE_TABS)[number];

export type PlannerTasksTabsBarProps = {
  allTabs: Tab[];
  activeTab: string;
  switchTab: (id: string) => void;
  visibleTabIds: string[];
  setVisibleTabIds: React.Dispatch<React.SetStateAction<string[]>>;
  showAddViewModal: boolean;
  setShowAddViewModal: React.Dispatch<React.SetStateAction<boolean>>;
  toggleVisibleTab: (tabId: string, isVisible: boolean, isOnlyOne: boolean) => void;
};

export function PlannerTasksTabsBar({
  allTabs,
  activeTab,
  switchTab,
  visibleTabIds,
  setVisibleTabIds,
  showAddViewModal,
  setShowAddViewModal,
  toggleVisibleTab,
}: Readonly<PlannerTasksTabsBarProps>) {
  const currentViewCount = allTabs.length;
  const showRestoreAllTabsButton = visibleTabIds.length < POSSIBLE_TABS.length;

  return (
    <>
      <div className="ptl-tabs-row">
        {allTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => switchTab(tab.id)}
            className={`ptl-tab-btn ${
              activeTab === tab.id ? "ptl-tab-btn--active" : "ptl-tab-btn--inactive"
            } ${tab.id === "all" ? "ptl-tab-btn--all" : "ptl-tab-btn--default"}`}
          >
            {tab.label}
          </button>
        ))}

        <button
          type="button"
          onClick={() => setShowAddViewModal(true)}
          className="ptl-add-view-btn"
        >
          <Plus size={14} />
          Add view ({currentViewCount}/{TOTAL_VIEWS})
        </button>

        {showRestoreAllTabsButton ? (
          <button
            type="button"
            onClick={() => {
              const all = POSSIBLE_TABS.map((t) => t.id);
              setVisibleTabIds(all);
              persistVisibleTabIds(all);
            }}
            className="ptl-all-views-btn"
          >
            All Views
          </button>
        ) : null}
      </div>

      <Modal show={showAddViewModal} onHide={() => setShowAddViewModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Manage views</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-muted small mb-3">
            Toggle which views appear in the tab bar. At least one must be visible.
          </p>
          {POSSIBLE_TABS.map((tab) => {
            const isVisible = visibleTabIds.includes(tab.id);
            const isOnlyOne = visibleTabIds.length === 1;
            return (
              <Form.Check
                key={tab.id}
                type="switch"
                id={`view-${tab.id}`}
                label={tab.label}
                checked={isVisible}
                disabled={isVisible && isOnlyOne}
                onChange={() => {
                  toggleVisibleTab(tab.id, isVisible, isOnlyOne);
                }}
                className="mb-2"
              />
            );
          })}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddViewModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
