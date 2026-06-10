import { useCallback, useEffect, useState } from "react";
import type { WorkloadTaskCard } from "@utils/tasks";
import {
  readWorkloadMainViewPreference,
  writeWorkloadMainViewPreference,
} from "@page-modules/planner/workload/workloadDomain";
import type { WorkloadBoardDropIntent } from "./WorkloadBoardPanel";
import type { WorkloadSelectedCellState } from "./workloadPlannerPageHelpers";
import { getOnboardingStatus } from "./workloadOnboarding";
import { startWorkloadTour, getGridTourSeen, getBoardTourSeen } from "./useWorkloadTour";

type MainView = "grid" | "board";

export function useWorkloadPlannerPageUiState() {
  const [mainView, setMainView] = useState<MainView>(() =>
    readWorkloadMainViewPreference(),
  );
  const [reassignOverloadConfirm, setReassignOverloadConfirm] = useState(false);
  const [selectedCell, setSelectedCell] =
    useState<WorkloadSelectedCellState>(null);
  const [showUnassigned, setShowUnassigned] = useState(false);
  const [assignTargets, setAssignTargets] = useState<Record<number, string>>({});
  const [reassignTask, setReassignTask] = useState<WorkloadTaskCard | null>(null);
  const [reassignTarget, setReassignTarget] = useState("");
  const [rescheduleTask, setRescheduleTask] = useState<WorkloadTaskCard | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [overloadSecondStep, setOverloadSecondStep] = useState(false);
  const [boardDropIntent, setBoardDropIntent] =
    useState<WorkloadBoardDropIntent | null>(null);
  const [boardDropOverload, setBoardDropOverload] = useState(false);
  const [showWorkloadPerDay, setShowWorkloadPerDay] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(
    () => !getOnboardingStatus(),
  );
  const [useMockData, setUseMockData] = useState(false);
  const [showBoardHint, setShowBoardHint] = useState(true);

  useEffect(() => {
    writeWorkloadMainViewPreference(mainView);
  }, [mainView]);

  useEffect(() => {
    const originalScrollbar = document.body.style.paddingRight;
    const observer = new MutationObserver(() => {
      if (document.body.classList.contains("modal-open")) {
        document.body.style.paddingRight = "0px";
      }
    });
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class", "style"],
    });
    return () => {
      observer.disconnect();
      document.body.style.paddingRight = originalScrollbar;
    };
  }, []);

  const handleOnboardingComplete = useCallback((choice: "sample" | "fresh" | null) => {
    if (choice === "sample") {
      setUseMockData(true);
      setTimeout(() => startWorkloadTour("grid", () => {}), 600);
    }
    setShowOnboarding(false);
  }, []);

  const handleMainViewChange = useCallback((view: MainView) => {
    setMainView(view);
    writeWorkloadMainViewPreference(view);
    if (view === "board" && !getBoardTourSeen()) {
      setTimeout(() => startWorkloadTour("board", () => {}), 600);
    }
    if (view === "grid" && !getGridTourSeen()) {
      setTimeout(() => startWorkloadTour("grid", () => {}), 600);
    }
  }, []);

  const openReschedule = useCallback(
    (task: WorkloadTaskCard) => {
      setRescheduleTask(task);
      const d = task.due_date?.slice(0, 10) ?? selectedCell?.date ?? "";
      setRescheduleDate(d);
      setOverloadSecondStep(false);
    },
    [selectedCell?.date],
  );

  return {
    mainView,
    reassignOverloadConfirm,
    setReassignOverloadConfirm,
    selectedCell,
    setSelectedCell,
    showUnassigned,
    setShowUnassigned,
    assignTargets,
    setAssignTargets,
    reassignTask,
    setReassignTask,
    reassignTarget,
    setReassignTarget,
    rescheduleTask,
    setRescheduleTask,
    rescheduleDate,
    setRescheduleDate,
    overloadSecondStep,
    setOverloadSecondStep,
    boardDropIntent,
    setBoardDropIntent,
    boardDropOverload,
    setBoardDropOverload,
    showWorkloadPerDay,
    setShowWorkloadPerDay,
    showOnboarding,
    useMockData,
    setUseMockData,
    showBoardHint,
    setShowBoardHint,
    handleOnboardingComplete,
    handleMainViewChange,
    openReschedule,
  };
}
