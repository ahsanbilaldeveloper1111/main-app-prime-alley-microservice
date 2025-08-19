'use client';

import { signOut } from 'next-auth/react';
import { Button } from 'react-bootstrap';

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
    signOut();
    // Simple redirect to login page
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/signin';
    }
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