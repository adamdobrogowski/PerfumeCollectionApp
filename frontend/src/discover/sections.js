export const SECTION_SCROLL_OFFSET = 76

export function getSectionAnchorId(section) {
  return `discover-${section.scope}-${section.clusterId}`
}

export function scrollToSection(anchorId) {
  document.getElementById(anchorId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}