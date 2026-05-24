import { Routes, Route } from "react-router-dom"
import { Home } from "./pages/Home"

const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
    <h1 className="text-4xl font-bold">{title} Page (Coming Soon)</h1>
  </div>
)

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
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
