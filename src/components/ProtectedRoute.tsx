import { useEffect, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredPermissions?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermissions = [],
}) => {
  const { session, status, isInitialized } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isInitialized) return;
    if (status === "unauthenticated") {
      const callbackUrl = `${location.pathname}${location.search}${location.hash}`;
      navigate(`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`, {
        replace: true,
      });
      return;
    }
    if (status === "authenticated" && requiredPermissions.length > 0) {
      const userPermissions = session?.user?.permissions ?? [];
      const ok = requiredPermissions.every((p) => userPermissions.includes(p));
      if (!ok) navigate("/access-denied", { replace: true });
    }
  }, [
    isInitialized,
    status,
    session,
    requiredPermissions,
    navigate,
    location.pathname,
    location.search,
    location.hash,
  ]);

  if (!isInitialized || status === "loading") {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "100vh" }}
      >
        <output className="spinner-border">
          <span className="visually-hidden">Loading...</span>
        </output>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
