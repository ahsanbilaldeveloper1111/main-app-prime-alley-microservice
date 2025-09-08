import NonLayout from "@layout/NonLayout";
import Image from "next/image";
import React, { ReactElement ,useState} from "react";
import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';

import authlogin from "@assets/images/authentication/img-auth-login.png";
import logodark from "@assets/images/logo-dark.svg";

import Link from "next/link";
import { Card, Row } from "react-bootstrap";
import dashboard from "@pages/dashboard";
import { toast } from "react-toastify";
import { FaEye, FaEyeSlash } from "react-icons/fa";


const Signin = () => {

  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { callbackUrl } = router.query;
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email: credentials.email,
        password: credentials.password,
        redirect: false,
        callbackUrl: callbackUrl ? decodeURIComponent(callbackUrl as string) : '/dashboard',
      }
    );

      if (result?.error) {
        if (result.error === 'CredentialsSignin') {
          toast.error('Invalid username or password');
        } else if (result.error.includes('network') || result.error.includes('fetch')) {
          toast.error('Unable to connect to authentication server. Please try again.');
        } else {
          toast.error('Authentication failed. Please check your credentials and try again.');
        }
      } else {
        toast.success('Login successful');
        // Use NextAuth's built-in redirect mechanism for better reliability
        const redirectUrl = callbackUrl ? decodeURIComponent(callbackUrl as string) : '/dashboard';
        
        // Small delay to ensure session is established, then redirect
        setTimeout(() => {
          window.location.href = redirectUrl;
        }, 100);
      }
    } catch (error) {
      console.error('Sign in error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value,
    });
  };


    return (
        <React.Fragment>
            <div className="auth-main v1">
                <div className="auth-wrapper">
                    <div className="auth-form">
                        <Card className="my-5">
                            <Card.Body>
                                <form onSubmit={handleSubmit}>
                                <div className="text-center">
                                    <Image src={authlogin} alt="images" className="img-fluid mb-3" />
                                    <h4 className="f-w-500 mb-3">Login with your email</h4>
                                </div>
                                <div className="form-group mb-3">
                                    <input 
                                      type="email" 
                                      name="email"
                                      className="form-control"
                                      id="userEmail" 
                                      placeholder="Email Address"
                                      value={credentials.email}
                                      onChange={handleChange} />
                                </div>
                                <div className="form-group mb-3" style={{ position: "relative" }}>
                                    <input 
                                      type={showPassword ? "text" : "password"}
                                      name="password"
                                      className="form-control"
                                      id="userPassword" 
                                      placeholder="Password"
                                      value={credentials.password}
                                      onChange={handleChange} 
                                      style={{ paddingRight: "40px" }}
                                      />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((prev) => !prev)}
                                        style={{
                                            position: "absolute",
                                            right: "10px",
                                            top: "50%",
                                            transform: "translateY(-50%)",
                                            background: "none",
                                            border: "none",
                                            padding: 0,
                                            cursor: "pointer"
                                        }}
                                        tabIndex={-1}
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                                    </button>
                                </div>
                               
                                <div className="d-grid mt-4">
                                    <button type="submit"
                                        disabled={loading} 
                                        className="btn btn-primary"
                                    >
                                      {loading ? 'Signing in...' : 'Sign in'}
                                    </button>
                                </div>
                                </form>
                            </Card.Body>
                        </Card>
                    </div>

                    
                </div>
            </div>
        </React.Fragment>
    );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);

  // Debug logging
  // console.log('getServerSideProps - context.query:', context.query);
  // console.log('getServerSideProps - callbackUrl:', context.query.callbackUrl);

  if (session) {
    // If there's a callback URL, redirect to it, otherwise go to dashboard
    const callbackUrl = context.query.callbackUrl as string;
    const redirectUrl = callbackUrl ? decodeURIComponent(callbackUrl) : '/dashboard';
    
    // Prevent redirect loops by checking if we're already on the target page
    if (context.req.url === redirectUrl) {
      return {
        props: {},
      };
    }
    
   // console.log('getServerSideProps - decoded redirectUrl:', redirectUrl);
    
    return {
      redirect: {
        destination: redirectUrl,
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
};

Signin.getLayout = (page: ReactElement) => {
    return (
        <NonLayout>
            {page}
        </NonLayout>
    )
};
export default Signin;