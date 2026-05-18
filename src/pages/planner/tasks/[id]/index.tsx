import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  type ComponentProps,
  type ReactElement,
} from "react";
import { useSession } from "next-auth/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getSessionPhoneOrExtension } from "@planner/projectMemberRole";
import {
  applyPlannerTaskSessionCrud,
  computePlannerTaskRowPermissions,
} from "@planner/taskRowPermissions";
import { useRouter } from "next/router";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { Container, Card, Button, Spinner, Modal } from "react-bootstrap";
import { ArrowLeft, Edit, Trash2 } from "lucide-react";
import { PlannerAddToMyDayEstimateModal } from "@components/planner/plannerTasksListing/PlannerAddToMyDayEstimateModal";
import { PlannerAddToMyDayHeaderButton } from "@components/planner/plannerTasksListing/PlannerAddToMyDayHeaderButton";
import { toPlannerAddToMyDayTarget } from "@components/planner/plannerTasksListing/plannerTasksListingMyDay";
import { usePlannerAddToMyDay } from "@components/planner/plannerTasksListing/usePlannerAddToMyDay";
import {
  getTask,
  deleteTask,
  getTaskComments,
  getTaskDocuments,
  postTaskDocuments,
  getTaskDocumentDownload,
  deleteTaskDocument,
  getTaskActivities,
} from "@utils/tasks";
import { useHierarchyData } from "@components/filters/useHierarchyData";
import { ModuleSlug } from "@utils/Helper";
import CreateTaskSidebar from "@components/CreatePlannerTaskSidebar";
import DeleteConfirmationModal from "@components/page-partials/DeleteConfirmationModal";
import { toast } from "react-toastify";
import { usePermissions } from "@utils/permissionUtils";
import { HEADER_CONSTANTS } from "@constants/headerConstants";
import {
  PLANNER_TASK_DETAIL_WITH_RELATIONS,
  buildPlannerTaskDetailViewModel,
  plannerDetailScalarString,
  resolvePlannerTaskParentRef,
  type PlannerTaskDetailApiTask,
} from "@components/planner/plannerTaskDetail/plannerTaskDetailDomain";
import { usePlannerTaskActivitiesPreview } from "@components/planner/plannerTaskDetail/usePlannerTaskActivitiesPreview";
import { PlannerTaskRecurringSchedulePanel } from "@components/planner/plannerTaskDetail/PlannerTaskRecurringSchedulePanel";
import { PlannerTaskDetailSummaryGrid } from "@components/planner/plannerTaskDetail/PlannerTaskDetailSummaryGrid";
import {
  PlannerTaskDetailAssigneesBlock,
  PlannerTaskDetailWatchersBlock,
  PlannerTaskDetailProjectBlock,
  PlannerTaskDetailParentBlock,
  PlannerTaskDetailLabelsBlock,
  PlannerTaskDetailSubtasksBlock,
  PlannerTaskDetailDescriptionBlock,
} from "@components/planner/plannerTaskDetail/PlannerTaskDetailMetaBlocks";
import { PlannerTaskDetailTabsSection } from "@components/planner/plannerTaskDetail/PlannerTaskDetailTabsSection";
import { PlannerTaskAllActivitiesModalBody } from "@components/planner/plannerTaskDetail/PlannerTaskAllActivitiesModalBody";
import type { PlannerTaskActivityRow } from "@components/planner/plannerTaskDetail/usePlannerTaskActivitiesPreview";
import type { TaskCommentRow } from "@components/planner/plannerTaskDetail/PlannerTaskCommentsTabPanel";
import type { TaskDocumentRow } from "@components/planner/plannerTaskDetail/PlannerTaskDocumentsTabPanel";
import "@components/planner/plannerTaskDetail/plannerTaskDetail.scss";
import { plannerKeys } from "../../../../query/keys";

const { PERMISSIONS } = HEADER_CONSTANTS;

const TaskDetailPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const queryClient = useQueryClient();
  const taskIdStr = typeof id === "string" ? id : "";

  const {
    data: task,
    isPending: taskQueryPending,
    refetch: refetchTask,
  } = useQuery({
    queryKey: plannerKeys.tasks.detail(taskIdStr),
    queryFn: async () => {
      try {
        const data = await getTask(taskIdStr, [...PLANNER_TASK_DETAIL_WITH_RELATIONS]);
        return (data ?? null) as PlannerTaskDetailApiTask | null;
      } catch (err) {
        console.error("Error fetching task:", err);
        return null;
      }
    },
    enabled: router.isReady && taskIdStr.length > 0,
  });

  const loading = !router.isReady || (taskIdStr.length > 0 && taskQueryPending);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { taskActivities, loadingActivities } = usePlannerTaskActivitiesPreview(task?.id);
  const [activeDetailTab, setActiveDetailTab] = useState<"activity" | "comments" | "documents">(
    "activity",
  );
  const [taskComments, setTaskComments] = useState<TaskCommentRow[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  const [taskDocuments, setTaskDocuments] = useState<TaskDocumentRow[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [showAllActivitiesModal, setShowAllActivitiesModal] = useState(false);
  const [allActivities, setAllActivities] = useState<PlannerTaskActivityRow[]>([]);
  const [loadingAllActivities, setLoadingAllActivities] = useState(false);
  const documentInputRef = useRef<HTMLInputElement>(null);

  const { hierarchyDataExtensions } = useHierarchyData(ModuleSlug.WORK_PLANNER);

  const sidebarProjectFromTask = useMemo(() => {
    const p = task?.project;
    if (p == null || typeof p !== "object" || (p as { id?: unknown }).id == null) return undefined;
    const po = p as {
      id: unknown;
      name?: unknown;
      color?: unknown;
      statuses?: unknown[];
      labels?: unknown[];
    };
    return {
      id: Number(po.id),
      name: plannerDetailScalarString(po.name) || "",
      icon: "",
      color: typeof po.color === "string" && po.color ? po.color : "#3b82f6",
      statuses: Array.isArray(po.statuses) ? po.statuses : undefined,
      labels: Array.isArray(po.labels) ? po.labels : undefined,
    };
  }, [task?.project]);

  const { data: session } = useSession();
  const { hasPermission } = usePermissions();
  const sessionUserPhoneOrExtension = useMemo(
    () => getSessionPhoneOrExtension(session),
    [session],
  );
  const sessionCanUpdatePlannerTask = useMemo(
    () => hasPermission(PERMISSIONS.EDIT_TASKS_WORK_PLANNER),
    [hasPermission],
  );
  const sessionCanDeletePlannerTask = useMemo(
    () => hasPermission(PERMISSIONS.DELETE_TASKS_WORK_PLANNER),
    [hasPermission],
  );
  const sessionCanUseMyDay = useMemo(
    () => hasPermission(PERMISSIONS.VIEW_MY_DAY_TASKS_WORK_PLANNER),
    [hasPermission],
  );

  const addToMyDayTarget = useMemo(() => {
    if (task?.id == null) return null;
    return toPlannerAddToMyDayTarget(
      task.id,
      plannerDetailScalarString(task.title),
      task,
    );
  }, [task]);

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
  } = usePlannerAddToMyDay({
    canUseMyDay: sessionCanUseMyDay,
    extensionNumber: sessionUserPhoneOrExtension,
    onAdded: () => {
      refetchTask().catch(() => undefined);
    },
  });

  const taskDetailPermissions = useMemo(
    () =>
      applyPlannerTaskSessionCrud(
        computePlannerTaskRowPermissions(
          task ?? null,
          task?.project ?? null,
          sessionUserPhoneOrExtension,
        ),
        {
          canUpdateTask: sessionCanUpdatePlannerTask,
          canDeleteTask: sessionCanDeletePlannerTask,
        },
      ),
    [task, sessionUserPhoneOrExtension, sessionCanUpdatePlannerTask, sessionCanDeletePlannerTask],
  );

  const handleDelete = async () => {
    if (!task?.id) return;
    if (!taskDetailPermissions.canDeleteTask) {
      toast.error("You cannot delete this task");
      return;
    }
    try {
      setDeleting(true);
      await deleteTask(task.id);
      queryClient.invalidateQueries({ queryKey: plannerKeys.tasks.all() });
      setShowDeleteModal(false);
      await router.push("/planner/tasks");
    } catch (err) {
      console.error("Error deleting task:", err);
      toast.error("Failed to delete task");
    } finally {
      setDeleting(false);
    }
  };

  const handleCommentsTabClick = async () => {
    setActiveDetailTab("comments");
    if (task?.id && taskComments.length === 0) {
      try {
        setLoadingComments(true);
        const commentsResponse = await getTaskComments(task.id);
        if (commentsResponse && Array.isArray(commentsResponse)) {
          setTaskComments(commentsResponse as TaskCommentRow[]);
        } else {
          setTaskComments([]);
        }
      } catch (err) {
        console.error("Error loading task comments:", err);
        setTaskComments([]);
      } finally {
        setLoadingComments(false);
      }
    }
  };

  const fetchTaskDocuments = useCallback(async () => {
    if (!task?.id) return;
    try {
      setLoadingDocuments(true);
      const data = await getTaskDocuments(task.id);
      const list = Array.isArray(data) ? data : (data as { data?: TaskDocumentRow[] })?.data ?? [];
      setTaskDocuments(list);
    } catch (err) {
      console.error("Error loading task documents:", err);
      setTaskDocuments([]);
    } finally {
      setLoadingDocuments(false);
    }
  }, [task?.id]);

  const handleDocumentsTabClick = async () => {
    setActiveDetailTab("documents");
    if (task?.id) await fetchTaskDocuments();
  };

  const handleUploadDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length || !task?.id) return;
    try {
      setUploadingDocument(true);
      const formData = new FormData();
      for (const file of Array.from(files)) {
        formData.append("documents[]", file);
      }
      await postTaskDocuments(task.id, formData);
      await fetchTaskDocuments();
      if (documentInputRef.current) documentInputRef.current.value = "";
    } catch (err) {
      console.error("Error uploading document:", err);
    } finally {
      setUploadingDocument(false);
    }
  };

  const handleDownloadDocument = async (doc: TaskDocumentRow) => {
    if (!task?.id || !doc?.id) return;
    try {
      const blob = await getTaskDocumentDownload(task.id, doc.id);
      if (!blob) return;
      const url = globalThis.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.original_name || doc.name || doc.file_name || "document";
      a.click();
      globalThis.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading document:", err);
    }
  };

  const handleDeleteDocument = async (doc: TaskDocumentRow) => {
    if (!task?.id || !doc?.id) return;
    try {
      await deleteTaskDocument(task.id, doc.id);
      await fetchTaskDocuments();
    } catch (err) {
      console.error("Error deleting document:", err);
    }
  };

  const handleViewAllActivities = async () => {
    if (!task?.id) return;
    try {
      setLoadingAllActivities(true);
      setShowAllActivitiesModal(true);
      const activitiesResponse = await getTaskActivities(task.id, 1, 100);
      setAllActivities(Array.isArray(activitiesResponse) ? activitiesResponse : []);
    } catch (err) {
      console.error("Error loading all activities:", err);
      setAllActivities([]);
    } finally {
      setLoadingAllActivities(false);
    }
  };

  if (loading && !task) {
    return (
      <>
        <BreadcrumbItem mainTitle="Tasks" mainLink="/planner/tasks" subTitle="Task" />
        <Container className="py-5 text-center">
          <Spinner animation="border" />
          <p className="mt-2 text-muted">Loading task…</p>
        </Container>
      </>
    );
  }

  if (!task) {
    return (
      <>
        <BreadcrumbItem mainTitle="Tasks" mainLink="/planner/tasks" subTitle="Task" />
        <Container className="py-5">
          <Card>
            <Card.Body className="text-center py-5">
              <p className="text-muted mb-3">Task not found.</p>
              <Button
                variant="primary"
                onClick={() => {
                  router.push("/planner/tasks").catch((err) => {
                    console.error("[TaskDetailPage] navigation to /planner/tasks failed", err);
                  });
                }}
              >
                Back to Tasks
              </Button>
            </Card.Body>
          </Card>
        </Container>
      </>
    );
  }

  const viewModel = buildPlannerTaskDetailViewModel(task);
  const {
    taskId,
    projectName,
    watchers,
    taskRecord,
    detailTaskKind,
    showRecurringBlock,
    endDateDisplay,
    lastRunAt,
    nextRunAt,
  } = viewModel;

  const title = plannerDetailScalarString(task.title) || "Untitled Task";
  const description = plannerDetailScalarString(task.description);
  const labels = task.labels as Array<{ id?: number; name?: string; color?: string }> | undefined;
  const childrenTasks = task.children as Array<{
    id?: number;
    title?: string;
    reference?: string;
  }> | undefined;
  const parentTask = resolvePlannerTaskParentRef(task.parent);

  return (
    <>
      <BreadcrumbItem mainTitle="Tasks" mainLink="/planner/tasks" subTitle={`Task ${taskId}`} />

      <Container className="py-4">
        <div className="d-flex align-items-center justify-content-between mb-4">
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => {
              router.push("/planner/tasks").catch((err) => {
                console.error("[TaskDetailPage] navigation to /planner/tasks failed", err);
              });
            }}
            className="d-flex align-items-center gap-1"
          >
            <ArrowLeft size={16} />
            Back to list
          </Button>
          {(sessionCanUseMyDay ||
            taskDetailPermissions.canOpenTaskEdit ||
            taskDetailPermissions.canDeleteTask) && (
            <div className="d-flex align-items-center gap-1">
              <PlannerAddToMyDayHeaderButton
                show={sessionCanUseMyDay && addToMyDayTarget != null}
                canAdd={addToMyDayTarget != null && canAddTaskToMyDay(addToMyDayTarget)}
                alreadyInMyDay={
                  addToMyDayTarget != null && isTaskInMyDay(addToMyDayTarget)
                }
                onClick={() => {
                  if (addToMyDayTarget) requestAddTaskToMyDay(addToMyDayTarget);
                }}
              />
              {taskDetailPermissions.canOpenTaskEdit && (
                <Button
                  variant="link"
                  className="text-primary p-0"
                  onClick={() => setShowEditModal(true)}
                  title="Edit task"
                >
                  <Edit size={20} />
                </Button>
              )}
              {taskDetailPermissions.canDeleteTask && (
                <Button
                  variant="link"
                  className="text-danger p-0"
                  onClick={() => setShowDeleteModal(true)}
                  title="Delete task"
                >
                  <Trash2 size={20} />
                </Button>
              )}
            </div>
          )}
        </div>

        <Card className="border shadow-sm">
          <Card.Header className="bg-light py-3">
            <h5 className="mb-0 fw-bold">{title}</h5>
            <span className="text-muted small">{taskId}</span>
          </Card.Header>
          <Card.Body>
            <PlannerTaskDetailSummaryGrid viewModel={viewModel} />

            {showRecurringBlock && (
              <PlannerTaskRecurringSchedulePanel
                taskRecord={taskRecord}
                endDateDisplay={endDateDisplay}
                lastRunAt={lastRunAt}
                nextRunAt={nextRunAt}
              />
            )}

            {detailTaskKind !== "todo" && (
              <PlannerTaskDetailAssigneesBlock
                task={task}
                hierarchyDataExtensions={hierarchyDataExtensions}
              />
            )}

            <PlannerTaskDetailWatchersBlock
              watchers={watchers}
              hierarchyDataExtensions={hierarchyDataExtensions}
            />

            <PlannerTaskDetailProjectBlock projectName={projectName} />

            {parentTask ? (
              <PlannerTaskDetailParentBlock parent={parentTask} router={router} />
            ) : null}

            <PlannerTaskDetailLabelsBlock labels={labels ?? []} />

            <PlannerTaskDetailSubtasksBlock childrenTasks={childrenTasks ?? []} router={router} />

            <PlannerTaskDetailDescriptionBlock descriptionHtml={description} />

            <PlannerTaskDetailTabsSection
              activeDetailTab={activeDetailTab}
              setActiveDetailTab={setActiveDetailTab}
              handleCommentsTabClick={handleCommentsTabClick}
              handleDocumentsTabClick={handleDocumentsTabClick}
              taskCommentsCount={taskComments.length}
              loadingActivities={loadingActivities}
              taskActivities={taskActivities}
              onViewAllActivities={handleViewAllActivities}
              hierarchyDataExtensions={hierarchyDataExtensions}
              taskId={task.id}
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
              loadingDocuments={loadingDocuments}
              taskDocuments={taskDocuments}
              uploadingDocument={uploadingDocument}
              documentInputRef={documentInputRef}
              onUploadChange={handleUploadDocument}
              onUploadClick={() => documentInputRef.current?.click()}
              onDownloadDocument={handleDownloadDocument}
              onDeleteDocument={handleDeleteDocument}
            />
          </Card.Body>
        </Card>
      </Container>

      <Modal
        show={showAllActivitiesModal}
        onHide={() => {
          setShowAllActivitiesModal(false);
          setAllActivities([]);
        }}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>All Activities</Modal.Title>
        </Modal.Header>
        <Modal.Body className="ptd-activities-modal-body">
          <PlannerTaskAllActivitiesModalBody
            loadingAllActivities={loadingAllActivities}
            allActivities={allActivities}
            hierarchyDataExtensions={hierarchyDataExtensions}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAllActivitiesModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      <CreateTaskSidebar
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onCreate={async () => {
          setShowEditModal(false);
          await refetchTask();
        }}
        extensions={hierarchyDataExtensions as any}
        labels={sidebarProjectFromTask?.labels ?? (task.labels as any) ?? []}
        project={sidebarProjectFromTask as any}
        statuses={
          (sidebarProjectFromTask?.statuses as any[] | undefined)?.map(
            (s: {
              id: number;
              name: string;
              color?: string;
              is_default?: boolean;
              is_deefault?: boolean;
            }) => ({
              id: s.id,
              name: s.name,
              icon: "",
              color: s.color || "#3b82f6",
              is_default: s.is_default === true || s.is_deefault === true,
            }),
          ) ?? []
        }
        task={
          { ...task, rawData: task } as NonNullable<
            ComponentProps<typeof CreateTaskSidebar>["task"]
          >
        }
        isEdit={Boolean(showEditModal && task)}
        lockProjectSelection={false}
        taskEditScope={task ? taskDetailPermissions.taskEditScope : "full"}
        showAddToMyDay={sessionCanUseMyDay}
        canAddToMyDay={
          addToMyDayTarget != null && canAddTaskToMyDay(addToMyDayTarget)
        }
        alreadyInMyDay={addToMyDayTarget != null && isTaskInMyDay(addToMyDayTarget)}
        onAddToMyDay={() => {
          if (addToMyDayTarget) requestAddTaskToMyDay(addToMyDayTarget);
        }}
      />

      <PlannerAddToMyDayEstimateModal
        show={addToMyDayPendingTask != null}
        taskTitle={addToMyDayPendingTask?.title ?? ""}
        estimateInput={addToMyDayEstimateInput}
        onEstimateInputChange={setAddToMyDayEstimateInput}
        onClose={closeAddToMyDayEstimateModal}
        onSkip={skipAddToMyDayEstimate}
        onConfirm={confirmAddToMyDayEstimate}
      />

      <DeleteConfirmationModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        itemName={`${taskId} ${title}`}
        itemType="task"
        loading={deleting}
      />
    </>
  );
};

TaskDetailPage.getLayout = (page: ReactElement) => <Layout>{page}</Layout>;

export default TaskDetailPage;
