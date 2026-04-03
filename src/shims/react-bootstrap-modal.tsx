"use client";

import * as React from "react";
import type { ModalProps } from "react-bootstrap/esm/Modal";

// Stock Modal from CJS build — only `esm/Modal.js` is replaced with this file, so this import stays the real implementation.
// eslint-disable-next-line @typescript-eslint/no-require-imports -- avoid recursive ESM replacement in webpack
const RBModal = require("react-bootstrap/cjs/Modal.js") as typeof import("react-bootstrap/esm/Modal").default;

const Modal = React.forwardRef<HTMLDivElement, ModalProps>((props, ref) => (
  <RBModal
    ref={ref}
    {...props}
    backdrop={props.backdrop === undefined ? "static" : props.backdrop}
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
