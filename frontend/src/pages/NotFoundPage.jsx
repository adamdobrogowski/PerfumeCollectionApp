import { Button, Container, Stack, Title } from '@mantine/core'
import { Link } from 'react-router'

function NotFoundPage() {
  return (
    <Container size="sm" py="xl">
      <Stack gap="md" align="flex-start">
        <Title order={2}>Nie znaleziono strony</Title>
        <Button component={Link} to="/">
          Wróć na stronę główną
        </Button>
      </Stack>
    </Container>
  )
}

export default NotFoundPage