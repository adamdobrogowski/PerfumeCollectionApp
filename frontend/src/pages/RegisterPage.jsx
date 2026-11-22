import { Alert, Anchor, Button, Container, Paper, PasswordInput, Stack, Text, TextInput, Title } from '@mantine/core'
import { useForm } from '@mantine/form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router'
import { register } from '../api/auth.js'
import { CURRENT_USER_KEY } from '../auth/useCurrentUser.js'

// Te same granice co w walidacji backendu (backend/src/auth/validation.js).
const PASSWORD_MIN_LENGTH = 12
const PASSWORD_MAX_LENGTH = 128
const DISPLAY_NAME_MIN_LENGTH = 3
const DISPLAY_NAME_MAX_LENGTH = 30
const DISPLAY_NAME_PATTERN = /^[A-Za-z0-9_.-]+$/

// Błędy 400 i 409 z obiektem fields pokazujemy przy polach, pozostałe w ramce nad formularzem.
function isFieldError(error) {
  return (error.status === 400 || error.status === 409) && error.fields !== null
}

function RegisterPage() {
  const queryClient = useQueryClient()

  // Walidacja po stronie przeglądarki tylko przyspiesza informację o błędzie. Decyduje backend.
  const form = useForm({
    mode: 'uncontrolled',
    initialValues: { displayName: '', email: '', password: '' },
    validate: {
      displayName: (value) => {
        const length = Array.from(value).length
        if (length < DISPLAY_NAME_MIN_LENGTH || length > DISPLAY_NAME_MAX_LENGTH) {
          return `Nick musi mieć od ${DISPLAY_NAME_MIN_LENGTH} do ${DISPLAY_NAME_MAX_LENGTH} znaków.`
        }
        if (!DISPLAY_NAME_PATTERN.test(value)) {
          return 'Nick może zawierać tylko litery bez polskich znaków, cyfry oraz znaki _ . - (bez spacji).'
        }
        return null
      },
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
    mutationFn: ({ email, password, displayName }) => register(email, password, displayName),
    // Zapisanie użytkownika w pamięci wystarcza: RequireGuest zauważy zmianę i przekieruje dalej.
    onSuccess: (user) => queryClient.setQueryData(CURRENT_USER_KEY, user),
    onError: (error) => {
      if ((error.status === 400 || error.status === 409) && error.fields) {
        form.setErrors(error.fields)
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
                label="Nick"
                description={`${DISPLAY_NAME_MIN_LENGTH}–${DISPLAY_NAME_MAX_LENGTH} znaków: litery bez polskich znaków, cyfry oraz _ . -`}
                autoComplete="username"
                key={form.key('displayName')}
                {...form.getInputProps('displayName')}
              />
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