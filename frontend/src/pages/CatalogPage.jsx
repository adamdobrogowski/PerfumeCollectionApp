import { Container, Stack, Text, Title } from '@mantine/core'
import { useAccords, useBrands, useFamilies, useNotes } from '../catalog/useDictionaries.js'

// TYMCZASOWE: sprawdza, że słowniki się pobierają. W kroku 2 zastąpi to prawdziwy widok katalogu.
function CountLine({ label, query }) {
  if (query.isPending) {
    return <Text>{label}: ładowanie...</Text>
  }
  if (query.isError) {
    return <Text c="red">{label}: {query.error.message}</Text>
  }
  return <Text>{label}: {query.data.length}</Text>
}

function CatalogPage() {
  const brands = useBrands()
  const accords = useAccords()
  const families = useFamilies()
  const notes = useNotes()

  return (
    <Container size="sm" py="xl">
      <Stack gap="xs">
        <Title order={2}>Katalog</Title>
        <CountLine label="Marki" query={brands} />
        <CountLine label="Akordy" query={accords} />
        <CountLine label="Rodziny" query={families} />
        <CountLine label="Nuty" query={notes} />
      </Stack>
    </Container>
  )
}

export default CatalogPage