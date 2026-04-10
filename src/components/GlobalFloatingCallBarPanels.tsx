"use client";

import React from "react";
import { Button, Modal, Form } from "react-bootstrap";
import UserDummyImage from "@assets/images/user-dummy.jpg";
import type {
  FloatingBarCtiCall,
  FloatingBarDnsMap,
} from "./globalFloatingCallBarHelpers";

const BUSY_CALL_STATUSES = new Set(["connected", "ringing", "dialing"]);

type UserDataExtensionsGetter = () => Record<
  string,
  { name?: string; user_name?: string }
>;

function devicesRecordHasRegistered(
  devices: Record<string, unknown> | undefined,
): boolean {
  if (!devices) {
    return false;
  }
  return Object.values(devices).some(
    (d) =>
      typeof d === "object" &&
      d !== null &&
      (d as { terminalState?: string }).terminalState === "REGISTERED",
  );
}

function extensionHasRegisteredDevice(
  ext: string,
  dnsMap: FloatingBarDnsMap | undefined,
): boolean {
  const entry = dnsMap?.[ext];
  if (!entry || typeof entry !== "object" || !("devices" in entry)) {
    return false;
  }
  const devices = (entry as { devices?: Record<string, unknown> }).devices;
  return devicesRecordHasRegistered(devices);
}

function compareExtensionsByRegistration(
  extA: string,
  extB: string,
  dnsMap: FloatingBarDnsMap | undefined,
): number {
  const aOnline = extensionHasRegisteredDevice(extA, dnsMap);
  const bOnline = extensionHasRegisteredDevice(extB, dnsMap);
  if (aOnline && !bOnline) {
    return -1;
  }
  if (!aOnline && bOnline) {
    return 1;
  }
  return 0;
}

function filterTransferCandidateExtensions(
  extensions: string[],
  extensionSearch: string,
  dnsMap: FloatingBarDnsMap | undefined,
): string[] {
  const q = extensionSearch.trim().toLowerCase();
  return extensions
    .filter((ext) => q === "" || ext.toLowerCase().includes(q))
    .filter((ext) => extensionHasRegisteredDevice(ext, dnsMap))
    .sort((a, b) => compareExtensionsByRegistration(a, b, dnsMap));
}

function resolveExtensionDisplayName(
  ext: string,
  getUserDataExtensions: UserDataExtensionsGetter | undefined,
): string {
  if (!getUserDataExtensions) {
    return ext;
  }
  const userDataExtensions = getUserDataExtensions() || {};
  const dnString = String(ext);
  const dnNumber = Number(ext);
  const userData =
    userDataExtensions[ext] ||
    userDataExtensions[dnString] ||
    userDataExtensions[dnNumber];
  const name = userData?.name || userData?.user_name;
  return name ? `${name} (${ext})` : ext;
}

type TransferExtensionRowProps = {
  ext: string;
  transferTarget: string;
  dnsMap: FloatingBarDnsMap | undefined;
  getUserDataExtensions: UserDataExtensionsGetter | undefined;
  onPick: (ext: string) => void;
};

function TransferExtensionRow({
  ext,
  transferTarget,
  dnsMap,
  getUserDataExtensions,
  onPick,
}: Readonly<TransferExtensionRowProps>) {
  const entry = dnsMap?.[ext];
  const deviceList =
    entry && typeof entry === "object" && "devices" in entry
      ? Object.values(
          (entry as { devices?: Record<string, unknown> }).devices || {},
        )
      : [];
  const isOnline = deviceList.some(
    (d) =>
      typeof d === "object" &&
      d !== null &&
      (d as { terminalState?: string }).terminalState === "REGISTERED",
  );
  const displayName = resolveExtensionDisplayName(ext, getUserDataExtensions);

  return (
    <Button
      key={ext}
      variant={transferTarget === ext ? "primary" : "outline-primary"}
      size="sm"
      className="w-100 mb-2"
      onClick={() => onPick(ext)}
    >
      <div className="d-flex justify-content-between align-items-center">
        <span className="fw-bold">{displayName}</span>
        <small className={isOnline ? "text-success" : "text-muted"}>
          {isOnline ? "ONLINE" : "OFFLINE"}
        </small>
      </div>
    </Button>
  );
}

export type FloatingBarTransferModalProps = {
  show: boolean;
  onHide: () => void;
  extensionSearch: string;
  onExtensionSearchChange: (value: string) => void;
  transferTarget: string;
  onTransferTargetChange: (ext: string) => void;
  transferCandidates: string[];
  dnsMap: FloatingBarDnsMap | undefined;
  getUserDataExtensions: UserDataExtensionsGetter | undefined;
  onTransfer: () => void;
  isTransferring: boolean;
};

export function FloatingBarTransferModal({
  show,
  onHide,
  extensionSearch,
  onExtensionSearchChange,
  transferTarget,
  onTransferTargetChange,
  transferCandidates,
  dnsMap,
  getUserDataExtensions,
  onTransfer,
  isTransferring,
}: Readonly<FloatingBarTransferModalProps>) {
  const filtered = filterTransferCandidateExtensions(
    transferCandidates,
    extensionSearch,
    dnsMap,
  );

  return (
    <Modal show={show} onHide={onHide} centered size="sm">
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="material-icons-two-tone me-2">call_made</i> Transfer
          Call
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Group className="mb-3">
          <Form.Label className="fw-semibold">
            Select Target Extension
          </Form.Label>
          <Form.Control
            type="text"
            placeholder="Search extensions..."
            value={extensionSearch}
            onChange={(e) => onExtensionSearchChange(e.target.value)}
            className="mb-2"
          />
          <div style={{ maxHeight: "300px", overflowY: "auto" }}>
            {filtered.map((ext) => (
              <TransferExtensionRow
                key={ext}
                ext={ext}
                transferTarget={transferTarget}
                dnsMap={dnsMap}
                getUserDataExtensions={getUserDataExtensions}
                onPick={onTransferTargetChange}
              />
            ))}
          </div>
          {transferCandidates.length === 0 && (
            <div className="alert alert-warning py-2">
              <i className="material-icons-two-tone me-2">warning</i>
              <small>No available extensions for transfer</small>
            </div>
          )}
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="default" onClick={onHide}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={onTransfer}
          disabled={!transferTarget || isTransferring}
        >
          {isTransferring ? (
            <>
              <span
                className="spinner-border spinner-border-sm me-2"
                aria-hidden="true"
                style={{ width: "1rem", height: "1rem", borderWidth: "2px" }}
              />{" "}
              Transferring...
            </>
          ) : (
            "Transfer"
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export type FloatingBarActiveCallSectionProps = {
  barRef: React.RefObject<HTMLDivElement | null>;
  isDragging: boolean;
  dragPosition: { x: number; y: number } | null;
  sectionStyle: React.CSSProperties;
  onDragStart: (e: React.MouseEvent) => void;
  activeCall: FloatingBarCtiCall;
  activeCallUserImageUrl: string;
  activeCallUserName: string;
  otherPartyNumber: string | null;
  connectedElapsedDisplay: string;
  canCurrentUserResumeCall: boolean;
  canTransferCall: boolean;
  isHoldingCall: boolean;
  isResumingCall: boolean;
  isEndingCall: boolean;
  onHoldCall: () => void;
  onResumeCall: () => void;
  onEndCall: () => void;
  onOpenTransferModal: () => void;
};

export function FloatingBarActiveCallSection({
  barRef,
  isDragging,
  dragPosition,
  sectionStyle,
  onDragStart,
  activeCall,
  activeCallUserImageUrl,
  activeCallUserName,
  otherPartyNumber,
  connectedElapsedDisplay,
  canCurrentUserResumeCall,
  canTransferCall,
  isHoldingCall,
  isResumingCall,
  isEndingCall,
  onHoldCall,
  onResumeCall,
  onEndCall,
  onOpenTransferModal,
}: Readonly<FloatingBarActiveCallSectionProps>) {
  const showCustomAvatar =
    Boolean(activeCallUserImageUrl) &&
    activeCallUserImageUrl !== UserDummyImage.src;

  return (
    <section aria-label="Active call">
      <div
        ref={barRef}
        className={`global-floating-call-bar ${isDragging ? "dragging" : ""}`}
        style={sectionStyle}
      >
        <button
          type="button"
          className="call-bar-drag-handle btn btn-link p-0 me-1 border-0 d-flex align-items-center justify-content-center"
          aria-label="Drag to move call bar"
          onMouseDown={(e) => {
            e.stopPropagation();
            onDragStart(e);
          }}
          style={{
            minWidth: "1.5rem",
            minHeight: "2.5rem",
            color: "#64748b",
          }}
        >
          <i
            className="material-icons-two-tone"
            style={{ fontSize: "1.25rem" }}
          >
            drag_indicator
          </i>
        </button>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            flex: 1,
            flexDirection: "row",
            minWidth: 0,
            top: "0",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div
            className="position-relative"
            style={{
              width: "3rem",
              height: "3rem",
              minWidth: "3rem",
              flexShrink: 0,
            }}
          >
            {showCustomAvatar ? (
              <img
                src={activeCallUserImageUrl}
                alt={activeCallUserName}
                className="rounded-circle"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  border: "2px solid #e5e7eb",
                }}
                onError={(e) => {
                  e.currentTarget.src = UserDummyImage.src;
                }}
              />
            ) : (
              <img
                src={UserDummyImage.src}
                alt={activeCallUserName}
                className="rounded-circle"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  border: "2px solid #e5e7eb",
                }}
              />
            )}
          </div>
          <div style={{ flex: 1 }}>
            <h3
              style={{
                fontSize: "1rem",
                fontWeight: 600,
                color: "#334155",
                marginBottom: "0.25rem",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {activeCallUserName}
            </h3>
            <div
              style={{
                fontSize: "0.7rem",
                color: "#94a3b8",
                marginBottom: "0.25rem",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {otherPartyNumber}
            </div>
            {activeCall.status === "connected" && (
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "#334155",
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  flexDirection: "row",
                }}
              >
                <span className="text-success" style={{ fontWeight: "500" }}>
                  Connected
                </span>
                <span style={{ color: "#94a3b8" }}>
                  {connectedElapsedDisplay}
                </span>
              </div>
            )}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flex: 1,
            flexDirection: "row",
            gap: "10px",
            position: "relative",
            zIndex: 1,
          }}
        >
          {activeCall.status === "ringing" && (
            <div
              className="call-status-ringing"
              style={{
                fontSize: "0.75rem",
                color: "#334155",
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                flexDirection: "row",
              }}
            >
              <span className="text-success" style={{ fontWeight: "500" }}>
                Outgoing call
              </span>
              <span
                className="bg-success rounded-circle"
                style={{ width: "0.375rem", height: "0.375rem" }}
              />
              <span style={{ color: "#94a3b8" }}>Ringing...</span>
            </div>
          )}
          {activeCall.status === "dialing" && (
            <div
              style={{
                fontSize: "0.75rem",
                color: "#334155",
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                flexDirection: "row",
              }}
            >
              <span style={{ color: "#94a3b8" }}>Dialing...</span>
            </div>
          )}
        </div>
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            alignItems: "center",
            flexDirection: "row",
            position: "relative",
            zIndex: 1,
          }}
        >
          {activeCall.status === "onHold" && (
            <div
              style={{
                fontSize: "0.75rem",
                color: "#F4C22B",
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                flexDirection: "row",
              }}
            >
              <span>On Hold</span>
            </div>
          )}
          {activeCall.status === "connected" && (
            <>
              <button
                type="button"
                tabIndex={0}
                disabled={isHoldingCall}
                onClick={(e) => {
                  e.stopPropagation();
                  onHoldCall();
                }}
                className="btn rounded-circle d-flex align-items-center justify-content-center"
                style={{
                  width: "3rem",
                  height: "3rem",
                  backgroundColor: "#f1f5f9",
                  border: "none",
                  color: "#475569",
                  cursor: isHoldingCall ? "not-allowed" : "pointer",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (!isHoldingCall)
                    e.currentTarget.style.backgroundColor = "#e2e8f0";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#f1f5f9";
                }}
                title="Hold Call"
              >
                {isHoldingCall ? (
                  <span
                    className="spinner-border spinner-border-sm"
                    aria-hidden="true"
                    style={{
                      width: "1.25rem",
                      height: "1.25rem",
                      borderWidth: "2px",
                      color: "#475569",
                    }}
                  />
                ) : (
                  <i
                    className="material-icons-two-tone"
                    style={{ fontSize: "1.25rem", color: "#475569" }}
                  >
                    pause
                  </i>
                )}
              </button>
              {canTransferCall && (
                <button
                  type="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenTransferModal();
                  }}
                  className="btn rounded-circle d-flex align-items-center justify-content-center"
                  style={{
                    width: "3rem",
                    height: "3rem",
                    backgroundColor: "#f1f5f9",
                    border: "none",
                    color: "#475569",
                    cursor: "pointer",
                    transition: "background-color 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#e2e8f0";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#f1f5f9";
                  }}
                  title="Transfer Call"
                >
                  <i
                    className="material-icons-two-tone"
                    style={{ fontSize: "1.25rem", color: "#475569" }}
                  >
                    call_made
                  </i>
                </button>
              )}
            </>
          )}
          {activeCall.status === "onHold" && canCurrentUserResumeCall && (
            <button
              type="button"
              tabIndex={0}
              disabled={isResumingCall}
              onClick={(e) => {
                e.stopPropagation();
                onResumeCall();
              }}
              className="btn rounded-circle d-flex align-items-center justify-content-center"
              style={{
                width: "3rem",
                height: "3rem",
                backgroundColor: "#f1f5f9",
                border: "none",
                color: "#475569",
                cursor: isResumingCall ? "not-allowed" : "pointer",
                transition: "background-color 0.2s",
              }}
              onMouseEnter={(e) => {
                if (!isResumingCall)
                  e.currentTarget.style.backgroundColor = "#e2e8f0";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#f1f5f9";
              }}
              title="Resume Call"
            >
              {isResumingCall ? (
                <span
                  className="spinner-border spinner-border-sm"
                  aria-hidden="true"
                  style={{
                    width: "1.25rem",
                    height: "1.25rem",
                    borderWidth: "2px",
                    color: "#475569",
                  }}
                />
              ) : (
                <i
                  className="material-icons-two-tone"
                  style={{ fontSize: "1.25rem", color: "#475569" }}
                >
                  play_arrow
                </i>
              )}
            </button>
          )}
          <button
            type="button"
            tabIndex={0}
            disabled={isEndingCall}
            onClick={(e) => {
              e.stopPropagation();
              onEndCall();
            }}
            className="btn btn-danger btn-sm rounded-1 d-flex align-items-center gap-1"
            onMouseEnter={(e) => {
              if (!isEndingCall)
                e.currentTarget.style.boxShadow =
                  "0 6px 8px -1px rgba(239,68,68,0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow =
                "0 4px 6px -1px rgba(239,68,68,0.3)";
            }}
            title="End Call"
          >
            {isEndingCall ? (
              <>
                <span
                  className="spinner-border spinner-border-sm"
                  aria-hidden="true"
                  style={{
                    width: "1rem",
                    height: "1rem",
                    borderWidth: "2px",
                  }}
                />{" "}
                Ending...
              </>
            ) : (
              <>
                <i
                  className="material-icons-two-tone"
                  style={{
                    fontSize: "1rem",
                    color: "#fff",
                    backgroundColor: "#fff",
                  }}
                >
                  call_end
                </i>{" "}
                End Call
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}

export function isExtensionBusyOnCalls(
  ext: string,
  activeCalls: Map<string, FloatingBarCtiCall>,
): boolean {
  return Array.from(activeCalls.values()).some(
    (call) => call.number === ext && BUSY_CALL_STATUSES.has(call.status),
  );
}
