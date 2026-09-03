import { createBrowserRouter } from "react-router-dom"
import { Home } from "@/pages/home/Home"
import {
  SignIn,
  SignUp,
  ForgotPass,
  ResetPass,
  OAuthSuccess,
  VerifyEmail,
  Dashboard,
} from "@/pages"
import { ProtectedRoute } from "./ProtectedRoute"
import { MainLayout, ComingSoon } from "@/components/layout"

export const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <Home />,
    },
    {
      path: "/sign-in",
      element: <SignIn />,
    },
    {
      path: "/sign-up",
      element: <SignUp />,
    },
    {
      path: "/forgot-password",
      element: <ForgotPass />,
    },
    {
      path: "/reset-password",
      element: <ResetPass />,
    },
    // Email verification — must be public so unverified users can access it
    // after sign-up or on first sign-in before verifying their account.
    {
      path: "/verify-email",
      element: <VerifyEmail />,
    },
    // OAuth callback — must be outside ProtectedRoute so the unauthenticated
    // popup window can render it and exchange the code before postMessage-ing
    // back to the parent.
    {
      path: "/auth/:provider/callback",
      element: <OAuthSuccess />,
    },

    {
      path: "/",
      element: <ProtectedRoute />,
      children: [
        {
          path: "/",
          element: <MainLayout />,
          children: [
            {
              path: "dashboard",
              element: <Dashboard />,
            },
            {
              path: "profile",
              element: <ComingSoon title="Profile" />,
            },
          ],
        },
      ],
    },
    {
      path: "/docs",
      element: <ComingSoon title="Docs" />,
    },
    {
      path: "/migration",
      element: <ComingSoon title="Migration" />,
    },
  ],

  {
    // Opt into React Router v7 behaviour early to silence deprecation warnings.
    // future: { v7_startTransition: true },
  }
)

export default router
