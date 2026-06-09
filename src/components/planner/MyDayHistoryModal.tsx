import React from "react";
import { Button, Modal, Nav } from "react-bootstrap";
import { MyDayMonthlyReportSection } from "@components/planner/my-day/MyDayMonthlyReportSection";
import { MyDayHistoryPastDayPanel } from "@components/planner/my-day/MyDayHistoryPastDayPanel";
import {
  useMyDayHistoryModal,
  type MyDayHistoryView,
} from "@components/planner/my-day/useMyDayHistoryModal";

export type { MyDayHistoryTaskRow } from "@page-modules/planner/my-day/myDayHistoryDomain";

export type MyDayHistoryModalProps = Readonly<{
  show: boolean;
  todayIso: string;
  onClose: () => void;
}>;

type MyDayHistoryViewTabsProps = Readonly<{
  activeView: MyDayHistoryView;
  onViewChange: (view: MyDayHistoryView) => void;
}>;

function MyDayHistoryViewTabs({ activeView, onViewChange }: MyDayHistoryViewTabsProps) {
  return (
    <Nav variant="tabs" className="reports-view-tabs mb-3">
      <Nav.Item>
        <Nav.Link active={activeView === "past_day"} onClick={() => onViewChange("past_day")}>
          Past day
        </Nav.Link>
      </Nav.Item>
      <Nav.Item>
        <Nav.Link active={activeView === "monthly"} onClick={() => onViewChange("monthly")}>
          My Day Monthly
        </Nav.Link>
      </Nav.Item>
    </Nav>
  );
}

export function MyDayHistoryModal({ show, todayIso, onClose }: MyDayHistoryModalProps) {
  const state = useMyDayHistoryModal(show, todayIso);

  return (
    <Modal
      show={show}
      onHide={onClose}
      size="xl"
      centered
      scrollable
      dialogClassName="myday-history-modal"
      contentClassName="myday-history-modal__content"
    >
      <Modal.Header closeButton>
        <Modal.Title>My Day history</Modal.Title>
      </Modal.Header>
      <Modal.Body className="myday-history-modal__body">
        <MyDayHistoryViewTabs activeView={state.activeView} onViewChange={state.setActiveView} />

        {state.activeView === "monthly" ? (
          <MyDayMonthlyReportSection active={show && state.activeView === "monthly"} />
        ) : (
          <MyDayHistoryPastDayPanel
            yesterdayIso={state.yesterdayIso}
            selectedDate={state.selectedDate}
            dateOptions={state.dateOptions}
            loading={state.loading}
            rows={state.rows}
            historyResult={state.historyResult}
            metaLine={state.metaLine}
            onSelectedDateChange={state.setSelectedDate}
          />
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
