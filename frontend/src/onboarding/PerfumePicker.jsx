import { useState } from 'react'
import {
  Alert,
  Button,
  Center,
  Chip,
  CloseButton,
  Group,
  Input,
  Loader,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { serializeGenders } from '../catalog/filters/filters.js'
import { useFamilies } from '../catalog/filters/useDictionaries.js'
import {
  MAX_PHRASE_LENGTH,
  PHRASE_HINTS,
  getPhraseProblem,
  getSearchPhrase,
  normalizePhrase,
} from '../catalog/results/phrase.js'
import { GENDER_LABELS, capitalizeFirst } from '../shared/perfume/labels.js'
import PickerRow from './PickerRow.jsx'
import { EXTENDED_PAGE_SIZE, FIRST_PAGE_SIZE, useOnboardingSearch } from './useOnboardingSearch.js'

const GENDER_OPTIONS = Object.entries(GENDER_LABELS).map(([value, label]) => ({
  value,
  label: capitalizeFirst(label),
}))

const ALL_FAMILIES = 'all'

function PerfumePicker({ selectedIds, blockedIds = [], blockedLabel = null, onAdd, addDisabled = false }) {
  const [text, setText] = useState('')
  const [genders, setGenders] = useState([])
  const [familyKey, setFamilyKey] = useState(ALL_FAMILIES)
  const [showMore, setShowMore] = useState(false)
  const [debouncedText] = useDebouncedValue(text, 400)
  const families = useFamilies()

  const phrase = getSearchPhrase(debouncedText)
  const phraseProblem = getPhraseProblem(normalizePhrase(text))

  const { data, isPending, isError, error, refetch, isPlaceholderData } = useOnboardingSearch({
    phrase,
    gender: serializeGenders(genders),
    familyId: familyKey === ALL_FAMILIES ? undefined : familyKey,
    limit: showMore ? EXTENDED_PAGE_SIZE : FIRST_PAGE_SIZE,
  })

  const selectedFamily = families.data?.find((family) => String(family.id) === familyKey)

  function handleTextChange(event) {
    setText(event.currentTarget.value)
    setShowMore(false)
  }

  function handleClear() {
    setText('')
    setShowMore(false)
  }

  function handleGendersChange(values) {
    setGenders(values)
    setShowMore(false)
  }

  function handleFamilyChange(value) {
    setFamilyKey(value)
    setShowMore(false)
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
  } else if (isPending) {
    content = (
      <Center py="xl">
        <Loader />
      </Center>
    )
  } else if (data.items.length === 0) {
    content = (
      <Text c="dimmed">Nie znaleziono perfum. Spróbuj wpisać samą nazwę lub markę albo zmień filtry.</Text>
    )
  } else {
    content = (
      <>
        <Stack gap="sm" style={{ opacity: isPlaceholderData ? 0.6 : 1 }}>
          {data.items.map((perfume) => (
            <PickerRow
              key={perfume.id}
              perfume={perfume}
              isSelected={selectedIds.includes(perfume.id)}
              blockedLabel={blockedIds.includes(perfume.id) ? blockedLabel : null}
              disabled={addDisabled}
              onAdd={() => onAdd(perfume)}
            />
          ))}
        </Stack>
        {!showMore && data.total > FIRST_PAGE_SIZE && (
          <Button variant="default" onClick={() => setShowMore(true)}>
            Pokaż więcej
          </Button>
        )}
        <Text size="sm" c="dimmed">
          Nie widzisz swoich perfum? Wpisz nazwę lub markę w polu wyszukiwania.
        </Text>
      </>
    )
  }

  return (
    <Stack gap="md">
      <Stack gap={4}>
        <TextInput
          placeholder="Szukaj po nazwie lub marce"
          aria-label="Szukaj perfum"
          maxLength={MAX_PHRASE_LENGTH}
          value={text}
          onChange={handleTextChange}
          rightSection={text !== '' ? <CloseButton aria-label="Wyczyść wyszukiwanie" onClick={handleClear} /> : null}
          rightSectionPointerEvents="all"
        />
        {phraseProblem && (
          <Text size="xs" c="dimmed">
            {PHRASE_HINTS[phraseProblem]}
          </Text>
        )}
      </Stack>

      <Input.Wrapper label="Płeć" description="Brak zaznaczenia oznacza wszystkie">
        <Chip.Group multiple value={genders} onChange={handleGendersChange}>
          <Group gap="xs" mt={4}>
            {GENDER_OPTIONS.map((option) => (
              <Chip key={option.value} value={option.value}>
                {option.label}
              </Chip>
            ))}
          </Group>
        </Chip.Group>
      </Input.Wrapper>

      <Input.Wrapper label="Rodzaj zapachu" description="Nie znasz nazw perfum? Wybierz zapachy, które lubisz.">
        <Chip.Group value={familyKey} onChange={handleFamilyChange}>
          <Group gap="xs" mt={4}>
            <Chip value={ALL_FAMILIES}>Wszystkie</Chip>
            {families.data?.map((family) => (
              <Chip key={family.id} value={String(family.id)}>
                {family.name}
              </Chip>
            ))}
          </Group>
        </Chip.Group>
      </Input.Wrapper>
      {selectedFamily?.description && (
        <Text size="sm" c="dimmed">
          {selectedFamily.description}
        </Text>
      )}

      <Title order={4}>{phrase ? `Wyniki dla „${phrase}”` : 'Najpopularniejsze perfumy'}</Title>
      {content}
    </Stack>
  )
}

export default PerfumePicker