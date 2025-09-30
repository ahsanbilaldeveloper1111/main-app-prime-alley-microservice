'use client';

import { useEffect } from 'react';
import { signOut } from 'next-auth/react';

export default function SignOut() {
  useEffect(() => {
    // Immediately sign out and redirect to signin page
    signOut({ 
      callbackUrl: '/auth/signin',
      redirect: true
    });
  }, []);

  // Return null since this page will never be visible
  return null;
}
