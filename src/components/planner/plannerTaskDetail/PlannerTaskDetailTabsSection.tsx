import React from "react";
import { Nav } from "react-bootstrap";
import { PlannerTaskActivityTabPanel } from "./PlannerTaskActivityTabPanel";
import { PlannerTaskCommentsTabPanel } from "./PlannerTaskCommentsTabPanel";
import {
  PlannerTaskDocumentsTabPanel,
  type TaskDocumentRow,
} from "./PlannerTaskDocumentsTabPanel";
import type { PlannerTaskActivityRow } from "./usePlannerTaskActivitiesPreview";
import type { TaskCommentRow } from "./PlannerTaskCommentsTabPanel";
import "./plannerTaskDetail.scss";

export type PlannerTaskDetailTabsSectionProps = Readonly<{
  activeDetailTab: "activity" | "comments" | "documents";
  setActiveDetailTab: React.Dispatch<
    React.SetStateAction<"activity" | "comments" | "documents">
  >;
  handleCommentsTabClick: () => void | Promise<void>;
  handleDocumentsTabClick: () => void | Promise<void>;
  taskCommentsCount: number;
  loadingActivities: boolean;
  taskActivities: PlannerTaskActivityRow[];
  onViewAllActivities: () => void | Promise<void>;
  hierarchyDataExtensions: unknown;
  taskId: number | string | undefined;
  loadingComments: boolean;
  taskComments: TaskCommentRow[];
  setTaskComments: React.Dispatch<React.SetStateAction<TaskCommentRow[]>>;
  editingCommentId: number | null;
  setEditingCommentId: React.Dispatch<React.SetStateAction<number | null>>;
  editingCommentText: string;
  setEditingCommentText: React.Dispatch<React.SetStateAction<string>>;
  newComment: string;
  setNewComment: React.Dispatch<React.SetStateAction<string>>;
  submittingComment: boolean;
  setSubmittingComment: React.Dispatch<React.SetStateAction<boolean>>;
  loadingDocuments: boolean;
  taskDocuments: TaskDocumentRow[];
  uploadingDocument: boolean;
  documentInputRef: React.RefObject<HTMLInputElement | null>;
  onUploadChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUploadClick: () => void;
  onDownloadDocument: (doc: TaskDocumentRow) => void;
  onDeleteDocument: (doc: TaskDocumentRow) => void;
}>;

export function PlannerTaskDetailTabsSection(props: PlannerTaskDetailTabsSectionProps) {
  const {
    activeDetailTab,
    setActiveDetailTab,
    handleCommentsTabClick,
    handleDocumentsTabClick,
    taskCommentsCount,
    loadingActivities,
    taskActivities,
    onViewAllActivities,
    hierarchyDataExtensions,
    taskId,
    loadingComments,
    taskComments,
    setTaskComments,
    editingCommentId,
    setEditingCommentId,
    editingCommentText,
    setEditingCommentText,
    newComment,
    setNewComment,
    submittingComment,
    setSubmittingComment,
    loadingDocuments,
    taskDocuments,
    uploadingDocument,
    documentInputRef,
    onUploadChange,
    onUploadClick,
    onDownloadDocument,
    onDeleteDocument,
  } = props;

  return (
    <>
      <Nav variant="tabs" className="mb-3 border-bottom">
        <Nav.Item>
          <Nav.Link
            active={activeDetailTab === "activity"}
            onClick={() => setActiveDetailTab("activity")}
            className="ptd-nav-link-tab"
          >
            Recent Activity
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link
            active={activeDetailTab === "comments"}
            onClick={() => void handleCommentsTabClick()}
            className="ptd-nav-link-tab"
          >
            Comments {taskCommentsCount > 0 && `(${taskCommentsCount})`}
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link
            active={activeDetailTab === "documents"}
            onClick={() => void handleDocumentsTabClick()}
            className="ptd-nav-link-tab"
          >
            Documents
          </Nav.Link>
        </Nav.Item>
      </Nav>

      {activeDetailTab === "activity" && (
        <div className="p-3 border rounded bg-white">
          <PlannerTaskActivityTabPanel
            loadingActivities={loadingActivities}
            taskActivities={taskActivities}
            onViewAll={() => void onViewAllActivities()}
            hierarchyDataExtensions={hierarchyDataExtensions}
          />
        </div>
      )}

      {activeDetailTab === "comments" && (
        <div className="p-3 border rounded bg-white">
          <PlannerTaskCommentsTabPanel
            taskId={taskId}
            loadingComments={loadingComments}
            taskComments={taskComments}
            setTaskComments={setTaskComments}
            editingCommentId={editingCommentId}
            setEditingCommentId={setEditingCommentId}
            editingCommentText={editingCommentText}
            setEditingCommentText={setEditingCommentText}
            newComment={newComment}
            setNewComment={setNewComment}
            submittingComment={submittingComment}
            setSubmittingComment={setSubmittingComment}
            hierarchyDataExtensions={hierarchyDataExtensions}
          />
        </div>
      )}

      {activeDetailTab === "documents" && (
        <div className="p-3 border rounded bg-white">
          <PlannerTaskDocumentsTabPanel
            loadingDocuments={loadingDocuments}
            taskDocuments={taskDocuments}
            uploadingDocument={uploadingDocument}
            documentInputRef={documentInputRef}
            onUploadChange={onUploadChange}
            onUploadClick={onUploadClick}
            onDownload={onDownloadDocument}
            onDelete={onDeleteDocument}
          />
        </div>
      )}
    </>
  );
}
