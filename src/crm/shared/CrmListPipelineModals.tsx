import React from "react";
import FormModal from "@pages/partial/FormModal";
import SuccessfulModal from "@pages/partial/SuccessfulModal";
import CallRecordingPlayerModal from "@components/CallRecordingPlayerModal";
import { CrmListDataAssignmentFormContent } from "@crm/shared/CrmListDataAssignmentFormContent";
import type { CrmListDataAssignmentFormContentProps } from "@crm/shared/CrmListDataAssignmentFormContent";
import { CrmListAfterCallFormContent } from "@crm/shared/CrmListAfterCallFormContent";
import type { AfterCallData } from "@crm/shared/CrmListAfterCallFormContent";
import {
  CrmListScheduleCallFormContent,
  CrmListUnscheduleModal,
} from "@crm/shared/CrmListScheduleCallModals";
import { CrmListHistoryFormContent } from "@crm/shared/CrmListHistoryFormContent";
import type { CrmListHistoryFormContentProps } from "@crm/shared/CrmListHistoryFormContent";

export type CrmListPipelineModalsProps = Readonly<{
  assignment: Readonly<{
    show: boolean;
    onHide: () => void;
    title: string;
    desc: string;
    onSubmit: () => void;
    onCancel: () => void;
  }>;
  assignmentForm: CrmListDataAssignmentFormContentProps;
  afterCall: Readonly<{
    show: boolean;
    onHide: () => void;
    onSubmit: () => void;
    afterCallData: AfterCallData;
    setAfterCallData: React.Dispatch<React.SetStateAction<AfterCallData>>;
  }>;
  schedule: Readonly<{
    show: boolean;
    onHide: () => void;
    isEditingSchedule: boolean;
    selectedEntryForSchedule: unknown;
    scheduleData: { date: string; time: string; notes: string };
    setScheduleData: React.Dispatch<
      React.SetStateAction<{ date: string; time: string; notes: string }>
    >;
    onSubmit: () => void;
    onCancel: () => void;
  }>;
  unschedule: Readonly<{
    show: boolean;
    onHide: () => void;
    entryToUnschedule: unknown;
    onConfirm: () => void;
  }>;
  history: Readonly<{
    show: boolean;
    onHide: () => void;
    onClose: () => void;
  }> &
    CrmListHistoryFormContentProps;
  success: Readonly<{
    show: boolean;
    onHide: () => void;
    title: string;
    description: string;
  }>;
  recording: Readonly<{
    show: boolean;
    onHide: () => void;
    recording: unknown;
  }>;
}>;

/**
 * Shared CRM list workflow modals (assignment → after-call → schedule/history → success/recording).
 * Single implementation for Sonar DRY across quotes and prospects/contacts list pages.
 */
export function CrmListPipelineModals({
  assignment,
  assignmentForm,
  afterCall,
  schedule,
  unschedule,
  history,
  success,
  recording,
}: CrmListPipelineModalsProps) {
  return (
    <>
      <FormModal
        show={assignment.show}
        onHide={assignment.onHide}
        title={assignment.title}
        desc={assignment.desc}
        size="lg"
        formHtml={<CrmListDataAssignmentFormContent {...assignmentForm} />}
        submitButtonText="OK"
        cancelButtonText="Cancel"
        onSubmit={assignment.onSubmit}
        onCancel={assignment.onCancel}
      />

      <FormModal
        show={afterCall.show}
        onHide={afterCall.onHide}
        title="After Call Dialog"
        desc="Please fill the details below to record call outcomes and schedule follow-up actions."
        size="lg"
        formHtml={
          <CrmListAfterCallFormContent
            afterCallData={afterCall.afterCallData}
            setAfterCallData={afterCall.setAfterCallData}
          />
        }
        submitButtonText="Save Call Data"
        cancelButtonText="Cancel"
        onSubmit={() => afterCall.onSubmit()}
        onCancel={afterCall.onHide}
      />

      <FormModal
        show={schedule.show}
        onHide={schedule.onHide}
        title={
          schedule.isEditingSchedule ? "Edit Scheduled Call" : "Schedule Call"
        }
        desc={
          schedule.isEditingSchedule
            ? "Please update the details below to modify the scheduled call."
            : "Please fill the details below to schedule a call."
        }
        size="lg"
        formHtml={
          <CrmListScheduleCallFormContent
            selectedEntry={schedule.selectedEntryForSchedule}
            isEditing={schedule.isEditingSchedule}
            scheduleData={schedule.scheduleData}
            setScheduleData={schedule.setScheduleData}
          />
        }
        submitButtonText={
          schedule.isEditingSchedule ? "Update Schedule" : "Schedule Call"
        }
        cancelButtonText="Cancel"
        onSubmit={() => schedule.onSubmit()}
        onCancel={() => schedule.onCancel()}
      />

      <CrmListUnscheduleModal
        show={unschedule.show}
        onHide={unschedule.onHide}
        entryToUnschedule={unschedule.entryToUnschedule}
        onConfirm={unschedule.onConfirm}
      />

      <FormModal
        show={history.show}
        onHide={history.onHide}
        title="Activity History"
        desc="Please fill the details below to view the activity history."
        size="lg"
        formHtml={
          <CrmListHistoryFormContent
            historyData={history.historyData}
            historyLoading={history.historyLoading}
            historyPagination={history.historyPagination}
            fetchHistoryData={history.fetchHistoryData}
            campaignsById={history.campaignsById}
            getNameByExtension={history.getNameByExtension}
          />
        }
        submitButtonText="Close"
        cancelButtonText="Cancel"
        onSubmit={history.onClose}
        onCancel={history.onClose}
      />

      <SuccessfulModal
        show={success.show}
        onHide={success.onHide}
        title={success.title}
        description={success.description}
      />

      <CallRecordingPlayerModal
        show={recording.show}
        onHide={recording.onHide}
        recording={recording.recording}
      />
    </>
  );
}
