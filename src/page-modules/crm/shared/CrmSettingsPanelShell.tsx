import React from "react";
import { Modal } from "react-bootstrap";
import { MainSettingsFormSidebar } from "@components/main-settings/MainSettingsFormSidebar";
import { useMainSettingsFormSidebar } from "@components/main-settings/mainSettingsFormContext";

export type CrmSettingsPanelShellProps = Readonly<{
  show: boolean;
  onHide: () => void;
  title: React.ReactNode;
  titleIcon?: React.ReactNode;
  headerExtra?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  disableClose?: boolean;
  modalSize?: "sm" | "lg" | "xl";
  modalBackdrop?: boolean | "static";
}>;

/** Right-hand panel in Main Settings Smart CRM; centered modal elsewhere. */
export function CrmSettingsPanelShell({
  show,
  onHide,
  title,
  titleIcon,
  headerExtra,
  footer,
  children,
  disableClose = false,
  modalSize = "lg",
  modalBackdrop,
}: CrmSettingsPanelShellProps) {
  const preferSidebar = useMainSettingsFormSidebar();

  if (preferSidebar) {
    return (
      <MainSettingsFormSidebar
        show={show}
        onHide={onHide}
        title={title}
        titleIcon={titleIcon}
        headerExtra={headerExtra}
        footer={footer}
        disableClose={disableClose}
      >
        {children}
      </MainSettingsFormSidebar>
    );
  }

  const modalTitle = titleIcon ? (
    <span className="d-flex align-items-center gap-2">
      {titleIcon}
      {title}
    </span>
  ) : (
    title
  );

  return (
    <Modal
      show={show}
      onHide={onHide}
      size={modalSize}
      centered
      backdrop={modalBackdrop}
    >
      <Modal.Header closeButton={!disableClose}>
        <Modal.Title>{modalTitle}</Modal.Title>
      </Modal.Header>
      <Modal.Body>{children}</Modal.Body>
      {footer ? (
        <Modal.Footer className="border-0 pt-0">{footer}</Modal.Footer>
      ) : null}
    </Modal>
  );
}

export function useCrmSettingsPrefersSidebar(): boolean {
  return useMainSettingsFormSidebar();
}
