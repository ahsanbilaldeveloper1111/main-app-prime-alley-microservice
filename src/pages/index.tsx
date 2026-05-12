import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuthContext } from "@auth/AuthProvider";

/**
 * Root entry — replaces the previous Next.js `getServerSideProps` redirect.
 * The route renders `<Navigate>` once the auth status is known so the SPA
 * lands users either on the dashboard or the sign-in page on first load.
 */
export default function Home() {
  const { status } = useAuthContext();

  useEffect(() => {
    document.title = "Loading...";
  }, []);

  if (status === "loading") {
    return null;
  }

  return (
    <Navigate
      to={status === "authenticated" ? "/dashboard" : "/auth/signin"}
      replace
    />
  );
}
