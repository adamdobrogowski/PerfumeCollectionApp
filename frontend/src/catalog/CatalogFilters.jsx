import { useMemo } from 'react'
import { Button, Input, SegmentedControl, Select, SimpleGrid, Stack } from '@mantine/core'
import { GENDER_LABELS } from './labels.js'

const GENDER_OPTIONS = [
  { value: 'all', label: 'Wszystkie' },
  ...Object.entries(GENDER_LABELS).map(([value, label]) => ({
    value,
    label: label[0].toUpperCase() + label.slice(1),
  })),
]

function toOptions(items) {
  return items ? items.map((item) => ({ value: String(item.id), label: item.name })) : []
}

function CatalogFilters({ filters, brands, families, hasFilters, onChange, onClear }) {
  const brandOptions = useMemo(() => toOptions(brands.data), [brands.data])
  const familyOptions = useMemo(() => toOptions(families.data), [families.data])

  return (
    <Stack gap="sm">
      <Input.Wrapper label="Płeć">
        <SegmentedControl
          data={GENDER_OPTIONS}
          value={filters.gender ?? 'all'}
          onChange={(value) => onChange('gender', value === 'all' ? null : value)}
        />
      </Input.Wrapper>
      <SimpleGrid cols={{ base: 1, sm: 2 }}>
        <Select
          label="Marka"
          placeholder={brands.isPending ? 'Ładowanie...' : 'Wszystkie marki'}
          data={brandOptions}
          value={filters.brand}
          onChange={(value) => onChange('brand', value)}
          searchable
          clearable
          limit={50}
          nothingFoundMessage="Nie znaleziono marki"
          disabled={brands.isPending || brands.isError}
          error={brands.isError ? 'Nie udało się wczytać listy marek' : undefined}
        />
        <Select
          label="Rodzina zapachowa"
          placeholder={families.isPending ? 'Ładowanie...' : 'Wszystkie rodziny'}
          data={familyOptions}
          value={filters.family}
          onChange={(value) => onChange('family', value)}
          clearable
          disabled={families.isPending || families.isError}
          error={families.isError ? 'Nie udało się wczytać listy rodzin' : undefined}
        />
      </SimpleGrid>
      {hasFilters && (
        <Button variant="subtle" size="xs" onClick={onClear} style={{ alignSelf: 'flex-start' }}>
          Wyczyść filtry
        </Button>
      )}
    </Stack>
  )
}

export default CatalogFilters