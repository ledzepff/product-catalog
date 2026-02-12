/**
 * ProtectedRoute - Route guard component for authentication and authorization
 *
 * Usage:
 * <ProtectedRoute>
 *   <SomeComponent />
 * </ProtectedRoute>
 *
 * <ProtectedRoute requiredRoles={['platform_admin', 'product_editor']}>
 *   <EditComponent />
 * </ProtectedRoute>
 */

import { Navigate, useLocation } from "react-router-dom";
import PropTypes from "prop-types";
import { useAuth } from "context/AuthContext";

// Loading component
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import CircularProgress from "@mui/material/CircularProgress";

function LoadingScreen() {
  return (
    <MDBox
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
    >
      <CircularProgress color="info" size={48} />
      <MDTypography variant="body2" color="text" mt={2}>
        Loading...
      </MDTypography>
    </MDBox>
  );
}

function ProtectedRoute({
  children,
  requiredRoles = [], // e.g., ['platform_admin', 'product_editor']
  requireAny = true, // true = any role matches, false = all roles required
}) {
  const { user, loading, roles } = useAuth();
  const location = useLocation();

  // Show loading while checking auth state
  if (loading) {
    return <LoadingScreen />;
  }

  // Not authenticated - redirect to sign-in
  if (!user) {
    return <Navigate to="/authentication/sign-in" state={{ from: location }} replace />;
  }

  // Check role requirements if specified
  if (requiredRoles.length > 0) {
    const userRoleNames = roles.map((r) => r.role_name);

    const hasAccess = requireAny
      ? requiredRoles.some((role) => userRoleNames.includes(role))
      : requiredRoles.every((role) => userRoleNames.includes(role));

    if (!hasAccess) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return children;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  requiredRoles: PropTypes.arrayOf(PropTypes.string),
  requireAny: PropTypes.bool,
};

export default ProtectedRoute;
