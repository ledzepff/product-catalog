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
  All of the routes for the Material Dashboard 2 React are added here,
  You can add a new route, customize the routes and delete the routes here.

  Once you add a new route on this file it will be visible automatically on
  the Sidenav.

  For adding a new route you can follow the existing routes in the routes array.
  1. The `type` key with the `collapse` value is used for a route.
  2. The `type` key with the `title` value is used for a title inside the Sidenav.
  3. The `type` key with the `divider` value is used for a divider between Sidenav items.
  4. The `name` key is used for the name of the route on the Sidenav.
  5. The `key` key is used for the key of the route (It will help you with the key prop inside a loop).
  6. The `icon` key is used for the icon of the route on the Sidenav, you have to add a node.
  7. The `collapse` key is used for making a collapsible item on the Sidenav that has other routes
  inside (nested routes), you need to pass the nested routes inside an array as a value for the `collapse` key.
  8. The `route` key is used to store the route location which is used for the react router.
  9. The `href` key is used to store the external links location.
  10. The `title` key is only for the item with the type of `title` and its used for the title text on the Sidenav.
  10. The `component` key is used to store the component of its route.
*/

// Material Dashboard 2 React layouts
import Dashboard from "layouts/dashboard";
import Tables2 from "layouts/tables2";
import Tables2_1 from "layouts/tables2-1";
import Attributes from "layouts/attributes";
import ProductAttributes from "layouts/product-attributes";
import Products from "layouts/products";
import Regions from "layouts/regions";
import Billing from "layouts/billing";
import RTL from "layouts/rtl";
import Notifications from "layouts/notifications";
import Profile from "layouts/profile";
import SignIn from "layouts/authentication/sign-in";

// Pricing layouts
import {
  Units,
  Periods,
  MeterValueTypes,
  Meters,
  PricingTypes,
  PricingAttributes,
  RatePlans,
  Bundles,
  ConsoleProducts,
} from "layouts/pricing";

// @mui icons
import Icon from "@mui/material/Icon";

const routes = [
  {
    type: "collapse",
    name: "Dashboard",
    key: "dashboard",
    icon: <Icon fontSize="small">dashboard</Icon>,
    route: "/dashboard",
    component: <Dashboard />,
  },
  {
    type: "collapse",
    name: "Attributes",
    key: "attributes",
    icon: <Icon fontSize="small">tune</Icon>,
    route: "/attributes",
    component: <Attributes />,
  },
  {
    type: "collapse",
    name: "Type Attributes",
    key: "type-attributes",
    icon: <Icon fontSize="small">link</Icon>,
    route: "/type-attributes",
    component: <ProductAttributes />,
  },
  {
    type: "collapse",
    name: "Products",
    key: "products",
    icon: <Icon fontSize="small">inventory</Icon>,
    route: "/products",
    component: <Products />,
  },
  {
    type: "collapse",
    name: "Manage",
    key: "manage",
    icon: <Icon fontSize="small">settings</Icon>,
    collapse: [
      {
        name: "Regions",
        key: "regions",
        route: "/regions",
        icon: <Icon fontSize="small">public</Icon>,
        component: <Regions />,
      },
      {
        name: "Services",
        key: "services",
        route: "/services",
        icon: <Icon fontSize="small">build</Icon>,
        component: <Tables2 />,
      },
      {
        name: "Service Types",
        key: "service-types",
        route: "/service-types",
        icon: <Icon fontSize="small">category</Icon>,
        component: <Tables2_1 />,
      },
    ],
  },
  {
    type: "collapse",
    name: "Pricing",
    key: "pricing",
    icon: <Icon fontSize="small">attach_money</Icon>,
    collapse: [
      {
        name: "Units",
        key: "units",
        route: "/pricing/units",
        icon: <Icon fontSize="small">straighten</Icon>,
        component: <Units />,
      },
      {
        name: "Periods",
        key: "periods",
        route: "/pricing/periods",
        icon: <Icon fontSize="small">schedule</Icon>,
        component: <Periods />,
      },
      {
        name: "Meter Value Types",
        key: "meter-value-types",
        route: "/pricing/meter-value-types",
        icon: <Icon fontSize="small">speed</Icon>,
        component: <MeterValueTypes />,
      },
      {
        name: "Meters",
        key: "meters",
        route: "/pricing/meters",
        icon: <Icon fontSize="small">av_timer</Icon>,
        component: <Meters />,
      },
      {
        name: "Pricing Types",
        key: "pricing-types",
        route: "/pricing/pricing-types",
        icon: <Icon fontSize="small">label</Icon>,
        component: <PricingTypes />,
      },
      {
        name: "Pricing Attributes",
        key: "pricing-attributes",
        route: "/pricing/pricing-attributes",
        icon: <Icon fontSize="small">tune</Icon>,
        component: <PricingAttributes />,
      },
      {
        name: "Rate Plans",
        key: "rate-plans",
        route: "/pricing/rate-plans",
        icon: <Icon fontSize="small">price_change</Icon>,
        component: <RatePlans />,
      },
      {
        name: "Bundles",
        key: "bundles",
        route: "/pricing/bundles",
        icon: <Icon fontSize="small">inventory_2</Icon>,
        component: <Bundles />,
      },
      {
        name: "Console Products",
        key: "console-products",
        route: "/pricing/console-products",
        icon: <Icon fontSize="small">cloud</Icon>,
        component: <ConsoleProducts />,
      },
    ],
  },
  {
    type: "hidden",
    name: "Billing",
    key: "billing",
    icon: <Icon fontSize="small">receipt_long</Icon>,
    route: "/billing",
    component: <Billing />,
  },
  {
    type: "hidden",
    name: "RTL",
    key: "rtl",
    icon: <Icon fontSize="small">format_textdirection_r_to_l</Icon>,
    route: "/rtl",
    component: <RTL />,
  },
  {
    type: "hidden",
    name: "Notifications",
    key: "notifications",
    icon: <Icon fontSize="small">notifications</Icon>,
    route: "/notifications",
    component: <Notifications />,
  },
  {
    type: "hidden",
    name: "Profile",
    key: "profile",
    icon: <Icon fontSize="small">person</Icon>,
    route: "/profile",
    component: <Profile />,
  },
  {
    type: "hidden",
    name: "Sign In",
    key: "sign-in",
    icon: <Icon fontSize="small">login</Icon>,
    route: "/authentication/sign-in",
    component: <SignIn />,
  },
];

export default routes;
