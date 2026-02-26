import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermissions?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredPermissions = [] 
}) => {
  const { session, status, isAuthenticated, isInitialized } = useAuth();
  const router = useRouter();

  // useEffect(() => {
  //   if (isInitialized && status === 'unauthenticated') {
  //     // Store the current URL to redirect back after login
  //     const currentUrl = router.asPath;
  //     router.push(`/auth/signin?callbackUrl=${encodeURIComponent(currentUrl)}`);
  //   }
  // }, [isInitialized, status, router]);

  useEffect(() => {
    if (isInitialized && status === 'authenticated' && requiredPermissions.length > 0) {
      const userPermissions = session?.user?.permissions || [];
      const hasRequiredPermissions = requiredPermissions.every(permission => 
        userPermissions.includes(permission)
      );

      // if (!hasRequiredPermissions) {
      //   router.push('/dashboard');
      // }
    }
  }, [isInitialized, status, session, requiredPermissions, router]);

  // Show loading state while checking authentication
  if (!isInitialized || status === 'loading') {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Show nothing if not authenticated (will redirect)
  if (status === 'unauthenticated') {
    return null;
  }

  // Show children if authenticated and has required permissions
  return <>{children}</>;
};

export default ProtectedRoute; 