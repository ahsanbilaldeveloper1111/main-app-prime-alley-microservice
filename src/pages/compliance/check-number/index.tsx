import "@assets/scss/datatable-style.scss";
import React, { ReactElement } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { Button, Col, Row } from "react-bootstrap";

import "@assets/scss/common.scss";

import { CheckNumberBulkUploadModal } from "@components/compliance/check-number/CheckNumberBulkUploadModal";
import { CheckNumberMainCard } from "@components/compliance/check-number/CheckNumberMainCard";
import { useCheckNumberPage } from "@components/compliance/check-number/useCheckNumberPage";

import "@components/compliance/check-number/checkNumberPage.scss";

const CheckNumberPage = () => {
  const vm = useCheckNumberPage();

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="DNCR" mainLink="/dncr" subTitle="Check Number" />
      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title d-flex justify-content-between align-items-center">
            <h2 className="mb-0">Check Number on DNCR</h2>

            {vm.canBulkUpload && (
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => vm.setShowBulkUploadModal(true)}
              >
                Bulk Upload
              </Button>
            )}
          </div>
        </Col>
      </Row>

      <CheckNumberMainCard vm={vm} />

      <CheckNumberBulkUploadModal vm={vm} />
    </React.Fragment>
  );
};

CheckNumberPage.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CheckNumberPage;
