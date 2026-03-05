import Head from "next/head";
import Link from "next/link";
import React from "react";
import { Row, Col } from "react-bootstrap";
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
import PageLoader from '@components/PageLoader';

interface BreadcrumbItemProps {
  mainTitle: string;
  mainLink: string;
  subTitle: string;
  subLink?: string;
  currentTitle?: string;
  showPageLoader?: boolean;
}

const BreadcrumbItem: React.FC<BreadcrumbItemProps> = ({ mainTitle,mainLink, subTitle, subLink, currentTitle, showPageLoader=false }) => {
  const displayTitle = currentTitle || subTitle;
  return (
    <React.Fragment>
    <Head>
      <title>{displayTitle} | Business Workspace AI-Powered</title>
    </Head>
    <PageLoader isLoading={showPageLoader} />
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
            {subTitle && (
              <li className="breadcrumb-item">
                {subLink ? (
                  <Link href={`${baseUrl}${subLink}`}>{subTitle}</Link>
                ) : (
                  subTitle
                )}
              </li>
            )}
            {currentTitle && (
              <li className="breadcrumb-item" aria-current="page">
                {currentTitle}
              </li>
            )}
            </ul>
          </Col>
        </Row>
      </div>
    </div> */}
    </React.Fragment>
  );
};

export default BreadcrumbItem;
