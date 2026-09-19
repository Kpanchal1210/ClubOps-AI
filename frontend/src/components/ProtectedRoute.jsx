import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Auth guard layout route.
 * Redirects unauthenticated users to /login.
 * In dev mode (VITE_DEV_MODE=true) Login accepts any credentials
 * and sets a mock token, so the redirect still happens but you can
 * log in with anything.
 */
export default function ProtectedRoute() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
