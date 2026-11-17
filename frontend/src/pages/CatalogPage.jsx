import { useEffect } from 'react'
import { Alert, Button, Center, Container, Loader, Pagination, Stack, Text, Title } from '@mantine/core'
import { useSearchParams } from 'react-router'
import PerfumeResultRow from '../catalog/PerfumeResultRow.jsx'
import { MAX_PAGE, PAGE_SIZE, usePerfumeSearch } from '../catalog/usePerfumeSearch.js'

// Numer strony z adresu. Wszystko, co nie jest poprawną liczbą od 1, daje stronę 1,
// a zbyt duży numer zostaje obcięty do MAX_PAGE (dalej poprawi go efekt poniżej).
function parsePage(text) {
  if (text === null || !/^[1-9]\d*$/.test(text)) {
    return 1
  }
  return Math.min(Number(text), MAX_PAGE)
}

// Kopia parametrów adresu z ustawionym numerem strony. Strona 1 to brak parametru (czysty adres),
// a pozostałe parametry (później filtry) zostają bez zmian.
function withPage(searchParams, page) {
  const next = new URLSearchParams(searchParams)
  if (page === 1) {
    next.delete('page')
  } else {
    next.set('page', String(page))
  }
  return next
}

function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = parsePage(searchParams.get('page'))
  const { data, isPending, isError, error, refetch, isPlaceholderData } = usePerfumeSearch({ page })

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0
  const isOutOfRange = data !== undefined && data.total > 0 && page > totalPages

  // Numer strony większy niż ostatnia strona zamieniamy na ostatnią (bez dopisywania wpisu do historii).
  useEffect(() => {
    if (isOutOfRange) {
      setSearchParams((previous) => withPage(previous, totalPages), { replace: true })
    }
  }, [isOutOfRange, totalPages, setSearchParams])

  function handlePageChange(newPage) {
    setSearchParams((previous) => withPage(previous, newPage))
    window.scrollTo({ top: 0 })
  }

  let content
  if (isError) {
    content = (
      <Alert color="red" title="Nie udało się pobrać perfum">
        <Stack gap="xs" align="flex-start">
          <Text size="sm">{error.message}</Text>
          <Button variant="default" size="xs" onClick={() => refetch()}>
            Spróbuj ponownie
          </Button>
        </Stack>
      </Alert>
    )
  } else if (isPending || isOutOfRange) {
    content = (
      <Center py="xl">
        <Loader />
      </Center>
    )
  } else if (data.total === 0) {
    content = <Text c="dimmed">Nie znaleziono perfum spełniających podane kryteria.</Text>
  } else {
    content = (
      <>
        <Text size="sm" c="dimmed">
          Wyniki: {data.total.toLocaleString('pl-PL')}
        </Text>
        {/* Podczas ładowania następnej strony stara lista jest przygaszona. */}
        <Stack gap="sm" style={{ opacity: isPlaceholderData ? 0.6 : 1 }}>
          {data.items.map((perfume) => (
            <PerfumeResultRow key={perfume.id} perfume={perfume} />
          ))}
        </Stack>
        <Pagination total={totalPages} value={page} onChange={handlePageChange} withEdges />
      </>
    )
  }

  return (
    <Container size="md" py="xl">
      <Stack gap="md">
        <Title order={2}>Katalog</Title>
        {content}
      </Stack>
    </Container>
  )
}

export default CatalogPage