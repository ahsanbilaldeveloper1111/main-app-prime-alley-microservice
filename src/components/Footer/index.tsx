import React from 'react';
import { Row, Col } from 'react-bootstrap';
import Link from 'next/link';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="pc-footer">
      <div className="footer-wrapper container-fluid">
        <div className="row">
          <div className="col-sm-6 my-1">
            <p className="m-0">© {currentYear} All rights reserved. Powered by <a href="https://ringedge.com/" target="_blank" className="text-primary"> Ring Edge</a></p>
          </div>
          <div className="col-sm-6 ms-auto my-1">
            <ul className="list-inline footer-link mb-0 justify-content-sm-end d-flex">
              <li className="list-inline-item"><a href="#" target="_blank">Documentation</a></li>
              <li className="list-inline-item"><a href="#" target="_blank">Support</a></li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};





export default Footer;

