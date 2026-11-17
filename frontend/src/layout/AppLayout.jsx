import { Anchor, AppShell, Button, Group } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { Link, Outlet, useLocation } from 'react-router'
import HeaderSearch from './HeaderSearch.jsx'
import { NAV_ITEMS } from './navItems.js'
import UserMenu from './UserMenu.jsx'

const HEADER_HEIGHT = 60
const FOOTER_HEIGHT = 56

// Układ aplikacji dla zalogowanych: pasek u góry na komputerze, na telefonie sekcje na dole.
function AppLayout() {
  const { pathname } = useLocation()
  // Poniżej progu "sm" (48em) sekcje przechodzą na dolny pasek.
  const isMobile = useMediaQuery('(max-width: 47.99em)', false, { getInitialValueInEffect: false })
  console.log('AppLayout render, isMobile =', isMobile)

  const isActive = (path) => pathname === path || pathname.startsWith(`${path}/`)

  return (
    <AppShell
      header={{ height: HEADER_HEIGHT }}
      footer={{ height: FOOTER_HEIGHT, collapsed: !isMobile }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" gap="md" wrap="nowrap">
          <Anchor component={Link} to="/discover" fw={700} size="lg" c="inherit" underline="never" visibleFrom="sm">
            PerfumeCollection
          </Anchor>
          <Group gap="xs" wrap="nowrap" visibleFrom="sm">
            {NAV_ITEMS.map((item) => (
              <Button
                key={item.path}
                component={Link}
                to={item.path}
                variant={isActive(item.path) ? 'light' : 'subtle'}
              >
                {item.label}
              </Button>
            ))}
          </Group>
          <Group gap="md" wrap="nowrap" style={{ flex: 1 }} justify="flex-end">
            <HeaderSearch />
            <UserMenu />
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>

      {isMobile && (
        <AppShell.Footer>
          <Group h="100%" gap={0} grow wrap="nowrap">
            {NAV_ITEMS.map((item) => (
              <Button
                key={item.path}
                component={Link}
                to={item.path}
                variant={isActive(item.path) ? 'light' : 'subtle'}
                radius={0}
                h="100%"
                px={4}
                fz="xs"
              >
                {item.label}
              </Button>
            ))}
          </Group>
        </AppShell.Footer>
      )}
    </AppShell>
  )
}

export default AppLayout