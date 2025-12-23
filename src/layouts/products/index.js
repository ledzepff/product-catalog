/* eslint-disable react/prop-types */
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CircularProgress from "@mui/material/CircularProgress";
import Icon from "@mui/material/Icon";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";

// Material Dashboard 2 React example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

// Supabase client
import { supabase } from "supabaseClient";

function Products() {
  const navigate = useNavigate();

  // State
  const [templates, setTemplates] = useState([]);
  const [productCounts, setProductCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch templates and product counts
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch active templates
      const { data: templatesData, error: templatesError } = await supabase
        .from("product_templates")
        .select("id, name, description")
        .eq("is_active", true)
        .order("name");

      if (templatesError) throw templatesError;

      // Fetch product counts per template
      const { data: productAttrs, error: countError } = await supabase
        .from("product_attributes")
        .select("product_template_id, product:products!inner(id, is_active)")
        .eq("is_active", true);

      if (countError) throw countError;

      // Count unique active products per template
      const counts = {};
      const seenProducts = new Set();

      (productAttrs || []).forEach((pa) => {
        if (pa.product?.is_active && !seenProducts.has(`${pa.product_template_id}-${pa.product.id}`)) {
          seenProducts.add(`${pa.product_template_id}-${pa.product.id}`);
          counts[pa.product_template_id] = (counts[pa.product_template_id] || 0) + 1;
        }
      });

      setTemplates(templatesData || []);
      setProductCounts(counts);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Navigate to template products page
  const handleViewTemplate = (templateId) => {
    navigate(`/products/template/${templateId}`);
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox pt={6} pb={3}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <MDBox
                mx={2}
                mt={-3}
                py={2}
                px={2}
                variant="gradient"
                bgColor="info"
                borderRadius="lg"
                coloredShadow="info"
              >
                <MDTypography variant="h6" color="white">
                  Products Overview
                </MDTypography>
              </MDBox>
              <MDBox pt={3} px={2} pb={2}>
                {loading ? (
                  <MDBox display="flex" justifyContent="center" py={5}>
                    <CircularProgress color="info" />
                  </MDBox>
                ) : error ? (
                  <MDBox display="flex" justifyContent="center" py={5}>
                    <MDTypography variant="body2" color="error">
                      Error: {error}
                    </MDTypography>
                  </MDBox>
                ) : templates.length === 0 ? (
                  <MDBox display="flex" flexDirection="column" alignItems="center" py={5}>
                    <MDTypography variant="body2" color="text" mb={2}>
                      No product templates found. Create a template first to start adding products.
                    </MDTypography>
                  </MDBox>
                ) : (
                  <MDBox>
                    <MDTypography variant="body2" color="text" mb={3}>
                      Select a product type below to view and manage products of that type.
                    </MDTypography>
                    <Grid container spacing={3}>
                      {templates.map((template) => (
                        <Grid item xs={12} md={6} lg={4} key={template.id}>
                          <Card
                            sx={{
                              cursor: "pointer",
                              transition: "transform 0.2s, box-shadow 0.2s",
                              "&:hover": {
                                transform: "translateY(-4px)",
                                boxShadow: 6,
                              },
                            }}
                            onClick={() => handleViewTemplate(template.id)}
                          >
                            <MDBox p={3}>
                              <MDBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                <MDBox
                                  display="flex"
                                  justifyContent="center"
                                  alignItems="center"
                                  width="3rem"
                                  height="3rem"
                                  borderRadius="lg"
                                  variant="gradient"
                                  bgColor="info"
                                  color="white"
                                  shadow="md"
                                >
                                  <Icon fontSize="medium">inventory_2</Icon>
                                </MDBox>
                                <MDTypography variant="h3" color="info">
                                  {productCounts[template.id] || 0}
                                </MDTypography>
                              </MDBox>
                              <MDTypography variant="h6" fontWeight="medium">
                                {template.name}
                              </MDTypography>
                              {template.description && (
                                <MDTypography variant="caption" color="text">
                                  {template.description}
                                </MDTypography>
                              )}
                              <MDBox mt={2}>
                                <MDButton
                                  variant="outlined"
                                  color="info"
                                  size="small"
                                  fullWidth
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewTemplate(template.id);
                                  }}
                                >
                                  <Icon sx={{ mr: 1 }}>visibility</Icon>
                                  View Products
                                </MDButton>
                              </MDBox>
                            </MDBox>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </MDBox>
                )}
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

export default Products;
