/**
=========================================================
* Material Dashboard 2 React - v2.2.0
=========================================================

* Product Page: https://www.creative-tim.com/product/material-dashboard-react
* Copyright 2023 Creative Tim (https://www.creative-tim.com)

Coded by www.creative-tim.com

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

import { useState, useEffect, useMemo } from "react";

// react-router components
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

// @mui material components
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Icon from "@mui/material/Icon";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";

// Material Dashboard 2 React example components
import Sidenav from "examples/Sidenav";

// Material Dashboard 2 React themes
import theme from "assets/theme";
import themeRTL from "assets/theme/theme-rtl";

// Material Dashboard 2 React Dark Mode themes
import themeDark from "assets/theme-dark";
import themeDarkRTL from "assets/theme-dark/theme-rtl";

// RTL plugins
import rtlPlugin from "stylis-plugin-rtl";
import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";

// Material Dashboard 2 React routes
import routes from "routes";

// Material Dashboard 2 React contexts
import { useMaterialUIController, setMiniSidenav } from "context";

// Auth context and components
import { useAuth } from "context/AuthContext";
import ProtectedRoute from "components/ProtectedRoute";

// Images
import brandWhite from "assets/images/pt-logo.png";
import brandDark from "assets/images/pt-logo.png";

// Supabase client
import { supabase } from "supabaseClient";

// Dynamic template component
import TemplateProducts from "layouts/products/TemplateProducts";

// Unauthorized page
import Unauthorized from "layouts/authentication/unauthorized";

// Icon mapping for product templates based on name keywords
const getTemplateIcon = (templateName) => {
  const name = templateName.toLowerCase();

  // Bare Metal related
  if (name.includes("bare metal") || name.includes("baremetal")) {
    return "dns"; // Server rack icon
  }

  // Bundles related
  if (name.includes("bundle")) {
    return "inventory_2"; // Package/box icon
  }

  // Dedicated Hosts related
  if (name.includes("dedicated host") || name.includes("dedicated_host")) {
    return "developer_board"; // Hardware board icon
  }

  // HPC (High Performance Computing) related
  if (name.includes("hpc") || name.includes("high performance")) {
    return "memory"; // Memory/chip icon
  }

  // GPU related
  if (name.includes("gpu") || name.includes("graphics")) {
    return "videocam"; // Graphics card icon
  }

  // Storage related
  if (name.includes("storage") || name.includes("disk") || name.includes("volume")) {
    return "storage";
  }

  // Network related
  if (name.includes("network") || name.includes("vpc") || name.includes("load balancer")) {
    return "hub";
  }

  // Database related
  if (name.includes("database") || name.includes("db") || name.includes("sql")) {
    return "database";
  }

  // Container/Kubernetes related
  if (name.includes("container") || name.includes("kubernetes") || name.includes("k8s")) {
    return "view_in_ar";
  }

  // Serverless/Function related
  if (name.includes("serverless") || name.includes("function") || name.includes("lambda")) {
    return "bolt";
  }

  // Cloud/Compute related
  if (name.includes("cloud") || name.includes("compute") || name.includes("instance") || name.includes("vm") || name.includes("virtual machine")) {
    return "cloud";
  }

  // Security related
  if (name.includes("security") || name.includes("firewall") || name.includes("waf")) {
    return "security";
  }

  // Backup related
  if (name.includes("backup") || name.includes("snapshot")) {
    return "backup";
  }

  // CDN/Edge related
  if (name.includes("cdn") || name.includes("edge") || name.includes("content delivery")) {
    return "language";
  }

  // AI/ML related
  if (name.includes("ai") || name.includes("ml") || name.includes("machine learning") || name.includes("inference")) {
    return "psychology";
  }

  // Analytics related
  if (name.includes("analytics") || name.includes("monitoring") || name.includes("observability")) {
    return "analytics";
  }

  // Messaging/Queue related
  if (name.includes("message") || name.includes("queue") || name.includes("pub") || name.includes("event")) {
    return "mail";
  }

  // API/Gateway related
  if (name.includes("api") || name.includes("gateway")) {
    return "api";
  }

  // Default icon - generic product icon (different from bundles)
  return "widgets";
};

export default function App() {
  const [controller, dispatch] = useMaterialUIController();
  const {
    miniSidenav,
    direction,
    layout,
    sidenavColor,
    transparentSidenav,
    whiteSidenav,
    darkMode,
    sidenavPinned,
  } = controller;
  const [onMouseEnter, setOnMouseEnter] = useState(false);
  const [rtlCache, setRtlCache] = useState(null);
  const { pathname } = useLocation();

  // Auth state
  const { loading: authLoading, isAuthenticated } = useAuth();

  // Dynamic templates state
  const [productTemplates, setProductTemplates] = useState([]);
  const [templateGroups, setTemplateGroups] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);

  // Cache for the rtl
  useMemo(() => {
    const cacheRtl = createCache({
      key: "rtl",
      stylisPlugins: [rtlPlugin],
    });

    setRtlCache(cacheRtl);
  }, []);

  // Fetch product templates and groups that have attributes configured (via product_template_attributes)
  useEffect(() => {
    const fetchTemplatesAndGroups = async () => {
      try {
        // Get distinct template IDs from product_template_attributes (templates with attributes linked)
        const { data: attrData, error: attrError } = await supabase
          .from("product_template_attributes")
          .select("product_template_id")
          .eq("is_active", true);

        if (attrError) throw attrError;

        // Get unique template IDs
        const templateIds = [...new Set((attrData || []).map((a) => a.product_template_id))];

        if (templateIds.length === 0) {
          setProductTemplates([]);
          setTemplateGroups([]);
          setLoadingTemplates(false);
          return;
        }

        // Fetch template details for those IDs, including group_id
        const { data: templatesData, error: templatesError } = await supabase
          .from("product_templates")
          .select("id, name, group_id")
          .in("id", templateIds)
          .eq("is_active", true)
          .order("name");

        if (templatesError) throw templatesError;

        // Fetch template groups
        const { data: groupsData, error: groupsError } = await supabase
          .from("template_groups")
          .select("id, name, icon, sort_order")
          .eq("is_active", true)
          .order("sort_order");

        if (groupsError) throw groupsError;

        setProductTemplates(templatesData || []);
        setTemplateGroups(groupsData || []);
      } catch (err) {
        console.error("Error fetching product templates:", err);
      } finally {
        setLoadingTemplates(false);
      }
    };

    fetchTemplatesAndGroups();
  }, []);

  // Build dynamic routes with template-based pages, organized by groups
  const dynamicRoutes = useMemo(() => {
    // Find the Products route and add template children (grouped and ungrouped)
    return routes.map((route) => {
      if (route.key === "products") {
        // Separate templates into grouped and ungrouped
        const ungroupedTemplates = productTemplates.filter((t) => !t.group_id);
        const groupedTemplates = productTemplates.filter((t) => t.group_id);

        // Build group items with their child templates
        const groupItems = templateGroups
          .filter((group) => groupedTemplates.some((t) => t.group_id === group.id))
          .map((group) => ({
            name: group.name,
            key: `product-group-${group.name.toLowerCase().replace(/\s+/g, "-")}`,
            icon: <Icon fontSize="small">{group.icon || "folder"}</Icon>,
            collapse: groupedTemplates
              .filter((t) => t.group_id === group.id)
              .map((template) => ({
                name: template.name,
                key: `product-template-${template.name.toLowerCase().replace(/\s+/g, "-")}`,
                route: `/products/template/${encodeURIComponent(template.name)}`,
                icon: <Icon fontSize="small">{getTemplateIcon(template.name)}</Icon>,
              })),
          }));

        // Build ungrouped template items
        const ungroupedItems = ungroupedTemplates.map((template) => ({
          name: template.name,
          key: `product-template-${template.name.toLowerCase().replace(/\s+/g, "-")}`,
          route: `/products/template/${encodeURIComponent(template.name)}`,
          icon: <Icon fontSize="small">{getTemplateIcon(template.name)}</Icon>,
        }));

        return {
          ...route,
          collapse: [...groupItems, ...ungroupedItems],
        };
      }
      return route;
    });
  }, [productTemplates, templateGroups]);

  // Open sidenav when mouse enter on mini sidenav (only if not pinned)
  const handleOnMouseEnter = () => {
    if (!sidenavPinned && miniSidenav && !onMouseEnter) {
      setMiniSidenav(dispatch, false);
      setOnMouseEnter(true);
    }
  };

  // Close sidenav when mouse leave mini sidenav (only if not pinned)
  const handleOnMouseLeave = () => {
    if (!sidenavPinned && onMouseEnter) {
      setMiniSidenav(dispatch, true);
      setOnMouseEnter(false);
    }
  };

  // Setting the dir attribute for the body element
  useEffect(() => {
    document.body.setAttribute("dir", direction);
  }, [direction]);

  // Setting page scroll to 0 when changing the route
  useEffect(() => {
    document.documentElement.scrollTop = 0;
    document.scrollingElement.scrollTop = 0;
  }, [pathname]);

  // Check if route is a public route (no auth required)
  const isPublicRoute = (route) => {
    const publicPaths = ["/authentication/sign-in", "/authentication/forgot-password"];
    return publicPaths.includes(route.route);
  };

  const getRoutes = (allRoutes) =>
    allRoutes.map((route) => {
      if (route.collapse) {
        return getRoutes(route.collapse);
      }

      // Only create route if it has both a path and a component
      if (route.route && route.component) {
        // Public routes don't need protection
        if (isPublicRoute(route)) {
          return <Route exact path={route.route} element={route.component} key={route.key} />;
        }

        // Protected routes - wrap with ProtectedRoute
        // All authenticated users with any PMP role can access
        return (
          <Route
            exact
            path={route.route}
            element={
              <ProtectedRoute
                requiredRoles={["platform_admin", "product_editor", "products_viewer"]}
              >
                {route.component}
              </ProtectedRoute>
            }
            key={route.key}
          />
        );
      }

      return null;
    });

  // Add dynamic template route (using template name)
  const getDynamicTemplateRoute = () => (
    <Route
      path="/products/template/:templateName"
      element={
        <ProtectedRoute requiredRoles={["platform_admin", "product_editor", "products_viewer"]}>
          <TemplateProducts />
        </ProtectedRoute>
      }
      key="template-products"
    />
  );

  // Loading state - show spinner while auth is loading
  if (authLoading || loadingTemplates) {
    return (
      <ThemeProvider theme={darkMode ? themeDark : theme}>
        <CssBaseline />
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="100vh"
        >
          <CircularProgress color="info" size={48} />
        </Box>
      </ThemeProvider>
    );
  }

  return direction === "rtl" ? (
    <CacheProvider value={rtlCache}>
      <ThemeProvider theme={darkMode ? themeDarkRTL : themeRTL}>
        <CssBaseline />
        {layout === "dashboard" && isAuthenticated && (
          <>
            <Sidenav
              color={sidenavColor}
              brand={(transparentSidenav && !darkMode) || whiteSidenav ? brandDark : brandWhite}
              brandName="Product Catalog"
              routes={dynamicRoutes}
              onMouseEnter={handleOnMouseEnter}
              onMouseLeave={handleOnMouseLeave}
            />
          </>
        )}
        <Routes>
          {getRoutes(dynamicRoutes)}
          {getDynamicTemplateRoute()}
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </ThemeProvider>
    </CacheProvider>
  ) : (
    <ThemeProvider theme={darkMode ? themeDark : theme}>
      <CssBaseline />
      {layout === "dashboard" && isAuthenticated && (
        <>
          <Sidenav
            color={sidenavColor}
            brand={(transparentSidenav && !darkMode) || whiteSidenav ? brandDark : brandWhite}
            brandName="Product Catalog"
            routes={dynamicRoutes}
            onMouseEnter={handleOnMouseEnter}
            onMouseLeave={handleOnMouseLeave}
          />
        </>
      )}
      <Routes>
        {getRoutes(dynamicRoutes)}
        {getDynamicTemplateRoute()}
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </ThemeProvider>
  );
}
