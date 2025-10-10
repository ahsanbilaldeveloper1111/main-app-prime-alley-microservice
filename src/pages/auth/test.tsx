import NonLayout from "@layout/NonLayout";
import React, { ReactElement ,useState, useEffect} from "react";
import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import { toast } from "react-toastify";
import { FaSpinner } from "react-icons/fa";
import '@assets/scss/login.scss';


const Test = () => {

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

    const credentialsEmail = credentials.email.split('@')[0];
    const userEmail = credentialsEmail+process.env.NEXT_PUBLIC_DOMAIN;

    try {
      const result = await signIn('credentials', {
        email: userEmail,
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

  // Cleanup particles on component unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.pJSDom) {
        window.pJSDom.forEach((pJS) => {
          if (pJS.pJS && pJS.pJS.fn && pJS.pJS.fn.vendors && pJS.pJS.fn.vendors.destroy) {
            pJS.pJS.fn.vendors.destroy();
          }
        });
      }
    };
  }, []);


    return (
        <React.Fragment>
         HELLO WORLD

            
        </React.Fragment>
    );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  console.log("CONTEXT RECEIVED", !!context);
  console.log("STARTED FETCHING SESSION");
  const session = await getSession(context);
  console.log("SESSION RECEIVED", !!session);
  // Debug logging
  // console.log('getServerSideProps - context.query:', context.query);
  // console.log('getServerSideProps - callbackUrl:', context.query.callbackUrl);

  if (session) {
    // If there's a callback URL, redirect to it, otherwise go to home
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

Test.getLayout = (page: ReactElement) => {
    return (
        <NonLayout>
            {page}
        </NonLayout>
    )
};
export default Test;