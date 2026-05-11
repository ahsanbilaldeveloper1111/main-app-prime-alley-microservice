import "@assets/scss/datatable-style.scss";
import React, { ReactElement } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericTable from "@components/GenericTable";
import type { MappedCDRRecord } from "@components/compliance/cdr-records/cdrRecordsDomain";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";

import { useCdrRecordsPage } from "@components/compliance/cdr-records/useCdrRecordsPage";

import "@components/compliance/cdr-records/cdrRecordsPage.scss";

const CDRRecords = () => {
  const vm = useCdrRecordsPage();

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="CDR Records" />

      <GenericTable<MappedCDRRecord>
        data={vm.mappedData}
        columns={vm.cdrColumns}
        loading={vm.loading}
        loadingMessage="Loading CDR records..."
        emptyMessage={
          vm.error ? (
            <span className="cdrRecords-emptyError">{vm.error}</span>
          ) : (
            "No records found matching your filters"
          )
        }
        uniqueKey="id"
        pagination={{
          currentPage: vm.currentPage,
          rowsPerPage: vm.recordsPerPage,
          totalRows: vm.totalRecords,
          pageSizeOptions: [25, 50, 100],
        }}
        onPaginationChange={(page, rowsPerPageValue) => {
          if (rowsPerPageValue !== vm.recordsPerPage) {
            vm.handleRecordsPerPageChange(rowsPerPageValue);
            return;
          }
          vm.setCurrentPage(page);
        }}
        showToolbar={true}
        toolbar={vm.toolbarConfig}
        showToolbarActions={false}
        showActions={false}
        statsCards={vm.statsCards}
        metricsGridMinWidth="200px"
      />
    </React.Fragment>
  );
};

CDRRecords.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CDRRecords;
