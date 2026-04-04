import { toast } from "react-toastify";

interface CrmUploadSuccessCallbacks {
  setSuccessModalTitle: (v: string) => void;
  setSuccessModalDescription: (v: string) => void;
  setShowSuccessfulModal: (v: boolean) => void;
}

export function handleCrmListUploadResponse(
  response: any,
  entityName: string,
  callbacks: CrmUploadSuccessCallbacks,
): boolean {
  const responseData = response?.data || {};
  const processedCount: number = responseData.processed_count || 0;
  const validationFailures: number = responseData.validation_failures || 0;

  if (processedCount > 0) {
    let msg = `Successfully processed ${processedCount} record${
      processedCount === 1 ? "" : "s"
    }`;
    if (validationFailures > 0) {
      msg += ` with ${validationFailures} validation failure${
        validationFailures === 1 ? "" : "s"
      }`;
    }
    callbacks.setSuccessModalTitle("Upload Successful");
    callbacks.setSuccessModalDescription(msg);
    callbacks.setShowSuccessfulModal(true);
    return true;
  }

  if (validationFailures > 0) {
    toast.error(
      `Upload failed: All ${validationFailures} record${
        validationFailures === 1 ? "" : "s"
      } failed validation`,
    );
    return false;
  }

  toast.error(`Upload completed but no ${entityName} were processed`);
  return false;
}
