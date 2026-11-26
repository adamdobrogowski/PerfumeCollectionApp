import { Button, Center, Loader, Stack, Text } from '@mantine/core'
import { Navigate, Outlet, useLocation } from 'react-router'
import { useCurrentUser } from './useCurrentUser.js'

// Ekran na czas pierwszego sprawdzania sesji oraz gdy backend jest niedostępny.
function SessionCheckScreen({ error, onRetry }) {
  return (
    <Center h="100vh">
      {error ? (
        <Stack align="center" gap="sm">
          <Text>{error.message}</Text>
          <Button variant="light" onClick={() => onRetry()}>
            Spróbuj ponownie
          </Button>
        </Stack>
      ) : (
        <Loader />
      )}
    </Center>
  )
}

function useSessionState() {
  const query = useCurrentUser()
  const isChecking = query.isPending || (query.error && query.data === undefined)
  return { ...query, isChecking }
}

// Wpuszcza tylko zalogowanych. Gość trafia na /login, a po zalogowaniu wraca pod adres, który chciał otworzyć.
export function RequireAuth() {
  const { data: user, isChecking, error, refetch } = useSessionState()
  const location = useLocation()

  if (isChecking) {
    return <SessionCheckScreen error={error} onRetry={refetch} />
  }
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  return <Outlet />
}

// Wpuszcza tylko gości. Zalogowany użytkownik trafia pod zapamiętany adres albo do panelu Odkrywaj.
export function RequireGuest() {
  const { data: user, isChecking, error, refetch } = useSessionState()
  const location = useLocation()

  if (isChecking) {
    return <SessionCheckScreen error={error} onRetry={refetch} />
  }
  if (user) {
    return <Navigate to={location.state?.from ?? '/discover'} replace />
  }
  return <Outlet />
}

// Sprawdzamy dokładnie false: brak pola nie powinien wyrzucać nikogo z aplikacji.
export function RequireOnboardingDone() {
  const { data: user } = useCurrentUser()

  if (user.onboardingCompleted === false) {
    return <Navigate to="/onboarding" replace />
  }
  return <Outlet />
}

// Wpuszcza na /onboarding tylko użytkowników z nieukończonym onboardingiem. Pozostali wracają do Odkrywaj. 
export function RequireOnboardingPending() {
  const { data: user } = useCurrentUser()

  if (user.onboardingCompleted !== false) {
    return <Navigate to="/discover" replace />
  }
  return <Outlet />
}