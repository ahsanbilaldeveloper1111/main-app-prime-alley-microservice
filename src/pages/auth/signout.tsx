'use client';

import { useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';

export default function SignOut() {
  const { logout } = useAuth();

  useEffect(() => {
    logout();
  }, [logout]);

  // Return null since this page will never be visible
  return null;
}
