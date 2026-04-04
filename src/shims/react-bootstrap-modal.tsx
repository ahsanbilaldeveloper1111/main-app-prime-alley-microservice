"use client";

import * as React from "react";
import type { ModalProps } from "react-bootstrap/esm/Modal";

// Stock Modal from CJS build — only `esm/Modal.js` is replaced with this file (see next.config.ts).
// Defaults: static backdrop + keyboard off. Pass `backdrop` / `keyboard` explicitly to opt in to stock behavior.
// eslint-disable-next-line @typescript-eslint/no-require-imports -- avoid recursive ESM replacement in webpack
const RBModal = require("react-bootstrap/cjs/Modal.js");

const Modal = React.forwardRef<HTMLDivElement, ModalProps>((props, ref) => (
  <RBModal
    ref={ref}
    {...props}
    backdrop="static"
    keyboard={false}
  />
));

Modal.displayName = "Modal";

export default Object.assign(Modal, {
  Body: RBModal.Body,
  Header: RBModal.Header,
  Title: RBModal.Title,
  Footer: RBModal.Footer,
  Dialog: RBModal.Dialog,
  TRANSITION_DURATION: RBModal.TRANSITION_DURATION,
  BACKDROP_TRANSITION_DURATION: RBModal.BACKDROP_TRANSITION_DURATION,
}) as typeof RBModal;
