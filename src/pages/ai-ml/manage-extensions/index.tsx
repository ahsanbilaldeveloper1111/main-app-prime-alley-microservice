import "@assets/scss/datatable-style.scss";
import React, { ReactElement } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import { Card } from "react-bootstrap";
import { useManageExtensions } from "@hooks/aiml/useManageExtensions";
import { ManageExtensionsEmptyState } from "./components/ManageExtensionsEmptyState";
import { ManageExtensionsFilters } from "./components/ManageExtensionsFilters";
import { ManageExtensionsResultTable } from "./components/ManageExtensionsResultTable";
import { ModifyExtensionsModal } from "./components/ModifyExtensionsModal";

const ManageExtensions = () => {
  const {
    hierarchyLoading,
    selectedImagicles,
    setSelectedImagicles,
    selectedExtensions,
    setSelectedExtensions,
    loading,
    updating,
    data: tableData,
    showModifyModal,
    setShowModifyModal,
    modalSelectedImagicles,
    setModalSelectedImagicles,
    modalSelectedExtensions,
    setModalSelectedExtensions,
    imagiclesList,
    imagicleOptions,
    extensionOptions,
    fetchExtensions,
    openModifyModal,
    handleModalSubmit,
    modalExtensionOptions,
  } = useManageExtensions();

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Manage Extensions" />

      <Card className="shadow-sm">
        <Card.Header className="bg-white">
          <h5 className="mb-0">Imagicle Trigger – Extensions</h5>
        </Card.Header>
        <Card.Body>
          <ManageExtensionsFilters
            hierarchyLoading={hierarchyLoading}
            selectedImagicles={selectedImagicles}
            setSelectedImagicles={setSelectedImagicles}
            selectedExtensions={selectedExtensions}
            setSelectedExtensions={setSelectedExtensions}
            imagiclesList={imagiclesList}
            imagicleOptions={imagicleOptions}
            extensionOptions={extensionOptions}
            loading={loading}
            onFetch={fetchExtensions}
          />

          <h6 className="mb-3">Response data</h6>
          {tableData ? (
            <ManageExtensionsResultTable
              data={tableData}
              extensionOptions={extensionOptions}
              onModify={openModifyModal}
            />
          ) : (
            <ManageExtensionsEmptyState />
          )}
        </Card.Body>
      </Card>

      <ModifyExtensionsModal
        show={showModifyModal}
        onHide={() => setShowModifyModal(false)}
        hierarchyLoading={hierarchyLoading}
        modalSelectedImagicles={modalSelectedImagicles}
        setModalSelectedImagicles={setModalSelectedImagicles}
        modalSelectedExtensions={modalSelectedExtensions}
        setModalSelectedExtensions={setModalSelectedExtensions}
        imagicleOptions={imagicleOptions}
        modalExtensionOptions={modalExtensionOptions}
        updating={updating}
        onSubmit={handleModalSubmit}
      />
    </React.Fragment>
  );
};

ManageExtensions.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default ManageExtensions;
