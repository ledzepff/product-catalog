/* eslint-disable react/prop-types */
import { useState } from "react";

// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Icon from "@mui/material/Icon";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

// Material Dashboard 2 React example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

// Tab content components
import BundlesContent from "layouts/bundles/BundlesContent";
import DedicatedHostsContent from "layouts/dedicatedhosts/DedicatedHostsContent";
import BareMetalsContent from "layouts/baremetals/BareMetalsContent";

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`compute-tabpanel-${index}`}
      aria-labelledby={`compute-tab-${index}`}
      {...other}
    >
      {value === index && <MDBox p={3}>{children}</MDBox>}
    </div>
  );
}

function a11yProps(index) {
  return {
    id: `compute-tab-${index}`,
    "aria-controls": `compute-tabpanel-${index}`,
  };
}

function Compute() {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox pt={6} pb={3}>
        <Grid container spacing={6}>
          <Grid item xs={12}>
            <Card>
              <MDBox
                mx={2}
                mt={-3}
                py={1}
                px={2}
                variant="gradient"
                bgColor="info"
                borderRadius="lg"
                coloredShadow="info"
              >
                <MDTypography variant="h6" color="white">
                  Compute
                </MDTypography>
              </MDBox>
              <MDBox pt={3}>
                <MDBox sx={{ borderBottom: 1, borderColor: "divider" }} px={2}>
                  <Tabs
                    value={tabValue}
                    onChange={handleTabChange}
                    aria-label="compute tabs"
                    textColor="inherit"
                    sx={{
                      "& .MuiTabs-indicator": {
                        backgroundColor: "info.main",
                        height: 3,
                      },
                      "& .MuiTab-root": {
                        textTransform: "none",
                        fontWeight: 500,
                        fontSize: "0.875rem",
                        minHeight: 48,
                        minWidth: "unset",
                        flex: "none",
                        padding: "12px 24px",
                        color: "text.secondary",
                        "&.Mui-selected": {
                          color: "info.main",
                        },
                      },
                    }}
                  >
                    <Tab
                      icon={<Icon sx={{ mr: 1 }}>inventory_2</Icon>}
                      iconPosition="start"
                      label="Bundle"
                      {...a11yProps(0)}
                    />
                    <Tab
                      icon={<Icon sx={{ mr: 1 }}>dns</Icon>}
                      iconPosition="start"
                      label="Dedicated Host"
                      {...a11yProps(1)}
                    />
                    <Tab
                      icon={<Icon sx={{ mr: 1 }}>memory</Icon>}
                      iconPosition="start"
                      label="Bare Metal"
                      {...a11yProps(2)}
                    />
                  </Tabs>
                </MDBox>

                <TabPanel value={tabValue} index={0}>
                  <BundlesContent />
                </TabPanel>

                <TabPanel value={tabValue} index={1}>
                  <DedicatedHostsContent />
                </TabPanel>

                <TabPanel value={tabValue} index={2}>
                  <BareMetalsContent />
                </TabPanel>
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

export default Compute;
