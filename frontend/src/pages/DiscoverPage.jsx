import { Alert, Button, Container, SimpleGrid, Skeleton, Stack, Text, Title } from '@mantine/core'
import { Link } from 'react-router'
import DiscoverSection from '../discover/DiscoverSection.jsx'
import { useDiscover } from '../discover/useDiscover.js'

function DiscoverPage() {
  const { data, isPending, isError, error, refetch, isFetching } = useDiscover()

  let content
  if (isError) {
    content = (
      <Alert color="red" title="Nie udało się pobrać rekomendacji">
        <Stack gap="xs" align="flex-start">
          <Text size="sm">{error.message}</Text>
          <Button variant="default" size="xs" onClick={() => refetch()}>
            Spróbuj ponownie
          </Button>
        </Stack>
      </Alert>
    )
  } else if (isPending) {
    content = (
      <Stack gap="md">
        <Text c="dimmed">Przygotowujemy rekomendacje dla Ciebie…</Text>
        <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="md">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} height={200} radius="md" />
          ))}
        </SimpleGrid>
      </Stack>
    )
  } else if (data.sections.length === 0) {
    content = (
      <Stack gap="xs" align="flex-start">
        <Text fw={500}>
          {data.likedTotal === 0 ? 'Nie mamy jeszcze z czego przygotować rekomendacji' : 'Nie mamy teraz nowych propozycji'}
        </Text>
        <Text size="sm" c="dimmed">
          {data.likedTotal === 0
            ? 'Oznacz perfumy, które lubisz, a pojawią się tutaj propozycje podobnych zapachów.'
            : 'Dodaj więcej Lubianych perfum, a przygotujemy kolejne propozycje.'}
        </Text>
        <Button component={Link} to="/catalog" variant="light">
          Przejrzyj katalog
        </Button>
      </Stack>
    )
  } else {
    content = (
      <Stack gap="xl" style={{ opacity: isFetching ? 0.6 : 1 }}>
        {data.sections.map((section) => (
          <DiscoverSection key={`${section.scope}:${section.clusterId}`} section={section} />
        ))}
      </Stack>
    )
  }

  return (
    <Container size="md" py="xl">
      <Stack gap="md">
        <Title order={2}>Odkrywaj</Title>
        {content}
      </Stack>
    </Container>
  )
}

export default DiscoverPage