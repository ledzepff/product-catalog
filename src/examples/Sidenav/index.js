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

import { useEffect, useState } from "react";

// react-router-dom components
import { useLocation, NavLink, useNavigate } from "react-router-dom";

// prop-types is a library for typechecking of props.
import PropTypes from "prop-types";

// @mui material components
import List from "@mui/material/List";
import Divider from "@mui/material/Divider";
import Link from "@mui/material/Link";
import Icon from "@mui/material/Icon";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Avatar from "@mui/material/Avatar";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

// Auth context
import { useAuth } from "context/AuthContext";

// Material Dashboard 2 React example components
import SidenavCollapse from "examples/Sidenav/SidenavCollapse";

// Custom styles for the Sidenav
import SidenavRoot from "examples/Sidenav/SidenavRoot";
import sidenavLogoLabel from "examples/Sidenav/styles/sidenav";

// Material Dashboard 2 React context
import {
  useMaterialUIController,
  setMiniSidenav,
  setTransparentSidenav,
  setWhiteSidenav,
  setSidenavPinned,
} from "context";

function Sidenav({ color, brand, brandName, routes, onMouseEnter, onMouseLeave, ...rest }) {
  const [controller, dispatch] = useMaterialUIController();
  const { miniSidenav, transparentSidenav, whiteSidenav, darkMode, sidenavPinned } = controller;
  const location = useLocation();
  const navigate = useNavigate();
  const collapseName = location.pathname.replace("/", "");
  const [openCollapse, setOpenCollapse] = useState(null);
  const [openNestedCollapse, setOpenNestedCollapse] = useState(null);
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);

  // Auth state
  const { user, profile, signOut, isPlatformAdmin, isProductEditor, isProductsViewer } = useAuth();

  let textColor = "white";

  if (transparentSidenav || (whiteSidenav && !darkMode)) {
    textColor = "dark";
  } else if (whiteSidenav && darkMode) {
    textColor = "inherit";
  }

  const closeSidenav = () => setMiniSidenav(dispatch, true);

  const handleCollapseToggle = (key) => {
    setOpenCollapse(openCollapse === key ? null : key);
  };

  const handleNestedCollapseToggle = (key) => {
    setOpenNestedCollapse(openNestedCollapse === key ? null : key);
  };

  // Toggle pin state
  const handleTogglePin = () => {
    const newPinned = !sidenavPinned;
    setSidenavPinned(dispatch, newPinned);
    // When pinning, expand; when unpinning, collapse
    setMiniSidenav(dispatch, !newPinned);
  };

  // Handle menu item click - collapse sidebar if not pinned
  const handleMenuItemClick = () => {
    if (!sidenavPinned) {
      setMiniSidenav(dispatch, true);
    }
  };

  useEffect(() => {
    // A function that sets the mini state of the sidenav.
    function handleMiniSidenav() {
      // Only auto-collapse on small screens
      if (window.innerWidth < 1200) {
        setMiniSidenav(dispatch, true);
        setTransparentSidenav(dispatch, false);
        setWhiteSidenav(dispatch, false);
      }
    }

    /**
     The event listener that's calling the handleMiniSidenav function when resizing the window.
    */
    window.addEventListener("resize", handleMiniSidenav);

    // Call the handleMiniSidenav function to set the state with the initial value.
    handleMiniSidenav();

    // Remove event listener on cleanup
    return () => window.removeEventListener("resize", handleMiniSidenav);
  }, [dispatch, sidenavPinned]);

  // Auto-open collapse if current route is a child (supports nested collapses)
  useEffect(() => {
    routes.forEach((route) => {
      if (route.collapse) {
        route.collapse.forEach((child) => {
          // Check if this child is a direct route match
          if (location.pathname === child.route) {
            setOpenCollapse(route.key);
          }
          // Check if this child has nested collapse (group)
          if (child.collapse) {
            child.collapse.forEach((nestedChild) => {
              if (location.pathname === nestedChild.route) {
                setOpenCollapse(route.key);
                setOpenNestedCollapse(child.key);
              }
            });
          }
        });
      }
    });
  }, [location, routes]);

  // Render all the routes from the routes.js (All the visible items on the Sidenav)
  const renderRoutes = routes.map(
    ({ type, name, icon, title, noCollapse, key, href, route, collapse }) => {
      let returnValue;

      if (type === "collapse") {
        // Check if this item has nested routes
        if (collapse && collapse.length > 0) {
          returnValue = (
            <MDBox key={key}>
              <MDBox
                onClick={() => handleCollapseToggle(key)}
                sx={{ cursor: "pointer", position: "relative" }}
              >
                <SidenavCollapse
                  name={name}
                  icon={icon}
                  active={false}
                  noCollapse={noCollapse}
                />
                {!miniSidenav && (
                  <Icon
                    sx={{
                      position: "absolute",
                      right: 16,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color:
                        transparentSidenav || (whiteSidenav && !darkMode)
                          ? "dark"
                          : "rgba(255, 255, 255, 0.8)",
                      fontSize: "1.25rem !important",
                    }}
                  >
                    {openCollapse === key ? "expand_less" : "expand_more"}
                  </Icon>
                )}
              </MDBox>
              <Collapse in={openCollapse === key && !miniSidenav} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {collapse.map((child) =>
                    // Check if child has nested collapse (group with templates)
                    child.collapse && child.collapse.length > 0 ? (
                      <MDBox key={child.key}>
                        <MDBox
                          onClick={() => handleNestedCollapseToggle(child.key)}
                          sx={{ cursor: "pointer", position: "relative" }}
                        >
                          <MDBox pl={4}>
                            <SidenavCollapse
                              name={child.name}
                              icon={child.icon}
                              active={false}
                            />
                          </MDBox>
                          <Icon
                            sx={{
                              position: "absolute",
                              right: 16,
                              top: "50%",
                              transform: "translateY(-50%)",
                              color:
                                transparentSidenav || (whiteSidenav && !darkMode)
                                  ? "dark"
                                  : "rgba(255, 255, 255, 0.8)",
                              fontSize: "1rem !important",
                            }}
                          >
                            {openNestedCollapse === child.key ? "expand_less" : "expand_more"}
                          </Icon>
                        </MDBox>
                        <Collapse in={openNestedCollapse === child.key} timeout="auto" unmountOnExit>
                          <List component="div" disablePadding>
                            {child.collapse.map((nestedChild) => (
                              <NavLink key={nestedChild.key} to={nestedChild.route} onClick={handleMenuItemClick}>
                                <MDBox pl={6}>
                                  <SidenavCollapse
                                    name={nestedChild.name}
                                    icon={nestedChild.icon}
                                    active={location.pathname === nestedChild.route}
                                  />
                                </MDBox>
                              </NavLink>
                            ))}
                          </List>
                        </Collapse>
                      </MDBox>
                    ) : (
                      // Regular child item (direct route)
                      <NavLink key={child.key} to={child.route} onClick={handleMenuItemClick}>
                        <MDBox pl={4}>
                          <SidenavCollapse
                            name={child.name}
                            icon={child.icon}
                            active={location.pathname === child.route}
                          />
                        </MDBox>
                      </NavLink>
                    )
                  )}
                </List>
              </Collapse>
            </MDBox>
          );
        } else {
          returnValue = href ? (
            <Link
              href={href}
              key={key}
              target="_blank"
              rel="noreferrer"
              sx={{ textDecoration: "none" }}
              onClick={handleMenuItemClick}
            >
              <SidenavCollapse
                name={name}
                icon={icon}
                active={key === collapseName}
                noCollapse={noCollapse}
              />
            </Link>
          ) : (
            <NavLink key={key} to={route} onClick={handleMenuItemClick}>
              <SidenavCollapse name={name} icon={icon} active={key === collapseName} />
            </NavLink>
          );
        }
      } else if (type === "title") {
        returnValue = !miniSidenav ? (
          <MDTypography
            key={key}
            color={textColor}
            display="block"
            variant="caption"
            fontWeight="bold"
            textTransform="uppercase"
            pl={3}
            mt={2}
            mb={1}
            ml={1}
          >
            {title}
          </MDTypography>
        ) : null;
      } else if (type === "divider") {
        returnValue = (
          <Divider
            key={key}
            light={
              (!darkMode && !whiteSidenav && !transparentSidenav) ||
              (darkMode && !transparentSidenav && whiteSidenav)
            }
          />
        );
      }

      return returnValue;
    }
  );

  // User menu handlers
  const handleUserMenuOpen = (event) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleSignOut = async () => {
    handleUserMenuClose();
    await signOut();
    navigate("/authentication/sign-in");
  };

  // Get user's role display text
  const getUserRoleText = () => {
    if (isPlatformAdmin) return "Platform Admin";
    if (isProductEditor) return "Product Editor";
    if (isProductsViewer) return "Products Viewer";
    return "User";
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (profile?.full_name) {
      return profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  };

  return (
    <SidenavRoot
      {...rest}
      variant="permanent"
      ownerState={{ transparentSidenav, whiteSidenav, miniSidenav, darkMode }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <MDBox pt={3} pb={1} px={miniSidenav ? 2 : 4} textAlign="center">
        <MDBox
          display={{ xs: "block", xl: "none" }}
          position="absolute"
          top={0}
          right={0}
          p={1.625}
          onClick={closeSidenav}
          sx={{ cursor: "pointer" }}
        >
          <MDTypography variant="h6" color="secondary">
            <Icon sx={{ fontWeight: "bold" }}>close</Icon>
          </MDTypography>
        </MDBox>

        {/* Pin button - visible on large screens */}
        <MDBox
          display={{ xs: "none", xl: "block" }}
          position="absolute"
          top={8}
          right={8}
        >
          <Tooltip title={sidenavPinned ? "Unpin sidebar" : "Pin sidebar"} placement="right">
            <IconButton
              size="small"
              onClick={handleTogglePin}
              sx={{
                color: transparentSidenav || (whiteSidenav && !darkMode) ? "dark" : "white",
                opacity: miniSidenav ? 0 : 0.7,
                transition: "opacity 0.2s",
                "&:hover": {
                  opacity: 1,
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                },
              }}
            >
              <Icon
                sx={{
                  fontSize: "1.25rem !important",
                  transform: sidenavPinned ? "rotate(45deg)" : "rotate(0deg)",
                  transition: "transform 0.2s",
                }}
              >
                push_pin
              </Icon>
            </IconButton>
          </Tooltip>
        </MDBox>

        <MDBox component={NavLink} to="/" display="flex" alignItems="center" justifyContent={miniSidenav ? "center" : "flex-start"}>
          {brand && <MDBox component="img" src={brand} alt="Brand" width="2rem" />}
          {!miniSidenav && (
            <MDBox
              width={!brandName && "100%"}
              sx={(theme) => sidenavLogoLabel(theme, { miniSidenav })}
            >
              <MDTypography component="h6" variant="button" fontWeight="medium" color={textColor}>
                {brandName}
              </MDTypography>
            </MDBox>
          )}
        </MDBox>
      </MDBox>
      <Divider
        light={
          (!darkMode && !whiteSidenav && !transparentSidenav) ||
          (darkMode && !transparentSidenav && whiteSidenav)
        }
      />
      <List>{renderRoutes}</List>

      {/* User section at bottom */}
      {user && (
        <MDBox
          sx={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            borderTop: "1px solid",
            borderColor: transparentSidenav || (whiteSidenav && !darkMode) ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)",
          }}
        >
          <MDBox
            display="flex"
            alignItems="center"
            justifyContent={miniSidenav ? "center" : "flex-start"}
            p={2}
            sx={{ cursor: "pointer" }}
            onClick={handleUserMenuOpen}
          >
            <Avatar
              sx={{
                width: 36,
                height: 36,
                bgcolor: "info.main",
                fontSize: "0.875rem",
              }}
            >
              {getUserInitials()}
            </Avatar>
            {!miniSidenav && (
              <MDBox ml={1.5} lineHeight={1}>
                <MDTypography variant="button" fontWeight="medium" color={textColor}>
                  {profile?.full_name || user.email?.split("@")[0]}
                </MDTypography>
                <MDTypography variant="caption" color={textColor} sx={{ opacity: 0.7, display: "block" }}>
                  {getUserRoleText()}
                </MDTypography>
              </MDBox>
            )}
          </MDBox>

          {/* User menu dropdown */}
          <Menu
            anchorEl={userMenuAnchor}
            open={Boolean(userMenuAnchor)}
            onClose={handleUserMenuClose}
            anchorOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
            transformOrigin={{
              vertical: "bottom",
              horizontal: "left",
            }}
          >
            <MenuItem disabled>
              <MDTypography variant="caption" color="text">
                {user.email}
              </MDTypography>
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleSignOut}>
              <Icon sx={{ mr: 1 }}>logout</Icon>
              Sign Out
            </MenuItem>
          </Menu>
        </MDBox>
      )}
    </SidenavRoot>
  );
}

// Setting default values for the props of Sidenav
Sidenav.defaultProps = {
  color: "info",
  brand: "",
  onMouseEnter: () => {},
  onMouseLeave: () => {},
};

// Typechecking props for the Sidenav
Sidenav.propTypes = {
  color: PropTypes.oneOf(["primary", "secondary", "info", "success", "warning", "error", "dark"]),
  brand: PropTypes.string,
  brandName: PropTypes.string.isRequired,
  routes: PropTypes.arrayOf(PropTypes.object).isRequired,
  onMouseEnter: PropTypes.func,
  onMouseLeave: PropTypes.func,
};

export default Sidenav;
