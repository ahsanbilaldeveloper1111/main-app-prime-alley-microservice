import NonLayout from "@layout/NonLayout";
import Image from "next/image";
import React, { ReactElement } from "react";


// img
import authlogin from "@assets/images/authentication/img-auth-login.png";

import Link from "next/link";
import { Card, Row } from "react-bootstrap";

const Loginv1 = () => {
    return (
        <React.Fragment>
            <div className="auth-main v1">
                <div className="auth-wrapper">
                    <div className="auth-form">
                        <Card className="my-5">
                            <Card.Body>
                                <div className="text-center">
                                    <Image src={authlogin} alt="images" className="img-fluid mb-3" />
                                    <h4 className="f-w-500 mb-3">Login with your email -</h4>
                                    {/* <p className="mb-3">Don&apos;t have an Account? <a href="/pages/register-v1" className="link-primary ms-1">Create Account</a></p> */}
                                </div>
                                <div className="form-group mb-3">
                                    <input type="email" className="form-control" id="floatingInput" placeholder="Email Address" />
                                </div>
                                <div className="form-group mb-3">
                                    <input type="password" className="form-control" id="floatingInput1" placeholder="Password" />
                                </div>
                                {/* <div className="d-flex mt-1 justify-content-between align-items-center">
                                    <div className="form-check">
                                        <input className="form-check-input input-primary" type="checkbox" id="customCheckc1" defaultChecked />
                                        <label className="form-check-label text-muted" htmlFor="customCheckc1">Remember me?</label>
                                    </div>
                                    <Link href="../pages/forgot-password-v1"><h6 className="f-w-400 mb-0">Forgot Password?</h6></Link>
                                </div> */}
                                <div className="d-grid mt-4">
                                    <Link href="dashboard" type="button" className="btn btn-primary">Login</Link>
                                </div>
                                {/* <div className="saprator my-3">
                                    <span>Or continue with</span>
                                </div>
                                <div className="text-center">
                                    <ul className="list-inline mx-auto mt-3 mb-0">
                                        <li className="list-inline-item">
                                            <Link href="https://www.facebook.com/" className="avtar avtar-s rounded-circle bg-facebook" target="_blank">
                                                <i className="fab fa-facebook-f text-white"></i>
                                            </Link>
                                        </li>
                                        <li className="list-inline-item">
                                            <Link href="https://twitter.com/" className="avtar avtar-s rounded-circle bg-twitter" target="_blank">
                                                <i className="fab fa-twitter text-white"></i>
                                            </Link>
                                        </li>
                                        <li className="list-inline-item">
                                            <Link href="https://myaccount.google.com/" className="avtar avtar-s rounded-circle bg-googleplus" target="_blank">
                                                <i className="fab fa-google text-white"></i>
                                            </Link>
                                        </li>
                                    </ul>
                                </div> */}
                            </Card.Body>
                        </Card>
                    </div>

                    <div className="auth-sidefooter">
                        <hr className="mb-3 mt-4" />
                        <Row>
                            <div className="col my-1">
                                <p className="m-0">Developed by Team <a href="https://primealley.com/" target="_blank"> Prime Alley</a></p>
                            </div>
                            <div className="col-auto my-1">
                                <ul className="list-inline footer-link mb-0">
                                    {/* <li className="list-inline-item"><Link href="/">Home</Link></li>
                                    <li className="list-inline-item"><Link href="#" target="_blank">Documentation</Link></li> */}
                                    <li className="list-inline-item"><Link href="#" target="_blank">Support</Link></li>
                                </ul>
                            </div>
                        </Row>
                    </div>
                </div>
            </div>
        </React.Fragment>
    );
}


Loginv1.getLayout = (page: ReactElement) => {
    return (
        <NonLayout>
            {page}
        </NonLayout>
    )
};
export default Loginv1;