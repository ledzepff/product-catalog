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

// Material Dashboard 2 React Base Styles
import colors from "assets/theme-dark/base/colors";
import borders from "assets/theme-dark/base/borders";
import typography from "assets/theme-dark/base/typography";

// Material Dashboard 2 React helper functions
import pxToRem from "assets/theme-dark/functions/pxToRem";
import rgba from "assets/theme-dark/functions/rgba";

const { inputBorderColor, info, grey, transparent, white } = colors;
const { borderRadius } = borders;
const { size } = typography;

const inputOutlined = {
  styleOverrides: {
    root: {
      backgroundColor: transparent.main,
      fontSize: size.sm,
      borderRadius: borderRadius.md,

      "&:hover .MuiOutlinedInput-notchedOutline": {
        borderColor: rgba(inputBorderColor, 0.6),
      },

      "&.Mui-focused": {
        "& .MuiOutlinedInput-notchedOutline": {
          borderColor: info.main,
        },
      },

      "& .MuiOutlinedInput-input::placeholder": {
        color: grey[400],
        opacity: 1,
        fontWeight: 400,
        fontSize: size.sm,
      },

      "& .MuiInputAdornment-root": {
        color: grey[400],
        "& .MuiTypography-root": {
          color: grey[400],
          fontSize: size.sm,
          fontWeight: 400,
        },
      },
    },

    notchedOutline: {
      borderColor: rgba(inputBorderColor, 0.6),
    },

    input: {
      color: white.main,
      padding: pxToRem(12),
      backgroundColor: transparent.main,
      fontWeight: 400,
      fontSize: size.sm,

      "&::-webkit-input-placeholder": {
        color: grey[400],
      },

      "&::placeholder": {
        color: grey[400],
        opacity: 1,
        fontWeight: 400,
      },
    },

    inputSizeSmall: {
      fontSize: size.xs,
      padding: pxToRem(10),
    },

    multiline: {
      color: white.main,
      padding: 0,
    },

    inputAdornedEnd: {
      paddingRight: pxToRem(14),
    },
  },
};

export default inputOutlined;
