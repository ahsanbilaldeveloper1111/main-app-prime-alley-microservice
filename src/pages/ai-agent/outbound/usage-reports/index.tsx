import "@assets/scss/datatable-style.scss";
import React, {
  ReactElement,
} from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import PageHeader from "@components/PageHeader";
import { BarChart3 } from "lucide-react";



const UsageReports = () => {


  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Usage Reports" />

      <PageHeader
        title="Usage Reports"
        showSearch={false}
      />

      <div
        className="d-flex flex-column align-items-center justify-content-center py-5 px-3 text-center"
        style={{
          minHeight: '320px',
          backgroundColor: 'var(--bs-body-bg, #fff)',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        }}
      >
        <BarChart3
          size={56}
          className="text-muted mb-3"
          style={{ opacity: 0.6 }}
          aria-hidden
        />
        <p className="text-dark fs-5 fw-semibold mb-1">Coming soon</p>
        <p className="text-muted small mb-0">
          Usage reports will be available here to view and export chat usage data.
        </p>
      </div>
    </React.Fragment>
  );
};

UsageReports.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default UsageReports;
