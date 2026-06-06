import { buildUserEditPath } from "@utils/controlhub/usersNavigation";
import { Eye, Key, MoreVertical } from "lucide-react";
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button, Dropdown } from "react-bootstrap";
import { DROPDOWN_MENU_POPPER_CONFIG } from "@components/GenericTable/dropdownMenuPopperConfig";

const STATUS_OPTIONS = ["processing", "completed", "deleted"] as const;
const MOBILE_MENU_WIDTH_PX = 176;

export type UserDirectoryRow = Readonly<{
  id: string | number;
  encId: string;
  username?: string;
  status?: string;
}>;

export type UserDirectoryRowActionsProps = Readonly<{
  row: UserDirectoryRow;
  permissions: string[] | undefined;
  onResetPassword?: (username: string) => void;
  onStatusOptionSelect?: (row: UserDirectoryRow, status: string) => void;
}>;

function stopRowClick(e: React.SyntheticEvent) {
  e.stopPropagation();
}

function navigateToUserEdit(encId: string) {
  if (typeof globalThis === "undefined" || !globalThis.window) return;
  globalThis.window.location.href = buildUserEditPath(encId);
}

type ActionFlags = Readonly<{
  canResetPassword: boolean;
  canView: boolean;
  canChangeStatus: boolean;
  statusOptions: readonly string[];
  hasMobileMenu: boolean;
  hasDesktopActions: boolean;
}>;

function useUserDirectoryActionFlags(
  row: UserDirectoryRow,
  permissions: string[] | undefined,
): ActionFlags {
  const canResetPassword =
    (permissions?.includes("reset-password-users") ?? false) && Boolean(row.username);
  const canView = permissions?.includes("edit-users") ?? false;
  const canChangeStatus = permissions?.includes("change-status-users") ?? false;

  const statusOptions = useMemo(
    () =>
      STATUS_OPTIONS.filter(
        (status) => status.toLowerCase() !== (row.status || "").toLowerCase(),
      ),
    [row.status],
  );

  const hasMobileMenu = canResetPassword || canView || (canChangeStatus && statusOptions.length > 0);
  const hasDesktopActions =
    canResetPassword || canView || (canChangeStatus && statusOptions.length > 0);

  return {
    canResetPassword,
    canView,
    canChangeStatus,
    statusOptions,
    hasMobileMenu,
    hasDesktopActions,
  };
}

function UserDirectoryDesktopActions({
  row,
  flags,
  onResetPassword,
  onStatusOptionSelect,
}: Readonly<{
  row: UserDirectoryRow;
  flags: ActionFlags;
  onResetPassword?: (username: string) => void;
  onStatusOptionSelect?: (row: UserDirectoryRow, status: string) => void;
}>) {
  const { canResetPassword, canView, canChangeStatus, statusOptions } = flags;

  return (
    <div className="users-directory-row-actions users-directory-row-actions--desktop d-none d-md-flex flex-nowrap align-items-center gap-2">
      {canResetPassword ? (
        <Button
          type="button"
          variant="light"
          size="sm"
          className="btn-action-style-2 p-1 text-primary"
          title="Reset Password"
          aria-label="Reset Password"
          onClick={(e) => {
            stopRowClick(e);
            if (row.username) onResetPassword?.(row.username);
          }}
        >
          <Key className="text-primary" size={16} />
        </Button>
      ) : null}

      {canView ? (
        <Button
          type="button"
          variant="light"
          className="btn-action-style-2 p-1 text-primary"
          title="View"
          aria-label="View user"
          onClick={(e) => {
            stopRowClick(e);
            navigateToUserEdit(row.encId);
          }}
        >
          <Eye size={16} />
        </Button>
      ) : null}

      {canChangeStatus && statusOptions.length > 0 ? (
        <Dropdown align="end">
          <Dropdown.Toggle
            type="button"
            variant="outline-primary"
            size="sm"
            title="Status"
            id={`status-dropdown-${row.encId}`}
          >
            Change Status
          </Dropdown.Toggle>
          <Dropdown.Menu renderOnMount popperConfig={DROPDOWN_MENU_POPPER_CONFIG}>
            {statusOptions.map((status) => (
              <Dropdown.Item
                key={status}
                eventKey={status}
                onClick={(e) => {
                  stopRowClick(e);
                  onStatusOptionSelect?.(row, status);
                }}
              >
                {status}
              </Dropdown.Item>
            ))}
          </Dropdown.Menu>
        </Dropdown>
      ) : null}
    </div>
  );
}

function UserDirectoryMobileActionsMenu({
  row,
  flags,
  onResetPassword,
  onStatusOptionSelect,
}: Readonly<{
  row: UserDirectoryRow;
  flags: ActionFlags;
  onResetPassword?: (username: string) => void;
  onStatusOptionSelect?: (row: UserDirectoryRow, status: string) => void;
}>) {
  const { canResetPassword, canView, canChangeStatus, statusOptions } = flags;
  const anchorRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  const updateMenuPosition = useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    let left = rect.right - MOBILE_MENU_WIDTH_PX;
    const maxLeft = globalThis.window.innerWidth - MOBILE_MENU_WIDTH_PX - 8;
    if (left > maxLeft) left = maxLeft;
    if (left < 8) left = 8;
    setMenuPosition({
      top: rect.bottom + 4,
      left,
    });
  }, []);

  const closeMenu = useCallback(() => setShowMenu(false), []);

  const handleToggleMenu = (e: React.MouseEvent<HTMLButtonElement>) => {
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

  const menuPortal =
    showMenu && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={menuRef}
            className="dropdown-menu show users-directory-actions-popup"
            style={{
              position: "fixed",
              top: menuPosition.top,
              left: menuPosition.left,
              minWidth: MOBILE_MENU_WIDTH_PX,
              zIndex: 1080,
            }}
          >
            {canResetPassword ? (
              <button
                type="button"
                className="dropdown-item"
                onClick={(e) => {
                  stopRowClick(e);
                  closeMenu();
                  if (row.username) onResetPassword?.(row.username);
                }}
              >
                Reset Password
              </button>
            ) : null}

            {canView ? (
              <button
                type="button"
                className="dropdown-item"
                onClick={(e) => {
                  stopRowClick(e);
                  closeMenu();
                  navigateToUserEdit(row.encId);
                }}
              >
                View user
              </button>
            ) : null}

            {canChangeStatus && statusOptions.length > 0 ? (
              <>
                <div className="dropdown-divider" />
                <h6 className="dropdown-header">Change status</h6>
                {statusOptions.map((status) => (
                  <button
                    key={status}
                    type="button"
                    className="dropdown-item"
                    onClick={(e) => {
                      stopRowClick(e);
                      closeMenu();
                      onStatusOptionSelect?.(row, status);
                    }}
                  >
                    {status}
                  </button>
                ))}
              </>
            ) : null}
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        className="users-directory-more-btn btn btn-light btn-sm btn-action-style-2 p-1 d-md-none"
        aria-label="Open actions menu"
        aria-expanded={showMenu}
        title="Actions"
        id={`user-actions-menu-${row.encId}`}
        onPointerDown={stopRowClick}
        onClick={handleToggleMenu}
      >
        <MoreVertical size={18} aria-hidden />
      </button>
      {menuPortal}
    </>
  );
}

export function UserDirectoryRowActions({
  row,
  permissions,
  onResetPassword,
  onStatusOptionSelect,
}: UserDirectoryRowActionsProps) {
  const flags = useUserDirectoryActionFlags(row, permissions);

  if (!flags.hasMobileMenu && !flags.hasDesktopActions) {
    return null;
  }

  return (
    <>
      {flags.hasDesktopActions ? (
        <UserDirectoryDesktopActions
          row={row}
          flags={flags}
          onResetPassword={onResetPassword}
          onStatusOptionSelect={onStatusOptionSelect}
        />
      ) : null}

      {flags.hasMobileMenu ? (
        <UserDirectoryMobileActionsMenu
          row={row}
          flags={flags}
          onResetPassword={onResetPassword}
          onStatusOptionSelect={onStatusOptionSelect}
        />
      ) : null}
    </>
  );
}
