export function getDisplayName(item) {
  const polish = item.namePl?.trim()
  if (!polish || polish.toLowerCase() === item.name.toLowerCase()) {
    return { main: item.name, other: null }
  }
  return { main: polish, other: item.name }
}