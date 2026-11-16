import { Alert, Anchor, Button, Container, Paper, PasswordInput, Stack, Text, TextInput, Title } from '@mantine/core'
import { useForm } from '@mantine/form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router'
import { register } from '../api/auth.js'
import { CURRENT_USER_KEY } from '../auth/useCurrentUser.js'

// Te same granice co w walidacji backendu (backend/src/auth/validation.js).
const PASSWORD_MIN_LENGTH = 12
const PASSWORD_MAX_LENGTH = 128

// Błędy 400 (z polami) i 409 (zajęty e-mail) pokazujemy przy polach, pozostałe w ramce nad formularzem.
function isFieldError(error) {
  return (error.status === 400 && error.fields !== null) || error.status === 409
}

function RegisterPage() {
  const queryClient = useQueryClient()

  // Walidacja po stronie przeglądarki tylko przyspiesza informację o błędzie. Decyduje backend.
  const form = useForm({
    mode: 'uncontrolled',
    initialValues: { email: '', password: '' },
    validate: {
      email: (value) => (/^\S+@\S+\.\S+$/.test(value.trim()) ? null : 'Podaj poprawny adres e-mail.'),
      password: (value) => {
        const length = Array.from(value).length
        return length >= PASSWORD_MIN_LENGTH && length <= PASSWORD_MAX_LENGTH
          ? null
          : `Hasło musi mieć od ${PASSWORD_MIN_LENGTH} do ${PASSWORD_MAX_LENGTH} znaków.`
      },
    },
  })

  const registerMutation = useMutation({
    mutationFn: ({ email, password }) => register(email, password),
    // Zapisanie użytkownika w pamięci wystarcza: RequireGuest zauważy zmianę i przekieruje dalej.
    onSuccess: (user) => queryClient.setQueryData(CURRENT_USER_KEY, user),
    onError: (error) => {
      if (error.status === 400 && error.fields) {
        form.setErrors(error.fields)
      } else if (error.status === 409) {
        form.setFieldError('email', error.message)
      }
    },
  })

  const error = registerMutation.error

  return (
    <Container size="xs" py="xl">
      <Stack gap="md">
        <Title order={2}>Rejestracja</Title>
        <Paper withBorder p="lg">
          <form onSubmit={form.onSubmit((values) => registerMutation.mutate(values))}>
            <Stack gap="md">
              {error && !isFieldError(error) && <Alert color="red">{error.message}</Alert>}
              <TextInput
                label="Adres e-mail"
                autoComplete="email"
                key={form.key('email')}
                {...form.getInputProps('email')}
              />
              <PasswordInput
                label="Hasło"
                description={`Minimum ${PASSWORD_MIN_LENGTH} znaków.`}
                autoComplete="new-password"
                key={form.key('password')}
                {...form.getInputProps('password')}
              />
              <Button type="submit" loading={registerMutation.isPending}>
                Załóż konto
              </Button>
            </Stack>
          </form>
        </Paper>
        <Text size="sm" ta="center">
          Masz już konto?{' '}
          <Anchor component={Link} to="/login">
            Zaloguj się
          </Anchor>
        </Text>
      </Stack>
    </Container>
  )
}

export default RegisterPage