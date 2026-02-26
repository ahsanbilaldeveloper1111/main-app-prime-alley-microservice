'use client';

import { signOut } from 'next-auth/react';
import { Button } from 'react-bootstrap';
import { clearSessionCookiesClient } from '../utils/cookieUtils';
import { getLogoutCallbackUrl } from '../utils/logoutRedirect';

interface LogoutButtonProps {
  variant?: string;
  size?: 'sm' | 'lg';
  className?: string;
}

export default function LogoutButton({ 
  variant = 'outline-danger', 
  size = 'sm',
  className = ''
}: LogoutButtonProps) {
  const handleLogout = () => {
    clearSessionCookiesClient(true);
    signOut({
      callbackUrl: getLogoutCallbackUrl(),
      redirect: true
    });
  };

  return (
    <Button 
      variant={variant} 
      size={size} 
      onClick={handleLogout}
      className={className}
    >
      Sign Out
    </Button>
  );
} 