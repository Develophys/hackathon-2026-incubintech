import { createBrowserRouter, Outlet } from "react-router";
import { HomePage } from "../presentation/pages/HomePage";
import { ChatPage } from "../presentation/pages/ChatPage";
import { Phq9AssessmentPage } from "../presentation/pages/Phq9AssessmentPage";
import { Gad7AssessmentPage } from "../presentation/pages/Gad7AssessmentPage";

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
      {
        path: "assessment/phq9",
        Component: Phq9AssessmentPage,
      },
      {
        path: "assessment/gad7",
        Component: Gad7AssessmentPage,
      },
    ],
  },
]);
