import React from "react";
import { Button, Badge } from "react-bootstrap";
import { ListTodo } from "lucide-react";
import type { NextRouter } from "next/router";
import {
  getExtensionDisplay,
} from "@components/planner/plannerTaskDetail/plannerTaskDetailDomain";
import type { PlannerTaskDetailApiTask } from "@components/planner/plannerTaskDetail/plannerTaskDetailDomain";
import "./plannerTaskDetail.scss";

export type PlannerTaskDetailAssigneesBlockProps = Readonly<{
  task: PlannerTaskDetailApiTask;
  hierarchyDataExtensions: unknown;
}>;

export function PlannerTaskDetailAssigneesBlock({
  task,
  hierarchyDataExtensions,
}: PlannerTaskDetailAssigneesBlockProps) {
  const assignees = Array.isArray(task.assignees)
    ? (task.assignees as Array<{ id?: number | null; extension_number?: string }>)
    : [];

  return (
    <div className="p-3 bg-light rounded border mb-3">
      <div className="small text-muted text-uppercase fw-semibold mb-2">Assignees</div>
      <div className="d-flex flex-column gap-2">
        {assignees.length === 0 ? (
          <span className="text-muted ptd-muted-value">—</span>
        ) : (
          assignees.map((assignee: { id?: number | null; extension_number?: string }) => {
            const extNumber = assignee.extension_number || "";
            const { name } = getExtensionDisplay(extNumber, hierarchyDataExtensions);
            const assigneeKey =
              assignee.id === undefined || assignee.id === null
                ? `assignee-ext-${extNumber || "unknown"}`
                : `assignee-${assignee.id}`;
            return (
              <span key={assigneeKey} className="ptd-entity-line">
                {name}
              </span>
            );
          })
        )}
      </div>
    </div>
  );
}

export type PlannerTaskDetailWatchersBlockProps = Readonly<{
  watchers: unknown[];
  hierarchyDataExtensions: unknown;
}>;

export function PlannerTaskDetailWatchersBlock({
  watchers,
  hierarchyDataExtensions,
}: PlannerTaskDetailWatchersBlockProps) {
  if (watchers.length === 0) return null;

  return (
    <div className="p-3 bg-light rounded border mb-3">
      <div className="small text-muted text-uppercase fw-semibold mb-2">Watchers</div>
      <div className="d-flex flex-column gap-2">
        {watchers.map((watcher: unknown, idx: number) => {
          const extStr =
            typeof watcher === "string" || typeof watcher === "number"
              ? String(watcher)
              : String((watcher as { extension_number?: string }).extension_number ?? "");
          const { name } = getExtensionDisplay(extStr, hierarchyDataExtensions);
          const w = watcher as { id?: number | null };
          const watcherKey =
            w.id === undefined || w.id === null
              ? `watcher-${extStr || "idx"}-${idx}`
              : `watcher-${w.id}`;
          return (
            <span key={watcherKey} className="ptd-entity-line">
              {name}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export type PlannerTaskDetailProjectBlockProps = Readonly<{
  projectName: string;
}>;

export function PlannerTaskDetailProjectBlock({ projectName }: PlannerTaskDetailProjectBlockProps) {
  return (
    <div className="p-3 bg-light rounded border mb-3">
      <div className="small text-muted text-uppercase fw-semibold mb-1">Project</div>
      <span>{projectName}</span>
    </div>
  );
}

export type PlannerTaskDetailParentBlockProps = Readonly<{
  parent: { id?: number; title?: string; reference?: string };
  router: NextRouter;
}>;

export function PlannerTaskDetailParentBlock({ parent, router }: PlannerTaskDetailParentBlockProps) {
  if (parent?.id == null) return null;

  return (
    <div className="p-3 bg-light rounded border mb-3">
      <div className="small text-muted text-uppercase fw-semibold mb-1">Parent task</div>
      <Button
        variant="link"
        className="p-0 d-inline-flex align-items-center gap-1"
        onClick={() => {
          router.push(`/planner/tasks/${String(parent.id)}`).catch(() => undefined);
        }}
      >
        <ListTodo size={16} className="text-muted" />
        {parent.title || parent.reference || `Task #${parent.id}`}
      </Button>
    </div>
  );
}

export type PlannerTaskDetailLabelsBlockProps = Readonly<{
  labels: Array<{ id?: number; name?: string; color?: string }>;
}>;

export function PlannerTaskDetailLabelsBlock({ labels }: PlannerTaskDetailLabelsBlockProps) {
  if (!Array.isArray(labels) || labels.length === 0) return null;

  return (
    <div className="p-3 bg-light rounded border mb-3">
      <div className="small text-muted text-uppercase fw-semibold mb-2">Labels</div>
      <div className="d-flex flex-wrap gap-2">
        {labels.map((label, idx: number) => {
          const labelKey = label.id == null ? `label-idx-${idx}` : `label-${label.id}`;
          const bg = label.color || "#94a3b8";
          return (
            <Badge
              key={labelKey}
              className="px-2 py-1 ptd-label-badge"
              style={{ ["--ptd-label-bg" as string]: bg } as React.CSSProperties}
            >
              {label.name ?? "Label"}
            </Badge>
          );
        })}
      </div>
    </div>
  );
}

export type PlannerTaskDetailSubtasksBlockProps = Readonly<{
  childrenTasks: Array<{ id?: number; title?: string; reference?: string }>;
  router: NextRouter;
}>;

export function PlannerTaskDetailSubtasksBlock({
  childrenTasks,
  router,
}: PlannerTaskDetailSubtasksBlockProps) {
  if (!Array.isArray(childrenTasks) || childrenTasks.length === 0) return null;

  const filtered = childrenTasks.filter(
    (child): child is { id: number; title?: string; reference?: string } => child.id != null,
  );

  return (
    <div className="p-3 bg-light rounded border mb-3">
      <div className="small text-muted text-uppercase fw-semibold mb-2">Subtasks</div>
      <ul className="list-unstyled mb-0">
        {filtered.map((child, idx: number) => {
          const childKey = `child-${child.id}-${idx}`;
          return (
            <li key={childKey} className="mb-1">
              <Button
                variant="link"
                className="p-0"
                onClick={() => {
                  router.push(`/planner/tasks/${String(child.id)}`).catch(() => undefined);
                }}
              >
                {child.title || child.reference || `Task #${child.id}`}
              </Button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export type PlannerTaskDetailDescriptionBlockProps = Readonly<{
  descriptionHtml: string;
}>;

export function PlannerTaskDetailDescriptionBlock({
  descriptionHtml,
}: PlannerTaskDetailDescriptionBlockProps) {
  return (
    <div className="p-3 bg-light rounded border mb-3">
      <div className="small text-muted text-uppercase fw-semibold mb-2">Description</div>
      <div
        className="task-description-html ptd-description-html"
        dangerouslySetInnerHTML={{
          __html: descriptionHtml.trim() || '<span class="text-muted">No description provided</span>',
        }}
      />
    </div>
  );
}
