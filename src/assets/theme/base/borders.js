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
 * The base border styles for the Material Dashboard 2 React.
 * You can add new border width, border color or border radius using this file.
 * You can customized the borders value for the entire Material Dashboard 2 React using thie file.
 */

// Material Dashboard 2 React Base Styles
import colors from "assets/theme/base/colors";

// Material Dashboard 2 React Helper Functions
import pxToRem from "assets/theme/functions/pxToRem";

const { grey } = colors;

const borders = {
  borderColor: grey[300],

  borderWidth: {
    0: 0,
    1: pxToRem(1),
    2: pxToRem(2),
    3: pxToRem(3),
    4: pxToRem(4),
    5: pxToRem(5),
  },

  borderRadius: {
    xs: pxToRem(2),
    sm: pxToRem(3),
    md: pxToRem(4),
    lg: pxToRem(6),
    xl: pxToRem(8),
    xxl: pxToRem(10),
    section: pxToRem(100),
  },
};

export default borders;
