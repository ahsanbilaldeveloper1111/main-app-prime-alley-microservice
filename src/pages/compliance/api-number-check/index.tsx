import "@assets/scss/datatable-style.scss";
import React, { ReactElement } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";

import { ApiNumberCheckFormatGuideModal } from "@components/compliance/api-number-check/ApiNumberCheckFormatGuideModal";
import { ApiNumberCheckInputSection } from "@components/compliance/api-number-check/ApiNumberCheckInputSection";
import { ApiNumberCheckResultsSection } from "@components/compliance/api-number-check/ApiNumberCheckResultsSection";
import { useApiNumberCheckPage } from "@components/compliance/api-number-check/useApiNumberCheckPage";

import "@components/compliance/api-number-check/apiNumberCheckPage.scss";

const APINumberCheck = () => {
  const vm = useApiNumberCheckPage();

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="API Number Check" />

      <div className="apiNumberCheck-container">
        <div className="apiNumberCheck-inner">
          <ApiNumberCheckInputSection
            canBulkCheckDncr={vm.canBulkCheckDncr}
            activeTab={vm.activeTab}
            setActiveTab={vm.setActiveTab}
            onOpenFormatGuide={() => vm.setShowFormatGuide(true)}
            manualInput={vm.manualInput}
            setManualInput={vm.setManualInput}
            isManualInputValid={vm.isManualInputValid}
            validCount={vm.validCount}
            invalidCount={vm.invalidCount}
            isChecking={vm.isChecking}
            handleCheckNumbers={vm.handleCheckNumbers}
            clearManualInput={vm.clearManualInput}
            csvFile={vm.csvFile}
            csvInputRef={vm.csvInputRef}
            csvValidCount={vm.csvValidCount}
            csvInvalidCount={vm.csvInvalidCount}
            handleFileUpload={vm.handleFileUpload}
            handleDragOver={vm.handleDragOver}
            handleDrop={vm.handleDrop}
            handleDropzoneKeyDown={vm.handleDropzoneKeyDown}
            onRemoveCsvFile={vm.onRemoveCsvFile}
            downloadSampleFile={vm.downloadSampleFile}
            handleBulkUpload={vm.handleBulkUpload}
            isUploading={vm.isUploading}
            handleDownloadResults={vm.handleDownloadResults}
            showDownloadResults={vm.showDownloadResults}
            disableBulkSubmit={vm.disableBulkSubmit}
          />

          <ApiNumberCheckResultsSection
            totalNumbers={vm.totalNumbers}
            deniedCount={vm.deniedCount}
            permittedCount={vm.permittedCount}
            invalidStatusCount={vm.invalidStatusCount}
            hasResults={vm.hasResults}
            tableData={vm.tableData}
            tableColumns={vm.tableColumns}
            isChecking={vm.isChecking}
            isUploading={vm.isUploading}
          />
        </div>
      </div>

      <ApiNumberCheckFormatGuideModal
        show={vm.showFormatGuide}
        onHide={() => vm.setShowFormatGuide(false)}
        canBulkCheckDncr={vm.canBulkCheckDncr}
      />
    </React.Fragment>
  );
};

APINumberCheck.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default APINumberCheck;
