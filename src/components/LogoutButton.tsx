'use client';

import { Button } from 'react-bootstrap';
import { useAuth } from '../hooks/useAuth';

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
  const { logout } = useAuth();

  return (
    <Button 
      variant={variant} 
      size={size} 
      onClick={logout}
      className={className}
    >
      Sign Out
    </Button>
  );
} 