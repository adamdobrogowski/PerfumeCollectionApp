import { Avatar, Menu, UnstyledButton, useComputedColorScheme, useMantineColorScheme } from '@mantine/core'
import { Link } from 'react-router'
import { useCurrentUser } from '../auth/useCurrentUser.js'
import { useLogout } from '../auth/useLogout.js'

// Menu konta: ustawienia, przełącznik motywu i wylogowanie.
function UserMenu() {
  const { data: user } = useCurrentUser()
  const logoutMutation = useLogout()
  const { setColorScheme } = useMantineColorScheme()
  const computedColorScheme = useComputedColorScheme('light')

  return (
    <Menu
      position="bottom-end"
      width={240}
      transitionProps={{ duration: 0 }}
    >
      <Menu.Target>
        <UnstyledButton aria-label="Menu użytkownika">
          <Avatar radius="xl" color="grape">
            {user.email[0].toUpperCase()}
          </Avatar>
        </UnstyledButton>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>{user.email}</Menu.Label>
        <Menu.Item component={Link} to="/settings">
          Ustawienia konta
        </Menu.Item>
        <Menu.Item onClick={() => setColorScheme(computedColorScheme === 'light' ? 'dark' : 'light')}>
          {computedColorScheme === 'light' ? 'Motyw ciemny' : 'Motyw jasny'}
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item color="red" disabled={logoutMutation.isPending} onClick={() => logoutMutation.mutate()}>
          Wyloguj
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  )
}

export default UserMenu