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

/**
 * The base box-shadow styles for the Material Dashboard 2 React.
 * You can add new box-shadow using this file.
 * You can customized the box-shadow for the entire Material Dashboard 2 React using thie file.
 */

// Material Dashboard 2 React Base Styles
import colors from "assets/theme/base/colors";

// Material Dashboard 2 React Helper Functions
import boxShadow from "assets/theme/functions/boxShadow";

const { black, white, tabs, coloredShadows } = colors;

const boxShadows = {
  xs: "none",
  sm: boxShadow([0, 1], [2, 0], black.main, 0.05),
  md: boxShadow([0, 1], [3, 0], black.main, 0.08),
  lg: boxShadow([0, 2], [4, 0], black.main, 0.08),
  xl: boxShadow([0, 4], [6, 0], black.main, 0.08),
  xxl: boxShadow([0, 4], [8, 0], black.main, 0.06),
  inset: "none",
  colored: {
    primary: "none",
    secondary: "none",
    info: "none",
    success: "none",
    warning: "none",
    error: "none",
    light: "none",
    dark: "none",
  },

  navbarBoxShadow: "none",
  sliderBoxShadow: {
    thumb: boxShadow([0, 1], [3, 0], black.main, 0.15),
  },
  tabsBoxShadow: {
    indicator: boxShadow([0, 1], [3, 0], tabs.indicator.boxShadow, 0.5),
  },
};

export default boxShadows;
