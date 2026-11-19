import { Route, Routes } from 'react-router'
import { RequireAuth, RequireGuest } from './auth/guards.jsx'
import AppLayout from './layout/AppLayout.jsx'
import CatalogPage from './pages/CatalogPage.jsx'
import ComingSoonPage from './pages/ComingSoonPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'
import PerfumePage from './pages/PerfumePage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import ShelfPage from './pages/ShelfPage.jsx'
import WelcomePage from './pages/WelcomePage.jsx'

function App() {
  return (
    <Routes>
      <Route element={<RequireGuest />}>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route path="/discover" element={<ComingSoonPage title="Odkrywaj" />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/perfumes/:id" element={<PerfumePage />} />
          <Route path="/shelf" element={<ShelfPage />} />
          <Route path="/feed" element={<ComingSoonPage title="Tablica" />} />
          <Route path="/profile" element={<ComingSoonPage title="Profil" />} />
          <Route path="/settings" element={<ComingSoonPage title="Ustawienia konta" />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App