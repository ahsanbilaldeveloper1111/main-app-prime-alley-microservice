import React from 'react';
import { useRouter } from 'next/router';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';

const RankDetail = () => {
  const router = useRouter();
  const { id } = router.query;

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="Controlhub" mainLink="/controlhub/ranks" subTitle="Ranks" />
      <div className="page-header-title">
        <h2 className="mb-0">Rank Details</h2>
        <p>Rank ID: {id}</p>
      </div>
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <p>Rank detail page - Implementation pending</p>
            </div>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};

RankDetail.getLayout = (page: React.ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default RankDetail;
