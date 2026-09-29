import { createBrowserRouter, Navigate } from "react-router-dom"
import {
  Home,
  SignIn,
  SignUp,
  ForgotPass,
  ResetPass,
  OAuthSuccess,
  VerifyEmail,
  Dashboard,
  MembersPage,
  OrgSettingsPage,
  ProfilePage,
  ProjectDetailsPage,
  ProjectSettingsPage,
  ConnectionsPage,
  SchemaExplorerPage,
  SchemaDiffPage,
  MigrationsPage,
  NewMigrationPage,
  MigrationLivePage,
  PrivacyPolicyPage,
  TermsPage,
  CookiePolicyPage,
  NotFoundPage,
} from "@/pages"

import { ProtectedRoute } from "./ProtectedRoute"
import {
  MainLayout,
  ComingSoon,
  RootLayout,
  PublicTransitionLayout,
} from "@/components/layout"

export const router = createBrowserRouter(
  [
    {
      element: <RootLayout />,
      children: [
        {
          element: <PublicTransitionLayout />,
          children: [
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
            // Legal Pages
            {
              path: "/privacy-policy",
              element: <PrivacyPolicyPage />,
            },
            {
              path: "/privacy",
              element: <Navigate to="/privacy-policy" replace />,
            },
            {
              path: "/terms-and-conditions",
              element: <TermsPage />,
            },
            {
              path: "/terms",
              element: <Navigate to="/terms-and-conditions" replace />,
            },
            {
              path: "/cookie-policy",
              element: <CookiePolicyPage />,
            },
            {
              path: "/cookies",
              element: <Navigate to="/cookie-policy" replace />,
            },
            {
              path: "/cookie",
              element: <Navigate to="/cookie-policy" replace />,
            },
            // Email verification — must be public so unverified users can access it
            // after sign-up or on first sign-in before verifying their account.
            {
              path: "/verify-email",
              element: <VerifyEmail />,
            },
            {
              path: "docs",
              element: <ComingSoon title="Documentation & API Guides" />,
            },
            {
              path: "/docs",
              element: <ComingSoon title="Documentation & API Guides" />,
            },
          ],
        },
        // OAuth callback — must be outside ProtectedRoute and PublicTransitionLayout
        // so the unauthenticated popup window can render it and exchange the code
        // before postMessage-ing back to the parent.
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
                  path: "projects",
                  element: <Navigate to="/dashboard" replace />,
                },
                {
                  path: "projects/:projectSlug",
                  element: <ProjectDetailsPage />,
                },
                {
                  path: "projects/:projectSlug/settings",
                  element: <ProjectSettingsPage />,
                },
                {
                  path: "connections",
                  element: <ConnectionsPage />,
                },
                {
                  path: "org/members",
                  element: <MembersPage />,
                },
                {
                  path: "org/settings",
                  element: <OrgSettingsPage />,
                },
                {
                  path: "migration",
                  element: <MigrationsPage />,
                },
                {
                  path: "migration/new",
                  element: <NewMigrationPage />,
                },
                {
                  path: "migration/:jobId",
                  element: <MigrationLivePage />,
                },
                {
                  path: "migration/:projectSlug/:jobId",
                  element: <MigrationLivePage />,
                },
                {
                  path: "editor",
                  element: <SchemaExplorerPage />,
                },
                {
                  path: "schema-diff",
                  element: <SchemaDiffPage />,
                },
                {
                  path: "profile",
                  element: <ProfilePage />,
                },
              ],
            },
          ],
        },
        {
          path: "*",
          element: <NotFoundPage />,
        },
      ],
    },
  ],
  {
    // Opt into React Router v7 behaviour early to silence deprecation warnings.
    // future: { v7_startTransition: true },
  }
)

export default router
