'use client';

import { useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { clearSessionCookiesClient } from '../../utils/cookieUtils';

export default function SignOut() {
  useEffect(() => {
    clearSessionCookiesClient(true);
    signOut({
      callbackUrl: '/auth/signin',
      redirect: true
    });
  }, []);

  // Return null since this page will never be visible
  return null;
}
