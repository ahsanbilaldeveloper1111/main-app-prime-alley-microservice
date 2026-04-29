import "@assets/scss/datatable-style.scss";
import React, {
  ReactElement,
  useState,
  useEffect,
  useRef,
} from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { Col, Row, Card } from "react-bootstrap";
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { 
  Users as UsersIcon, 
  Briefcase, 
  Phone, 
  CreditCard, 
  Network, 
  Ticket,
  Megaphone,
  Package,
  Layers,
  UserCheck,
  Building2,
  Shield,
  Settings as SettingsIcon,
  AlertCircle,
  CheckCircle,
  ArrowUp,
  HelpCircle,
  Tag,
  FileText,
  ClipboardList,
  CalendarCheck,
  Bot,
  Wrench,
  MessageCircle,
  Globe,
  BarChart2,
  Settings as SettingsCogIcon,
  PhoneOutgoing,
  PhoneIncoming,
  Search
} from 'lucide-react';

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import PageHeader from "@components/PageHeader";

// Import ControlHub components
import Users from "@pages/controlhub/users";
import Teams from "@pages/controlhub/teams";
import Groups from "@pages/controlhub/groups";
import Ranks from "@pages/controlhub/ranks";

// Import CRM components
import Campaigns from "@pages/crm/campaigns";
import Industries from "@pages/crm/industries";
import Products from "@pages/crm/products";
import Stages from "@pages/crm/stages";
import DealTemplates from "@pages/crm/deal-templates";
import BusinessTypes from "@pages/crm/business-types";

// Import Telco Gateway components
import GsmAssign from "@pages/gsm/assign";
import GsmSync from "@pages/gsm/sync";
import CompanyPO from "@pages/gsm/company/po";

// Import Billing components
import PaymentMethods from "@pages/billing/customer/payment-methods";

// Import NetOps components
import Devices from "@pages/pulse/devices";
import Services from "@pages/pulse/services";
import Alerts from "@pages/pulse/alerts-old";

// Import Tickets components
import TicketStatuses from "@pages/tickets/statuses";
import TicketModules from "@pages/tickets/modules";
import ModuleCategories from "@pages/tickets/modules/categories";
import ModuleSubCategories from "@pages/tickets/modules/sub-categories";
import TicketTypes from "@pages/tickets/types";

// Import FAQ components
import FAQModules from "@pages/faqs/modules";
import FAQTopics from "@pages/faqs/topics";
import FAQItems from "@pages/faqs/items";
import FAQTypes from "@pages/faqs/types";

// Import Staff Insights & Work Planner components
import RequestCategories from "@pages/workforce/request-categories";
import RequestSubCategories from "@pages/workforce/sub-categories";
import WorkPlannerStatuses from "@pages/planner/statuses";

// Import AI Chat components
import ToolProfiles from "@pages/chat/tools-profiles";
import FaqProfiles from "@pages/chat/faq-profiles";
import AIChatFAQsTenant from "@pages/chat/ai-faqs/tenant";
import AIChatFAQsGlobal from "@pages/chat/ai-faqs/global";

// Import AI Analysis (ai-ml) components
import ManageExtensions from "@pages/ai-ml/manage-extensions";
import BackendOperations from "@pages/ai-ml/backend-operations";
import ManualAnalysis from "@pages/ai-ml/analysis";
import AIMLProfiles from "@pages/agents/outbound-agent";

// Import Outbound / Inbound AI Agent components
import OutboundTrunkProfiles from "@pages/ai-agent/outbound/trunk-profiles";
import InboundTrunkProfiles from "@pages/ai-agent/inbound/trunk-profiles";
import InboundBotProfiles from "@pages/agents/inbound-agent";
import InboundFAQs from "@pages/ai-agent/inbound/faqs";

import NotificationsPage from "@pages/notifications";

import { HEADER_CONSTANTS} from "@constants/headerConstants";

// Destructure constants for easier use
const { MENU_LABELS, ICONS, PERMISSIONS, MENU_COLORS,BASE_URL } = HEADER_CONSTANTS;

// ─── Notifications Settings ────────────────────────────────────────────────────
type ChannelKey = "popup" | "browser" | "bell" | "email";

interface NotificationTopic {
  id: string;
  label: string;
  channels: Record<ChannelKey, boolean | null>;
  subtopics?: Array<{
    id: string;
    label: string;
    description?: string;
    channels: Record<ChannelKey, boolean | null>;
  }>;
}

const defaultTopics: NotificationTopic[] = [
  {
    id: "academy", label: "Academy",
    channels: { popup: null, browser: null, bell: false, email: true },
    subtopics: [
      { id: "academy-activity", label: "Academy activity", description: "Get notified when there's an update about your certifications, awards, or course exercises.", channels: { popup: null, browser: null, bell: false, email: true } },
    ],
  },
  {
    id: "account", label: "Account",
    channels: { popup: false, browser: false, bell: false, email: false },
    subtopics: [
      { id: "account-activity", label: "Account activity", description: "Get notified about important changes to your account.", channels: { popup: false, browser: false, bell: false, email: false } },
      { id: "billing-updates", label: "Billing updates", description: "Receive notifications about invoices, payments, and subscription changes.", channels: { popup: false, browser: false, bell: false, email: false } },
    ],
  },
  {
    id: "ads", label: "Ads",
    channels: { popup: null, browser: null, bell: false, email: true },
    subtopics: [
      { id: "ads-performance", label: "Ad performance", description: "Get updates when your ads reach key performance milestones.", channels: { popup: null, browser: null, bell: false, email: true } },
    ],
  },
  {
    id: "analytics", label: "Analytics",
    channels: { popup: false, browser: false, bell: true, email: false },
    subtopics: [
      { id: "analytics-reports", label: "Scheduled reports", description: "Get notified when your scheduled analytics reports are ready.", channels: { popup: false, browser: false, bell: true, email: false } },
    ],
  },
  { id: "audit-logs", label: "Audit Logs", channels: { popup: null, browser: null, bell: null, email: false } },
  {
    id: "auth", label: "Auth",
    channels: { popup: false, browser: false, bell: false, email: true },
    subtopics: [
      { id: "auth-login", label: "New login detected", description: "Receive an alert when a new login is detected on your account.", channels: { popup: false, browser: false, bell: false, email: true } },
    ],
  },
  {
    id: "blog", label: "Blog",
    channels: { popup: false, browser: true, bell: false, email: true },
    subtopics: [
      { id: "blog-posts", label: "New posts published", description: "Get notified whenever a new blog post is published.", channels: { popup: false, browser: true, bell: false, email: true } },
      { id: "blog-comments", label: "New comments", description: "Be alerted when someone comments on your blog posts.", channels: { popup: false, browser: false, bell: false, email: false } },
    ],
  },
  {
    id: "breeze", label: "Breeze",
    channels: { popup: false, browser: false, bell: true, email: false },
    subtopics: [
      { id: "breeze-updates", label: "Breeze updates", description: "Get notified about new features and improvements in Breeze.", channels: { popup: false, browser: false, bell: true, email: false } },
    ],
  },
  { id: "contacts", label: "Contacts", channels: { popup: false, browser: false, bell: false, email: false } },
  {
    id: "conversations", label: "Conversations",
    channels: { popup: true, browser: true, bell: true, email: false },
    subtopics: [
      { id: "conv-assigned", label: "Conversation assigned to you", description: "Receive a notification when a conversation is assigned to you.", channels: { popup: true, browser: true, bell: true, email: false } },
      { id: "conv-mention", label: "Mentioned in conversation", description: "Get notified when someone @mentions you in a conversation.", channels: { popup: true, browser: true, bell: true, email: false } },
    ],
  },
  { id: "crm", label: "CRM", channels: { popup: false, browser: false, bell: false, email: true } },
  { id: "deals", label: "Deals", channels: { popup: false, browser: false, bell: true, email: false } },
];

const getParentState = (
  topic: NotificationTopic,
  channel: ChannelKey
): boolean | "indeterminate" | null => {
  if (!topic.subtopics || topic.subtopics.length === 0) {
    return topic.channels[channel] === null ? null : (topic.channels[channel] as boolean);
  }
  const vals = topic.subtopics.map((s) => s.channels[channel]);
  if (vals.every((v) => v === null)) return null;
  const filtered = vals.filter((v) => v !== null) as boolean[];
  if (filtered.every(Boolean)) return true;
  if (filtered.every((v) => !v)) return false;
  return "indeterminate";
};

const NotificationsSettingsNew: React.FC = () => {
  const [topics, setTopics] = React.useState<NotificationTopic[]>(defaultTopics);
  const [expandedTopics, setExpandedTopics] = React.useState<Set<string>>(new Set());
  const [bannerVisible, setBannerVisible] = React.useState(true);
  const [browserNotifGranted, setBrowserNotifGranted] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  // Channel toggles (how you get notified)
  const [channelEnabled, setChannelEnabled] = React.useState<Record<ChannelKey, boolean>>({
    email: true,
    bell: true,
    browser: true,
    popup: true,
  });
  const [selectedChime, setSelectedChime] = React.useState("Chime (1 sec.)");

  const toggleChannelEnabled = (ch: ChannelKey) => {
    setChannelEnabled((prev) => ({ ...prev, [ch]: !prev[ch] }));
  };

  const allExpanded =
    topics.some((t) => t.subtopics && t.subtopics.length > 0) &&
    topics.filter((t) => t.subtopics && t.subtopics.length > 0).every((t) => expandedTopics.has(t.id));

  const toggleExpandAll = () => {
    if (allExpanded) {
      setExpandedTopics(new Set());
    } else {
      setExpandedTopics(new Set(topics.filter((t) => t.subtopics?.length).map((t) => t.id)));
    }
  };

  const turnOffAll = () => {
    setTopics((prev) =>
      prev.map((t) => ({
        ...t,
        channels: {
          popup: t.channels.popup === null ? null : false,
          browser: t.channels.browser === null ? null : false,
          bell: t.channels.bell === null ? null : false,
          email: t.channels.email === null ? null : false,
        },
        subtopics: t.subtopics?.map((s) => ({
          ...s,
          channels: {
            popup: s.channels.popup === null ? null : false,
            browser: s.channels.browser === null ? null : false,
            bell: s.channels.bell === null ? null : false,
            email: s.channels.email === null ? null : false,
          },
        })),
      }))
    );
  };

  const toggleTopicChannel = (topicId: string, channel: ChannelKey) => {
    setTopics((prev) =>
      prev.map((t) => {
        if (t.id !== topicId) return t;
        if (t.channels[channel] === null) return t;
        const currentState = getParentState(t, channel);
        const newVal = currentState === true ? false : true;
        return {
          ...t,
          channels: { ...t.channels, [channel]: newVal },
          subtopics: t.subtopics?.map((s) => ({
            ...s,
            channels: { ...s.channels, [channel]: s.channels[channel] === null ? null : newVal },
          })),
        };
      })
    );
  };

  const toggleSubtopicChannel = (topicId: string, subtopicId: string, channel: ChannelKey) => {
    setTopics((prev) =>
      prev.map((t) => {
        if (t.id !== topicId) return t;
        const updatedSubs = t.subtopics?.map((s) => {
          if (s.id !== subtopicId) return s;
          if (s.channels[channel] === null) return s;
          return { ...s, channels: { ...s.channels, [channel]: !s.channels[channel] } };
        });
        const allTrue = updatedSubs?.every((s) => s.channels[channel] === null || s.channels[channel] === true);
        const parentVal = t.channels[channel] === null ? null : (allTrue ? true : false);
        return { ...t, channels: { ...t.channels, [channel]: parentVal }, subtopics: updatedSubs };
      })
    );
  };

  const notifChannels: Array<{ key: ChannelKey; label: string; description: string }> = [
    { key: "email", label: "Email", description: "Sent to your email address." },
    { key: "bell", label: "Bell", description: "Show up in the bell icon in the navigation bar. Click on the bell to see your most recent notifications." },
    { key: "browser", label: "Browser", description: "Appear in your screen when you're not active but the site is open in a browser tab." },
    { key: "popup", label: "Pop-up", description: "Appear on your screen for a few seconds when you're active. They'll play a sound based on your preferences." },
  ];

  const tableChannels: Array<{ key: ChannelKey; label: string }> = [
    { key: "popup", label: "Pop-up" },
    { key: "browser", label: "Browser" },
    { key: "bell", label: "Bell" },
    { key: "email", label: "Email" },
  ];

  const colWidth = 80;
  const baseFont = "Lexend Deca, Helvetica, Arial, sans-serif";

  const filteredTopics = searchQuery.trim()
    ? topics.filter((t) => t.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : topics;

  const renderTopicCheckbox = (
    value: boolean | "indeterminate" | null,
    onChange: () => void,
    id: string
  ) => {
    if (value === null) {
      return (
        <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: colWidth, color: "#bbb", fontSize: "13px" }}>
          --
        </span>
      );
    }
    return (
      <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: colWidth }}>
        <input
          type="checkbox"
          id={id}
          checked={value === true}
          ref={(el) => { if (el) el.indeterminate = value === "indeterminate"; }}
          onChange={onChange}
          style={{ width: "15px", height: "15px", cursor: "pointer", accentColor: "#141414" }}
        />
      </span>
    );
  };

  return (
    <div style={{ fontFamily: baseFont, color: "#141414", padding: "32px 40px" }}>

      {/* ── Info Banner ── */}
      {bannerVisible && (
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#eaf4fb",
          border: "1px solid #b8dcf0",
          borderRadius: "4px",
          padding: "12px 20px",
          marginBottom: "28px",
          fontSize: "14px",
          fontWeight: 300,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <strong style={{ fontWeight: 600 }}>Want to create your own notification?</strong>
            <span style={{ color: "#555" }}>
              You can create custom notifications in{" "}
              <a href="#" style={{ color: "#006162", textDecoration: "underline" }}>workflows.</a>
            </span>
            <button style={{
              marginLeft: "8px",
              padding: "5px 12px",
              fontSize: "13px",
              fontFamily: baseFont,
              fontWeight: 300,
              color: "#141414",
              background: "#fff",
              border: "1px solid #d0d0d0",
              borderRadius: "4px",
              cursor: "pointer",
            }}>
              Learn more
            </button>
          </div>
          <button
            onClick={() => setBannerVisible(false)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#888", fontSize: "18px", lineHeight: 1, padding: "0 4px" }}
          >
            ×
          </button>
        </div>
      )}

      {/* ── Page title + subtitle ── */}
      <div style={{ padding: "0 0 0 0" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 300, color: "#141414", marginBottom: "6px", letterSpacing: 0, fontFamily: baseFont }}>
          Notifications
        </h1>
        <p style={{ fontSize: "14px", fontWeight: 300, color: "#555", marginBottom: "24px" }}>
          These preferences will only be applied to you.
        </p>
        {/* <hr style={{ border: "none", borderTop: "1px solid #e8e8e8", margin: "0 0 28px 0" }} /> */}
      </div>

      {/* ── How you get notified ── */}
      <div style={{ marginBottom: "36px" }}>
        <div style={{ fontSize: "20px", fontWeight: 600, color: "#141414", marginBottom: "4px", fontFamily: baseFont }}>
          How you get notified
        </div>
        <div style={{ fontSize: "13px", fontWeight: 300, color: "#555", marginBottom: "20px", fontFamily: baseFont }}>
          Choose where you want to see your notifications.
        </div>

        {/* Browser permission banner */}
        {!browserNotifGranted && (
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            border: "1px solid #f0d080",
            borderRadius: "4px",
            background: "#fffbea",
            padding: "14px 20px",
            marginBottom: "20px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <strong style={{ fontSize: "14px", fontWeight: 600, fontFamily: baseFont }}>Allow browser notifications</strong>
              <span style={{ fontSize: "13px", fontWeight: 300, color: "#555", fontFamily: baseFont }}>
                Give permission to send notifications to this browser
              </span>
            </div>
            <button
              onClick={() => setBrowserNotifGranted(true)}
              style={{
                padding: "7px 16px",
                fontSize: "13px",
                fontFamily: baseFont,
                fontWeight: 300,
                color: "#141414",
                background: "#fff",
                border: "1px solid #d0d0d0",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Allow notifications
            </button>
          </div>
        )}

        {/* Channel toggles */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {notifChannels.map((ch) => (
            <div key={ch.key} style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
              {/* Black toggle checkbox */}
              <label style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "32px",
                height: "32px",
                background: channelEnabled[ch.key] ? "#141414" : "#e0e0e0",
                borderRadius: "4px",
                cursor: "pointer",
                flexShrink: 0,
                transition: "background 0.15s",
              }}>
                <input
                  type="checkbox"
                  checked={channelEnabled[ch.key]}
                  onChange={() => toggleChannelEnabled(ch.key)}
                  style={{ display: "none" }}
                />
                {channelEnabled[ch.key] && (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2 7L5.5 10.5L12 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </label>
              <div>
                <div style={{ fontSize: "14px", fontWeight: 600, color: "#141414", fontFamily: baseFont, marginBottom: "2px" }}>
                  {ch.label}
                </div>
                <div style={{ fontSize: "13px", fontWeight: 300, color: "#555", fontFamily: baseFont }}>
                  {ch.description}
                </div>

                {/* Sound selector — only for pop-up */}
                {ch.key === "popup" && (
                  <div style={{ marginTop: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px", fontSize: "13px", fontWeight: 400, color: "#555", fontFamily: baseFont }}>
                      {/* Speaker icon */}
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                        <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                      </svg>
                      <strong style={{ fontWeight: 600, color: "#141414" }}>Only applicable to pop-ups</strong>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ position: "relative" }}>
                        <select
                          value={selectedChime}
                          onChange={(e) => setSelectedChime(e.target.value)}
                          style={{
                            padding: "8px 32px 8px 12px",
                            fontSize: "13px",
                            fontFamily: baseFont,
                            fontWeight: 300,
                            color: "#141414",
                            border: "1px solid #d0d0d0",
                            borderRadius: "4px",
                            background: "#fff",
                            outline: "none",
                            cursor: "pointer",
                            appearance: "none",
                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M6 8L1 3h10z' fill='%23555'/%3E%3C/svg%3E")`,
                            backgroundRepeat: "no-repeat",
                            backgroundPosition: "right 10px center",
                          } as React.CSSProperties}
                        >
                          <option>Chime (1 sec.)</option>
                          <option>Bell (2 sec.)</option>
                          <option>Ding (0.5 sec.)</option>
                          <option>None</option>
                        </select>
                      </div>
                      <button
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "8px 16px",
                          fontSize: "13px",
                          fontFamily: baseFont,
                          fontWeight: 300,
                          color: "#141414",
                          background: "#fff",
                          border: "1px solid #d0d0d0",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      >
                        <svg width="10" height="12" viewBox="0 0 10 12" fill="#141414">
                          <path d="M0 0L10 6L0 12V0Z"/>
                        </svg>
                        Play
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── What you get notified about ── */}
      <div>
        <div style={{ fontSize: "20px", fontWeight: 600, color: "#141414", marginBottom: "4px", fontFamily: baseFont }}>
          What you get notified about
        </div>
        <div style={{ fontSize: "13px", fontWeight: 300, color: "#555", marginBottom: "20px", fontFamily: baseFont }}>
          Choose what topics matter to you and how you get notified about them.
        </div>

        {/* Search bar */}
        <div style={{ background: "#f5f5f5", borderRadius: "6px", padding: "16px 20px", marginBottom: "20px" }}>
          <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: "absolute", left: "10px", zIndex: 1 }}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder="Search for notification topics"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                paddingLeft: "34px",
                paddingRight: "34px",
                paddingTop: "8px",
                paddingBottom: "8px",
                fontSize: "14px",
                fontFamily: baseFont,
                fontWeight: 300,
                color: "#141414",
                border: "1px solid #d0d0d0",
                borderRadius: "20px",
                background: "#fff",
                outline: "none",
                width: "340px",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#006162")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#d0d0d0")}
            />
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: "absolute", right: "10px" }}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </div>
        </div>

        {/* Controls row + column headers */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0", fontSize: "14px", fontWeight: 300 }}>
            <button
              onClick={toggleExpandAll}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#006162", fontSize: "14px", fontFamily: baseFont, fontWeight: 300, padding: 0, textDecoration: "underline" }}
            >
              {allExpanded ? "Collapse all topics" : "Expand all topics"}
            </button>
            <span style={{ margin: "0 8px", color: "#d0d0d0" }}>|</span>
            <button
              onClick={turnOffAll}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#006162", fontSize: "14px", fontFamily: baseFont, fontWeight: 300, padding: 0, textDecoration: "underline" }}
            >
              Turn off all topics
            </button>
            <span style={{ marginLeft: "6px", display: "inline-flex", alignItems: "center", justifyContent: "center", width: "15px", height: "15px", border: "1.5px solid #888", borderRadius: "50%", fontSize: "10px", color: "#888", cursor: "default" }} title="Turning off all topics disables all notifications">
              ?
            </span>
          </div>

          {/* Column headers */}
          <div style={{ display: "flex", alignItems: "center" }}>
            {tableChannels.map((ch) => (
              <div key={ch.key} style={{ width: colWidth, textAlign: "center", fontSize: "12px", fontWeight: 400, color: "#555", fontFamily: baseFont, display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                {ch.key === "popup" && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
                )}
                {ch.key === "browser" && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                )}
                {ch.key === "bell" && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                )}
                {ch.key === "email" && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                )}
                <span>{ch.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Topic rows */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {filteredTopics.map((topic) => {
            const isExpanded = expandedTopics.has(topic.id);
            const hasSubtopics = topic.subtopics && topic.subtopics.length > 0;

            const toggleThisTopic = () => {
              setExpandedTopics(prev => {
                const n = new Set(prev);
                n.has(topic.id) ? n.delete(topic.id) : n.add(topic.id);
                return n;
              });
            };

            // Chevron SVG — rotates from > (collapsed) to v (expanded)
            const ChevronIcon = () => (
              <svg
                width="12" height="12" viewBox="0 0 12 12" fill="none"
                stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                style={{
                  transition: "transform 0.2s",
                  transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                  flexShrink: 0,
                }}
              >
                <polyline points="4,2 9,6 4,10" />
              </svg>
            );

            return (
              <div
                key={topic.id}
                style={{
                  border: "1px solid #e8e8e8",
                  borderRadius: "4px",
                  background: "#fff",
                  overflow: "hidden",
                }}
              >
                {/* Parent header row */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "20px",
                    cursor: "pointer",
                    userSelect: "none",
                  }}
                  onClick={toggleThisTopic}
                >
                  {/* Left: chevron + label */}
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: 0 }}>
                    <span style={{ display: "inline-flex", alignItems: "center", flexShrink: 0 }}>
                      <ChevronIcon />
                    </span>
                    <span style={{ fontSize: "16px", fontWeight: 500, color: "#141414", fontFamily: baseFont }}>
                      {topic.label}
                    </span>
                  </div>

                  {/* Middle: POP-UP SOUND label shown only when expanded */}
                  <div style={{ flex: 1, display: "flex", justifyContent: "flex-end", paddingRight: "16px" }}>
                    {isExpanded && hasSubtopics && (
                      <span style={{ fontSize: "11px", fontWeight: 700, color: "#555", letterSpacing: "0.8px", fontFamily: baseFont, textTransform: "uppercase" }}>
                        POP-UP SOUND
                      </span>
                    )}
                  </div>

                  {/* Right: channel checkboxes */}
                  <div style={{ display: "flex", alignItems: "center" }} onClick={(e) => e.stopPropagation()}>
                    {tableChannels.map((ch) => {
                      const state = getParentState(topic, ch.key);
                      return renderTopicCheckbox(state, () => toggleTopicChannel(topic.id, ch.key), `${topic.id}-${ch.key}`);
                    })}
                  </div>
                </div>

                {/* Subtopics — inside the same card, separated by dividers */}
                {isExpanded && hasSubtopics && (
                  <div>
                    {topic.subtopics!.map((sub, subIdx) => (
                      <div
                        key={sub.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          borderTop: "1px solid #e8e8e8",
                          padding: "14px 20px 14px 42px",
                          background: "#fff",
                          gap: "12px",
                        }}
                      >
                        {/* Name + description */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: "14px", fontWeight: 500, color: "#141414", fontFamily: baseFont, marginBottom: "2px" }}>
                            {sub.label}
                          </div>
                          {sub.description && (
                            <div style={{ fontSize: "12px", fontWeight: 300, color: "#888", fontFamily: baseFont }}>
                              {sub.description}
                            </div>
                          )}
                        </div>

                        {/* Edit button + sound control */}
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                          <button style={{
                            padding: "5px 14px",
                            fontSize: "13px",
                            fontFamily: baseFont,
                            fontWeight: 300,
                            color: "#141414",
                            background: "#fff",
                            border: "1px solid #d0d0d0",
                            borderRadius: "4px",
                            cursor: "pointer",
                          }}>
                            Edit
                          </button>
                          {/* Sound play + dropdown */}
                          <div style={{ display: "flex", alignItems: "center", border: "1px solid #d0d0d0", borderRadius: "4px", overflow: "hidden" }}>
                            <button style={{
                              display: "flex", alignItems: "center", justifyContent: "center",
                              width: "28px", height: "28px",
                              background: "#fff", border: "none", borderRight: "1px solid #d0d0d0",
                              cursor: "pointer", padding: 0,
                            }}>
                              <svg width="8" height="10" viewBox="0 0 8 10" fill="#555">
                                <path d="M0 0L8 5L0 10V0Z"/>
                              </svg>
                            </button>
                            <select style={{
                              padding: "4px 22px 4px 8px",
                              fontSize: "12px",
                              fontFamily: baseFont,
                              fontWeight: 300,
                              color: "#141414",
                              border: "none",
                              background: "#fff",
                              outline: "none",
                              cursor: "pointer",
                              appearance: "none",
                              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 12 12'%3E%3Cpath d='M6 8L1 3h10z' fill='%23555'/%3E%3C/svg%3E")`,
                              backgroundRepeat: "no-repeat",
                              backgroundPosition: "right 6px center",
                            } as React.CSSProperties}>
                              <option>Off</option>
                              <option>Chime (1 sec.)</option>
                              <option>Bell (2 sec.)</option>
                              <option>Ding (0.5 sec.)</option>
                            </select>
                          </div>
                        </div>

                        {/* Channel checkboxes */}
                        <div style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                          {tableChannels.map((ch) =>
                            renderTopicCheckbox(
                              sub.channels[ch.key] === null ? null : (sub.channels[ch.key] as boolean),
                              () => toggleSubtopicChannel(topic.id, sub.id, ch.key),
                              `${sub.id}-${ch.key}`
                            )
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          {filteredTopics.length === 0 && (
            <div style={{ textAlign: "center", color: "#888", fontSize: "14px", fontWeight: 300, padding: "40px", fontFamily: baseFont }}>
              No topics found for "{searchQuery}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
// ─── End NotificationsSettings ─────────────────────────────────────────────────



// ─── General Settings (Profile + Tasks) ────────────────────────────────────────
const GeneralSettings = () => {
  const [activeGeneralTab, setActiveGeneralTab] = useState<"profile" | "tasks">("profile");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile state
  const [firstName, setFirstName] = useState("Rizwan");
  const [lastName, setLastName] = useState("Haider");
  const [language, setLanguage] = useState("English");
  const [dateFormat, setDateFormat] = useState("United Kingdom");
  const [phoneCountry, setPhoneCountry] = useState("GB");
  const [phoneNumber, setPhoneNumber] = useState("+44 783 150 5446");

  // Tasks state
  const [dueDate, setDueDate] = useState("In 3 business days");
  const [dueTime, setDueTime] = useState("08:00");
  const [reminder, setReminder] = useState("No reminder");
  const [followUpList, setFollowUpList] = useState(true);
  const [followUpDisqualify, setFollowUpDisqualify] = useState(true);

  const generalTabs: Array<{ key: "profile" | "tasks"; label: string }> = [
    { key: "profile", label: "Profile" },
    { key: "tasks", label: "Tasks" },
  ];

  const s: Record<string, React.CSSProperties> = {
    wrapper: {
      fontFamily: "'Lexend Deca', Helvetica, Arial, sans-serif",
      color: "#141414",
      padding: "32px 40px",
    },
    pageTitle: {
      fontSize: "24px",
      fontWeight: "bold",
      color: "#141414",
      marginBottom: "24px",
      letterSpacing: 0,
    },
    tabsWrapper: {
      display: "flex",
      marginBottom: "32px",
      overflow: "hidden",
    },
    notice: {
      fontSize: "14px",
      color: "#555",
      fontWeight: 300,
      marginBottom: "28px",
    },
    divider: {
      border: "none",
      borderTop: "1px solid #e8e8e8",
      margin: "28px 0",
    },
    sectionTitle: {
      fontSize: "20px",
      fontWeight: 600,
      color: "#141414",
      marginBottom: "4px",
    },
    sectionSubtitle: {
      fontSize: "13px",
      fontWeight: 300,
      color: "#555",
      marginBottom: "24px",
    },
    fieldGroup: {
      marginBottom: "20px",
    },
    label: {
      display: "block",
      fontSize: "14px",
      fontWeight: 600,
      color: "#141414",
      marginBottom: "8px",
    },
    input: {
      width: "500px",
      padding: "8px 12px",
      fontSize: "16px",
      height: "40px",
      fontWeight: 300,
      color: "#141414",
      border: "1px solid #d0d0d0",
      borderRadius: "4px",
      background: "#fff",
      fontFamily: "'Lexend Deca', Helvetica, Arial, sans-serif",
      outline: "none",
      display: "block",
    } as React.CSSProperties,
    select: {
      width: "500px",
      padding: "8px 36px 8px 12px",
      fontSize: "16px",
      fontWeight: 300,
      height: "40px",
      color: "#141414",
      border: "1px solid #d0d0d0",
      borderRadius: "4px",
      background: "#fff",
      fontFamily: "'Lexend Deca', Helvetica, Arial, sans-serif",
      outline: "none",
      display: "block",
      appearance: "none",
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M6 8L1 3h10z' fill='%23555'/%3E%3C/svg%3E")`,
      backgroundRepeat: "no-repeat",
      backgroundPosition: "right 12px center",
    } as React.CSSProperties,
    helpText: {
      fontSize: "13px",
      color: "#555",
      fontWeight: 300,
      marginTop: "6px",
      lineHeight: "1.5",
    },
    link: {
      color: "#006162",
      textDecoration: "none",
    } as React.CSSProperties,
    saveButton: {
      marginTop: "32px",
      padding: "9px 22px",
      fontSize: "14px",
      fontWeight: 400,
      fontFamily: "'Lexend Deca', Helvetica, Arial, sans-serif",
      color: "#fff",
      background: "#006162",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
    } as React.CSSProperties,
    profileImageBox: {
      width: "72px",
      height: "72px",
      borderRadius: "50%",
      background: "linear-gradient(135deg, #0d6efd 0%, #198754 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "28px",
      fontWeight: 700,
      color: "#fff",
      cursor: "pointer",
      overflow: "hidden",
      border: "2px solid #e0e0e0",
    } as React.CSSProperties,
    changePhotoBtn: {
      marginTop: "10px",
      padding: "6px 14px",
      fontSize: "13px",
      fontWeight: 300,
      fontFamily: "'Lexend Deca', Helvetica, Arial, sans-serif",
      color: "#141414",
      background: "transparent",
      border: "1px solid #e0e0e0",
      borderRadius: "4px",
      cursor: "pointer",
      display: "block",
    } as React.CSSProperties,
    helpIcon: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: "16px",
      height: "16px",
      border: "1.5px solid #888",
      borderRadius: "50%",
      fontSize: "10px",
      color: "#888",
      verticalAlign: "middle",
      marginLeft: "4px",
      cursor: "default",
    } as React.CSSProperties,
    checkboxRow: {
      display: "flex",
      alignItems: "flex-start",
      gap: "10px",
      marginBottom: "16px",
    },
    checkbox: {
      width: "16px",
      height: "16px",
      marginTop: "2px",
      accentColor: "#000000",
      cursor: "pointer",
      flexShrink: 0,
    } as React.CSSProperties,
    checkboxLabel: {
      fontSize: "14px",
      fontWeight: "500",
      color: "#141414",
      lineHeight: "1.5",
      cursor: "pointer",
    },
  };

  const getTab = (isActive: boolean, isLast: boolean): React.CSSProperties => ({
    padding: "12px 28px",
    background: isActive ? "#ffffff" : "whitesmoke",
    border: "1px solid #e0e0e0",
    borderRight: isLast ? "1px solid #e0e0e0" : "none",
    borderBottom: isActive ? "2px solid #ffffff" : "2px solid #e0e0e0",
    cursor: "pointer",
    fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
    fontSize: "14px",
    fontWeight: 300,
    color: "#141414",
    whiteSpace: "nowrap",
    transition: "background 0.15s",
    position: "relative",
    top: "1px",
    outline: "none",
  });

  const getInitials = () =>
    `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

  const renderProfile = () => (
    <div>
      <p style={s.notice}>These preferences only apply to you.</p>
      {/* <hr style={s.divider} /> */}

      {/* Global */}
      <div style={s.sectionTitle}>Global</div>
      <div style={s.sectionSubtitle}>This applies across any accounts you have.</div>

      {/* Profile Image */}
      <div style={{ marginBottom: "24px" }}>
        <span style={s.label}>Profile Image</span>
        <div style={s.profileImageBox} onClick={() => fileInputRef.current?.click()}>
          {profileImage
            ? <img src={profileImage} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <span>{getInitials()}</span>}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = (ev) => setProfileImage(ev.target?.result as string);
              reader.readAsDataURL(file);
            }
          }}
        />
        {/* <button style={s.changePhotoBtn} onClick={() => fileInputRef.current?.click()}>
          Change photo
        </button> */}
      </div>

      {/* First name */}
      <div style={s.fieldGroup}>
        <label style={s.label}>First name</label>
        <input
          style={s.input}
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          onFocus={(e) => (e.currentTarget.style.borderColor = "#006162")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "#d0d0d0")}
        />
      </div>

      {/* Last name */}
      <div style={s.fieldGroup}>
        <label style={s.label}>Last name</label>
        <input
          style={s.input}
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          onFocus={(e) => (e.currentTarget.style.borderColor = "#006162")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "#d0d0d0")}
        />
      </div>

      {/* Language */}
      <div style={s.fieldGroup}>
        <label style={s.label}>
          Language <span style={s.helpIcon} title="Applies globally across all accounts">?</span>
        </label>
        <select style={s.select} value={language} onChange={(e) => setLanguage(e.target.value)}>
          <option>English</option>
          <option>French</option>
          <option>Spanish</option>
          <option>German</option>
          <option>Arabic</option>
          <option>Urdu</option>
        </select>
      </div>

      {/* Date, time, and number format */}
      <div style={s.fieldGroup}>
        <label style={s.label}>
          Date, time, and number format <span style={s.helpIcon} title="Sets date/time/number format based on locale">?</span>
        </label>
        <div style={{ fontSize: "13px", color: "#555", fontWeight: 300, marginBottom: "8px" }}>
          Format: 2 March 2026, 02/03/2026, 19:41 GMT, and 1,234.56
        </div>
        <select style={s.select} value={dateFormat} onChange={(e) => setDateFormat(e.target.value)}>
          <option>United Kingdom</option>
          <option>United States</option>
          <option>European Union</option>
          <option>Pakistan</option>
          <option>Australia</option>
        </select>
      </div>

      {/* Phone number */}
      <div style={s.fieldGroup}>
        <label style={s.label}>Phone number</label>
        <div style={s.helpText}>
          We may use this phone number to contact you about security events. Please refer to our privacy policy for{" "}
          <a href="#" style={s.link}>more information ↗</a>
        </div>
        <div style={{ display: "flex", gap: "0px", marginTop: "10px" }}>
          <select
            value={phoneCountry}
            onChange={(e) => setPhoneCountry(e.target.value)}
            style={{ padding: "8px", fontSize: "14px", border: "1px solid #d0d0d0", borderRadius: "0px", background: "#fff", fontFamily: "'Lexend Deca', Helvetica, Arial, sans-serif", outline: "none", borderRight: "none" }}
          >
            <option value="GB">🇬🇧</option>
            <option value="US">🇺🇸</option>
            <option value="PK">🇵🇰</option>
            <option value="AU">🇦🇺</option>
          </select>
          <input
            style={{ width: "260px", padding: "8px 12px", fontSize: "14px", color: "#141414", border: "1px solid #d0d0d0", borderRadius: "4px", background: "#fff", fontFamily: "'Lexend Deca', Helvetica, Arial, sans-serif", outline: "none" }}
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#006162")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#d0d0d0")}
          />
        </div>
      </div>

      {/* <hr style={s.divider} /> */}

      {/* Defaults */}
      <div style={s.sectionTitle}>Defaults</div>
      <div style={s.sectionSubtitle}>This only applies to this account.</div>
      <div style={s.fieldGroup}>
        <label style={s.label}>General working hours</label>
        <a href="#" style={{ ...s.link, fontSize: "14px", fontWeight: 300 }}>Edit working hours ↗</a>
      </div>

      {/* <button style={s.saveButton}>Save</button> */}
    </div>
  );

  const renderTasks = () => (
    <div>
      <p style={s.notice}>These preferences only apply to you.</p>
      {/* <hr style={s.divider} /> */}

      <div style={s.sectionTitle}>Defaults</div>
      <div style={s.sectionSubtitle}>Set preferences for task creation.</div>

      <div style={{ display: "flex", gap: "16px", alignItems: "flex-start", marginBottom: "20px" }}>
        {/* Due date */}
        <div style={s.fieldGroup}>
          <label style={s.label}>Due date</label>
          <select
            style={{ ...s.select, width: "240px", height: "40px", fontWeight: 300 }}
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          >
            <option>In 3 business days</option>
            <option>In 1 business day</option>
            <option>In 5 business days</option>
            <option>In 1 week</option>
            <option>In 2 weeks</option>
            <option>No due date</option>
          </select>
        </div>

        {/* Due time */}
        <div style={s.fieldGroup}>
          <label style={s.label}>Due time</label>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#888", fontSize: "14px", pointerEvents: "none", zIndex: 1 }}>⏰</span>
            <select
              style={{ width: "240px", padding: "8px 12px 8px 34px", fontSize: "16px", height: "40px", fontWeight: 300, color: "#141414", border: "1px solid #d0d0d0", borderRadius: "4px", background: "#fff", fontFamily: "'Lexend Deca', Helvetica, Arial, sans-serif", outline: "none", appearance: "none" } as React.CSSProperties}
              value={dueTime}
              onChange={(e) => setDueTime(e.target.value)}
            >
              {Array.from({ length: 24 }).map((_, h) =>
                ["00", "30"].map((m) => {
                  const val = `${String(h).padStart(2, "0")}:${m}`;
                  return <option key={val} value={val}>{val}</option>;
                })
              )}
            </select>
          </div>
        </div>
      </div>

      {/* Reminder */}
      <div style={s.fieldGroup}>
        <label style={s.label}>Reminder</label>
        <select style={s.select} value={reminder} onChange={(e) => setReminder(e.target.value)}>
          <option>No reminder</option>
          <option>At time of task</option>
          <option>5 minutes before</option>
          <option>15 minutes before</option>
          <option>30 minutes before</option>
          <option>1 hour before</option>
          <option>1 day before</option>
        </select>
      </div>

      {/* <hr style={s.divider} /> */}

      <div style={s.sectionTitle}>Follow-up tasks</div>
      <div style={s.sectionSubtitle}>Set preferences for follow-up reminders.</div>

      <div style={s.checkboxRow}>
        <input
          type="checkbox"
          id="followUpList"
          style={s.checkbox}
          checked={followUpList}
          onChange={(e) => setFollowUpList(e.target.checked)}
        />
        <label htmlFor="followUpList" style={s.checkboxLabel}>
          Get prompted to create a follow up task every time you complete a task from a list view
        </label>
      </div>

      <div style={s.checkboxRow}>
        <input
          type="checkbox"
          id="followUpDisqualify"
          style={s.checkbox}
          checked={followUpDisqualify}
          onChange={(e) => setFollowUpDisqualify(e.target.checked)}
        />
        <label htmlFor="followUpDisqualify" style={s.checkboxLabel}>
          Get prompted to create a follow up task every time you disqualify a lead
        </label>
      </div>

      {/* <button style={s.saveButton}>Save</button> */}
    </div>
  );

  return (
    <div style={s.wrapper}>
      <h1 style={s.pageTitle}>General</h1>

      {/* Two tabs: Profile & Tasks */}
      <div style={s.tabsWrapper}>
        {generalTabs.map((tab, index) => {
          const isActive = activeGeneralTab === tab.key;
          const isLast = index === generalTabs.length - 1;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveGeneralTab(tab.key)}
              style={getTab(isActive, isLast)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeGeneralTab === "profile" && renderProfile()}
      {activeGeneralTab === "tasks" && renderTasks()}
    </div>
  );
};
// ─── End GeneralSettings ────────────────────────────────────────────────────────


const Settings = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>("user-management");
  const [activeUserManagementTab, setActiveUserManagementTab] = useState<string>("user-directory");
  const [activeCrmTab, setActiveCrmTab] = useState<string>("campaigns");
  const [activeTicketsTab, setActiveTicketsTab] = useState<string>("statuses");
  const [activeTelcoTab, setActiveTelcoTab] = useState<string>("assign-devices");
  const [activeNetopsTab, setActiveNetopsTab] = useState<string>("devices-list");
  const [activeHelpCenterTab, setActiveHelpCenterTab] = useState<string>("modules");
  const [activeStaffInsightsTab, setActiveStaffInsightsTab] = useState<string>("request-categories");
  const [activeWorkPlannerTab, setActiveWorkPlannerTab] = useState<string>("statuses");
  const [activeAIChatTab, setActiveAIChatTab] = useState<string>("tools-profiles");
  const [activeAIAnalysisTab, setActiveAIAnalysisTab] = useState<string>("manage-extensions");
  const [activeOutboundAIAgentTab, setActiveOutboundAIAgentTab] = useState<string>("trunk-profiles");
  const [activeInboundAIAgentTab, setActiveInboundAIAgentTab] = useState<string>("trunk-profiles");

  // Track which tabs have been visited to prevent re-mounting
  const [visitedTabs, setVisitedTabs] = useState<Set<string>>(new Set(["user-management"]));
  const [visitedUserManagementTabs, setVisitedUserManagementTabs] = useState<Set<string>>(new Set(["user-directory"]));
  const [visitedCrmTabs, setVisitedCrmTabs] = useState<Set<string>>(new Set(["campaigns"]));
  const [visitedTicketsTabs, setVisitedTicketsTabs] = useState<Set<string>>(new Set(["statuses"]));
  const [visitedTelcoTabs, setVisitedTelcoTabs] = useState<Set<string>>(new Set(["assign-devices"]));
  const [visitedNetopsTabs, setVisitedNetopsTabs] = useState<Set<string>>(new Set(["devices-list"]));
  const [visitedBillingTab, setVisitedBillingTab] = useState<boolean>(false);
  const [visitedHelpCenterTabs, setVisitedHelpCenterTabs] = useState<Set<string>>(new Set(["modules"]));
  const [visitedStaffInsightsTabs, setVisitedStaffInsightsTabs] = useState<Set<string>>(new Set(["request-categories"]));
  const [visitedWorkPlannerTabs, setVisitedWorkPlannerTabs] = useState<Set<string>>(new Set(["statuses"]));
  const [visitedAIChatTabs, setVisitedAIChatTabs] = useState<Set<string>>(new Set(["tools-profiles"]));
  const [visitedAIAnalysisTabs, setVisitedAIAnalysisTabs] = useState<Set<string>>(new Set(["manage-extensions"]));
  const [visitedOutboundAIAgentTabs, setVisitedOutboundAIAgentTabs] = useState<Set<string>>(new Set(["trunk-profiles"]));
  const [visitedInboundAIAgentTabs, setVisitedInboundAIAgentTabs] = useState<Set<string>>(new Set(["trunk-profiles"]));

  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Initialize tabs from URL on mount
  useEffect(() => {
    if (router.isReady) {
      const { tab, subtab } = router.query;
      
      if (tab && typeof tab === 'string') {
        const mainTab = tab;
        setActiveTab(mainTab);
        setVisitedTabs(prev => new Set(prev).add(mainTab));
        
        // Set sub-tab based on main tab
        if (subtab && typeof subtab === 'string') {
          switch (mainTab) {
            case "user-management":
              setActiveUserManagementTab(subtab);
              setVisitedUserManagementTabs(prev => new Set(prev).add(subtab));
              break;
            case "crm":
              setActiveCrmTab(subtab);
              setVisitedCrmTabs(prev => new Set(prev).add(subtab));
              break;
            case "tickets":
              setActiveTicketsTab(subtab);
              setVisitedTicketsTabs(prev => new Set(prev).add(subtab));
              break;
            case "telco-gateway":
              setActiveTelcoTab(subtab);
              setVisitedTelcoTabs(prev => new Set(prev).add(subtab));
              break;
            case "devices-management":
              setActiveNetopsTab(subtab);
              setVisitedNetopsTabs(prev => new Set(prev).add(subtab));
              break;
            case "help-center":
              setActiveHelpCenterTab(subtab);
              setVisitedHelpCenterTabs(prev => new Set(prev).add(subtab));
              break;
            case "staff-insights":
              setActiveStaffInsightsTab(subtab);
              setVisitedStaffInsightsTabs(prev => new Set(prev).add(subtab));
              break;
            case "work-planner":
              setActiveWorkPlannerTab(subtab);
              setVisitedWorkPlannerTabs(prev => new Set(prev).add(subtab));
              break;
            case "ai-chat":
              setActiveAIChatTab(subtab);
              setVisitedAIChatTabs(prev => new Set(prev).add(subtab));
              break;
            case "ai-analysis":
              setActiveAIAnalysisTab(subtab);
              setVisitedAIAnalysisTabs(prev => new Set(prev).add(subtab));
              break;
            case "outbound-ai-agent":
              setActiveOutboundAIAgentTab(subtab);
              setVisitedOutboundAIAgentTabs(prev => new Set(prev).add(subtab));
              break;
            case "inbound-ai-agent":
              setActiveInboundAIAgentTab(subtab);
              setVisitedInboundAIAgentTabs(prev => new Set(prev).add(subtab));
              break;
            case "billing":
              setVisitedBillingTab(true);
              break;
          }
        } else {
          // If no subtab in URL, set default subtab for the main tab
          switch (mainTab) {
            case "user-management":
              setActiveUserManagementTab("user-directory");
              setVisitedUserManagementTabs(prev => new Set(prev).add("user-directory"));
              break;
            case "crm":
              setActiveCrmTab("campaigns");
              setVisitedCrmTabs(prev => new Set(prev).add("campaigns"));
              break;
            case "tickets":
              setActiveTicketsTab("statuses");
              setVisitedTicketsTabs(prev => new Set(prev).add("statuses"));
              break;
            case "telco-gateway":
              setActiveTelcoTab("assign-devices");
              setVisitedTelcoTabs(prev => new Set(prev).add("assign-devices"));
              break;
            case "devices-management":
              setActiveNetopsTab("devices-list");
              setVisitedNetopsTabs(prev => new Set(prev).add("devices-list"));
              break;
            case "help-center":
              setActiveHelpCenterTab("modules");
              setVisitedHelpCenterTabs(prev => new Set(prev).add("modules"));
              break;
            case "staff-insights":
              setActiveStaffInsightsTab("request-categories");
              setVisitedStaffInsightsTabs(prev => new Set(prev).add("request-categories"));
              break;
            case "work-planner":
              setActiveWorkPlannerTab("statuses");
              setVisitedWorkPlannerTabs(prev => new Set(prev).add("statuses"));
              break;
            case "ai-chat":
              setActiveAIChatTab("tools-profiles");
              setVisitedAIChatTabs(prev => new Set(prev).add("tools-profiles"));
              break;
            case "ai-analysis":
              setActiveAIAnalysisTab("manage-extensions");
              setVisitedAIAnalysisTabs(prev => new Set(prev).add("manage-extensions"));
              break;
            case "outbound-ai-agent":
              setActiveOutboundAIAgentTab("trunk-profiles");
              setVisitedOutboundAIAgentTabs(prev => new Set(prev).add("trunk-profiles"));
              break;
            case "inbound-ai-agent":
              setActiveInboundAIAgentTab("trunk-profiles");
              setVisitedInboundAIAgentTabs(prev => new Set(prev).add("trunk-profiles"));
              break;
            case "billing":
              setVisitedBillingTab(true);
              break;
          }
        }
      }
    }
  }, [router.isReady, router.query]);

  // Handle main tab change
  const handleMainTabChange = (key: string | null) => {
    const tabKey = key || "user-management";
    setActiveTab(tabKey);
    setVisitedTabs(prev => new Set(prev).add(tabKey));
    // Track billing tab when it becomes active
    if (tabKey === "billing") {
      setVisitedBillingTab(true);
    }
    
    // Update URL
    const defaultSubTab = getDefaultSubTab(tabKey);
    if (tabKey === "billing" || tabKey === "general-prefs" || tabKey === "notifications") {
      router.replace({
        pathname: router.pathname,
        query: { ...router.query, tab: tabKey }
      }, undefined, { shallow: true });
    } else {
      router.replace({
        pathname: router.pathname,
        query: { ...router.query, tab: tabKey, subtab: defaultSubTab }
      }, undefined, { shallow: true });
    }
  };

  // Get default sub-tab for a main tab
  const getDefaultSubTab = (mainTab: string): string => {
    switch (mainTab) {
      case "user-management": return "user-directory";
      case "crm": return "campaigns";
      case "tickets": return "statuses";
      case "telco-gateway": return "assign-devices";
      case "devices-management": return "devices-list";
      case "help-center": return "modules";
      case "staff-insights": return "request-categories";
      case "work-planner": return "statuses";
      case "ai-chat": return "tools-profiles";
      case "ai-analysis": return "manage-extensions";
      case "outbound-ai-agent": return "trunk-profiles";
      case "inbound-ai-agent": return "trunk-profiles";
      default: return "";
    }
  };

  // Handle sub-tab changes
  const handleUserManagementTabChange = (key: string | null) => {
    const tabKey = key || "user-directory";
    setActiveUserManagementTab(tabKey);
    setVisitedUserManagementTabs(prev => new Set(prev).add(tabKey));
    router.replace({
      pathname: router.pathname,
      query: { ...router.query, tab: "user-management", subtab: tabKey }
    }, undefined, { shallow: true });
  };

  const handleCrmTabChange = (key: string | null) => {
    const tabKey = key || "campaigns";
    setActiveCrmTab(tabKey);
    setVisitedCrmTabs(prev => new Set(prev).add(tabKey));
    router.replace({
      pathname: router.pathname,
      query: { ...router.query, tab: "crm", subtab: tabKey }
    }, undefined, { shallow: true });
  };

  const handleTicketsTabChange = (key: string | null) => {
    const tabKey = key || "statuses";
    setActiveTicketsTab(tabKey);
    setVisitedTicketsTabs(prev => new Set(prev).add(tabKey));
    router.replace({
      pathname: router.pathname,
      query: { ...router.query, tab: "tickets", subtab: tabKey }
    }, undefined, { shallow: true });
  };

  const handleTelcoTabChange = (key: string | null) => {
    const tabKey = key || "assign-devices";
    setActiveTelcoTab(tabKey);
    setVisitedTelcoTabs(prev => new Set(prev).add(tabKey));
    router.replace({
      pathname: router.pathname,
      query: { ...router.query, tab: "telco-gateway", subtab: tabKey }
    }, undefined, { shallow: true });
  };

  const handleNetopsTabChange = (key: string | null) => {
    const tabKey = key || "devices-list";
    setActiveNetopsTab(tabKey);
    setVisitedNetopsTabs(prev => new Set(prev).add(tabKey));
    router.replace({
      pathname: router.pathname,
      query: { ...router.query, tab: "devices-management", subtab: tabKey }
    }, undefined, { shallow: true });
  };

  const handleHelpCenterTabChange = (key: string | null) => {
    const tabKey = key || "modules";
    setActiveHelpCenterTab(tabKey);
    setVisitedHelpCenterTabs(prev => new Set(prev).add(tabKey));
    router.replace({
      pathname: router.pathname,
      query: { ...router.query, tab: "help-center", subtab: tabKey }
    }, undefined, { shallow: true });
  };

  const handleStaffInsightsTabChange = (key: string | null) => {
    const tabKey = key || "request-categories";
    setActiveStaffInsightsTab(tabKey);
    setVisitedStaffInsightsTabs(prev => new Set(prev).add(tabKey));
    router.replace({
      pathname: router.pathname,
      query: { ...router.query, tab: "staff-insights", subtab: tabKey }
    }, undefined, { shallow: true });
  };

  const handleWorkPlannerTabChange = (key: string | null) => {
    const tabKey = key || "statuses";
    setActiveWorkPlannerTab(tabKey);
    setVisitedWorkPlannerTabs(prev => new Set(prev).add(tabKey));
    router.replace({
      pathname: router.pathname,
      query: { ...router.query, tab: "work-planner", subtab: tabKey }
    }, undefined, { shallow: true });
  };

  const handleAIChatTabChange = (key: string | null) => {
    const tabKey = key || "tools-profiles";
    setActiveAIChatTab(tabKey);
    setVisitedAIChatTabs(prev => new Set(prev).add(tabKey));
    router.replace({
      pathname: router.pathname,
      query: { ...router.query, tab: "ai-chat", subtab: tabKey }
    }, undefined, { shallow: true });
  };

  const handleAIAnalysisTabChange = (key: string | null) => {
    const tabKey = key || "manage-extensions";
    setActiveAIAnalysisTab(tabKey);
    setVisitedAIAnalysisTabs(prev => new Set(prev).add(tabKey));
    router.replace({
      pathname: router.pathname,
      query: { ...router.query, tab: "ai-analysis", subtab: tabKey }
    }, undefined, { shallow: true });
  };

  const handleOutboundAIAgentTabChange = (key: string | null) => {
    const tabKey = key || "trunk-profiles";
    setActiveOutboundAIAgentTab(tabKey);
    setVisitedOutboundAIAgentTabs(prev => new Set(prev).add(tabKey));
    router.replace({
      pathname: router.pathname,
      query: { ...router.query, tab: "outbound-ai-agent", subtab: tabKey }
    }, undefined, { shallow: true });
  };

  const handleInboundAIAgentTabChange = (key: string | null) => {
    const tabKey = key || "trunk-profiles";
    setActiveInboundAIAgentTab(tabKey);
    setVisitedInboundAIAgentTabs(prev => new Set(prev).add(tabKey));
    router.replace({
      pathname: router.pathname,
      query: { ...router.query, tab: "inbound-ai-agent", subtab: tabKey }
    }, undefined, { shallow: true });
  };

  // Check if a tab should render
  const shouldRenderTab = (mainTab: string, subTab?: string) => {
    if (!visitedTabs.has(mainTab)) return false;
    if (activeTab !== mainTab) return false;
    
    if (subTab) {
      switch (mainTab) {
        case "user-management":
          return visitedUserManagementTabs.has(subTab) && activeUserManagementTab === subTab;
        case "crm":
          return visitedCrmTabs.has(subTab) && activeCrmTab === subTab;
        case "tickets":
          return visitedTicketsTabs.has(subTab) && activeTicketsTab === subTab;
        case "telco-gateway":
          return visitedTelcoTabs.has(subTab) && activeTelcoTab === subTab;
        case "devices-management":
          return visitedNetopsTabs.has(subTab) && activeNetopsTab === subTab;
        case "billing":
          return visitedBillingTab;
        case "help-center":
          return visitedHelpCenterTabs.has(subTab) && activeHelpCenterTab === subTab;
        case "staff-insights":
          return visitedStaffInsightsTabs.has(subTab) && activeStaffInsightsTab === subTab;
        case "work-planner":
          return visitedWorkPlannerTabs.has(subTab) && activeWorkPlannerTab === subTab;
        case "ai-chat":
          return visitedAIChatTabs.has(subTab) && activeAIChatTab === subTab;
        case "ai-analysis":
          return visitedAIAnalysisTabs.has(subTab) && activeAIAnalysisTab === subTab;
        case "outbound-ai-agent":
          return visitedOutboundAIAgentTabs.has(subTab) && activeOutboundAIAgentTab === subTab;
        case "inbound-ai-agent":
          return visitedInboundAIAgentTabs.has(subTab) && activeInboundAIAgentTab === subTab;
        case "general-prefs":
        case "notifications":
          return true;
        default:
          return false;
      }
    }
    return true;
  };

  // Your Preferences (same as main-settings sidebar)
  const preferenceSidebarItems = [
    { id: 'general-prefs', label: 'General' },
    { id: 'notifications', label: 'Notifications' },
  ];

  // Define main tabs with icons and colors
  const mainTabs = [
    {
      key: "user-management",
      title: "User Management",
      icon: UsersIcon,
      color: "#6c757d",
      permission: PERMISSIONS.CONTROL_HUB_SERVICES
    },
    {
      key: "crm",
      title: "CRM Management",
      icon: Briefcase,
      color: "#0d6efd",
      permission: PERMISSIONS.CRM_SERVICES
    },
    {
      key: "telco-gateway",
      title: "Carrier Gateway",
      icon: Phone,
      color: "#ff9800",
      permission: PERMISSIONS.GSM_SERVICES
    },
    {
      key: "billing",
      title: "Billing & Payments",
      icon: CreditCard,
      color: "#9c27b0",
      permission: PERMISSIONS.ACCOUNTS_SERVICES
    },
    {
      key: "devices-management",
      title: "Devices Management",
      icon: Network,
      color: "#f44336",
      permission: PERMISSIONS.NETOPS_SERVICES
    },
    {
      key: "tickets",
      title: "Tickets",
      icon: Ticket,
      color: "#2196f3",
      permission: PERMISSIONS.TICKETS_SERVICES
    },

    {
      key: "help-center",
      title: "Help Center",
      icon: HelpCircle,
      color: "#17a2b8",
      permission: PERMISSIONS.TICKETS_SERVICES // Using tickets permission for now, adjust if needed
    },
    {
      key: "staff-insights",
      title: "Staff Insights",
      icon: ClipboardList,
      color: "#5c6bc0",
      permission: PERMISSIONS.VIEW_REQUEST_CATEGORIES_STAFF_MANAGEMENT
    },
    {
      key: "work-planner",
      title: "Work Planner",
      icon: CalendarCheck,
      color: "#26a69a",
      permission: PERMISSIONS.WORK_PLANNER_SERVICES
    },
    {
      key: "ai-chat",
      title: "AI Chat",
      icon: Bot,
      color: "#7c4dff",
      permission: PERMISSIONS.AI_ML_SERVICES
    },
    {
      key: "ai-analysis",
      title: "AI Analysis",
      icon: BarChart2,
      color: "#00bcd4",
      permission: PERMISSIONS.AI_ML_SERVICES
    },
    {
      key: "outbound-ai-agent",
      title: "Outbound Ai Agent",
      icon: PhoneOutgoing,
      color: "#00897b",
      permission: PERMISSIONS.AI_ML_SERVICES
    },
    {
      key: "inbound-ai-agent",
      title: "Inbound Ai Agent",
      icon: PhoneIncoming,
      color: "#5e35b1",
      permission: PERMISSIONS.AI_ML_SERVICES
    }
  ];

  // Define sub-tabs for each main tab
  const subTabsConfig: Record<string, Array<{key: string, title: string, icon: any, color: string, permission: string}>> = {
    "user-management": [
      { key: "user-directory", title: "User Directory", icon: UsersIcon, color: "#6c757d", permission: PERMISSIONS.VIEW_USERS },
      { key: "supervisor-teams", title: "Supervisor Teams", icon: UserCheck, color: "#0d6efd", permission: PERMISSIONS.VIEW_TEAMS },
      { key: "management-groups", title: "Management Groups", icon: Building2, color: "#198754", permission: PERMISSIONS.VIEW_GROUPS },
      { key: "ranks-and-permissions", title: "Ranks and Permissions", icon: Shield, color: "#ff9800", permission: PERMISSIONS.VIEW_RANKS }
    ],
    "crm": [
      { key: "stages", title: "Stages", icon: Layers, color: "#ff9800", permission: PERMISSIONS.VIEW_CRM_STAGES },
      { key: "product-groups", title: "Product Groups", icon: Building2, color: "#6c757d", permission: PERMISSIONS.VIEW_CRM_INDUSTRIES },
      { key: "products", title: "Products", icon: Package, color: "#198754", permission: PERMISSIONS.VIEW_CRM_PRODUCTS },
      { key: "deal-templates", title: "Deal Templates", icon: FileText, color: "#9c27b0", permission: PERMISSIONS.VIEW_CRM_DEAL_TEMPLATES },
      { key: "business-types", title: "Business Types", icon: Building2, color: "#198754", permission: PERMISSIONS.VIEW_CRM_BUSINESS_TYPES },
      { key: "campaigns", title: "Campaigns", icon: Megaphone, color: "#0d6efd", permission: PERMISSIONS.VIEW_CRM_CAMPAIGNS }
    ],
    "telco-gateway": [
      { key: "assign-devices", title: "Assign Devices", icon: SettingsIcon, color: "#0d6efd", permission: PERMISSIONS.VIEW_GSM_ASSIGNMENT },
      { key: "sync-gsm", title: "Sync GSM", icon: ArrowUp, color: "#198754", permission: PERMISSIONS.VIEW_GSM_SYNC },
      { key: "company-profiling", title: "Company Profiling", icon: Building2, color: "#ff9800", permission: PERMISSIONS.VIEW_GSM_COMPANY_PROFILLING }
    ],
    "devices-management": [
      { key: "devices-list", title: "Devices List", icon: Network, color: "#0d6efd", permission: PERMISSIONS.VIEW_NETOPS_DEVICES },
      { key: "services", title: "Services", icon: SettingsIcon, color: "#198754", permission: PERMISSIONS.VIEW_SERVICES_NETOPS },
      { key: "alerts", title: "Alerts", icon: AlertCircle, color: "#f44336", permission: PERMISSIONS.VIEW_NETOPS_ALERTS }
    ],
    "tickets": [
      { key: "statuses", title: "Statuses", icon: CheckCircle, color: "#0d6efd", permission: PERMISSIONS.VIEW_TICKETS_STATUS },
      { key: "modules", title: "Modules", icon: Layers, color: "#198754", permission: PERMISSIONS.VIEW_TICKETS_MODULES },
      { key: "categories", title: "Categories", icon: Package, color: "#ff9800", permission: PERMISSIONS.VIEW_TICKETS_CATEGORIES },
      { key: "sub-categories", title: "Sub Categories", icon: Layers, color: "#9c27b0", permission: PERMISSIONS.VIEW_TICKETS_SUBCATEGORIES },
      { key: "types", title: "Types", icon: Ticket, color: "#2196f3", permission: PERMISSIONS.VIEW_TICKETS_TYPES }
    ],
    "help-center": [
      { key: "modules", title: "FAQ Modules", icon: Layers, color: "#0d6efd", permission: PERMISSIONS.TICKETS_SERVICES },
      { key: "topics", title: "FAQ Topics", icon: Tag, color: "#ff9800", permission: PERMISSIONS.TICKETS_SERVICES },
      { key: "items", title: "FAQ Items", icon: HelpCircle, color: "#198754", permission: PERMISSIONS.TICKETS_SERVICES },
      { key: "types", title: "FAQ Types", icon: Tag, color: "#17a2b8", permission: PERMISSIONS.TICKETS_SERVICES }
    ],
    "staff-insights": [
      { key: "request-categories", title: "Request Categories", icon: ClipboardList, color: "#5c6bc0", permission: PERMISSIONS.VIEW_REQUEST_CATEGORIES_STAFF_MANAGEMENT },
      // { key: "sub-categories", title: "Sub-Categories", icon: Layers, color: "#5c6bc0", permission: PERMISSIONS.VIEW_REQUEST_CATEGORIES_STAFF_MANAGEMENT }
    ],
    "work-planner": [
      { key: "statuses", title: "Statuses", icon: CalendarCheck, color: "#26a69a", permission: PERMISSIONS.WORK_PLANNER_SERVICES }
    ],
    "ai-chat": [
      { key: "tools-profiles", title: "Tools Profiles", icon: Wrench, color: "#7c4dff", permission: PERMISSIONS.AI_ML_SERVICES },
      { key: "faq-profiles", title: "FAQ Profiles", icon: MessageCircle, color: "#7c4dff", permission: PERMISSIONS.AI_ML_SERVICES },
      { key: "tenant-profile", title: "Tenant Profile", icon: Building2, color: "#7c4dff", permission: PERMISSIONS.AI_ML_SERVICES },
      { key: "global-faqs", title: "Global FAQs", icon: Globe, color: "#7c4dff", permission: PERMISSIONS.AI_ML_SERVICES }
    ],
    "ai-analysis": [
      { key: "manage-extensions", title: "Manage Extensions", icon: SettingsCogIcon, color: "#00bcd4", permission: PERMISSIONS.MANAGE_EXTENSIONS_AIML },
      { key: "backend-operations", title: "Backend Operations", icon: Wrench, color: "#00bcd4", permission: PERMISSIONS.TRANSLATE_AIML },
      { key: "manual-analysis", title: "Manual Analysis", icon: FileText, color: "#00bcd4", permission: PERMISSIONS.TRANSCRIPTION_ANALYSIS_AIML }
    ],
    "outbound-ai-agent": [
      { key: "trunk-profiles", title: "Trunk Profiles", icon: SettingsCogIcon, color: "#00897b", permission: PERMISSIONS.AI_ML_SERVICES },
      { key: "bot-profiles", title: "Bot Profiles", icon: Bot, color: "#00897b", permission: PERMISSIONS.AI_ML_SERVICES }
    ],
    "inbound-ai-agent": [
      { key: "trunk-profiles", title: "Trunk Profiles", icon: SettingsCogIcon, color: "#5e35b1", permission: PERMISSIONS.AI_ML_SERVICES },
      { key: "bot-profiles", title: "Bot Profiles", icon: Bot, color: "#5e35b1", permission: PERMISSIONS.AI_ML_SERVICES },
      { key: "faqs", title: "FAQs", icon: HelpCircle, color: "#5e35b1", permission: PERMISSIONS.AI_ML_SERVICES }
    ]
  };

  const getActiveSubTab = (mainTab: string) => {
    switch(mainTab) {
      case "user-management": return activeUserManagementTab;
      case "crm": return activeCrmTab;
      case "tickets": return activeTicketsTab;
      case "telco-gateway": return activeTelcoTab;
      case "devices-management": return activeNetopsTab;
      case "help-center": return activeHelpCenterTab;
      case "staff-insights": return activeStaffInsightsTab;
      case "work-planner": return activeWorkPlannerTab;
      case "ai-chat": return activeAIChatTab;
      case "ai-analysis": return activeAIAnalysisTab;
      case "outbound-ai-agent": return activeOutboundAIAgentTab;
      case "inbound-ai-agent": return activeInboundAIAgentTab;
      default: return "";
    }
  };

  const handleSubTabClick = (mainTab: string, subTabKey: string) => {
    switch(mainTab) {
      case "user-management": handleUserManagementTabChange(subTabKey); break;
      case "crm": handleCrmTabChange(subTabKey); break;
      case "tickets": handleTicketsTabChange(subTabKey); break;
      case "telco-gateway": handleTelcoTabChange(subTabKey); break;
      case "devices-management": handleNetopsTabChange(subTabKey); break;
      case "help-center": handleHelpCenterTabChange(subTabKey); break;
      case "staff-insights": handleStaffInsightsTabChange(subTabKey); break;
      case "work-planner": handleWorkPlannerTabChange(subTabKey); break;
      case "ai-chat": handleAIChatTabChange(subTabKey); break;
      case "ai-analysis": handleAIAnalysisTabChange(subTabKey); break;
      case "outbound-ai-agent": handleOutboundAIAgentTabChange(subTabKey); break;
      case "inbound-ai-agent": handleInboundAIAgentTabChange(subTabKey); break;
    }
  };

  // Build search suggestions (all items + filter by query)
  const searchSuggestions = React.useMemo(() => {
    const list: Array<{ label: string; mainKey: string; subKey?: string; section: string }> = [];
    preferenceSidebarItems.forEach((item) => {
      list.push({ label: item.label, mainKey: item.id, section: 'Your Preferences' });
    });
    mainTabs.forEach((tab) => {
      if (!session?.user?.permissions?.includes(tab.permission)) return;
      if (tab.key === 'help-center' && Number(session?.user?.is_admin) !== 1) return;
      list.push({ label: tab.title, mainKey: tab.key, section: 'Account Management' });
      const subs = subTabsConfig[tab.key];
      subs?.forEach((sub) => {
        if (!session?.user?.permissions?.includes(sub.permission)) return;
        list.push({ label: sub.title, mainKey: tab.key, subKey: sub.key, section: tab.title });
      });
    });
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return list.filter((item) => item.label.toLowerCase().includes(q));
  }, [searchQuery, session?.user?.permissions, session?.user?.is_admin]);

  const handleSuggestionSelect = (item: { label: string; mainKey: string; subKey?: string }) => {
    handleMainTabChange(item.mainKey);
    if (item.subKey) {
      handleSubTabClick(item.mainKey, item.subKey);
    }
    setSearchQuery('');
    setShowSearch(false);
  };

  return (
    <React.Fragment>
      <style>{`
        /* Left sidebar – main tabs (aligned with main-settings sidebar) */
        .settings-sidebar {
          width: 255px;
          min-width: 255px;
          background: #ffffff;
          border-right: 1px solid #e8e8e8;
          padding: 21px;
          display: flex;
          flex-direction: column;
          gap: 0;
          height: 100%;
          position: sticky;
          top: 0;
          overflow-y: auto;
        }

        .settings-sidebar-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 20px;
          cursor: pointer;
          background: transparent;
          border: none;
          border-left: 3px solid transparent;
          width: 100%;
          text-align: left;
          font-family: 'Lexend Deca', Helvetica, Arial, sans-serif;
          font-size: 14px;
          font-weight: 300;
          color: #141414;
          line-height: 24px;
          transition: background 0.12s, border-color 0.12s;
        }

        .settings-sidebar-item:hover {
          background: #f5f5f5;
        }

        .settings-sidebar-item.active {
          background: whitesmoke;
          border-left-color: #141414;
          font-weight: 400;
        }

        .settings-sidebar-item.search-match {
          background: #f0f7ff;
        }

        .settings-sidebar-item .filter-icon {
          color: inherit;
          flex-shrink: 0;
        }

        .settings-sidebar-group-heading {
          font-family: 'Lexend Deca', Helvetica, Arial, sans-serif;
          font-weight: 600;
          font-size: 16px;
          color: #141414;
          line-height: 20px;
          padding: 12px 20px 6px;
          margin-bottom: 0;
        }

        .settings-search-suggestions {
          position: absolute;
          left: 0;
          right: 0;
          top: 100%;
          margin-top: 4px;
          background: #fff;
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          max-height: 280px;
          overflow-y: auto;
          z-index: 100;
        }
        .settings-search-suggestion-item {
          display: block;
          width: 100%;
          padding: 10px 12px;
          text-align: left;
          border: none;
          background: none;
          cursor: pointer;
          font-family: 'Lexend Deca', Helvetica, Arial, sans-serif;
          font-size: 13px;
          color: #141414;
          transition: background 0.1s;
        }
        .settings-search-suggestion-item:hover {
          background: #f0f7ff;
        }
        .settings-search-suggestion-item .suggestion-section {
          font-size: 11px;
          color: #888;
          margin-top: 2px;
        }

        /* Sub-tabs – horizontal bar (same design language as main-settings tabs) */
        .settings-sub-filter-buttons {
          display: flex;
          flex-direction: row;
          align-items: center;
          flex-wrap: wrap;
          margin-bottom: 32px;
          padding: 0;
          width: 100%;
          overflow: hidden;
        }

        .settings-sub-filter-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          border: 1px solid #e0e0e0;
          border-right: none;
          font-family: 'Lexend Deca', Helvetica, Arial, sans-serif;
          font-weight: 300;
          font-size: 14px;
          color: #141414;
          cursor: pointer;
          transition: background 0.15s;
          background: whitesmoke;
          white-space: nowrap;
          position: relative;
          top: 1px;
          box-sizing: border-box;
        }

        .settings-sub-filter-button:last-child {
          border-right: 1px solid #e0e0e0;
        }

        .settings-sub-filter-button:hover:not(.active) {
          background: #f0f0f0;
        }

        .settings-sub-filter-button.active {
          background: #ffffff;
          border-bottom: 2px solid #ffffff;
          font-weight: 400;
        }

        .settings-sub-filter-button:not(.active) {
          border-bottom: 2px solid #e0e0e0;
        }

        .settings-sub-filter-button.search-match {
          background: #f0f7ff;
        }

        .settings-sub-filter-button.active .filter-icon {
          color: inherit;
        }

        .settings-sub-filter-button:not(.active) .filter-icon {
          color: inherit;
        }

        .filter-icon {
          display: none;
          width: 18px;
          height: 18px;
          flex-shrink: 0;
        }
      `}</style>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Settings" />

    

      <div
        style={{
          display: 'flex',
          minHeight: 'calc(100vh - 120px)',
          background: '#ffffff',
          fontFamily: "'Lexend Deca', Helvetica, Arial, sans-serif",
        }}
      >
        {/* Left sidebar – main tabs */}
        <aside className="settings-sidebar">
          {/* Settings heading + search icon */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingLeft: '20px',
              paddingRight: '20px',
              marginBottom: '20px',
            }}
          >
            <span
              style={{
                fontSize: '20px',
                fontStyle: 'normal',
                fontWeight: 600,
                textTransform: 'none',
                fontFamily: "'Lexend Deca', Helvetica, Arial, sans-serif",
                letterSpacing: '0px',
                lineHeight: '24px',
                color: '#141414',
              }}
            >
              Settings
            </span>
            <button
              type="button"
              onClick={() => setShowSearch(!showSearch)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                color: '#555',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Search settings"
            >
              <Search size={18} />
            </button>
          </div>

          {/* Search Input + Suggestions */}
          {showSearch && (
            <div style={{ paddingLeft: '20px', paddingRight: '20px', marginBottom: '16px' }}>
              <div style={{ position: 'relative' }}>
                <Search
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#888',
                    pointerEvents: 'none',
                  }}
                />
                <input
                  type="text"
                  placeholder="Search settings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 34px',
                    fontSize: '13px',
                    fontFamily: "'Lexend Deca', Helvetica, Arial, sans-serif",
                    color: '#141414',
                    border: '1px solid #d0d0d0',
                    borderRadius: '4px',
                    outline: 'none',
                    background: '#fff',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#006162')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#d0d0d0')}
                />
                {searchQuery.trim() && searchSuggestions.length > 0 && (
                  <div className="settings-search-suggestions">
                    {searchSuggestions.map((item, idx) => (
                      <button
                        key={`${item.mainKey}-${item.subKey ?? 'main'}-${idx}`}
                        type="button"
                        className="settings-search-suggestion-item"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSuggestionSelect(item);
                        }}
                      >
                        <div>{item.label}</div>
                        <div className="suggestion-section">{item.section}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Your Preferences */}
          <>
            <div className="settings-sidebar-group-heading">Your Preferences</div>
            {preferenceSidebarItems.map((item) => {
              const isActive = activeTab === item.id;
              const matchesSearch = searchQuery.trim() && item.label.toLowerCase().includes(searchQuery.trim().toLowerCase());
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`settings-sidebar-item ${isActive ? 'active' : ''} ${matchesSearch ? 'search-match' : ''}`}
                  onClick={() => handleMainTabChange(item.id)}
                >
                  <span>{item.label}</span>
                </button>
              );
            })}
          </>

          {/* Account Management */}
          <>
            <div className="settings-sidebar-group-heading">Services</div>
            {mainTabs
              .filter((tab) => {
                if (!session?.user?.permissions?.includes(tab.permission)) return false;
                if (tab.key === "help-center" && Number(session?.user?.is_admin) !== 1) return false;
                return true;
              })
              .map((tab) => {
                const IconComponent = tab.icon;
                const isActive = activeTab === tab.key;
                const q = searchQuery.trim().toLowerCase();
                const mainMatches = q && tab.title.toLowerCase().includes(q);
                const subTabs = subTabsConfig[tab.key];
                const subMatches = q && subTabs?.some(
                  (sub) =>
                    session?.user?.permissions?.includes(sub.permission) &&
                    sub.title.toLowerCase().includes(q)
                );
                const matchesSearch = !!(mainMatches || subMatches);
                return (
                  <button
                    key={tab.key}
                    type="button"
                    className={`settings-sidebar-item ${isActive ? 'active' : ''} ${matchesSearch ? 'search-match' : ''}`}
                    onClick={() => handleMainTabChange(tab.key)}
                  >
                    <IconComponent className="filter-icon" size={18} style={{ color: isActive ? tab.color : undefined }} />
                    <span>{tab.title}</span>
                  </button>
                );
              })}
          </>
        </aside>

        {/* Right content area */}
        <main
          style={{
            flex: 1,
            background: '#ffffff',
            overflowY: 'auto',
            minWidth: 0,
          }}
        >
          <Row>
            <Col md={12}>
              <Card className="shadow-sm border-0">
                <Card.Body style={{ padding: 0 }}>
                  {/* Sub-tabs (horizontal bar) */}
                  {subTabsConfig[activeTab] && subTabsConfig[activeTab].length > 0 && (
                    <div>
                      <div className="settings-sub-filter-buttons px-3 py-3 shadow">
                  {subTabsConfig[activeTab]
                    .filter((subTab) => session?.user?.permissions?.includes(subTab.permission))
                    .map((subTab) => {
                      const SubIconComponent = subTab.icon;
                      const isActive = getActiveSubTab(activeTab) === subTab.key;
                      const matchesSearch = searchQuery.trim() && subTab.title.toLowerCase().includes(searchQuery.trim().toLowerCase());
                      return (
                        <button
                          key={subTab.key}
                          className={`settings-sub-filter-button ${isActive ? 'active' : ''} ${matchesSearch ? 'search-match' : ''}`}
                          onClick={() => handleSubTabClick(activeTab, subTab.key)}
                        >
                          <SubIconComponent className="filter-icon" size={16} style={{ color: isActive ? subTab.color : undefined }} />
                          <span>{subTab.title}</span>
                        </button>
                      );
                    })}
                      </div>
                    </div>
                  )}

                  {/* Tab Content */}
                  <div >
                {/* Your Preferences – placeholder content */}
                {activeTab === "general-prefs" && <GeneralSettings />}
                {/* {activeTab === "general-prefs" && (
                  <div>
                    <h2 style={{ fontFamily: "'Lexend Deca', Helvetica, Arial, sans-serif", fontSize: '20px', fontWeight: 600, color: '#141414', marginBottom: '16px' }}>General</h2>
                    <p style={{ fontFamily: "'Lexend Deca', Helvetica, Arial, sans-serif", fontSize: '14px', color: '#555' }}>Content for this section goes here.</p>
                  </div>
                )} */}
                {/* {activeTab === "notifications" && <NotificationsPage />} */}
                {activeTab === "notifications" && <NotificationsSettingsNew />}
                {/* User Management Content */}
                {activeTab === "user-management" && shouldRenderTab("user-management", activeUserManagementTab) && (
                  <div>
                    {activeUserManagementTab === "user-directory" && <Users />}
                    {activeUserManagementTab === "supervisor-teams" && <Teams />}
                    {activeUserManagementTab === "management-groups" && <Groups />}
                    {activeUserManagementTab === "ranks-and-permissions" && <Ranks />}
                  </div>
                )}
                {/* CRM Content */}
                {activeTab === "crm" && shouldRenderTab("crm", activeCrmTab) && (
                  <div>
                    {activeCrmTab === "campaigns" && <Campaigns />}
                    {activeCrmTab === "product-groups" && <Industries />}
                    {activeCrmTab === "products" && <Products />}
                    {activeCrmTab === "stages" && <Stages />}
                    {activeCrmTab === "deal-templates" && <DealTemplates />}
                    {activeCrmTab === "business-types" && <BusinessTypes />}
                  </div>
                )}

               {/*  Telco Gateway Content */}
                {activeTab === "telco-gateway" && shouldRenderTab("telco-gateway", activeTelcoTab) && (
                  <div>
                    {activeTelcoTab === "assign-devices" && <GsmAssign />}
                    {activeTelcoTab === "sync-gsm" && <GsmSync />}
                    {activeTelcoTab === "company-profiling" && <CompanyPO />}
                  </div>
                )}

                {/* Billing Content */}
                {activeTab === "billing" && shouldRenderTab("billing") && session?.user?.permissions?.includes(PERMISSIONS.VIEW_PAYMENT_METHODS_BILLING) && (
                  <div>
                    <PaymentMethods />
                  </div>
                )}

            

                {/* Devices Management Content */}
                {activeTab === "devices-management" && shouldRenderTab("devices-management", activeNetopsTab) && (
                  <div>
                    {activeNetopsTab === "devices-list" && <Devices />}
                    {activeNetopsTab === "services" && <Services />}
                    {activeNetopsTab === "alerts" && <Alerts />}
                  </div>
                )}

                {/* Tickets Content */}
                {activeTab === "tickets" && shouldRenderTab("tickets", activeTicketsTab) && (
                  <div>
                    {activeTicketsTab === "statuses" && <TicketStatuses />}
                    {activeTicketsTab === "modules" && <TicketModules />}
                    {activeTicketsTab === "categories" && <ModuleCategories />}
                    {activeTicketsTab === "sub-categories" && <ModuleSubCategories />}
                    {activeTicketsTab === "types" && <TicketTypes />}
                  </div>
                )}

                {/* Help Center Content */}
                {activeTab === "help-center" && shouldRenderTab("help-center", activeHelpCenterTab) && (
                  <div>
                    {activeHelpCenterTab === "modules" && <FAQModules />}
                    {activeHelpCenterTab === "topics" && <FAQTopics />}
                    {activeHelpCenterTab === "items" && <FAQItems />}
                    {activeHelpCenterTab === "types" && <FAQTypes />}
                  </div>
                )}

                {/* Staff Insights Content */}
                {activeTab === "staff-insights" && shouldRenderTab("staff-insights", activeStaffInsightsTab) && (
                  <div>
                    {activeStaffInsightsTab === "request-categories" && <RequestCategories />}
                    {/* {activeStaffInsightsTab === "sub-categories" && <RequestSubCategories />} */}
                  </div>
                )}

                {/* Work Planner Content */}
                {activeTab === "work-planner" && shouldRenderTab("work-planner", activeWorkPlannerTab) && (
                  <div>
                    {activeWorkPlannerTab === "statuses" && <WorkPlannerStatuses />}
                  </div>
                )}

                {/* AI Chat Content */}
                {activeTab === "ai-chat" && shouldRenderTab("ai-chat", activeAIChatTab) && (
                  <div>
                    {activeAIChatTab === "tools-profiles" && <ToolProfiles />}
                    {activeAIChatTab === "faq-profiles" && <FaqProfiles />}
                    {activeAIChatTab === "tenant-profile" && <AIChatFAQsTenant />}
                    {activeAIChatTab === "global-faqs" && <AIChatFAQsGlobal />}
                  </div>
                )}

                {/* AI Analysis Content */}
                {activeTab === "ai-analysis" && shouldRenderTab("ai-analysis", activeAIAnalysisTab) && (
                  <div>
                    {activeAIAnalysisTab === "manage-extensions" && <ManageExtensions />}
                    {activeAIAnalysisTab === "backend-operations" && <BackendOperations />}
                    {activeAIAnalysisTab === "manual-analysis" && <ManualAnalysis />}
                  </div>
                )}

                {/* Outbound Ai Agent Content */}
                {activeTab === "outbound-ai-agent" && shouldRenderTab("outbound-ai-agent", activeOutboundAIAgentTab) && (
                  <div>
                    {activeOutboundAIAgentTab === "trunk-profiles" && <OutboundTrunkProfiles />}
                    {activeOutboundAIAgentTab === "bot-profiles" && <AIMLProfiles />}
                  </div>
                )}

                {/* Inbound Ai Agent Content */}
                {activeTab === "inbound-ai-agent" && shouldRenderTab("inbound-ai-agent", activeInboundAIAgentTab) && (
                  <div>
                    {activeInboundAIAgentTab === "trunk-profiles" && <InboundTrunkProfiles />}
                    {activeInboundAIAgentTab === "bot-profiles" && <InboundBotProfiles />}
                    {activeInboundAIAgentTab === "faqs" && <InboundFAQs />}
                  </div>
                )}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </main>
      </div>
    </React.Fragment>
  );
};

Settings.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default Settings;
