import BreadcrumbItem from "@common/BreadcrumbItem";
import ConfirmModal from "@components/page-partials/ConfirmModal";
import SuccessfulModal from "@components/page-partials/SuccessfulModal";
import GenericTable from "@components/GenericTable";
import { Button } from "react-bootstrap";
import { Plus } from "lucide-react";
import React from "react";
import { CREATE_ITEM_CONFIG, EDIT_ITEM_CONFIG } from "../faqItemsTypes";
import { FaqItemSidebar } from "./FaqItemSidebar";
import type { FAQItemRow } from "../useFAQItemsPage";
import type { TableAction, TableColumn } from "@components/GenericTable";
import type { FAQItemFormData } from "../faqItemsTypes";

export type FaqItemsPageViewProps = Readonly<{
  tableData: FAQItemRow[];
  totalRows: number;
  isLoading: boolean;
  columns: TableColumn<FAQItemRow>[];
  actions: TableAction<FAQItemRow>[];
  currentPage: number;
  rowsPerPage: number;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onPaginationChange: (page: number, perPage: number) => void;
  formData: FAQItemFormData;
  topicOptions: { value: unknown; label: string }[];
  isLoadingTopics: boolean;
  showCreateSidebar: boolean;
  showEditSidebar: boolean;
  selectedItemId: string | number | null;
  onTopicChange: (value: string) => void;
  onQuestionChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAnswerChange: (html: string) => void;
  onDescriptionChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onTypeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenCreate: () => void;
  onCloseCreate: () => void;
  onCloseEdit: () => void;
  onSubmitCreate: () => void;
  onSubmitEdit: () => void;
  showDeleteItemModal: boolean;
  onCloseDeleteModal: () => void;
  onConfirmDelete: () => void;
  showSuccessfulModal: boolean;
  successModalTitle: string;
  successModalDescription: string;
  onCloseSuccessModal: () => void;
  isSubmitting: boolean;
  showBreadcrumb?: boolean;
  breadcrumbMainLink?: string;
}>;

export const FaqItemsPageView: React.FC<FaqItemsPageViewProps> = ({
  tableData,
  totalRows,
  isLoading,
  columns,
  actions,
  currentPage,
  rowsPerPage,
  searchValue,
  onSearchChange,
  onPaginationChange,
  formData,
  topicOptions,
  isLoadingTopics,
  showCreateSidebar,
  showEditSidebar,
  selectedItemId,
  onTopicChange,
  onQuestionChange,
  onAnswerChange,
  onDescriptionChange,
  onTypeChange,
  onOpenCreate,
  onCloseCreate,
  onCloseEdit,
  onSubmitCreate,
  onSubmitEdit,
  showDeleteItemModal,
  onCloseDeleteModal,
  onConfirmDelete,
  showSuccessfulModal,
  successModalTitle,
  successModalDescription,
  onCloseSuccessModal,
  isSubmitting,
  showBreadcrumb = true,
  breadcrumbMainLink = "/main-settings/help-center/items",
}) => {
  return (
    <React.Fragment>
      {showBreadcrumb ? (
        <BreadcrumbItem mainTitle="FAQs" mainLink={breadcrumbMainLink} subTitle="FAQ Items" />
      ) : null}

      <div className="page-header-title style-2 mb-3">
        <div className="d-flex justify-content-end">
          <Button variant="primary" onClick={onOpenCreate}>
            <Plus size={16} className="me-1" />
            Add FAQ
          </Button>
        </div>
      </div>

      <GenericTable<FAQItemRow>
        data={tableData}
        columns={columns}
        actions={actions}
        showActions={true}
        actionsLabel="Actions"
        loading={isLoading}
        emptyMessage="No FAQs found"
        pagination={{
          currentPage,
          rowsPerPage,
          totalRows,
          pageSizeOptions: [15, 25, 50, 100],
        }}
        onPaginationChange={onPaginationChange}
        sortable={true}
        showToolbar={true}
        toolbar={{
          showSearch: true,
          searchValue,
          searchPlaceholder: "Search FAQs...",
          onSearchChange,
        }}
        uniqueKey="id"
        hover={true}
        showToolbarActions={false}
      />

      <FaqItemSidebar
        isOpen={showCreateSidebar}
        config={CREATE_ITEM_CONFIG}
        selectedItemId={null}
        formData={formData}
        topicOptions={topicOptions}
        isLoadingTopics={isLoadingTopics}
        onTopicChange={onTopicChange}
        onQuestionChange={onQuestionChange}
        onAnswerChange={onAnswerChange}
        onDescriptionChange={onDescriptionChange}
        onTypeChange={onTypeChange}
        onSubmit={onSubmitCreate}
        onClose={onCloseCreate}
        isSubmitting={isSubmitting}
      />

      <FaqItemSidebar
        isOpen={showEditSidebar}
        config={EDIT_ITEM_CONFIG}
        selectedItemId={selectedItemId}
        formData={formData}
        topicOptions={topicOptions}
        isLoadingTopics={isLoadingTopics}
        onTopicChange={onTopicChange}
        onQuestionChange={onQuestionChange}
        onAnswerChange={onAnswerChange}
        onDescriptionChange={onDescriptionChange}
        onTypeChange={onTypeChange}
        onSubmit={onSubmitEdit}
        onClose={onCloseEdit}
        isSubmitting={isSubmitting}
      />

      <ConfirmModal
        show={showDeleteItemModal}
        onHide={onCloseDeleteModal}
        title="Delete FAQ"
        description="Are you sure you want to delete this FAQ?"
        targetName="this FAQ"
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
