import React, { ReactElement } from 'react';


import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import { Col, Row } from 'react-bootstrap';
import AnimatedNumber from '@components/AnimatedNumber';

const CallRecordingsDashboard = () => {
    
    
  return (
    <>
      <BreadcrumbItem mainTitle="Gsm" mainLink="/call-recordings" subTitle="Call Recordings Dashboard" />

      <Row className="mb-3">
            <Col md={12}>
          <div className="page-header-title ">
            <h2 className="mb-0 d-flex align-items-center">
                  Call Recordings Dashboard
            </h2>
        </div>
      </Col>
      </Row>


      <Row>
               <Col md={3}>
                  <div className="card ">
                        <div className="card-body">
                              <div className="text-center">
                                    <p className="text-muted mb-0">Total Calls</p>
                                    <div className="">
                                    <AnimatedNumber value="50000" />
                                    </div>
                              </div>
                        </div>
                  </div>
               </Col>

               <Col md={3}>
                  <div className="card ">
                        <div className="card-body">
                              <div className="text-center">
                                    <p className="text-muted mb-0">Inbound Calls</p>
                                    <div className="">
                                          <AnimatedNumber value="50000" />
                                    </div>
                              </div>
                        </div>
                  </div>
               </Col>

               <Col md={3}>
                  <div className="card ">
                        <div className="card-body">
                              <div className="text-center">
                                    <p className="text-muted mb-0">Outbound Calls</p>
                                    <div className="">
                                          <AnimatedNumber value="50000" />
                                    </div>
                              </div>
                        </div>
                  </div>
               </Col>


               <Col md={3}>
                  <div className="card ">
                        <div className="card-body">
                              <div className="text-center">
                                    <p className="text-muted mb-0">Missed Incoming Calls</p>
                                    <div className="">
                                          <AnimatedNumber value="50000" />
                                    </div>
                              </div>
                        </div>
                  </div>
               </Col>
               <Col md={3}>
                  <div className="card ">
                        <div className="card-body">
                              <div className="text-center">
                                    <p className="text-muted mb-0">Missed Outgoing Calls</p>
                                    <div className="">
                                          <AnimatedNumber value="50000" />
                                    </div>
                              </div>
                        </div>
                  </div>
               </Col>

               <Col md={3}>
                  <div className="card ">
                        <div className="card-body">
                              <div className="text-center">
                                    <p className="text-muted mb-0">Total Success Rate</p>
                                    <div className="">
                                          <AnimatedNumber value="50000" />
                                    </div>
                              </div>
                        </div>
                  </div>
               </Col>


            </Row>


    </>
  );
};

CallRecordingsDashboard.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CallRecordingsDashboard;