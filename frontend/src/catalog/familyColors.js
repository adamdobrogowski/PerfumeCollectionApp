const FAMILY_COLORS = {
  101: { background: '#DDEBD3', ink: '#2F5A2A' }, // Aromatyczno-świeże
  102: { background: '#F1D9BE', ink: '#6B3A12' }, // Ciepłe orientalne
  103: { background: '#F8EBB8', ink: '#6B5410' }, // Białe kwiaty i cytrus
  104: { background: '#F8D3C4', ink: '#8A3320' }, // Owocowo-słodkie
  105: { background: '#F6D2DD', ink: '#8A2B4B' }, // Róża i świeże kwiaty
  106: { background: '#E6DCF0', ink: '#4E3A74' }, // Pudrowo-waniliowe
  107: { background: '#CFE8E6', ink: '#1F5A5A' }, // Zielono-wodne
}

const FALLBACK_COLORS = { background: '#E9ECEF', ink: '#343A40' }

export function getFamilyColors(familyId) {
  return Object.hasOwn(FAMILY_COLORS, familyId) ? FAMILY_COLORS[familyId] : FALLBACK_COLORS
}