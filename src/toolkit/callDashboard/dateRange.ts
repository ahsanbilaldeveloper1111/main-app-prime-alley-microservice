import moment from "moment";

export const DATETIME_LOCAL_SHORT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

export interface CallDashboardFilters {
  start_datetime: string;
  end_datetime: string;
}

export function getInitialCallDashboardFilters(): CallDashboardFilters {
  const now = moment();
  const startLocal = now.clone().startOf("day");
  const endLocal = now.clone();
  return {
    start_datetime: startLocal.utc().format("YYYY-MM-DDTHH:mm:ss") + "Z",
    end_datetime: endLocal.utc().format("YYYY-MM-DDTHH:mm:ss") + "Z",
  };
}

export function formatDateRangeToUtc(
  startLocal: string,
  endLocal: string,
): CallDashboardFilters {
  let startMoment;
  if (startLocal && DATETIME_LOCAL_SHORT.exec(startLocal)) {
    const dateTimeStr = startLocal + ":00";
    const [datePart, timePart] = dateTimeStr.split("T");
    const [year, month, day] = datePart.split("-").map(Number);
    const [hour, minute, second] = timePart.split(":").map(Number);
    startMoment = moment([year, month - 1, day, hour, minute, second]);
  } else {
    startMoment = moment(startLocal || undefined).startOf("day");
  }
  let endMoment;
  if (endLocal && DATETIME_LOCAL_SHORT.exec(endLocal)) {
    const timePart = endLocal.split("T")[1];
    const seconds = timePart === "23:59" ? "59" : "00";
    const dateTimeStr = endLocal + ":" + seconds;
    const [datePart, timePartFull] = dateTimeStr.split("T");
    const [year, month, day] = datePart.split("-").map(Number);
    const [hour, minute, second] = timePartFull.split(":").map(Number);
    endMoment = moment([year, month - 1, day, hour, minute, second]);
  } else {
    endMoment = moment(endLocal || undefined).endOf("day");
  }
  return {
    start_datetime: startMoment.utc().format("YYYY-MM-DDTHH:mm:ss") + "Z",
    end_datetime: endMoment.utc().format("YYYY-MM-DDTHH:mm:ss") + "Z",
  };
}
