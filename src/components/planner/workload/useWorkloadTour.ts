import { driver } from "driver.js";
import "driver.js/dist/driver.css";

const GRID_TOUR_KEY = "workload_grid_tour_seen";
const BOARD_TOUR_KEY = "workload_board_tour_seen";

export function getGridTourSeen(): boolean {
  try { return localStorage.getItem(GRID_TOUR_KEY) === "true"; } catch { return false; }
}
export function getBoardTourSeen(): boolean {
  try { return localStorage.getItem(BOARD_TOUR_KEY) === "true"; } catch { return false; }
}
export function setGridTourSeen(): void {
  try { localStorage.setItem(GRID_TOUR_KEY, "true"); } catch {}
}
export function setBoardTourSeen(): void {
  try { localStorage.setItem(BOARD_TOUR_KEY, "true"); } catch {}
}

const GRID_STEPS = [
  {
    element: ".workload-filter-bar",
    popover: {
      title: "Filter your team",
      description: "Narrow down by week, project, member, or priority. Hit Apply to update.",
      side: "bottom" as const,
      align: "start" as const,
    },
  },
  {
    element: ".workload-summary-row",
    popover: {
      title: "Team at a glance",
      description: "Check here first — if overloaded members or critical tasks are non-zero, someone needs attention immediately.",
      side: "bottom" as const,
      align: "start" as const,
    },
  },
  {
    element: ".workload-legend--toolbar",
    popover: {
      title: "Read the colors",
      description: `<div style="display:flex;flex-direction:column;gap:8px;margin-top:4px;">
  <div style="display:flex;align-items:center;gap:8px;"><span style="width:10px;height:10px;border-radius:50%;background:#22c55e;flex-shrink:0;display:inline-block;"></span><span><strong>0–74% Comfortable</strong> — Member has room for more work.</span></div>
  <div style="display:flex;align-items:center;gap:8px;"><span style="width:10px;height:10px;border-radius:50%;background:#f97316;flex-shrink:0;display:inline-block;"></span><span><strong>75–99% Near Full</strong> — Almost full, assign carefully.</span></div>
  <div style="display:flex;align-items:center;gap:8px;"><span style="width:10px;height:10px;border-radius:50%;background:#ef4444;flex-shrink:0;display:inline-block;"></span><span><strong>100%+ Overloaded</strong> — Reassign or reschedule tasks.</span></div>
  <div style="display:flex;align-items:center;gap:8px;"><span style="width:10px;height:10px;border-radius:50%;background:#ea580c;flex-shrink:0;display:inline-block;"></span><span><strong>Orange dot</strong> — Member has unestimated tasks.</span></div>
</div>`,
      side: "bottom" as const,
      align: "start" as const,
    },
  },
  {
    element: ".workload-grid-wrap",
    popover: {
      title: "Weekly capacity grid",
      description: `Each cell shows a member's load for that day.<br><br>
<strong>Orange dot (•)</strong> = unestimated tasks not counted in load % — actual load could be higher.<br><br>
<strong>"X unest."</strong> = unestimated tasks that day. Click the cell to add estimates.`,
      side: "top" as const,
      align: "start" as const,
    },
  },
  {
    element: ".workload-page__header",
    popover: {
      title: "Switch to Board view",
      description: "Spreadsheet shows capacity. Board view is for task management — drag cards to reassign or reschedule.<br><br><strong>Click the Board button above to start the Board tour.</strong>",
      side: "bottom" as const,
      align: "end" as const,
    },
  },
];

const BOARD_STEPS = [
  {
    element: ".workload-board-toolbar",
    popover: {
      title: "Capacity at a glance",
      description: `<div style="display:flex;flex-direction:column;gap:8px;margin-top:4px;">
  <div style="display:flex;align-items:center;gap:8px;"><span style="width:10px;height:10px;border-radius:50%;background:#22c55e;flex-shrink:0;display:inline-block;"></span><span><strong>0–74% Comfortable</strong> — Member has room for more work.</span></div>
  <div style="display:flex;align-items:center;gap:8px;"><span style="width:10px;height:10px;border-radius:50%;background:#f97316;flex-shrink:0;display:inline-block;"></span><span><strong>75–99% Near Full</strong> — Almost full, assign carefully.</span></div>
  <div style="display:flex;align-items:center;gap:8px;"><span style="width:10px;height:10px;border-radius:50%;background:#ef4444;flex-shrink:0;display:inline-block;"></span><span><strong>100%+ Overloaded</strong> — Reassign or reschedule tasks.</span></div>
  <div style="display:flex;align-items:center;gap:8px;"><span style="width:10px;height:10px;border-radius:50%;background:#ea580c;flex-shrink:0;display:inline-block;"></span><span><strong>Orange dot</strong> — Member has unestimated tasks.</span></div>
</div>`,
      side: "bottom" as const,
      align: "start" as const,
    },
  },
  {
    element: ".workload-board__column",
    popover: {
      title: "Member workload",
      description: "Each column shows a member's total estimated hours vs capacity. The progress bar fills up as tasks are added — red means overloaded.",
      side: "right" as const,
      align: "start" as const,
    },
  },
  {
    element: ".workload-board-task-card",
    popover: {
      title: "Manage tasks directly",
      description: "Drag a card to another column to reassign. Use 'Move to' on the card to change the due date without opening the full task.",
      side: "right" as const,
      align: "start" as const,
    },
  },
];

export function startWorkloadTour(
  mainView: "grid" | "board",
  onDone: () => void,
) {
  const steps = mainView === "board" ? BOARD_STEPS : GRID_STEPS;

  const driverObj = driver({
    showProgress: true,
    animate: true,
    overlayColor: "rgba(0,0,0,0.5)",
    stagePadding: 6,
    popoverClass: "workload-tour-popover",
    nextBtnText: "Next →",
    prevBtnText: "← Back",
    doneBtnText: "Done",
    steps,
    onDestroyStarted: () => {
      driverObj.destroy();
      if (mainView === "grid") {
        setGridTourSeen();
      } else {
        setBoardTourSeen();
      }
      onDone();
    },
  });

  driverObj.drive();
}
