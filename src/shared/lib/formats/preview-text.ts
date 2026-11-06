// One line of a message for a card: whitespace folded, cut after `max` characters.
export const previewText = (text: string | null | undefined, max = 120): string => {
  const trimmed = (text || '').replace(/\s+/g, ' ').trim()
  return trimmed.length > max ? `${trimmed.substring(0, max)}...` : trimmed
}
