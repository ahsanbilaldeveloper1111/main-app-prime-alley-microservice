import type { AxiosInstance } from "axios";

export const CTI_STOMP_PUBLISH_RETRY_DELAYS_MS = [0, 400, 800, 1200];

/** POST /cti-stomp-stream with retry when server reports no active STOMP connection. */
export async function publishCtiStompStreamMessageWithRetry(
  axiosInstance: AxiosInstance,
  params: {
    token: string;
    userAddress: string;
    destination: string;
    body: string;
    screenId: string;
  },
  retry = true,
): Promise<boolean> {
  const delays = CTI_STOMP_PUBLISH_RETRY_DELAYS_MS;

  const doPost = async () => {
    const response = await axiosInstance.post("/cti-stomp-stream", {
      token: params.token,
      userAddress: params.userAddress,
      destination: params.destination,
      body: params.body,
      screenId: params.screenId,
    });
    return response.data.success === true;
  };

  for (
    let attempt = 0;
    attempt < (retry ? delays.length : 1);
    attempt++
  ) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, delays[attempt]));
    }
    try {
      return await doPost();
    } catch (error: unknown) {
      const errMsg =
        (error as { response?: { data?: { error?: unknown } } })?.response?.data
          ?.error ?? "";
      const isNoConnection =
        typeof errMsg === "string" &&
        errMsg.includes("No active STOMP connection");
      if (!retry || !isNoConnection || attempt === delays.length - 1) {
        return false;
      }
    }
  }
  return false;
}
