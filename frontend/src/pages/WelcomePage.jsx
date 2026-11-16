import { Button, Container, Stack, Text, Title, Group } from '@mantine/core'
import { Link } from 'react-router'

// Ekran powitalny dla gości. Tekst tymczasowy.
function WelcomePage() {
  return (
    <Container size="sm" py="xl">
      <Stack gap="md" align="flex-start">
        <Title order={1}>PerfumeCollection</Title>
        <Text c="dimmed">Twoja wirtualna kolekcja perfum i rekomendacje dopasowane do Twojego gustu.</Text>
        <Group>
          <Button component={Link} to="/login">
            Zaloguj się
          </Button>
          <Button component={Link} to="/register" variant="default">
            Załóż konto
          </Button>
        </Group>
      </Stack>
    </Container>
  )
}

export default WelcomePage