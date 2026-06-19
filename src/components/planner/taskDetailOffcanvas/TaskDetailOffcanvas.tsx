import React, { useCallback, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { getSessionPhoneOrExtension } from "@planner/projectMemberRole";
import { Button, Modal, Nav, Offcanvas } from "react-bootstrap";
import { PlannerAddToMyDayEstimateModal } from "@components/planner/plannerTasksListing/PlannerAddToMyDayEstimateModal";
import { PlannerAddToMyDayHeaderButton } from "@components/planner/plannerTasksListing/PlannerAddToMyDayHeaderButton";
import { toPlannerAddToMyDayTarget } from "@components/planner/plannerTasksListing/plannerTasksListingMyDay";
import { usePlannerAddToMyDay } from "@components/planner/plannerTasksListing/usePlannerAddToMyDay";
import { Edit, Trash2 } from "lucide-react";
import {
  getTaskActivities,
  getTaskComments,
  getTaskDocumentDownload,
  getTaskDocuments,
  postTaskDocuments,
  deleteTaskDocument,
} from "@utils/tasks";
import { usePermissions } from "@utils/permissionUtils";
import { HEADER_CONSTANTS } from "@constants/headerConstants";
import { resolvePlannerTaskRowPermissionsWithSession } from "@planner/taskRowPermissions";
import { normalizeTaskCommentsResponse } from "@components/planner/plannerTaskDetail/plannerTaskDetailDomain";
import { PlannerTaskActivityTabPanel } from "@components/planner/plannerTaskDetail/PlannerTaskActivityTabPanel";
import { PlannerTaskCommentsTabPanel } from "@components/planner/plannerTaskDetail/PlannerTaskCommentsTabPanel";
import { PlannerTaskDocumentsTabPanel } from "@components/planner/plannerTaskDetail/PlannerTaskDocumentsTabPanel";
import { PlannerTaskAllActivitiesModalBody } from "@components/planner/plannerTaskDetail/PlannerTaskAllActivitiesModalBody";
import type { TaskActivityItem, TaskDetailOffcanvasProps, TaskDocumentItem } from "./taskDetailOffcanvasTypes";
import { formatOffcanvasActivityDate, resolveOffcanvasWatchers } from "./taskDetailOffcanvasDomain";
import { TaskDetailOffcanvasSummary } from "./TaskDetailOffcanvasSummary";
import "./taskDetailOffcanvas.scss";

const { PERMISSIONS } = HEADER_CONSTANTS;

const TaskDetailOffcanvas: React.FC<TaskDetailOffcanvasProps> = ({
  show,
  onHide,
  selectedTask,
  taskActivities,
  loadingActivities,
  activeDetailTab,
  setActiveDetailTab,
  taskComments,
  setTaskComments,
  loadingComments,
  setLoadingComments,
  newComment,
  setNewComment,
  submittingComment,
  setSubmittingComment,
  editingCommentId,
  setEditingCommentId,
  editingCommentText,
  setEditingCommentText,
  onEditTask,
  onOpenDeleteModal,
  hierarchyDataExtensions,
  getStatusVariant,
  getPriorityVariant,
  projectContext,
}) => {
  const { data: session } = useSession();
  const { hasPermission } = usePermissions();
  const extensionNumber = useMemo(() => getSessionPhoneOrExtension(session), [session]);
  const canEditPlannerTask = hasPermission(PERMISSIONS.EDIT_TASKS_WORK_PLANNER);
  const canDeletePlannerTask = hasPermission(PERMISSIONS.DELETE_TASKS_WORK_PLANNER);
  const canUseMyDay = hasPermission(PERMISSIONS.VIEW_MY_DAY_TASKS_WORK_PLANNER);

  const taskDetailPermissions = useMemo(() => {
    if (!selectedTask?.rawData) {
      return resolvePlannerTaskRowPermissionsWithSession(null, null, extensionNumber, {
        canUpdateTask: canEditPlannerTask,
        canDeleteTask: canDeletePlannerTask,
      });
    }
    const raw = selectedTask.rawData as Record<string, unknown>;
    const project = projectContext ?? raw.project ?? null;
    return resolvePlannerTaskRowPermissionsWithSession(raw, project, extensionNumber, {
      canUpdateTask: canEditPlannerTask,
      canDeleteTask: canDeletePlannerTask,
    });
  }, [
    selectedTask?.rawData,
    projectContext,
    extensionNumber,
    canEditPlannerTask,
    canDeletePlannerTask,
  ]);

  const canMutateTask = taskDetailPermissions.canOpenTaskEdit;

  const addToMyDayTarget = useMemo(() => {
    if (!selectedTask?.rawData?.id) return null;
    const rawId = selectedTask.rawData.id;
    const id = typeof rawId === "number" ? rawId : Number(rawId);
    if (!Number.isFinite(id) || id <= 0) return null;
    return toPlannerAddToMyDayTarget(id, selectedTask.title, selectedTask.rawData);
  }, [selectedTask]);

  const {
    pendingTask: addToMyDayPendingTask,
    estimateInput: addToMyDayEstimateInput,
    setEstimateInput: setAddToMyDayEstimateInput,
    closeEstimateModal: closeAddToMyDayEstimateModal,
    requestAddTaskToMyDay,
    skipEstimateAndAdd: skipAddToMyDayEstimate,
    confirmEstimateAndAdd: confirmAddToMyDayEstimate,
    canAddTaskToMyDay,
    isTaskInMyDay,
  } = usePlannerAddToMyDay({ canUseMyDay, extensionNumber });

  const [showAllActivitiesModal, setShowAllActivitiesModal] = useState(false);
  const [allActivities, setAllActivities] = useState<TaskActivityItem[]>([]);
  const [loadingAllActivities, setLoadingAllActivities] = useState(false);
  const [taskDocuments, setTaskDocuments] = useState<TaskDocumentItem[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const documentInputRef = useRef<HTMLInputElement>(null);

  const closeAllActivitiesModal = useCallback(() => {
    setShowAllActivitiesModal(false);
    setAllActivities([]);
  }, []);

  const handleViewAllActivities = async () => {
    if (!selectedTask?.rawData?.id) return;
    try {
      setLoadingAllActivities(true);
      setShowAllActivitiesModal(true);
      const activitiesResponse = await getTaskActivities(selectedTask.rawData.id, 1, 100);
      if (activitiesResponse) {
        setAllActivities(Array.isArray(activitiesResponse) ? activitiesResponse : []);
      } else {
        setAllActivities([]);
      }
    } catch (error) {
      console.error("Error fetching all activities:", error);
      setAllActivities([]);
    } finally {
      setLoadingAllActivities(false);
    }
  };

  const handleCommentsTabClick = async () => {
    setActiveDetailTab("comments");
    if (selectedTask?.rawData?.id && taskComments.length === 0) {
      try {
        setLoadingComments(true);
        const commentsResponse = await getTaskComments(selectedTask.rawData.id);
        setTaskComments(normalizeTaskCommentsResponse(commentsResponse));
      } catch (error) {
        console.error("Error fetching comments:", error);
        setTaskComments([]);
      } finally {
        setLoadingComments(false);
      }
    }
  };

  const fetchTaskDocuments = useCallback(async () => {
    if (!selectedTask?.rawData?.id) return;
    try {
      setLoadingDocuments(true);
      const data = await getTaskDocuments(selectedTask.rawData.id);
      setTaskDocuments(Array.isArray(data) ? data : data?.data ?? []);
    } catch (error) {
      console.error("Error fetching task documents:", error);
      setTaskDocuments([]);
    } finally {
      setLoadingDocuments(false);
    }
  }, [selectedTask?.rawData?.id]);

  const handleDocumentsTabClick = async () => {
    setActiveDetailTab("documents");
    if (selectedTask?.rawData?.id) {
      await fetchTaskDocuments();
    }
  };

  const handleUploadDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canMutateTask) return;
    const files = e.target.files;
    if (!files?.length || !selectedTask?.rawData?.id) return;
    try {
      setUploadingDocument(true);
      const formData = new FormData();
      for (const file of Array.from(files)) {
        formData.append("documents[]", file);
      }
      await postTaskDocuments(selectedTask.rawData.id, formData);
      await fetchTaskDocuments();
      if (documentInputRef.current) documentInputRef.current.value = "";
    } catch (error) {
      console.error("Error uploading document:", error);
    } finally {
      setUploadingDocument(false);
    }
  };

  const handleDownloadDocument = async (doc: TaskDocumentItem) => {
    if (!selectedTask?.rawData?.id || doc.id === undefined || doc.id === "" || doc.id === null) return;
    const docId = doc.id;
    try {
      const blob = await getTaskDocumentDownload(selectedTask.rawData.id, docId);
      if (!blob) return;
      const url = globalThis.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.original_name || doc.name || doc.file_name || "document";
      a.click();
      globalThis.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading document:", error);
    }
  };

  const handleDeleteDocument = async (doc: TaskDocumentItem) => {
    if (!canMutateTask || !selectedTask?.rawData?.id || doc.id === undefined || doc.id === "" || doc.id === null) {
      return;
    }
    const docId = doc.id;
    try {
      await deleteTaskDocument(selectedTask.rawData.id, docId);
      await fetchTaskDocuments();
    } catch (error) {
      console.error("Error deleting document:", error);
    }
  };

  const watchersList = useMemo(() => resolveOffcanvasWatchers(selectedTask?.rawData), [selectedTask?.rawData]);

  return (
    <>
      <Offcanvas show={show} onHide={onHide} placement="end" className="task-detail-panel">
        <Offcanvas.Header closeButton className="task-detail-header d-flex align-items-center">
          <Offcanvas.Title className="d-flex align-items-center flex-grow-1 min-w-0 me-2">
            <span className="fw-bold">{selectedTask?.title} </span>
          </Offcanvas.Title>
          <div className="d-flex align-items-center gap-1 flex-shrink-0">
            <PlannerAddToMyDayHeaderButton
              show={canUseMyDay && addToMyDayTarget != null}
              canAdd={addToMyDayTarget != null && canAddTaskToMyDay(addToMyDayTarget)}
              alreadyInMyDay={addToMyDayTarget != null && isTaskInMyDay(addToMyDayTarget)}
              onClick={() => {
                if (addToMyDayTarget) requestAddTaskToMyDay(addToMyDayTarget);
              }}
            />
            {canMutateTask ? (
              <Button variant="link" className="text-primary p-0" onClick={onEditTask} title="Edit Task">
                <Edit size={20} />
              </Button>
            ) : null}
            {taskDetailPermissions.canDeleteTask ? (
              <Button
                variant="link"
                className="text-danger p-0"
                onClick={onOpenDeleteModal}
                title="Delete Task"
              >
                <Trash2 size={20} />
              </Button>
            ) : null}
          </div>
        </Offcanvas.Header>
        <Offcanvas.Body className="task-detail-body">
          {selectedTask ? (
            <>
              <TaskDetailOffcanvasSummary
                selectedTask={selectedTask}
                hierarchyDataExtensions={hierarchyDataExtensions}
                watchersList={watchersList}
                canEditPlannerTask={canMutateTask}
                onEditTask={onEditTask}
                getStatusVariant={getStatusVariant}
                getPriorityVariant={getPriorityVariant}
              />

              <Nav variant="tabs" className="detail-tabs">
                <Nav.Item>
                  <Nav.Link
                    className="p-2"
                    active={activeDetailTab === "activity"}
                    onClick={() => setActiveDetailTab("activity")}
                  >
                    Recent Activity
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link
                    className="p-2"
                    active={activeDetailTab === "comments"}
                    onClick={() => void handleCommentsTabClick()}
                  >
                    Comments {taskComments.length > 0 && `(${taskComments.length})`}
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link
                    className="p-2"
                    active={activeDetailTab === "documents"}
                    onClick={() => void handleDocumentsTabClick()}
                  >
                    Documents
                  </Nav.Link>
                </Nav.Item>
              </Nav>

              {activeDetailTab === "activity" && (
                <PlannerTaskActivityTabPanel
                  loadingActivities={loadingActivities}
                  taskActivities={taskActivities}
                  hierarchyDataExtensions={hierarchyDataExtensions}
                  onViewAll={() => void handleViewAllActivities()}
                  formatActivityDateFn={formatOffcanvasActivityDate}
                  sectionClassName="activity-section"
                />
              )}

              {activeDetailTab === "comments" && (
                <PlannerTaskCommentsTabPanel
                  loadingComments={loadingComments}
                  taskComments={taskComments}
                  hierarchyDataExtensions={hierarchyDataExtensions}
                  editingCommentId={editingCommentId}
                  editingCommentText={editingCommentText}
                  setEditingCommentText={setEditingCommentText}
                  setEditingCommentId={setEditingCommentId}
                  submittingComment={submittingComment}
                  setSubmittingComment={setSubmittingComment}
                  newComment={newComment}
                  setNewComment={setNewComment}
                  taskId={selectedTask.rawData?.id}
                  setTaskComments={setTaskComments}
                  allowMutations={canMutateTask}
                  formatCommentDateFn={formatOffcanvasActivityDate}
                  sectionClassName="activity-section"
                />
              )}

              {activeDetailTab === "documents" && (
                <PlannerTaskDocumentsTabPanel
                  loadingDocuments={loadingDocuments}
                  uploadingDocument={uploadingDocument}
                  taskDocuments={taskDocuments}
                  documentInputRef={documentInputRef}
                  onUploadChange={handleUploadDocument}
                  onUploadClick={() => documentInputRef.current?.click()}
                  onDownload={handleDownloadDocument}
                  onDelete={handleDeleteDocument}
                  allowMutations={canMutateTask}
                  sectionClassName="activity-section"
                />
              )}
            </>
          ) : null}
        </Offcanvas.Body>
      </Offcanvas>

      <Modal show={showAllActivitiesModal} onHide={closeAllActivitiesModal} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>All Activities</Modal.Title>
        </Modal.Header>
        <Modal.Body className="tdo-activities-modal-body">
          <PlannerTaskAllActivitiesModalBody
            loadingAllActivities={loadingAllActivities}
            allActivities={allActivities}
            hierarchyDataExtensions={hierarchyDataExtensions}
            formatActivityDateFn={formatOffcanvasActivityDate}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeAllActivitiesModal}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      <PlannerAddToMyDayEstimateModal
        show={addToMyDayPendingTask != null}
        taskTitle={addToMyDayPendingTask?.title ?? ""}
        estimateInput={addToMyDayEstimateInput}
        onEstimateInputChange={setAddToMyDayEstimateInput}
        onClose={closeAddToMyDayEstimateModal}
        onSkip={skipAddToMyDayEstimate}
        onConfirm={confirmAddToMyDayEstimate}
      />
    </>
  );
};

export default TaskDetailOffcanvas;
