import { Navigate } from "react-router-dom";

/** `/workforce` is not a separate screen; the dashboard lives at `/workforce/dashboard`. */
export default function WorkforceIndex() {
  return <Navigate to="/workforce/dashboard" replace />;
}
