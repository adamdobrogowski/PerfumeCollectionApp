import { Alert, Anchor, Button, Container, Paper, PasswordInput, Stack, Text, TextInput, Title } from '@mantine/core'
import { useForm } from '@mantine/form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router'
import { login } from '../api/auth.js'
import { CURRENT_USER_KEY } from '../auth/useCurrentUser.js'
import { prefetchDiscover } from '../discover/useDiscover.js'

function LoginPage() {
  const queryClient = useQueryClient()

  const form = useForm({
    mode: 'uncontrolled',
    initialValues: { email: '', password: '' },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value.trim()) ? null : 'Podaj adres e-mail.'),
      password: (value) => (value.length > 0 ? null : 'Podaj hasło.'),
    },
  })

  const loginMutation = useMutation({
    mutationFn: ({ email, password }) => login(email, password),
    onSuccess: (user) => {
      queryClient.setQueryData(CURRENT_USER_KEY, user)
      if (user?.onboardingCompleted) {
        prefetchDiscover(queryClient)
      }
    },
  })

  return (
    <Container size="xs" py="xl">
      <Stack gap="md">
        <Title order={2}>Logowanie</Title>
        <Paper withBorder p="lg">
          <form onSubmit={form.onSubmit((values) => loginMutation.mutate(values))}>
            <Stack gap="md">
              {loginMutation.error && <Alert color="red">{loginMutation.error.message}</Alert>}
              <TextInput
                label="Adres e-mail"
                autoComplete="email"
                key={form.key('email')}
                {...form.getInputProps('email')}
              />
              <PasswordInput
                label="Hasło"
                autoComplete="current-password"
                key={form.key('password')}
                {...form.getInputProps('password')}
              />
              <Button type="submit" loading={loginMutation.isPending}>
                Zaloguj się
              </Button>
            </Stack>
          </form>
        </Paper>
        <Text size="sm" ta="center">
          Nie masz konta?{' '}
          <Anchor component={Link} to="/register">
            Zarejestruj się
          </Anchor>
        </Text>
      </Stack>
    </Container>
  )
}

export default LoginPage