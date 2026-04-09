import { useMemo } from "react";
import { toast } from "react-toastify";
import {
  Calendar,
  Mail,
  MessageCircle,
  MessageSquare,
  MoreHorizontal,
  Phone,
} from "lucide-react";

type SidebarActivityModalsSlice = {
  openWhatsApp: () => void;
  openSms: () => void;
  openMeeting: () => void;
  openEmail: () => void;
};

export type UseCrmQuotesListSidebarQuickActionsParams = {
  sidebarRecordPhone: string | null | undefined;
  sidebarRecordEmail: string | null | undefined;
  sidebarRecordName: string | null | undefined;
  sidebarRecordId: number | null | undefined;
  sidebarActivityModals: SidebarActivityModalsSlice;
  dialNumber: (phoneNumber: string) => Promise<unknown>;
  isInitialized: boolean;
};

export function useCrmQuotesListSidebarQuickActions(
  params: UseCrmQuotesListSidebarQuickActionsParams,
) {
  const {
    sidebarRecordPhone,
    sidebarRecordEmail,
    sidebarRecordName,
    sidebarActivityModals,
    dialNumber,
    isInitialized,
    sidebarRecordId,
  } = params;

  return useMemo(() => {
    const hasPhone = !!String(sidebarRecordPhone || "").trim();
    const hasEmail = !!String(sidebarRecordEmail || "").trim();
    return [
      {
        id: "qa-call",
        label: "Call",
        icon: Phone,
        onClick: () => {
          const phone = String(sidebarRecordPhone || "").trim();
          if (!phone) {
            toast.error("No phone number available for this entry");
            return;
          }
          if (!isInitialized) {
            toast.error("CTI not initialized. Please wait...");
            return;
          }
          dialNumber(phone)
            .then((result: any) => {
              if (result?.success) {
                toast.success(`Calling ${sidebarRecordName || phone}...`);
              } else {
                toast.error(result?.error || "Failed to make call");
              }
            })
            .catch((error: unknown) => {
              console.error("Call error:", error);
              toast.error("Failed to make call");
            });
        },
        disabled: !hasPhone,
      },
      {
        id: "qa-whatsapp",
        label: "WhatsApp",
        icon: MessageCircle,
        onClick: () => sidebarActivityModals.openWhatsApp(),
        disabled: !hasPhone,
      },
      {
        id: "qa-sms",
        label: "SMS",
        icon: MessageSquare,
        onClick: () => sidebarActivityModals.openSms(),
        disabled: !hasPhone,
      },
      {
        id: "qa-meeting",
        label: "Meeting",
        icon: Calendar,
        onClick: () => sidebarActivityModals.openMeeting(),
      },
      {
        id: "qa-email",
        label: "Email",
        icon: Mail,
        onClick: () => sidebarActivityModals.openEmail(),
        disabled: !hasEmail,
      },
      {
        id: "more",
        label: "More",
        icon: MoreHorizontal,
        onClick: () => {
          // GenericSidebar opens its built-in "More" submenu (Deals/Leads parity).
        },
        disabled: false,
      },
    ];
  }, [
    dialNumber,
    isInitialized,
    sidebarActivityModals,
    sidebarRecordEmail,
    sidebarRecordId,
    sidebarRecordName,
    sidebarRecordPhone,
  ]);
}
