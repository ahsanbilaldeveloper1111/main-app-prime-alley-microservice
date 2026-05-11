import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';

export default function Home() {
  // This component won't render anything as we're redirecting
  return null;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);

  if (session) {
    // User is authenticated, redirect to dashboard
    return {
      redirect: {
        destination: '/dashboard',
        permanent: false,
      },
    };
  } else {
    // User is not authenticated, redirect to signin
    return {
      redirect: {
        destination: '/auth/signin',
        permanent: false,
      },
    };
  }
};
