import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'
import { theme } from './theme.js'
import App from './App.jsx'

// Pamięć podręczna zapytań do API (m.in. stan sesji i słowniki katalogu).
const queryClient = new QueryClient()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      {/* MantineProvider udostępnia motyw wszystkim komponentom w aplikacji. */}
      <MantineProvider theme={theme} defaultColorScheme="light">
        <Notifications />
        {/* BrowserRouter synchronizuje widok z adresem w przeglądarce. */}
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </MantineProvider>
    </QueryClientProvider>
  </StrictMode>,
)