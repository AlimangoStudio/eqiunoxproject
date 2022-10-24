import { lazy } from "react";

// use lazy for better code splitting, a.k.a. load faster
const Home = lazy(() => import('../pages/Home'))
const LaunchPad = lazy(() => import('../pages/LaunchPad'))
const Market = lazy(() => import('../pages/Market'))
const Dashboard = lazy(() => import('../pages/Dashboard'));
const Staking = lazy(() => import('../pages/Staking'));
const Forms = lazy(() => import('../pages/Forms'));
const Cards = lazy(() => import('../pages/Cards'));
const Charts = lazy(() => import('../pages/Charts'));
const Buttons = lazy(() => import('../pages/Buttons'));
const Modals = lazy(() => import('../pages/Modals'));
const Tables = lazy(() => import('../pages/Tables'));
const Page404 = lazy(() => import('../pages/404'));
const Blank = lazy(() => import('../pages/Blank'));

/**
 * ⚠ These are internal routes!
 * They will be rendered inside the app, using the default `containers/Layout`.
 * If you want to add a route to, let's say, a landing page, you should add
 * it to the `App`'s router, exactly like `Login`, `CreateAccount` and other pages
 * are routed.
 *
 * If you're looking for the links rendered in the SidebarContent, go to
 * `routes/sidebar.js`
 */
const routes = [
  {
    path: "/home", // the url
    component: Home, // view rendered
  },
  {
    path: "/launchpad", // the url
    component: LaunchPad, // view rendered
  },
  {
    path: "/market", // the url
    component: Market, // view rendered
  },
  {
    path: "/solana/nft-pack", // the url
    component: NftPack, // view rendered
  },
  {
    path: "/dashboard", // the url
    component: Dashboard, // view rendered
  },
  {
    path: '/staking', // the url
    component: Staking, // view rendered
  },
  {
    path: '/forms',
    component: Forms,
  },
  {
    path: "/cards",
    component: Cards,
  },
  {
    path: "/charts",
    component: Charts,
  },
  {
    path: "/buttons",
    component: Buttons,
  },
  {
    path: "/modals",
    component: Modals,
  },
  {
    path: "/tables",
    component: Tables,
  },
  {
    path: "/404",
    component: Page404,
  },
  {
    path: "/blank",
    component: Blank,
  },
];

export default routes;
