import type { Dispatch, SetStateAction } from "react";
import { toast } from "react-toastify";
import { DownloadCallRecording } from "@utils/calls";

export interface DownloadRecordingDeps {
  setDownloadingRecordings: Dispatch<SetStateAction<Set<string>>>;
  setDownloadProgress: Dispatch<SetStateAction<Record<string, number>>>;
}

export async function downloadCallRecordingWithProgress(
  recording: { Id: string; AgentExtension: string; imagicle?: string },
  deps: DownloadRecordingDeps,
): Promise<void> {
  const { Id, AgentExtension } = recording;
  const { setDownloadingRecordings, setDownloadProgress } = deps;

  setDownloadingRecordings((prev) => new Set(prev).add(Id));
  setDownloadProgress((prev) => ({ ...prev, [Id]: 0 }));

  const removeTracking = () => {
    setDownloadingRecordings((prev) => {
      const next = new Set(prev);
      next.delete(Id);
      return next;
    });
    setDownloadProgress((prev) => {
      const next = { ...prev };
      delete next[Id];
      return next;
    });
  };

  try {
    const progressInterval = setInterval(() => {
      setDownloadProgress((prev) => {
        const current = prev[Id] || 0;
        if (current < 90) {
          return { ...prev, [Id]: current + Math.random() * 15 };
        }
        return prev;
      });
    }, 200);

    await DownloadCallRecording(
      Id,
      AgentExtension,
      "call-logs/recordings/download",
      recording.imagicle,
    );

    clearInterval(progressInterval);
    setDownloadProgress((prev) => ({ ...prev, [Id]: 100 }));

    setTimeout(removeTracking, 1000);
  } catch (error) {
    console.error("Download error:", error);
    toast.error("Download failed");
    removeTracking();
  }
}
