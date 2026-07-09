import { createBrowserRouter, Outlet } from "react-router";
import { HomePage } from "../presentation/pages/HomePage";
import { ChatPage } from "../presentation/pages/ChatPage";

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
      {
        path: "chat",
        Component: ChatPage,
      },
    ],
  },
]);
