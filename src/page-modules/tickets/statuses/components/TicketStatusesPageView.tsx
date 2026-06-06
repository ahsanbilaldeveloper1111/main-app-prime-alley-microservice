import PageHeader from "@components/PageHeader";
import type { TableColumn } from "@components/GenericTable";
import { EmbeddedSettingsTable } from "@components/main-settings/EmbeddedSettingsTable";
import { SettingsEmbeddedToolbar } from "@components/main-settings/SettingsEmbeddedToolbar";
import ConfirmModal from "@components/page-partials/ConfirmModal";
import type { StatusSidebarConfig, TicketStatus } from "../ticketStatusesTypes";
import React from "react";
import { Button } from "react-bootstrap";
import { FiPlus } from "react-icons/fi";
import { StatusSidebar } from "./StatusSidebar";

type TicketStatusesPageViewProps = Readonly<{
  embeddedInMainSettings?: boolean;
  data: TicketStatus[];
  loading: boolean;
  columns: TableColumn<TicketStatus>[];
  currentPage: number;
  rowsPerPage: number;
  totalRows: number;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onPaginationChange: (page: number, perPage: number) => void;
  canViewList: boolean;
  canCreate: boolean;
  showCreateStatusSidebar: boolean;
  newStatusName: string;
  newStatusColor: string;
  onNewStatusNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onNewStatusColorChange: (color: string) => void;
  onSubmitCreateStatus: () => void;
  onOpenCreateStatusSidebar: () => void;
  onCloseCreateStatusSidebar: () => void;
  createSidebarConfig: StatusSidebarConfig;
  showEditStatusModal: boolean;
  selectedStatusName: string;
  selectedStatusColor: string;
  onEditStatusNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onEditStatusColorChange: (color: string) => void;
  onSubmitEditStatus: () => void;
  onCloseEditStatusModal: () => void;
  editSidebarConfig: StatusSidebarConfig;
  showDeleteStatusModal: boolean;
  onCloseDeleteStatusModal: () => void;
  onSubmitDeleteStatus: () => void;
}>;

export const TicketStatusesPageView: React.FC<TicketStatusesPageViewProps> = ({
  embeddedInMainSettings = false,
  data,
  loading,
  columns,
  currentPage,
  rowsPerPage,
  totalRows,
  searchValue,
  onSearchChange,
  onPaginationChange,
  canViewList,
  canCreate,
  showCreateStatusSidebar,
  newStatusName,
  newStatusColor,
  onNewStatusNameChange,
  onNewStatusColorChange,
  onSubmitCreateStatus,
  onOpenCreateStatusSidebar,
  onCloseCreateStatusSidebar,
  createSidebarConfig,
  showEditStatusModal,
  selectedStatusName,
  selectedStatusColor,
  onEditStatusNameChange,
  onEditStatusColorChange,
  onSubmitEditStatus,
  onCloseEditStatusModal,
  editSidebarConfig,
  showDeleteStatusModal,
  onCloseDeleteStatusModal,
  onSubmitDeleteStatus,
}) => {
  const addButton = canCreate ? (
    <Button variant="primary" size="sm" onClick={onOpenCreateStatusSidebar}>
      <FiPlus className="me-2" aria-hidden />
      Add Status
    </Button>
  ) : null;

  let pageToolbar: React.ReactNode;
  if (embeddedInMainSettings) {
    pageToolbar = (
      <SettingsEmbeddedToolbar
        searchValue={searchValue}
        onSearchChange={onSearchChange}
        searchPlaceholder="Search statuses..."
        actions={addButton}
      />
    );
  } else {
    pageToolbar = (
      <PageHeader
        title=""
        description=""
        showSearch={false}
        searchPlaceholder="Search statuses..."
        searchValue={searchValue}
        onSearchChange={onSearchChange}
        buttons={addButton}
      />
    );
  }

  return (
    <div className={embeddedInMainSettings ? "tickets-settings-page" : undefined}>
      {pageToolbar}

      {canViewList ? (
        <EmbeddedSettingsTable<TicketStatus>
          embedded={embeddedInMainSettings}
          data={data}
          columns={columns}
          loading={loading}
          emptyMessage="No statuses found."
          pagination={{
            currentPage,
            rowsPerPage,
            totalRows,
            pageSizeOptions: [15, 25, 50, 100],
          }}
          onPaginationChange={onPaginationChange}
          uniqueKey="id"
          toolbar={{
            showSearch: true,
            searchValue,
            searchPlaceholder: "Search statuses...",
            onSearchChange,
          }}
        />
      ) : null}

      <StatusSidebar
        isOpen={showCreateStatusSidebar}
        config={createSidebarConfig}
        name={newStatusName}
        color={newStatusColor}
        onNameChange={onNewStatusNameChange}
        onColorChange={onNewStatusColorChange}
        onSubmit={async () => {
          await onSubmitCreateStatus();
        }}
        onClose={onCloseCreateStatusSidebar}
      />

      <StatusSidebar
        isOpen={showEditStatusModal}
        config={editSidebarConfig}
        name={selectedStatusName}
        color={selectedStatusColor}
        onNameChange={onEditStatusNameChange}
        onColorChange={onEditStatusColorChange}
        onSubmit={async () => {
          await onSubmitEditStatus();
        }}
        onClose={onCloseEditStatusModal}
      />

      <ConfirmModal
        show={showDeleteStatusModal}
        onHide={onCloseDeleteStatusModal}
        title="Delete Status?"
        description="Are you sure you want to delete status {targetName}? This action cannot be undone."
        targetName={selectedStatusName || ""}
        confirmButtonText="Delete Status"
        cancelButtonText="Cancel"
        onConfirm={async () => {
          await onSubmitDeleteStatus();
        }}
        onCancel={onCloseDeleteStatusModal}
        confirmButtonVariant="danger"
        cancelButtonVariant="secondary"
      />
    </div>
  );
};
