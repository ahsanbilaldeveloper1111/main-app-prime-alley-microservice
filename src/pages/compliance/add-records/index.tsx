import "@assets/scss/datatable-style.scss";
import React, { FormEvent, ReactElement } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import DeleteConfirmationModal from "@components/page-partials/DeleteConfirmationModal";
import GenericTable from "@components/GenericTable";
import { Row } from "react-bootstrap";

import {
  AddRecordsBulkCsvCard,
} from "@components/compliance/add-records/AddRecordsBulkCsvCard";
import { AddRecordsPageHeader } from "@components/compliance/add-records/AddRecordsPageHeader";
import { AddRecordsSingleRecordCard } from "@components/compliance/add-records/AddRecordsSingleRecordCard";
import { useAddRecordsPage } from "@components/compliance/add-records/useAddRecordsPage";
import { LocalDNDBlockRecord } from "@utils/dncr";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import "@components/compliance/add-records/addRecordsPage.scss";

const AddRecords = () => {
  const vm = useAddRecordsPage();

  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle=""
        mainLink=""
        subTitle="Add Local DND"
      />

      <AddRecordsPageHeader />

      {vm.hasAddSection && (
        <Row className="g-3 mb-4">
          {vm.canAddLocalDnd && (
            <AddRecordsSingleRecordCard
              calledNumber={vm.calledNumber}
              comments={vm.comments}
              submitting={vm.submitting}
              onCalledNumberChange={vm.setCalledNumber}
              onCommentsChange={vm.setComments}
              onSubmit={(e: FormEvent) => {
                void vm.handleAddBlock(e);
              }}
              bulkColumnWidth={vm.canBulkAddLocalDnd}
            />
          )}
          {vm.canBulkAddLocalDnd && (
            <AddRecordsBulkCsvCard
              csvFile={vm.csvFile}
              csvPreview={vm.csvPreview}
              bulkSubmitting={vm.bulkSubmitting}
              csvInputRef={vm.csvInputRef}
              onFileChange={(e) => {
                void vm.handleFileChange(e);
              }}
              onBulkUpload={() => {
                void vm.handleBulkUpload();
              }}
              onDownloadSample={vm.downloadSampleCSV}
              singleColumnWidth={vm.canAddLocalDnd}
            />
          )}
        </Row>
      )}

      <div className="mb-2 addRecordsPage-sectionHeading">Blocked Numbers List</div>

      <GenericTable<LocalDNDBlockRecord>
        data={vm.apiData}
        columns={vm.columns}
        actions={vm.actions}
        showActions={vm.canDeleteLocalDnd}
        actionsLabel="ACTIONS"
        loading={vm.loading}
        loadingMessage="Loading..."
        emptyMessage={vm.error || "No records found matching your filters"}
        uniqueKey="id"
        selectable={vm.canBulkDeleteLocalDnd}
        selectedRows={vm.selectedRows}
        onSelectionChange={(rows) =>
          vm.setSelectedItems(rows.map((row) => row.id))
        }
        showToolbar={true}
        toolbar={vm.toolbarConfig}
        showToolbarActions={false}
        pagination={{
          currentPage: vm.currentPage,
          rowsPerPage: vm.itemsPerPage,
          totalRows: vm.totalRecords,
          pageSizeOptions: [10, 25, 50, 100],
        }}
        onPaginationChange={(page, rowsPerPageValue) => {
          if (rowsPerPageValue !== vm.itemsPerPage) {
            vm.handleItemsPerPageChange(rowsPerPageValue);
            return;
          }
          vm.setCurrentPage(page);
        }}
      />

      {vm.recordToDelete && (
        <DeleteConfirmationModal
          show={vm.showDeleteModal}
          onHide={() => {
            vm.setShowDeleteModal(false);
            vm.setRecordToDelete(null);
          }}
          onConfirm={vm.handleConfirmDelete}
          itemName={`blocked number ${vm.recordToDelete.called_number}`}
          itemType="block"
          loading={vm.deleting}
        />
      )}

      <DeleteConfirmationModal
        show={vm.showBulkDeleteModal}
        onHide={() => vm.setShowBulkDeleteModal(false)}
        onConfirm={vm.handleConfirmBulkDelete}
        itemName={`${vm.selectedItems.length} record(s)`}
        itemType="block"
        loading={vm.deleting}
      />
    </React.Fragment>
  );
};

AddRecords.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default AddRecords;
