import BreadcrumbItem from "@common/BreadcrumbItem";
import ConfirmModal from "@components/page-partials/ConfirmModal";
import SuccessfulModal from "@components/page-partials/SuccessfulModal";
import GenericTable from "@components/GenericTable";
import { FaqFormSidebar } from "@components/faqFormSidebar";
import { FaqLabeledSelect, FaqLabeledTextInput, FaqLabeledTextarea } from "@components/faqFormFields";
import { Button } from "react-bootstrap";
import { Plus, Tag } from "lucide-react";
import React from "react";
import type { TableAction, TableColumn } from "@components/GenericTable";
import type { FAQTopicRow } from "../useFAQTopicsPage";

export type FAQTopicsPageViewProps = Readonly<{
  data: FAQTopicRow[];
  loading: boolean;
  columns: TableColumn<FAQTopicRow>[];
  actions: TableAction<FAQTopicRow>[];
  currentPage: number;
  rowsPerPage: number;
  totalRows: number;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onPaginationChange: (page: number, perPage: number) => void;
  showSidebar: boolean;
  sidebarMode: "create" | "edit" | null;
  moduleOptions: { value: unknown; label: string }[];
  isLoadingModules: boolean;
  topicName: string;
  topicDescription: string;
  topicModuleId: string;
  onTopicNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTopicDescChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onTopicModuleChange: (value: string) => void;
  onSubmitTopic: () => void;
  onOpenCreateSidebar: () => void;
  onCloseSidebar: () => void;
  showDeleteTopicModal: boolean;
  deleteTopicName: string;
  onCloseDeleteModal: () => void;
  onConfirmDelete: () => void;
  showSuccessfulModal: boolean;
  successModalTitle: string;
  successModalDescription: string;
  onCloseSuccessModal: () => void;
  isSubmitting: boolean;
}>;

export const FAQTopicsPageView: React.FC<FAQTopicsPageViewProps> = ({
  data,
  loading,
  columns,
  actions,
  currentPage,
  rowsPerPage,
  totalRows,
  searchValue,
  onSearchChange,
  onPaginationChange,
  showSidebar,
  sidebarMode,
  moduleOptions,
  isLoadingModules,
  topicName,
  topicDescription,
  topicModuleId,
  onTopicNameChange,
  onTopicDescChange,
  onTopicModuleChange,
  onSubmitTopic,
  onOpenCreateSidebar,
  onCloseSidebar,
  showDeleteTopicModal,
  deleteTopicName,
  onCloseDeleteModal,
  onConfirmDelete,
  showSuccessfulModal,
  successModalTitle,
  successModalDescription,
  onCloseSuccessModal,
  isSubmitting,
}) => {
  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="FAQs" mainLink="/faqs" subTitle="Topics" />

      <div className="page-header-title style-2 mb-3">
        <div className="d-flex justify-content-end">
          <Button variant="primary" onClick={onOpenCreateSidebar}>
            <Plus size={16} className="me-1" />
            Add Topic
          </Button>
        </div>
      </div>

      <GenericTable<FAQTopicRow>
        data={data}
        columns={columns}
        loading={loading}
        actions={actions}
        showActions={true}
        actionsLabel="Actions"
        pagination={{
          currentPage,
          rowsPerPage,
          totalRows,
          pageSizeOptions: [15, 25, 50, 100],
        }}
        onPaginationChange={onPaginationChange}
        sortable={true}
        hover={true}
        emptyMessage="No FAQ topics found."
        showToolbar={true}
        toolbar={{
          showSearch: true,
          searchValue,
          searchPlaceholder: "Search topics...",
          onSearchChange,
        }}
        showToolbarActions={false}
        uniqueKey="id"
      />

      <FaqFormSidebar
        isOpen={showSidebar}
        title={sidebarMode === "create" ? "New FAQ Topic" : "Edit FAQ Topic"}
        headerIcon={<Tag size={20} style={{ color: "#0091ae" }} />}
        canSubmit={topicName.trim() !== "" && topicModuleId !== ""}
        isSubmitting={isSubmitting}
        submitLabel={sidebarMode === "create" ? "Add Topic" : "Update Topic"}
        submittingLabel={sidebarMode === "create" ? "Adding..." : "Updating..."}
        onSubmit={onSubmitTopic}
        onClose={onCloseSidebar}
      >
        <FaqLabeledSelect
          inputId="faq-topic-module"
          label="FAQ Module"
          options={moduleOptions}
          value={topicModuleId}
          onChange={onTopicModuleChange}
          required
          helpTitle="Select the FAQ module"
          hint="Select the FAQ module this topic belongs to"
          placeholder="Select module..."
          isLoading={isLoadingModules}
        />
        <FaqLabeledTextInput
          id={sidebarMode === "create" ? "newTopicName" : "editTopicName"}
          label="Topic Name"
          value={topicName}
          onChange={onTopicNameChange}
          required
          helpTitle="Enter the name of the FAQ topic"
          hint={
            sidebarMode === "create"
              ? "Enter the name of the FAQ topic you want to create"
              : "Change the name of the FAQ topic"
          }
          placeholder={sidebarMode === "create" ? "Topic Name" : ""}
        />
        <FaqLabeledTextarea
          id={sidebarMode === "create" ? "newTopicDescription" : "editTopicDescription"}
          label="Description"
          value={topicDescription}
          onChange={onTopicDescChange}
          helpTitle="Enter a description for the FAQ topic"
          hint="Optional description for the FAQ topic"
          placeholder="Topic Description"
        />
      </FaqFormSidebar>

      <ConfirmModal
        show={showDeleteTopicModal}
        onHide={onCloseDeleteModal}
        title="Delete FAQ Topic"
        description="Are you sure you want to delete the following FAQ topic?"
        targetName={deleteTopicName}
        onConfirm={onConfirmDelete}
        confirmButtonText="Delete"
        confirmButtonVariant="danger"
        requireTextConfirmation={true}
        requiredConfirmationText="delete"
      />

      <SuccessfulModal
        show={showSuccessfulModal}
        onHide={onCloseSuccessModal}
        title={successModalTitle}
        description={successModalDescription}
      />
    </React.Fragment>
  );
};
