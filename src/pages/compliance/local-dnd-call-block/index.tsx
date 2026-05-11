import "@assets/scss/datatable-style.scss";
import React, { ReactElement } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import DeleteConfirmationModal from "@components/page-partials/DeleteConfirmationModal";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";

import { LocalDndCallBlockAddModal } from "@components/compliance/local-dnd-call-block/LocalDndCallBlockAddModal";
import { LocalDndCallBlockBulkAddModal } from "@components/compliance/local-dnd-call-block/LocalDndCallBlockBulkAddModal";
import { LocalDndCallBlockDataTable } from "@components/compliance/local-dnd-call-block/LocalDndCallBlockDataTable";
import { LocalDndCallBlockFilters } from "@components/compliance/local-dnd-call-block/LocalDndCallBlockFilters";
import { LocalDndCallBlockPageHeader } from "@components/compliance/local-dnd-call-block/LocalDndCallBlockPageHeader";
import { useLocalDndCallBlockPage } from "@components/compliance/local-dnd-call-block/useLocalDndCallBlockPage";

import "@components/compliance/local-dnd-call-block/localDndCallBlockPage.scss";

const LocalDNDCallBlock = () => {
  const vm = useLocalDndCallBlockPage();

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Local DND Call Block" />

      <LocalDndCallBlockPageHeader vm={vm} />
      <LocalDndCallBlockFilters vm={vm} />
      <LocalDndCallBlockDataTable vm={vm} />

      <LocalDndCallBlockAddModal vm={vm} />
      <LocalDndCallBlockBulkAddModal vm={vm} />

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
        itemName={`${vm.selectedRecords.length} record(s)`}
        itemType="block"
        loading={vm.deleting}
      />
    </React.Fragment>
  );
};

LocalDNDCallBlock.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default LocalDNDCallBlock;
