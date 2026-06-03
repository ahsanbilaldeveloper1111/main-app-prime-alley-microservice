import { driver } from "driver.js";
import "driver.js/dist/driver.css";

export function startWorkloadTour(mainView: "grid" | "board", onDone: () => void) {
  const isBoard = mainView === "board";

  const gridSteps = [
    {
      element: ".workload-filter-bar",
      popover: {
        title: "Filter your team",
        description: "Narrow down by week, project, member, or priority. Useful when managing large teams — focus only on what matters right now. Hit Apply to update.",
        side: "bottom" as const,
        align: "start" as const,
      },
    },
    {
      element: ".workload-summary-row",
      popover: {
        title: "Team at a glance",
        description: "Before diving into details, check here first. If overloaded members or critical tasks are non-zero, someone needs attention immediately.",
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
<strong>Colors:</strong> Green = comfortable, Orange = near full, Red = overloaded.<br><br>
<strong>Orange dot (•)</strong> = member has tasks with no time estimate — these are NOT counted in the load %, so actual load could be higher.<br><br>
<strong>"X unest."</strong> = number of unestimated tasks that day. Click the cell to add estimates.`,
        side: "top" as const,
        align: "start" as const,
      },
    },
    {
      element: ".workload-page__header",
      popover: {
        title: "Two ways to manage",
        description: "Spreadsheet view is for capacity planning — who has room this week. Board view is for task management — drag cards to reassign or reschedule individual tasks.",
        side: "bottom" as const,
        align: "end" as const,
      },
    },
  ];

  const boardSteps = [
    {
      element: ".workload-board-toolbar",
      popover: {
        title: "Capacity at a glance",
        description: "Green = member has capacity. Orange = near limit. Red = overloaded. Use this to decide where to move tasks before dragging.",
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
        description: "Drag a card to another column to reassign the task. Use 'Move to' on the card to change the due date without opening the full task.",
        side: "right" as const,
        align: "start" as const,
      },
    },
  ];

  const steps = isBoard ? boardSteps : gridSteps;

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
      onDone();
    },
  });

  driverObj.drive();
}
