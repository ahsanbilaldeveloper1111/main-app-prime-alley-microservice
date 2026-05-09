import React, { ReactElement } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import { Card, Row, Col, Button } from 'react-bootstrap';
import Link from 'next/link';
import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import PageHeader from "@components/PageHeader";
import FormModal from "@components/page-partials/FormModal";
import ConfirmModal from "@components/page-partials/ConfirmModal";
import SuccessfulModal from "@components/page-partials/SuccessfulModal";
import PageSummaryGrid, { SummaryCard } from '@components/PageSummaryGrid';
import DatatableActionButton from "@components/DatatableActionButton";
import { FiEdit, FiTrash2, FiEye,FiPlus } from "react-icons/fi";
import "@assets/scss/plan-upgrade.scss";


const PlanUpgrade = () => {
    return (
        <React.Fragment>
            <BreadcrumbItem mainTitle="Plan Upgrade" mainLink="/plan-upgrade" subTitle="Plan Upgrade" />
            
            
            
            <Row>
                <Col md={12}>
                <div className="plan-upgrade-container">
        <h1>Upgrade Your Plan</h1>
        <p className="subtitle">Choose the perfect plan to unlock powerful features and boost your productivity.</p>

        <div id="highlight-message" className="highlight-message" style={{display: 'none'}}>
            You're almost there! Unlock <span></span> by upgrading to our recommended plan.
        </div>

        <div className="pricing-table">
            <div className="pricing-header">
                <div className="pricing-cell"></div> <div className="pricing-cell">Your Current Plan <br /><small>Free</small></div>
                <div className="pricing-cell recommended" id="pro-plan-header">Pro Plan <br /><small>$49/Month</small></div>
                <div className="pricing-cell">Enterprise <br /><small>Custom</small></div>
            </div>

            <div className="pricing-row">
                <div className="pricing-cell">Online Agents</div>
                <div className="pricing-cell">Up to 10</div>
                <div className="pricing-cell recommended">Up to 50</div>
                <div className="pricing-cell">Unlimited</div>
            </div>
            <div className="pricing-row">
                <div className="pricing-cell">Calls Handled</div>
                <div className="pricing-cell">Basic Limit</div>
                <div className="pricing-cell recommended">High Limit</div>
                <div className="pricing-cell">Unlimited</div>
            </div>
            <div className="pricing-row">
                <div className="pricing-cell">System Control</div>
                <div className="pricing-cell"><i className="fas fa-check"></i></div>
                <div className="pricing-cell recommended"><i className="fas fa-check"></i></div>
                <div className="pricing-cell"><i className="fas fa-check"></i></div>
            </div>
            <div className="pricing-row">
                <div className="pricing-cell">Call Logs</div>
                <div className="pricing-cell"><i className="fas fa-check"></i></div>
                <div className="pricing-cell recommended"><i className="fas fa-check"></i></div>
                <div className="pricing-cell"><i className="fas fa-check"></i></div>
            </div>
            <div className="pricing-row">
                <div className="pricing-cell">Call Recordings</div>
                <div className="pricing-cell"><i className="fas fa-check"></i></div>
                <div className="pricing-cell recommended"><i className="fas fa-check"></i></div>
                <div className="pricing-cell"><i className="fas fa-check"></i></div>
            </div>
            <div className="pricing-row">
                <div className="pricing-cell">**Billing**</div>
                <div className="pricing-cell"><i className="fas fa-times"></i></div>
                <div className="pricing-cell recommended"><i className="fas fa-check"></i></div>
                <div className="pricing-cell"><i className="fas fa-check"></i></div>
            </div>
            <div className="pricing-row">
                <div className="pricing-cell">**Advanced Analytics**</div>
                <div className="pricing-cell"><i className="fas fa-times"></i></div>
                <div className="pricing-cell recommended"><i className="fas fa-check"></i></div>
                <div className="pricing-cell"><i className="fas fa-check"></i></div>
            </div>
            <div className="pricing-row">
                <div className="pricing-cell">**AI Transcription**</div>
                <div className="pricing-cell"><i className="fas fa-times"></i></div>
                <div className="pricing-cell recommended"><i className="fas fa-times"></i></div>
                <div className="pricing-cell"><i className="fas fa-check"></i></div>
            </div>
            <div className="pricing-row">
                <div className="pricing-cell">Support</div>
                <div className="pricing-cell">Email Only</div>
                <div className="pricing-cell recommended">24/7 Priority</div>
                <div className="pricing-cell">Dedicated Manager</div>
            </div>

            <div className="pricing-row">
                <div className="pricing-cell"></div>
                <div className="pricing-cell">Current Plan</div>
                <div className="pricing-cell recommended"><button className="btn app-button btn-primary text-center" data-plan="Pro">Upgrade to Pro</button></div>
                <div className="pricing-cell"><button className="btn app-button btn-info text-center" data-plan="Enterprise">Contact Sales</button></div>
            </div>
        </div>

        <div className="payment-section" id="payment-section">
            <h3>Complete Your Upgrade to Pro Plan</h3>
            <form id="payment-form">
                <div className="form-group">
                    <label htmlFor="fullName">Full Name</label>
                    <input type="text" id="fullName" className="form-control" placeholder="John Doe" required />
                </div>
                <div className="form-group">
                    <label htmlFor="email">Email Address</label>
                    <input type="email" id="email" className="form-control" placeholder="john.doe@example.com" required />
                </div>
                <div className="form-group">
                    <label htmlFor="cardNumber">Credit Card Number</label>
                    <input type="text" id="cardNumber" className="form-control" placeholder="**** **** **** 1234" required pattern="[0-9]{13,19}" />
                </div>
                <div className="card-details-grid">
                    <div className="form-group">
                        <label htmlFor="expiryDate">Expiry Date</label>
                        <input type="text" id="expiryDate" className="form-control" placeholder="MM/YY" required pattern="(0[1-9]|1[0-2])\/?([0-9]{2})" />
                    </div>
                    <div className="form-group">
                        <label htmlFor="cvc">CVC</label>
                        <input type="text" id="cvc" className="form-control" placeholder="123" required pattern="[0-9]{3,4}" />
                    </div>
                </div>
                
                <div className="form-checkbox">
                    <input type="checkbox" id="terms" required />
                    <label htmlFor="terms">I agree to the <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.</label>
                </div>

               <div>
               <button type="submit" className="btn app-button btn-success w-100 text-center d-block btn-confirm-upgrade">Confirm Upgrade - $49/Month</button>
               </div>
            </form>

            <p className="security-info"><i className="fas fa-lock"></i> All transactions are secure and encrypted. Powered by Stripe</p>
        </div>

    </div>
                </Col>
            </Row>


            
        </React.Fragment>
    );
};

PlanUpgrade.getLayout = (page: ReactElement) => {
    return <Layout>{page}</Layout>;
};

export default PlanUpgrade;
