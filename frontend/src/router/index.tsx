import { createBrowserRouter } from "react-router-dom"
import { Home } from "@/pages/home/Home"
import {
  SignIn,
  SignUp,
  ForgotPass,
  ResetPass,
  OAuthSuccess,
  Dashboard,
} from "@/pages"
import { ProtectedRoute } from "./ProtectedRoute"
import { MainLayout } from "@/layouts/MainLayout"

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
              element: (
                <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
                  <h1 className="text-4xl font-bold">
                    Profile Page (Coming Soon)
                  </h1>
                </div>
              ),
            },
          ],
        },
      ],
    },
    {
      path: "/docs",
      element: (
        <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
          <h1 className="text-4xl font-bold">Docs Page (Coming Soon)</h1>
        </div>
      ),
    },
    {
      path: "/migration",
      element: (
        <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
          <h1 className="text-4xl font-bold">Migration Page (Coming Soon)</h1>
        </div>
      ),
    },
  ],
  {
    // Opt into React Router v7 behaviour early to silence deprecation warnings.
    // future: { v7_startTransition: true },
  }
)


export default router
