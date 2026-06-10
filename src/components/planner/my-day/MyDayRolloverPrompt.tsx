import React, { useMemo } from "react";
import ReactDOM from "react-dom";
import moment from "moment";
import { Check } from "lucide-react";
import {
  formatRolloverPromptHeading,
  formatRolloverPromptSubtext,
  readRolloverTaskIsPostponed,
  toMinutesDisplay,
} from "@page-modules/planner/my-day/myDayDomain";
import "@assets/scss/my-day-rollover-modal.scss";

type RolloverTask = Readonly<{
  id: number;
  title: string;
  priority: string;
  estimateMinutes: number;
  projectName: string;
  showIgnoredFlag: boolean;
  raw: Record<string, unknown>;
}>;

type MyDayRolloverPromptProps = Readonly<{
  show: boolean;
  tasks: readonly RolloverTask[];
  selectedTaskIds: readonly number[];
  onToggleTask: (taskId: number) => void;
  onAddToday: () => void;
  onScheduleLater: () => void;
  onDismiss: () => void;
}>;

function resolvePriorityKey(priority: string): string {
  return priority.toLowerCase().replace(/\s+/g, "-");
}

function MyDayRolloverTaskRow({
  task,
  selected,
  onToggle,
}: Readonly<{
  task: RolloverTask;
  selected: boolean;
  onToggle: () => void;
}>) {
  const priorityKey = resolvePriorityKey(task.priority);
  const showPostponed = readRolloverTaskIsPostponed(task.raw);
  const durationLabel =
    task.estimateMinutes > 0 ? toMinutesDisplay(task.estimateMinutes) : "--";

  return (
    <button
      type="button"
      className={`myday-rollover-modal__task ${selected ? "is-selected" : ""}`}
      onClick={onToggle}
      aria-pressed={selected}
    >
      <span className="myday-rollover-modal__task-check" aria-hidden>
        {selected ? <Check size={14} strokeWidth={3} /> : null}
      </span>
      <div className="myday-rollover-modal__task-body">
        <div className="myday-rollover-modal__task-title">{task.title}</div>
        <div className="myday-rollover-modal__task-tags">
          <span className="myday-rollover-modal__tag myday-rollover-modal__tag--project">
            {task.projectName}
          </span>
          <span
            className={`myday-rollover-modal__tag myday-rollover-modal__tag--priority priority-${priorityKey}`}
          >
            {task.priority}
          </span>
          {showPostponed ? (
            <span className="myday-rollover-modal__tag myday-rollover-modal__tag--postponed">
              Postponed
            </span>
          ) : null}
          {task.showIgnoredFlag ? (
            <span className="myday-rollover-modal__tag myday-rollover-modal__tag--ignored">
              3x Ignored
            </span>
          ) : null}
        </div>
      </div>
      <div className="myday-rollover-modal__task-duration">{durationLabel}</div>
    </button>
  );
}

export function MyDayRolloverPrompt({
  show,
  tasks,
  selectedTaskIds,
  onToggleTask,
  onAddToday,
  onScheduleLater,
  onDismiss,
}: MyDayRolloverPromptProps) {
  const heading = useMemo(() => formatRolloverPromptHeading(tasks.length), [tasks.length]);
  const subtext = useMemo(() => formatRolloverPromptSubtext(), []);
  const selectedSet = useMemo(() => new Set(selectedTaskIds), [selectedTaskIds]);
  const hasSelection = selectedTaskIds.length > 0;

  if (!show || tasks.length === 0 || globalThis.document === undefined) {
    return null;
  }

  const modal = (
    <dialog className="myday-rollover-modal" open aria-labelledby="myday-rollover-heading">
      <button
        type="button"
        className="myday-rollover-modal__backdrop"
        aria-label="Dismiss rollover prompt"
        onClick={onDismiss}
      />
      <div className="myday-rollover-modal__card">
        <p className="myday-rollover-modal__eyebrow">Good morning</p>
        <h2 id="myday-rollover-heading" className="myday-rollover-modal__heading">
          {heading}
        </h2>
        <p className="myday-rollover-modal__subtext">{subtext}</p>

        <div className="myday-rollover-modal__tasks">
          {tasks.map((task) => (
            <MyDayRolloverTaskRow
              key={task.id}
              task={task}
              selected={selectedSet.has(task.id)}
              onToggle={() => onToggleTask(task.id)}
            />
          ))}
        </div>

        <div className="myday-rollover-modal__actions">
          <button
            type="button"
            className="myday-rollover-modal__btn-primary"
            onClick={onAddToday}
            disabled={!hasSelection}
          >
            Add to Today
          </button>
          <button
            type="button"
            className="myday-rollover-modal__btn-secondary"
            onClick={onScheduleLater}
            disabled={!hasSelection}
          >
            Schedule Later
          </button>
        </div>

        <button type="button" className="myday-rollover-modal__dismiss" onClick={onDismiss}>
          Dismiss
        </button>
      </div>
    </dialog>
  );

  return ReactDOM.createPortal(modal, document.body);
}

export function openMyDayRolloverScheduleModal(
  setScheduleLaterDate: (value: string) => void,
  setShowScheduleLaterModal: (value: boolean) => void,
): void {
  setScheduleLaterDate(moment().add(1, "day").format("YYYY-MM-DD"));
  setShowScheduleLaterModal(true);
}
