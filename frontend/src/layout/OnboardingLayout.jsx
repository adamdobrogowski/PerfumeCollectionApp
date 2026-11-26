import { AppShell, Button, Group, Text } from '@mantine/core'
import { Outlet } from 'react-router'
import { useLogout } from '../auth/useLogout.js'

const HEADER_HEIGHT = 60

function OnboardingLayout() {
  const logoutMutation = useLogout()

  return (
    <AppShell header={{ height: HEADER_HEIGHT }} padding="md">
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between" wrap="nowrap">
          <Text fw={700} size="lg">
            PerfumeCollection
          </Text>
          <Button
            variant="subtle"
            color="red"
            loading={logoutMutation.isPending}
            onClick={() => logoutMutation.mutate()}
          >
            Wyloguj
          </Button>
        </Group>
      </AppShell.Header>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  )
}

export default OnboardingLayout