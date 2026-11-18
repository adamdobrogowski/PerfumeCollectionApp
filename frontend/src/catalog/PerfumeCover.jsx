import { Box } from '@mantine/core'
import { getFamilyColors } from './familyColors.js'

// Okładka generowana we froncie (zbiór nie ma zdjęć flakonów): monogram marki na tle w kolorze rodziny zapachowej.
function PerfumeCover({ brandName, familyId, width = 64, height = 80 }) {
  const { background, ink } = getFamilyColors(familyId)
  const monogram = (Array.from(brandName.trim())[0] ?? '?').toUpperCase()

  return (
    <Box
      aria-hidden="true"
      style={{
        width,
        height,
        flexShrink: 0,
        borderRadius: 8,
        background,
        color: ink,
        border: '1px solid rgba(0, 0, 0, 0.12)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: width * 0.4,
        fontWeight: 500,
        lineHeight: 1,
      }}
    >
      {monogram}
    </Box>
  )
}

export default PerfumeCover