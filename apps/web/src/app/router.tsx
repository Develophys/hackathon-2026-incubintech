import { createBrowserRouter, Outlet } from "react-router";
import { HomePage } from "../presentation/pages/HomePage";

export const router = createBrowserRouter([
  {
    id: "root",
    path: "/",
    Component: () => <Outlet />,
    children: [
      {
        index: true,
        Component: HomePage,
      },
    ],
  },
]);
