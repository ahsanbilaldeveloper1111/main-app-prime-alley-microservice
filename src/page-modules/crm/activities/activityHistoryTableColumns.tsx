import React from "react";
import { Badge } from "react-bootstrap";
import moment from "moment";
import type { TableColumn } from "@components/GenericTable";
import {
  GlobalDateFormat,
  GlobalTimeFormat,
  convertDateTimeWithOffsetToLocal,
} from "@utils/Helper";
import { getInitials, getRandomColor } from "@utils/crmNameAvatar";
import type { ActivityRecord } from "./activityHistoryPageTypes";
import { getActivityTypeBadgeBg } from "./activityHistoryBadges";

export function getActivityHistoryTableColumns(): TableColumn<ActivityRecord>[] {
  return [
    {
      key: "customer",
      label: "Record Name",
      type: "multi-field",
      sortable: true,
      fields: {
        primary: "customer",
        secondary: "tags",
        secondaryClass: "text-muted small",
      },
      render: (row) => (
        <div>
          <div className="fw-semibold text-dark">{row.customer}</div>
          {row.tags && row.tags.length > 0 && (
            <div className="mt-1">
              {row.tags.map((tag: string, idx: number) => (
                <Badge
                  key={idx}
                  bg="light"
                  text="dark"
                  className="me-1"
                  style={{ fontSize: "0.7rem" }}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "agent",
      label: "Agent",
      type: "avatar",
      sortable: true,
      avatar: {
        getInitials: (row) => getInitials(row.agent),
        getColor: (row) => getRandomColor(row.agent),
      },
      emptyValue: "N/A",
    },
    {
      key: "lastActivity",
      label: "Last Activity",
      type: "date",
      sortable: true,
      render: (row) => (
        <div className="small text-uppercase">
          {row.dateTime ? moment(row.dateTime).format(GlobalDateFormat) : "-"}
          <div className="text-muted">
            {row.dateTime
              ? convertDateTimeWithOffsetToLocal(
                  row.dateTime,
                  undefined,
                  GlobalTimeFormat,
                )
              : ""}
          </div>
        </div>
      ),
    },
    {
      key: "type",
      label: "Type",
      type: "badge",
      sortable: true,
      render: (row) => (
        <Badge bg={getActivityTypeBadgeBg(row.type)}>{row.type}</Badge>
      ),
    },
    {
      key: "stage",
      label: "Stage",
      type: "text",
      sortable: false,
      render: (row) => <div className="small fw-semibold">{row.stage}</div>,
    },
  ];
}
