import type { CrmTableRowAction } from "@page-modules/crm/shared/CrmTableRowActions";
import { MoreVertical } from "lucide-react";
import React, { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const MOBILE_MENU_WIDTH_PX = 200;
const MOBILE_ACTIONS_MEDIA_QUERY = "(max-width: 767.98px)";

function useMobileActionsViewport(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (globalThis.window === undefined) {
      return undefined;
    }
    const mq = globalThis.window.matchMedia(MOBILE_ACTIONS_MEDIA_QUERY);
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return isMobile;
}

function stopRowClick(e: React.SyntheticEvent) {
  e.stopPropagation();
}

type CrmTableRowActionsMobileMenuProps = Readonly<{
  actions: readonly CrmTableRowAction[];
}>;

/** Overflow menu for row icon actions on narrow viewports (matches GenericTable mobile actions). */
export function CrmTableRowActionsMobileMenu({ actions }: CrmTableRowActionsMobileMenuProps) {
  const menuId = useId().replaceAll(":", "");
  const isMobileViewport = useMobileActionsViewport();
  const anchorRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  const updateMenuPosition = useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor || globalThis.window === undefined) return;
    const rect = anchor.getBoundingClientRect();
    let left = rect.right - MOBILE_MENU_WIDTH_PX;
    const maxLeft = globalThis.window.innerWidth - MOBILE_MENU_WIDTH_PX - 8;
    if (left > maxLeft) left = maxLeft;
    if (left < 8) left = 8;
    setMenuPosition({ top: rect.bottom + 4, left });
  }, []);

  const closeMenu = useCallback(() => setShowMenu(false), []);

  useEffect(() => {
    if (!isMobileViewport) {
      closeMenu();
    }
  }, [isMobileViewport, closeMenu]);

  const handleToggleMenu = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!isMobileViewport) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    if (showMenu) {
      closeMenu();
      return;
    }
    updateMenuPosition();
    setShowMenu(true);
  };

  useLayoutEffect(() => {
    if (!showMenu) return;
    updateMenuPosition();
    const onReposition = () => updateMenuPosition();
    globalThis.window.addEventListener("resize", onReposition);
    globalThis.window.addEventListener("scroll", onReposition, true);
    return () => {
      globalThis.window.removeEventListener("resize", onReposition);
      globalThis.window.removeEventListener("scroll", onReposition, true);
    };
  }, [showMenu, updateMenuPosition]);

  useEffect(() => {
    if (!showMenu) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (anchorRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      closeMenu();
    };
    const timerId = globalThis.window.setTimeout(() => {
      document.addEventListener("pointerdown", onPointerDown);
    }, 0);
    return () => {
      globalThis.window.clearTimeout(timerId);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [showMenu, closeMenu]);

  if (actions.length === 0) {
    return null;
  }

  const menuPortal =
    showMenu && isMobileViewport && globalThis.document !== undefined
      ? createPortal(
          <div
            ref={menuRef}
            className="dropdown-menu show gt-mobile-actions-popup"
            style={{
              position: "fixed",
              top: menuPosition.top,
              left: menuPosition.left,
              minWidth: MOBILE_MENU_WIDTH_PX,
              zIndex: 1080,
            }}
          >
            {actions.map((action) => (
              <button
                key={action.label}
                type="button"
                className="dropdown-item"
                disabled={action.disabled === true}
                title={action.disabled ? action.disabledTitle : undefined}
                onClick={(e) => {
                  stopRowClick(e);
                  if (action.disabled === true) return;
                  closeMenu();
                  action.onClick();
                }}
              >
                {action.label}
              </button>
            ))}
          </div>,
          document.body,
        )
      : null;

  if (!isMobileViewport) {
    return null;
  }

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        className="gt-mobile-actions-more-btn btn btn-light btn-sm btn-action-style-2 p-1 d-md-none"
        aria-label="Open actions menu"
        aria-expanded={showMenu}
        title="Actions"
        id={`crm-actions-menu-${menuId}`}
        onPointerDown={stopRowClick}
        onMouseDown={stopRowClick}
        onClick={handleToggleMenu}
      >
        <MoreVertical size={18} aria-hidden />
      </button>
      {menuPortal}
    </>
  );
}
