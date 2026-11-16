import { Route, Routes } from 'react-router'
import { RequireAuth, RequireGuest } from './auth/guards.jsx'
import DiscoverPage from './pages/DiscoverPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import WelcomePage from './pages/WelcomePage.jsx'


// Trasy aplikacji. Zagnieżdżone trasy dziedziczą ochronę ze strażnika, który je otacza.
function App() {
  return (
    <Routes>
      <Route element={<RequireGuest />}>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>
      <Route element={<RequireAuth />}>
        <Route path="/discover" element={<DiscoverPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App