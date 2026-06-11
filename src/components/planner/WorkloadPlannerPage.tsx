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

const WorkloadPlannerPage: React.FC = () => {
  const scope = useWorkloadPlannerPageScope();
  const ui = useWorkloadPlannerPageUiState();
  const data = useWorkloadPlannerPageData({
    scope,
    mainView: ui.mainView,
    useMockData: ui.useMockData,
    selectedCell: ui.selectedCell,
  });
  const mutations = useWorkloadPlannerPageMutations({
    extension: scope.extension,
    data,
    onAssignSuccess: () => {
      ui.setReassignTask(null);
      ui.setReassignOverloadConfirm(false);
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

  const dataViewsEnabled = data.queriesEnabled || ui.useMockData;
  const loadingMain = ui.useMockData ? false : data.loadingMain;

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
              onClick={ui.dismissBoardHint}
              aria-label="Dismiss"
            >
              <X size={16} aria-hidden />
            </button>
          </div>
        ) : null}

        <WorkloadPlannerDataViews
          loadingMain={loadingMain}
          enabled={dataViewsEnabled}
          mainView={ui.mainView}
          summaryData={data.summaryQuery.data}
          gridData={data.displayGridData}
          periodMembers={data.displayPeriodMembers}
          boardData={data.displayBoardData}
          cellMap={data.cellMap}
          hierarchyExtensions={scope.hierarchyDataExtensions}
          priorityFilter={data.appliedFilters.priorityFilter}
          boardDragSaving={mutations.boardDragMutation.isPending}
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
