import { Routes, Route } from "react-router-dom"
import { Home } from "./pages/Home"
import SignUp from "./pages/authpages/SignUp"
import SignIn from "./pages/authpages/SignIn"
import ForgotPass from "./pages/authpages/ForgotPass"
import ResetPass from "./pages/authpages/ResetPass"
import Dashboard from "./pages/dashboard/Dashboard"
import { ProtectedRoute } from "@/components/layout/ProtectedRoute"
// import { useAuthStore } from "@/store/authStore"

const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
    <h1 className="text-4xl font-bold">{title} Page (Coming Soon)</h1>
  </div>
)

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/sign-in" element={<SignIn />} />
      <Route path="/sign-up" element={<SignUp />} />
      <Route path="/forgot-password" element={<ForgotPass />} />
      <Route path="/reset-password" element={<ResetPass />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route path="/docs" element={<PlaceholderPage title="Docs" />} />
      <Route
        path="/migration"
        element={<PlaceholderPage title="Migration" />}
      />
      <Route path="/profile" element={<PlaceholderPage title="Profile" />} />
    </Routes>
  )
}

export default App
