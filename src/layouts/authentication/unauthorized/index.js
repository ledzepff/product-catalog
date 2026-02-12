/**
 * Unauthorized Page - Access Denied
 *
 * Shown when user doesn't have the required role to access a page
 */

import { useNavigate } from "react-router-dom";

// @mui material components
import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";

// Authentication layout components
import BasicLayout from "layouts/authentication/components/BasicLayout";

// Auth context
import { useAuth } from "context/AuthContext";

function Unauthorized() {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoToDashboard = () => {
    navigate("/dashboard");
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/authentication/sign-in");
  };

  return (
    <BasicLayout>
      <Card>
        <MDBox
          variant="gradient"
          bgColor="error"
          borderRadius="lg"
          coloredShadow="error"
          mx={2}
          mt={-3}
          p={2}
          mb={1}
          textAlign="center"
        >
          <Icon fontSize="large" sx={{ color: "white" }}>
            lock
          </Icon>
          <MDTypography variant="h4" fontWeight="medium" color="white" mt={1}>
            Access Denied
          </MDTypography>
        </MDBox>
        <MDBox pt={4} pb={3} px={3} textAlign="center">
          <MDTypography variant="body2" color="text" mb={3}>
            You don&apos;t have permission to access this page.
          </MDTypography>
          {user && (
            <MDTypography variant="caption" color="text" mb={3} display="block">
              Signed in as: {user.email}
            </MDTypography>
          )}
          <MDBox display="flex" flexDirection="column" gap={2}>
            <MDButton variant="gradient" color="info" onClick={handleGoToDashboard}>
              Go to Dashboard
            </MDButton>
            <MDButton variant="outlined" color="info" onClick={handleGoBack}>
              Go Back
            </MDButton>
            <MDButton variant="text" color="text" onClick={handleSignOut}>
              Sign Out
            </MDButton>
          </MDBox>
        </MDBox>
      </Card>
    </BasicLayout>
  );
}

export default Unauthorized;
