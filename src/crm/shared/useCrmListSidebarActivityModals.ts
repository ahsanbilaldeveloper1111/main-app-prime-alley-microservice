import { useMemo, useRef } from "react";
import type { CrmActivitiesPanelRef } from "@components/CrmActivitiesPanel";
import { useCrmActivityModals, type CrmRecordType } from "@hooks/useCrmActivityModals";

interface SidebarRecordSelectors<T> {
  selectId: (record: T | null | undefined) => number;
  selectName: (record: T | null | undefined) => string;
  selectPhone: (record: T | null | undefined) => string;
  selectEmail: (record: T | null | undefined) => string;
}

export function useCrmListSidebarActivityModals<T>(
  selectedRecord: T | null | undefined,
  recordType: CrmRecordType,
  selectors: SidebarRecordSelectors<T>,
) {
  const activitiesPanelRef = useRef<CrmActivitiesPanelRef>(null);

  const recordId = selectors.selectId(selectedRecord);
  const recordName = selectors.selectName(selectedRecord);
  const recordPhone = selectors.selectPhone(selectedRecord);
  const recordEmail = selectors.selectEmail(selectedRecord);

  const activityModals = useCrmActivityModals({
    recordType,
    recordId,
    recordName,
    recordEmail,
    recordPhone,
    onTaskCreated: () => activitiesPanelRef.current?.refetchTasks?.(),
    onNoteCreated: () => activitiesPanelRef.current?.refetchNotes?.(),
    onEmailSent: () => activitiesPanelRef.current?.refetchEmails?.(),
    onMeetingScheduled: () =>
      activitiesPanelRef.current?.refetchMeetings?.(),
  });

  return useMemo(
    () => ({
      activitiesPanelRef,
      recordId,
      recordName,
      recordPhone,
      recordEmail,
      activityModals,
    }),
    [recordId, recordName, recordPhone, recordEmail, activityModals],
  );
}
