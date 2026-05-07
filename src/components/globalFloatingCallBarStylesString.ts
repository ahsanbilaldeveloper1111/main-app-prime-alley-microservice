/** Injected once by GlobalFloatingCallBar; class names match GlobalFloatingCallBarPanels. */
export const GLOBAL_FLOATING_CALL_BAR_STYLES = `
  .global-floating-call-bar {
    animation: slideUp 0.3s ease-out;
    user-select: none;
    list-style: none;
    /* Position is controlled by inline styles from sectionStyle so drag-snap is respected */
    box-shadow:0px 2px 5px #c7c0c0 !important;
  }

  /* Responsive default placement (no custom drag position) */
  .global-floating-call-bar.global-floating-call-bar-default-anchor {
    top: max(12px, env(safe-area-inset-top, 0px));
    right: clamp(12px, 4vw, 15rem);
    left: auto;
    bottom: auto;
  }

  @media (max-width: 768px) {
    .global-floating-call-bar.global-floating-call-bar-default-anchor {
      right: max(12px, env(safe-area-inset-right, 0px));
      left: max(12px, env(safe-area-inset-left, 0px));
      width: calc(100vw - 24px);
      max-width: min(625px, calc(100vw - 24px));
      min-width: 0;
    }
  }

  @media (max-width: 480px) {
    .global-floating-call-bar.global-floating-call-bar-default-anchor {
      padding: 0.4rem 0.65rem;
      gap: 0.5rem;
      border-radius: 1rem;
    }
  }
  .global-floating-call-bar * {
    list-style: none;
  }

  .global-floating-call-bar.dragging {
    cursor: grabbing !important;
    opacity: 0.9;
    /* Allow inline/CSS variable position to take effect during drag */
    top: var(--bar-drag-top, 15px) !important;
    left: var(--bar-drag-left, auto) !important;
    right: var(--bar-drag-right, 15rem) !important;
    width: auto !important;
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.7;
    }
  }

  .global-floating-call-bar .call-status-ringing {
    animation: pulse 1.5s ease-in-out infinite;
  }

  .call-bar-drag-handle {
    cursor: grab;
    opacity: 0.6;
    transition: opacity 0.2s;
  }

  .call-bar-drag-handle:hover {
    opacity: 1;
  }

  .call-bar-drag-handle:active {
    cursor: grabbing;
  }
`;
