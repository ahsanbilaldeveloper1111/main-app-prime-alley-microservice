import type { FloatingBarControllerDevice, FloatingBarCtiCall } from "./globalFloatingCallBarHelpers";

export type FloatingBarCtiResult = { success: boolean; error?: unknown };

export async function runFloatingBarCtiOperation(
  setBusy: (v: boolean) => void,
  operation: () => Promise<FloatingBarCtiResult>,
  logLabel: string,
): Promise<void> {
  setBusy(true);
  try {
    const result = await operation();
    if (!result.success) {
      console.error(`[GlobalFloatingCallBar] ${logLabel} failed:`, result.error);
    }
  } catch (error) {
    console.error(`[GlobalFloatingCallBar] ${logLabel} error:`, error);
  } finally {
    setBusy(false);
  }
}

export function buildFloatingBarSignedCallPayload(
  activeCall: FloatingBarCtiCall,
  controller: FloatingBarControllerDevice,
) {
  return {
    callId: activeCall.callId!,
    callingAddress: activeCall.callingAddress!,
    calledAddress: activeCall.calledAddress || activeCall.number,
    callingDeviceType: activeCall.callingDeviceType || "SOFT_HARD",
    callingDeviceName: activeCall.callingDeviceName || "WebCTI",
    controllerAddress: controller.controllerAddress,
    controllerDeviceName: controller.controllerDeviceName,
    controllerDeviceType: controller.controllerDeviceType,
  };
}
