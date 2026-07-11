import { createBrowserRouter, Outlet, redirect } from "react-router";
import { HomePage } from "../presentation/pages/HomePage";
import { ChatPage } from "../presentation/pages/ChatPage";
import { Phq9AssessmentPage } from "../presentation/pages/Phq9AssessmentPage";
import { Gad7AssessmentPage } from "../presentation/pages/Gad7AssessmentPage";
import { SplashPage } from "../presentation/pages/SplashPage";
import { PrivacyPage } from "../presentation/pages/PrivacyPage";
import { ConsentPage } from "../presentation/pages/ConsentPage";
import { AssessmentSelectPage } from "../presentation/pages/AssessmentSelectPage";
import { AssessmentResultPage } from "../presentation/pages/AssessmentResultPage";
import { useConsentStore } from "../stores/consent.store";
import { routes } from "../presentation/lib/routes";

export const router = createBrowserRouter([
  {
    id: "root",
    path: "/",
    Component: () => <Outlet />,
    children: [
      {
        index: true,
        Component: SplashPage,
        loader: () => (useConsentStore.getState().hasConsented ? redirect(routes.home) : null),
      },
      {
        path: "privacy",
        Component: PrivacyPage,
      },
      {
        path: "consent",
        Component: ConsentPage,
      },
      {
        path: "home",
        Component: HomePage,
      },
      {
        path: "chat",
        Component: ChatPage,
      },
      {
        path: "assessment",
        Component: AssessmentSelectPage,
      },
      {
        path: "assessment/phq9",
        Component: Phq9AssessmentPage,
      },
      {
        path: "assessment/gad7",
        Component: Gad7AssessmentPage,
      },
      {
        path: "assessment/result",
        Component: AssessmentResultPage,
      },
    ],
  },
]);
