import React, { ReactElement, useState } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import { Card, Row, Col, Button } from 'react-bootstrap';
import Link from 'next/link';

import AnimatedNumber from '@components/AnimatedNumber';
import imgStatus1 from '@assets/images/widget/img-status-1.svg'
import imgStatus2 from '@assets/images/widget/img-status-2.svg'
import imgStatus3 from '@assets/images/widget/img-status-3.svg'
import imgStatus4 from '@assets/images/widget/img-status-4.svg'

interface Summary {
      users: number;
      company: number;
      nonAdminUsers: number;
  }


const TmsDashboard = () => {

      const [summary, setSummary] = useState<Summary>({
        users: 5000,
        company: 200,
        nonAdminUsers: 4800,
      });

    return (
        <React.Fragment>
            <BreadcrumbItem mainTitle="TMS" mainLink="/tms" subTitle="TMS Dashboard" />
            
            <Row className="mb-4">
                <Col md={12}>
                    <h2 className="mb-3">TMS Dashboard</h2>
                </Col>
            </Row>


            <Row>

            <Col md={4}>
                  <div className="card statistics-card-1">
                        <div className="card-body">
                              <img src={imgStatus1.src} alt="img" className="img-fluid img-bg" />
                              <div className="d-flex align-items-center">
                                    <div className="avtar bg-brand-color-1 text-white me-3">
                                          <i className="ph-duotone ph-users f-26"></i>
                                    </div>
                                    <div>
                                          <p className="text-muted mb-0">Total Users</p>
                                          <div className="d-flex align-items-end">
                                            {summary?.users > 0 ? (
                                                <AnimatedNumber value={summary?.users} duration={1000} />
                                            ) : (
                                                <h2 className="mb-0 f-w-500">0</h2>
                                            )}
                                          </div>
                                    </div>  
                              </div>
                        </div>
                  </div>
               </Col>



               <Col md={4}>
                  <div className="card statistics-card-1">
                        <div className="card-body">
                              <img src={imgStatus1.src} alt="img" className="img-fluid img-bg" />
                              <div className="d-flex align-items-center">
                                    <div className="avtar bg-brand-color-1 text-white me-3">
                                          <i className="ph-duotone ph-users f-26"></i>
                                    </div>
                                    <div>
                                          <p className="text-muted mb-0">Total Companies</p>
                                          <div className="d-flex align-items-end">
                                            {summary?.company > 0 ? (
                                                <AnimatedNumber value={summary?.company} duration={1000} />
                                            ) : (
                                                <h2 className="mb-0 f-w-500">0</h2>
                                            )}
                                          </div>
                                    </div>  
                              </div>
                        </div>
                  </div>
               </Col>

               <Col md={4}>
                  <div className="card statistics-card-1">
                        <div className="card-body">
                              <img src={imgStatus1.src} alt="img" className="img-fluid img-bg" />
                              <div className="d-flex align-items-center">
                                    <div className="avtar bg-brand-color-1 text-white me-3">
                                          <i className="ph-duotone ph-users f-26"></i>
                                    </div>
                                    <div>
                                          <p className="text-muted mb-0">Non Admin Users</p>
                                          <div className="d-flex align-items-end">
                                            {summary?.nonAdminUsers > 0 ? (
                                                <AnimatedNumber value={summary?.nonAdminUsers} duration={1000} />
                                            ) : (
                                                <h2 className="mb-0 f-w-500">0</h2>
                                            )}
                                          </div>
                                    </div>  
                              </div>
                        </div>
                  </div>
               </Col>


            </Row>
           

           
        </React.Fragment>
    );
};

TmsDashboard.getLayout = (page: ReactElement) => {
    return <Layout>{page}</Layout>;
};

export default TmsDashboard;   
