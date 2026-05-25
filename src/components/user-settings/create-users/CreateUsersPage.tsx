import { useCallback, useEffect, useRef, useState } from "react";
import type { JSX, RefObject } from "react";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import { ChevronDown, ChevronRight, ExternalLink, Search, X } from "lucide-react";

import { ACCESS_METHODS, ALL_TEMPLATE_ITEMS, SEAT_OPTIONS, SELECTABLE_USERS, STEPS, TEMPLATE_GROUPS } from "./data";
import { IconKeys, IconLock, IconPencil, IconRuler, MagnifyPlaceholder } from "./icons";
import { BASE_BUTTON, FONT, PRIMARY_TEXT } from "./styles";
import type { AccessMethod, PermCategory, PermStatus } from "./types";
import { LinkButton } from "@components/shared/LinkButton";
import { DEFAULT_USERS_DIRECTORY_PATH } from "@utils/controlhub/usersNavigation";

function useClickOutside({
  open,
  ref,
  onOutside,
}: Readonly<{
  open: boolean;
  ref: RefObject<HTMLElement | null>;
  onOutside: () => void;
}>): void {
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onOutside();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, ref, onOutside]);
}

function useAutofocusOnOpen({
  open,
  focusRef,
}: Readonly<{ open: boolean; focusRef: RefObject<HTMLInputElement | null> }>): void {
  useEffect(() => {
    if (!open) return;
    const t = globalThis.setTimeout(() => focusRef.current?.focus(), 10);
    return () => globalThis.clearTimeout(t);
  }, [open, focusRef]);
}

function AccessMethodIcon({ id }: Readonly<{ id: AccessMethod["id"] }>): JSX.Element {
  if (id === "seat_permissions") return <IconLock />;
  if (id === "super_admin") return <IconKeys />;
  if (id === "template") return <IconRuler />;
  return <IconPencil />;
}

function PermDot({ status }: Readonly<{ status: PermStatus }>): JSX.Element {
  const isCircle = status.includes("circle");
  const isGreen = status.includes("green");
  const color = isGreen ? "#00bda5" : "#d1d5db";

  return (
    <span
      aria-hidden="true"
      style={{
        display: "inline-block",
        width: 10,
        height: 10,
        borderRadius: "50%",
        flexShrink: 0,
        border: isCircle ? `2px solid ${color}` : "none",
        backgroundColor: isCircle ? "transparent" : color,
      }}
    />
  );
}

function PermissionsGrid({ categories }: Readonly<{ categories: PermCategory[] }>): JSX.Element {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const getAccessLabel = (status: PermStatus) => {
    if (status === "green-circle") return "Full Access";
    if (status === "green-dot") return "Partial access";
    return "No Access";
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "0 32px",
        marginTop: "50px",
      }}
    >
      {categories.map((cat) => (
        <div key={cat.title}>
          <p style={{ fontFamily: FONT, fontSize: "16px", fontWeight: 600, color: PRIMARY_TEXT, margin: "0 0 14px 0" }}>
            {cat.title}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "11px" }}>
            {cat.items.map((item) => {
              const itemKey = `${cat.title}-${item.name}`;
              const tooltipLabel = getAccessLabel(item.status);
              const isHovered = hoveredItem === itemKey;

              const tooltipId = `perm-tooltip-${itemKey}`.toLowerCase().replaceAll(/[^a-z0-9_-]+/g, "-");
              const showTooltip = () => setHoveredItem(itemKey);
              const hideTooltip = () => setHoveredItem(null);

              return (
                <button
                  key={item.name}
                  type="button"
                  onMouseEnter={showTooltip}
                  onMouseLeave={hideTooltip}
                  onFocus={showTooltip}
                  onBlur={hideTooltip}
                  aria-describedby={isHovered ? tooltipId : undefined}
                  style={{
                    border: "none",
                    padding: 0,
                    background: "none",
                    cursor: "default",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    position: "relative",
                    width: "fit-content",
                    textAlign: "left",
                  }}
                >
                  <PermDot status={item.status} />
                  <span style={{ fontFamily: FONT, fontSize: "14px", fontWeight: 300, color: PRIMARY_TEXT, lineHeight: "18px" }}>{item.name}</span>
                  {isHovered && (
                    <span
                      id={tooltipId}
                      role="tooltip"
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: "calc(100% + 8px)",
                        transform: "translateY(-50%)",
                        backgroundColor: "#141414",
                        color: "#ffffff",
                        fontFamily: FONT,
                        fontSize: "12px",
                        fontWeight: 400,
                        lineHeight: "16px",
                        padding: "6px 10px",
                        borderRadius: "4px",
                        whiteSpace: "nowrap",
                        zIndex: 1100,
                        pointerEvents: "none",
                      }}
                    >
                      {tooltipLabel}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function TemplateDropdown({ value, onChange }: Readonly<{ value: string; onChange: (id: string) => void }>): JSX.Element {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selectedItem = ALL_TEMPLATE_ITEMS.find((i) => i.id === value);
  const selectedLabel = selectedItem?.label ?? "";

  const filteredGroups = TEMPLATE_GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((i) => i.label.toLowerCase().includes(search.toLowerCase())),
  })).filter((g) => g.items.length > 0);

  const close = useCallback(() => {
    setOpen(false);
    setSearch("");
  }, []);

  useClickOutside({ open, ref, onOutside: close });
  useAutofocusOnOpen({ open, focusRef: searchRef });

  return (
    <div ref={ref} style={{ position: "relative", width: "420px" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        style={{
          height: "42px",
          width: "100%",
          border: `1px solid ${open ? "#141414" : "rgb(138,138,138)"}`,
          borderRadius: open ? "4px 4px 0 0" : "4px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 12px",
          cursor: "pointer",
          backgroundColor: "#fff",
          boxSizing: "border-box",
          gap: "8px",
          textAlign: "left",
        }}
      >
        <span style={{ fontFamily: FONT, fontSize: "16px", fontWeight: 300, color: selectedLabel ? "#141414" : "#6b7280", flex: 1 }}>
          {selectedLabel || "Choose a template"}
        </span>
        <ChevronDown
          size={16}
          color="#555"
          style={{ flexShrink: 0, transition: "transform 150ms ease-out", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            border: "1px solid #2563eb",
            borderTop: "none",
            borderRadius: "0 0 4px 4px",
            backgroundColor: "#fff",
            zIndex: 300,
            boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
          }}
        >
          <div style={{ padding: "8px 10px", borderBottom: "1px solid #e5e7eb" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", border: "2px solid #2563eb", borderRadius: "4px", padding: "6px 10px" }}>
              <Search size={14} color="#6b7280" style={{ flexShrink: 0 }} />
              <input
                ref={searchRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search"
                aria-label="Search templates"
                style={{
                  border: "none",
                  outline: "none",
                  flex: 1,
                  fontFamily: FONT,
                  fontSize: "13px",
                  fontWeight: 300,
                  color: PRIMARY_TEXT,
                  backgroundColor: "transparent",
                  padding: 0,
                }}
              />
            </div>
          </div>

          <div style={{ maxHeight: "260px", overflowY: "auto" }}>
            {filteredGroups.length === 0 ? (
              <div style={{ padding: "14px", fontFamily: FONT, fontSize: "13px", color: "#9ca3af" }}>No templates found</div>
            ) : (
              filteredGroups.map((group) => (
                <div key={group.groupLabel}>
                  <div style={{ padding: "10px 14px 4px", fontFamily: FONT, fontSize: "12px", fontWeight: 700, color: PRIMARY_TEXT }}>{group.groupLabel}</div>
                  {group.items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      disabled={item.disabled}
                      onClick={() => {
                        if (item.disabled) return;
                        onChange(item.id);
                        setOpen(false);
                        setSearch("");
                      }}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        border: "none",
                        backgroundColor: item.id === value ? "#f0f5ff" : "#f9f9f9",
                        padding: "9px 14px 9px 22px",
                        cursor: item.disabled ? "not-allowed" : "pointer",
                        transition: "background-color 100ms ease-out",
                        opacity: item.disabled ? 0.6 : 1,
                      }}
                      onMouseEnter={(e) => {
                        if (!item.disabled && item.id !== value) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#f0f0f0";
                      }}
                      onMouseLeave={(e) => {
                        if (!item.disabled && item.id !== value) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#f9f9f9";
                      }}
                    >
                      <div style={{ fontFamily: FONT, fontSize: "14px", fontWeight: 300, color: item.disabled ? "#9ca3af" : PRIMARY_TEXT }}>{item.label}</div>
                      {item.sublabel && <div style={{ fontFamily: FONT, fontSize: "12px", fontWeight: 300, color: "#e8390e", marginTop: "2px" }}>{item.sublabel}</div>}
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function TemplateSection(): JSX.Element {
  const [chooseTplOpen, setChooseTplOpen] = useState(true);
  const [choosePermsOpen, setChoosePermsOpen] = useState(false);
  const [selectedTplId, setSelectedTplId] = useState("");

  const selectedItem = ALL_TEMPLATE_ITEMS.find((i) => i.id === selectedTplId);
  const selectedPermissions = selectedItem?.permissions ?? null;

  return (
    <>
      <div style={{ borderTop: "1px solid #e5e7eb", borderBottom: "1px solid #e5e7eb" }}>
        <button
          type="button"
          onClick={() => setChooseTplOpen((o) => !o)}
          aria-expanded={chooseTplOpen}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            cursor: "pointer",
            userSelect: "none",
            backgroundColor: "#fff",
            border: "none",
            textAlign: "left",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <ChevronDown
              size={16}
              color="#374151"
              style={{ transition: "transform 150ms ease-out", transform: chooseTplOpen ? "rotate(0deg)" : "rotate(-90deg)", flexShrink: 0 }}
            />
            <span style={{ fontFamily: FONT, fontSize: "14px", fontWeight: 600, color: PRIMARY_TEXT }}>Choose a template</span>
          </span>

          {!chooseTplOpen && selectedItem && <span style={{ fontFamily: FONT, fontSize: "13px", fontWeight: 400, color: PRIMARY_TEXT }}>{selectedItem.label}</span>}
        </button>

        {chooseTplOpen && (
          <div style={{ padding: "4px 28px 28px" }}>
            <p style={{ fontFamily: FONT, fontSize: "13px", fontWeight: 300, color: "#33475b", lineHeight: "22px", marginTop: 0, marginBottom: "18px" }}>
              Assign access based on a set of common roles, or base access on another user's permissions.
            </p>

            <div style={{ display: "flex", gap: "48px", alignItems: "flex-start" }}>
              <div style={{ flexShrink: 0 }}>
                <p style={{ fontFamily: FONT, fontSize: "13px", fontWeight: 600, color: PRIMARY_TEXT, margin: "0 0 8px 0" }}>Choose a template</p>
                <TemplateDropdown value={selectedTplId} onChange={setSelectedTplId} />
              </div>

              <div style={{ minWidth: 0 }}>{selectedTplId ? null : <MagnifyPlaceholder fontFamily={FONT} />}</div>
            </div>

            {selectedTplId && selectedPermissions && <PermissionsGrid categories={selectedPermissions} />}
          </div>
        )}
      </div>

      <div>
        <button
          type="button"
          onClick={() => {
            if (!selectedTplId) return;
            setChoosePermsOpen((o) => !o);
          }}
          aria-disabled={!selectedTplId}
          aria-expanded={choosePermsOpen}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            cursor: selectedTplId ? "pointer" : "default",
            userSelect: "none",
            backgroundColor: "#fff",
            opacity: selectedTplId ? 1 : 0.45,
            border: "none",
            textAlign: "left",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <ChevronDown
              size={16}
              color={selectedTplId ? "#374151" : "#9ca3af"}
              style={{ transition: "transform 150ms ease-out", transform: choosePermsOpen ? "rotate(0deg)" : "rotate(-90deg)", flexShrink: 0 }}
            />
            <span style={{ fontFamily: FONT, fontSize: "14px", fontWeight: choosePermsOpen ? 600 : 400, color: selectedTplId ? PRIMARY_TEXT : "#9ca3af" }}>
              Choose permissions
            </span>
          </span>
        </button>

        {choosePermsOpen && selectedTplId && (
          <div style={{ padding: "4px 28px 28px" }}>
            <p style={{ fontFamily: FONT, fontSize: "13px", fontWeight: 300, color: "#33475b", lineHeight: "22px", marginTop: 0, marginBottom: "4px" }}>
              Fine-tune the permissions for this user based on the selected template.
            </p>
            {selectedPermissions ? (
              <PermissionsGrid categories={selectedPermissions} />
            ) : (
              <p style={{ fontFamily: FONT, fontSize: "13px", fontWeight: 300, color: "#6b7280", marginTop: "8px" }}>Permissions for this template cannot be modified.</p>
            )}
          </div>
        )}
      </div>
    </>
  );
}

function StepIndicator({ current }: Readonly<{ current: number }>): JSX.Element {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", width: "100%" }}>
      {STEPS.map((step, idx) => {
        const isActive = idx === current;
        const isDone = idx < current;
        const isLast = idx === STEPS.length - 1;

        const circleColor = isActive || isDone ? "#e8390e" : "#fff";
        const circleBorder = isActive || isDone ? "#e8390e" : "#9ca3af";
        const labelColor = isActive ? "#e8390e" : PRIMARY_TEXT;
        const labelWeight = isActive ? 600 : 400;

        return (
          <div key={step.id} style={{ display: "flex", alignItems: "center", flex: isLast ? "0 0 auto" : 1, minWidth: 0 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
              <div
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  border: `2px solid ${circleBorder}`,
                  backgroundColor: circleColor,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  boxSizing: "border-box",
                }}
              >
                {isDone && (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M2 5l2.5 2.5L8 3" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <span style={{ fontFamily: FONT, fontSize: "12px", fontWeight: labelWeight, color: labelColor, letterSpacing: "0px", whiteSpace: "nowrap" }}>{step.label}</span>
            </div>
            {!isLast && <div style={{ flex: 1, height: "2px", backgroundColor: isDone ? "#e8390e" : "#d1d5db", marginTop: "11px" }} />}
          </div>
        );
      })}
    </div>
  );
}

function EmailChip({ email, onRemove }: Readonly<{ email: string; onRemove?: () => void }>): JSX.Element {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        border: "1px solid #9ca3af",
        borderRadius: "20px",
        padding: "3px 10px 3px 12px",
        fontSize: "13px",
        fontFamily: FONT,
        fontWeight: 300,
        color: PRIMARY_TEXT,
        backgroundColor: "#fff",
        lineHeight: "18px",
      }}
    >
      {email}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${email}`}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", color: "#6b7280", lineHeight: 1 }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "#374151";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "#6b7280";
          }}
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
}

function StepEmail({
  emails,
  onAddEmail,
  onRemoveEmail,
}: Readonly<{
  emails: string[];
  onAddEmail: (email: string) => void;
  onRemoveEmail: (email: string) => void;
}>): JSX.Element {
  const [selectedUser, setSelectedUser] = useState("");
  const availableUsers = SELECTABLE_USERS.filter((u) => !emails.includes(u.email));

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: "48px", width: "100%" }}>
      <h2 style={{ fontFamily: FONT, fontSize: "22px", fontWeight: 500, color: PRIMARY_TEXT, marginBottom: "16px", marginTop: 0, textAlign: "center" }}>Select user</h2>
      <p style={{ fontFamily: FONT, fontWeight: 300, fontSize: "14px", color: "#33475b", lineHeight: "24px", marginBottom: "16px", textAlign: "center" }}>
        Select one or more users from the list to continue.
      </p>

      {emails.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", justifyContent: "center", marginBottom: "16px", maxWidth: "520px" }}>
          {emails.map((email) => (
            <EmailChip key={email} email={email} onRemove={() => onRemoveEmail(email)} />
          ))}
        </div>
      )}

      <div style={{ width: "100%", maxWidth: "520px" }}>
        <div style={{ position: "relative" }}>
          <select
            value={selectedUser}
            aria-label="Select a user"
            onChange={(e) => {
              const v = e.target.value;
              setSelectedUser(v);
              if (!v) return;
              if (!emails.includes(v)) onAddEmail(v);
              setSelectedUser("");
            }}
            style={{
              backgroundColor: "#fff",
              border: "1px solid rgb(138, 138, 138)",
              borderRadius: "4px",
              color: PRIMARY_TEXT,
              display: "block",
              fontFamily: FONT,
              fontSize: "16px",
              fontWeight: 300,
              height: "40px",
              lineHeight: "24px",
              paddingInline: "16px",
              paddingRight: "40px",
              paddingBlock: "8px",
              width: "100%",
              cursor: "pointer",
              outline: "none",
              boxSizing: "border-box",
              appearance: "none",
              WebkitAppearance: "none",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "#2563eb";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "rgb(138,138,138)";
            }}
          >
            <option value="">Select a user…</option>
            {availableUsers.map((user) => (
              <option key={user.id} value={user.email}>
                {user.name} ({user.email})
              </option>
            ))}
          </select>
          <ChevronDown size={16} color="#555" style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", flexShrink: 0 }} />
        </div>
        {availableUsers.length === 0 && <p style={{ fontFamily: FONT, fontSize: "11px", color: "#9ca3af", marginTop: "4px", marginBottom: 0 }}>All users in the list are already selected.</p>}
      </div>
    </div>
  );
}

function SeatSearchDropdown({ value, onChange }: Readonly<{ value: string; onChange: (id: string, label: string) => void }>): JSX.Element {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = SEAT_OPTIONS.filter((s) => s.label.toLowerCase().includes(search.toLowerCase()));
  const selectedLabel = SEAT_OPTIONS.find((s) => s.id === value)?.label ?? "";

  const close = useCallback(() => {
    setOpen(false);
    setSearch("");
  }, []);

  useClickOutside({ open, ref, onOutside: close });
  useAutofocusOnOpen({ open, focusRef: inputRef });

  return (
    <div ref={ref} style={{ position: "relative", width: "100%" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        style={{
          height: "42px",
          width: "100%",
          border: `1px solid ${open ? "#2563eb" : "rgb(138,138,138)"}`,
          borderRadius: open ? "4px 4px 0 0" : "4px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 12px",
          cursor: "pointer",
          backgroundColor: "#fff",
          boxSizing: "border-box",
          transition: "border-color 150ms ease-out",
          gap: "8px",
          textAlign: "left",
        }}
      >
        {open ? (
          <input
            ref={inputRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            aria-label="Search seats"
            onClick={(e) => e.stopPropagation()}
            style={{ border: "none", outline: "none", flex: 1, fontFamily: FONT, fontSize: "14px", fontWeight: 300, color: PRIMARY_TEXT, backgroundColor: "transparent", padding: 0 }}
          />
        ) : (
          <span style={{ fontFamily: FONT, fontSize: "14px", fontWeight: 300, color: selectedLabel ? PRIMARY_TEXT : "#9ca3af", flex: 1 }}>{selectedLabel || "Search"}</span>
        )}
        <ChevronDown size={16} color="#555" style={{ flexShrink: 0, transition: "transform 150ms ease-out", transform: open ? "rotate(180deg)" : "rotate(0deg)" }} />
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            border: "1px solid #2563eb",
            borderTop: "none",
            borderRadius: "0 0 4px 4px",
            backgroundColor: "#fff",
            zIndex: 1001,
            maxHeight: "260px",
            overflowY: "auto",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          }}
        >
          {filtered.length === 0 ? (
            <div style={{ padding: "14px 16px", fontFamily: FONT, fontSize: "13px", color: "#9ca3af" }}>No results found</div>
          ) : (
            filtered.map((seat, idx) => (
              <button
                key={seat.id}
                type="button"
                onClick={() => {
                  onChange(seat.id, seat.label);
                  setSearch("");
                  setOpen(false);
                }}
                style={{
                  width: "100%",
                  textAlign: "left",
                  border: "none",
                  padding: "12px 16px",
                  borderBottom: idx < filtered.length - 1 ? "1px solid #f3f4f6" : "none",
                  cursor: "pointer",
                  backgroundColor: seat.id === value ? "#f0f5ff" : "#fff",
                  transition: "background-color 100ms ease-out",
                }}
                onMouseEnter={(e) => {
                  if (seat.id !== value) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#f9fafb";
                }}
                onMouseLeave={(e) => {
                  if (seat.id !== value) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#fff";
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
                  <span style={{ fontFamily: FONT, fontSize: "14px", fontWeight: 400, color: PRIMARY_TEXT }}>{seat.label}</span>
                  {seat.badge && (
                    <span style={{ backgroundColor: seat.badge.color, color: "#fff", fontSize: "10px", fontWeight: 600, fontFamily: FONT, padding: "2px 9px", borderRadius: "20px", letterSpacing: "0.02em" }}>
                      {seat.badge.text}
                    </span>
                  )}
                </div>
                <div style={{ fontFamily: FONT, fontSize: "12px", fontWeight: 300, color: "#6b7280" }}>{seat.sublabel}</div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function AccessCard({ method, selected, onSelect }: Readonly<{ method: AccessMethod; selected: boolean; onSelect: () => void }>): JSX.Element {
  const [hovered, setHovered] = useState(false);

  let backgroundColor = "#fff";
  if (selected) backgroundColor = "#f3f4f6";
  else if (hovered) backgroundColor = "#fafafa";

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flex: "1 1 0",
        minWidth: 0,
        border: `1px solid ${selected ? "#9ca3af" : "#e5e7eb"}`,
        borderRadius: "6px",
        padding: "40px 21px 66px",
        cursor: "pointer",
        backgroundColor,
        transition: "background-color 120ms ease-out, border-color 120ms ease-out",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        position: "relative",
        boxSizing: "border-box",
        textAlign: "center",
      }}
    >
      <span style={{ position: "absolute", top: "12px", right: "12px" }} aria-hidden="true">
        <span
          style={{
            width: "18px",
            height: "18px",
            borderRadius: "50%",
            border: `2px solid ${selected ? PRIMARY_TEXT : "#d1d5db"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#fff",
            boxSizing: "border-box",
          }}
        >
          {selected && <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: PRIMARY_TEXT }} />}
        </span>
      </span>

      <div style={{ height: "90px", display: "flex", alignItems: "flex-end", justifyContent: "center", marginBottom: "14px" }}>
        <AccessMethodIcon id={method.id} />
      </div>

      <p style={{ fontFamily: FONT, fontSize: "16px", fontWeight: 600, color: PRIMARY_TEXT, textAlign: "center", margin: "0 0 6px 0", lineHeight: "18px" }}>{method.title}</p>
      <p style={{ fontFamily: FONT, fontSize: "14px", fontWeight: 100, color: "#666666", textAlign: "center", margin: 0, lineHeight: "17px" }}>{method.description}</p>
    </button>
  );
}

const INLINE_LINK_STYLE: React.CSSProperties = {
  color: "#0d6efd",
  textDecoration: "none",
  fontWeight: 400,
  display: "inline-flex",
  alignItems: "center",
  gap: "3px",
  cursor: "pointer",
};

function StepAccess({
  emails,
  seatId,
  seatLabel,
  onSeatChange,
  accessMethod,
  onAccessMethodChange,
}: Readonly<{
  emails: string[];
  seatId: string;
  seatLabel: string;
  onSeatChange: (id: string, label: string) => void;
  accessMethod: AccessMethod["id"];
  onAccessMethodChange: (id: AccessMethod["id"]) => void;
}>): JSX.Element {
  const [seatOpen, setSeatOpen] = useState(true);
  const [accessOpen, setAccessOpen] = useState(false);

  const handleSeatChange = (id: string, label: string) => {
    onSeatChange(id, label);
    if (id) {
      setSeatOpen(false);
      setAccessOpen(true);
    }
  };

  const accessMethodLabel = ACCESS_METHODS.find((m) => m.id === accessMethod)?.title ?? "";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: "40px", width: "100%" }}>
      <h2 style={{ fontFamily: FONT, fontSize: "22px", fontWeight: 500, color: PRIMARY_TEXT, marginBottom: "10px", marginTop: 0, textAlign: "center" }}>Set up user access levels</h2>
      <p style={{ fontFamily: FONT, fontSize: "14px", fontWeight: 300, color: "#33475b", lineHeight: "22px", marginBottom: "16px", textAlign: "center", maxWidth: "560px" }}>
        Assign a seat to give users access to features. Narrow down that access with permissions.
      </p>

      {emails.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", justifyContent: "center", marginBottom: "28px" }}>
          {emails.map((email) => (
            <EmailChip key={email} email={email} />
          ))}
        </div>
      )}

      <div style={{ width: "100%", border: "1px solid #e5e7eb", borderRadius: "6px", overflow: "visible", position: "relative" }}>
        <div style={{ borderBottom: "1px solid #e5e7eb" }}>
          <button
            type="button"
            onClick={() => setSeatOpen((o) => !o)}
            aria-expanded={seatOpen}
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", cursor: "pointer", userSelect: "none", backgroundColor: "#fff", border: "none", textAlign: "left" }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <ChevronDown size={16} color="#374151" style={{ transition: "transform 150ms ease-out", transform: seatOpen ? "rotate(0deg)" : "rotate(-90deg)", flexShrink: 0 }} />
              <span style={{ fontFamily: FONT, fontSize: "14px", fontWeight: 600, color: PRIMARY_TEXT }}>Assign a seat</span>
            </span>
            {!seatOpen && seatLabel && <span style={{ fontFamily: FONT, fontSize: "13px", fontWeight: 400, color: PRIMARY_TEXT }}>{seatLabel}</span>}
          </button>

          {seatOpen && (
            <div style={{ padding: "4px 28px 28px" }}>
              <p style={{ fontFamily: FONT, fontSize: "14px", fontWeight: 600, color: PRIMARY_TEXT, marginBottom: "3px", marginTop: 0 }}>Seat assignment</p>
              <p style={{ fontFamily: FONT, fontSize: "13px", fontWeight: 300, color: "#374151", marginBottom: "14px", marginTop: 0, lineHeight: "20px" }}>
                Seats give users access to features.{" "}
                <LinkButton
                  onClick={() => toast.info("Learn more about seats: coming soon.")}
                  style={INLINE_LINK_STYLE}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.textDecoration = "underline";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.textDecoration = "none";
                  }}
                >
                  <>
                    Learn more about seats <ExternalLink size={11} />
                  </>
                </LinkButton>
              </p>
              <div style={{ maxWidth: "420px" }}>
                <SeatSearchDropdown value={seatId} onChange={handleSeatChange} />
              </div>
              <p style={{ fontFamily: FONT, fontSize: "13px", fontWeight: 300, color: "#374151", marginTop: "16px", marginBottom: 0, lineHeight: "20px" }}>
                Visit{" "}
                <LinkButton
                  onClick={() => toast.info("Products & Services Catalog: coming soon.")}
                  style={INLINE_LINK_STYLE}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.textDecoration = "underline";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.textDecoration = "none";
                  }}
                >
                  <>
                    Products &amp; Services Catalog <ExternalLink size={11} />
                  </>
                </LinkButton>{" "}
                to see the features included with each subscription.
              </p>
            </div>
          )}
        </div>

        <div style={{ borderBottom: accessMethod === "template" && seatId ? "1px solid #e5e7eb" : "none" }}>
          <button
            type="button"
            onClick={() => {
              if (seatId) setAccessOpen((o) => !o);
            }}
            aria-disabled={!seatId}
            aria-expanded={accessOpen}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px 20px",
              cursor: seatId ? "pointer" : "default",
              userSelect: "none",
              backgroundColor: "#fff",
              opacity: seatId ? 1 : 0.55,
              border: "none",
              textAlign: "left",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <ChevronDown size={16} color={seatId ? "#374151" : "#9ca3af"} style={{ transition: "transform 150ms ease-out", transform: accessOpen ? "rotate(0deg)" : "rotate(-90deg)", flexShrink: 0 }} />
              <span style={{ fontFamily: FONT, fontSize: "14px", fontWeight: 600, color: seatId ? PRIMARY_TEXT : "#9ca3af" }}>Choose how to set access</span>
            </span>

            {!accessOpen && accessMethodLabel && seatId && <span style={{ fontFamily: FONT, fontSize: "13px", fontWeight: 400, color: PRIMARY_TEXT }}>{accessMethodLabel}</span>}
          </button>

          {accessOpen && seatId && (
            <div style={{ padding: "4px 20px 24px" }}>
              <div style={{ display: "flex", gap: "12px" }}>
                {ACCESS_METHODS.map((method) => (
                  <AccessCard key={method.id} method={method} selected={accessMethod === method.id} onSelect={() => onAccessMethodChange(method.id)} />
                ))}
              </div>
            </div>
          )}
        </div>

        {accessMethod === "template" && seatId && <TemplateSection />}
      </div>
    </div>
  );
}

function StepReview({ emails, seatLabel, accessMethod }: Readonly<{ emails: string[]; seatLabel: string; accessMethod: AccessMethod["id"] }>): JSX.Element {
  const methodLabel = ACCESS_METHODS.find((m) => m.id === accessMethod)?.title ?? "—";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: "48px", width: "100%" }}>
      <h2 style={{ fontFamily: FONT, fontSize: "22px", fontWeight: 700, color: PRIMARY_TEXT, marginBottom: "10px", textAlign: "center" }}>Review &amp; confirm</h2>
      <p style={{ fontFamily: FONT, fontSize: "13px", fontWeight: 300, color: "#6b7280", marginBottom: "36px", textAlign: "center" }}>Review the details below before creating the users.</p>

      <div style={{ width: "100%", maxWidth: "520px", display: "flex", flexDirection: "column", gap: "20px" }}>
        <div style={{ border: "1px solid #e5e7eb", borderRadius: "6px", overflow: "hidden" }}>
          <div style={{ padding: "10px 16px", backgroundColor: "#f9fafb", borderBottom: "1px solid #e5e7eb", fontFamily: FONT, fontSize: "12px", fontWeight: 500, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Users ({emails.length})
          </div>
          {emails.map((email, idx) => (
            <div key={email} style={{ padding: "10px 16px", fontFamily: FONT, fontSize: "13px", fontWeight: 300, color: PRIMARY_TEXT, borderBottom: idx < emails.length - 1 ? "1px solid #f3f4f6" : "none", backgroundColor: "#fff" }}>
              {email}
            </div>
          ))}
        </div>

        <div style={{ border: "1px solid #e5e7eb", borderRadius: "6px", overflow: "hidden" }}>
          <div style={{ padding: "10px 16px", backgroundColor: "#f9fafb", borderBottom: "1px solid #e5e7eb", fontFamily: FONT, fontSize: "12px", fontWeight: 500, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.04em" }}>Seat</div>
          <div style={{ padding: "10px 16px", fontFamily: FONT, fontSize: "13px", fontWeight: 300, color: seatLabel ? PRIMARY_TEXT : "#9ca3af", backgroundColor: "#fff" }}>{seatLabel || "No seat selected"}</div>
        </div>

        <div style={{ border: "1px solid #e5e7eb", borderRadius: "6px", overflow: "hidden" }}>
          <div style={{ padding: "10px 16px", backgroundColor: "#f9fafb", borderBottom: "1px solid #e5e7eb", fontFamily: FONT, fontSize: "12px", fontWeight: 500, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Access method
          </div>
          <div style={{ padding: "10px 16px", fontFamily: FONT, fontSize: "13px", fontWeight: 300, color: accessMethod ? PRIMARY_TEXT : "#9ca3af", backgroundColor: "#fff" }}>{accessMethod ? methodLabel : "No access method selected"}</div>
        </div>
      </div>
    </div>
  );
}

export default function CreateUsersPage(): JSX.Element {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [emails, setEmails] = useState<string[]>([]);
  const [seatId, setSeatId] = useState("");
  const [seatLabel, setSeatLabel] = useState("");
  const [accessMethod, setAccessMethod] = useState<AccessMethod["id"]>("seat_permissions");
  const [submitting, setSubmitting] = useState(false);

  const totalSteps = STEPS.length;

  const handleAddEmail = useCallback((email: string) => {
    setEmails((prev) => [...prev, email]);
  }, []);

  const handleRemoveEmail = useCallback((email: string) => {
    setEmails((prev) => prev.filter((e) => e !== email));
  }, []);

  const handleSeatChange = useCallback((id: string, label: string) => {
    setSeatId(id);
    setSeatLabel(label);
  }, []);

  const handleNext = useCallback(() => {
    if (currentStep === 0 && emails.length === 0) {
      toast.error("Please select at least one user to continue.");
      return;
    }
    if (currentStep === 1 && !seatId) {
      toast.error("Please assign a seat before continuing.");
      return;
    }
    if (currentStep < totalSteps - 1) setCurrentStep((s) => s + 1);
  }, [currentStep, emails.length, seatId, totalSteps]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  }, [currentStep]);

  const handleCancel = useCallback(() => {
    router.back();
  }, [router]);

  const handleCreate = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await new Promise<void>((resolve) => {
        globalThis.setTimeout(resolve, 800);
      });
      const userCount = emails.length;
      toast.success(`${userCount} user${userCount === 1 ? "" : "s"} created successfully!`);
      await router.push(DEFAULT_USERS_DIRECTORY_PATH);
    } catch {
      toast.error("Failed to create users. Please try again.");
      setSubmitting(false);
    }
  }, [submitting, emails.length, router]);

  const isLastStep = currentStep === totalSteps - 1;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, backgroundColor: "#fff", display: "flex", flexDirection: "column", fontFamily: FONT }}>
      <div style={{ minHeight: "84px", display: "flex", alignItems: "center", paddingInline: "24px", flexShrink: 0, position: "relative" }}>
        <div style={{ width: "70%", margin: "0 auto" }}>
          <StepIndicator current={currentStep} />
        </div>
        <button
          type="button"
          onClick={handleCancel}
          aria-label="Close"
          style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", display: "flex", alignItems: "center", color: "#6b7280", transition: "color 150ms ease-out", position: "absolute", right: "24px" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = PRIMARY_TEXT;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "#6b7280";
          }}
        >
          <X size={18} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "0 24px 24px", display: "flex", justifyContent: "center" }}>
        <div style={{ width: "100%", maxWidth: "1200px" }}>
          {currentStep === 0 && <StepEmail emails={emails} onAddEmail={handleAddEmail} onRemoveEmail={handleRemoveEmail} />}
          {currentStep === 1 && (
            <StepAccess
              emails={emails}
              seatId={seatId}
              seatLabel={seatLabel}
              onSeatChange={handleSeatChange}
              accessMethod={accessMethod}
              onAccessMethodChange={setAccessMethod}
            />
          )}
          {currentStep === 2 && <StepReview emails={emails} seatLabel={seatLabel} accessMethod={accessMethod} />}
        </div>
      </div>

      <div style={{ height: "60px", borderTop: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "space-between", paddingInline: "24px", flexShrink: 0, backgroundColor: "#fff" }}>
        {currentStep === 0 ? (
          <button
            type="button"
            onClick={handleCancel}
            style={{ background: "none", border: "none", cursor: "pointer", fontFamily: FONT, fontSize: "13px", fontWeight: 400, color: "#2563eb", textDecoration: "underline", padding: 0, transition: "opacity 150ms ease-out" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.opacity = "0.75";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.opacity = "1";
            }}
          >
            Cancel
          </button>
        ) : (
          <button
            type="button"
            onClick={handleBack}
            style={{ ...BASE_BUTTON }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#f5f5f5";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#fff";
            }}
          >
            Back
          </button>
        )}

        {isLastStep ? (
          <button
            type="button"
            onClick={handleCreate}
            disabled={submitting}
            style={{
              ...BASE_BUTTON,
              backgroundColor: submitting ? "#374151" : "#141414",
              borderColor: "#141414",
              color: "#fff",
              fontWeight: 400,
              paddingInline: "27px",
              fontSize: "14px",
              opacity: submitting ? 0.7 : 1,
              cursor: submitting ? "not-allowed" : "pointer",
            }}
            onMouseEnter={(e) => {
              if (!submitting) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#374151";
            }}
            onMouseLeave={(e) => {
              if (!submitting) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#111827";
            }}
          >
            {submitting ? "Creating…" : "Create users"}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleNext}
            style={{ ...BASE_BUTTON, backgroundColor: "#141414", borderColor: "#141414", color: "#fff", fontWeight: 600, paddingInline: "27px", fontSize: "14px" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#374151";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#111827";
            }}
          >
            Next <ChevronRight size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

