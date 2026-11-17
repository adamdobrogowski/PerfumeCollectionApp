import { Container, Stack, Text, Title } from '@mantine/core'

function ComingSoonPage({ title }) {
  return (
    <Container size="sm" py="xl">
      <Stack gap="xs">
        <Title order={2}>{title}</Title>
        <Text c="dimmed">Ta sekcja jest w przygotowaniu.</Text>
      </Stack>
    </Container>
  )
}

export default ComingSoonPage