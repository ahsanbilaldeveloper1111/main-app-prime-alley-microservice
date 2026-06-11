import React from "react";
import { Info, X } from "lucide-react";
import "@assets/scss/common.scss";
import {
  formatWorkloadDayDetailDate,
  formatWorkloadMemberLabel,
  workloadCellKey,
} from "@page-modules/planner/workload/workloadDomain";
import { WorkloadPlannerAlertStack } from "./workload/WorkloadPlannerSubviews";
import { WorkloadPlannerDataViews } from "./workload/WorkloadPlannerDataViews";
import {
  WorkloadPlannerFilterBar,
  WorkloadPlannerPageHeader,
} from "./workload/WorkloadPlannerChrome";
import {
  WorkloadBoardDragConfirmModal,
  WorkloadDayOffcanvas,
  WorkloadReassignModal,
  WorkloadRescheduleModal,
} from "./workload/WorkloadPlannerDialogs";
import { WorkloadUnassignedSidebar } from "./workload/WorkloadUnassignedSidebar";
import { useWorkloadPlannerTaskActions } from "./workload/useWorkloadPlannerTaskActions";
import { useWorkloadPlannerPageScope } from "./workload/useWorkloadPlannerPageScope";
import { useWorkloadPlannerPageUiState } from "./workload/useWorkloadPlannerPageUiState";
import { useWorkloadPlannerPageData } from "./workload/useWorkloadPlannerPageData";
import { useWorkloadPlannerPageMutations } from "./workload/useWorkloadPlannerPageMutations";
import { WorkloadOnboardingModal } from "./workload/WorkloadOnboardingModal";
import {
  getOnboardingStatus,
  WORKLOAD_MOCK_BOARD_DATA,
  WORKLOAD_MOCK_GRID_DATA,
  mapMockGridMembersToPeriodMembers,
} from "./workload/workloadOnboarding";
import { startWorkloadTour, getGridTourSeen, getBoardTourSeen } from "./workload/useWorkloadTour";

type MainView = "grid" | "board";

function isForbiddenError(err: unknown): boolean {
  return isAxiosError(err) && err.response?.status === 403;
}

function workloadErrorMessage(err: unknown): string {
  if (
    isAxiosError(err) &&
    typeof err.response?.data === "object" &&
    err.response.data !== null
  ) {
    const msg = (err.response.data as { message?: string }).message;
    if (typeof msg === "string" && msg.trim()) return msg;
  }
  if (err instanceof Error) return err.message;
  return "Something went wrong.";
}

function buildCellMap(
  cells: WorkloadGridCell[] | undefined,
): Map<string, WorkloadGridCell> {
  const m = new Map<string, WorkloadGridCell>();
  if (!Array.isArray(cells)) return m;
  for (const c of cells) {
    m.set(workloadCellKey(c.extension_number, c.date), c);
  }
  return m;
}

const WorkloadPlannerPage: React.FC = () => {
  const scope = useWorkloadPlannerPageScope();
  const ui = useWorkloadPlannerPageUiState();
  const data = useWorkloadPlannerPageData({
    scope,
    mainView: ui.mainView,
    useMockData: ui.useMockData,
    selectedCell: ui.selectedCell,
  });

  const gridRangeFallback = useMemo(
    () => resolveWorkloadGridRangeFallback(appliedFilters, appliedRangeValid),
    [appliedFilters, appliedRangeValid],
  );

  const gridTeamExtensionNumbers = useMemo(
    () => resolveWorkloadDisplayTeamExtensions(rosterExtensions, extension),
    [rosterExtensions, extension],
  );

  const displayGridData = useMemo(() => {
    if (useMockData) {
      return effectiveGridData;
    }
    return resolveWorkloadGridDisplayData(effectiveGridData, {
      viewerExtension: extension,
      memberFilter: appliedFilters.memberFilter,
      rangeFallback: gridRangeFallback,
      teamExtensionNumbers: gridTeamExtensionNumbers,
      companyExtensionAllowlist,
    });
  }, [
    useMockData,
    effectiveGridData,
    extension,
    appliedFilters.memberFilter,
    gridRangeFallback,
    gridTeamExtensionNumbers,
    companyExtensionAllowlist,
  ]);

  const displayBoardData = useMemo(() => {
    if (useMockData) {
      return effectiveBoardData;
    }
    return resolveWorkloadBoardDisplayData(effectiveBoardData, {
      viewerExtension: extension,
      memberFilter: appliedFilters.memberFilter,
      teamExtensionNumbers: gridTeamExtensionNumbers,
      companyExtensionAllowlist,
    });
  }, [
    useMockData,
    effectiveBoardData,
    extension,
    appliedFilters.memberFilter,
    gridTeamExtensionNumbers,
    companyExtensionAllowlist,
  ]);

  const cellMap = useMemo(
    () => buildCellMap(displayGridData?.cells ?? effectiveGridData?.cells),
    [displayGridData?.cells, effectiveGridData?.cells],
  );

  const memberExtensions = useMemo(
    () =>
      resolveWorkloadMemberExtensions(
        displayGridData,
        extension,
        displayBoardData?.columns,
      ),
    [displayGridData, extension, displayBoardData?.columns],
  );

  const displayPeriodMembers = useMemo(() => {
    if (useMockData && effectiveGridData) {
      return mapMockGridMembersToPeriodMembers(effectiveGridData);
    }
    return resolveWorkloadPeriodDisplayMembers(
      summaryQuery.data?.members,
      extension,
      rosterExtensions.length > 0 ? rosterExtensions : undefined,
      companyExtensionAllowlist,
    );
  }, [
    useMockData,
    effectiveGridData,
    summaryQuery.data?.members,
    extension,
    rosterExtensions,
    companyExtensionAllowlist,
  ]);

  const invalidateWorkload = useCallback(() => {
    queryClient
      .invalidateQueries({ queryKey: plannerKeys.workload.all() })
      .catch(() => undefined);
  }, [queryClient]);

  const assignMutation = useMutation({
    mutationFn: async ({
      task,
      toExtension,
    }: {
      task: WorkloadTaskCard;
      toExtension: string;
    }) => {
      if (!toExtension) throw new Error("Choose a team member.");
      await patchWorkloadTask(
        task.id,
        extension,
        buildWorkloadTaskPatchBody(task, { extension_numbers: [toExtension] }),
      );
    },
    onRescheduleSuccess: () => {
      ui.setRescheduleTask(null);
      ui.setOverloadSecondStep(false);
    },
    onBoardDropSuccess: () => {
      ui.setBoardDropIntent(null);
      ui.setBoardDropOverload(false);
    },
  });

  const {
    submitReassign,
    submitReschedule,
    handleBoardDropIntent,
    confirmBoardDrop,
  } = useWorkloadPlannerTaskActions({
    extension: scope.extension,
    assigneeMatch: data.appliedFilters.assigneeMatch,
    boardRangeStart: data.effectiveBoardData?.range.start,
    reassignTask: ui.reassignTask,
    reassignTarget: ui.reassignTarget,
    reassignOverloadConfirm: ui.reassignOverloadConfirm,
    selectedCell: ui.selectedCell,
    rescheduleTask: ui.rescheduleTask,
    rescheduleDate: ui.rescheduleDate,
    overloadSecondStep: ui.overloadSecondStep,
    boardDropIntent: ui.boardDropIntent,
    assignMutation: mutations.assignMutation,
    rescheduleMutation: mutations.rescheduleMutation,
    boardDragMutation: mutations.boardDragMutation,
    setReassignOverloadConfirm: ui.setReassignOverloadConfirm,
    setOverloadSecondStep: ui.setOverloadSecondStep,
    setBoardDropIntent: ui.setBoardDropIntent,
    setBoardDropOverload: ui.setBoardDropOverload,
    formatError: mutations.formatError,
  });

  const summaryForbidden =
    summaryQuery.isError && isForbiddenError(summaryQuery.error);
  const gridForbidden = gridQuery.isError && isForbiddenError(gridQuery.error);
  const boardForbidden =
    boardQuery.isError && isForbiddenError(boardQuery.error);
  const accessForbidden = summaryForbidden || gridForbidden || boardForbidden;

  const hasActiveFilters = useMemo(
    () => !isDefaultWorkloadPlannerFilters(draftFilters),
    [draftFilters],
  );

  const hasPendingFilters = useMemo(
    () => !workloadPlannerFiltersEqual(draftFilters, appliedFilters),
    [draftFilters, appliedFilters],
  );

  const handleClearFilters = useCallback(() => {
    const defaults = createDefaultWorkloadPlannerFilters();
    setDraftFilters(defaults);
    setAppliedFilters(defaults);
  }, []);

  const dataViewsEnabled = queriesEnabled || useMockData;

  const loadingMain = useMockData
    ? false
    : computeWorkloadLoadingMain(
        queriesEnabled,
        mainView,
        summaryQuery.isPending,
        gridQuery.isPending,
        boardQuery.isPending,
      );

  const applyDisabled =
    !filtersEnabled || draftRangeInvalid || !hasPendingFilters || loadingMain;

  const isApplyingFilters = computeWorkloadIsApplyingFilters(
    hasPendingFilters,
    queriesEnabled,
    mainView,
    summaryQuery.isFetching,
    gridQuery.isFetching,
    boardQuery.isFetching,
  );

  return (
    <div className="workload-page">
      {ui.useMockData ? (
        <div className="workload-demo-banner">
          <Info size={18} aria-hidden />
          You are viewing sample data.
          <button
            type="button"
            className="workload-demo-banner__exit"
            onClick={() => {
              ui.setUseMockData(false);
              window.scrollTo(0, 0);
            }}
          >
            Exit demo → view real data
          </button>
        </div>
      ) : null}
      <div className="workload-page__inner">
        <WorkloadPlannerPageHeader
          mainView={ui.mainView}
          onMainViewChange={ui.handleMainViewChange}
          enabled={data.queriesEnabled}
        />

        <WorkloadPlannerFilterBar
          range={data.draftFilters.range}
          onRangeChange={data.handleDraftRangeChange}
          customStart={data.draftFilters.customStart}
          customEnd={data.draftFilters.customEnd}
          onCustomStartChange={(value) =>
            data.setDraftFilters((prev) => ({ ...prev, customStart: value }))
          }
          onCustomEndChange={(value) =>
            data.setDraftFilters((prev) => ({ ...prev, customEnd: value }))
          }
          customRangeInvalid={
            data.draftFilters.range === "custom" && data.draftRangeInvalid
          }
          assigneeMatch={data.draftFilters.assigneeMatch}
          onAssigneeMatchChange={(value) =>
            data.setDraftFilters((prev) => ({ ...prev, assigneeMatch: value }))
          }
          projectFilter={data.draftFilters.projectFilter}
          onProjectFilterChange={(value) =>
            data.setDraftFilters((prev) => ({ ...prev, projectFilter: value }))
          }
          projectOptions={data.projectOptions}
          memberFilter={data.draftFilters.memberFilter}
          onMemberFilterChange={(value) =>
            data.setDraftFilters((prev) => ({ ...prev, memberFilter: value }))
          }
          memberExtensions={data.filterMemberExtensions}
          hierarchyExtensions={scope.hierarchyDataExtensions}
          priorityFilter={data.draftFilters.priorityFilter}
          onPriorityFilterChange={(value) =>
            data.setDraftFilters((prev) => ({ ...prev, priorityFilter: value }))
          }
          enabled={data.filtersEnabled}
          unassignedCount={data.unassignedQuery.data?.count}
          onOpenUnassigned={() => ui.setShowUnassigned(true)}
          onClearFilters={data.handleClearFilters}
          hasActiveFilters={data.hasActiveFilters}
          onApply={data.handleApplyFilters}
          applyDisabled={data.applyDisabled}
          isApplying={data.isApplyingFilters}
        />

        <WorkloadPlannerAlertStack
          sessionStatus={scope.sessionStatus}
          enabled={data.queriesEnabled}
          workloadSelfScoped={scope.workloadSelfScoped}
          accessForbidden={data.accessForbidden}
          summaryError={data.summaryQuery.error}
          summaryHasError={data.summaryQuery.isError}
          gridError={data.gridQuery.error}
          gridHasError={data.gridQuery.isError}
          boardError={data.boardQuery.error}
          boardHasError={data.boardQuery.isError && !data.boardForbidden}
          mainView={ui.mainView}
          workloadErrorMessage={mutations.formatError}
        />

        {ui.mainView === "board" && ui.useMockData && ui.showBoardHint ? (
          <div className="workload-board-hint">
            <Info size={18} aria-hidden />
            <span>
              <strong>Drag</strong> cards between columns to reassign &nbsp;·&nbsp;{" "}
              <strong>Move to</strong> changes due date &nbsp;·&nbsp; <strong>View</strong>{" "}
              opens the full task
            </span>
            <button
              type="button"
              className="workload-board-hint__close"
              onClick={() => ui.setShowBoardHint(false)}
              aria-label="Dismiss"
            >
              <X size={16} aria-hidden />
            </button>
          </div>
        ) : null}

        <WorkloadPlannerDataViews
          loadingMain={loadingMain}
          enabled={dataViewsEnabled}
          mainView={mainView}
          summaryData={summaryQuery.data}
          gridData={displayGridData}
          periodMembers={displayPeriodMembers}
          boardData={displayBoardData}
          cellMap={cellMap}
          hierarchyExtensions={hierarchyDataExtensions}
          priorityFilter={appliedFilters.priorityFilter}
          boardDragSaving={boardDragMutation.isPending}
          onBoardDropIntent={handleBoardDropIntent}
          showWorkloadPerDay={ui.showWorkloadPerDay}
          onToggleWorkloadPerDay={() => ui.setShowWorkloadPerDay((prev) => !prev)}
          onSelectCell={(extension, date) => {
            const member = data.displayGridData?.members?.find(
              (m) => m.extension_number === extension,
            );
            const cell = data.cellMap.get(workloadCellKey(extension, date));
            ui.setSelectedCell({ extension, date, member, cell });
          }}
        />
      </div>

      <WorkloadDayOffcanvas
        selected={ui.selectedCell}
        onClose={() => ui.setSelectedCell(null)}
        dayQuery={data.dayQuery}
        onReassign={(task) => {
          ui.setReassignTask(task);
          ui.setReassignTarget(data.memberExtensions[0] ?? "");
          ui.setReassignOverloadConfirm(false);
        }}
        onReschedule={ui.openReschedule}
        onMarkDone={(task) => {
          mutations.markDoneMutation.mutate(task);
        }}
        markDoneTaskId={
          mutations.markDoneMutation.isPending
            ? (mutations.markDoneMutation.variables?.id ?? null)
            : null
        }
        onSaveEstimate={(task, minutes) => {
          mutations.estimateMutation.mutate({ task, minutes });
        }}
        estimateSavingTaskId={
          mutations.estimateMutation.isPending
            ? (mutations.estimateMutation.variables?.task.id ?? null)
            : null
        }
        formatError={mutations.formatError}
        hierarchyExtensions={scope.hierarchyDataExtensions}
      />

      <WorkloadReassignModal
        task={ui.reassignTask}
        memberExtensions={data.filterMemberExtensions}
        hierarchyExtensions={scope.hierarchyDataExtensions}
        targetExtension={ui.reassignTarget}
        onTargetChange={ui.setReassignTarget}
        isSaving={mutations.assignMutation.isPending}
        overloadConfirm={ui.reassignOverloadConfirm}
        memberName={
          ui.reassignTarget
            ? formatWorkloadMemberLabel(
                ui.reassignTarget,
                scope.hierarchyDataExtensions,
              )
            : ""
        }
        onClose={() => {
          ui.setReassignTask(null);
          ui.setReassignOverloadConfirm(false);
        }}
        onConfirm={() => {
          submitReassign().catch(() => undefined);
        }}
      />

      <WorkloadUnassignedSidebar
        show={ui.showUnassigned}
        onClose={() => ui.setShowUnassigned(false)}
        unassignedQuery={data.unassignedQuery}
        memberExtensions={data.filterMemberExtensions}
        hierarchyExtensions={scope.hierarchyDataExtensions}
        assignTargets={ui.assignTargets}
        setAssignTargets={ui.setAssignTargets}
        onRequestAssign={(task, toExtension) => {
          mutations.assignMutation.mutate({ task, toExtension });
        }}
        assignPending={mutations.assignMutation.isPending}
        formatError={mutations.formatError}
      />

      <WorkloadRescheduleModal
        task={ui.rescheduleTask}
        currentDate={ui.selectedCell?.date}
        onClose={() => {
          ui.setRescheduleTask(null);
          ui.setOverloadSecondStep(false);
        }}
        rescheduleDate={ui.rescheduleDate}
        onDateChange={(value: string) => {
          ui.setRescheduleDate(value);
          ui.setOverloadSecondStep(false);
        }}
        overloadSecondStep={ui.overloadSecondStep}
        isSaving={mutations.rescheduleMutation.isPending}
        onSubmit={() => {
          submitReschedule().catch(() => undefined);
        }}
      />

      <WorkloadBoardDragConfirmModal
        payload={
          ui.boardDropIntent
            ? {
                taskTitle: ui.boardDropIntent.task.title,
                memberName: formatWorkloadMemberLabel(
                  ui.boardDropIntent.toExtension,
                  scope.hierarchyDataExtensions,
                ),
                dateLabel: ui.boardDropIntent.toDate
                  ? formatWorkloadDayDetailDate(ui.boardDropIntent.toDate)
                  : "",
                overloadWarning: ui.boardDropOverload,
              }
            : null
        }
        isSaving={mutations.boardDragMutation.isPending}
        onClose={() => {
          ui.setBoardDropIntent(null);
          ui.setBoardDropOverload(false);
        }}
        onConfirm={confirmBoardDrop}
      />

      <WorkloadOnboardingModal
        show={ui.showOnboarding}
        onComplete={ui.handleOnboardingComplete}
      />
    </div>
  );
};

export default WorkloadPlannerPage;
