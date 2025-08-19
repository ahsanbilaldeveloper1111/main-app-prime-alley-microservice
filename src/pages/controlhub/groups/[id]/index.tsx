import React from 'react';
import { useRouter } from 'next/router';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';

const GroupDetail = () => {
  const router = useRouter();
  const { id } = router.query;

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="Controlhub" mainLink="/controlhub/groups" subTitle="Groups" />
      <div className="page-header-title">
        <h2 className="mb-0">Group Details</h2>
        <p>Group ID: {id}</p>
      </div>
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <p>Group detail page - Implementation pending</p>
            </div>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};

GroupDetail.getLayout = (page: React.ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default GroupDetail;
