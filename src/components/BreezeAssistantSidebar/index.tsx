import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  X,
  Maximize2,
  Minimize2,
  MoreHorizontal,
  Paperclip,
  Bookmark,
  AtSign,
  Send,
  Info,
  Search,
  ChevronDown,
  Trash2,
} from "lucide-react";
import { ChatAssistantBudgetBar } from "@components/chat-assistant/ChatAssistantBudgetBar";
import { useChatAssistantConversations } from "@hooks/useChatAssistantConversations";
import { useChatAssistantUserBudget } from "@hooks/useChatAssistantUserBudget";
import {
  getChatThread,
  isChatUserBudgetExhaustedError,
  mapChatThreadMessagesToUi,
  sendChatMessage,
  type ChatRateLimit,
} from "@utils/chat";

import { AssistantRateLimitBar } from "./AssistantRateLimitBar";
import { useChatAssistantRateLimit } from "./useChatAssistantRateLimit";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface BreezeMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface BreezeChatHistory {
  id: string;
  title: string;
  timestamp: Date;
  /** Thread ID from API; when set, selecting this item continues that conversation */
  threadId?: string;
}

const BREEZE_THREADS_KEY = "breeze_assistant_chat_threads";
const BREEZE_MESSAGES_KEY_PREFIX = "breeze_assistant_messages_";

type StoredThread = {
  id: string;
  title: string;
  timestamp: string;
  threadId: string;
};

function getStoredThreads(): StoredThread[] {
  try {
    const raw = localStorage.getItem(BREEZE_THREADS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStoredThreads(threads: StoredThread[]) {
  try {
    localStorage.setItem(BREEZE_THREADS_KEY, JSON.stringify(threads));
  } catch {
    // ignore
  }
}

function getStoredMessages(threadId: string): BreezeMessage[] {
  try {
    const raw = localStorage.getItem(BREEZE_MESSAGES_KEY_PREFIX + threadId);
    if (!raw) return [];
    const arr = JSON.parse(raw) as Array<{
      id: string;
      role: string;
      content: string;
      timestamp: string;
    }>;
    return arr.map((m) => ({
      ...m,
      timestamp: new Date(m.timestamp),
      role: m.role as "user" | "assistant",
    }));
  } catch {
    return [];
  }
}

function saveStoredMessages(threadId: string, messages: BreezeMessage[]) {
  try {
    const serialized = messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      timestamp: m.timestamp.toISOString(),
    }));
    localStorage.setItem(
      BREEZE_MESSAGES_KEY_PREFIX + threadId,
      JSON.stringify(serialized),
    );
  } catch {
    // ignore
  }
}

function removeStoredThread(threadId: string) {
  try {
    localStorage.removeItem(BREEZE_MESSAGES_KEY_PREFIX + threadId);
    const threads = getStoredThreads().filter((t) => t.threadId !== threadId);
    saveStoredThreads(threads);
  } catch {
    // ignore
  }
}

const BREEZE_ERROR_REPLY = "Sorry, something went wrong. Please try again.";

function breezeReplyFromChatError(error: unknown): string {
  if (isChatUserBudgetExhaustedError(error)) {
    return error.message;
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }
  return BREEZE_ERROR_REPLY;
}

function createBreezeErrorMessage(error?: unknown): BreezeMessage {
  return {
    id: `error-${Date.now()}`,
    role: "assistant",
    content: error ? breezeReplyFromChatError(error) : BREEZE_ERROR_REPLY,
    timestamp: new Date(),
  };
}

async function requestAssistantReply(
  text: string,
  threadId: string,
  onSendMessage?: (message: string) => Promise<string>,
): Promise<{ reply: string; newThreadId: string; rateLimit?: ChatRateLimit }> {
  if (onSendMessage) {
    return { reply: await onSendMessage(text), newThreadId: threadId };
  }
  const response = await sendChatMessage({
    message: text,
    thread_id: threadId || undefined,
  });
  return {
    reply: response.response || "No response received",
    newThreadId: response.thread_id || threadId,
    rateLimit: response.rate_limit,
  };
}

function persistMessagesAfterReply(
  prev: BreezeMessage[],
  userMsg: BreezeMessage,
  assistantMsg: BreezeMessage,
  newThreadId: string,
  persist: (tid: string, title: string, msgs: BreezeMessage[]) => void,
): BreezeMessage[] {
  const next = [...prev, assistantMsg];
  if (newThreadId) {
    const firstUser = prev.find((m) => m.role === "user") ?? userMsg;
    persist(newThreadId, firstUser.content?.slice(0, 80) || "New Chat", next);
  }
  return next;
}

export interface BreezeAssistantSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isMaximized?: boolean;
  onMaximizeChange?: (maximized: boolean) => void;
  onMaximize?: () => void;
  width?: string;
  onSendMessage?: (message: string) => Promise<string>;
}

// ============================================================================
// VIEW TYPE  — controls which panel is shown in the right-hand area
// ============================================================================
type BreezeView = "chat" | "chatHistory" | "prompts" | "addPrompt" | "memories";

// ============================================================================
// SHARED STYLE HELPERS
// ============================================================================

const iconBtnStyle: React.CSSProperties = {
  background: "transparent",
  border: "none",
  padding: "5px",
  cursor: "pointer",
  color: "#718096",
  display: "flex",
  alignItems: "center",
  borderRadius: "4px",
  transition: "background 0.2s, color 0.2s",
};

function applyIconHover(
  e: React.MouseEvent<HTMLButtonElement>,
  entering: boolean,
) {
  e.currentTarget.style.backgroundColor = entering ? "#f5f5f5" : "transparent";
  e.currentTarget.style.color = entering ? "#141414" : "#718096";
}

// ============================================================================
// GLOBAL CSS
// ============================================================================

const GlobalBreezeStyles: React.FC = () => (
  <style>{`
    @keyframes breezeSlideIn {
      from { transform: translateX(24px); opacity: 0; }
      to   { transform: translateX(0);    opacity: 1; }
    }
    @keyframes breezeExpandIn {
      from { transform: translateX(40px); opacity: 0; }
      to   { transform: translateX(0);    opacity: 1; }
    }
    @keyframes breezeTyping {
      0%, 60%, 100% { transform: translateY(0);   opacity: 0.4; }
      30%           { transform: translateY(-5px); opacity: 1;   }
    }
    .breeze-scroll::-webkit-scrollbar       { width: 5px; }
    .breeze-scroll::-webkit-scrollbar-track { background: transparent; }
    .breeze-scroll::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
    .breeze-scroll::-webkit-scrollbar-thumb:hover { background: #cbd5e0; }
    .breeze-chat-history-row {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 8px;
      border-radius: 6px;
      background-color: transparent;
      transition: background 0.15s;
      box-sizing: border-box;
    }
    .breeze-chat-history-row:not(.breeze-chat-history-row--active):hover {
      background-color: #f7f7f7;
    }
    .breeze-chat-history-row--active {
      background-color: #f0f0f0;
    }
    .breeze-chat-history-row__select {
      flex: 1;
      min-width: 0;
      padding: 10px 12px;
      display: flex;
      align-items: center;
      border: none;
      border-radius: 6px;
      background: transparent;
      cursor: pointer;
      font-size: 13.5px;
      color: #141414;
      font-family: inherit;
      text-align: left;
    }
    .breeze-chat-history-row__select--active {
      font-weight: 500;
    }
    .breeze-chat-history-row__title {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .breeze-chat-history-row__delete {
      padding: 4px;
      margin-right: 8px;
      border: none;
      border-radius: 4px;
      background: transparent;
      color: #718096;
      cursor: pointer;
      display: flex;
      align-items: center;
      flex-shrink: 0;
    }
    .breeze-chat-history-row__delete:hover:not(:disabled) {
      color: #dc2626;
      background-color: #fef2f2;
    }
    .breeze-chat-history-row__delete:disabled {
      cursor: wait;
      opacity: 0.5;
    }
  `}</style>
);

// ============================================================================
// SPARKLE ICON
// ============================================================================

const BreezeSparkleIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 48,
  color = "#00385d",
}) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <path
      d="M24 4C24 4 26.5 16 28 20C31 24 44 24 44 24C44 24 31 24 28 28C26.5 32 24 44 24 44C24 44 21.5 32 20 28C17 24 4 24 4 24C4 24 17 24 20 20C21.5 16 24 4 24 4Z"
      fill={color}
    />
    <path
      d="M35 8C35 8 36.2 12.5 37 14C38.2 15.5 42 16 42 16C42 16 38.2 16.5 37 18C36.2 19.5 35 24 35 24C35 24 33.8 19.5 33 18C31.8 16.5 28 16 28 16C28 16 31.8 15.5 33 14C33.8 12.5 35 8 35 8Z"
      fill={color}
    />
  </svg>
);

// ============================================================================
// APPS ICON
// ============================================================================

const AppsIcon: React.FC = () => (
  <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
    <rect x="0" y="0" width="5" height="4" rx="1" fill="#4285F4" />
    <rect x="6.5" y="0" width="5" height="4" rx="1" fill="#EA4335" />
    <rect x="13" y="0" width="5" height="4" rx="1" fill="#34A853" />
    <rect x="0" y="5" width="5" height="4" rx="1" fill="#FBBC04" />
    <rect x="6.5" y="5" width="5" height="4" rx="1" fill="#4285F4" />
    <rect x="13" y="5" width="5" height="4" rx="1" fill="#EA4335" />
    <rect x="0" y="10" width="5" height="4" rx="1" fill="#34A853" />
    <rect x="6.5" y="10" width="5" height="4" rx="1" fill="#FBBC04" />
    <rect x="13" y="10" width="5" height="4" rx="1" fill="#4285F4" />
  </svg>
);

// ============================================================================
// SEND BUTTON
// ============================================================================

/** Send button: onClick triggers parent onSend → handleSend → sendChatMessage API (or custom onSendMessage). */
const SendButton: React.FC<{ disabled?: boolean; onClick?: () => void }> = ({
  disabled,
  onClick,
}) => (
  <button
    type="button"
    onClick={() => onClick?.()}
    disabled={disabled}
    style={{
      width: "32px",
      height: "32px",
      borderRadius: "50%",
      border: "none",
      background: disabled
        ? "rgba(38,6,70,0.15)"
        : "linear-gradient(135deg,#260646 0%,#260646 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: disabled ? "not-allowed" : "pointer",
      transition: "all 0.2s ease",
      flexShrink: 0,
    }}
  >
    <Send
      size={14}
      color={disabled ? "rgba(38,6,70,0.5)" : "#ffffff"}
      style={{ transform: "translateX(1px)" }}
    />
  </button>
);

// ============================================================================
// INPUT BOX
// ============================================================================

const InputBox: React.FC<{
  inputValue: string;
  onInputChange: (v: string) => void;
  onSend: () => void;
  isLoading?: boolean;
  placeholder?: string;
  rows?: number;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}> = ({
  inputValue,
  onInputChange,
  onSend,
  isLoading,
  placeholder = "Ask me anything. Type @ to mention a record, like a contact or deal.",
  rows = 3,
  textareaRef,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (inputValue.trim() && !isLoading) onSend();
    }
  };

  return (
    <div
      style={{
        width: "100%",
        border: "1px solid #e2e8f0",
        borderRadius: "10px",
        backgroundColor: "#ffffff",
        overflow: "hidden",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      }}
    >
      <div style={{ padding: "12px 14px 8px 14px" }}>
        <textarea
          ref={textareaRef}
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={rows}
          style={{
            width: "100%",
            border: "none",
            outline: "none",
            resize: "none",
            fontSize: "13.5px",
            color: "#141414",
            fontFamily: "inherit",
            lineHeight: "1.5",
            backgroundColor: "transparent",
          }}
        />
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "6px 12px 10px 12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "5px 10px",
              border: "1px solid #e2e8f0",
              borderRadius: "20px",
              backgroundColor: "#ffffff",
              cursor: "pointer",
              fontSize: "12.5px",
              color: "#141414",
              fontWeight: "500",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#f7f7f7")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "#ffffff")
            }
          >
            <AppsIcon />
            Apps
          </button>
          {[
            { Icon: Paperclip, title: "Attach file" },
            { Icon: Bookmark, title: "Save" },
            { Icon: AtSign, title: "Mention a record" },
          ].map(({ Icon, title }) => (
            <button
              key={title}
              title={title}
              style={{
                background: "transparent",
                border: "none",
                padding: "4px",
                cursor: "pointer",
                color: "#718096",
                display: "flex",
                alignItems: "center",
                borderRadius: "4px",
                transition: "color 0.2s,background 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#141414";
                e.currentTarget.style.backgroundColor = "#f5f5f5";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#718096";
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <Icon size={16} />
            </button>
          ))}
        </div>
        <SendButton
          disabled={!inputValue.trim() || isLoading}
          onClick={() => {
            if (inputValue.trim() && !isLoading) onSend();
          }}
        />
      </div>
    </div>
  );
};

// ============================================================================
// MESSAGE BUBBLE
// ============================================================================

const MessageBubble: React.FC<{ message: BreezeMessage }> = ({ message }) => {
  const isUser = message.role === "user";
  return (
    <div
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        marginBottom: "12px",
        padding: "0 16px",
      }}
    >
      {!isUser && (
        <div
          style={{
            width: "28px",
            height: "28px",
            borderRadius: "50%",
            background: "linear-gradient(135deg,#260646 0%,#260646 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            marginRight: "8px",
            marginTop: "2px",
          }}
        >
          <BreezeSparkleIcon size={16} color="#ffffff" />
        </div>
      )}
      <div
        style={{
          maxWidth: "80%",
          padding: "10px 14px",
          borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
          backgroundColor: isUser ? "#141414" : "#f5f5f5",
          color: isUser ? "#ffffff" : "#141414",
          fontSize: "13.5px",
          lineHeight: "1.55",
          fontWeight: "400",
          whiteSpace: "pre-wrap",
        }}
      >
        {message.content}
      </div>
    </div>
  );
};

// ============================================================================
// QUICK CHIP
// ============================================================================

const QuickChip: React.FC<{ label: string; onClick: () => void }> = ({
  label,
  onClick,
}) => (
  <button
    onClick={onClick}
    style={{
      padding: "6px 14px",
      border: "1px solid #e2e8f0",
      borderRadius: "20px",
      backgroundColor: "#ffffff",
      fontSize: "13px",
      color: "#141414",
      cursor: "pointer",
      fontWeight: "400",
      transition: "all 0.2s ease",
      whiteSpace: "nowrap",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.backgroundColor = "#f7f7f7";
      e.currentTarget.style.borderColor = "#d0d0d0";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.backgroundColor = "#ffffff";
      e.currentTarget.style.borderColor = "#e2e8f0";
    }}
  >
    {label}
  </button>
);

// ============================================================================
// EMPTY STATE
// ============================================================================

const EmptyState: React.FC<{
  inputValue: string;
  onInputChange: (v: string) => void;
  onSend: () => void;
  onChipClick: (label: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}> = ({ inputValue, onInputChange, onSend, onChipClick, textareaRef }) => (
  <div
    style={{
      flex: 1,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px 20px 0 20px",
      gap: "28px",
    }}
  >
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "4px",
      }}
    >
      <BreezeSparkleIcon size={52} color="#260646" />
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontSize: "24px",
            fontWeight: "700",
            background: "linear-gradient(135deg,#260646 0%,#260646 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            lineHeight: "1.2",
            letterSpacing: "-0.3px",
          }}
        >
          AI
        </div>
        <div
          style={{
            fontSize: "15px",
            color: "#260646",
            fontWeight: "400",
            marginTop: "2px",
          }}
        >
          Assistant
        </div>
      </div>
    </div>

    <InputBox
      inputValue={inputValue}
      onInputChange={onInputChange}
      onSend={onSend}
      textareaRef={textareaRef}
    />

    <div
      style={{
        display: "flex",
        gap: "8px",
        flexWrap: "wrap",
        justifyContent: "center",
      }}
    >
      {["Summarize", "Create", "How do I", "Prepare"].map((chip) => (
        <QuickChip key={chip} label={chip} onClick={() => onChipClick(chip)} />
      ))}
    </div>
  </div>
);

// ============================================================================
// CONVERSATION STATE
// ============================================================================

const ConversationState: React.FC<{
  messages: BreezeMessage[];
  inputValue: string;
  onInputChange: (v: string) => void;
  onSend: () => void;
  isLoading: boolean;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}> = ({
  messages,
  inputValue,
  onInputChange,
  onSend,
  isLoading,
  textareaRef,
  messagesEndRef,
}) => (
  <div
    style={{
      flex: 1,
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
    }}
  >
    <div
      className="breeze-scroll"
      style={{
        flex: 1,
        overflowY: "auto",
        paddingTop: "16px",
        paddingBottom: "8px",
      }}
    >
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
      {isLoading && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "0 16px",
            marginBottom: "12px",
          }}
        >
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              background: "linear-gradient(135deg,#260646 0%,#260646 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <BreezeSparkleIcon size={16} color="#ffffff" />
          </div>
          <div
            style={{
              padding: "10px 14px",
              borderRadius: "18px 18px 18px 4px",
              backgroundColor: "#f5f5f5",
              display: "flex",
              gap: "4px",
              alignItems: "center",
            }}
          >
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  backgroundColor: "#260646",
                  animation: "breezeTyping 1.2s ease-in-out infinite",
                  animationDelay: `${i * 0.2}s`,
                }}
              />
            ))}
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
    <div
      style={{
        borderTop: "1px solid #e2e8f0",
        backgroundColor: "#ffffff",
        padding: "10px 14px",
      }}
    >
      <InputBox
        inputValue={inputValue}
        onInputChange={onInputChange}
        onSend={onSend}
        isLoading={isLoading}
        placeholder="Ask a follow-up question..."
        rows={2}
        textareaRef={textareaRef}
      />
    </div>
  </div>
);

// ============================================================================
// CHAT HISTORY LEFT PANEL (expanded mode only)
// ============================================================================

const ChatHistoryPanel: React.FC<{
  history: BreezeChatHistory[];
  activeId: string;
  deletingThreadId?: string;
  onSelectThread: (item: BreezeChatHistory) => void;
  onNewChat: () => void;
  onDeleteThread: (item: BreezeChatHistory) => void;
}> = ({ history, activeId, onSelectThread, onNewChat, onDeleteThread }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const filtered = history.filter((h) =>
    h.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div
      style={{
        width: "330px",
        minWidth: "330px",
        borderRight: "1px solid #e8e8e8",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#ffffff",
        height: "100%",
        overflow: "hidden",
      }}
    >
      <div style={{ padding: "20px 20px 12px 20px", flexShrink: 0 }}>
        <h2
          style={{
            fontSize: "16px",
            fontWeight: "700",
            color: "#141414",
            margin: "0 0 14px 0",
          }}
        >
          Chats
        </h2>
        <div style={{ position: "relative" }}>
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 36px 8px 14px",
              border: "1px solid #e2e8f0",
              borderRadius: "20px",
              fontSize: "13.5px",
              color: "#141414",
              outline: "none",
              backgroundColor: "#ffffff",
              fontFamily: "inherit",
              boxSizing: "border-box",
              transition: "border-color 0.2s",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#cbd5e0")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#e2e8f0")}
          />
          <Search
            size={15}
            style={{
              position: "absolute",
              right: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#a0aec0",
              pointerEvents: "none",
            }}
          />
        </div>
      </div>
      <div
        className="breeze-scroll"
        style={{ flex: 1, overflowY: "auto", padding: "0 8px 16px 8px" }}
      >
        {filtered.map((item) => {
          const isActive = item.id === activeId;
          const canDelete = item.id !== "new" && item.threadId;
          return (
            <div
              key={item.id}
              role="button"
              tabIndex={0}
              onClick={() =>
                item.id === "new" ? onNewChat() : onSelectThread(item)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  item.id === "new" ? onNewChat() : onSelectThread(item);
                }
              }}
              style={{
                width: "100%",
                padding: "10px 12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "8px",
                border: "none",
                borderRadius: "6px",
                backgroundColor: isActive ? "#f0f0f0" : "transparent",
                cursor: "pointer",
                fontSize: "13.5px",
                color: "#141414",
                fontWeight: isActive ? "500" : "400",
                marginBottom: "1px",
                transition: "background 0.15s",
                boxSizing: "border-box",
              }}
              onMouseEnter={(e) => {
                if (!isActive)
                  e.currentTarget.style.backgroundColor = "#f7f7f7";
              }}
              onMouseLeave={(e) => {
                if (!isActive)
                  e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <span
                style={{
                  flex: 1,
                  minWidth: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {item.title}
              </span>
              {canDelete && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteThread(item);
                  }}
                  title="Delete"
                  style={{
                    padding: "4px",
                    border: "none",
                    borderRadius: "4px",
                    background: "transparent",
                    color: "#718096",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "#dc2626";
                    e.currentTarget.style.backgroundColor = "#fef2f2";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "#718096";
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ============================================================================
// PROMPTS SECTION
// ============================================================================

const PromptsSection: React.FC<{ onAddNew: () => void }> = ({ onAddNew }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("All");
  const [showTagMenu, setShowTagMenu] = useState(false);
  const tags = ["All", "Sales", "Marketing", "Support", "General"];

  return (
    <div
      className="breeze-scroll"
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
      }}
    >
      {/* Header content */}
      <div style={{ padding: "20px 20px 16px 20px", flexShrink: 0 }}>
        <h2
          style={{
            fontSize: "16px",
            fontWeight: "700",
            color: "#141414",
            margin: "0 0 6px 0",
          }}
        >
          Prompts
        </h2>
        <p
          style={{
            fontSize: "13.5px",
            color: "#718096",
            margin: "0 0 16px 0",
            lineHeight: "1.5",
          }}
        >
          Save your go-to prompts so you can reuse them across chats.
        </p>

        {/* Add new prompt button */}
        <button
          onClick={onAddNew}
          style={{
            padding: "7px 14px",
            border: "1px solid #cbd5e0",
            borderRadius: "6px",
            backgroundColor: "#ffffff",
            fontSize: "13px",
            color: "#141414",
            fontWeight: "500",
            cursor: "pointer",
            marginBottom: "16px",
            transition: "background 0.2s, border-color 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#f7f7f7";
            e.currentTarget.style.borderColor = "#a0aec0";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#ffffff";
            e.currentTarget.style.borderColor = "#cbd5e0";
          }}
        >
          Add new prompt
        </button>

        {/* Search + Tags row */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Search input */}
          <div style={{ position: "relative", flex: 1 }}>
            <input
              type="text"
              placeholder="Search prompts"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 36px 8px 14px",
                border: "1px solid #e2e8f0",
                borderRadius: "20px",
                fontSize: "13px",
                color: "#141414",
                outline: "none",
                backgroundColor: "#ffffff",
                fontFamily: "inherit",
                boxSizing: "border-box",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#cbd5e0")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#e2e8f0")}
            />
            <Search
              size={14}
              style={{
                position: "absolute",
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#a0aec0",
                pointerEvents: "none",
              }}
            />
          </div>

          {/* Tags dropdown */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <button
              onClick={() => setShowTagMenu(!showTagMenu)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                fontSize: "13px",
                color: "#141414",
                fontWeight: "500",
                padding: "4px 0",
              }}
            >
              Tags: {selectedTag}
              <ChevronDown size={14} color="#141414" />
            </button>
            {showTagMenu && (
              <>
                <div
                  style={{ position: "fixed", inset: 0, zIndex: 10 }}
                  onClick={() => setShowTagMenu(false)}
                />
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 4px)",
                    right: 0,
                    backgroundColor: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                    minWidth: "130px",
                    zIndex: 11,
                    overflow: "hidden",
                  }}
                >
                  {tags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => {
                        setSelectedTag(tag);
                        setShowTagMenu(false);
                      }}
                      style={{
                        width: "100%",
                        padding: "9px 14px",
                        backgroundColor:
                          tag === selectedTag ? "#f5f5f5" : "transparent",
                        border: "none",
                        textAlign: "left",
                        fontSize: "13px",
                        color: "#141414",
                        cursor: "pointer",
                        transition: "background 0.15s",
                        fontWeight: tag === selectedTag ? "500" : "400",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = "#f7fafc")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor =
                          tag === selectedTag ? "#f5f5f5" : "transparent")
                      }
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Empty state */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px 20px 20px",
        }}
      >
        {/* Illustration + message */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "16px",
          }}
        >
          {/* Laptop illustration (SVG placeholder matching the design) */}
          <svg
            width="140"
            height="110"
            viewBox="0 0 140 110"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Screen */}
            <rect
              x="25"
              y="10"
              width="90"
              height="62"
              rx="4"
              fill="#e8edf2"
              stroke="#d0d8e4"
              strokeWidth="1.5"
            />
            <rect x="31" y="16" width="78" height="50" rx="2" fill="#f5f7fa" />
            {/* Keyboard base */}
            <path d="M10 76 L130 76 L122 95 L18 95 Z" fill="#e2e8f0" />
            <ellipse cx="70" cy="95" rx="20" ry="3" fill="#d0d8e4" />
            {/* Subtle lines on screen */}
            <rect x="40" y="28" width="50" height="3" rx="1.5" fill="#d0d8e4" />
            <rect x="40" y="36" width="38" height="3" rx="1.5" fill="#d0d8e4" />
            <rect x="40" y="44" width="44" height="3" rx="1.5" fill="#d0d8e4" />
          </svg>

          <p
            style={{
              fontSize: "12.5px",
              color: "#718096",
              textAlign: "center",
              margin: 0,
              lineHeight: "1.55",
            }}
          >
            You haven't saved any prompts yet. Add a new one here, or select the
            star icon below a message to save one.
          </p>
        </div>

        {/* Bottom Add new prompt button */}
        <button
          onClick={onAddNew}
          style={{
            padding: "8px 20px",
            border: "1px solid #cbd5e0",
            borderRadius: "6px",
            backgroundColor: "#ffffff",
            fontSize: "13px",
            color: "#141414",
            fontWeight: "500",
            cursor: "pointer",
            marginTop: "16px",
            transition: "background 0.2s, border-color 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#f7f7f7";
            e.currentTarget.style.borderColor = "#a0aec0";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#ffffff";
            e.currentTarget.style.borderColor = "#cbd5e0";
          }}
        >
          Add new prompt
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// ADD NEW PROMPT SECTION
// ============================================================================

const AddNewPromptSection: React.FC<{ onCancel: () => void }> = ({
  onCancel,
}) => {
  const [promptText, setPromptText] = useState("");
  const [promptName, setPromptName] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [showTagMenu, setShowTagMenu] = useState(false);
  const tags = ["Sales", "Marketing", "Support", "General"];

  const canSave = promptText.trim().length > 0 && promptName.trim().length > 0;

  const handleSave = () => {
    if (!canSave) return;
    // TODO: wire to real save logic
    onCancel(); // go back to prompts list after save
  };

  return (
    <div
      className="breeze-scroll"
      style={{ flex: 1, overflowY: "auto", padding: "20px" }}
    >
      <h2
        style={{
          fontSize: "16px",
          fontWeight: "700",
          color: "#141414",
          margin: "0 0 16px 0",
        }}
      >
        Add new prompt
      </h2>

      {/* Prompt textarea box */}
      <div
        style={{
          border: "1px solid #cbd5e0",
          borderRadius: "8px",
          backgroundColor: "#ffffff",
          marginBottom: "20px",
          overflow: "hidden",
        }}
      >
        <textarea
          value={promptText}
          onChange={(e) => setPromptText(e.target.value)}
          placeholder={`Add your prompt here. Type @ to add a record, or add an object, like "contact" or "company"`}
          rows={6}
          style={{
            width: "100%",
            border: "none",
            outline: "none",
            resize: "none",
            fontSize: "13.5px",
            color: "#141414",
            fontFamily: "inherit",
            lineHeight: "1.55",
            backgroundColor: "transparent",
            padding: "14px",
            boxSizing: "border-box",
          }}
        />
        <div
          style={{
            padding: "8px 12px 12px 12px",
            borderTop: "1px solid #f0f0f0",
          }}
        >
          <button
            style={{
              padding: "6px 12px",
              border: "1px solid #cbd5e0",
              borderRadius: "6px",
              backgroundColor: "#ffffff",
              fontSize: "12.5px",
              color: "#141414",
              fontWeight: "500",
              cursor: "pointer",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#f7f7f7")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "#ffffff")
            }
          >
            Add object placeholder
          </button>
        </div>
      </div>

      {/* Prompt name */}
      <div style={{ marginBottom: "20px" }}>
        <label
          style={{
            display: "block",
            fontSize: "13px",
            fontWeight: "500",
            color: "#141414",
            marginBottom: "8px",
            lineHeight: "1.4",
          }}
        >
          Give this prompt a clear name so you know what it does at a glance.
        </label>
        <input
          type="text"
          placeholder="Name your prompt"
          value={promptName}
          onChange={(e) => setPromptName(e.target.value)}
          style={{
            width: "100%",
            padding: "10px 14px",
            border: "1px solid #cbd5e0",
            borderRadius: "6px",
            fontSize: "13.5px",
            color: "#141414",
            outline: "none",
            fontFamily: "inherit",
            boxSizing: "border-box",
            transition: "border-color 0.2s",
            backgroundColor: "#ffffff",
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "#718096")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "#cbd5e0")}
        />
      </div>

      {/* Tags */}
      <div style={{ marginBottom: "28px" }}>
        <label
          style={{
            display: "block",
            fontSize: "13px",
            fontWeight: "500",
            color: "#141414",
            marginBottom: "8px",
            lineHeight: "1.4",
          }}
        >
          Add tags to organize and find this prompt faster.
        </label>
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowTagMenu(!showTagMenu)}
            style={{
              width: "100%",
              padding: "10px 14px",
              border: "1px solid #cbd5e0",
              borderRadius: "6px",
              fontSize: "13.5px",
              color: selectedTag ? "#141414" : "#a0aec0",
              backgroundColor: "#ffffff",
              cursor: "pointer",
              fontFamily: "inherit",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              transition: "border-color 0.2s",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#718096")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#cbd5e0")}
          >
            <span>{selectedTag || "Select tags"}</span>
            <ChevronDown size={16} color="#718096" />
          </button>
          {showTagMenu && (
            <>
              <div
                style={{ position: "fixed", inset: 0, zIndex: 10 }}
                onClick={() => setShowTagMenu(false)}
              />
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 4px)",
                  left: 0,
                  right: 0,
                  backgroundColor: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                  zIndex: 11,
                  overflow: "hidden",
                }}
              >
                {tags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => {
                      setSelectedTag(tag);
                      setShowTagMenu(false);
                    }}
                    style={{
                      width: "100%",
                      padding: "9px 14px",
                      backgroundColor:
                        tag === selectedTag ? "#f5f5f5" : "transparent",
                      border: "none",
                      textAlign: "left",
                      fontSize: "13.5px",
                      color: "#141414",
                      cursor: "pointer",
                      transition: "background 0.15s",
                      fontWeight: tag === selectedTag ? "500" : "400",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = "#f7fafc")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor =
                        tag === selectedTag ? "#f5f5f5" : "transparent")
                    }
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Cancel / Save */}
      <div style={{ display: "flex", justifyContent: "center", gap: "12px" }}>
        <button
          onClick={onCancel}
          style={{
            padding: "8px 24px",
            border: "1px solid #cbd5e0",
            borderRadius: "6px",
            backgroundColor: "#ffffff",
            fontSize: "13.5px",
            color: "#141414",
            fontWeight: "500",
            cursor: "pointer",
            transition: "background 0.2s",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = "#f7f7f7")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = "#ffffff")
          }
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!canSave}
          style={{
            padding: "8px 24px",
            border: "none",
            borderRadius: "6px",
            backgroundColor: canSave ? "#141414" : "#e2e8f0",
            fontSize: "13.5px",
            color: canSave ? "#ffffff" : "#a0aec0",
            fontWeight: "500",
            cursor: canSave ? "pointer" : "not-allowed",
            transition: "background 0.2s",
          }}
        >
          Save
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// MEMORIES SECTION
// ============================================================================

const MemoriesSection: React.FC = () => (
  <div
    className="breeze-scroll"
    style={{
      flex: 1,
      display: "flex",
      flexDirection: "column",
      overflowY: "auto",
    }}
  >
    {/* Header content */}
    <div style={{ padding: "20px 20px 0 20px", flexShrink: 0 }}>
      <h2
        style={{
          fontSize: "16px",
          fontWeight: "700",
          color: "#141414",
          margin: "0 0 10px 0",
        }}
      >
        Memories
      </h2>
      <p
        style={{
          fontSize: "13.5px",
          color: "#718096",
          margin: 0,
          lineHeight: "1.55",
        }}
      >
        AI Assistant saves helpful details to its memory so it can give smarter,
        more relevant answers over time. You can delete memories anytime.
      </p>
    </div>

    {/* Empty state — illustration + message centred in remaining space */}
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 24px 32px 24px",
        gap: "20px",
      }}
    >
      {/* Laptop illustration — same SVG used in PromptsSection */}
      <svg
        width="140"
        height="110"
        viewBox="0 0 140 110"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="25"
          y="10"
          width="90"
          height="62"
          rx="4"
          fill="#e8edf2"
          stroke="#d0d8e4"
          strokeWidth="1.5"
        />
        <rect x="31" y="16" width="78" height="50" rx="2" fill="#f5f7fa" />
        <path d="M10 76 L130 76 L122 95 L18 95 Z" fill="#e2e8f0" />
        <ellipse cx="70" cy="95" rx="20" ry="3" fill="#d0d8e4" />
        <rect x="40" y="28" width="50" height="3" rx="1.5" fill="#d0d8e4" />
        <rect x="40" y="36" width="38" height="3" rx="1.5" fill="#d0d8e4" />
        <rect x="40" y="44" width="44" height="3" rx="1.5" fill="#d0d8e4" />
      </svg>

      <p
        style={{
          fontSize: "12.5px",
          color: "#718096",
          textAlign: "center",
          margin: 0,
          lineHeight: "1.6",
        }}
      >
        You don't have any memories yet. AI captures useful details
        automatically. You can also tell it what to remember.
      </p>
    </div>
  </div>
);

// ============================================================================
// BACK BUTTON (shared pattern)
// ============================================================================

const BackButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    onClick={onClick}
    style={{
      background: "transparent",
      border: "none",
      padding: "4px 8px",
      cursor: "pointer",
      fontSize: "13px",
      fontWeight: "600",
      color: "#141414",
      display: "flex",
      alignItems: "center",
      gap: "4px",
      borderRadius: "4px",
      transition: "background 0.2s",
    }}
    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f5f5f5")}
    onMouseLeave={(e) =>
      (e.currentTarget.style.backgroundColor = "transparent")
    }
  >
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      style={{ flexShrink: 0 }}
    >
      <path
        d="M10 12L6 8L10 4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
    Back
  </button>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const BreezeAssistantSidebar: React.FC<BreezeAssistantSidebarProps> = ({
  isOpen,
  onClose,
  width = "400px",
  onSendMessage,
  isMaximized: isMaximizedProp,
  onMaximizeChange,
}) => {
  const [internalMaximized, setInternalMaximized] = useState(false);
  const isMaximized = isMaximizedProp ?? internalMaximized;
  const setMaximized = (v: boolean) => {
    setInternalMaximized(v);
    onMaximizeChange?.(v);
  };

  const [messages, setMessages] = useState<BreezeMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingThread, setIsLoadingThread] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [activeChatId, setActiveChatId] = useState("new");
  const [threadId, setThreadId] = useState("");

  // current view — "chat" | "chatHistory" | "prompts" | "addPrompt"
  const [view, setView] = useState<BreezeView>("chat");

  const {
    conversations: apiConversations,
    conversationsTenantId,
    isLoading: conversationsLoading,
    isError: conversationsError,
    invalidateConversations,
    deleteConversation,
    isDeletingConversation,
    deletingThreadId,
  } = useChatAssistantConversations(isOpen);

  const localFallbackHistory = useMemo((): BreezeChatHistory[] => {
    if (!conversationsError) return [];
    return getStoredThreads().map((t) => ({
      id: t.id,
      title: t.title,
      timestamp: new Date(t.timestamp),
      threadId: t.threadId,
    }));
  }, [conversationsError]);

  const chatHistory = useMemo((): BreezeChatHistory[] => {
    const source =
      apiConversations.length > 0 || !conversationsError
        ? apiConversations
        : localFallbackHistory;
    return source.map(({ id, title, timestamp, threadId }) => ({
      id,
      title,
      timestamp,
      threadId,
    }));
  }, [apiConversations, conversationsError, localFallbackHistory]);

  const historyList: BreezeChatHistory[] = [
    { id: "new", title: "New Chat", timestamp: new Date() },
    ...chatHistory,
  ];

  const persistThreadToHistory = (
    tid: string,
    title: string,
    msgs: BreezeMessage[],
    syncList: boolean,
  ) => {
    saveStoredMessages(tid, msgs);
    const threads = getStoredThreads();
    const existing = threads.find((t) => t.threadId === tid);
    const entry: StoredThread = {
      id: existing?.id ?? tid,
      title: title.slice(0, 80) || "New Chat",
      timestamp: new Date().toISOString(),
      threadId: tid,
    };
    const next = existing
      ? threads.map((t) => (t.threadId === tid ? entry : t))
      : [entry, ...threads];
    saveStoredThreads(next);
    if (syncList) {
      invalidateConversations();
    }
  };

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  const hasMessages = messages.length > 0;
  const chatBusy = isLoading || isLoadingThread;

  const {
    rateLimit,
    isLoading: isRateLimitLoading,
    applyRateLimitFromSend,
    refreshRateLimit,
  } = useChatAssistantRateLimit(isOpen);

  useEffect(() => {
    if (isOpen) {
      refreshRateLimit();
    }
  }, [isOpen, refreshRateLimit]);

  useEffect(() => {
    if (messagesEndRef.current && hasMessages)
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (
        moreMenuRef.current &&
        !moreMenuRef.current.contains(e.target as Node)
      )
        setShowMoreMenu(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const {
    budget: chatBudget,
    isLoading: chatBudgetLoading,
    isUnlimited: chatBudgetUnlimited,
    isError: chatBudgetError,
    hasIdentity: chatBudgetHasIdentity,
    refetch: refetchChatBudget,
  } = useChatAssistantUserBudget(isOpen, conversationsTenantId);

  const ChatBudgetBar = isOpen ? (
    <ChatAssistantBudgetBar
      budget={chatBudget}
      isUnlimited={chatBudgetUnlimited}
      isLoading={chatBudgetLoading}
      loadError={chatBudgetError && chatBudgetHasIdentity}
      identityMissing={!chatBudgetHasIdentity && !chatBudgetLoading}
    />
  ) : null;

  if (!isOpen) return null;

  // ── Send: used by Send button click and Enter key; calls sendChatMessage API (or onSendMessage prop) ──
  const handleSend = async () => {
    const text = inputValue.trim();
    if (!text || chatBusy) return;
    const userMsg: BreezeMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsLoading(true);
    try {
      const {
        reply,
        newThreadId,
        rateLimit: sendRateLimit,
      } = await requestAssistantReply(text, threadId, onSendMessage);
      applyRateLimitFromSend(sendRateLimit);
      if (newThreadId && newThreadId !== threadId) {
        setThreadId(newThreadId);
      }
      const assistantMsg: BreezeMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: reply,
        timestamp: new Date(),
      };
      setMessages((prev) =>
        persistMessagesAfterReply(
          prev,
          userMsg,
          assistantMsg,
          newThreadId,
          (tid, title, msgs) => persistThreadToHistory(tid, title, msgs, true),
        ),
      );
      refetchChatBudget();
    } catch (error: unknown) {
      console.error("AI Assistant send failed:", error);
      setMessages((prev) => [...prev, createBreezeErrorMessage(error)]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChipClick = (label: string) => {
    setInputValue(label + " ");
    textareaRef.current?.focus();
  };
  const handleNewConversation = () => {
    setMessages([]);
    setInputValue("");
    setThreadId("");
    setActiveChatId("new");
    setShowMoreMenu(false);
    setView("chat");
  };

  const handleSelectThread = async (item: BreezeChatHistory) => {
    if (item.id === "new" || !item.threadId) {
      handleNewConversation();
      return;
    }
    setThreadId(item.threadId);
    setActiveChatId(item.id);
    setShowMoreMenu(false);
    setView("chat");
    setIsLoadingThread(true);
    try {
      const thread = await getChatThread(item.threadId);
      const loaded = mapChatThreadMessagesToUi(thread.messages);
      applyRateLimitFromSend(thread.rate_limit);
      setMessages(loaded);
      persistThreadToHistory(
        thread.thread_id,
        thread.title || item.title,
        loaded,
        false,
      );
    } catch (error: unknown) {
      console.error("AI Assistant thread load failed:", error);
      setMessages(getStoredMessages(item.threadId));
    } finally {
      setIsLoadingThread(false);
    }
  };

  const handleSaveCurrentChat = () => {
    if (threadId && messages.length > 0) {
      const title =
        messages[0].role === "user" ? messages[0].content : "New Chat";
      persistThreadToHistory(threadId, title, messages, true);
      setShowMoreMenu(false);
    }
  };

  const handleDeleteThread = async (item: BreezeChatHistory) => {
    if (item.id === "new" || !item.threadId || isDeletingConversation) return;
    try {
      await deleteConversation(item.threadId);
      removeStoredThread(item.threadId);
      if (activeChatId === item.id) handleNewConversation();
    } catch (error: unknown) {
      console.error("AI Assistant conversation delete failed:", error);
    }
  };

  // ── Derive left-side button for TopBar ────────────────────────────────────
  const leftButton = (() => {
    if (view === "chatHistory")
      return <BackButton onClick={() => setView("chat")} />;
    if (view === "prompts")
      return <BackButton onClick={() => setView("chat")} />;
    if (view === "addPrompt")
      return <BackButton onClick={() => setView("prompts")} />;
    if (view === "memories")
      return <BackButton onClick={() => setView("chat")} />;
    // default: "chat" view
    return (
      <button
        style={{
          background: "transparent",
          border: "none",
          padding: 0,
          cursor: "pointer",
          fontSize: "13px",
          fontWeight: "600",
          color: "#0091ae",
          textDecoration: "underline",
          textUnderlineOffset: "2px",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#007a8c")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#0091ae")}
      >
        Add assistant
      </button>
    );
  })();

  // ── TopBar ────────────────────────────────────────────────────────────────
  const TopBar = (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 16px 10px 16px",
        borderBottom: "1px solid #f0f0f0",
        flexShrink: 0,
        backgroundColor: "#ffffff",
      }}
    >
      {leftButton}

      <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
        {/* More menu */}
        <div style={{ position: "relative" }} ref={moreMenuRef}>
          <button
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            style={iconBtnStyle}
            onMouseEnter={(e) => applyIconHover(e, true)}
            onMouseLeave={(e) => applyIconHover(e, false)}
            title="More options"
          >
            <MoreHorizontal size={18} />
          </button>
          {showMoreMenu && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 6px)",
                right: 0,
                backgroundColor: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                minWidth: "180px",
                zIndex: 1201,
                overflow: "hidden",
              }}
            >
              {[
                ...(!isMaximized
                  ? [
                      {
                        label: "Chats",
                        onClick: () => {
                          setView("chatHistory");
                          setShowMoreMenu(false);
                        },
                      },
                    ]
                  : []),
                ...(threadId && messages.length > 0
                  ? [
                      {
                        label: "Save chat",
                        onClick: handleSaveCurrentChat,
                      },
                    ]
                  : []),
                {
                  label: "Prompts",
                  onClick: () => {
                    setView("prompts");
                    setShowMoreMenu(false);
                  },
                },
                {
                  label: "Memories",
                  onClick: () => {
                    setView("memories");
                    setShowMoreMenu(false);
                  },
                },
              ].map(({ label, onClick }) => (
                <button
                  key={label}
                  onClick={onClick}
                  style={{
                    width: "100%",
                    padding: "10px 16px",
                    backgroundColor: "transparent",
                    border: "none",
                    textAlign: "left",
                    fontSize: "13.5px",
                    color: "#141414",
                    cursor: "pointer",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "#f7fafc")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "transparent")
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Maximize / Minimize */}
        <button
          onClick={() => setMaximized(!isMaximized)}
          style={iconBtnStyle}
          onMouseEnter={(e) => applyIconHover(e, true)}
          onMouseLeave={(e) => applyIconHover(e, false)}
          title={isMaximized ? "Minimize" : "Maximize"}
        >
          {isMaximized ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
        </button>

        {/* Close */}
        <button
          onClick={onClose}
          style={iconBtnStyle}
          onMouseEnter={(e) => applyIconHover(e, true)}
          onMouseLeave={(e) => applyIconHover(e, false)}
          title="Close"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );

  const RateLimitStrip = (
    <div
      style={{
        padding: "8px 14px",
        borderBottom: "1px solid #e8edf2",
        backgroundColor: "#f7fafc",
        flexShrink: 0,
      }}
    >
      <AssistantRateLimitBar
        rateLimit={rateLimit}
        isLoading={isRateLimitLoading}
      />
    </div>
  );

  // ── Footer ────────────────────────────────────────────────────────────────
  const FooterBar = (
    <div
      style={{
        padding: "8px 16px 12px 16px",
        borderTop: "1px solid #f0f0f0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "6px",
        flexShrink: 0,
        backgroundColor: "#ffffff",
      }}
    >
      <span
        style={{ fontSize: "11.5px", color: "#a0aec0", textAlign: "center" }}
      >
        AI-generated content may be inaccurate.
      </span>
      <button
        style={{
          background: "transparent",
          border: "none",
          padding: "2px",
          cursor: "pointer",
          color: "#a0aec0",
          display: "flex",
          alignItems: "center",
          borderRadius: "50%",
          transition: "color 0.2s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#718096")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#a0aec0")}
        title="Learn more"
      >
        <Info size={13} />
      </button>
    </div>
  );

  // ── Body content (switches on view) ──────────────────────────────────────
  const BodyContent = (() => {
    switch (view) {
      case "chatHistory":
        return (
          <div
            className="breeze-scroll"
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "8px 12px 16px 12px",
            }}
          >
            {historyList.map((item) => {
              const isActive = item.id === activeChatId;
              const canDelete = item.id !== "new" && item.threadId;
              return (
                <div
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  onClick={() =>
                    item.id === "new"
                      ? handleNewConversation()
                      : handleSelectThread(item)
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      item.id === "new"
                        ? handleNewConversation()
                        : handleSelectThread(item);
                    }
                  }}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "8px",
                    border: "none",
                    borderRadius: "6px",
                    backgroundColor: isActive ? "#f0f0f0" : "transparent",
                    cursor: "pointer",
                    fontSize: "13.5px",
                    color: "#141414",
                    fontWeight: isActive ? "500" : "400",
                    marginBottom: "4px",
                    transition: "background 0.15s",
                    boxSizing: "border-box",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive)
                      e.currentTarget.style.backgroundColor = "#f7f7f7";
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive)
                      e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <span
                    style={{
                      flex: 1,
                      minWidth: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.title}
                  </span>
                  {canDelete && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteThread(item);
                      }}
                      title="Delete"
                      style={{
                        padding: "4px",
                        border: "none",
                        borderRadius: "4px",
                        background: "transparent",
                        color: "#718096",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        flexShrink: 0,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = "#dc2626";
                        e.currentTarget.style.backgroundColor = "#fef2f2";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = "#718096";
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        );

      case "prompts":
        return <PromptsSection onAddNew={() => setView("addPrompt")} />;

      case "addPrompt":
        return <AddNewPromptSection onCancel={() => setView("prompts")} />;

      case "memories":
        return <MemoriesSection />;

      default: // "chat"
        return (
          <div
            className="breeze-scroll"
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {!hasMessages ? (
              <EmptyState
                inputValue={inputValue}
                onInputChange={setInputValue}
                onSend={handleSend}
                onChipClick={handleChipClick}
                textareaRef={textareaRef}
              />
            ) : (
              <ConversationState
                messages={messages}
                inputValue={inputValue}
                onInputChange={setInputValue}
                onSend={handleSend}
                isLoading={chatBusy}
                textareaRef={textareaRef}
                messagesEndRef={messagesEndRef}
              />
            )}
          </div>
        );
    }
  })();

  // ── EXPANDED (maximized) mode ─────────────────────────────────────────────
  if (isMaximized) {
    return (
      <>
        <GlobalBreezeStyles />
        <div
          style={{
            position: "fixed",
            top: "48px",
            right: 0,
            bottom: 0,
            left: 0,
            zIndex: 1200,
            display: "flex",
            marginLeft: "-30px",
          }}
          onClick={() => setMaximized(false)}
        >
          <div style={{ flex: 1 }} />
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "calc(100vw - 84px)",
              height: "calc(100vh - 48px)",
              maxHeight: "calc(100vh - 48px)",
              display: "flex",
              flexDirection: "row",
              backgroundColor: "#ffffff",
              boxShadow: "-4px 0 32px rgba(0,0,0,0.14)",
              animation: "breezeExpandIn 0.22s ease-out",
              overflow: "hidden",
            }}
          >
            <ChatHistoryPanel
              history={historyList}
              activeId={activeChatId}
              deletingThreadId={deletingThreadId}
              onSelectThread={handleSelectThread}
              onNewChat={handleNewConversation}
              onDeleteThread={handleDeleteThread}
            />
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              {TopBar}
              {view === "chat" ? RateLimitStrip : null}
              <div
                className="breeze-scroll"
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                }}
              >
                {BodyContent}
              </div>
              {FooterBar}
            </div>
          </div>
        </div>
      </>
    );
  }

  // ── NORMAL sidebar mode ───────────────────────────────────────────────────
  return (
    <>
      <GlobalBreezeStyles />
      <div
        style={{
          width,
          minWidth: "340px",
          backgroundColor: "#ffffff",
          display: "flex",
          flexDirection: "column",
          height: "calc(100vh - 66px)",
          maxHeight: "calc(100vh - 66px)",
          overflow: "hidden",
          animation: "breezeSlideIn 0.28s ease-out",
          flexShrink: 0,
          border: "1px solid transparent",
          borderRadius: "16px",
          backgroundImage:
            "linear-gradient(#ffffff,#ffffff),linear-gradient(90deg,#260646 0%,#260646 100%)",
          backgroundOrigin: "border-box",
          backgroundClip: "padding-box,border-box",
          boxShadow: "-2px 0 12px rgba(0,0,0,0.06)",
          marginTop: "10px",
          marginRight: "5px",
          position: "sticky",
          top: "58px",
          zIndex: 1000,
        }}
      >
        {TopBar}
        {view === "chat" ? RateLimitStrip : null}
        {BodyContent}
        {FooterBar}
      </div>
    </>
  );
};

export default BreezeAssistantSidebar;
