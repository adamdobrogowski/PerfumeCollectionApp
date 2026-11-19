import { useEffect, useState } from 'react'
import {
  Alert,
  Button,
  Center,
  CloseButton,
  Container,
  Group,
  Loader,
  Pagination,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { useDebouncedCallback } from '@mantine/hooks'
import { useSearchParams } from 'react-router'
import CatalogFilters from '../catalog/filters/CatalogFilters.jsx'
import CatalogListFilters from '../catalog/filters/CatalogListFilters.jsx'
import PerfumeResultRow from '../catalog/results/PerfumeResultRow.jsx'
import SortSelect from '../catalog/results/SortSelect.jsx'
import {
  MAX_PHRASE_LENGTH,
  PHRASE_HINTS,
  getPhraseProblem,
  getSearchPhrase,
  normalizePhrase,
} from '../catalog/results/phrase.js'
import { parseSort, withSort } from '../catalog/results/sorting.js'
import { useCatalogFilters } from '../catalog/filters/useCatalogFilters.js'
import { MAX_PAGE, PAGE_SIZE, usePerfumeSearch } from '../catalog/results/usePerfumeSearch.js'

function parsePage(text) {
  if (text === null || !/^[1-9]\d*$/.test(text)) {
    return 1
  }
  return Math.min(Number(text), MAX_PAGE)
}

function withPage(searchParams, page) {
  const next = new URLSearchParams(searchParams)
  if (page === 1) {
    next.delete('page')
  } else {
    next.set('page', String(page))
  }
  return next
}

function withPhrase(searchParams, phrase) {
  if (phrase === (searchParams.get('q') ?? '')) {
    return searchParams
  }
  const next = new URLSearchParams(searchParams)
  if (phrase === '') {
    next.delete('q')
  } else {
    next.set('q', phrase)
  }
  next.delete('page')
  return next
}

function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = parsePage(searchParams.get('page'))
  const urlPhrase = searchParams.get('q') ?? ''
  const searchPhrase = getSearchPhrase(urlPhrase)


  const [text, setText] = useState(urlPhrase)
  const [syncedUrlPhrase, setSyncedUrlPhrase] = useState(urlPhrase)
  if (urlPhrase !== syncedUrlPhrase) {
    setSyncedUrlPhrase(urlPhrase)
    if (urlPhrase !== normalizePhrase(text)) {
      setText(urlPhrase)
    }
  }

  const commitPhrase = useDebouncedCallback((value) => {
    const phrase = normalizePhrase(value)
    if (getPhraseProblem(phrase) === 'tooManyWords') {
      return
    }
    setSearchParams((previous) => withPhrase(previous, phrase), { replace: true })
  }, { delay: 400 })

   const {
    filters,
    brands,
    families,
    notes,
    accords,
    hasFilters,
    listFilterCount,
    listsOpen,
    setListsOpen,
    setFilter,
    setList,
    clearFilters,
  } = useCatalogFilters()
  const hasPhrase = searchPhrase !== undefined
  const sort = parseSort(searchParams.get('sort'), hasPhrase)

  const { data, isPending, isError, error, refetch, isPlaceholderData } = usePerfumeSearch({
    page,
    phrase: searchPhrase,
    filters,
    sort,
  })

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0
  const isOutOfRange = data !== undefined && data.total > 0 && page > totalPages

  // Numer strony większy niż ostatnia strona zamieniamy na ostatnią (bez dopisywania wpisu do historii).
  useEffect(() => {
    if (isOutOfRange) {
      setSearchParams((previous) => withPage(previous, totalPages), { replace: true })
    }
  }, [isOutOfRange, totalPages, setSearchParams])

  function handleTextChange(event) {
    const value = event.currentTarget.value
    setText(value)
    commitPhrase(value)
  }

  function handleClear() {
    commitPhrase.cancel()
    setText('')
    setSearchParams((previous) => withPhrase(previous, ''), { replace: true })
  }

  function handlePageChange(newPage) {
    setSearchParams((previous) => withPage(previous, newPage))
    window.scrollTo({ top: 0 })
  }

  // Zmiana sortowania dopisuje wpis do historii i wraca na stronę 1, tak jak zmiana filtra.
  function handleSortChange(newSort) {
    setSearchParams((previous) => withSort(previous, newSort, hasPhrase))
  }

  const phraseProblem = getPhraseProblem(normalizePhrase(text))

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
    const total = data.total.toLocaleString('pl-PL')
    content = (
      <>
        <Group justify="space-between" align="center">
          <Text size="sm" c="dimmed">
            {searchPhrase ? `Wyniki dla frazy „${searchPhrase}”: ${total}` : `Wyniki: ${total}`}
          </Text>
          <SortSelect value={sort} hasPhrase={hasPhrase} onChange={handleSortChange} />
        </Group>
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
        <Stack gap={4}>
          <TextInput
            placeholder="Szukaj perfum po nazwie lub marce"
            aria-label="Szukaj perfum"
            maxLength={MAX_PHRASE_LENGTH}
            value={text}
            onChange={handleTextChange}
            rightSection={
              text !== '' ? <CloseButton aria-label="Wyczyść wyszukiwanie" onClick={handleClear} /> : null
            }
            rightSectionPointerEvents="all"
          />
          {phraseProblem && (
            <Text size="xs" c="dimmed">
              {PHRASE_HINTS[phraseProblem]}
            </Text>
          )}
        </Stack>
        <CatalogFilters
          filters={filters}
          brands={brands}
          families={families}
          hasFilters={hasFilters}
          onChange={setFilter}
          onClear={clearFilters}
        />
        <CatalogListFilters
          filters={filters}
          notes={notes}
          accords={accords}
          count={listFilterCount}
          open={listsOpen}
          onOpenChange={setListsOpen}
          onChange={setList}
        />
        {content}
      </Stack>
    </Container>
  )
}

export default CatalogPage