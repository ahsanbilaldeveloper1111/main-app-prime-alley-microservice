import Head from "next/head";
import Link from "next/link";
import React from "react";
import { Row, Col } from "react-bootstrap";
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

interface BreadcrumbItemProps {
  mainTitle: string;
  mainLink: string;
  subTitle: string;
}

const BreadcrumbItem: React.FC<BreadcrumbItemProps> = ({ mainTitle,mainLink, subTitle }) => {
  return (
    <React.Fragment>
    <Head>
      <title>{subTitle} | Ring Edge</title>
    </Head>
    {/* <div className="page-header">
      <div className="page-block">
        <Row className="row align-items-center">
          <Col md={12}>
            <ul className="breadcrumb">
              
              <li className="breadcrumb-item">
                <Link href="/dashboard">Home</Link>
              </li>

            {mainTitle && (
                  <li className="breadcrumb-item">
                       <Link href={`${baseUrl}${mainLink}`}>{mainTitle}</Link>
                  </li>
            )}
              <li className="breadcrumb-item" aria-current="page">
                {subTitle}
              </li>
            </ul>
          </Col>
        </Row>
      </div>
    </div> */}
    </React.Fragment>
  );
};

export default BreadcrumbItem;
