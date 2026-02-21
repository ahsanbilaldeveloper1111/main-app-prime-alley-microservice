'use client';

import { useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { clearSessionCookiesClient } from '../../utils/cookieUtils';
import { getLogoutCallbackUrl } from '../../utils/logoutRedirect';

export default function SignOut() {
  useEffect(() => {
    clearSessionCookiesClient(true);
    signOut({
      callbackUrl: getLogoutCallbackUrl(),
      redirect: true
    });
  }, []);

  // Return null since this page will never be visible
  return null;
}
