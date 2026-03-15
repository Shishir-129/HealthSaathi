import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Chat } from "./pages/Chat";
import { Map } from "./pages/Map";
import { Dashboard } from "./pages/Dashboard";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Chat },
      { path: "chat", Component: Chat },
      { path: "map", Component: Map },
      { path: "dashboard", Component: Dashboard },
    ],
  },
]);
