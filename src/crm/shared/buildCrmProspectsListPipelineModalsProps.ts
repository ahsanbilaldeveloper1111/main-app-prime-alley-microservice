import type { CrmListPipelineModalsProps } from "@crm/shared/CrmListPipelineModals";

export type BuildCrmProspectsListPipelineModalsArgs = Readonly<{
  assignment: Readonly<{
    show: boolean;
    onHide: () => void;
    title: string;
    desc: string;
    onSubmit: () => void;
    onCancel: () => void;
    entityLabel: string;
    assignmentFilters: CrmListPipelineModalsProps["assignmentForm"]["assignmentFilters"];
    setAssignmentFilters: CrmListPipelineModalsProps["assignmentForm"]["setAssignmentFilters"];
    availableTags: CrmListPipelineModalsProps["assignmentForm"]["availableTags"];
    availableCampaigns: CrmListPipelineModalsProps["assignmentForm"]["availableCampaigns"];
    assignmentCounts: CrmListPipelineModalsProps["assignmentForm"]["assignmentCounts"];
    assignmentCampaign: CrmListPipelineModalsProps["assignmentForm"]["assignmentCampaign"];
    setAssignmentCampaign: CrmListPipelineModalsProps["assignmentForm"]["setAssignmentCampaign"];
    totalEntriesToAssign: CrmListPipelineModalsProps["assignmentForm"]["totalEntriesToAssign"];
    setTotalEntriesToAssign: CrmListPipelineModalsProps["assignmentForm"]["setTotalEntriesToAssign"];
    assignmentDistribution: CrmListPipelineModalsProps["assignmentForm"]["assignmentDistribution"];
    setAssignmentDistribution: CrmListPipelineModalsProps["assignmentForm"]["setAssignmentDistribution"];
    customDistribution: CrmListPipelineModalsProps["assignmentForm"]["customDistribution"];
    setCustomDistribution: CrmListPipelineModalsProps["assignmentForm"]["setCustomDistribution"];
  }>;
  afterCall: CrmListPipelineModalsProps["afterCall"];
  schedule: CrmListPipelineModalsProps["schedule"];
  unschedule: CrmListPipelineModalsProps["unschedule"];
  history: CrmListPipelineModalsProps["history"];
  success: CrmListPipelineModalsProps["success"];
  recording: CrmListPipelineModalsProps["recording"];
}>;

/**
 * Maps flat prospect-list state into {@link CrmListPipelineModals} props (one implementation, Sonar DRY).
 */
export function buildCrmProspectsListPipelineModalsProps(
  args: BuildCrmProspectsListPipelineModalsArgs,
): CrmListPipelineModalsProps {
  const { assignment, afterCall, schedule, unschedule, history, success, recording } =
    args;

  return {
    assignment: {
      show: assignment.show,
      onHide: assignment.onHide,
      title: assignment.title,
      desc: assignment.desc,
      onSubmit: assignment.onSubmit,
      onCancel: assignment.onCancel,
    },
    assignmentForm: {
      entityLabel: assignment.entityLabel,
      assignmentFilters: assignment.assignmentFilters,
      setAssignmentFilters: assignment.setAssignmentFilters,
      availableTags: assignment.availableTags,
      availableCampaigns: assignment.availableCampaigns,
      assignmentCounts: assignment.assignmentCounts,
      assignmentCampaign: assignment.assignmentCampaign,
      setAssignmentCampaign: assignment.setAssignmentCampaign,
      totalEntriesToAssign: assignment.totalEntriesToAssign,
      setTotalEntriesToAssign: assignment.setTotalEntriesToAssign,
      assignmentDistribution: assignment.assignmentDistribution,
      setAssignmentDistribution: assignment.setAssignmentDistribution,
      customDistribution: assignment.customDistribution,
      setCustomDistribution: assignment.setCustomDistribution,
    },
    afterCall,
    schedule,
    unschedule,
    history,
    success,
    recording,
  };
}
