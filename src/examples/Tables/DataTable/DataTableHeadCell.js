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

import { forwardRef } from "react";

// prop-types is a library for typechecking of props
import PropTypes from "prop-types";

// @mui material components
import Icon from "@mui/material/Icon";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";

// Material Dashboard 2 React contexts
import { useMaterialUIController } from "context";

const DataTableHeadCell = forwardRef(({ width, children, sorted, align, style, onSortClick, ...rest }, ref) => {
  const [controller] = useMaterialUIController();
  const { darkMode } = controller;

  const handleArrowClick = (e) => {
    if (onSortClick) {
      e.stopPropagation();
      onSortClick(e);
    }
  };

  return (
    <MDBox
      component="th"
      ref={ref}
      width={width}
      py={1.2}
      px={3}
      sx={({ palette: { light }, borders: { borderWidth } }) => ({
        borderBottom: `${borderWidth[1]} solid ${light.main}`,
        ...style,
      })}
    >
      <MDBox
        {...rest}
        position="relative"
        textAlign={align}
        color={darkMode ? "white" : "secondary"}
        opacity={0.7}
        sx={({ typography: { size, fontWeightBold } }) => ({
          fontSize: size.xxs,
          fontWeight: fontWeightBold,
          textTransform: "uppercase",
          cursor: sorted && "pointer",
          userSelect: sorted && "none",
          display: "flex",
          alignItems: "center",
          justifyContent: align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start",
        })}
      >
        {children}
        {sorted && (
          <MDBox
            position="relative"
            ml={0.5}
            onClick={handleArrowClick}
            sx={({ typography: { size } }) => ({
              fontSize: size.lg,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              height: "20px",
              width: "18px",
              flexShrink: 0,
              cursor: "pointer",
            })}
          >
            <MDBox
              position="absolute"
              top={-6}
              color={sorted === "asce" ? "text" : "secondary"}
              opacity={sorted === "asce" ? 1 : 0.5}
            >
              <Icon>arrow_drop_up</Icon>
            </MDBox>
            <MDBox
              position="absolute"
              top={0}
              color={sorted === "desc" ? "text" : "secondary"}
              opacity={sorted === "desc" ? 1 : 0.5}
            >
              <Icon>arrow_drop_down</Icon>
            </MDBox>
          </MDBox>
        )}
      </MDBox>
    </MDBox>
  );
});

// Setting default values for the props of DataTableHeadCell
DataTableHeadCell.defaultProps = {
  width: "auto",
  sorted: "none",
  align: "left",
  style: {},
  onSortClick: null,
};

// Typechecking props for the DataTableHeadCell
DataTableHeadCell.propTypes = {
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  children: PropTypes.node.isRequired,
  sorted: PropTypes.oneOf([false, "none", "asce", "desc"]),
  align: PropTypes.oneOf(["left", "right", "center"]),
  style: PropTypes.object,
  onSortClick: PropTypes.func,
};

// Display name for debugging
DataTableHeadCell.displayName = "DataTableHeadCell";

export default DataTableHeadCell;
