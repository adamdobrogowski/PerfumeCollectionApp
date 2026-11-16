import { Button, Container, Stack, Text, Title } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { logout } from '../api/auth.js'
import { CURRENT_USER_KEY, useCurrentUser } from '../auth/useCurrentUser.js'

// Tymczasowa strona. Docelowo panel Odkrywaj z rekomendacjami.
function DiscoverPage() {
  const { data: user } = useCurrentUser()
  const queryClient = useQueryClient()

  const logoutMutation = useMutation({
    mutationFn: logout,
    // RequireAuth zauważy brak użytkownika i przeniesie na /login.
    // Gdy pojawią się dane zależne od użytkownika (półka itd.), trzeba je tu też usunąć z pamięci.
    onSuccess: () => queryClient.setQueryData(CURRENT_USER_KEY, null),
    onError: (error) => notifications.show({ color: 'red', title: 'Błąd', message: error.message }),
  })

  return (
    <Container size="sm" py="xl">
      <Stack gap="md" align="flex-start">
        <Title order={2}>Odkrywaj</Title>
        <Text>Zalogowany jako {user.email}.</Text>
        <Button variant="light" loading={logoutMutation.isPending} onClick={() => logoutMutation.mutate()}>
          Wyloguj
        </Button>
      </Stack>
    </Container>
  )
}

export default DiscoverPage