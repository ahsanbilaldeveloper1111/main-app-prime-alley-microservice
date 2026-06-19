/**
 * Types for embedded planner task detail offcanvas (project list / kanban).
 */

import type { Dispatch, SetStateAction } from "react";
import type { TaskCommentRow } from "@components/planner/plannerTaskDetail/PlannerTaskCommentsTabPanel";
import type { TaskDocumentRow } from "@components/planner/plannerTaskDetail/PlannerTaskDocumentsTabPanel";
import type { PlannerTaskActivityRow } from "@components/planner/plannerTaskDetail/usePlannerTaskActivitiesPreview";

export interface TaskDetailRawData {
  id?: string | number;
  description?: string;
  assignees?: TaskDetailAssignee[];
  watchers?: TaskDetailWatcher[];
  watcher_numbers?: string[];
}

export interface TaskDetailTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  project: string;
  dueDate?: string;
  description?: string;
  rawData?: TaskDetailRawData;
}

export interface HierarchyExtension {
  id?: string;
  extension_number?: string;
  name?: string;
}

export interface TaskDetailAssignee {
  id?: string | number;
  extension_number?: string;
}

export interface TaskDetailWatcher {
  extension_number?: string;
}

/** Activity row shape (alias of shared planner activity row). */
export type TaskActivityItem = PlannerTaskActivityRow;

export type TaskCommentItem = TaskCommentRow;

export type TaskDocumentItem = TaskDocumentRow;

export interface TaskDetailOffcanvasProps {
  show: boolean;
  onHide: () => void;
  selectedTask: TaskDetailTask | null;
  taskActivities: TaskActivityItem[];
  loadingActivities: boolean;
  activeDetailTab: "activity" | "comments" | "documents";
  setActiveDetailTab: (tab: "activity" | "comments" | "documents") => void;
  taskComments: TaskCommentItem[];
  setTaskComments: Dispatch<SetStateAction<TaskCommentItem[]>>;
  loadingComments: boolean;
  setLoadingComments: Dispatch<SetStateAction<boolean>>;
  newComment: string;
  setNewComment: Dispatch<SetStateAction<string>>;
  submittingComment: boolean;
  setSubmittingComment: Dispatch<SetStateAction<boolean>>;
  editingCommentId: number | null;
  setEditingCommentId: Dispatch<SetStateAction<number | null>>;
  editingCommentText: string;
  setEditingCommentText: Dispatch<SetStateAction<string>>;
  onEditTask: () => void;
  onOpenDeleteModal: () => void;
  hierarchyDataExtensions?: HierarchyExtension[];
  getStatusVariant: (status: string) => string;
  getPriorityVariant: (priority: string) => string;
  /** Project record used for admin/member permission checks (falls back to task.project on rawData). */
  projectContext?: unknown;
}
