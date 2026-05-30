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
  sidebarMarginTop?: number;
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
  sidebarMarginTop = 0,
}: ActivityHistorySidebarPanelProps) {
  if (!showActivitySidebar) return null;

  const stageProgressCustomContent: React.ReactNode = (() => {
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
          {[
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
          ].map((stage, idx) => {
            const isCompleted = idx < currentStageIndex;
            const isCurrent = idx === currentStageIndex;

            let circleBackground: string;
            if (isCurrent) {
              circleBackground = `linear-gradient(135deg, ${stage.color} 0%, ${stage.color}dd 100%)`;
            } else if (isCompleted) {
              circleBackground = stage.color;
            } else {
              circleBackground = "#e3e8ef";
            }

            let circleBoxShadow: string;
            if (isCurrent) {
              circleBoxShadow = `0 8px 24px ${stage.color}66`;
            } else if (isCompleted) {
              circleBoxShadow = `0 4px 12px ${stage.color}44`;
            } else {
              circleBoxShadow = "none";
            }

            let stageLabelColor: string;
            if (isCurrent) {
              stageLabelColor = stage.color;
            } else if (isCompleted) {
              stageLabelColor = "#374151";
            } else {
              stageLabelColor = "#9ca3af";
            }

            return (
              <div
                key={stage.name}
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
          })}
        </div>
      </div>
    );
  })();

  return (
    <GenericSidebar
      sidebarMarginTop={sidebarMarginTop}
      width={typeof window !== "undefined" && window.innerWidth < 1280 ? "360px" : "420px"}
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
