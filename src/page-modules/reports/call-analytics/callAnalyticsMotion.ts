import type { Variants } from "framer-motion";
import { easeIn, easeOut } from "framer-motion";

/** Shared tab panel animation for call analytics chart pages. */
export const CALL_ANALYTICS_TAB_VARIANTS: Variants = {
  hidden: {
    opacity: 0,
    x: 20,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: easeOut,
    },
  },
  exit: {
    opacity: 0,
    x: -20,
    scale: 0.95,
    transition: {
      duration: 0.2,
      ease: easeIn,
    },
  },
};
