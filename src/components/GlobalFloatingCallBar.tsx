"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useCti } from "../contexts/CtiContext";
import { usePermissions } from "../utils/permissionUtils";
import { useIncomingCall } from "../contexts/IncomingCallContext";
import type { FloatingBarCtiCall } from "./globalFloatingCallBarHelpers";
import type { CtiActiveCallEntry, DnsMapLike } from "@layout/components/layoutTypes";
import {
  useGlobalFloatingCallBarDerived,
  type UseGlobalFloatingCallBarDerivedParams,
} from "../hooks/useGlobalFloatingCallBarDerived";
import {
  FloatingBarActiveCallSection,
  FloatingBarTransferModal,
  FloatingBarIncomingCallPanel,
  type FloatingBarTransferModalProps,
} from "./GlobalFloatingCallBarPanels";
import {
  clearFloatingBarIncomingTimer,
  useGlobalFloatingBarIncomingCall,
  type FloatingBarIncomingCallState,
} from "../hooks/useGlobalFloatingBarIncomingCall";
import { GLOBAL_FLOATING_CALL_BAR_STYLES } from "./globalFloatingCallBarStylesString";
import { useGlobalFloatingCallBarLayout } from "../hooks/useGlobalFloatingCallBarLayout";
import {
  useGlobalFloatingCallBarCallActions,
  type UseGlobalFloatingCallBarCallActionsParams,
} from "../hooks/useGlobalFloatingCallBarCallActions";
import {
  useGlobalFloatingBarIncomingSession,
  type UseGlobalFloatingBarIncomingSessionParams,
} from "../hooks/useGlobalFloatingBarIncomingSession";

const GlobalFloatingCallBar: React.FC = () => {
  const {
    isInitialized,
    userAddress,
    activeCalls,
    dnsMap,
    callStateMap,
    eventLog,
    formatDuration,
    attendCall,
    endCall,
    holdCall,
    resumeCall,
    transferCall,
    getAvailableExtensions,
    getUserDataExtensions,
  } = useCti();

  const { hasPermission } = usePermissions();
  const {
    showIncomingCallModal: showIncomingCallModalFromContext,
    incomingCall: incomingCallFromContext,
    setIncomingCall: setIncomingCallContext,
    setShowIncomingCallModal: setShowIncomingCallModalContext,
  } = useIncomingCall();

  const [incomingCall, setIncomingCall] = useState<FloatingBarIncomingCallState | null>(null);
  const [showIncomingCallModal, setShowIncomingCallModal] = useState(false);

  const incomingTimerRef = useGlobalFloatingBarIncomingCall({
    eventLog,
    userAddress,
    dnsMap,
    showIncomingCallModal,
    incomingCall,
    setIncomingCall,
    setIncomingCallContext,
    setShowIncomingCallModal,
    setShowIncomingCallModalContext,
  });

  const closeIncomingSession = useCallback(() => {
    setShowIncomingCallModal(false);
    setShowIncomingCallModalContext(false);
    setIncomingCall(null);
    setIncomingCallContext(null);
    clearFloatingBarIncomingTimer(incomingTimerRef);
  }, [incomingTimerRef, setIncomingCallContext, setShowIncomingCallModalContext]);

  const sessionIncoming = incomingCallFromContext ?? incomingCall;
  const sessionIncomingVisible =
    Boolean(sessionIncoming) && (showIncomingCallModalFromContext || showIncomingCallModal);

  const {
    incomingCallUserName,
    incomingCallUserImageUrl,
    isDialing: isIncomingDialing,
    handleAttendCall,
    handleRejectCall,
  } = useGlobalFloatingBarIncomingSession({
    incomingCall: sessionIncoming,
    showIncomingCallModal: sessionIncomingVisible,
    onCloseIncomingSession: closeIncomingSession,
    userAddress,
    dnsMap: dnsMap as DnsMapLike,
    activeCalls: activeCalls as Map<string, CtiActiveCallEntry>,
    callStateMap: callStateMap ?? undefined,
    attendCall: attendCall as UseGlobalFloatingBarIncomingSessionParams["attendCall"],
    endCall: endCall as UseGlobalFloatingBarIncomingSessionParams["endCall"],
    getUserDataExtensions,
  });

  // Layout / IncomingCallContext may clear the modal (e.g. auto-close when answered elsewhere)
  // without touching this component's local duplicate state — keep them aligned so the bar
  // does not reappear with stale inbound controls.
  useEffect(() => {
    if (showIncomingCallModalFromContext) {
      return;
    }
    setShowIncomingCallModal(false);
    setIncomingCall(null);
    clearFloatingBarIncomingTimer(incomingTimerRef);
  }, [showIncomingCallModalFromContext, incomingTimerRef]);

  const {
    activeCall,
    canCurrentUserResumeCall,
    connectedElapsedDisplay,
    otherPartyNumber,
    activeCallUserName,
    activeCallUserImageUrl,
  } = useGlobalFloatingCallBarDerived({
    activeCalls: activeCalls as Map<string, FloatingBarCtiCall>,
    userAddress,
    callStateMap: callStateMap as UseGlobalFloatingCallBarDerivedParams["callStateMap"],
    eventLog: eventLog as UseGlobalFloatingCallBarDerivedParams["eventLog"],
    dnsMap,
    formatDuration,
    getUserDataExtensions,
  });

  const shouldShowFloatingBar = isInitialized && hasPermission("dial-call-cti");

  const floatingBarVisible =
    shouldShowFloatingBar &&
    Boolean(activeCall) &&
    !showIncomingCallModalFromContext &&
    !incomingCallFromContext;

  const incomingSessionCallId =
    incomingCallFromContext?.callId ?? incomingCall?.callId ?? undefined;

  const {
    barRef,
    sectionStyle,
    useDefaultFloatingBarAnchor,
    handleDragStart,
    isDragging,
    dragPosition,
  } = useGlobalFloatingCallBarLayout({
    floatingBarVisible,
    activeCallCallId: activeCall?.callId,
    incomingSessionCallId,
  });

  const {
    isEndingCall,
    isHoldingCall,
    isResumingCall,
    isTransferringCall,
    showTransferModal,
    setShowTransferModal,
    extensionSearch,
    setExtensionSearch,
    transferTarget,
    setTransferTarget,
    closeTransferModal,
    transferCandidates,
    handleEndCall,
    handleHoldCall,
    handleResumeCall,
    handleTransferCall,
  } = useGlobalFloatingCallBarCallActions({
    activeCall,
    userAddress,
    dnsMap,
    activeCalls: activeCalls as Map<string, FloatingBarCtiCall>,
    getAvailableExtensions,
    endCall: endCall as UseGlobalFloatingCallBarCallActionsParams["endCall"],
    holdCall: holdCall as UseGlobalFloatingCallBarCallActionsParams["holdCall"],
    resumeCall: resumeCall as UseGlobalFloatingCallBarCallActionsParams["resumeCall"],
    transferCall,
  });

  if (!isInitialized) {
    return null;
  }

  const canUseDialCti = hasPermission("dial-call-cti");

  return (
    <>
      <style>{GLOBAL_FLOATING_CALL_BAR_STYLES}</style>
      {sessionIncomingVisible && sessionIncoming ? (
        <FloatingBarIncomingCallPanel
          callerName={incomingCallUserName}
          callerImageUrl={incomingCallUserImageUrl}
          callingAddress={sessionIncoming.callingAddress}
          onReject={handleRejectCall}
          onAttend={handleAttendCall}
          isDialing={isIncomingDialing}
        />
      ) : null}
      {/* Bar: transfer initiator / connected party. Hidden for transfer recipient while attend/reject
          session exists or their leg is an inbound offer (see isInboundAwaitingUserAnswerForFloatingBar). */}
      {canUseDialCti && floatingBarVisible && activeCall ? (
        <>
          <FloatingBarActiveCallSection
            barRef={barRef}
            isDragging={isDragging}
            dragPosition={dragPosition}
            defaultAnchored={useDefaultFloatingBarAnchor}
            sectionStyle={sectionStyle}
            onDragStart={handleDragStart}
            activeCall={activeCall}
            activeCallUserImageUrl={activeCallUserImageUrl}
            activeCallUserName={activeCallUserName}
            otherPartyNumber={otherPartyNumber}
            connectedElapsedDisplay={connectedElapsedDisplay}
            canCurrentUserResumeCall={canCurrentUserResumeCall}
            canTransferCall={hasPermission("transfer-call-cti")}
            isHoldingCall={isHoldingCall}
            isResumingCall={isResumingCall}
            isEndingCall={isEndingCall}
            onHoldCall={handleHoldCall}
            onResumeCall={handleResumeCall}
            onEndCall={handleEndCall}
            onOpenTransferModal={() => setShowTransferModal(true)}
          />
          <FloatingBarTransferModal
            show={showTransferModal}
            onHide={closeTransferModal}
            extensionSearch={extensionSearch}
            onExtensionSearchChange={setExtensionSearch}
            transferTarget={transferTarget}
            onTransferTargetChange={setTransferTarget}
            transferCandidates={transferCandidates}
            dnsMap={dnsMap}
            getUserDataExtensions={
              getUserDataExtensions as FloatingBarTransferModalProps["getUserDataExtensions"]
            }
            onTransfer={handleTransferCall}
            isTransferring={isTransferringCall}
          />
        </>
      ) : null}
    </>
  );
};

export default GlobalFloatingCallBar;
