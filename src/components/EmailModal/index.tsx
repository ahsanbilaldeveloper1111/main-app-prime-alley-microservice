import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  Maximize2,
  X,
  Link,
  Image,
  Paperclip,
  Sparkles,
} from "lucide-react";
import { toast } from "react-toastify";
import { SenderSelectField } from "@components/messaging/SenderSelectField";
import {
  formatEmailSenderLabel,
  useSendableEmailSenders,
} from "@hooks/messaging/useSendableMessagingSenders";
import { generateEmail } from "@utils/communication";
import {
  buildFollowUpTaskFields,
  buildIn3BusinessDaysLabel,
} from "@utils/crmFollowUpTaskDue";

/** Normalize recipient to array (single string or array of strings). */
function normalizeRecipientEmails(v?: string | string[]): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.map((e) => String(e).trim()).filter(Boolean);
  return String(v)
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
}

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Single email, comma-separated string, or array of emails */
  recipientEmail?: string | string[];
  recipientName?: string;
  senderEmail?: string;
  senderName?: string;
  /** Optional context for AI generation (e.g. lead, deal, order from CRM). */
  contextPayload?: { lead?: unknown; deal?: unknown; order?: unknown };
  onSend: (emailData: {
    to: string[];
    cc: string[];
    bcc: string[];
    subject: string;
    body: string;
    createFollowUpTask: boolean;
    followUpTaskDueDate: string | null;
    followUpTaskDueTime: string | null;
    attachments?: File[];
    emailSenderId?: number;
  }) => void | Promise<void>;
  /** When true (default), user must pick a verified tenant sender before sending. */
  requireTenantSender?: boolean;
}

/** Extract HTML from content (strip markdown code fence if present). */
function getEmailPreviewHtml(content: string | undefined): string {
  if (!content || typeof content !== "string") return "";
  const raw = content.trim();
  const htmlMatch =
    raw.match(/^```html?\s*([\s\S]*?)```$/im) ??
    raw.match(/^```\s*([\s\S]*?)```$/im);
  return htmlMatch ? htmlMatch[1].trim() : raw;
}

function getMissingTenantSenderMessage(
  requireTenantSender: boolean,
  selectedId: number | null,
): string | null {
  if (!requireTenantSender || selectedId != null) {
    return null;
  }
  return "No verified email sender is available. Register one in Settings → Communications → Email.";
}

function optionalEmailSenderId(
  requireTenantSender: boolean,
  selectedId: number | null,
): { emailSenderId?: number } {
  if (!requireTenantSender || selectedId == null) {
    return {};
  }
  return { emailSenderId: selectedId };
}

function useEmailModalSenders(isOpen: boolean, requireTenantSender: boolean) {
  const emailSendersState = useSendableEmailSenders(isOpen && requireTenantSender);
  const emailSenderOptions = useMemo(
    () =>
      emailSendersState.senders.map((sender) => ({
        id: sender.id,
        label: formatEmailSenderLabel(sender),
      })),
    [emailSendersState.senders],
  );

  return { emailSendersState, emailSenderOptions };
}

type EmailModalFromFieldProps = Readonly<{
  requireTenantSender: boolean;
  senderName: string;
  senderEmail: string;
  emailSenderOptions: Array<{ id: number; label: string }>;
  selectedId: number | null;
  onSelectedIdChange: (id: number) => void;
  isLoading: boolean;
  isEmpty: boolean;
}>;

function EmailModalFromField({
  requireTenantSender,
  senderName,
  senderEmail,
  emailSenderOptions,
  selectedId,
  onSelectedIdChange,
  isLoading,
  isEmpty,
}: EmailModalFromFieldProps) {
  if (requireTenantSender) {
    return (
      <SenderSelectField
        label="From"
        options={emailSenderOptions}
        value={selectedId}
        onChange={onSelectedIdChange}
        isLoading={isLoading}
        isEmpty={isEmpty}
        emptyMessage="No verified email senders. Add one in Settings → Communications → Email."
        settingsHref="/main-settings/communications/email"
      />
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
      <span style={{ fontSize: "14px", fontWeight: 600, color: "#141414" }}>From</span>
      <span style={{ fontSize: "14px", color: "#141414" }}>
        {senderName} ({senderEmail})
      </span>
    </div>
  );
}

const EmailModal: React.FC<EmailModalProps> = ({
  isOpen,
  onClose,
  recipientEmail,
  recipientName,
  senderEmail = "user@example.com",
  senderName = "Your Name",
  contextPayload,
  onSend,
  requireTenantSender = true,
}) => {
  const { emailSendersState, emailSenderOptions } = useEmailModalSenders(
    isOpen,
    requireTenantSender,
  );

  const initialTo = useMemo(
    () => normalizeRecipientEmails(recipientEmail),
    [recipientEmail],
  );
  const [toEmails, setToEmails] = useState<string[]>(initialTo);
  const [ccEmails, setCcEmails] = useState<string[]>([]);
  const [bccEmails, setBccEmails] = useState<string[]>([]);
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [subject, setSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [isMaximized, setIsMaximized] = useState(false);
  const [currentToInput, setCurrentToInput] = useState("");
  const [currentCcInput, setCurrentCcInput] = useState("");
  const [currentBccInput, setCurrentBccInput] = useState("");
  const [createTask, setCreateTask] = useState(false);
  const [sendLoading, setSendLoading] = useState(false);
  const [sendValidationMessage, setSendValidationMessage] = useState("");
  const [confirmSendWithoutSubject, setConfirmSendWithoutSubject] =
    useState(false);
  const [activityDate, setActivityDate] = useState(() =>
    buildIn3BusinessDaysLabel(),
  );
  const [activityTime, setActivityTime] = useState(() =>
    new Date().toTimeString().slice(0, 5),
  );
  const [customDate, setCustomDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [customTime, setCustomTime] = useState(() =>
    new Date().toTimeString().slice(0, 5),
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initialToRef = useRef(initialTo);
  const wasOpenRef = useRef(isOpen);

  // Generate email (AI) state – same options as EmailSection
  const [generatePrompt, setGeneratePrompt] = useState("");
  const [generateTone, setGenerateTone] = useState("professional");
  const [emailStyle, setEmailStyle] = useState("modern");
  const [emailLength, setEmailLength] = useState("medium");
  const [urgency, setUrgency] = useState("normal");
  const [industry, setIndustry] = useState("");
  const [customIndustry, setCustomIndustry] = useState("");
  const [language, setLanguage] = useState("en");
  const [customLanguage, setCustomLanguage] = useState("");
  const [ctaType, setCtaType] = useState("");
  const [customCtaType, setCustomCtaType] = useState("");
  const [generateLoading, setGenerateLoading] = useState(false);
  const [showToneDropdown, setShowToneDropdown] = useState(false);
  const bodyEditorRef = useRef<HTMLTextAreaElement>(null);
  const bodySetByGenerateRef = useRef(false);
  const moreFormattingRef = useRef<HTMLDivElement>(null);
  const [showMoreFormattingDropdown, setShowMoreFormattingDropdown] =
    useState(false);
  const [showStyleDropdown, setShowStyleDropdown] = useState(false);
  const [showLengthDropdown, setShowLengthDropdown] = useState(false);
  const [showUrgencyDropdown, setShowUrgencyDropdown] = useState(false);
  const [showIndustryDropdown, setShowIndustryDropdown] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [showCtaDropdown, setShowCtaDropdown] = useState(false);
  const optionsPanelRef = useRef<HTMLDivElement>(null);

  const dateOptions = [
    "Today",
    "Tomorrow",
    buildIn3BusinessDaysLabel(),
    "In 1 week",
    "In 2 weeks",
    "In 1 month",
    "Custom...",
  ];

  useEffect(() => {
    const next = normalizeRecipientEmails(recipientEmail);
    if (next.length > 0) {
      setToEmails((prev) =>
        next.some((e) => !prev.includes(e)) ? next : prev,
      );
    }
  }, [recipientEmail]);

  useEffect(() => {
    initialToRef.current = initialTo;
  }, [initialTo]);

  // When we set body from Generate, update the contenteditable div
  useEffect(() => {
    if (!bodySetByGenerateRef.current || !bodyEditorRef.current) return;
    bodyEditorRef.current.value = emailBody;
    bodySetByGenerateRef.current = false;
  }, [emailBody]);

  useEffect(() => {
    if (isOpen && bodyEditorRef.current) {
      bodyEditorRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        optionsPanelRef.current &&
        !optionsPanelRef.current.contains(event.target as Node)
      ) {
        setShowToneDropdown(false);
        setShowStyleDropdown(false);
        setShowLengthDropdown(false);
        setShowUrgencyDropdown(false);
        setShowIndustryDropdown(false);
        setShowLanguageDropdown(false);
        setShowCtaDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!showMoreFormattingDropdown) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        moreFormattingRef.current &&
        !moreFormattingRef.current.contains(e.target as Node)
      ) {
        setShowMoreFormattingDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMoreFormattingDropdown]);

  // Reset state when modal is closed (mirrors NotesModal behavior, including attachments)
  useEffect(() => {
    const wasOpen = wasOpenRef.current;
    wasOpenRef.current = isOpen;
    if (wasOpen && !isOpen) {
      setToEmails(initialToRef.current);
      setCcEmails([]);
      setBccEmails([]);
      setShowCc(false);
      setShowBcc(false);
      setSubject("");
      setEmailBody("");
      if (bodyEditorRef.current) {
        bodyEditorRef.current.value = "";
      }
      setCreateTask(false);
      setIsMaximized(false);
      setAttachments([]);
      const now = new Date();
      const today = now.toISOString().slice(0, 10);
      const timeStr = now.toTimeString().slice(0, 5);
      setActivityDate(buildIn3BusinessDaysLabel());
      setActivityTime(timeStr);
      setCustomDate(today);
      setCustomTime(timeStr);
      setShowDatePicker(false);
    }
  }, [isOpen]);

  const handleGenerateEmail = async () => {
    const query = generatePrompt.trim();
    if (!query) return;
    setGenerateLoading(true);
    try {
      const res = await generateEmail({
        query,
        tone: generateTone,
        urgency,
        industry: industry === "custom" ? customIndustry : industry,
        language: language === "custom" ? customLanguage : language,
        cta_type: ctaType === "custom" ? customCtaType : ctaType,
        email_style: emailStyle,
        email_length: emailLength,
        ...((bodyEditorRef.current?.value?.trim() || emailBody) && {
          previous_content:
            bodyEditorRef.current?.value?.trim() || emailBody,
        }),
        ...(contextPayload?.lead != null && { lead: contextPayload.lead }),
        ...(contextPayload?.deal != null && { deal: contextPayload.deal }),
        ...(contextPayload?.order != null && { order: contextPayload.order }),
      });
      const raw = (res.result ?? "").trim();
      const html = raw ? getEmailPreviewHtml(raw) || raw : "";
      if (html) {
        bodySetByGenerateRef.current = true;
        setEmailBody(html);
      }
    } catch {
      // keep existing body on error
    } finally {
      setGenerateLoading(false);
    }
  };

  // Options matching EmailSection / CommonOptionsFields
  const TONE_OPTIONS = [
    { value: "professional", label: "Professional" },
    { value: "casual", label: "Casual" },
    { value: "friendly", label: "Friendly" },
    { value: "empathetic", label: "Empathetic" },
    { value: "urgent", label: "Urgent" },
    { value: "persuasive", label: "Persuasive" },
  ];
  const EMAIL_STYLE_OPTIONS = [
    { value: "modern", label: "Modern" },
    { value: "corporate", label: "Corporate" },
    { value: "minimal", label: "Minimal" },
    { value: "promotional", label: "Promotional" },
  ];
  const EMAIL_LENGTH_OPTIONS = [
    { value: "brief", label: "Brief" },
    { value: "medium", label: "Medium" },
    { value: "detailed", label: "Detailed" },
  ];
  const URGENCY_OPTIONS = [
    { value: "low", label: "Low" },
    { value: "normal", label: "Normal" },
    { value: "high", label: "High" },
    { value: "critical", label: "Critical" },
  ];
  const INDUSTRY_OPTIONS = [
    { value: "", label: "Select" },
    { value: "real_estate", label: "Real Estate" },
    { value: "sass", label: "Banking" },
    { value: "health_care", label: "Education" },
    { value: "ecommerce", label: "Ecommerce" },
    { value: "healthcare", label: "Healthcare" },
    { value: "retail", label: "Retail" },
    { value: "technology", label: "Technology" },
    { value: "custom", label: "Custom" },
  ];
  const LANGUAGE_OPTIONS = [
    { value: "en", label: "English" },
    { value: "es", label: "Spanish" },
    { value: "hi", label: "Hindi" },
    { value: "ur", label: "Urdu" },
    { value: "it", label: "Italian" },
    { value: "pt", label: "Japanese" },
    { value: "ru", label: "Russian" },
    { value: "zh", label: "Chinese" },
    { value: "custom", label: "Custom" },
  ];
  const CTA_OPTIONS = [
    { value: "", label: "Select" },
    { value: "schedule_call", label: "Schedule call" },
    { value: "visit_website", label: "Visit website" },
    { value: "book_demo", label: "Book demo" },
    { value: "start_trial", label: "Start trial" },
    { value: "make_payment", label: "Make payment" },
    { value: "custom", label: "Custom" },
  ];

  const renderDropdown = (
    label: string,
    value: string,
    options: Array<{ value: string; label: string }>,
    show: boolean,
    setShow: (s: boolean) => void,
    onChange: (v: string) => void,
    displayLabel?: string,
  ) => {
    const display =
      displayLabel ??
      options.find((o) => o.value === value)?.label ??
      (value || "Select");
    return (
      <div key={label} style={{ position: "relative" }}>
        <label
          style={{
            fontSize: "12px",
            fontWeight: "600",
            color: "#718096",
            display: "block",
            marginBottom: "4px",
          }}
        >
          {label}
        </label>
        <button
          type="button"
          onClick={() => setShow(!show)}
          style={{
            width: "100%",
            minWidth: "100px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "6px",
            padding: "6px 10px",
            border: "1px solid #e2e8f0",
            borderRadius: "6px",
            fontSize: "13px",
            color: "#141414",
            backgroundColor: "#fff",
            cursor: "pointer",
          }}
        >
          <span
            style={{
              textOverflow: "ellipsis",
              overflow: "hidden",
              whiteSpace: "nowrap",
            }}
          >
            {display}
          </span>
          <ChevronDown size={14} />
        </button>
        {show && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              marginTop: "2px",
              backgroundColor: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: "6px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              zIndex: 20,
              maxHeight: "200px",
              overflowY: "auto",
            }}
          >
            {options.map((opt) => (
              <button
                key={opt.value || "empty"}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setShow(false);
                }}
                style={{
                  width: "100%",
                  padding: "6px 10px",
                  border: "none",
                  background: "none",
                  fontSize: "13px",
                  color: "#141414",
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  const handleMaximize = () => {
    setIsMaximized(!isMaximized);
  };

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const emailStateByType = {
    to: {
      emails: toEmails,
      setEmails: setToEmails,
      currentInput: currentToInput,
      setCurrentInput: setCurrentToInput,
    },
    cc: {
      emails: ccEmails,
      setEmails: setCcEmails,
      currentInput: currentCcInput,
      setCurrentInput: setCurrentCcInput,
    },
    bcc: {
      emails: bccEmails,
      setEmails: setBccEmails,
      currentInput: currentBccInput,
      setCurrentInput: setCurrentBccInput,
    },
  } as const;

  const addEmail = (email: string, type: "to" | "cc" | "bcc") => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) return;

    if (!emailRegex.test(trimmedEmail)) {
      setSendValidationMessage("Please enter a valid email address.");
      return;
    }

    const { setEmails, setCurrentInput } = emailStateByType[type];

    setEmails((prev) =>
      prev.includes(trimmedEmail) ? prev : [...prev, trimmedEmail],
    );
    setCurrentInput("");
    setSendValidationMessage("");
  };

  const removeEmail = (email: string, type: "to" | "cc" | "bcc") => {
    const { setEmails } = emailStateByType[type];
    setEmails((prev) => prev.filter((e) => e !== email));
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    type: "to" | "cc" | "bcc",
  ) => {
    if (e.key === "Enter" || e.key === "," || e.key === " ") {
      e.preventDefault();
      const { currentInput } = emailStateByType[type];
      addEmail(currentInput, type);
    }
  };

  const syncBodyFromEditor = () => {
    if (bodyEditorRef.current) setEmailBody(bodyEditorRef.current.value ?? "");
  };

  const wrapTextareaSelection = (before: string, after: string) => {
    const el = bodyEditorRef.current;
    if (!el) return;
    el.focus();
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const text = el.value ?? "";
    const selected = text.slice(start, end);
    const next = `${text.slice(0, start)}${before}${selected}${after}${text.slice(end)}`;
    el.value = next;
    const nextStart = start + before.length;
    const nextEnd = nextStart + selected.length;
    el.setSelectionRange(nextStart, nextEnd);
    syncBodyFromEditor();
  };

  const handleBold = () => wrapTextareaSelection("<strong>", "</strong>");
  const handleItalic = () => wrapTextareaSelection("<em>", "</em>");
  const handleUnderline = () => wrapTextareaSelection("<u>", "</u>");
  const handleLink = () => {
    const url =
      globalThis.window?.prompt?.("Enter URL:", "https://") ?? "https://";
    wrapTextareaSelection(`<a href="${url}">`, "</a>");
  };
  const handleImage = () => {
    const url =
      globalThis.window?.prompt?.("Enter image URL:", "https://") ?? "https://";
    wrapTextareaSelection(`<img src="${url}" alt="">`, "");
  };
  const handleList = () => wrapTextareaSelection("<ul><li>", "</li></ul>");
  const handleCode = () => wrapTextareaSelection("<code>", "</code>");

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) {
      return;
    }
    const blockedExt = new Set([
      ".exe",
      ".msi",
      ".bat",
      ".cmd",
      ".com",
      ".ps1",
      ".vbs",
      ".js",
      ".jar",
    ]);
    const allowed: File[] = [];
    const blocked: File[] = [];
    for (const f of files) {
      const name = String(f?.name ?? "");
      const dot = name.lastIndexOf(".");
      const ext = dot >= 0 ? name.slice(dot).toLowerCase() : "";
      if (ext && blockedExt.has(ext)) {
        blocked.push(f);
      } else {
        allowed.push(f);
      }
    }
    if (blocked.length > 0) {
      toast.error("Executable/script files are not allowed for upload.");
    }
    if (allowed.length > 0) {
      setAttachments((prev) => [...prev, ...allowed]);
    }
    e.target.value = "";
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    setSendValidationMessage("");

    if (toEmails.length === 0) {
      setSendValidationMessage("Please add at least one recipient.");
      return;
    }

    const missingSenderMessage = getMissingTenantSenderMessage(
      requireTenantSender,
      emailSendersState.selectedId,
    );
    if (missingSenderMessage) {
      setSendValidationMessage(missingSenderMessage);
      return;
    }

    if (!subject.trim() && !confirmSendWithoutSubject) {
      setConfirmSendWithoutSubject(true);
      setSendValidationMessage(
        "Subject is empty. Click Send again to continue without a subject.",
      );
      return;
    }
    setConfirmSendWithoutSubject(false);
    const bodyToSend = bodyEditorRef.current?.value?.trim() ?? emailBody;
    const timeForFollowUp =
      activityDate === "Custom..." ? customTime : activityTime;
    const followUp = buildFollowUpTaskFields(
      createTask,
      activityDate,
      customDate,
      timeForFollowUp,
    );
    setSendLoading(true);
    try {
      await onSend({
        to: toEmails,
        cc: ccEmails,
        bcc: bccEmails,
        subject,
        body: bodyToSend,
        ...followUp,
        attachments: attachments.length > 0 ? attachments : undefined,
        ...optionalEmailSenderId(requireTenantSender, emailSendersState.selectedId),
      });
      setToEmails([]);
      setCcEmails([]);
      setBccEmails([]);
      setSubject("");
      setEmailBody("");
      if (bodyEditorRef.current) bodyEditorRef.current.value = "";
      setShowCc(false);
      setShowBcc(false);
      setCreateTask(false);
      setIsMaximized(false);
      const now = new Date();
      const today = now.toISOString().slice(0, 10);
      const timeStr = now.toTimeString().slice(0, 5);
      setActivityDate(buildIn3BusinessDaysLabel());
      setActivityTime(timeStr);
      setCustomDate(today);
      setCustomTime(timeStr);
      setShowDatePicker(false);
      setAttachments([]);
      setSendValidationMessage("");
      setConfirmSendWithoutSubject(false);
      onClose();
    } finally {
      setSendLoading(false);
    }
  };

  return (
    <React.Fragment>
      <button
        type="button"
        aria-label="Close email modal"
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.15)',
          zIndex: 999,
          border: 'none',
          padding: 0,
          margin: 0,
          cursor: 'default',
        }}
      />
      <div
      style={{
        position: "fixed",
        ...(isMaximized
          ? { top: "74px", left: "50%", transform: "translateX(-50%)", width: "min(900px, calc(100vw - 84px))", maxHeight: "calc(100vh - 94px)" }
          : { left: "50%", top: "50%", transform: "translate(-50%, -50%)", width: "min(650px, calc(100vw - 120px))", height: "min(550px, calc(100vh - 120px))"}),
        backgroundColor: "#ffffff",
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 4px 24px rgba(0, 0, 0, 0.15)",
        borderRadius: "8px",
        border: "1px solid #cbd5e0",
        overflow: "hidden",
        animation: "none",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          borderBottom: "1px solid #e2e8f0",
          backgroundColor: "#ffffff",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              color: "#141414",
              padding: "4px",
            }}
          >
            <ChevronDown size={20} style={{ transform: "rotate(90deg)" }} />
          </button>
          <h2
            style={{
              fontSize: "16px",
              fontWeight: "600",
              color: "#141414",
              margin: 0,
            }}
          >
            Email
          </h2>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            onClick={handleMaximize}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "6px",
              color: "#141414",
            }}
            title={isMaximized ? "Restore" : "Maximize"}
          >
            <Maximize2 size={18} />
          </button>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "6px",
              color: "#141414",
            }}
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Email Form */}
      <div style={{ flex: 1, overflowY: "auto", backgroundColor: "#ffffff" }}>
        {/* To Field */}
        <div
          style={{ padding: "12px 20px", borderBottom: "1px solid #e2e8f0" }}
        >
          <div
            style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}
          >
            <label
              style={{
                fontSize: "14px",
                fontWeight: "600",
                color: "#141414",
                minWidth: "60px",
                paddingTop: "8px",
              }}
            >
              To
            </label>
            <div
              style={{
                flex: 1,
                display: "flex",
                flexWrap: "wrap",
                gap: "6px",
                alignItems: "center",
              }}
            >
              {toEmails.map((email) => (
                <span
                  key={email}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "4px 10px",
                    backgroundColor: "#f7fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "16px",
                    fontSize: "13px",
                    color: "#141414",
                  }}
                >
                  {email}
                  <button
                    onClick={() => removeEmail(email, "to")}
                    style={{
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      padding: "0",
                      display: "flex",
                      alignItems: "center",
                      color: "#718096",
                    }}
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
              <input
                type="email"
                value={currentToInput}
                onChange={(e) => setCurrentToInput(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, "to")}
                onBlur={() => currentToInput && addEmail(currentToInput, "to")}
                placeholder={toEmails.length === 0 ? "Enter email address" : ""}
                style={{
                  flex: 1,
                  minWidth: "200px",
                  border: "none",
                  outline: "none",
                  fontSize: "14px",
                  color: "#141414",
                  padding: "6px 0",
                }}
              />
            </div>
          </div>
        </div>

        {/* From Field */}
        <div
          style={{
            padding: "12px 20px",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <EmailModalFromField
            requireTenantSender={requireTenantSender}
            senderName={senderName}
            senderEmail={senderEmail}
            emailSenderOptions={emailSenderOptions}
            selectedId={emailSendersState.selectedId}
            onSelectedIdChange={emailSendersState.setSelectedId}
            isLoading={emailSendersState.isLoading}
            isEmpty={emailSendersState.isEmpty}
          />
          <div style={{ display: "flex", gap: "12px", marginLeft: "auto" }}>
            {!showCc && (
              <button
                onClick={() => setShowCc(true)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "13px",
                  color: "#0091ae",
                  textDecoration: "underline",
                  padding: "0",
                }}
              >
                Cc
              </button>
            )}
            {!showBcc && (
              <button
                onClick={() => setShowBcc(true)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "13px",
                  color: "#0091ae",
                  textDecoration: "underline",
                  padding: "0",
                }}
              >
                Bcc
              </button>
            )}
          </div>
        </div>

        {/* CC Field */}
        {showCc && (
          <div
            style={{ padding: "12px 20px", borderBottom: "1px solid #e2e8f0" }}
          >
            <div
              style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}
            >
              <label
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#141414",
                  minWidth: "60px",
                  paddingTop: "8px",
                }}
              >
                Cc
              </label>
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "6px",
                  alignItems: "center",
                }}
              >
                {ccEmails.map((email) => (
                  <span
                    key={email}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "4px 10px",
                      backgroundColor: "#f7fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: "16px",
                      fontSize: "13px",
                      color: "#141414",
                    }}
                  >
                    {email}
                    <button
                      onClick={() => removeEmail(email, "cc")}
                      style={{
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        padding: "0",
                        display: "flex",
                        alignItems: "center",
                        color: "#718096",
                      }}
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
                <input
                  type="email"
                  value={currentCcInput}
                  onChange={(e) => setCurrentCcInput(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, "cc")}
                  onBlur={() =>
                    currentCcInput && addEmail(currentCcInput, "cc")
                  }
                  placeholder="Enter email address"
                  style={{
                    flex: 1,
                    minWidth: "200px",
                    border: "none",
                    outline: "none",
                    fontSize: "14px",
                    color: "#141414",
                    padding: "6px 0",
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* BCC Field */}
        {showBcc && (
          <div
            style={{ padding: "12px 20px", borderBottom: "1px solid #e2e8f0" }}
          >
            <div
              style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}
            >
              <label
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#141414",
                  minWidth: "60px",
                  paddingTop: "8px",
                }}
              >
                Bcc
              </label>
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "6px",
                  alignItems: "center",
                }}
              >
                {bccEmails.map((email) => (
                  <span
                    key={email}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "4px 10px",
                      backgroundColor: "#f7fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: "16px",
                      fontSize: "13px",
                      color: "#141414",
                    }}
                  >
                    {email}
                    <button
                      onClick={() => removeEmail(email, "bcc")}
                      style={{
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        padding: "0",
                        display: "flex",
                        alignItems: "center",
                        color: "#718096",
                      }}
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
                <input
                  type="email"
                  value={currentBccInput}
                  onChange={(e) => setCurrentBccInput(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, "bcc")}
                  onBlur={() =>
                    currentBccInput && addEmail(currentBccInput, "bcc")
                  }
                  placeholder="Enter email address"
                  style={{
                    flex: 1,
                    minWidth: "200px",
                    border: "none",
                    outline: "none",
                    fontSize: "14px",
                    color: "#141414",
                    padding: "6px 0",
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Subject Field */}
        <div
          style={{ padding: "12px 20px", borderBottom: "1px solid #e2e8f0" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <label
              style={{
                fontSize: "14px",
                fontWeight: "600",
                color: "#141414",
                minWidth: "60px",
              }}
            >
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => {
                const nextSubject = e.target.value;
                setSubject(nextSubject);
                if (nextSubject.trim()) {
                  setConfirmSendWithoutSubject(false);
                  setSendValidationMessage("");
                }
              }}
              placeholder=""
              style={{
                flex: 1,
                border: "none",
                fontSize: "14px",
                color: "#141414",
                padding: "8px 12px",
                borderRadius: "3px",
              }}
            />
          </div>
        </div>

        {/* Generate email: prompt + all options (same as EmailSection) + button */}
        <div
          ref={optionsPanelRef}
          style={{
            padding: "12px 20px",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <label
            style={{ fontSize: "14px", fontWeight: "600", color: "#141414" }}
          >
            Generate email
          </label>
          <input
            type="text"
            value={generatePrompt}
            onChange={(e) => setGeneratePrompt(e.target.value)}
            placeholder="Describe how the email should look..."
            style={{
              width: "100%",
              border: "1px solid #e2e8f0",
              borderRadius: "6px",
              fontSize: "14px",
              color: "#141414",
              padding: "8px 12px",
              outline: "none",
            }}
            onKeyDown={(e) => e.key === "Enter" && handleGenerateEmail()}
          />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
              gap: "10px",
            }}
          >
            {renderDropdown(
              "Tone",
              generateTone,
              TONE_OPTIONS,
              showToneDropdown,
              setShowToneDropdown,
              setGenerateTone,
            )}
            {renderDropdown(
              "Email Style",
              emailStyle,
              EMAIL_STYLE_OPTIONS,
              showStyleDropdown,
              setShowStyleDropdown,
              setEmailStyle,
            )}
            {renderDropdown(
              "Email Length",
              emailLength,
              EMAIL_LENGTH_OPTIONS,
              showLengthDropdown,
              setShowLengthDropdown,
              setEmailLength,
            )}
            {renderDropdown(
              "Urgency",
              urgency,
              URGENCY_OPTIONS,
              showUrgencyDropdown,
              setShowUrgencyDropdown,
              setUrgency,
            )}
            {renderDropdown(
              "Industry",
              industry,
              INDUSTRY_OPTIONS,
              showIndustryDropdown,
              setShowIndustryDropdown,
              setIndustry,
            )}
            {renderDropdown(
              "Language",
              language,
              LANGUAGE_OPTIONS,
              showLanguageDropdown,
              setShowLanguageDropdown,
              setLanguage,
            )}
            {renderDropdown(
              "CTA Type",
              ctaType,
              CTA_OPTIONS,
              showCtaDropdown,
              setShowCtaDropdown,
              setCtaType,
            )}
          </div>
          {industry === "custom" && (
            <div>
              <label
                style={{
                  fontSize: "12px",
                  fontWeight: "600",
                  color: "#718096",
                  display: "block",
                  marginBottom: "4px",
                }}
              >
                Custom Industry
              </label>
              <input
                type="text"
                value={customIndustry}
                onChange={(e) => setCustomIndustry(e.target.value)}
                placeholder="Enter industry"
                style={{
                  width: "100%",
                  padding: "6px 10px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "6px",
                  fontSize: "13px",
                }}
              />
            </div>
          )}
          {language === "custom" && (
            <div>
              <label
                style={{
                  fontSize: "12px",
                  fontWeight: "600",
                  color: "#718096",
                  display: "block",
                  marginBottom: "4px",
                }}
              >
                Custom Language
              </label>
              <input
                type="text"
                value={customLanguage}
                onChange={(e) => setCustomLanguage(e.target.value)}
                placeholder="e.g. en, ar"
                style={{
                  width: "100%",
                  padding: "6px 10px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "6px",
                  fontSize: "13px",
                }}
              />
            </div>
          )}
          {ctaType === "custom" && (
            <div>
              <label
                style={{
                  fontSize: "12px",
                  fontWeight: "600",
                  color: "#718096",
                  display: "block",
                  marginBottom: "4px",
                }}
              >
                Custom CTA
              </label>
              <input
                type="text"
                value={customCtaType}
                onChange={(e) => setCustomCtaType(e.target.value)}
                placeholder="Enter CTA type"
                style={{
                  width: "100%",
                  padding: "6px 10px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "6px",
                  fontSize: "13px",
                }}
              />
            </div>
          )}
          <button
            type="button"
            onClick={handleGenerateEmail}
            disabled={!generatePrompt.trim() || generateLoading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 16px",
              border: "none",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: "600",
              color: "#fff",
              backgroundColor:
                generatePrompt.trim() && !generateLoading
                  ? "#0091ae"
                  : "#cbd5e0",
              cursor:
                generatePrompt.trim() && !generateLoading
                  ? "pointer"
                  : "not-allowed",
              alignSelf: "flex-start",
            }}
          >
            <Sparkles size={16} />
            {generateLoading ? "Generating..." : "Generate"}
          </button>
        </div>

        {/* Email body — contenteditable so user sees and edits formatted content directly; that HTML is sent in the payload */}
        <div
          style={{
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <label
            style={{ fontSize: "14px", fontWeight: "600", color: "#141414" }}
          >
            Email body
          </label>
          <textarea
            ref={bodyEditorRef}
            aria-label="Email body"
            placeholder="Type your email here or use Generate above. This content will be sent as the email body (HTML supported)."
            value={emailBody}
            onChange={(e) => setEmailBody(e.target.value)}
            style={{
              width: "100%",
              minHeight: isMaximized ? "400px" : "200px",
              border: "1px solid #e2e8f0",
              borderRadius: "6px",
              outline: "none",
              fontSize: "14px",
              color: "#141414",
              fontFamily: "inherit",
              lineHeight: "1.6",
              padding: "10px 12px",
              overflow: "auto",
              backgroundColor: "#fff",
              resize: "vertical",
            }}
            className="email-body-editor"
          />
          <style>{`
            .email-body-editor:focus {
              border-color: #0091ae;
              box-shadow: 0 0 0 1px #0091ae;
            }
          `}</style>
        </div>
      </div>

      {/* Formatting Toolbar and Associated Records */}
      <div
        style={{
          padding: "12px 20px",
          borderTop: "1px solid #e2e8f0",
          borderBottom: "1px solid #e2e8f0",
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          backgroundColor: "#ffffff",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            type="button"
            style={{
              background: "transparent",
              border: "none",
              padding: "6px",
              cursor: "pointer",
              color: "#141414",
              display: "flex",
              alignItems: "center",
              borderRadius: "3px",
              fontSize: "14px",
              fontWeight: "600",
            }}
            title="Bold"
            onClick={handleBold}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#f5f8fa")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
          >
            B
          </button>
          <button
            type="button"
            style={{
              background: "transparent",
              border: "none",
              padding: "6px",
              cursor: "pointer",
              color: "#141414",
              display: "flex",
              alignItems: "center",
              borderRadius: "3px",
              fontSize: "14px",
              fontWeight: "600",
              fontStyle: "italic",
            }}
            title="Italic"
            onClick={handleItalic}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#f5f8fa")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
          >
            I
          </button>
          <button
            type="button"
            style={{
              background: "transparent",
              border: "none",
              padding: "6px",
              cursor: "pointer",
              color: "#141414",
              display: "flex",
              alignItems: "center",
              borderRadius: "3px",
              fontSize: "14px",
              fontWeight: "600",
              textDecoration: "underline",
            }}
            title="Underline"
            onClick={handleUnderline}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#f5f8fa")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
          >
            U
          </button>
          <div style={{ position: "relative" }} ref={moreFormattingRef}>
            <button
              type="button"
              style={{
                background: "transparent",
                border: "none",
                padding: "6px 10px",
                cursor: "pointer",
                color: "#141414",
                display: "flex",
                alignItems: "center",
                borderRadius: "3px",
                fontSize: "13px",
                fontWeight: "500",
                gap: "4px",
              }}
              title="More formatting"
              onClick={() =>
                setShowMoreFormattingDropdown((v) => !v)
              }
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#f5f8fa")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "transparent")
              }
            >
              More
              <ChevronDown size={14} />
            </button>
            {showMoreFormattingDropdown && (
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: "100%",
                  marginTop: "4px",
                  backgroundColor: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "5px",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                  zIndex: 1001,
                  minWidth: "120px",
                }}
              >
                <button
                  type="button"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "none",
                    background: "transparent",
                    fontSize: "14px",
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    handleList();
                    setShowMoreFormattingDropdown(false);
                  }}
                >
                  List
                </button>
                <button
                  type="button"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "none",
                    background: "transparent",
                    fontSize: "14px",
                    textAlign: "left",
                    cursor: "pointer",
                    fontFamily: "monospace",
                  }}
                  onClick={() => {
                    handleCode();
                    setShowMoreFormattingDropdown(false);
                  }}
                >
                  Code
                </button>
              </div>
            )}
          </div>
          <button
            type="button"
            style={{
              background: "transparent",
              border: "none",
              padding: "6px",
              cursor: "pointer",
              color: "#141414",
              display: "flex",
              alignItems: "center",
              borderRadius: "3px",
            }}
            title="Link"
            onClick={handleLink}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#f5f8fa")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
          >
            <Link size={16} />
          </button>
          <button
            type="button"
            style={{
              background: "transparent",
              border: "none",
              padding: "6px",
              cursor: "pointer",
              color: "#141414",
              display: "flex",
              alignItems: "center",
              borderRadius: "3px",
            }}
            title="Image"
            onClick={handleImage}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#f5f8fa")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
          >
            <Image size={16} aria-label="Insert Image" />
          </button>
          <button
            type="button"
            style={{
              background: "transparent",
              border: "none",
              padding: "6px",
              cursor: "pointer",
              color: "#141414",
              display: "flex",
              alignItems: "center",
              borderRadius: "3px",
            }}
            title="Attach file"
            onClick={handleAttachmentClick}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#f5f8fa")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
          >
            <Paperclip size={16} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            style={{ display: "none" }}
          />
        </div>

        {/* Attachments */}
        {attachments.length > 0 && (
          <div
            style={{
              padding: "12px 0px",
              borderTop: "1px solid #e2e8f0",
              borderBottom: "1px solid #e2e8f0",
              backgroundColor: "#ffffff",
            }}
          >
            <div
              style={{
                fontSize: "13px",
                color: "#666",
                marginBottom: "8px",
                fontWeight: "600",
              }}
            >
              Attachments ({attachments.length})
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "6px",
              }}
            >
              {attachments.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "6px 10px",
                    backgroundColor: "#f5f8fa",
                    borderRadius: "4px",
                    fontSize: "13px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      flex: 1,
                      overflow: "hidden",
                    }}
                  >
                    <Paperclip size={14} style={{ flexShrink: 0 }} />
                    <span
                      style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {file.name}
                    </span>
                    <span
                      style={{
                        color: "#666",
                        fontSize: "12px",
                        flexShrink: 0,
                      }}
                    >
                      {`(${(file.size / 1024).toFixed(1)} KB)`}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAttachment(index)}
                    style={{
                      background: "transparent",
                      border: "none",
                      padding: "4px",
                      cursor: "pointer",
                      color: "#718096",
                      display: "flex",
                      alignItems: "center",
                    }}
                    title="Remove attachment"
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = "#f44336")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = "#718096")
                    }
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer - Task Creation and Send */}
      <div
        style={{
          padding: "16px 20px",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: "12px",
          backgroundColor: "#ffffff",
        }}
      >
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            cursor: "pointer",
            fontSize: "13px",
            color: "#141414",
            width: "100%",
          }}
        >
          <input
            type="checkbox"
            checked={createTask}
            onChange={(e) => setCreateTask(e.target.checked)}
            style={{
              width: "16px",
              height: "16px",
              cursor: "pointer",
            }}
          />
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span>
              Create a <strong>To-do</strong> task to follow up
            </span>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                position: "relative",
              }}
            >
              <div style={{ position: "relative" }}>
                <button
                  type="button"
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  style={{
                    padding: "4px 0",
                    backgroundColor: "transparent",
                    border: "none",
                    borderRadius: "4px",
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "#141414",
                    cursor: "pointer",
                    textAlign: "left",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    textDecoration: "underline",
                  }}
                >
                  {activityDate === "Custom..." ? customDate : activityDate}
                  <ChevronDown size={14} />
                </button>
                {showDatePicker && (
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      bottom: "100%",
                      marginBottom: "4px",
                      backgroundColor: "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "5px",
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                      minWidth: "200px",
                      zIndex: 1001,
                      overflow: "hidden",
                    }}
                  >
                    {dateOptions.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => {
                          if (option === "Custom...") {
                            setActivityDate("Custom...");
                            setActivityTime(customTime);
                            setShowDatePicker(false);
                          } else {
                            setActivityDate(option);
                            setShowDatePicker(false);
                          }
                        }}
                        style={{
                          width: "100%",
                          padding: "10px 16px",
                          backgroundColor: "transparent",
                          border: "none",
                          textAlign: "left",
                          fontSize: "14px",
                          color: "#33475b",
                          cursor: "pointer",
                          transition: "background-color 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#f7fafc";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                        }}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ position: "relative" }}>
                <input
                  type="time"
                  value={
                    activityDate === "Custom..." ? customTime : activityTime
                  }
                  onChange={(e) => {
                    const v = e.target.value;
                    setActivityTime(v);
                    if (activityDate === "Custom...") {
                      setCustomTime(v);
                    }
                  }}
                  style={{
                    padding: "4px 8px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "5px",
                    fontSize: "13px",
                    color: "#141414",
                    backgroundColor: "#ffffff",
                  }}
                />
              </div>
            </div>
            {activityDate === "Custom..." && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginTop: "6px",
                }}
              >
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  style={{
                    padding: "4px 8px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "5px",
                    fontSize: "13px",
                    color: "#141414",
                    backgroundColor: "#ffffff",
                  }}
                />
              </div>
            )}
          </span>
        </label>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            alignSelf: "flex-start",
          }}
        >
          {sendValidationMessage && (
            <span
              style={{
                fontSize: "12px",
                color: "#B91C1C",
                maxWidth: "320px",
              }}
            >
              {sendValidationMessage}
            </span>
          )}
          <div style={{ position: "relative" }}>
            <button
              onClick={handleSend}
              disabled={sendLoading}
              style={{
                padding: "8px 16px",
                backgroundColor: sendLoading ? "#e2e8f0" : "#cbd5e0",
                color: "#141414",
                border: "none",
                borderRadius: "4px",
                fontSize: "14px",
                fontWeight: "500",
                cursor: sendLoading ? "not-allowed" : "pointer",
                transition: "background-color 0.2s",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => {
                if (!sendLoading) {
                  e.currentTarget.style.backgroundColor = "#b8c5d0";
                }
              }}
              onMouseLeave={(e) => {
                if (!sendLoading) {
                  e.currentTarget.style.backgroundColor = "#cbd5e0";
                }
              }}
            >
              {sendLoading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm"
                    role="status"
                    aria-hidden="true"
                    style={{
                      width: "14px",
                      height: "14px",
                      borderWidth: "2px",
                    }}
                  />
                  Sending...
                </>
              ) : (
                "Send"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
    </React.Fragment>
  );
};

export default EmailModal;
