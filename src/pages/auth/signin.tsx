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
import { FaEye, FaEyeSlash,FaSpinner } from "react-icons/fa";
import '@assets/scss/login.scss';


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

<div id="particles-js"></div>
    <div className="login-main-container">
        <header className="login-info-panel">
            <div className="info-panel-content">
                <i className="fas fa-satellite-dish" style={{fontSize: '3rem', marginBottom: '20px'}}></i>
                <h1 className="text-white">Ring Edge</h1>
                <p>A new frontier in telecommunications and data management. Secure, efficient, and reliable.</p>
            </div>
        </header>
        <main className="login-form-panel">
            <div className="login-form-card">
                <h1 className="login-title">Welcome Back</h1>
                <p className="login-subtitle">Sign in to your account</p>
                
                <form className="login-form" id="loginForm" onSubmit={handleSubmit}>
                    <div className="input-group">
                        <input 
                        type="email" 
                        id="email"
                        placeholder=" " 
                        required 
                         name="email"
                        value={credentials.email}
                        onChange={handleChange}
                         />
                        <label htmlFor="email">Email Address</label>
                        <small 
                          className="form-error" 
                          id="emailError">
                          
                          </small>
                    </div>
                    <div className="input-group">
                        <input 
                         id="password" 
                         placeholder="" 
                         required 
                         name="password"
                        type={showPassword ? "text" : "password"}
                        value={credentials.password}
                        onChange={handleChange} 
                         />

                        <label htmlFor="password">Password</label>
                        <span className="toggle-password" onClick={() => setShowPassword((prev) => !prev)}>
                            <i className="fas fa-eye" id="passwordToggleIcon"></i>
                        </span>
                        <small className="form-error" id="passwordError">Password must be at least 6 characters.</small>
                    </div>
                    {/* <div className="form-options">
                        <label for="remember-me" className="remember-me">
                            <input type="checkbox" id="remember-me" />
                            Remember me
                        </label>
                        <a href="#" className="forgot-password">Forgot password?</a>
                    </div> */}
                    <button 
                          type="submit" 
                          className="btn-primary" 
                          id="loginButton"
                          disabled={loading}
                        >
                          {!loading && (
                            <span className="icon-text">
                              <i className="fas fa-sign-in-alt"></i> 
                              Sign in
                          </span>
                          )}
                        
                          {loading && (
                        <span className="icon-text">
                        <FaSpinner className="fa-spin text-white" />
                       
                    </span>
                          )}
                    </button>
                </form>

                {/* <div className="or-divider">or</div>

                <a href="#" className="btn-social">
                    <i className="fab fa-google"></i> Sign in with Google
                </a> */}
            </div>
        </main>
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