import { useEffect, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import tokenService from "../utils/tokenService";
import { useAuthContext } from "../auth/AuthProvider";

interface SessionHandlerProps {
  children: ReactNode;
}

function isSessionOptionalPath(pathname: string): boolean {
  return pathname.startsWith("/auth/") || pathname.startsWith("/public/payment");
}

const SessionHandler: React.FC<SessionHandlerProps> = ({ children }) => {
  const { status } = useAuthContext();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (status === "loading") return;
    if (isSessionOptionalPath(location.pathname)) return;
    if (status === "unauthenticated") {
      tokenService.clearTokens();
      navigate("/auth/signin", { replace: true });
    }
  }, [status, location.pathname, navigate]);

  if (status === "loading") {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "100vh" }}
      >
        <output
          aria-live="polite"
          className="m-0 border-0 p-0 bg-transparent d-inline-flex align-items-center justify-content-center"
        >
          <span className="spinner-border text-primary" aria-hidden="true" />
          <span className="visually-hidden">Loading...</span>
        </output>
      </div>
    );
  }

  if (status === "unauthenticated" && !isSessionOptionalPath(location.pathname)) {
    return null;
  }

  return <>{children}</>;
};

export default SessionHandler;
