/**
 * Default react-bootstrap Modal: static backdrop + no Esc dismiss.
 * Preserved from the previous webpack NormalModuleReplacementPlugin so
 * existing modals across the app keep their UX defaults.
 */

import * as React from "react";
import OriginalModal from "react-bootstrap/cjs/Modal";

type AnyModalProps = React.ComponentProps<typeof OriginalModal> & {
  backdrop?: boolean | "static";
  keyboard?: boolean;
};

const Modal = React.forwardRef<unknown, AnyModalProps>(function PrimeAlleyModal(
  props,
  ref,
) {
  const { backdrop = "static", keyboard = false, ...rest } = props;
  return (
    <OriginalModal
      ref={ref as never}
      backdrop={backdrop as never}
      keyboard={keyboard}
      {...rest}
    />
  );
}) as unknown as typeof OriginalModal;

const Original = OriginalModal as unknown as Record<string, unknown>;
for (const key of Object.keys(Original)) {
  (Modal as unknown as Record<string, unknown>)[key] = Original[key];
}

export default Modal;
