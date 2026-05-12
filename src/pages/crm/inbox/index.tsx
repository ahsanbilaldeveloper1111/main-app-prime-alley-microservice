"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo, ReactElement } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Layout from "@layout/index";
import '../../../app/generic-style.css';
import { getChats, getWhatsAppChatMessages, sendWhatsApp, getWhatsAppTemplates, type WhatsAppTemplateItem } from "@utils/communication";
import { crmAppKeys } from "../../../query/keys";
import { useWhatsAppSocket, type WhatsAppSocketPayload } from "@hooks/useWhatsAppSocket";
import { useRouter } from "next/router";
import parsePhoneNumber from "libphonenumber-js";

// ── Types ──────────────────────────────────────────────────────────────────
interface SidebarSection {
  label: string;
  count: number;
  expanded: boolean;
}

/** WhatsApp chat item from getChats API (matches CrmActivitiesPanel / WhatsAppSection) */
interface WhatsAppChatItem {
  id: number;
  phone_number: string;
  last_message_preview?: string;
  last_message_at?: string;
  window_started_at?: string;
}

/** Single message from getWhatsAppChatMessages / socket (matches WhatsAppSection) */
interface WhatsAppMessage {
  id: number;
  direction: "inbound" | "outbound";
  message: string;
  message_type?: string;
  content_sid?: string;
  status?: string;
  created_at: string;
}

/** Chat window info from getWhatsAppChatMessages response (matches WhatsAppSection) */
interface WhatsAppChatWindowInfo {
  is_within_24h_window?: boolean;
  window_started_at?: string;
  window_minutes_remaining?: number;
}

type RefreshChatsRef = { current: () => void };

const isKeyboardClick = (event: React.KeyboardEvent) => event.key === "Enter" || event.key === " ";

const handleKeyboardClick = (event: React.KeyboardEvent, onActivate: () => void) => {
  if (!isKeyboardClick(event)) {
    return;
  }
  event.preventDefault();
  onActivate();
};

// ── Avatar ─────────────────────────────────────────────────────────────────
const Avatar = ({
  initials,
  size = 32,
  color = "#efe7f0",
  textColor = "#6b46c1",
  src,
}: {
  initials?: string;
  size?: number;
  color?: string;
  textColor?: string;
  src?: string;
}) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: "50%",
      background: color,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: size * 0.38,
      fontWeight: 600,
      color: textColor,
      flexShrink: 0,
      overflow: "hidden",
    }}
  >
    {src ? (
      <img src={src} alt={initials ? `Avatar ${initials}` : "Avatar"} style={{ width: "100%", height: "100%" }} />
    ) : (
      initials
    )}
  </div>
);

// ── Icons ──────────────────────────────────────────────────────────────────
const Icon = ({ name, size = 14, color = "#141414" }: { name: string; size?: number; color?: string }) => {
  const icons: Record<string, React.ReactElement> = {
    search: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
      </svg>
    ),
    chevronDown: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <polyline points="6 9 12 15 18 9" />
      </svg>
    ),
    chevronRight: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    ),
    reply: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <polyline points="9 17 4 12 9 7" /><path d="M20 18v-2a4 4 0 0 0-4-4H4" />
      </svg>
    ),
    externalLink: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
      </svg>
    ),
    more: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <circle cx="12" cy="5" r="1" fill={color} /><circle cx="12" cy="12" r="1" fill={color} /><circle cx="12" cy="19" r="1" fill={color} />
      </svg>
    ),
    info: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
    check: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
    whatsapp: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
      </svg>
    ),
    send: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
      </svg>
    ),
    emoji: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <circle cx="12" cy="12" r="10" /><path d="M8 13s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" />
      </svg>
    ),
    link: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
    ),
    attachment: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
      </svg>
    ),
    sparkle: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <path d="M12 3v1m0 16v1M4.22 4.22l.7.7m12.16 12.16.7.7M3 12h1m16 0h1M4.22 19.78l.7-.7M18.36 5.64l.7-.7" />
        <circle cx="12" cy="12" r="4" />
      </svg>
    ),
    insert: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" />
      </svg>
    ),
    compose: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    ),
    x: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    ),
    expand: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" />
        <line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" />
      </svg>
    ),
    drag: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <circle cx="9" cy="6" r="1" fill={color} /><circle cx="15" cy="6" r="1" fill={color} />
        <circle cx="9" cy="12" r="1" fill={color} /><circle cx="15" cy="12" r="1" fill={color} />
        <circle cx="9" cy="18" r="1" fill={color} /><circle cx="15" cy="18" r="1" fill={color} />
      </svg>
    ),
  };
  return icons[name] || null;
};

// ── Dropdown ───────────────────────────────────────────────────────────────
const Dropdown = ({
  trigger,
  items,
  menuPlacement = "bottom",
}: {
  trigger: React.ReactNode;
  items: { label: string; onClick?: () => void }[];
  menuPlacement?: "bottom" | "top";
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  return (
    <div ref={ref} style={{ position: "relative", display: "inline-flex" }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{ cursor: "pointer", border: "none", background: "transparent", padding: 0 }}
      >
        {trigger}
      </button>
      {open && (
        <div style={{
          position: "absolute",
          top: menuPlacement === "bottom" ? "100%" : "auto",
          bottom: menuPlacement === "top" ? "100%" : "auto",
          left: 0,
          zIndex: 1000,
          background: "#fff",
          border: "1px solid #e2e8f0", borderRadius: 6, boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          minWidth: 160,
          marginTop: menuPlacement === "bottom" ? 4 : 0,
          marginBottom: menuPlacement === "top" ? 4 : 0,
        }}>
          {items.map((item, index) => (
            <button
              key={item.label}
              type="button"
              onClick={() => { item.onClick?.(); setOpen(false); }}
              style={{
              width: "100%",
              textAlign: "left",
              border: "none",
              background: "transparent",
              padding: "8px 14px", fontSize: 13, color: "#141414", cursor: "pointer",
              borderBottom: index < items.length - 1 ? "1px solid #f0f0f0" : "none",
            }}
              onMouseEnter={e => (e.currentTarget.style.background = "#f7fafc")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Left Sidebar (Grid 1) ──────────────────────────────────────────────────
const LeftSidebar = ({ onNewChat }: { onNewChat: () => void }) => {
  const [activeSection, setActiveSection] = useState("All open");
  const sections = [
    { label: "Unassigned", count: 0 },
    { label: "Assigned to me", count: 1 },
    { label: "All open", count: 1 },
  ];
  return (
    <div style={{
      width: 235, background: "#ffffff", borderRight: "1px solid #cccccc",
      display: "flex", flexDirection: "column", flexShrink: 0, height: "100%", overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontWeight: 700, fontSize: 16, color: "#141414" }}>Inbox</span>
        <button style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}>
          <Icon name="search" color="#141414" size={15} />
        </button>
      </div>
      {/* Status */}
      <div style={{ padding: "4px 16px 12px", display: "flex", alignItems: "center", gap: 6, borderBottom: "1px solid #cccccc" }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#0c9960" }} />
        <Dropdown
          trigger={
            <span style={{ fontSize: 14, fontWeight: 600, color: "#006162", display: "flex", alignItems: "center", gap: 4, textDecoration: "underline" }}>
              You're available <Icon name="chevronDown" size={10} color="#006162" />
            </span>
          }
          items={[
            { label: "Available" },
            { label: "Away" },
            { label: "Busy" },
          ]}
        />
      </div>
      {/* Sections */}
      {sections.map(s => (
        <button
          type="button"
          key={s.label} 
          onClick={() => setActiveSection(s.label)} 
          style={{
            width: "100%",
            border: "none",
            padding: "7px 16px", 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center",
            cursor: "pointer", 
            background: activeSection === s.label ? "#e2e8f0" : "transparent",
            fontWeight: activeSection === s.label ? 500 : 300,
            fontSize: 14, 
            color: "#141414",
            textAlign: "left",
          }}
          onMouseEnter={e => { if (activeSection !== s.label) e.currentTarget.style.background = "#e8e8e8"; }}
          onMouseLeave={e => { if (activeSection !== s.label) e.currentTarget.style.background = "transparent"; }}
        >
          <span>{s.label}</span>
          <span style={{ fontSize: 12, color: "#7c98b6" }}>{s.count}</span>
        </button>
      ))}
      <div style={{ padding: "6px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, color: "#414141", cursor: "pointer", fontWeight: 300 }}>
          <Icon name="chevronRight" size={12} color="#141414" />
          <span>More</span>
        </div>
      </div>
      {/* Bottom actions */}
      <div style={{ marginTop: "auto", padding: "12px 16px", borderTop: "1px solid #cccccc", display: "flex", gap: 8 }}>
        <Dropdown
          trigger={
            <span className="btn btn-secondary" style={{ flex: 1, fontWeight: 300, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              Actions <Icon name="chevronDown" size={10} color="#141414" />
            </span>
          }
          menuPlacement="top"
          items={[
            { label: "Mark all as read" },
            { label: "Sort by oldest" },
            { label: "Filter conversations" },
          ]}
        />
          <button
            className="btn btn-primary"
            style={{ flex: 1, fontWeight: 300 }}
            onClick={onNewChat}
          >
            New chat
          </button>
      </div>
      <div style={{ padding: "8px 16px 12px", borderTop: "1px solid #cccccc" }}>
        <button style={{
          width: "100%", textAlign: "left", background: "none", border: "none",
          fontSize: 14, color: "#414141", cursor: "pointer", fontWeight: 300,
        }}>
          Inbox Settings
        </button>
      </div>
    </div>
  );
};

/** Format last_message_at for list display (e.g. "19h", "2d", "21 Feb") */
function formatChatTime(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 60) return diffMins <= 1 ? "1m" : `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function payloadToMessage(payload: WhatsAppSocketPayload): WhatsAppMessage {
  const raw = payload as Record<string, unknown>;
  const messageText =
    payload.message ??
    (typeof raw.body === "string" ? raw.body : "") ??
    (raw.text as string) ??
    "";
  return {
    id: typeof payload.id === "number" ? payload.id : 0,
    direction: (payload.direction as WhatsAppMessage["direction"]) ?? "inbound",
    message: messageText,
    message_type: payload.message_type ?? (raw.message_type as string),
    content_sid: payload.content_sid ?? (raw.content_sid as string),
    status: payload.status ?? (raw.status as string),
    created_at:
      payload.created_at ??
      (raw.created_at as string) ??
      (raw.timestamp as string) ??
      new Date().toISOString(),
  };
}

function getConversationListWidth(isMobile: boolean, isTablet: boolean): string | number {
  if (isMobile) {
    return "100%";
  }
  if (isTablet) {
    return 320;
  }
  return 400;
}

function getConversationMode(isMobile: boolean, isCompact: boolean): "desktop" | "tablet" | "mobile" {
  if (isMobile) {
    return "mobile";
  }
  if (isCompact) {
    return "tablet";
  }
  return "desktop";
}

/** Derive display props from API/socket message at render time (no stored shape). */
function getMessageDisplay(m: WhatsAppMessage, contactName: string) {
  const sender = m.direction === "inbound" ? "contact" : "agent";
  const time = m.created_at
    ? new Date(m.created_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
    : "";
  const text = m.message?.trim() || (m.message_type === "template" ? "Template sent" : "");
  return {
    id: m.id,
    sender,
    name: m.direction === "inbound" ? contactName : "You",
    time,
    text,
    channel: "WhatsApp",
    isRead: m.direction === "outbound" && m.status === "read",
  };
}

// ── Conversation List (Grid 2) ─────────────────────────────────────────────
const ConversationList = ({
  selectedChat,
  onSelectChat,
  refreshChatsRef,
  compactMode = "desktop",
}: {
  selectedChat: WhatsAppChatItem | null;
  onSelectChat: (chat: WhatsAppChatItem) => void;
  refreshChatsRef: RefreshChatsRef;
  compactMode?: "desktop" | "tablet" | "mobile";
}) => {
  const queryClient = useQueryClient();
  const chatsQuery = useQuery({
    queryKey: crmAppKeys.crmWhatsAppInbox.chats(),
    queryFn: () => getChats(),
  });

  const chats = useMemo(() => {
    const res = chatsQuery.data as { data?: WhatsAppChatItem[] } | undefined;
    const data = res?.data;
    return Array.isArray(data) ? data : [];
  }, [chatsQuery.data]);

  const chatsLoading = chatsQuery.isPending || chatsQuery.isFetching;
  const chatsError = chatsQuery.isError ? "Failed to load chats" : null;

  const invalidateWhatsAppChats = useCallback(() => {
    queryClient
      .invalidateQueries({ queryKey: crmAppKeys.crmWhatsAppInbox.all() })
      .catch(() => undefined);
  }, [queryClient]);

  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  const [didAutoSelectFromUrl, setDidAutoSelectFromUrl] = useState(false);

  const isTablet = compactMode === "tablet";
  const isMobile = compactMode === "mobile";

  const initialChatIdFromUrl = useRef<number | null>(null);
  const initialPhoneFromUrl = useRef<string | null>(null);

  useEffect(() => {
    if (globalThis.window === undefined) {
      return;
    }
    const params = new URLSearchParams(globalThis.window.location.search);
    const rawChatId = params.get("chat_id") ?? params.get("chatId");
    const rawPhone = params.get("phone") ?? params.get("phone_number");
    let chatIdNum = Number.NaN;
    if (rawChatId !== null) {
      chatIdNum = Number(rawChatId);
    }
    initialChatIdFromUrl.current =
      Number.isFinite(chatIdNum) && chatIdNum > 0 ? chatIdNum : null;
    initialPhoneFromUrl.current = rawPhone ? String(rawPhone).trim() : null;
  }, []);

  useEffect(() => {
    refreshChatsRef.current = invalidateWhatsAppChats;
  }, [refreshChatsRef, invalidateWhatsAppChats]);

  useEffect(() => {
    if (didAutoSelectFromUrl) return;
    if (chatsLoading) return;
    if (selectedChat != null) {
      setDidAutoSelectFromUrl(true);
      return;
    }
    const wantId = initialChatIdFromUrl.current;
    const wantPhone = initialPhoneFromUrl.current;
    if (wantId == null && !wantPhone) {
      setDidAutoSelectFromUrl(true);
      return;
    }
    let match: WhatsAppChatItem | undefined;
    if (wantId !== null && wantId !== undefined) {
      match = chats.find((c) => c.id === wantId);
    }
    if (!match && wantPhone) {
      match = chats.find((c) => String(c.phone_number).trim() === wantPhone);
    }
    if (match) {
      onSelectChat(match);
    }
    setDidAutoSelectFromUrl(true);
  }, [chats, chatsLoading, didAutoSelectFromUrl, onSelectChat, selectedChat]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /** Initials from phone (last 2 digits or first 2 chars of number) */
  const initialsForPhone = (phone: string) => {
    const digits = (phone || "").replaceAll(/\D/g, "").slice(-2);
    return digits || "??";
  };

  const renderConversationListBody = () => {
    if (chatsLoading) {
      return (
        <div style={{ padding: 24, textAlign: "center", fontSize: 14, color: "#718096" }}>
          Loading chats...
        </div>
      );
    }
    if (chatsError) {
      return (
        <div style={{ padding: 24, textAlign: "center", fontSize: 14, color: "#718096" }}>
          {chatsError}
        </div>
      );
    }
    if (chats.length === 0) {
      return (
        <div style={{ padding: 24, textAlign: "center", fontSize: 14, color: "#718096" }}>
          No WhatsApp chats yet
        </div>
      );
    }

    return chats.map((chat) => {
      const selected = selectedChat?.id === chat.id;
      return (
        <button
          type="button"
          key={chat.id}
          onClick={() => onSelectChat(chat)}
          style={{
            width: "100%",
            border: "none",
            padding: "15px 16px 26px 16px", borderBottom: "1px solid #e2e8f0",
            background: selected ? "#ebebeb" : "#fff", cursor: "pointer", display: "flex", gap: 10,
            textAlign: "left",
          }}
          onMouseEnter={e => { if (!selected) e.currentTarget.style.background = "#f7fafc"; }}
          onMouseLeave={e => { if (!selected) e.currentTarget.style.background = "#fff"; }}
        >
          <input type="checkbox" style={{ marginTop: 2, flexShrink: 0 }} onClick={e => e.stopPropagation()} />
          <Avatar initials={initialsForPhone(chat.phone_number)} size={36} color="#efe7f0" textColor="#6b46c1" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 300, fontSize: 16, color: "#141414" }}>{chat.phone_number || "Unknown"}</span>
              <span style={{ fontSize: 11, color: "#718096" }}>{formatChatTime(chat.last_message_at)}</span>
            </div>
            <div style={{ fontSize: 14, color: "#141414", display: "flex", alignItems: "center", gap: 4, marginTop: 2, fontWeight: 300 }}>
              <Icon name="reply" size={11} color="#141414" />
              <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {chat.last_message_preview || "No messages"}
              </span>
            </div>
          </div>
        </button>
      );
    });
  };

  return (
    <div style={{
      width: getConversationListWidth(isMobile, isTablet),
      borderRight: isMobile ? "none" : "1px solid #cccccc",
      borderBottom: isMobile ? "1px solid #cccccc" : "none",
      display: "flex",
      flexDirection: "column",
      flexShrink: 0,
      height: isMobile ? "42%" : "100%",
      minHeight: isMobile ? 220 : 0,
      background: "#fff",
      overflow: "hidden",
    }}>
      {/* Sort bar */}
      <div style={{ padding: "10px 16px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
        <div ref={sortRef} style={{ position: "relative" }}>
          <button onClick={() => setSortOpen(!sortOpen)} style={{
            background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#141414",
            display: "flex", alignItems: "center", gap: 4,
          }}>
            Newest <Icon name="chevronDown" size={10} color="#141414" />
          </button>
          {sortOpen && (
            <div style={{
              position: "absolute", right: 0, top: "100%", background: "#fff",
              border: "1px solid #e2e8f0", borderRadius: 6, boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              minWidth: 140, zIndex: 100, marginTop: 4,
            }}>
              {["Newest", "Oldest", "Last reply"].map((opt) => (
                <button key={opt} type="button" onClick={() => setSortOpen(false)} style={{
                  width: "100%",
                  textAlign: "left",
                  border: "none",
                  background: "transparent",
                  padding: "7px 14px", fontSize: 13, cursor: "pointer", color: "#141414",
                }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f7fafc"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Conversation list */}
      <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
        {renderConversationListBody()}
      </div>
    </div>
  );
};

// ── Message Thread (Grid 3) ────────────────────────────────────────────────
const MessageThread = ({
  selectedChat,
  refreshChatsRef,
}: {
  selectedChat: WhatsAppChatItem | null;
  refreshChatsRef: RefreshChatsRef;
}) => {
  const [activeTab, setActiveTab] = useState<"whatsapp" | "comment">("whatsapp");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sendLoading, setSendLoading] = useState(false);
  const [showInsertMenu, setShowInsertMenu] = useState(false);
  const [showWhatsappMenu, setShowWhatsappMenu] = useState(false);
  const [chatWindowInfo, setChatWindowInfo] = useState<WhatsAppChatWindowInfo | null>(null);
  const [tick, setTick] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const insertRef = useRef<HTMLDivElement>(null);
  const waRef = useRef<HTMLDivElement>(null);

  const contactName = selectedChat?.phone_number ?? "Contact";

  useEffect(() => {
    if (!selectedChat) {
      setMessages([]);
      setChatWindowInfo(null);
      return;
    }
    setMessagesLoading(true);
    getWhatsAppChatMessages({ chat_id: String(selectedChat.id) })
      .then((res: unknown) => {
        const data = res as { messages?: WhatsAppMessage[]; chat?: WhatsAppChatWindowInfo };
        const list = data?.messages;
        setMessages(Array.isArray(list) ? list : []);
        setChatWindowInfo(data?.chat ?? null);
      })
      .catch(() => {
        setMessages([]);
        setChatWindowInfo(null);
      })
      .finally(() => setMessagesLoading(false));
  }, [selectedChat?.id, selectedChat?.phone_number]);

  // Tick every minute so 24h countdown updates
  useEffect(() => {
    if (!chatWindowInfo?.is_within_24h_window) return;
    const id = setInterval(() => setTick((n) => n + 1), 60_000);
    return () => clearInterval(id);
  }, [chatWindowInfo?.is_within_24h_window]);

  const onMessageReceived = useCallback(
    (payload: WhatsAppSocketPayload) => {
      const rawChatId = payload?.whats_app_chat_id;
      if (rawChatId == null) return;
      const chatIdNum = Number(rawChatId);
      if (Number.isNaN(chatIdNum)) return;
      const msg = payloadToMessage(payload);
      if (selectedChat?.id === chatIdNum) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          // Replace optimistic outbound (temp id < 0) with same text when real message arrives
          const isOutbound = msg.direction === "outbound";
          const next = isOutbound
            ? prev.filter((m) => !(m.id < 0 && m.message?.trim() === msg.message?.trim()))
            : prev;
          return [...next, msg];
        });
      } else {
        refreshChatsRef.current();
      }
    },
    [selectedChat, refreshChatsRef]
  );

  const onStatusUpdated = useCallback(
    (payload: WhatsAppSocketPayload) => {
      const rawChatId = payload?.whats_app_chat_id;
      if (rawChatId == null || payload?.message_sid == null) return;
      const chatIdNum = Number(rawChatId);
      if (selectedChat?.id !== chatIdNum) return;
      setMessages((prev) =>
        prev.map((m) =>
          String(m.id) === String(payload.message_sid) || (payload.id != null && m.id === payload.id)
            ? { ...m, status: payload.status === "read" ? "read" : m.status }
            : m
        )
      );
    },
    [selectedChat]
  );

  useWhatsAppSocket({
    selectedChatId: selectedChat?.id ?? null,
    callbacks: { onMessageReceived, onStatusUpdated },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (insertRef.current && !insertRef.current.contains(e.target as Node)) setShowInsertMenu(false);
      if (waRef.current && !waRef.current.contains(e.target as Node)) setShowWhatsappMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const sendMessage = async () => {
    const text = message.trim();
    if (!text || !selectedChat?.phone_number) return;
    setSendLoading(true);
    try {
      await sendWhatsApp({ number: selectedChat.phone_number, message: text });
      setMessage("");
      // Optimistic append only after successful API call (socket may deliver the real message later; we dedupe in onMessageReceived)
      setMessages((prev) => [
        ...prev,
        {
          id: -Date.now(),
          direction: "outbound",
          message: text,
          created_at: new Date().toISOString(),
          status: "sent",
        },
      ]);
      refreshChatsRef.current();
    } catch {
      // toast handled by sendWhatsApp
    } finally {
      setSendLoading(false);
    }
  };

  const hasMessages = messages.length > 0;
  const dateLabel = hasMessages ? new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long" }) : "";

  // 24h window countdown (backend keys: window_minutes_remaining or window_started_at)
  const minutesRemaining = React.useMemo(() => {
    const remainingFromApi = chatWindowInfo?.window_minutes_remaining;
    if (remainingFromApi != null) {
      return remainingFromApi;
    }
    if (!chatWindowInfo?.window_started_at) {
      return null;
    }
    const start = new Date(chatWindowInfo.window_started_at).getTime();
    const end = start + 24 * 60 * 60 * 1000;
    return Math.max(0, Math.floor((end - Date.now()) / 60000));
  }, [chatWindowInfo, tick]);

  const show24hTimer = selectedChat && chatWindowInfo?.is_within_24h_window !== false && minutesRemaining != null && minutesRemaining > 0;
  const timerLabel =
    minutesRemaining != null && minutesRemaining > 0
      ? `${Math.floor(minutesRemaining / 60)}h ${minutesRemaining % 60}m remaining`
      : "";

  const renderMessageContent = () => {
    if (selectedChat == null) {
      return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", minHeight: 200, fontSize: 14, color: "#718096" }}>
          Select a chat to view messages.
        </div>
      );
    }
    if (messagesLoading) {
      return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", minHeight: 200, fontSize: 14, color: "#718096" }}>
          Loading messages...
        </div>
      );
    }

    return (
      <>
        {dateLabel && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "12px 0 20px" }}>
            <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
            <span style={{
              fontSize: 12, color: "#141414", background: "#fff", padding: "2px 10px",
              border: "1px solid #e2e8f0", borderRadius: 12,
            }}>{dateLabel}</span>
            <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
          </div>
        )}

        {messages.map((m) => {
          const d = getMessageDisplay(m, contactName);
          return (
            <div key={m.id} style={{
              marginBottom: 16, display: "flex", flexDirection: d.sender === "contact" ? "row" : "row-reverse",
              alignItems: "flex-start", gap: 10,
            }}>
              {d.sender === "contact" && (
                <div style={{
                  width: 28, height: 28, borderRadius: "50%", background: "#4a90d9",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", fontSize: 11, fontWeight: 700, flexShrink: 0,
                }}>{(d.name || "").replaceAll(/\D/g, "").slice(-2) || "??"}</div>
              )}
              {d.sender === "agent" && (
                <Avatar initials="You" size={28} color="#efe7f0" textColor="#6b46c1" />
              )}
              <div style={{ maxWidth: "70%" }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 8,
                  flexDirection: d.sender === "contact" ? "row" : "row-reverse",
                  marginBottom: 4,
                }}>
                  <span style={{ fontWeight: 600, fontSize: 14, color: "#141414" }}>{d.name}</span>
                  <span style={{ fontSize: 11, color: "#718096" }}>{d.time}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                    <Icon name="whatsapp" size={12} color="#25D366" />
                    <span style={{ fontSize: 11, color: "#718096" }}>{d.channel}</span>
                    <Icon name="chevronDown" size={10} color="#141414" />
                  </div>
                </div>
                <div style={{
                  padding: "8px 12px",
                  fontSize: 14, color: "#141414", lineHeight: 1.5,
                }}>
                  {d.text}
                </div>
              </div>
            </div>
          );
        })}

        {(() => {
          const last = messages.at(-1);
          const lastD = last ? getMessageDisplay(last, contactName) : null;
          return lastD?.isRead ? (
            <div style={{ textAlign: "right", fontSize: 11, color: "#718096", marginTop: 4 }}>
              Read at {lastD.time}
            </div>
          ) : null;
        })()}
        <div ref={bottomRef} />
      </>
    );
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#fff", minWidth: 0, height: "100%", overflow: "hidden" }}>
      {/* 24h window timer */}
      {show24hTimer && (
        <div style={{
          flexShrink: 0, padding: "8px 20px", background: "#f0fdf4", borderBottom: "1px solid #bbf7d0",
          display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#166534",
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", flexShrink: 0 }} />
          {timerLabel}
        </div>
      )}
      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", minHeight: 0 }}>
        {renderMessageContent()}
      </div>

      {/* Composer */}
      <div style={{ borderTop: "2px solid #e2e8f0" }}>
        {/* Tab row */}
        <div style={{ display: "flex", alignItems: "center", padding: "0 16px", borderBottom: "1px solid #e2e8f0" }}>
          {/* WhatsApp tab with dropdown */}
          <div ref={waRef} style={{ position: "relative" }}>
            <button onClick={() => setShowWhatsappMenu(!showWhatsappMenu)} style={{
              background: "none", border: "none", cursor: "pointer", padding: "10px 0",
              marginRight: 16, display: "flex", alignItems: "center", gap: 6,
              borderBottom: activeTab === "whatsapp" ? "2px solid #141414" : "2px solid transparent",
              color: activeTab === "whatsapp" ? "#141414" : "#718096", fontSize: 14, fontWeight: 500,
            }}>
              <Icon name="whatsapp" size={14} color="#141414" />
              WhatsApp
              <Icon name="chevronDown" size={10} color="#141414" />
            </button>
            {showWhatsappMenu && (
              <div style={{
                position: "absolute", bottom: "100%", left: 0, background: "#fff",
                border: "1px solid #e2e8f0", borderRadius: 6, boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                minWidth: 150, zIndex: 100,
              }}>
                {["WhatsApp", "Email", "Live Chat"].map((opt) => (
                  <button key={opt} type="button" onClick={() => setShowWhatsappMenu(false)} style={{
                    width: "100%",
                    textAlign: "left",
                    border: "none",
                    background: "transparent",
                    padding: "7px 14px", fontSize: 13, cursor: "pointer", color: "#141414",
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = "#f7fafc"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => setActiveTab("comment")} style={{
            background: "none", border: "none", cursor: "pointer", padding: "10px 0",
            borderBottom: activeTab === "comment" ? "2px solid #141414" : "2px solid transparent",
            color: "#141414", fontSize: 14, fontWeight: 300,
          }}>
            Comment
          </button>
          <div style={{ flex: 1 }} />
          <button style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
            <Icon name="expand" size={14} color="#141414" />
          </button>
        </div>
        {/* Text area */}
        <div style={{ padding: "10px 16px" }}>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder={selectedChat ? "Write a message. Press '/' or highlight text to access AI commands." : "Select a chat to reply."}
            disabled={!selectedChat}
            style={{
              width: "100%", minHeight: 80, border: "none", outline: "none", resize: "none",
              fontSize: 13, color: "#141414", background: "transparent", fontFamily: "inherit",
              lineHeight: 1.5,
            }}
          />
        </div>
        {/* Toolbar */}
        <div style={{
          padding: "8px 16px", display: "flex", alignItems: "center", gap: 4,
          borderTop: "1px solid #f0f0f0",
        }}>
          <button style={{ background: "none", border: "none", cursor: "pointer", padding: 5, borderRadius: 4 }}
            title="AI" onMouseEnter={e => e.currentTarget.style.background = "#f0f0f0"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <Icon name="sparkle" size={15} color="#141414" />
          </button>
          <button style={{ background: "none", border: "none", cursor: "pointer", padding: 5, borderRadius: 4 }}
            title="Emoji" onMouseEnter={e => e.currentTarget.style.background = "#f0f0f0"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <Icon name="emoji" size={15} color="#141414" />
          </button>
          <button style={{ background: "none", border: "none", cursor: "pointer", padding: 5, borderRadius: 4 }}
            title="Link" onMouseEnter={e => e.currentTarget.style.background = "#f0f0f0"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <Icon name="link" size={15} color="#141414" />
          </button>
          <button style={{ background: "none", border: "none", cursor: "pointer", padding: 5, borderRadius: 4 }}
            title="Attachment" onMouseEnter={e => e.currentTarget.style.background = "#f0f0f0"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <Icon name="attachment" size={15} color="#141414" />
          </button>

          <div ref={insertRef} style={{ position: "relative" }}>
            <button onClick={() => setShowInsertMenu(!showInsertMenu)} style={{
              background: "none", border: "none", cursor: "pointer", padding: "5px 8px",
              borderRadius: 4, display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#718096",
            }}
              onMouseEnter={e => e.currentTarget.style.background = "#f0f0f0"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <Icon name="insert" size={14} color="#141414" />
              Insert
              <Icon name="chevronDown" size={10} color="#141414" />
            </button>
            {showInsertMenu && (
              <div style={{
                position: "absolute", bottom: "100%", left: 0, background: "#fff",
                border: "1px solid #e2e8f0", borderRadius: 6, boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                minWidth: 160, zIndex: 100,
              }}>
                {["Saved reply", "Knowledge article", "Video", "Meeting link"].map((opt) => (
                  <button key={opt} type="button" style={{
                    width: "100%",
                    textAlign: "left",
                    border: "none",
                    background: "transparent",
                    padding: "7px 14px", fontSize: 13, cursor: "pointer", color: "#141414"
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = "#f7fafc"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={{ flex: 1 }} />
          {/* Send button */}
          <div style={{ display: "flex", alignItems: "center" }}>
            <button 
              onClick={sendMessage} 
              className={message.trim() && selectedChat ? "btn btn-primary" : "btn"}
              disabled={!message.trim() || !selectedChat || sendLoading}
              style={{
                borderRadius: "4px 0 0 4px",
                ...(!message.trim() && { background: "#e6e6e6", color: "#aaa" })
              }}
            >
              {sendLoading ? "Sending..." : "Send"}
            </button>
            <Dropdown
              trigger={
                <span style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "6px 8px", background: message.trim() ? "#2a2a2a" : "#d4d4d4",
                  border: "none", borderLeft: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: "0 4px 4px 0", cursor: "pointer",
                }}>
                  <Icon name="chevronDown" size={12} color={message.trim() ? "#fff" : "#999"} />
                </span>
              }
              items={[
                { label: "Send and close" },
                { label: "Send and snooze" },
                { label: "Schedule send" },
              ]}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Contact Panel (Grid 4) ─────────────────────────────────────────────────
interface AccordionSection {
  label: string;
  count?: number | string;
  children?: React.ReactNode;
  defaultOpen?: boolean;
}

const AccordionItem = ({ label, count, children, defaultOpen = false }: AccordionSection) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom: "1px solid #cccccc" }}>
      <button onClick={() => setOpen(!open)} style={{
        width: "100%", padding: "20px 16px 10px 16px", background: "none", border: "none",
        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between",
        fontSize: 14, fontWeight: 500, color: "#141414", textAlign: "left",
      }}
        onMouseEnter={e => e.currentTarget.style.background = "#f7fafc"}
        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {open ? <Icon name="chevronDown" size={12} color="#718096" /> : <Icon name="chevronRight" size={12} color="#141414" />}
          {label}
          {count !== undefined && (
            <span style={{ fontSize: 11, color: "#7c98b6", fontWeight: 400 }}>({count})</span>
          )}
        </span>
      </button>
      {open && children && (
        <div style={{ padding: "0 16px 12px" }}>{children}</div>
      )}
    </div>
  );
};

const FieldRow = ({ label, value, link }: { label: string; value: string; link?: boolean }) => (
  <div className="field-row">
    <div className="field-label">{label}</div>
    <div className={link ? "field-value text-link" : "field-value"}>
      {value || <span className="field-value-empty">—</span>}
    </div>
  </div>
);

const ContactPanel = () => {
  return (
    <div style={{
      width: 300, borderLeft: "1px solid #cccccc", overflowY: "auto",
      background: "#fff", flexShrink: 0, height: "100%", minHeight: 0,
    }}>
      {/* Contact header */}
      <div style={{ padding: "45px 16px 28px", borderBottom: "1px solid #cccccc" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <div style={{
            width: 36, height: 36, background: "#e2e8f0", borderRadius: 4, overflow: "hidden",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#718096",
            flexShrink: 0,
          }}>PA</div>
          <div>
            <div style={{textDecoration: "underline", fontSize: 14, fontWeight: 600, color: "#006162", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
              Rizwan haider <Icon name="externalLink" size={11} color="#006162" />
            </div>
            <div style={{ fontSize: 14, color: "#141414", marginTop: 5, fontWeight: 300 }}>Founder</div>
          </div>
        </div>
      </div>

      {/* About this Contact */}
      <AccordionItem label="About this Contact" defaultOpen>
        <div style={{ paddingTop: 8 }}>
          <FieldRow label="Email" value="rizwan@primealley.com" />
          <FieldRow label="Phone Number" value="+44 7831 505446" />
          <FieldRow label="Associate with" value="Rizwan Haider" />
          <FieldRow label="Last Contacted" value="" />
          <FieldRow label="Lifecycle Stage" value="Lead" />
          <FieldRow label="Lead Status" value="New" />
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: "#718096", marginBottom: 4 }}>Legal basis for processing contact's data</div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#eaf0f6", padding: "3px 8px", borderRadius: 12, fontSize: 12, color: "#141414" }}>
              <span>Legitimate interest - Lead</span>
              <button style={{ background: "none", border: "none", cursor: "pointer", padding: 0, lineHeight: 1 }}>
                <Icon name="x" size={10} color="#141414" />
              </button>
            </div>
          </div>
          <FieldRow label="Record source" value="CRM UI" />
        </div>
      </AccordionItem>

      {/* Companies */}
      <AccordionItem label="Companies" count={1} defaultOpen>
        <div style={{ paddingTop: 8 }}>
          <div style={{
            border: "1px solid #e2e8f0", borderRadius: 6, padding: "10px 12px",
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <div style={{
              width: 32, height: 32, background: "#e2e8f0", borderRadius: 4,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#718096", flexShrink: 0,
            }}>PA</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{
                  fontSize: 11, background: "#e2e8f0", padding: "1px 6px", borderRadius: 8,
                  color: "#718096", fontWeight: 600,
                }}>Primary</span>
              </div>
              <div style={{ fontSize: 13, color: "#006162", cursor: "pointer", fontWeight: 600, marginTop: 2 }}>
                Prime Alley Technology
              </div>
              <div style={{ fontSize: 11, color: "#006162", cursor: "pointer", display: "flex", alignItems: "center", gap: 2 }}>
                primealley.com <Icon name="externalLink" size={10} color="#006162" />
              </div>
              <div style={{ fontSize: 11, color: "#718096" }}>Phone: --</div>
            </div>
          </div>
        </div>
      </AccordionItem>

      {/* All the zero-count sections */}
      {[
        "Past Feedback",
        "Other Conversations",
        "Tickets",
        "Deals",
        "Other Tickets",
        "Contacts",
        "Subscriptions",
        "Payments",
        "Payment Links",
        "Orders",
        "Carts",
        "Social Profiles",
        "Customer Success Alerts",
        "Projects",
      ].map(label => (
        <AccordionItem key={label} label={label} count={0}>
          <div style={{ padding: "8px 0", fontSize: 12, color: "#718096", textAlign: "center" }}>
            No {label.toLowerCase()} found.
          </div>
        </AccordionItem>
      ))}
    </div>
  );
};

// ── Top Bar (shared by Grid 3 & 4) ────────────────────────────────────────
const TopBar = ({ selectedChat }: { selectedChat: WhatsAppChatItem | null }) => {
  const [actionsOpen, setActionsOpen] = useState(false);
  const actRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (actRef.current && !actRef.current.contains(e.target as Node)) setActionsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div style={{
      height: 60, borderBottom: "1px solid #cccccc", background: "#fff",
      display: "flex", alignItems: "center", padding: "0 16px", gap: 12,
      flexShrink: 0,
      overflow: "visible",
    }}>
      {/* Logo */}
      <div style={{
        width: 28, height: 28, background: "#141414", borderRadius: 4,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 8, color: "#fff", fontWeight: 700, flexShrink: 0,
      }}>PA</div>
      {/* Contact info */}
      <div style={{ minWidth: 0, flex: 1, overflow: "hidden" }}>
        <div style={{
          fontSize: 16, fontWeight: 600, color: "#141414", display: "flex", alignItems: "center", gap: 6,
          minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {selectedChat ? selectedChat.phone_number : "Rizwan haider"}
        </div>
        <div style={{
          fontSize: 14, color: "#141414", display: "flex", alignItems: "center", gap: 4, fontWeight: 300,
          minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flexWrap: "nowrap",
        }}>
          {selectedChat ? (
            <span>WhatsApp</span>
          ) : (
            <>
              Founder at{" "}
              <span style={{ color: "#006162", cursor: "pointer", display: "flex", alignItems: "center", gap: 2, fontWeight: 500 }}>
                Prime Alley Technology <Icon name="externalLink" size={10} color="#006162" />
              </span>
              <span>• Created 19 hours ago</span>
            </>
          )}
        </div>
      </div>
      {/* Owner */}
      {/* <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <span style={{ fontSize: 12, color: "#718096" }}>Owner</span>
        <Dropdown
          trigger={
            <div style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
              <Avatar initials="RH" size={24} color="#efe7f0" textColor="#6b46c1" />
              <span style={{ fontSize: 13, color: "#141414" }}>Rizwan Haider</span>
              <Icon name="chevronDown" size={10} color="#718096" />
            </div>
          }
          items={[
            { label: "Assign to me" },
            { label: "Unassign" },
            { label: "Reassign..." },
          ]}
        />
      </div> */}
      <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 8 }}>
        {/* Action buttons */}
        <button className="btn btn-secondary" style={{ whiteSpace: "nowrap" }}>
          <Icon name="check" size={13} color="#141414" />
          Close conversation
        </button>
        <div ref={actRef} style={{ position: "relative" }}>
          <button onClick={() => setActionsOpen(!actionsOpen)} className="btn-icon">
            <Icon name="more" size={14} color="#141414" />
          </button>
          {actionsOpen && (
            <div style={{
              position: "absolute", right: 0, top: "100%", background: "#fff",
              border: "1px solid #e2e8f0", borderRadius: 6, boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              minWidth: 160, zIndex: 100, marginTop: 4,
            }}>
              {["Snooze", "Merge", "Print", "Move to spam", "Delete"].map((opt) => (
                <button key={opt} type="button" onClick={() => setActionsOpen(false)} style={{
                  width: "100%",
                  textAlign: "left",
                  border: "none",
                  background: "transparent",
                  padding: "7px 14px", fontSize: 13, cursor: "pointer",
                  color: opt === "Delete" ? "#f44336" : "#141414",
                }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f7fafc"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>
        <button className="btn-icon">
          <Icon name="info" size={14} color="#141414" />
        </button>
      </div>
    </div>
  );
};

const ResponsiveTopBar = ({
  selectedChat,
  compact,
  onNewChat,
}: {
  selectedChat: WhatsAppChatItem | null;
  compact: boolean;
  onNewChat: () => void;
}) => {
  const [actionsOpen, setActionsOpen] = useState(false);
  const actRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (actRef.current && !actRef.current.contains(e.target as Node)) setActionsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!compact) {
    return <TopBar selectedChat={selectedChat} />;
  }

  return (
    <div
      style={{
        minHeight: 52,
        borderBottom: "1px solid #cccccc",
        background: "#fff",
        display: "flex",
        alignItems: "center",
        padding: "8px 10px",
        gap: 8,
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: 24,
          height: 24,
          background: "#141414",
          borderRadius: 4,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 7,
          color: "#fff",
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        PA
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "#141414",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {selectedChat ? selectedChat.phone_number : "Rizwan haider"}
        </div>
        <div style={{ fontSize: 12, color: "#141414", fontWeight: 300 }}>WhatsApp</div>
      </div>

      <div ref={actRef} style={{ position: "relative" }}>
        <button onClick={() => setActionsOpen(!actionsOpen)} className="btn-icon">
          <Icon name="more" size={14} color="#141414" />
        </button>
        {actionsOpen && (
          <div style={{
            position: "absolute", right: 0, top: "100%", background: "#fff",
            border: "1px solid #e2e8f0", borderRadius: 6, boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            minWidth: 160, zIndex: 100, marginTop: 4,
          }}>
            {["Snooze", "Merge", "Print", "Move to spam", "Delete"].map((opt) => (
              <button key={opt} type="button" onClick={() => setActionsOpen(false)} style={{
                width: "100%",
                textAlign: "left",
                border: "none",
                background: "transparent",
                padding: "7px 14px", fontSize: 13, cursor: "pointer",
                color: opt === "Delete" ? "#f44336" : "#141414",
              }}
                onMouseEnter={e => e.currentTarget.style.background = "#f7fafc"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                {opt}
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        style={{
          background: "none",
          border: "1px solid #cccccc",
          borderRadius: 4,
          cursor: "pointer",
          padding: "4px 8px",
          fontSize: 12,
          color: "#141414",
          fontWeight: 500,
          whiteSpace: "nowrap",
        }}
      >
        Close conversation
      </button>

      <button
        onClick={onNewChat}
        style={{
          background: "none",
          border: "1px solid #cccccc",
          borderRadius: 4,
          cursor: "pointer",
          padding: "4px 8px",
          fontSize: 12,
          color: "#141414",
          fontWeight: 500,
          whiteSpace: "nowrap",
        }}
      >
        New chat
      </button>

      <button className="btn-icon">
        <Icon name="info" size={14} color="#141414" />
      </button>
    </div>
  );
};

const NewChatModal = ({
  isOpen,
  onClose,
  onSend,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSend: (data: {
    number: string;
    content_sid: string;
    content_variables: Record<string, string>;
  }) => void;
}) => {
  const [phone, setPhone] = useState("");
  const [templates, setTemplates] = useState<WhatsAppTemplateItem[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplateItem | null>(null);
  const [paramValues, setParamValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen) return;
    setTemplatesLoading(true);
    getWhatsAppTemplates()
      .then((list) => setTemplates(Array.isArray(list) ? list : []))
      .catch((e) => {
        console.error("Failed to fetch WhatsApp templates", e);
        setTemplates([]);
      })
      .finally(() => setTemplatesLoading(false));
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedTemplate(null);
    setParamValues({});
    setPhone("");
  }, [isOpen]);

  useEffect(() => {
    setParamValues({});
  }, [selectedTemplate?.content_sid]);

  const isPhoneE164 = (value: string): boolean => {
    if (!value.trim()) return false;
    const parsed = parsePhoneNumber(value.trim());
    return parsed?.isValid() ?? false;
  };

  const sanitizePhoneInput = (value: string): string => {
    const hasPlus = value.startsWith("+");
    const digits = value.replaceAll(/\D/g, "");
    return hasPlus ? `+${digits}` : digits;
  };

  if (!isOpen) return null;

  const params = selectedTemplate?.params ?? [];
  const allParamsFilled = params.every(
    (_, i) => (paramValues[String(i + 1)] ?? "").trim() !== "",
  );
  const canTemplateSend =
    selectedTemplate?.content_sid && (params.length === 0 || allParamsFilled);

  const templateContent = (selectedTemplate as { content?: string } | null)?.content;
  const previewContent =
    templateContent && params.length > 0
      ? params.reduce((acc, _label, index) => {
          const key = String(index + 1);
          const value = (paramValues[key] ?? "").trim();
          if (!value) {
            return acc;
          }
          const pattern = new RegExp(String.raw`{{\s*${key}\s*}}`, "g");
          return acc.replace(pattern, value);
        }, templateContent)
      : templateContent;

  const trimmed = phone.trim();
  const canStart = trimmed.length > 0 && canTemplateSend && isPhoneE164(trimmed);

  const handleStart = () => {
    if (!canStart) return;
    if (!selectedTemplate?.content_sid) return;

    const content_variables: Record<string, string> = {};
    (selectedTemplate.params ?? []).forEach((_, index) => {
      const key = String(index + 1);
      content_variables[key] = paramValues[key] ?? "";
    });

    onSend({
      number: trimmed,
      content_sid: selectedTemplate.content_sid,
      content_variables:
        Object.keys(content_variables).length > 0 ? content_variables : {},
    });
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        zIndex: 1400,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: 650,
          background: "#ffffff",
          borderRadius: 8,
          boxShadow: "0 10px 40px rgba(15, 23, 42, 0.35)",
          border: "1px solid #cbd5e0",
          display: "flex",
          flexDirection: "column",
          maxWidth: "90vw",
        }}
      >
        <div
          style={{
            padding: "14px 18px",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Icon name="whatsapp" size={16} color="#141414" />
            <span style={{ fontSize: 15, fontWeight: 600, color: "#141414" }}>
              Start new WhatsApp chat
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 4,
            }}
          >
            <Icon name="x" size={14} color="#141414" />
          </button>
        </div>

        <div style={{ padding: "16px 18px 4px" }}>
          <label
            htmlFor="customer-phone-input"
            style={{
              display: "block",
              fontSize: 12,
              fontWeight: 500,
              color: "#4a5568",
              marginBottom: 6,
            }}
          >
            Customer phone number
          </label>
          <input
            id="customer-phone-input"
            value={phone}
            type="tel"
            onChange={(e) => {
              const raw = e.target.value;
              const cleaned = sanitizePhoneInput(raw);
              setPhone(cleaned);
            }}
            placeholder="+97143035555"
            autoFocus
            style={{
              width: "100%",
              padding: "9px 10px",
              borderRadius: 6,
              border: "1px solid #cbd5e0",
              fontSize: 14,
              color: "#1a202c",
            }}
          />
          <div
            style={{
              marginTop: 6,
              fontSize: 11,
              color: "#a0aec0",
            }}
          >
            Enter a full WhatsApp-enabled phone number, including country code.
          </div>
        </div>

        {/* Template selection and variables (same as WhatsAppMessageModalNew) */}
        <div style={{ padding: "12px 18px 16px", borderTop: "1px solid #e2e8f0" }}>
          <div
            style={{
              fontSize: 12,
              color: "#718096",
              marginBottom: 8,
              fontWeight: 500,
            }}
          >
            Template
          </div>
          <select
            value={selectedTemplate?.content_sid ?? ""}
            onChange={(e) => {
              const contentSid = e.target.value;
              const template = contentSid
                ? templates.find((t) => t.content_sid === contentSid) ?? null
                : null;
              setSelectedTemplate(template);
            }}
            disabled={templatesLoading}
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "1px solid #cbd5e0",
              borderRadius: 6,
              fontSize: 14,
              color: "#141414",
              backgroundColor: "#fff",
              cursor: templatesLoading ? "wait" : "pointer",
            }}
          >
            <option value="">
              {templatesLoading ? "Loading templates..." : "Select a template"}
            </option>
            {templates.map((t) => (
              <option key={t.id} value={t.content_sid}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {selectedTemplate &&
          Array.isArray(selectedTemplate.params) &&
          selectedTemplate.params.length > 0 && (
            <div
              style={{
                padding: "0 18px 16px",
                borderTop: "1px solid #e2e8f0",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  color: "#718096",
                  marginBottom: 8,
                  fontWeight: 500,
                }}
              >
                Template variables (all required)
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                {selectedTemplate.params.map((paramLabel, index) => {
                  const key = String(index + 1);
                  return (
                    <div key={key}>
                      <label
                        style={{
                          display: "block",
                          fontSize: 13,
                          fontWeight: 500,
                          color: "#141414",
                          marginBottom: 4,
                        }}
                      >
                        {paramLabel}
                      </label>
                      <input
                        type="text"
                        value={paramValues[key] ?? ""}
                        onChange={(e) =>
                          setParamValues((prev) => ({
                            ...prev,
                            [key]: e.target.value,
                          }))
                        }
                        placeholder={paramLabel}
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          border: "1px solid #cbd5e0",
                          borderRadius: 6,
                          fontSize: 14,
                          color: "#141414",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        {previewContent && (
          <div
            style={{
              padding: "12px 18px 4px",
              borderTop: "1px solid #e2e8f0",
            }}
          >
            <div
              style={{
                fontSize: 12,
                color: "#718096",
                marginBottom: 8,
                fontWeight: 500,
              }}
            >
              Template content
            </div>
            <div
              style={{
                fontSize: 14,
                color: "#141414",
                whiteSpace: "pre-wrap",
              }}
            >
              {previewContent}
            </div>
          </div>
        )}

        <div
          style={{
            padding: "12px 18px",
            borderTop: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "7px 14px",
              borderRadius: 4,
              border: "1px solid #e2e8f0",
              background: "#ffffff",
              fontSize: 13,
              color: "#4a5568",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleStart}
            disabled={!canStart}
            style={{
              padding: "7px 16px",
              borderRadius: 4,
              border: "none",
              background: canStart ? "#25D366" : "#cbd5e0",
              color: "#ffffff",
              fontSize: 13,
              fontWeight: 500,
              cursor: canStart ? "pointer" : "not-allowed",
            }}
          >
            Send WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Root Component ─────────────────────────────────────────────────────────
function CRMInbox() {
  const [selectedChat, setSelectedChat] = useState<WhatsAppChatItem | null>(null);
  const refreshChatsRef = useRef<() => void>(() => {});
  const [viewportWidth, setViewportWidth] = useState<number | null>(null);

  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const updateViewportWidth = () => setViewportWidth(window.innerWidth);
    updateViewportWidth();
    window.addEventListener("resize", updateViewportWidth);
    return () => window.removeEventListener("resize", updateViewportWidth);
  }, []);

  const isMobile = viewportWidth !== null && viewportWidth <= 768;
  const isCompact = viewportWidth !== null && viewportWidth <= 1200;
  const conversationMode = getConversationMode(isMobile, isCompact);

  const handleNewChatSend = async (data: {
    number: string;
    content_sid: string;
    content_variables: Record<string, string>;
  }) => {
    const number = data.number.trim();
    if (!number || !data.content_sid) return;
    try {
      await sendWhatsApp({
        number,
        content_sid: data.content_sid,
        content_variables:
          Object.keys(data.content_variables || {}).length > 0
            ? data.content_variables
            : undefined,
      });
      setSelectedChat(null);
      router.push(`/crm/inbox?phone=${encodeURIComponent(number)}`);
      refreshChatsRef.current();
      setShowNewChatModal(false);
    } catch {
      // sendWhatsApp shows toast on error
    }
  };

  return (
    <div style={{
      display: "flex", 
      height: "calc(100vh - 60px)", 
      fontFamily: "'Lexend Deca', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
      fontSize: 13, 
      background: "#f0f0f0", 
      overflow: "hidden",
      marginTop: "-15px", marginLeft: "-15px"
    }}>
      {/* Grid 1: Left sidebar */}
      {!isCompact && <LeftSidebar onNewChat={() => setShowNewChatModal(true)} />}

      {/* Grid 2: Conversation list (WhatsApp chats from API) */}
      {!isCompact && (
        <ConversationList
          selectedChat={selectedChat}
          onSelectChat={setSelectedChat}
          refreshChatsRef={refreshChatsRef}
          compactMode="desktop"
        />
      )}

      <NewChatModal
        isOpen={showNewChatModal}
        onClose={() => setShowNewChatModal(false)}
        onSend={handleNewChatSend}
      />

      {/* Grids 3+4 share a column with top bar */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <ResponsiveTopBar
          selectedChat={selectedChat}
          compact={isCompact}
          onNewChat={() => setShowNewChatModal(true)}
        />
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            overflow: "hidden",
          }}
        >
          {isCompact && (
            <ConversationList
              selectedChat={selectedChat}
              onSelectChat={setSelectedChat}
              refreshChatsRef={refreshChatsRef}
              compactMode={conversationMode}
            />
          )}
          {/* Grid 3: Message thread */}
          <MessageThread selectedChat={selectedChat} refreshChatsRef={refreshChatsRef} />
          {/* Grid 4: Contact panel */}
          {!isCompact && <ContactPanel />}
        </div>
      </div>
    </div>
  );
}

CRMInbox.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CRMInbox;
