import React from "react";
import type { NextRouter } from "next/router";
import { Badge, Spinner } from "react-bootstrap";
import GenericSidebar from "@components/GenericSidebarNew";
import {
  Users,
  Target,
  TrendingUp,
  ShoppingBag,
  CheckCircle,
  History,
} from "lucide-react";
import { getInitials, getRandomColor } from "@utils/crmNameAvatar";
import { stripTrailingParenthetical } from "@utils/displayName";
import type {
  CrmDataItem,
  HistoryChainRecord,
  StageData,
} from "@utils/crm";
import type { ActivityRecord } from "./activityHistoryPageTypes";
import {
  buildActivityDetailsRoute,
  getActivityEntityType,
  getActivityRecordIdNumber,
} from "./activityHistoryRouting";

type StageDefinition = {
  name: string;
  icon: React.ReactNode;
  color: string;
};

type StageVisualState = {
  circleBackground: string;
  circleBoxShadow: string;
  stageLabelColor: string;
};

function buildStageDefinitions(recordStages: StageData[]): StageDefinition[] {
  return [
    {
      name: "Prospect",
      icon: <Users size={14} />,
      color: recordStages[0]?.color || "#9c27b0",
    },
    {
      name: "Lead",
      icon: <Target size={14} />,
      color: recordStages[1]?.color || "#2196f3",
    },
    {
      name: "Deal",
      icon: <TrendingUp size={14} />,
      color: recordStages[2]?.color || "#ff9800",
    },
    {
      name: "Order",
      icon: <ShoppingBag size={14} />,
      color: recordStages[3]?.color || "#4caf50",
    },
  ];
}

function getStageVisualState(
  isCurrent: boolean,
  isCompleted: boolean,
  color: string,
): StageVisualState {
  if (isCurrent) {
    return {
      circleBackground: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
      circleBoxShadow: `0 8px 24px ${color}66`,
      stageLabelColor: color,
    };
  }
  if (isCompleted) {
    return {
      circleBackground: color,
      circleBoxShadow: `0 4px 12px ${color}44`,
      stageLabelColor: "#374151",
    };
  }
  return {
    circleBackground: "#e3e8ef",
    circleBoxShadow: "none",
    stageLabelColor: "#9ca3af",
  };
}

function getActivitySidebarWidth(): string {
  const innerWidth = globalThis.window?.innerWidth;
  if (innerWidth !== undefined && innerWidth < 1280) return "360px";
  return "420px";
}

type ActivityStageProgressItemProps = Readonly<{
  stage: StageDefinition;
  index: number;
  currentStageIndex: number;
}>;

function ActivityStageProgressItem({
  stage,
  index,
  currentStageIndex,
}: ActivityStageProgressItemProps) {
  const isCompleted = index < currentStageIndex;
  const isCurrent = index === currentStageIndex;
  const { circleBackground, circleBoxShadow, stageLabelColor } =
    getStageVisualState(isCurrent, isCompleted, stage.color);

  return (
    <div
      className="d-flex flex-column align-items-center"
      style={{ flex: 1 }}
    >
      <div
        className="rounded-circle d-flex align-items-center justify-content-center mb-2"
        style={{
          width: isCurrent ? 44 : 36,
          height: isCurrent ? 44 : 36,
          background: circleBackground,
          color: isCurrent || isCompleted ? "#fff" : "#9ca3af",
          opacity: isCompleted && !isCurrent ? 0.88 : 1,
          transition: "all 0.3s ease",
          boxShadow: circleBoxShadow,
        }}
      >
        {isCompleted && !isCurrent ? (
          <CheckCircle size={16} strokeWidth={3} />
        ) : (
          stage.icon
        )}
      </div>
      <span
        className="fw-semibold text-center"
        style={{
          fontSize: isCurrent ? "clamp(11px, 0.9vw, 13px)" : "clamp(10px, 0.8vw, 12px)",
          color: stageLabelColor,
        }}
      >
        {stage.name}
      </span>
      {isCurrent && (
        <Badge
          className="mt-1"
          style={{
            backgroundColor: `${stage.color}22`,
            color: stage.color,
            fontSize: 9,
            padding: "2px 8px",
          }}
        >
          CURRENT
        </Badge>
      )}
    </div>
  );
}

function renderStageProgressContent(
  loadingHistory: boolean,
  recordStages: StageData[],
  currentStageIndex: number,
): React.ReactNode {
  if (loadingHistory) {
    return (
      <div className="text-center py-4">
        <Spinner
          animation="border"
          variant="primary"
          size="sm"
          role="status"
        >
          <span className="visually-hidden">Loading stages...</span>
        </Spinner>
      </div>
    );
  }
  if (recordStages.length === 0) {
    return (
      <div className="text-center py-4 text-muted">
        <TrendingUp size={48} className="mb-3 opacity-50" />
        <div>No stage information available</div>
      </div>
    );
  }

  const stages = buildStageDefinitions(recordStages);

  return (
    <div className="position-relative" style={{ padding: "12px 0" }}>
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "10%",
          right: "10%",
          height: "4px",
          backgroundColor: "#e3e8ef",
          borderRadius: "4px",
          transform: "translateY(-50%)",
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "10%",
          width:
            currentStageIndex > 0
              ? `${(currentStageIndex / 3) * 80}%`
              : "0%",
          height: "4px",
          background: "linear-gradient(90deg, #667eea 0%, #764ba2 100%)",
          borderRadius: "4px",
          transform: "translateY(-50%)",
          zIndex: 0,
          transition: "width 0.5s ease",
        }}
      />
      <div
        className="d-flex justify-content-between align-items-center position-relative"
        style={{ zIndex: 1 }}
      >
        {stages.map((stage, idx) => (
          <ActivityStageProgressItem
            key={stage.name}
            stage={stage}
            index={idx}
            currentStageIndex={currentStageIndex}
          />
        ))}
      </div>
    </div>
  );
}

export type ActivityHistorySidebarPanelProps = Readonly<{
  showActivitySidebar: boolean;
  setShowActivitySidebar: (open: boolean) => void;
  selectedActivityRecord: ActivityRecord | null;
  extensions: ReadonlyArray<{
    id?: unknown;
    extension?: unknown;
    display_name?: string;
    name?: string;
  }>;
  loadingHistory: boolean;
  recordStages: StageData[];
  currentStageIndex: number;
  historyChain: HistoryChainRecord[];
  crmData: CrmDataItem | null;
  router: NextRouter;
}>;

export function ActivityHistorySidebarPanel({
  showActivitySidebar,
  setShowActivitySidebar,
  selectedActivityRecord,
  extensions,
  loadingHistory,
  recordStages,
  currentStageIndex,
  historyChain,
  crmData,
  router,
}: ActivityHistorySidebarPanelProps) {
  if (!showActivitySidebar) return null;

  const stageProgressCustomContent = renderStageProgressContent(
    loadingHistory,
    recordStages,
    currentStageIndex,
  );

  return (
    <GenericSidebar
      width={getActivitySidebarWidth()}
      isOpen={showActivitySidebar}
      onClose={() => setShowActivitySidebar(false)}
      title={selectedActivityRecord?.customer || "Activity Details"}
      subtitle={`Assigned to ${selectedActivityRecord?.agent || "N/A"}`}
      avatar={{
        initials: getInitials(selectedActivityRecord?.customer || "NA"),
        name: selectedActivityRecord?.customer || "NA",
        gradient: getRandomColor(selectedActivityRecord?.customer || ""),
      }}
      recordType="activity"
      recordId={getActivityRecordIdNumber(selectedActivityRecord)}
      activityEntityType={getActivityEntityType(
        selectedActivityRecord?.type,
      )}
      resolveUserLabel={(extensionOrId) => {
        const ext = extensions.find(
          (e) => e?.id == extensionOrId || e?.extension == extensionOrId,
        );
        const raw = String(
          ext?.display_name || ext?.name || extensionOrId,
        );
        return stripTrailingParenthetical(raw) || String(extensionOrId);
      }}
      sections={[
        {
          id: "stage-progress",
          title: "Stage Progress",
          icon: TrendingUp,
          collapsible: true,
          defaultExpanded: true,
          customContent: stageProgressCustomContent,
        },
        {
          id: "recent-activities",
          title: "Recent activities",
          icon: History,
          collapsible: true,
          defaultExpanded: true,
          count: historyChain.length,
          emptyState: {
            icon: History,
            message: "No recent activities for this record.",
            action: {
              label: "Log activity",
              onClick: () => {
                const recordId =
                  selectedActivityRecord?.record_id ||
                  selectedActivityRecord?.id;
                if (!recordId) return;
                const route = buildActivityDetailsRoute(
                  String(selectedActivityRecord?.type || ""),
                  recordId,
                );
                if (!route) return;
                setShowActivitySidebar(false);
                router.push(route);
              },
            },
          },
        },
        {
          id: "customer-info",
          title: "Customer Info",
          icon: Users,
          collapsible: true,
          defaultExpanded: true,
          fields: [
            {
              label: "Name",
              value:
                crmData?.name ||
                selectedActivityRecord?.customer ||
                "N/A",
            },
            {
              label: "Phone",
              value: crmData?.phone || "N/A",
              type: "phone",
            },
          ],
        },
        {
          id: "agent-info",
          title: "Agent Info",
          icon: Users,
          collapsible: true,
          defaultExpanded: true,
          fields: [
            {
              label: "Agent Name",
              value: selectedActivityRecord?.agent || "N/A",
            },
          ],
        },
      ]}
    />
  );
}
